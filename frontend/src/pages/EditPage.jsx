import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchComics, updateComic } from '../api';
import ComicForm from '../components/ComicForm';
import { useToast } from '../context/ToastContext';

export default function EditPage() {
  const { source, id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [comic, setComic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComics()
      .then((comics) => {
        const match = comics.find((item) => item.id === Number(id) && item.source === source);
        setComic(match || null);
      })
      .catch((err) => push(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, source, push]);

  async function handleSubmit(form) {
    setSubmitting(true);
    try {
      await updateComic(id, source, form);
      push('Comic updated', 'success');
      navigate('/');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="empty-state">Loading comic...</div>;
  }

  if (!comic) {
    return (
      <div className="empty-state panel">
        <h2>Comic not found</h2>
        <button type="button" className="primary-btn" onClick={() => navigate('/')}>Back to list</button>
      </div>
    );
  }

  return (
    <div className="edit-page">
      <div className="page-header">
        <h1>Edit Comic</h1>
        <p className="page-lead">Update details stored in Froglog.</p>
      </div>
      <ComicForm
        initialValues={{
          title: comic.title,
          publisher: comic.publisher,
          series: comic.series,
          issueNumber: comic.issueNumber,
          releaseDate: comic.releaseDate || '',
          coverImage: comic.coverImage || '',
          variantCoverImage: comic.variantCoverImage || '',
          variantCover: comic.variantCover || '',
          notes: comic.notes || '',
          purchasePrice: comic.purchasePrice ?? '',
          purchaseDate: comic.purchaseDate || '',
        }}
        showPurchaseFields={comic.status === 'complete'}
        submitting={submitting}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
      />
    </div>
  );
}
