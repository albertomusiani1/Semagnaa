/**
 * Pezzi di interfaccia costruiti lato client (le ricette stanno
 * nell'archivio del dispositivo, non esistono al momento della build).
 * Tutte le stringhe arrivano da `src/i18n`.
 */
import type { Ingrediente, Ricetta } from './tipi.ts';
import { T, interpola } from '../i18n/index.ts';
import { el } from './dom.ts';
import { formatta } from './unita.ts';
import { svgSegnaposto } from './segnaposto.ts';
import { urlRicetta } from './percorsi.ts';

export function tempoTotale(ricetta: Ricetta): number {
  return ricetta.tempoPreparazioneMin + ricetta.tempoCotturaMin;
}

/** "200 g", "q.b.", "2 cucchiai" — etichette prese da i18n. */
export function quantitaLeggibile(ingrediente: Ingrediente): string {
  const q: { valore?: number; unita?: Ingrediente['unita'] } = {};
  if (ingrediente.quantita !== undefined) q.valore = ingrediente.quantita;
  if (ingrediente.unita !== undefined) q.unita = ingrediente.unita;
  return formatta(q, T.unita);
}

export function schedaRicetta(ricetta: Ricetta): HTMLLIElement {
  const figura = el('figure', { class: 'scheda__figura' });
  figura.append(svgSegnaposto(ricetta.titolo));

  const meta = el('p', { class: 'scheda__meta' }, [
    el('span', { class: 'etichetta' }, [T.categorie[ricetta.categoria]]),
    el('span', { class: 'etichetta' }, [`${tempoTotale(ricetta)} ${T.ricetta.minuti}`]),
    el('span', { class: 'etichetta' }, [T.difficolta[ricetta.difficolta]]),
    ricetta.preferita ? el('span', { class: 'etichetta etichetta--accento' }, ['★']) : null,
  ]);

  const corpo = el('div', { class: 'scheda__corpo' }, [
    el('h3', { class: 'scheda__titolo' }, [
      el('a', { href: urlRicetta(ricetta.id) }, [ricetta.titolo]),
    ]),
    ricetta.descrizione === '' ? null : el('p', { class: 'scheda__descrizione' }, [ricetta.descrizione]),
    meta,
  ]);

  return el('li', { class: 'scheda' }, [figura, corpo]) as HTMLLIElement;
}

export function grigliaRicette(ricette: readonly Ricetta[]): HTMLUListElement {
  const lista = el('ul', { class: 'griglia' }, ricette.map((r) => schedaRicetta(r)));
  return lista as HTMLUListElement;
}

export function messaggioVuoto(titolo: string, aiuto?: string): HTMLDivElement {
  return el('div', { class: 'vuoto' }, [
    el('p', {}, [titolo]),
    aiuto === undefined ? null : el('p', { class: 'piccolo' }, [aiuto]),
  ]) as HTMLDivElement;
}

export function elencoIngredienti(ingredienti: readonly Ingrediente[]): HTMLUListElement {
  const lista = el(
    'ul',
    { class: 'elenco-ingredienti' },
    ingredienti.map((ingrediente) =>
      el('li', {}, [
        el('span', {}, [
          ingrediente.nome,
          ingrediente.note === undefined ? null : el('span', { class: 'voce__dettaglio' }, [` — ${ingrediente.note}`]),
        ]),
        el('span', { class: 'elenco-ingredienti__quantita' }, [quantitaLeggibile(ingrediente)]),
      ]),
    ),
  );
  return lista as HTMLUListElement;
}

export function contaRicette(n: number): string {
  return n === 1 ? T.ricette.conteggioUno : interpola(T.ricette.conteggio, { n });
}
