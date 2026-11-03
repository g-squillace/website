# Area riservata

Una sola porta d'ingresso per gli strumenti privati del sito: `/area-riservata`.
Da lì si arriva al **gestionale** (clienti, progetti, ore, scadenze) e al
**cruscotto settimanale** (`/report`, documentato in
[cruscotto-settimanale.md](cruscotto-settimanale.md)).

Il bottone con la cassetta degli attrezzi nell'header del sito pubblico porta qui.

## Un solo login

Tutta l'area è protetta dalla stessa sessione del cruscotto: cookie firmato
HMAC (`gs_report_session`, 12 ore), credenziali in `REPORT_PASSWORD` /
`REPORT_SESSION_SECRET`, utente `guido` definito in `src/lib/report/auth.ts`.

La pagina di accesso è `/area-riservata/accesso` e accetta `?vai=<percorso>`
per tornare dove si stava andando. `safeRedirect` accetta solo percorsi locali,
quindi non è usabile come open redirect. Il vecchio `/report/login` resta come
301 verso la nuova pagina.

Supabase **non** chiede un secondo login: il server si autentica da solo con
l'account Supabase configurato nelle variabili d'ambiente.

## Gestionale

Rotte (tutte `prerender = false`):

```
/area-riservata                            elenco degli strumenti
/area-riservata/accesso                    login
/area-riservata/gestionale/progetti        elenco progetti
/area-riservata/gestionale/progetti/[id]   scadenze, periodi di assistenza, ore
/area-riservata/gestionale/clienti         anagrafica clienti
```

Le pagine leggono e scrivono su Supabase **lato server**. Ogni modifica è una
form HTML che fa POST sulla pagina stessa con un campo `intent`
(`create`, `update`, `delete`, `ora.create`, …), poi 303 verso la stessa URL:
niente doppio invio al refresh. Gli errori tornano in `?errore=`.

`src/lib/gestionale/supabase.ts` è un client minimale senza dipendenze: fa
`grant_type=password` su GoTrue, tiene in cache l'access token finché è valido e
parla con PostgREST via `fetch`. **Le policy RLS restano attive** — le query
girano come utente `authenticated`, non con una service-role key, quindi una
fuga delle variabili d'ambiente espone solo le righe di questo account.

Il report PDF delle ore (`jspdf` + `jspdf-autotable`) è l'unica parte
client-side: i dati del periodo stanno in un `<script type="application/json">`
e la libreria viene importata dinamicamente al click, così non pesa sul caricamento.

## Variabili d'ambiente

```env
SUPABASE_ANON_KEY=
SUPABASE_EMAIL=
SUPABASE_PASSWORD=
```

L'URL del progetto Supabase non è un segreto e sta in `src/config.ts`
(`SUPABASE.url`), insieme ai percorsi dell'area (`PRIVATE_AREA`).

Su Netlify vanno impostate **come secret**, altrimenti a runtime arrivano
`undefined` senza alcun errore visibile:

```sh
netlify env:set SUPABASE_ANON_KEY "..." --secret --context production
netlify env:set SUPABASE_EMAIL "..." --secret --context production
netlify env:set SUPABASE_PASSWORD "..." --secret --context production
```

Se ne manca una, le pagine del gestionale non vanno in errore: mostrano un
riquadro che nomina le variabili mancanti.
