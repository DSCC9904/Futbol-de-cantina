/* ═══════════════════════════════════════════════════════════════
   sync.js — Fútbol de Cantina · Motor estadístico
   ───────────────────────────────────────────────────────────────
   MODELO: Poisson independiente con priors bayesianos
   ───────────────────────────────────────────────────────────────
   Método estándar en la industria de apuestas deportivas:
   1. Calculamos λ (goles esperados) para cada equipo en el partido
   2. Asumimos independencia entre los goles de cada equipo
   3. Usamos distribución de Poisson para obtener P(X=k) para k=0..8
   4. Combinamos las distribuciones para obtener P(local gana),
      P(empate), P(visitante gana), P(over 2.5), P(BTTS), etc.

   Para equipos con pocos partidos jugados en el torneo usamos
   priors basados en el ranking FIFA (enfoque bayesiano: partimos
   de una estimación razonable y la vamos actualizando con datos).
═══════════════════════════════════════════════════════════════ */

const fs    = require('fs');
const https = require('https');

/* ── Mapeo abreviaturas ESPN → nuestras siglas ───────────────── */
const EQUIPOS = {
  'MEX':'MEX','RSA':'RSA','KOR':'KOR','CZE':'CZE',
  'CAN':'CAN','BIH':'BIH','QAT':'QAT','SUI':'SUI',
  'BRA':'BRA','MAR':'MAR','SCO':'SCO','HAI':'HAI',
  'USA':'USA','PAR':'PAR','AUS':'AUS','TUR':'TUR',
  'GER':'GER','CIV':'CIV','CUW':'CUW','ECU':'ECU',
  'NED':'NED','JPN':'JPN','SWE':'SWE','TUN':'TUN',
  'BEL':'BEL','EGY':'EGY','IRN':'IRN','NZL':'NZL',
  'ESP':'ESP','CPV':'CPV','SAU':'SAU','URU':'URU',
  'FRA':'FRA','SEN':'SEN','IRQ':'IRQ','NOR':'NOR',
  'ARG':'ARG','ALG':'ALG','AUT':'AUT','JOR':'JOR',
  'POR':'POR','COD':'COD','UZB':'UZB','COL':'COL',
  'ENG':'ENG','CRO':'CRO','GHA':'GHA','PAN':'PAN',
  'MX':'MEX','SA':'RSA','SK':'KOR','SOA':'RSA','KVX':'CUW'
};

const GRUPOS = {
  MEX:'A',RSA:'A',KOR:'A',CZE:'A',
  CAN:'B',BIH:'B',QAT:'B',SUI:'B',
  BRA:'C',MAR:'C',SCO:'C',HAI:'C',
  USA:'D',PAR:'D',AUS:'D',TUR:'D',
  GER:'E',CIV:'E',CUW:'E',ECU:'E',
  NED:'F',JPN:'F',SWE:'F',TUN:'F',
  BEL:'G',EGY:'G',IRN:'G',NZL:'G',
  ESP:'H',CPV:'H',SAU:'H',URU:'H',
  FRA:'I',SEN:'I',IRQ:'I',NOR:'I',
  ARG:'J',ALG:'J',AUT:'J',JOR:'J',
  POR:'K',COD:'K',UZB:'K',COL:'K',
  ENG:'L',CRO:'L',GHA:'L',PAN:'L'
};

