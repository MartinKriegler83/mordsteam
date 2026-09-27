// Mordsteam Fallzentrale – Team-Ansicht
// Hinweis: Titel, Fragen und Dokumente kommen vom Server bereits sicher escaped.
(function () {
  const token = MS.get("ms_team");
  if (!token) { location.href = "/spiel/"; return; }
  const H = { "x-team": token };
  const root = document.getElementById("root");
  const clock = document.getElementById("clock");
  const tabsEl = document.getElementById("tabs");

  let S = null;            // letzter Stand vom Server
  let offset = 0;          // Serverzeit − lokale Zeit
  let docs = null, watermark = "";
  let firma = null, vPage = "start", partnerHtml = null;
  let tab = "akte", openDoc = null;
  let draft = {};
  let lastKey = "";
  let flash = null;        // { type: 'ok'|'err', text }
  const seen = new Set(JSON.parse(MS.get("ms_seen") || "[]"));

  // ---------- Laden ----------
  async function poll() {
    try {
      S = await MS.api("GET", "state", null, H);
      offset = S.now - Date.now();
    } catch (e) {
      if (e.status === 401 || e.status === 410) { MS.del("ms_team"); root.innerHTML = `<div class="panel center"><p>${MS.esc(e.message)}</p><p><a class="btn btn-red" href="/spiel/">Neu anmelden</a></p></div>`; return; }
      return;
    }
    document.getElementById("fallname").textContent = `${S.fall} · ${S.team}`;
    const key = [S.status, S.solved, S.core_ok].join("|");
    if (key !== lastKey) { lastKey = key; await render(); }
    else if (tab === "rang") renderView();
    tickClock();
  }

  async function ensureContent() {
    if (!docs) {
      const d = await MS.api("GET", "akte", null, H);
      docs = d.docs; watermark = d.watermark;
    }
    if (!firma) firma = await MS.api("GET", "firma", null, H);
  }

  // ---------- Uhr ----------
  function tickClock() {
    if (!S || S.status !== "running" || !S.started_at || S.solved) { clock.textContent = ""; return; }
    const now = Date.now() + offset;
    const handover = S.started_at + S.duration_min * 60000;
    const left = handover - now;
    const pen = S.penalty_min ? ` <span class="pen">+${S.penalty_min} Min.</span>` : "";
    clock.innerHTML = left > 0
      ? `Übergabe in <b>${MS.dur(left)}</b>${pen}`
      : `<span class="late">Übergabe verpasst – ermittelt weiter</span> <b>${MS.dur(now - S.started_at)}</b>${pen}`;
  }
  setInterval(tickClock, 1000);

  // ---------- Ansichten ----------
  async function render() {
    if (!S) return;
    const running = S.status === "running" && !S.solved;
    tabsEl.hidden = !running;
    if (running) {
      try { await ensureContent(); } catch (e) { root.innerHTML = `<p class="err">${MS.esc(e.message)}</p>`; return; }
    }
    renderView();
  }

  function renderView() {
    if (S.solved) return viewSolved();
    if (S.status === "created" || S.status === "open") return viewWaiting();
    if (S.status === "finished") return viewFinished();
    for (const b of tabsEl.querySelectorAll("button")) b.setAttribute("aria-selected", String(b.dataset.tab === tab));
    if (tab === "akte") return openDoc ? viewDoc() : viewAkte();
    if (tab === "firma") return viewFirma();
    if (tab === "loesung") return viewLoesung();
    if (tab === "rang") return viewRang();
  }

  function viewWaiting() {
    root.innerHTML = `<div class="panel center">
      <div class="eyebrow">Team angemeldet</div>
      <h1 style="font-family:var(--serif);font-size:32px;margin:8px 0">${MS.esc(S.team)}</h1>
      <p>Ihr seid startklar. Sobald euer Organisator den Fall startet, öffnet sich hier eure Akte – bei allen Teams gleichzeitig.</p>
      <p class="muted">Diese Seite aktualisiert sich von selbst.</p>
      <h3 style="margin-top:20px">Angemeldete Teams</h3>
      <ul class="list">${S.ranking.map((r) => `<li>${MS.esc(r.name)}</li>`).join("")}</ul>
      <p class="small" style="margin-top:18px">Fair Play: Keine KI und keine Suchmaschinen – der Fall ist mit Köpfchen lösbar.</p>
    </div>`;
  }

  function viewFinished() {
    root.innerHTML = `<div class="panel center"><div class="eyebrow">Runde beendet</div>
      <h1 style="font-family:var(--serif);font-size:32px;margin:8px 0">Die Zeit ist um.</h1>
      <p>Euer Organisator kann jetzt die Auflösung zeigen.</p>${rankTable()}</div>`;
  }

  function viewSolved() {
    const place = (S.ranking.find((r) => r.name === S.team) || {}).rank;
    root.innerHTML = `<div class="panel center solved">
      <div class="bigstamp"><div><small>MORDSTEAM · AKTE 001</small><strong>FALL GELÖST</strong><small>TEAM ${MS.esc(S.team).toUpperCase()}</small></div></div>
      <p style="font-size:20px">Gelöst in <b>${MS.dur(S.score_ms)}</b>${S.penalty_min ? ` (inkl. ${S.penalty_min} Min. Strafzeit)` : ""}${place ? ` – <b>Platz ${place}</b>` : ""}.</p>
      <a class="btn btn-red" href="/spiel/urkunde.html">Urkunde herunterladen</a>
      <div style="width:100%;text-align:left">${rankTable()}</div>
    </div>`;
  }

  function viewAkte() {
    root.innerHTML = `<div class="stack" style="gap:14px">
      <p class="muted">Eure Fallakte: ${docs.length} Dokumente. Tippt ein Dokument an, um es zu öffnen.</p>
      <div class="doclist">${docs.map((d, i) => `<button class="docitem ${seen.has(d.id) ? "seen" : ""}" data-doc="${i}"><span>${d.title}</span><small>${MS.esc(d.kind)}${seen.has(d.id) ? " · gelesen" : ""}</small></button>`).join("")}</div>
    </div>`;
    root.querySelectorAll("[data-doc]").forEach((b) => b.addEventListener("click", () => { openDoc = Number(b.dataset.doc); renderView(); scrollTo(0, 0); }));
  }

  function viewDoc() {
    const d = docs[openDoc];
    seen.add(d.id); MS.set("ms_seen", JSON.stringify([...seen]));
    const prev = openDoc > 0 ? openDoc - 1 : null, next = openDoc < docs.length - 1 ? openDoc + 1 : null;
    root.innerHTML = `<button class="back" id="back">← Alle Dokumente</button>
      <article class="doc" data-wm="${MS.esc((watermark + "   ").repeat(40))}"><div class="doc-inner">${d.html}</div></article>
      <div class="actions-row" style="justify-content:space-between;margin-top:14px">
        ${prev !== null ? `<button class="btn btn-line" data-go="${prev}">← ${docs[prev].title}</button>` : "<span></span>"}
        ${next !== null ? `<button class="btn btn-line" data-go="${next}">${docs[next].title} →</button>` : ""}
      </div>`;
    root.querySelectorAll(".doc table").forEach((t) => { const w = document.createElement("div"); w.className = "tablewrap"; t.before(w); w.append(t); });
    document.getElementById("back").onclick = () => { openDoc = null; renderView(); };
    root.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { openDoc = Number(b.dataset.go); renderView(); scrollTo(0, 0); }));
  }

  function viewFirma() {
    const nav = [...firma.pages.map((p) => [p.id, p.title]), ["login", "Partnerbereich"]];
    let body;
    if (vPage === "login") {
      body = partnerHtml ? partnerHtml : `<h2>Partnerbereich</h2><p>Nur für registrierte Partner.</p>
        <form id="vlogin" class="v-login form">
          <div class="field"><label for="vu">Benutzer</label><input id="vu" autocomplete="off" autocapitalize="none"></div>
          <div class="field"><label for="vp">Passwort</label><input id="vp" type="password" autocomplete="off"></div>
          <div><button class="btn btn-ink" type="submit">Anmelden</button></div>
          <p class="err" id="vmsg" role="alert"></p>
        </form>`;
    } else {
      body = firma.pages.find((p) => p.id === vPage).html;
    }
    root.innerHTML = `<p class="muted" style="margin-bottom:12px">Die Website der Konkurrenzfirma, wie sie im Internet steht.</p>
      <div class="v-site"><nav class="v-nav"><span class="v-logo">${MS.esc(firma.name)}</span>
      ${nav.map(([id, t]) => `<button data-v="${id}" aria-current="${id === vPage}">${MS.esc(t)}</button>`).join("")}</nav>
      <div class="v-body">${body}</div></div>`;
    root.querySelectorAll(".v-body table").forEach((t) => { const w = document.createElement("div"); w.className = "tablewrap"; t.before(w); w.append(t); });
    root.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { vPage = b.dataset.v; renderView(); }));
    const f = document.getElementById("vlogin");
    if (f) f.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const d = await MS.api("POST", "firma/login", { user: document.getElementById("vu").value, password: document.getElementById("vp").value }, H);
        partnerHtml = d.html; renderView();
      } catch (err) { document.getElementById("vmsg").textContent = err.message; }
    };
  }

  function tipsFor(q) {
    const taken = S.tips.filter((t) => t.q === q);
    let h = taken.map((t) => `<div class="tiptext"><b>TIPP ${t.level}</b><br>${MS.esc(t.text)}</div>`).join("");
    const has1 = taken.some((t) => t.level === 1), has2 = taken.some((t) => t.level === 2);
    if (!has1) h += `<button class="tipbtn" data-tip="${q}" data-level="1">Tipp 1 (+${S.rules.tips[0]} Min.)</button>`;
    else if (!has2) h += `<button class="tipbtn" data-tip="${q}" data-level="2">Tipp 2 (+${S.rules.tips[1]} Min.)</button>`;
    return h;
  }

  function viewLoesung() {
    const msg = flash ? `<p class="${flash.type}" role="alert">${MS.esc(flash.text)}</p>` : "";
    flash = null;
    if (S.core_ok && S.premium) {
      root.innerHTML = `<div class="panel center"><div class="eyebrow">Fast geschafft</div>
        <h2 class="h2" style="font-size:30px;margin:6px 0 10px">Die vier Antworten stimmen!</h2>
        <p>Aber Reiher hat noch etwas hinterlassen: seine Zugangskarte. Was verrät sie?</p>
        <form id="karte" class="form"><div class="field"><label for="k">Lösung der Karte</label><input id="k" autocomplete="off" style="text-transform:uppercase"></div>
        <div><button class="btn btn-red" type="submit">Prüfen</button></div>${msg}</form></div>`;
      document.getElementById("karte").onsubmit = (e) => { e.preventDefault(); submit({ karte: document.getElementById("k").value }); };
      return;
    }
    root.innerHTML = `<div class="panel" style="max-width:760px">
      <div class="eyebrow">Lösung eintragen</div>
      <p class="muted" style="margin:6px 0 16px">Alle vier Antworten müssen stimmen. Jeder Fehlversuch kostet ${S.rules.wrong} Minuten Strafzeit.</p>
      <form id="sol" class="form qs">
        ${S.questions.map((q, i) => `<div class="field">
          <label for="q_${q.key}">${i + 1}. ${q.label}</label>
          <span class="hint">${MS.esc(q.hint)}</span>
          <input id="q_${q.key}" name="${q.key}" autocomplete="off" value="${MS.esc(draft[q.key] || "")}">
          <div class="tipbox">${tipsFor(q.key)}</div>
        </div>`).join("")}
        <div><button class="btn btn-red" type="submit">Lösung prüfen</button></div>
        ${msg}
        ${S.check_available ? `<div class="note">Ihr hängt fest? Der <b>Kontrolltipp</b> zeigt, welche Antworten eures letzten Versuchs stimmen (+${S.rules.check} Min.). <button type="button" class="tipbtn" id="check">Kontrolltipp nutzen</button><div id="checkres"></div></div>` : ""}
      </form></div>`;
    const f = document.getElementById("sol");
    f.addEventListener("input", (e) => { draft[e.target.name] = e.target.value; });
    f.onsubmit = (e) => {
      e.preventDefault();
      const a = {}; for (const q of S.questions) a[q.key] = f.elements[q.key].value;
      submit(a);
    };
    root.querySelectorAll("[data-tip]").forEach((b) => (b.onclick = async () => {
      if (!confirm(`Tipp ${b.dataset.level} öffnen? Das kostet ${S.rules.tips[b.dataset.level - 1]} Minuten Strafzeit.`)) return;
      try { await MS.api("POST", "tipp", { q: b.dataset.tip, level: Number(b.dataset.level) }, H); await poll(); renderView(); }
      catch (err) { flash = { type: "err", text: err.message }; renderView(); }
    }));
    const c = document.getElementById("check");
    if (c) c.onclick = async () => {
      if (!confirm(`Kontrolltipp nutzen? Das kostet ${S.rules.check} Minuten Strafzeit.`)) return;
      try {
        const d = await MS.api("POST", "kontrolle", null, H);
        document.getElementById("checkres").innerHTML = `<div class="checkrow">${S.questions.map((q, i) => `<span class="${d.result[q.key] ? "y" : "n"}">Frage ${i + 1}: ${d.result[q.key] ? "richtig" : "falsch"}</span>`).join("")}</div>`;
        S.penalty_min += d.penalty_min; tickClock();
      } catch (err) { document.getElementById("checkres").innerHTML = `<p class="err">${MS.esc(err.message)}</p>`; }
    };
  }

  async function submit(a) {
    try {
      const d = await MS.api("POST", "loesung", a, H);
      if (d.correct) { flash = { type: "ok", text: "Richtig!" }; draft = {}; }
      else flash = { type: "err", text: `Leider falsch. +${d.penalty_min} Minuten Strafzeit.` };
    } catch (err) { flash = { type: "err", text: err.message }; }
    lastKey = ""; await poll();
  }

  function rankTable() {
    return `<table class="rank"><thead><tr><th>#</th><th>Team</th><th>Stand</th><th>Zeit</th></tr></thead><tbody>
      ${S.ranking.map((r) => `<tr><td class="n">${r.rank || "–"}</td><td>${MS.esc(r.name)}${r.name === S.team ? " (ihr)" : ""}</td>
      <td>${r.solved ? "gelöst" : r.core ? "letzter Hinweis" : "ermittelt"}</td><td class="mono">${r.solved ? MS.dur(r.score_ms) : "–"}</td></tr>`).join("")}
    </tbody></table>`;
  }
  function viewRang() {
    root.innerHTML = `<div class="panel" style="max-width:760px"><div class="eyebrow">Live-Rangliste</div>${rankTable()}
      <p class="small" style="margin-top:12px">Zeit = Spielzeit bis zur Lösung plus Strafzeit für Fehlversuche und Tipps.</p></div>`;
  }

  tabsEl.querySelectorAll("button").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; openDoc = null; renderView(); scrollTo(0, 0); }));
  poll();
  setInterval(poll, 8000);
})();
