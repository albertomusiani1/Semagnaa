# PLAN.md — Semagnaa, app personale di cucina (PWA)

Piano di lavoro operativo, memoria della sessione. Aggiornato a ogni fase completata.

## Stato attuale

- 2026-09-01 18:35 — PLAN.md creato, inizio fase Setup.
- 2026-09-01 18:37 — Setup completato: Astro 7.2.10, TS strict, font WOFF2 self-hostati.
- 2026-09-01 18:50 — Libreria pura (tipi, unità, scala, spesa, timer, validazione, archivio) + 44 test verdi.
- 2026-09-01 18:55 — Design system CSS, i18n completo, 9 ricette seed con schema Zod.
- 2026-09-01 19:05 — Tutte le pagine e le isole client scritte; prima build verde.
- 2026-09-01 19:10 — PWA completa (manifest generato, service worker + precache), `astro check` 0/0/0.
- 2026-09-01 19:30 — **Tutte le 18 verifiche della Definizione di Fatto passano.** Vedi `RESULTS.md`.
- 2026-09-01 19:35 — README, RESULTS.md, workflow GitHub Pages. Lavoro completo.

---

## Task list

### Fase 1 — Setup
- [x] Progetto Astro 7.2.10 (installer non utilizzabile: vedi decisione 1) + TypeScript strict
- [x] `astro.config.mjs`: output static, base path da variabile d'ambiente, i18n `it`
- [x] `package.json`: `engines.node >= 22.11`, script build/preview/check/test/verifiche
- [x] `.gitignore`
- [x] Versioni esatte registrate in `## Versioni installate`

### Fase 2 — Design system
- [x] `src/styles/global.css`: reset, palette, scala tipografica 1.2, scala spaziature `--space-1…8`
- [x] Tema chiaro/scuro da sistema + override manuale (`data-tema`)
- [x] Font Instrument Sans 400/700 e Lora 700, WOFF2 sottoinsieme latino, `font-display: swap`
- [x] Focus visibile, skip link, target 44/56 px, `prefers-reduced-motion`, safe-area iOS

### Fase 3 — Modello dati e storage
- [x] `src/lib/tipi.ts` — fonte di verità unica di categorie, unità, reparti, difficoltà
- [x] `src/lib/archivio.ts` — interfaccia astratta di persistenza (asincrona)
- [x] `src/lib/archivio-locale.ts` — unica implementazione, unico file che nomina `localStorage`
- [x] `src/lib/validazione.ts` — validazione editor e importazione, senza Zod nel bundle client
- [x] `src/lib/unita.ts`, `scala.ts`, `spesa.ts`, `timer.ts`, `testo.ts`, `esito.ts` — puri e testati
- [x] `src/i18n/it.json` + helper tipizzato (`T`, `t()`, `interpola()`)

### Fase 4 — Layout e componenti
- [x] `src/layouts/Base.astro` — head, meta PWA e iOS, skip link, barra inferiore, banner aggiornamento
- [x] `Icona.astro` (SVG inline), `BarraNav.astro`, `Marchio.astro`, `Avvio.astro` (tema + service worker)
- [x] `src/lib/viste.ts` e `segnaposto.ts` — schede e immagini generate lato client

### Fase 5 — Pagine
- [x] `/` Oggi: preferite, recenti, ripresa sessione, scorciatoie
- [x] `/ricette/` ricerca (titolo, tag, ingredienti) + filtro categoria
- [x] `/ricetta/?id=` dettaglio con porzioni scalabili, preferita, elimina, aggiungi alla spesa
- [x] `/modifica/?id=` editor completo con righe aggiungibili, rimovibili, riordinabili
- [x] `/impostazioni/` tema, esporta/importa JSON, ricarica seed, azzera
- [x] `/info/` e `/404`

### Fase 6 — Collection ricette seed
- [x] `src/content.config.ts` con schema Zod derivato dagli enum di `tipi.ts`
- [x] 9 ricette seed (una in più delle 8 richieste) che stressano layout e aggregazione
- [x] `dati/ricette-seed.json` generato in build; seed non distruttivo e versionato

### Fase 7 — Modalità Cucina
- [x] Un passaggio per schermata, progresso, avanti/indietro 56 px, frecce da tastiera
- [x] Timer su timestamp assoluti, corretti dopo blocco schermo o app in background
- [x] Timer multipli in barra persistente anche cambiando passaggio
- [x] Bip Web Audio + vibrazione + `aria-live`
- [x] Screen Wake Lock con degradazione silenziosa e rilascio all'uscita
- [x] Ripresa della sessione con dialogo

