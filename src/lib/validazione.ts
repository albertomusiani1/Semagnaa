/**
 * Validazione di una ricetta arrivata da fonte non fidata:
 * l'editor dell'app e il file JSON importato dalle impostazioni.
 *
 * Ricalca lo schema Zod delle content collection ma senza dipendenze:
 * Zod finirebbe nel bundle client, e per una app che deve pesare poco
 * non vale il prezzo. Entrambe le validazioni leggono gli stessi elenchi
 * `as const` di `tipi.ts`, quindi non possono divergere sui valori ammessi.
 *
 * I messaggi qui sono chiavi di `src/i18n/it.json` (`errori.*`), non testo
 * di interfaccia: chi mostra l'errore lo traduce.
 */
import type {
  Bollicine,
  Categoria,
  ColoreVino,
  Difficolta,
  Ingrediente,
  Passaggio,
  Reparto,
  Ricetta,
  Unita,
  Vino,
} from './tipi.ts';
import { BOLLICINE, CATEGORIE, COLORI_VINO, DIFFICOLTA, LIMITI, REPARTI, UNITA } from './tipi.ts';
import type { Esito } from './esito.ts';
import { errore, ok } from './esito.ts';
import { slugifica } from './testo.ts';

type Grezzo = Record<string, unknown>;

function eOggetto(valore: unknown): valore is Grezzo {
  return typeof valore === 'object' && valore !== null && !Array.isArray(valore);
}

function stringa(valore: unknown, max: number): string | null {
  if (typeof valore !== 'string') return null;
  const pulita = valore.trim();
  if (pulita === '' || pulita.length > max) return null;
  return pulita;
}

function numeroPositivo(valore: unknown, max: number): number | null {
  const n = typeof valore === 'string' ? Number(valore.replace(',', '.')) : valore;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > max) return null;
  return n;
}

function inElenco<T extends string>(valore: unknown, elenco: readonly T[]): T | null {
  return typeof valore === 'string' && (elenco as readonly string[]).includes(valore) ? (valore as T) : null;
}

function validaIngrediente(grezzo: unknown): Esito<Ingrediente> {
  if (!eOggetto(grezzo)) return errore('errori.ingredienteNonValido');
  const nome = stringa(grezzo['nome'], LIMITI.nomeIngredienteMax);
  if (nome === null) return errore('errori.nomeIngredienteObbligatorio');
  const reparto = inElenco<Reparto>(grezzo['reparto'], REPARTI);
  if (reparto === null) return errore('errori.repartoNonValido');

  const ingrediente: Ingrediente = { nome, reparto };
  if (grezzo['unita'] !== undefined && grezzo['unita'] !== null && grezzo['unita'] !== '') {
    const unita = inElenco<Unita>(grezzo['unita'], UNITA);
    if (unita === null) return errore('errori.unitaNonValida');
    ingrediente.unita = unita;
  }
  if (grezzo['quantita'] !== undefined && grezzo['quantita'] !== null && grezzo['quantita'] !== '') {
    const quantita = numeroPositivo(grezzo['quantita'], 100000);
    if (quantita === null) return errore('errori.quantitaNonValida');
    // "quanto basta" non porta numeri con se.
    if (ingrediente.unita !== 'qb') ingrediente.quantita = quantita;
  }
  const note = typeof grezzo['note'] === 'string' ? grezzo['note'].trim() : '';
  if (note !== '') ingrediente.note = note.slice(0, 200);
  return ok(ingrediente);
}

function validaPassaggio(grezzo: unknown): Esito<Passaggio> {
  if (!eOggetto(grezzo)) return errore('errori.passaggioNonValido');
  const testo = stringa(grezzo['testo'], LIMITI.testoPassaggioMax);
  if (testo === null) return errore('errori.testoPassaggioObbligatorio');
  const passaggio: Passaggio = { testo };
  if (grezzo['timerSecondi'] !== undefined && grezzo['timerSecondi'] !== null && grezzo['timerSecondi'] !== '') {
    const secondi = numeroPositivo(grezzo['timerSecondi'], LIMITI.timerMaxSecondi);
    if (secondi === null || secondi < 1) return errore('errori.timerNonValido');
    passaggio.timerSecondi = Math.round(secondi);
    const etichetta = typeof grezzo['timerEtichetta'] === 'string' ? grezzo['timerEtichetta'].trim() : '';
    if (etichetta !== '') passaggio.timerEtichetta = etichetta.slice(0, 60);
  }
  return ok(passaggio);
}

