import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggiorna,
  aggiungiSecondi,
  avvia,
  azzera,
  creaTimer,
  daSuonare,
  formattaResiduo,
  pausa,
  percentualeCompletata,
  residuoMs,
} from './timer.ts';

const T0 = 1_700_000_000_000;

function timerDiProva(secondi = 600) {
  return creaTimer({ id: 't1', etichetta: 'Cottura', durataSecondi: secondi, ricettaId: 'r1', passaggio: 2 });
}

test('un timer appena creato e inattivo e mostra la durata piena', () => {
  const t = timerDiProva();
  assert.equal(t.stato, 'inattivo');
  assert.equal(residuoMs(t, T0), 600_000);
  assert.equal(formattaResiduo(residuoMs(t, T0)), '10:00');
});

test('il residuo scala col tempo reale mentre e in corso', () => {
  const t = avvia(timerDiProva(), T0);
  assert.equal(t.stato, 'in-corso');
  assert.equal(residuoMs(t, T0 + 60_000), 540_000);
  assert.equal(formattaResiduo(residuoMs(t, T0 + 60_000)), '09:00');
});

test('la pausa congela il residuo e la ripresa riparte da quel punto', () => {
  const avviato = avvia(timerDiProva(), T0);
  const messoInPausa = pausa(avviato, T0 + 100_000);
  assert.equal(messoInPausa.stato, 'in-pausa');
  assert.equal(residuoMs(messoInPausa, T0 + 100_000), 500_000);
  // Dieci minuti di pausa non consumano il timer.
  assert.equal(residuoMs(messoInPausa, T0 + 700_000), 500_000);
  const ripreso = avvia(messoInPausa, T0 + 700_000);
  assert.equal(residuoMs(ripreso, T0 + 700_000 + 60_000), 440_000);
});

test('app in background: al ritorno il residuo e quello vero, non quello dei tick persi', () => {
  const t = avvia(timerDiProva(600), T0);
  // Schermo bloccato per 7 minuti: nessun tick eseguito.
  const alRitorno = aggiorna(t, T0 + 420_000);
  assert.equal(alRitorno.stato, 'in-corso');
  assert.equal(residuoMs(alRitorno, T0 + 420_000), 180_000);
});

test('il timer scade e chiede di suonare una volta sola', () => {
  const t = avvia(timerDiProva(60), T0);
  const scaduto = aggiorna(t, T0 + 61_000);
  assert.equal(scaduto.stato, 'scaduto');
  assert.equal(residuoMs(scaduto, T0 + 61_000), 0);
  assert.equal(daSuonare(scaduto), true);
  assert.equal(daSuonare({ ...scaduto, suonato: true }), false);
});

test('scadenza mentre l app era chiusa: lo stato si aggiorna al rientro', () => {
  const t = avvia(timerDiProva(300), T0);
  const dopoUnGiorno = aggiorna(t, T0 + 86_400_000);
  assert.equal(dopoUnGiorno.stato, 'scaduto');
  assert.equal(residuoMs(dopoUnGiorno, T0 + 86_400_000), 0);
});

test('+1 minuto allunga il residuo, anche a timer scaduto', () => {
  const inCorso = avvia(timerDiProva(120), T0);
  const allungato = aggiungiSecondi(inCorso, 60, T0 + 30_000);
  assert.equal(residuoMs(allungato, T0 + 30_000), 150_000);
  assert.equal(allungato.stato, 'in-corso');

  const scaduto = aggiorna(avvia(timerDiProva(60), T0), T0 + 90_000);
  const riportatoInVita = aggiungiSecondi(scaduto, 60, T0 + 90_000);
  assert.equal(riportatoInVita.stato, 'in-pausa');
  assert.equal(residuoMs(riportatoInVita, T0 + 90_000), 60_000);
});

test('azzera riporta il timer alla durata iniziale e allo stato inattivo', () => {
  const t = pausa(avvia(timerDiProva(600), T0), T0 + 60_000);
  const azzerato = azzera(t);
  assert.equal(azzerato.stato, 'inattivo');
  assert.equal(residuoMs(azzerato, T0 + 60_000), 600_000);
});

test('formattaResiduo usa mm:ss e passa a h:mm:ss oltre l ora', () => {
  assert.equal(formattaResiduo(0), '00:00');
  assert.equal(formattaResiduo(9_000), '00:09');
  assert.equal(formattaResiduo(3_599_000), '59:59');
  assert.equal(formattaResiduo(3_600_000), '1:00:00');
  assert.equal(formattaResiduo(7_265_000), '2:01:05');
  assert.equal(formattaResiduo(-5_000), '00:00');
});

test('la percentuale di avanzamento resta tra 0 e 100', () => {
  const t = avvia(timerDiProva(100), T0);
  assert.equal(percentualeCompletata(t, T0), 0);
  assert.equal(percentualeCompletata(t, T0 + 50_000), 50);
  assert.equal(percentualeCompletata(t, T0 + 500_000), 100);
});

test('avviare un timer gia scaduto lo fa ripartire da capo', () => {
  const scaduto = aggiorna(avvia(timerDiProva(30), T0), T0 + 40_000);
  const ripartito = avvia(scaduto, T0 + 40_000);
  assert.equal(ripartito.stato, 'in-corso');
  assert.equal(residuoMs(ripartito, T0 + 40_000), 30_000);
});
