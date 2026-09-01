/**
 * Immagini segnaposto generate: nessuna foto, nessun file scaricato.
 * Lo stesso titolo produce sempre lo stesso disegno, e i colori arrivano
 * dalle custom properties, quindi seguono il tema chiaro/scuro.
 */
const NS = 'http://www.w3.org/2000/svg';

function seme(testo: string): number {
  let h = 2166136261;
  for (let i = 0; i < testo.length; i += 1) {
    h ^= testo.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function nodo(tag: string, attributi: Record<string, string | number>): SVGElement {
  const elemento = document.createElementNS(NS, tag);
  for (const [nome, valore] of Object.entries(attributi)) elemento.setAttribute(nome, String(valore));
  return elemento;
}

/** SVG decorativo 300x200, deterministico rispetto al titolo. */
export function svgSegnaposto(titolo: string): SVGSVGElement {
  const s = seme(titolo);
  const variante = s % 4;
  const svg = nodo('svg', {
    xmlns: NS,
    viewBox: '0 0 300 200',
    width: 300,
    height: 200,
    'aria-hidden': 'true',
    focusable: 'false',
    preserveAspectRatio: 'xMidYMid slice',
  }) as SVGSVGElement;

  svg.append(nodo('rect', { x: 0, y: 0, width: 300, height: 200, fill: 'var(--superficie-scura)' }));

  const primario = 'var(--colore-primario)';
  const accento = 'var(--colore-accento)';

  if (variante === 0) {
    for (let i = 0; i < 5; i += 1) {
      svg.append(
        nodo('circle', {
          cx: 40 + i * 55,
          cy: 100 + ((s >> (i * 2)) % 40) - 20,
          r: 18 + ((s >> i) % 16),
          fill: i % 2 === 0 ? primario : accento,
          opacity: 0.18 + (i % 3) * 0.08,
        }),
      );
    }
  } else if (variante === 1) {
    for (let i = 0; i < 7; i += 1) {
      svg.append(
        nodo('rect', {
          x: i * 44,
          y: 40 + ((s >> i) % 60),
          width: 30,
          height: 160,
          rx: 8,
          fill: i % 3 === 0 ? accento : primario,
          opacity: 0.16 + (i % 4) * 0.06,
        }),
      );
    }
  } else if (variante === 2) {
    svg.append(nodo('circle', { cx: 150, cy: 105, r: 70, fill: primario, opacity: 0.16 }));
    svg.append(nodo('circle', { cx: 150, cy: 105, r: 45, fill: accento, opacity: 0.22 }));
    svg.append(
      nodo('path', {
        d: 'M60 150 Q150 60 240 150',
        stroke: primario,
        'stroke-width': 6,
        fill: 'none',
        opacity: 0.4,
      }),
    );
  } else {
    for (let i = 0; i < 6; i += 1) {
      const x = 20 + i * 48;
      svg.append(
        nodo('path', {
          d: `M${x} 170 L${x + 24} ${60 + ((s >> i) % 50)} L${x + 48} 170 Z`,
          fill: i % 2 === 0 ? primario : accento,
          opacity: 0.15 + (i % 3) * 0.07,
        }),
      );
    }
  }
  return svg;
}
