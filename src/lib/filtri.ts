/**
 * Filtri dell'elenco ricette. Modulo puro, testato: nessun DOM, nessuna
 * stringa di interfaccia (le etichette stanno in `src/i18n/it.json`).
 *
 * Le soglie sono qui, in un posto solo, e sono dichiarate: se un domani
 * "attesa lunga" deve voler dire mezz'ora invece di un'ora, si cambia
 * `SOGLIE` e cambiano insieme filtro, etichette sulle schede e test.
 */
import type { Categoria, Difficolta, Ricetta } from './tipi.ts';

export const SOGLIE = {
  /** Oltre questa attesa in un singolo passaggio la ricetta "si lascia stare". */
  attesaLungaMin: 60,
  /** Sotto questa attesa massima la ricetta non ha tempi morti veri. */
  attesaBreveMin: 30,
  /** Da qui in su i passaggi sono "tanti". */
  moltiPassaggi: 8,
  /** Fino a qui i passaggi sono "pochi". */
  pochiPassaggi: 4,
} as const;

export const FASCE_DURATA = ['fino30', 'da30a60', 'da1a2h', 'oltre2h'] as const;
export type FasciaDurata = (typeof FASCE_DURATA)[number];

export const SCELTE_ATTESA = ['qualsiasi', 'lunghe', 'brevi'] as const;
export type SceltaAttesa = (typeof SCELTE_ATTESA)[number];

export const SCELTE_PASSAGGI = ['qualsiasi', 'pochi', 'tanti'] as const;
export type SceltaPassaggi = (typeof SCELTE_PASSAGGI)[number];

export interface Filtri {
  testo: string;
  categoria: Categoria | null;
  /** Vuoto = tutte le difficoltà. */
  difficolta: Difficolta[];
  /** Vuoto = tutte le durate. */
  durata: FasciaDurata[];
  attesa: SceltaAttesa;
  passaggi: SceltaPassaggi;
}

export const FILTRI_VUOTI: Filtri = {
  testo: '',
  categoria: null,
  difficolta: [],
  durata: [],
  attesa: 'qualsiasi',
  passaggi: 'qualsiasi',
};

export function tempoTotaleMin(ricetta: Ricetta): number {
  return ricetta.tempoPreparazioneMin + ricetta.tempoCotturaMin;
}

/** Attesa più lunga di un singolo passaggio, in minuti (0 se non ci sono timer). */
export function attesaMassimaMin(ricetta: Ricetta): number {
  let massima = 0;
  for (const passaggio of ricetta.passaggi) {
    if (passaggio.timerSecondi === undefined) continue;
    massima = Math.max(massima, Math.round(passaggio.timerSecondi / 60));
  }
  return massima;
}

/**
 * Attesa che conta per i filtri: la più lunga fra il timer del singolo
 * passaggio e il tempo di cottura dichiarato. Serve per le ricette che
 * scrivono "cuoci due ore" nei tempi ma non mettono un timer sul passaggio:
 * restano ricette da mettere su e lasciar stare.
 */
export function attesaRilevanteMin(ricetta: Ricetta): number {
  return Math.max(attesaMassimaMin(ricetta), ricetta.tempoCotturaMin);
}

/** Vero per le ricette che si mettono su e si lasciano stare. */
export function haAtteseLunghe(ricetta: Ricetta): boolean {
  return attesaRilevanteMin(ricetta) >= SOGLIE.attesaLungaMin;
}

export function haMoltiPassaggi(ricetta: Ricetta): boolean {
  return ricetta.passaggi.length >= SOGLIE.moltiPassaggi;
}

export function fasciaDurata(minuti: number): FasciaDurata {
  if (minuti <= 30) return 'fino30';
  if (minuti <= 60) return 'da30a60';
  if (minuti <= 120) return 'da1a2h';
  return 'oltre2h';
}

/** Somma dei minuti di attesa dichiarati dai timer. */
export function attesaTotaleMin(ricetta: Ricetta): number {
  return ricetta.passaggi.reduce(
    (totale, passaggio) => totale + (passaggio.timerSecondi === undefined ? 0 : Math.round(passaggio.timerSecondi / 60)),
    0,
  );
}

function testoCercabile(ricetta: Ricetta): string {
  return [ricetta.titolo, ...ricetta.tags, ...ricetta.ingredienti.map((i) => i.nome)].join(' ');
}

/**
 * Applica i filtri. `normalizza` arriva da fuori (`testo.ts`) per non
 * duplicare la logica di confronto dei nomi.
 */
export function applicaFiltri(
  ricette: readonly Ricetta[],
  filtri: Filtri,
  normalizza: (testo: string) => string,
): Ricetta[] {
  const termine = normalizza(filtri.testo);
  return ricette.filter((ricetta) => {
    if (filtri.categoria !== null && ricetta.categoria !== filtri.categoria) return false;
    if (filtri.difficolta.length > 0 && !filtri.difficolta.includes(ricetta.difficolta)) return false;
    if (filtri.durata.length > 0 && !filtri.durata.includes(fasciaDurata(tempoTotaleMin(ricetta)))) return false;

    if (filtri.attesa === 'lunghe' && !haAtteseLunghe(ricetta)) return false;
    if (filtri.attesa === 'brevi' && attesaRilevanteMin(ricetta) >= SOGLIE.attesaBreveMin) return false;

    if (filtri.passaggi === 'tanti' && !haMoltiPassaggi(ricetta)) return false;
    if (filtri.passaggi === 'pochi' && ricetta.passaggi.length > SOGLIE.pochiPassaggi) return false;

    if (termine !== '' && !normalizza(testoCercabile(ricetta)).includes(termine)) return false;
    return true;
  });
}

/** Quanti filtri sono attivi: serve al riassunto sul pannello richiudibile. */
export function filtriAttivi(filtri: Filtri): number {
  let attivi = 0;
  if (filtri.categoria !== null) attivi += 1;
  if (filtri.difficolta.length > 0) attivi += 1;
  if (filtri.durata.length > 0) attivi += 1;
  if (filtri.attesa !== 'qualsiasi') attivi += 1;
  if (filtri.passaggi !== 'qualsiasi') attivi += 1;
  return attivi;
}
