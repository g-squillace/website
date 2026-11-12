# Area riservata

Una sola porta d'ingresso per gli strumenti privati del sito: `/area-riservata`.
Da lì si arriva al **gestionale** (clienti, progetti, ore, scadenze), ai
**prospect** (chi contattare e a che punto è ogni contatto) e al
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
/area-riservata/gestionale/prospect        contatti da lavorare
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

## Prospect

`/area-riservata/gestionale/prospect` tiene la lista delle attività da
contattare per il servizio di conversione WordPress → statico, lo stato di
ognuna e cosa hanno risposto.

**Stati**: `segnalato` → `da_contattare` → `contattato` → `follow_up` →
`risposto` | `stallo` | `chiuso`. Il vincolo `check` sulla colonna `stato`
rifiuta qualsiasi altro valore.

**Tornate.** «Prendi i prossimi 5» sposta i cinque `segnalato` col punteggio
più alto in `da_contattare` e assegna loro lo stesso numero di tornata.
Accettare un singolo contatto lo aggiunge alla tornata aperta, non ne apre una
nuova.

**Follow-up.** Dodici giorni dopo la data in `contattato_il`, un contatto
ancora in stato `contattato` compare nel riquadro «Follow-up da mandare».
Il conteggio sta in `scadenzaFollowUp` in `src/lib/gestionale/types.ts`.

**Bozze email.** `src/lib/gestionale/prospectEmail.ts` costruisce prima email e
follow-up dai dati misurati della riga: sceglie i **tre** fatti più forti fra
HTTPS mancante, PHP fuori supporto, WordPress vecchio, tempo di risposta,
caricamento e peso, e li ordina per peso. Le tabelle `USCITA_WORDPRESS` e
`FINE_SUPPORTO_PHP` vanno aggiornate quando escono versioni nuove, altrimenti
le email citano anni sbagliati. Sono **bozze**: vanno rilette prima di mandarle.

**Diventa lavoro** crea il cliente con nome ed email del prospect, un progetto
in stato `lead` da 200 €, e chiude il prospect.

### Tabella

Lo schema sta in [sql/prospect.sql](sql/prospect.sql): va eseguito una volta
nel SQL editor di Supabase. RLS attiva con quattro policy su `auth.uid() =
user_id`, come le altre tabelle.

[sql/prospect-semina.sql](sql/prospect-semina.sql) carica i 18 contatti già
analizzati nella zona di Siena. **Prima di eseguirlo** sostituisci
`INDIRIZZO-DEL-TUO-ACCOUNT-SUPABASE` con il valore di `SUPABASE_EMAIL`: la
query lo usa per risolvere `user_id`, perché nel SQL editor `auth.uid()` è
nullo. È idempotente (`on conflict (user_id, dominio) do nothing`).

## Ore di assistenza verso i cruscotti dei clienti

`GET /api/assistenza/<id-progetto>` restituisce il **periodo di assistenza più
recente** di un progetto, perché i cruscotti dei siti clienti mostrino le ore
residue invece di tenerle scritte a mano nel loro repository.

```sh
curl -H "Authorization: Bearer $ASSISTENZA_API_TOKEN" \
  https://www.guidosquillace.it/api/assistenza/69034de2-8485-4515-8957-236d82ab2bf9
```

```json
{
  "package": {
    "totalHours": 10,
    "startedOn": "2026-11-11",
    "entries": [{ "date": "2026-11-12", "hours": 1.5, "description": "Pagina servizi" }]
  }
}
```

Fuori escono solo monte ore, data di inizio e righe di lavoro: **canone,
preventivo, scadenze e anagrafica del cliente non vengono mai serializzati**.
Senza periodi aperti la risposta è `{"package": null}` e il cruscotto del
cliente nasconde la sezione invece di mostrare ore finte.

Risposte: `401` token assente o sbagliato (confronto a tempo costante), `400`
id che non è un UUID, `503` `ASSISTENZA_API_TOKEN` o le variabili Supabase non
configurate, `502` Supabase non raggiungibile.

Il token è uno solo per tutti i siti clienti: chi lo ha può leggere le ore di
qualunque progetto di cui conosce l'id, quindi va trattato come un segreto e
ruotato cambiando la variabile qui e sui siti che la usano.

## Variabili d'ambiente

```env
SUPABASE_ANON_KEY=
SUPABASE_EMAIL=
SUPABASE_PASSWORD=
ASSISTENZA_API_TOKEN=
```

L'URL del progetto Supabase non è un segreto e sta in `src/config.ts`
(`SUPABASE.url`), insieme ai percorsi dell'area (`PRIVATE_AREA`).

Su Netlify vanno impostate **come secret**, altrimenti a runtime arrivano
`undefined` senza alcun errore visibile:

```sh
netlify env:set SUPABASE_ANON_KEY "..." --secret --context production
netlify env:set SUPABASE_EMAIL "..." --secret --context production
netlify env:set SUPABASE_PASSWORD "..." --secret --context production
netlify env:set ASSISTENZA_API_TOKEN "..." --secret --context production
```

Se ne manca una, le pagine del gestionale non vanno in errore: mostrano un
riquadro che nomina le variabili mancanti.
