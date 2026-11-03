import { SUPABASE } from '../../config';
import { describeEnv, readEnv, type EnvPresence } from '../report/env';

export class SupabaseError extends Error {}

interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

let cachedSession: Session | null = null;

const REQUIRED_VARS = ['SUPABASE_ANON_KEY', 'SUPABASE_EMAIL', 'SUPABASE_PASSWORD'] as const;

export function missingSupabaseVars(): Array<{ name: string; presence: EnvPresence }> {
  return REQUIRED_VARS.filter((name) => readEnv(name) === null).map((name) => ({
    name,
    presence: describeEnv(name),
  }));
}

export function supabaseConfigured(): boolean {
  return missingSupabaseVars().length === 0;
}

function requireEnv(name: string): string {
  const value = readEnv(name);
  if (value === null) {
    throw new SupabaseError(`Manca la variabile d'ambiente ${name}.`);
  }
  return value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return { ...value };
}

function describeFailure(payload: unknown, fallback: string): string {
  const body = asRecord(payload);
  if (body === null) return fallback;
  const parts: string[] = [];
  for (const key of ['message', 'error_description', 'error', 'details', 'hint']) {
    const value = body[key];
    if (typeof value === 'string' && value.length > 0 && !parts.includes(value)) {
      parts.push(value);
    }
  }
  if (parts.length === 0) return fallback;
  const code = body.code;
  const text = parts.join(' — ');
  return typeof code === 'string' ? `${text} (${code})` : text;
}

function readSessionPayload(payload: unknown): Session | null {
  const body = asRecord(payload);
  if (body === null) return null;
  const user = asRecord(body.user);
  if (user === null) return null;
  const token = body.access_token;
  const userId = user.id;
  const expiresIn = body.expires_in;
  if (typeof token !== 'string' || typeof userId !== 'string') return null;
  const lifetime = typeof expiresIn === 'number' ? expiresIn : 3600;
  return { token, userId, expiresAt: Date.now() + lifetime * 1000 };
}

async function signIn(): Promise<Session> {
  const response = await fetch(`${SUPABASE.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: requireEnv('SUPABASE_ANON_KEY'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: requireEnv('SUPABASE_EMAIL'),
      password: requireEnv('SUPABASE_PASSWORD'),
    }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new SupabaseError(describeFailure(payload, 'Accesso a Supabase non riuscito.'));
  }
  const session = readSessionPayload(payload);
  if (session === null) {
    throw new SupabaseError('Supabase ha risposto senza un token di accesso valido.');
  }
  return session;
}

async function currentSession(): Promise<Session> {
  if (cachedSession !== null && cachedSession.expiresAt > Date.now() + 60_000) {
    return cachedSession;
  }
  cachedSession = await signIn();
  return cachedSession;
}

export async function currentUserId(): Promise<string> {
  return (await currentSession()).userId;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  query?: Record<string, string>;
  body?: unknown;
  expectRows?: boolean;
}

async function send(table: string, options: RequestOptions, session: Session): Promise<Response> {
  const url = new URL(`${SUPABASE.url}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    url.searchParams.set(key, value);
  }
  const headers: Record<string, string> = {
    apikey: requireEnv('SUPABASE_ANON_KEY'),
    Authorization: `Bearer ${session.token}`,
    Accept: 'application/json',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  headers.Prefer = options.expectRows === true ? 'return=representation' : 'return=minimal';
  return fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

export async function query(table: string, options: RequestOptions = {}): Promise<unknown> {
  let session = await currentSession();
  let response = await send(table, options, session);
  if (response.status === 401) {
    cachedSession = null;
    session = await currentSession();
    response = await send(table, options, session);
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    if (!response.ok) {
      throw new SupabaseError(`Supabase ha risposto ${response.status}.`);
    }
    return null;
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new SupabaseError(
      describeFailure(payload, `Supabase ha risposto ${response.status}.`),
    );
  }
  return payload;
}

export function rows(payload: unknown): Record<string, unknown>[] {
  if (!Array.isArray(payload)) return [];
  const parsed: Record<string, unknown>[] = [];
  for (const entry of payload) {
    const row = asRecord(entry);
    if (row !== null) parsed.push(row);
  }
  return parsed;
}

export function firstRow(payload: unknown): Record<string, unknown> | null {
  return rows(payload)[0] ?? asRecord(payload);
}

export function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function amount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function optionalAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return amount(value);
}

export function flag(value: unknown): boolean {
  return value === true;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof SupabaseError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
