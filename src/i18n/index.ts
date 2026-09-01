/**
 * Helper i18n. L'app oggi e solo in italiano, ma nessun componente
 * contiene stringhe di interfaccia: le prendono tutte da qui.
 *
 * Aggiungere una lingua (vedi README):
 *  1. copiare `it.json` in `en.json` e tradurre i valori;
 *  2. aggiungerlo a `dizionari` qui sotto;
 *  3. aggiungere il codice a `locales` in `astro.config.mjs`.
 * Nessun altro file va toccato.
 */
import it from './it.json';

export type Dizionario = typeof it;

const dizionari = { it } as const;

export type Lingua = keyof typeof dizionari;
export const LINGUA_PREDEFINITA: Lingua = 'it';
export const LINGUE: readonly Lingua[] = Object.keys(dizionari) as Lingua[];

/** Dizionario completo, tipizzato: `d().ricetta.ingredienti`. */
export function d(lingua: Lingua = LINGUA_PREDEFINITA): Dizionario {
  return dizionari[lingua];
}

/** Le stringhe della lingua corrente, pronte per i componenti Astro. */
export const T: Dizionario = d();

/**
 * Lettura per chiave puntata, per le isole client che ricevono le stringhe
 * serializzate: `t('cucina.avviaTimer')`. Se la chiave non esiste
 * restituisce la chiave stessa, così l'errore si vede subito.
 */
export function t(chiave: string, lingua: Lingua = LINGUA_PREDEFINITA): string {
  let corrente: unknown = dizionari[lingua];
  for (const parte of chiave.split('.')) {
    if (typeof corrente !== 'object' || corrente === null) return chiave;
    corrente = (corrente as Record<string, unknown>)[parte];
  }
  return typeof corrente === 'string' ? corrente : chiave;
}

/** Sostituisce i segnaposto `{nome}`: interpola('{n} ricette', { n: 3 }). */
export function interpola(modello: string, valori: Readonly<Record<string, string | number>>): string {
  return modello.replace(/\{(\w+)\}/g, (intero, chiave: string) => {
    const valore = valori[chiave];
    return valore === undefined ? intero : String(valore);
  });
}
