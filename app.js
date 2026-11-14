import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, remove, onValue, onDisconnect, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./config.js?v=3";
import {
  PLAYERS, BY_NAME, POS_LABEL, POS_SHORT, POOL_OPTS, ERA_OPTS, LEVEL_OPTS, HINT_OPTS, buildPool, decoys, flag,
} from "./players.js?v=3";

window.__booted = true;
try { sessionStorage.removeItem("imp.repaired"); } catch {}
const $ = document.getElementById("app");
const $toast = document.getElementById("toast");
const configured = !!(firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PEGA"));
const urlCode = (new URLSearchParams(location.search).get("s") || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
const DEF = { impostors: 1, pool: "all", era: "all", level: 2, hint: "none" };

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
  flipAnim: false,
  busy: false,
  finishing: false,
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
const hue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const avatar = (name) => `<span class="av" style="--h:${hue(name)}">${esc(String(name || "?").trim().charAt(0).toUpperCase())}</span>`;
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
      await update(ref(db, `rooms/${code}`), { host: next, [`players/${uid}`]: null, [`votes/${uid}`]: null });
    }
  } else {
    await update(ref(db, `rooms/${code}`), { [`players/${uid}`]: null });
    await remove(ref(db, `rooms/${code}/votes/${uid}`)).catch(() => {});
  }
  exitLocal();
}

/* ---------- partida (lo ejecuta el anfitrión) ---------- */
function recentLocal() {
  try { return JSON.parse(store.get("imp.recent", "[]")) || []; } catch { return []; }
}

function hintFor(fp, mode) {
  if (mode === "pos") return POS_LABEL[fp.pos];
  if (mode === "country") return `${flag(fp.country)} ${fp.country}`;
  if (mode === "club") return pick(fp.clubs);
  return "";
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
    [`rooms/${code}/votes`]: null,
    [`rooms/${code}/result`]: null,
    [`rooms/${code}/guess`]: null,
    [`rooms/${code}/guessPick`]: null,
    [`rooms/${code}/round`]: { n, roster, order, k },
  });
}

function tallyVotes(r) {
  const roster = r.round?.roster || {};
  const tally = {};
  Object.keys(roster).forEach((id) => (tally[id] = 0));
  Object.entries(r.votes || {}).forEach(([voter, target]) => {
    if (roster[voter] && target in tally && voter !== target) tally[target]++;
  });
  const max = Math.max(0, ...Object.values(tally));
  const tops = Object.keys(tally).filter((id) => max > 0 && tally[id] === max);
  return { tally, top: tops.length === 1 ? tops[0] : null, tied: tops.length > 1 };
}

