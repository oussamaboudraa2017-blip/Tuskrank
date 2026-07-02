import type { Uuid } from '@types';

/**
 * Marker for any DTO/entity that carries a UUID primary key.
 * Implementations have to expose `id` as a UUID.
 */
export interface BaseEntity {
  readonly id: Uuid;
}

/**
 * Standard timestamp audit fields mirrored from the schema.
 */
export interface TimestampedEntity extends BaseEntity {
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}
