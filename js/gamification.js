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
    const targetSteps = parseInt(m.pasos_objetivo_diario, 10) || 8000;
    const currentSteps = parseInt(m.pasos_diarios, 10) || 0;
    if (currentSteps >= targetSteps) pts += 30;
    else pts += Math.floor(30 * (currentSteps / targetSteps));
    // Sueño
    const targetSleep = parseFloat(m.sueno_objetivo_horas) || 8;
    const currentSleep = parseFloat(m.sueno_horas) || 0;
    if (currentSleep >= targetSleep) pts += 25;
    else pts += Math.floor(25 * Math.max(0, currentSleep / targetSleep));
    // Estrés (bajo = bueno)
    const stress = parseInt(m.nivel_estres, 10);
    if (stress <= 3) pts += 20;
    else if (stress <= 4) pts += 10;
    // Energía (alto = bueno)
    const energy = parseInt(m.nivel_energia, 10);
    if (energy >= 4) pts += 25;
    else if (energy >= 3) pts += 15;
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
