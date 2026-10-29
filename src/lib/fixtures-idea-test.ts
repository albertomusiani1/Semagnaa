/** Idee finte usate solo dai test (`*.test.ts`). Non entra nel bundle. */
import type { Idea } from './tipi.ts';

export function ideaFinta(parziale: Partial<Idea> & { id: string }): Idea {
  return {
    titolo: 'Idea finta',
    piatti: [{ nome: 'Primo piatto' }],
    preferita: false,
    creataIl: '2026-01-01T00:00:00.000Z',
    aggiornataIl: '2026-01-01T00:00:00.000Z',
    ...parziale,
  };
}
