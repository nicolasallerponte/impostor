# Impostor · fútbol

PWA para jugar al impostor con futbolistas, cada uno en su móvil. Salas con código de 4 letras, entrada solo con nombre, 391 futbolistas (actuales y leyendas).

## Cómo se juega
1. Uno crea la sala y comparte el enlace o el código.
2. El anfitrión reparte: todos ven el mismo futbolista, menos el impostor (o impostores).
3. Por turnos, cada uno dice una palabra sobre el jugador sin decir el nombre.
4. Se vota en la app. Si el más votado es el impostor, lo habéis pillado.

Ajustes del anfitrión: número de impostores, bombo (todos / actuales / leyendas) y pista para el impostor (ninguna / posición / país).

## Puesta en marcha (gratis, ~10 min)

### 1. Firebase (backend en tiempo real, plan gratuito Spark)
1. Entra en https://console.firebase.google.com → **Crear proyecto** (puedes desactivar Analytics).
2. **Compilación → Authentication → Comenzar → Anónimo → Habilitar.**
3. **Compilación → Realtime Database → Crear base de datos** → ubicación Bélgica (europe-west1) → modo bloqueado.
4. En la pestaña **Reglas**, borra lo que haya, pega el contenido de `database.rules.json` y pulsa **Publicar**.
5. **⚙ Configuración del proyecto → Tus apps → icono `</>` (Web)** → registra la app (sin Hosting) → copia el objeto `firebaseConfig` y pégalo en `config.js`.
   - Comprueba que incluye `databaseURL`. Si no aparece, cópiala de la parte de arriba de Realtime Database.

La `apiKey` de Firebase es pública por diseño; lo que protege los datos son las reglas.

### 2. Hosting gratis (elige uno)
**GitHub Pages**
1. Crea un repositorio público en GitHub.
2. **Add file → Upload files** → arrastra todos los archivos de esta carpeta (incluida ``) → Commit.
3. **Settings → Pages → Source: Deploy from a branch → main / (root)** → Save.
4. En un minuto tienes la URL: `https://TU_USUARIO.github.io/NOMBRE_REPO/`

**Netlify Drop** (aún más rápido): entra en https://app.netlify.com/drop y arrastra la carpeta. Te da una URL al momento (crea cuenta gratis para que no caduque).

**Firebase Hosting** (si tienes Node): `npx firebase-tools login`, `npx firebase-tools init hosting` (carpeta pública: `.`), `npx firebase-tools deploy`.

### 3. Instalar en el móvil
- **iPhone (Safari):** abrir la URL → botón Compartir → **Añadir a pantalla de inicio**.
- **Android (Chrome):** abrir la URL → menú ⋮ → **Instalar aplicación** / Añadir a pantalla de inicio.

## Archivos
- `index.html`, `styles.css`, `app.js` — la app
- `players.js` — base de datos de futbolistas (`Nombre|Posición|País|Época`). Añade líneas para ampliarla.
- `config.js` — tu configuración de Firebase
- `database.rules.json` — reglas de seguridad (cada jugador solo puede leer su propia carta)
- `manifest.webmanifest`, `sw.js`, `` — PWA

## Problemas típicos
- *"No se pudo iniciar sesión (auth/operation-not-allowed)"* → no has activado el acceso Anónimo.
- *"Sin permiso"* → no has publicado las reglas.
- Se queda en "Conectando…" → revisa `databaseURL` en `config.js`.
- Tras actualizar archivos y no ver cambios → cierra y vuelve a abrir la app (el service worker carga la versión nueva con red).
