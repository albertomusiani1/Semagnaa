# RESULTS.md — esito delle verifiche

App: **Semagnaa**, app personale di cucina (PWA statica).
Verifiche eseguite il **2026-09-01** su Node 22.22.2, Astro 7.2.10, base `/Semagnaa/`.
Rilanciate integralmente dopo il secondo giro di modifiche (stile luminoso, schede senza
immagine e descrizione, filtri richiudibili, nuovo editor): vedi §7.
Tutti gli output qui sotto sono **copiati dai comandi realmente eseguiti** (log completi in
`verifiche/`, cartella non versionata).

**Esito complessivo: 18 verifiche su 18 verdi.**

---

## 1. Tabella delle verifiche

| # | Verifica | Comando | Soglia | Esito |
|---|---|---|---|---|
| 1 | Build | `npm run build` | exit 0, zero warning | ✅ exit 0, 0 warning |
| 2 | Type check | `npx astro check` | 0 errori, 0 warning | ✅ 0 errori, 0 warning, 0 hint (49 file) |
| 3 | Pagine raggiungibili | `npm run preview` + `node scripts/check-pages.mjs` | tutte 200 | ✅ 13/13 a 200 |
| 4 | 404 | richiesta a URL inesistente | pagina 404 personalizzata | ✅ `404 Not Found` + pagina dell'app |
| 5 | Lighthouse home (mobile) | `npx lighthouse` | Perf ≥95, A11y ≥95, BP ≥95 | ✅ 99 / 100 / 100 (SEO 100) |
| 6 | Lighthouse modalità Cucina | idem su `/cucina/?id=…` | stesse soglie | ✅ 99 / 100 / 100 (SEO 100); anche `/ricette/` 98 e `/modifica/` 99 |
| 7 | PWA installabile | ispezione di `dist/` + Lighthouse | manifest e SW coerenti con la base | ✅ manifest, SW, 4 icone, meta iOS |
| 8 | HTML valido | `npx html-validate "dist/**/*.html"` | 0 errori | ✅ exit 0, nessun errore |
| 9 | Link interni | `npx linkinator … --recurse` | 0 link rotti | ✅ 22 link, 0 rotti |
| 10 | Test | `npm test` | tutti verdi | ✅ 61/61 |
| 10b | Astrazione storage | `grep -rn localStorage src \| grep -v archivio-locale.ts` | nessuna corrispondenza | ✅ nessuna corrispondenza |
| 11 | Schema collection | `.md` con campo mancante + build | la build **deve** fallire | ✅ exit 1 con errore leggibile, file rimosso |
| 12 | Dipendenze e domini terzi | `node scripts/check-no-deps.mjs` | nessuna dipendenza runtime estranea | ✅ solo `astro`, nessun dominio terzo |
| 13 | Vulnerabilità | `npm audit --audit-level=high` | 0 high/critical | ✅ 0 vulnerabilità |
| 14 | Responsive | `npm run verifica:responsive` (360/768/1280) | nessun overflow, nessun testo tagliato | ✅ 33/33 viste |
| 15 | i18n | grep dei testi letterali nei template | tutte le label da `it.json` | ✅ nessun testo hardcoded |
| 16 | Flussi funzionali | `npm run verifica:flussi` | tutti i passaggi riusciti | ✅ 47/47, 0 errori in pagina |
| 17 | Offline | `npm run verifica:offline` | tutte le schermate si aprono senza rete | ✅ 10/10 schermate + dati intatti |
| 18 | Base path | build con `/Semagnaa/` e con `/` | nessun link, asset, SW o manifest rotto | ✅ entrambe le configurazioni |

---

## 2. Output reale dei comandi

### 1. Build — exit 0, zero warning

