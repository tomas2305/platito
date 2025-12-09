import { db } from '../db';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import type { Category, TransactionType } from '../types';

const normalizeName = (name: string): string => name.trim();

const isDuplicateName = async (
  name: string,
  type: TransactionType,
  excludeId?: number,
): Promise<boolean> => {
  const normalized = normalizeName(name).toLowerCase();
  const existing = await db.categories.where('type').equals(type).toArray();
  return existing.some((cat) => cat.id !== excludeId && cat.name.trim().toLowerCase() === normalized);
};

export const getAllCategories = async (): Promise<Category[]> => {
  return db.categories.toArray();
};

export const ensureDefaultCategories = async (): Promise<void> => {
  const existing = await db.categories.toArray();

  for (const def of DEFAULT_CATEGORIES) {
    const found = existing.find(
      (c) => c.name.trim().toLowerCase() === def.name.trim().toLowerCase() && c.type === def.type,
    );

    if (found) {
      await db.categories.update(found.id!, {
        color: def.color,
        icon: def.icon,
        isDefault: true,
      });
      continue;
    }

    await db.categories.add({ ...def });
  }
};

export const createCategory = async (data: Omit<Category, 'id'>): Promise<number> => {
  if (await isDuplicateName(data.name, data.type)) {
    throw new Error('Category name must be unique within its type');
  }

  const name = normalizeName(data.name);
  const icon = data.icon || 'tag';
  return db.categories.add({ ...data, name, icon, isDefault: data.isDefault ?? false });
};

export const updateCategory = async (
  id: number,
  patch: Partial<Omit<Category, 'id'>>,
): Promise<void> => {
  const current = await db.categories.get(id);
  if (!current) {
    throw new Error('Category not found');
  }

  const nextType = patch.type ?? current.type;
  const nextName = normalizeName(patch.name ?? current.name);
  const nextIcon = patch.icon ?? current.icon ?? 'tag';

  if (await isDuplicateName(nextName, nextType, id)) {
    throw new Error('Category name must be unique within its type');
  }

  await db.categories.update(id, {
    ...patch,
    name: nextName,
    type: nextType,
    icon: nextIcon,
    isDefault: current.isDefault,
  });
};

export const deleteCategory = async (id: number): Promise<void> => {
  const current = await db.categories.get(id);
  if (current?.isDefault) {
    throw new Error('Default categories cannot be deleted');
  }
  await db.categories.delete(id);
};
