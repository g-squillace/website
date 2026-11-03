export const SITE = {
  name: 'Guido Squillace',
  tagline: 'Sviluppo siti web e applicazioni su misura',
  description:
    'Sviluppatore web frontend. Siti vetrina, e-commerce, web app e gestionali su misura. Si parte dal budget, da un\'idea, o da un brief già definito.',
  url: 'https://www.guidosquillace.it',
  locale: 'it-IT',
  author: 'Guido Squillace',
  ogImage: {
    path: '/og-image.jpg',
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: 'Guido Squillace, web developer — logo su sfondo di codice sorgente',
  },
} as const;

export const NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/', label: 'Home' },
  { href: '/servizi', label: 'Servizi' },
  { href: '/intelligenza-artificiale', label: 'AI e automazioni' },
  { href: '/lavori', label: 'Lavori' },
  { href: '/chi-sono', label: 'Chi sono' },
  { href: '/contatti', label: 'Contatti' },
];

export const REPORT = {
  ga4PropertyId: '538345796',
  searchConsoleSiteUrl: 'sc-domain:guidosquillace.it',
  performanceTargets: [
    { label: 'Home', path: '/' },
    { label: 'Servizi', path: '/servizi' },
    { label: 'Contatti', path: '/contatti' },
  ],
} as const;

export const SUPABASE = {
  url: 'https://grmbzzcospmdpaqzefay.supabase.co',
} as const;

export const PRIVATE_AREA = {
  path: '/area-riservata',
  loginPath: '/area-riservata/accesso',
  gestionalePath: '/area-riservata/gestionale/progetti',
  reportPath: '/report',
} as const;

export const CONTACT = {
  email: 'info@guidosquillace.it',
} as const;

export const SOCIAL: ReadonlyArray<{ href: string; label: string }> = [];
