insert into public.prospect (
  user_id, azienda, dominio, citta, email, url_modulo, stato, punteggio, tornata,
  https, wordpress, php, anni_fermo, peso_mb, peso_dopo_mb, ttfb_ms, caricamento_s
)
select
  utente.id, v.azienda, v.dominio, v.citta, v.email, v.url_modulo, v.stato, v.punteggio, v.tornata,
  v.https, v.wordpress, v.php, v.anni_fermo, v.peso_mb, v.peso_dopo_mb, v.ttfb_ms, v.caricamento_s
from (values
  ('Antichità Giovanna Leonini', 'antichitagiovannaleonini.it', 'Siena', null, 'http://www.antichitagiovannaleonini.it/contatti/', 'da_contattare', 103, 1, false, '5.1.19', 'PHP/5.5.9-1ubuntu4.29+hs3', 11, 2.83, 1.86, 1690, 4.4),
  ('Franci Autocarrozzeria', 'franciautocarrozzeria.it', 'Siena', 'info@franciautocarrozzeria.it', null, 'segnalato', 96, null, true, '7.1.4', null, 6, 2.92, null, 4308, 4.6),
  ('Aresteatro', 'aresteatro.it', 'Siena', 'info@aresteatro.it', null, 'da_contattare', 93, 1, false, null, null, 10, 1.95, null, 1663, 8.8),
  ('La Coperta Ricamata', 'lacopertaricamata.com', 'Siena', 'sugherini@libero.it', null, 'segnalato', 86, null, true, '6.4.14', null, 5, 3.84, null, 2858, 7.2),
  ('LaLut', 'lalut.org', 'Siena', 'info@lalut.org', null, 'segnalato', 86, null, true, '6.0.18', null, 11, 1.45, null, 4538, 4.8),
  ('Nobil Dimora Ancilli', 'nobildimoraancilli.it', 'Siena', 'nobildimoraancilli@gmail.com', null, 'segnalato', 86, null, true, '6.2.14', null, 4, 4.02, null, 7612, 11.1),
  ('System Parrucchieri', 'parrucchieresystem.it', 'Siena', 'salvatore.sangiovanni08@gmail.com', null, 'segnalato', 86, null, true, '7.1.4', null, 6, 4.77, null, 2841, 4),
  ('Ristorante Il Duomo', 'ristoranteilduomo.it', 'Siena', 'info@ristoranteilduomo.it', null, 'da_contattare', 86, 1, true, '4.2.38', 'PHP/5.6.40', 9, 2.65, 1.46, 1920, 4.7),
  ('Premiata Braceria Toscana', 'premiatabraceriatoscana.it', 'Siena', 'info@premiatabraceriatoscana.it', null, 'segnalato', 86, null, true, '6.9.1', null, 1, 2.9, null, 3731, 7.9),
  ('Istituto di Vigilanza V.O.L.P.E.', 'vigilanzavolpe.com', 'Siena', 'info@vigilanzavolpe.com', null, 'segnalato', 86, null, true, '7.1.4', 'PHP/8.1.34, PleskLin', 4, 1.04, null, 2071, 5.5),
  ('Archivio del Gusto', 'archiviodelgusto.it', 'Siena', 'info@archiviodelgusto.it', null, 'da_contattare', 85, 1, false, '4.7.29', null, 10, 4.39, 0.7, 836, 5.4),
  ('AUDIOVISUAL', 'specialevents.audiovisual.it', 'Siena', null, null, 'segnalato', 83, null, true, '5.1.1', null, 6, 5.93, null, 1449, 3.6),
  ('Auto Siena 2.0', 'autosiena2-0.it', 'Siena', null, 'https://www.autosiena2-0.it/contact/', 'da_contattare', 78, 1, true, '5.3.27', 'PHP/7.4.33', 8, 2.07, null, 5024, 4.3),
  ('B&B Pantaneto Palazzo Bulgarini', 'bbpalazzobulgarini.com', 'Siena', 'info@bbpalazzobulgarini.com', null, 'segnalato', 78, null, true, '7.1.4', null, 6, 3.96, null, 2315, 3.4),
  ('Dojo Mukei', 'dojomukeisiena.it', 'Siena', 'info@dojomukeisiena.it', null, 'segnalato', 78, null, true, '7.1.4', null, 8, 8.81, null, 3646, 4.3),
  ('Hotel La Perla', 'hotellaperlasiena.com', 'Siena', 'info@hotellaperlasiena.com', null, 'segnalato', 78, null, true, '6.4.14', null, 5, 1.13, null, 2928, 3.4),
  ('MULTISERVICES SRL Siena', 'multiservicessrl.com', 'Siena', 'info@multiservicessrl.com', null, 'segnalato', 78, null, true, '6.8.12', 'PHP/8.1.35', 6, 2.27, null, 1531, 4.7),
  ('Sushiko', 'sushiko.it', 'Siena', 'info@sushiko.it', null, 'segnalato', 78, null, true, '7.1', null, 3, 2.37, null, 1308, 4.1)
) as v (
  azienda, dominio, citta, email, url_modulo, stato, punteggio, tornata,
  https, wordpress, php, anni_fermo, peso_mb, peso_dopo_mb, ttfb_ms, caricamento_s
)
cross join (select 'INCOLLA-QUI-LO-UID'::uuid as id) as utente
on conflict (user_id, dominio) do nothing;
