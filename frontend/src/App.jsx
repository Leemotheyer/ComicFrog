import { useEffect, useMemo, useState } from 'react';
import { createComic, deleteComic, fetchComics, purchaseComic } from './api';
import ComicForm from './components/ComicForm';
import ComicCard from './components/ComicCard';

const emptyForm = {
  title: '',
  publisher: '',
  series: '',
  issueNumber: '',
  releaseDate: '',
  coverImage: '',
  variantCoverImage: '',
  variantCover: '',
  notes: '',
};

export default function App() {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadComics() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchComics();
      setComics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComics();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return comics;
    return comics.filter((comic) => comic.status === filter);
  }, [comics, filter]);

  const stats = useMemo(() => ({
    active: comics.filter((c) => c.status === 'active').length,
    complete: comics.filter((c) => c.status === 'complete').length,
    spent: comics
      .filter((c) => c.status === 'complete' && c.purchasePrice != null)
      .reduce((sum, c) => sum + Number(c.purchasePrice), 0),
  }), [comics]);

  async function handleSubmit(form) {
    setSubmitting(true);
    setError('');
    try {
      await createComic(form);
      setShowForm(false);
      await loadComics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePurchase(id, price, date) {
    setError('');
    try {
      await purchaseComic(id, price, date);
      await loadComics();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id, source) {
    if (!window.confirm('Remove this comic from your list?')) return;
    setError('');
    try {
      await deleteComic(id, source);
      await loadComics();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Powered by Froglog</p>
          <h1>ComicFrog</h1>
          <p className="subtitle">
            Your comic pull list, stored unconventionally as Froglog games.
            Active pulls live in live service; purchased issues become completed games
            with price stored as hours played.
          </p>
        </div>
        <div className="hero__stats">
          <div className="stat">
            <span className="stat__value">{stats.active}</span>
            <span className="stat__label">On Pull List</span>
          </div>
          <div className="stat">
            <span className="stat__value">{stats.complete}</span>
            <span className="stat__label">Purchased</span>
          </div>
          <div className="stat">
            <span className="stat__value">${stats.spent.toFixed(2)}</span>
            <span className="stat__label">Total Spent</span>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="toolbar">
          <div className="filters">
            {[
              ['all', 'All'],
              ['active', 'Pull List'],
              ['complete', 'Purchased'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`filter-btn ${filter === value ? 'active' : ''}`}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="primary-btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close Form' : '+ Add Comic'}
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}

        {showForm && (
          <ComicForm
            initialValues={emptyForm}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <div className="empty-state">Loading your pull list...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h2>No comics yet</h2>
            <p>Add your first issue to the pull list and it will appear here as an active Froglog live service game.</p>
          </div>
        ) : (
          <section className="grid">
            {filtered.map((comic) => (
              <ComicCard
                key={`${comic.source}-${comic.id}`}
                comic={comic}
                onPurchase={handlePurchase}
                onDelete={handleDelete}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
