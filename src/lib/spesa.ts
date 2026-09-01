/**
 * Aggregazione degli ingredienti in lista della spesa.
 * Modulo puro, testato: nessun DOM, nessuno storage, nessuna stringa di interfaccia.
 */
import type { Quantita, Reparto, Ricetta, Unita } from './tipi.ts';
import { REPARTI } from './tipi.ts';
import { normalizzaNome } from './testo.ts';
import { famiglia, leggibile, somma } from './unita.ts';
import { scalaIngredienti } from './scala.ts';

export interface SelezioneRicetta {
  ricettaId: string;
  porzioni: number;
}

export interface VoceSpesa {
  /** Chiave stabile: nome normalizzato + famiglia di unità. */
  chiave: string;
  nome: string;
  reparto: Reparto;
  quantita: Quantita;
  /** Titoli delle ricette che richiedono questa voce. */
  ricette: string[];
  note: string[];
}

export interface GruppoSpesa {
  reparto: Reparto;
  voci: VoceSpesa[];
}

/**
 * Aggrega gli ingredienti delle ricette selezionate, scalati alle porzioni
 * richieste. Voci con unità non sommabili tra loro restano separate.
 */
export function aggrega(ricette: readonly Ricetta[], selezione: readonly SelezioneRicetta[]): VoceSpesa[] {
  const perId = new Map(ricette.map((r) => [r.id, r]));
  const voci = new Map<string, VoceSpesa>();

  for (const scelta of selezione) {
    const ricetta = perId.get(scelta.ricettaId);
    if (ricetta === undefined) continue;
    const ingredienti = scalaIngredienti(ricetta.ingredienti, ricetta.porzioni, scelta.porzioni);

    for (const ingrediente of ingredienti) {
      const nomeChiave = normalizzaNome(ingrediente.nome);
      if (nomeChiave === '') continue;
      const fam = famiglia(ingrediente.unita) ?? 'senza-unita';
      const chiave = `${nomeChiave}|${fam}`;
      const quantita: Quantita = {};
      if (ingrediente.quantita !== undefined) quantita.valore = ingrediente.quantita;
      if (ingrediente.unita !== undefined) quantita.unita = ingrediente.unita;

      const esistente = voci.get(chiave);
      if (esistente === undefined) {
        voci.set(chiave, {
          chiave,
          nome: ingrediente.nome.trim(),
          reparto: ingrediente.reparto,
          quantita,
          ricette: [ricetta.titolo],
          note: ingrediente.note === undefined ? [] : [ingrediente.note],
        });
        continue;
      }

      const sommata = somma(esistente.quantita, quantita);
      // `qb` e le voci senza quantità non si sommano: compaiono una volta sola.
      if (sommata !== null) esistente.quantita = sommata;
      if (!esistente.ricette.includes(ricetta.titolo)) esistente.ricette.push(ricetta.titolo);
      if (ingrediente.note !== undefined && !esistente.note.includes(ingrediente.note)) {
        esistente.note.push(ingrediente.note);
      }
    }
  }

  return [...voci.values()]
    .map((v) => ({ ...v, quantita: leggibile(v.quantita) }))
    .sort((a, b) => ordineReparto(a.reparto) - ordineReparto(b.reparto) || a.nome.localeCompare(b.nome, 'it'));
}

export function ordineReparto(reparto: Reparto): number {
  const indice = REPARTI.indexOf(reparto);
  return indice === -1 ? REPARTI.length : indice;
}

/** Raggruppa per reparto nell'ordine di attraversamento del supermercato. */
export function raggruppaPerReparto(voci: readonly VoceSpesa[]): GruppoSpesa[] {
  const gruppi: GruppoSpesa[] = [];
  for (const reparto of REPARTI) {
    const dentro = voci.filter((v) => v.reparto === reparto);
    if (dentro.length > 0) gruppi.push({ reparto, voci: dentro });
  }
  return gruppi;
}

/** Voci ancora da comprare, secondo la checklist dispensa. */
export function vociMancanti(
  voci: readonly VoceSpesa[],
  dispensa: Readonly<Record<string, boolean>>,
): VoceSpesa[] {
  return voci.filter((v) => dispensa[v.chiave] !== true);
}

/** Lista in testo semplice, per "copia" e "condividi". */
export function comeTesto(
  gruppi: readonly GruppoSpesa[],
  titolo: string,
  etichetteReparto: Readonly<Record<string, string>>,
  etichetteUnita: Partial<Record<Unita, string>>,
  formattaQuantita: (q: Quantita, e: Partial<Record<Unita, string>>) => string,
): string {
  const righe: string[] = [titolo, ''];
  for (const gruppo of gruppi) {
    righe.push(`${etichetteReparto[gruppo.reparto] ?? gruppo.reparto}:`);
    for (const voce of gruppo.voci) {
      const q = formattaQuantita(voce.quantita, etichetteUnita);
      righe.push(q === '' ? `- ${voce.nome}` : `- ${voce.nome} — ${q}`);
    }
    righe.push('');
  }
  return righe.join('\n').trim();
}