```
$ npm run build
19:26:20 [content] Syncing content
19:26:21 [content] Synced content
19:26:21 [types] Generated 1.69s
19:26:21 [build] output: "static"
19:26:21 [build] mode: "static"
19:26:21 [build] Collecting build info...
19:26:21 [build] ✓ Completed in 1.77s.
19:26:21 [build] Building static entrypoints...
19:26:22 [vite] ✓ built in 1.17s
19:26:22 [vite] ✓ built in 128ms

 generating static routes
19:26:22   ├─ /404.html (+20ms)
19:26:22   ├─ /cucina/index.html (+6ms)
19:26:22   ├─ /dati/ricette-seed.json (+7ms)
19:26:22   ├─ /impostazioni/index.html (+5ms)
19:26:22   ├─ /info/index.html (+4ms)
19:26:22   ├─ /manifest.webmanifest (+3ms)
19:26:22   ├─ /modifica/index.html (+5ms)
19:26:22   ├─ /ricetta/index.html (+4ms)
19:26:22   ├─ /ricette/index.html (+5ms)
19:26:22   ├─ /spesa/dispensa/index.html (+5ms)
19:26:22   ├─ /spesa/lista/index.html (+4ms)
19:26:22   ├─ /spesa/index.html (+4ms)
19:26:22   ├─ /index.html (+3ms)
19:26:22 ✓ Completed in 92ms.

19:26:22 [build] 11 page(s) built in 3.22s
19:26:22 [build] Complete!
gen-precache: 41 file in precache, versione fec58eede414, dist 287.4 kB
```

`grep -ci warn` sull'output della build: **0**.

### 2. Type check

```
$ npx astro check
[check] Getting diagnostics for Astro files in /home/user/Semagnaa...
Result (58 files):
- 0 errors
- 0 warnings
- 0 hints
```

### 3. Pagine raggiungibili

```
$ node scripts/check-pages.mjs
URL                      STATO  ESITO
/                        200    OK
/404.html                200    OK
/cucina/                 200    OK
/dati/ricette-seed.json  200    OK
/impostazioni/           200    OK
/info/                   200    OK
/manifest.webmanifest    200    OK
/modifica/               200    OK
/ricetta/                200    OK
/ricette/                200    OK
/spesa/                  200    OK
/spesa/dispensa/         200    OK
/spesa/lista/            200    OK

13/13 risorse rispondono 200.
```

### 4. Pagina 404

```
$ curl -i http://localhost:4321/Semagnaa/questa-pagina-non-esiste/
HTTP/1.1 404 Not Found
Content-Type: text/html
Content-Length: 6731

$ curl -s http://localhost:4321/Semagnaa/questa-pagina-non-esiste/ | grep -o "<title>[^<]*</title>"
<title>Pagina non trovata · Semagnaa</title>
```

### 5-6. Lighthouse (form factor **mobile**, Chromium headless)

```
home     : perf 99 | a11y 100 | best-practices 100 | seo 100 | FCP 1.5 s | LCP 1.8 s | CLS 0     | TBT 0 ms
ricette  : perf 98 | a11y 100 | best-practices 100 | seo 100 | FCP 1.5 s | LCP 2.0 s | CLS 0.064 | TBT 0 ms
cucina   : perf 99 | a11y 100 | best-practices 100 | seo 100 | FCP 1.4 s | LCP 1.8 s | CLS 0.049 | TBT 0 ms
modifica : perf 99 | a11y 100 | best-practices 100 | seo 100 | FCP 1.6 s | LCP 1.8 s | CLS 0     | TBT 0 ms
```

URL misurati: `/Semagnaa/`, `/Semagnaa/ricette/`,
`/Semagnaa/cucina/?id=focaccia-genovese-a-lunga-lievitazione-in-teglia`,
`/Semagnaa/modifica/`. Le ultime due non erano richieste: sono la pagina con i filtri e
quella con più moduli, quindi le più a rischio sul fronte accessibilità.

Nessun audit di accessibilità o best practices fallito su nessuna delle quattro pagine.
Sull'elenco ricette il primo giro dava 98 in accessibilità per un salto di livello nei
titoli (schede in `h3` sotto un `h1`): le schede ora usano `h2` quando la griglia sta
subito sotto il titolo della pagina.

### 7. PWA

```
$ grep -E '"start_url"|"scope"|icona' dist/manifest.webmanifest
  "start_url": "/Semagnaa/",
  "scope": "/Semagnaa/",
      "src": "/Semagnaa/icone/icona-192.png",
      "src": "/Semagnaa/icone/icona-512.png",
      "src": "/Semagnaa/icone/icona-maskable-512.png",
      "src": "/Semagnaa/icone/icona.svg",

$ sed -n '14,17p' dist/sw.js
const VERSIONE = 'fec58eede414';
const BASE = '/Semagnaa/';
const PRECACHE = [
  "/Semagnaa/",

$ grep -c '"/Semagnaa/' dist/sw.js        # voci di precache con la base corretta
41

$ grep -o 'rel="manifest" href="[^"]*"' dist/index.html
rel="manifest" href="/Semagnaa/manifest.webmanifest"

$ grep -o 'apple-mobile-web-app[^>]*' dist/index.html
apple-mobile-web-app-capable" content="yes"
apple-mobile-web-app-title" content="Semagnaa"
apple-mobile-web-app-status-bar-style" content="default"
```

