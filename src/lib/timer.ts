/**
 * Logica dei timer di cucina. Modulo puro: nessun DOM, nessun `setInterval`.
 *
 * Regola d'oro: il tempo residuo si calcola SEMPRE da timestamp assoluti
 * (`Date.now()` passato dal chiamante). Un contatore incrementato a ogni tick
 * sarebbe sbagliato appena il telefono blocca lo schermo o l'app va in
 * background: al ritorno il tempo mancante deve essere quello vero.
 */

export type StatoTimer = 'inattivo' | 'in-corso' | 'in-pausa' | 'scaduto';

export interface Timer {
  id: string;
  etichetta: string;
  /** Durata impostata, in secondi. */
  durataSecondi: number;
  /** Millisecondi residui congelati (timer inattivo, in pausa o scaduto). */
  residuoMsCongelato: number;
  /** Istante (epoch ms) in cui il timer è stato avviato o ripreso. */
  avviatoIl: number | null;
  stato: StatoTimer;
  ricettaId: string;
  /** Indice del passaggio che ha generato il timer. */
  passaggio: number;
  /** Istante di scadenza, per sapere se ha già suonato. */
  suonato: boolean;
}

export function creaTimer(dati: {
  id: string;
  etichetta: string;
  durataSecondi: number;
  ricettaId: string;
  passaggio: number;
}): Timer {
  return {
    id: dati.id,
    etichetta: dati.etichetta,
    durataSecondi: dati.durataSecondi,
    residuoMsCongelato: dati.durataSecondi * 1000,
    avviatoIl: null,
    stato: 'inattivo',
    ricettaId: dati.ricettaId,
    passaggio: dati.passaggio,
    suonato: false,
  };
}

/** Millisecondi residui, mai negativi. */
export function residuoMs(timer: Timer, ora: number): number {
  if (timer.stato !== 'in-corso' || timer.avviatoIl === null) {
    return Math.max(0, timer.residuoMsCongelato);
  }
  return Math.max(0, timer.residuoMsCongelato - (ora - timer.avviatoIl));
}

export function avvia(timer: Timer, ora: number): Timer {
  if (timer.stato === 'in-corso') return timer;
  const residuo = timer.stato === 'scaduto' ? timer.durataSecondi * 1000 : residuoMs(timer, ora);
  if (residuo <= 0) return { ...timer, residuoMsCongelato: 0, stato: 'scaduto', avviatoIl: null };
  return {
    ...timer,
    residuoMsCongelato: residuo,
    avviatoIl: ora,
    stato: 'in-corso',
    suonato: false,
  };
}

export function pausa(timer: Timer, ora: number): Timer {
  if (timer.stato !== 'in-corso') return timer;
  return { ...timer, residuoMsCongelato: residuoMs(timer, ora), avviatoIl: null, stato: 'in-pausa' };
}

export function azzera(timer: Timer): Timer {
  return {
    ...timer,
    residuoMsCongelato: timer.durataSecondi * 1000,
    avviatoIl: null,
    stato: 'inattivo',
    suonato: false,
  };
}

/** Aggiunge (o toglie, con valore negativo) secondi al residuo. */
export function aggiungiSecondi(timer: Timer, secondi: number, ora: number): Timer {
  const residuo = Math.max(0, residuoMs(timer, ora) + secondi * 1000);
  const base: Timer = {
    ...timer,
    residuoMsCongelato: residuo,
    durataSecondi: Math.max(1, timer.durataSecondi + secondi),
  };
  if (timer.stato === 'in-corso') {
    return residuo <= 0
      ? { ...base, avviatoIl: null, stato: 'scaduto' }
      : { ...base, avviatoIl: ora, stato: 'in-corso', suonato: false };
  }
  if (timer.stato === 'scaduto' && residuo > 0) return { ...base, stato: 'in-pausa', suonato: false };
  return base;
}

/**
 * Ricalcola lo stato del timer all'istante `ora`.
 * Da chiamare a ogni tick dell'interfaccia e al ritorno in primo piano.
 */
export function aggiorna(timer: Timer, ora: number): Timer {
  if (timer.stato !== 'in-corso') return timer;
  if (residuoMs(timer, ora) > 0) return timer;
  return { ...timer, residuoMsCongelato: 0, avviatoIl: null, stato: 'scaduto' };
}

/** Vero quando il timer e appena scaduto e non ha ancora suonato. */
export function daSuonare(timer: Timer): boolean {
  return timer.stato === 'scaduto' && !timer.suonato;
}

/** `mm:ss`, oppure `h:mm:ss` oltre l'ora. */
export function formattaResiduo(ms: number): string {
  const totale = Math.max(0, Math.ceil(ms / 1000));
  const ore = Math.floor(totale / 3600);
  const minuti = Math.floor((totale % 3600) / 60);
  const secondi = totale % 60;
  const due = (n: number): string => String(n).padStart(2, '0');
  return ore > 0 ? `${ore}:${due(minuti)}:${due(secondi)}` : `${due(minuti)}:${due(secondi)}`;
}

/** Percentuale di avanzamento, 0-100, per la barra di progresso. */
export function percentualeCompletata(timer: Timer, ora: number): number {
  const totale = timer.durataSecondi * 1000;
  if (totale <= 0) return 100;
  return Math.min(100, Math.max(0, ((totale - residuoMs(timer, ora)) / totale) * 100));
}
