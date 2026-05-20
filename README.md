# Sito Guido Squillace

Sito personale costruito con [Astro](https://astro.build), contenuti dei
lavori gestiti su [DatoCMS](https://www.datocms.com) (model `post`).

## Stack

- **Astro 5** con TypeScript strict, output statico (SSG)
- **Content Collections** con custom loader che fetcha da DatoCMS al build
- **DatoCMS** — Content Delivery API via `@datocms/cda-client`, structured
  text renderizzato server-side
- **CSS vanilla** con design system fluid (clamp-based, viewport ideale 1300px)
- **Sitemap automatica** via `@astrojs/sitemap`

## Avvio

Serve un token read-only di DatoCMS in `.env`:

```env
DATOCMS_READONLY_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Poi:

```sh
npm install
npm run dev
```

Apri http://localhost:4321/.

## Build per produzione

```sh
npm run build
npm run preview     # per testarla in locale
```

## Struttura

```
.
├── astro.config.mjs        # Config Astro (site URL, image remote patterns)
├── src/
│   ├── config.ts           # Config sito (nome, nav, contatti, social)
│   ├── content.config.ts   # Loader DatoCMS → collection "projects"
│   ├── lib/
│   │   └── dato.ts         # Wrapper @datocms/cda-client + tipi
│   ├── components/         # Header (con hamburger drawer), Footer, ProjectCard, ContactCTA
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro             # Home
│   │   ├── servizi.astro
│   │   ├── chi-sono.astro
│   │   ├── contatti.astro
│   │   └── lavori/
│   │       ├── index.astro          # Listing portfolio (da DatoCMS)
│   │       └── [...id].astro        # Singolo case study (slug = post.slug)
│   └── styles/global.css
└── public/
    └── favicon.svg
```

## Aggiungere o modificare un progetto

I progetti vivono nel model **`post`** di DatoCMS. Campi mappati:

| Campo DatoCMS  | Uso nel sito                                  |
| -------------- | --------------------------------------------- |
| `title`        | Titolo card e pagina dettaglio                |
| `slug`         | URL → `/lavori/<slug>`                        |
| `abstract`     | Sottotitolo card e meta description           |
| `tags`         | Chip in fondo alla pagina dettaglio           |
| `blogImage`    | Cover card e hero pagina dettaglio            |
| `content`      | Body case study (structured text DAST)        |

Modifiche fatte in DatoCMS si vedono al **prossimo build** del sito
(SSG). Per propagare in fretta, configura un webhook DatoCMS → build trigger.

## Modificare i contenuti del sito (testi statici)

| Cosa cambiare              | Dove                                         |
| -------------------------- | -------------------------------------------- |
| Nome, tagline, dominio     | `src/config.ts` (oggetto `SITE`)             |
| Voci di menu               | `src/config.ts` (array `NAV`)                |
| Email, social              | `src/config.ts` (`CONTACT`, `SOCIAL`)        |
| Copy della home            | `src/pages/index.astro`                      |
| Servizi (descrizioni)      | `src/pages/servizi.astro`                    |
| Bio "Chi sono"             | `src/pages/chi-sono.astro`                   |
| Form contatti              | `src/pages/contatti.astro`                   |

## Design system

- **Palette**: `#FF5354` orange · `#D6DF4A` yellow · `#FFB5D2` pink ·
  `#E0C8BB` beige · `#0900FF` blue (accent primario).
- **Scala fluid**: ogni font/spacing scala fra viewport 360px e 1300px;
  sopra 1300px tutto è capped al massimo della clamp.
- Custom properties in `src/styles/global.css` (`--fs-*`, `--space-*`,
  `--c-*`, `--color-*`).

## TODO prima del lancio

- [ ] Sostituire il logo placeholder (S in `Header.astro`) con quello definitivo
- [ ] Sostituire l'email placeholder `ciao@guidosquillace.it` in `src/config.ts`
- [ ] Aggiungere link social reali in `src/config.ts`
- [ ] Configurare webhook DatoCMS → build trigger su Netlify/Vercel
- [ ] Collegare il form contatti a un servizio di invio
- [ ] Popolare `abstract` e `content` per ogni post in DatoCMS
- [ ] Aggiungere `alt` text alle blogImage in DatoCMS (a11y)
