import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));

// Run the app's real TypeScript repositories without loading native Firebase.
function modules(stubs = {}) {
  const cache = new Map();
  const load = (request, from = resolve(root, 'entry.ts')) => {
    if (request in stubs) return stubs[request];
    const base = request.startsWith('@/') ? resolve(root, 'src', request.slice(2)) : resolve(dirname(from), request);
    const path = [base, `${base}.ts`, `${base}/index.ts`].find((file) => existsSync(file) && /\.(ts|json)$/.test(file));
    assert.ok(path, `Unresolved test module: ${request}`);
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} };
    cache.set(path, module);
    if (path.endsWith('.json')) module.exports = JSON.parse(readFileSync(path, 'utf8'));
    else {
      const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      });
      new Function('require', 'module', 'exports', 'setTimeout', 'clearTimeout', outputText)(
        (id) => load(id, path), module, module.exports,
        (callback) => { queueMicrotask(callback); return 0; }, () => {},
      );
    }
    return module.exports;
  };
  return load;
}

describe('camera test repository access', () => {
  it('shows only supplied places and keeps historical place/ticket lookups', async () => {
    const load = modules();
    const { mockRepositories: repo } = load('./src/lib/repositories/mock');
    const { places: catalog } = load('./src/mocks/gwandegong-catalog.json');
    const active = await repo.places.listAll(0, 0);
    assert.equal(active.ok, true);
    assert.deepEqual(new Set(active.data.map((place) => place.id)), new Set(catalog.map((place) => place.id)));
    assert.ok(active.data.every((place) => !place.archived));
    assert.deepEqual(active.data.filter((place) => !place.cameraTestEnabled).map((place) => place.id), ['place-gdg-ljw-03']);
    assert.equal((await repo.verification.startCameraTest('place-gdg-ljw-03')).ok, false);
    assert.equal((await repo.places.getById('place-jumunjin')).data.archived, true);
    assert.equal((await repo.courses.listForArtist('artist-lumina')).data.length, 0);
    assert.ok((await repo.tickets.listMine()).data.length > 0);
    const artists = (await repo.artists.search()).data;
    for (const artist of artists) {
      assert.equal(artist.placeCount, active.data.filter((place) => place.artistIds.includes(artist.id)).length);
    }
    const recommendation = (await repo.assistant.ask({ message: '코스', artistId: 'artist-lumina', history: [] })).data;
    assert.equal(recommendation.courseId, undefined);
    assert.deepEqual(recommendation.map.stops, []);
  });

  it('requests a test grant without a reading and carries TEST through ticket issue', async () => {
    const load = modules();
    const { mockRepositories: repo } = load('./src/lib/repositories/mock');
    const result = await repo.verification.startCameraTest('place-gdg-kmj-13');
    assert.equal(result.ok, true);
    assert.equal(result.data.verified, true);
    assert.equal(result.data.grant.testMode, true);
    assert.equal(result.data.distanceMeters, 0);
    assert.ok(result.data.grant.expiresAt > new Date());
    const ticket = await repo.tickets.issue({ grantToken: result.data.grant.token, photoPath: 'test.jpg', visibility: 'private' });
    assert.equal(ticket.ok, true);
    assert.equal(ticket.data.testMode, true);
    assert.equal(ticket.data.placeId, 'place-gdg-kmj-13');
    assert.equal((await repo.tickets.issue({ grantToken: result.data.grant.token, photoPath: 'test.jpg', visibility: 'private' })).ok, false);
  });

  it('preserves TEST in public profile projections while keeping private test photos out', async () => {
    const { mockRepositories: repo } = modules()('./src/lib/repositories/mock');
    const publicGrant = (await repo.verification.startCameraTest('place-gdg-kmj-13')).data.grant;
    const publicTicket = (await repo.tickets.issue({ grantToken: publicGrant.token, photoPath: 'public-test.jpg', visibility: 'public' })).data;
    const privateGrant = (await repo.verification.startCameraTest('place-gdg-kmj-13')).data.grant;
    const privateTicket = (await repo.tickets.issue({ grantToken: privateGrant.token, photoPath: 'private-test.jpg', visibility: 'private' })).data;
    const profile = (await repo.users.getPublicProfile(publicTicket.userId)).data;
    assert.equal(profile.tickets.find((ticket) => ticket.ticketId === publicTicket.id).testMode, true);
    assert.equal(profile.tickets.some((ticket) => ticket.ticketId === privateTicket.id), false);
    assert.ok(profile.tickets.filter((ticket) => ticket.ticketId !== publicTicket.id).every((ticket) => !ticket.testMode));
  });

  it('rejects archived, disabled and signed-out test access; restoration also invalidates an existing test grant', async () => {
    const load = modules();
    const { mockRepositories: repo } = load('./src/lib/repositories/mock');
    const { mockPlaces } = load('./src/mocks/places');
    assert.equal((await repo.verification.startCameraTest('place-jumunjin')).ok, false);
    assert.equal((await repo.verification.submitReading({ placeId: 'place-jumunjin' })).ok, false);
    const place = mockPlaces.find((entry) => entry.id === 'place-gdg-kmj-13');
    const issued = await repo.verification.startCameraTest(place.id);
    place.cameraTestEnabled = false;
    assert.equal((await repo.verification.startCameraTest(place.id)).failure.errorCode, 'camera_test_disabled');
    assert.equal((await repo.tickets.issue({ grantToken: issued.data.grant.token, photoPath: 'test.jpg', visibility: 'private' })).failure.errorCode, 'camera_test_disabled');
    await repo.auth.signOut();
    assert.equal((await repo.verification.startCameraTest('place-gdg-kmj-13')).failure.code, 'unauthenticated');
  });

  it('also bypasses scripted GPS failures for older apps submitting readings to an enabled place', async () => {
    const { mockRepositories: repo } = modules()('./src/lib/repositories/mock');
    const result = await repo.verification.submitReading({ placeId: 'place-gdg-kmj-13' });
    assert.equal(result.data.verified, true);
    assert.equal(result.data.grant.testMode, true);
  });
});

