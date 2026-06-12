/* sync.js — corre automáticamente cada 15 min via GitHub Actions
   Consulta ESPN, genera resultados.json con partidos, posiciones y alineaciones */

const fs = require('fs');
const https = require('https');

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

function get(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => { try { res(JSON.parse(b)); } catch(e) { rej(e); } });
    }).on('error', rej);
  });
}

function dateStr(d) {
  return d.toISOString().slice(0,10).replace(/-/g,'');
}

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
    result[side] = {
      sig:       (team.team || {}).abbreviation || '',
      nom:       (team.team || {}).displayName  || '',
      jugadores
    };
  });
  const infoComp = (summary.header && summary.header.competitions && summary.header.competitions[0]) || {};
  (infoComp.competitors || []).forEach(c => {
    const side = c.homeAway === 'home' ? 'local' : 'visitante';
    if (result[side] && c.formation) {
      result[side].formacion = c.formation.text || c.formation;
    }
  });
  return result;
}

function extraerStats(summary) {
  const boxscore  = summary.boxscore || {};
  const teamStats = boxscore.teams   || [];
  if (teamStats.length < 2) return null;
  const parseTs = ts => {
    const obj = {};
    (ts.statistics || []).forEach(s => { obj[s.name] = s.displayValue; });
    return obj;
  };
  const sL = parseTs(teamStats[0]);
  const sR = parseTs(teamStats[1]);
  const KEYS = {
    possessionPct:  'posesion',
    shotsOnTarget:  'tiros',
    cornerKicks:    'corners',
    yellowCards:    'amarillas',
    redCards:       'rojas',
    foulsCommitted: 'faltas'
  };
  const out = {};
  Object.keys(KEYS).forEach(k => {
    const label = KEYS[k];
    if (sL[k] !== undefined || sR[k] !== undefined) {
      out[label] = { local: sL[k] || '0', visitante: sR[k] || '0' };
    }
  });
  return Object.keys(out).length ? out : null;
}

async function main() {
  const inicio   = new Date('2026-06-11');
  const hoy      = new Date();
  const partidos = [];

  for (let d = new Date(inicio); d <= hoy; d.setDate(d.getDate() + 1)) {
    const ds = dateStr(new Date(d));
    try {
      const data = await get(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${ds}`
      );
      for (const ev of (data.events || [])) {
        const comp = (ev.competitions || [])[0];
        if (!comp) continue;
        const st = (comp.status || {}).type || {};
        if (!st.completed) continue;

        const home = (comp.competitors || []).find(c => c.homeAway === 'home') || {};
        const away = (comp.competitors || []).find(c => c.homeAway === 'away') || {};
        const sigL = EQUIPOS[(home.team || {}).abbreviation] || (home.team || {}).abbreviation || '???';
        const sigR = EQUIPOS[(away.team || {}).abbreviation] || (away.team || {}).abbreviation || '???';

        /* Resumen detallado: lineups + stats */
        let lineups = null, stats = null;
        try {
          const sum = await get(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${ev.id}`
          );
          lineups = extraerLineups(sum);
          stats   = extraerStats(sum);
        } catch(e) { /* sin detalle */ }

        partidos.push({
          id:             sigL + '-' + sigR,
          espnId:         ev.id,
          localSig:       sigL,
          visitanteSig:   sigR,
          localNom:       (home.team || {}).displayName || sigL,
          visitanteNom:   (away.team || {}).displayName || sigR,
          golesLocal:     parseInt(home.score) || 0,
          golesVisitante: parseInt(away.score) || 0,
          fecha:          ev.date,
          grupo:          GRUPOS[sigL] || '?',
          jugado:         true,
          stats,
          lineups
        });
      }
    } catch(e) {
      console.log(`Sin datos para ${ds}:`, e.message);
    }
  }

  /* Calcular posiciones */
  const standings = {};
  Object.keys(GRUPOS).forEach(sig => {
    const g = GRUPOS[sig];
    if (!standings[g]) standings[g] = {};
    if (!standings[g][sig]) standings[g][sig] = { sig, pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0 };
  });
  partidos.forEach(p => {
    const g = p.grupo;
    if (!g || g === '?' || !standings[g]) return;
    const L = standings[g][p.localSig];
    const V = standings[g][p.visitanteSig];
    if (!L || !V) return;
    L.pj++; V.pj++;
    L.gf += p.golesLocal;  L.gc += p.golesVisitante;
    V.gf += p.golesVisitante; V.gc += p.golesLocal;
    if      (p.golesLocal > p.golesVisitante) { L.pg++; L.pts += 3; V.pp++; }
    else if (p.golesLocal < p.golesVisitante) { V.pg++; V.pts += 3; L.pp++; }
    else                                       { L.pe++; L.pts++;   V.pe++; V.pts++; }
  });
  const standingsFinal = {};
  Object.keys(standings).forEach(g => {
    standingsFinal[g] = Object.values(standings[g]).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const da = a.gf - a.gc, db = b.gf - b.gc;
      if (db !== da) return db - da;
      return b.gf - a.gf;
    });
  });

  const out = {
    lastUpdated: new Date().toISOString(),
    partidos,
    standings: standingsFinal
  };
  fs.writeFileSync('resultados.json', JSON.stringify(out, null, 2));
  console.log(`✓ ${partidos.length} partidos guardados.`);
}

main().catch(e => { console.error(e); process.exit(1); });
