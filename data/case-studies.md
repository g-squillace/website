# Case studies — content pronti per DatoCMS

Per ogni progetto, copia il blocco "Content" e incollalo nell'editor structured-text
del campo `content` su DatoCMS. L'editor riconosce il markdown e converte
heading/paragrafi/elenchi puntati automaticamente.

L'`abstract` è già stato caricato automaticamente via lo script — qui sotto è
riportato solo per riferimento.

---

## 1) Millenovecentoquattro (2024)

**Abstract:**
> Sito istituzionale per un'associazione di promozione sociale senese che usa lo sport — il calcio in particolare — come leva per progetti civici. Lavoro pro bono, fatto in cambio del fatto che ne sono socio.

**Content:**

#### Il contesto

**Millenovecentoquattro** è un'associazione senza scopo di lucro che si occupa di cause civiche e sociali partendo dallo sport — in particolare dal calcio — come strumento per trasmettere valori come **impegno, solidarietà, appartenenza**. Lavora su progetti a lungo termine e in rete con altre realtà del territorio.

Sono socio dell'associazione, e quando è stato il momento di costruire il sito ho proposto di farlo io.

#### L'approccio

Niente budget — è stato un lavoro **pro bono**. Il punto di partenza era il **logo e l'identità visiva**, già definiti da un altro professionista.

Per accorciare i tempi sono partito da uno **starter di DatoCMS** (template "Blog" del catalogo Boost), che mi ha dato una base già configurata su gestione contenuti, SEO e deploy. Sopra a quella base ho fatto il lavoro vero: **ho riprogettato la grafica da zero** — tipografia, palette, spaziature, layout — per ricondurla all'identità del brand. Lo starter è stato uno scheletro tecnico, non un template visivo: il risultato non sembra mai "il solito Boost".

#### Stack

- **Next.js** (App Router)
- **Tailwind CSS**
- **DatoCMS** — basato sullo starter "Boost Blog", grafica completamente customizzata
- Deploy continuo su Netlify

---

## 2) Nobile Contrada dell'Aquila (2025)

**Abstract:**
> Sito istituzionale per la Nobile Contrada dell'Aquila di Siena. Tema WordPress custom progettato per supportare un flusso editoriale multi-utente, identità visiva ed esperienza interamente curate da me.

**Content:**

#### Il contesto

La **Nobile Contrada dell'Aquila** è una delle 17 contrade di Siena, parte della tradizione plurisecolare del Palio. Come per tutte le contrade, il sito è uno strumento operativo prima ancora che una vetrina: comunica cariche, archivia eventi, racconta la vita della contrada ai contradaioli e a chi vuole conoscerla.

Il progetto nasce su **WordPress con tema custom** e nel tempo è stato mantenuto e aggiornato per restare al passo con le esigenze della contrada.

#### L'approccio

- **Multi-editore con ruoli chiari** — diverse persone della contrada gestiscono diverse sezioni (cariche, eventi, archivio, news). Il tema custom è disegnato sopra al sistema di ruoli WordPress per dare a ciascuno solo ciò che gli serve, senza confusione.
- **Tema fatto da zero per le esigenze reali** — niente template comprati, niente plugin gonfi. La struttura del tema riflette esattamente le sezioni della contrada, non quelle generiche di un blog.
- **Identità visiva interamente curata** — ho progettato grafica e UX in autonomia, tenendo presente che il sito di una contrada è un oggetto sensibile: serio e rispettoso della tradizione, ma moderno e leggibile su mobile.

#### Stack

- **WordPress** con tema custom (PHP/HTML/CSS/JS)
- Sistema di ruoli e permessi WordPress sfruttato a fondo per il workflow multi-editore
- Manutenzione e aggiornamenti continuativi negli anni

---

## 3) Studio Commerciale Mastrandrea (2021)

**Abstract:**
> Sito istituzionale per uno studio commercialista senese con quarant'anni di storia. Stack Next.js + DatoCMS, design interamente curato da me — un'identità sobria e diretta, pensata per dare subito fiducia a imprese e privati.

**Content:**

#### Il contesto

**Studio Commerciale Mastrandrea** opera a Siena (zona Belverde) da oltre quarant'anni. Si rivolge a imprese, professionisti e privati con un'offerta che spazia dalla contabilità ordinaria e dichiarazioni fiscali alla consulenza per nuove attività, fino a successioni, IMU e detrazioni per ristrutturazioni.

