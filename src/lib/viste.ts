/**
 * Pezzi di interfaccia costruiti lato client (le ricette stanno
 * nell'archivio del dispositivo, non esistono al momento della build).
 * Tutte le stringhe arrivano da `src/i18n`.
 */
import type { Ingrediente, Ricetta } from './tipi.ts';
import { T, interpola } from '../i18n/index.ts';
import { el } from './dom.ts';
import { formatta } from './unita.ts';
import { urlRicetta } from './percorsi.ts';
import { haAtteseLunghe, haMoltiPassaggi, tempoTotaleMin } from './filtri.ts';

export { tempoTotaleMin as tempoTotale };

/** "200 g", "q.b.", "2 cucchiai" — etichette prese da i18n. */
export function quantitaLeggibile(ingrediente: Ingrediente): string {
  const q: { valore?: number; unita?: Ingrediente['unita'] } = {};
  if (ingrediente.quantita !== undefined) q.valore = ingrediente.quantita;
  if (ingrediente.unita !== undefined) q.unita = ingrediente.unita;
  return formatta(q, T.unita);
}

/** "1 h 25 min", "45 min": i tempi lunghi in ore si leggono meglio. */
export function durataLeggibile(minuti: number): string {
  if (minuti < 60) return `${minuti} ${T.ricetta.minuti}`;
  const ore = Math.floor(minuti / 60);
  const resto = minuti % 60;
  return resto === 0 ? `${ore} h` : `${ore} h ${resto} ${T.ricetta.minuti}`;
}

function etichettaPassaggi(ricetta: Ricetta): string {
  const quanti = ricetta.passaggi.length;
  return quanti === 1 ? T.ricetta.unPassaggio : interpola(T.ricetta.passaggiN, { n: quanti });
}

/**
 * `livello` è il livello del titolo della scheda: 2 quando la griglia sta
 * subito sotto l'h1 della pagina (elenco ricette), 3 quando sta dentro una
 * sezione con il suo h2 (home). Serve a non saltare livelli di titolo.
 */
export function schedaRicetta(ricetta: Ricetta, livello: 2 | 3 = 3): HTMLLIElement {
  const meta = el('p', { class: 'scheda__meta' }, [
    el('span', { class: 'etichetta' }, [T.categorie[ricetta.categoria]]),
    el('span', { class: 'etichetta' }, [durataLeggibile(tempoTotaleMin(ricetta))]),
    el('span', { class: 'etichetta' }, [T.difficolta[ricetta.difficolta]]),
    haAtteseLunghe(ricetta) ? el('span', { class: 'etichetta' }, [T.ricetta.attesaLunga]) : null,
    haMoltiPassaggi(ricetta) ? el('span', { class: 'etichetta' }, [etichettaPassaggi(ricetta)]) : null,
    ricetta.preferita ? el('span', { class: 'etichetta etichetta--accento' }, ['★']) : null,
  ]);

  const corpo = el('div', { class: 'scheda__corpo' }, [
    el(livello === 2 ? 'h2' : 'h3', { class: 'scheda__titolo' }, [
      el('a', { href: urlRicetta(ricetta.id) }, [ricetta.titolo]),
    ]),
    meta,
  ]);

  return el('li', { class: 'scheda' }, [corpo]) as HTMLLIElement;
}

export function grigliaRicette(ricette: readonly Ricetta[], livello: 2 | 3 = 3): HTMLUListElement {
  return el('ul', { class: 'griglia' }, ricette.map((r) => schedaRicetta(r, livello))) as HTMLUListElement;
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
