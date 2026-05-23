/**
 * SGFIntegral — Data Manager
 * Getter/setter tipado para métricas personales y familiares.
 * Incluye historial de cambios para auditoría futura.
 */

export class Data {
  constructor() {
    try {
      const raw = localStorage.getItem('sgf-data-v1');
      this._data = raw ? JSON.parse(raw) : this._defaults();
    } catch {
      this._data = this._defaults();
    }
    if (!this._data.familia) this._data.familia = {};
    if (!this._data.historial) this._data.historial = [];
  }

  getAll() { return JSON.parse(JSON.stringify(this._data)); }

  set(person, key, value) {
    if (!this._data[person]) this._data[person] = {};
    const old = this._data[person][key];
    this._data[person][key] = value;
    this._data.historial.push({ t: Date.now(), who: person, key, old, value });
    localStorage.setItem('sgf-data-v1', JSON.stringify(this._data));
  }

  setFamilia(key, value) {
    const old = this._data.familia[key];
    this._data.familia[key] = value;
    this._data.historial.push({ t: Date.now(), who: 'familia', key, old, value });
    localStorage.setItem('sgf-data-v1', JSON.stringify(this._data));
  }

  _defaults() {
    return {
      mateo:  { peso_kg:103, pasos_diarios:4200, sueno_horas:6.5, nivel_estres:4, nivel_energia:2, sueno_objetivo_horas:8, pasos_objetivo_diario:8000 },
      monica: { peso_kg:68,  pasos_diarios:7500, sueno_horas:7,   nivel_estres:3, nivel_energia:4, sueno_objetivo_horas:8, pasos_objetivo_diario:8000 },
      moni:   { peso_kg:45,  pasos_diarios:9800, sueno_horas:8,   nivel_estres:2, nivel_energia:5, sueno_objetivo_horas:9, pasos_objetivo_diario:10000 },
      familia:{ cenas_familia_juntas:3, comidas_fuera_semanal:1, comunicacion_pareja_eval:4, satisfaccion_familiar_general:4, conflictos_semana:0, racha_dias:4 },
      historial: []
    };
  }
}
