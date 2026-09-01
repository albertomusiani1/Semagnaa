/**
 * Micro-utilità DOM per le isole client: nessun framework, nessun virtual DOM.
 * Solo ciò che serve per costruire liste e schede senza `innerHTML` di stringhe
 * concatenate (che aprirebbe la porta all'iniezione dei testi delle ricette).
 */
type Attributi = Record<string, string | number | boolean | undefined>;
type Figlio = Node | string | number | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributi: Attributi = {},
  figli: Figlio[] = [],
): HTMLElementTagNameMap[K] {
  const nodo = document.createElement(tag);
  for (const [nome, valore] of Object.entries(attributi)) {
    if (valore === undefined || valore === false) continue;
    if (valore === true) nodo.setAttribute(nome, '');
    else nodo.setAttribute(nome, String(valore));
  }
  for (const figlio of figli) {
    if (figlio === null || figlio === undefined || figlio === false) continue;
    nodo.append(typeof figlio === 'string' || typeof figlio === 'number' ? String(figlio) : figlio);
  }
  return nodo;
}

export function svuota(nodo: Element): void {
  while (nodo.firstChild !== null) nodo.removeChild(nodo.firstChild);
}

export function trova<T extends Element = HTMLElement>(selettore: string, radice: ParentNode = document): T {
  const nodo = radice.querySelector<T>(selettore);
  if (nodo === null) throw new Error(`Elemento assente nel documento: ${selettore}`);
  return nodo;
}

export function cerca<T extends Element = HTMLElement>(selettore: string, radice: ParentNode = document): T | null {
  return radice.querySelector<T>(selettore);
}

export function tutti<T extends Element = HTMLElement>(selettore: string, radice: ParentNode = document): T[] {
  return [...radice.querySelectorAll<T>(selettore)];
}

/** Legge le stringhe di interfaccia serializzate dal server in un tag script. */
export function stringheDaPagina<T>(id: string): T {
  const nodo = document.getElementById(id);
  if (nodo === null) throw new Error(`Stringhe assenti: ${id}`);
  return JSON.parse(nodo.textContent ?? '{}') as T;
}

/** Annuncio per i lettori di schermo e messaggio a schermo. */
export function annuncia(contenitore: HTMLElement, messaggio: string, tipo: 'ok' | 'errore' = 'ok'): void {
  contenitore.textContent = messaggio;
  contenitore.dataset['tipo'] = tipo;
  contenitore.hidden = messaggio === '';
}
