## Il contesto

**Filusè Siena** è una pizzeria, braceria e focacceria di Via di Vallerozzi, a due passi dal centro storico. Si rivolge a un pubblico che la trova soprattutto dal telefono: una ricerca su Google, un clic sulla mappa, una scorsa al menu, una chiamata o un ordine via Just Eat / Glovo / Uber Eats / Deliveroo.

Il sito serviva a chiudere quel percorso senza attriti.

## L'approccio

Tre vincoli precisi che hanno guidato ogni scelta:

- **Budget contenuto** — niente brand identity, niente sezioni narrative. Il sito doveva fare poche cose e farle bene.
- **Mobile first al 100%** — il menu doveva essere consultabile dal telefono come si sfoglia una pagina vera, non scaricando un PDF da 5MB.
- **Gestione autonoma del menu** — il locale doveva poter aggiornare voci e prezzi da solo, senza chiamarmi ogni volta che cambia qualcosa in cucina.

L'output è una landing essenziale: telefono e indirizzo in evidenza, link diretti all'app propria e alle piattaforme delivery, menu sfogliabile per categorie (antipasti, fritti, primi, griglia, panini, pizze, ciaccini, focacce, dolci, bibite).

## Stack

- DatoCMS — modello di menu progettato perché chi non scrive codice possa aggiungere categorie e voci con prezzi e descrizioni. Salva, pubblica, il sito si aggiorna.
- Frontend statico (SSG) per caricamento sub-secondo anche su 4G traballante
- Deploy continuo su Netlify alla pubblicazione