/* ── CALENDARIO FASE DE GRUPOS (J1–J3, fechas UTC) ──────────── */
const HORARIO = [
  /* ── J1 ── */
  { id:'MEX-RSA', utc:'2026-06-11T19:00:00Z', localSig:'MEX', visitanteSig:'RSA', localNom:'México',          visitanteNom:'Sudáfrica',     grupo:'A' },
  { id:'KOR-CZE', utc:'2026-06-12T02:00:00Z', localSig:'KOR', visitanteSig:'CZE', localNom:'Corea del Sur',   visitanteNom:'Rep. Checa',    grupo:'A' },
  { id:'CAN-BIH', utc:'2026-06-12T19:00:00Z', localSig:'CAN', visitanteSig:'BIH', localNom:'Canadá',          visitanteNom:'Bosnia',        grupo:'B' },
  { id:'USA-PAR', utc:'2026-06-13T01:00:00Z', localSig:'USA', visitanteSig:'PAR', localNom:'EE.UU.',           visitanteNom:'Paraguay',      grupo:'D' },
  { id:'QAT-SUI', utc:'2026-06-13T19:00:00Z', localSig:'QAT', visitanteSig:'SUI', localNom:'Catar',            visitanteNom:'Suiza',         grupo:'B' },
  { id:'BRA-MAR', utc:'2026-06-13T22:00:00Z', localSig:'BRA', visitanteSig:'MAR', localNom:'Brasil',           visitanteNom:'Marruecos',     grupo:'C' },
  { id:'SCO-HAI', utc:'2026-06-14T01:00:00Z', localSig:'SCO', visitanteSig:'HAI', localNom:'Escocia',          visitanteNom:'Haití',         grupo:'C' },
  { id:'AUS-TUR', utc:'2026-06-14T04:00:00Z', localSig:'AUS', visitanteSig:'TUR', localNom:'Australia',        visitanteNom:'Turquía',       grupo:'D' },
  { id:'GER-CUW', utc:'2026-06-14T17:00:00Z', localSig:'GER', visitanteSig:'CUW', localNom:'Alemania',         visitanteNom:'Curazao',       grupo:'E' },
  { id:'NED-JPN', utc:'2026-06-14T20:00:00Z', localSig:'NED', visitanteSig:'JPN', localNom:'Países Bajos',     visitanteNom:'Japón',         grupo:'F' },
  { id:'CIV-ECU', utc:'2026-06-14T23:00:00Z', localSig:'CIV', visitanteSig:'ECU', localNom:'Costa de Marfil',  visitanteNom:'Ecuador',       grupo:'E' },
  { id:'SWE-TUN', utc:'2026-06-15T02:00:00Z', localSig:'SWE', visitanteSig:'TUN', localNom:'Suecia',           visitanteNom:'Túnez',         grupo:'F' },
  { id:'ESP-CPV', utc:'2026-06-15T16:00:00Z', localSig:'ESP', visitanteSig:'CPV', localNom:'España',           visitanteNom:'Cabo Verde',    grupo:'H' },
  { id:'BEL-EGY', utc:'2026-06-15T19:00:00Z', localSig:'BEL', visitanteSig:'EGY', localNom:'Bélgica',          visitanteNom:'Egipto',        grupo:'G' },
  { id:'SAU-URU', utc:'2026-06-15T22:00:00Z', localSig:'SAU', visitanteSig:'URU', localNom:'Arabia Saudita',   visitanteNom:'Uruguay',       grupo:'H' },
  { id:'IRN-NZL', utc:'2026-06-16T01:00:00Z', localSig:'IRN', visitanteSig:'NZL', localNom:'Irán',             visitanteNom:'Nueva Zelanda', grupo:'G' },
  { id:'FRA-SEN', utc:'2026-06-16T19:00:00Z', localSig:'FRA', visitanteSig:'SEN', localNom:'Francia',          visitanteNom:'Senegal',       grupo:'I' },
  { id:'IRQ-NOR', utc:'2026-06-16T22:00:00Z', localSig:'IRQ', visitanteSig:'NOR', localNom:'Irak',             visitanteNom:'Noruega',       grupo:'I' },
  { id:'ARG-ALG', utc:'2026-06-17T01:00:00Z', localSig:'ARG', visitanteSig:'ALG', localNom:'Argentina',        visitanteNom:'Argelia',       grupo:'J' },
  { id:'AUT-JOR', utc:'2026-06-17T04:00:00Z', localSig:'AUT', visitanteSig:'JOR', localNom:'Austria',          visitanteNom:'Jordania',      grupo:'J' },
  { id:'POR-COD', utc:'2026-06-17T16:00:00Z', localSig:'POR', visitanteSig:'COD', localNom:'Portugal',         visitanteNom:'R.D.Congo',     grupo:'K' },
  { id:'COL-UZB', utc:'2026-06-17T19:00:00Z', localSig:'COL', visitanteSig:'UZB', localNom:'Colombia',         visitanteNom:'Uzbekistán',    grupo:'K' },
  { id:'ENG-GHA', utc:'2026-06-17T22:00:00Z', localSig:'ENG', visitanteSig:'GHA', localNom:'Inglaterra',       visitanteNom:'Ghana',         grupo:'L' },
  { id:'CRO-PAN', utc:'2026-06-18T01:00:00Z', localSig:'CRO', visitanteSig:'PAN', localNom:'Croacia',          visitanteNom:'Panamá',        grupo:'L' },
  /* ── J2 ── */
  { id:'CZE-RSA', utc:'2026-06-18T16:00:00Z', localSig:'CZE', visitanteSig:'RSA', localNom:'Rep. Checa',       visitanteNom:'Sudáfrica',     grupo:'A' },
  { id:'SUI-BIH', utc:'2026-06-18T19:00:00Z', localSig:'SUI', visitanteSig:'BIH', localNom:'Suiza',            visitanteNom:'Bosnia',        grupo:'B' },
  { id:'CAN-QAT', utc:'2026-06-18T22:00:00Z', localSig:'CAN', visitanteSig:'QAT', localNom:'Canadá',           visitanteNom:'Catar',         grupo:'B' },
  { id:'MEX-KOR', utc:'2026-06-19T01:00:00Z', localSig:'MEX', visitanteSig:'KOR', localNom:'México',           visitanteNom:'Corea del Sur', grupo:'A' },
  { id:'USA-AUS', utc:'2026-06-19T19:00:00Z', localSig:'USA', visitanteSig:'AUS', localNom:'EE.UU.',            visitanteNom:'Australia',     grupo:'D' },
  { id:'SCO-MAR', utc:'2026-06-19T22:00:00Z', localSig:'SCO', visitanteSig:'MAR', localNom:'Escocia',          visitanteNom:'Marruecos',     grupo:'C' },
  { id:'BRA-HAI', utc:'2026-06-20T01:00:00Z', localSig:'BRA', visitanteSig:'HAI', localNom:'Brasil',           visitanteNom:'Haití',         grupo:'C' },
  { id:'TUR-PAR', utc:'2026-06-20T04:00:00Z', localSig:'TUR', visitanteSig:'PAR', localNom:'Turquía',          visitanteNom:'Paraguay',      grupo:'D' },
  { id:'NED-SWE', utc:'2026-06-20T19:00:00Z', localSig:'NED', visitanteSig:'SWE', localNom:'Países Bajos',     visitanteNom:'Suecia',        grupo:'F' },
  { id:'GER-CIV', utc:'2026-06-20T20:00:00Z', localSig:'GER', visitanteSig:'CIV', localNom:'Alemania',         visitanteNom:'Costa de Marfil',grupo:'E' },
  { id:'ECU-CUW', utc:'2026-06-21T00:00:00Z', localSig:'ECU', visitanteSig:'CUW', localNom:'Ecuador',          visitanteNom:'Curazao',       grupo:'E' },
  { id:'TUN-JPN', utc:'2026-06-21T04:00:00Z', localSig:'TUN', visitanteSig:'JPN', localNom:'Túnez',            visitanteNom:'Japón',         grupo:'F' },
  { id:'ESP-SAU', utc:'2026-06-21T16:00:00Z', localSig:'ESP', visitanteSig:'SAU', localNom:'España',           visitanteNom:'Arabia Saudita',grupo:'H' },
  { id:'BEL-IRN', utc:'2026-06-21T19:00:00Z', localSig:'BEL', visitanteSig:'IRN', localNom:'Bélgica',          visitanteNom:'Irán',          grupo:'G' },
  { id:'URU-CPV', utc:'2026-06-21T22:00:00Z', localSig:'URU', visitanteSig:'CPV', localNom:'Uruguay',          visitanteNom:'Cabo Verde',    grupo:'H' },
  { id:'NZL-EGY', utc:'2026-06-22T01:00:00Z', localSig:'NZL', visitanteSig:'EGY', localNom:'Nueva Zelanda',    visitanteNom:'Egipto',        grupo:'G' },
  { id:'ARG-AUT', utc:'2026-06-22T17:00:00Z', localSig:'ARG', visitanteSig:'AUT', localNom:'Argentina',        visitanteNom:'Austria',       grupo:'J' },
  { id:'FRA-IRQ', utc:'2026-06-22T21:00:00Z', localSig:'FRA', visitanteSig:'IRQ', localNom:'Francia',          visitanteNom:'Irak',          grupo:'I' },
  { id:'NOR-SEN', utc:'2026-06-23T00:00:00Z', localSig:'NOR', visitanteSig:'SEN', localNom:'Noruega',          visitanteNom:'Senegal',       grupo:'I' },
  { id:'JOR-ALG', utc:'2026-06-23T03:00:00Z', localSig:'JOR', visitanteSig:'ALG', localNom:'Jordania',         visitanteNom:'Argelia',       grupo:'J' },
  { id:'POR-UZB', utc:'2026-06-23T17:00:00Z', localSig:'POR', visitanteSig:'UZB', localNom:'Portugal',         visitanteNom:'Uzbekistán',    grupo:'K' },
  { id:'ENG-GHA', utc:'2026-06-23T20:00:00Z', localSig:'ENG', visitanteSig:'GHA', localNom:'Inglaterra',       visitanteNom:'Ghana',         grupo:'L' },
  { id:'PAN-CRO', utc:'2026-06-23T23:00:00Z', localSig:'PAN', visitanteSig:'CRO', localNom:'Panamá',           visitanteNom:'Croacia',       grupo:'L' },
  { id:'COL-COD', utc:'2026-06-24T02:00:00Z', localSig:'COL', visitanteSig:'COD', localNom:'Colombia',         visitanteNom:'RD Congo',      grupo:'K' },
  /* ── J3 (simultáneos) ── */
  { id:'SUI-CAN', utc:'2026-06-24T19:00:00Z', localSig:'SUI', visitanteSig:'CAN', localNom:'Suiza',            visitanteNom:'Canadá',        grupo:'B' },
  { id:'BIH-QAT', utc:'2026-06-24T19:00:00Z', localSig:'BIH', visitanteSig:'QAT', localNom:'Bosnia',           visitanteNom:'Catar',         grupo:'B' },
  { id:'SCO-BRA', utc:'2026-06-24T22:00:00Z', localSig:'SCO', visitanteSig:'BRA', localNom:'Escocia',          visitanteNom:'Brasil',        grupo:'C' },
  { id:'MAR-HAI', utc:'2026-06-24T22:00:00Z', localSig:'MAR', visitanteSig:'HAI', localNom:'Marruecos',        visitanteNom:'Haití',         grupo:'C' },
  { id:'CZE-MEX', utc:'2026-06-25T01:00:00Z', localSig:'CZE', visitanteSig:'MEX', localNom:'Rep. Checa',       visitanteNom:'México',        grupo:'A' },
  { id:'RSA-KOR', utc:'2026-06-25T01:00:00Z', localSig:'RSA', visitanteSig:'KOR', localNom:'Sudáfrica',        visitanteNom:'Corea del Sur', grupo:'A' },
  { id:'CUW-CIV', utc:'2026-06-25T20:00:00Z', localSig:'CUW', visitanteSig:'CIV', localNom:'Curazao',          visitanteNom:'Costa de Marfil',grupo:'E' },
  { id:'ECU-GER', utc:'2026-06-25T20:00:00Z', localSig:'ECU', visitanteSig:'GER', localNom:'Ecuador',          visitanteNom:'Alemania',      grupo:'E' },
  { id:'JPN-SWE', utc:'2026-06-25T23:00:00Z', localSig:'JPN', visitanteSig:'SWE', localNom:'Japón',            visitanteNom:'Suecia',        grupo:'F' },
  { id:'TUN-NED', utc:'2026-06-25T23:00:00Z', localSig:'TUN', visitanteSig:'NED', localNom:'Túnez',            visitanteNom:'Países Bajos',  grupo:'F' },
  { id:'TUR-USA', utc:'2026-06-26T02:00:00Z', localSig:'TUR', visitanteSig:'USA', localNom:'Turquía',          visitanteNom:'EE.UU.',        grupo:'D' },
  { id:'PAR-AUS', utc:'2026-06-26T02:00:00Z', localSig:'PAR', visitanteSig:'AUS', localNom:'Paraguay',         visitanteNom:'Australia',     grupo:'D' },
  { id:'NOR-FRA', utc:'2026-06-26T19:00:00Z', localSig:'NOR', visitanteSig:'FRA', localNom:'Noruega',          visitanteNom:'Francia',       grupo:'I' },
  { id:'SEN-IRQ', utc:'2026-06-26T19:00:00Z', localSig:'SEN', visitanteSig:'IRQ', localNom:'Senegal',          visitanteNom:'Irak',          grupo:'I' },
  { id:'CPV-SAU', utc:'2026-06-27T00:00:00Z', localSig:'CPV', visitanteSig:'SAU', localNom:'Cabo Verde',       visitanteNom:'Arabia Saudita',grupo:'H' },
  { id:'URU-ESP', utc:'2026-06-27T00:00:00Z', localSig:'URU', visitanteSig:'ESP', localNom:'Uruguay',          visitanteNom:'España',        grupo:'H' },
  { id:'EGY-IRN', utc:'2026-06-27T03:00:00Z', localSig:'EGY', visitanteSig:'IRN', localNom:'Egipto',           visitanteNom:'Irán',          grupo:'G' },
  { id:'NZL-BEL', utc:'2026-06-27T03:00:00Z', localSig:'NZL', visitanteSig:'BEL', localNom:'Nueva Zelanda',    visitanteNom:'Bélgica',       grupo:'G' },
  { id:'PAN-ENG', utc:'2026-06-27T21:00:00Z', localSig:'PAN', visitanteSig:'ENG', localNom:'Panamá',           visitanteNom:'Inglaterra',    grupo:'L' },
  { id:'CRO-GHA', utc:'2026-06-27T21:00:00Z', localSig:'CRO', visitanteSig:'GHA', localNom:'Croacia',          visitanteNom:'Ghana',         grupo:'L' },
  { id:'ARG-JOR', utc:'2026-06-28T02:00:00Z', localSig:'ARG', visitanteSig:'JOR', localNom:'Argentina',        visitanteNom:'Jordania',      grupo:'J' },
  { id:'ALG-AUT', utc:'2026-06-28T02:00:00Z', localSig:'ALG', visitanteSig:'AUT', localNom:'Argelia',          visitanteNom:'Austria',       grupo:'J' },
  { id:'COD-UZB', utc:'2026-06-28T00:00:00Z', localSig:'COD', visitanteSig:'UZB', localNom:'RD Congo',         visitanteNom:'Uzbekistán',    grupo:'K' },
  { id:'COL-POR', utc:'2026-06-27T23:30:00Z', localSig:'COL', visitanteSig:'POR', localNom:'Colombia',         visitanteNom:'Portugal',      grupo:'K' }
];

