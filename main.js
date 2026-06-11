/* ── Animar barras al cargar ── */
function animarBarras() {
  document.querySelectorAll('.barwrap .bar').forEach(function(b) {
    b.style.width = (b.dataset.w || 0) + '%';
  });
  document.querySelectorAll('.pbar > i').forEach(function(b) {
    b.style.width = (b.dataset.w || 0) + '%';
  });
}
if (window.requestAnimationFrame) {
  requestAnimationFrame(function() { setTimeout(animarBarras, 150); });
} else {
  animarBarras();
}

/* ── Formulario de correo ── */
var form = document.getElementById('form-correo');
var inputEmail = document.getElementById('email');
var mensajeOk  = document.getElementById('ok');

if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var correo = (inputEmail.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      mensajeOk.style.color = 'var(--neg)';
      mensajeOk.textContent = 'Escribe un correo válido.';
      inputEmail.focus();
      return;
    }
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function() {
      mensajeOk.style.color = 'var(--pos)';
      mensajeOk.textContent = '✓ Anotado. Te llega la previa del próximo partido.';
      inputEmail.value = '';
    }).catch(function() {
      mensajeOk.style.color = 'var(--neg)';
      mensajeOk.textContent = 'Algo falló. Intenta de nuevo en un momento.';
    });
  });
}

var btnWa = document.getElementById('wa');
var btnTg = document.getElementById('tg');
if (btnWa) btnWa.addEventListener('click', function(e) {
  e.preventDefault();
  if (mensajeOk) { mensajeOk.style.color = 'var(--muted)'; mensajeOk.textContent = 'Canal de WhatsApp próximamente. Déjanos tu correo por ahora.'; }
});
if (btnTg) btnTg.addEventListener('click', function(e) {
  e.preventDefault();
  if (mensajeOk) { mensajeOk.style.color = 'var(--muted)'; mensajeOk.textContent = 'Canal de Telegram próximamente. Déjanos tu correo por ahora.'; }
});

/* ═══════════════════════════════════════
   MODAL DE JUGADOR
   Cuando el usuario hace clic en un jugador
   se abre una ventana con sus estadísticas.
═══════════════════════════════════════ */
var modal      = document.getElementById('modal');
var modalPos   = document.getElementById('modal-pos');
var modalNombre= document.getElementById('modal-nombre');
var modalStats = document.getElementById('modal-stats');
var modalClose = document.getElementById('modal-close');

var etiquetasPosicion = {
  GK:  'Portero',
  DEF: 'Defensa',
  MID: 'Mediocampista',
  FWD: 'Delantero'
};

function abrirModal(jugador) {
  var pos    = jugador.dataset.pos;
  var nombre = jugador.dataset.nombre;
  var stats  = JSON.parse(jugador.dataset.stats || '{}');

  modalPos.textContent    = etiquetasPosicion[pos] || pos;
  modalNombre.textContent = nombre;

  modalStats.innerHTML = '';
  Object.keys(stats).forEach(function(clave) {
    var fila = document.createElement('div');
    fila.className = 'stat-row';
    fila.innerHTML =
      '<span class="stat-label">' + clave + '</span>' +
      '<span class="stat-valor">' + stats[clave] + '</span>';
    modalStats.appendChild(fila);
  });

  modal.hidden = false;
  modalClose.focus();
}

function cerrarModal() {
  modal.hidden = true;
}

if (modal) {
  document.querySelectorAll('.jugador').forEach(function(jugador) {
    jugador.setAttribute('tabindex', '0');
    jugador.addEventListener('click', function() { abrirModal(this); });
    jugador.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirModal(this); }
    });
  });

  if (modalClose) modalClose.addEventListener('click', cerrarModal);

  modal.addEventListener('click', function(e) {
    if (e.target === modal) cerrarModal();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.hidden) cerrarModal();
  });
}

/* ═══════════════════════════════════════
   TOOLTIPS de estadísticas (el "?")
   Explican qué significa cada número.
═══════════════════════════════════════ */
var textoTooltip = {
  xg:   'Goles esperados (xG): mide la calidad de las ocasiones, no la suerte. 2.1 significa que por sus oportunidades de tiro, el equipo "merecía" meter 2 goles.',
  forma:'V = Victoria · E = Empate · D = Derrota. El resultado más reciente está a la izquierda.',
  btts: 'Ambos marcan (BTTS = Both Teams To Score): porcentaje de partidos donde los dos equipos anotaron al menos un gol.',
  over: 'Over 2.5: porcentaje de partidos donde cayeron 3 goles o más en total. Si el valor es alto, el partido promete ser abierto.',
  cs:   'Portería a cero (Clean Sheet): porcentaje de partidos donde el equipo NO recibió ningún gol.'
};

var tooltip = document.getElementById('tooltip');

if (tooltip) {
  document.querySelectorAll('.stat-tip').forEach(function(btn) {
    function mostrar(e) {
      var clave = btn.dataset.tip;
      tooltip.textContent = textoTooltip[clave] || '';
      tooltip.hidden = false;
      posicionarTooltip(e);
    }
    function ocultar() { tooltip.hidden = true; }
    function posicionarTooltip(e) {
      var x = e.clientX + 12;
      var y = e.clientY + 12;
      if (x + 230 > window.innerWidth) x = e.clientX - 230;
      tooltip.style.left = x + 'px';
      tooltip.style.top  = y + 'px';
    }

    btn.addEventListener('mouseenter', mostrar);
    btn.addEventListener('mousemove',  posicionarTooltip);
    btn.addEventListener('mouseleave', ocultar);
    btn.addEventListener('focus',      mostrar);
    btn.addEventListener('blur',       ocultar);
  });
}

/* ═══════════════════════════════════════
   FILTROS DEL CALENDARIO
   Muestra/oculta partidos por fase.
═══════════════════════════════════════ */
document.querySelectorAll('.filtro').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filtro').forEach(function(b) { b.classList.remove('activo'); });
    this.classList.add('activo');

    var fase = this.dataset.fase;

    document.querySelectorAll('.partido-card').forEach(function(card) {
      card.style.display = (fase === 'todos' || card.dataset.fase === fase) ? '' : 'none';
    });

    document.querySelectorAll('.fase-titulo, .fase-placeholder').forEach(function(el) {
      var f = el.dataset.fase;
      if (!f) return;
      el.style.display = (fase === 'todos' || f === fase) ? '' : 'none';
    });
  });
});
