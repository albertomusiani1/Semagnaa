/**
 * Utilità di testo, pure: nessun accesso al DOM, nessuna dipendenza.
 * Usate sia in fase di build che nelle isole client che nei test.
 */

/** Rimuove i segni diacritici: "Prosciutto crudò" -> "Prosciutto crudo". */
export function senzaAccenti(testo: string): string {
  return testo.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Chiave di confronto per i nomi degli ingredienti.
 * Minuscole, accenti rimossi, spazi normalizzati, punteggiatura di coda via.
 *
 * Limite noto e accettato: non gestisce singolare/plurale ne sinonimi
 * ("pomodoro" e "pomodori" restano due voci distinte). Vedi README.
 */
export function normalizzaNome(nome: string): string {
  return senzaAccenti(nome)
    .toLowerCase()
    .replace(/[.,;:!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Slug stabile e sicuro per gli URL e per gli id delle ricette. */
export function slugifica(testo: string): string {
  const base = senzaAccenti(testo)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return base.length > 0 ? base : 'ricetta';
}

/** Rende unico uno slug rispetto a un insieme di id già esistenti. */
export function slugUnico(testo: string, esistenti: readonly string[]): string {
  const base = slugifica(testo);
  if (!esistenti.includes(base)) return base;
  let n = 2;
  while (esistenti.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Numero in formato italiano, senza decimali inutili: 1.2 -> "1,2". */
export function numeroIt(valore: number, decimaliMax = 2): string {
  const arrotondato = Math.round(valore * 10 ** decimaliMax) / 10 ** decimaliMax;
  return String(arrotondato).replace('.', ',');
}
