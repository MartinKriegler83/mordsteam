// Mordsteam Fallzentrale – Team-Ansicht („Ermittlerschreibtisch“)
// Titel, Fragen, Hinweise und Dokumente kommen vom Server bereits sicher escaped.
(function () {
  // Mitlesegerät: kommt über den QR-Code des Teamgeräts (?mit=…)
  const mit = MS.qs("mit");
  if (mit) {
    const r = document.getElementById("root");
    r.innerHTML = `<div class="panel center"><p>Verbinde mit eurem Team …</p></div>`;
    MS.api("POST", "mitlesen", { code: mit }).then((d) => {
      MS.set("ms_view", d.token); MS.del("ms_team"); ["ms_seen", "ms_heard", "ms_tab", "ms_doc"].forEach(MS.del);
      location.replace(location.pathname);
    }).catch((e) => { r.innerHTML = `<div class="panel center"><div class="eyebrow">Mitlesen</div><p style="margin-top:8px">${MS.esc(e.message)}</p></div>`; });
    return;
  }
  const token = MS.get("ms_team"), viewToken = token ? null : MS.get("ms_view");
  if (!token && !viewToken) { location.href = "/spiel/"; return; }
  const VIEWER = !token;
  const H = VIEWER ? { "x-view": viewToken } : { "x-team": token };
  const $ = (id) => document.getElementById(id);
  const root = $("root"), clock = $("clock"), tabsEl = $("tabs"), toastEl = $("toast");
  const TABS = VIEWER ? ["akte", "firma", "funk"] : ["einsatz", "akte", "firma", "funk", "loesung", "rang"];
  if (VIEWER) tabsEl.querySelectorAll("[data-tab]").forEach((b) => { if (!TABS.includes(b.dataset.tab)) b.remove(); });

  let S = null;              // letzter Stand vom Server
  let offset = 0;            // Serverzeit − lokale Zeit
  let docs = null, watermark = "";
  let firma = null, vPage = "start", partnerHtml = null;
  let tab = TABS.includes(MS.get("ms_tab")) ? MS.get("ms_tab") : TABS[0];
  let openDoc = null;        // Index des offenen Dokuments (0 ist gültig!)
  let lastDocId = MS.get("ms_doc");   // zuletzt geöffnetes Dokument – beim Zurückkommen wieder dort
  let vLogin = { u: "", p: "" };      // Eingaben im Partner-Login bleiben stehen
  let draft = {};
  let lastKey = "", lastStage = null;
  let verdict = null;        // { cls: 'bad'|'warn'|'good', html }
  let checkArmed = false, checkRes = "";
  let busy = false, fetchedHint = 0, toastTimer = null;
  const seen = new Set(JSON.parse(MS.get("ms_seen") || "[]"));    // gelesene Dokumente
  const heard = new Set(JSON.parse(MS.get("ms_heard") || "[]"));  // gelesene Funksprüche
  const toasted = new Set();
  const hid = (h) => `${h.q}-${h.level}`;
  const pad = (n) => String(n).padStart(2, "0");

  // ---------- Laden ----------
  async function poll() {
    try {
      S = await MS.api("GET", "state", null, H);
      offset = S.now - Date.now();
    } catch (e) {
      if (e.status === 401 || e.status === 410) {
        MS.del("ms_team"); MS.del("ms_view");
        root.innerHTML = `<div class="panel center"><p>${MS.esc(e.message)}</p><p style="margin-top:14px"><a class="btn btn-red" href="/spiel/">Neu anmelden</a></p></div>`;
      }
      return;
    }
    $("fallname").textContent = S.fall;
    $("teamname").textContent = VIEWER ? `${S.team} · Mitlesegerät` : S.team;
    const key = [S.status, S.solved, S.stage, S.check_available].join("|");
    if (S.stage !== lastStage) { if (lastStage !== null) docs = null; lastStage = S.stage; }
    if (key !== lastKey) { lastKey = key; await render(); }
    else if (tab === "rang" || tab === "funk" || (S.solved && S.status === "running")) renderView();
    announceHints();
    tick();
  }

  async function ensureContent() {
    if (!docs) { const d = await MS.api("GET", "akte", null, H); docs = d.docs; watermark = d.watermark; }
    if (!firma) firma = await MS.api("GET", "firma", null, H);
  }

  const running = () => S && S.status === "running" && !S.solved;

  // ---------- Uhr und Funk-Countdown ----------
  function tick() {
    if (!S) return;
    const now = Date.now() + offset;
    if (!running() || !S.started_at) { clock.innerHTML = ""; }
    else {
      const left = S.started_at + S.duration_min * 60000 - now;
      const pen = S.penalty_min ? `<span class="pen" title="Strafzeit">+${S.penalty_min} Min.</span>` : "";
      clock.className = "clock" + (left > 0 && left < 600000 ? " urgent" : left <= 0 ? " late" : "");
      clock.innerHTML = `<span class="clk"><span class="clk-label">${left > 0 ? "Aufsichtsrat in" : "Aufsichtsrat tagt"}</span><b class="clk-time">${MS.dur(left > 0 ? left : now - S.started_at)}</b>${pen}</span>`;
    }
    const nh = $("nexthint");
    if (nh && S.next_hint) nh.textContent = MS.dur(Math.max(0, S.next_hint.time - now));
    // Neuer Funkspruch fällig → gleich nachladen
    if (running() && S.next_hint && now >= S.next_hint.time && fetchedHint !== S.next_hint.time) {
      fetchedHint = S.next_hint.time;
      setTimeout(poll, 1200);
    }
  }
  setInterval(tick, 1000);

  // ---------- Funksprüche: Badge und Toast ----------
  function announceHints() {
    const hints = running() ? S.hints : [];
    const unread = hints.filter((h) => !heard.has(hid(h)));
    const badge = $("funkbadge");
    badge.hidden = !unread.length || tab === "funk";
    badge.textContent = unread.length;
    const fresh = unread.filter((h) => !toasted.has(hid(h)));
    fresh.forEach((h) => toasted.add(hid(h)));
    if (!fresh.length || tab === "funk") return;
    const txt = fresh.length === 1 ? `Neuer Funkspruch der Zentrale · ${fresh[0].label}` : `${fresh.length} neue Funksprüche der Zentrale`;
    toastEl.innerHTML = `<button type="button"><span class="led"></span><span>${txt}</span><b>Anhören →</b></button>`;
    toastEl.hidden = false;
    toastEl.querySelector("button").onclick = () => { hideToast(); go("funk"); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 15000);
  }
  function hideToast() { toastEl.hidden = true; toastEl.innerHTML = ""; }

  // ---------- Navigation ----------
  function go(t) {
    tab = t; MS.set("ms_tab", t);
    openDoc = null;
    if (t === "akte" && lastDocId && docs) { const i = docs.findIndex((d) => d.id === lastDocId); if (i >= 0) openDoc = i; }
    renderView(); scrollTo(0, 0);
  }
  tabsEl.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => go(b.dataset.tab)));

  async function render() {
    if (!S) return;
    tabsEl.hidden = !running();
    if (running()) {
      try { await ensureContent(); } catch (e) { root.innerHTML = `<div class="panel center"><p class="err">${MS.esc(e.message)}</p></div>`; return; }
      if (tab === "akte" && openDoc === null && lastDocId) { const i = docs.findIndex((d) => d.id === lastDocId); if (i >= 0) openDoc = i; }
    } else hideToast();
    renderView();
  }

  function renderView() {
    if (S.status === "finished") return viewFinal();
    if (S.solved) return viewSolved();
    if (S.status === "created" || S.status === "open") return viewWaiting();
    for (const b of tabsEl.querySelectorAll("[data-tab]")) b.setAttribute("aria-selected", String(b.dataset.tab === tab));
    if (tab === "einsatz") return viewEinsatz();
    if (tab === "akte") return openDoc !== null ? viewDoc() : viewAkte();
    if (tab === "firma") return viewFirma();
    if (tab === "funk") return viewFunk();
    if (tab === "loesung") return viewLoesung();
    if (tab === "rang") return viewRang();
  }

  // ---------- Vor und nach dem Spiel ----------
  function viewWaiting() {
    root.innerHTML = `<div class="panel center waiting">
      <div class="eyebrow">Team angemeldet</div>
      <h1>${MS.esc(S.team)}</h1>
      <p>${VIEWER ? "Dieses Gerät liest bei eurem Team mit. Sobald der Fall startet, erscheint hier die Akte." : "Ihr seid startklar. Sobald euer Organisator den Fall startet, öffnet sich hier euer Einsatzbefehl – bei allen Teams gleichzeitig."}</p>
      <div class="spinner" aria-hidden="true"></div>
      <h3>Angemeldete Teams</h3>
      <ul class="teamlist">${S.ranking.map((r) => `<li>${MS.esc(r.name)}${r.name === S.team ? " <span>(ihr)</span>" : ""}</li>`).join("")}</ul>
      <p class="small">Fair Play: Keine KI und keine Suchmaschinen – der Fall ist mit Köpfchen lösbar.</p>
    </div>`;
  }

  // Podest der ersten drei gelösten Teams
  function podium() {
    const top = S.ranking.filter((r) => r.solved).slice(0, 3);
    if (!top.length) return `<p class="nopod">Diesmal hat kein Team den Fall rechtzeitig geknackt. Wer es war, lacht sich ins Fäustchen – noch.</p>`;
    const order = [top[1], top[0], top[2]];
    return `<div class="podium">${order.map((r, i) => r ? `<div class="pod p${r.rank} ${r.name === S.team ? "me" : ""}">
      <span class="pod-name">${MS.esc(r.name)}</span><span class="pod-time">${MS.dur(r.score_ms)}</span>
      <div class="pod-block"><b>${r.rank}</b></div></div>` : `<div class="pod empty"></div>`).join("")}</div>`;
  }

  function bilanz() {
    const me = S.ranking.find((r) => r.name === S.team) || {};
    const total = S.ranking.length;
    return `<div class="stats">
      <div><b>${me.rank ? `${me.rank}.` : "–"}</b><span>${me.rank ? `Platz von ${total}` : "nicht gelöst"}</span></div>
      <div><b>${S.solved ? MS.dur(S.score_ms) : "–"}</b><span>Wertungszeit</span></div>
      <div><b>${S.wrong}</b><span>Fehlversuche</span></div>
      <div><b>${S.penalty_min}</b><span>Min. Strafzeit</span></div>
      <div><b>${seen.size}</b><span>Beweisstücke gelesen</span></div>
    </div>`;
  }

  function thanks() {
    return `<section class="thanks">
      <div class="eyebrow">Mordsteam · Abteilung für ungelöste Fälle</div>
      <h2>Danke fürs Ermitteln!</h2>
      <p>Die Akte ist geschlossen – aber das Verbrechen schläft nie. Wir hoffen, euch bald wiederzusehen, Detektive: Der nächste Fall liegt schon auf dem Schreibtisch.</p>
      <div class="next-case"><span class="conf">Akte 002</span><div><b>In Ermittlung</b><span>Neuer Fall, neue Verdächtige – vielleicht diesmal jemand von euch.</span></div></div>
      <div class="actions-row">${S.solved && !VIEWER ? `<a class="btn btn-red" href="/spiel/urkunde.html">Urkunde herunterladen</a>` : ""}<a class="btn btn-ghost" href="https://mordsteam.com" target="_blank" rel="noopener">Weitere Fälle auf mordsteam.com</a></div>
    </section>`;
  }

  function viewFinal() {
    const A = S.aufloesung;
    root.innerHTML = `<div class="final">
      <section class="paper final-head">
        <div class="bigstamp ${S.solved ? "" : "grey"}"><div><small>MORDSTEAM · AKTE 001</small><strong>${S.solved ? "FALL GELÖST" : "AKTE GESCHLOSSEN"}</strong><small>TEAM ${MS.esc(S.team).toUpperCase()}</small></div></div>
        <h1>${S.solved ? "Stark ermittelt!" : "Die Zeit ist um."}</h1>
        <p class="lead">${S.solved ? (S.premium ? "Täter überführt, Mitwisser enttarnt, Geld gesichert – der Aufsichtsrat bekommt die ganze Wahrheit." : "Ihr habt den Fall gelöst, bevor der Aufsichtsrat tagt.") : "Der Aufsichtsrat tagt ohne Beweise. Aber jetzt erfahrt ihr, wer es wirklich war."}</p>
        ${bilanz()}
      </section>
      <section class="paper">
        <div class="eyebrow">Siegerehrung</div><h2 class="h2p">Das Podest</h2>
        ${podium()}
        ${rankTable()}
        <p class="small" style="margin-top:10px">Wertung = Spielzeit bis zur Lösung plus Strafzeit.</p>
      </section>
      ${A ? `<section class="paper reveal">
        <div class="eyebrow">Die Auflösung</div><h2 class="h2p">Was wirklich geschah</h2>
        <div id="revealbox"><p class="muted">Wartet mit dem Aufdecken, bis euer Organisator so weit ist.</p>
        <button type="button" class="btn btn-ink btn-big" id="reveal">Umschlag öffnen</button></div>
      </section>` : ""}
      ${thanks()}
    </div>`;
    const r = $("reveal");
    if (r) r.onclick = () => {
      $("revealbox").innerHTML = `<div class="answers">${A.answers.map((a, i) => `<div><i>${pad(i + 1)}</i><span>${a.label}</span><b>${MS.esc(a.answer)}${a.detail ? ` · ${MS.esc(a.detail)}` : ""}</b></div>`).join("")}
        ${A.premium_answer ? `<div><i>★</i><span>Code auf der Zugangskarte</span><b>${MS.esc(A.premium_answer)}</b></div>` : ""}</div>
        <p class="story">${A.story}</p>${A.story2 ? `<p class="story" style="margin-top:14px">${A.story2}</p>` : ""}`;
    };
  }

  function viewSolved() {
    const place = (S.ranking.find((r) => r.name === S.team) || {}).rank;
    const open = S.ranking.filter((r) => !r.solved).length;
    root.innerHTML = `<div class="final">
      <section class="paper final-head">
        <div class="bigstamp"><div><small>MORDSTEAM · AKTE 001</small><strong>FALL GELÖST</strong><small>TEAM ${MS.esc(S.team).toUpperCase()}</small></div></div>
        <h1>Stark ermittelt!</h1>
        <p class="lead">Gelöst in <b>${MS.dur(S.score_ms)}</b>${S.penalty_min ? ` (inkl. ${S.penalty_min} Min. Strafzeit)` : ""}${place ? ` – aktuell <b>Platz ${place}</b>` : ""}.</p>
        <p class="muted">${open ? `${open} ${open === 1 ? "Team ermittelt" : "Teams ermitteln"} noch. Bitte nichts verraten! Die Auflösung und die Siegerehrung erscheinen hier, sobald euer Organisator die Runde beendet.` : "Alle Teams sind fertig. Die Siegerehrung erscheint, sobald euer Organisator die Runde beendet."}</p>
        ${bilanz()}
        ${VIEWER ? "" : `<a class="btn btn-red" href="/spiel/urkunde.html">Urkunde herunterladen</a>`}
      </section>
      <section class="paper"><div class="eyebrow">Live-Rangliste</div>${rankTable()}</section>
    </div>`;
  }

  // ---------- Einsatz: Regeln in einer Minute ----------
  function viewEinsatz() {
    const n = docs.length;
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">Einsatzbefehl · Akte 001</span><span class="conf">Streng vertraulich</span></div>
      <h1>Ein Giftanschlag.<br>Eine rote Mappe.<br><em>Einer von euch.</em></h1>
      <p class="sub">${S.intro} Die Uhr oben läuft bereits.</p>
      <ol class="steps">
        <li><span class="n">1</span><div><b>Akte lesen</b><span>${n} Beweisstücke. Teilt sie untereinander auf und redet miteinander.</span></div></li>
        <li><span class="n">2</span><div><b>Intranet durchforsten</b><span>Euer eigenes Intranet verrät mehr, als es sollte.</span></div></li>
        <li><span class="n">3</span><div><b>Vier Antworten, ein Versuch</b><span>Geprüft wird alles auf einmal. Jeder Fehlversuch kostet ${S.rules.wrong} Minuten Strafzeit.</span></div></li>
        <li><span class="n">4</span><div><b>Funk der Zentrale</b><span>Hängt ihr fest, meldet sich die Zentrale von selbst – für alle Teams gleichzeitig, ohne Strafzeit.</span></div></li>
        <li><span class="n">5</span><div><b>Fair Play</b><span>Keine KI, keine Suchmaschine. Nur ihr und die Akte.</span></div></li>
        ${S.premium ? `<li class="prem"><span class="n">6</span><div><b>Zwei Akte und ein Kuvert</b><span>Nach Akt 1 schickt die Zentrale neue Beweisstücke. Euer versiegeltes Kuvert bleibt zu, bis die Fallzentrale es freigibt.</span></div></li>` : ""}
      </ol>
      <h2 class="qhead">Eure vier Fragen${S.premium ? " in Akt 1" : ""}</h2>
      <div class="qcards">${S.questions_act1.map((l, i) => `<div><i>${pad(i + 1)}</i><span>${l}</span></div>`).join("")}</div>
      <button type="button" class="btn btn-red btn-big" id="toAkte">Akte öffnen →</button>
      <div class="more-devices">
        <div class="qr" id="qr" aria-label="QR-Code für Mitlesegeräte"></div>
        <div><b>Ihr wollt mehr Geräte verwenden?</b>
          <p>Scannt den Code mit weiteren Handys oder Laptops eures Teams (bis zu ${S.max_viewers} Geräte, verbunden: ${S.viewers}). Dort seht ihr Akte, Intranet und Funk – so könnt ihr euch die Beweisstücke aufteilen.</p>
          <p class="small"><b>Lösungen gebt ihr nur hier auf diesem Gerät ein.</b></p>
          <button type="button" class="btn btn-line" id="copyLink">Link kopieren</button> <span class="small" id="copied"></span></div>
      </div>
    </div></section>`;
    $("toAkte").onclick = () => go("akte");
    const link = `${location.origin}/spiel/fall?mit=${S.view_token}`;
    try { const q = qrcode(0, "M"); q.addData(link); q.make(); $("qr").innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { $("qr").remove(); }
    $("copyLink").onclick = async () => {
      try { await navigator.clipboard.writeText(link); $("copied").textContent = "Kopiert."; } catch { $("copied").textContent = link; }
    };
  }

  // ---------- Akte ----------
  const kindClass = (k) => ({ Presse: "k-press", Notiz: "k-note", Beleg: "k-receipt", Belege: "k-receipt", "E-Mail": "k-mail", Systemauszug: "k-sys" })[k] || "";
  const ROT = [-1.4, 0.9, -0.5, 1.2, -1, 0.6, -0.2, 1.4];

  function viewAkte() {
    const read = docs.filter((d) => seen.has(d.id)).length;
    root.innerHTML = `${VIEWER ? `<p class="viewer-note">Mitlesegerät · Lösungen gibt euer Team am Hauptgerät ein.</p>` : ""}<div class="deskhead"><h2>Fallakte</h2><span>${read} / ${docs.length} gelesen</span></div>
      <div class="evid">${docs.map((d, i) => `${d.act === 2 && (i === 0 || docs[i - 1].act !== 2) ? `<div class="actdiv"><span class="conf">Akt 2</span><b>Neue Beweisstücke von der Zentrale</b></div>` : ""}<button type="button" class="ev ${kindClass(d.kind)} ${seen.has(d.id) ? "seen" : ""}" data-doc="${i}" style="--r:${ROT[i % ROT.length]}deg">
        <span class="ev-nr">Nr. ${pad(i + 1)}</span><span class="kind">${MS.esc(d.kind)}</span><span class="ttl">${d.title}</span>${seen.has(d.id) ? `<span class="gel">Gelesen</span>` : ""}</button>`).join("")}</div>`;
    root.querySelectorAll("[data-doc]").forEach((b) => (b.onclick = () => { openDoc = Number(b.dataset.doc); renderView(); scrollTo(0, 0); }));
  }

  function wrapTables(sel) {
    root.querySelectorAll(sel).forEach((t) => { const w = document.createElement("div"); w.className = "tablewrap"; t.before(w); w.append(t); });
  }

  function viewDoc() {
    const d = docs[openDoc];
    if (!d) { openDoc = null; return viewAkte(); }
    seen.add(d.id); MS.set("ms_seen", JSON.stringify([...seen]));
    lastDocId = d.id; MS.set("ms_doc", d.id);
    const prev = openDoc > 0 ? openDoc - 1 : null, next = openDoc < docs.length - 1 ? openDoc + 1 : null;
    const pbtn = (i, dir) => `<button type="button" data-go="${i}" class="${dir}"><small>${dir === "prev" ? "← Nr. " + pad(i + 1) : "Nr. " + pad(i + 1) + " →"}</small>${docs[i].title}</button>`;
    root.innerHTML = `<div class="docbar"><button type="button" class="back" id="back">← Alle Beweisstücke</button><span class="docpos">Nr. ${pad(openDoc + 1)} / ${docs.length} · ${MS.esc(d.kind)}</span></div>
      <article class="doc" data-wm="${MS.esc((watermark + "   ").repeat(40))}"><div class="doc-inner">${d.html}</div></article>
      <div class="pager">${prev !== null ? pbtn(prev, "prev") : "<span></span>"}${next !== null ? pbtn(next, "next") : ""}</div>`;
    wrapTables(".doc table");
    $("back").onclick = () => { openDoc = null; lastDocId = null; MS.del("ms_doc"); renderView(); };
    root.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { openDoc = Number(b.dataset.go); renderView(); scrollTo(0, 0); }));
  }

  // ---------- Intranet im Browserfenster ----------
  function viewFirma() {
    const nav = firma.pages.map((p) => [p.id, p.title]);
    let body;
    if (vPage === "login") {
      body = partnerHtml ? partnerHtml : `<h2>${MS.esc(firma.login_label)}</h2><p class="v-lead">Geschützter Bereich. Bitte anmelden.</p>
        <form id="vlogin" class="v-login">
          <label for="vu">Benutzer</label><input id="vu" autocomplete="off" autocapitalize="none" spellcheck="false" value="${MS.esc(vLogin.u)}">
          <label for="vp">Passwort</label><input id="vp" autocomplete="off" autocapitalize="none" spellcheck="false" value="${MS.esc(vLogin.p)}">
          <button type="submit" class="v-btn">Anmelden</button>
          <p class="err" id="vmsg" role="alert"></p>
        </form>`;
    } else body = firma.pages.find((p) => p.id === vPage).html;
    const path = vPage === "start" ? "" : vPage === "login" ? "freigaben" : vPage;
    const initials = firma.name.split(/\s+/).filter((w) => /^[A-Za-zÄÖÜäöü]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "IN";
    root.innerHTML = `<div class="browser">
      <div class="b-top"><span class="b-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <div class="b-url"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><b>${MS.esc(firma.domain)}</b><span class="path">/${path}</span></div></div>
      <div class="v-site"><nav class="v-nav"><span class="v-logo"><span class="v-mark v-initials">${MS.esc(initials)}</span>${MS.esc(firma.name)}<b>Intranet</b></span>
        <div class="v-links">${nav.map(([id, t]) => `<button type="button" data-v="${id}" aria-current="${id === vPage}">${MS.esc(t)}</button>`).join("")}
        <button type="button" data-v="login" class="v-loginbtn" aria-current="${vPage === "login"}">🔒 ${MS.esc(firma.login_label)}</button></div></nav>
      <div class="v-body">${body}</div></div></div>`;
    wrapTables(".v-body table");
    root.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { vPage = b.dataset.v; renderView(); }));
    const f = $("vlogin");
    if (f) { $("vu").oninput = (e) => (vLogin.u = e.target.value); $("vp").oninput = (e) => (vLogin.p = e.target.value); }
    if (f) f.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const d = await MS.api("POST", "firma/login", { user: $("vu").value, password: $("vp").value }, H);
        partnerHtml = d.html; renderView();
      } catch (err) { $("vmsg").textContent = err.message; }
    };
  }

  // ---------- Funk der Zentrale ----------
  const gameMin = (t) => Math.max(0, Math.round((t - S.started_at) / 60000));
  function viewFunk() {
    const unread = new Set(S.hints.filter((h) => !heard.has(hid(h))).map(hid));
    S.hints.forEach((h) => heard.add(hid(h)));
    MS.set("ms_heard", JSON.stringify([...heard]));
    $("funkbadge").hidden = true;
    hideToast();
    root.innerHTML = `<section class="radio">
      <div class="radio-head"><span class="led"></span>Funkkanal Zentrale · Akte 001</div>
      ${S.next_hint ? `<p class="radio-next">Nächster Funkspruch in <b id="nexthint">${MS.dur(Math.max(0, S.next_hint.time - Date.now() - offset))}</b> <span>· ${S.next_hint.label}</span></p>`
        : `<p class="radio-next">Die Zentrale hat zu dieser Stufe alles gesagt, was sie weiß.</p>`}
      ${S.hints.length ? S.hints.map((h) => `<div class="rmsg ${unread.has(hid(h)) ? "new" : ""}"><small>Min. ${gameMin(h.time)} · ${h.label} · Hinweis ${h.level}${unread.has(hid(h)) ? " · neu" : ""}</small><p>${h.text}</p></div>`).join("")
        : `<p class="radio-empty">Funkstille. Die Zentrale meldet sich von selbst, wenn ihr länger festhängt – bei allen Teams gleichzeitig.</p>`}
      <p class="radio-rules">Funksprüche kosten keine Strafzeit. Sie stehen auch direkt unter der passenden Frage im Tab „Lösung“.</p>
    </section>`;
  }

  // ---------- Lösung ----------
  function hintsFor(q) {
    return S.hints.filter((h) => h.q === q).sort((a, b) => a.level - b.level)
      .map((h) => `<div class="funknote"><b>Funk · Hinweis ${h.level}</b>${h.text}</div>`).join("");
  }

  function viewLoesung() {
    const vHtml = verdict ? `<div class="verdict ${verdict.cls}" role="alert">${verdict.html}</div>` : "";
    // Erfolgsmeldungen (neue Stufe) oben, Fehlermeldungen direkt über dem Prüfen-Knopf
    const top = verdict && verdict.cls === "good" ? vHtml : "", v = verdict && verdict.cls !== "good" ? vHtml : "";
    const qrows = () => S.questions.map((q, i) => `<div class="qrow"><span class="qn">${q.nr}</span><div class="qf">
          <label for="q_${q.key}">${q.label}</label><span class="hint">${MS.esc(q.hint)}</span>
          <input id="q_${q.key}" data-q="${q.key}" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="${i < S.questions.length - 1 ? "next" : "done"}" value="${MS.esc(draft[q.key] || "")}">
          ${hintsFor(q.key)}</div></div>`).join("");
    const ctip = S.check_available ? `<div class="ctip"><div><b>Kontrolltipp</b><p>Zeigt, welche Antworten eures letzten Versuchs schon stimmen. Kostet ${S.rules.check} Minuten Strafzeit.</p></div>
          <button type="button" class="btn ${checkArmed ? "btn-ink" : "btn-line"}" id="check">${checkArmed ? `Ja, Kontrolltipp nutzen (+${S.rules.check} Min.)` : "Kontrolltipp nutzen"}</button>
          ${checkArmed ? `<button type="button" class="linkbtn" id="checkno">Abbrechen</button>` : ""}${checkRes}</div>` : "";
    if (S.stage === 3) {
      // Finale (Premium): versiegeltes Kuvert
      root.innerHTML = `<section class="report paper kuvert-stage">${top}
        <div class="eyebrow">Finale · Akt 2 gelöst</div>
        <div class="envelope" aria-hidden="true"><div class="env-flap"></div><div class="env-seal">M</div></div>
        <h2>Öffnet jetzt euer versiegeltes Kuvert!</h2>
        <p class="muted">Darin liegt die Zugangskarte von ${MS.esc(S.opfer || "")}. ${MS.esc(S.ueberfuehrt || "")} hat den Code für das Schließfach darauf versteckt – sichtbar nur, wenn man Licht ins Dunkel bringt.</p>
        <div class="qrow"><span class="qn">★</span><div class="qf"><label for="q_karte">${S.questions[0].label}</label><span class="hint">${MS.esc(S.questions[0].hint)}</span>
          <input id="q_karte" data-q="karte" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done" value="${MS.esc(draft.karte || "")}">${hintsFor("karte")}</div></div>
        ${v}<button type="button" class="btn btn-red btn-big" id="pruefen">Schließfach öffnen</button></section>`;
    } else if (S.stage === 2) {
      root.innerHTML = `<section class="report paper">
        <div class="actbanner"><span class="conf">Akt 2</span><span>Akt 1 gelöst · ${MS.esc(S.ueberfuehrt || "")} ist überführt</span></div>${top}
        <div class="eyebrow">Dem Geld auf der Spur</div><h2>Wer hat geholfen – und wo liegt das Geld?</h2>
        <p class="muted">In eurer Akte liegen neue Beweisstücke. Beide Antworten müssen stimmen. Jeder Fehlversuch kostet ${S.rules.wrong} Minuten. Das Kuvert bleibt noch zu!</p>
        ${qrows()}${v}
        <button type="button" class="btn btn-red btn-big" id="pruefen">Lösung prüfen</button>${ctip}
      </section>`;
    } else {
      root.innerHTML = `<section class="report paper">
        <div class="eyebrow">Abschlussbericht${S.premium ? " · Akt 1" : ""}</div><h2>Wer, wann, warum, wo?</h2>
        <p class="muted">Alle vier Antworten müssen stimmen. Jeder Fehlversuch kostet ${S.rules.wrong} Minuten Strafzeit.</p>
        ${qrows()}${v}
        <button type="button" class="btn btn-red btn-big" id="pruefen">Lösung prüfen</button>${ctip}
      </section>`;
    }
    const inputs = [...root.querySelectorAll("[data-q]")];
    inputs.forEach((inp, i) => {
      inp.addEventListener("input", () => { draft[inp.dataset.q] = inp.value; });
      // Enter springt nur zum nächsten Feld – geprüft wird ausschließlich per Klick
      inp.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (inputs[i + 1]) inputs[i + 1].focus(); else inp.blur();
      });
    });
    $("pruefen").onclick = () => {
      const a = {};
      for (const inp of inputs) a[inp.dataset.q] = inp.value;
      submit(a);
    };
    const c = $("check");
    if (c) c.onclick = async () => {
      if (!checkArmed) { checkArmed = true; return viewLoesung(); }
      checkArmed = false;
      try {
        const d = await MS.api("POST", "kontrolle", null, H);
        checkRes = `<div class="checkrow">${S.questions.map((q, i) => `<span class="${d.result[q.key] ? "y" : "n"}">Frage ${q.nr}: ${d.result[q.key] ? "richtig" : "falsch"}</span>`).join("")}</div>`;
        S.penalty_min += d.penalty_min; tick();
      } catch (err) { checkRes = `<p class="err">${MS.esc(err.message)}</p>`; }
      viewLoesung();
    };
    const cn = $("checkno");
    if (cn) cn.onclick = () => { checkArmed = false; viewLoesung(); };
  }

  async function submit(a) {
    if (busy) return;
    busy = true;
    const btn = $("pruefen");
    if (btn) { btn.disabled = true; btn.textContent = "Wird geprüft …"; }
    try {
      const d = await MS.api("POST", "loesung", a, H);
      if (d.correct) {
        draft = {};
        verdict = d.next === "akt2" ? { cls: "good", akt2: true, html: "" }
          : d.next === "kuvert" ? { cls: "good", html: "<strong>Akt 2 gelöst!</strong>Jetzt dürft ihr das Kuvert öffnen." } : null;
      }
      else verdict = { cls: "bad", html: `<strong>Leider falsch.</strong>+${d.penalty_min} Minuten Strafzeit. Prüft eure Antworten noch einmal.` };
      checkRes = "";
    } catch (err) { verdict = { cls: "warn", html: MS.esc(err.message) }; }
    busy = false;
    lastKey = "";
    const before = S.stage;
    await poll();
    if (verdict && verdict.akt2) {
      verdict = { cls: "good", html: `<strong>Akt 1 gelöst!</strong>${MS.esc(S.ueberfuehrt || "")} ist überführt – aber das Geld ist verschwunden, und es gab Hilfe aus dem Haus. Neue Beweisstücke liegen in eurer Akte.` };
      renderView();
    }
    if (S.stage !== before) scrollTo(0, 0);
  }

  // ---------- Rangliste ----------
  function rankTable() {
    return `<table class="rank"><thead><tr><th>#</th><th>Team</th><th>Stand</th><th>Zeit</th></tr></thead><tbody>
      ${S.ranking.map((r) => `<tr class="${r.name === S.team ? "me" : ""}"><td class="n">${r.rank || "–"}</td><td>${MS.esc(r.name)}${r.name === S.team ? " (ihr)" : ""}</td>
      <td>${MS.stage(r, S.premium)}</td><td class="mono">${r.solved ? MS.dur(r.score_ms) : "–"}</td></tr>`).join("")}
    </tbody></table>`;
  }
  function viewRang() {
    root.innerHTML = `<section class="report paper"><div class="eyebrow">Live-Rangliste</div><h2>Wer ist vorne?</h2>${rankTable()}
      <p class="small" style="margin-top:12px">Zeit = Spielzeit bis zur Lösung plus Strafzeit für Fehlversuche und Kontrolltipps.</p></section>`;
  }

  poll();
  setInterval(poll, 8000);
})();
