import { CONTACT, SITE } from '../../config';
import type { Prospect } from './types';

export interface BozzaEmail {
  oggetto: string;
  corpo: string;
}

interface Fatto {
  peso: number;
  etichetta: string;
  testo: string;
}

const DOMINIO = SITE.url.replace('https://www.', '');

const FIRMA = [
  '--',
  'Guido Squillace — sviluppatore web frontend',
  `${DOMINIO} · ${CONTACT.email}`,
  'Se preferisce non ricevere altri messaggi da me, basta rispondere «no grazie» e non la disturbo più.',
].join('\n');

const MASSIMO_FATTI = 3;

const numero = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });

const USCITA_WORDPRESS: Record<string, number> = {
  '4.0': 2014, '4.1': 2014, '4.2': 2015, '4.3': 2015, '4.4': 2015,
  '4.5': 2016, '4.6': 2016, '4.7': 2016, '4.8': 2017, '4.9': 2017,
  '5.0': 2018, '5.1': 2019, '5.2': 2019, '5.3': 2019, '5.4': 2020,
  '5.5': 2020, '5.6': 2020, '5.7': 2021, '5.8': 2021, '5.9': 2022,
  '6.0': 2022, '6.1': 2022, '6.2': 2023, '6.3': 2023, '6.4': 2023,
  '6.5': 2024, '6.6': 2024, '6.7': 2024, '6.8': 2025, '6.9': 2025,
  '7.0': 2026, '7.1': 2026,
};

const FINE_SUPPORTO_PHP: Record<string, number> = {
  '5.3': 2014, '5.4': 2015, '5.5': 2016, '5.6': 2018,
  '7.0': 2019, '7.1': 2019, '7.2': 2020, '7.3': 2021, '7.4': 2022,
  '8.0': 2023, '8.1': 2025, '8.2': 2026,
};

function ramo(valore: string | null): string | null {
  if (valore === null) return null;
  const match = valore.match(/(\d+)\.(\d+)/);
  return match === null ? null : `${match[1]}.${match[2]}`;
}

function versionePulita(valore: string | null): string | null {
  if (valore === null) return null;
  const match = valore.match(/(\d+\.\d+(?:\.\d+)?)/);
  return match === null ? null : (match[1] ?? null);
}

function fatti(prospect: Prospect): Fatto[] {
  const elenco: Fatto[] = [];

  if (!prospect.https) {
    elenco.push({
      peso: 100,
      etichetta: 'al vostro sito manca il certificato HTTPS',
      testo:
        'Il sito non ha il certificato HTTPS: Chrome e Safari scrivono «Non sicuro» accanto all’indirizzo a chiunque lo apra, e Google penalizza nei risultati i siti che ne sono sprovvisti.',
    });
  }

  const php = versionePulita(prospect.php);
  const ramoPhp = ramo(prospect.php);
  const finePhp = ramoPhp === null ? undefined : FINE_SUPPORTO_PHP[ramoPhp];
  if (php !== null && finePhp !== undefined) {
    elenco.push({
      peso: 90,
      etichetta: `il server gira su PHP ${php}, fuori supporto dal ${finePhp}`,
      testo: `Il server usa PHP ${php}, fuori supporto dal ${finePhp}: da allora le falle scoperte non vengono più chiuse.`,
    });
  }

  const wordpress = versionePulita(prospect.wordpress);
  const ramoWp = ramo(prospect.wordpress);
  const annoWp = ramoWp === null ? undefined : USCITA_WORDPRESS[ramoWp];
  if (wordpress !== null && annoWp !== undefined && annoWp <= 2023) {
    elenco.push({
      peso: 85,
      etichetta: `il sito gira su WordPress ${wordpress}, del ${annoWp}`,
      testo: `Il sito gira su WordPress ${wordpress}, uscito nel ${annoWp}, che non riceve più aggiornamenti di sicurezza.`,
    });
  }

  if (prospect.ttfbMs !== null && prospect.ttfbMs >= 2500) {
    const secondi = numero.format(Math.round(prospect.ttfbMs / 100) / 10);
    elenco.push({
      peso: 80,
      etichetta: `il vostro server impiega ${secondi} secondi solo per rispondere`,
      testo: `Il server impiega ${secondi} secondi solo per cominciare a rispondere, prima ancora di caricare foto e testi.`,
    });
  }

  if (prospect.caricamentoS !== null && prospect.caricamentoS >= 7) {
    elenco.push({
      peso: 70,
      etichetta: `la pagina ci mette ${numero.format(prospect.caricamentoS)} secondi ad aprirsi`,
      testo: `La pagina impiega ${numero.format(prospect.caricamentoS)} secondi ad aprirsi del tutto: chi arriva da telefono, in larga parte, se ne va prima.`,
    });
  }

  if (prospect.pesoMb !== null && prospect.pesoMb >= 2.5) {
    elenco.push({
      peso: 55,
      etichetta: `la home pesa ${numero.format(prospect.pesoMb)} MB`,
      testo: `La home pesa ${numero.format(prospect.pesoMb)} MB: su rete mobile sono secondi di attesa reali prima che si veda qualcosa.`,
    });
  }

  return elenco.sort((a, b) => b.peso - a.peso).slice(0, MASSIMO_FATTI);
}

