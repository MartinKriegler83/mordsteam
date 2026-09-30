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
    t.querySelector("button").onclick = () => { t.hidden = true; openDoc = null; go("akte"); };
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
  // Beim Wechsel zwischen Akte und Fragen bleibt das zuletzt geöffnete Beweisstück offen (wie bei Fall 001)
  function go(t) { tab = t; render(); scrollTo(0, 0); }
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
    const rp = S.replay || { left: 0 };
    const until = rp.until ? new Intl.DateTimeFormat("de-AT", { dateStyle: "long" }).format(new Date(rp.until)) : "";
    root.innerHTML = `<section class="report paper so-result">
      <div class="solved"><div class="bigstamp ${solved ? "" : "grey"}"><div><small>MORDSTEAM SOLO · NACHTZUG</small><strong>${solved ? "FALL GELÖST" : "AKTE GESCHLOSSEN"}</strong><small>${esc((S.name || "").toUpperCase())}</small></div></div></div>
      ${solved ? `<div class="so-score"><div><small>Endzeit</small><b>${MS.dur(r.score_ms)}</b></div><div><small>Gespielt</small><b>${MS.dur(r.played_ms)}</b></div><div><small>Strafminuten</small><b>${S.penalty_min}</b></div></div>
        <p class="so-pct">${pctLine}</p>` : `<p class="so-pct">${S.first_play ? "Diesmal hat es nicht gereicht – hier ist die Auflösung." : "Hier ist die Auflösung."}</p>`}
      <h3>Die Auflösung</h3>
      <p><b>Täter/in: ${esc(r.culprit)}</b> · Tatzeit 01:31 · Versteck: ${esc(r.item)}</p>
      <p>${esc(r.text)}</p>
      ${r.voucher ? `<div class="so-voucher"><small>Dein Gutschein für ein Friends- oder Teams-Spiel</small><b class="mono">${esc(r.voucher)}</b><span>5 € Rabatt · einlösbar beim Bestellen von Mordsteam Friends oder Teams (im Bezahlschritt)</span><button type="button" class="btn btn-line" id="copyv">Code kopieren</button></div>` : ""}
      ${solved && S.first_play ? `<div class="actions-row" style="margin-top:22px"><button type="button" class="btn btn-red" id="pdf">Urkunde als PDF speichern</button><button type="button" class="btn btn-line" id="png">Urkunde als Bild</button></div><p class="small" style="margin-top:6px">A4 im Querformat – zum Ausdrucken oder Teilen.</p>` : ""}
      ${rp.left > 0 ? `<div class="actions-row" style="margin-top:18px"><button type="button" class="btn btn-line" id="again">Nochmal spielen – anderer Täter</button></div>
      <p class="small" style="margin-top:8px">Noch ${rp.left} ${rp.left === 1 ? "Wiederholung" : "Wiederholungen"} möglich${until ? `, bis ${until}` : ""}. Jedes Mal wird ein anderer Täter ausgelost, einige Beweisstücke ändern sich. Wiederholungen zählen nicht für die Wertung.</p>`
      : `<p class="small" style="margin-top:18px">${S.replay && S.replay.until && Date.now() > S.replay.until ? "Der Zeitraum für Wiederholungen ist vorbei." : "Du hast den Fall mit allen Tätern gespielt."} Weitere Ermittlungen warten – allein, mit Freunden oder im Team: <a href="/">mordsteam.com</a></p>`}
    </section>
    ${S.feedback_done ? "" : `<section class="report paper so-fb" id="fb">
      <div class="eyebrow">Dein Feedback</div><h3 style="margin-top:6px">Wie war der Nachtzug?</h3>
      <p class="muted">Zwei Klicks, die uns sehr helfen. Neue Fälle bauen wir aus eurem Feedback.</p>
      <div class="stars" role="radiogroup" aria-label="Sterne">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${n} von 5 Sternen">★</button>`).join("")}</div>
      <div class="field"><span class="label">Wie schwer war der Fall?</span><div class="chips-row">${["zu leicht", "genau richtig", "zu schwer"].map((x) => `<button type="button" class="chipbtn" data-diff="${x}">${x}</button>`).join("")}</div></div>
      <div class="field"><label for="fbrev">Dein Satz zum Fall <span class="opt">optional</span></label><textarea id="fbrev" maxlength="600" rows="3" placeholder="Was hat dir gefallen?"></textarea></div>
      <div class="field"><label for="fbimp">Was sollen wir besser machen? <span class="opt">optional, wird nie veröffentlicht</span></label><textarea id="fbimp" maxlength="1500" rows="2"></textarea></div>
      <div class="field"><span class="label">Dürfen wir deinen Satz auf mordsteam.com zeigen?</span>
        <label class="check"><input type="radio" name="pub" value="name"><span>Ja, mit meinem Vornamen</span></label>
        <label class="check"><input type="radio" name="pub" value="anon"><span>Ja, aber anonym</span></label>
        <label class="check"><input type="radio" name="pub" value="no" checked><span>Nein, nur für euch</span></label></div>
      <p class="err" id="fberr" hidden></p>
      <button type="button" class="btn btn-red" id="fbsend">Feedback senden</button>
    </section>`}`;
    let stars = 0, diff = "";
    root.querySelectorAll("[data-star]").forEach((b) => (b.onclick = () => { stars = Number(b.dataset.star); root.querySelectorAll("[data-star]").forEach((x) => x.classList.toggle("on", Number(x.dataset.star) <= stars)); }));
    root.querySelectorAll("[data-diff]").forEach((b) => (b.onclick = () => { diff = b.dataset.diff; root.querySelectorAll("[data-diff]").forEach((x) => x.classList.toggle("on", x === b)); }));
    if ($("fbsend")) $("fbsend").onclick = async () => {
      if (!stars) { $("fberr").textContent = "Bitte wähle 1 bis 5 Sterne."; $("fberr").hidden = false; return; }
      $("fbsend").disabled = true;
      const pub = (root.querySelector("input[name=pub]:checked") || {}).value || "no";
      try {
        await api("POST", "feedback", { rating: stars, difficulty: diff, review: $("fbrev").value, improve: $("fbimp").value, publish: pub, publish_name: (S.name || "").split(/\s+/)[0] });
        $("fb").innerHTML = `<div class="eyebrow">Dein Feedback</div><h3 style="margin-top:6px">Danke!</h3><p class="muted">Dein Feedback ist angekommen.</p>`;
      } catch (e) { $("fberr").textContent = e.message; $("fberr").hidden = false; $("fbsend").disabled = false; }
    };
    if ($("copyv")) $("copyv").onclick = async () => { try { await navigator.clipboard.writeText(r.voucher); $("copyv").textContent = "Kopiert ✓"; } catch { $("copyv").textContent = r.voucher; } };
    if ($("pdf")) $("pdf").onclick = () => certificate("pdf", r);
    if ($("png")) $("png").onclick = () => certificate("png", r);
    if ($("again")) $("again").onclick = async () => {
      $("again").disabled = true;
      try { const d = await api("POST", "start", { code, replay: true }); token = d.token; seen = new Set(); MS.set("ms_solo_seen", "[]"); tab = "akte"; openDoc = null; verdict = null; await refresh(); scrollTo(0, 0); }
      catch (e) { $("again").disabled = false; $("again").insertAdjacentHTML("afterend", `<p class="err">${esc(e.message)}</p>`); }
    };
  }

  // ---------- Urkunde: A4 quer, als Bild gezeichnet – als PDF oder PNG, unabhängig vom Druckdialog ----------
  async function certificate(kind, r) {
    try { await document.fonts.ready; } catch {}
    const W = 2339, H = 1654, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    const fam = (sel, fb) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).fontFamily : fb; };
    const serif = fam(".bigstamp strong", "Georgia, serif"), mono = fam(".so-score b", "monospace"), sans = getComputedStyle(document.body).fontFamily;
    const INK = "#15171C", RED = "#B3261E", MUT = "#5A5D66";
    g.fillStyle = "#F3EFE6"; g.fillRect(0, 0, W, H);
    g.strokeStyle = INK; g.lineWidth = 10; g.strokeRect(70, 70, W - 140, H - 140); g.lineWidth = 3; g.strokeRect(96, 96, W - 192, H - 192);
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    const spaced = (t) => t.split("").join(String.fromCharCode(8202, 8202));
    const fit = (t, font, size, max) => { let s = size; do { g.font = font.replace("SIZE", s + "px"); s -= 4; } while (g.measureText(t).width > max && s > 20); };
    // Marke
    g.font = `900 72px ${serif}`; const wM = g.measureText("MORDS").width, wT = g.measureText("TEAM").width;
    g.font = `700 34px ${mono}`; const sub = spaced("  SOLO"), wS = g.measureText(sub).width;
    let x = W / 2 - (wM + wT + wS) / 2; g.textAlign = "left";
    g.font = `900 72px ${serif}`; g.fillStyle = RED; g.fillText("MORDS", x, 300); g.fillStyle = INK; g.fillText("TEAM", x + wM, 300);
    g.font = `700 34px ${mono}`; g.fillText(sub, x + wM + wT, 300);
    g.textAlign = "center";
    g.fillStyle = RED; g.font = `600 36px ${mono}`; g.fillText(spaced("URKUNDE"), W / 2, 420);
    g.fillStyle = INK; fit(S.name, `900 SIZE ${serif}`, 170, W - 500); g.fillText(S.name, W / 2, 620);
    g.font = `400 50px ${sans}`; g.fillText("hat den Fall „Nachtzug nach Venedig“ gelöst", W / 2, 760);
    g.fillText("und den Täter überführt, bevor der Zug in Udine hielt.", W / 2, 830);
    const date = new Intl.DateTimeFormat("de-AT", { dateStyle: "long" }).format(new Date(S.started_at + (r.played_ms || 0)));
    const cols = [["ENDZEIT", MS.dur(r.score_ms)], ...(r.pct !== null && r.pct !== undefined ? [["SCHNELLER ALS", r.pct + " %"]] : []), ["DATUM", date]];
    const cw = 560, x0 = W / 2 - (cols.length * cw) / 2 + cw / 2;
    cols.forEach(([l, v], k) => { g.fillStyle = MUT; g.font = `600 28px ${mono}`; g.fillText(spaced(l), x0 + k * cw, 1010); g.fillStyle = INK; g.font = `700 60px ${mono}`; g.fillText(v, x0 + k * cw, 1090); });
    // Stempel
    g.save(); g.translate(W - 470, H - 360); g.rotate(-0.12); g.strokeStyle = RED; g.fillStyle = RED;
    g.lineWidth = 9; g.strokeRect(-250, -95, 500, 190); g.lineWidth = 3; g.strokeRect(-232, -77, 464, 154);
    g.font = `700 24px ${mono}`; g.fillText(spaced("MORDSTEAM · SOLO 001"), 0, -32); g.font = `900 70px ${serif}`; g.fillText("GELÖST", 0, 40); g.restore();
    g.fillStyle = MUT; g.font = `400 30px ${mono}`; g.fillText(spaced("mordsteam.com"), W / 2, H - 170);
    const base = "Mordsteam-Urkunde-" + (S.name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "Solo");
    const blob = kind === "pdf" ? await pdfFromCanvas(c) : await new Promise((ok) => c.toBlob(ok, "image/png"));
    const file = new File([blob], base + (kind === "pdf" ? ".pdf" : ".png"), { type: blob.type });
    if (navigator.canShare && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: file.name }); return; } catch {}
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  // Minimales PDF: eine A4-Seite quer (842 × 595 pt) mit dem Urkunden-Bild als JPEG
  async function pdfFromCanvas(c) {
    const jpg = new Uint8Array(await (await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.92))).arrayBuffer());
    const enc = new TextEncoder(), parts = [], offs = [];
    let len = 0;
    const push = (x) => { const b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push("\nendobj\n"); };
    const content = "q 841.89 0 0 595.28 0 0 cm /Im0 Do Q";
    push("%PDF-1.4\n");
    obj(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
    obj(2, () => push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
    obj(3, () => push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"));
    obj(4, () => { push(`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); push(jpg); push("\nendstream"); });
    obj(5, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    const xref = len;
    push(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map((n) => String(offs[n]).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts, { type: "application/pdf" });
  }


  $("ff5").onclick = async () => { try { await refresh(await api("POST", "test/vorspulen")); } catch {} };
  loadTicket();
})();
