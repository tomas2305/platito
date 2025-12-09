import { db } from '../db';
import type { Tag } from '../types';

const normalizeName = (name: string): string => name.trim();

const isDuplicateName = async (name: string, excludeId?: number): Promise<boolean> => {
  const normalized = normalizeName(name).toLowerCase();
  const existing = await db.tags.toArray();
  return existing.some((tag) => tag.id !== excludeId && tag.name.trim().toLowerCase() === normalized);
};

export const getAllTags = async (): Promise<Tag[]> => {
  return db.tags.toArray();
};

export const createTag = async (data: Omit<Tag, 'id'>): Promise<number> => {
  if (await isDuplicateName(data.name)) {
    throw new Error('Tag name must be unique');
  }

  const name = normalizeName(data.name);
  return db.tags.add({ ...data, name });
};

export const updateTag = async (id: number, patch: Partial<Omit<Tag, 'id'>>): Promise<void> => {
  const current = await db.tags.get(id);
  if (!current) {
    throw new Error('Tag not found');
  }

  const nextName = normalizeName(patch.name ?? current.name);

  if (await isDuplicateName(nextName, id)) {
    throw new Error('Tag name must be unique');
  }

  await db.tags.update(id, {
    ...patch,
    name: nextName,
  });
};

export const deleteTag = async (id: number): Promise<void> => {
  await db.tags.delete(id);
};
