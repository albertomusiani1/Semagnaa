/**
 * Suoneria dei timer: generata con Web Audio, nessun file audio da scaricare.
 * L'AudioContext si crea al primo tocco dell'utente, come chiedono i browser.
 */
let contesto: AudioContext | null = null;

export function preparaSuono(): void {
  if (contesto !== null) return;
  const Costruttore = window.AudioContext;
  if (Costruttore === undefined) return;
  try {
    contesto = new Costruttore();
  } catch {
    contesto = null;
  }
}

/** Tre bip brevi: si sentono anche con la cappa accesa, senza spaventare. */
export function suonaAllarme(): void {
  if (contesto === null) return;
  if (contesto.state === 'suspended') void contesto.resume();
  const inizio = contesto.currentTime;
  for (let i = 0; i < 3; i += 1) {
    const oscillatore = contesto.createOscillator();
    const volume = contesto.createGain();
    oscillatore.type = 'sine';
    oscillatore.frequency.value = 880;
    const t = inizio + i * 0.45;
    volume.gain.setValueAtTime(0, t);
    volume.gain.linearRampToValueAtTime(0.25, t + 0.02);
    volume.gain.linearRampToValueAtTime(0, t + 0.32);
    oscillatore.connect(volume).connect(contesto.destination);
    oscillatore.start(t);
    oscillatore.stop(t + 0.35);
  }
}

export function vibra(): void {
  if (typeof navigator.vibrate === 'function') navigator.vibrate([200, 120, 200, 120, 400]);
}

/**
 * Tiene lo schermo accesso durante la modalità Cucina.
 * Se l'API non c'è (iOS, browser vecchi) non succede nulla: si degrada in
 * silenzio, non è un errore da mostrare.
 */
export class SchermoAcceso {
  #blocco: WakeLockSentinel | null = null;

  get attivo(): boolean {
    return this.#blocco !== null;
  }

  async richiedi(): Promise<boolean> {
    if (!('wakeLock' in navigator)) return false;
    try {
      this.#blocco = await navigator.wakeLock.request('screen');
      this.#blocco.addEventListener('release', () => {
        this.#blocco = null;
      });
      return true;
    } catch {
      this.#blocco = null;
      return false;
    }
  }

  async rilascia(): Promise<void> {
    if (this.#blocco === null) return;
    try {
      await this.#blocco.release();
    } catch {
      /* già rilasciato */
    }
    this.#blocco = null;
  }
}
