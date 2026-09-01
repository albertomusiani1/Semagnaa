/**
 * Normalizzazione, somma e formattazione delle quantità.
 * Modulo puro: nessun DOM, nessuna dipendenza, interamente testato.
 */
import type { Quantita, Unita } from './tipi.ts';
import { numeroIt } from './testo.ts';

/**
 * Famiglie di unità convertibili tra loro, con fattore verso l'unità base.
 * Tutto ciò che non è qui non è convertibile: due unità di famiglie
 * diverse non si sommano mai, restano voci separate.
 */
const FAMIGLIE: Record<string, { base: Unita; fattori: Partial<Record<Unita, number>> }> = {
  peso: { base: 'g', fattori: { g: 1, kg: 1000 } },
  volume: { base: 'ml', fattori: { ml: 1, l: 1000 } },
};

/**
 * Nome della famiglia di una unità.
 * - `peso` / `volume` per le unità convertibili;
 * - `conteggio:<unità>` per quelle che si sommano solo con se stesse;
 * - `null` per `qb` e per l'assenza di unità: non sommabili.
 */
export function famiglia(unita?: Unita): string | null {
  if (unita === undefined || unita === 'qb') return null;
  for (const [nome, dati] of Object.entries(FAMIGLIE)) {
    if (dati.fattori[unita] !== undefined) return nome;
  }
  return `conteggio:${unita}`;
}

/** Converte un valore nell'unità base della sua famiglia. */
export function inBase(valore: number, unita: Unita): number {
  const nome = famiglia(unita);
  if (nome === null) return valore;
  const dati = FAMIGLIE[nome];
  if (dati === undefined) return valore;
  const fattore = dati.fattori[unita];
  return fattore === undefined ? valore : valore * fattore;
}

/** Unità base della famiglia, o l'unità stessa se non convertibile. */
export function unitaBase(unita: Unita): Unita {
  const nome = famiglia(unita);
  if (nome === null) return unita;
  return FAMIGLIE[nome]?.base ?? unita;
}

/** Due quantità si possono sommare solo dentro la stessa famiglia. */
export function sommabili(a: Quantita, b: Quantita): boolean {
  const fa = famiglia(a.unita);
  const fb = famiglia(b.unita);
  return fa !== null && fa === fb && a.valore !== undefined && b.valore !== undefined;
}

/**
 * Somma due quantità. Restituisce `null` se non sono sommabili:
 * il chiamante deve tenerle come voci separate, non inventare conversioni.
 */
export function somma(a: Quantita, b: Quantita): Quantita | null {
  if (!sommabili(a, b)) return null;
  const ua = a.unita as Unita;
  const ub = b.unita as Unita;
  const totale = inBase(a.valore as number, ua) + inBase(b.valore as number, ub);
  return { valore: totale, unita: unitaBase(ua) === unitaBase(ub) ? unitaBase(ua) : ua };
}

/**
 * Porta una quantità nell'unità più leggibile della sua famiglia:
 * 1200 g -> 1,2 kg ; 0,5 l -> 500 ml ; 250 g resta 250 g.
 */
export function leggibile(q: Quantita): Quantita {
  if (q.valore === undefined || q.unita === undefined) return q;
  const nome = famiglia(q.unita);
  if (nome !== 'peso' && nome !== 'volume') return q;
  const valoreBase = inBase(q.valore, q.unita);
  if (nome === 'peso') {
    return valoreBase >= 1000 ? { valore: valoreBase / 1000, unita: 'kg' } : { valore: valoreBase, unita: 'g' };
  }
  return valoreBase >= 1000 ? { valore: valoreBase / 1000, unita: 'l' } : { valore: valoreBase, unita: 'ml' };
}

/**
 * Testo di una quantità. Le etichette delle unità arrivano da fuori
 * (i18n): questo modulo non contiene stringhe di interfaccia.
 */
export function formatta(q: Quantita, etichette: Partial<Record<Unita, string>> = {}): string {
  const bella = leggibile(q);
  const etichetta = bella.unita === undefined ? '' : (etichette[bella.unita] ?? bella.unita);
  if (bella.valore === undefined) return etichetta;
  const numero = numeroIt(bella.valore, 2);
  return etichetta === '' ? numero : `${numero} ${etichetta}`;
}
