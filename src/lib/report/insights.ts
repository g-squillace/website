import type { Opportunity, QueryRow, UpsellSignal } from './types';

const CTR_BY_POSITION = [0.27, 0.15, 0.11, 0.08, 0.06, 0.05, 0.04, 0.033, 0.028, 0.025];

const BRAND_TERMS = ['guido', 'squillace', 'guidosquillace'];

interface ServiceSignal {
  service: string;
  href: string;
  terms: string[];
  pitch: string;
}

const SERVICE_SIGNALS: ServiceSignal[] = [
  {
    service: 'E-commerce',
    href: '/servizi#ecommerce',
    terms: ['ecommerce', 'e-commerce', 'negozio online', 'shop online', 'vendere online', 'shopify', 'woocommerce', 'prestashop', 'carrello', 'checkout', 'snipcart', 'vendita online'],
    pitch: 'Chi cerca così ha già deciso di vendere online: una pagina caso-studio e-commerce con numeri reali chiude molto più in fretta.',
  },
  {
    service: 'Web app e gestionali',
    href: '/servizi#web-app',
    terms: ['web app', 'webapp', 'applicazione', 'gestionale', 'crm', 'portale', 'configuratore', 'calcolatore', 'preventivatore', 'area riservata', 'dashboard', 'software su misura'],
    pitch: 'È il lavoro a margine più alto: vale una landing dedicata con un esempio concreto di processo automatizzato.',
  },
  {
    service: 'Automazioni e AI',
    href: '/intelligenza-artificiale',
    terms: ['intelligenza artificiale', ' ai ', 'automazione', 'automatizzare', 'chatbot', 'agente', 'gpt', 'openai', 'claude', 'assistente virtuale', 'n8n', 'make.com', 'zapier'],
    pitch: 'Domanda in crescita e pochi concorrenti locali credibili: è il tuo upselling naturale sui clienti che hanno già un sito.',
  },
  {
    service: 'Accessibilità e adeguamento normativo',
    href: '/servizi',
    terms: ['accessibilit', 'wcag', 'eaa', 'european accessibility act', 'agid', 'screen reader', 'barriere digitali', 'dichiarazione di accessibilit'],
    pitch: 'Scadenza normativa in corso: è l’upselling più facile da vendere ai clienti già acquisiti, e tu ne sai più della media.',
  },
  {
    service: 'Restyling e manutenzione',
    href: '/servizi#manutenzione',
    terms: ['restyling', 'rifare il sito', 'rifare sito', 'sito lento', 'migrazione', 'migrare', 'aggiornare sito', 'manutenzione sito', 'wordpress lento', 'core web vitals', 'pagespeed'],
    pitch: 'Chi cerca questo ha già un sito che non funziona: è un contratto di manutenzione ricorrente, non un progetto una tantum.',
  },
  {
    service: 'Siti vetrina',
    href: '/servizi#siti-vetrina',
    terms: ['sito vetrina', 'sito web per', 'creazione sito', 'realizzazione sito', 'fare un sito', 'costo sito', 'prezzo sito', 'quanto costa un sito'],
    pitch: 'Intento commerciale puro: una pagina con fasce di prezzo trasparenti intercetta chi sta solo chiedendo preventivi in giro.',
  },
  {
    service: 'Landing page e campagne',
    href: '/servizi#landing',
    terms: ['landing page', 'pagina di atterraggio', 'campagna', 'google ads', 'conversione', 'lead generation'],
    pitch: 'Lavoro breve e ripetibile: ottimo primo ingaggio per aprire la porta a progetti più grandi.',
  },
];

function expectedCtr(position: number): number {
  const index = Math.max(0, Math.round(position) - 1);
  if (index < CTR_BY_POSITION.length) return CTR_BY_POSITION[index];
  if (position <= 20) return 0.012;
  return 0.004;
}

export function isBranded(query: string): boolean {
  const normalised = query.toLowerCase();
  return BRAND_TERMS.some((term) => normalised.includes(term));
}

