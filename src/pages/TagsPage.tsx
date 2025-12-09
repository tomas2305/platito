import { useEffect, useState } from 'react';
import type { Tag } from '../types';
import {
  createTag,
  deleteTag,
  getAllTags,
  updateTag,
} from '../stores/tagsStore';

interface TagFormState {
  id?: number;
  name: string;
}

const initialFormState: TagFormState = {
  name: '',
};

export const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [form, setForm] = useState<TagFormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTags = async () => {
    const data = await getAllTags();
    setTags(data);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const data = await getAllTags();
      if (!mounted) return;
      setTags(data);
      setLoading(false);
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (form.id) {
        await updateTag(form.id, {
          name: form.name,
        });
      } else {
        await createTag({
          name: form.name,
        });
      }
      setForm(initialFormState);
      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving tag');
    }
  };

  const handleEdit = (tag: Tag) => {
    setForm(tag);
    setError(null);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    const confirmDelete = confirm('Delete this tag?');
    if (!confirmDelete) return;
    try {
      await deleteTag(id);
      await loadTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting tag');
    }
  };

  const handleCancel = () => {
    setForm(initialFormState);
    setError(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Tags</h1>

      <section style={{ marginTop: '16px', marginBottom: '16px' }}>
        <h2>{form.id ? 'Edit Tag' : 'Create Tag'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Tag name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <button type="submit">{form.id ? 'Update' : 'Create'}</button>
          {form.id && (
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </section>

      <section>
        <h2>All Tags</h2>
        {tags.length === 0 ? (
          <p>No tags</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tags.map((tag) => (
              <li key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ flex: 1 }}>{tag.name}</span>
                <button type="button" onClick={() => handleEdit(tag)}>Edit</button>
                <button type="button" onClick={() => handleDelete(tag.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
