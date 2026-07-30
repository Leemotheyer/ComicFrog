import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteComic,
  fetchComics,
  purchaseComic,
} from '../api';
import ComicCard from '../components/ComicCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const SORT_OPTIONS = [
  ['newest', 'Newest'],
  ['oldest', 'Oldest'],
  ['title', 'Title A–Z'],
  ['release', 'Release Date'],
  ['price', 'Price'],
];

function sortComics(comics, sortBy) {
  const sorted = [...comics];
  switch (sortBy) {
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'release':
      return sorted.sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return new Date(b.releaseDate) - new Date(a.releaseDate);
      });
    case 'price':
      return sorted.sort((a, b) => Number(b.purchasePrice || 0) - Number(a.purchasePrice || 0));
    default:
      return sorted.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }
}

export default function HomePage({ onStatsChange }) {
  const { push } = useToast();
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  async function loadComics({ silent = false } = {}) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const data = await fetchComics();
      setComics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadComics();
  }, []);

  const stats = useMemo(() => ({
    active: comics.filter((c) => c.status === 'active').length,
    complete: comics.filter((c) => c.status === 'complete').length,
    spent: comics
      .filter((c) => c.status === 'complete' && c.purchasePrice != null)
      .reduce((sum, c) => sum + Number(c.purchasePrice), 0),
  }), [comics]);

  useEffect(() => {
    onStatsChange?.(stats);
  }, [stats, onStatsChange]);

  const filtered = useMemo(() => {
    let result = comics;
    if (filter !== 'all') {
      result = result.filter((comic) => comic.status === filter);
    }
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter((comic) => (
        comic.title.toLowerCase().includes(query)
        || comic.series?.toLowerCase().includes(query)
        || comic.publisher?.toLowerCase().includes(query)
        || comic.issueNumber?.toLowerCase().includes(query)
        || comic.variantCover?.toLowerCase().includes(query)
      ));
    }
    return sortComics(result, sortBy);
  }, [comics, filter, search, sortBy]);

  async function handlePurchase(id, price, date) {
    try {
      await purchaseComic(id, price, date);
      push('Marked as purchased', 'success');
      await loadComics({ silent: true });
    } catch (err) {
      push(err.message, 'error');
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteComic(pendingDelete.id, pendingDelete.source);
      push('Comic removed', 'success');
      setPendingDelete(null);
      await loadComics({ silent: true });
    } catch (err) {
      push(err.message, 'error');
    }
  }

  function handleTouchStart(event) {
    if (window.scrollY === 0) {
      setTouchStartY(event.touches[0].clientY);
    }
  }

  function handleTouchEnd(event) {
    if (touchStartY == null) return;
    const delta = event.changedTouches[0].clientY - touchStartY;
    if (delta > 90) {
      loadComics({ silent: true });
      push('Refreshed', 'info');
    }
    setTouchStartY(null);
  }

  return (
    <div
      className="home-page"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-card__value">{stats.active}</span>
          <span className="stat-card__label">Pull List</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{stats.complete}</span>
          <span className="stat-card__label">Purchased</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">${stats.spent.toFixed(2)}</span>
          <span className="stat-card__label">Spent</span>
        </div>
      </section>

      <div className="toolbar panel">
        <label className="search-field">
          <span className="sr-only">Search comics</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, series, publisher..."
          />
        </label>

        <div className="toolbar-row">
          <div className="filters scroll-x">
            {[
              ['active', 'Pull List'],
              ['all', 'All'],
              ['complete', 'Purchased'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`chip ${filter === value ? 'active' : ''}`}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="toolbar-actions">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort comics">
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setViewMode((mode) => (mode === 'grid' ? 'list' : 'grid'))}
              aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            >
              {viewMode === 'grid' ? '☰' : '▦'}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => loadComics({ silent: true })}
              aria-label="Refresh"
              disabled={refreshing}
            >
              {refreshing ? '…' : '↻'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading your pull list...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state panel">
          <h2>{search ? 'No matches' : 'Nothing here yet'}</h2>
          <p>
            {search
              ? 'Try a different search term or clear the filter.'
              : 'Add comics you want to pick up this week. They show up as active Froglog live service games.'}
          </p>
          {!search && (
            <Link to="/add" className="primary-btn inline-btn">Add Comic</Link>
          )}
        </div>
      ) : (
        <section className={`comic-collection ${viewMode}`}>
          {filtered.map((comic) => (
            <ComicCard
              key={`${comic.source}-${comic.id}`}
              comic={comic}
              viewMode={viewMode}
              onPurchase={handlePurchase}
              onDelete={(id, source) => setPendingDelete({ id, source })}
            />
          ))}
        </section>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove comic?"
        message="This will delete the entry from Froglog."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