export function strikingDistance(queries: QueryRow[]): Opportunity[] {
  return queries
    .filter((row) => !isBranded(row.query) && row.position > 3.5 && row.position <= 20 && row.impressions >= 5)
    .map((row) => {
      const target = Math.max(3, Math.floor(row.position) - 3);
      const potential = Math.max(0, row.impressions * (expectedCtr(target) - row.ctr));
      return {
        query: row.query,
        impressions: row.impressions,
        clicks: row.clicks,
        position: row.position,
        ctr: row.ctr,
        potentialClicks: potential,
        reason: `Sei in posizione ${row.position.toFixed(1)}: Google ti mostra già, ma quasi nessuno arriva così in basso.`,
        action:
          row.position <= 10
            ? 'Sei in prima pagina. Rinforza la pagina che si posiziona: titolo più vicino a questa ricerca, un paragrafo che risponda esattamente alla domanda.'
            : 'Sei in seconda pagina. Serve contenuto dedicato: una sezione o una pagina che tratti solo questo argomento.',
      };
    })
    .sort((left, right) => right.potentialClicks - left.potentialClicks)
    .slice(0, 12);
}

export function invisibleQueries(queries: QueryRow[]): Opportunity[] {
  return queries
    .filter((row) => !isBranded(row.query) && row.position > 20 && row.impressions >= 3)
    .map((row) => ({
      query: row.query,
      impressions: row.impressions,
      clicks: row.clicks,
      position: row.position,
      ctr: row.ctr,
      potentialClicks: row.impressions * expectedCtr(5),
      reason: `Google ti considera pertinente (posizione ${row.position.toFixed(0)}), ma nessuno ti vede.`,
      action: 'Qui non hai ancora contenuto vero. Se è un servizio che vuoi vendere, scrivici una pagina dedicata.',
    }))
    .sort((left, right) => right.impressions - left.impressions)
    .slice(0, 12);
}

export function zeroClickQueries(queries: QueryRow[]): QueryRow[] {
  return queries
    .filter((row) => row.clicks === 0 && row.impressions >= 20 && row.position <= 12)
    .sort((left, right) => right.impressions - left.impressions)
    .slice(0, 6);
}

export function upsellSignals(queries: QueryRow[]): UpsellSignal[] {
  const signals: UpsellSignal[] = [];
  for (const signal of SERVICE_SIGNALS) {
    const matched = queries.filter((row) => {
      const padded = ` ${row.query.toLowerCase()} `;
      return signal.terms.some((term) => padded.includes(term));
    });
    if (matched.length === 0) continue;
    const impressions = matched.reduce((sum, row) => sum + row.impressions, 0);
    const clicks = matched.reduce((sum, row) => sum + row.clicks, 0);
    if (impressions < 3) continue;
    signals.push({
      service: signal.service,
      href: signal.href,
      impressions,
      clicks,
      queries: matched
        .sort((left, right) => right.impressions - left.impressions)
        .slice(0, 5)
        .map((row) => row.query),
      pitch: signal.pitch,
    });
  }
  return signals.sort((left, right) => right.impressions - left.impressions);
}

export function buildHeadline(
  leads: number,
  previousLeads: number,
  clicks: number,
  previousClicks: number,
  topOpportunity: Opportunity | undefined,
): string {
  if (leads > 0 && leads > previousLeads) {
    return `${leads} ${leads === 1 ? 'contatto' : 'contatti'} questa settimana, più della precedente. Caffè meritato.`;
  }
  if (leads > 0) {
    return `${leads} ${leads === 1 ? 'contatto' : 'contatti'} questa settimana. Il motore gira.`;
  }
  if (clicks > previousClicks && clicks > 0) {
    return 'Zero contatti, ma più visite da Google della settimana scorsa: il traffico cresce, la pagina contatti no.';
  }
  if (topOpportunity !== undefined) {
    return `Settimana silenziosa. Il punto su cui agire è "${topOpportunity.query}": ci sei già vicino.`;
  }
  return 'Settimana silenziosa. Nessun segnale forte da Google.';
}
