export interface WeekRange {
  start: string;
  end: string;
  label: string;
  shortLabel: string;
  isoWeek: number;
  year: number;
  weeksBack: number;
}

export interface MetricPair {
  current: number;
  previous: number;
}

export interface DailyPoint {
  date: string;
  weekdayLabel: string;
  sessions: number;
  users: number;
  clicks: number;
  impressions: number;
}

export interface NamedRow {
  label: string;
  value: number;
  share: number;
}

export interface PageRow {
  path: string;
  views: number;
  sessions: number;
}

export interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface Opportunity {
  query: string;
  impressions: number;
  clicks: number;
  position: number;
  ctr: number;
  potentialClicks: number;
  reason: string;
  action: string;
}

export interface UpsellSignal {
  service: string;
  href: string;
  impressions: number;
  clicks: number;
  queries: string[];
  pitch: string;
}

export interface TrafficSection {
  sessions: MetricPair;
  users: MetricPair;
  newUsers: MetricPair;
  pageViews: MetricPair;
  engagementRate: MetricPair;
  averageSessionSeconds: MetricPair;
  channels: NamedRow[];
  devices: NamedRow[];
  topPages: PageRow[];
}

export interface SearchSection {
  clicks: MetricPair;
  impressions: MetricPair;
  ctr: MetricPair;
  position: MetricPair;
  topQueries: QueryRow[];
  topPages: PageRow[];
  brandedClicks: number;
  nonBrandedClicks: number;
  freshUntil: string | null;
}

export interface LeadsSection {
  total: MetricPair;
  byEvent: NamedRow[];
  tracked: boolean;
}

export type SourceStatus = 'live' | 'demo' | 'error';

export interface SourceState {
  status: SourceStatus;
  message: string | null;
}

export interface WeeklyReport {
  week: WeekRange;
  previousWeek: WeekRange;
  generatedAt: string;
  leads: LeadsSection;
  traffic: TrafficSection;
  search: SearchSection;
  daily: DailyPoint[];
  opportunities: Opportunity[];
  portfolioOpportunities: Opportunity[];
  invisible: Opportunity[];
  upsell: UpsellSignal[];
  headline: string;
  analyticsSource: SourceState;
  searchSource: SourceState;
}
