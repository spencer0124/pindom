import type { PlaceWorkKind } from '@/lib/domain';

/** The caption 1a prints for each kind of work — `MV 촬영 · 강원 강릉`. */
export const workKindLabel: Record<PlaceWorkKind, string> = {
  mv: 'MV 촬영',
  drama: '드라마 촬영',
  self: '자체 콘텐츠',
};
