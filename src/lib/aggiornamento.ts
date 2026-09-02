/**
 * Rapporti con il service worker visti dal lato pagina: quale versione sta
 * servendo, cerca aggiornamenti, e la via di fuga "svuota la cache e ricarica".
 *
 * Perché serve: la copia dell'app sul dispositivo è gestita dal service
 * worker. Se per qualsiasi motivo resta indietro (rete ballerina al momento
 * sbagliato, cache della CDN, aggiornamento mai controllato), l'utente deve
 * poterla buttare via senza perdere i suoi dati.
 */

/** Versione della cache che il service worker sta servendo, se c'è. */
export async function versioneInUso(): Promise<string | null> {
  if (!('serviceWorker' in navigator)) return null;
  const controllore = navigator.serviceWorker.controller;
  if (controllore === null) return null;
  return new Promise((risolvi) => {
    const canale = new MessageChannel();
    const scadenza = setTimeout(() => risolvi(null), 1500);
    canale.port1.onmessage = (evento) => {
      clearTimeout(scadenza);
      const dati = evento.data as { versione?: string } | null;
      risolvi(dati?.versione ?? null);
    };
    controllore.postMessage({ tipo: 'versione' }, [canale.port2]);
  });
}

/** Chiede al browser di ricontrollare se esiste una versione nuova. */
export async function cercaAggiornamenti(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const registrazione = await navigator.serviceWorker.getRegistration();
  if (registrazione === undefined) return false;
  await registrazione.update();
  return registrazione.waiting !== null || registrazione.installing !== null;
}

/**
 * Via di fuga: rimuove il service worker e tutte le cache dell'app, poi
 * ricarica da zero. **Non tocca i dati**: ricette, spesa e impostazioni
 * stanno nell'archivio del dispositivo, non nella cache dei file.
 */
export async function svuotaCacheERicarica(indirizzo: string): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrazioni = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrazioni.map((r) => r.unregister()));
  }
  if ('caches' in window) {
    const nomi = await caches.keys();
    await Promise.all(nomi.map((nome) => caches.delete(nome)));
  }
  // La query serve a non farsi servire la pagina dalla cache HTTP del browser.
  location.replace(`${indirizzo}?aggiornata=${Date.now()}`);
}
