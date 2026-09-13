/**
 * Interfaccia dell'archivio immagini. Come per `archivio.ts`, non nomina
 * nessuna tecnologia: l'app chiede di salvare, leggere e cancellare foto.
 *
 * Perché è separato dall'archivio dei dati: le foto sono file binari da
 * centinaia di kB, `localStorage` tiene solo testo e si ferma attorno ai
 * 5 MB. Due esigenze diverse, due implementazioni diverse, un'interfaccia
 * per ciascuna.
 *
 * Per cambiare tecnologia si scrive un nuovo `immagini-*.ts` e si cambia
 * l'ultima riga di questo file.
 */
import type { Esito } from './esito.ts';

export interface ArchivioImmagini {
  /** Salva la foto e restituisce l'identificativo con cui ritrovarla. */
  salva(id: string, foto: Blob): Promise<Esito<string>>;
  leggi(id: string): Promise<Esito<Blob | null>>;
  cancella(id: string): Promise<Esito<void>>;
  /** Quante foto e quanti byte occupano: serve alle impostazioni. */
  statistiche(): Promise<Esito<{ quante: number; byte: number }>>;
  /** Cancella tutto: fa parte di "azzera tutti i dati". */
  azzera(): Promise<Esito<void>>;
  disponibile(): boolean;
}

// --- unica riga da cambiare per sostituire la tecnologia ---------------
export { immaginiIndexedDb as immagini } from './immagini-indexeddb.ts';
