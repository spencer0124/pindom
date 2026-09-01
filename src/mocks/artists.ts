import type { Artist } from '../lib/domain';

/**
 * 최애 fixtures.
 *
 * Fictional groups on purpose — the prototype uses silhouette placeholders for people and
 * names no real artist, and seeding a real one into a public repo invites a rights problem
 * the product does not need.
 */
export const mockArtists: Artist[] = [
  {
    id: 'artist-lumina',
    name: '루미나',
    initial: 'LM',
    imageUrl: 'https://picsum.photos/seed/lumina/300/300',
    placeCount: 7,
    accentColor: '#58CF04',
  },
  {
    id: 'artist-echoline',
    name: '에코라인',
    initial: 'EL',
    imageUrl: 'https://picsum.photos/seed/echoline/300/300',
    // Counted from `places.ts` rather than guessed — this read 2 while only one
    // 촬영지 named 에코라인, and 홈 prints the number next to the list.
    placeCount: 1,
    accentColor: '#FF5E00',
  },
  {
    id: 'artist-nightpost',
    name: '나이트포스트',
    initial: 'NP',
    placeCount: 1,
  },
];
