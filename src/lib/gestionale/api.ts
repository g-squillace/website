import {
  amount,
  currentUserId,
  firstRow,
  flag,
  optionalAmount,
  query,
  rows,
  text,
} from './supabase';
import {
  toProgettoStato,
  toProspectStato,
  type Cliente,
  type ClienteInput,
  type Ora,
  type OraInput,
  type Periodo,
  type PeriodoInput,
  type Progetto,
  type ProgettoInput,
  type Prospect,
  type ProspectInput,
  type ProspectStato,
  type Scadenza,
  type ScadenzaInput,
} from './types';

function toCliente(row: Record<string, unknown>): Cliente | null {
  const id = text(row.id);
  const nome = text(row.nome);
  if (id === null || nome === null) return null;
  return { id, nome, email: text(row.email), telefono: text(row.telefono) };
}

function toProgetto(row: Record<string, unknown>): Progetto | null {
  const id = text(row.id);
  const nome = text(row.nome);
  if (id === null || nome === null) return null;
  return {
    id,
    clienteId: text(row.cliente_id),
    nome,
    tipoLavoro: text(row.tipo_lavoro),
    preventivo: optionalAmount(row.preventivo),
    stato: toProgettoStato(row.stato),
    assistenzaAttiva: flag(row.assistenza_attiva),
  };
}

function toPeriodo(row: Record<string, unknown>): Periodo | null {
  const id = text(row.id);
  if (id === null) return null;
  return {
    id,
    monteOre: amount(row.monte_ore),
    canone: amount(row.canone),
    dataInizio: text(row.data_inizio),
  };
}

function toOra(row: Record<string, unknown>): Ora | null {
  const id = text(row.id);
  const periodoId = text(row.periodo_assistenza_id);
  if (id === null || periodoId === null) return null;
  return { id, periodoId, data: text(row.data), ore: amount(row.ore), nota: text(row.nota) };
}

function toScadenza(row: Record<string, unknown>): Scadenza | null {
  const id = text(row.id);
  if (id === null) return null;
  return {
    id,
    descrizione: text(row.descrizione),
    importo: amount(row.importo),
    dataScadenza: text(row.data_scadenza),
  };
}

function collect<T>(payload: unknown, parse: (row: Record<string, unknown>) => T | null): T[] {
  const parsed: T[] = [];
  for (const row of rows(payload)) {
    const item = parse(row);
    if (item !== null) parsed.push(item);
  }
  return parsed;
}

const now = (): string => new Date().toISOString();

export async function fetchClienti(): Promise<Cliente[]> {
  return collect(await query('clienti', { query: { select: '*', order: 'nome.asc' } }), toCliente);
}

export async function fetchCliente(id: string): Promise<Cliente | null> {
  const payload = await query('clienti', { query: { select: '*', id: `eq.${id}`, limit: '1' } });
  const row = firstRow(payload);
  return row === null ? null : toCliente(row);
}

export async function createCliente(input: ClienteInput): Promise<void> {
  await query('clienti', {
    method: 'POST',
    body: {
      nome: input.nome,
      email: input.email,
      telefono: input.telefono,
      user_id: await currentUserId(),
    },
  });
}

export async function updateCliente(id: string, input: ClienteInput): Promise<void> {
  await query('clienti', {
    method: 'PATCH',
    query: { id: `eq.${id}` },
    body: { nome: input.nome, email: input.email, telefono: input.telefono, updated_at: now() },
  });
}

export async function deleteCliente(id: string): Promise<void> {
  await query('clienti', { method: 'DELETE', query: { id: `eq.${id}` } });
}

export async function fetchProgetti(): Promise<Progetto[]> {
  return collect(
    await query('progetti', { query: { select: '*', order: 'created_at.desc' } }),
    toProgetto,
  );
}

export async function fetchProgetto(id: string): Promise<Progetto | null> {
  const payload = await query('progetti', { query: { select: '*', id: `eq.${id}`, limit: '1' } });
  const row = firstRow(payload);
  return row === null ? null : toProgetto(row);
}

function progettoPayload(input: ProgettoInput): Record<string, unknown> {
  return {
    cliente_id: input.clienteId,
    nome: input.nome,
    tipo_lavoro: input.tipoLavoro,
    preventivo: input.preventivo,
    stato: input.stato,
    assistenza_attiva: input.assistenzaAttiva,
  };
}

