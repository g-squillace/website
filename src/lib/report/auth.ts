import type { AstroCookies } from 'astro';
import { PRIVATE_AREA } from '../../config';
import { readEnv } from './env';

export const SESSION_COOKIE = 'gs_report_session';

const DEFAULT_USER = 'guido';

const SESSION_HOURS = 12;
const encoder = new TextEncoder();

interface SessionPayload {
  user: string;
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

function sessionSecret(): string {
  const explicit = readEnv('REPORT_SESSION_SECRET');
  if (explicit !== null) return explicit;
  return `fallback:${expectedUser()}:${readEnv('REPORT_PASSWORD') ?? ''}`;
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== 'object' || value === null) return false;
  const candidate: Record<string, unknown> = { ...value };
  return typeof candidate.user === 'string' && typeof candidate.exp === 'number';
}

function expectedUser(): string {
  return readEnv('REPORT_USER') ?? DEFAULT_USER;
}

export function missingCredentialVars(): string[] {
  return ['REPORT_PASSWORD', 'REPORT_SESSION_SECRET'].filter((name) => readEnv(name) === null);
}

export function credentialsConfigured(): boolean {
  return readEnv('REPORT_PASSWORD') !== null;
}

export function verifyCredentials(user: string, password: string): boolean {
  const expectedPassword = readEnv('REPORT_PASSWORD');
  if (expectedPassword === null) return false;
  const userMatches = constantTimeEquals(user.trim().toLowerCase(), expectedUser().toLowerCase());
  const passwordMatches = constantTimeEquals(password, expectedPassword);
  return userMatches && passwordMatches;
}

export async function createSessionToken(user: string): Promise<string> {
  const payload: SessionPayload = {
    user,
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await sign(body);
  return `${body}.${signature}`;
}

export async function readSession(token: string | undefined): Promise<SessionPayload | null> {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const separator = token.lastIndexOf('.');
  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = await sign(body);
  if (!constantTimeEquals(signature, expected)) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(base64UrlDecode(body)));
    if (!isSessionPayload(parsed)) return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionCookie(cookies: AstroCookies, token: string, secure: boolean): void {
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function isAuthenticated(cookies: AstroCookies): Promise<boolean> {
  const session = await readSession(cookies.get(SESSION_COOKIE)?.value);
  return session !== null;
}

export function safeRedirect(value: string | null): string | null {
  if (value === null || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export function loginPath(url: URL): string {
  const target = `${url.pathname}${url.search}`;
  if (target === PRIVATE_AREA.path) return PRIVATE_AREA.loginPath;
  return `${PRIVATE_AREA.loginPath}?vai=${encodeURIComponent(target)}`;
}