/* ═══════════════════════════════════════════════════════════════
   PRIORS BAYESIANOS — Ratings de ataque y defensa pre-torneo
   ───────────────────────────────────────────────────────────────
   Escala: goles por partido ajustados al promedio del Mundial
   (Media mundial ≈ 2.75 goles/partido histórico → ~1.375 por equipo)
   att > 1 = mejor atacante que el promedio
   def < 1 = mejor defensa que el promedio (concede menos)
   ───────────────────────────────────────────────────────────────
   Fuente: rendimiento en Clasificatorias 2026 + Copas recientes
   + Ranking FIFA jun-2026 (ajustado por estadístico)
═══════════════════════════════════════════════════════════════ */
const PRIORS = {
  /* Grupo A */  MEX:{att:1.55,def:1.10}, RSA:{att:0.90,def:1.35}, KOR:{att:1.25,def:1.05}, CZE:{att:1.20,def:1.00},
  /* Grupo B */  CAN:{att:1.30,def:1.10}, BIH:{att:1.05,def:1.20}, QAT:{att:0.75,def:1.45}, SUI:{att:1.35,def:0.90},
  /* Grupo C */  BRA:{att:1.80,def:0.75}, MAR:{att:1.20,def:0.85}, SCO:{att:1.15,def:1.05}, HAI:{att:0.70,def:1.50},
  /* Grupo D */  USA:{att:1.40,def:1.00}, PAR:{att:1.10,def:1.15}, AUS:{att:1.10,def:1.10}, TUR:{att:1.25,def:1.05},
  /* Grupo E */  GER:{att:1.75,def:0.85}, CIV:{att:1.20,def:1.10}, CUW:{att:0.60,def:1.60}, ECU:{att:1.20,def:1.10},
  /* Grupo F */  NED:{att:1.65,def:0.85}, JPN:{att:1.30,def:0.90}, SWE:{att:1.30,def:1.00}, TUN:{att:1.00,def:1.15},
  /* Grupo G */  BEL:{att:1.60,def:0.90}, EGY:{att:1.05,def:1.10}, IRN:{att:0.95,def:1.05}, NZL:{att:0.90,def:1.20},
  /* Grupo H */  ESP:{att:1.75,def:0.80}, CPV:{att:0.85,def:1.25}, SAU:{att:1.00,def:1.20}, URU:{att:1.40,def:0.95},
  /* Grupo I */  FRA:{att:1.80,def:0.75}, SEN:{att:1.25,def:1.00}, IRQ:{att:0.95,def:1.25}, NOR:{att:1.45,def:0.95},
  /* Grupo J */  ARG:{att:1.90,def:0.70}, ALG:{att:1.05,def:1.15}, AUT:{att:1.40,def:0.95}, JOR:{att:0.80,def:1.40},
  /* Grupo K */  POR:{att:1.75,def:0.80}, COD:{att:1.10,def:1.20}, UZB:{att:0.85,def:1.30}, COL:{att:1.45,def:0.95},
  /* Grupo L */  ENG:{att:1.70,def:0.80}, CRO:{att:1.30,def:0.95}, GHA:{att:1.05,def:1.20}, PAN:{att:0.80,def:1.35}
};

