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
