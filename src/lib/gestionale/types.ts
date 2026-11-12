export type ProgettoStato =
  | 'lead'
  | 'in_corso'
  | 'completato'
  | 'in_assistenza'
  | 'archiviato';

export const STATI_PROGETTO: ReadonlyArray<{ value: ProgettoStato; label: string }> = [
  { value: 'lead', label: 'Lead' },
  { value: 'in_corso', label: 'In corso' },
  { value: 'completato', label: 'Completato' },
  { value: 'in_assistenza', label: 'In assistenza' },
  { value: 'archiviato', label: 'Archiviato' },
];

export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefono: string | null;
}

export interface Progetto {
  id: string;
  clienteId: string | null;
  nome: string;
  tipoLavoro: string | null;
  preventivo: number | null;
  stato: ProgettoStato;
  assistenzaAttiva: boolean;
}

export interface Periodo {
  id: string;
  monteOre: number;
  canone: number;
  dataInizio: string | null;
}

export interface Ora {
  id: string;
  periodoId: string;
  data: string | null;
  ore: number;
  nota: string | null;
}

export interface Scadenza {
  id: string;
  descrizione: string | null;
  importo: number;
  dataScadenza: string | null;
}

export interface ClienteInput {
  nome: string;
  email: string | null;
  telefono: string | null;
}

export interface ProgettoInput {
  clienteId: string | null;
  nome: string;
  tipoLavoro: string | null;
  preventivo: number | null;
  stato: ProgettoStato;
  assistenzaAttiva: boolean;
}

export interface PeriodoInput {
  monteOre: number;
  canone: number;
  dataInizio: string | null;
}

export interface OraInput {
  data: string | null;
  ore: number;
  nota: string | null;
}

export interface ScadenzaInput {
  descrizione: string | null;
  importo: number;
  dataScadenza: string | null;
}

export function toProgettoStato(value: unknown): ProgettoStato {
  const match = STATI_PROGETTO.find((stato) => stato.value === value);
  return match === undefined ? 'lead' : match.value;
}

export function statoLabel(stato: ProgettoStato): string {
  return STATI_PROGETTO.find((item) => item.value === stato)?.label ?? stato;
}

export type ProspectStato =
  | 'segnalato'
  | 'da_contattare'
  | 'contattato'
  | 'follow_up'
  | 'risposto'
  | 'stallo'
  | 'chiuso';

export const STATI_PROSPECT: ReadonlyArray<{
  value: ProspectStato;
  label: string;
  hint: string;
}> = [
  { value: 'segnalato', label: 'Segnalato', hint: 'Te lo propongo, non lo hai ancora guardato' },
  { value: 'da_contattare', label: 'Da contattare', hint: 'Accettato, in coda per la prossima tornata' },
  { value: 'contattato', label: 'Contattato', hint: 'Prima email partita' },
  { value: 'follow_up', label: 'Follow-up', hint: 'Seconda e ultima email partita' },
  { value: 'risposto', label: 'Risposto', hint: 'Ha risposto: cosa ha detto sta nella nota' },
  { value: 'stallo', label: 'Stallo', hint: 'Nessuna risposta dopo il follow-up' },
  { value: 'chiuso', label: 'Chiuso', hint: 'Finito: diventato lavoro oppure no grazie' },
];

export const GIORNI_PRIMA_DEL_FOLLOW_UP = 12;

export interface Prospect {
  id: string;
  azienda: string;
  dominio: string;
  citta: string | null;
  email: string | null;
  urlModulo: string | null;
  stato: ProspectStato;
  punteggio: number;
  tornata: number | null;
  contattatoIl: string | null;
  followUpIl: string | null;
  rispostoIl: string | null;
  nota: string | null;
  https: boolean;
  wordpress: string | null;
  php: string | null;
  anniFermo: number | null;
  pesoMb: number | null;
  pesoDopoMb: number | null;
  ttfbMs: number | null;
  caricamentoS: number | null;
}

export interface ProspectInput {
  azienda: string;
  dominio: string;
  citta: string | null;
  email: string | null;
  urlModulo: string | null;
  punteggio: number;
  https: boolean;
  wordpress: string | null;
  php: string | null;
  anniFermo: number | null;
  pesoMb: number | null;
  pesoDopoMb: number | null;
  ttfbMs: number | null;
  caricamentoS: number | null;
}

export function toProspectStato(value: unknown): ProspectStato {
  const match = STATI_PROSPECT.find((stato) => stato.value === value);
  return match === undefined ? 'segnalato' : match.value;
}

export function prospectStatoLabel(stato: ProspectStato): string {
  return STATI_PROSPECT.find((item) => item.value === stato)?.label ?? stato;
}

export function scadenzaFollowUp(prospect: Prospect): string | null {
  if (prospect.stato !== 'contattato' || prospect.contattatoIl === null) return null;
  const partenza = new Date(`${prospect.contattatoIl}T00:00:00Z`);
  if (Number.isNaN(partenza.getTime())) return null;
  partenza.setUTCDate(partenza.getUTCDate() + GIORNI_PRIMA_DEL_FOLLOW_UP);
  return partenza.toISOString().slice(0, 10);
}

export function followUpDovuto(prospect: Prospect, oggi: string): boolean {
  const scadenza = scadenzaFollowUp(prospect);
  return scadenza !== null && scadenza <= oggi;
}

export function canaleProspect(prospect: Prospect): { tipo: 'email' | 'modulo' | 'nessuno'; valore: string | null } {
  if (prospect.email !== null) return { tipo: 'email', valore: prospect.email };
  if (prospect.urlModulo !== null) return { tipo: 'modulo', valore: prospect.urlModulo };
  return { tipo: 'nessuno', valore: null };
}