/* Promedio Mundial histórico goles/partido */
const MU = 1.38;

/* Peso del prior (equivale a 4 partidos de referencia) */
const PRIOR_WEIGHT = 4;

/* ═══════════════════════════════════════════════════════════════
   MOTOR ESTADÍSTICO — Distribución de Poisson
═══════════════════════════════════════════════════════════════ */

function factorial(n) {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function poisson(lambda, k) {
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

/* Matriz de probabilidades de resultado: P(local=i, visitante=j) para i,j = 0..8 */
function matrizResultados(lambdaL, lambdaV) {
  const mat = [];
  for (let i = 0; i <= 8; i++) {
    mat[i] = [];
    for (let j = 0; j <= 8; j++) {
      mat[i][j] = poisson(lambdaL, i) * poisson(lambdaV, j);
    }
  }
  return mat;
}

function calcularProbabilidades(lambdaL, lambdaV) {
  const mat = matrizResultados(lambdaL, lambdaV);
  let pL = 0, pE = 0, pV = 0, pOver25 = 0, pBTTS = 0;

  for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 8; j++) {
      const p = mat[i][j];
      if (i > j) pL   += p;
      else if (i === j) pE += p;
      else pV += p;
      if (i + j > 2.5) pOver25 += p;
      if (i >= 1 && j >= 1) pBTTS += p;
    }
  }

  /* Probabilidad de portería a cero: P(rival anota 0) */
  const pCS_L = poisson(lambdaV, 0);  /* local mantiene portería a cero */
  const pCS_V = poisson(lambdaL, 0);  /* visitante mantiene portería a cero */

  return {
    probLocal:      Math.round(pL * 100),
    probEmpate:     Math.round(pE * 100),
    probVisitante:  Math.round(pV * 100),
    probOver25:     Math.round(pOver25 * 100),
    probBTTS:       Math.round(pBTTS * 100),
    probCS_local:   Math.round(pCS_L * 100),
    probCS_visitante: Math.round(pCS_V * 100)
  };
}

