import { readFileSync } from 'node:fs';
import { BOOKING, REPORT } from '../src/config.ts';

type Ability = 'nessun-accesso' | 'solo-lettura' | 'lettura-e-scrittura';

interface Probe {
  id: string;
  ability: Ability;
  detail: string;
}

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

function loadCredentials(path: string | undefined): string {
  if (path === undefined) {
    const fromEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (typeof fromEnv === 'string' && fromEnv.trim() !== '') return fromEnv;
    fail(
      'Nessuna credenziale. Passa il file della chiave:\n  npm run calendario -- ~/Downloads/chiave.json ID1 ID2',
    );
  }
  try {
    return readFileSync(path, 'utf8');
  } catch {
    fail(`Non riesco a leggere ${path}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readIdentity(blob: string): { email: string; projectId: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(blob);
  } catch {
    fail('Il file non contiene JSON valido');
  }
  if (!isRecord(parsed)) fail('Il file non contiene un oggetto JSON');
  const email = parsed.client_email;
  const projectId = parsed.project_id;
  if (typeof email !== 'string') fail('Manca client_email nella chiave');
  return { email, projectId: typeof projectId === 'string' ? projectId : 'sconosciuto' };
}

function isSiteList(value: unknown): value is { siteEntry?: { siteUrl?: string }[] } {
  return isRecord(value);
}

function shorten(error: unknown, length: number): string {
  return String(error).replace(/\s+/g, ' ').slice(0, length);
}

const credentialPath = process.argv[2];
const requestedIds = process.argv.slice(3).filter((value) => value.includes('@'));
const blob = loadCredentials(credentialPath);
const identity = readIdentity(blob);

process.env.GOOGLE_SERVICE_ACCOUNT_JSON = blob;
const { CALENDAR_SCOPES, REPORT_SCOPES, accessToken, googleGet, googlePost } = await import(
  '../src/lib/report/google.ts'
);

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

function freeBusyError(payload: unknown, id: string): string | null {
  if (!isRecord(payload)) return 'risposta non riconosciuta';
  const calendars = payload.calendars;
  if (!isRecord(calendars)) return 'risposta senza calendari';
  const entry = calendars[id];
  if (!isRecord(entry)) return 'calendario assente dalla risposta';
  const errors = entry.errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const first: unknown = errors[0];
  if (isRecord(first) && typeof first.reason === 'string') return first.reason;
  return 'accesso negato';
}

async function readError(id: string): Promise<string | null> {
  const now = new Date();
  const payload = await googlePost(
    `${CALENDAR_API}/freeBusy`,
    {
      timeMin: now.toISOString(),
      timeMax: new Date(now.getTime() + 86_400_000).toISOString(),
      items: [{ id }],
    },
    CALENDAR_SCOPES,
  );
  return freeBusyError(payload, id);
}

async function writeError(id: string): Promise<string | null> {
  const start = new Date(Date.now() + 400 * 86_400_000);
  const end = new Date(start.getTime() + 600_000);
  let created: unknown;
  try {
    created = await googlePost(
      `${CALENDAR_API}/calendars/${encodeURIComponent(id)}/events`,
      {
        summary: 'Prova di scrittura dal sito',
        status: 'tentative',
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
      CALENDAR_SCOPES,
    );
  } catch (error) {
    return shorten(error, 160);
  }
  if (!isRecord(created) || typeof created.id !== 'string') return null;
  const token = await accessToken(CALENDAR_SCOPES);
  await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(id)}/events/${encodeURIComponent(created.id)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );
  return null;
}

async function probe(id: string): Promise<Probe> {
  try {
    const cannotRead = await readError(id);
    if (cannotRead !== null) return { id, ability: 'nessun-accesso', detail: cannotRead };
    const cannotWrite = await writeError(id);
    if (cannotWrite !== null) return { id, ability: 'solo-lettura', detail: cannotWrite };
    return { id, ability: 'lettura-e-scrittura', detail: '' };
  } catch (error) {
    const text = shorten(error, 240);
    if (text.includes('has not been used in project') || text.includes('SERVICE_DISABLED')) {
      fail(
        `La Google Calendar API non è attiva. Attivala qui e riprova fra un minuto:\n  https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=${identity.projectId}`,
      );
    }
    return { id, ability: 'nessun-accesso', detail: text };
  }
}

console.log(`\n  Service account   ${identity.email}`);
console.log(`  Progetto Google   ${identity.projectId}\n`);

try {
  const sites = await googleGet('https://www.googleapis.com/webmasters/v3/sites', REPORT_SCOPES);
  const urls = isSiteList(sites) ? (sites.siteEntry ?? []).map((entry) => entry.siteUrl) : [];
  console.log(
    urls.includes(REPORT.searchConsoleSiteUrl)
      ? `  ✓ È il service account del sito: vede ${REPORT.searchConsoleSiteUrl}`
      : `  · Non vede ${REPORT.searchConsoleSiteUrl} in Search Console`,
  );
} catch (error) {
  console.log(`  · Search Console non raggiungibile (${shorten(error, 80)})`);
}

const ids = requestedIds.length > 0 ? requestedIds : [BOOKING.calendarId, ...BOOKING.busyCalendarIds].filter((id) => id.trim() !== '');

if (ids.length === 0) {
  console.log('\n  Dimmi quali calendari provare. Gli ID stanno in Google Calendar,');
  console.log('  Impostazioni → nome del calendario → Integra calendario → ID calendario:\n');
  console.log(`    npm run calendario -- ${credentialPath ?? 'chiave.json'} ID1 ID2\n`);
  process.exit(0);
}

console.log('\n  Calendari provati:\n');
const probes: Probe[] = [];
for (const id of ids) {
  const result = await probe(id);
  probes.push(result);
  console.log(`  ${id}`);
  if (result.ability === 'nessun-accesso') {
    console.log(`    ✗ non lo vede: la condivisione non è arrivata (${result.detail})\n`);
  } else if (result.ability === 'solo-lettura') {
    console.log('    ✓ legge libero/occupato');
    console.log('    · non può creare eventi: va bene come calendario degli impegni\n');
  } else {
    console.log('    ✓ legge libero/occupato');
    console.log('    ✓ crea e cancella eventi: va bene come calendario delle call\n');
  }
}

const target = probes.find((entry) => entry.ability === 'lettura-e-scrittura');
if (target === undefined) {
  console.log('  Nessun calendario su cui il sito possa scrivere, quindi non può prenotare.');
  console.log('  Sul calendario delle call scegli «Apportare modifiche agli eventi».\n');
  process.exit(1);
}

const others = probes
  .filter((entry) => entry.id !== target.id && entry.ability !== 'nessun-accesso')
  .map((entry) => entry.id);

if (BOOKING.calendarId !== target.id || !others.every((id) => BOOKING.busyCalendarIds.includes(id))) {
  console.log('  Da incollare in src/config.ts, dentro BOOKING:\n');
  console.log(`    calendarId: '${target.id}',`);
  console.log(
    others.length === 0
      ? `    busyCalendarIds: [] as ReadonlyArray<string>,\n`
      : `    busyCalendarIds: [${others.map((id) => `'${id}'`).join(', ')}] as ReadonlyArray<string>,\n`,
  );
  process.exit(0);
}

console.log('  Il config è già allineato. Orari che il sito offrirebbe adesso:\n');

const { availability } = await import('../src/lib/booking/availability.ts');
const offer = await availability();

if (offer.days.length === 0) {
  console.log('  Nessuno. Allarga le fasce in BOOKING.windows oppure libera il calendario.\n');
  process.exit(0);
}

const dayLabel = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: BOOKING.timeZone,
});
const hourLabel = new Intl.DateTimeFormat('it-IT', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: BOOKING.timeZone,
});

for (const day of offer.days) {
  const first = day.slots.at(0);
  if (first === undefined) continue;
  const hours = day.slots.map((slot) => hourLabel.format(new Date(slot.start))).join('  ');
  console.log(`  ${dayLabel.format(new Date(first.start))}`);
  console.log(`    ${hours}\n`);
}

console.log(`  ${offer.slots.length} orari su ${offer.days.length} giorni.\n`);
