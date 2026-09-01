/**
 * Unica implementazione di `Archivio`, basata su `localStorage`.
 *
 * Questo e il SOLO file dell'app autorizzato a nominare `localStorage`:
 * il resto del codice passa dall'interfaccia. La verifica 10b della
 * Definizione di Fatto fa `grep` esattamente su questo vincolo.
 *
 * Perche `localStorage` e non IndexedDB: i dati sono piccoli (decine di
 * ricette, pochi KB), l'accesso e sincrono e non serve alcuna migrazione
 * di schema. L'interfaccia e comunque asincrona, così il passaggio a
 * IndexedDB non cambia una riga fuori da qui.
 */
import type { Ricetta } from './tipi.ts';
import type { Archivio, ChiaveStato } from './archivio.ts';
import type { Esito } from './esito.ts';
import { errore, ok } from './esito.ts';

const PREFISSO = 'semagnaa:';
const CHIAVE_RICETTE = `${PREFISSO}ricette`;
const chiaveStato = (chiave: ChiaveStato): string => `${PREFISSO}stato:${chiave}`;

function magazzino(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const prova = `${PREFISSO}prova`;
    localStorage.setItem(prova, '1');
    localStorage.removeItem(prova);
    return localStorage;
  } catch {
    return null;
  }
}

function leggiJson<T>(chiave: string, predefinito: T): T {
  const store = magazzino();
  if (store === null) return predefinito;
  const grezzo = store.getItem(chiave);
  if (grezzo === null) return predefinito;
  try {
    return JSON.parse(grezzo) as T;
  } catch {
    return predefinito;
  }
}

function scriviJson(chiave: string, valore: unknown): Esito<void> {
  const store = magazzino();
  if (store === null) return errore('errori.storageNonDisponibile');
  try {
    store.setItem(chiave, JSON.stringify(valore));
    return ok(undefined);
  } catch {
    return errore('errori.storagePieno');
  }
}

export const archivioLocale: Archivio = {
  disponibile(): boolean {
    return magazzino() !== null;
  },

  async leggiRicette(): Promise<Esito<Ricetta[]>> {
    const ricette = leggiJson<Ricetta[]>(CHIAVE_RICETTE, []);
    return Array.isArray(ricette) ? ok(ricette) : ok([]);
  },

  async leggiRicetta(id: string): Promise<Esito<Ricetta | null>> {
    const ricette = leggiJson<Ricetta[]>(CHIAVE_RICETTE, []);
    return ok(ricette.find((r) => r.id === id) ?? null);
  },

  async salvaRicetta(ricetta: Ricetta): Promise<Esito<Ricetta>> {
    const ricette = leggiJson<Ricetta[]>(CHIAVE_RICETTE, []);
    const indice = ricette.findIndex((r) => r.id === ricetta.id);
    if (indice === -1) ricette.push(ricetta);
    else ricette[indice] = ricetta;
    const esito = scriviJson(CHIAVE_RICETTE, ricette);
    return esito.ok ? ok(ricetta) : errore(esito.errore);
  },

  async cancellaRicetta(id: string): Promise<Esito<void>> {
    const ricette = leggiJson<Ricetta[]>(CHIAVE_RICETTE, []).filter((r) => r.id !== id);
    return scriviJson(CHIAVE_RICETTE, ricette);
  },

  async sostituisciRicette(ricette: readonly Ricetta[]): Promise<Esito<void>> {
    return scriviJson(CHIAVE_RICETTE, [...ricette]);
  },

  async unisciRicette(nuove: readonly Ricetta[]): Promise<Esito<void>> {
    const attuali = leggiJson<Ricetta[]>(CHIAVE_RICETTE, []);
    const perId = new Map(attuali.map((r) => [r.id, r]));
    for (const ricetta of nuove) perId.set(ricetta.id, ricetta);
    return scriviJson(CHIAVE_RICETTE, [...perId.values()]);
  },

  async leggiStato<T>(chiave: ChiaveStato, predefinito: T): Promise<Esito<T>> {
    return ok(leggiJson<T>(chiaveStato(chiave), predefinito));
  },

  async scriviStato<T>(chiave: ChiaveStato, valore: T): Promise<Esito<void>> {
    return scriviJson(chiaveStato(chiave), valore);
  },

  async rimuoviStato(chiave: ChiaveStato): Promise<Esito<void>> {
    const store = magazzino();
    if (store === null) return errore('errori.storageNonDisponibile');
    store.removeItem(chiaveStato(chiave));
    return ok(undefined);
  },

  async azzeraTutto(): Promise<Esito<void>> {
    const store = magazzino();
    if (store === null) return errore('errori.storageNonDisponibile');
    const daRimuovere: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const chiave = store.key(i);
      if (chiave !== null && chiave.startsWith(PREFISSO)) daRimuovere.push(chiave);
    }
    for (const chiave of daRimuovere) store.removeItem(chiave);
    return ok(undefined);
  },
};
