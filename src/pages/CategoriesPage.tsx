import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  ColorSwatch,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  SegmentedControl,
} from '@mantine/core';
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
    <Stack gap="lg">
      <Title order={2}>Categories</Title>

      <Card shadow="sm" radius="md" padding="lg" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={3}>{form.id ? 'Edit Category' : 'Create Category'}</Title>
            {form.id && (
              <Button variant="subtle" color="gray" onClick={handleCancel}>Cancel</Button>
            )}
          </Group>

          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <Group align="flex-end" gap="sm" wrap="wrap">
                <TextInput
                  label="Name"
                  placeholder="Category name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  style={{ minWidth: 180 }}
                />

                <SegmentedControl
                  value={form.type}
                  onChange={(value) => setForm((prev) => ({ ...prev, type: value as TransactionType }))}
                  data={TYPE_OPTIONS.map((t) => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))}
                />

                <Select
                  label="Icon"
                  placeholder="Select icon"
                  searchable
                  value={form.icon}
                  onChange={(value) => setForm((prev) => ({ ...prev, icon: value || 'tag' }))}
                  data={CATEGORY_ICON_OPTIONS.map((icon) => ({ label: icon, value: icon }))}
                  style={{ minWidth: 180 }}
                />

                <Button type="submit">{form.id ? 'Update' : 'Create'}</Button>
              </Group>

              <Stack gap={4}>
                <Text size="sm" c="dimmed">Color</Text>
                <Group gap="xs" wrap="wrap">
                  {COLOR_PALETTE.map((colorOption) => (
                    <ColorSwatch
                      key={colorOption.name}
                      color={colorOption.hex}
                      radius="sm"
                      size={32}
                      style={{ border: form.color === colorOption.name ? '2px solid var(--mantine-color-blue-6)' : '1px solid var(--mantine-color-default-border)' }}
                      onClick={() => setForm((prev) => ({ ...prev, color: colorOption.name }))}
                    />
                  ))}
                </Group>
              </Stack>

              {error && <Text c="red" size="sm">{error}</Text>}
            </Stack>
          </form>
        </Stack>
      </Card>

      <Group align="flex-start" gap="lg" wrap="wrap">
        {TYPE_OPTIONS.map((type) => (
          <Card key={type} shadow="xs" radius="md" padding="md" withBorder style={{ minWidth: 260 }}>
            <Stack gap="sm">
              <Title order={4} style={{ textTransform: 'capitalize' }}>{type}</Title>
              {grouped[type].length === 0 ? (
                <Text c="dimmed">No categories</Text>
              ) : (
                <Stack gap="xs">
                  {grouped[type].map((cat) => (
                    <Group key={cat.id} align="center" gap="sm">
                      <ColorSwatch color={getColorHex(cat.color)} size={18} radius="sm" />
                      <CategoryIcon name={cat.icon} />
                      <Text style={{ flex: 1 }}>{cat.name}</Text>
                      {!cat.isDefault && (
                        <Group gap="xs">
                          <Button size="xs" variant="light" onClick={() => handleEdit(cat)}>Edit</Button>
                          <Button size="xs" variant="light" color="red" onClick={() => handleDelete(cat.id)}>
                            Delete
                          </Button>
                        </Group>
                      )}
                      {cat.isDefault && <Text size="xs" c="dimmed">Default</Text>}
                    </Group>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
        ))}
      </Group>
    </Stack>
  );
};
