import { readEnv } from './env';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
].join(' ');

interface ServiceAccount {
  clientEmail: string;
  privateKey: string;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

function decodeCredentialsBlob(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) return trimmed;
  try {
    return atob(trimmed);
  } catch {
    return trimmed;
  }
}

function isCredentialsShape(value: unknown): value is { client_email: string; private_key: string } {
  if (typeof value !== 'object' || value === null) return false;
  const candidate: Record<string, unknown> = { ...value };
  return typeof candidate.client_email === 'string' && typeof candidate.private_key === 'string';
}

export function serviceAccount(): ServiceAccount | null {
  const blob = readEnv('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (blob !== null) {
    try {
      const parsed: unknown = JSON.parse(decodeCredentialsBlob(blob));
      if (isCredentialsShape(parsed)) {
        return { clientEmail: parsed.client_email, privateKey: parsed.private_key };
      }
    } catch {
      return null;
    }
    return null;
  }
  const email = readEnv('GOOGLE_CLIENT_EMAIL');
  const key = readEnv('GOOGLE_PRIVATE_KEY');
  if (email === null || key === null) return null;
  return { clientEmail: email, privateKey: key };
}

function base64Url(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalised = pem.replace(/\\n/g, '\n');
  const body = normalised
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return bytes.buffer;
}

function isTokenResponse(value: unknown): value is { access_token: string; expires_in: number } {
  if (typeof value !== 'object' || value === null) return false;
  const candidate: Record<string, unknown> = { ...value };
  return typeof candidate.access_token === 'string';
}

export async function accessToken(): Promise<string> {
  if (cachedToken !== null && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const account = serviceAccount();
  if (account === null) throw new Error('Credenziali Google non configurate');

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(
    JSON.stringify({
      iss: account.clientEmail,
      scope: SCOPES,
      aud: TOKEN_ENDPOINT,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(account.privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const assertion = `${header}.${claims}.${base64Url(signature)}`;

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Autenticazione Google fallita (${response.status}): ${await response.text()}`);
  }

  const payload: unknown = await response.json();
  if (!isTokenResponse(payload)) throw new Error('Risposta token Google non valida');

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + (typeof payload.expires_in === 'number' ? payload.expires_in : 3600) * 1000,
  };
  return cachedToken.value;
}

export async function googlePost(url: string, body: unknown): Promise<unknown> {
  const token = await accessToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Google API ${response.status}: ${(await response.text()).slice(0, 400)}`);
  }
  return response.json();
}
