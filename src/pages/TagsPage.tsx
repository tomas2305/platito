import { useEffect, useState } from 'react';
import { Button, Card, Group, Stack, Text, TextInput, Title } from '@mantine/core';
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
    <Stack gap="lg">
      <Title order={2}>Tags</Title>

      <Card shadow="sm" radius="md" padding="lg" withBorder>
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={3}>{form.id ? 'Edit Tag' : 'Create Tag'}</Title>
            {form.id && <Button variant="subtle" color="gray" onClick={handleCancel}>Cancel</Button>}
          </Group>

          <form onSubmit={handleSubmit}>
            <Group align="flex-end" gap="sm" wrap="wrap">
              <TextInput
                label="Tag name"
                placeholder="Tag name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <Button type="submit">{form.id ? 'Update' : 'Create'}</Button>
            </Group>
          </form>
          {error && <Text c="red" size="sm">{error}</Text>}
        </Stack>
      </Card>

      <Card shadow="xs" radius="md" padding="lg" withBorder>
        <Stack gap="sm">
          <Title order={3}>All Tags</Title>
          {tags.length === 0 ? (
            <Text c="dimmed">No tags</Text>
          ) : (
            <Stack gap="xs">
              {tags.map((tag) => (
                <Group key={tag.id} align="center" gap="sm">
                  <Text style={{ flex: 1 }}>{tag.name}</Text>
                  <Button size="xs" variant="light" onClick={() => handleEdit(tag)}>Edit</Button>
                  <Button size="xs" variant="light" color="red" onClick={() => handleDelete(tag.id)}>Delete</Button>
                </Group>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
};
