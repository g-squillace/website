# Cruscotto settimanale

Pagina privata su `/report` che riassume, settimana per settimana, come va il
sito: contatti ricevuti, traffico da Google Analytics 4 e visibilità da Google
Search Console, più le ricerche su cui conviene lavorare.

- **URL**: https://www.guidosquillace.it/report
- Non è linkata da nessuna parte, è `noindex` e bloccata in `robots.txt`.
- Senza credenziali Google la pagina funziona comunque, ma mostra **dati di
  esempio** con un avviso rosa in cima. Serve a vedere com'è fatta prima di
  collegare gli account.

## Settimana mostrata

Di default vedi **l'ultima settimana conclusa**, da lunedì a domenica. I
pulsanti "Precedente" e "Successiva" vanno indietro fino a sei mesi
(`/report?w=1`, `w=2`, …).

Search Console consolida i dati con due o tre giorni di ritardo: se gli ultimi
giorni della settimana sono ancora provvisori, la pagina lo scrive sotto le
statistiche principali.

## Variabili d'ambiente

Da impostare su Netlify con scope **All** (non solo `Builds`), altrimenti a
runtime risultano `undefined`.

| Variabile | A cosa serve |
|---|---|
| `REPORT_PASSWORD` | password per il login |
| `REPORT_SESSION_SECRET` | chiave con cui si firma il cookie di sessione |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | credenziali del service account, JSON intero o in base64 |
| `PAGESPEED_API_KEY` | chiave API per la sezione Prestazioni (facoltativa) |

L'id della property GA4 e la proprietà Search Console non sono segreti e
stanno in `REPORT` dentro `src/config.ts`. `GA4_PROPERTY_ID` e
`SEARCH_CONSOLE_SITE_URL` restano accettate come override.

Su questo progetto Netlify le variabili impostate **senza** `--secret` non
arrivano al runtime delle function: `netlify env:set` risponde ok ma il valore
non compare. Per questo nell'ambiente vive solo ciò che è davvero segreto, e
va impostato così:

```sh
netlify env:set NOME "valore" --secret --scope builds functions runtime --context production
```

L'utente del login è `guido`, fissato in `DEFAULT_USER` dentro
`src/lib/report/auth.ts`. Non è un segreto, quindi non sta fra le variabili
d'ambiente; `REPORT_USER` resta accettata come override se serve cambiarlo
senza toccare il codice.

Se `REPORT_SESSION_SECRET` manca, la firma del cookie ricade su utente e
password: funziona, ma cambiando la password si invalidano le sessioni aperte.

## Collegare Google

### 1. Service account