### Fase 8 — Modalità Spesa
- [x] `/spesa/` scelta ricette + porzioni per ricetta
- [x] `/spesa/dispensa/` checklist "manca / ce l'ho", con "segna tutto"
- [x] `/spesa/lista/` solo il mancante, per reparto, spuntabile, copia + condividi

### Fase 9 — PWA e offline
- [x] `manifest.webmanifest` generato dalla base path, con shortcuts e icona maskable
- [x] Icone SVG + PNG 180/192/512 + maskable, generate dall'SVG con sharp
- [x] `public/sw.js` scritto a mano; `scripts/gen-precache.mjs` inietta elenco e versione
- [x] Banner "nuova versione", nessun reload forzato
- [x] Meta iOS e `viewport-fit=cover`

### Fase 10 — Test
- [x] 44 test con `node --test` (timer, unità, spesa, scala, validazione, import/export)
- [x] `scripts/check-pages.mjs`, `check-no-deps.mjs`
- [x] `scripts/verifica-flussi.mjs`, `verifica-responsive.mjs`, `verifica-offline.mjs`

### Fase 11 — Verifiche finali (Definizione di Fatto)
- [x] 1 build (0 warning) / 2 `astro check` 0 errori 0 warning 0 hint
- [x] 3 tutte le pagine 200 / 4 404 personalizzata
- [x] 5 Lighthouse home 99/100/100/100 / 6 Lighthouse cucina 99/100/100/100
- [x] 7 PWA installabile, manifest e SW coerenti con la base path
- [x] 8 `html-validate` 0 errori / 9 `linkinator` 0 link rotti
- [x] 10 `npm test` 44/44 / 10b nessun `localStorage` fuori da `archivio-locale.ts`
- [x] 11 schema collection: build fallita con errore leggibile, file di prova rimosso
- [x] 12 zero dipendenze runtime estranee e zero domini terzi
- [x] 13 `npm audit --audit-level=high`: 0 vulnerabilità
- [x] 14 responsive 33/33 viste senza overflow / 15 nessuna stringa hardcoded
- [x] 16 flussi funzionali 27/27 / 17 offline su tutte le schermate / 18 base path `/repo/` e `/`
- [x] `RESULTS.md` con l'output reale

---

## Decisioni prese in autonomia

1. **Progetto Astro creato a mano invece che con `npm create astro@latest`.**
   L'installer scarica i template da `codeload.github.com`, bloccato in questo ambiente
   (HTTP 403 dal proxy). Ho installato `astro@latest` dal registry npm — la versione è
   comunque quella corrente, 7.2.10 — e ho scritto io `astro.config.mjs`, `tsconfig.json`
   (che estende `astro/tsconfigs/strict`) e la struttura delle cartelle.
   *Scartato*: fissare a memoria una versione più vecchia, o rinunciare a TS strict.

2. **Ricette raggiunte per query parameter (`/ricetta/?id=...`) e non per route dinamica.**
   Le ricette create dall'utente non esistono al momento della build, quindi non possono
   avere una pagina statica. Un unico modello (pagina statica + isola che legge
   dall'archivio) vale per le ricette di esempio e per quelle nuove.
   *Scartato*: generare pagine statiche per le sole seed, con due strade diverse da
   mantenere e link rotti per le ricette dell'utente.

3. **Validazione client scritta a mano invece di riusare Zod.**
   Zod è già nel progetto (dipendenza di Astro) e valida le ricette seed in build, ma
   spedirlo al browser peserebbe più di tutto il resto dell'app. La validazione client
   legge gli stessi elenchi `as const` di `tipi.ts`, quindi i valori ammessi non possono
   divergere.
   *Scartato*: importare `astro/zod` nelle isole (bundle molto più grande) o non validare
   affatto l'importazione JSON (dati corrotti nell'archivio).

4. **`localStorage` invece di IndexedDB.**
   I dati sono piccoli (decine di ricette, pochi KB) e non serve nessuna migrazione di
   schema. L'interfaccia `Archivio` è però **asincrona**, quindi il passaggio a IndexedDB
   è un nuovo file e una riga di import.
   *Scartato*: IndexedDB subito, con complessità di apertura, versioni e transazioni non
   giustificata dalla mole di dati.

5. **Il tema salvato si applica da un modulo, non da uno script inline.**
   Un `<script is:inline>` avrebbe evitato ogni sfarfallio, ma dovrebbe leggere
   `localStorage` dentro un componente, rompendo l'astrazione dell'archivio (verifica 10b).
   Il tema "come il sistema" — quello predefinito — è comunque istantaneo, perché gestito
   in CSS con `prefers-color-scheme`: il possibile sfarfallio riguarda solo chi forza
   manualmente un tema contrario a quello di sistema.
   *Scartato*: leggere lo storage in linea, o salvare il tema in un cookie (secondo
   meccanismo di persistenza per un solo valore).

