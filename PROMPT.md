# Prompt per Claude Code — app personale di cucina (PWA)

> **Prima di incollarlo:** sostituisci `[NOME APP]` e `[NOME PROPRIETARIO]` alla riga 5.
> È l'unica cosa che devi compilare. Tutto il resto è già deciso.

---

## Contesto e obiettivo

Devi costruire da zero un'applicazione web personale di cucina, **Semagnaa**, per **Alberto**. Italiano, sobrio, leggibile a un braccio di distanza dal piano di lavoro, usabile con le mani sporche.

L'app viene pubblicata come sito statico su **GitHub Pages** e installata sul telefono come **PWA**: deve funzionare **completamente offline**, senza backend, senza account, senza database remoto. Tutti i dati vivono sul dispositivo.

L'app ha tre funzioni:

1. **Archivio ricette** — inserire, modificare, cancellare ricette dall'app stessa (dal telefono, senza toccare codice). Ogni ricetta ha la sua pagina con ingredienti, passaggi, tempi, porzioni scalabili.
2. **Modalità Cucina** (`play`) — si preme play su una ricetta e l'app guida passaggio per passaggio, un passaggio alla volta a schermo pieno, con **timer integrati** per le attese (lievitazione, cottura, riposo). I timer devono sopravvivere al blocco schermo e al cambio di app.
3. **Modalità Spesa** — si selezionano le ricette della settimana, l'app aggrega gli ingredienti in una lista della spesa. Prima però passa da una **checklist dispensa**: per ogni ingrediente serve dire "ce l'ho" o "non ce l'ho"; solo ciò che manca finisce nella lista finale, raggruppata per reparto del supermercato.

Lavora fino al completamento. Il criterio di "finito" è la sezione **Definizione di Fatto** in fondo: non è finito finché ogni singolo check di quella lista non passa, verificato eseguendo comandi, non a occhio.

---

## Regola di autonomia

Lavora fino al completamento di tutti i task in `PLAN.md`. **Non chiedermi conferme intermedie.**

Se una scelta è ambigua, prendi la più conservativa e standard, e annotala nella sezione `## Decisioni prese in autonomia` di `PLAN.md`, con una riga sul perché e sull'alternativa scartata.

Fermati e chiedi **solo** se sei bloccato da qualcosa che non puoi risolvere da solo: una credenziale che non ho fornito, un errore di rete persistente, un requisito che si contraddice internamente. In ogni altro caso decidi, annota e vai avanti.

Non dichiarare il lavoro concluso senza aver eseguito tutti i comandi di verifica e riportato il loro output reale in `RESULTS.md`.

---

## Primo task obbligatorio: PLAN.md

Prima di scrivere qualsiasi codice, crea `PLAN.md` nella root del progetto con:

1. **Task list a checkbox** (`- [ ]` / `- [x]`), raggruppata per fasi: Setup, Design system, Modello dati e storage, Layout e componenti, Pagine, Collection ricette seed, Modalità Cucina, Modalità Spesa, PWA e offline, Test, Verifiche finali.
2. **Sezione `## Stato attuale`**: una riga che aggiorni a ogni fase completata, con data e ora.
3. **Sezione `## Decisioni prese in autonomia`**: vuota all'inizio, la riempi strada facendo.
4. **Sezione `## Versioni installate`**: le versioni esatte di Node, Astro e delle dipendenze principali, compilata dopo il setup.
5. **Sezione `## Problemi aperti`**: cose che non hai potuto risolvere e perché.

**Aggiorna `PLAN.md` a ogni task completato**, non alla fine. È la tua memoria di lavoro: se la sessione si interrompe, chi riparte deve capire dal solo `PLAN.md` esattamente dove sei arrivato.

---

## Vincoli tecnici

### Stack — non negoziabile

