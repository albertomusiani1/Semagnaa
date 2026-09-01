/**
 * Ricette di esempio come JSON statico, generato in fase di build dalla
 * content collection (quindi già validato da Zod). L'app lo scarica al
 * primo avvio; il service worker lo mette in precache, così funziona
 * anche installando l'app e aprendola offline.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { Ingrediente, Passaggio, Ricetta } from '../../lib/tipi.ts';
import { VERSIONE_SEED } from '../../lib/seed.ts';

export const prerender = true;

export const GET: APIRoute = async () => {
  const voci = await getCollection('ricette');

  const ricette: Ricetta[] = voci
    .map((voce): Ricetta => {
      const dati = voce.data;
      const creataIl = dati.data.toISOString();
      const ricetta: Ricetta = {
        id: voce.id,
        titolo: dati.titolo,
        categoria: dati.categoria,
        porzioni: dati.porzioni,
        tempoPreparazioneMin: dati.tempoPreparazioneMin,
        tempoCotturaMin: dati.tempoCotturaMin,
        difficolta: dati.difficolta,
        descrizione: dati.descrizione,
        tags: dati.tags,
        preferita: dati.preferita,
        ingredienti: dati.ingredienti as Ingrediente[],
        passaggi: dati.passaggi as Passaggio[],
        creataIl,
        aggiornataIl: creataIl,
      };
      if (dati.fonte !== undefined) ricetta.fonte = dati.fonte;
      const note = (voce.body ?? '').trim();
      if (note !== '') ricetta.note = note;
      return ricetta;
    })
    .sort((a, b) => a.titolo.localeCompare(b.titolo, 'it'));

  return new Response(JSON.stringify({ versione: VERSIONE_SEED, ricette }, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
