// Mordsteam Solo – Spieloberfläche (ein/e Ermittler/in, eigener Code, eigene Uhr)
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const root = $("root"), clock = $("clock"), tabs = $("tabs");
  const esc = MS.esc, pad = (n) => String(n).padStart(2, "0");
  let code = (MS.qs("c") || MS.qs("code") || MS.get("ms_solo_code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  let token = null, S = null, off = 0, tab = "einsatz", openDoc = null, busy = false, verdict = null, armed = false, giveArmed = false;
  let seen = new Set(JSON.parse(MS.get("ms_solo_seen") || "[]"));
  // Texte je Fall – ohne Angabe gelten die von Solo 001 (Nachtzug)
  const U = () => Object.assign({ clock: "Zug", until: "bis Udine", late: "Polizei wartet", stamp: "NACHTZUG", fb: "den Nachtzug",
    cert: "und den Täter überführt, bevor der Zug in Udine hielt.", caseNo: "SOLO 001", stages: { 2: "Neue Beweisstücke: Belege und Protokolle", 3: "Neue Beweisstücke: das Gemälde" } }, (S && S.ui) || {});

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

  // ---------- Vor dem Start: Ermittlername (die Uhr steht noch) ----------
  function briefingView(t, err) {
    tabs.hidden = true; clock.innerHTML = "";
    const b = t.briefing, needName = !t.name;
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">${esc(b.eyebrow)}</span><span class="conf">Solo · ${t.limit_min} Min.</span></div>
      <h1>${b.title}</h1>
      <form id="sf" class="form" style="margin-top:22px">
      ${needName ? `<div class="field"><label for="nm">Dein Ermittlername</label><input id="nm" required maxlength="40" autocomplete="nickname" placeholder="z. B. Martina Huber"><span class="small">Steht in der Geschichte und auf deiner Urkunde.</span></div>` : ""}
      <p class="small">Du kannst auf jedem Gerät ermitteln – Handy, Tablet oder Laptop. Mit deinem Code kannst du auch mitten im Fall auf ein anderes Gerät wechseln und dort weitermachen.</p>
      <p class="small">Als Nächstes liest du deinen Einsatz und die Spielregeln. Die Uhr startet erst, wenn du die Akte oder die Fragen öffnest.</p>
      <button class="btn btn-red btn-big" type="submit">Weiter zum Einsatz</button><p class="err" role="alert">${err ? esc(err) : ""}</p></form>
    </div></section>`;
    $("sf").onsubmit = async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button"); btn.disabled = true;
      try { const d = await api("POST", "start", { code, name: needName ? $("nm").value : undefined }); token = d.token; seen = new Set(); MS.set("ms_solo_seen", "[]"); tab = "einsatz"; await refresh(); scrollTo(0, 0); }
      catch (e2) { briefingView(t, e2.message); }
    };
  }

  // ---------- Einsatz: Geschichte und Regeln (erster Reiter) ----------
  function einsatzView() {
    const b = S.briefing;
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">${esc(b.eyebrow)}</span><span class="conf">Solo · ${S.limit_min} Min.</span></div>
      <h1>${b.title}</h1><p class="sub">${b.text}${S.begun ? " Die Uhr oben läuft bereits." : ""}</p>
      <ol class="steps">${b.steps.map((x, i) => `<li><span class="n">${i + 1}</span><div><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div></li>`).join("")}</ol>
      <h2 class="qhead">Deine ${["", "eine", "zwei", "drei", "vier", "fünf"][S.questions.length] || S.questions.length} Fragen</h2>
      <div class="qcards">${S.questions.map((q) => `<div><i>${pad(q.nr)}</i><span>${esc(q.label)}</span></div>`).join("")}</div>
      ${S.begun ? "" : `<p class="small" style="margin-bottom:12px">Die Uhr startet, sobald du die Akte oder die Fragen öffnest, und lässt sich dann nicht mehr anhalten.</p>`}
      <button type="button" class="btn btn-red btn-big" id="toAkte">${S.begun ? "Zur Akte →" : "Akte öffnen – die Uhr startet →"}</button>
    </div></section>`;
    $("toAkte").onclick = () => go("akte");
  }

  // ---------- Stand laden ----------
  async function refresh(d) {
    try { S = d || (await api("GET", "state")); }
    catch (e) { if (e.status === 401) { token = null; return codeView(e.message); } root.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
    off = S.now - Date.now();
    $("pname").textContent = S.name || S.title;
    document.title = "Mordsteam Solo – " + S.title;
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
    $("vtab").hidden = !S.verhoer;
    $("vbadge").hidden = !(S.verhoer && S.verhoer.open && !MS.get("ms_solo_v_" + S.code + "_" + S.started_at));
    if (!S.begun) tab = "einsatz";
    if (tab === "verhoer" && S.verhoer) return verhoerView();
    if (tab === "einsatz") return einsatzView();
    if (tab === "fragen") return fragenView();
    return openDoc !== null ? docView() : akteView();
  }
  // Beim Wechsel zwischen Akte und Fragen bleibt das zuletzt geöffnete Beweisstück offen (wie bei Fall 001)
  async function go(t) {
    // Erster Wechsel vom Einsatz zur Akte oder zu den Fragen startet die Uhr
    if (t !== "einsatz" && S && !S.begun && !S.ended) {
      if (busy) return;
      busy = true;
      try { const d = await api("POST", "begin"); tab = t; await refresh(d); }
      catch (e) { toast(esc(e.message)); }
      busy = false; scrollTo(0, 0); return;
    }
    tab = t; render(); scrollTo(0, 0);
  }
  tabs.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => go(b.dataset.tab)));

  // ---------- Uhr ----------
  function tick() {
    if (!S) return;
    if (S.ended) { clock.innerHTML = ""; return; }
    if (!S.begun) {
      $("fallname").textContent = `${U().clock} ${pad(Math.floor(S.train_start / 60))}:${pad(S.train_start % 60)} · ${S.title}`;
      clock.className = "clock";
      clock.innerHTML = `<span class="clk"><span class="clk-label">Uhr steht</span><b class="clk-time">${MS.dur(S.limit_min * 60000)}</b></span>`;
      return;
    }
    const now = Date.now() + off, el = now - S.started_at, left = S.limit_min * 60000 - el;
    const tm = S.train_start + Math.floor(el / 60000), train = `${pad(Math.floor(tm / 60) % 24)}:${pad(tm % 60)}`;
    const pen = S.penalty_min ? `<span class="pen">+${S.penalty_min} Min. Strafe</span>` : "";
    $("fallname").textContent = `${U().clock} ${train} · ${S.title}`;
    clock.className = "clock" + (left <= 0 ? " late" : left < 5 * 60000 ? " urgent" : "");
    clock.innerHTML = `<span class="clk"><span class="clk-label">${left > 0 ? U().until : U().late}</span><b class="clk-time">${MS.dur(left > 0 ? left : el)}</b>${pen}</span>`;
  }
  setInterval(tick, 1000);

  // ---------- Akte ----------
  const kindClass = (d) => ({ Notiz: "k-note", Beleg: "k-receipt", Systemauszug: "k-sys", Liste: "k-mail", Befund: "k-mail", Protokoll: "k-note", Fundstück: "k-press" })[d.kk || d.kind] || "";
  const ROT = [-1.4, 0.9, -0.5, 1.2, -1, 0.6, -0.2, 1.4];
  function akteView() {
    const read = S.docs.filter((d) => seen.has(d.id)).length;
    root.innerHTML = `<div class="deskhead"><h2>Fallakte</h2><span>${read} / ${S.docs.length} gelesen</span></div>
      <div class="evid">${S.docs.map((d, i) => `${d.stage >= 2 && (i === 0 || S.docs[i - 1].stage !== d.stage) ? `<div class="actdiv"><span class="conf">Frage ${d.stage - 1} gelöst</span><b>${U().stages[d.stage] || "Neue Beweisstücke"}</b></div>` : ""}
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

  // ---------- Solo Plus: Verhörraum ----------
  let V = null, vSel = null, vBusy = false, vErr = "";
  async function verhoerView() {
    MS.set("ms_solo_v_" + S.code + "_" + S.started_at, "1"); $("vbadge").hidden = true;
    if (!S.verhoer.open) {
      root.innerHTML = `<section class="report paper"><div class="eyebrow">Plus · Verhörraum</div><h2>Noch verschlossen</h2>
        <p class="muted">Der Verhörraum öffnet, sobald du Frage ${S.verhoer.from_question} gelöst hast. Dann befragst du die Verdächtigen selbst – ${S.verhoer.max} Fragen hast du.</p></section>`;
      return;
    }
    if (!V) { try { V = await api("GET", "verhoer"); } catch (e) { root.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; } }
    if (vSel === null) vSel = V.suspects[0].key;
    const left = V.max - V.used, th = V.threads[vSel] || [], who = V.suspects.find((x) => x.key === vSel);
    root.innerHTML = `<section class="report paper fr-verhoer">
      <div class="eyebrow">Plus · Verhörraum · KI</div>
      <h2>Wen willst du verhören?</h2>
      <p class="muted">Die Verdächtigen werden von einer KI gespielt und kennen nur die erfundene Welt des Falls. Einer von ihnen lügt. ${V.ended ? "Der Fall ist abgeschlossen – hier kannst du die Gespräche nachlesen." : `Du hast noch <b>${left} von ${V.max}</b> Fragen.`}</p>
      <div class="fr-suspects">${V.suspects.map((x) => `<button type="button" class="chipbtn ${x.key === vSel ? "on" : ""}" data-sus="${x.key}">${esc(x.name)}${(V.threads[x.key] || []).length ? " ·" + V.threads[x.key].filter((m) => m.role === "user").length : ""}</button>`).join("")}</div>
      <div class="fr-thread" id="thread">${th.length ? th.map((m) => `<div class="fr-msg ${m.role === "user" ? "q" : "a"}"><small>${m.role === "user" ? "Du" : esc(who.name) + " · KI"}</small>${m.text}</div>`).join("") : `<p class="small muted">Noch keine Fragen an ${esc(who.name)}. Tipp: Frag, wo ${esc(who.name.split(" ").pop())} während des Feuerwerks war.</p>`}${vBusy ? `<div class="fr-msg a typing"><small>${esc(who.name)} · KI</small>…</div>` : ""}</div>
      ${V.ended ? "" : left > 0 ? `<form id="vf" class="fr-ask"><input id="vq" maxlength="${V.max_chars}" autocomplete="off" placeholder="Deine Frage an ${esc(who.name)} …" ${vBusy ? "disabled" : ""}><button class="btn btn-red" type="submit" ${vBusy ? "disabled" : ""}>Fragen</button></form>` : `<p class="note">Du hast alle Fragen gestellt. Die Hinweise zur Frage helfen dir weiter.</p>`}
      ${vErr ? `<p class="err">${esc(vErr)}</p>` : ""}
      <p class="small" style="margin-top:14px"><button type="button" class="linkbtn" id="toQv">Zu den Fragen →</button></p>
    </section>`;
    const t = $("thread"); if (t) t.scrollTop = t.scrollHeight;
    root.querySelectorAll("[data-sus]").forEach((b) => (b.onclick = () => { vSel = b.dataset.sus; vErr = ""; verhoerView(); }));
    $("toQv").onclick = () => go("fragen");
    if ($("vf")) $("vf").onsubmit = async (e) => {
      e.preventDefault();
      const text = $("vq").value.trim(); if (!text || vBusy) return;
      vBusy = true; vErr = ""; V.threads[vSel] = [...(V.threads[vSel] || []), { role: "user", text: esc(text) }]; verhoerView();
      try { V = await api("POST", "verhoer", { suspect: vSel, text }); } catch (e2) { vErr = e2.message; V.threads[vSel].pop(); }
      vBusy = false; if (tab === "verhoer") verhoerView();
    };
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
      : q.type === "code" ? `<input id="ans" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" spellcheck="false" placeholder="0000" maxlength="4" class="so-time">`
      : `<input id="ans" type="text" inputmode="numeric" pattern="[0-9:]*" autocomplete="off" spellcheck="false" placeholder="hh:mm" maxlength="5" class="so-time"><span class="small">Nur die vier Ziffern tippen – der Doppelpunkt kommt von selbst.</span>`;
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
      ${blattHtml()}
      <p style="margin-top:26px;text-align:right">${giveArmed ? `<span class="small">Wirklich aufgeben? Du siehst dann die Auflösung${S.first_play ? " und kommst nicht in die Wertung" : ""}.</span> <button type="button" class="btn btn-ink" id="give">Ja, Auflösung zeigen</button> <button type="button" class="linkbtn" id="giveno">Weiter ermitteln</button>` : `<button type="button" class="linkbtn" id="give">Aufgeben und Auflösung ansehen</button>`}</p>
    </section>`;
    bindBlatt();
    const inp = $("ans");
    if (inp && q.type === "code") {
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("check").click(); } });
      inp.addEventListener("input", () => { inp.value = inp.value.replace(/[^0-9]/g, "").slice(0, 4); });
    }
    if (inp && q.type === "time") {
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("check").click(); } });
      inp.addEventListener("input", (e) => {
        const dg = inp.value.replace(/[^0-9]/g, "").slice(0, 4);
        // beim Löschen den Doppelpunkt nicht sofort wieder einsetzen
        const del = e.inputType && e.inputType.startsWith("delete");
        inp.value = dg.length > 2 || (dg.length === 2 && !del) ? dg.slice(0, 2) + ":" + dg.slice(2) : dg;
      });
    }
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

  // ---------- Ermittlungsblatt: Denkhilfe, bleibt nur auf diesem Gerät ----------
  const blattKey = () => "ms_solo_blatt_" + S.code + "_" + S.started_at;
  const blattGet = () => { try { return JSON.parse(MS.get(blattKey()) || "{}"); } catch { return {}; } };
  const MARK = [["?", "offen"], ["✓", "hat Alibi"], ["!", "verdächtig"]];
  function blattHtml() {
    const tq = S.questions.find((x) => x.key === "taeter");
    if (!tq || !tq.options) return "";
    const B = blattGet();
    return `<details class="so-blatt" ${B._open ? "open" : ""}><summary>Dein Ermittlungsblatt</summary>
      <p class="small muted">Hak ab, wer ein Alibi hat – nur für dich, auf diesem Gerät.</p>
      ${tq.options.map((o) => { const x = B[o[0]] || {}; const m = MARK[x.m || 0]; return `<div class="so-brow"><button type="button" class="chipbtn so-mark m${x.m || 0}" data-bl="${esc(o[0])}" title="${m[1]}">${m[0]} ${m[1]}</button><b>${esc(o[1])}</b><input data-bn="${esc(o[0])}" maxlength="80" placeholder="Notiz …" value="${esc(x.n || "")}"></div>`; }).join("")}
    </details>`;
  }
  function bindBlatt() {
    const save = (B) => MS.set(blattKey(), JSON.stringify(B));
    const det = root.querySelector(".so-blatt");
    if (!det) return;
    det.addEventListener("toggle", () => { const B = blattGet(); B._open = det.open; save(B); });
    root.querySelectorAll("[data-bl]").forEach((b) => (b.onclick = () => {
      const B = blattGet(), k = b.dataset.bl; B[k] = B[k] || {}; B[k].m = ((B[k].m || 0) + 1) % 3; save(B);
      const m = MARK[B[k].m]; b.textContent = m[0] + " " + m[1]; b.className = "chipbtn so-mark m" + B[k].m;
    }));
    root.querySelectorAll("[data-bn]").forEach((i) => (i.oninput = () => { const B = blattGet(), k = i.dataset.bn; B[k] = B[k] || {}; B[k].n = i.value; save(B); }));
  }

  async function answer(q, value) {
    if (busy) return;
    if (!String(value || "").trim()) { verdict = { cls: "warn", html: q.type === "select" ? "Bitte eine Antwort auswählen." : q.type === "code" ? "Bitte den Code eingeben." : "Bitte eine Uhrzeit eingeben." }; return fragenView(); }
    if (q.type === "code" && String(value).replace(/[^0-9]/g, "").length !== 4) {
      verdict = { cls: "warn", html: "Bitte alle vier Ziffern eingeben." }; fragenView();
      const i = $("ans"); if (i) { i.value = String(value); i.focus(); } return;
    }
    if (q.type === "time") {
      // unvollständige Eingabe nicht werten (keine Strafminuten für Tippfehler)
      const dg = String(value).replace(/[^0-9]/g, "");
      if (dg.length !== 4 || Number(dg.slice(0, 2)) > 23 || Number(dg.slice(2)) > 59) {
        verdict = { cls: "warn", html: "Bitte die Uhrzeit vollständig als hh:mm eingeben, z. B. 23:05." }; fragenView();
        const i = $("ans"); if (i) { i.value = String(value); i.focus(); } return;
      }
    }
    busy = true; $("check").disabled = true; $("check").textContent = "Wird geprüft …";
    try {
      const d = await api("POST", "answer", { key: q.key, value });
      armed = false;
      if (d.correct) {
        verdict = null;
        openDoc = null;          // neue Beweisstücke: zurück zur Akte führt in die Übersicht
        await refresh(d);
        const vNow = S.verhoer && S.verhoer.open && q.nr === S.verhoer.from_question;
        if (vNow) V = null;
        if (!d.ended) { verdict = { cls: "good", html: `<strong>Richtig!</strong>Frage ${q.nr} ist gelöst. Neue Beweisstücke liegen in deiner Akte.${vNow ? " Und der Verhörraum ist offen." : ""}` }; fragenView(); toast(vNow ? `🗣️ Der Verhörraum ist offen <b>Ansehen</b>` : `📁 Neue Beweisstücke in deiner Akte <b>Ansehen</b>`); }
        scrollTo(0, 0);
      } else {
        verdict = { cls: "bad", html: `<strong>Leider falsch.</strong>+${d.penalty} Minuten Strafzeit. Schau dir die Beweisstücke noch einmal an.` };
        await refresh(d);
      }
    } catch (e) { verdict = { cls: "warn", html: esc(e.message) }; fragenView(); }
    busy = false;
  }

  // ---------- Ergebnis und Urkunde ----------
  // ---------- Feedback: gezielt nach dem ersten Spiel und (einmal) nach einer Wiederholung ----------
  const chips = (key, list) => `<div class="chips-row">${list.map((x) => `<button type="button" class="chipbtn" data-${key}="${x}">${x}</button>`).join("")}</div>`;
  function fbHtml() {
    const fb = S.feedback || {};
    const askReplay = !S.first_play && !fb.replay, askInitial = !fb.initial;
    if (!askReplay && !askInitial) return "";
    const parts = String(S.name || "").trim().split(/\s+/).filter(Boolean);
    const vor = parts[0] || "", ini = parts.length > 1 ? `${vor} ${parts[parts.length - 1][0].toUpperCase()}.` : "";
    const replay = askReplay ? `<section class="report paper so-fb" id="fbr">
      <div class="eyebrow">Kurze Frage zu deiner Wiederholung</div><h3 style="margin-top:6px">Wie war es beim zweiten Mal?</h3>
      <div class="field"><span class="label">Mit dem Wissen aus dem ersten Spiel war der Fall …</span>${chips("leicht", ["viel zu leicht", "noch spannend", "genauso knifflig"])}</div>
      <div class="field"><span class="label">Hat sich das Nochmal-Spielen gelohnt?</span>${chips("lohnt", ["ja", "geht so", "nein"])}</div>
      <div class="field"><label for="fbrn">Anmerkung <span class="opt">optional, nur für uns</span></label><textarea id="fbrn" maxlength="1000" rows="2"></textarea></div>
      <p class="err" id="fbrerr" hidden></p><button type="button" class="btn btn-red" id="fbrsend">Senden</button></section>` : "";
    const initial = askInitial ? `<section class="report paper so-fb" id="fbi">
      <div class="eyebrow">Dein Feedback${S.first_play ? "" : " zum ersten Spiel"}</div><h3 style="margin-top:6px">Wie fandest du ${esc(U().fb)}?</h3>
      <p class="muted">Zwei Klicks, die uns sehr helfen – neue Fälle bauen wir aus eurem Feedback.</p>
      <div class="stars" role="radiogroup" aria-label="Sterne">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${n} von 5 Sternen">★</button>`).join("")}</div>
      <div class="field"><span class="label">Wie schwer war der Fall?</span>${chips("diff", ["zu leicht", "genau richtig", "zu schwer"])}</div>
      <div class="field"><label for="fbimp">Was sollen wir besser machen? <span class="opt">optional, nur für uns</span></label><textarea id="fbimp" maxlength="1500" rows="2"></textarea></div>
      <div class="fbpub"><div class="field"><label for="fbrev">Ein paar Worte für andere Ermittler?</label><span class="hint">Über ein nettes Feedback freuen wir uns besonders. Optional.</span><textarea id="fbrev" maxlength="600" rows="3" placeholder="Was hat dir gefallen?"></textarea></div>
      <div class="field"><span class="label">Dürfen wir deine Worte auf mordsteam.com zeigen?</span>
        ${vor ? `<label class="check"><input type="radio" name="pub" value="vorname"><span>Ja, als „${esc(vor)}“</span></label>` : ""}
        ${ini ? `<label class="check"><input type="radio" name="pub" value="initial"><span>Ja, als „${esc(ini)}“</span></label>` : ""}
        <label class="check"><input type="radio" name="pub" value="anon"><span>Ja, aber anonym</span></label>
        <label class="check"><input type="radio" name="pub" value="no" checked><span>Nein, nur für euch</span></label></div></div>
      <p class="err" id="fbierr" hidden></p><button type="button" class="btn btn-red" id="fbisend">Feedback senden</button></section>` : "";
    return replay + initial;
  }
  function bindFeedback() {
    const pick = {};
    root.querySelectorAll("[data-star],[data-diff],[data-leicht],[data-lohnt]").forEach((b) => (b.onclick = () => {
      const key = ["star", "diff", "leicht", "lohnt"].find((k) => b.dataset[k] !== undefined);
      pick[key] = b.dataset[key];
      if (key === "star") root.querySelectorAll("[data-star]").forEach((x) => x.classList.toggle("on", Number(x.dataset.star) <= Number(pick.star)));
      else root.querySelectorAll(`[data-${key}]`).forEach((x) => x.classList.toggle("on", x === b));
    }));
    const thanks = (id) => { $(id).innerHTML = `<div class="eyebrow">Feedback</div><h3 style="margin-top:6px">Danke!</h3><p class="muted">Dein Feedback ist angekommen.</p>`; };
    if ($("fbrsend")) $("fbrsend").onclick = async () => {
      if (!pick.leicht && !pick.lohnt) { $("fbrerr").textContent = "Bitte wähle mindestens eine Antwort."; $("fbrerr").hidden = false; return; }
      $("fbrsend").disabled = true;
      try { await api("POST", "feedback", { kind: "replay", leicht: pick.leicht || "", lohnt: pick.lohnt || "", notiz: $("fbrn").value }); S.feedback.replay = true; thanks("fbr"); }
      catch (e) { $("fbrerr").textContent = e.message; $("fbrerr").hidden = false; $("fbrsend").disabled = false; }
    };
    if ($("fbisend")) $("fbisend").onclick = async () => {
      if (!pick.star) { $("fbierr").textContent = "Bitte wähle 1 bis 5 Sterne."; $("fbierr").hidden = false; return; }
      $("fbisend").disabled = true;
      const pub = (root.querySelector("input[name=pub]:checked") || {}).value || "no";
      try { await api("POST", "feedback", { kind: "initial", rating: Number(pick.star), difficulty: pick.diff || "", improve: $("fbimp").value, review: $("fbrev").value, publish: pub }); S.feedback.initial = true; thanks("fbi"); }
      catch (e) { $("fbierr").textContent = e.message; $("fbierr").hidden = false; $("fbisend").disabled = false; }
    };
  }

  function resultView() {
    const r = S.result || {};
    const solved = S.solved;
    const pctLine = !S.first_play ? "Wiederholung – zählt nicht für die Wertung."
      : !solved ? "" : r.pct === null || r.pct === undefined ? "Du bist unter den ersten Ermittlern dieses Falls – der Vergleich startet mit den nächsten Spielen."
      : `Du warst schneller als <b>${r.pct} %</b> aller Ermittler${r.pct_n < 20 ? ` <span class="small">(bisher ${r.pct_n} Vergleichsspiele)</span>` : ""}.`;
    const rp = S.replay || { left: 0 };
    const until = rp.until ? new Intl.DateTimeFormat("de-AT", { dateStyle: "long" }).format(new Date(rp.until)) : "";
    root.innerHTML = `<section class="report paper so-result">
      <div class="solved"><div class="bigstamp ${solved ? "" : "grey"}"><div><small>MORDSTEAM SOLO · ${esc(U().stamp)}</small><strong>${solved ? "FALL GELÖST" : "AKTE GESCHLOSSEN"}</strong><small>${esc((S.name || "").toUpperCase())}</small></div></div></div>
      ${solved ? `<div class="so-score"><div><small>Endzeit</small><b>${MS.dur(r.score_ms)}</b></div><div><small>Gespielt</small><b>${MS.dur(r.played_ms)}</b></div><div><small>Strafminuten</small><b>${S.penalty_min}</b></div></div>
        <p class="so-pct">${pctLine}</p>` : `<p class="so-pct">${S.first_play ? "Diesmal hat es nicht gereicht – hier ist die Auflösung." : "Hier ist die Auflösung."}</p>`}
      <h3>Die Auflösung</h3>
      <p>${r.summary ? `<b>${esc(r.summary)}</b>` : `<b>Täter/in: ${esc(r.culprit)}</b> · Tatzeit ${esc(r.zeit || "01:31")} · Versteck: ${esc(r.item)}`}</p>
      <p>${esc(r.text)}</p>
      ${r.voucher ? `<div class="so-voucher"><small>Dein Gutschein für ein Friends- oder Teams-Spiel</small><b class="mono">${esc(r.voucher)}</b><span>5 € Rabatt auf ein Friends- oder Teams-Spiel · im Bezahlschritt eingeben · 1 Gutschein pro Bestellung, nicht mit Early Bird kombinierbar</span><button type="button" class="btn btn-line" id="copyv">Code kopieren</button></div>` : ""}
      ${solved && S.first_play ? `<div class="actions-row" style="margin-top:22px"><button type="button" class="btn btn-red" id="pdf">Urkunde als PDF speichern</button><button type="button" class="btn btn-line" id="png">Urkunde als Bild</button></div><p class="small" style="margin-top:6px">A4 im Querformat – zum Ausdrucken oder Teilen.</p>` : ""}
      ${rp.left > 0 ? `<div class="actions-row" style="margin-top:18px"><button type="button" class="btn btn-line" id="again">Nochmal spielen – anderer Täter</button></div>
      <p class="small" style="margin-top:8px">Noch ${rp.left} ${rp.left === 1 ? "Wiederholung" : "Wiederholungen"} möglich${until ? `, bis ${until}` : ""}. Jedes Mal wird ein anderer Täter ausgelost, einige Beweisstücke ändern sich. Wiederholungen zählen nicht für die Wertung.</p>`
      : `<p class="small" style="margin-top:18px">${S.replay && S.replay.until && Date.now() > S.replay.until ? "Der Zeitraum für Wiederholungen ist vorbei." : "Du hast alle Wiederholungen genutzt."} Weitere Ermittlungen warten – allein, mit Freunden oder im Team: <a href="/">mordsteam.com</a></p>`}
    </section>
    ${fbHtml()}`;
    bindFeedback();
    if ($("copyv")) $("copyv").onclick = async () => { try { await navigator.clipboard.writeText(r.voucher); $("copyv").textContent = "Kopiert ✓"; } catch { $("copyv").textContent = r.voucher; } };
    if ($("pdf")) $("pdf").onclick = () => certificate("pdf", r);
    if ($("png")) $("png").onclick = () => certificate("png", r);
    if ($("again")) $("again").onclick = async () => {
      $("again").disabled = true;
      try { const d = await api("POST", "start", { code, replay: true }); token = d.token; seen = new Set(); MS.set("ms_solo_seen", "[]"); tab = "einsatz"; openDoc = null; verdict = null; V = null; vSel = null; await refresh(); scrollTo(0, 0); }
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
    g.font = `400 50px ${sans}`; g.fillText(`hat den Fall „${S.title}“ gelöst`, W / 2, 760);
    g.fillText(U().cert, W / 2, 830);
    const date = new Intl.DateTimeFormat("de-AT", { dateStyle: "long" }).format(new Date(S.started_at + (r.played_ms || 0)));
    const cols = [["ENDZEIT", MS.dur(r.score_ms)], ...(r.pct !== null && r.pct !== undefined ? [["SCHNELLER ALS", r.pct + " %"]] : []), ["DATUM", date]];
    const cw = 560, x0 = W / 2 - (cols.length * cw) / 2 + cw / 2;
    cols.forEach(([l, v], k) => { g.fillStyle = MUT; g.font = `600 28px ${mono}`; g.fillText(spaced(l), x0 + k * cw, 1010); g.fillStyle = INK; g.font = `700 60px ${mono}`; g.fillText(v, x0 + k * cw, 1090); });
    // Stempel
    g.save(); g.translate(W - 470, H - 360); g.rotate(-0.12); g.strokeStyle = RED; g.fillStyle = RED;
    g.lineWidth = 9; g.strokeRect(-250, -95, 500, 190); g.lineWidth = 3; g.strokeRect(-232, -77, 464, 154);
    g.font = `700 24px ${mono}`; g.fillText(spaced("MORDSTEAM · " + U().caseNo), 0, -32); g.font = `900 70px ${serif}`; g.fillText("GELÖST", 0, 40); g.restore();
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
