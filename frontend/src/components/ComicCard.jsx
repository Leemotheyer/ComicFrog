import { useState } from 'react';

export default function ComicCard({ comic, onPurchase, onDelete }) {
  const [showPurchase, setShowPurchase] = useState(false);
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const cover = comic.coverImage || comic.variantCoverImage;

  async function handlePurchase(event) {
    event.preventDefault();
    await onPurchase(comic.id, Number(price), purchaseDate);
    setShowPurchase(false);
    setPrice('');
  }

  return (
    <article className={`comic-card panel status-${comic.status}`}>
      <div className="comic-card__cover">
        {cover ? (
          <img src={cover} alt={`${comic.title} cover`} loading="lazy" />
        ) : (
          <div className="cover-placeholder">No Cover</div>
        )}
        <span className={`badge ${comic.status}`}>
          {comic.status === 'active' ? 'Pull List' : 'Purchased'}
        </span>
      </div>

      <div className="comic-card__body">
        <h3>{comic.title}</h3>
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
          {comic.variantCover && (
            <>
              <dt>Variant</dt>
              <dd>{comic.variantCover}</dd>
            </>
          )}
          {comic.status === 'complete' && comic.purchasePrice != null && (
            <>
              <dt>Price</dt>
              <dd>${Number(comic.purchasePrice).toFixed(2)}</dd>
            </>
          )}
        </dl>

        {comic.variantCoverImage && comic.coverImage && (
          <div className="variant-preview">
            <img src={comic.variantCoverImage} alt="Variant cover" loading="lazy" />
            <span>Variant cover</span>
          </div>
        )}

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
            <p className="form-help">
              Stored in Froglog as a completed game. Price is saved in <code>hours_played</code>.
            </p>
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
