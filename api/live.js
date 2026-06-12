/* Vercel Serverless Function — proxy ESPN sin CORS
   Llamada: /api/live
   Retorna marcador en vivo + alineaciones + stats */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'max-age=30');

  try {
    const sbRes = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const sbData = await sbRes.json();
    const events = (sbData.events || []).map(parseESPN);

    const rawEvents = sbData.events || [];
    const activeRaw = rawEvents.find(ev => {
      const st = ((ev.competitions || [])[0] || {}).status || {};
      return st.type && !st.type.completed && st.type.name !== 'STATUS_SCHEDULED';
    }) || rawEvents[rawEvents.length - 1];

    let lineups = null, statsVivo = null;
    if (activeRaw) {
      try {
        const sumRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${activeRaw.id}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        const summary = await sumRes.json();
        lineups   = extraerLineups(summary);
        statsVivo = extraerStatsResumen(summary);
      } catch (e) {}
    }

    return res.status(200).json({ source: 'espn', events, lineups, statsVivo });
  } catch (e) {
    try {
      const r  = await fetch('https://www.thesportsdb.com/api/v1/json/3/eventslive.php');
      const d  = await r.json();
      const wc = (d.events || []).filter(ev =>
        ev.strLeague && ev.strLeague.toLowerCase().includes('world cup')
      );
      return res.status(200).json({ source: 'tsdb', events: wc.map(parseTSDB), lineups: null, statsVivo: null });
    } catch (e2) {}
  }

  return res.status(200).json({ source: 'none', events: [], lineups: null, statsVivo: null });
}

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
    espnId: ev.idEvent, local: ev.strHomeTeam, localNom: ev.strHomeTeam,
    visitante: ev.strAwayTeam, visitanteNom: ev.strAwayTeam,
    golesLocal: parseInt(ev.intHomeScore) || 0, golesVisitante: parseInt(ev.intAwayScore) || 0,
    minuto: ev.strProgress || '', estado: ev.strStatus || '',
    completado: ev.strStatus === 'Match Finished',
    fecha: ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z'
  };
}

function extraerLineups(summary) {
  const rosters = summary.rosters || [];
  const result  = { local: null, visitante: null };
  rosters.forEach(team => {
    const side = team.homeAway === 'home' ? 'local' : 'visitante';
    const jugadores = (team.roster || []).filter(p => p.starter || p.active).map(p => ({
      num: p.jersey || '', nombre: (p.athlete || {}).shortName || (p.athlete || {}).displayName || '',
      pos: (p.position || {}).abbreviation || '', titular: !!p.starter
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

function extraerStatsResumen(summary) {
  const teamStats = (summary.boxscore||{}).teams||[];
  if (teamStats.length < 2) return null;
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
