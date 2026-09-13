/**
 * Unica implementazione di `ArchivioImmagini`, su IndexedDB.
 *
 * È il solo file dell'app autorizzato a nominare `indexedDB`. IndexedDB è
 * l'unico spazio del browser che tiene file binari veri e che ha spazio
 * nell'ordine dei gigabyte invece dei cinque megabyte di `localStorage`.
 *
 * Niente librerie: il poco che serve (apri, metti, prendi, cancella) sta
 * in una cinquantina di righe.
 */
import type { ArchivioImmagini } from './immagini.ts';
import type { Esito } from './esito.ts';
import { errore, ok } from './esito.ts';

const NOME_DB = 'semagnaa-immagini';
const DEPOSITO = 'foto';
const VERSIONE_DB = 1;

function apri(): Promise<IDBDatabase> {
  return new Promise((risolvi, rifiuta) => {
    if (typeof indexedDB === 'undefined') {
      rifiuta(new Error('indexedDB non disponibile'));
      return;
    }
    const richiesta = indexedDB.open(NOME_DB, VERSIONE_DB);
    richiesta.onupgradeneeded = () => {
      const db = richiesta.result;
      if (!db.objectStoreNames.contains(DEPOSITO)) db.createObjectStore(DEPOSITO);
    };
    richiesta.onsuccess = () => risolvi(richiesta.result);
    richiesta.onerror = () => rifiuta(richiesta.error ?? new Error('apertura fallita'));
  });
}

function attendi<T>(richiesta: IDBRequest<T>): Promise<T> {
  return new Promise((risolvi, rifiuta) => {
    richiesta.onsuccess = () => risolvi(richiesta.result);
    richiesta.onerror = () => rifiuta(richiesta.error ?? new Error('operazione fallita'));
  });
}

async function conDeposito<T>(modo: IDBTransactionMode, lavoro: (deposito: IDBObjectStore) => Promise<T>): Promise<T> {
  const db = await apri();
  try {
    const transazione = db.transaction(DEPOSITO, modo);
    return await lavoro(transazione.objectStore(DEPOSITO));
  } finally {
    db.close();
  }
}

export const immaginiIndexedDb: ArchivioImmagini = {
  disponibile(): boolean {
    return typeof indexedDB !== 'undefined';
  },

  async salva(id: string, foto: Blob): Promise<Esito<string>> {
    try {
      await conDeposito('readwrite', (deposito) => attendi(deposito.put(foto, id)));
      return ok(id);
    } catch {
      // Quota esaurita o modalità privata: il chiamante deve poterlo dire.
      return errore('errori.fotoNonSalvata');
    }
  },

  async leggi(id: string): Promise<Esito<Blob | null>> {
    try {
      const foto = await conDeposito('readonly', (deposito) => attendi(deposito.get(id)));
      return ok(foto instanceof Blob ? foto : null);
    } catch {
      return errore('errori.fotoNonLetta');
    }
  },

  async cancella(id: string): Promise<Esito<void>> {
    try {
      await conDeposito('readwrite', (deposito) => attendi(deposito.delete(id)));
      return ok(undefined);
    } catch {
      return errore('errori.fotoNonLetta');
    }
  },

  async statistiche(): Promise<Esito<{ quante: number; byte: number }>> {
    try {
      const foto = await conDeposito('readonly', (deposito) => attendi<Blob[]>(deposito.getAll()));
      const byte = foto.reduce((totale, blob) => totale + (blob instanceof Blob ? blob.size : 0), 0);
      return ok({ quante: foto.length, byte });
    } catch {
      return ok({ quante: 0, byte: 0 });
    }
  },

  async azzera(): Promise<Esito<void>> {
    try {
      await conDeposito('readwrite', (deposito) => attendi(deposito.clear()));
      return ok(undefined);
    } catch {
      return errore('errori.fotoNonLetta');
    }
  },
};
