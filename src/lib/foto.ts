/**
 * Preparazione delle foto prima di salvarle.
 *
 * Una foto di telefono è 4-6 MB e 4000 px di lato: sprecata per una scheda
 * di vino, e in cento bottiglie riempie la memoria del dispositivo. Qui
 * viene ridotta a un lato lungo ragionevole e ricompressa in JPEG.
 *
 * Sta fuori dall'archivio immagini apposta: l'archivio salva quello che
 * riceve, la riduzione è una scelta dell'app.
 */
export const LATO_MASSIMO = 1400;
export const QUALITA = 0.82;

/** Identificativo della foto: stabile, senza dipendenze. */
export function idFoto(): string {
  const casuale = Math.random().toString(36).slice(2, 10);
  return `foto-${Date.now().toString(36)}-${casuale}`;
}

/**
 * Ridimensiona e ricomprime. Se qualcosa non funziona (formato strano,
 * canvas non disponibile) restituisce il file originale: meglio una foto
 * pesante che nessuna foto.
 */
export async function preparaFoto(file: File, latoMassimo = LATO_MASSIMO): Promise<Blob> {
  try {
    const immagine = await caricaImmagine(file);
    const scala = Math.min(1, latoMassimo / Math.max(immagine.width, immagine.height));
    const larghezza = Math.round(immagine.width * scala);
    const altezza = Math.round(immagine.height * scala);

    const tela = document.createElement('canvas');
    tela.width = larghezza;
    tela.height = altezza;
    const contesto = tela.getContext('2d');
    if (contesto === null) return file;
    contesto.drawImage(immagine, 0, 0, larghezza, altezza);
    if ('close' in immagine && typeof immagine.close === 'function') immagine.close();

    const ridotta = await new Promise<Blob | null>((risolvi) => {
      tela.toBlob(risolvi, 'image/jpeg', QUALITA);
    });
    return ridotta ?? file;
  } catch {
    return file;
  }
}

async function caricaImmagine(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file);
  const indirizzo = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((risolvi, rifiuta) => {
      const immagine = new Image();
      immagine.onload = () => risolvi(immagine);
      immagine.onerror = () => rifiuta(new Error('immagine non leggibile'));
      immagine.src = indirizzo;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(indirizzo), 10_000);
  }
}

/** Dimensione leggibile: "1,2 MB", "340 kB". */
export function pesoLeggibile(byte: number): string {
  if (byte < 1000) return `${byte} B`;
  if (byte < 1_000_000) return `${Math.round(byte / 1000)} kB`;
  return `${(byte / 1_000_000).toFixed(1).replace('.', ',')} MB`;
}
