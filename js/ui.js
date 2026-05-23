/**
 * SGFIntegral — UI Renderer
 * Todo el DOM: tabs, tarjetas, celebraciones, listener de toggles.
 * v2: Quick Log FAB con chips + slider táctil.
 */

const NAMES = { mateo:'Mateo', monica:'Mónica', moni:'Moni' };
const COLORS = { mateo:'#4fc3f7', monica:'#f48fb1', moni:'#ce93d8', familia:'#69f0ae' };

const LOG_PRESETS = [
  { key:'pasos_diarios',   label:'🚶 Pasos',        min:0, max:20000, step:100,  def:6000 },
  { key:'sueno_horas',     label:'😴 Sueño (h)',    min:0, max:12,    step:0.5,  def:7 },
  { key:'nivel_estres',    label:'😤 Estrés (1-5)', min:1, max:5,     step:1,    def:3 },
  { key:'nivel_energia',   label:'⚡ Energía (1-5)', min:1, max:5,     step:1,    def:3 },
  { key:'peso_kg',         label:'⚖️ Peso (kg)',     min:30, max:150,  step:0.1,  def:70 },
  { key:'comidas_fuera',   label:'🍔 Fuera (0-5)',  min:0, max:5,     step:1,    def:0, family:true },
  { key:'cenas_juntas',    label:'🍽️ Cenas juntas',  min:0, max:7,     step:1,    def:0, family:true },
];

export class UI {
  /* ── Tabs ── */
  renderTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel-' + tab.dataset.target).classList.add('active');
      });
    });
  }

  /* ── Quick Log FAB ── */
  openQuickLog() {
    const modal = document.getElementById('entryModal');
    document.getElementById('entryTitle').textContent = 'Registrar rápido';
    document.getElementById('entryValueDisplay').textContent = 'Selecciona persona y dato';

    let html = '<div class="log-chips" id="logPersonChips">';
    ['mateo','monica','moni'].forEach(p => {
      html += `<button class="log-chip" data-person="${p}" onclick="window.app.ui.selectLogPerson(this)" style="border-color:${COLORS[p]}40">${NAMES[p]}</button>`;
    });
    html += `<button class="log-chip" data-person="familia" onclick="window.app.ui.selectLogPerson(this)" style="border-color:rgba(105,240,174,0.3)">👨‍👩‍👧 Familia</button>`;
    html += '</div><div class="log-chips" id="logMetricChips">';
    LOG_PRESETS.forEach((pr,i) => {
      html += `<button class="log-chip" data-idx="${i}" onclick="window.app.ui.selectLogMetric(this)" style="display:none">${pr.label}</button>`;
    });
    html += '</div><div id="logSliderArea" style="display:none">';
    html += '<div class="slider-wrap"><button class="slider-minus" onclick="window.app.ui.sliderDelta(-1)">−</button><input type="range" id="logRange" oninput="window.app.ui.sliderInput(this.value)"><button class="slider-plus" onclick="window.app.ui.sliderDelta(1)">+</button></div>';
    html += '</div>';

    // hidden fields para compatibilidad con saveEntry()
    html += '<input type="hidden" id="entryPerson"><input type="hidden" id="entryKey"><input type="hidden" id="entryVal">';

    document.getElementById('entryBody').innerHTML = html;
    modal.classList.add('active');
  }

  selectLogPerson(btn) {
    document.querySelectorAll('#logPersonChips .log-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const person = btn.dataset.person;
    document.getElementById('entryPerson').value = person;

    // Mostrar métricas relevantes
    document.querySelectorAll('#logMetricChips .log-chip').forEach(b => {
      const preset = LOG_PRESETS[b.dataset.idx];
      const show = person === 'familia' ? preset.family : !preset.family;
      b.style.display = show ? 'inline-block' : 'none';
      b.classList.remove('active');
    });
    document.getElementById('logSliderArea').style.display = 'none';
  }

  selectLogMetric(btn) {
    document.querySelectorAll('#logMetricChips .log-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const preset = LOG_PRESETS[btn.dataset.idx];
    document.getElementById('entryKey').value = preset.key;

    const range = document.getElementById('logRange');
    range.min = preset.min; range.max = preset.max; range.step = preset.step; range.value = preset.def;
    this._currentPreset = preset;
    this.sliderInput(preset.def);
    document.getElementById('logSliderArea').style.display = 'block';
  }

  sliderInput(val) {
    const v = parseFloat(val);
    document.getElementById('entryVal').value = v;
    const preset = this._currentPreset;
    let display = v;
    if (preset.key === 'pasos_diarios') display = Math.round(v).toLocaleString();
    else if (preset.key === 'sueno_horas') display = v + 'h';
    else if (preset.key === 'peso_kg') display = v + ' kg';
    document.getElementById('entryValueDisplay').textContent = display;
  }

  sliderDelta(dir) {
    const preset = this._currentPreset;
    const range = document.getElementById('logRange');
    let v = parseFloat(range.value) + (dir * preset.step);
    v = Math.max(preset.min, Math.min(preset.max, parseFloat(v.toFixed(2))));
    range.value = v;
    this.sliderInput(v);
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

    const elStreak = document.getElementById('streakFam');
    this._animateValue(elStreak, parseInt(elStreak.textContent)||0, streak, 1000);
    const circ = 2 * Math.PI * 46;
    document.getElementById('ringFam').style.strokeDasharray = circ;
    document.getElementById('ringFam').style.strokeDashoffset = circ * (1 - Math.min(1, streak/7));

    document.getElementById('barCenas').style.width = cBar.pct + '%';
    document.getElementById('txtCenas').textContent = cBar.text;

    ['mateo','monica','moni'].forEach(p => {
      const el = document.getElementById('pts' + (p==='mateo'?'Mateo': p==='monica'?'Monica':'Moni'));
      el.style.color = COLORS[p];
      el.style.textShadow = `0 0 10px ${COLORS[p]}40`;
      el.textContent = (gamification.puntos(p, data) || 0) + ' pts';
    });

    document.getElementById('teamHearts').textContent = '❤️'.repeat(hearts) + '🖤'.repeat(5-hearts);

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
    `;
    grid.appendChild(card);

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
    document.querySelectorAll('.celebration').forEach(el => {
      el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
    });

    document.querySelectorAll('.tab[data-target]').forEach(tab => {
      tab.addEventListener('click', () => {
        const p = tab.dataset.target;
        if (['mateo','monica','moni'].includes(p)) {
          app.ui.renderPerson(p, app.data.getAll()[p], app.gamification);
        }
      });
    });
  }

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