Il service worker risulta attivo dopo la prima visita (vedi verifica 17), il manifest è
`display: standalone` con icona `maskable`, e le icone sono presenti in
`dist/icone/` (SVG + PNG 180/192/512 + maskable 512).

### 8. HTML valido

```
$ npx html-validate "dist/**/*.html"
exit code: 0
```

Nessun output: 0 errori su 11 file HTML. (Errori trovati e risolti strada facendo: stili
inline, un `<h1>` vuoto, e i gruppi di checkbox dei filtri che vanno nominati `nome[]`
perché non risultino nomi duplicati.)

### 9. Link interni

```
$ npx linkinator http://localhost:4321/Semagnaa/ --recurse --skip albertomusiani1.github.io
✓ Successfully scanned 22 links in 0.148 seconds.
```

`--skip` esclude solo l'URL canonico del sito **non ancora pubblicato**
(`https://albertomusiani1.github.io/Semagnaa/`): dopo il primo deploy risponderà.

### 10. Test della logica

```
$ npm test
1..61
# tests 61
# suites 0
# pass 61
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 670.593687
```

Copertura dei casi richiesti:

| Area | Casi coperti |
|---|---|
| `timer.ts` | creazione, avvio, scorrimento reale, pausa/ripresa, **app in background** (7 minuti di schermo bloccato), scadenza a app chiusa (24 h), `+1 minuto` anche da scaduto, azzeramento, formattazione `mm:ss` e `h:mm:ss`, percentuale, riavvio da scaduto |
| `unita.ts` | famiglie di unità, conversioni `g↔kg` e `ml↔l`, rifiuto di unità incompatibili, `qb` non sommabile, promozione a `kg`/retrocessione a `ml`, formattazione con virgola decimale |
| `spesa.ts` | somma tra ricette diverse, promozione a kg, unità incompatibili come voci separate, `qb` una volta sola, scalatura prima della somma, nomi equivalenti uniti, ricetta inesistente ignorata, ordine dei reparti, esclusione di ciò che si ha in dispensa, testo per la condivisione |
| `scala.ts` | fattore di scala, arrotondamenti da cucina (mezzi per pezzi/spicchi/foglie), voci senza quantità intatte |
| `validazione.ts` | ricetta valida normalizzata, id unico, titolo mancante, categoria/reparto/unità fuori elenco, porzioni non valide, ingredienti/passaggi vuoti, timer non numerico, virgola decimale, `qb` senza numero, importazione (JSON rotto, formato sbagliato, file vuoto), **andata e ritorno esportazione → importazione** |
| `filtri.ts` | tempo totale, attesa massima e totale, attesa "rilevante" (timer o cottura dichiarata), confini delle fasce di durata, attese lunghe, molti passaggi, filtro per categoria/difficoltà/durata/attese/passaggi, combinazione in AND, ricerca testuale su titolo, tag e ingredienti, conteggio dei filtri attivi |
| `ordine.ts` | gruppo di ogni ingrediente (basi, liquidi, latticini, carne, verdure, grassi, aromi, quanto basta), conserve di verdura trattate come verdure, ordine completo "da libro di cucina", quantità grandi prima dentro il gruppo, `qb` sempre in fondo, array originale non modificato |

### 10b. Astrazione dello storage

```
$ grep -rn "localStorage" src --include="*.ts" --include="*.astro" | grep -v "archivio-locale.ts"
(nessuna corrispondenza)
```

### 11. Lo schema della collection fa fallire la build

Aggiunto `src/content/ricette/prova-schema-rotta.md` senza il campo `categoria`:

```
$ npm run build
19:34:36 [content] Syncing content
[InvalidContentEntryDataError] ricette → prova-schema-rotta data does not match collection schema.

  categoria: Invalid option: expected one of "antipasti"|"primi"|"secondi"|"contorni"|"dolci"|"lievitati"|"basi"

  Location:
    /home/user/Semagnaa/src/content/ricette/prova-schema-rotta.md:0:0
exit code: 1
```

File di prova **rimosso**; build successiva verde.

### 12. Dipendenze e domini terzi

```
$ node scripts/check-no-deps.mjs
devDependencies presenti: @astrojs/check, @types/node, typescript
Nessuna dipendenza runtime estranea e nessun riferimento a domini terzi.
```

