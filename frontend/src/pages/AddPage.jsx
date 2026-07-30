import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createComic, importLocgComic } from '../api';
import ComicForm from '../components/ComicForm';
import { useToast } from '../context/ToastContext';
import { getLastAddDefaults, saveLastAddDefaults } from '../utils/storage';

function suggestIssueNumber(issueNumber) {
  if (!issueNumber) return '';
  const match = issueNumber.match(/^(\D*)(\d+)(\D*)$/);
  if (!match) return issueNumber;
  const next = String(Number(match[2]) + 1).padStart(match[2].length, '0');
  return `${match[1]}${next}${match[3]}`;
}

const EMPTY_FORM = {
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

export default function AddPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [locgUrl, setLocgUrl] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [formDefaults, setFormDefaults] = useState(() => {
    const last = getLastAddDefaults();
    return {
      ...EMPTY_FORM,
      publisher: last.publisher || '',
      series: last.series || '',
      issueNumber: suggestIssueNumber(last.issueNumber || ''),
    };
  });

  const pageLead = useMemo(
    () => 'Paste a League of Comic Geeks link to pre-fill details, or enter them manually.',
    [],
  );

  async function handleImport() {
    if (!locgUrl.trim()) {
      push('Paste a League of Comic Geeks comic URL first', 'error');
      return;
    }

    setImporting(true);
    try {
      const imported = await importLocgComic(locgUrl.trim());
      setFormDefaults({
        title: imported.title || '',
        publisher: imported.publisher || '',
        series: imported.series || '',
        issueNumber: imported.issueNumber || '',
        releaseDate: imported.releaseDate || '',
        coverImage: imported.coverImage || '',
        variantCoverImage: imported.variantCoverImage || '',
        variantCover: imported.variantCover || '',
        notes: imported.notes || '',
      });
      setFormKey((key) => key + 1);
      push('Imported from League of Comic Geeks', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setImporting(false);
    }
  }

  async function handleSubmit(form) {
    setSubmitting(true);
    try {
      await createComic(form);
      saveLastAddDefaults(form);
      push('Added to pull list', 'success');
      navigate('/');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-page">
      <div className="page-header">
        <h1>Add Comic</h1>
        <p className="page-lead">{pageLead}</p>
      </div>

      <section className="locg-import panel">
        <label className="full-width">
          League of Comic Geeks link
          <input
            type="url"
            value={locgUrl}
            onChange={(e) => setLocgUrl(e.target.value)}
            placeholder="https://leagueofcomicgeeks.com/comic/1234567/amazing-spider-man-42"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>
        <button
          type="button"
          className="secondary-btn"
          onClick={handleImport}
          disabled={importing || !locgUrl.trim()}
        >
          {importing ? 'Importing…' : 'Import from LOCG'}
        </button>
      </section>

      <ComicForm
        key={formKey}
        initialValues={formDefaults}
        submitting={submitting}
        submitLabel="Add to Pull List"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
      />
    </div>
  );
}
