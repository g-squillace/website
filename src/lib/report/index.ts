import { fetchAnalytics, propertyId, LEAD_EVENTS, type AnalyticsTotals, type AnalyticsWeek } from './analytics';
import { fetchSearchConsole, siteUrl, type SearchTotals, type SearchWeek } from './search-console';
import { demoAnalytics, demoSearchConsole } from './demo';
import { serviceAccount } from './google';
import { buildHeadline, invisibleQueries, isBranded, strikingDistance, upsellSignals } from './insights';
import { completeWeek, weekDays, weekdayLabel } from './week';
import type { DailyPoint, NamedRow, SourceState, WeeklyReport } from './types';

export { completeWeek } from './week';
export type { WeeklyReport } from './types';

export const MAX_WEEKS_BACK = 25;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Errore sconosciuto';
}

function leadsFromEvents(events: NamedRow[]): { total: number; byEvent: NamedRow[] } {
  const matched = events.filter((event) => LEAD_EVENTS.includes(event.label));
  const total = matched.reduce((sum, event) => sum + event.value, 0);
  return {
    total,
    byEvent: matched.map((event) => ({
      label: event.label,
      value: event.value,
      share: total > 0 ? event.value / total : 0,
    })),
  };
}

export async function buildWeeklyReport(weeksBack: number): Promise<WeeklyReport> {
  const week = completeWeek(new Date(), weeksBack);
  const previousWeek = completeWeek(new Date(), weeksBack + 1);

  const hasCredentials = serviceAccount() !== null;

  let analytics: { current: AnalyticsWeek; previous: AnalyticsTotals; previousEvents: NamedRow[] };
  let analyticsSource: SourceState;
  if (hasCredentials && propertyId() !== null) {
    try {
      analytics = await fetchAnalytics(week, previousWeek);
      analyticsSource = { status: 'live', message: null };
    } catch (error) {
      analytics = demoAnalytics(week);
      analyticsSource = { status: 'error', message: errorMessage(error) };
    }
  } else {
    analytics = demoAnalytics(week);
    analyticsSource = {
      status: 'demo',
      message: 'Dati di esempio: mancano GOOGLE_SERVICE_ACCOUNT_JSON o GA4_PROPERTY_ID.',
    };
  }

  let search: { current: SearchWeek; previous: SearchTotals };
  let searchSource: SourceState;
  if (hasCredentials && siteUrl() !== null) {
    try {
      search = await fetchSearchConsole(week, previousWeek);
      searchSource = { status: 'live', message: null };
    } catch (error) {
      search = demoSearchConsole(week);
      searchSource = { status: 'error', message: errorMessage(error) };
    }
  } else {
    search = demoSearchConsole(week);
    searchSource = {
      status: 'demo',
      message: 'Dati di esempio: mancano GOOGLE_SERVICE_ACCOUNT_JSON o SEARCH_CONSOLE_SITE_URL.',
    };
  }

  const previousLeads = leadsFromEvents(analytics.previousEvents);
  const leads = leadsFromEvents(analytics.current.events);

  const daily: DailyPoint[] = weekDays(week).map((date) => {
    const traffic = analytics.current.daily.get(date);
    const searchDay = search.current.daily.get(date);
    return {
      date,
      weekdayLabel: weekdayLabel(date),
      sessions: traffic?.sessions ?? 0,
      users: traffic?.users ?? 0,
      clicks: searchDay?.clicks ?? 0,
      impressions: searchDay?.impressions ?? 0,
    };
  });

  const queries = search.current.queries;
  const opportunities = strikingDistance(queries);
  const brandedClicks = queries.filter((row) => isBranded(row.query)).reduce((sum, row) => sum + row.clicks, 0);

  return {
    week,
    previousWeek,
    generatedAt: new Date().toISOString(),
    leads: {
      total: { current: leads.total, previous: previousLeads.total },
      byEvent: leads.byEvent,
      tracked: analytics.current.events.some((event) => LEAD_EVENTS.includes(event.label)),
    },
    traffic: {
      sessions: { current: analytics.current.totals.sessions, previous: analytics.previous.sessions },
      users: { current: analytics.current.totals.users, previous: analytics.previous.users },
      newUsers: { current: analytics.current.totals.newUsers, previous: analytics.previous.newUsers },
      pageViews: { current: analytics.current.totals.pageViews, previous: analytics.previous.pageViews },
      engagementRate: {
        current: analytics.current.totals.engagementRate,
        previous: analytics.previous.engagementRate,
      },
      averageSessionSeconds: {
        current: analytics.current.totals.averageSessionSeconds,
        previous: analytics.previous.averageSessionSeconds,
      },
      channels: analytics.current.channels,
      devices: analytics.current.devices,
      topPages: analytics.current.pages,
    },
    search: {
      clicks: { current: search.current.totals.clicks, previous: search.previous.clicks },
      impressions: { current: search.current.totals.impressions, previous: search.previous.impressions },
      ctr: { current: search.current.totals.ctr, previous: search.previous.ctr },
      position: { current: search.current.totals.position, previous: search.previous.position },
      topQueries: [...queries].sort((left, right) => right.clicks - left.clicks || right.impressions - left.impressions).slice(0, 20),
      topPages: search.current.pages.slice(0, 8).map((row) => ({
        path: row.query.replace(/^https?:\/\/[^/]+/, '') || '/',
        views: row.clicks,
        sessions: row.impressions,
      })),
      brandedClicks,
      nonBrandedClicks: Math.max(0, search.current.totals.clicks - brandedClicks),
      freshUntil: search.current.freshUntil,
    },
    daily,
    opportunities,
    invisible: invisibleQueries(queries),
    upsell: upsellSignals(queries),
    headline: buildHeadline(
      leads.total,
      previousLeads.total,
      search.current.totals.clicks,
      search.previous.clicks,
      opportunities[0],
    ),
    analyticsSource,
    searchSource,
  };
}
