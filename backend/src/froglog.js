const COMIC_MARKER = '[comicfrog]';
const MAIN_COVER_LABEL = 'Main Cover';

function formatFroglogDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return '';
  return `$${Number(value).toFixed(2)}`;
}

export function baseTitle(title) {
  const trimmed = title?.trim() || '';
  const separator = ' · ';
  const index = trimmed.indexOf(separator);
  return index > -1 ? trimmed.slice(0, index) : trimmed;
}

export function buildFroglogTitle(comic) {
  const title = baseTitle(comic.title);
  const cover = comic.variantCover?.trim();
  if (!cover || cover === MAIN_COVER_LABEL) return title;
  return `${title} · ${cover}`;
}

export function buildFroglogDescription(comic, source) {
  const lines = [COMIC_MARKER];

  if (source === 'pull-list') {
    lines.push('Status: On pull list — purchase this issue');
  } else {
    const price = formatMoney(comic.purchasePrice);
    const purchasedOn = formatFroglogDate(comic.purchaseDate);
    const paid = [price, purchasedOn && `on ${purchasedOn}`].filter(Boolean).join(' ');
    lines.push(`Status: Purchased${paid ? ` — ${paid}` : ''}`);
  }

  if (comic.variantCover) lines.push(`Cover: ${comic.variantCover}`);
  if (comic.publisher) lines.push(`Publisher: ${comic.publisher}`);
  if (comic.series) lines.push(`Series: ${comic.series}`);
  if (comic.issueNumber) lines.push(`Issue: #${comic.issueNumber}`);
  if (comic.releaseDate) lines.push(`Release: ${formatFroglogDate(comic.releaseDate)}`);

  if (comic.notes?.trim()) {
    lines.push('');
    lines.push(comic.notes.trim());
  }

  return lines.join('\n');
}

const META_PREFIXES = ['Status:', 'Cover:', 'Variant:', 'Publisher:', 'Series:', 'Issue:', 'Release:'];

export function parseDescription(description) {
  const body = description?.startsWith(COMIC_MARKER)
    ? description.slice(COMIC_MARKER.length).replace(/^\n/, '')
    : (description || '');

  const lines = body.split('\n');
  let variantCover = '';
  const noteLines = [];
  let inNotes = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (variantCover || noteLines.length) inNotes = true;
      continue;
    }

    if (trimmed.startsWith('Cover: ')) {
      variantCover = trimmed.slice('Cover: '.length);
      continue;
    }
    if (trimmed.startsWith('Variant: ')) {
      variantCover = trimmed.slice('Variant: '.length);
      continue;
    }
    if (!inNotes && META_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
      continue;
    }

    noteLines.push(line);
  }

  return {
    variantCover,
    notes: noteLines.join('\n').trim(),
  };
}

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

  toComic(record, source) {
    const { variantCover, notes } = parseDescription(record.description);

    return {
      id: record.id,
      source,
      title: record.title,
      publisher: record.dev || '',
      series: record.genre || '',
      issueNumber: record.platform || '',
      releaseDate: record.rel_date || record.start_date || null,
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
      title: buildFroglogTitle(comic),
      description: buildFroglogDescription(comic, 'pull-list'),
      dev: comic.publisher || undefined,
      genre: comic.series || undefined,
      platform: comic.issueNumber || undefined,
      rel_date: comic.releaseDate || undefined,
      start_date: comic.releaseDate || undefined,
      cover_image: comic.coverImage || undefined,
      img: comic.variantCoverImage || comic.coverImage || undefined,
      title_img: comic.variantCoverImage || undefined,
      live_service_status: 'active',
      is_public: true,
    };
  }

  toPurchasedPayload(comic) {
    return {
      title: buildFroglogTitle(comic),
      description: buildFroglogDescription(comic, 'purchased'),
      dev: comic.publisher || undefined,
      genre: comic.series || undefined,
      platform: comic.issueNumber || undefined,
      rel_date: comic.releaseDate || undefined,
      start_date: comic.releaseDate || undefined,
      cover_image: comic.coverImage || undefined,
      img: comic.variantCoverImage || comic.coverImage || undefined,
      title_img: comic.variantCoverImage || undefined,
      hours_played: comic.purchasePrice ?? undefined,
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

  async syncFroglogLabels() {
    const comics = await this.listComics();
    let updated = 0;

    for (const comic of comics) {
      await this.updateComic(comic.id, comic.source, {
        title: baseTitle(comic.title),
      });
      updated += 1;
    }

    return { updated, total: comics.length };
  }

  async deleteComic(id, source) {
    const path = source === 'pull-list' ? `/live-service/${id}` : `/games/${id}`;
    await this.request(path, { method: 'DELETE' });
  }
}
