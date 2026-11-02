import { getStore } from '@netlify/blobs';
import { readEnv } from './env';
import { REPORT, SITE } from '../../config';

export const PERFORMANCE_STORE = 'performance';
export const LATEST_KEY = 'latest';

export const CATEGORY_LABELS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'performance', label: 'Prestazioni' },
  { id: 'accessibility', label: 'Accessibilità' },
  { id: 'best-practices', label: 'Buone pratiche' },
  { id: 'seo', label: 'SEO' },
];

export const AUDIT_LABELS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'largest-contentful-paint', label: 'LCP' },
  { id: 'cumulative-layout-shift', label: 'CLS' },
  { id: 'total-blocking-time', label: 'TBT' },
];

export interface StrategyResult {
  scores: Record<string, number | null>;
  audits: Record<string, string | null>;
  error: string | null;
}

export interface TargetResult {
  label: string;
  url: string;
  mobile: StrategyResult;
  desktop: StrategyResult;
}

export interface PerformanceSnapshot {
  measuredAt: string;
  targets: TargetResult[];
}

export function performanceTargets(): Array<{ label: string; url: string }> {
  return REPORT.performanceTargets.map((target) => ({
    label: target.label,
    url: new URL(target.path, SITE.url).toString(),
  }));
}

function isSnapshot(value: unknown): value is PerformanceSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const measuredAt: unknown = Reflect.get(value, 'measuredAt');
  const targets: unknown = Reflect.get(value, 'targets');
  return typeof measuredAt === 'string' && Array.isArray(targets);
}

function store(): ReturnType<typeof getStore> | null {
  try {
    return getStore(PERFORMANCE_STORE);
  } catch {
    return null;
  }
}

export async function readSnapshot(key: string): Promise<PerformanceSnapshot | null> {
  const blobs = store();
  if (blobs === null) return null;
  try {
    const value: unknown = await blobs.get(key, { type: 'json' });
    return isSnapshot(value) ? value : null;
  } catch {
    return null;
  }
}

export async function writeSnapshot(key: string, snapshot: PerformanceSnapshot): Promise<void> {
  const blobs = store();
  if (blobs === null) return;
  await blobs.setJSON(key, snapshot);
}

export async function listSnapshotKeys(): Promise<string[]> {
  const blobs = store();
  if (blobs === null) return [];
  try {
    const listed = await blobs.list();
    return listed.blobs
      .map((blob) => blob.key)
      .filter((key) => key !== LATEST_KEY)
      .sort();
  } catch {
    return [];
  }
}

export async function readPreviousSnapshot(
  latest: PerformanceSnapshot | null,
): Promise<PerformanceSnapshot | null> {
  if (latest === null) return null;
  const keys = (await listSnapshotKeys()).sort().reverse();
  for (const key of keys) {
    const snapshot = await readSnapshot(key);
    if (snapshot !== null && snapshot.measuredAt !== latest.measuredAt) return snapshot;
  }
  return null;
}

export function pageSpeedKey(): string | null {
  return readEnv('PAGESPEED_API_KEY');
}

function readScore(categories: unknown, id: string): number | null {
  const category: unknown = typeof categories === 'object' && categories !== null ? Reflect.get(categories, id) : null;
  const score: unknown = typeof category === 'object' && category !== null ? Reflect.get(category, 'score') : null;
  return typeof score === 'number' ? Math.round(score * 100) : null;
}

function readAudit(audits: unknown, id: string): string | null {
  const audit: unknown = typeof audits === 'object' && audits !== null ? Reflect.get(audits, id) : null;
  const value: unknown = typeof audit === 'object' && audit !== null ? Reflect.get(audit, 'displayValue') : null;
  return typeof value === 'string' ? value : null;
}

function emptyStrategy(error: string | null): StrategyResult {
  return {
    scores: Object.fromEntries(CATEGORY_LABELS.map((category) => [category.id, null])),
    audits: Object.fromEntries(AUDIT_LABELS.map((audit) => [audit.id, null])),
    error,
  };
}

export async function runPageSpeed(url: string, strategy: string, key: string): Promise<StrategyResult> {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('strategy', strategy);
  for (const category of CATEGORY_LABELS) endpoint.searchParams.append('category', category.id);
  endpoint.searchParams.set('locale', 'it');
  endpoint.searchParams.set('key', key);

  try {
    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      return emptyStrategy(`PageSpeed ha risposto ${response.status}`);
    }
    const payload: unknown = await response.json();
    const lighthouse: unknown =
      typeof payload === 'object' && payload !== null ? Reflect.get(payload, 'lighthouseResult') : null;
    const categories: unknown =
      typeof lighthouse === 'object' && lighthouse !== null ? Reflect.get(lighthouse, 'categories') : null;
    const audits: unknown =
      typeof lighthouse === 'object' && lighthouse !== null ? Reflect.get(lighthouse, 'audits') : null;

    return {
      scores: Object.fromEntries(CATEGORY_LABELS.map((category) => [category.id, readScore(categories, category.id)])),
      audits: Object.fromEntries(AUDIT_LABELS.map((audit) => [audit.id, readAudit(audits, audit.id)])),
      error: null,
    };
  } catch (error) {
    return emptyStrategy(error instanceof Error ? error.message : 'errore di rete');
  }
}

export async function measureAll(key: string): Promise<PerformanceSnapshot> {
  const targets: TargetResult[] = [];
  for (const target of performanceTargets()) {
    const mobile = await runPageSpeed(target.url, 'mobile', key);
    const desktop = await runPageSpeed(target.url, 'desktop', key);
    targets.push({ label: target.label, url: target.url, mobile, desktop });
  }
  return { measuredAt: new Date().toISOString(), targets };
}
