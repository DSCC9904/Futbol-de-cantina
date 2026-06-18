/* ═══════════════════════════════════════════════════════════════
   datos.js — Fútbol de Cantina · Mundial 2026
   ESTE ES EL ÚNICO ARCHIVO QUE TIENES QUE ACTUALIZAR.
   Se incluye en index.html y partidos.html automáticamente.
═══════════════════════════════════════════════════════════════ */

/* ── CALENDARIO J1 completo en UTC ────────────────────────────
   COL = UTC-5  |  Para convertir: hora COL + 5h = UTC
─────────────────────────────────────────────────────────────── */
var HORARIO = [
  { id:'MEX-RSA', utc:'2026-06-11T19:00:00Z', localSig:'MEX', localNom:'México',          visitanteSig:'RSA', visitanteNom:'Sudáfrica',      lat:19.3029, lon:-99.1504, estadioId:'cdmx',         grupo:'A', estadio:'Estadio Azteca' },
  { id:'KOR-CZE', utc:'2026-06-12T02:00:00Z', localSig:'KOR', localNom:'Corea del Sur',   visitanteSig:'CZE', visitanteNom:'Rep. Checa',      lat:20.7,    lon:-103.4,   estadioId:'guadalajara',  grupo:'A', estadio:'Estadio Akron' },
  { id:'CAN-BIH', utc:'2026-06-12T19:00:00Z', localSig:'CAN', localNom:'Canadá',          visitanteSig:'BIH', visitanteNom:'Bosnia',          lat:43.6,    lon:-79.4,    estadioId:'toronto',      grupo:'B', estadio:'BMO Field' },
  { id:'USA-PAR', utc:'2026-06-13T01:00:00Z', localSig:'USA', localNom:'Estados Unidos',  visitanteSig:'PAR', visitanteNom:'Paraguay',        lat:33.9,    lon:-118.3,   estadioId:'losangeles',   grupo:'D', estadio:'SoFi Stadium' },
  { id:'QAT-SUI', utc:'2026-06-13T19:00:00Z', localSig:'QAT', localNom:'Catar',           visitanteSig:'SUI', visitanteNom:'Suiza',           lat:37.4,    lon:-122.0,   estadioId:'sanfrancisco', grupo:'B', estadio:"Levi's Stadium" },
  { id:'BRA-MAR', utc:'2026-06-13T22:00:00Z', localSig:'BRA', localNom:'Brasil',          visitanteSig:'MAR', visitanteNom:'Marruecos',       lat:40.8,    lon:-74.1,    estadioId:'nuevayork',    grupo:'C', estadio:'MetLife Stadium' },
  { id:'SCO-HAI', utc:'2026-06-14T01:00:00Z', localSig:'SCO', localNom:'Escocia',         visitanteSig:'HAI', visitanteNom:'Haití',           lat:42.1,    lon:-71.3,    estadioId:'boston',       grupo:'C', estadio:'Gillette Stadium' },
  { id:'AUS-TUR', utc:'2026-06-14T04:00:00Z', localSig:'AUS', localNom:'Australia',       visitanteSig:'TUR', visitanteNom:'Turquía',         lat:49.3,    lon:-123.1,   estadioId:'vancouver',    grupo:'D', estadio:'BC Place' },
  { id:'GER-CUW', utc:'2026-06-14T17:00:00Z', localSig:'GER', localNom:'Alemania',        visitanteSig:'CUW', visitanteNom:'Curazao',         lat:29.7,    lon:-95.4,    estadioId:'houston',      grupo:'E', estadio:'NRG Stadium' },
  { id:'NED-JPN', utc:'2026-06-14T20:00:00Z', localSig:'NED', localNom:'Países Bajos',    visitanteSig:'JPN', visitanteNom:'Japón',           lat:32.7,    lon:-97.1,    estadioId:'dallas',       grupo:'F', estadio:'AT&T Stadium' },
  { id:'CIV-ECU', utc:'2026-06-14T23:00:00Z', localSig:'CIV', localNom:'Costa de Marfil', visitanteSig:'ECU', visitanteNom:'Ecuador',         lat:39.9,    lon:-75.2,    estadioId:'filadelfia',   grupo:'E', estadio:'Lincoln Financial' },
  { id:'SWE-TUN', utc:'2026-06-15T02:00:00Z', localSig:'SWE', localNom:'Suecia',          visitanteSig:'TUN', visitanteNom:'Túnez',           lat:25.7,    lon:-100.3,   estadioId:'monterrey',    grupo:'F', estadio:'Estadio BBVA' },
  { id:'ESP-CPV', utc:'2026-06-15T16:00:00Z', localSig:'ESP', localNom:'España',          visitanteSig:'CPV', visitanteNom:'Cabo Verde',      lat:33.8,    lon:-84.4,    estadioId:'atlanta',      grupo:'H', estadio:'Mercedes-Benz' },
  { id:'BEL-EGY', utc:'2026-06-15T19:00:00Z', localSig:'BEL', localNom:'Bélgica',         visitanteSig:'EGY', visitanteNom:'Egipto',          lat:47.6,    lon:-122.3,   estadioId:'seattle',      grupo:'G', estadio:'Lumen Field' },
  { id:'SAU-URU', utc:'2026-06-15T22:00:00Z', localSig:'SAU', localNom:'Arabia Saudita',  visitanteSig:'URU', visitanteNom:'Uruguay',         lat:25.9,    lon:-80.2,    estadioId:'miami',        grupo:'H', estadio:'Hard Rock Stadium' },
  { id:'IRN-NZL', utc:'2026-06-16T01:00:00Z', localSig:'IRN', localNom:'Irán',            visitanteSig:'NZL', visitanteNom:'Nueva Zelanda',   lat:33.9,    lon:-118.3,   estadioId:'losangeles',   grupo:'G', estadio:'SoFi Stadium' },
  { id:'FRA-SEN', utc:'2026-06-16T19:00:00Z', localSig:'FRA', localNom:'Francia',         visitanteSig:'SEN', visitanteNom:'Senegal',         lat:40.8,    lon:-74.1,    estadioId:'nuevayork',    grupo:'I', estadio:'MetLife Stadium' },
  { id:'IRQ-NOR', utc:'2026-06-16T22:00:00Z', localSig:'IRQ', localNom:'Irak',            visitanteSig:'NOR', visitanteNom:'Noruega',         lat:42.1,    lon:-71.3,    estadioId:'boston',       grupo:'I', estadio:'Gillette Stadium' },
  { id:'ARG-ALG', utc:'2026-06-17T01:00:00Z', localSig:'ARG', localNom:'Argentina',       visitanteSig:'ALG', visitanteNom:'Argelia',         lat:39.0,    lon:-94.5,    estadioId:'kansascity',   grupo:'J', estadio:'Arrowhead' },
  { id:'AUT-JOR', utc:'2026-06-17T04:00:00Z', localSig:'AUT', localNom:'Austria',         visitanteSig:'JOR', visitanteNom:'Jordania',        lat:37.4,    lon:-122.0,   estadioId:'sanfrancisco', grupo:'J', estadio:"Levi's Stadium" },
  { id:'POR-COD', utc:'2026-06-17T17:00:00Z', localSig:'POR', localNom:'Portugal',        visitanteSig:'COD', visitanteNom:'RD Congo',        lat:29.7,    lon:-95.4,    estadioId:'houston',      grupo:'K', estadio:'NRG Stadium' },
  { id:'ENG-CRO', utc:'2026-06-17T20:00:00Z', localSig:'ENG', localNom:'Inglaterra',      visitanteSig:'CRO', visitanteNom:'Croacia',         lat:32.7,    lon:-97.1,    estadioId:'dallas',       grupo:'L', estadio:'AT&T Stadium' },
  { id:'GHA-PAN', utc:'2026-06-17T23:00:00Z', localSig:'GHA', localNom:'Ghana',           visitanteSig:'PAN', visitanteNom:'Panamá',          lat:43.6,    lon:-79.4,    estadioId:'toronto',      grupo:'L', estadio:'BMO Field' },
  { id:'UZB-COL', utc:'2026-06-18T02:00:00Z', localSig:'UZB', localNom:'Uzbekistán',      visitanteSig:'COL', visitanteNom:'Colombia',        lat:19.3029, lon:-99.1504, estadioId:'cdmx',         grupo:'K', estadio:'Estadio Azteca' },

  /* ── JORNADA 2 · 18–23 JUN ── */
  { id:'CZE-RSA', utc:'2026-06-18T16:00:00Z', localSig:'CZE', localNom:'Rep. Checa',      visitanteSig:'RSA', visitanteNom:'Sudáfrica',      lat:33.8,    lon:-84.4,    estadioId:'atlanta',      grupo:'A', estadio:'Mercedes-Benz' },
  { id:'SUI-BIH', utc:'2026-06-18T19:00:00Z', localSig:'SUI', localNom:'Suiza',           visitanteSig:'BIH', visitanteNom:'Bosnia',          lat:33.9,    lon:-118.3,   estadioId:'losangeles',   grupo:'B', estadio:'SoFi Stadium' },
  { id:'CAN-QAT', utc:'2026-06-18T22:00:00Z', localSig:'CAN', localNom:'Canadá',          visitanteSig:'QAT', visitanteNom:'Catar',           lat:49.3,    lon:-123.1,   estadioId:'vancouver',    grupo:'B', estadio:'BC Place' },
  { id:'MEX-KOR', utc:'2026-06-19T01:00:00Z', localSig:'MEX', localNom:'México',          visitanteSig:'KOR', visitanteNom:'Corea del Sur',   lat:20.7,    lon:-103.4,   estadioId:'guadalajara',  grupo:'A', estadio:'Estadio Akron' },
  { id:'USA-AUS', utc:'2026-06-19T19:00:00Z', localSig:'USA', localNom:'Estados Unidos',  visitanteSig:'AUS', visitanteNom:'Australia',       lat:47.6,    lon:-122.3,   estadioId:'seattle',      grupo:'D', estadio:'Lumen Field' },
  { id:'SCO-MAR', utc:'2026-06-19T22:00:00Z', localSig:'SCO', localNom:'Escocia',         visitanteSig:'MAR', visitanteNom:'Marruecos',       lat:42.1,    lon:-71.3,    estadioId:'boston',       grupo:'C', estadio:'Gillette Stadium' },
  { id:'BRA-HAI', utc:'2026-06-20T01:00:00Z', localSig:'BRA', localNom:'Brasil',          visitanteSig:'HAI', visitanteNom:'Haití',           lat:39.9,    lon:-75.2,    estadioId:'filadelfia',   grupo:'C', estadio:'Lincoln Financial' },
  { id:'TUR-PAR', utc:'2026-06-20T04:00:00Z', localSig:'TUR', localNom:'Turquía',         visitanteSig:'PAR', visitanteNom:'Paraguay',        lat:37.4,    lon:-122.0,   estadioId:'sanfrancisco', grupo:'D', estadio:"Levi's Stadium" },
  { id:'NED-SWE', utc:'2026-06-20T19:00:00Z', localSig:'NED', localNom:'Países Bajos',    visitanteSig:'SWE', visitanteNom:'Suecia',          lat:29.7,    lon:-95.4,    estadioId:'houston',      grupo:'F', estadio:'NRG Stadium' },
  { id:'GER-CIV', utc:'2026-06-20T20:00:00Z', localSig:'GER', localNom:'Alemania',        visitanteSig:'CIV', visitanteNom:'Costa de Marfil', lat:43.6,    lon:-79.4,    estadioId:'toronto',      grupo:'E', estadio:'BMO Field' },
  { id:'ECU-CUW', utc:'2026-06-21T00:00:00Z', localSig:'ECU', localNom:'Ecuador',         visitanteSig:'CUW', visitanteNom:'Curazao',         lat:39.0,    lon:-94.5,    estadioId:'kansascity',   grupo:'E', estadio:'Arrowhead' },
  { id:'TUN-JPN', utc:'2026-06-21T04:00:00Z', localSig:'TUN', localNom:'Túnez',           visitanteSig:'JPN', visitanteNom:'Japón',           lat:25.7,    lon:-100.3,   estadioId:'monterrey',    grupo:'F', estadio:'Estadio BBVA' },
  { id:'ESP-SAU', utc:'2026-06-21T16:00:00Z', localSig:'ESP', localNom:'España',          visitanteSig:'SAU', visitanteNom:'Arabia Saudita',  lat:33.8,    lon:-84.4,    estadioId:'atlanta',      grupo:'H', estadio:'Mercedes-Benz' },
  { id:'BEL-IRN', utc:'2026-06-21T19:00:00Z', localSig:'BEL', localNom:'Bélgica',         visitanteSig:'IRN', visitanteNom:'Irán',            lat:33.9,    lon:-118.3,   estadioId:'losangeles',   grupo:'G', estadio:'SoFi Stadium' },
  { id:'URU-CPV', utc:'2026-06-21T22:00:00Z', localSig:'URU', localNom:'Uruguay',         visitanteSig:'CPV', visitanteNom:'Cabo Verde',      lat:25.9,    lon:-80.2,    estadioId:'miami',        grupo:'H', estadio:'Hard Rock Stadium' },
  { id:'NZL-EGY', utc:'2026-06-22T01:00:00Z', localSig:'NZL', localNom:'Nueva Zelanda',   visitanteSig:'EGY', visitanteNom:'Egipto',          lat:49.3,    lon:-123.1,   estadioId:'vancouver',    grupo:'G', estadio:'BC Place' },
  { id:'ARG-AUT', utc:'2026-06-22T17:00:00Z', localSig:'ARG', localNom:'Argentina',       visitanteSig:'AUT', visitanteNom:'Austria',         lat:32.7,    lon:-97.1,    estadioId:'dallas',       grupo:'J', estadio:'AT&T Stadium' },
  { id:'FRA-IRQ', utc:'2026-06-22T21:00:00Z', localSig:'FRA', localNom:'Francia',         visitanteSig:'IRQ', visitanteNom:'Irak',            lat:39.9,    lon:-75.2,    estadioId:'filadelfia',   grupo:'I', estadio:'Lincoln Financial' },
  { id:'NOR-SEN', utc:'2026-06-23T00:00:00Z', localSig:'NOR', localNom:'Noruega',         visitanteSig:'SEN', visitanteNom:'Senegal',         lat:40.8,    lon:-74.1,    estadioId:'nuevayork',    grupo:'I', estadio:'MetLife Stadium' },
  { id:'JOR-ALG', utc:'2026-06-23T03:00:00Z', localSig:'JOR', localNom:'Jordania',        visitanteSig:'ALG', visitanteNom:'Argelia',         lat:37.4,    lon:-122.0,   estadioId:'sanfrancisco', grupo:'J', estadio:"Levi's Stadium" },
  { id:'POR-UZB', utc:'2026-06-23T17:00:00Z', localSig:'POR', localNom:'Portugal',        visitanteSig:'UZB', visitanteNom:'Uzbekistán',      lat:29.7,    lon:-95.4,    estadioId:'houston',      grupo:'K', estadio:'NRG Stadium' },
  { id:'ENG-GHA', utc:'2026-06-23T20:00:00Z', localSig:'ENG', localNom:'Inglaterra',      visitanteSig:'GHA', visitanteNom:'Ghana',           lat:42.1,    lon:-71.3,    estadioId:'boston',       grupo:'L', estadio:'Gillette Stadium' },
  { id:'PAN-CRO', utc:'2026-06-23T23:00:00Z', localSig:'PAN', localNom:'Panamá',          visitanteSig:'CRO', visitanteNom:'Croacia',         lat:43.6,    lon:-79.4,    estadioId:'toronto',      grupo:'L', estadio:'BMO Field' },
  { id:'COL-COD', utc:'2026-06-24T02:00:00Z', localSig:'COL', localNom:'Colombia',        visitanteSig:'COD', visitanteNom:'RD Congo',        lat:20.7,    lon:-103.4,   estadioId:'guadalajara',  grupo:'K', estadio:'Estadio Akron' },

  /* ── JORNADA 3 · 24–27 JUN (simultáneos) ── */
  { id:'SUI-CAN', utc:'2026-06-24T19:00:00Z', localSig:'SUI', localNom:'Suiza',           visitanteSig:'CAN', visitanteNom:'Canadá',          lat:49.3,    lon:-123.1,   estadioId:'vancouver',    grupo:'B', estadio:'BC Place' },
  { id:'BIH-QAT', utc:'2026-06-24T19:00:00Z', localSig:'BIH', localNom:'Bosnia',          visitanteSig:'QAT', visitanteNom:'Catar',           lat:47.6,    lon:-122.3,   estadioId:'seattle',      grupo:'B', estadio:'Lumen Field' },
  { id:'SCO-BRA', utc:'2026-06-24T22:00:00Z', localSig:'SCO', localNom:'Escocia',         visitanteSig:'BRA', visitanteNom:'Brasil',          lat:25.9,    lon:-80.2,    estadioId:'miami',        grupo:'C', estadio:'Hard Rock Stadium' },
  { id:'MAR-HAI', utc:'2026-06-24T22:00:00Z', localSig:'MAR', localNom:'Marruecos',       visitanteSig:'HAI', visitanteNom:'Haití',           lat:33.8,    lon:-84.4,    estadioId:'atlanta',      grupo:'C', estadio:'Mercedes-Benz' },
  { id:'CZE-MEX', utc:'2026-06-25T01:00:00Z', localSig:'CZE', localNom:'Rep. Checa',      visitanteSig:'MEX', visitanteNom:'México',          lat:19.3029, lon:-99.1504, estadioId:'cdmx',         grupo:'A', estadio:'Estadio Azteca' },
  { id:'RSA-KOR', utc:'2026-06-25T01:00:00Z', localSig:'RSA', localNom:'Sudáfrica',       visitanteSig:'KOR', visitanteNom:'Corea del Sur',   lat:25.7,    lon:-100.3,   estadioId:'monterrey',    grupo:'A', estadio:'Estadio BBVA' },
  { id:'CUW-CIV', utc:'2026-06-25T20:00:00Z', localSig:'CUW', localNom:'Curazao',         visitanteSig:'CIV', visitanteNom:'Costa de Marfil', lat:39.9,    lon:-75.2,    estadioId:'filadelfia',   grupo:'E', estadio:'Lincoln Financial' },
  { id:'ECU-GER', utc:'2026-06-25T20:00:00Z', localSig:'ECU', localNom:'Ecuador',         visitanteSig:'GER', visitanteNom:'Alemania',        lat:40.8,    lon:-74.1,    estadioId:'nuevayork',    grupo:'E', estadio:'MetLife Stadium' },
  { id:'JPN-SWE', utc:'2026-06-25T23:00:00Z', localSig:'JPN', localNom:'Japón',           visitanteSig:'SWE', visitanteNom:'Suecia',          lat:32.7,    lon:-97.1,    estadioId:'dallas',       grupo:'F', estadio:'AT&T Stadium' },
  { id:'TUN-NED', utc:'2026-06-25T23:00:00Z', localSig:'TUN', localNom:'Túnez',           visitanteSig:'NED', visitanteNom:'Países Bajos',    lat:39.0,    lon:-94.5,    estadioId:'kansascity',   grupo:'F', estadio:'Arrowhead' },
  { id:'TUR-USA', utc:'2026-06-26T02:00:00Z', localSig:'TUR', localNom:'Turquía',         visitanteSig:'USA', visitanteNom:'Estados Unidos',  lat:33.9,    lon:-118.3,   estadioId:'losangeles',   grupo:'D', estadio:'SoFi Stadium' },
  { id:'PAR-AUS', utc:'2026-06-26T02:00:00Z', localSig:'PAR', localNom:'Paraguay',        visitanteSig:'AUS', visitanteNom:'Australia',       lat:37.4,    lon:-122.0,   estadioId:'sanfrancisco', grupo:'D', estadio:"Levi's Stadium" },
  { id:'NOR-FRA', utc:'2026-06-26T19:00:00Z', localSig:'NOR', localNom:'Noruega',         visitanteSig:'FRA', visitanteNom:'Francia',         lat:42.1,    lon:-71.3,    estadioId:'boston',       grupo:'I', estadio:'Gillette Stadium' },
  { id:'SEN-IRQ', utc:'2026-06-26T19:00:00Z', localSig:'SEN', localNom:'Senegal',         visitanteSig:'IRQ', visitanteNom:'Irak',            lat:43.6,    lon:-79.4,    estadioId:'toronto',      grupo:'I', estadio:'BMO Field' },
  { id:'CPV-SAU', utc:'2026-06-27T00:00:00Z', localSig:'CPV', localNom:'Cabo Verde',      visitanteSig:'SAU', visitanteNom:'Arabia Saudita',  lat:29.7,    lon:-95.4,    estadioId:'houston',      grupo:'H', estadio:'NRG Stadium' },
  { id:'URU-ESP', utc:'2026-06-27T00:00:00Z', localSig:'URU', localNom:'Uruguay',         visitanteSig:'ESP', visitanteNom:'España',          lat:20.7,    lon:-103.4,   estadioId:'guadalajara',  grupo:'H', estadio:'Estadio Akron' },
  { id:'EGY-IRN', utc:'2026-06-27T03:00:00Z', localSig:'EGY', localNom:'Egipto',          visitanteSig:'IRN', visitanteNom:'Irán',            lat:47.6,    lon:-122.3,   estadioId:'seattle',      grupo:'G', estadio:'Lumen Field' },
  { id:'NZL-BEL', utc:'2026-06-27T03:00:00Z', localSig:'NZL', localNom:'Nueva Zelanda',   visitanteSig:'BEL', visitanteNom:'Bélgica',         lat:49.3,    lon:-123.1,   estadioId:'vancouver',    grupo:'G', estadio:'BC Place' },
  { id:'PAN-ENG', utc:'2026-06-27T21:00:00Z', localSig:'PAN', localNom:'Panamá',          visitanteSig:'ENG', visitanteNom:'Inglaterra',      lat:40.8,    lon:-74.1,    estadioId:'nuevayork',    grupo:'L', estadio:'MetLife Stadium' },
  { id:'CRO-GHA', utc:'2026-06-27T21:00:00Z', localSig:'CRO', localNom:'Croacia',         visitanteSig:'GHA', visitanteNom:'Ghana',           lat:39.9,    lon:-75.2,    estadioId:'filadelfia',   grupo:'L', estadio:'Lincoln Financial' },
  { id:'ARG-JOR', utc:'2026-06-28T02:00:00Z', localSig:'ARG', localNom:'Argentina',       visitanteSig:'JOR', visitanteNom:'Jordania',        lat:32.7,    lon:-97.1,    estadioId:'dallas',       grupo:'J', estadio:'AT&T Stadium' },
  { id:'ALG-AUT', utc:'2026-06-28T02:00:00Z', localSig:'ALG', localNom:'Argelia',         visitanteSig:'AUT', visitanteNom:'Austria',         lat:39.0,    lon:-94.5,    estadioId:'kansascity',   grupo:'J', estadio:'Arrowhead' },
  { id:'COD-UZB', utc:'2026-06-28T00:00:00Z', localSig:'COD', localNom:'RD Congo',        visitanteSig:'UZB', visitanteNom:'Uzbekistán',      lat:33.8,    lon:-84.4,    estadioId:'atlanta',      grupo:'K', estadio:'Mercedes-Benz' },
  { id:'COL-POR', utc:'2026-06-27T23:30:00Z', localSig:'COL', localNom:'Colombia',        visitanteSig:'POR', visitanteNom:'Portugal',        lat:25.9,    lon:-80.2,    estadioId:'miami',        grupo:'K', estadio:'Hard Rock Stadium' }
];

