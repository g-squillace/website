import { googlePost } from './google';
import { readEnv } from './env';
import { REPORT } from '../../config';
import type { NamedRow, PageRow, WeekRange } from './types';

const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';

export const LEAD_EVENTS = ['generate_lead', 'contact_email_click', 'email_click', 'contact'];

interface ReportRow {
  dimensions: string[];
  metrics: number[];
}

export interface AnalyticsTotals {
  sessions: number;
  users: number;
  newUsers: number;
  pageViews: number;
  engagementRate: number;
  averageSessionSeconds: number;
}

export interface AnalyticsWeek {
  totals: AnalyticsTotals;
  daily: Map<string, { sessions: number; users: number }>;
  channels: NamedRow[];
  devices: NamedRow[];
  pages: PageRow[];
  events: NamedRow[];
}

export function propertyId(): string | null {
  const raw = readEnv('GA4_PROPERTY_ID') ?? REPORT.ga4PropertyId;
  if (raw === '') return null;
  return raw.replace(/^properties\//, '');
}

function readRows(report: unknown): ReportRow[] {
  if (typeof report !== 'object' || report === null) return [];
  const rows: unknown = Reflect.get(report, 'rows');
  if (!Array.isArray(rows)) return [];
  const parsed: ReportRow[] = [];
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue;
    const dimensionValues: unknown = Reflect.get(row, 'dimensionValues');
    const metricValues: unknown = Reflect.get(row, 'metricValues');
    const dimensions: string[] = [];
    const metrics: number[] = [];
    if (Array.isArray(dimensionValues)) {
      for (const item of dimensionValues) {
        const value: unknown = typeof item === 'object' && item !== null ? Reflect.get(item, 'value') : null;
        dimensions.push(typeof value === 'string' ? value : '');
      }
    }
    if (Array.isArray(metricValues)) {
      for (const item of metricValues) {
        const value: unknown = typeof item === 'object' && item !== null ? Reflect.get(item, 'value') : null;
        metrics.push(typeof value === 'string' ? Number.parseFloat(value) || 0 : 0);
      }
    }
    parsed.push({ dimensions, metrics });
  }
  return parsed;
}

function readBatch(payload: unknown): unknown[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const reports: unknown = Reflect.get(payload, 'reports');
  return Array.isArray(reports) ? reports : [];
}

function toNamedRows(rows: ReportRow[], limit: number): NamedRow[] {
  const total = rows.reduce((sum, row) => sum + (row.metrics[0] ?? 0), 0);
  return rows
    .map((row) => ({
      label: row.dimensions[0] || '(non impostato)',
      value: row.metrics[0] ?? 0,
      share: total > 0 ? (row.metrics[0] ?? 0) / total : 0,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, limit);
}

function emptyTotals(): AnalyticsTotals {
  return {
    sessions: 0,
    users: 0,
    newUsers: 0,
    pageViews: 0,
    engagementRate: 0,
    averageSessionSeconds: 0,
  };
}

function totalsFromRows(rows: ReportRow[]): AnalyticsTotals {
  const row = rows[0];
  if (row === undefined) return emptyTotals();
  return {
    sessions: row.metrics[0] ?? 0,
    users: row.metrics[1] ?? 0,
    newUsers: row.metrics[2] ?? 0,
    pageViews: row.metrics[3] ?? 0,
    engagementRate: row.metrics[4] ?? 0,
    averageSessionSeconds: row.metrics[5] ?? 0,
  };
}

function ga4DateToIso(value: string): string {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

const TOTALS_METRICS = [
  { name: 'sessions' },
  { name: 'totalUsers' },
  { name: 'newUsers' },
  { name: 'screenPageViews' },
  { name: 'engagementRate' },
  { name: 'averageSessionDuration' },
];

export async function fetchAnalytics(
  week: WeekRange,
  previous: WeekRange,
): Promise<{ current: AnalyticsWeek; previous: AnalyticsTotals; previousEvents: NamedRow[] }> {
  const property = propertyId();
  if (property === null) throw new Error("GA4_PROPERTY_ID non è configurata");

  const url = `${DATA_API}/properties/${property}:batchRunReports`;
  const currentRange = [{ startDate: week.start, endDate: week.end }];

  const [primary, secondary] = await Promise.all([
    googlePost(url, {
      requests: [
        { dateRanges: currentRange, dimensions: [{ name: 'date' }], metrics: [{ name: 'sessions' }, { name: 'totalUsers' }], limit: 40 },
        { dateRanges: currentRange, metrics: TOTALS_METRICS },
        { dateRanges: currentRange, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], limit: 12 },
        { dateRanges: currentRange, dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 15 },
        { dateRanges: currentRange, dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], limit: 60 },
      ],
    }),
    googlePost(url, {
      requests: [
        { dateRanges: currentRange, dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }], limit: 6 },
        { dateRanges: [{ startDate: previous.start, endDate: previous.end }], metrics: TOTALS_METRICS },
        { dateRanges: [{ startDate: previous.start, endDate: previous.end }], dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], limit: 60 },
      ],
    }),
  ]);

  const primaryReports = readBatch(primary);
  const secondaryReports = readBatch(secondary);

  const daily = new Map<string, { sessions: number; users: number }>();
  for (const row of readRows(primaryReports[0])) {
    daily.set(ga4DateToIso(row.dimensions[0] ?? ''), {
      sessions: row.metrics[0] ?? 0,
      users: row.metrics[1] ?? 0,
    });
  }

  const pages: PageRow[] = readRows(primaryReports[3]).map((row) => ({
    path: row.dimensions[0] || '/',
    views: row.metrics[0] ?? 0,
    sessions: row.metrics[1] ?? 0,
  }));

  return {
    current: {
      totals: totalsFromRows(readRows(primaryReports[1])),
      daily,
      channels: toNamedRows(readRows(primaryReports[2]), 8),
      devices: toNamedRows(readRows(secondaryReports[0]), 4),
      pages,
      events: toNamedRows(readRows(primaryReports[4]), 60),
    },
    previous: totalsFromRows(readRows(secondaryReports[1])),
    previousEvents: toNamedRows(readRows(secondaryReports[2]), 60),
  };
}