export async function createProgetto(input: ProgettoInput): Promise<void> {
  await query('progetti', {
    method: 'POST',
    body: { ...progettoPayload(input), user_id: await currentUserId() },
  });
}

export async function updateProgetto(id: string, input: ProgettoInput): Promise<void> {
  await query('progetti', {
    method: 'PATCH',
    query: { id: `eq.${id}` },
    body: { ...progettoPayload(input), updated_at: now() },
  });
}

export async function deleteProgetto(id: string): Promise<void> {
  await query('progetti', { method: 'DELETE', query: { id: `eq.${id}` } });
}

export async function fetchPeriodi(progettoId: string): Promise<Periodo[]> {
  return collect(
    await query('periodi_assistenza', {
      query: { select: '*', progetto_id: `eq.${progettoId}`, order: 'data_inizio.desc' },
    }),
    toPeriodo,
  );
}

export async function fetchOre(periodoIds: string[]): Promise<Ora[]> {
  if (periodoIds.length === 0) return [];
  return collect(
    await query('ore_lavoro', {
      query: {
        select: '*',
        periodo_assistenza_id: `in.(${periodoIds.join(',')})`,
        order: 'data.desc',
      },
    }),
    toOra,
  );
}

export async function createPeriodo(progettoId: string, input: PeriodoInput): Promise<void> {
  await query('periodi_assistenza', {
    method: 'POST',
    body: {
      progetto_id: progettoId,
      monte_ore: input.monteOre,
      canone: input.canone,
      data_inizio: input.dataInizio,
      user_id: await currentUserId(),
    },
  });
}

export async function updatePeriodo(id: string, input: PeriodoInput): Promise<void> {
  await query('periodi_assistenza', {
    method: 'PATCH',
    query: { id: `eq.${id}` },
    body: { monte_ore: input.monteOre, canone: input.canone, data_inizio: input.dataInizio },
  });
}

export async function deletePeriodo(id: string): Promise<void> {
  await query('periodi_assistenza', { method: 'DELETE', query: { id: `eq.${id}` } });
}

export async function createOra(periodoId: string, input: OraInput): Promise<void> {
  await query('ore_lavoro', {
    method: 'POST',
    body: {
      periodo_assistenza_id: periodoId,
      data: input.data,
      ore: input.ore,
      nota: input.nota,
      user_id: await currentUserId(),
    },
  });
}

export async function deleteOra(id: string): Promise<void> {
  await query('ore_lavoro', { method: 'DELETE', query: { id: `eq.${id}` } });
}

export async function fetchScadenze(progettoId: string): Promise<Scadenza[]> {
  return collect(
    await query('scadenze', {
      query: { select: '*', progetto_id: `eq.${progettoId}`, order: 'data_scadenza.asc' },
    }),
    toScadenza,
  );
}

export async function createScadenza(progettoId: string, input: ScadenzaInput): Promise<void> {
  await query('scadenze', {
    method: 'POST',
    body: {
      progetto_id: progettoId,
      descrizione: input.descrizione,
      importo: input.importo,
      data_scadenza: input.dataScadenza,
      user_id: await currentUserId(),
    },
  });
}

export async function updateScadenza(id: string, input: ScadenzaInput): Promise<void> {
  await query('scadenze', {
    method: 'PATCH',
    query: { id: `eq.${id}` },
    body: {
      descrizione: input.descrizione,
      importo: input.importo,
      data_scadenza: input.dataScadenza,
      updated_at: now(),
    },
  });
}

export async function deleteScadenza(id: string): Promise<void> {
  await query('scadenze', { method: 'DELETE', query: { id: `eq.${id}` } });
}

function toProspect(row: Record<string, unknown>): Prospect | null {
  const id = text(row.id);
  const azienda = text(row.azienda);
  const dominio = text(row.dominio);
  if (id === null || azienda === null || dominio === null) return null;
  return {
    id,
    azienda,
    dominio,
    citta: text(row.citta),
    email: text(row.email),
    urlModulo: text(row.url_modulo),
    stato: toProspectStato(row.stato),
    punteggio: amount(row.punteggio),
    tornata: optionalAmount(row.tornata),
    contattatoIl: text(row.contattato_il),
    followUpIl: text(row.follow_up_il),
    rispostoIl: text(row.risposto_il),
    nota: text(row.nota),
    https: flag(row.https),
    wordpress: text(row.wordpress),
    php: text(row.php),
    anniFermo: optionalAmount(row.anni_fermo),
    pesoMb: optionalAmount(row.peso_mb),
    pesoDopoMb: optionalAmount(row.peso_dopo_mb),
    ttfbMs: optionalAmount(row.ttfb_ms),
    caricamentoS: optionalAmount(row.caricamento_s),
  };
}

