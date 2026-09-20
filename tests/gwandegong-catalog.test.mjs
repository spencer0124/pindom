import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const text = readFileSync(new URL('../src/mocks/gwandegong-catalog.json', import.meta.url), 'utf8');
const { artists, places } = JSON.parse(text);

describe('supplied Gwandegong catalog', () => {
  it('retains all 23 distinct pins and associates them with the searchable collection', () => {
    assert.deepEqual(artists.map((artist) => artist.name), ['HJ', 'SY', 'JW', 'MJ']);
    assert.equal(places.length, 23);
    assert.deepEqual(artists.map((artist) => artist.placeCount), [4, 3, 3, 13]);
    assert.equal(new Set(places.map((place) => place.id)).size, places.length);
    for (const place of places) {
      assert.deepEqual(place.artistIds, ['artist-' + place.id.split('-')[2]]);
      assert.ok(Number.isFinite(place.lat) && Math.abs(place.lat) <= 90);
      assert.ok(Number.isFinite(place.lng) && Math.abs(place.lng) <= 180);
      assert.ok(place.lat !== 0 && place.lng !== 0, `${place.id}: real coordinates required`);
      assert.equal(place.workKind, 'self');
      assert.ok(Number.isFinite(Date.parse(place.createdAt)));
    }
  });

  it('uses English initials for all contributors and public image URLs for cutouts', () => {
    const initials = new Set(['HJ', 'SY', 'JW', 'MJ']);
    assert.equal(new Set(places.map((place) => place.contributorInitials)).size, initials.size);
    assert.doesNotMatch(text, /\/Users\/|file:\/\/|sourceKey|Downloads/);
    for (const place of places) {
      assert.ok(initials.has(place.contributorInitials));
      assert.equal(new URL(place.cutoutImageUrl).protocol, 'https:');
      assert.ok(Number.isFinite(place.cutoutAspectRatio) && place.cutoutAspectRatio > 0);
    }
  });

  it('uses supplied originals for every cover and restores only Marronnier GPS', () => {
    for (const place of places) {
      const url = new URL(place.coverImageUrl);
      assert.equal(url.protocol, 'https:');
      assert.match(decodeURIComponent(url.pathname), /gwandegong-originals-20260921/);
      assert.equal(place.coverImageCredit, undefined);
      assert.equal(place.coverImageSourceUrl, undefined);
      assert.doesNotMatch(place.description, /원본 배경사진은 아직|촬영 당시 사진이 아닌/);
      assert.equal(place.cameraTestEnabled, place.id !== 'place-gdg-ljw-03');
      assert.equal(place.radiusMeters, 50);
    }
  });
});
