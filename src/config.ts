export const SITE = {
  name: 'Guido Squillace',
  tagline: 'Siti web e app su misura a Siena',
  description:
    'Sviluppatore web con base a Siena. Vetrine, e-commerce e applicazioni su misura, con un solo interlocutore dalla prima call alla messa online.',
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
  { href: '/servizi/', label: 'Servizi' },
  { href: '/lavori/', label: 'Lavori' },
  { href: '/chi-sono/', label: 'Chi sono' },
  { href: '/contatti/', label: 'Contatti' },
];

export const CONTACT = {
  email: 'info@guidosquillace.it',
} as const;

export const SOCIAL: ReadonlyArray<{ href: string; label: string }> = [];