/* ── Mezcla Bayesiana prior + observado ─────────────────────── */
function ratingEfectivo(prior, observado, nPartidos) {
  const wO = nPartidos;
  const wP = PRIOR_WEIGHT;
  return (wP * prior + wO * observado) / (wP + wO);
}

/* ── Calcular estadísticas de un equipo desde el historial ─── */
function statsEquipo(sig, partidos) {
  const propios = partidos.filter(p => p.localSig === sig || p.visitanteSig === sig);
  if (!propios.length) return null;

  let gf = 0, gc = 0, btts = 0, over25 = 0, cs = 0;
  let cornersF = 0, cornersC = 0, amarillasF = 0;
  let nCorners = 0, nAmarillas = 0;
  const forma = [];

  propios.forEach(p => {
    const esLocal = p.localSig === sig;
    const miosGoles  = esLocal ? p.golesLocal     : p.golesVisitante;
    const rivGoles   = esLocal ? p.golesVisitante : p.golesLocal;
    gf += miosGoles;
    gc += rivGoles;
    if (miosGoles >= 1 && rivGoles >= 1) btts++;
    if (miosGoles + rivGoles > 2.5)      over25++;
    if (rivGoles === 0)                   cs++;

    /* Forma */
    if (miosGoles > rivGoles)       forma.push('V');
    else if (miosGoles === rivGoles) forma.push('E');
    else                             forma.push('D');

    /* Stats adicionales si existen */
    if (p.stats) {
      const s = p.stats;
      if (s.corners) {
        const cMios = parseFloat(esLocal ? s.corners.local : s.corners.visitante) || 0;
        const cRiv  = parseFloat(esLocal ? s.corners.visitante : s.corners.local) || 0;
        cornersF += cMios; cornersC += cRiv; nCorners++;
      }
      if (s.amarillas) {
        const aM = parseFloat(esLocal ? s.amarillas.local : s.amarillas.visitante) || 0;
        amarillasF += aM; nAmarillas++;
      }
    }
  });

  const n = propios.length;
  return {
    n,
    avgGF:       gf / n,
    avgGC:       gc / n,
    bttsPorc:    Math.round(btts / n * 100),
    over25Porc:  Math.round(over25 / n * 100),
    csPorc:      Math.round(cs / n * 100),
    cornersXP:   nCorners ? +(cornersF / nCorners).toFixed(1) : null,
    amarillasXP: nAmarillas ? +(amarillasF / nAmarillas).toFixed(1) : null,
    forma:        forma.slice(-5).reverse()  /* último primero */
  };
}