`dependencies` contiene **solo `astro`**. Le tre devDependencies servono al type check e ai
tipi del runner di test, e non entrano nel bundle.

### 13. Vulnerabilità

```
$ npm audit --audit-level=high
found 0 vulnerabilities
```

### 14. Responsive (360 / 768 / 1280 px, 11 schermate)

```
$ npm run verifica:responsive
home             @ 360px  scroll  360 / client  360  OK
ricette          @ 360px  scroll  360 / client  360  OK
ricetta          @ 360px  scroll  360 / client  360  OK
cucina           @ 360px  scroll  360 / client  360  OK
modifica         @ 360px  scroll  360 / client  360  OK
spesa            @ 360px  scroll  360 / client  360  OK
spesa-dispensa   @ 360px  scroll  360 / client  360  OK
spesa-lista      @ 360px  scroll  360 / client  360  OK
impostazioni     @ 360px  scroll  360 / client  360  OK
info             @ 360px  scroll  360 / client  360  OK
404              @ 360px  scroll  360 / client  360  OK
… idem a 768 px e a 1280 px …

33/33 viste senza overflow orizzontale né testo tagliato.
```

Il controllo non guarda solo `scrollWidth` del documento: cerca anche gli elementi con
contenuto tagliato (`scrollWidth > clientWidth` con `overflow-x: visible`). Screenshot di
tutte le 33 viste in `verifiche/screenshot/`; cinque, ridotte, sono nel README.

Correzione fatta durante questa verifica: nella checklist dispensa, sotto i 480 px la coppia
"manca / ce l'ho" va a capo e prende tutta la riga, altrimenti il nome dell'ingrediente si
spezzava su tre righe.

### 15. i18n — nessuna stringa di interfaccia nel codice

```
$ grep -rnoE ">[^<>{}]*[A-Za-zÀ-ÿ]{3,}[^<>{}]*<" src/components src/layouts src/pages --include="*.astro"
(nessuna corrispondenza: ogni testo dei template passa da {T.*})
```

Il grep cerca i nodi di testo dei template che **non** siano un'espressione `{…}`. Anche le
isole client importano il dizionario (`import { T } from '../i18n'`) invece di scrivere
testo: le uniche stringhe letterali nei componenti sono selettori CSS, nomi di classe e
chiavi di stato.

### 16. Flussi funzionali (browser vero, Chromium)

```
$ npm run verifica:flussi
OK       home mostra le ricette seed (9 ricette in archivio)
OK       elenco mostra 9 ricette (trovate 9)
OK       ricerca filtra
OK       filtro categoria dolci
OK       editor: tag suggerito e tag nuovo aggiunti (bambini | prova e2e)
OK       editor: primo ingrediente in elenco
OK       editor: ingrediente noto compila unità e reparto (g / dispensa)
OK       editor: tre ingredienti in elenco
OK       editor: rifiuta un ingrediente senza nome
OK       editor: due passaggi in elenco
OK       editor: riordino dei passaggi (Porta in tavola.)
OK       salvataggio porta al dettaglio
OK       dettaglio mostra il titolo
OK       dettaglio mostra 3 ingredienti
OK       ingredienti ordinati come nei libri (q.b. in fondo) (Pane | Pomodori pelati | Sale)
OK       cottura mostrata in ore e minuti (Antipasti | Preparazione: 10 min | Cottura: 1 h 30 min | Totale: 1 h 40 min | Difficoltà: Facile)
OK       niente descrizione nel dettaglio
OK       porzioni scalate a 4
OK       quantità raddoppiate (600 g | 400 g | q.b.)
OK       la nuova ricetta è in elenco
OK       le schede non hanno immagine di anteprima
OK       le schede non hanno descrizione
OK       i filtri partono chiusi
OK       i filtri si aprono
OK       filtro per difficoltà (1 ricette)
OK       conteggio dei filtri attivi
OK       azzera i filtri
OK       filtro per attese lunghe (Brodo vegetale | Focaccia genovese… | Ragù… | Tiramisù classico)
OK       filtro per durata (Frittata di zucchine | Insalata di finocchi e arance | Risotto allo zafferano | Tiramisù classico)
OK       filtro per numero di passaggi (Focaccia genovese… | Ragù alla bolognese della domenica)
OK       cucina: contatore passaggi
OK       cucina: avanti
OK       cucina: timer visibile al passaggio 2
OK       cucina: il timer scorre (02:00 -> 01:59)
OK       cucina: barra timer attivi
OK       cucina: la pausa ferma il conto
OK       cucina: il timer resta in barra cambiando passaggio
OK       cucina: propone di riprendere
OK       cucina: riprende dal passaggio giusto
OK       spesa: due ricette selezionate (2 ricette selezionate)
OK       dispensa: voci aggregate (13 voci)
OK       dispensa: farina aggregata in kg (… Farina 0 — 1 kg | Olio extravergine di oliva — 80 ml …)
OK       lista: contiene solo cio che manca (dispensa 13, lista 12)
OK       lista: la voce "ce l'ho" è esclusa (Lievito di birra fresco — 10 g)
OK       lista: raggruppata per reparto
OK       lista: contatore spunte (1 di 12)
OK       lista: le spunte sopravvivono al ricaricamento

47/47 passi riusciti
```

