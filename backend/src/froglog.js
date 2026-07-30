const COMIC_MARKER = '[comicfrog]';

export class FroglogClient {
  constructor(baseUrl, username, password) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.username = username;
    this.password = password;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  async ensureAuth() {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Froglog login failed (${response.status})`);
    }

    const data = await response.json();
    this.token = data.token;
    // JWT is valid for 30 days; refresh daily to stay safe.
    this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    return this.token;
  }

  async request(path, options = {}) {
    const token = await this.ensureAuth();
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(data?.error || `Froglog request failed (${response.status})`);
    }

    return data;
  }

  isComicRecord(record) {
    return Boolean(record?.description?.startsWith(COMIC_MARKER));
  }

  stripMarker(description) {
    if (!description?.startsWith(COMIC_MARKER)) {
      return description || '';
    }
    return description.slice(COMIC_MARKER.length).replace(/^\n/, '');
  }

  buildDescription(notes, variantCover) {
    const lines = [COMIC_MARKER];
    if (variantCover) {
      lines.push(`Variant: ${variantCover}`);
    }
    if (notes) {
      lines.push(notes);
    }
    return lines.join('\n');
  }

  parseDescription(description) {
    const body = this.stripMarker(description);
    const lines = body.split('\n').filter(Boolean);
    let variantCover = '';
    let notes = body;

    if (lines[0]?.startsWith('Variant: ')) {
      variantCover = lines[0].slice('Variant: '.length);
      notes = lines.slice(1).join('\n');
    }

    return { variantCover, notes };
  }

  toComic(record, source) {
    const { variantCover, notes } = this.parseDescription(record.description);

    return {
      id: record.id,
      source,
      title: record.title,
      publisher: record.dev || '',
      series: record.genre || '',
      issueNumber: record.platform || '',
      releaseDate: record.rel_date || null,
      coverImage: record.cover_image || record.img || null,
      variantCoverImage: record.title_img || (record.img && record.cover_image ? record.img : null),
      variantCover,
      notes,
      status: source === 'pull-list' ? 'active' : 'complete',
      purchasePrice: source === 'purchased' ? record.hours_played ?? null : null,
      purchaseDate: source === 'purchased' ? record.end_date ?? null : null,
      addedAt: record.created_at,
      froglogStatus: record.status || record.live_service_status || null,
    };
  }

  toPullListPayload(comic) {
    return {
      title: comic.title,
      description: this.buildDescription(comic.notes, comic.variantCover),
      dev: comic.publisher || undefined,
      genre: comic.series || undefined,
      platform: comic.issueNumber || undefined,
      rel_date: comic.releaseDate || undefined,
      cover_image: comic.coverImage || undefined,
      img: comic.variantCoverImage || comic.coverImage || undefined,
      title_img: comic.variantCoverImage || undefined,
      live_service_status: 'active',
      is_public: true,
    };
  }

  toPurchasedPayload(comic) {
    return {
      title: comic.title,
      description: this.buildDescription(comic.notes, comic.variantCover),
      dev: comic.publisher || undefined,
      genre: comic.series || undefined,
      platform: comic.issueNumber || undefined,
      rel_date: comic.releaseDate || undefined,
      cover_image: comic.coverImage || undefined,
      img: comic.variantCoverImage || comic.coverImage || undefined,
      title_img: comic.variantCoverImage || undefined,
      hours_played: comic.purchasePrice ?? undefined,
      start_date: comic.purchaseDate || undefined,
      end_date: comic.purchaseDate || undefined,
      is_public: true,
    };
  }

  async listComics() {
    const [pullList, purchased] = await Promise.all([
      this.request('/live-service'),
      this.request('/games'),
    ]);

    const comics = [
      ...pullList.filter((item) => this.isComicRecord(item)).map((item) => this.toComic(item, 'pull-list')),
      ...purchased.filter((item) => this.isComicRecord(item)).map((item) => this.toComic(item, 'purchased')),
    ];

    comics.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    return comics;
  }

  async addToPullList(comic) {
    const payload = this.toPullListPayload(comic);
    const created = await this.request('/live-service', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.toComic(created, 'pull-list');
  }

  async markPurchased(id, purchasePrice, purchaseDate) {
    const pullList = await this.request('/live-service');
    const comicRecord = pullList.find((item) => item.id === Number(id));

    if (!comicRecord || !this.isComicRecord(comicRecord)) {
      throw new Error('Comic not found on pull list');
    }

    const comic = this.toComic(comicRecord, 'pull-list');
    comic.purchasePrice = purchasePrice;
    comic.purchaseDate = purchaseDate || new Date().toISOString().slice(0, 10);

    const created = await this.request('/games', {
      method: 'POST',
      body: JSON.stringify(this.toPurchasedPayload(comic)),
    });

    await this.request(`/live-service/${id}`, { method: 'DELETE' });
    return this.toComic(created, 'purchased');
  }

  async updateComic(id, source, updates) {
    const path = source === 'pull-list' ? `/live-service/${id}` : `/games/${id}`;
    const existingList = source === 'pull-list'
      ? await this.request('/live-service')
      : await this.request('/games');
    const existing = existingList.find((item) => item.id === Number(id));

    if (!existing || !this.isComicRecord(existing)) {
      throw new Error('Comic not found');
    }

    const comic = {
      ...this.toComic(existing, source),
      ...updates,
    };

    const payload = source === 'pull-list'
      ? this.toPullListPayload(comic)
      : this.toPurchasedPayload(comic);

    const updated = await this.request(path, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return this.toComic(updated, source);
  }

  async deleteComic(id, source) {
    const path = source === 'pull-list' ? `/live-service/${id}` : `/games/${id}`;
    await this.request(path, { method: 'DELETE' });
  }
}