function prospectBody(input: ProspectInput): Record<string, unknown> {
  return {
    azienda: input.azienda,
    dominio: input.dominio,
    citta: input.citta,
    email: input.email,
    url_modulo: input.urlModulo,
    punteggio: input.punteggio,
    https: input.https,
    wordpress: input.wordpress,
    php: input.php,
    anni_fermo: input.anniFermo,
    peso_mb: input.pesoMb,
    peso_dopo_mb: input.pesoDopoMb,
    ttfb_ms: input.ttfbMs,
    caricamento_s: input.caricamentoS,
  };
}

export async function fetchProspect(): Promise<Prospect[]> {
  return collect(
    await query('prospect', { query: { select: '*', order: 'punteggio.desc,azienda.asc' } }),
    toProspect,
  );
}

export async function createProspect(input: ProspectInput): Promise<void> {
  await query('prospect', {
    method: 'POST',
    body: { ...prospectBody(input), stato: 'segnalato', user_id: await currentUserId() },
  });
}

export async function updateProspect(id: string, input: ProspectInput): Promise<void> {
  await query('prospect', {
    method: 'PATCH',
    query: { id: `eq.${id}` },
    body: { ...prospectBody(input), updated_at: now() },
  });
}

export async function deleteProspect(id: string): Promise<void> {
  await query('prospect', { method: 'DELETE', query: { id: `eq.${id}` } });
}

async function patchProspect(id: string, body: Record<string, unknown>): Promise<void> {
  await query('prospect', {
    method: 'PATCH',
    query: { id: `eq.${id}` },
    body: { ...body, updated_at: now() },
  });
}

export async function accettaProspect(id: string, tornata: number): Promise<void> {
  await patchProspect(id, { stato: 'da_contattare', tornata });
}

export async function scartaProspect(id: string, nota: string | null): Promise<void> {
  await patchProspect(id, { stato: 'chiuso', nota });
}

export async function segnaContattato(id: string, data: string): Promise<void> {
  await patchProspect(id, { stato: 'contattato', contattato_il: data });
}

export async function segnaFollowUp(id: string, data: string): Promise<void> {
  await patchProspect(id, { stato: 'follow_up', follow_up_il: data });
}

export async function segnaRisposta(id: string, data: string, nota: string | null): Promise<void> {
  await patchProspect(id, { stato: 'risposto', risposto_il: data, nota });
}

export async function segnaStallo(id: string): Promise<void> {
  await patchProspect(id, { stato: 'stallo' });
}

export async function cambiaStatoProspect(id: string, stato: ProspectStato): Promise<void> {
  await patchProspect(id, { stato });
}

export async function aggiornaNota(id: string, nota: string | null): Promise<void> {
  await patchProspect(id, { nota });
}

async function ultimaTornata(): Promise<number | null> {
  const payload = await query('prospect', {
    query: { select: 'tornata', tornata: 'not.is.null', order: 'tornata.desc', limit: '1' },
  });
  const row = firstRow(payload);
  return row === null ? null : optionalAmount(row.tornata);
}

export async function tornataDaUsare(apriNuova: boolean): Promise<number> {
  const ultima = await ultimaTornata();
  if (ultima === null) return 1;
  if (apriNuova) return ultima + 1;
  return ultima;
}

export async function creaLavoroDaProspect(prospect: Prospect): Promise<void> {
  const userId = await currentUserId();
  const clientePayload = await query('clienti', {
    method: 'POST',
    expectRows: true,
    body: { nome: prospect.azienda, email: prospect.email, telefono: null, user_id: userId },
  });
  const clienteRow = firstRow(clientePayload);
  const clienteId = clienteRow === null ? null : text(clienteRow.id);
  await query('progetti', {
    method: 'POST',
    body: {
      cliente_id: clienteId,
      nome: `Conversione statica ${prospect.dominio}`,
      tipo_lavoro: 'Conversione WordPress in pagine statiche',
      preventivo: 200,
      stato: 'lead',
      assistenza_attiva: false,
      user_id: userId,
    },
  });
  await patchProspect(prospect.id, { stato: 'chiuso' });
}