1. Vai su [console.cloud.google.com](https://console.cloud.google.com/), crea
   un progetto (o riusane uno).
2. **API e servizi → Libreria**: abilita **Google Analytics Data API** e
   **Google Search Console API**.
3. **API e servizi → Credenziali → Crea credenziali → Account di servizio**.
   Nome a piacere, nessun ruolo necessario.
4. Apri l'account creato → **Chiavi → Aggiungi chiave → Crea nuova chiave →
   JSON**. Scarica il file e conserva l'indirizzo `client_email` che contiene,
   del tipo `qualcosa@progetto.iam.gserviceaccount.com`.

### 2. Dare accesso in lettura

- **Google Analytics 4**: Amministrazione → Gestione accesso alla proprietà →
  aggiungi la `client_email` con ruolo **Visualizzatore**. L'id numerico della
  property si legge in Amministrazione → Impostazioni proprietà.
- **Search Console**: Impostazioni → Utenti e autorizzazioni → Aggiungi utente
  → la stessa `client_email`, autorizzazione **Con restrizioni**.

### 3. Mettere il JSON su Netlify

Il JSON ha gli a capo dentro la chiave privata, che si rompono facilmente
incollandolo. Conviene passarlo in base64:

```sh
base64 -i service-account.json | tr -d '\n' | pbcopy
```

e incollare il risultato in `GOOGLE_SERVICE_ACCOUNT_JSON`. La pagina accetta
entrambe le forme.

In alternativa si possono usare `GOOGLE_CLIENT_EMAIL` e `GOOGLE_PRIVATE_KEY`
separate, con gli `\n` letterali nella chiave.

## Prestazioni

La sezione usa l'API di PageSpeed Insights, che vuole una **chiave API**, non il
service account: Google Cloud → Credenziali → Crea credenziali → Chiave API,
dopo aver abilitato *PageSpeed Insights API*. Conviene limitarla a quella sola
API.

Una misurazione Lighthouse dura 15-30 secondi per indirizzo: sei indirizzi non
stanno nei 10 secondi di una function Netlify sincrona. Per questo gira in due
pezzi:

- `netlify/functions/lighthouse-scheduled.mts` — parte ogni lunedì alle 4 UTC e
  non fa il lavoro: chiama la background function e torna subito.
- `netlify/functions/lighthouse-background.mts` — ha 15 minuti di budget,
  misura tutti gli indirizzi e salva su **Netlify Blobs** sotto `latest` e sotto
  la settimana ISO. Accetta solo richieste con l'header `x-report-trigger`
  uguale a `REPORT_SESSION_SECRET`.

La pagina legge lo snapshot salvato, quindi è istantanea, e confronta con la
**misurazione precedente trovata negli snapshot** — non con una settimana fissa,
così il confronto regge anche se un lunedì il cron salta.

Il pulsante "Rimisura adesso" chiama `/api/report/performance` (POST), che
inoltra alla background function; la pagina poi interroga lo stesso endpoint in
GET finché `measuredAt` cambia, e si ricarica.

Gli indirizzi misurati sono in `REPORT.performanceTargets` dentro
`src/config.ts`. Senza chiave la sezione lo dice per nome. In locale con
`astro dev` i Blobs non esistono: la sezione degrada a "nessuna misurazione"
invece di rompersi.

## Contatti ricevuti

Il contatore in alto somma gli eventi GA4 elencati in `LEAD_EVENTS`
(`src/lib/report/analytics.ts`): oggi `generate_lead`, già tracciato dal form
in `src/pages/contatti.astro`. Se aggiungi altri eventi di contatto, aggiungili
anche lì.

## Dove intervenire

| File | Cosa contiene |
|---|---|
| `src/lib/report/index.ts` | assembla il report e gestisce il fallback ai dati di esempio |
| `src/lib/report/insights.ts` | soglie delle opportunità, curva di CTR, mappa ricerche → servizi, riconoscimento delle ricerche sui nomi dei clienti |
| `scripts/insights.test.mts` | test di quel riconoscimento (`npm test`) |
| `src/lib/report/analytics.ts` | query a GA4 |
| `src/lib/report/search-console.ts` | query a Search Console |
| `src/lib/report/demo.ts` | dati di esempio |
| `src/pages/report/index.astro` | la pagina |

Le ricerche che contengono il nome di un cliente (prese dai titoli dei
progetti su DatoCMS) finiscono in un gruppo separato dentro "Dove sei a un
passo": portano visite alle schede lavori ma non clienti nuovi, e in cima
coprirebbero le ricerche che contano. La distinzione sta in `portfolioMatcher`,
che riconosce le coppie di parole dei titoli e i nomi propri, ignorando le
parole di settore elencate in `GENERIC_TERMS` — senza quelle, "sito web studio
legale" verrebbe scambiata per una ricerca su "Studio Legale BCM". Se sbaglia,
si aggiusta quella lista e si aggiunge il caso a `scripts/insights.test.mts`.

La mappa `SERVICE_SIGNALS` in `insights.ts` è l'unico punto da aggiornare se
cambi o aggiungi servizi: raggruppa le ricerche per servizio e genera gli
spunti di upselling.
