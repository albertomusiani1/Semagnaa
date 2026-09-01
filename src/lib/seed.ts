/**
 * Caricamento iniziale delle ricette fornite con l'app.
 *
 * Le ricette "seed" vivono in `src/content/ricette/*.md`, vengono validate
 * da Zod in fase di build e pubblicate come JSON statico. Al primo avvio
 * l'app le copia nell'archivio locale; dai riavvii successivi non tocca
 * più nulla, così le modifiche dell'utente non vengono sovrascritte.
 *
 * Alzando `VERSIONE_SEED` le ricette di esempio nuove vengono aggiunte al
 * prossimo avvio, sempre senza sovrascrivere quelle già presenti per id.
 */
import type { Ricetta } from './tipi.ts';
import { archivio } from './archivio.ts';
import { PERCORSI } from './percorsi.ts';

export const VERSIONE_SEED = 1;

interface FileSeed {
  versione: number;
  ricette: Ricetta[];
}

async function scaricaSeed(): Promise<Ricetta[]> {
  const risposta = await fetch(PERCORSI.seed, { cache: 'no-cache' });
  if (!risposta.ok) throw new Error(`seed non disponibile: ${risposta.status}`);
  const dati = (await risposta.json()) as FileSeed;
  return Array.isArray(dati.ricette) ? dati.ricette : [];
}

/**
 * Copia nell'archivio le ricette di esempio non ancora presenti.
 * `forzato: true` è il pulsante "ricarica le ricette di esempio".
 */
export async function assicuraSeed(forzato = false): Promise<void> {
  const versione = await archivio.leggiStato<number>('seed-versione', 0);
  const giaFatto = versione.ok && versione.dato >= VERSIONE_SEED;
  const esistenti = await archivio.leggiRicette();
  const quante = esistenti.ok ? esistenti.dato.length : 0;
  if (!forzato && giaFatto && quante > 0) return;

  const seed = await scaricaSeed();
  const presenti = new Set(esistenti.ok ? esistenti.dato.map((r) => r.id) : []);
  const daAggiungere = seed.filter((r) => !presenti.has(r.id));
  if (daAggiungere.length > 0) await archivio.unisciRicette(daAggiungere);
  await archivio.scriviStato('seed-versione', VERSIONE_SEED);
}

/** Ricette pronte all'uso: seed al primo avvio, poi solo l'archivio. */
export async function caricaRicette(): Promise<Ricetta[]> {
  try {
    await assicuraSeed();
  } catch {
    // Offline al primissimo avvio: si prosegue con quello che c'è in archivio.
  }
  const esito = await archivio.leggiRicette();
  return esito.ok ? esito.dato : [];
}

export function ordinaRicette(ricette: readonly Ricetta[]): Ricetta[] {
  return [...ricette].sort((a, b) => a.titolo.localeCompare(b.titolo, 'it'));
}
