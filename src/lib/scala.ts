/**
 * Scalatura delle porzioni. Modulo puro, testato.
 */
import type { Ingrediente, Ricetta } from './tipi.ts';

/** Unità che non hanno senso frazionate: si arrotondano a mezzi o interi. */
const UNITA_DISCRETE = new Set(['pezzi', 'spicchi', 'foglie']);

export function fattoreScala(porzioniRicetta: number, porzioniDesiderate: number): number {
  if (porzioniRicetta <= 0 || porzioniDesiderate <= 0) return 1;
  return porzioniDesiderate / porzioniRicetta;
}

/**
 * Arrotondamento "da cucina":
 *  - unità discrete: al mezzo più vicino, mai a zero;
 *  - valori grandi (>= 100): all'unità;
 *  - valori medi (>= 10): al mezzo;
 *  - valori piccoli: a due decimali.
 */
export function arrotondaQuantita(valore: number, unita?: string): number {
  if (unita !== undefined && UNITA_DISCRETE.has(unita)) {
    const mezzi = Math.round(valore * 2) / 2;
    return mezzi <= 0 ? 0.5 : mezzi;
  }
  if (valore >= 100) return Math.round(valore);
  if (valore >= 10) return Math.round(valore * 2) / 2;
  const due = Math.round(valore * 100) / 100;
  return due <= 0 ? 0.01 : due;
}

export function scalaIngrediente(ingrediente: Ingrediente, fattore: number): Ingrediente {
  if (ingrediente.quantita === undefined || fattore === 1) return { ...ingrediente };
  return {
    ...ingrediente,
    quantita: arrotondaQuantita(ingrediente.quantita * fattore, ingrediente.unita),
  };
}

export function scalaIngredienti(
  ingredienti: readonly Ingrediente[],
  porzioniRicetta: number,
  porzioniDesiderate: number,
): Ingrediente[] {
  const fattore = fattoreScala(porzioniRicetta, porzioniDesiderate);
  return ingredienti.map((i) => scalaIngrediente(i, fattore));
}

export function scalaRicetta(ricetta: Ricetta, porzioniDesiderate: number): Ricetta {
  return {
    ...ricetta,
    porzioni: porzioniDesiderate,
    ingredienti: scalaIngredienti(ricetta.ingredienti, ricetta.porzioni, porzioniDesiderate),
  };
}
