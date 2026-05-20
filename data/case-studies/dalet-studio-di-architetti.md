## Il contesto

**Dalet Architettura** è uno studio bolognese fondato da Francesco Sabbatini, Fabiagio Salerno e Nicola Scaramuzzi, con sede in Piazza S. Giovanni in Monte. Lavorano su progetti molto diversi tra loro — edilizia pubblica, residenziale, rigenerazione urbana, concorsi — ma con un filo comune: ogni progetto è raccontato come un atto di apertura, da cui anche il nome "Dalet" (la lettera ebraica che significa "porta").

Il sito serviva ad accompagnare quel posizionamento concettuale con una vetrina dei progetti chiara, leggibile e immediatamente sfogliabile.

## L'approccio

Per uno studio di architettura il sito è prima di tutto un portfolio fotografico: il design doveva sparire e lasciare spazio al lavoro. Ho lavorato in autonomia sia su grafica sia su sviluppo, scegliendo:

- una **gerarchia tipografica essenziale**, una sola famiglia, due pesi — tutto il carattere viene dalla composizione, non dalla decorazione
- **immagini a tutta larghezza** sui progetti, con metadati minimi (luogo, tipo, stato) sotto
- una home che mette **4 progetti in evidenza** come vetrina curata, con accesso al portfolio completo
- una pagina studio con una citazione lunga sul significato di Dalet come elemento identitario, che dà tono a tutto il resto

## Stack

- Next.js (App Router)
- DatoCMS come headless CMS — i soci aggiungono nuovi progetti in autonomia, con immagini, metadati e descrizioni
- Ottimizzazione immagini built-in (responsive, AVIF/WebP) gestita lato Dato + Next/image
- Deploy continuo su Netlify
