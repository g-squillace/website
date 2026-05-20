## Il contesto

**Scheda in Ordine** è un servizio professionale di gestione delle recensioni Google per ristoranti e hotel. Non un tool automatizzato: una consulenza che seleziona, struttura e cura le risposte alle recensioni che davvero contano per la reputazione di un locale.

Quando mi è arrivata la richiesta era chiara: cinque pagine, testi già pronti, copy non destinato a cambiare nei mesi successivi. Serviva un sito sobrio, veloce e a budget contenuto — niente più di quello che serviva.

## L'approccio

Tre scelte coerenti col vincolo principale (budget iper-contenuto):

- **Astro come framework** — SSG di default, output statico minimale, zero JavaScript al client su pagine che non ne hanno bisogno. Risultato: pagine che pesano pochi KB e si caricano istantaneamente.
- **Niente headless CMS** — i testi sono hardcoded nei componenti. Sembra una scelta "indietro", ma con copy stabile e pochi cambi previsti è la più sensata: un CMS sarebbe stato un costo (setup, abbonamento, formazione) sproporzionato rispetto all'esigenza reale. Quando i contenuti dovessero diventare dinamici, l'integrazione di un CMS resta un passaggio incrementale.
- **Identità visiva dal brief del cliente** — il cliente è arrivato con mood e direzione visiva già definiti. Il mio ruolo è stato tradurre quel linguaggio in tipografia, spaziature, palette web, mantenendo intatto il tono formale-consulenziale che caratterizza il servizio.

## Stack

- Astro — output statico, zero JavaScript dove non serve
- Tailwind CSS per styling
- Deploy continuo su Netlify
