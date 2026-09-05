import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('service worker auth bypass', () => {
  it('does not cache GETs to the self-hosted Axis API', () => {
    const source = readFileSync(join(root, 'public/sw.js'), 'utf8');
    assert.match(source, /api-app\.imobkaizen\.com\.br/);
  });

  it('evicts the legacy Vercel origin toward the VPS app', () => {
    const source = readFileSync(join(root, 'public/sw.js'), 'utf8');
    assert.match(source, /www\.kaizen-axis\.space/);
    assert.match(source, /https:\/\/app\.imobkaizen\.com\.br/);
    assert.match(source, /Response\.redirect\(rewriteLegacyUrl\(url\), 307\)/);
  });
});
