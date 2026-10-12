import { Types } from 'mongoose';

/**
 * `.lean()` queries and aggregation results skip Mongoose's toJSON transform,
 * so they only carry `_id`. This adds a string `id` (and drops `__v`) on every
 * nested plain object so all API responses expose the same id shape.
 */
export const withIds = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => withIds(item)) as unknown as T;
  }

  if (!value || typeof value !== 'object' || value instanceof Date || value instanceof Types.ObjectId) {
    return value;
  }

  const source = value as Record<string, any>;
  if (typeof source.toJSON === 'function') {
    return source.toJSON();
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(source)) {
    if (key === '__v') continue;
    result[key] = withIds(val);
  }
  if (source._id !== undefined) {
    result.id = String(source._id);
  }
  return result as T;
};

export const toIdString = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Types.ObjectId) return value.toString();
  if (value._id !== undefined) return String(value._id);
  return String(value);
};

export const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
