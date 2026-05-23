/**
 * SGFIntegral — UI Renderer
 * Todo el DOM: tabs, tarjetas, celebraciones, listener de toggles.
 */

const NAMES = { mateo:'Mateo', monica:'Mónica', moni:'Moni' };
const COLORS = { mateo:'#4fc3f7', monica:'#f48fb1', moni:'#ce93d8', familia:'#69f0ae' };

export class UI {
  /* ── Tabs ── */
  renderTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel-' + tab.dataset.target).classList.add('active');
        if (['mateo','monica','moni'].includes(tab.dataset.target)) {
          // Lazy render de persona al hacer click
        }
      });
    });
  }

  /* ── Panel Familia ── */
  renderFamilia(data, gamification) {
    const pts = gamification.puntosTotales(data);
    const nd = gamification.nivelData(pts);
    const hearts = gamification.vidas(data);
    const cBar = gamification.cenasBar(data);
    const streak = data.familia?.racha_dias || 0;

    document.getElementById('teamLevel').textContent = nd.current.name;
    document.getElementById('levelName').textContent = nd.current.name;
    document.getElementById('levelDesc').textContent = nd.current.desc;
    document.getElementById('barLevel').style.width = nd.pct + '%';
    document.getElementById('txtLevel').textContent = pts + ' / ' + nd.next.min + ' pts';

    // Streak animated
    const elStreak = document.getElementById('streakFam');
    this._animateValue(elStreak, parseInt(elStreak.textContent)||0, streak, 1000);
    const circ = 2 * Math.PI * 46;
    document.getElementById('ringFam').style.strokeDasharray = circ;
    document.getElementById('ringFam').style.strokeDashoffset = circ * (1 - Math.min(1, streak/7));

    // Cenas bar
    document.getElementById('barCenas').style.width = cBar.pct + '%';
    document.getElementById('txtCenas').textContent = cBar.text;

    // Individual points
    ['mateo','monica','moni'].forEach(p => {
      const el = document.getElementById('pts' + (p==='mateo'?'Mateo': p==='monica'?'Monica':'Moni'));
      el.style.color = COLORS[p];
      el.style.textShadow = `0 0 10px ${COLORS[p]}40`;
      el.textContent = (gamification.puntos(p, data) || 0) + ' pts';
    });

    // Hearts
    document.getElementById('teamHearts').textContent = '❤️'.repeat(hearts) + '🖤'.repeat(5-hearts);

    // Habit board
    const habits = [
      { text:'🥗 Verdura hoy',     eval:()=> data.mateo?.pasos_diarios > 1000 },
      { text:'🚶 Pasos objetivo',  eval:()=> ['mateo','monica','moni'].some(p => data[p]?.pasos_diarios >= data[p]?.pasos_objetivo_diario) },
      { text:'😴 8h sueño',        eval:()=> ['mateo','monica','moni'].some(p => data[p]?.sueno_horas >= data[p]?.sueno_objetivo_horas) },
      { text:'🙏 Gratitud',         eval:()=> false },
      { text:'📖 Lectura 15min',  eval:()=> false },
      { text:'💧 2L agua',          eval:()=> false },
      { text:'🏋️ Ejercicio',       eval:()=> false },
      { text:'🍽️ Cena juntos',     eval:()=> data.familia?.cenas_familia_juntas >= 1 },
    ];
    const board = document.getElementById('habitBoard');
    board.innerHTML = habits.map(h =>
      `<div class="habit ${h.eval()?'done':''}" onclick="this.classList.toggle('done'); window.app.ui.checkCelebration();">${h.text}</div>`
    ).join('');
  }

  /* ── Panel personal ── */
  renderPerson(person, pData, gamification) {
    const grid = document.getElementById('grid-'+person);
    if (!grid) return;
    grid.innerHTML = '';

    const pts = gamification.puntos(person, { [person]: pData });
    const col = COLORS[person];

    const card = document.createElement('div');
    card.className = 'card glass';
    card.style.borderColor = col + '55';
    card.innerHTML = `
      <div class="card-header"><span class="icon">📊</span> ${NAMES[person]}</div>
      <div class="metric">
        <div class="metric-label"><span>Pasos</span><span style="color:var(--text2)">${pData.pasos_diarios?.toLocaleString()||0} / ${pData.pasos_objetivo_diario?.toLocaleString()||8000}</span></div>
        <div class="metric-bar-wrap"><div class="metric-bar" style="width:0%;background:${col};"></div></div>
      </div>
      <div class="metric">
        <div class="metric-label"><span>Sueño</span><span style="color:var(--text2)">${pData.sueno_horas||0}h / ${pData.sueno_objetivo_horas||8}h</span></div>
        <div class="metric-bar-wrap"><div class="metric-bar" style="width:0%;background:${col};"></div></div>
      </div>
      <div class="metric">
        <div class="metric-label"><span>Estrés (1-5)</span><span style="color:var(--text2)">${pData.nivel_estres||0}</span></div>
        <div class="metric-bar-wrap"><div class="metric-bar" style="width:0%;background:linear-gradient(90deg,#ef4444,#f97316);"></div></div>
      </div>
      <div class="metric">
        <div class="metric-label"><span>Energía (1-5)</span><span style="color:var(--text2)">${pData.nivel_energia||0}</span></div>
        <div class="metric-bar-wrap"><div class="metric-bar" style="width:0%;background:${col};"></div></div>
      </div>
      <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <button class="btn btn-sm" onclick="window.app.ui.openEntry('${person}','pasos_diarios','Pasos hoy')">+ Pasos</button>
        <button class="btn btn-sm" onclick="window.app.ui.openEntry('${person}','sueno_horas','Horas sueño')">+ Sueño</button>
        <button class="btn btn-sm" onclick="window.app.ui.openEntry('${person}','nivel_estres','Estrés (1-5)')">+ Estrés</button>
        <button class="btn btn-sm" onclick="window.app.ui.openEntry('${person}','nivel_energia','Energía (1-5)')">+ Energía</button>
      </div>
    `;
    grid.appendChild(card);

    // Animate bars
    requestAnimationFrame(() => {
      const bars = card.querySelectorAll('.metric-bar');
      setTimeout(() => {
        bars[0].style.width = Math.min(100, Math.round(100*(pData.pasos_diarios||0)/(pData.pasos_objetivo_diario||8000))) + '%';
        bars[1].style.width = Math.min(100, Math.round(100*(pData.sueno_horas||0)/(pData.sueno_objetivo_horas||8))) + '%';
        bars[2].style.width = ((5-(pData.nivel_estres||0))*20) + '%';
        bars[3].style.width = ((pData.nivel_energia||0)*20) + '%';
      }, 80);
    });
  }

  /* ── Entry modal ── */
  openEntry(person, key, label) {
    const modal = document.getElementById('entryModal');
    document.getElementById('entryTitle').textContent = `${NAMES[person]} — ${label}`;
    document.getElementById('entryBody').innerHTML = `
      <input type="hidden" id="entryPerson" value="${person}">
      <input type="hidden" id="entryKey" value="${key}">
      <input type="number" id="entryVal" class="pin-input" step="0.1" placeholder="Valor…" autofocus>
    `;
    modal.classList.add('active');
  }

  /* ── Celebration ── */
  checkCelebration() {
    const done = document.querySelectorAll('.habit.done').length;
    if (done >= 5) {
      document.getElementById('celTitle').textContent = '¡Familia nivel élite!';
      document.getElementById('celMsg').textContent = `Hoy habéis completado ${done} hábitos. +100 pts de bonificación.`;
      document.getElementById('celebration').classList.add('active');
    }
  }

  /* ── Listeners globales ── */
  setupListeners(app) {
    // Close modals on backdrop click
    document.querySelectorAll('.celebration').forEach(el => {
      el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
    });

    // Render personal tabs lazily
    document.querySelectorAll('.tab[data-target]').forEach(tab => {
      tab.addEventListener('click', () => {
        const p = tab.dataset.target;
        if (['mateo','monica','moni'].includes(p)) {
          app.ui.renderPerson(p, app.data.getAll()[p], app.gamification);
        }
      });
    });
  }

  /* ── Animación numérica suave ── */
  _animateValue(el, start, end, duration) {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (end - start) * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