/** Valida e normalizza una ricetta. `idEsistenti` serve solo per le nuove. */
export function validaRicetta(grezzo: unknown, idEsistenti: readonly string[] = []): Esito<Ricetta> {
  if (!eOggetto(grezzo)) return errore('errori.ricettaNonValida');

  const titolo = stringa(grezzo['titolo'], LIMITI.titoloMax);
  if (titolo === null) return errore('errori.titoloObbligatorio');

  const categoria = inElenco<Categoria>(grezzo['categoria'], CATEGORIE);
  if (categoria === null) return errore('errori.categoriaNonValida');

  const difficolta = inElenco<Difficolta>(grezzo['difficolta'], DIFFICOLTA);
  if (difficolta === null) return errore('errori.difficoltaNonValida');

  const porzioni = numeroPositivo(grezzo['porzioni'], LIMITI.porzioniMax);
  if (porzioni === null || porzioni < 1) return errore('errori.porzioniNonValide');

  const preparazione = numeroPositivo(grezzo['tempoPreparazioneMin'], 24 * 60);
  const cottura = numeroPositivo(grezzo['tempoCotturaMin'], 24 * 60);
  if (preparazione === null || cottura === null) return errore('errori.tempiNonValidi');

  const ingredientiGrezzi = grezzo['ingredienti'];
  if (!Array.isArray(ingredientiGrezzi) || ingredientiGrezzi.length === 0) {
    return errore('errori.almenoUnIngrediente');
  }
  const ingredienti: Ingrediente[] = [];
  for (const voce of ingredientiGrezzi) {
    const esito = validaIngrediente(voce);
    if (!esito.ok) return errore(esito.errore);
    ingredienti.push(esito.dato);
  }

  const passaggiGrezzi = grezzo['passaggi'];
  if (!Array.isArray(passaggiGrezzi) || passaggiGrezzi.length === 0) {
    return errore('errori.almenoUnPassaggio');
  }
  const passaggi: Passaggio[] = [];
  for (const voce of passaggiGrezzi) {
    const esito = validaPassaggio(voce);
    if (!esito.ok) return errore(esito.errore);
    passaggi.push(esito.dato);
  }

  const tags = Array.isArray(grezzo['tags'])
    ? grezzo['tags']
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim().slice(0, 30))
        .filter((t) => t !== '')
        .slice(0, 12)
    : [];

  const idGrezzo = typeof grezzo['id'] === 'string' ? grezzo['id'].trim() : '';
  const id = idGrezzo === '' ? slugLibero(titolo, idEsistenti) : slugifica(idGrezzo);

  const adesso = new Date().toISOString();
  const creataIl = typeof grezzo['creataIl'] === 'string' && grezzo['creataIl'] !== '' ? grezzo['creataIl'] : adesso;

  const ricetta: Ricetta = {
    id,
    titolo,
    categoria,
    porzioni: Math.round(porzioni),
    tempoPreparazioneMin: Math.round(preparazione),
    tempoCotturaMin: Math.round(cottura),
    difficolta,
    tags,
    preferita: grezzo['preferita'] === true,
    ingredienti,
    passaggi,
    creataIl,
    aggiornataIl: adesso,
  };
  const fonte = typeof grezzo['fonte'] === 'string' ? grezzo['fonte'].trim() : '';
  if (fonte !== '') ricetta.fonte = fonte.slice(0, 200);
  const note = typeof grezzo['note'] === 'string' ? grezzo['note'].trim() : '';
  if (note !== '') ricetta.note = note.slice(0, 2000);
  return ok(ricetta);
}

