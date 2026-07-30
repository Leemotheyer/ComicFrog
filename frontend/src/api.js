const API_BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
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

export function purchaseComic(id, purchasePrice, purchaseDate) {
  return request(`/comics/${id}/purchase`, {
    method: 'POST',
    body: JSON.stringify({ purchasePrice, purchaseDate }),
  });
}

export function deleteComic(id, source) {
  return request(`/comics/${id}?source=${source}`, { method: 'DELETE' });
}