Nessun errore JavaScript né messaggio di errore in console durante tutto il percorso
(lo script fallisce anche su un solo `console.error`).

### 17. Offline

```
$ npm run verifica:offline
service worker attivo dopo la prima visita: OK
--- rete staccata ---
OK       home           Oggi · Semagnaa
OK       ricette        Ricette · Semagnaa
OK       ricetta        Brodo vegetale · Semagnaa
OK       cucina         Brodo vegetale · In cucina
OK       modifica       Modifica ricetta · Semagnaa
OK       spesa          Spesa · Semagnaa
OK       dispensa       Dispensa · Semagnaa
OK       lista          Lista della spesa · Semagnaa
OK       impostazioni   Impostazioni · Semagnaa
OK       info           Come funziona · Semagnaa
OK      lista della spesa offline: 7 voci
OK      ricette in archivio offline: 9

Tutte le schermate si aprono senza rete.
```

### 18. Base path

```
$ BASE_PATH=/Semagnaa/ npm run build          # default (GitHub Pages di progetto)
href="/Semagnaa/manifest.webmanifest"
href="/Semagnaa/favicon.svg"
href="/Semagnaa/_astro/Base.CYvupt3S.css"
  "start_url": "/Semagnaa/",
  "scope": "/Semagnaa/",
15:const BASE = '/Semagnaa/';
url(/Semagnaa/fonts/instrument-sans-400.woff2)

$ BASE_PATH=/ SITE_URL=https://esempio.it npm run build   # dominio dedicato
href="/manifest.webmanifest"
href="/favicon.svg"
href="/_astro/Base.G-ZSaSx7.css"
  "start_url": "/",
  "scope": "/",
15:const BASE = '/';
url(/fonts/instrument-sans-400.woff2)

$ BASE_PATH=/ node scripts/check-pages.mjs --base http://localhost:4321/
13/13 risorse rispondono 200.
```

Con base `/` anche `linkinator` riporta 29 link e 0 rotti.

---

## 3. Punteggi Lighthouse per esteso

| Pagina | Performance | Accessibilità | Best practices | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` (Oggi) | **99** | **100** | **100** | 100 | 1.5 s | 1.8 s | 0 | 0 ms |
| `/ricette/` (con filtri) | **98** | **100** | **100** | 100 | 1.5 s | 2.0 s | 0.064 | 0 ms |
| `/cucina/?id=focaccia-…` | **99** | **100** | **100** | 100 | 1.4 s | 1.8 s | 0.049 | 0 ms |
| `/modifica/` | **99** | **100** | **100** | 100 | 1.6 s | 1.8 s | 0 | 0 ms |

Emulazione mobile predefinita di Lighthouse (Moto G Power, rete 4G rallentata, CPU 4×).
Nessun audit fallito nelle categorie accessibilità e best practices. Il 99 in performance,
non 100, viene dalla latenza simulata sui primi byte del documento: non c'è codice da
tagliare (la pagina che carica più JavaScript ne scarica 7.6 kB non compressi).

---

## 4. Decisioni prese in autonomia

Copiate da `PLAN.md`, in forma breve. Le motivazioni complete, con l'alternativa scartata,
sono nella sezione `## Decisioni prese in autonomia` di quel file.

1. **Progetto Astro creato a mano**: `npm create astro@latest` non funziona in questo
   ambiente (i template arrivano da `codeload.github.com`, bloccato con HTTP 403). Astro
   installato dal registry npm, versione corrente 7.2.10.
2. **Ricette per query parameter** (`/ricetta/?id=…`) e non per route dinamica: le ricette
   create dall'utente non esistono al momento della build.