function slugLibero(titolo: string, esistenti: readonly string[]): string {
  const base = slugifica(titolo);
  if (!esistenti.includes(base)) return base;
  let n = 2;
  while (esistenti.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Valida l'elenco dei vini dentro un file di esportazione. */
export function validaViniImportati(grezzo: unknown): Esito<Vino[]> {
  if (!Array.isArray(grezzo)) return ok([]);
  const vini: Vino[] = [];
  for (const voce of grezzo) {
    const esito = validaVino(voce, vini.map((v) => v.id));
    if (!esito.ok) return errore(esito.errore);
    vini.push(esito.dato);
  }
  return ok(vini);
}

/** Valida un file di esportazione (array di ricette o oggetto con `ricette`). */
export function validaImportazione(testoJson: string): Esito<Ricetta[]> {
  let grezzo: unknown;
  try {
    grezzo = JSON.parse(testoJson);
  } catch {
    return errore('errori.jsonNonValido');
  }
  const elenco = Array.isArray(grezzo)
    ? grezzo
    : eOggetto(grezzo) && Array.isArray(grezzo['ricette'])
      ? grezzo['ricette']
      : null;
  if (elenco === null) return errore('errori.formatoImportazione');
  if (elenco.length === 0) return errore('errori.importazioneVuota');

  const ricette: Ricetta[] = [];
  for (const voce of elenco) {
    const esito = validaRicetta(voce, ricette.map((r) => r.id));
    if (!esito.ok) return errore(esito.errore);
    ricette.push(esito.dato);
  }
  return ok(ricette);
}

/* -------------------------------------------------------------------------
 * Vini
 * ---------------------------------------------------------------------- */

/** Valida e normalizza un vino arrivato dall'editor o da un file importato. */
export function validaVino(grezzo: unknown, idEsistenti: readonly string[] = []): Esito<Vino> {
  if (!eOggetto(grezzo)) return errore('errori.vinoNonValido');

  const nome = stringa(grezzo['nome'], LIMITI.nomeVinoMax);
  if (nome === null) return errore('errori.nomeVinoObbligatorio');

  const cantina = stringa(grezzo['cantina'], LIMITI.cantinaMax);
  if (cantina === null) return errore('errori.cantinaObbligatoria');

  const colore = inElenco<ColoreVino>(grezzo['colore'], COLORI_VINO);
  if (colore === null) return errore('errori.coloreNonValido');

  const bollicine = inElenco<Bollicine>(grezzo['bollicine'], BOLLICINE);
  if (bollicine === null) return errore('errori.bollicineNonValide');

  const paeseGrezzo = typeof grezzo['paese'] === 'string' ? grezzo['paese'].trim() : '';
  const regioneGrezza = typeof grezzo['regione'] === 'string' ? grezzo['regione'].trim() : '';
  if (paeseGrezzo.length > LIMITI.paeseMax || regioneGrezza.length > LIMITI.regioneMax) {
    return errore('errori.provenienzaTroppoLunga');
  }

  const gusto = typeof grezzo['gusto'] === 'string' ? grezzo['gusto'].trim() : '';
  if (gusto.length > LIMITI.gustoMax) return errore('errori.gustoTroppoLungo');

  const descrizione = typeof grezzo['descrizione'] === 'string' ? grezzo['descrizione'].trim() : '';
  if (descrizione.length > LIMITI.descrizioneVinoMax) return errore('errori.descrizioneVinoTroppoLunga');

  const vino: Vino = {
    id: '',
    nome,
    cantina,
    paese: paeseGrezzo,
    regione: regioneGrezza,
    colore,
    bollicine,
    gusto,
    descrizione,
    preferito: grezzo['preferito'] === true,
    creatoIl: '',
    aggiornatoIl: '',
  };

  if (grezzo['annata'] !== undefined && grezzo['annata'] !== null && grezzo['annata'] !== '') {
    const annata = numeroPositivo(grezzo['annata'], LIMITI.annataMax);
    if (annata === null || annata < LIMITI.annataMin) return errore('errori.annataNonValida');
    vino.annata = Math.round(annata);
  }
  if (grezzo['gradazione'] !== undefined && grezzo['gradazione'] !== null && grezzo['gradazione'] !== '') {
    const gradazione = numeroPositivo(grezzo['gradazione'], 30);
    if (gradazione === null) return errore('errori.gradazioneNonValida');
    vino.gradazione = gradazione;
  }
  const fotoId = typeof grezzo['fotoId'] === 'string' ? grezzo['fotoId'].trim() : '';
  if (fotoId !== '') vino.fotoId = fotoId.slice(0, 80);

  const idGrezzo = typeof grezzo['id'] === 'string' ? grezzo['id'].trim() : '';
  vino.id = idGrezzo === '' ? slugLibero(`${cantina} ${nome}`, idEsistenti) : slugifica(idGrezzo);

  const adesso = new Date().toISOString();
  vino.creatoIl = typeof grezzo['creatoIl'] === 'string' && grezzo['creatoIl'] !== '' ? grezzo['creatoIl'] : adesso;
  vino.aggiornatoIl = adesso;
  return ok(vino);
}