/* ── Construir previa completa para un partido ─────────────── */
function construirPrevia(partido, todoPartidos) {
  const sigL = partido.localSig, sigV = partido.visitanteSig;
  const prL = PRIORS[sigL] || { att: 1.0, def: 1.2 };
  const prV = PRIORS[sigV] || { att: 1.0, def: 1.2 };

  const stL = statsEquipo(sigL, todoPartidos);
  const stV = statsEquipo(sigV, todoPartidos);

  /* Ratings de ataque y defensa con mezcla bayesiana */
  const attL  = stL ? ratingEfectivo(prL.att, stL.avgGF / MU, stL.n) : prL.att;
  const defL  = stL ? ratingEfectivo(prL.def, stL.avgGC / MU, stL.n) : prL.def;
  const attV  = stV ? ratingEfectivo(prV.att, stV.avgGF / MU, stV.n) : prV.att;
  const defV  = stV ? ratingEfectivo(prV.def, stV.avgGC / MU, stV.n) : prV.def;

  /* λ = ataque del equipo × defensa del rival × media global */
  const lambdaL = +(attL * defV * MU).toFixed(3);
  const lambdaV = +(attV * defL * MU).toFixed(3);

  const probs = calcularProbabilidades(lambdaL, lambdaV);

  /* Estadísticas descriptivas mezcladas prior+observado */
  const bttsPorc_L   = stL ? Math.round(ratingEfectivo(50, stL.bttsPorc,   stL.n)) : 50;
  const bttsPorc_V   = stV ? Math.round(ratingEfectivo(50, stV.bttsPorc,   stV.n)) : 50;
  const over25Porc_L = stL ? Math.round(ratingEfectivo(48, stL.over25Porc, stL.n)) : 48;
  const over25Porc_V = stV ? Math.round(ratingEfectivo(48, stV.over25Porc, stV.n)) : 48;
  const csPorc_L     = stL ? Math.round(ratingEfectivo(32, stL.csPorc,     stL.n)) : 32;
  const csPorc_V     = stV ? Math.round(ratingEfectivo(32, stV.csPorc,     stV.n)) : 32;

  const cornersL = stL && stL.cornersXP !== null ? stL.cornersXP : +(prL.att * 5.2).toFixed(1);
  const cornersV = stV && stV.cornersXP !== null ? stV.cornersXP : +(prV.att * 5.2).toFixed(1);
  const amarilL  = stL && stL.amarillasXP !== null ? stL.amarillasXP : +(prL.def * 1.8).toFixed(1);
  const amarilV  = stV && stV.amarillasXP !== null ? stV.amarillasXP : +(prV.def * 1.8).toFixed(1);

  /* Forma: primero real, si no hay usamos emojis neutros */
  const formaL = stL ? stL.forma : [];
  const formaV = stV ? stV.forma : [];

  /* Cuántos partidos reales se usaron */
  const nL = stL ? stL.n : 0;
  const nV = stV ? stV.n : 0;
  const basadoEn = nL + nV > 0
    ? `${nL + nV} partido${nL+nV>1?'s':''} del Mundial 2026 + priors FIFA`
    : 'Priors basados en ranking FIFA y clasificatorias';

  return {
    lambdaLocal:     lambdaL,
    lambdaVisitante: lambdaV,
    xGLocal:         +lambdaL.toFixed(2),
    xGVisitante:     +lambdaV.toFixed(2),
    ...probs,
    formaLocal:      formaL,
    formaVisitante:  formaV,
    golesXP_local:   +(stL ? stL.avgGF : prL.att * MU).toFixed(2),
    golesXP_visitante: +(stV ? stV.avgGF : prV.att * MU).toFixed(2),
    bttsPorc_local:  bttsPorc_L,
    bttsPorc_visitante: bttsPorc_V,
    over25Porc_local:  over25Porc_L,
    over25Porc_visitante: over25Porc_V,
    csPorc_local:    csPorc_L,
    csPorc_visitante: csPorc_V,
    cornersXP_local: cornersL,
    cornersXP_visitante: cornersV,
    amarillasXP_local: amarilL,
    amarillasXP_visitante: amarilV,
    basadoEn,
    nPartidosUsados: nL + nV
  };
}

