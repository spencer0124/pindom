import type { Artist, Place } from '../lib/domain';
import catalog from './gwandegong-catalog.json';

/** The supplied collection, using the same public photos and pins as Firebase. */
export const gwandegongArtist: Artist = catalog.artist;
export const gwandegongPlaces: Place[] = catalog.places.map((place) => ({
  ...place,
  workKind: place.workKind as Place['workKind'],
  createdAt: new Date(place.createdAt),
}));
