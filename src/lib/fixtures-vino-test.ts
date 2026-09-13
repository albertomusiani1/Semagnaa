/** Vini finti usati solo dai test (`*.test.ts`). Non entra nel bundle. */
import type { Vino } from './tipi.ts';

export function vinoFinto(parziale: Partial<Vino> & { id: string }): Vino {
  return {
    nome: 'Vino finto',
    cantina: 'Cantina Finta',
    paese: 'Italia',
    regione: 'Toscana',
    colore: 'rosso',
    bollicine: 'fermo',
    gusto: 'Secco, fruttato.',
    descrizione: 'Serve solo ai test.',
    preferito: false,
    creatoIl: '2026-01-01T00:00:00.000Z',
    aggiornatoIl: '2026-01-01T00:00:00.000Z',
    ...parziale,
  };
}
