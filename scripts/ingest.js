#!/usr/bin/env node
/**
 * SGFIntegral — Script de Ingesta para Agente (Anti / Hermes)
 * ─────────────────────────────────────────────────────────────
 * Permite registrar métricas de bienestar y actividades en Firestore
 * usando la API REST de Firebase sin depender del SDK de cliente.
 *
 * USO:
 *   node scripts/ingest.js wellness --person=mateo --estres=3 --energia=4 --peso=102.5
 *   node scripts/ingest.js activity --person=mateo --type=pasos --duration=7500
 *   node scripts/ingest.js activity --person=mateo --type=sueño --duration=7.5
 *   node scripts/ingest.js activity --person=mateo --type=ejercicio --duration=45 --calories=350
 *
 * REQUISITOS:
 *   - FIREBASE_API_KEY en entorno o hardcoded (desde firebase-config.js)
 *   - FIREBASE_PROJECT_ID (familia-m)
 *   - FIREBASE_ID_TOKEN: obtener con `firebase auth:export` o mediante login previo.
 *     Para agente: ejecutar `firebase login` y luego obtener el token.
 *
 * FAMILIA IDs (extraídos de Firestore una vez autenticado):
 *   Ajustar FAMILY_ID con el código de sala real.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────
const PROJECT_ID  = 'familia-m';
const FAMILY_ID   = process.env.SGF_FAMILY_ID || 'CONFIGURA_FAMILY_ID';
const API_KEY     = process.env.FIREBASE_API_KEY || 'AIzaSy...FXg4'; // Reemplazar con key real
const ID_TOKEN    = process.env.FIREBASE_ID_TOKEN || '';

// UID → persona (mapeo inverso para uso del agente)
const PERSON_UIDS = {
  mateo:  process.env.SGF_UID_MATEO  || '',
  monica: process.env.SGF_UID_MONICA || '',
  moni:   process.env.SGF_UID_MONI   || '',
};

const PERSON_NAMES = {
  mateo: 'Mateo',
  monica: 'Mónica',
  moni: 'Moni',
};

// ── Arg parser ─────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const opts = {};
  args.slice(1).forEach(a => {
    const m = a.match(/^--(\w+)=(.+)$/);
    if (m) opts[m[1]] = m[2];
  });
  return { cmd, opts };
}

// ── Firestore REST helper ───────────────────────────────────────
function firestoreRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents${path}?key=${API_KEY}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...(ID_TOKEN ? { 'Authorization': `Bearer ${ID_TOKEN}` } : {}),
      },
    };

    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function toFirestoreValue(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (v === null) return { nullValue: null };
  return { stringValue: String(v) };
}

function buildFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

// ── Commands ───────────────────────────────────────────────────
async function cmdWellness(opts) {
  const person = opts.person;
  if (!person || !PERSON_UIDS[person]) {
    console.error(`❌ Persona inválida o UID no configurado: ${person}`);
    console.error('Configura las vars de entorno SGF_UID_MATEO, SGF_UID_MONICA, SGF_UID_MONI');
    process.exit(1);
  }

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const uid = PERSON_UIDS[person];
  const docId = `${todayStr}_${uid}`;
  const docPath = `/families/${FAMILY_ID}/wellness/${docId}`;

  const payload = {
    uid,
    userName: PERSON_NAMES[person] || person,
    nivel_estres: opts.estres ? parseInt(opts.estres, 10) : null,
    nivel_energia: opts.energia ? parseInt(opts.energia, 10) : null,
    peso_kg: opts.peso ? parseFloat(opts.peso) : null,
    date: { timestampValue: new Date().toISOString() },
  };

  // Filter nulls
  const fields = buildFields(Object.fromEntries(
    Object.entries(payload).filter(([,v]) => v !== null && v !== undefined)
  ));
  // Timestamp needs special handling
  fields['date'] = { timestampValue: new Date().toISOString() };

  const docPath2 = `/families/${FAMILY_ID}/wellness/${docId}`;
  const res = await firestoreRequest('PATCH', docPath2, { fields });

  if (res.status === 200 || res.status === 201) {
    console.log(`✅ Wellness check-in guardado para ${PERSON_NAMES[person]}:`);
    if (opts.estres)  console.log(`   😤 Estrés:  ${opts.estres}/5`);
    if (opts.energia) console.log(`   ⚡ Energía: ${opts.energia}/5`);
    if (opts.peso)    console.log(`   ⚖️  Peso:    ${opts.peso} kg`);
    console.log(`   📅 DocID: ${docId}`);
  } else {
    console.error('❌ Error:', res.status, JSON.stringify(res.body, null, 2));
  }
}

async function cmdActivity(opts) {
  const person = opts.person;
  if (!person || !PERSON_UIDS[person]) {
    console.error(`❌ Persona inválida o UID no configurado: ${person}`);
    process.exit(1);
  }

  const uid = PERSON_UIDS[person];
  const payload = {
    uid,
    userName: PERSON_NAMES[person] || person,
    type: opts.type || 'otro',
    duration: opts.duration ? parseFloat(opts.duration) : 0,
    calories: opts.calories ? parseInt(opts.calories, 10) : 0,
    notes: opts.notes || `[Agente] ${new Date().toLocaleDateString('es-ES')}`,
  };

  const fields = buildFields(payload);
  fields['date'] = { timestampValue: new Date().toISOString() };
  fields['createdAt'] = { timestampValue: new Date().toISOString() };

  const colPath = `/families/${FAMILY_ID}/activities`;
  const res = await firestoreRequest('POST', colPath, { fields });

  if (res.status === 200 || res.status === 201) {
    const typeIcons = { ejercicio:'🏋️', pasos:'🚶', sueño:'😴', meditacion:'🧘', comida:'🍽️', agua:'💧', lectura:'📖' };
    const icon = typeIcons[payload.type] || '✨';
    console.log(`✅ Actividad registrada para ${PERSON_NAMES[person]}:`);
    console.log(`   ${icon} Tipo: ${payload.type}`);
    console.log(`   ⏱️  Duración: ${payload.duration}`);
    if (payload.calories) console.log(`   🔥 Calorías: ${payload.calories} kcal`);
    if (payload.notes)    console.log(`   📝 Notas: ${payload.notes}`);
  } else {
    console.error('❌ Error:', res.status, JSON.stringify(res.body, null, 2));
  }
}

function printHelp() {
  console.log(`
SGFIntegral — Agente Ingestor v1.0
─────────────────────────────────────
Comandos:
  wellness   Registrar check-in de bienestar diario
  activity   Registrar una actividad en el feed familiar

Opciones wellness:
  --person=mateo|monica|moni
  --estres=1-5
  --energia=1-5
  --peso=XX.X  (kg)

Opciones activity:
  --person=mateo|monica|moni
  --type=pasos|sueño|ejercicio|meditacion|comida|agua|lectura|otro
  --duration=N  (pasos → número, sueño → horas, otros → minutos)
  --calories=N  (opcional)
  --notes="texto libre"

Variables de entorno necesarias:
  SGF_FAMILY_ID       Código de sala (ej: AB3X7Y)
  FIREBASE_ID_TOKEN   Token JWT de Firebase Auth
  FIREBASE_API_KEY    API Key del proyecto
  SGF_UID_MATEO       UID de Firebase Auth de Mateo
  SGF_UID_MONICA      UID de Firebase Auth de Mónica
  SGF_UID_MONI        UID de Firebase Auth de Moni

Ejemplos:
  node scripts/ingest.js wellness --person=mateo --estres=3 --energia=4 --peso=102.5
  node scripts/ingest.js activity --person=mateo --type=pasos --duration=7500
  node scripts/ingest.js activity --person=moni  --type=sueño --duration=9
  `);
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  const { cmd, opts } = parseArgs();
  if (!cmd || cmd === 'help') { printHelp(); return; }
  if (cmd === 'wellness') await cmdWellness(opts);
  else if (cmd === 'activity') await cmdActivity(opts);
  else { console.error(`❌ Comando desconocido: ${cmd}`); printHelp(); }
}

main().catch(e => { console.error('Error fatal:', e); process.exit(1); });
