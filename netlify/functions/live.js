/* Netlify Function — proxy para ESPN sin CORS
   Llamada: /.netlify/functions/live
   Retorna el marcador en vivo del partido actual de la Copa del Mundo */

exports.handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'max-age=30'
  };

  /* Intentar ESPN */
  try {
    const r = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const d = await r.json();
    const events = (d.events || []).map(parseESPN);
    if (events.length) {
      return { statusCode: 200, headers, body: JSON.stringify({ source: 'espn', events }) };
    }
  } catch (e) { /* ESPN no disponible */ }

  /* Fallback: TheSportsDB (liga 4480 = FIFA World Cup) */
  try {
    const r = await fetch('https://www.thesportsdb.com/api/v1/json/3/eventslive.php');
    const d = await r.json();
    const wc = (d.events || []).filter(ev =>
      ev.strLeague && ev.strLeague.toLowerCase().includes('world cup')
    );
    return { statusCode: 200, headers, body: JSON.stringify({ source: 'tsdb', events: wc.map(parseTSDB) }) };
  } catch (e) { /* nada */ }

  return { statusCode: 200, headers, body: JSON.stringify({ source: 'none', events: [] }) };
};

function parseESPN(ev) {
  const comp = ev.competitions[0] || {};
  const home = (comp.competitors || []).find(c => c.homeAway === 'home') || {};
  const away = (comp.competitors || []).find(c => c.homeAway === 'away') || {};
  const st   = comp.status || {};
  const stats = {};
  (comp.details || []).forEach(d => { stats[d.type && d.type.text] = d.clock && d.clock.displayValue; });
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
