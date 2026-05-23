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
    const appState = window.app?.state;

    // ── Card 1: Métricas de hoy ──
    const card = document.createElement('div');
    card.className = 'card glass';
    card.style.borderColor = col + '55';
    card.innerHTML = `
      <div class="card-header"><span class="icon">📊</span> ${NAMES[person]} — Hoy</div>
      <div class="metric">
        <div class="metric-label"><span>🚶 Pasos</span><span style="color:var(--txt-2)">${(pData.pasos_diarios||0).toLocaleString()} / ${(pData.pasos_objetivo_diario||8000).toLocaleString()}</span></div>
        <div class="metric-bar-wrap"><div class="metric-bar" style="width:0%;background:${col};"></div></div>
      </div>
      <div class="metric">
        <div class="metric-label"><span>😴 Sueño</span><span style="color:var(--txt-2)">${pData.sueno_horas||0}h / ${pData.sueno_objetivo_horas||8}h</span></div>
        <div class="metric-bar-wrap"><div class="metric-bar" style="width:0%;background:${col};"></div></div>
      </div>
      <div class="metric">
        <div class="metric-label"><span>😤 Estrés</span><span style="color:var(--txt-2)">${this._stressLabel(pData.nivel_estres||3)}</span></div>
        <div class="metric-bar-wrap"><div class="metric-bar" style="width:0%;background:linear-gradient(90deg,#ef4444,#f97316);"></div></div>
      </div>
      <div class="metric">
        <div class="metric-label"><span>⚡ Energía</span><span style="color:var(--txt-2)">${this._energyLabel(pData.nivel_energia||3)}</span></div>
        <div class="metric-bar-wrap"><div class="metric-bar" style="width:0%;background:${col};"></div></div>
      </div>
      ${pData.peso_kg ? `<div style="margin-top:0.8rem;font-size:0.82rem;color:var(--txt-3);text-align:right;">⚖️ Peso: <strong style="color:var(--txt-2)">${pData.peso_kg} kg</strong></div>` : ''}
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

    // ── Card 2: Check-in de Bienestar ──
    const wCard = document.createElement('div');
    wCard.className = 'card glass';
    wCard.style.borderColor = 'rgba(167,139,250,0.35)';
    wCard.innerHTML = `
      <div class="card-header"><span class="icon">🧠</span> Check-in de Bienestar</div>
      <div class="wellness-row">
        <div class="wellness-field">
          <label class="wellness-label">😤 Estrés</label>
          <div class="wellness-stars" id="wEstresStars_${person}" data-field="wEstres_${person}" data-max="5"></div>
          <input type="hidden" id="wEstres_${person}" value="${pData.nivel_estres||3}">
        </div>
        <div class="wellness-field">
          <label class="wellness-label">⚡ Energía</label>
          <div class="wellness-stars" id="wEnergiaStars_${person}" data-field="wEnergia_${person}" data-max="5"></div>
          <input type="hidden" id="wEnergia_${person}" value="${pData.nivel_energia||3}">
        </div>
      </div>
      <div class="wellness-row" style="margin-top:0.6rem;align-items:center;">
        <label class="wellness-label" style="flex:1;">⚖️ Peso (kg)</label>
        <input type="number" id="wPeso_${person}" class="input-glass" step="0.1" min="20" max="200"
          value="${pData.peso_kg||''}" placeholder="—" style="width:90px;text-align:center;padding:0.45rem;">
      </div>
      <button id="wSave_${person}" class="btn btn-primary" style="width:100%;margin-top:0.9rem;"
        onclick="window.app.saveWellnessCheckin('${person}')">💾 Guardar Check-in</button>
    `;
    grid.appendChild(wCard);

    // Render star selectors
    this._renderStars(`wEstresStars_${person}`, `wEstres_${person}`, pData.nivel_estres||3, '#ef4444');
    this._renderStars(`wEnergiaStars_${person}`, `wEnergia_${person}`, pData.nivel_energia||3, col);

    // ── Card 3: Gráfico SVG semanal de Actividades ──
    const chartCard = document.createElement('div');
    chartCard.className = 'card glass full';
    chartCard.style.borderColor = col + '33';
    const chartHtml = this._buildWeekChart(person, col, appState);
    chartCard.innerHTML = `
      <div class="card-header"><span class="icon">📈</span> Actividad de los últimos 7 días</div>
      ${chartHtml}
    `;
    grid.appendChild(chartCard);
  }

  /* ── Helpers ── */
  _stressLabel(v) {
    const labels = ['','😌 Muy bajo','🙂 Bajo','😐 Medio','😬 Alto','😰 Muy alto'];
    return `${v} — ${labels[v]||v}`;
  }

  _energyLabel(v) {
    const labels = ['','🪫 Agotado','😴 Bajo','🔋 Normal','⚡ Bueno','🚀 Excelente'];
    return `${v} — ${labels[v]||v}`;
  }

  _renderStars(containerId, inputId, currentVal, color) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    if (!container || !input) return;
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const dot = document.createElement('button');
      dot.className = 'wellness-dot' + (i <= currentVal ? ' active' : '');
      dot.dataset.val = i;
      dot.style.setProperty('--dot-color', color);
      dot.onclick = () => {
        input.value = i;
        container.querySelectorAll('.wellness-dot').forEach((d,idx) => {
          d.classList.toggle('active', idx < i);
        });
      };
      container.appendChild(dot);
    }
  }

  _buildWeekChart(person, col, appState) {
    const activities = appState?.activities || [];
    const members = appState?.members || [];

    // Build last-7-days buckets
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const label = d.toLocaleDateString('es-ES', { weekday: 'short' });
      days.push({ date: d, label, pasos: 0, sueno: 0, cals: 0 });
    }

    activities.forEach(act => {
      const actDate = act.date?.toDate ? act.date.toDate() : new Date(act.date || act.createdAt);
      actDate.setHours(0,0,0,0);

      const member = members.find(m => m.id === act.uid);
      if (!member) return;
      const pKey = window.app?.getPersonKey(member.id, member.name, member.email);
      if (pKey !== person) return;

      const bucket = days.find(d => d.date.getTime() === actDate.getTime());
      if (!bucket) return;
      if (act.type === 'pasos') bucket.pasos += act.duration || 0;
      if (act.type === 'sueño') bucket.sueno += act.duration || 0;
      bucket.cals += act.calories || 0;
    });

    const maxPasos = Math.max(...days.map(d => d.pasos), 1000);
    const w = 40, gap = 8, h = 100, total = days.length;
    const svgW = total * (w + gap);

    const bars = days.map((d, i) => {
      const x = i * (w + gap);
      const pct = Math.min(1, d.pasos / maxPasos);
      const barH = Math.round(pct * (h - 20));
      const y = h - barH;
      const opacity = pct > 0 ? 0.9 : 0.15;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${w}" height="${barH}" rx="6"
            fill="${col}" opacity="${opacity}"/>
          ${d.pasos > 0 ? `<text x="${x + w/2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="${col}" opacity="0.85">${d.pasos >= 1000 ? (d.pasos/1000).toFixed(1)+'k' : d.pasos}</text>` : ''}
          <text x="${x + w/2}" y="${h + 14}" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.4)">${d.label}</text>
          ${d.sueno > 0 ? `<text x="${x + w/2}" y="${h + 26}" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.3)">😴${d.sueno}h</text>` : ''}
        </g>`;
    }).join('');

    return `
      <div style="overflow-x:auto;padding:0.3rem 0 0.5rem;">
        <svg viewBox="0 0 ${svgW} ${h + 32}" width="100%" style="min-width:${svgW}px;display:block;">
          ${bars}
        </svg>
      </div>
      <div style="display:flex;gap:0.6rem;flex-wrap:wrap;margin-top:0.3rem;">
        <span style="font-size:0.75rem;color:var(--txt-3)">📊 Pasos 7d: <strong style="color:${col}">${days.reduce((s,d)=>s+d.pasos,0).toLocaleString()}</strong></span>
        <span style="font-size:0.75rem;color:var(--txt-3)">🔥 Kcal 7d: <strong style="color:${col}">${days.reduce((s,d)=>s+d.cals,0).toLocaleString()}</strong></span>
        <span style="font-size:0.75rem;color:var(--txt-3)">😴 Sueño 7d: <strong style="color:${col}">${days.reduce((s,d)=>s+d.sueno,0).toFixed(1)}h</strong></span>
      </div>`;
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
