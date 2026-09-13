/**
 * Ricerca e filtri della cantina. Modulo puro, testato: nessun DOM, nessuno
 * storage, nessuna stringa di interfaccia.
 *
 * I valori di paese, regione e cantina non sono elenchi fissi: nascono dai
 * vini che hai inserito (`valoriDistinti`). Una cantina di casa è personale,
 * un elenco precompilato sarebbe sempre sbagliato.
 */
import type { Bollicine, ColoreVino, Vino } from './tipi.ts';

export interface FiltriVino {
  testo: string;
  paese: string | null;
  regione: string | null;
  cantina: string | null;
  /** Vuoto = tutti i colori. */
  colori: ColoreVino[];
  /** Vuoto = ferme e bollicine insieme. */
  bollicine: Bollicine[];
  annataDa: number | null;
  annataA: number | null;
  soloPreferiti: boolean;
}

export const FILTRI_VINO_VUOTI: FiltriVino = {
  testo: '',
  paese: null,
  regione: null,
  cantina: null,
  colori: [],
  bollicine: [],
  annataDa: null,
  annataA: null,
  soloPreferiti: false,
};

/** Valori presenti in cantina per un campo, ordinati e senza doppioni. */
export function valoriDistinti(vini: readonly Vino[], campo: 'paese' | 'regione' | 'cantina'): string[] {
  const valori = new Set<string>();
  for (const vino of vini) {
    const valore = vino[campo].trim();
    if (valore !== '') valori.add(valore);
  }
  return [...valori].sort((a, b) => a.localeCompare(b, 'it'));
}

/** Regioni presenti, limitate a un paese se richiesto. */
export function regioniDi(vini: readonly Vino[], paese: string | null): string[] {
  const dentro = paese === null ? vini : vini.filter((v) => v.paese === paese);
  return valoriDistinti(dentro, 'regione');
}

function testoCercabile(vino: Vino): string {
  return [vino.nome, vino.cantina, vino.regione, vino.paese, vino.gusto].join(' ');
}

export function applicaFiltriVino(
  vini: readonly Vino[],
  filtri: FiltriVino,
  normalizza: (testo: string) => string,
): Vino[] {
  const termine = normalizza(filtri.testo);
  return vini.filter((vino) => {
    if (filtri.paese !== null && vino.paese !== filtri.paese) return false;
    if (filtri.regione !== null && vino.regione !== filtri.regione) return false;
    if (filtri.cantina !== null && vino.cantina !== filtri.cantina) return false;
    if (filtri.colori.length > 0 && !filtri.colori.includes(vino.colore)) return false;
    if (filtri.bollicine.length > 0 && !filtri.bollicine.includes(vino.bollicine)) return false;
    if (filtri.soloPreferiti && !vino.preferito) return false;
    if (filtri.annataDa !== null && (vino.annata === undefined || vino.annata < filtri.annataDa)) return false;
    if (filtri.annataA !== null && (vino.annata === undefined || vino.annata > filtri.annataA)) return false;
    if (termine !== '' && !normalizza(testoCercabile(vino)).includes(termine)) return false;
    return true;
  });
}

export function filtriVinoAttivi(filtri: FiltriVino): number {
  let attivi = 0;
  if (filtri.paese !== null) attivi += 1;
  if (filtri.regione !== null) attivi += 1;
  if (filtri.cantina !== null) attivi += 1;
  if (filtri.colori.length > 0) attivi += 1;
  if (filtri.bollicine.length > 0) attivi += 1;
  if (filtri.annataDa !== null || filtri.annataA !== null) attivi += 1;
  if (filtri.soloPreferiti) attivi += 1;
  if (filtri.testo.trim() !== '') attivi += 1;
  return attivi;
}

/** In cantina si cerca per produttore: prima la cantina, poi l'annata recente. */
export function ordinaVini(vini: readonly Vino[]): Vino[] {
  return [...vini].sort(
    (a, b) =>
      a.cantina.localeCompare(b.cantina, 'it') ||
      a.nome.localeCompare(b.nome, 'it') ||
      (b.annata ?? 0) - (a.annata ?? 0),
  );
}