/* ════════════════════════════════════════════════════════════════
   HELPERS ESPN
════════════════════════════════════════════════════════════════ */
function get(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => { try { res(JSON.parse(b)); } catch(e) { rej(e); } });
    }).on('error', rej);
  });
}

function dateStr(d) { return d.toISOString().slice(0,10).replace(/-/g,''); }

function extraerLineups(summary) {
  const rosters = summary.rosters || [];
  const result  = { local: null, visitante: null };
  rosters.forEach(team => {
    const side = team.homeAway === 'home' ? 'local' : 'visitante';
    const jugadores = (team.roster || [])
      .filter(p => p.starter || p.active)
      .map(p => ({
        num:     p.jersey || '',
        nombre:  (p.athlete || {}).shortName || (p.athlete || {}).displayName || '',
        pos:     (p.position || {}).abbreviation || '',
        titular: !!p.starter
      }));
    result[side] = { sig:(team.team||{}).abbreviation||'', nom:(team.team||{}).displayName||'', jugadores };
  });
  const infoComp = (summary.header&&summary.header.competitions&&summary.header.competitions[0])||{};
  (infoComp.competitors||[]).forEach(c => {
    const side = c.homeAway==='home'?'local':'visitante';
    if (result[side]&&c.formation) result[side].formacion = c.formation.text||c.formation;
  });
  return result;
}

function extraerStats(summary) {
  const teamStats = (summary.boxscore||{}).teams||[];
  if (teamStats.length<2) return null;
  const parseTs = ts => { const o={}; (ts.statistics||[]).forEach(s=>{ o[s.name]=s.displayValue; }); return o; };
  const sL=parseTs(teamStats[0]), sR=parseTs(teamStats[1]);
  const KEYS={ possessionPct:'posesion', shotsOnTarget:'tiros', cornerKicks:'corners',
               yellowCards:'amarillas', redCards:'rojas', foulsCommitted:'faltas' };
  const out={};
  Object.keys(KEYS).forEach(k=>{
    const lbl=KEYS[k];
    if(sL[k]!==undefined||sR[k]!==undefined) out[lbl]={local:sL[k]||'0',visitante:sR[k]||'0'};
  });
  return Object.keys(out).length ? out : null;
}