Il sito serviva a comunicare in modo immediato chi sono, cosa fanno e perché un titolare di azienda o un piccolo imprenditore può fidarsi a chiamarli.

#### L'approccio

Ho gestito **tutto il progetto in autonomia**, dalla progettazione grafica allo sviluppo. Una scelta che ha permesso di tenere insieme intenzione visiva e implementazione tecnica senza passaggi di consegna intermedi — utile in un progetto dove il cliente non aveva un brand designer di riferimento.

Sul **design** ho scelto un'identità sobria e leggibile, con una palette neutra: la fiducia, per uno studio commercialista, si comunica più con il rigore che con il colore.

Sull'**architettura dei contenuti** ho lavorato perché ogni sezione rispondesse a una domanda precisa che un potenziale cliente si fa entrando sul sito:

- **Lo studio** — chi sono, da quanto sono qui
- **Servizi** — cosa fanno, in modo concreto e dettagliato
- **News** — cosa stanno raccontando, aggiornamenti su normative e scadenze
- **Contatti** — come si contattano, senza attriti

#### Stack

- **Next.js** (App Router)
- **DatoCMS** come headless CMS — la redazione interna pubblica news e aggiornamenti in autonomia
- Form contatti con invio diretto al referente dello studio
- Deploy continuo su Netlify

---

## 4) Dalet Studio di Architetti (2024)

**Abstract:**
> Sito-portfolio per uno studio di architettura bolognese: layout fotografico essenziale che lascia parlare i progetti, gestione case study via DatoCMS, design interamente curato da me.

**Content:**

#### Il contesto

