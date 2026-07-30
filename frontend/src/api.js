const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error || `Request failed (${response.status})`,
      data.code,
      response.status,
    );
  }
  return data;
}

export function fetchAuthStatus() {
  return request('/auth/status');
}

export function loginFroglog(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function testFroglogConnection(credentials) {
  return request('/auth/test', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function logoutFroglog() {
  return request('/auth/logout', { method: 'POST' });
}

export function fetchComics() {
  return request('/comics');
}

export function createComic(comic) {
  return request('/comics', {
    method: 'POST',
    body: JSON.stringify(comic),
  });
}

export function updateComic(id, source, updates) {
  return request(`/comics/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ source, ...updates }),
  });
}

export function purchaseComic(id, purchasePrice, purchaseDate) {
  return request(`/comics/${id}/purchase`, {
    method: 'POST',
    body: JSON.stringify({ purchasePrice, purchaseDate }),
  });
}

export function deleteComic(id, source) {
  return request(`/comics/${id}?source=${source}`, { method: 'DELETE' });
}

export function syncFroglogLabels() {
  return request('/comics/sync-froglog-labels', { method: 'POST' });
}

export function importLocgComic(url) {
  return request('/locg/import', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}