function verificationHarness(place, testResult) {
  let cursor = 0;
  let first = true;
  const state = [];
  const effects = [];
  const calls = { readPosition: 0, permission: 0, position: 0, cameraTest: 0, reading: 0 };
  const capture = {
    sessionId: null, grant: null, lastDistance: null,
    begin: () => {}, setSessionId: (id) => { capture.sessionId = id; },
    setGrant: (grant) => { capture.grant = grant; }, setLastDistance: () => {},
  };
  const captureStore = Object.assign((select) => select(capture), { getState: () => capture });
  const react = {
    useState: (initial) => {
      const index = cursor++;
      if (first) state[index] = initial;
      return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useRef: (initial) => ({ current: initial }),
    useCallback: (fn) => fn,
    useEffect: (fn) => { if (first) effects.push(fn); },
  };
  const load = modules({
    react,
    'react-native': { Platform: { OS: 'ios' } },
    'expo-location': {
      Accuracy: { High: 6 },
      requestForegroundPermissionsAsync: async () => { calls.permission++; return { granted: true }; },
      getCurrentPositionAsync: async () => { calls.position++; return { coords: { latitude: 0, longitude: 0, accuracy: 5 }, timestamp: Date.now() }; },
    },
    '@/features/discovery': {
      readPosition: async () => { calls.readPosition++; return null; },
      useDiscoveryStore: (select) => select({ selectedArtistId: null }),
    },
    './state': { useCaptureStore: captureStore },
    '@/lib/repositories': {
      placeRepository: { getById: async () => ({ ok: true, data: place }) },
      artistRepository: { getById: async () => ({ ok: false }) },
      verificationRepository: {
        startCameraTest: async () => { calls.cameraTest++; return testResult; },
        submitReading: async () => { calls.reading++; return testResult; },
      },
    },
  });
  const { useVerification } = load('./src/features/capture/useVerification');
  const render = () => { cursor = 0; const result = useVerification(place.id); first = false; return result; };
  return {
    calls, capture, render,
    load: async () => { render(); effects.forEach((fn) => fn()); for (let i = 0; i < 8; i++) await Promise.resolve(); return render(); },
  };
}

describe('camera test verification flow', () => {
  const place = { id: 'enabled-place', artistIds: [], lat: 0, lng: 0, cameraTestEnabled: true };
  const data = { sessionId: 'test-session', verified: true, grant: { token: 'test-grant', expiresAt: new Date(Date.now() + 600_000), testMode: true } };

  it('loads and unlocks the camera without any GPS access', async () => {
    const harness = verificationHarness(place, { ok: true, data });
    const view = await harness.load();
    assert.equal(view.state.status, 'ready');
    assert.equal(await view.verify(), data);
    assert.equal(harness.capture.grant, data.grant);
    assert.equal(harness.render().phase, 'verified');
    assert.deepEqual(harness.calls, { readPosition: 0, permission: 0, position: 0, cameraTest: 1, reading: 0 });
  });

  it('does not display a GPS verdict when the server enables testing after the place loaded', async () => {
    const harness = verificationHarness({ ...place, cameraTestEnabled: false }, { ok: true, data });
    const view = await harness.load();
    await view.verify();
    const updated = harness.render();
    assert.equal(updated.phase, 'verified');
    assert.equal(updated.result.grant.testMode, true);
    assert.equal(updated.distance, null);
    assert.equal(updated.accuracy, null);
  });

  it('does not unlock the camera when the server refuses or omits the test grant', async () => {
    for (const result of [{ ok: false, failure: { type: 'firebase', code: 'failed-precondition', errorCode: 'camera_test_disabled' } }, { ok: true, data: { ...data, grant: { ...data.grant, testMode: false } } }]) {
      const harness = verificationHarness(place, result);
      const view = await harness.load();
      assert.equal(await view.verify(), null);
      assert.equal(harness.capture.grant, null);
      assert.equal(harness.render().phase, 'idle');
      assert.ok(harness.render().error);
      assert.equal(harness.calls.permission, 0);
    }
  });

  it('rejects archived deep links and restores normal GPS requests when test access is off', async () => {
    const archived = verificationHarness({ ...place, archived: true }, { ok: true, data });
    assert.equal((await archived.load()).state.status, 'error');
    assert.equal(archived.calls.readPosition, 0);
    const normal = verificationHarness({ ...place, cameraTestEnabled: false }, { ok: true, data: { ...data, grant: { ...data.grant, testMode: false } } });
    const view = await normal.load();
    await view.verify();
    assert.deepEqual(normal.calls, { readPosition: 1, permission: 1, position: 1, cameraTest: 0, reading: 1 });
  });
});
