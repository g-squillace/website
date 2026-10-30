type EnvRecord = Record<string, string | undefined>;

function sources(): EnvRecord[] {
  const fromImportMeta: EnvRecord =
    typeof import.meta.env === 'object' && import.meta.env !== null
      ? (import.meta.env as unknown as EnvRecord)
      : {};
  const fromProcess: EnvRecord =
    typeof process !== 'undefined' && typeof process.env === 'object' && process.env !== null
      ? (process.env as EnvRecord)
      : {};
  return [fromProcess, fromImportMeta];
}

export function readEnv(name: string): string | null {
  for (const source of sources()) {
    const value = source[name];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return null;
}

export function requireEnv(name: string): string {
  const value = readEnv(name);
  if (value === null) throw new Error(`Variabile d'ambiente mancante: ${name}`);
  return value;
}
