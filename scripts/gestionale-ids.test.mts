import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const gestionaleDir = 'src/pages/area-riservata/gestionale';
const idPattern = /\bid=(?:\{`([^`]+)`\}|"([^"]+)")/g;

function duplicateIds(source: string): string[] {
  const occurrences = new Map<string, number[]>();
  source.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(idPattern)) {
      const literal = match[1] ?? match[2] ?? '';
      const shape = literal.replace(/\$\{[^}]+\}/g, '<expr>');
      occurrences.set(shape, [...(occurrences.get(shape) ?? []), index + 1]);
    }
  });
  return [...occurrences]
    .filter(([, lines]) => lines.length > 1)
    .map(([shape, lines]) => `${shape} (righe ${lines.join(', ')})`);
}

for (const page of readdirSync(gestionaleDir).filter((name) => name.endsWith('.astro'))) {
  test(`${page} non genera due elementi con lo stesso id`, () => {
    const source = readFileSync(join(gestionaleDir, page), 'utf8');
    assert.deepEqual(duplicateIds(source), []);
  });
}
