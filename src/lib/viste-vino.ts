/**
 * Pezzi di interfaccia della cantina, costruiti lato client.
 * Tutte le stringhe arrivano da `src/i18n`.
 */
import type { ColoreVino, Vino } from './tipi.ts';
import { T } from '../i18n/index.ts';
import { el } from './dom.ts';
import { urlVino } from './percorsi.ts';
import { immagini } from './immagini.ts';

const NS = 'http://www.w3.org/2000/svg';

/** Indirizzi temporanei delle foto: vanno restituiti, o la memoria cresce. */
const indirizziAperti: string[] = [];

export function liberaFoto(): void {
  for (const indirizzo of indirizziAperti.splice(0)) URL.revokeObjectURL(indirizzo);
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', liberaFoto);

/**
 * Disegno di una bottiglia al posto della foto mancante. Non finge di essere
 * una fotografia: è una sagoma, colorata secondo il colore del vino, così
 * l'elenco resta leggibile anche prima di aver fotografato tutto.
 */
export function segnapostoBottiglia(colore: ColoreVino): SVGSVGElement {
  const vetro = colore === 'bianco' ? '#c8b26a' : colore === 'rosato' ? '#dd8f92' : '#6f1d27';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 90 120');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const fondo = document.createElementNS(NS, 'rect');
  fondo.setAttribute('width', '90');
  fondo.setAttribute('height', '120');
  fondo.setAttribute('fill', 'var(--superficie-scura)');
  svg.append(fondo);

  const bottiglia = document.createElementNS(NS, 'path');
  bottiglia.setAttribute(
    'd',
    'M39 16h12v18l6 9c2 3 3 6 3 9v52a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4V52c0-3 1-6 3-9l6-9z',
  );
  bottiglia.setAttribute('fill', vetro);
  bottiglia.setAttribute('opacity', '0.85');
  svg.append(bottiglia);

  const etichetta = document.createElementNS(NS, 'rect');
  etichetta.setAttribute('x', '32');
  etichetta.setAttribute('y', '66');
  etichetta.setAttribute('width', '26');
  etichetta.setAttribute('height', '26');
  etichetta.setAttribute('rx', '2');
  etichetta.setAttribute('fill', 'var(--superficie)');
  etichetta.setAttribute('opacity', '0.9');
  svg.append(etichetta);

  const tappo = document.createElementNS(NS, 'rect');
  tappo.setAttribute('x', '39');
  tappo.setAttribute('y', '10');
  tappo.setAttribute('width', '12');
  tappo.setAttribute('height', '8');
  tappo.setAttribute('rx', '2');
  tappo.setAttribute('fill', 'var(--colore-primario)');
  svg.append(tappo);

  return svg as SVGSVGElement;
}

/** Mette la foto salvata dentro una figura, se c'è. */
export async function mostraFoto(vino: Vino, figura: HTMLElement, testoAlternativo: string): Promise<void> {
  if (vino.fotoId === undefined) return;
  const esito = await immagini.leggi(vino.fotoId);
  if (!esito.ok || esito.dato === null) return;
  const indirizzo = URL.createObjectURL(esito.dato);
  indirizziAperti.push(indirizzo);
  const immagine = el('img', { src: indirizzo, alt: testoAlternativo, loading: 'lazy', decoding: 'async' });
  figura.replaceChildren(immagine);
}

export function etichetteVino(vino: Vino): HTMLElement[] {
  const etichette: HTMLElement[] = [
    el('span', { class: 'etichetta pastiglia-colore', 'data-colore': vino.colore }, [T.colori[vino.colore]]),
  ];
  if (vino.bollicine !== 'fermo') etichette.push(el('span', { class: 'etichetta' }, [T.bollicine[vino.bollicine]]));
  if (vino.annata !== undefined) etichette.push(el('span', { class: 'etichetta' }, [String(vino.annata)]));
  if (vino.regione !== '') etichette.push(el('span', { class: 'etichetta' }, [vino.regione]));
  return etichette;
}

export function schedaVino(vino: Vino): HTMLLIElement {
  const figura = el('figure', { class: 'bottiglia__figura' }, [segnapostoBottiglia(vino.colore)]);
  if (vino.preferito) figura.append(el('span', { class: 'bottiglia__stella', 'aria-hidden': 'true' }, ['★']));
  void mostraFoto(vino, figura, `${vino.nome} — ${vino.cantina}`);

  const corpo = el('div', { class: 'bottiglia__corpo' }, [
    el('h2', { class: 'bottiglia__nome' }, [el('a', { href: urlVino(vino.id) }, [vino.nome])]),
    el('p', { class: 'bottiglia__cantina' }, [vino.cantina]),
    // La descrizione lunga non compare qui: si legge aprendo il vino.
    vino.gusto === '' ? null : el('p', { class: 'bottiglia__gusto' }, [vino.gusto]),
    el('p', { class: 'bottiglia__etichette' }, etichetteVino(vino)),
  ]);

  return el('li', { class: 'bottiglia' }, [figura, corpo]) as HTMLLIElement;
}

export function vetrinaVini(vini: readonly Vino[]): HTMLUListElement {
  return el('ul', { class: 'vetrina' }, vini.map((v) => schedaVino(v))) as HTMLUListElement;
}
