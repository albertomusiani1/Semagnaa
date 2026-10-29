/**
 * Idee per la domenica: combinazioni di piatti che stanno bene insieme.
 * Modulo puro, testato: nessun DOM, nessuno storage, nessuna stringa di
 * interfaccia.
 */
import type { Idea } from './tipi.ts';

/** Le preferite in cima, poi dalla più recente: le idee nuove si cercano. */
export function ordinaIdee(idee: readonly Idea[]): Idea[] {
  return [...idee].sort(
    (a, b) =>
      Number(b.preferita) - Number(a.preferita) ||
      b.aggiornataIl.localeCompare(a.aggiornataIl) ||
      a.titolo.localeCompare(b.titolo, 'it'),
  );
}

/** Nomi dei piatti, per l'anteprima nella scheda dell'elenco. */
export function elencoPiatti(idea: Idea): string[] {
  return idea.piatti.map((piatto) => piatto.nome);
}

/** Quanti piatti hanno una nota: serve a dire "3 piatti, 2 con note". */
export function piattiConNote(idea: Idea): number {
  return idea.piatti.filter((piatto) => piatto.note !== undefined && piatto.note.trim() !== '').length;
}

/** Ricerca libera su titolo, nota e nomi dei piatti. */
export function cercaIdee(
  idee: readonly Idea[],
  testo: string,
  normalizza: (valore: string) => string,
): Idea[] {
  const termine = normalizza(testo);
  if (termine === '') return [...idee];
  return idee.filter((idea) => {
    const dentro = [idea.titolo, idea.nota ?? '', ...idea.piatti.map((p) => `${p.nome} ${p.note ?? ''}`)].join(' ');
    return normalizza(dentro).includes(termine);
  });
}
