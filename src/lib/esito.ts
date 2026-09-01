/** Esito tipizzato, condiviso da archivio e validazione. */
export type Esito<T> = { ok: true; dato: T } | { ok: false; errore: string };

export function ok<T>(dato: T): Esito<T> {
  return { ok: true, dato };
}

export function errore<T>(messaggio: string): Esito<T> {
  return { ok: false, errore: messaggio };
}
