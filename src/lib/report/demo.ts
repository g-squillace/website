import type { AnalyticsTotals, AnalyticsWeek } from './analytics';
import type { SearchTotals, SearchWeek } from './search-console';
import type { NamedRow, QueryRow, WeekRange } from './types';
import { weekDays } from './week';

function seededRandom(seed: string): () => number {
  let state = 0;
  for (let index = 0; index < seed.length; index += 1) {
    state = (state * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const DEMO_QUERIES: Array<[string, number, number, number]> = [
  ['guido squillace', 34, 61, 1.2],
  ['sviluppatore web frontend firenze', 7, 180, 6.4],
  ['realizzazione sito web siena', 5, 142, 7.8],
  ['quanto costa un sito web professionale', 3, 310, 11.4],
  ['sviluppatore astro italia', 3, 58, 4.1],
  ['migrare wordpress a next js', 2, 96, 9.2],
  ['agenzia datocms', 2, 44, 5.6],
  ['ecommerce su misura senza wordpress', 1, 128, 14.7],
  ['sito accessibile wcag 2.2 agid', 1, 204, 12.9],
  ['automazione intelligenza artificiale piccola impresa', 0, 166, 23.5],
  ['chatbot per sito aziendale costo', 0, 121, 27.1],
  ['gestionale su misura per studio professionale', 0, 88, 31.4],
  ['web app configuratore prodotto', 0, 54, 26.8],
  ['restyling sito lento core web vitals', 0, 73, 18.2],
  ['landing page google ads conversione', 0, 41, 21.6],
  ['sito vetrina artigiano prezzo', 0, 92, 24.3],
];

function demoQueries(random: () => number): QueryRow[] {
  return DEMO_QUERIES.map(([query, clicks, impressions, position]) => {
    const jitter = 0.8 + random() * 0.4;
    const scaledImpressions = Math.round(impressions * jitter);
    const scaledClicks = Math.round(clicks * jitter);
    return {
      query,
      clicks: scaledClicks,
      impressions: scaledImpressions,
      ctr: scaledImpressions > 0 ? scaledClicks / scaledImpressions : 0,
      position: Number((position * (0.95 + random() * 0.1)).toFixed(1)),
    };
  });
}

export function demoAnalytics(
  week: WeekRange,
): { current: AnalyticsWeek; previous: AnalyticsTotals; previousEvents: NamedRow[] } {
  const random = seededRandom(week.start);
  const days = weekDays(week);
  const daily = new Map<string, { sessions: number; users: number }>();
  let sessions = 0;
  let users = 0;
  for (const day of days) {
    const weekday = new Date(`${day}T00:00:00.000Z`).getUTCDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.45 : 1;
    const daySessions = Math.round((28 + random() * 26) * weekendFactor);
    const dayUsers = Math.round(daySessions * (0.78 + random() * 0.12));
    daily.set(day, { sessions: daySessions, users: dayUsers });
    sessions += daySessions;
    users += dayUsers;
  }

  return {
    current: {
      totals: {
        sessions,
        users,
        newUsers: Math.round(users * 0.72),
        pageViews: Math.round(sessions * 2.3),
        engagementRate: 0.58 + random() * 0.08,
        averageSessionSeconds: 74 + random() * 40,
      },
      daily,
      channels: [
        { label: 'Organic Search', value: Math.round(sessions * 0.54), share: 0.54 },
        { label: 'Direct', value: Math.round(sessions * 0.26), share: 0.26 },
        { label: 'Referral', value: Math.round(sessions * 0.12), share: 0.12 },
        { label: 'Organic Social', value: Math.round(sessions * 0.08), share: 0.08 },
      ],
      devices: [
        { label: 'mobile', value: Math.round(sessions * 0.61), share: 0.61 },
        { label: 'desktop', value: Math.round(sessions * 0.35), share: 0.35 },
        { label: 'tablet', value: Math.round(sessions * 0.04), share: 0.04 },
      ],
      pages: [
        { path: '/', views: Math.round(sessions * 0.92), sessions: Math.round(sessions * 0.58) },
        { path: '/servizi', views: Math.round(sessions * 0.44), sessions: Math.round(sessions * 0.21) },
        { path: '/lavori', views: Math.round(sessions * 0.33), sessions: Math.round(sessions * 0.14) },
        { path: '/intelligenza-artificiale', views: Math.round(sessions * 0.28), sessions: Math.round(sessions * 0.17) },
        { path: '/contatti', views: Math.round(sessions * 0.19), sessions: Math.round(sessions * 0.05) },
        { path: '/chi-sono', views: Math.round(sessions * 0.16), sessions: Math.round(sessions * 0.06) },
      ],
      events: [
        { label: 'page_view', value: Math.round(sessions * 2.3), share: 0.6 },
        { label: 'session_start', value: sessions, share: 0.27 },
        { label: 'generate_lead', value: 2 + Math.round(random() * 2), share: 0.01 },
        { label: 'email_click', value: 1 + Math.round(random() * 3), share: 0.01 },
      ],
    },
    previous: {
      sessions: Math.round(sessions * (0.82 + random() * 0.2)),
      users: Math.round(users * (0.84 + random() * 0.18)),
      newUsers: Math.round(users * 0.63),
      pageViews: Math.round(sessions * 2.1),
      engagementRate: 0.55,
      averageSessionSeconds: 69,
    },
    previousEvents: [
      { label: 'generate_lead', value: 1 + Math.round(random() * 2), share: 0.5 },
      { label: 'email_click', value: 1 + Math.round(random() * 2), share: 0.5 },
    ],
  };
}

export function demoSearchConsole(week: WeekRange): { current: SearchWeek; previous: SearchTotals } {
  const random = seededRandom(`${week.start}-gsc`);
  const queries = demoQueries(random);
  const days = weekDays(week);
  const daily = new Map<string, { clicks: number; impressions: number }>();
  for (const day of days) {
    daily.set(day, {
      clicks: Math.round(4 + random() * 9),
      impressions: Math.round(180 + random() * 220),
    });
  }
  const clicks = [...daily.values()].reduce((sum, row) => sum + row.clicks, 0);
  const impressions = [...daily.values()].reduce((sum, row) => sum + row.impressions, 0);

  return {
    current: {
      totals: { clicks, impressions, ctr: clicks / impressions, position: 14.2 },
      queries,
      pages: [
        { query: 'https://www.guidosquillace.it/', clicks: Math.round(clicks * 0.46), impressions: Math.round(impressions * 0.38), ctr: 0.04, position: 9.1 },
        { query: 'https://www.guidosquillace.it/servizi', clicks: Math.round(clicks * 0.24), impressions: Math.round(impressions * 0.27), ctr: 0.03, position: 13.4 },
        { query: 'https://www.guidosquillace.it/intelligenza-artificiale', clicks: Math.round(clicks * 0.17), impressions: Math.round(impressions * 0.2), ctr: 0.028, position: 17.8 },
        { query: 'https://www.guidosquillace.it/lavori', clicks: Math.round(clicks * 0.13), impressions: Math.round(impressions * 0.15), ctr: 0.025, position: 19.2 },
      ],
      daily,
      freshUntil: days[5] ?? null,
    },
    previous: {
      clicks: Math.round(clicks * (0.78 + random() * 0.25)),
      impressions: Math.round(impressions * (0.85 + random() * 0.2)),
      ctr: 0.031,
      position: 15.1,
    },
  };
}
