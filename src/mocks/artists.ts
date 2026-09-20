import type { Artist } from '../lib/domain';
import { gwandegongArtist } from './gwandegong';
import { mockPlaces } from './places';

/**
 * 최애 fixtures.
 *
 * The user-supplied 관데공 collection comes first. The remaining groups are
 * fictional fixtures retained for historical tickets and community boards.
 */
const artists: Artist[] = [
  gwandegongArtist,
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

export const mockArtists: Artist[] = artists.map((artist) => ({
  ...artist,
  placeCount: mockPlaces.filter((place) => !place.archived && place.artistIds.includes(artist.id)).length,
}));
