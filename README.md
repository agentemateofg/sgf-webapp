# SGFIntegral Web App

Dashboard familiar gamificado de bienestar. PWA offline-first.

## 🚀 Deploy en GitHub Pages (gratuito)

1. Crear repositorio nuevo en GitHub (vacío, sin README).
2. Subir estos archivos:
   ```bash
   git init
   git remote add origin https://github.com/TUUSUARIO/sgf-webapp.git
   git add .
   git commit -m "init"
   git push -u origin main
   ```
3. Ir a **Settings → Pages** → Source: **GitHub Actions**.
4. El workflow `deploy.yml` se ejecuta automáticamente.
5. Tu app estará en `https://TUUSUARIO.github.io/sgf-webapp/`

## 📱 Instalar en móvil

- **iOS:** Safari → Compartir → "Añadir a pantalla de inicio"
- **Android:** Chrome → Menú → "Añadir a pantalla de inicio"

## 🔒 Sincronizar datos entre móviles

1. Pulsa 🔒 arriba a la derecha.
2. Establece un **PIN de 6 dígitos** (todos los móviles deben usar el mismo).
3. **Exportar** genera un blob cifrado. Cópialo y envíalo (WhatsApp/Telegram/email).
4. En otro móvil, **pega** el blob y pulsa **Importar**. Los datos se descifran con el PIN.

Sin servidor. Sin coste. Sin dependencia de terceros para el sync.

## 🔄 Migración a backend (fase 2)

El proyecto está diseñado para migrar a Supabase sin tocar la UI:
- `Storage.js` → reemplazar localStorage por Supabase client
- `Data.js` → cambiar getter/setter por tablas SQL con RLS
- `Gamification.js` → no tocar, puro business logic
- `UI.js` → no tocar, solo render

## 📁 Estructura

```
sgf-webapp/
├── index.html          # Shell PWA
├── manifest.json       # Para instalar como app
├── sw.js               # Service Worker offline
├── css/style.css       # Glassmorphism premium
├── js/
│   ├── storage.js      # localStorage + cifrado PIN
│   ├── data.js         # Getter/setter de métricas
│   ├── gamification.js # Motor de puntos y niveles
│   └── ui.js           # Renderizado DOM
└── .github/workflows/  # Auto-deploy a Pages
```

## 🛠 Desarrollo local

Servir archivos estáticos con cualquier comando:
```bash
python3 -m http.server 8080
# o
npx serve .
```
Abrir http://localhost:8080

## ⚠️ Límites

- GitHub Pages: **1GB** límite de repo, **100MB** por archivo.
- Sin backend = sin multiusuario en tiempo real.
- Sync manual = 30 segundos por intercambio de datos.

Para multiusuario real, migrar a Supabase (free tier: 500MB, conexiones pausables).
