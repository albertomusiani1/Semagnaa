/**
 * Fonte di verità unica del modello dati.
 *
 * Gli elenchi `as const` qui sotto sono usati da:
 *  - lo schema Zod delle content collection (`src/content.config.ts`);
 *  - la validazione client (`src/lib/validazione.ts`);
 *  - le etichette in `src/i18n/it.json` (le chiavi devono coincidere).
 *
 * Aggiungere un valore in un solo punto: qui.
 */

export const CATEGORIE = [
  'antipasti',
  'primi',
  'secondi',
  'contorni',
  'dolci',
  'lievitati',
  'basi',
] as const;
export type Categoria = (typeof CATEGORIE)[number];

export const DIFFICOLTA = ['facile', 'media', 'impegnativa'] as const;
export type Difficolta = (typeof DIFFICOLTA)[number];

export const UNITA = [
  'g',
  'kg',
  'ml',
  'l',
  'cucchiai',
  'cucchiaini',
  'pezzi',
  'spicchi',
  'foglie',
  'qb',
] as const;
export type Unita = (typeof UNITA)[number];

/** Ordine di attraversamento tipico di un supermercato. */
export const REPARTI = [
  'frutta-verdura',
  'panetteria',
  'carne-pesce',
  'latticini',
  'surgelati',
  'dispensa',
  'bevande',
  'altro',
] as const;
export type Reparto = (typeof REPARTI)[number];

export interface Ingrediente {
  nome: string;
  /** Assente per le voci "quanto basta". */
  quantita?: number;
  unita?: Unita;
  reparto: Reparto;
  note?: string;
}

export interface Passaggio {
  testo: string;
  /** Se presente, il passaggio mostra un timer avviabile. */
  timerSecondi?: number;
  timerEtichetta?: string;
}

export interface Ricetta {
  id: string;
  titolo: string;
  categoria: Categoria;
  porzioni: number;
  tempoPreparazioneMin: number;
  tempoCotturaMin: number;
  difficolta: Difficolta;
  tags: string[];
  preferita: boolean;
  ingredienti: Ingrediente[];
  passaggi: Passaggio[];
  creataIl: string;
  aggiornataIl: string;
  fonte?: string;
  note?: string;
}

/** Quantità generica, usata dall'aggregazione della spesa. */
export interface Quantita {
  valore?: number;
  unita?: Unita;
}

/* --- Vini ---------------------------------------------------------------
 * Colore e bollicine sono due cose diverse e vanno tenute separate: esiste il
 * bianco fermo, il bianco frizzante e il rosato spumante. Un unico elenco
 * "bianco | rosso | rosato | frizzante | fermo" costringerebbe a scegliere
 * quale delle due dire, e renderebbe impossibile filtrare per l'altra.
 */
export const COLORI_VINO = ['rosso', 'bianco', 'rosato'] as const;
export type ColoreVino = (typeof COLORI_VINO)[number];

export const BOLLICINE = ['fermo', 'frizzante', 'spumante'] as const;
export type Bollicine = (typeof BOLLICINE)[number];

export interface Vino {
  id: string;
  nome: string;
  cantina: string;
  /** Stato: "Italia", "Francia", "Portogallo"... */
  paese: string;
  /** Regione o zona: "Toscana", "Borgogna", "Douro". */
  regione: string;
  colore: ColoreVino;
  bollicine: Bollicine;
  annata?: number;
  gradazione?: number;
  /** Poche parole: si legge sulla scheda dell'elenco. */
  gusto: string;
  /** Testo lungo: si vede solo aprendo il singolo vino. */
  descrizione: string;
  preferito: boolean;
  /** Riferimento alla foto nell'archivio immagini (IndexedDB). */
  fotoId?: string;
  creatoIl: string;
  aggiornatoIl: string;
}

export const LIMITI = {
  titoloMax: 90,
  nomeIngredienteMax: 80,
  testoPassaggioMax: 600,
  timerMaxSecondi: 60 * 60 * 48,
  porzioniMax: 50,
  nomeVinoMax: 90,
  cantinaMax: 80,
  regioneMax: 60,
  paeseMax: 60,
  gustoMax: 140,
  descrizioneVinoMax: 2000,
  annataMin: 1900,
  annataMax: 2100,
} as const;