/* ── RESULTADOS CON ESTADÍSTICAS ──────────────────────────────
   Agregar aquí después de cada partido.
   rojas/amarillas: cuántas tuvo cada equipo (local / visitante)
─────────────────────────────────────────────────────────────── */
var RESULTADOS_PARTIDOS = {
  'MEX-RSA': {
    jugado: true,
    golesLocal: 2, golesVisitante: 0,
    stats: {
      posesion:  { local: '62%', visitante: '38%' },
      tiros:     { local: 8,     visitante: 3     },
      corners:   { local: 6,     visitante: 2     },
      amarillas: { local: 1,     visitante: 3     },
      rojas:     { local: 0,     visitante: 2     },
      faltas:    { local: 9,     visitante: 14    },
      xg:        { local: '2.4', visitante: '0.3' }
    }
  }
  /* Agrega así el próximo resultado:
  ,'KOR-CZE': {
    jugado: true,
    golesLocal: X, golesVisitante: X,
    stats: { posesion:{local:'',visitante:''}, tiros:{local:0,visitante:0}, ... }
  } */
};

/* ── TABLA DE POSICIONES ──────────────────────────────────────
   Actualiza pj/pg/pe/pp/gf/gc/pts después de cada partido
─────────────────────────────────────────────────────────────── */
var CLASIFICACION = {
  A: [
    { sig:'MEX', nom:'México',        pj:1, pg:1, pe:0, pp:0, gf:2, gc:0, pts:3 },
    { sig:'RSA', nom:'Sudáfrica',     pj:1, pg:0, pe:0, pp:1, gf:0, gc:2, pts:0 },
    { sig:'KOR', nom:'Corea del Sur', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'CZE', nom:'Rep. Checa',    pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  B: [
    { sig:'CAN', nom:'Canadá', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'BIH', nom:'Bosnia', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'QAT', nom:'Catar',  pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'SUI', nom:'Suiza',  pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  C: [
    { sig:'BRA', nom:'Brasil',    pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'MAR', nom:'Marruecos', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'SCO', nom:'Escocia',   pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'HAI', nom:'Haití',     pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  D: [
    { sig:'USA', nom:'Estados Unidos', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'PAR', nom:'Paraguay',       pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'AUS', nom:'Australia',      pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'TUR', nom:'Turquía',        pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  E: [
    { sig:'GER', nom:'Alemania',        pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'CIV', nom:'Costa de Marfil', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'CUW', nom:'Curazao',         pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'ECU', nom:'Ecuador',         pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  F: [
    { sig:'NED', nom:'Países Bajos', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'JPN', nom:'Japón',        pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'SWE', nom:'Suecia',       pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'TUN', nom:'Túnez',        pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  G: [
    { sig:'BEL', nom:'Bélgica',       pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'EGY', nom:'Egipto',        pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'IRN', nom:'Irán',          pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'NZL', nom:'Nueva Zelanda', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  H: [
    { sig:'ESP', nom:'España',        pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'CPV', nom:'Cabo Verde',    pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'SAU', nom:'Arabia Saudita',pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'URU', nom:'Uruguay',       pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  I: [
    { sig:'FRA', nom:'Francia', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'SEN', nom:'Senegal', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'IRQ', nom:'Irak',    pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'NOR', nom:'Noruega', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  J: [
    { sig:'ARG', nom:'Argentina', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'ALG', nom:'Argelia',   pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'AUT', nom:'Austria',   pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'JOR', nom:'Jordania',  pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  K: [
    { sig:'POR', nom:'Portugal',     pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'COD', nom:'RD Congo',     pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'UZB', nom:'Uzbekistán',   pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'COL', nom:'Colombia 🇨🇴', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ],
  L: [
    { sig:'ENG', nom:'Inglaterra', pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'CRO', nom:'Croacia',    pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'GHA', nom:'Ghana',      pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 },
    { sig:'PAN', nom:'Panamá',     pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }
  ]
};

/* ── LÓGICA COMPARTIDA ────────────────────────────────────────
   Detecta qué partido mostrar según la hora actual.
   Muestra el partido activo o el próximo.
   2 horas después del pitazo final → pasa al siguiente.
─────────────────────────────────────────────────────────────── */
var DURACION_MS   = 115 * 60 * 1000;  /* 115 min estimados */
var POST_MATCH_MS =  30 * 60 * 1000; /* 30 min post partido → rota al siguiente */

function detectarPartido() {
  var ahora = Date.now();
  var actual = null, proximo = null;

  for (var i = 0; i < HORARIO.length; i++) {
    var p = HORARIO[i];
    var inicio = new Date(p.utc).getTime();
    var ventana = inicio + DURACION_MS + POST_MATCH_MS;

    if (ahora >= inicio && ahora <= ventana) { actual = p; break; }
    if (inicio > ahora && !proximo) proximo = p;
  }
  return { actual: actual, proximo: proximo };
}
