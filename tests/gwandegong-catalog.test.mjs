import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const text = readFileSync(new URL('../src/mocks/gwandegong-catalog.json', import.meta.url), 'utf8');
const { artist, places } = JSON.parse(text);

describe('supplied Gwandegong catalog', () => {
  it('retains all 23 distinct pins and associates them with the searchable collection', () => {
    assert.equal(artist.name, '관데공');
    assert.equal(places.length, 23);
    assert.equal(artist.placeCount, places.length);
    assert.equal(new Set(places.map((place) => place.id)).size, places.length);
    for (const place of places) {
      assert.deepEqual(place.artistIds, [artist.id]);
      assert.ok(Number.isFinite(place.lat) && Math.abs(place.lat) <= 90);
      assert.ok(Number.isFinite(place.lng) && Math.abs(place.lng) <= 180);
      assert.ok(place.lat !== 0 && place.lng !== 0, `${place.id}: real coordinates required`);
      assert.equal(place.workKind, 'self');
      assert.ok(Number.isFinite(Date.parse(place.createdAt)));
    }
  });

  it('uses initials for all contributors and public image URLs for cutouts', () => {
    const initials = new Set(['ㅇㅎㅈ', 'ㅈㅅㅇ', 'ㅇㅈㅇ', 'ㄱㅁㅈ']);
    assert.equal(new Set(places.map((place) => place.contributorInitials)).size, initials.size);
    assert.doesNotMatch(text, /\/Users\/|file:\/\/|sourceKey|Downloads/);
    for (const place of places) {
      assert.ok(initials.has(place.contributorInitials));
      assert.equal(new URL(place.cutoutImageUrl).protocol, 'https:');
      assert.ok(Number.isFinite(place.cutoutAspectRatio) && place.cutoutAspectRatio > 0);
    }
  });

  it('keeps the unavailable background empty and credits the replacement representative photo', () => {
    const missing = places.filter((place) => !place.coverImageUrl);
    assert.equal(missing.length, 1);
    assert.equal(missing[0].id, 'place-gdg-yhj-03');
    for (const place of places.filter((entry) => entry.coverImageUrl)) {
      assert.equal(new URL(place.coverImageUrl).protocol, 'https:');
    }
    const representative = places.find((place) => place.id === 'place-gdg-jsy-01');
    assert.match(representative.coverImageCredit, /대표 사진.*한국관광공사.*제1유형/);
    assert.equal(new URL(representative.coverImageSourceUrl).hostname, 'data.visitkorea.or.kr');
    assert.match(representative.description, /촬영 당시 사진이 아닌/);
  });
});