3. **Validazione client scritta a mano**, non con Zod: Zod valida le ricette seed in build,
   ma spedirlo al browser peserebbe più dell'app. Gli elenchi dei valori ammessi sono gli
   stessi (`src/lib/tipi.ts`), quindi non possono divergere.
4. **`localStorage` invece di IndexedDB**: pochi KB di dati, nessuna migrazione di schema.
   L'interfaccia è però asincrona, quindi cambiare è un file nuovo e una riga.
5. **Il tema salvato si applica da un modulo, non da uno script inline**: uno script inline
   dovrebbe leggere lo storage dentro un componente, rompendo l'astrazione (verifica 10b).
   Il tema di sistema, quello predefinito, è comunque istantaneo perché gestito in CSS.
6. **Le stringhe di i18n sono importate anche dalle isole client**: Vite le mette in un
   chunk condiviso e i tipi proteggono dai refusi nelle chiavi.
7. **Font Instrument Sans + Lora** (licenza OFL) presi da file già presenti nel sistema,
   sottoinsiemati al latino e convertiti in WOFF2: nessuna richiesta a domini terzi.
8. **Nessuna sitemap**: è un'app personale, non un sito da indicizzare. La verifica 3 legge
   le pagine da `dist/`.
9. **Tre devDependencies** (`@astrojs/check`, `typescript`, `@types/node`): servono alla
   verifica 2 e ai tipi dei test. Nessuna dipendenza runtime oltre ad Astro.
10. **Playwright non è una dipendenza del progetto**: gli script delle verifiche 14/16/17 lo
    importano dinamicamente ed è documentato come opzionale.
11. **9 ricette seed invece di 8**: serviva un caso reale di due cotture in parallelo,
    distinto dalla lievitazione lunga.
12. **Etichette brevi sui pulsanti della modalità Cucina** ("Indietro"/"Avanti"/"Fine") con
    `aria-label` completo: a 360 px le etichette lunghe andavano a capo dentro i pulsanti.

---

## 5. Cosa devi fare tu per andare online

Nessuna chiave, nessun account, nessun servizio da attivare: l'app non parla con nessuno.

1. **Pubblica il repository su GitHub Pages** (una volta sola):
   - il codice è sul branch `claude/brambilla-astro-showcase-c213o0`: rinominalo in
     `main` (`Settings` → `Branches`) o uniscilo con una pull request, perché il
     workflow ascolta `main`/`master`;
   - `Settings` → `Pages` → *Source: **GitHub Actions***;
   - in alternativa, da qualunque branch: `Actions` → *Pubblica su GitHub Pages* →
     **Run workflow**.
   Il workflow `.github/workflows/deploy.yml` fa il resto a ogni push su `main`: lancia
   `npm run check`, `npm test`, poi `npm run build` con `BASE_PATH=/<nome-repo>/`.
   Indirizzo finale: `https://albertomusiani1.github.io/Semagnaa/`.
2. **Installala sul telefono**: apri quell'indirizzo e poi
   - Android/Chrome: menu ⋮ → *Installa app*;
   - iPhone/Safari: Condividi → *Aggiungi alla schermata Home* (solo da Safari).
3. **Testi da sostituire** (nessuno è obbligatorio, l'app funziona così com'è):
   - nome, tagline e descrizione: `src/i18n/it.json` → `app.*`;
   - ogni altro testo dell'interfaccia: sempre `src/i18n/it.json`;
   - colori e tipografia: blocco `:root` di `src/styles/global.css`;
   - reparti del supermercato e loro ordine: `REPARTI` in `src/lib/tipi.ts` + etichette in
     `it.json`;
   - icone: `public/icone/` e `public/favicon.svg`.
4. **Le 9 ricette di esempio**: tienile, o cancella i file in `src/content/ricette/` e alza
   `VERSIONE_SEED` in `src/lib/seed.ts` per partire da zero. Le tue ricette si aggiungono
   dal telefono, senza toccare il codice.
5. **Tieni una copia dei dati**: *Impostazioni → Esporta le ricette* scarica un JSON. È
   l'unico backup che esiste, per scelta di progetto (nessun server).
6. **Comandi di deploy manuale**, se preferisci non usare l'Action:
   ```bash
   BASE_PATH=/Semagnaa/ npm run build
   # poi pubblica il contenuto di dist/ dove vuoi (è tutto statico)
   ```

---

## 6. Peso del costruito

