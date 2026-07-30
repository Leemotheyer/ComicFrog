import { useState } from 'react';

export default function ComicForm({ initialValues, submitting, onSubmit, onCancel }) {
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
      <h2>Add to Pull List</h2>
      <p className="form-help">
        Comics are stored as Froglog live service games with status <strong>active</strong>.
        Cover images map to <code>cover_image</code> and variant art to <code>title_img</code>.
      </p>

      <div className="form-grid">
        <label>
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
            value={form.coverImage}
            onChange={(e) => updateField('coverImage', e.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="full-width">
          Variant Cover Image URL
          <input
            value={form.variantCoverImage}
            onChange={(e) => updateField('variantCoverImage', e.target.value)}
            placeholder="https://..."
          />
        </label>

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

      <div className="form-actions">
        <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? 'Saving...' : 'Add to Pull List'}
        </button>
      </div>
    </form>
  );
}
