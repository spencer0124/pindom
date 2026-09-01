#!/usr/bin/env node
// App Store Connect API client for PINDOM.
//
// Why this file exists: this machine has no `pyjwt` and no `cryptography`, so the
// ES256 JWT has to be minted with Node's built-in crypto. The one detail that is
// easy to get wrong and hard to diagnose is `dsaEncoding: 'ieee-p1363'` — Node
// defaults to DER, which App Store Connect rejects with a bare 401.
//
// Usage:
//   node asc.mjs GET  '/v1/builds?filter[app]=6805109833&filter[version]=7'
//   node asc.mjs POST '/v1/betaAppReviewSubmissions' '{"data":{...}}'
//   node asc.mjs PATCH '/v1/builds/{id}' '{"data":{...}}'
//   node asc.mjs build-state 7        # convenience: build id + internal/external state
//   node asc.mjs whats-new 7 '텍스트'  # set the ko What to Test on a build
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const KEY_ID = process.env.ASC_KEY_ID ?? 'VL6TWU5ST5';
const ISSUER_ID = process.env.ASC_ISSUER_ID ?? '97e30026-b115-4ce3-8939-a98af36dcf3b';
const KEY_PATH =
  process.env.ASC_KEY_PATH ??
  `${process.env.HOME}/project/skkumap/ios/fastlane/AuthKey_VL6TWU5ST5.p8`;
const APP_ID = process.env.ASC_APP_ID ?? '6805109833';
const BASE = 'https://api.appstoreconnect.apple.com';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

function token() {
  const key = readFileSync(KEY_PATH, 'utf8');
  const now = Math.floor(Date.now() / 1000);
  const input = `${b64({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })}.${b64({
    iss: ISSUER_ID,
    iat: now,
    exp: now + 600,
    aud: 'appstoreconnect-v1',
  })}`;
  // `ieee-p1363` is mandatory — the default DER encoding is rejected.
  const sig = createSign('sha256')
    .update(input)
    .sign({ key, dsaEncoding: 'ieee-p1363' })
    .toString('base64url');
  return `${input}.${sig}`;
}

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}\n${text}`);
  }
  return text ? JSON.parse(text) : null;
}

const [cmd, ...rest] = process.argv.slice(2);

if (cmd === 'build-state') {
  const version = rest[0];
  const builds = await call(
    'GET',
    `/v1/builds?filter[app]=${APP_ID}&filter[version]=${version}`,
  );
  const build = builds.data[0];
  if (!build) {
    console.log(JSON.stringify({ found: false, version }, null, 2));
    process.exit(0);
  }
  const detail = await call('GET', `/v1/builds/${build.id}/buildBetaDetail`);
  console.log(
    JSON.stringify(
      {
        found: true,
        id: build.id,
        version: build.attributes.version,
        processingState: build.attributes.processingState,
        expired: build.attributes.expired,
        uploadedDate: build.attributes.uploadedDate,
        internalBuildState: detail.data.attributes.internalBuildState,
        externalBuildState: detail.data.attributes.externalBuildState,
      },
      null,
      2,
    ),
  );
} else if (cmd === 'whats-new') {
  // External TestFlight review refuses a build with no "What to Test".
  const [version, text] = rest;
  const builds = await call(
    'GET',
    `/v1/builds?filter[app]=${APP_ID}&filter[version]=${version}`,
  );
  const buildId = builds.data[0].id;
  const locs = await call('GET', `/v1/builds/${buildId}/betaBuildLocalizations`);
  const ko = locs.data.find((l) => l.attributes.locale === 'ko');
  if (ko) {
    await call('PATCH', `/v1/betaBuildLocalizations/${ko.id}`, {
      data: { type: 'betaBuildLocalizations', id: ko.id, attributes: { whatsNew: text } },
    });
    console.log(`patched ko betaBuildLocalization ${ko.id}`);
  } else {
    const created = await call('POST', '/v1/betaBuildLocalizations', {
      data: {
        type: 'betaBuildLocalizations',
        attributes: { locale: 'ko', whatsNew: text },
        relationships: { build: { data: { type: 'builds', id: buildId } } },
      },
    });
    console.log(`created ko betaBuildLocalization ${created.data.id}`);
  }
} else if (['GET', 'POST', 'PATCH', 'DELETE'].includes(cmd)) {
  const out = await call(cmd, rest[0], rest[1]);
  console.log(out === null ? '(204 no content)' : JSON.stringify(out, null, 2));
} else {
  console.error('usage: asc.mjs <GET|POST|PATCH|DELETE|build-state|whats-new> ...');
  process.exit(1);
}
