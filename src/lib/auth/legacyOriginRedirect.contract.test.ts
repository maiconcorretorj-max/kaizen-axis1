import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('legacy Vercel origin redirect', () => {
  it('sends only kaizen-axis.space hosts to the VPS app', () => {
    const source = readFileSync(join(root, 'vercel.json'), 'utf8');
    const config = JSON.parse(source);
    const redirects = config.redirects ?? [];
    const hosts = redirects.flatMap((rule) => (rule.has ?? []).map((item) => item.value));

    assert.deepEqual(hosts.sort(), ['kaizen-axis.space', 'www.kaizen-axis.space']);
    for (const rule of redirects) {
      assert.equal(rule.permanent, false);
      assert.equal(rule.destination, 'https://app.imobkaizen.com.br/:path*');
    }
  });
});
