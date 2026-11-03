import { jsPDF } from 'jspdf';
import autoTable, { type UserOptions } from 'jspdf-autotable';

const MARGIN = 16;
const BRAND: readonly [number, number, number] = [9, 0, 255];
const TEXT: readonly [number, number, number] = [17, 17, 17];
const MUTED: readonly [number, number, number] = [90, 90, 90];

const giorno = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const decimal = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export interface ReportOreData {
  progettoNome: string;
  tipoLavoro: string | null;
  clienteNome: string | null;
  clienteContatto: string | null;
  monteOre: number;
  dataInizio: string | null;
  ore: ReadonlyArray<{ data: string | null; ore: number; nota: string | null }>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return { ...value };
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function parseReportOreData(value: unknown): ReportOreData | null {
  const body = asRecord(value);
  if (body === null) return null;
  const progettoNome = textOrNull(body.progettoNome);
  if (progettoNome === null) return null;
  const righe: Array<{ data: string | null; ore: number; nota: string | null }> = [];
  if (Array.isArray(body.ore)) {
    for (const entry of body.ore) {
      const riga = asRecord(entry);
      if (riga === null) continue;
      righe.push({
        data: textOrNull(riga.data),
        ore: numberOrZero(riga.ore),
        nota: textOrNull(riga.nota),
      });
    }
  }
  return {
    progettoNome,
    tipoLavoro: textOrNull(body.tipoLavoro),
    clienteNome: textOrNull(body.clienteNome),
    clienteContatto: textOrNull(body.clienteContatto),
    monteOre: numberOrZero(body.monteOre),
    dataInizio: textOrNull(body.dataInizio),
    ore: righe,
  };
}

function formatDate(value: string | null): string {
  if (value === null) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : giorno.format(parsed);
}

function formatHours(value: number): string {
  return `${decimal.format(value)} h`;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function drawTable(doc: jsPDF, options: UserOptions): number {
  let endY = typeof options.startY === 'number' ? options.startY : MARGIN;
  autoTable(doc, {
    ...options,
    didDrawPage: (data) => {
      if (data.cursor) endY = data.cursor.y;
    },
  });
  return endY;
}

function drawFooter(doc: jsPDF, generatedAt: Date): void {
  const pageCount = doc.getNumberOfPages();
  const { width, height } = doc.internal.pageSize;
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`Documento generato il ${formatDate(generatedAt.toISOString())}`, MARGIN, height - 10);
    doc.text(`Pagina ${page} di ${pageCount}`, width - MARGIN, height - 10, { align: 'right' });
  }
}

export function buildReportOreFilename(data: ReportOreData): string {
  const parts = [
    'report-ore',
    data.clienteNome === null ? null : slugify(data.clienteNome),
    slugify(data.progettoNome),
    data.dataInizio === null ? null : data.dataInizio.slice(0, 10),
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);
  return `${parts.join('-')}.pdf`;
}

export function buildReportOrePdf(data: ReportOreData): jsPDF {
  const generatedAt = new Date();
  const consumate = data.ore.reduce((sum, riga) => sum + riga.ore, 0);
  const residue = data.monteOre - consumate;

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const contentWidth = doc.internal.pageSize.width - MARGIN * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
  doc.text('Report ore di assistenza', MARGIN, MARGIN + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(data.progettoNome, MARGIN, MARGIN + 13);

  doc.setDrawColor(BRAND[0], BRAND[1], BRAND[2]);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, MARGIN + 17, MARGIN + contentWidth, MARGIN + 17);

  const anagraficaEndY = drawTable(doc, {
    startY: MARGIN + 23,
    body: [
      ['Cliente', data.clienteNome ?? '—'],
      ['Contatto', data.clienteContatto ?? '—'],
      ['Tipo di lavoro', data.tipoLavoro ?? '—'],
      ['Inizio periodo', formatDate(data.dataInizio)],
    ],
    theme: 'plain',
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 10, cellPadding: { top: 1, right: 2, bottom: 1, left: 0 } },
    columnStyles: {
      0: { cellWidth: 40, textColor: [MUTED[0], MUTED[1], MUTED[2]] },
      1: { textColor: [TEXT[0], TEXT[1], TEXT[2]], fontStyle: 'bold' },
    },
  });

  const riepilogoEndY = drawTable(doc, {
    startY: anagraficaEndY + 6,
    head: [['Monte ore', 'Ore consumate', residue < 0 ? 'Ore eccedenti' : 'Ore residue']],
    body: [[formatHours(data.monteOre), formatHours(consumate), formatHours(Math.abs(residue))]],
    theme: 'grid',
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: [BRAND[0], BRAND[1], BRAND[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: { fontSize: 13, fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { cellWidth: contentWidth / 3 }, 1: { cellWidth: contentWidth / 3 } },
  });

  const righe = [...data.ore]
    .sort((left, right) => (left.data ?? '').localeCompare(right.data ?? ''))
    .map((riga) => [formatDate(riga.data), formatHours(riga.ore), riga.nota ?? '']);

  drawTable(doc, {
    startY: riepilogoEndY + 10,
    head: [['Data', 'Ore', 'Attività']],
    body: righe.length > 0 ? righe : [['—', '—', 'Nessuna ora registrata in questo periodo']],
    foot: [['Totale', formatHours(consumate), '']],
    theme: 'striped',
    showFoot: 'lastPage',
    margin: { left: MARGIN, right: MARGIN, bottom: 20 },
    styles: { fontSize: 10, textColor: [TEXT[0], TEXT[1], TEXT[2]], cellPadding: 2.5 },
    headStyles: {
      fillColor: [BRAND[0], BRAND[1], BRAND[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [250, 246, 243],
      textColor: [TEXT[0], TEXT[1], TEXT[2]],
      fontStyle: 'bold',
    },
    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 22, halign: 'right' } },
  });

  drawFooter(doc, generatedAt);
  return doc;
}

export function downloadReportOrePdf(data: ReportOreData): void {
  buildReportOrePdf(data).save(buildReportOreFilename(data));
}
