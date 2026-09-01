/**
 * Schema delle ricette fornite con l'app (le "seed").
 *
 * Gli elenchi dei valori ammessi arrivano da `src/lib/tipi.ts`: una sola
 * fonte di verità per Zod (build) e per la validazione client (editor e
 * importazione). Se un file in `src/content/ricette/` ha un campo mancante,
 * di tipo sbagliato o non previsto, `npm run build` FALLISCE: e la rete di
 * sicurezza per le ricette aggiunte a mano fra sei mesi.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIE, DIFFICOLTA, LIMITI, REPARTI, UNITA } from './lib/tipi.ts';

const ingrediente = z.strictObject({
  nome: z.string().min(1).max(LIMITI.nomeIngredienteMax),
  quantita: z.number().positive().max(100000).optional(),
  unita: z.enum(UNITA).optional(),
  reparto: z.enum(REPARTI),
  note: z.string().max(200).optional(),
});

const passaggio = z.strictObject({
  testo: z.string().min(1).max(LIMITI.testoPassaggioMax),
  timerSecondi: z.number().int().positive().max(LIMITI.timerMaxSecondi).optional(),
  timerEtichetta: z.string().min(1).max(60).optional(),
});

const ricette = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ricette' }),
  schema: z.strictObject({
    titolo: z.string().min(1).max(LIMITI.titoloMax),
    categoria: z.enum(CATEGORIE),
    porzioni: z.number().int().positive().max(LIMITI.porzioniMax),
    tempoPreparazioneMin: z.number().int().nonnegative().max(1440),
    tempoCotturaMin: z.number().int().nonnegative().max(1440),
    difficolta: z.enum(DIFFICOLTA),
    tags: z.array(z.string().min(1).max(30)).max(12).default([]),
    preferita: z.boolean().default(false),
    data: z.coerce.date(),
    fonte: z.string().max(200).optional(),
    ingredienti: z.array(ingrediente).min(1),
    passaggi: z.array(passaggio).min(1),
  }),
});

export const collections = { ricette };
