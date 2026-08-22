import { create } from 'zustand';
import type { Place, TicketVisibility, VerificationGrant } from '@/lib/domain';

/**
 * Where the 최애 cutout sits over the photo.
 *
 * `x` and `y` are fractions of the stage's width and height, measured from its
 * centre, so the same value lands in the same place on the camera preview, the
 * 편집 canvas and the 공개설정 thumbnail — three stages of three different sizes.
 * `scale` is the percentage 1a's slider writes: 88–112, 100 is 원본 비율.
 */
export interface CutoutPlacement {
  x: number;
  y: number;
  scale: number;
}

/** 1a's starting position — offset right and a little down from centre. */
export const CUTOUT_HOME: CutoutPlacement = { x: 0.14, y: 0.04, scale: 100 };

/** The range 편집 was tightened to in the 2026-08-20 drop. See design/README.md #4. */
export const CUTOUT_SCALE = { min: 88, max: 112 } as const;

interface CaptureState {
  /** The 촬영지 the whole chain is keyed to. Set by GPS인증 from its route param. */
  place: Place | null;
  /** The 최애 named on the hero and the ticket — the one Discovery had selected. */
  artistName: string | null;
  /** Echoed back on every reading after the first, so the server sees one series. */
  sessionId: string | null;
  /** What unlocks the camera. Proof is the grant, not the navigation history. */
  grant: VerificationGrant | null;
  /** The server's last measured distance, so GPS인증 reopens on its figure, not the client's. */
  lastDistance: number | null;
  /** The raw shot from the camera — before the cutout and the tools. */
  photoUri: string | null;
  /** The composed image 편집 produced — what gets uploaded. */
  composedUri: string | null;
  cutout: CutoutPlacement;
  visibility: TicketVisibility;

  begin: (place: Place, artistName: string | null) => void;
  setSessionId: (sessionId: string) => void;
  setGrant: (grant: VerificationGrant) => void;
  setLastDistance: (meters: number) => void;
  setPhoto: (uri: string) => void;
  setComposed: (uri: string) => void;
  setCutout: (placement: Partial<CutoutPlacement>) => void;
  resetCutout: () => void;
  setVisibility: (visibility: TicketVisibility) => void;
  /** After 티켓 발행, or on 취소: the grant is single-use and the photo is gone. */
  reset: () => void;
}

const EMPTY = {
  place: null,
  artistName: null,
  sessionId: null,
  grant: null,
  lastDistance: null,
  photoUri: null,
  composedUri: null,
  cutout: CUTOUT_HOME,
  visibility: 'public' as TicketVisibility,
};

/**
 * The state the six Capture screens share.
 *
 * docs/reference/screens.md names it: `placeId`, the verification session and
 * grant, and the draft photo. Only `placeId` travels as a route param — it is
 * what makes GPS인증 deep-linkable from 장소/상세 — and everything after it lives
 * here, because a grant token in a URL is a grant token in the navigation
 * history.
 */
export const useCaptureStore = create<CaptureState>((set, get) => ({
  ...EMPTY,

  begin: (place, artistName) => {
    // Re-opening GPS인증 for the same place keeps the session so the speed check
    // sees a series; a different place starts over.
    if (get().place?.id === place.id) return set({ place, artistName });
    set({ ...EMPTY, place, artistName });
  },
  setSessionId: (sessionId) => set({ sessionId }),
  setGrant: (grant) => set({ grant }),
  setLastDistance: (lastDistance) => set({ lastDistance }),
  setPhoto: (photoUri) => set({ photoUri, composedUri: null }),
  setComposed: (composedUri) => set({ composedUri }),
  setCutout: (placement) => set({ cutout: { ...get().cutout, ...placement } }),
  resetCutout: () => set({ cutout: CUTOUT_HOME }),
  setVisibility: (visibility) => set({ visibility }),
  reset: () => set({ ...EMPTY }),
}));
