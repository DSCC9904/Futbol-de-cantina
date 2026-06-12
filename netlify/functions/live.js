/* Netlify Function — proxy ESPN sin CORS
   Retorna marcador en vivo + alineaciones + stats del partido actual */

exports.handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'max-age=30'
  };

  try {
    /* 1. Scoreboard — partidos activos o del día */
    const sbRes = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const sbData = await sbRes.json();
    const events = (sbData.events || []).map(parseESPN);

    /* 2. Para el primer partido activo o el último jugado, traer resumen completo */
    const rawEvents = sbData.events || [];
    const activeRaw = rawEvents.find(ev => {
      const st = ((ev.competitions || [])[0] || {}).status || {};
      return st.type && !st.type.completed && st.type.name !== 'STATUS_SCHEDULED';
    }) || rawEvents[rawEvents.length - 1];

    let summary = null;
    if (activeRaw) {
      try {
        const sumRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${activeRaw.id}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        summary = await sumRes.json();
      } catch (e) { /* sin resumen */ }
    }

    const lineups  = summary ? extraerLineups(summary) : null;
    const statsVivo = summary ? extraerStatsResumen(summary) : null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ source: 'espn', events, lineups, statsVivo })
    };
  } catch (e) {
    /* Fallback TheSportsDB */
    try {
      const r  = await fetch('https://www.thesportsdb.com/api/v1/json/3/eventslive.php');
      const d  = await r.json();
      const wc = (d.events || []).filter(ev =>
        ev.strLeague && ev.strLeague.toLowerCase().includes('world cup')
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ source: 'tsdb', events: wc.map(parseTSDB), lineups: null, statsVivo: null })
      };
    } catch (e2) { /* nada */ }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ source: 'none', events: [], lineups: null, statsVivo: null }) };
};

/* ─── parsers ─────────────────────────────────────────────── */

function parseESPN(ev) {
  const comp = ev.competitions[0] || {};
  const home = (comp.competitors || []).find(c => c.homeAway === 'home') || {};
  const away = (comp.competitors || []).find(c => c.homeAway === 'away') || {};
  const st   = comp.status || {};
  return {
    espnId:         ev.id,
    local:          (home.team || {}).abbreviation || '',
    localNom:       (home.team || {}).displayName  || '',
    visitante:      (away.team || {}).abbreviation || '',
    visitanteNom:   (away.team || {}).displayName  || '',
    golesLocal:     parseInt(home.score) || 0,
    golesVisitante: parseInt(away.score) || 0,
    minuto:         (st.displayClock || '').replace("'", ''),
    estado:         (st.type || {}).name || '',
    completado:     !!((st.type || {}).completed),
    fecha:          ev.date
  };
}

function parseTSDB(ev) {
  return {
    espnId:         ev.idEvent,
    local:          ev.strHomeTeam,
    localNom:       ev.strHomeTeam,
    visitante:      ev.strAwayTeam,
    visitanteNom:   ev.strAwayTeam,
    golesLocal:     parseInt(ev.intHomeScore) || 0,
    golesVisitante: parseInt(ev.intAwayScore) || 0,
    minuto:         ev.strProgress || '',
    estado:         ev.strStatus   || '',
    completado:     ev.strStatus === 'Match Finished',
    fecha:          ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z'
  };
}

function extraerLineups(summary) {
  const rosters = summary.rosters || [];
  const result  = { local: [], visitante: [] };
  rosters.forEach(team => {
    const side   = team.homeAway === 'home' ? 'local' : 'visitante';
    const sigla  = (team.team || {}).abbreviation || '';
    const nombre = (team.team || {}).displayName  || '';
    const jugadores = (team.roster || [])
      .filter(p => p.starter || p.active)
      .map(p => ({
        num:     p.jersey || '',
        nombre:  (p.athlete || {}).shortName || (p.athlete || {}).displayName || '',
        pos:     (p.position || {}).abbreviation || '',
        titular: !!p.starter
      }));
    result[side] = { sig: sigla, nom: nombre, jugadores };
  });
  /* Formacion */
  const infoComp = (summary.header && summary.header.competitions && summary.header.competitions[0]) || {};
  (infoComp.competitors || []).forEach(c => {
    const side = c.homeAway === 'home' ? 'local' : 'visitante';
    if (c.formation) result[side].formacion = c.formation.text || c.formation;
  });
  return result;
}

function extraerStatsResumen(summary) {
  const boxscore = summary.boxscore || {};
  const players  = boxscore.players || [];
  const stats    = {};
  players.forEach((team, idx) => {
    const side = idx === 0 ? 'local' : 'visitante';
    (team.statistics || []).forEach(cat => {
      (cat.athletes || []).forEach(a => {
        /* stats por jugador — no las necesitamos aquí */
      });
    });
  });
  /* Stats de equipo del boxscore */
  const teamStats = boxscore.teams || [];
  const out = {};
  if (teamStats.length >= 2) {
    const parseTeamStats = (ts) => {
      const obj = {};
      (ts.statistics || []).forEach(s => { obj[s.name] = s.displayValue; });
      return obj;
    };
    const sL = parseTeamStats(teamStats[0]);
    const sR = parseTeamStats(teamStats[1]);
    const KEYS = {
      possessionPct:    'posesion',
      shotsOnTarget:    'tiros',
      cornerKicks:      'corners',
      yellowCards:      'amarillas',
      redCards:         'rojas',
      foulsCommitted:   'faltas',
      offsides:         'offside'
    };
    Object.keys(KEYS).forEach(k => {
      const label = KEYS[k];
      if (sL[k] !== undefined || sR[k] !== undefined) {
        out[label] = { local: sL[k] || '0', visitante: sR[k] || '0' };
      }
    });
  }
  return Object.keys(out).length ? out : null;
}
