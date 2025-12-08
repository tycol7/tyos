/**
 * State diffing utilities for bulk updates
 */

import type { photos } from '../../../packages/db/src/index.ts';

export interface PhotoUpdate {
  id: string;
  sortOrder: number;
  isHero: boolean;
}

export interface PhotoDiff {
  updates: PhotoUpdate[];
  unchanged: string[];
}

/**
 * Compare new photo state with existing state and return diff
 */
export function diffPhotoState(
  existing: (typeof photos.$inferSelect)[],
  newState: PhotoUpdate[]
): PhotoDiff {
  const updates: PhotoUpdate[] = [];
  const unchanged: string[] = [];
  const existingMap = new Map(existing.map((p) => [p.id, p]));

  for (const newPhoto of newState) {
    const existingPhoto = existingMap.get(newPhoto.id);

    if (!existingPhoto) {
      throw new Error(`Photo ${newPhoto.id} not found`);
    }

    if (
      existingPhoto.sortOrder !== newPhoto.sortOrder ||
      existingPhoto.isHero !== newPhoto.isHero
    ) {
      updates.push({
        id: newPhoto.id,
        sortOrder: newPhoto.sortOrder,
        isHero: newPhoto.isHero,
      });
    } else {
      unchanged.push(newPhoto.id);
    }
  }

  return { updates, unchanged };
}