/** Lo que el anfitrión hace solo, sin que nadie pulse nada. */
function hostDuties() {
  const r = S.room;
  if (!isHost() || S.finishing) return;
  if ((r.status === "playing" || r.status === "voting") && r.round?.roster) {
    // Quien vuelve a la app (o entra tarde) con la ronda empezada recibe carta de futbolista.
    const missing = onlineIds().filter((id) => !r.round.roster[id]);
    if (missing.length) { dealIn(missing); return; }
  }
  if (r.status === "voting") {
    const roster = Object.keys(r.round?.roster || {});
    const active = roster.filter((id) => r.players?.[id]?.name && r.players[id].online !== false);
    if (active.length && active.every((id) => r.votes?.[id])) closeVoting();
  } else if (r.status === "guess" && r.guessPick) {
    finish(r.guessPick);
  }
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

async function closeVoting() {
  if (S.finishing) return;
  S.finishing = true;
  try {
    const r = S.room, code = S.code;
    const { top } = tallyVotes(r);
    const hd = (await get(ref(db, `hostdata/${code}`))).val() || { impostors: [], player: "?" };
    if (top && arr(hd.impostors).includes(top) && BY_NAME.has(hd.player)) {
      // Pillado: última oportunidad para adivinar el futbolista.
      const options = shuffle([hd.player, ...decoys(BY_NAME.get(hd.player), 5)]);
      await update(ref(db, `rooms/${code}`), { status: "guess", guess: { by: top, options }, guessPick: null });
    } else {
      S.finishing = false;
      await finish(null, hd);
    }
  } catch (e) { console.error(e); toast(errMsg(e)); }
  finally { S.finishing = false; }
}

async function finish(guessPick, hdIn) {
  if (S.finishing && !hdIn) return;
  S.finishing = true;
  try {
    const r = S.room, code = S.code;
    const hd = hdIn || (await get(ref(db, `hostdata/${code}`))).val() || { impostors: [], player: "?" };
    const roster = r.round?.roster || {};
    const imps = arr(hd.impostors);
    const { tally, top, tied } = tallyVotes(r);
    const caught = !!top && imps.includes(top);
    const guessOk = caught && guessPick === hd.player;

    // Puntos: +1 a quien vota a un impostor · +2 al impostor que escapa o que adivina el futbolista.
    const delta = {};
    Object.keys(roster).forEach((id) => (delta[id] = 0));
    Object.entries(r.votes || {}).forEach(([voter, target]) => {
      if (roster[voter] && !imps.includes(voter) && imps.includes(target)) delta[voter] += 1;
    });
    imps.forEach((id) => { if (id in delta && (id !== top || guessOk)) delta[id] += 2; });

    const winner = !caught ? "imp" : guessOk ? "steal" : "crew";
    const upd = {
      status: "results",
      guess: null,
      lastActive: serverTimestamp(),
      result: {
        tally, top, tied, caught, winner, delta,
        votes: r.votes || {},
        impostors: imps, player: hd.player,
        guessPick: caught ? (guessPick || "") : "",
      },
    };
    for (const [id, d] of Object.entries(delta)) {
      const prev = r.scores?.[id]?.pts || 0;
      upd[`scores/${id}`] = { name: roster[id], pts: prev + d };
    }
    await update(ref(db, `rooms/${code}`), upd);
  } catch (e) { console.error(e); toast(errMsg(e)); }
  finally { S.finishing = false; }
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
    await update(ref(db, roomPath()), { [`players/${d.v}`]: null, [`votes/${d.v}`]: null });
  }),
  start: run(startRound),
  vote: run(async (d) => {
    if (S.room.votes?.[S.uid] === d.v) return;
    await set(ref(db, roomPath(`votes/${S.uid}`)), d.v);
    navigator.vibrate?.(20);
  }),
  tovote: run(async () => { await update(ref(db, roomPath()), { status: "voting", votes: null }); }),
  close: run(closeVoting),
  guess: run(async (d) => {
    if (S.room.guess?.by !== S.uid) return;
    if (!confirm(`¿Seguro que era ${d.v}?`)) return;
    await set(ref(db, roomPath("guessPick")), d.v);
  }),
  skipguess: run(async () => {
    if (!confirm("¿Dar por fallada la última oportunidad?")) return;
    await finish("");
  }),
  lobby: run(async () => {
    await update(ref(db, roomPath()), { status: "lobby", round: null, votes: null, result: null, guess: null, guessPick: null });
  }),
  resetscores: run(async () => {
    if (!confirm("¿Poner la clasificación a cero?")) return;
    await set(ref(db, roomPath("scores")), null);
  }),
  takehost: run(async () => { await set(ref(db, roomPath("host")), S.uid); }),
  flip: () => { S.reveal = !S.reveal; S.flipAnim = S.reveal; if (S.reveal) navigator.vibrate?.(15); render(); },
  share: async () => {
    const url = `${location.origin}${location.pathname}?s=${S.code}`;
    const text = `Únete a mi sala de Impostor Fútbol: ${S.code}`;
    if (navigator.share) { try { await navigator.share({ title: "Impostor Fútbol", text, url }); } catch {} return; }
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
  else if (!S.uid) html = msgView("Calentando…", true);
  else if (!S.name) html = nameView();
  else if (!S.code) html = homeView();
  else if (!S.room) html = msgView(`Entrando en ${esc(S.code)}…`, true);
  else html = ({ lobby: lobbyView, playing: playView, voting: voteView, guess: guessView, results: resultView }[S.room.status] || lobbyView)();
  S.flipAnim = false;
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
const brand = (big = false) => `<div class="brand ${big ? "big" : ""}"><span class="mark" aria-hidden="true">?</span><span class="brand-t">Impostor<b>Fútbol</b></span></div>`;
const msgView = (m, spin = false) => `<main class="screen center">${spin ? '<div class="ball" aria-hidden="true"></div>' : ""}<p class="muted center-t">${m}</p></main>`;

function setupView() {
  return `<main class="screen">
    ${brand()}
    <h1 class="title">Falta configurar Firebase</h1>
    <p class="muted">Abre <code>config.js</code> y pega la configuración de tu proyecto de Firebase. Los pasos están en el README.</p>
  </main>`;
}

function nameView() {
  return `<main class="screen hero">
    ${brand(true)}
    <p class="tagline">Todos saben quién es el futbolista.<br>Menos uno.</p>
    <div class="grow"></div>
    <form data-f="name" class="stack">
      <label class="lbl" for="n">¿Cómo te llamas?</label>
      <input id="n" name="n" maxlength="16" autocomplete="nickname" enterkeyhint="go" placeholder="Tu nombre" value="${esc(S.nameInput)}" required autofocus>
      <button class="btn primary big">Saltar al campo</button>
    </form>
    <p class="foot center-t">Sin cuentas ni contraseñas. El nombre se guarda en este móvil.</p>
  </main>`;
}

function homeView() {
  return `<main class="screen hero">
    <header class="bar">${brand()}<button class="chip" data-a="rename">${avatar(S.name)}${esc(S.name)}</button></header>
    <div class="grow"></div>
    <button class="btn primary big" data-a="create" ${S.busy ? "disabled" : ""}>Crear sala</button>
    <div class="or"><span>o únete con código</span></div>
    <form data-f="join" class="row">
      <input name="c" class="code-in" maxlength="4" placeholder="ABCD" autocapitalize="characters" autocomplete="off" spellcheck="false" enterkeyhint="go" value="${esc(S.codeInput)}" aria-label="Código de sala">
      <button class="btn" ${S.busy ? "disabled" : ""}>Entrar</button>
    </form>
    <div class="grow"></div>
    <ol class="how">
      <li><b>Reparto.</b> Todos ven el mismo futbolista, menos el impostor.</li>
      <li><b>Pistas.</b> Por turnos, una palabra cada uno sin decir el nombre.</li>
      <li><b>VAR.</b> Votad quién está fingiendo.</li>
      <li><b>Última bala.</b> Si pilláis al impostor, aún puede robaros la ronda adivinando el futbolista.</li>
    </ol>
    <p class="foot center-t">${PLAYERS.length} futbolistas · LaLiga, Sudamérica y leyendas</p>
  </main>`;
}

function seg(key, opts, cur) {
  const h = isHost();
  return `<div class="seg" role="group">${opts.map(([v, l]) =>
    `<button data-a="set" data-k="${key}" data-v="${v}" class="${String(cur) === String(v) ? "on" : ""}" ${h ? "" : "disabled"} aria-pressed="${String(cur) === String(v)}">${l}</button>`).join("")}</div>`;
}

function hostBanner() {
  const r = S.room;
  const hostP = r.players?.[r.host];
  if (isHost() || (hostP && hostP.online !== false)) return "";
  return `<div class="banner"><span>${esc(hostP?.name || "El anfitrión")} se ha desconectado</span><button class="btn small" data-a="takehost" ${S.busy ? "disabled" : ""}>Tomar el mando</button></div>`;
}

function roomBar(label) {
  return `<header class="bar">
    <button class="link" data-a="leave" aria-label="Salir de la sala">← Salir</button>
    <span class="bar-mid">${label}</span>
    <button class="code-tag" data-a="share" aria-label="Compartir sala">${esc(S.code)}</button>
  </header>${hostBanner()}`;
}

function ranking(compact = false) {
  const sc = Object.entries(S.room.scores || {}).filter(([, s]) => s && s.name).sort((a, b) => b[1].pts - a[1].pts);
  if (!sc.length) return "";
  const delta = S.room.status === "results" ? S.room.result?.delta || {} : {};
  const medal = ["🥇", "🥈", "🥉"];
  return `<h2 class="sec">Clasificación ${isHost() && !compact ? '<button class="link tiny" data-a="resetscores">reiniciar</button>' : ""}</h2>
  <ol class="list rank">${sc.map(([id, s], i) => `
    <li class="${id === S.uid ? "me" : ""}">
      <span class="pos">${medal[i] && s.pts > 0 ? medal[i] : i + 1}</span>
      <span class="pname">${esc(s.name)}</span>
      ${delta[id] ? `<span class="plus">+${delta[id]}</span>` : ""}
      <span class="pts">${s.pts}</span>
    </li>`).join("")}
  </ol>`;
}

function lobbyView() {
  const r = S.room, ps = players(), st = settings();
  const online = ps.filter(([, p]) => p.online !== false).length;
  const hostName = r.players[r.host]?.name || "el anfitrión";
  const poolSize = buildPool(st).length;
  const kEff = Math.max(1, Math.min(st.impostors, Math.floor((online - 1) / 2)));
  return `<main class="screen">
    ${roomBar("Vestuario")}
    <section class="code-box">
      <span class="lbl">Código de sala</span>
      <button class="code-big" data-a="share" aria-label="Compartir código">${[...S.code].map((c) => `<span>${c}</span>`).join("")}</button>
      <button class="btn ghost small" data-a="share">Invitar a la peña</button>
    </section>

    <h2 class="sec">Convocados <span class="badge">${online}</span></h2>
    <ul class="list">${ps.map(([id, p]) => `
      <li class="${p.online === false ? "off" : ""}">
        ${avatar(p.name)}
        <span class="pname">${esc(p.name)}${id === S.uid ? ' <span class="muted">(tú)</span>' : ""}</span>
        ${id === r.host ? '<span class="tag">capitán</span>' : ""}
        ${p.online === false ? '<span class="tag dim">fuera</span>' : ""}
        ${isHost() && id !== S.uid ? `<button class="x" data-a="kick" data-v="${id}" aria-label="Sacar a ${esc(p.name)}">×</button>` : ""}
      </li>`).join("")}
    </ul>

    ${ranking()}

    <h2 class="sec">Ajustes ${isHost() ? "" : '<span class="muted small">· los toca el capitán</span>'}</h2>
    <div class="setting"><span class="lbl">Bombo</span>${seg("pool", POOL_OPTS, st.pool)}</div>
    <div class="setting"><span class="lbl">Época</span>${seg("era", ERA_OPTS, st.era)}</div>
    <div class="setting"><span class="lbl">Dificultad</span>${seg("level", LEVEL_OPTS, st.level)}</div>
    <div class="setting"><span class="lbl">Impostores</span>${seg("impostors", [[1, "1"], [2, "2"], [3, "3"]], st.impostors)}</div>
    <div class="setting"><span class="lbl">Pista para el impostor</span>${seg("hint", HINT_OPTS, st.hint)}</div>
    <p class="foot"><b>${poolSize}</b> futbolistas en el bombo${st.impostors > 1 && online >= 3 && kEff < st.impostors ? ` · con ${online} jugadores habrá ${plural(kEff, "impostor", "impostores")}` : ""}</p>

    <div class="sticky">
      ${isHost()
        ? `<button class="btn primary big" data-a="start" ${online < 3 || S.busy ? "disabled" : ""}>${online < 3 ? `Faltan ${3 - online} para empezar` : "Repartir cartas"}</button>`
        : `<p class="wait"><span class="pulse"></span>Esperando a que ${esc(hostName)} reparta…</p>`}
    </div>
  </main>`;
}

function fifaCard(name, opts = {}) {
  const p = BY_NAME.get(name);
  const anim = opts.anim ? " anim" : "";
  const tag = opts.button ? "button" : "div";
  const act = opts.button ? ' data-a="flip"' : "";
  if (!p) {
    return `<${tag} class="fut${anim}"${act}><span class="fut-k">${opts.kicker || "Tu futbolista"}</span><span class="fut-name solo">${esc(name)}</span>${opts.foot || ""}</${tag}>`;
  }
  const tier = p.era === "l" ? "icon" : p.lvl === 1 ? "gold" : "silver";
  return `<${tag} class="fut ${tier}${anim}"${act} aria-label="${esc(p.name)}">
    <span class="fut-top">
      <span class="fut-pos">${POS_SHORT[p.pos]}</span>
      <span class="fut-flag" title="${esc(p.country)}">${flag(p.country)}</span>
      <span class="fut-era">${p.era === "l" ? "LEYENDA" : "EN ACTIVO"}</span>
    </span>
    <span class="fut-k">${opts.kicker || "Tu futbolista"}</span>
    <span class="fut-name">${esc(p.name)}</span>
    <span class="fut-meta">${POS_LABEL[p.pos]} · ${esc(p.country)}</span>
    <span class="fut-clubs">${p.clubs.map((c) => `<i>${esc(c)}</i>`).join("")}</span>
    ${opts.foot || ""}
  </${tag}>`;
}

function card() {
  const s = S.secret;
  if (!s || s.n !== S.room.round?.n) return `<div class="card closed"><div class="ball" aria-hidden="true"></div><span class="muted">Repartiendo…</span></div>`;
  if (!S.reveal) {
    return `<button class="card closed" data-a="flip" aria-label="Ver mi carta">
      <span class="card-back" aria-hidden="true">?</span>
      <span class="card-tap">Toca para ver tu carta</span>
      <span class="card-warn">Que no te la vea nadie</span>
    </button>`;
  }
  if (s.role === "impostor") {
    return `<button class="card imp${S.flipAnim ? " anim" : ""}" data-a="flip">
      <span class="card-k">Eres el</span>
      <span class="card-imp">IMPOSTOR</span>
      <span class="card-sub">${s.hint ? `Pista: <b>${esc(s.hint)}</b>` : "Sin pista. Escucha y disimula."}</span>
      ${s.k > 1 ? `<span class="card-sub dim">Hay ${s.k} impostores en el campo</span>` : ""}
      <span class="card-hide">Toca para ocultar</span>
    </button>`;
  }
  return fifaCard(s.player, { button: true, anim: S.flipAnim, foot: '<span class="card-hide">Toca para ocultar</span>' });
}

const isHostOnline = () => S.room.players?.[S.room.host]?.online !== false;
const inRound = () => !!S.room.round?.roster?.[S.uid];

function turnOrder() {
  const r = S.room.round;
  const order = (r.order ? arr(r.order) : Object.keys(r.roster)).filter((id) => r.roster[id]);
  return `<div class="turns"><span class="lbl">Orden de pistas</span><ol>${order.map((id, i) =>
    `<li class="${id === S.uid ? "me" : ""}"><span class="n">${i + 1}</span>${esc(r.roster[id])}</li>`).join("")}</ol></div>`;
}

function waitingView(title, sub) {
  return `<main class="screen">${roomBar("Sala")}<div class="grow"></div><div class="ball" aria-hidden="true"></div><h1 class="title center-t">${title}</h1><p class="muted center-t">${sub}</p><div class="grow"></div></main>`;
}

function playView() {
  const r = S.room;
  if (!inRound()) return waitingView("Partido en juego", isHostOnline() ? "Te están dando carta…" : "Entras en la siguiente ronda.");
  return `<main class="screen">
    ${roomBar(`Ronda ${r.round.n}`)}
    ${card()}
    ${turnOrder()}
    <p class="foot">Una palabra por turno sobre el futbolista. Dad un par de vueltas y luego al VAR.</p>
    <div class="sticky">
      ${isHost()
        ? `<button class="btn primary big" data-a="tovote" ${S.busy ? "disabled" : ""}>Al VAR: votar</button>`
        : `<p class="wait">El capitán abrirá la votación cuando acabéis.</p>`}
    </div>
  </main>`;
}

function voteView() {
  const r = S.room;
  if (!inRound()) return waitingView("Revisión en el VAR", isHostOnline() ? "Te están dando carta…" : "Entras en la siguiente ronda.");
  const roster = Object.entries(r.round.roster);
  const votes = r.votes || {};
  const mine = votes[S.uid];
  const done = roster.filter(([id]) => votes[id]).length;
  return `<main class="screen">
    ${roomBar(`Ronda ${r.round.n}`)}
    <h1 class="title">¿Quién es el impostor?</h1>
    <div class="progress" style="--p:${roster.length ? done / roster.length : 0}"><span></span></div>
    <p class="muted small">${done} de ${roster.length} han votado${mine ? " · puedes cambiar tu voto" : ""}</p>
    <ul class="votes">${roster.filter(([id]) => id !== S.uid).map(([id, name]) => `
      <li><button class="vote ${mine === id ? "on" : ""}" data-a="vote" data-v="${id}" aria-pressed="${mine === id}">
        ${avatar(name)}
        <span class="pname">${esc(name)}</span>
        ${votes[id] ? '<span class="tick" title="Ya ha votado">✓</span>' : '<span class="tick wait-dot" title="Pensando">…</span>'}
      </button></li>`).join("")}
    </ul>
    <button class="btn ghost small center-self" data-a="flip">${S.reveal ? "Ocultar mi carta" : "Ver mi carta otra vez"}</button>
    ${S.reveal ? card() : ""}
    <div class="sticky">
      ${isHost()
        ? `<button class="btn ${done === roster.length ? "primary" : ""} big" data-a="close" ${S.busy ? "disabled" : ""}>${done < roster.length ? `Cerrar votación (${done}/${roster.length})` : "Ver resultado"}</button>`
        : `<p class="wait">Se resuelve cuando vote todo el mundo.</p>`}
    </div>
  </main>`;
}

function guessView() {
  const r = S.room, g = r.guess || {}, roster = r.round?.roster || {};
  const me = g.by === S.uid;
  const who = esc(roster[g.by] || "el impostor");
  return `<main class="screen">
    ${roomBar(`Ronda ${r.round?.n ?? ""}`)}
    <div class="verdict win">${me ? "¡Te han pillado!" : `¡Pillado ${who}!`}</div>
    <p class="center-t">${me
      ? "Última bala: si aciertas el futbolista, te llevas la ronda."
      : `Pero aún puede robaros la ronda si adivina el futbolista…`}</p>
    <div class="guess-grid">${arr(g.options).map((o) => {
      const p = BY_NAME.get(o);
      return `<button class="guess ${r.guessPick === o ? "on" : ""}" data-a="guess" data-v="${esc(o)}" ${me && !S.busy ? "" : "disabled"}>
        <span class="g-flag">${p ? flag(p.country) : ""}</span><span class="g-name">${esc(o)}</span>
        ${p ? `<span class="g-meta">${POS_SHORT[p.pos]} · ${esc(p.clubs[p.clubs.length - 1] || "")}</span>` : ""}
      </button>`;
    }).join("")}</div>
    <div class="sticky">
      ${me ? '<p class="wait">Elige bien. Solo tienes una.</p>'
        : isHost() ? `<p class="wait"><span class="pulse"></span>${who} está pensando…</p><button class="link center-self block" data-a="skipguess">Saltar (no contesta)</button>`
        : `<p class="wait"><span class="pulse"></span>${who} está pensando…</p>`}
    </div>
  </main>`;
}

function resultView() {
  const r = S.room, res = r.result || {}, roster = r.round?.roster || {};
  const imps = arr(res.impostors);
  const impNames = imps.map((id) => roster[id] || "?");
  const tally = Object.entries(res.tally || {}).sort((a, b) => b[1] - a[1]);
  const votersOf = (id) => Object.entries(res.votes || {}).filter(([, t]) => t === id).map(([v]) => roster[v]).filter(Boolean);
  const iWasImp = imps.includes(S.uid);
  const myDelta = res.delta?.[S.uid] || 0;
  const V = {
    crew: ["¡Pillado!", "Gana el equipo", "win"],
    steal: ["¡Robo!", `${esc(roster[res.top] || "El impostor")} acertó el futbolista`, "steal"],
    imp: [res.tied ? "Empate en el VAR" : "Se escapa", imps.length > 1 ? "Ganan los impostores" : "Gana el impostor", "lose"],
  }[res.winner || (res.caught ? "crew" : "imp")];
  return `<main class="screen">
    ${roomBar(`Ronda ${r.round?.n ?? ""}`)}
    <div class="verdict ${V[2]}">${V[0]}</div>
    <p class="center-t muted">${V[1]}${myDelta ? ` · <b class="plus">+${myDelta}</b> para ti` : ""}</p>
    ${fifaCard(res.player, { kicker: "El futbolista era" })}
    <div class="reveal-box">
      <span class="lbl">${imps.length > 1 ? "Impostores" : "Impostor"}</span>
      <span class="imp-name">${impNames.map(esc).join(" y ")}${iWasImp ? ' <span class="muted">(tú)</span>' : ""}</span>
      ${res.caught && res.guessPick !== undefined ? `<span class="small muted">Su apuesta: <b class="${res.winner === "steal" ? "ok" : "ko"}">${esc(res.guessPick || "no contestó")}</b></span>` : ""}
    </div>
    <h2 class="sec">Votos</h2>
    <ul class="list">${tally.map(([id, n]) => `
      <li>
        ${avatar(roster[id] || "?")}
        <span class="pname">${esc(roster[id] || "?")}${imps.includes(id) ? ' <span class="tag red">impostor</span>' : ""}<span class="voters">${votersOf(id).map(esc).join(", ")}</span></span>
        <span class="count">${n}</span>
      </li>`).join("")}
    </ul>
    ${ranking(true)}
    <div class="sticky">
      ${isHost()
        ? `<div class="row"><button class="btn" data-a="lobby" ${S.busy ? "disabled" : ""}>Ajustes</button><button class="btn primary grow1" data-a="start" ${S.busy ? "disabled" : ""}>Otra ronda</button></div>`
        : `<p class="wait"><span class="pulse"></span>Esperando la siguiente ronda…</p>`}
    </div>
  </main>`;
}
