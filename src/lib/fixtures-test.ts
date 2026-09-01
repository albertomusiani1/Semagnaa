/** Ricette finte usate solo dai test (`*.test.ts`). Non entra nel bundle. */
import type { Ricetta } from './tipi.ts';

export function ricettaFinta(parziale: Partial<Ricetta> = {}): Ricetta {
  return {
    id: 'finta',
    titolo: 'Ricetta finta',
    categoria: 'primi',
    porzioni: 4,
    tempoPreparazioneMin: 10,
    tempoCotturaMin: 20,
    difficolta: 'facile',
    descrizione: 'Serve solo ai test.',
    tags: [],
    preferita: false,
    ingredienti: [{ nome: 'Farina', quantita: 200, unita: 'g', reparto: 'dispensa' }],
    passaggi: [{ testo: 'Mescola tutto.' }],
    creataIl: '2026-01-01T00:00:00.000Z',
    aggiornataIl: '2026-01-01T00:00:00.000Z',
    ...parziale,
  };
}
