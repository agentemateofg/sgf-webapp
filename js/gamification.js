/**
 * SGFIntegral — Gamification Engine
 * Cálculo de puntos, niveles, rachas y bonus.
 * Sin estado propio; recibe data, devuelve métricas agregadas.
 */

const LEVELS = [
  { min:0,   name:'Familia Novata',    desc:'Construyendo hábitos juntos' },
  { min:200, name:'Familia Activa',    desc:'Primeros logros conseguidos' },
  { min:500, name:'Guerreros del Bienestar', desc:'Rutinas sólidas en marcha' },
  { min:1000,name:'Familia Top',       desc:'Referente de salud y cooperación' },
  { min:2000,name:'Legado Familiar',   desc:'Ídolos del bienestar colectivo' }
];

export class Gamification {
  puntos(person, data) {
    const m = data[person];
    if (!m) return 0;
    let pts = 0;
    // Pasos
    if (m.pasos_diarios >= m.pasos_objetivo_diario) pts += 30;
    else pts += Math.floor(30 * (m.pasos_diarios / m.pasos_objetivo_diario));
    // Sueño
    if (m.sueno_horas >= m.sueno_objetivo_horas) pts += 25;
    else pts += Math.floor(25 * Math.max(0, m.sueno_horas / m.sueno_objetivo_horas));
    // Estrés (bajo = bueno)
    if (m.nivel_estres <= 3) pts += 20;
    else if (m.nivel_estres <= 4) pts += 10;
    // Energía (alto = bueno)
    if (m.nivel_energia >= 4) pts += 25;
    else if (m.nivel_energia >= 3) pts += 15;
    return pts;
  }

  puntosTotales(data) {
    const bases = ['mateo','monica','moni'].reduce((s,p) => s + this.puntos(p, data), 0);
    const bonus = (data.familia?.cenas_familia_juntas || 0) * 10;
    return bases + bonus;
  }

  nivel(pts) {
    let lvl = LEVELS[0];
    for (const l of LEVELS) if (pts >= l.min) lvl = l;
    return lvl;
  }

  nivelData(pts) {
    const current = this.nivel(pts);
    const idx = LEVELS.indexOf(current);
    const next = LEVELS[idx + 1] || { min: pts + 500 };
    const pct = Math.min(100, Math.round(100 * (pts - current.min) / (next.min - current.min)));
    return { current, next, pct };
  }

  vidas(data) {
    const fuera = data.familia?.comidas_fuera_semanal || 0;
    return fuera > 3 ? 3 : (fuera > 1 ? 4 : 5);
  }

  cenasBar(data) {
    const act = data.familia?.cenas_familia_juntas || 0;
    return { pct: Math.min(100, Math.round(100 * act / 5)), text: `${act}/5` };
  }
}