6. **Le stringhe di interfaccia sono importate da `it.json` anche nelle isole client.**
   Vite le mette in un chunk condiviso, quindi non c'è duplicazione, e il tipo del
   dizionario protegge dai refusi nelle chiavi.
   *Scartato*: serializzare le stringhe in `<script type="application/json">` per ogni
   pagina — più codice, nessun controllo di tipo, stesso peso.

7. **Font Instrument Sans e Lora presi da file già presenti nel sistema, con licenza OFL.**
   Non era possibile (né desiderabile) scaricarli da Internet; sono stati sottoinsiemati al
   latino e convertiti in WOFF2 con `pyftsubset`. Le licenze OFL sono in `public/fonts/`.
   *Scartato*: Google Fonts via CDN (richiesta a dominio terzo, vietata dal progetto) o
   solo font di sistema (nessun carattere self-hosted, come chiedeva il vincolo).

8. **Nessuna sitemap e nessun `@astrojs/sitemap`.**
   È un'app personale dietro una base path, non un sito da indicizzare. La verifica 3 legge
   quindi l'elenco delle pagine da `dist/` invece che da una sitemap.
   *Scartato*: generare una sitemap che nessun motore ha motivo di leggere.

9. **Tre dipendenze di sviluppo installate: `@astrojs/check`, `typescript`, `@types/node`.**
   Servono alla verifica 2 (`npx astro check` le richiede) e a tipizzare i test scritti con
   il runner nativo di Node. Non finiscono nel bundle: `dependencies` contiene solo `astro`,
   ed è quello che controlla `scripts/check-no-deps.mjs`.

10. **Playwright non è una dipendenza del progetto.**
    Le verifiche 14, 16 e 17 girano in un browser vero tramite Playwright, ma gli script
    lo importano dinamicamente (`PLAYWRIGHT_MODULE`) e sono documentati come opzionali:
    l'app non deve trascinarsi dietro un browser per essere costruita.

11. **9 ricette seed invece di 8.** La nona (`Pollo al limone con patate al forno`) serviva
    per avere un caso reale di **due cotture in parallelo** distinto dalla lievitazione
    lunga della focaccia.

12. **Etichette brevi sui pulsanti della modalità Cucina** ("Indietro" / "Avanti" / "Fine")
    con `aria-label` completo ("Passaggio precedente"…). A 360 px le etichette lunghe
    andavano a capo dentro pulsanti da 56 px: illeggibili proprio nel momento in cui
    l'app va guardata di sfuggita.

---

## Versioni installate

| Cosa | Versione |
|---|---|
| Node.js | 22.22.2 (LTS attiva; `engines.node: >=22.11.0`) |
| npm | 10.9.7 |
| Astro | 7.2.10 |
| TypeScript | 6.0.3 (devDependency) |
| @astrojs/check | 0.9.10 (devDependency) |
| @types/node | 26.4.0 (devDependency) |
| Zod | 4.5.4 (transitiva di Astro, usata solo in build per lo schema delle collection) |
| Vite | 8.2.2 (transitiva di Astro) |
| Dipendenze runtime | **solo `astro`** |

Strumenti usati solo per le verifiche, non installati nel progetto: `lighthouse`,
`html-validate`, `linkinator` (via `npx`), Playwright (globale nell'ambiente),
`pyftsubset` (conversione dei font, una volta sola).

---

## Problemi aperti

Nessuno che blocchi l'uso dell'app. Limiti noti e voluti, documentati nel README:

1. **Nessuna sincronizzazione tra dispositivi**: i dati stanno nel browser del telefono.
   Il travaso si fa con l'esportazione JSON. È una conseguenza del vincolo "nessun backend".
2. **L'aggregazione della spesa non gestisce singolare/plurale né sinonimi**: "pomodoro" e
   "pomodori" restano due voci. Normalizzare oltre (minuscole, accenti, spazi) richiederebbe
   un vocabolario italiano, sproporzionato qui.
3. **Screen Wake Lock non esiste su iOS**: lo schermo si può spegnere durante la cottura.
   I timer restano corretti perché calcolati su timestamp assoluti.
4. **Nessuna notifica di sistema**: se l'app è chiusa, alla scadenza non suona niente; alla
   riapertura il timer risulta già scaduto. Servirebbe il permesso notifiche e un push
   server, che l'app per scelta non ha.
5. **Sfarfallio possibile solo con tema forzato** contrario a quello di sistema (decisione 5).