/* ════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════ */
async function main() {
  const inicio = new Date('2026-06-11');
  const hoy    = new Date();
  const partidos = [];

  /* ── 1. Descargar resultados día a día ── */
  for (let d = new Date(inicio); d <= hoy; d.setDate(d.getDate()+1)) {
    const ds = dateStr(new Date(d));
    try {
      const data = await get(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${ds}`
      );
      for (const ev of (data.events||[])) {
        const comp = (ev.competitions||[])[0]; if (!comp) continue;
        const st   = (comp.status||{}).type||{}; if (!st.completed) continue;
        const home = (comp.competitors||[]).find(c=>c.homeAway==='home')||{};
        const away = (comp.competitors||[]).find(c=>c.homeAway==='away')||{};
        const sigL = EQUIPOS[(home.team||{}).abbreviation]||(home.team||{}).abbreviation||'???';
        const sigR = EQUIPOS[(away.team||{}).abbreviation]||(away.team||{}).abbreviation||'???';

        let lineups=null, stats=null;
        try {
          const sum = await get(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${ev.id}`
          );
          lineups = extraerLineups(sum);
          stats   = extraerStats(sum);
        } catch(e) {}

        partidos.push({
          id: sigL+'-'+sigR, espnId: ev.id,
          localSig: sigL, visitanteSig: sigR,
          localNom: (home.team||{}).displayName||sigL,
          visitanteNom: (away.team||{}).displayName||sigR,
          golesLocal: parseInt(home.score)||0,
          golesVisitante: parseInt(away.score)||0,
          fecha: ev.date, grupo: GRUPOS[sigL]||'?',
          jugado: true, stats, lineups
        });
      }
    } catch(e) { console.log(`Sin datos ${ds}:`, e.message); }
  }

  /* ── 2. Calcular posiciones ── */
  const standings = {};
  Object.keys(GRUPOS).forEach(sig => {
    const g = GRUPOS[sig];
    if (!standings[g]) standings[g] = {};
    if (!standings[g][sig]) standings[g][sig] = { sig, pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0 };
  });
  partidos.forEach(p => {
    const g=p.grupo; if(!g||g==='?'||!standings[g]) return;
    const L=standings[g][p.localSig], V=standings[g][p.visitanteSig]; if(!L||!V) return;
    L.pj++; V.pj++;
    L.gf+=p.golesLocal; L.gc+=p.golesVisitante;
    V.gf+=p.golesVisitante; V.gc+=p.golesLocal;
    if(p.golesLocal>p.golesVisitante)      { L.pg++; L.pts+=3; V.pp++; }
    else if(p.golesLocal<p.golesVisitante) { V.pg++; V.pts+=3; L.pp++; }
    else                                    { L.pe++; L.pts++;  V.pe++; V.pts++; }
  });
  const standingsFinal = {};
  Object.keys(standings).forEach(g => {
    standingsFinal[g] = Object.values(standings[g]).sort((a,b)=>{
      if(b.pts!==a.pts) return b.pts-a.pts;
      const da=a.gf-a.gc, db=b.gf-b.gc;
      if(db!==da) return db-da;
      return b.gf-a.gf;
    });
  });

  /* ── 3. Calcular PREVIAS para todos los partidos del calendario ── */
  const previas = {};
  const ahora = Date.now();
  HORARIO.forEach(p => {
    const tPartido = new Date(p.utc).getTime();
    /* Solo calcular previa para partidos que aún no se han jugado
       o que se juegan hoy (ventana de 3h antes) */
    if (tPartido > ahora - 3 * 60 * 60 * 1000) {
      previas[p.id] = construirPrevia(p, partidos);
    }
  });

  /* ── 4. Guardar ── */
  const out = {
    lastUpdated: new Date().toISOString(),
    partidos,
    standings: standingsFinal,
    previas
  };
  fs.writeFileSync('resultados.json', JSON.stringify(out, null, 2));
  console.log(`✓ ${partidos.length} partidos | ${Object.keys(previas).length} previas calculadas`);
  Object.entries(previas).forEach(([id, p]) => {
    console.log(`  ${id}: λL=${p.lambdaLocal} λV=${p.lambdaVisitante} | ${p.probLocal}%/${p.probEmpate}%/${p.probVisitante}% | BTTS ${p.probBTTS}% | O2.5 ${p.probOver25}%`);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
