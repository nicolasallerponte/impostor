import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, remove, onValue, onDisconnect, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./config.js";
import { POS_LABEL, POOLS } from "./players.js";

const $ = document.getElementById("app");
const configured = !!(firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PEGA"));
const urlCode = (new URLSearchParams(location.search).get("s") || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);

const S = {
  uid: null,
  name: localStorage.getItem("imp.name") || "",
  nameInput: localStorage.getItem("imp.name") || "",
  codeInput: urlCode,
  code: null,
  room: null,
  secret: null,
  reveal: false,
  toast: "",
  busy: false,
  revealing: false,
  fatal: "",
};
let db, offRoom = null, offSecret = null, toastTimer;

/* ---------- utils ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const genCode = () => Array.from({ length: 4 }, () => pick([..."ABCDEFGHJKLMNPQRSTUVWXYZ"])).join("");
const isHost = () => S.room && S.room.host === S.uid;
const players = () => Object.entries(S.room?.players || {}).filter(([, p]) => p && p.name)
  .sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0));
const onlineRef = () => ref(db, `rooms/${S.code}/players/${S.uid}/online`);

function toast(msg) {
  S.toast = msg; render();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { S.toast = ""; render(); }, 2600);
}
function errMsg(e) {
  const c = e?.code || "";
  if (c.includes("PERMISSION_DENIED") || c.includes("permission")) return "Sin permiso. ¿Has pegado las reglas de la base de datos?";
  if (c.includes("network")) return "Sin conexión";
  return "Algo ha fallado. Prueba otra vez.";
}
const run = (fn) => async (...a) => {
  if (S.busy) return;
  S.busy = true; render();
  try { await fn(...a); } catch (e) { console.error(e); toast(errMsg(e)); }
  finally { S.busy = false; render(); }
};

/* ---------- boot ---------- */
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
    onValue(ref(db, ".info/connected"), (snap) => { if (snap.val() && S.code) markOnline(); });
    if (S.name) autoJoin();
  });
}
render();

function autoJoin() {
  const c = urlCode || localStorage.getItem("imp.room");
  if (c && c.length === 4) run(() => joinRoom(c, true))();
}

/* ---------- room lifecycle ---------- */
async function markOnline() {
  if (!S.room?.players?.[S.uid]?.name) return;
  try { await onDisconnect(onlineRef()).set(false); await set(onlineRef(), true); } catch {}
}

async function createRoom() {
  let code = genCode();
  for (let i = 0; i < 8; i++) {
    if (!(await get(ref(db, `rooms/${code}`))).exists()) break;
    code = genCode();
  }
  await set(ref(db, `rooms/${code}`), {
    host: S.uid,
    createdAt: serverTimestamp(),
    status: "lobby",
    count: 0,
    settings: { impostors: 1, pool: "all", hint: "none" },
    players: { [S.uid]: { name: S.name, joinedAt: Date.now(), online: true } },
  });
  enterRoom(code);
}

