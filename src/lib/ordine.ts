/**
 * Ordinamento degli ingredienti secondo la convenzione dei libri e dei blog
 * di cucina: prima gli ingredienti che fanno il piatto, poi quelli di
 * accompagnamento, poi i condimenti e gli aromi, e in fondo il "quanto basta"
 * (sale, pepe) che non si misura.
 *
 * È un'euristica dichiarata, non un'intelligenza: guarda il reparto della
 * spesa e alcune parole chiave. Modulo puro, testato.
 */
import type { Ingrediente } from './tipi.ts';
import { normalizzaNome } from './testo.ts';
import { inBase } from './unita.ts';

/** Gruppi in ordine di comparsa nell'elenco. */
const GRUPPI = [
  'base-secca', // farine, paste, riso, pane, zucchero, legumi
  'liquidi', // acqua, latte, brodo, vino
  'uova-latticini',
  'carne-pesce',
  'frutta-verdura',
  'grassi', // olio, burro, panna da cucina
  'aromi', // aglio, cipolla da soffritto no: vedi nota, erbe e spezie
  'quanto-basta',
] as const;
type Gruppo = (typeof GRUPPI)[number];

const AROMI = [
  'aglio',
  'alloro',
  'basilico',
  'rosmarino',
  'salvia',
  'timo',
  'origano',
  'prezzemolo',
  'menta',
  'peperoncino',
  'pepe',
  'noce moscata',
  'cannella',
  'zafferano',
  'vaniglia',
  'lievito',
  'scorza',
  'buccia',
];

const GRASSI = ['olio', 'burro', 'strutto', 'margarina', 'panna'];

/**
 * Verdure e frutta in barattolo: stanno nel reparto "dispensa" ma nella
 * lista degli ingredienti si leggono come verdure, non come basi secche.
 */
const VERDURE_CONSERVA = ['pomodor', 'pelati', 'passata', 'olive', 'capperi', 'mais', 'funghi'];

const BASI_SECCHE = [
  'farina',
  'semola',
  'pasta',
  'spaghetti',
  'riso',
  'pane',
  'savoiardi',
  'zucchero',
  'cacao',
  'cioccolato',
  'lenticchie',
  'ceci',
  'fagioli',
  'polenta',
  'cous cous',
  'orzo',
];

function contiene(nome: string, parole: readonly string[]): boolean {
  return parole.some((parola) => nome.includes(parola));
}

export function gruppoIngrediente(ingrediente: Ingrediente): Gruppo {
  const nome = normalizzaNome(ingrediente.nome);

  // Il "quanto basta" chiude sempre l'elenco, qualunque sia il reparto.
  if (ingrediente.unita === 'qb' || ingrediente.quantita === undefined) return 'quanto-basta';

  if (contiene(nome, GRASSI)) return 'grassi';
  if (contiene(nome, VERDURE_CONSERVA)) return 'frutta-verdura';
  // Gli aromi in piccola quantità stanno in fondo, prima del quanto basta.
  if (contiene(nome, AROMI)) return 'aromi';
  if (contiene(nome, BASI_SECCHE)) return 'base-secca';

  switch (ingrediente.reparto) {
    case 'carne-pesce':
      return 'carne-pesce';
    case 'latticini':
      return 'uova-latticini';
    case 'frutta-verdura':
      return 'frutta-verdura';
    case 'bevande':
      return 'liquidi';
    case 'panetteria':
      return 'base-secca';
    default:
      // Dispensa e surgelati: liquidi se misurati in volume, altrimenti base.
      return ingrediente.unita === 'ml' || ingrediente.unita === 'l' ? 'liquidi' : 'base-secca';
  }
}

/** Peso o volume in unità base: serve solo a mettere prima le quantità grandi. */
function grandezza(ingrediente: Ingrediente): number {
  if (ingrediente.quantita === undefined || ingrediente.unita === undefined) return 0;
  return inBase(ingrediente.quantita, ingrediente.unita);
}

/**
 * Ordina per gruppo e, dentro il gruppo, dalla quantità più grande alla più
 * piccola (a pari quantità, in ordine alfabetico). Non modifica l'array
 * ricevuto.
 */
export function ordinaIngredienti(ingredienti: readonly Ingrediente[]): Ingrediente[] {
  return [...ingredienti].sort((a, b) => {
    const differenzaGruppo = GRUPPI.indexOf(gruppoIngrediente(a)) - GRUPPI.indexOf(gruppoIngrediente(b));
    if (differenzaGruppo !== 0) return differenzaGruppo;
    const differenzaGrandezza = grandezza(b) - grandezza(a);
    if (differenzaGrandezza !== 0) return differenzaGrandezza;
    return a.nome.localeCompare(b.nome, 'it');
  });
}
