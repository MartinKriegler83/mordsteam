// Mordsteam Solo – Spieloberfläche (ein/e Ermittler/in, eigener Code, eigene Uhr)
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const root = $("root"), clock = $("clock"), tabs = $("tabs");
  const esc = MS.esc, pad = (n) => String(n).padStart(2, "0");
  let code = (MS.qs("c") || MS.qs("code") || MS.get("ms_solo_code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  let token = null, S = null, off = 0, tab = "akte", openDoc = null, busy = false, verdict = null, armed = false, giveArmed = false;
  let seen = new Set(JSON.parse(MS.get("ms_solo_seen") || "[]"));

  async function api(method, path, body) {
    const r = await fetch("/api/solo/" + path, { method, headers: { "content-type": "application/json", ...(token ? { "x-solo": token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let d = {}; try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d.error || "Fehler " + r.status); e.status = r.status; throw e; }
    return d;
  }
  function toast(html, ms = 4200) {
    const t = $("toast"); t.innerHTML = `<button type="button">${html}</button>`; t.hidden = false;
    t.querySelector("button").onclick = () => { t.hidden = true; go("akte"); };
    clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), ms);
  }

  // ---------- Einstieg: Code ----------
  function codeView(err) {
    tabs.hidden = true; clock.innerHTML = "";
    root.innerHTML = `<div class="joinhero"><div class="eyebrow">Mordsteam Solo</div><h1>Dein Fall wartet.</h1><p>Gib den Code aus deiner Bestätigungsmail ein.</p></div>
      <div class="panel center"><form id="cf" class="form"><div class="field"><label for="code">Solo-Code</label>
      <input id="code" required maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(code)}" style="text-transform:uppercase;font-family:var(--mono);font-size:24px;letter-spacing:5px"></div>
      <div><button class="btn btn-red btn-big" type="submit">Weiter</button></div><p class="err" role="alert">${err ? esc(err) : ""}</p></form></div>`;
    $("cf").onsubmit = (e) => { e.preventDefault(); code = $("code").value.toUpperCase().replace(/[^A-Z0-9]/g, ""); loadTicket(); };
  }

  async function loadTicket() {
    if (!code) return codeView();
    let t;
    try { t = await api("GET", "ticket?code=" + encodeURIComponent(code)); }
    catch (e) { return codeView(e.message); }
    MS.set("ms_solo_code", code);
    if (t.token) { token = t.token; return refresh(); }
    briefingView(t);
  }

  // ---------- Einsatzauftrag ----------
  function briefingView(t, err) {
    tabs.hidden = true; clock.innerHTML = "";
    const b = t.briefing, needName = !t.name;
    const text = needName ? b.text.replace(/\{NAME\}, e/, "E") : b.text.replace(/\{NAME\}/g, esc(t.name));
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">${esc(b.eyebrow)}</span><span class="conf">Solo · ${t.limit_min} Min.</span></div>
      <h1>${b.title}</h1><p class="sub">${text}</p>
      <ol class="steps">${b.steps.map((s, i) => `<li><span class="n">${i + 1}</span><div><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div></li>`).join("")}</ol>
      <form id="sf" class="form">
      ${needName ? `<div class="field"><label for="nm">Dein Ermittlername</label><input id="nm" required maxlength="40" autocomplete="nickname" placeholder="z. B. Martina Huber"><span class="small">Steht in der Geschichte und auf deiner Urkunde.</span></div>` : ""}
      <p class="small">Die Uhr startet mit dem Klick und lässt sich nicht anhalten. Fair Play: keine KI, keine Suchmaschine – der Fall ist mit Köpfchen lösbar.</p>
      <button class="btn btn-red btn-big" type="submit">Ermittlung starten</button><p class="err" role="alert">${err ? esc(err) : ""}</p></form>
    </div></section>`;
    $("sf").onsubmit = async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button"); btn.disabled = true;
      try { const d = await api("POST", "start", { code, name: needName ? $("nm").value : undefined }); token = d.token; seen = new Set(); MS.set("ms_solo_seen", "[]"); tab = "akte"; await refresh(); scrollTo(0, 0); }
      catch (e2) { briefingView(t, e2.message); }
    };
  }

  // ---------- Stand laden ----------
  async function refresh(d) {
    try { S = d || (await api("GET", "state")); }
    catch (e) { if (e.status === 401) { token = null; return codeView(e.message); } root.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
    off = S.now - Date.now();
    $("pname").textContent = S.name || "Nachtzug nach Venedig";
    $("fallname").textContent = "Solo · " + S.title;
    $("testbar").hidden = !S.test || S.ended;
    render();
  }
  function render() {
    tick();
    if (S.ended) { tabs.hidden = true; return resultView(); }
    tabs.hidden = false;
    tabs.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
    const unseen = S.docs.filter((d) => !seen.has(d.id)).length;
    $("newbadge").hidden = !unseen; $("newbadge").textContent = unseen;
    if (tab === "fragen") return fragenView();
    return openDoc !== null ? docView() : akteView();
  }
  function go(t) { tab = t; openDoc = null; render(); scrollTo(0, 0); }
  tabs.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => go(b.dataset.tab)));

  // ---------- Uhr ----------
  function tick() {
    if (!S) return;
    if (S.ended) { clock.innerHTML = ""; return; }
    const now = Date.now() + off, el = now - S.started_at, left = S.limit_min * 60000 - el;
    const tm = S.train_start + Math.floor(el / 60000), train = `${pad(Math.floor(tm / 60) % 24)}:${pad(tm % 60)}`;
    const pen = S.penalty_min ? `<span class="pen">+${S.penalty_min} Min. Strafe</span>` : "";
    $("fallname").textContent = `Zug ${train} · ${S.title}`;
    clock.className = "clock" + (left <= 0 ? " late" : left < 5 * 60000 ? " urgent" : "");
    clock.innerHTML = `<span class="clk"><span class="clk-label">${left > 0 ? "bis Udine" : "Polizei wartet"}</span><b class="clk-time">${MS.dur(left > 0 ? left : el)}</b>${pen}</span>`;
  }
  setInterval(tick, 1000);

  // ---------- Akte ----------
  const kindClass = (d) => ({ Notiz: "k-note", Beleg: "k-receipt", Systemauszug: "k-sys", Liste: "k-mail", Befund: "k-mail", Protokoll: "k-note", Fundstück: "k-press" })[d.kk || d.kind] || "";
  const ROT = [-1.4, 0.9, -0.5, 1.2, -1, 0.6, -0.2, 1.4];
  const STAGE_TITLE = { 2: "Neue Beweisstücke: Belege und Protokolle", 3: "Neue Beweisstücke: das Gemälde" };
  function akteView() {
    const read = S.docs.filter((d) => seen.has(d.id)).length;
    root.innerHTML = `<div class="deskhead"><h2>Fallakte</h2><span>${read} / ${S.docs.length} gelesen</span></div>
      <div class="evid">${S.docs.map((d, i) => `${d.stage >= 2 && (i === 0 || S.docs[i - 1].stage !== d.stage) ? `<div class="actdiv"><span class="conf">Frage ${d.stage - 1} gelöst</span><b>${STAGE_TITLE[d.stage]}</b></div>` : ""}
        <button type="button" class="ev ${kindClass(d)} ${seen.has(d.id) ? "seen" : ""}" data-doc="${i}" style="--r:${ROT[i % ROT.length]}deg">
        <span class="ev-nr">Nr. ${pad(i + 1)}</span><span class="kind">${esc(d.kind)}</span><span class="ttl">${esc(d.title)}</span>${seen.has(d.id) ? `<span class="gel">Gelesen</span>` : `<span class="gel neu">Neu</span>`}</button>`).join("")}</div>
      <p class="ondesk small" style="margin-top:22px;text-align:center">Mit jeder richtigen Antwort kommen neue Beweisstücke dazu. <button type="button" class="linkbtn ondesk" id="toQ" style="color:var(--paper)">Zu den Fragen →</button></p>`;
    root.querySelectorAll("[data-doc]").forEach((b) => (b.onclick = () => { openDoc = Number(b.dataset.doc); render(); scrollTo(0, 0); }));
    $("toQ").onclick = () => go("fragen");
  }
  function docView() {
    const d = S.docs[openDoc];
    if (!d) { openDoc = null; return akteView(); }
    seen.add(d.id); MS.set("ms_solo_seen", JSON.stringify([...seen]));
    const unseen = S.docs.filter((x) => !seen.has(x.id)).length;
    $("newbadge").hidden = !unseen; $("newbadge").textContent = unseen;
    const prev = openDoc > 0 ? openDoc - 1 : null, next = openDoc < S.docs.length - 1 ? openDoc + 1 : null;
    const pb = (i, dir) => `<button type="button" data-go="${i}" class="${dir}"><small>${dir === "prev" ? "← Nr. " + pad(i + 1) : "Nr. " + pad(i + 1) + " →"}</small>${esc(S.docs[i].title)}</button>`;
    const wm = ("MORDSTEAM SOLO · " + (S.name || "") + "   ").repeat(40);
    root.innerHTML = `<div class="docbar"><button type="button" class="back" id="back">← Alle Beweisstücke</button><span class="docpos">Nr. ${pad(openDoc + 1)} / ${S.docs.length} · ${esc(d.kind)}</span></div>
      <article class="doc" data-wm="${esc(wm)}"><div class="doc-inner">${d.html}</div></article>
      <div class="pager">${prev !== null ? pb(prev, "prev") : "<span></span>"}${next !== null ? pb(next, "next") : `<button type="button" class="next" id="toQ2"><small>Weiter →</small>Zu den Fragen</button>`}</div>`;
    root.querySelectorAll(".doc table").forEach((t) => { const w = document.createElement("div"); w.className = "tablewrap"; t.before(w); w.append(t); });
    $("back").onclick = () => { openDoc = null; render(); };
    root.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { openDoc = Number(b.dataset.go); render(); scrollTo(0, 0); }));
    if ($("toQ2")) $("toQ2").onclick = () => go("fragen");
  }

  // ---------- Fragen ----------
  function fragenView() {
    const q = S.questions.find((x) => x.status === "open");
    const done = S.questions.filter((x) => x.status === "done");
    const locked = S.questions.filter((x) => x.status === "locked");
    const hintList = (x) => x.hints.map((h, i) => `<div class="funknote"><b>Hinweis ${i + 1}</b>${h}</div>`).join("");
    let field = "";
    if (q) field = q.type === "select"
      ? `<select id="ans" class="so-select"><option value="">Bitte wählen …</option>${q.options.map((o) => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join("")}</select>`
      : `<input id="ans" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="hh:mm" maxlength="5">`;
    const cost = q && q.next_hint_cost;
    root.innerHTML = `<section class="report paper">
      <div class="eyebrow">Ermittlung · ${done.length} von ${S.questions.length} gelöst</div>
      <h2>${q ? `Frage ${q.nr}` : "Alle Fragen gelöst"}</h2>
      <p class="muted">Jede falsche Antwort kostet ${S.rules.wrong} Strafminuten, Hinweise kosten ${S.rules.hints.join(" / ")} Minuten.</p>
      ${done.map((x) => `<div class="qrow so-done"><span class="qn">${x.nr}</span><div class="qf"><label>${esc(x.label)}</label><span class="so-ans">✓ ${esc(x.answer)}</span></div></div>`).join("")}
      ${q ? `<div class="qrow"><span class="qn">${q.nr}</span><div class="qf"><label for="ans">${esc(q.label)}</label><span class="hint">${esc(q.hint)}</span>${field}${hintList(q)}</div></div>
      ${verdict ? `<div class="verdict ${verdict.cls}" role="alert">${verdict.html}</div>` : ""}
      <button type="button" class="btn btn-red btn-big" id="check">Antwort prüfen</button>
      <div class="ctip"><div><b>Hinweis nehmen</b><p>${cost ? `Hinweis ${q.hints.length + 1} von 3 für diese Frage. Kostet ${cost} Strafminuten.` : "Für diese Frage hast du alle Hinweise."}</p></div>
        ${cost ? `<button type="button" class="btn ${armed ? "btn-ink" : "btn-line"}" id="hint">${armed ? `Ja, Hinweis nehmen (+${cost} Min.)` : "Hinweis anzeigen"}</button>${armed ? `<button type="button" class="linkbtn" id="hintno">Abbrechen</button>` : ""}` : ""}</div>` : ""}
      ${locked.map((x) => `<div class="qrow so-locked"><span class="qn">${x.nr}</span><div class="qf"><label>${esc(x.label)}</label><span class="hint">Wird frei, sobald du Frage ${x.nr - 1} gelöst hast.</span></div></div>`).join("")}
      <p style="margin-top:26px;text-align:right">${giveArmed ? `<span class="small">Wirklich aufgeben? Du siehst dann die Auflösung${S.first_play ? " und kommst nicht in die Wertung" : ""}.</span> <button type="button" class="btn btn-ink" id="give">Ja, Auflösung zeigen</button> <button type="button" class="linkbtn" id="giveno">Weiter ermitteln</button>` : `<button type="button" class="linkbtn" id="give">Aufgeben und Auflösung ansehen</button>`}</p>
    </section>`;
    const inp = $("ans");
    if (inp && q.type === "time") inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("check").click(); } });
    if ($("check")) $("check").onclick = () => answer(q, inp.value);
    if ($("hint")) $("hint").onclick = async () => {
      if (!armed) { armed = true; return fragenView(); }
      armed = false;
      try { await refresh(await api("POST", "hint")); } catch (e) { verdict = { cls: "warn", html: esc(e.message) }; fragenView(); }
    };
    if ($("hintno")) $("hintno").onclick = () => { armed = false; fragenView(); };
    $("give").onclick = async () => {
      if (!giveArmed) { giveArmed = true; return fragenView(); }
      giveArmed = false;
      try { await refresh(await api("POST", "aufgeben")); scrollTo(0, 0); } catch (e) { verdict = { cls: "warn", html: esc(e.message) }; fragenView(); }
    };
    if ($("giveno")) $("giveno").onclick = () => { giveArmed = false; fragenView(); };
  }

  async function answer(q, value) {
    if (busy) return;
    if (!String(value || "").trim()) { verdict = { cls: "warn", html: q.type === "select" ? "Bitte eine Antwort auswählen." : "Bitte eine Uhrzeit eingeben." }; return fragenView(); }
    busy = true; $("check").disabled = true; $("check").textContent = "Wird geprüft …";
    try {
      const d = await api("POST", "answer", { key: q.key, value });
      armed = false;
      if (d.correct) {
        verdict = null;
        await refresh(d);
        if (!d.ended) { verdict = { cls: "good", html: `<strong>Richtig!</strong>Frage ${q.nr} ist gelöst. Neue Beweisstücke liegen in deiner Akte.` }; fragenView(); toast(`📁 Neue Beweisstücke in deiner Akte <b>Ansehen</b>`); }
        scrollTo(0, 0);
      } else {
        verdict = { cls: "bad", html: `<strong>Leider falsch.</strong>+${d.penalty} Minuten Strafzeit. Schau dir die Beweisstücke noch einmal an.` };
        await refresh(d);
      }
    } catch (e) { verdict = { cls: "warn", html: esc(e.message) }; fragenView(); }
    busy = false;
  }

  // ---------- Ergebnis und Urkunde ----------
  function resultView() {
    const r = S.result || {};
    const solved = S.solved;
    const pctLine = !S.first_play ? "Wiederholung – zählt nicht für die Wertung."
      : !solved ? "" : r.pct === null || r.pct === undefined ? "Du bist unter den ersten Ermittlern dieses Falls – der Vergleich startet mit den nächsten Spielen."
      : `Du warst schneller als <b>${r.pct} %</b> aller Ermittler${r.pct_n < 20 ? ` <span class="small">(bisher ${r.pct_n} Vergleichsspiele)</span>` : ""}.`;
    const date = new Intl.DateTimeFormat("de-AT", { dateStyle: "long" }).format(new Date());
    root.innerHTML = `<section class="report paper so-result noprint">
      <div class="solved"><div class="bigstamp ${solved ? "" : "grey"}"><div><small>MORDSTEAM SOLO · NACHTZUG</small><strong>${solved ? "FALL GELÖST" : "AKTE GESCHLOSSEN"}</strong><small>${esc((S.name || "").toUpperCase())}</small></div></div></div>
      ${solved ? `<div class="so-score"><div><small>Endzeit</small><b>${MS.dur(r.score_ms)}</b></div><div><small>Gespielt</small><b>${MS.dur(r.played_ms)}</b></div><div><small>Strafminuten</small><b>${S.penalty_min}</b></div></div>
        <p class="so-pct">${pctLine}</p>` : `<p class="so-pct">${S.first_play ? "Diesmal hat es nicht gereicht – hier ist die Auflösung." : "Hier ist die Auflösung."}</p>`}
      <h3>Die Auflösung</h3>
      <p><b>Täter/in: ${esc(r.culprit)}</b> · Tatzeit 01:31 · Versteck: ${esc(r.item)}</p>
      <p>${esc(r.text)}</p>
      ${r.voucher ? `<div class="so-voucher"><small>Dein Gutschein für ein Mordsteam-Teams-Spiel</small><b class="mono">${esc(r.voucher)}</b><span>5 € Rabatt · einlösbar beim Bestellen eines Teams-Spiels</span></div>` : ""}
      <div class="actions-row" style="margin-top:22px">${solved && S.first_play ? `<button type="button" class="btn btn-red" id="print">Urkunde drucken / als PDF speichern</button>` : ""}
        <button type="button" class="btn btn-line" id="again">Nochmal spielen – anderer Täter</button></div>
      <p class="small" style="margin-top:10px">Beim nächsten Durchgang wird ein anderer Täter ausgelost. Einige Beweisstücke ändern sich. Er zählt nicht für die Wertung.</p>
    </section>
    ${solved && S.first_play ? `<section class="so-cert printonly"><div class="so-cert-in">
      <div class="so-cert-brand"><span class="wm"><span class="wm-r">MORDS</span>TEAM</span> <span class="so-sub">SOLO</span></div>
      <div class="so-cert-eyebrow">Urkunde</div>
      <h1>${esc(S.name)}</h1>
      <p>hat den Fall <b>„Nachtzug nach Venedig“</b> gelöst und den Täter vor Udine überführt.</p>
      <div class="so-cert-row"><div><small>Endzeit</small><b>${MS.dur(r.score_ms)}</b></div>${r.pct !== null && r.pct !== undefined ? `<div><small>Schneller als</small><b>${r.pct} %</b></div>` : ""}<div><small>Datum</small><b>${date}</b></div></div>
      <div class="so-cert-foot">mordsteam.com</div></div></section>` : ""}`;
    if ($("print")) $("print").onclick = () => window.print();
    $("again").onclick = async () => {
      $("again").disabled = true;
      try { const d = await api("POST", "start", { code, replay: true }); token = d.token; seen = new Set(); MS.set("ms_solo_seen", "[]"); tab = "akte"; openDoc = null; verdict = null; await refresh(); scrollTo(0, 0); }
      catch (e) { $("again").disabled = false; alert(e.message); }
    };
  }

  $("ff5").onclick = async () => { try { await refresh(await api("POST", "test/vorspulen")); } catch {} };
  loadTicket();
})();