async function joinRoom(code, silent = false) {
  code = code.toUpperCase();
  const snap = await get(ref(db, `rooms/${code}`));
  if (!snap.exists()) {
    localStorage.removeItem("imp.room");
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
  localStorage.setItem("imp.room", code);
  history.replaceState(null, "", `${location.pathname}?s=${code}`);
  offRoom = onValue(ref(db, `rooms/${code}`), (snap) => {
    const r = snap.val();
    if (!r || !r.players?.[S.uid]?.name) { exitLocal(r ? "Te han sacado de la sala" : "La sala se ha cerrado"); return; }
    const first = !S.room;
    const prev = S.room?.status;
    S.room = r;
    if (first) markOnline();
    if (r.status !== prev) S.reveal = false;
    if (r.status === "playing" && prev !== "playing") navigator.vibrate?.(60);
    render();
    maybeAutoReveal();
  }, () => exitLocal("No se pudo abrir la sala"));
  offSecret = onValue(ref(db, `secrets/${code}/${S.uid}`), (snap) => {
    const s = snap.val();
    if (s?.n !== S.secret?.n) S.reveal = false;
    S.secret = s; render();
  }, () => {});
}

function exitLocal(msg) {
  if (offRoom) offRoom(); if (offSecret) offSecret();
  offRoom = offSecret = null;
  if (S.code && db) onDisconnect(onlineRef()).cancel().catch(() => {});
  S.code = null; S.room = null; S.secret = null; S.reveal = false; S.codeInput = "";
  localStorage.removeItem("imp.room");
  history.replaceState(null, "", location.pathname);
  if (msg) toast(msg); else render();
}

async function leaveRoom() {
  if (!confirm("¿Salir de la sala?")) return;
  const r = S.room, code = S.code, uid = S.uid;
  if (offRoom) offRoom(); if (offSecret) offSecret();
  offRoom = offSecret = null;
  await onDisconnect(onlineRef()).cancel();
  const others = players().map(([id]) => id).filter((id) => id !== uid);
  if (r.host === uid) {
    if (!others.length) {
      await remove(ref(db, `secrets/${code}`));
      await remove(ref(db, `hostdata/${code}`));
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

/* ---------- game (host) ---------- */
function pickFootballer(poolKey) {
  const list = (POOLS[poolKey] || POOLS.all).list;
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem("imp.recent") || "[]"); } catch {}
  const fresh = list.filter((p) => !recent.includes(p.name));
  const fp = pick(fresh.length ? fresh : list);
  recent = [fp.name, ...recent].slice(0, Math.min(80, Math.floor(list.length * 0.7)));
  localStorage.setItem("imp.recent", JSON.stringify(recent));
  return fp;
}

async function startRound() {
  const r = S.room, code = S.code;
  const ids = players().filter(([, p]) => p.online !== false).map(([id]) => id);
  if (ids.length < 3) { toast("Hacen falta al menos 3 jugadores conectados"); return; }
  const want = Number(r.settings?.impostors) || 1;
  const k = Math.max(1, Math.min(want, Math.floor((ids.length - 1) / 2)));
  const fp = pickFootballer(r.settings?.pool);
  const hintMode = r.settings?.hint || "none";
  const hint = hintMode === "pos" ? POS_LABEL[fp.pos] : hintMode === "country" ? fp.country : "";
  const imps = shuffle(ids).slice(0, k);
  const n = (r.count || 0) + 1;

  const secrets = {};
  for (const id of ids) {
    secrets[id] = imps.includes(id) ? { n, role: "impostor", hint, k } : { n, role: "crew", player: fp.name };
  }
  const roster = {};
  for (const id of ids) roster[id] = r.players[id].name;

  await set(ref(db, `hostdata/${code}`), { impostors: imps, player: fp.name });
  await set(ref(db, `secrets/${code}`), secrets);
  await update(ref(db, `rooms/${code}`), {
    status: "playing",
    count: n,
    votes: null,
    result: null,
    round: { n, roster, starter: roster[pick(ids)], k },
  });
}

function maybeAutoReveal() {
  const r = S.room;
  if (!isHost() || r.status !== "voting") return;
  const roster = Object.keys(r.round?.roster || {});
  const voted = roster.filter((id) => r.votes?.[id]);
  if (roster.length && voted.length === roster.length) reveal();
}

async function reveal() {
  if (S.revealing) return;
  S.revealing = true;
  try {
    const r = S.room, code = S.code;
    const roster = r.round?.roster || {};
    const tally = {};
    Object.keys(roster).forEach((id) => (tally[id] = 0));
    Object.entries(r.votes || {}).forEach(([voter, target]) => {
      if (roster[voter] && target in tally) tally[target]++;
    });
    const max = Math.max(0, ...Object.values(tally));
    const tops = Object.keys(tally).filter((id) => max > 0 && tally[id] === max);
    const hd = (await get(ref(db, `hostdata/${code}`))).val() || { impostors: [], player: "?" };
    const top = tops.length === 1 ? tops[0] : null;
    await update(ref(db, `rooms/${code}`), {
      status: "results",
      result: {
        tally, top, tied: tops.length > 1,
        caught: !!top && hd.impostors.includes(top),
        impostors: hd.impostors, player: hd.player,
      },
    });
  } catch (e) { console.error(e); toast(errMsg(e)); }
  finally { S.revealing = false; }
}

/* ---------- actions ---------- */
const A = {
  create: run(createRoom),
  leave: run(leaveRoom),
  rename: () => { S.name = ""; render(); },
  set: run(async (d) => {
    if (!isHost()) return;
    const v = d.k === "impostors" ? Number(d.v) : d.v;
    await set(ref(db, `rooms/${S.code}/settings/${d.k}`), v);
  }),
  kick: run(async (d) => {
    const p = S.room.players[d.v];
    if (!isHost() || !confirm(`¿Sacar a ${p?.name}?`)) return;
    await update(ref(db, `rooms/${S.code}`), { [`players/${d.v}`]: null, [`votes/${d.v}`]: null });
  }),
  start: run(startRound),
  vote: run(async (d) => { await set(ref(db, `rooms/${S.code}/votes/${S.uid}`), d.v); }),
  tovote: run(async () => { await update(ref(db, `rooms/${S.code}`), { status: "voting", votes: null }); }),
  reveal: run(reveal),
  lobby: run(async () => {
    await update(ref(db, `rooms/${S.code}`), { status: "lobby", round: null, votes: null, result: null });
  }),
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
    localStorage.setItem("imp.name", n);
    if (S.code) update(ref(db, `rooms/${S.code}/players/${S.uid}`), { name: n }).catch(() => {});
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

/* ---------- views ---------- */
function render() {
  let html;
  if (!configured) html = setupView();
  else if (S.fatal) html = `<main class="screen center"><p class="muted">${esc(S.fatal)}</p></main>`;
  else if (!S.uid) html = `<main class="screen center"><p class="muted">Conectando…</p></main>`;
  else if (!S.name) html = nameView();
  else if (!S.code) html = homeView();
  else if (!S.room) html = `<main class="screen center"><p class="muted">Entrando en ${esc(S.code)}…</p></main>`;
  else html = { lobby: lobbyView, playing: playView, voting: voteView, results: resultView }[S.room.status]?.() || lobbyView();

  const active = document.activeElement;
  const focusName = active && active.name;
  $.innerHTML = html + (S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : "");
  if (focusName) { const el = $.querySelector(`[name="${focusName}"]`); if (el) { el.focus(); const l = el.value.length; el.setSelectionRange?.(l, l); } }
}

const brand = () => `<div class="brand"><span class="mark">?</span><span>Impostor</span><span class="dim">fútbol</span></div>`;

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
      <input id="n" name="n" maxlength="16" autocomplete="nickname" placeholder="Tu nombre" value="${esc(S.nameInput)}" required autofocus>
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
      <input name="c" class="code-in" maxlength="4" placeholder="ABCD" autocapitalize="characters" autocomplete="off" spellcheck="false" value="${esc(S.codeInput)}">
      <button class="btn" ${S.busy ? "disabled" : ""}>Unirse</button>
    </form>
    <div class="grow"></div>
    <ol class="how">
      <li>Uno crea la sala y comparte el código.</li>
      <li>Todos reciben el mismo futbolista, menos el impostor.</li>
      <li>Por turnos, cada uno da una pista sin decir el nombre.</li>
      <li>Votad quién está fingiendo.</li>
    </ol>
  </main>`;
}

function seg(key, opts, cur) {
  const h = isHost();
  return `<div class="seg">${opts.map(([v, l]) =>
    `<button data-a="set" data-k="${key}" data-v="${v}" class="${String(cur) === String(v) ? "on" : ""}" ${h ? "" : "disabled"}>${l}</button>`).join("")}</div>`;
}

function roomBar(label) {
  return `<header class="bar"><button class="link" data-a="leave">← Salir</button><span class="muted small">${label}</span><button class="link code-tag" data-a="share">${esc(S.code)}</button></header>`;
}

function lobbyView() {
  const r = S.room, ps = players(), st = r.settings || {};
  const online = ps.filter(([, p]) => p.online !== false).length;
  const hostName = r.players[r.host]?.name || "el anfitrión";
  const poolSize = (POOLS[st.pool] || POOLS.all).list.length;
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
    <div class="setting"><span class="lbl">Impostores</span>${seg("impostors", [[1, "1"], [2, "2"], [3, "3"]], st.impostors || 1)}</div>
    <div class="setting"><span class="lbl">Futbolistas</span>${seg("pool", Object.entries(POOLS).map(([k, v]) => [k, v.label]), st.pool || "all")}</div>
    <div class="setting"><span class="lbl">Pista al impostor</span>${seg("hint", [["none", "Ninguna"], ["pos", "Posición"], ["country", "País"]], st.hint || "none")}</div>
    <p class="foot">${poolSize} futbolistas en el bombo${(st.impostors || 1) > 1 ? " · con pocos jugadores se reduce el número de impostores" : ""}</p>

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
      <span class="card-name">IMPOSTOR</span>
      <span class="card-sub">${s.hint ? `Pista: ${esc(s.hint)}` : "Sin pista. Disimula."}</span>
      ${s.k > 1 ? `<span class="card-sub dim">Hay ${s.k} impostores</span>` : ""}
      <span class="card-hide">Toca para ocultar</span>
    </button>`;
  }
  return `<button class="card open" data-a="flip">
    <span class="card-k">Tu futbolista</span>
    <span class="card-name">${esc(s.player)}</span>
    <span class="card-hide">Toca para ocultar</span>
  </button>`;
}

function inRound() { return !!S.room.round?.roster?.[S.uid]; }

function playView() {
  const r = S.room;
  if (!inRound()) return waitingView("Ronda en curso", "Entrarás en la siguiente ronda.");
  return `<main class="screen">
    ${roomBar(`Ronda ${r.round.n}`)}
    ${card()}
    <p class="starter">Empieza <b>${esc(r.round.starter)}</b></p>
    <p class="foot">Por turnos, cada uno dice una palabra sobre su futbolista. El impostor no lo sabe: tiene que pillarlo sobre la marcha.</p>
    <div class="sticky">
      ${isHost()
        ? `<button class="btn primary big" data-a="tovote" ${S.busy ? "disabled" : ""}>Pasar a votación</button>`
        : `<p class="wait">Cuando acabéis las rondas de pistas, el anfitrión abre la votación.</p>`}
    </div>
  </main>`;
}

function waitingView(title, sub) {
  return `<main class="screen">${roomBar("Sala")}<div class="grow"></div><h1 class="title center-t">${title}</h1><p class="muted center-t">${sub}</p><div class="grow"></div></main>`;
}

function voteView() {
  const r = S.room;
  if (!inRound()) return waitingView("Votación en curso", "Entrarás en la siguiente ronda.");
  const roster = Object.entries(r.round.roster);
  const votes = r.votes || {};
  const mine = votes[S.uid];
  const done = roster.filter(([id]) => votes[id]).length;
  return `<main class="screen">
    ${roomBar(`Ronda ${r.round.n}`)}
    <h1 class="title">¿Quién es el impostor?</h1>
    <p class="muted small">${done} de ${roster.length} han votado${mine ? " · puedes cambiar tu voto" : ""}</p>
    <ul class="list votes">${roster.filter(([id]) => id !== S.uid).map(([id, name]) => `
      <li><button class="vote ${mine === id ? "on" : ""}" data-a="vote" data-v="${id}">
        <span class="pname">${esc(name)}</span>
        ${votes[id] ? '<span class="muted small">ya votó</span>' : ""}
      </button></li>`).join("")}
    </ul>
    <button class="btn ghost small center-self" data-a="flip">${S.reveal ? "Ocultar mi carta" : "Ver mi carta otra vez"}</button>
    ${S.reveal ? card() : ""}
    <div class="sticky">
      ${isHost()
        ? `<button class="btn primary big" data-a="reveal" ${S.busy ? "disabled" : ""}>Revelar${done < roster.length ? " ya" : ""}</button>`
        : `<p class="wait">Se revela cuando vote todo el mundo.</p>`}
    </div>
  </main>`;
}

function resultView() {
  const r = S.room, res = r.result || {}, roster = r.round?.roster || {};
  const imps = res.impostors || [];
  const impNames = imps.map((id) => roster[id] || "?");
  const tally = Object.entries(res.tally || {}).sort((a, b) => b[1] - a[1]);
  let verdict, cls;
  if (res.caught) { verdict = imps.length > 1 ? "¡Pillado uno!" : "¡Pillado!"; cls = "win"; }
  else if (res.tied) { verdict = "Empate. El impostor se escapa."; cls = "lose"; }
  else { verdict = "Gana el impostor"; cls = "lose"; }
  const iWasImp = imps.includes(S.uid);
  return `<main class="screen">
    ${roomBar(`Ronda ${r.round?.n ?? ""}`)}
    <div class="verdict ${cls}">${verdict}</div>
    <div class="reveal-box">
      <span class="card-k">El futbolista era</span>
      <span class="card-name">${esc(res.player)}</span>
      <span class="card-k">${imps.length > 1 ? "Impostores" : "Impostor"}</span>
      <span class="imp-name">${impNames.map(esc).join(", ")}${iWasImp ? ' <span class="muted">(tú)</span>' : ""}</span>
    </div>
    <h2 class="sec">Votos</h2>
    <ul class="list">${tally.map(([id, n]) => `
      <li><span class="pname">${esc(roster[id] || "?")}</span>${imps.includes(id) ? '<span class="tag red">impostor</span>' : ""}<span class="count">${n}</span></li>`).join("")}
    </ul>
    <div class="sticky">
      ${isHost()
        ? `<div class="row"><button class="btn" data-a="lobby" ${S.busy ? "disabled" : ""}>Ajustes</button><button class="btn primary grow1" data-a="start" ${S.busy ? "disabled" : ""}>Otra ronda</button></div>`
        : `<p class="wait">Esperando la siguiente ronda…</p>`}
    </div>
  </main>`;
}
