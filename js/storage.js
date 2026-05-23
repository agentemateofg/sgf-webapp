/**
 * SGFIntegral — Storage Engine
 * Persistencia local + cifrado simétrico ligero con PIN (XOR + checksum).
 * Objetivo: proteger blob compartido de lectura casual sin usar crypto.subtle.
 * Future: migrar a AES-GCM vía Web Crypto cuando el soporte offline mejore.
 */

const STORE_KEY = 'sgf-data-v1';

export class Storage {
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return this._defaults();
      return JSON.parse(raw);
    } catch { return this._defaults(); }
  }

  save(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  /** Deriva una clave expandiendo repetidamente el PIN */
  _expandKey(pin, length) {
    let out = '';
    while (out.length < length) out += pin;
    return out.slice(0, length);
  }

  /** XOR entre dos strings del mismo length */
  _xor(a, b) {
    let out = '';
    for (let i = 0; i < a.length; i++) out += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i));
    return out;
  }

  /** Hash simple (djb2 variant) */
  _hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) & 0xFFFFFFFF;
    return h.toString(16).padStart(8, '0');
  }

  /** Cifra datos con PIN. Salida: base64. */
  exportEncrypted(pin) {
    if (!/^\d{6}$/.test(pin)) throw new Error('PIN 6 dígitos');
    const data = this.load();
    const hash = this._hash(pin + 'sgf-salt').slice(0, 8);
    const payload = hash + encodeURIComponent(JSON.stringify(data));
    const key = this._expandKey(pin, payload.length);
    const ct = this._xor(payload, key);
    return btoa(ct);
  }

  /** Descifra blob con PIN. Guarda si OK. */
  importEncrypted(pin, blob) {
    if (!/^\d{6}$/.test(pin)) throw new Error('PIN 6 dígitos');
    let xored;
    try { xored = atob(blob.trim()); }
    catch { throw new Error('Código corrupto'); }

    const key = this._expandKey(pin, xored.length);
    const payload = this._xor(xored, key);
    const hash = payload.slice(0, 8);
    const encodedJson = payload.slice(8);
    const expected = this._hash(pin + 'sgf-salt').slice(0, 8);
    if (hash !== expected) throw new Error('PIN incorrecto');

    let json;
    try {
      json = decodeURIComponent(encodedJson);
    } catch {
      json = encodedJson; // Fallback if data was stored in unencoded legacy format
    }
    const data = JSON.parse(json);
    this.save(data);
    return data;
  }

  _defaults() {
    return {
      mateo:  { peso_kg:103, pasos_diarios:4200, sueno_horas:6.5, nivel_estres:4, nivel_energia:2, sueno_objetivo_horas:8, pasos_objetivo_diario:8000, calorias_objetivo:2400, proteinas_objetivo:140, carbos_objetivo:250, grasas_objetivo:80, fibra_objetivo:30 },
      monica: { peso_kg:68,  pasos_diarios:7500, sueno_horas:7,   nivel_estres:3, nivel_energia:4, sueno_objetivo_horas:8, pasos_objetivo_diario:8000, calorias_objetivo:1850, proteinas_objetivo:100, carbos_objetivo:200, grasas_objetivo:65, fibra_objetivo:25 },
      moni:   { peso_kg:45,  pasos_diarios:9800, sueno_horas:8,   nivel_estres:2, nivel_energia:5, sueno_objetivo_horas:9, pasos_objetivo_diario:10000, calorias_objetivo:2000, proteinas_objetivo:110, carbos_objetivo:220, grasas_objetivo:70, fibra_objetivo:25 },
      familia:{ cenas_familia_juntas:3, comidas_fuera_semanal:1, comunicacion_pareja_eval:4, satisfaccion_familiar_general:4, conflictos_semana:0, racha_dias:4 },
      historial: []
    };
  }
}