**Dalet Architettura** è uno studio bolognese fondato da Francesco Sabbatini, Fabiagio Salerno e Nicola Scaramuzzi, con sede in Piazza S. Giovanni in Monte. Lavorano su progetti molto diversi tra loro — edilizia pubblica, residenziale, rigenerazione urbana, concorsi — ma con un filo comune: ogni progetto è raccontato come un atto di apertura, da cui anche il nome "Dalet" (ד, la porta dell'alfabeto ebraico).

Il sito serviva ad accompagnare quel posizionamento concettuale con una **vetrina dei progetti** chiara, leggibile e immediatamente sfogliabile.

#### L'approccio

Per uno studio di architettura il sito è prima di tutto un **portfolio fotografico**: il design doveva sparire e lasciare spazio al lavoro. Ho lavorato in autonomia sia su grafica sia su sviluppo, scegliendo:

- una **gerarchia tipografica essenziale**, una sola famiglia, due pesi — tutto il carattere viene dalla composizione, non dalla decorazione
- **immagini a tutta larghezza** sui progetti, con metadati minimi (luogo, tipo, stato) sotto
- una home che mette **4 progetti in evidenza** come "vetrina curata", con accesso al portfolio completo
- una pagina studio con una **citazione lunga sul significato di Dalet** come elemento identitario, che dà tono a tutto il resto

#### Stack

- **Next.js** (App Router) per il frontend
- **DatoCMS** come headless CMS — i soci aggiungono nuovi progetti in autonomia, con immagini, metadati e descrizioni
- Ottimizzazione immagini built-in (responsive, AVIF/WebP) gestita lato Dato + Next/image
- Deploy continuo su Netlify

---

## 5) Come il Latte (2026)

**Abstract:**
> Landing low-budget per una gelateria artigianale di San Lorenzo a Roma. Single-page in quattro lingue, focus su materia prima e identità minimal-premium.

**Content:**

#### Il contesto

**Come il Latte** è una gelateria artigianale di Via Silvio Spaventa, nel cuore di **San Lorenzo a Roma** — zona universitaria, frequentata da turisti italiani e internazionali. Produce gelato fresco giornalmente, senza conservanti né coloranti, con un'offerta che spazia da gusti crema e frutta a brioche siciliane, affogati e dolci d'autore.

Serviva una landing che raccontasse la qualità del prodotto in poche schermate, in **più lingue** per il pubblico turistico, e con un budget contenuto.

#### L'approccio

- **Budget contenuto, single-page** — sezioni ancorate (filosofia, materie prime, specialità, gallery, gusti, recensioni, contatti) per raccontare tutto senza dispersione
- **Multilingua serio** — italiano, inglese, giapponese e coreano: il bacino turistico del quartiere lo richiede, e mettere solo l'inglese sarebbe stato un mezzo passo. La gestione delle traduzioni è organizzata in modo che il proprietario possa aggiornarle senza toccare il codice.
- **Identità minimal-premium** — palette neutra bianco/avorio, fotografia centrata sul gelato e sugli ingredienti, tipografia moderna. Niente elementi giocosi: la gelateria comunica artigianalità, non kawaii.
- **Mobile first** — il pubblico tipico legge il sito dal telefono, in piedi, davanti alla vetrina

#### Stack

- Stack frontend leggero per caricamento immediato
- Multilingua gestito a livello di routing (4 lingue)
- Deploy continuo

---

## 6) Filusè Siena (2023)

**Abstract:**
> Landing mobile-first per una pizzeria/braceria senese: menu sfogliabile dal telefono, ordini diretti e via piattaforme terze, gestione contenuti completamente autonoma via DatoCMS.

**Content:**

#### Il contesto

**Filusè Siena** è una pizzeria, braceria e focacceria di Via di Vallerozzi, a due passi dal centro storico. Si rivolge a un pubblico che la trova soprattutto **dal telefono**: una ricerca su Google, un clic sulla mappa, una scorsa al menu, una chiamata o un ordine via Just Eat / Glovo / Uber Eats / Deliveroo.

Il sito serviva a chiudere quel percorso senza attriti.

#### L'approccio

Tre vincoli precisi che hanno guidato ogni scelta:

- **Budget contenuto** — niente brand identity, niente sezioni narrative. Il sito doveva fare poche cose e farle bene.
- **Mobile first al 100%** — il menu doveva essere consultabile dal telefono come si sfoglia una pagina vera, non scaricando un PDF da 5MB.
- **Gestione autonoma del menu** — il locale doveva poter aggiornare voci e prezzi da solo, senza chiamarmi ogni volta che cambia qualcosa in cucina.

L'output è una landing essenziale: telefono e indirizzo in evidenza, link diretti all'app propria e alle piattaforme delivery, **menu sfogliabile per categorie** (antipasti, fritti, primi, griglia, panini, pizze, ciaccini, focacce, dolci, bibite).

#### Stack

- **DatoCMS** — modello di menu progettato perché chi non scrive codice possa aggiungere categorie e voci con prezzi e descrizioni. Salva, pubblica, il sito si aggiorna.
- Frontend statico (SSG) per caricamento sub-secondo anche su 4G traballante
- Deploy continuo su Netlify alla pubblicazione

#### Risultato

Una landing leggera, mobile-first, che il locale gestisce in autonomia. Aprire il sito, leggere il menu, chiamare o ordinare: zero attriti, anche da una connessione mobile lenta.

---

## 7) Studio Legale BCM (2025)

**Abstract:**
> Sito vetrina per uno studio legale associato senese con sede secondaria a Grosseto. Aree di competenza chiare, blog redazionale, FAQ — tutto gestito in autonomia dallo studio via DatoCMS.

**Content:**

#### Il contesto

**Bonomi Cassigoli Matassi** è uno studio legale associato fondato a Siena nel 2019, con una sede secondaria a Grosseto. Lavora su un ventaglio ampio di materie: diritto penale, del lavoro, tributario, di famiglia e minori, mediazione civile e commerciale, civile generale.

Il sito serviva a comunicare quel posizionamento — tecnico, ampio, accessibile — e a dare allo studio gli strumenti per gestire in autonomia tre tipi di contenuti che cambiano spesso: gli articoli del blog, le FAQ, e le richieste di contatto.

#### L'approccio

Ho seguito **design e sviluppo in autonomia**, con un'identità visiva sobria che mette al centro il contenuto: i servizi, gli articoli giuridici, le risposte alle domande più frequenti.

Tre scelte editoriali ricorrono:

- **Servizi presentati in modo concreto** — ogni area di competenza ha la propria scheda con icona, descrizione e contesto d'uso, senza burocratese.
- **Blog redazionale come strumento di posizionamento** — gli avvocati pubblicano in autonomia articoli su novità normative e casi tipici. Non solo per la SEO: per costruire fiducia prima ancora che un potenziale cliente prenda contatto.
- **FAQ in evidenza** — la sezione delle domande frequenti risponde ai dubbi più comuni (orari, primo contatto, costi indicativi) senza obbligare l'utente a chiamare.

#### Stack

- **Next.js** (App Router)
- **Tailwind CSS** per lo styling
- **DatoCMS** come headless CMS — servizi, articoli, FAQ e form contatti tutti gestiti dalla redazione interna
- Deploy continuo su Netlify

---

## 8) Scheda in Ordine (2026)

**Abstract:**
> Sito vetrina iper-essenziale per un servizio di gestione recensioni Google rivolto a ristoranti e hotel. Astro + Tailwind, niente CMS, identità visiva partita dal brief del cliente.

**Content:**

#### Il contesto

**Scheda in Ordine** è un servizio professionale di gestione delle recensioni Google per ristoranti e hotel. Non un tool automatizzato: una consulenza che **seleziona, struttura e cura** le risposte alle recensioni che davvero contano per la reputazione di un locale.

Quando mi è arrivata la richiesta era chiara: cinque pagine, testi già pronti, copy non destinato a cambiare nei mesi successivi. Serviva un sito **sobrio, veloce e a budget contenuto** — niente più di quello che serviva.

#### L'approccio

Tre scelte coerenti col vincolo principale (budget iper-contenuto):

- **Astro come framework** — SSG di default, output statico minimale, zero JavaScript al client su pagine che non ne hanno bisogno. Risultato: pagine che pesano pochi KB e si caricano istantaneamente.
- **Niente headless CMS** — i testi sono hardcoded nei componenti. Sembra una scelta "indietro", ma con copy stabile e pochi cambi previsti è la più sensata: un CMS sarebbe stato un costo (setup, abbonamento, formazione) sproporzionato rispetto all'esigenza reale. Quando i contenuti dovessero diventare dinamici, l'integrazione di un CMS resta un passaggio incrementale.
- **Identità visiva dal brief del cliente** — il cliente è arrivato con mood e direzione visiva già definiti. Il mio ruolo è stato tradurre quel linguaggio in tipografia, spaziature, palette web, mantenendo intatto il **tono formale-consulenziale** che caratterizza il servizio.

#### Stack

- **Astro** — output statico, zero JavaScript dove non serve
- **Tailwind CSS** per styling
- Deploy continuo su Netlify

---

## 9) Franco Zampetti (2025)

**Abstract:**
> Migrazione di stack per il portfolio del fotografo Franco Zampetti — specialista di fotografia zenitale d'architettura. Da framework legacy a Next.js + Tailwind, preservando il modello DatoCMS esistente. Performance e SEO al centro.

**Content:**

#### Il contesto

**Franco Zampetti** è un fotografo specializzato in fotografia zenitale d'architettura — una tecnica in cui lavora dal 2008 con una fotocamera personalizzata, per ottenere immagini perfettamente perpendicolari rispetto alle facciate e ai soffitti degli edifici. Il suo archivio copre buona parte del patrimonio italiano: chiese, monumenti, complessi storici da Roma a Lecce, da Firenze a Trieste.

Il sito era già online da anni, costruito su un framework che non era più aggiornabile. Il cliente **non voleva una riprogettazione**: aveva già traffico organico consolidato e un'identità minimal che funzionava. Voleva un sito che reggesse il carico, fosse veloce, e gli permettesse di continuare a pubblicare le foto come aveva sempre fatto.

#### L'approccio

Tre obiettivi guidavano la migrazione:

- **Aggiornare lo stack** senza riprogettare dalle fondamenta: il design e l'identità rimanevano, ma sotto cofano si passava da un framework morto a uno mantenuto.
- **Performance prima di tutto**: un portfolio fotografico è pesante per natura. Le immagini dovevano caricarsi rapide, su qualsiasi connessione, anche con il sito sotto traffico.
- **Salvaguardare la SEO esistente**: il cliente aveva ranking già stabili. La migrazione doveva preservare URL, meta tag, struttura semantica e Core Web Vitals.

La scelta dello stack è stata mirata: **Next.js** per il rendering (statico sulle pagine archivio, dinamico solo dove serve), **Tailwind** per replicare l'identità visiva esistente, **DatoCMS** rimasto invariato — il cliente continua a pubblicare foto e gestire la navigazione tassonomica esattamente come prima.

#### Performance & SEO

- **Immagini servite via il CDN di DatoCMS** con responsive variants (AVIF/WebP, dpr, sizes calcolate per ogni breakpoint). Una foto da 8 MB diventa 60 KB al primo paint.
- **SSG dove possibile**, ISR sulle pagine indice — ogni galleria, ogni città, ogni stile architettonico hanno il proprio URL statico pre-renderizzato.
- **Preservazione completa dell'architettura URL legacy** via redirect mirati: niente rotture SEO, ranking mantenuti durante la transizione.

#### Stack

- **Next.js** (App Router) per il frontend
- **Tailwind CSS** per styling
- **DatoCMS** — modello e contenuti preservati dalla versione precedente
- Multilingua IT/EN gestito a livello di routing
- Deploy continuo su Netlify

---

## 10) Gioja Catering (2026)

**Abstract:**
> Brand identity completa e sito vetrina per un catering senese con oltre trent'anni di esperienza. Logo, sistema visivo coordinato, fotografia editoriale, sito Next + DatoCMS — gestione contenuti autonoma e SEO curata fin dall'architettura.

**Content:**

#### Il contesto

**Gioja Catering** lavora a Siena da oltre trent'anni nel mondo del catering di eventi: matrimoni, congressi, cene di gala, eventi istituzionali. Ha collaborato con realtà come Università di Siena e Comune di Siena — un curriculum che parla da solo.

Il progetto è partito da una pagina bianca — letteralmente. Niente brand identity precedente, niente sito da migrare. Si trattava di costruire da zero un'immagine coordinata e tradurla in un sito vetrina all'altezza della reputazione che il catering si era costruito sul campo.

#### L'approccio

Il progetto ha avuto **due fasi simbiotiche**: brand identity prima, sito poi.

**Brand identity**

- **Logo** sviluppato in due varianti (verticale e orizzontale) per coprire tutti i contesti d'uso
- **Sistema visivo coordinato** — palette dark/elegante con accenti caldi che richiamano il mondo della tavola
- **Tipografia editoriale** — gerarchia chiara, leggibilità impeccabile su ogni supporto
- **Linee guida d'uso** — su carta, web, social, materiali per gli eventi

**Sito vetrina**

Il sito è la traduzione web dell'identità. Le scelte editoriali:

- **Fotografia centrale** — piatti, mise en place, allestimenti raccontano la qualità meglio di ogni descrizione
- **Sezioni essenziali** — Home, Chi siamo, Servizi (matrimoni / congressi), Gallery, Partner, Contatti
- **Form contatti rapido** + WhatsApp integrato per chi vuole aprire subito una conversazione

#### SEO

Il catering vive di ricerche locali ("catering matrimonio Siena", "catering aziendale Toscana"). Tre interventi mirati:

- **Struttura semantica curata** — heading consistenti, dati strutturati `LocalBusiness` per Google
- **Metadati e OG** per ogni pagina, generati dal CMS e modificabili dal cliente
- **Immagini ottimizzate** via CDN DatoCMS con responsive variants — niente compromessi sul peso

#### Stack

- **Next.js** (App Router) per il frontend
- **DatoCMS** come headless CMS — la redazione interna pubblica eventi, foto e aggiornamenti in autonomia
- Form contatti con notifica diretta + integrazione WhatsApp
- Deploy continuo su Netlify

---

## 11) Avv. Vincenzo Di Benedetto (2021)

**Abstract:**
> Landing istituzionale per un avvocato penalista senese. Single-page sobria con curriculum, archivio rassegna stampa e contatti. Stack Next + Tailwind + DatoCMS per la gestione autonoma delle notizie.

**Content:**

#### Il contesto

**Vincenzo Di Benedetto** è un avvocato penalista del Foro di Siena, specializzato in diritto penale d'impresa e responsabilità amministrativa dell'ente (D.Lgs. 231/01), con esperienza nei principali procedimenti che hanno riguardato Siena e la Toscana.

Per la sua attività bastava una **landing istituzionale**: una single-page con curriculum, sezione studio e archivio delle notizie, gestibili in autonomia.

#### L'approccio

Vincoli precisi, scelte coerenti:

- **Budget contenuto** — niente ridondanze, niente "pagine corporate" gonfiate. Una sola pagina con sezioni ancorate.
- **Tono sobrio** — palette neutra blu/grigio, fotografia di libreria come unica nota visiva. Per un penalista la fiducia si costruisce con il rigore, non con elementi decorativi.
- **Gestione autonoma delle notizie** — l'avvocato pubblica e archivia rassegna stampa e comunicati da DatoCMS, senza dover passare da me.

L'architettura single-page con sezioni ancorate (Lo Studio, Il Curriculum, Notizie, Contatti) rende l'esperienza essenziale: chi arriva sa subito chi è l'avvocato, cosa fa e come contattarlo.

#### Stack

- **Next.js** (App Router) per il frontend
- **Tailwind CSS** per styling
- **DatoCMS** come headless CMS — sezione notizie/rassegna stampa aggiornata dall'avvocato in autonomia
- Deploy continuo su Netlify

---

## 12) Edoardo Conticini (2020)

**Abstract:**
> Sito vetrina per un medico reumatologo dell'Università di Siena: profilo professionale, prestazioni cliniche, prenotazione online. Stack Next + DatoCMS, attenzione alla SEO.

**Content:**

#### Il contesto

**Edoardo Conticini** è un medico specializzato in Reumatologia, con dottorato in Medicina Traslazionale e Precisione presso l'Università di Siena. Lavora all'Azienda Ospedaliera Universitaria Senese.

Il sito serviva a presentare la sua attività clinica e scientifica a pazienti, colleghi e istituzioni: prestazioni offerte, formazione, ricerca, contatti — con un canale chiaro per la prenotazione.

#### L'approccio

- **Budget contenuto** — sito vetrina compatto, niente sezioni superflue
- **Tono sobrio e accessibile** — palette neutra grigio/blu, fotografia del medico in alto, codici visivi del settore medico rispettati
- **Linguaggio doppio** — scientifico ma accessibile: parla a chi cerca un'informazione clinica e a chi cerca uno specialista
- **Architettura linkable** — "La Reumatologia" e "La Diagnosi" come pagine vere, indicizzabili, utili da raggiungere via ricerca organica

#### SEO

Tre interventi mirati per le ricerche tipiche del settore ("reumatologo Siena", "ecografia muscolo-scheletrica", patologie specifiche):

- Struttura semantica curata, heading consistenti
- Schema.org `Physician` + `MedicalBusiness` per il rich snippet di Google
- Metadati e Open Graph per ogni pagina, generabili e modificabili da DatoCMS

#### Stack

- **Next.js** per il frontend
- **DatoCMS** come headless CMS — il medico aggiorna pubblicazioni, prestazioni e contatti in autonomia
- Form/link di prenotazione integrato
- Deploy continuo su Netlify

---

## 13) Maglia 90 (2026)

**Abstract:**
> Landing per un'attività specializzata nella compravendita di maglie da calcio vintage anni '90 e 2000. Sito leggero in Astro, focus sulla collezione e sul contatto diretto.

**Content:**

#### Il contesto

**Maglia 90** è una piccola attività specializzata nella **compravendita di maglie da calcio vintage** degli anni '90 e 2000 — un mercato di nicchia che vive di passione, ricordi, e di un pubblico molto specifico: collezionisti, appassionati di sport vintage, tifosi che cercano la maglia di un'epoca o di un giocatore.

Il sito serviva da **biglietto da visita digitale**: presentarsi, raccontare cosa si fa, aprire un canale di contatto per chi vuole vendere o comprare.

#### L'approccio

- **Piccola attività, budget proporzionato** — niente catalogo dinamico, niente ecommerce in questa prima fase. Una landing solida che racconta l'attività e invita al contatto.
- **Tono diretto e appassionato** — il vintage sportivo è un mondo di nicchia con un linguaggio specifico, riconoscibile da chi è dentro la community.
- **Architettura pronta a crescere** — se domani il proprietario vorrà un catalogo o uno shop, la base attuale è già pronta a evolvere senza buttare via niente.

#### Stack

- **Astro** — SSG, output statico minimale, caricamento immediato anche su connessioni mobili lente
- **Tailwind CSS** per styling
- Deploy continuo su Netlify