- **Astro**, ultima versione stabile, inizializzata con `npm create astro@latest`, `output: 'static'`. Non fissare una versione a memoria: usa quella che l'installer scarica, poi registra la versione esatta in `PLAN.md`.
- **Node.js**: versione LTS attiva. Dichiarala in `package.json` sotto `engines`.
- **TypeScript** in modalità `strict` (template Astro con TS). Nessun `any` implicito, nessun `@ts-ignore`.
- **CSS puro con custom properties.** Niente Tailwind, niente framework CSS, niente preprocessori. Il proprietario conosce HTML e CSS e deve poter mettere le mani nei file senza imparare nulla di nuovo.
- **JavaScript solo vanilla TypeScript**, in isole Astro (`<script>` nei componenti). Nessun componente React, Vue, Svelte. Nessuna libreria di stato, nessun router client di terze parti.
- **Nessuna dipendenza runtime di terze parti.** Sono ammesse solo le integrazioni ufficiali Astro se davvero necessarie (`@astrojs/sitemap` non serve: l'app non è indicizzabile). Il service worker si scrive a mano: **niente `vite-plugin-pwa`, niente Workbox**. La persistenza usa le API del browser (`localStorage` / IndexedDB), **niente Dexie, niente PouchDB**. Ogni dipendenza aggiuntiva va giustificata in `PLAN.md`.
- **Test con il runner nativo di Node** (`node --test`), zero dipendenze di test. Deve girare con `npm test`.
- **Font**: self-hosted in `public/fonts/`, formato WOFF2, con `font-display: swap`. Niente Google Fonts via CDN — è una richiesta a un dominio terzo che pesa sulle performance e sul GDPR, e su un'app offline semplicemente non funzionerebbe.
- **Base path configurabile**: l'app gira sotto `https://<utente>.github.io/<repo>/`, quindi ogni URL, ogni asset, lo scope del service worker e il `start_url` del manifest devono derivare dalla base di Astro (`import.meta.env.BASE_URL`), **mai da percorsi assoluti hardcoded**. Deve funzionare anche servita dalla root, senza modifiche al codice.

### Struttura delle cartelle

```
/
├── PLAN.md
├── RESULTS.md
├── README.md
├── .gitignore
├── astro.config.mjs
├── package.json
├── .github/workflows/deploy.yml     ← build + publish su GitHub Pages
├── public/
│   ├── fonts/
│   ├── icone/                       ← icone PWA (SVG + PNG 192/512, maskable)
│   ├── manifest.webmanifest
│   ├── sw.js                        ← service worker scritto a mano
│   └── favicon.svg
├── scripts/
│   ├── check-pages.mjs
│   └── check-no-deps.mjs
└── src/
    ├── components/
    ├── layouts/
    ├── content/
    │   └── ricette/                 ← un file .md per ricetta di partenza (seed)
    ├── i18n/
    │   └── it.json                  ← tutte le stringhe dell'interfaccia
    ├── lib/
    │   ├── tipi.ts                  ← tipi condivisi, nessuna dipendenza
    │   ├── archivio.ts              ← interfaccia astratta di persistenza
    │   ├── archivio-locale.ts        ← unica implementazione, sostituibile
    │   ├── timer.ts                  ← logica timer, pura e testabile
    │   ├── unita.ts                  ← normalizzazione e somma di quantità
    │   ├── spesa.ts                  ← aggregazione ingredienti → lista spesa
    │   └── scala.ts                  ← scalatura porzioni
    ├── pages/
    └── styles/
        └── global.css
```

### Cosa NON devi toccare

- Non introdurre servizi remoti, analytics, CDN, font esterni, tracker. L'app non deve fare **nessuna** richiesta di rete verso domini terzi: è personale e deve funzionare in aereo.
- Non committare mai chiavi API, token o segreti: l'app non ne ha bisogno e non deve averne.
- Non installare pacchetti globali sul sistema.
- Non usare `alert()`, `confirm()`, `prompt()` per l'interfaccia: servono dialog reali (`<dialog>`).

---

## Vincolo architetturale importante: la persistenza va isolata

`src/lib/archivio.ts` definisce un'interfaccia che **non nomina nessuna tecnologia di storage**: qualcosa come `leggiRicette()`, `salvaRicetta(r)`, `cancellaRicetta(id)`, `leggiStato(chiave)`, `scriviStato(chiave, valore)`, con esiti tipizzati. `archivio-locale.ts` è l'unica implementazione (basata su `localStorage`).

Il resto del codice importa **solo** l'interfaccia e non deve contenere nemmeno una stringa specifica dello storage: nessun `localStorage` fuori da `archivio-locale.ts`.

Il criterio: passare a IndexedDB, o a una sincronizzazione futura, deve significare scrivere un nuovo file `archivio-*.ts` e cambiare una riga di import. Se per cambiare storage serve toccare le pagine, l'astrazione è sbagliata e va rifatta.

Documenta in `README.md` la procedura di sostituzione, con IndexedDB come esempio concreto di alternativa.

---

## Modello dati

Un unico tipo `Ricetta` in `src/lib/tipi.ts`, usato identico dalle ricette seed (Markdown) e da quelle create nell'app:

- `id` (string, slug) — `titolo` (string) — `categoria` (enum: `antipasti` | `primi` | `secondi` | `contorni` | `dolci` | `lievitati` | `basi`)
- `porzioni` (number, > 0) — `tempoPreparazioneMin` (number) — `tempoCotturaMin` (number) — `difficolta` (enum: `facile` | `media` | `impegnativa`)
- `descrizione` (string, max 200 caratteri) — `tags` (string[]) — `preferita` (boolean, default false)
- `ingredienti`: array di `{ nome, quantita?: number, unita?: enum, reparto: enum, note?: string }`
  - `unita`: `g` | `kg` | `ml` | `l` | `cucchiai` | `cucchiaini` | `pezzi` | `spicchi` | `foglie` | `qb`
  - `reparto`: `frutta-verdura` | `carne-pesce` | `latticini` | `dispensa` | `panetteria` | `surgelati` | `bevande` | `altro`
- `passaggi`: array di `{ testo, timerSecondi?: number, timerEtichetta?: string }`
- `creataIl` / `aggiornataIl` (ISO string) — `fonte?` (string)

### Collection ricette seed

Definisci lo schema con Zod nella config delle content collections, **derivato dagli stessi valori enum** dei tipi (una sola fonte di verità, non due elenchi da tenere allineati a mano). Lo schema deve **fallire la build** se un file ricetta ha campi mancanti o malformati: è la rete di sicurezza per quando il proprietario ne aggiungerà una tra sei mesi.

Le ricette seed vengono compilate in un JSON incluso nel bundle e importate nell'archivio locale **al primo avvio**, una volta sola (con un flag di seed versionato). Non devono sovrascrivere le modifiche dell'utente ai riavvii successivi.

Documenta in `README.md` la procedura esatta per aggiungere una ricetta seed, con un file di esempio commentato riga per riga, e la procedura per aggiungerne una dall'app.

### Predisposizione multilingua

L'app è **solo in italiano**, ma va predisposta per aggiungerne altre senza rifattorizzare:

- Attiva la configurazione i18n di Astro con `defaultLocale: 'it'` e `prefixDefaultLocale: false`.
- **Nessuna stringa di interfaccia hardcoded nei componenti o nelle isole.** Tutte le label, i pulsanti, i messaggi di errore, i titoli di sezione, i nomi dei reparti e delle unità stanno in `src/i18n/it.json` e vengono lette da lì tramite un helper tipizzato. Le isole client ricevono le stringhe che servono via `data-*` o via JSON serializzato dal server, non le riscrivono.
- Documenta in `README.md` i passi esatti per aggiungere l'inglese.

---

## Struttura dell'app

| Schermata | Percorso | Note |
|---|---|---|
| Home | `/` | Cosa cucino oggi: preferite, ultime aperte, accesso rapido alle tre modalità |
| Ricette | `/ricette` | Elenco completo con ricerca testuale e filtro per categoria |
| Dettaglio ricetta | `/ricetta/?id=<slug>` | Ingredienti (porzioni scalabili), passaggi, tempi, tasto **Cucina** e **Aggiungi alla spesa** |
| Modalità Cucina | `/cucina/?id=<slug>` | Un passaggio per schermata, timer, avanti/indietro, ripresa dopo chiusura |
| Nuova / modifica ricetta | `/modifica/?id=<slug\|nuovo>` | Editor completo: campi, ingredienti e passaggi aggiungibili/rimovibili/riordinabili |
| Spesa — scelta ricette | `/spesa` | Selezione ricette + porzioni desiderate per ciascuna |
| Spesa — checklist dispensa | `/spesa/dispensa` | Per ogni ingrediente aggregato: "ce l'ho" / "manca" |
| Spesa — lista finale | `/spesa/lista` | Solo ciò che manca, raggruppato per reparto, spuntabile, con azzeramento |
| Impostazioni | `/impostazioni` | Esporta/importa JSON, ricarica ricette seed, azzera dati, versione app |
| Info | `/info` | A cosa serve, come funziona offline, dove stanno i dati |
| 404 | `/404` | Pagina non trovata personalizzata, con link alla home |

Le pagine sono statiche; i contenuti dinamici (ricette dall'archivio) sono resi dalle isole client. Il dettaglio ricetta e la modalità Cucina usano un **query parameter** invece di una route dinamica, perché le ricette create dall'utente non esistono al momento della build: motiva questa scelta in `PLAN.md`.

Ogni schermata deve essere raggiungibile **senza rete** dopo la prima visita.

---

## Modalità Cucina — requisiti dettagliati

- Un passaggio alla volta, testo grande (min 20px, comodo a 22–24px), contrasto alto, pulsanti **avanti/indietro** grandi almeno 56×56px e raggiungibili col pollice.
- Indicatore di avanzamento ("Passaggio 3 di 9") e barra di progresso.
- Se il passaggio ha un timer: pulsante **Avvia timer**, countdown grande `mm:ss`, pausa, azzera, e **+1 minuto**.
- I timer devono essere **calcolati su timestamp assoluti**, non su un contatore di intervalli: se il telefono blocca lo schermo o l'app va in background, alla riapertura il tempo residuo deve essere corretto. Questa logica sta in `src/lib/timer.ts`, è pura (nessun accesso al DOM) e **testata**.
- Alla scadenza: suono generato via Web Audio (nessun file audio esterno), vibrazione se disponibile (`navigator.vibrate`), e notifica visiva sempre presente. Nessun suono senza che l'utente abbia interagito con la pagina.
- **Più timer contemporaneamente** (es. forno e pasta): i timer attivi restano visibili in una barra persistente anche cambiando passaggio.
- **Schermo sempre acceso** durante la modalità Cucina tramite Screen Wake Lock API, con degradazione silenziosa se non supportata. Rilascialo all'uscita.
- **Ripresa**: la sessione di cucina (ricetta, passaggio corrente, timer in corso) è persistita a ogni cambiamento; se si chiude e riapre l'app, l'app propone di riprendere.
- Ingredienti del passaggio consultabili senza perdere il segno (pannello o `<details>`).
- Nessuna animazione che disturbi; `prefers-reduced-motion` rispettato.

---

## Modalità Spesa — requisiti dettagliati

1. **Scelta ricette**: elenco con checkbox e selettore di porzioni per ricetta (default: porzioni della ricetta). Le quantità vengono scalate proporzionalmente.
2. **Aggregazione**: gli ingredienti uguali si sommano. Regole, tutte in `src/lib/spesa.ts` e `src/lib/unita.ts`, pure e **testate**:
   - confronto dei nomi normalizzato (minuscole, spazi, accenti, singolare/plurale non serve gestirlo: normalizza e documenta il limite);
   - conversioni all'interno della stessa famiglia (g↔kg, ml↔l), risultato nell'unità più leggibile (1200 g → 1,2 kg);
   - unità non sommabili tra loro (g e cucchiai) restano **voci separate**, mai convertite a caso;
   - `qb` ("quanto basta") non ha quantità e non si somma: compare una volta;
   - ogni voce aggregata ricorda **da quali ricette proviene** e lo mostra.
3. **Checklist dispensa**: prima della lista finale, ogni voce aggregata va marcata "ce l'ho" o "manca". Lo stato è persistito e riproponibile; deve esserci "segna tutto come mancante" e "segna tutto come presente".
4. **Lista finale**: solo le voci mancanti, raggruppate per reparto nell'ordine tipico di un supermercato, ognuna spuntabile con stato persistito. Contatore "7 di 19". Azioni: azzera spunte, svuota lista, **copia come testo** e **condividi** (Web Share API con fallback a copia negli appunti).
5. Tutta la modalità Spesa funziona offline e sopravvive alla chiusura dell'app.

---

## PWA e offline

- `manifest.webmanifest` completo: `name`, `short_name`, `description`, `start_url` (derivato dalla base), `scope`, `display: standalone`, `orientation: portrait`, `theme_color`, `background_color`, `lang: it`, `icons` (192, 512, più una `maskable`), `categories`.
- Icone generate da te come SVG, coerenti con la palette, poi convertite in PNG con gli strumenti già disponibili nel progetto o nel sistema. Nessuna icona scaricata da internet.
- **Service worker scritto a mano** in `public/sw.js`:
  - registrato solo in produzione, con scope corretto sotto la base path;
  - **precache** dell'app shell (tutte le pagine HTML, CSS, JS, font, icone) generata dalla build: l'elenco dei file non va scritto a mano, va prodotto da uno script che legge `dist/` in fase di post-build;
  - strategia: `cache-first` per gli asset con hash, `network-first con fallback a cache` per i documenti HTML, fallback alla pagina offline quando entrambi mancano;
  - versionamento della cache e pulizia delle vecchie all'`activate`;
  - `skipWaiting` + messaggio all'utente quando è disponibile un aggiornamento (banner discreto "Nuova versione disponibile — Ricarica"), mai un reload forzato.
- Meta tag per l'installazione su iOS (`apple-mobile-web-app-capable`, `apple-touch-icon`, `viewport-fit=cover`, safe-area-inset nel CSS).
- Dopo la prima visita l'app deve aprirsi e funzionare **in modalità aereo**, incluse tutte le schermate e i dati salvati.

---

## Contenuti

Genera tu **8 ricette seed realistiche e coerenti**. Non usare lorem ipsum: ricette italiane vere e cucinabili, con quantità plausibili e passaggi nell'ordine giusto.

Devono stressare il layout e la logica:

- almeno **2 con timer multipli** (una lievitazione lunga, una con più cotture in parallelo);
- una con **titolo molto lungo**, una con titolo di due parole;
- una con **molti ingredienti** (12+), una con **pochissimi** (4);
- almeno una con ingredienti in `cucchiai`/`qb` e una con quantità in `kg`/`l`, per verificare l'aggregazione;
- categorie diverse tra loro, almeno un dolce e un lievitato;
- ingredienti sovrapposti tra ricette diverse (farina, uova, olio), perché l'aggregazione della spesa si veda davvero.

**Immagini**: nessuna foto. Ogni ricetta ha un colore/pattern SVG generato da te dal titolo, coerente con la palette. Niente immagini scaricate da internet, niente riferimenti a URL esterni.

Marca chiaramente ogni testo sostituibile: aggiungi in `README.md` una sezione **"Cosa personalizzare"** con l'elenco puntuale di file e campi (nome app, palette, ricette seed, reparti del supermercato).

---

## Design

Sobrio, funzionale, ad alta leggibilità. Deve trasmettere ordine, non creatività. È uno strumento da cucina, non una vetrina.

- **Palette conservativa**: un primario scuro e desaturato, un neutro caldo per gli sfondi, un accento usato con parsimonia (solo per azioni e timer attivi). Definiti come custom properties in `:root`. **Tema chiaro e scuro** via `prefers-color-scheme`, con override manuale nelle impostazioni.
- **Tipografia**: due font al massimo, con una scala tipografica coerente (non valori a caso). Testo del corpo tra 16 e 18px, altezza riga 1.6, larghezza massima delle righe di testo tra 65 e 75 caratteri. In modalità Cucina la scala sale.
- **Spaziatura** da una scala definita, non improvvisata: `--space-1` … `--space-8`.
- **Mobile-first** — è un'app da telefono: progetta a 360px e adatta in su. Breakpoint a 640, 1024.
- Griglie con CSS Grid, niente framework.
- **Target di tocco** minimo 44×44px, 56×56px per le azioni principali della modalità Cucina.
- **Accessibilità**: contrasto minimo 4.5:1, focus visibile su tutti gli elementi interattivi, skip link, navigazione completa da tastiera, `aria-live` per timer e messaggi di stato, `prefers-reduced-motion` rispettato, `lang="it"` su `<html>`.
- Animazioni minime: solo transizioni brevi su hover e focus. Niente parallasse, niente comparse allo scroll.

---

## Definizione di Fatto

Il lavoro è concluso **solo** quando ogni riga qui sotto passa. Esegui i comandi, non stimare i risultati. Riporta l'output reale in `RESULTS.md`.

| # | Check | Come lo verifichi | Soglia |
|---|---|---|---|
| 1 | Build | `npm run build` | exit code 0, zero warning |
| 2 | Type check | `npx astro check` | 0 errori, 0 warning |
| 3 | Pagine raggiungibili | `npm run preview` + `node scripts/check-pages.mjs` | **tutte** le pagine dell'app rispondono 200 |
| 4 | 404 | richiesta a un URL inesistente | serve la pagina 404 personalizzata |
| 5 | Lighthouse home (mobile) | `npx lighthouse <url> --output=json` | Performance ≥ 95, Accessibilità ≥ 95, Best Practices ≥ 95 |
| 6 | Lighthouse modalità Cucina | idem su `/cucina/?id=<slug>` | stesse soglie |
| 7 | PWA installabile | manifest valido, SW registrato, icone presenti; verifica con Lighthouse e ispezione di `dist/` | manifest e SW presenti e coerenti con la base path |
| 8 | HTML valido | `npx html-validate "dist/**/*.html"` | 0 errori |
| 9 | Link interni | `npx linkinator dist --recurse` | 0 link rotti |
| 10 | Test | `npm test` | tutti verdi: timer (pausa, ripresa, background, scadenza), unità (conversioni, unità incompatibili, `qb`), aggregazione spesa, scalatura porzioni, validazione ricetta, import/export JSON |
| 10b | Astrazione storage | `grep -rn "localStorage" src --include="*.ts" --include="*.astro" \| grep -v "archivio-locale.ts"` | nessuna corrispondenza |
| 11 | Schema collection | aggiungi un `.md` di prova con un campo obbligatorio mancante, poi builda | la build **deve fallire** con errore leggibile. Poi elimina il file di prova |
| 12 | Zero dipendenze runtime e zero domini terzi | `node scripts/check-no-deps.mjs` + `grep -rIn -E "https?://(?!localhost)" dist src` | nessuna richiesta a domini terzi, nessuna dipendenza runtime non giustificata |
| 13 | Vulnerabilità | `npm audit --audit-level=high` | 0 problemi high o critical |
| 14 | Responsive | screenshot a 360px, 768px, 1280px di ogni schermata | nessun overflow orizzontale, nessun testo tagliato |
| 15 | i18n | `grep` di stringhe di interfaccia hardcoded nei componenti | tutte le label passano da `src/i18n/it.json` |
| 16 | Flussi funzionali | test end-to-end con browser headless già disponibile: crea ricetta → appare in elenco → apri dettaglio → scala porzioni → avvia modalità Cucina → parte un timer → selezionala nella spesa → checklist dispensa → lista finale corretta | tutti i passaggi riusciti, screenshot allegati |
| 17 | Offline | carica l'app, poi blocca la rete e ricarica ogni schermata | tutte le schermate si aprono e i dati restano |
| 18 | Base path | build con base `/repo/` e con base `/` | in entrambi i casi nessun link, asset, SW o manifest rotto |

**Se un check fallisce, correggi e rilancia.** Non passare al successivo lasciandone uno rosso indietro e non archiviare un fallimento come "accettabile".

Lo script `scripts/check-pages.mjs` scrivilo tu: legge l'elenco delle pagine da `dist/`, le richiede sul server di preview, stampa una tabella URL/status e chiude con exit code 1 se anche solo una non è 200.

---

## Consegna finale

Quando tutti i check sono verdi, produci `RESULTS.md` con:

1. Tabella dei check con esito e **output reale** dei comandi.
2. Punteggi Lighthouse per esteso.
3. Elenco delle decisioni prese in autonomia (ricopiate da `PLAN.md`).
4. Elenco di cosa il proprietario deve fare per andare online: abilitare GitHub Pages, comandi di deploy, come installare l'app sul telefono (iOS e Android).
5. Peso totale del `dist/` e peso della singola pagina più pesante.

Poi fammi un riepilogo di massimo 10 righe in chat.