```
$ du -sh dist
452K    dist            # occupazione su disco (blocchi da 4 kB)

somma dei file: 299.1 kB in 45 file
```

Pagina più pesante, contando l'HTML e tutto il CSS e JS che carica (cifre decimali, kB = 1000 byte):

| Pagina | HTML | HTML + CSS + JS |
|---|---|---|
| `/modifica/` | 14.6 kB | **40.7 kB** ← la più pesante |
| `/cucina/` | 7.8 kB | 34.0 kB |
| `/ricetta/` | 10.8 kB | 32.3 kB |
| `/ricette/` | 11.2 kB | 31.4 kB |
| `/` (Oggi) | 9.3 kB | 28.0 kB |
| `/404.html` | 6.7 kB | 24.4 kB |

Ripartizione: CSS 18.5 kB (un unico foglio condiviso da tutte le pagine), font WOFF2 64 kB
(tre file, sottoinsieme latino), icone PNG 20 kB, JavaScript 54.9 kB in 18 chunk di cui una
pagina carica da 1.6 a 7.6 kB, ricette di esempio 24 kB di JSON scaricato una volta sola al
primo avvio. Tutte le cifre sono **non compresse**: sulla rete viaggiano in gzip/brotli.

I 41 file in precache del service worker pesano quanto tutto `dist/` meno `sw.js` e
`robots.txt`: dopo la prima visita l'app non ha più bisogno della rete.

---

## 7. Secondo giro di modifiche

Richieste arrivate dopo la prima consegna, tutte implementate e riverificate.

| Richiesta | Come è stata risolta |
|---|---|
| Stile più luminoso | Palette rifatta: fondi quasi bianchi (`#fefdfa`), verde più vivo (`#2c6b4a`), accento caldo (`#d2703f`), ombre più leggere, raggi più morbidi. Contrasti verificati da Lighthouse: audit `color-contrast` verde su tutte le pagine |
| Via la descrizione delle ricette | Campo rimosso dal modello, dallo schema Zod, dalle 9 ricette seed, dall'editor e dalla ricerca: non è nascosto, non esiste più |
| Via l'immagine di anteprima | Le schede mostrano titolo ed etichette. Cancellato `src/lib/segnaposto.ts`, che generava gli SVG |
| Filtri per difficoltà e durata | Gruppi a scelta multipla: difficoltà; durata totale in quattro fasce (≤30 min, 30-60, 1-2 h, >2 h) |
| Filtro per attese lunghe / "lasciar cuocere" / tanti passaggi | Gruppo **Attese** (*da lasciar cuocere*, ≥1 h di attesa o di cottura / *senza attese lunghe*) e gruppo **Passaggi** (pochi ≤4 / tanti ≥8). Soglie dichiarate in `SOGLIE`, `src/lib/filtri.ts` |
| Filtri che si aprono | Pannello `<details>`, chiuso all'apertura della pagina, con il conteggio dei filtri attivi nell'intestazione e il bottone *Azzera i filtri*. Si apre da solo se si arriva da un link con `?categoria=` |
| Cottura in ore e minuti | Due campi, `ore` e `minuti`, sommati in minuti al salvataggio; il dettaglio mostra "1 h 30 min" |
| Che cos'è la cottura | Testo di aiuto sotto i campi: il tempo in cui il cibo cuoce o riposa da solo (forno, fuoco, frigorifero, lievitazione), mentre la preparazione è il tempo in cui lavori tu |
| Tag consigliati e tag nuovi | Chip toccabili con i tag già usati nelle tue ricette più un elenco di partenza (`TAG_BASE`), e un campo per scriverne uno nuovo (anche con Invio) |
| Ingredienti già usati, con ricerca | Il campo del nome ha un `<datalist>` con tutti gli ingredienti dell'archivio: si filtra scrivendo, resta un campo libero per quelli nuovi, e scegliendone uno noto **unità e reparto si compilano da soli** |
| Un ingrediente alla volta | Riquadro "nuovo ingrediente" + *Aggiungi ingrediente*: la voce entra in elenco, con riordino (↑ ↓) e rimozione (×) |
| Passaggi come gli ingredienti | Stesso schema: testo, minuti di attesa, nome del timer, *Aggiungi passaggio* |
| Che cos'è l'etichetta del timer | Rinominata **Nome del timer**, con aiuto: è come lo leggi quando parte ("Prima lievitazione", "Cottura in forno"), utile con più timer accesi |
| Ingredienti in ordine da libro di cucina | `src/lib/ordine.ts`: basi secche → liquidi → uova e latticini → carne e pesce → verdure → grassi → aromi → quanto basta; dentro il gruppo, prima le quantità grandi. Si applica al primo salvataggio; il bottone *Ordina come nei libri di cucina* lo riapplica quando vuoi |

