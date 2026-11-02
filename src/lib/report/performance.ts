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

export interface AuditIssue {
  id: string;
  category: string;
  title: string;
  detail: string | null;
  weight: number;
}

export interface StrategyResult {
  scores: Record<string, number | null>;
  audits: Record<string, string | null>;
  issues: AuditIssue[];
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
    issues: [],
    error,
  };
}

const SKIPPED_MODES = ['notApplicable', 'manual', 'informative'];

function readIssues(categories: unknown, audits: unknown): AuditIssue[] {
  if (typeof categories !== 'object' || categories === null) return [];
  if (typeof audits !== 'object' || audits === null) return [];

  const issues: AuditIssue[] = [];
  for (const category of CATEGORY_LABELS) {
    const node: unknown = Reflect.get(categories, category.id);
    const refs: unknown = typeof node === 'object' && node !== null ? Reflect.get(node, 'auditRefs') : null;
    if (!Array.isArray(refs)) continue;

    for (const ref of refs) {
      const id: unknown = typeof ref === 'object' && ref !== null ? Reflect.get(ref, 'id') : null;
      const weight: unknown = typeof ref === 'object' && ref !== null ? Reflect.get(ref, 'weight') : null;
      if (typeof id !== 'string') continue;

      const audit: unknown = Reflect.get(audits, id);
      if (typeof audit !== 'object' || audit === null) continue;

      const mode: unknown = Reflect.get(audit, 'scoreDisplayMode');
      if (typeof mode === 'string' && SKIPPED_MODES.includes(mode)) continue;

      const score: unknown = Reflect.get(audit, 'score');
      if (typeof score !== 'number' || score >= 0.9) continue;

      const title: unknown = Reflect.get(audit, 'title');
      const detail: unknown = Reflect.get(audit, 'displayValue');
      issues.push({
        id,
        category: category.id,
        title: typeof title === 'string' ? title : id,
        detail: typeof detail === 'string' ? detail : null,
        weight: typeof weight === 'number' ? weight : 0,
      });
    }
  }

  return issues.sort((left, right) => right.weight - left.weight).slice(0, 10);
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
      issues: readIssues(categories, audits),
      error: null,
    };
  } catch (error) {
    return emptyStrategy(error instanceof Error ? error.message : 'errore di rete');
  }
}

const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORY_LABELS.map((category) => [category.id, category.label]),
);

export function targetIssues(target: TargetResult): AuditIssue[] {
  const seen = new Map<string, AuditIssue>();
  for (const strategy of [target.mobile, target.desktop]) {
    for (const issue of strategy.issues ?? []) {
      const existing = seen.get(issue.id);
      if (existing === undefined || issue.weight > existing.weight) seen.set(issue.id, issue);
    }
  }
  return [...seen.values()].sort((left, right) => right.weight - left.weight);
}

export function buildPerformancePrompt(target: TargetResult, measuredAt: string): string | null {
  const describe = (strategy: StrategyResult, device: string): string[] => {
    const issues = strategy.issues ?? [];
    if (issues.length === 0) return [];
    return [
      `Su ${device}:`,
      ...issues.map(
        (issue) =>
          `- [${CATEGORY_NAMES[issue.category] ?? issue.category}] ${issue.title}${issue.detail === null ? '' : ` — ${issue.detail}`}`,
      ),
    ];
  };

  const mobile = describe(target.mobile, 'telefono');
  const desktop = describe(target.desktop, 'computer');
  if (mobile.length === 0 && desktop.length === 0) return null;

  const when = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long' }).format(
    new Date(measuredAt),
  );

  return [
    `Lighthouse ha trovato dei problemi sulla pagina ${target.label} (${target.url}), misurati il ${when}.`,
    '',
    ...mobile,
    ...(mobile.length > 0 && desktop.length > 0 ? [''] : []),
    ...desktop,
    '',
    "Cosa voglio da te, in quest'ordine:",
    '1. Apri il codice della pagina e dimmi quali di questi punti sono reali e quali sono rumore di Lighthouse, con il motivo.',
    '2. Ordinali per quanto pesano davvero sulla persona che usa il sito, non per quanto pesano sul punteggio.',
    '3. Per i problemi di accessibilità dimmi anche quale criterio WCAG 2.2 viene violato.',
    '4. Proponi la correzione per ciascuno, indicando file e riga.',
    '',
    'Fermati prima di scrivere codice: voglio approvare cosa tocchiamo.',
  ].join('\n');
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
