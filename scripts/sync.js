/* sync.js — corre automáticamente cada 15 min via GitHub Actions
   Consulta ESPN, genera resultados.json con todos los partidos jugados
   y las posiciones actualizadas de los 12 grupos. */

const fs = require('fs');
const https = require('https');

/* Mapa de abreviaturas ESPN → nuestras siglas y grupo */
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
  /* Alternativas ESPN */
  'MX':'MEX','SA':'RSA','SK':'KOR','CR':'CZE',
  'SOA':'RSA','KVX':'CUW'
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
    https.get(url, { headers:{ 'User-Agent':'Mozilla/5.0' } }, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => { try { res(JSON.parse(b)); } catch(e){ rej(e); } });
    }).on('error', rej);
  });
}

function dateStr(d) {
  return d.toISOString().slice(0,10).replace(/-/g,'');
}

async function main() {
  const inicio = new Date('2026-06-11');
  const hoy    = new Date();
  const partidos = [];

  /* Iterar día a día desde el inicio del torneo */
  for (let d = new Date(inicio); d <= hoy; d.setDate(d.getDate()+1)) {
    const ds = dateStr(new Date(d));
    try {
      const data = await get(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${ds}`
      );
      for (const ev of (data.events || [])) {
        const comp = ev.competitions && ev.competitions[0];
        if (!comp) continue;
        const st = comp.status && comp.status.type;
        if (!st || !st.completed) continue;
        const home = (comp.competitors||[]).find(c=>c.homeAway==='home')||{};
        const away = (comp.competitors||[]).find(c=>c.homeAway==='away')||{};
        const sigL = EQUIPOS[(home.team||{}).abbreviation] || (home.team||{}).abbreviation || '???';
        const sigR = EQUIPOS[(away.team||{}).abbreviation] || (away.team||{}).abbreviation || '???';
        const gL   = parseInt(home.score)||0;
        const gR   = parseInt(away.score)||0;

        /* Buscar stats detalladas */
        const statsRaw = {};
        ((comp.competitions||[])[0] && comp.competitors || []).forEach(eq => {
          (eq.statistics||[]).forEach(s => { statsRaw[s.name] = s.displayValue; });
        });

        partidos.push({
          id:             sigL+'-'+sigR,
          localSig:       sigL,
          visitanteSig:   sigR,
          localNom:       (home.team||{}).displayName||sigL,
          visitanteNom:   (away.team||{}).displayName||sigR,
          golesLocal:     gL,
          golesVisitante: gR,
          fecha:          ev.date,
          grupo:          GRUPOS[sigL]||'?',
          jugado:         true
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
    if (!g || g==='?' || !standings[g]) return;
    const L = standings[g][p.localSig];
    const V = standings[g][p.visitanteSig];
    if (!L || !V) return;
    L.pj++; V.pj++;
    L.gf += p.golesLocal;  L.gc += p.golesVisitante;
    V.gf += p.golesVisitante; V.gc += p.golesLocal;
    if (p.golesLocal > p.golesVisitante)      { L.pg++; L.pts+=3; V.pp++; }
    else if (p.golesLocal < p.golesVisitante) { V.pg++; V.pts+=3; L.pp++; }
    else                                       { L.pe++; L.pts++;  V.pe++; V.pts++; }
  });

  /* Ordenar cada grupo */
  const standingsFinal = {};
  Object.keys(standings).forEach(g => {
    standingsFinal[g] = Object.values(standings[g]).sort((a,b)=>{
      if (b.pts!==a.pts) return b.pts-a.pts;
      const da=a.gf-a.gc, db=b.gf-b.gc;
      if (db!==da) return db-da;
      return b.gf-a.gf;
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
