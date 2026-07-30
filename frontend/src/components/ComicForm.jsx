import { useState } from 'react';

export default function ComicForm({
  initialValues,
  submitting,
  submitLabel = 'Save',
  showPurchaseFields = false,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(initialValues);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="comic-form panel" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="full-width">
          Title *
          <input
            required
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Amazing Spider-Man #42"
          />
        </label>

        <label>
          Publisher
          <input
            value={form.publisher}
            onChange={(e) => updateField('publisher', e.target.value)}
            placeholder="Marvel"
          />
        </label>

        <label>
          Series
          <input
            value={form.series}
            onChange={(e) => updateField('series', e.target.value)}
            placeholder="Amazing Spider-Man"
          />
        </label>

        <label>
          Issue #
          <input
            value={form.issueNumber}
            onChange={(e) => updateField('issueNumber', e.target.value)}
            placeholder="42"
            inputMode="numeric"
          />
        </label>

        <label>
          Release Date
          <input
            type="date"
            value={form.releaseDate}
            onChange={(e) => updateField('releaseDate', e.target.value)}
          />
        </label>

        <label>
          Variant Name
          <input
            value={form.variantCover}
            onChange={(e) => updateField('variantCover', e.target.value)}
            placeholder="Cover B - Peach Momoko"
          />
        </label>

        <label className="full-width">
          Cover Image URL
          <input
            type="url"
            value={form.coverImage}
            onChange={(e) => updateField('coverImage', e.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="full-width">
          Variant Cover Image URL
          <input
            type="url"
            value={form.variantCoverImage}
            onChange={(e) => updateField('variantCoverImage', e.target.value)}
            placeholder="https://..."
          />
        </label>

        {showPurchaseFields && (
          <>
            <label>
              Purchase Price ($)
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.purchasePrice}
                onChange={(e) => updateField('purchasePrice', e.target.value)}
              />
            </label>
            <label>
              Purchase Date
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => updateField('purchaseDate', e.target.value)}
              />
            </label>
          </>
        )}

        <label className="full-width">
          Notes
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Pull for Wednesday, store pick-up..."
          />
        </label>
      </div>

      {form.coverImage && (
        <div className="cover-preview">
          <img src={form.coverImage} alt="Cover preview" />
        </div>
      )}

      <div className="form-actions sticky-actions">
        {onCancel && (
          <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