function oggetto(prospect: Prospect, principale: Fatto | undefined): string {
  if (principale === undefined) return `Una segnalazione sul sito di ${prospect.azienda}`;
  if (!prospect.https) return `Il sito di ${prospect.azienda} risulta «non sicuro» a chi lo apre`;
  const testa = principale.etichetta;
  return `${testa.charAt(0).toUpperCase()}${testa.slice(1)}`;
}

function risparmio(prospect: Prospect): string | null {
  if (prospect.pesoMb === null || prospect.pesoDopoMb === null) return null;
  if (prospect.pesoDopoMb >= prospect.pesoMb) return null;
  const calo = Math.round((1 - prospect.pesoDopoMb / prospect.pesoMb) * 100);
  return `Ho già convertito la vostra home per mostrarvelo: passa da ${numero.format(prospect.pesoMb)} a ${numero.format(prospect.pesoDopoMb)} MB, il ${calo}% in meno, senza cambiare una virgola della grafica. Se volete ve la mando.`;
}

export function primaEmail(prospect: Prospect): BozzaEmail {
  const elenco = fatti(prospect);
  const apertura =
    prospect.email === null
      ? 'vi scrivo dal modulo del sito per una segnalazione che mi sembrava giusto farvi.'
      : 'ho guardato il vostro sito e vi segnalo una cosa che forse nessuno vi ha mai detto.';

  const fermo =
    prospect.anniFermo !== null && prospect.anniFermo >= 3
      ? `Dalle date vedo che i contenuti non cambiano da circa ${prospect.anniFermo} anni. Se è così, il pannello WordPress che sta dietro non vi serve: è solo un rischio che non vi rende niente.`
      : 'Se i contenuti del sito non cambiano spesso, il pannello WordPress che sta dietro non vi serve: è solo un rischio che non vi rende niente.';

  const righe: Array<string | null> = [
    'Buongiorno,',
    '',
    apertura,
    '',
    elenco.map((fatto) => fatto.testo).join('\n\n'),
    '',
    fermo,
    '',
    'Io faccio una cosa semplice: trasformo il sito in pagine statiche. Resta identico a vedersi, con le stesse foto e gli stessi testi, ma sparisce il programma da aggiornare e sparisce il database. Non c’è più niente da bucare, e le pagine si aprono molto prima.',
    '',
    risparmio(prospect),
    '',
    '200 euro, una volta sola. Nessun canone, e di solito si abbassa anche il costo dell’hosting.',
    '',
    `Spiegazione completa: ${DOMINIO}/wordpress-statico — oppure prenotate mezz’ora quando vi fa comodo: ${DOMINIO}/prenota`,
    '',
    FIRMA,
  ];

  const corpo = righe
    .filter((riga): riga is string => riga !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return { oggetto: oggetto(prospect, elenco[0]), corpo };
}

export function followUpEmail(prospect: Prospect): BozzaEmail {
  const principale = fatti(prospect)[0];
  const richiamo =
    principale === undefined
      ? 'Due settimane fa vi avevo scritto una segnalazione tecnica sul vostro sito.'
      : `Due settimane fa vi avevo segnalato che ${principale.etichetta}.`;

  const corpo = [
    'Buongiorno,',
    '',
    `${richiamo} Non ho avuto risposta: probabilmente non era il momento, oppure la cosa non vi interessa. Va benissimo così.`,
    '',
    'Prima di lasciar perdere vi lascio in tre righe di cosa mi occupo, nel caso serva più avanti o a qualcuno che conoscete:',
    '',
    '— siti nuovi e rifacimenti di siti esistenti, grafica compresa',
    '— negozi online',
    '— applicazioni e gestionali su misura, quando il software che si trova in giro non fa quello che serve',
    '— automazioni con l’intelligenza artificiale sulle attività ripetitive',
    '',
    `Trovate tutto su ${DOMINIO}/servizi. Questo è l’ultimo messaggio che vi mando.`,
    '',
    FIRMA,
  ].join('\n');

  return { oggetto: 'Ultima cosa, poi non vi disturbo più', corpo };
}
