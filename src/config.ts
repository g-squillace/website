/**
 * Configurazione sito centrale.
 * Tutto quello che è "globale" (nome, navigazione, contatti, social)
 * sta qui, così si modifica in un solo posto.
 */

export const SITE = {
  name: 'Guido Squillace',
  tagline: 'Sviluppo siti web e applicazioni su misura',
  description:
    'Sviluppatore web freelance. Siti vetrina, e-commerce, web app e gestionali su misura. Si parte dal budget, da un\'idea, o da un brief già definito.',
  url: 'https://www.guidosquillace.it',
  locale: 'it-IT',
  author: 'Guido Squillace',
  ogImage: {
    path: '/SEO.jpg',
    width: 1920,
    height: 1280,
    type: 'image/jpeg',
    alt: 'Guido Squillace, web developer — logo su sfondo di codice sorgente',
  },
} as const;

export const NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/', label: 'Home' },
  { href: '/servizi', label: 'Servizi' },
  { href: '/lavori', label: 'Lavori' },
  { href: '/chi-sono', label: 'Chi sono' },
  { href: '/contatti', label: 'Contatti' },
];

export const CONTACT = {
  email: 'ciao@guidosquillace.it', // TODO: sostituire con l'email reale
  // Aggiungere qui altri canali (telefono, calendly, ecc.) quando definiti
} as const;

export const SOCIAL: ReadonlyArray<{ href: string; label: string }> = [
  // TODO: aggiungere link reali
  // { href: 'https://www.linkedin.com/in/...', label: 'LinkedIn' },
  // { href: 'https://github.com/...', label: 'GitHub' },
];
