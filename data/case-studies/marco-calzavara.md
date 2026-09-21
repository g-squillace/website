## Il contesto

**Marco Calzavara** è scenografo e set designer: firma le scenografie di grandi show televisivi, game show e concerti live, dai *Music Awards* all'Arena di Verona a *Ballando con le Stelle*, *Italia's Got Talent*, *Physical: da 100 a 1 Italia* per Netflix e *The Traitors Italia* per Prime Video, lavorando con case di produzione come Magnolia, Fremantle, Ballandi, Endemol e Banijay.

Il materiale di partenza era un archivio enorme: **oltre 180 produzioni** dal 2010 a oggi, ciascuna con le proprie fotografie di scena. Il rischio evidente era il catalogo: una lista lunghissima in cui i lavori più importanti si perdono in mezzo agli altri.

## L'approccio

Il design l'ho curato io, ma in **collaborazione stretta col cliente** — scelta delle immagini, gerarchia dei progetti e tono visivo li abbiamo definiti insieme, e questo ha inciso tanto sul risultato quanto le decisioni tecniche.

La struttura risolve il problema dell'archivio su tre livelli:

- **Home** — una selezione ristretta di progetti in evidenza, numerati, con l'immagine a tutta pagina. È la vetrina: dieci lavori, non centottanta.
- **Progetti** — l'archivio completo, navigabile per chi cerca una produzione specifica.
- **Bio** — il racconto della carriera, con l'elenco integrale dei titoli come coda scorrevole.

Tipograficamente: **Anton** per i display, **Inter** per il testo corrente, bianco su nero ad alto contrasto. Le scenografie sono quasi tutte molto luminose e sature — il fondo nero le fa staccare senza competere.

## Il CMS

Tutti i progetti vivono su **DatoCMS**: titolo, anno, gallery. Marco aggiorna l'archivio in autonomia e decide quali lavori mettere in evidenza in home senza passare da me — per un portfolio che cresce a ogni stagione televisiva era il requisito principale.

Le immagini escono dalla CDN di DatoCMS con `srcset` completo da 640 a 2560px, formato negoziato automaticamente (WebP/AVIF dove supportato) e compressione adattiva: su un sito che è fatto al 90% di fotografie, è lì che si vince o si perde il caricamento.

## Performance e delivery

Sito **completamente statico**: nessun bundle JavaScript servito, solo poche righe inline per il menu e il consenso cookie. Tutto il resto è HTML e CSS.

- Font self-hosted in **WOFF2**, preload dei due critici, `cache-control: immutable` a un anno
- `preconnect` verso la CDN immagini e Iubenda
- **Content-Security-Policy** restrittiva, HSTS con preload, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- Skip link, heading in ordine, `alt` su tutte le immagini di scena
- `sitemap-index.xml` generata al build, `robots.txt` che la dichiara

## Stack

- Astro — output statico
- Tailwind CSS
- DatoCMS — archivio progetti e gallery, gestione autonoma del cliente
- Iubenda per il consenso cookie
- Deploy continuo su Netlify
