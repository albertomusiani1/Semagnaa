/**
 * Sessione della modalità Cucina: quale ricetta, a che passaggio, con quali
 * timer. Persistita a ogni cambiamento, così chiudere l'app (o rispondere a
 * una telefonata) non fa perdere il segno.
 */
import type { Timer } from './timer.ts';
import { archivio } from './archivio.ts';

export interface SessioneCucina {
  ricettaId: string;
  passaggio: number;
  porzioni: number;
  iniziataIl: string;
  timer: Timer[];
}

export async function leggiSessione(): Promise<SessioneCucina | null> {
  const esito = await archivio.leggiStato<SessioneCucina | null>('sessione-cucina', null);
  if (!esito.ok || esito.dato === null) return null;
  const sessione = esito.dato;
  if (typeof sessione.ricettaId !== 'string' || !Array.isArray(sessione.timer)) return null;
  return sessione;
}

export async function salvaSessione(sessione: SessioneCucina): Promise<void> {
  await archivio.scriviStato('sessione-cucina', sessione);
}

export async function chiudiSessione(): Promise<void> {
  await archivio.rimuoviStato('sessione-cucina');
}