Verifiche dopo le modifiche: build e `astro check` puliti, **61** test unitari (17 nuovi su
filtri e ordinamento), **47** passi funzionali in browser (20 nuovi su filtri ed editor),
`html-validate` 0 errori, `linkinator` 0 link rotti, Lighthouse 98-99 / 100 / 100 / 100 su
quattro pagine, 33/33 viste senza overflow, offline su tutte le schermate.

### Foto e video nei passaggi: cosa comporterebbe

Richiesta lasciata volutamente fuori dal codice, come concordato. Non è complicata in sé, ma
tocca il punto più delicato dell'app — dove stanno i dati — quindi merita di essere fatta
apposta e non di straforo.

**Cosa funzionerebbe subito.** Prendere il file dalla galleria è una riga di HTML:
`<input type="file" accept="image/*,video/*">` apre la galleria (o la fotocamera con
`capture="environment"`). Mostrarlo è altrettanto semplice: `URL.createObjectURL(file)` dà
un indirizzo temporaneo da mettere in un `<img>` o `<video>`. Niente librerie, niente
servizi esterni.

**Dove si rompe.** `localStorage`, che oggi tiene tutto l'archivio, ha un limite di circa
5 MB e sa memorizzare solo testo: una foto da telefono, convertita in testo (base64), pesa
già 4-6 MB. Basta una foto e l'app è piena. Servirebbe quindi:

1. **passare a IndexedDB**, che tiene i file come tali (`Blob`) e ha spazio nell'ordine dei
   GB. L'app è già pronta per questo: la persistenza sta dietro l'interfaccia
   `src/lib/archivio.ts`, l'implementazione attuale è un file solo, e le firme sono già
   asincrone. Si scrive `archivio-indexeddb.ts` e si cambia una riga di import;
2. **ridimensionare le immagini sul telefono** prima di salvarle (una foto da 12 megapixel
   in un passaggio di ricetta è spreco): si fa con `canvas`, portandola a lato lungo
   1600 px e qualità 0.8, da 5 MB a circa 300 kB. Senza questo passaggio la memoria si
   riempie in fretta e l'app diventa lenta ad aprirsi;
3. **decidere cosa fare dei video**, che sono il caso scomodo: un minuto di video da
   telefono sono 60-100 MB. Comprimerli nel browser non è realistico. Le strade oneste sono
   due: accettare video corti (10-15 secondi) con un limite dichiarato, oppure salvare solo
   un riferimento al video nella galleria — che però su iOS non sopravvive alla chiusura
   dell'app, quindi in pratica si romperebbe;
4. **rifare l'esportazione**. Oggi *Impostazioni → Esporta* produce un JSON leggibile, che è
   l'unico backup esistente. Con le foto dentro diventerebbe un file enorme e illeggibile:
   servirebbe un archivio zip (ricette in JSON + cartella dei file), quindi codice di
   pacchettizzazione — l'unico punto in cui probabilmente vale la pena una dipendenza;
5. **gestire lo spazio**: mostrare quanto occupano le foto, poter cancellare quelle di una
   ricetta, e gestire il caso "memoria piena" senza perdere la ricetta che stavi scrivendo;
6. **il service worker resta com'è**: i file stanno nel database del dispositivo, non
   passano dalla rete, quindi offline funzionano già.

**Stima onesta.** Il grosso è il punto 1 (mezza giornata, ed è lavoro che serve comunque
prima o poi) più i punti 2 e 5 (un'altra mezza giornata). L'interfaccia — un pulsante per
passaggio, la miniatura nell'elenco, l'immagine grande in modalità Cucina — è poco lavoro.
I video sono il punto da decidere con la testa fredda: le foto risolvono il 90% dei casi
("l'impasto deve venire così"), i video costano dieci volte tanto in spazio e complessità.

**Consiglio.** Farlo in due tempi: prima la migrazione a IndexedDB da sola, senza cambiare
niente di visibile e con i test a controllare che l'archivio si comporti identico; poi le
foto nei passaggi, con ridimensionamento obbligatorio e un limite dichiarato. I video per
ultimi, se dopo un mese di uso vero ne senti la mancanza.
