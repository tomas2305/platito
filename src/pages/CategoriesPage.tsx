import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category, TransactionType } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { COLOR_PALETTE, type ColorName, getColorHex } from '../utils/colors';
import {
  createCategory,
  deleteCategory,
  ensureDefaultCategories,
  getAllCategories,
  updateCategory,
} from '../stores/categoriesStore';
import { CATEGORY_ICON_OPTIONS } from '../utils/categoryIcons';

const TYPE_OPTIONS: TransactionType[] = ['income', 'expense'];

interface CategoryFormState {
  id?: number;
  name: string;
  type: TransactionType;
  color: ColorName;
  icon: string;
}

const initialFormState: CategoryFormState = {
  name: '',
  type: 'expense',
  color: 'green',
  icon: 'tag',
};

export const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    const data = await getAllCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      await ensureDefaultCategories();
      const data = await getAllCategories();
      if (!mounted) return;
      setCategories(data);
      setLoading(false);
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    return TYPE_OPTIONS.reduce<Record<TransactionType, Category[]>>((acc, type) => {
      acc[type] = categories.filter((c) => c.type === type);
      return acc;
    }, { income: [], expense: [] });
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (form.id) {
        await updateCategory(form.id, {
          name: form.name,
          type: form.type,
          color: form.color,
          icon: form.icon,
        });
      } else {
        await createCategory({
          name: form.name,
          type: form.type,
          color: form.color,
          icon: form.icon,
          isDefault: false,
        });
      }
      setForm(initialFormState);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving category');
    }
  };

  const handleEdit = (category: Category) => {
    setForm({ ...category, icon: category.icon || 'tag' });
    setError(null);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    const confirmDelete = confirm('Delete this category?');
    if (!confirmDelete) return;
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting category');
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
      <h1>Categories</h1>
      <nav>
        <Link to="/">Home</Link>
        {' | '}
        <Link to="/accounts">Accounts</Link>
        {' | '}
        <Link to="/tags">Tags</Link>
        {' | '}
        <Link to="/settings">Settings</Link>
      </nav>

      <section style={{ marginTop: '16px', marginBottom: '16px' }}>
        <h2>{form.id ? 'Edit Category' : 'Create Category'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as TransactionType }))}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={form.icon}
            onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
          >
            {CATEGORY_ICON_OPTIONS.map((icon) => (
              <option key={icon} value={icon}>{icon}</option>
            ))}
          </select>
          <button type="submit">{form.id ? 'Update' : 'Create'}</button>
          {form.id && (
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          {COLOR_PALETTE.map((colorOption) => (
            <button
              key={colorOption.name}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, color: colorOption.name }))}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: colorOption.hex,
                border: form.color === colorOption.name ? '3px solid black' : '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </section>

      <section style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {TYPE_OPTIONS.map((type) => (
          <div key={type} style={{ minWidth: '240px' }}>
            <h3 style={{ textTransform: 'capitalize' }}>{type}</h3>
            {grouped[type].length === 0 ? (
              <p style={{ color: '#555' }}>No categories</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {grouped[type].map((cat) => (
                  <li key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        backgroundColor: getColorHex(cat.color),
                        display: 'inline-block',
                      }}
                    />
                    <CategoryIcon name={cat.icon} />
                    <span style={{ flex: 1 }}>{cat.name}</span>
                    {!cat.isDefault && (
                      <>
                        <button type="button" onClick={() => handleEdit(cat)}>Edit</button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {cat.isDefault && <span style={{ fontSize: '0.8rem', color: '#666' }}>Default</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};
