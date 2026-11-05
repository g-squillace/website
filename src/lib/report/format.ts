const LOCALE = 'it-IT';

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value);
}

export function formatDecimal(value: number, digits = 1): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  if (minutes === 0) return `${rest}s`;
  return `${minutes}m ${String(rest).padStart(2, '0')}s`;
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00.000Z`));
}

export interface Delta {
  ratio: number | null;
  direction: 'up' | 'down' | 'flat';
  label: string;
}

export function delta(current: number, previous: number, lowerIsBetter = false): Delta {
  if (previous === 0) {
    if (current === 0) return { ratio: null, direction: 'flat', label: 'come prima' };
    return { ratio: null, direction: lowerIsBetter ? 'down' : 'up', label: 'nuovo' };
  }
  const ratio = (current - previous) / previous;
  const rounded = Math.abs(ratio) < 0.005 ? 0 : ratio;
  const improving = lowerIsBetter ? rounded < 0 : rounded > 0;
  return {
    ratio: rounded,
    direction: rounded === 0 ? 'flat' : improving ? 'up' : 'down',
    label: `${rounded > 0 ? '+' : ''}${formatPercent(rounded, 0)}`,
  };
}

export function formatHours(value: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(value);
}
