const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const decimal = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const giorno = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatEuro(value: number | null): string {
  return value === null ? '—' : euro.format(value);
}

export function formatOre(value: number): string {
  return `${decimal.format(value)} h`;
}

export function formatData(value: string | null): string {
  if (value === null) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : giorno.format(parsed);
}

export function oggi(): string {
  return new Date().toISOString().slice(0, 10);
}

export function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export function optionalField(form: FormData, name: string): string | null {
  const value = field(form, name);
  return value.length === 0 ? null : value;
}

export function numberField(form: FormData, name: string): number | null {
  const value = field(form, name);
  if (value.length === 0) return null;
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function checkboxField(form: FormData, name: string): boolean {
  return form.get(name) !== null;
}
