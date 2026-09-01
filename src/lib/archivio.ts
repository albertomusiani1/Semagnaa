/**
 * Interfaccia di persistenza. NON nomina nessuna tecnologia di storage.
 *
 * Tutto il resto dell'app importa solo da questo file. L'unica riga da
 * cambiare per passare a un'altra tecnologia (IndexedDB, file system,
 * sincronizzazione remota) e l'import in fondo: si scrive un nuovo
 * `archivio-<qualcosa>.ts` che implementa `Archivio` e si punta a quello.
 * Vedi README, sezione "Cambiare tecnologia di storage".
 */
import type { Ricetta } from './tipi.ts';
import type { Esito } from './esito.ts';

/** Chiavi di stato ammesse: elenco chiuso, così non si sparpagliano stringhe. */
export type ChiaveStato =
  | 'seed-versione'
  | 'tema'
  | 'sessione-cucina'
  | 'timer-attivi'
  | 'spesa-selezione'
  | 'spesa-dispensa'
  | 'spesa-spuntate'
  | 'ultime-aperte';

export interface Archivio {
  leggiRicette(): Promise<Esito<Ricetta[]>>;
  leggiRicetta(id: string): Promise<Esito<Ricetta | null>>;
  /** Inserisce o aggiorna, per `id`. */
  salvaRicetta(ricetta: Ricetta): Promise<Esito<Ricetta>>;
  cancellaRicetta(id: string): Promise<Esito<void>>;
  /** Sostituisce in blocco l'archivio (seed iniziale, importazione). */
  sostituisciRicette(ricette: readonly Ricetta[]): Promise<Esito<void>>;
  /** Unisce per `id`: le ricette passate vincono sulle omonime esistenti. */
  unisciRicette(ricette: readonly Ricetta[]): Promise<Esito<void>>;
  leggiStato<T>(chiave: ChiaveStato, predefinito: T): Promise<Esito<T>>;
  scriviStato<T>(chiave: ChiaveStato, valore: T): Promise<Esito<void>>;
  rimuoviStato(chiave: ChiaveStato): Promise<Esito<void>>;
  /** Cancella ricette è stato: il tasto "azzera tutto" delle impostazioni. */
  azzeraTutto(): Promise<Esito<void>>;
  /** Vero se la tecnologia sottostante e utilizzabile in questo contesto. */
  disponibile(): boolean;
}

export type { Esito } from './esito.ts';

// --- unica riga da cambiare per sostituire la tecnologia di storage ---
export { archivioLocale as archivio } from './archivio-locale.ts';
