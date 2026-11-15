import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, remove, onValue, onDisconnect, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./config.js?v=7";
import {
  BY_NAME, POS_LABEL, POOL_OPTS, ERA_OPTS, LEVEL_OPTS, HINT_OPTS, buildPool, isLiga,
} from "./players.js?v=7";

window.__booted = true;
try { sessionStorage.removeItem("imp.repaired"); } catch {}
const $ = document.getElementById("app");
const $toast = document.getElementById("toast");
const configured = !!(firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PEGA"));
const urlCode = (new URLSearchParams(location.search).get("s") || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
const DEF = { impostors: 1, pool: "all", era: "all", level: 2, hint: "random" };

const store = {
  get: (k, d = null) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

const S = {
  uid: null,
  name: store.get("imp.name", ""),
  nameInput: store.get("imp.name", ""),
  codeInput: urlCode,
  code: null,
  room: null,
  secret: null,
  reveal: false,
  busy: false,
  dealing: false,
  connected: false,
  fatal: "",
};
let db, offRoom = null, offSecret = null, toastTimer, wakeLock = null;
let raf = 0, lastHtml = "";

/* ---------- utils ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const genCode = () => Array.from({ length: 4 }, () => pick([..."ABCDEFGHJKLMNPQRSTUVWXYZ"])).join("");
const isHost = () => !!S.room && S.room.host === S.uid;
const settings = () => ({ ...DEF, ...(S.room?.settings || {}) });
const players = () => Object.entries(S.room?.players || {}).filter(([, p]) => p && p.name)
  .sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0));
const onlineIds = () => players().filter(([, p]) => p.online !== false).map(([id]) => id);
const onlineRef = () => ref(db, `rooms/${S.code}/players/${S.uid}/online`);
const roomPath = (p = "") => `rooms/${S.code}${p ? "/" + p : ""}`;
const arr = (x) => (Array.isArray(x) ? x : Object.values(x || {})).filter((v) => v != null); // RTDB puede devolver arrays como objetos
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

function toast(msg) {
  clearTimeout(toastTimer);
  $toast.textContent = msg;
  $toast.hidden = false;
  $toast.classList.remove("show"); void $toast.offsetWidth; $toast.classList.add("show");
  toastTimer = setTimeout(() => { $toast.hidden = true; }, 2600);
}
function errMsg(e) {
  const c = String(e?.code || e?.message || "");
  if (/permission/i.test(c)) return "Sin permiso. ¿Has publicado las reglas de la base de datos?";
  if (/network|offline/i.test(c)) return "Sin conexión";
  return "Algo ha fallado. Prueba otra vez.";
}
const run = (fn) => async (...a) => {
  if (S.busy) return;
  S.busy = true; render();
  try { await fn(...a); } catch (e) { console.error(e); toast(errMsg(e)); }
  finally { S.busy = false; render(); }
};

/* ---------- pantalla encendida mientras se juega ---------- */
async function keepAwake(on) {
  try {
    if (on && !wakeLock && "wakeLock" in navigator && document.visibilityState === "visible") {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch {}
}
document.addEventListener("visibilitychange", () => {
  keepAwake(!!S.code);
  if (document.visibilityState === "visible" && S.code) markOnline();
});

/* ---------- arranque ---------- */
if (configured) {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  db = getDatabase(app);
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      try { await signInAnonymously(auth); }
      catch (e) { S.fatal = `No se pudo iniciar sesión (${e.code}). Activa el acceso Anónimo en Firebase.`; render(); }
      return;
    }
    S.uid = user.uid;
    render();
    onValue(ref(db, ".info/connected"), (snap) => { S.connected = !!snap.val(); if (S.connected && S.code) markOnline(); });
    if (S.name) autoJoin();
  });
}
render();

function autoJoin() {
  const c = urlCode || store.get("imp.room");
  if (c && c.length === 4) run(() => joinRoom(c, true))();
}

/* ---------- ciclo de vida de la sala ---------- */
async function markOnline() {
  if (!S.room?.players?.[S.uid]?.name) return;
  try { await onDisconnect(onlineRef()).set(false); await set(onlineRef(), true); } catch {}
}

async function createRoom() {
  let code = genCode();
  for (let i = 0; i < 10; i++) {
    const snap = await get(ref(db, `rooms/${code}`));
    const r = snap.val();
    if (!r || (r.lastActive && r.lastActive < Date.now() - 86400000)) break; // libre o abandonada
    code = genCode();
  }
  await set(ref(db, `rooms/${code}`), {
    host: S.uid,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    status: "lobby",
    count: 0,
    settings: DEF,
    players: { [S.uid]: { name: S.name, joinedAt: Date.now(), online: true } },
  });
  enterRoom(code);
}

async function joinRoom(code, silent = false) {
  code = code.toUpperCase();
  const snap = await get(ref(db, `rooms/${code}`));
  if (!snap.exists()) {
    store.del("imp.room");
    history.replaceState(null, "", location.pathname);
    if (!silent) toast("Esa sala no existe");
    return;
  }
  const me = snap.val().players?.[S.uid];
  await update(ref(db, `rooms/${code}/players/${S.uid}`), {
    name: S.name, joinedAt: me?.joinedAt || Date.now(), online: true,
  });
  enterRoom(code);
}

function enterRoom(code) {
  S.code = code;
  store.set("imp.room", code);
  history.replaceState(null, "", `${location.pathname}?s=${code}`);
  keepAwake(true);
  offRoom = onValue(ref(db, `rooms/${code}`), (snap) => {
    const r = snap.val();
    if (!r || !r.players?.[S.uid]?.name) { exitLocal(r ? "Te han sacado de la sala" : "La sala se ha cerrado"); return; }
    const first = !S.room;
    const prev = S.room?.status;
    const wasHost = isHost();
    S.room = r;
    // Autocuración de la presencia: el aviso de desconexión de una conexión vieja puede llegar
    // tarde y marcarnos como fuera aunque estemos dentro. Si lo vemos estando conectados, lo corregimos.
    if (first || (S.connected && r.players[S.uid].online === false)) markOnline();
    if (r.status !== prev) { S.reveal = false; window.scrollTo(0, 0); }
    if (r.status === "playing" && prev !== "playing") navigator.vibrate?.([40, 60, 40]);
    if (!first && !wasHost && isHost()) toast("Ahora eres el anfitrión");
    render();
    hostDuties();
  }, () => exitLocal("No se pudo abrir la sala"));
  offSecret = onValue(ref(db, `secrets/${code}/${S.uid}`), (snap) => {
    const s = snap.val();
    if (s?.n !== S.secret?.n) S.reveal = false;
    S.secret = s; render();
  }, () => {});
}

function detach() {
  if (offRoom) offRoom();
  if (offSecret) offSecret();
  offRoom = offSecret = null;
}

function exitLocal(msg) {
  detach();
  if (S.code && db) onDisconnect(onlineRef()).cancel().catch(() => {});
  S.code = null; S.room = null; S.secret = null; S.reveal = false; S.codeInput = "";
  store.del("imp.room");
  history.replaceState(null, "", location.pathname);
  keepAwake(false);
  render();
  if (msg) toast(msg);
}

async function leaveRoom() {
  if (!confirm("¿Salir de la sala?")) return;
  const r = S.room, code = S.code, uid = S.uid;
  detach();
  await onDisconnect(onlineRef()).cancel().catch(() => {});
  const others = players().map(([id]) => id).filter((id) => id !== uid);
  if (r.host === uid) {
    if (!others.length) {
      await remove(ref(db, `secrets/${code}`)).catch(() => {});
      await remove(ref(db, `hostdata/${code}`)).catch(() => {});
      await remove(ref(db, `rooms/${code}`));
    } else {
      const next = others.find((id) => r.players[id].online !== false) || others[0];
      await update(ref(db, `rooms/${code}`), { host: next, [`players/${uid}`]: null });
    }
  } else {
    await update(ref(db, `rooms/${code}`), { [`players/${uid}`]: null });
  }
  exitLocal();
}

/* ---------- partida (lo ejecuta el anfitrión) ---------- */
function recentLocal() {
  try { return JSON.parse(store.get("imp.recent", "[]")) || []; } catch { return []; }
}

/** Pista aleatoria para el impostor: un dato suelto del futbolista. */
function hintFor(fp, mode) {
  if (!mode || mode === "none") return "";
  const pos = { P: "Es portero", D: "Es defensa", M: "Es centrocampista", F: "Es delantero" }[fp.pos];
  const opts = [pos, `Es de ${fp.country}`, fp.era === "l" ? "Es de otra época" : "Juega actualmente"];
  if (fp.country !== "España") opts.push(isLiga(fp) ? "Ha jugado en LaLiga" : "Nunca ha jugado en LaLiga");
  // Un club solo si ha tenido varios; si no, sería regalarle la respuesta.
  if (fp.clubs.length >= 3) opts.push(`Ha pasado por: ${pick(fp.clubs)}`);
  return pick(opts);
}

async function startRound() {
  const r = S.room, code = S.code, st = settings();
  const ids = onlineIds();
  if (ids.length < 3) { toast("Hacen falta al menos 3 jugadores conectados"); return; }
  const k = Math.max(1, Math.min(Number(st.impostors) || 1, Math.floor((ids.length - 1) / 2)));

  // Evita repetir futbolistas: historial de la sala + historial de este móvil.
  const hd = (await get(ref(db, `hostdata/${code}`))).val() || {};
  const list = buildPool(st);
  const used = new Set([...arr(hd.used), ...recentLocal()]);
  const fresh = list.filter((p) => !used.has(p.name));
  const fp = pick(fresh.length ? fresh : list);
  store.set("imp.recent", JSON.stringify([fp.name, ...recentLocal()].slice(0, 200)));

  const imps = shuffle(ids).slice(0, k);
  const n = (r.count || 0) + 1;
  const hint = hintFor(fp, st.hint);

  // Orden de turnos: nunca empieza un impostor (sería injusto).
  let order = shuffle(ids);
  const firstCrew = order.findIndex((id) => !imps.includes(id));
  order = [...order.slice(firstCrew), ...order.slice(0, firstCrew)];

  const secrets = {};
  const roster = {};
  for (const id of ids) {
    roster[id] = r.players[id].name;
    secrets[id] = imps.includes(id) ? { n, role: "impostor", hint, k } : { n, role: "crew", player: fp.name };
  }

  // Una sola escritura atómica: o se reparte todo o nada.
  await update(ref(db), {
    [`hostdata/${code}`]: { impostors: imps, player: fp.name, used: [fp.name, ...arr(hd.used)].slice(0, 250) },
    [`secrets/${code}`]: secrets,
    [`rooms/${code}/status`]: "playing",
    [`rooms/${code}/count`]: n,
    [`rooms/${code}/lastActive`]: serverTimestamp(),
    [`rooms/${code}/result`]: null,
    [`rooms/${code}/round`]: { n, roster, order, k },
  });
}

/** Lo que el anfitrión hace solo: dar carta a quien vuelve (o entra tarde) con la ronda empezada. */
function hostDuties() {
  const r = S.room;
  if (!isHost() || r.status !== "playing" || !r.round?.roster) return;
  const missing = onlineIds().filter((id) => !r.round.roster[id]);
  if (missing.length) dealIn(missing);
}

async function dealIn(ids) {
  if (S.dealing) return;
  S.dealing = true;
  try {
    const r = S.room, code = S.code, n = r.round.n;
    const hd = (await get(ref(db, `hostdata/${code}`))).val();
    if (!hd?.player || S.room?.round?.n !== n) return;
    const order = arr(r.round.order);
    const upd = {};
    for (const id of ids) {
      upd[`secrets/${code}/${id}`] = { n, role: "crew", player: hd.player };
      upd[`rooms/${code}/round/roster/${id}`] = r.players[id].name;
      if (!order.includes(id)) order.push(id);
    }
    upd[`rooms/${code}/round/order`] = order;
    await update(ref(db), upd);
  } catch (e) { console.error(e); }
  finally { S.dealing = false; }
}

async function revealRound() {
  const code = S.code;
  const hd = (await get(ref(db, `hostdata/${code}`))).val() || { impostors: [], player: "?" };
  await update(ref(db, `rooms/${code}`), {
    status: "results",
    lastActive: serverTimestamp(),
    result: { impostors: arr(hd.impostors), player: hd.player },
  });
}

/* ---------- acciones ---------- */
const A = {
  create: run(createRoom),
  leave: run(leaveRoom),
  rename: () => { S.name = ""; render(); },
  set: run(async (d) => {
    if (!isHost()) return;
    const v = d.k === "impostors" || d.k === "level" ? Number(d.v) : d.v;
    await set(ref(db, roomPath(`settings/${d.k}`)), v);
  }),
  kick: run(async (d) => {
    const p = S.room.players[d.v];
    if (!isHost() || !confirm(`¿Sacar a ${p?.name}?`)) return;
    await update(ref(db, roomPath()), { [`players/${d.v}`]: null });
  }),
  start: run(startRound),
  reveal: run(async () => {
    if (!confirm("¿Revelar el futbolista y el impostor?")) return;
    await revealRound();
  }),
  lobby: run(async () => {
    await update(ref(db, roomPath()), { status: "lobby", round: null, result: null });
  }),
  takehost: run(async () => { await set(ref(db, roomPath("host")), S.uid); }),
  flip: () => { S.reveal = !S.reveal; render(); },
  share: async () => {
    const url = `${location.origin}${location.pathname}?s=${S.code}`;
    const text = `Únete a mi sala de Impostor fútbol: ${S.code}`;
    if (navigator.share) { try { await navigator.share({ title: "Impostor · fútbol", text, url }); } catch {} return; }
    try { await navigator.clipboard.writeText(url); toast("Enlace copiado"); } catch { toast(url); }
  },
};

const F = {
  name: (fd) => {
    const n = String(fd.get("n") || "").trim().replace(/\s+/g, " ").slice(0, 16);
    if (!n) return;
    S.name = n; S.nameInput = n;
    store.set("imp.name", n);
    if (S.code) update(ref(db, roomPath(`players/${S.uid}`)), { name: n }).catch(() => {});
    render();
    if (!S.code && S.uid) autoJoin();
  },
  join: (fd) => {
    const c = String(fd.get("c") || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (c.length !== 4) { toast("El código tiene 4 letras"); return; }
    run(() => joinRoom(c))();
  },
};

$.addEventListener("click", (e) => {
  const el = e.target.closest("[data-a]");
  if (!el || el.disabled) return;
  const fn = A[el.dataset.a];
  if (fn) fn(el.dataset, el);
});
$.addEventListener("submit", (e) => {
  e.preventDefault();
  const fn = F[e.target.dataset.f];
  if (fn) fn(new FormData(e.target));
});
$.addEventListener("input", (e) => {
  if (e.target.name === "n") S.nameInput = e.target.value;
  if (e.target.name === "c") {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    S.codeInput = e.target.value;
  }
});

/* ---------- render: un frame como mucho, y solo si cambia algo ---------- */
function render() {
  if (raf) return;
  raf = requestAnimationFrame(draw);
}
function draw() {
  raf = 0;
  let html;
  if (!configured) html = setupView();
  else if (S.fatal) html = msgView(esc(S.fatal));
  else if (!S.uid) html = msgView("Conectando…");
  else if (!S.name) html = nameView();
  else if (!S.code) html = homeView();
  else if (!S.room) html = msgView(`Entrando en ${esc(S.code)}…`);
  else html = ({ lobby: lobbyView, playing: playView, results: resultView }[S.room.status] || lobbyView)();
  if (html === lastHtml) return;
  lastHtml = html;

  const active = document.activeElement;
  const focusName = active && $.contains(active) ? active.name : null;
  $.innerHTML = html;
  if (focusName) {
    const el = $.querySelector(`[name="${focusName}"]`);
    if (el) { el.focus(); const l = el.value.length; el.setSelectionRange?.(l, l); }
  }
}

/* ---------- vistas ---------- */
const brand = () => `<div class="brand"><span class="mark">?</span><span>Impostor</span><span class="dim">fútbol</span></div>`;
const msgView = (m) => `<main class="screen center"><p class="muted center-t">${m}</p></main>`;

function setupView() {
  return `<main class="screen">
    ${brand()}
    <h1 class="title">Falta configurar Firebase</h1>
    <p class="muted">Abre <code>config.js</code> y pega la configuración de tu proyecto de Firebase. Los pasos están en el README.</p>
  </main>`;
}

function nameView() {
  return `<main class="screen">
    ${brand()}
    <div class="grow"></div>
    <form data-f="name" class="stack">
      <label class="lbl" for="n">¿Cómo te llamas?</label>
      <input id="n" name="n" maxlength="16" autocomplete="nickname" enterkeyhint="go" placeholder="Tu nombre" value="${esc(S.nameInput)}" required autofocus>
      <button class="btn primary">Entrar</button>
    </form>
    <p class="foot">Sin contraseñas. El nombre se queda guardado en este móvil.</p>
  </main>`;
}

function homeView() {
  return `<main class="screen">
    <header class="bar">${brand()}<button class="link" data-a="rename">${esc(S.name)} · cambiar</button></header>
    <div class="grow"></div>
    <button class="btn primary big" data-a="create" ${S.busy ? "disabled" : ""}>Crear sala</button>
    <div class="or"><span>o únete con un código</span></div>
    <form data-f="join" class="row">
      <input name="c" class="code-in" maxlength="4" placeholder="ABCD" autocapitalize="characters" autocomplete="off" spellcheck="false" enterkeyhint="go" value="${esc(S.codeInput)}" aria-label="Código de sala">
      <button class="btn" ${S.busy ? "disabled" : ""}>Unirse</button>
    </form>
    <div class="grow"></div>
    <ol class="how">
      <li>Uno crea la sala y comparte el código.</li>
      <li>Todos reciben el mismo futbolista, menos el impostor.</li>
      <li>Por turnos, cada uno da una pista sin decir el nombre.</li>
      <li>Votad en voz alta quién está fingiendo y revelad.</li>
    </ol>
  </main>`;
}

function seg(key, opts, cur) {
  const h = isHost();
  return `<div class="seg">${opts.map(([v, l]) =>
    `<button data-a="set" data-k="${key}" data-v="${v}" class="${String(cur) === String(v) ? "on" : ""}" ${h ? "" : "disabled"}>${l}</button>`).join("")}</div>`;
}

function hostBanner() {
  const r = S.room;
  const hostP = r.players?.[r.host];
  if (isHost() || (hostP && hostP.online !== false)) return "";
  return `<div class="banner"><span>${esc(hostP?.name || "El anfitrión")} se ha desconectado</span><button class="btn small" data-a="takehost" ${S.busy ? "disabled" : ""}>Ser anfitrión</button></div>`;
}

function roomBar(label) {
  return `<header class="bar"><button class="link" data-a="leave">← Salir</button><span class="muted small">${label}</span><button class="link code-tag" data-a="share">${esc(S.code)}</button></header>${hostBanner()}`;
}

function lobbyView() {
  const r = S.room, ps = players(), st = settings();
  const online = ps.filter(([, p]) => p.online !== false).length;
  const hostName = r.players[r.host]?.name || "el anfitrión";
  const poolSize = buildPool(st).length;
  return `<main class="screen">
    ${roomBar("Sala")}
    <button class="code-big" data-a="share" aria-label="Compartir código">${esc(S.code)}</button>
    <button class="btn ghost small center-self" data-a="share">Compartir enlace</button>

    <h2 class="sec">Jugadores <span class="muted">${online}</span></h2>
    <ul class="list">${ps.map(([id, p]) => `
      <li>
        <span class="dot ${p.online === false ? "off" : ""}"></span>
        <span class="pname">${esc(p.name)}${id === S.uid ? ' <span class="muted">(tú)</span>' : ""}</span>
        ${id === r.host ? '<span class="tag">anfitrión</span>' : ""}
        ${isHost() && id !== S.uid ? `<button class="x" data-a="kick" data-v="${id}" aria-label="Sacar">×</button>` : ""}
      </li>`).join("")}
    </ul>


    <h2 class="sec">Ajustes ${isHost() ? "" : '<span class="muted small">· los cambia el anfitrión</span>'}</h2>
    <div class="setting"><span class="lbl">Futbolistas</span>${seg("pool", POOL_OPTS, st.pool)}</div>
    <div class="setting"><span class="lbl">Época</span>${seg("era", ERA_OPTS, st.era)}</div>
    <div class="setting"><span class="lbl">Dificultad</span>${seg("level", LEVEL_OPTS, st.level)}</div>
    <div class="setting"><span class="lbl">Impostores</span>${seg("impostors", [[1, "1"], [2, "2"], [3, "3"]], st.impostors)}</div>
    <div class="setting"><span class="lbl">Pista al impostor</span>${seg("hint", HINT_OPTS, st.hint === "none" ? "none" : "random")}</div>
    <p class="foot">${poolSize} futbolistas en el bombo${st.hint !== "none" ? " · el impostor recibe un dato al azar (posición, país, un club…)" : ""}${st.impostors > 1 ? " · con pocos jugadores se reduce el número de impostores" : ""}</p>

    <div class="sticky">
      ${isHost()
        ? `<button class="btn primary big" data-a="start" ${online < 3 || S.busy ? "disabled" : ""}>${online < 3 ? `Faltan ${3 - online} para empezar` : "Repartir cartas"}</button>`
        : `<p class="wait">Esperando a que ${esc(hostName)} reparta…</p>`}
    </div>
  </main>`;
}

function card() {
  const s = S.secret;
  if (!s || s.n !== S.room.round?.n) return `<div class="card"><p class="muted">Repartiendo…</p></div>`;
  if (!S.reveal) return `<button class="card closed" data-a="flip"><span class="card-q">?</span><span class="muted">Toca para ver tu carta</span></button>`;
  if (s.role === "impostor") {
    return `<button class="card open imp" data-a="flip">
      <span class="card-k">Eres el</span>
      <span class="card-name">Impostor</span>
      <span class="card-sub">${s.hint ? `Pista: ${esc(s.hint)}` : "Sin pista. Disimula."}</span>
      ${s.k > 1 ? `<span class="card-sub dim">Hay ${s.k} impostores</span>` : ""}
      <span class="card-hide">Toca para ocultar</span>
    </button>`;
  }
  const p = BY_NAME.get(s.player);
  return `<button class="card open" data-a="flip">
    <span class="card-k">Tu futbolista</span>
    <span class="card-name">${esc(s.player)}</span>
    ${p ? `<span class="card-sub dim">${POS_LABEL[p.pos]} · ${esc(p.country)}</span><span class="card-clubs">${p.clubs.map(esc).join(" · ")}</span>` : ""}
    <span class="card-hide">Toca para ocultar</span>
  </button>`;
}

const isHostOnline = () => S.room.players?.[S.room.host]?.online !== false;
const inRound = () => !!S.room.round?.roster?.[S.uid];

function turnOrder() {
  const r = S.room.round;
  const order = (r.order ? arr(r.order) : Object.keys(r.roster)).filter((id) => r.roster[id]);
  return `<p class="starter">Empieza <b>${esc(r.roster[order[0]])}</b></p>
    <p class="order muted small">${order.map((id) => id === S.uid ? `<b>${esc(r.roster[id])}</b>` : esc(r.roster[id])).join(" → ")}</p>`;
}

function waitingView(title, sub) {
  return `<main class="screen">${roomBar("Sala")}<div class="grow"></div><h1 class="title center-t">${title}</h1><p class="muted center-t">${sub}</p><div class="grow"></div></main>`;
}

function playView() {
  const r = S.room;
  if (!inRound()) return waitingView("Ronda en curso", isHostOnline() ? "Te están repartiendo carta…" : "Entrarás en la siguiente ronda.");
  return `<main class="screen">
    ${roomBar(`Ronda ${r.round.n}`)}
    ${card()}
    ${turnOrder()}
    <p class="foot">Por turnos, cada uno dice una palabra sobre su futbolista. El impostor no lo sabe: tiene que pillarlo sobre la marcha. Al final, votad en voz alta.</p>
    <div class="sticky">
      ${isHost()
        ? `<button class="btn primary big" data-a="reveal" ${S.busy ? "disabled" : ""}>Revelar</button>`
        : `<p class="wait">Cuando hayáis votado, el anfitrión revela quién era.</p>`}
    </div>
  </main>`;
}

function resultView() {
  const r = S.room, res = r.result || {}, roster = r.round?.roster || {};
  const imps = arr(res.impostors);
  const impNames = imps.map((id) => roster[id] || "?");
  const iWasImp = imps.includes(S.uid);
  const p = BY_NAME.get(res.player);
  return `<main class="screen">
    ${roomBar(`Ronda ${r.round?.n ?? ""}`)}
    <div class="grow"></div>
    <div class="reveal-box">
      <span class="card-k">El futbolista era</span>
      <span class="card-name">${esc(res.player)}</span>
      ${p ? `<span class="muted small">${p.clubs.map(esc).join(" · ")}</span>` : ""}
      <span class="card-k">${imps.length > 1 ? "Impostores" : "Impostor"}</span>
      <span class="imp-name">${impNames.map(esc).join(", ")}${iWasImp ? ' <span class="muted">(tú)</span>' : ""}</span>
    </div>
    <div class="grow"></div>
    <div class="sticky">
      ${isHost()
        ? `<div class="row"><button class="btn" data-a="lobby" ${S.busy ? "disabled" : ""}>Ajustes</button><button class="btn primary grow1" data-a="start" ${S.busy ? "disabled" : ""}>Otra ronda</button></div>`
        : `<p class="wait">Esperando la siguiente ronda…</p>`}
    </div>
  </main>`;
}
