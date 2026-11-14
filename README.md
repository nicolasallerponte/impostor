# Impostor Fútbol ⚽️

PWA para jugar al impostor con futbolistas, cada uno en su móvil. Salas con código de 4 letras, sin cuentas: solo tu nombre.

**547 futbolistas** centrados en lo que conocemos de jugar al FIFA: LaLiga (cracks actuales y leyendas de los 2000), sudamericanos que han pasado por Europa y las estrellas de portada. Cada uno lleva posición, país, trayectoria de clubes y nivel de dificultad.

## Cómo se juega
1. Uno crea la sala y comparte el enlace o el código.
2. El capitán reparte: todos ven la carta del mismo futbolista (con su trayectoria), menos el impostor.
3. Por turnos, en el orden que marca la app, cada uno dice una palabra sin decir el nombre. **El impostor nunca empieza.**
4. Al VAR: se vota en la app. La votación se cierra sola cuando vota todo el mundo.
5. **Última bala:** si pilláis al impostor, aún puede llevarse la ronda eligiendo el futbolista entre 6 opciones muy parecidas.

### Puntos
| Situación | Puntos |
|---|---|
| Votas a un impostor | +1 |
| El impostor se escapa (o hay empate) | +2 para el impostor |
| El impostor es pillado pero acierta el futbolista | +2 para el impostor |

La clasificación se mantiene durante toda la sesión (el capitán puede reiniciarla).

### Ajustes del capitán
- **Bombo:** Todos · LaLiga (han jugado en un equipo español) · Sudamérica
- **Época:** Todas · Actuales · Leyendas
- **Dificultad:** Fácil (solo cracks) · Normal · Friki (todo el catálogo)
- **Impostores:** 1–3 (se ajusta solo si sois pocos)
- **Pista para el impostor:** Nada · Posición · País · Club

### Detalles que ayudan
- No se repiten futbolistas en la misma sala (se guardan los últimos 250).
- Si el capitán se cae, cualquiera puede **tomar el mando** y seguir la partida.
- La pantalla no se apaga mientras estás en una sala.
- Funciona sin conexión una vez cargada (excepto la sincronización, claro).

## Puesta en marcha (gratis, ~10 min)

### 1. Firebase (backend en tiempo real, plan gratuito Spark)
1. Entra en https://console.firebase.google.com → **Crear proyecto** (puedes desactivar Analytics).
2. **Compilación → Authentication → Comenzar → Anónimo → Habilitar.**
3. **Compilación → Realtime Database → Crear base de datos** → ubicación Bélgica (europe-west1) → modo bloqueado.
4. En la pestaña **Reglas**, borra lo que haya, pega el contenido de `database.rules.json` y pulsa **Publicar**.
   ⚠️ Si ya tenías la versión anterior, **vuelve a publicar las reglas**: han cambiado (validación de votos, última oportunidad y relevo de capitán).
5. **⚙ Configuración del proyecto → Tus apps → icono `</>` (Web)** → registra la app → copia el objeto `firebaseConfig` y pégalo en `config.js`.
   - Comprueba que incluye `databaseURL`. Si no aparece, cópiala de la parte de arriba de Realtime Database.

La `apiKey` de Firebase es pública por diseño; lo que protege los datos son las reglas.

### 2. Hosting gratis (elige uno)
**GitHub Pages:** Settings → Pages → Source: Deploy from a branch → `main` / root → Save. En un minuto tienes `https://TU_USUARIO.github.io/impostor/`.

**Netlify Drop:** arrastra la carpeta a https://app.netlify.com/drop.

**Firebase Hosting:** `npx firebase-tools login`, `npx firebase-tools init hosting` (carpeta pública: `.`), `npx firebase-tools deploy`.

### 3. Instalar en el móvil
- **iPhone (Safari):** Compartir → **Añadir a pantalla de inicio**.
- **Android (Chrome):** menú ⋮ → **Instalar aplicación**.

## Archivos
- `index.html`, `styles.css`, `app.js` — la app (JS sin dependencias ni build)
- `players.js` — base de datos de futbolistas. Formato: `Nombre|Posición|País|Época|Nivel|Club1,Club2,…`. Añade líneas para ampliarla.
- `config.js` — tu configuración de Firebase
- `database.rules.json` — reglas de seguridad
- `manifest.webmanifest`, `sw.js`, iconos — PWA

## Estructura de la base de datos
```
rooms/{CODE}        sala pública para los jugadores (estado, ajustes, jugadores, votos, puntos, resultado)
secrets/{CODE}/{uid} la carta de cada jugador: solo la puede leer su dueño
hostdata/{CODE}     quién es el impostor y el historial de futbolistas: solo el capitán
```
El reparto se hace en una sola escritura atómica. Las reglas validan que solo se pueda votar durante la votación, a alguien de la ronda y no a uno mismo; que solo el impostor pillado pueda responder la última oportunidad; y que solo se pueda tomar el mando si el capitán está desconectado. Las salas sin actividad en 24 h se pueden reutilizar.

## Problemas típicos
- *"No se pudo iniciar sesión (auth/operation-not-allowed)"* → no has activado el acceso Anónimo.
- *"Sin permiso"* → no has publicado las reglas (o son las antiguas).
- Se queda en "Calentando…" → revisa `databaseURL` en `config.js`.
- No ves los cambios tras actualizar → cierra y vuelve a abrir la app.
