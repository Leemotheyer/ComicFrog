import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createComic } from '../api';
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

export default function AddPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const defaults = useMemo(() => {
    const last = getLastAddDefaults();
    return {
      title: '',
      publisher: last.publisher || '',
      series: last.series || '',
      issueNumber: suggestIssueNumber(last.issueNumber || ''),
      releaseDate: '',
      coverImage: '',
      variantCoverImage: '',
      variantCover: '',
      notes: '',
    };
  }, []);

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
        <p className="page-lead">New issues go on your pull list as active Froglog live service games.</p>
      </div>
      <ComicForm
        initialValues={defaults}
        submitting={submitting}
        submitLabel="Add to Pull List"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
      />
    </div>
  );
}
