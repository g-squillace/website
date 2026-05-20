## Il contesto

**Franco Zampetti** è un fotografo specializzato in fotografia zenitale d'architettura — una tecnica in cui lavora dal 2008 con una fotocamera personalizzata, per ottenere immagini perfettamente perpendicolari rispetto alle facciate e ai soffitti degli edifici. Il suo archivio copre buona parte del patrimonio italiano: chiese, monumenti, complessi storici da Roma a Lecce, da Firenze a Trieste.

Il sito era già online da anni, costruito su un framework che non era più aggiornabile. Il cliente non voleva una riprogettazione: aveva già traffico organico consolidato e un'identità minimal che funzionava. Voleva un sito che reggesse il carico, fosse veloce, e gli permettesse di continuare a pubblicare le foto come aveva sempre fatto.

## L'approccio

Tre obiettivi guidavano la migrazione:

- **Aggiornare lo stack** senza riprogettare dalle fondamenta: il design e l'identità rimanevano, ma sotto cofano si passava da un framework morto a uno mantenuto.
- **Performance prima di tutto**: un portfolio fotografico è pesante per natura. Le immagini dovevano caricarsi rapide, su qualsiasi connessione, anche con il sito sotto traffico.
- **Salvaguardare la SEO esistente**: il cliente aveva ranking già stabili. La migrazione doveva preservare URL, meta tag, struttura semantica e Core Web Vitals.

La scelta dello stack è stata mirata: Next.js per il rendering (statico sulle pagine archivio, dinamico solo dove serve), Tailwind per replicare l'identità visiva esistente, DatoCMS rimasto invariato — il cliente continua a pubblicare foto e gestire la navigazione tassonomica (per città, stile architettonico, autore, elemento) esattamente come prima, senza imparare nulla di nuovo.

## Performance & SEO

Tre interventi chiave:

- **Immagini servite via il CDN di DatoCMS** con responsive variants (AVIF/WebP, dpr, sizes calcolate per ogni breakpoint). Una foto da 8 MB diventa 60 KB al primo paint.
- **SSG dove possibile**, ISR sulle pagine indice — ogni galleria, ogni città, ogni stile architettonico hanno il proprio URL statico pre-renderizzato.
- **Preservazione completa dell'architettura URL legacy** via redirect mirati: niente rotture SEO, ranking mantenuti durante la transizione.

## Stack

- Next.js (App Router) per il frontend
- Tailwind CSS per styling
- DatoCMS — modello e contenuti preservati dalla versione precedente
- Multilingua IT/EN gestito a livello di routing
- Deploy continuo su Netlify
