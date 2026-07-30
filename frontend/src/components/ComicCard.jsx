import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/format';

export default function ComicCard({ comic, viewMode, onPurchase, onDelete }) {
  const [showPurchase, setShowPurchase] = useState(false);
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));

  async function handlePurchase(event) {
    event.preventDefault();
    await onPurchase(comic.id, Number(price), purchaseDate);
    setShowPurchase(false);
    setPrice('');
  }

  return (
    <article className={`comic-card panel status-${comic.status} ${viewMode}`}>
      <div className="comic-card__cover">
        {comic.coverImage ? (
          <img src={comic.coverImage} alt={`${comic.title} cover`} loading="lazy" />
        ) : (
          <div className="cover-placeholder">No Cover</div>
        )}
        <span className={`badge ${comic.status}`}>
          {comic.status === 'active' ? 'Active' : 'Purchased'}
        </span>
      </div>

      <div className="comic-card__body">
        <div className="comic-card__header">
          <h3>{comic.title}</h3>
          <Link to={`/edit/${comic.source}/${comic.id}`} className="text-btn">Edit</Link>
        </div>

        <dl className="meta">
          {comic.publisher && (
            <>
              <dt>Publisher</dt>
              <dd>{comic.publisher}</dd>
            </>
          )}
          {comic.series && (
            <>
              <dt>Series</dt>
              <dd>{comic.series}</dd>
            </>
          )}
          {comic.issueNumber && (
            <>
              <dt>Issue</dt>
              <dd>#{comic.issueNumber}</dd>
            </>
          )}
          {comic.releaseDate && (
            <>
              <dt>Release</dt>
              <dd>{formatDate(comic.releaseDate)}</dd>
            </>
          )}
          {comic.variantCover && (
            <>
              <dt>Cover</dt>
              <dd>{comic.variantCover}</dd>
            </>
          )}
          {comic.status === 'complete' && comic.purchasePrice != null && (
            <>
              <dt>Price</dt>
              <dd>${Number(comic.purchasePrice).toFixed(2)}</dd>
            </>
          )}
          {comic.status === 'complete' && comic.purchaseDate && (
            <>
              <dt>Purchased</dt>
              <dd>{formatDate(comic.purchaseDate)}</dd>
            </>
          )}
        </dl>

        {comic.notes && <p className="notes">{comic.notes}</p>}

        <div className="card-actions">
          {comic.status === 'active' && !showPurchase && (
            <button type="button" className="primary-btn" onClick={() => setShowPurchase(true)}>
              Mark Purchased
            </button>
          )}
          <button
            type="button"
            className="ghost-btn danger"
            onClick={() => onDelete(comic.id, comic.source)}
          >
            Remove
          </button>
        </div>

        {showPurchase && (
          <form className="purchase-form" onSubmit={handlePurchase}>
            <label>
              Purchase Price ($)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="4.99"
              />
            </label>
            <label>
              Purchase Date
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </label>
            <div className="form-actions">
              <button type="button" className="ghost-btn" onClick={() => setShowPurchase(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">Confirm Purchase</button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}
