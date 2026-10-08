// Mordsteam Solo – Spieloberfläche (ein/e Ermittler/in, eigener Code, eigene Uhr)
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const root = $("root"), clock = $("clock"), tabs = $("tabs");
  const esc = MS.esc, pad = (n) => String(n).padStart(2, "0");
  let code = (MS.qs("c") || MS.qs("code") || MS.get("ms_solo_code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  let token = null, S = null, off = 0, tab = "einsatz", openDoc = null, busy = false, verdict = null, armed = false, giveArmed = false;
  let seen = new Set(JSON.parse(MS.get("ms_solo_seen") || "[]"));
  // Feste Oberflächentexte zweisprachig: L(deutsch, englisch) – die Spielsprache der Runde (S.lang) gewinnt
  const dmy = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || "")); return m ? `${Number(m[3])}.${Number(m[2])}.${m[1]}` : String(d || ""); };
  const L = (de, en) => MS.t(de, en);
  const EN = () => MS.lang === "en";
  const loc = () => (EN() ? "en-GB" : "de-AT");
  const minU = () => L("Min.", "min");
  const showSw = (on) => { const b = $("langsw"); if (b) b.hidden = !on; };
  // Texte je Fall – ohne Angabe gelten die von Solo 001 (Nachtzug)
  const U = () => Object.assign(EN()
    ? { clock: "Train", until: "to Udine", late: "Police waiting", stamp: "NIGHT TRAIN", fb: "the night train case",
      cert: "and unmasked the culprit before the train stopped in Udine.", caseNo: "SOLO 001", stages: { 2: "New evidence: receipts and records", 3: "New evidence: the painting" } }
    : { clock: "Zug", until: "bis Udine", late: "Polizei wartet", stamp: "NACHTZUG", fb: "den Nachtzug",
      cert: "und den Täter überführt, bevor der Zug in Udine hielt.", caseNo: "SOLO 001", stages: { 2: "Neue Beweisstücke: Belege und Protokolle", 3: "Neue Beweisstücke: das Gemälde" } }, (S && S.ui) || {});

  async function api(method, path, body) {
    const r = await fetch("/api/solo/" + path, { method, headers: { "content-type": "application/json", "x-lang": MS.lang, ...(token ? { "x-solo": token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let d = {}; try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d.error || L("Fehler ", "Error ") + r.status); e.status = r.status; throw e; }
    return d;
  }
  function toast(html, ms = 4200) {
    const t = $("toast"); t.innerHTML = `<button type="button">${html}</button>`; t.hidden = false;
    t.querySelector("button").onclick = () => { t.hidden = true; openDoc = null; go("akte"); };
    clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), ms);
  }

  // ---------- Einstieg: Code ----------
  function codeView(err) {
    tabs.hidden = true; clock.innerHTML = ""; showSw(true);
    root.innerHTML = `<div class="joinhero"><div class="eyebrow">Mordsteam Solo</div><h1>${L("Dein Fall wartet.", "Your case is waiting.")}</h1><p>${L("Gib den Code aus deiner Bestätigungsmail ein.", "Enter the code from your confirmation email.")}</p></div>
      <div class="panel center"><form id="cf" class="form"><div class="field"><label for="code">${L("Solo-Code", "Solo code")}</label>
      <input id="code" required maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(code)}" style="text-transform:uppercase;font-family:var(--mono);font-size:24px;letter-spacing:5px"></div>
      <div><button class="btn btn-red btn-big" type="submit">${L("Weiter", "Continue")}</button></div><p class="err" role="alert">${err ? esc(err) : ""}</p></form></div>`;
    $("cf").onsubmit = (e) => { e.preventDefault(); code = $("code").value.toUpperCase().replace(/[^A-Z0-9]/g, ""); loadTicket(); };
  }

  async function loadTicket() {
    if (!code) return codeView();
    let t;
    try { t = await api("GET", "ticket?code=" + encodeURIComponent(code)); }
    catch (e) { return codeView(e.message); }
    MS.set("ms_solo_code", code);
    // Die Sprache des Tickets gilt ab jetzt (fest gebucht)
    if (t.lang) MS.setLang(t.lang);
    showSw(false);
    if (t.token) { token = t.token; return refresh(); }
    briefingView(t);
  }

  // ---------- Vor dem Start: Ermittlername (die Uhr steht noch) ----------
  function briefingView(t, err) {
    tabs.hidden = true; clock.innerHTML = ""; showSw(false);
    const b = t.briefing, needName = !t.name;
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">${esc(b.eyebrow)}</span><span class="conf">Solo · ${t.limit_min} ${minU()}</span></div>
      <h1>${b.title}</h1>
      <form id="sf" class="form" style="margin-top:22px">
      ${needName ? `<div class="field"><label for="nm">${L("Dein Ermittlername", "Your detective name")}</label><input id="nm" required maxlength="40" autocomplete="nickname" placeholder="${L("z. B. Martina Huber", "e.g. Jane Smith")}"><span class="small">${L("Steht in der Geschichte und auf deiner Urkunde.", "It appears in the story and on your certificate.")}</span></div>` : ""}
      <p class="small">${L("Du kannst auf jedem Gerät ermitteln – Handy, Tablet oder Laptop. Mit deinem Code kannst du auch mitten im Fall auf ein anderes Gerät wechseln und dort weitermachen.", "You can investigate on any device – phone, tablet or laptop. With your code you can even switch to another device mid-case and carry on there.")}</p>
      <p class="small">${L("Als Nächstes liest du deinen Einsatz und die Spielregeln. Die Uhr startet erst, wenn du die Akte oder die Fragen öffnest.", "Next you’ll read your briefing and the rules. The clock only starts when you open the file or the questions.")}</p>
      <button class="btn btn-red btn-big" type="submit">${L("Weiter zum Einsatz", "On to the briefing")}</button><p class="err" role="alert">${err ? esc(err) : ""}</p></form>
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
      <div class="brief-top"><span class="eyebrow">${esc(b.eyebrow)}</span><span class="conf">Solo · ${S.limit_min} ${minU()}</span></div>
      <h1>${b.title}</h1><p class="sub">${b.text}${S.begun ? L(" Die Uhr oben läuft bereits.", " The clock at the top is already running.") : ""}</p>
      <ol class="steps">${b.steps.map((x, i) => `<li><span class="n">${i + 1}</span><div><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div></li>`).join("")}</ol>
      <h2 class="qhead">${L(`Deine ${["", "eine", "zwei", "drei", "vier", "fünf"][S.questions.length] || S.questions.length} Fragen`, `Your ${["", "one", "two", "three", "four", "five"][S.questions.length] || S.questions.length} question${S.questions.length === 1 ? "" : "s"}`)}</h2>
      <div class="qcards">${S.questions.map((q) => `<div><i>${pad(q.nr)}</i><span>${esc(q.label)}</span></div>`).join("")}</div>
      ${S.begun ? "" : `<p class="small" style="margin-bottom:12px">${L("Die Uhr startet, sobald du die Akte oder die Fragen öffnest, und lässt sich dann nicht mehr anhalten.", "The clock starts as soon as you open the file or the questions, and can’t be stopped after that.")}</p>`}
      <button type="button" class="btn btn-red btn-big" id="toAkte">${S.begun ? L("Zur Akte →", "To the file →") : L("Akte öffnen – die Uhr startet →", "Open the file – the clock starts →")}</button>
    </div></section>`;
    $("toAkte").onclick = () => go("akte");
  }

  // ---------- Stand laden ----------
  async function refresh(d) {
    try { S = d || (await api("GET", "state")); }
    catch (e) { if (e.status === 401) { token = null; return codeView(e.message); } root.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
    off = S.now - Date.now();
    // Spielsprache der Runde gewinnt; Umschalter verschwindet, solange eine Runde geladen ist
    if (S.lang && S.lang !== MS.lang) { MS.setLang(S.lang); V = null; }
    showSw(false);
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
      clock.innerHTML = `<span class="clk"><span class="clk-label">${L("Uhr steht", "Clock stopped")}</span><b class="clk-time">${MS.dur(S.limit_min * 60000)}</b></span>`;
      return;
    }
    const now = Date.now() + off, el = now - S.started_at, left = S.limit_min * 60000 - el;
    const tm = S.train_start + Math.floor(el / 60000), train = `${pad(Math.floor(tm / 60) % 24)}:${pad(tm % 60)}`;
    const pen = S.penalty_min ? `<span class="pen">${L(`+${S.penalty_min} Min. Strafe`, `+${S.penalty_min} min penalty`)}</span>` : "";
    $("fallname").textContent = `${U().clock} ${train} · ${S.title}`;
    const cd = MS.countdown(left);
    clock.className = "clock" + cd.cls;
    clock.innerHTML = `<span class="clk"><span class="clk-label">${left > 0 ? U().until : U().late}</span>${cd.html}${pen}</span>`;
  }
  setInterval(tick, 1000);

  // ---------- Akte ----------
  const kindClass = (d) => ({ Notiz: "k-note", Beleg: "k-receipt", Systemauszug: "k-sys", Liste: "k-mail", Befund: "k-mail", Protokoll: "k-note", Fundstück: "k-press" })[d.kk || d.kind] || "";
  const ROT = [-1.4, 0.9, -0.5, 1.2, -1, 0.6, -0.2, 1.4];
  function akteView() {
    const read = S.docs.filter((d) => seen.has(d.id)).length;
    root.innerHTML = `<div class="deskhead"><h2>${L("Fallakte", "Case file")}</h2><span>${read} / ${S.docs.length} ${L("gelesen", "read")}</span></div>
      <div class="evid">${S.docs.map((d, i) => `${d.stage >= 2 && (i === 0 || S.docs[i - 1].stage !== d.stage) ? `<div class="actdiv"><span class="conf">${L(`Frage ${d.stage - 1} gelöst`, `Question ${d.stage - 1} solved`)}</span><b>${U().stages[d.stage] || L("Neue Beweisstücke", "New evidence")}</b></div>` : ""}
        <button type="button" class="ev ${kindClass(d)} ${seen.has(d.id) ? "seen" : ""}" data-doc="${i}" style="--r:${ROT[i % ROT.length]}deg">
        <span class="ev-nr">${L("Nr.", "No.")} ${pad(i + 1)}</span><span class="kind">${esc(d.kind)}</span><span class="ttl">${esc(d.title)}</span>${seen.has(d.id) ? `<span class="gel">${L("Gelesen", "Read")}</span>` : `<span class="gel neu">${L("Neu", "New")}</span>`}</button>`).join("")}</div>
      <p class="ondesk small" style="margin-top:22px;text-align:center">${L("Mit jeder richtigen Antwort kommen neue Beweisstücke dazu.", "Every correct answer adds new evidence.")} <button type="button" class="linkbtn ondesk" id="toQ" style="color:var(--paper)">${L("Zu den Fragen →", "To the questions →")}</button></p>`;
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
    const pb = (i, dir) => `<button type="button" data-go="${i}" class="${dir}"><small>${dir === "prev" ? "← " + L("Nr. ", "No. ") + pad(i + 1) : L("Nr. ", "No. ") + pad(i + 1) + " →"}</small>${esc(S.docs[i].title)}</button>`;
    const wm = ("MORDSTEAM SOLO · " + (S.name || "") + "   ").repeat(40);
    root.innerHTML = `<div class="docbar"><button type="button" class="back" id="back">${L("← Alle Beweisstücke", "← All evidence")}</button><span class="docpos">${L("Nr.", "No.")} ${pad(openDoc + 1)} / ${S.docs.length} · ${esc(d.kind)}</span></div>
      <article class="doc" data-wm="${esc(wm)}"><div class="doc-inner">${d.html}</div></article>
      <div class="pager three">${prev !== null ? pb(prev, "prev") : "<span></span>"}<div class="cur"><small>${L("Nr. ", "No. ") + pad(openDoc + 1)}</small>${esc(d.title)}</div>${next !== null ? pb(next, "next") : `<button type="button" class="next" id="toQ2"><small>${L("Weiter →", "Next →")}</small>${L("Zu den Fragen", "To the questions")}</button>`}</div>`;
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
      root.innerHTML = `<section class="report paper"><div class="eyebrow">${L("Plus · Verhörraum", "Plus · Interrogation room")}</div><h2>${L("Noch verschlossen", "Still locked")}</h2>
        <p class="muted">${L(`Der Verhörraum öffnet, sobald du Frage ${S.verhoer.from_question} gelöst hast. Dann befragst du die Verdächtigen selbst – ${S.verhoer.max} Fragen hast du.`, `The interrogation room opens once you’ve solved question ${S.verhoer.from_question}. Then you question the suspects yourself – you have ${S.verhoer.max} questions.`)}</p></section>`;
      return;
    }
    if (!V) { try { V = await api("GET", "verhoer"); } catch (e) { root.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; } }
    if (vSel === null) vSel = V.suspects[0].key;
    const left = V.max - V.used, th = V.threads[vSel] || [], who = V.suspects.find((x) => x.key === vSel);
    root.innerHTML = `<section class="report paper fr-verhoer">
      <div class="eyebrow">${L("Plus · Verhörraum · KI", "Plus · Interrogation room · AI")}</div>
      <h2>${L("Wen willst du verhören?", "Who do you want to question?")}</h2>
      <p class="muted">${L("Die Verdächtigen werden von einer KI gespielt und kennen nur die erfundene Welt des Falls. Einer von ihnen lügt.", "The suspects are played by an AI and only know the made-up world of the case. One of them is lying.")} ${V.ended ? L("Der Fall ist abgeschlossen – hier kannst du die Gespräche nachlesen.", "The case is closed – you can read back through the conversations here.") : L(`Du hast noch <b>${left} von ${V.max}</b> Fragen.`, `You have <b>${left} of ${V.max}</b> questions left.`)}</p>
      <div class="fr-suspects">${V.suspects.map((x) => `<button type="button" class="chipbtn ${x.key === vSel ? "on" : ""}" data-sus="${x.key}">${esc(x.name)}${(V.threads[x.key] || []).length ? " ·" + V.threads[x.key].filter((m) => m.role === "user").length : ""}</button>`).join("")}</div>
      <div class="fr-thread" id="thread">${th.length ? th.map((m) => `<div class="fr-msg ${m.role === "user" ? "q" : "a"}"><small>${m.role === "user" ? L("Du", "You") + (m.nc ? L(" · nicht gezählt", " · not counted") : "") : esc(who.name) + L(" · KI", " · AI")}</small>${m.text}</div>`).join("") : `<p class="small muted">${L(`Noch keine Fragen an ${esc(who.name)}. Tipp: Frag, wo ${esc(who.name.split(" ").pop())} während des Feuerwerks war.`, `No questions to ${esc(who.name)} yet. Tip: ask where ${esc(who.name.split(" ").pop())} was during the fireworks.`)}</p>`}${vBusy ? `<div class="fr-msg a typing"><small>${esc(who.name)}${L(" · KI", " · AI")}</small>…</div>` : ""}</div>
      ${V.ended ? "" : left > 0 ? `<form id="vf" class="fr-ask"><input id="vq" maxlength="${V.max_chars}" autocomplete="off" placeholder="${L(`Deine Frage an ${esc(who.name)} …`, `Your question to ${esc(who.name)} …`)}" ${vBusy ? "disabled" : ""}><button class="btn btn-red" type="submit" ${vBusy ? "disabled" : ""}>${L("Fragen", "Ask")}</button></form>` : `<p class="note">${L("Du hast alle Fragen gestellt. Die Hinweise zur Frage helfen dir weiter.", "You’ve asked all your questions. The hints for the question will help you on.")}</p>`}
      ${vErr ? `<p class="err">${esc(vErr)}</p>` : ""}
      <p class="small" style="margin-top:14px"><button type="button" class="linkbtn" id="toQv">${L("Zu den Fragen →", "To the questions →")}</button></p>
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
    const hintList = (x) => x.hints.map((h, i) => `<div class="funknote"><b>${L("Hinweis", "Hint")} ${i + 1}</b>${h}</div>`).join("");
    let field = "";
    const sel = (id, opts) => `<select id="${id}" class="so-select"><option value="">${L("Bitte wählen …", "Please choose …")}</option>${opts.map((o) => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join("")}</select>`;
    if (q && q.type === "select2") field = `<span class="so-sub">${esc(q.sub[0])}</span>${sel("ans", q.options)}<span class="so-sub">${esc(q.sub[1])}</span>${sel("ans2", q.options2)}`;
    else if (q) field = q.type === "select"
      ? `<select id="ans" class="so-select"><option value="">${L("Bitte wählen …", "Please choose …")}</option>${q.options.map((o) => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join("")}</select>`
      : q.type === "code" ? `<input id="ans" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" spellcheck="false" placeholder="0000" maxlength="4" class="so-time">`
      : `<input id="ans" type="text" inputmode="numeric" pattern="[0-9:]*" autocomplete="off" spellcheck="false" placeholder="hh:mm" maxlength="5" class="so-time"><span class="small">${L("Nur die vier Ziffern tippen – der Doppelpunkt kommt von selbst.", "Just type the four digits – the colon appears by itself.")}</span>`;
    const cost = q && q.next_hint_cost;
    root.innerHTML = `<section class="report paper">
      <div class="eyebrow">${L(`Ermittlung · ${done.length} von ${S.questions.length} gelöst`, `Investigation · ${done.length} of ${S.questions.length} solved`)}</div>
      <h2>${q ? `${L("Frage", "Question")} ${q.nr}` : L("Alle Fragen gelöst", "All questions solved")}</h2>
      <p class="muted">${L(`Jede falsche Antwort kostet ${S.rules.wrong} Strafminuten, Hinweise kosten ${S.rules.hints.join(" / ")} Minuten.`, `Every wrong answer costs ${S.rules.wrong} penalty minutes; hints cost ${S.rules.hints.join(" / ")} minutes.`)}</p>
      ${done.map((x) => `<div class="qrow so-done"><span class="qn">${x.nr}</span><div class="qf"><label>${esc(x.label)}</label><span class="so-ans">✓ ${esc(x.answer)}</span></div></div>`).join("")}
      ${q ? `<div class="qrow"><span class="qn">${q.nr}</span><div class="qf"><label for="ans">${esc(q.label)}</label><span class="hint">${esc(q.hint)}</span>${field}${hintList(q)}</div></div>
      ${verdict ? `<div class="verdict ${verdict.cls}" role="alert">${verdict.html}</div>` : ""}
      <button type="button" class="btn btn-red btn-big" id="check">${L("Antwort prüfen", "Check answer")}</button>
      <div class="ctip"><div><b>${L("Hinweis nehmen", "Take a hint")}</b><p>${cost ? L(`Hinweis ${q.hints.length + 1} von 3 für diese Frage. Kostet ${cost} Strafminuten.`, `Hint ${q.hints.length + 1} of 3 for this question. Costs ${cost} penalty minutes.`) : L("Für diese Frage hast du alle Hinweise.", "You’ve had all the hints for this question.")}</p></div>
        ${cost ? `<button type="button" class="btn ${armed ? "btn-ink" : "btn-line"}" id="hint">${armed ? L(`Ja, Hinweis nehmen (+${cost} Min.)`, `Yes, take the hint (+${cost} min)`) : L("Hinweis anzeigen", "Show hint")}</button>${armed ? `<button type="button" class="linkbtn" id="hintno">${L("Abbrechen", "Cancel")}</button>` : ""}` : ""}</div>` : ""}
      ${locked.map((x) => `<div class="qrow so-locked"><span class="qn">${x.nr}</span><div class="qf"><label>${esc(x.label)}</label><span class="hint">${L(`Wird frei, sobald du Frage ${x.nr - 1} gelöst hast.`, `Unlocks once you’ve solved question ${x.nr - 1}.`)}</span></div></div>`).join("")}
      ${blattHtml()}
      <p style="margin-top:26px;text-align:right">${giveArmed ? `<span class="small">${L(`Wirklich aufgeben? Du siehst dann die Auflösung${S.first_play ? " und kommst nicht in die Wertung" : ""}.`, `Really give up? You’ll see the solution${S.first_play ? " and won’t be ranked" : ""}.`)}</span> <button type="button" class="btn btn-ink" id="give">${L("Ja, Auflösung zeigen", "Yes, show the solution")}</button> <button type="button" class="linkbtn" id="giveno">${L("Weiter ermitteln", "Keep investigating")}</button>` : `<button type="button" class="linkbtn" id="give">${L("Aufgeben und Auflösung ansehen", "Give up and see the solution")}</button>`}</p>
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
    if ($("check")) $("check").onclick = () => answer(q, q.type === "select2" ? ($("ans").value && $("ans2").value ? $("ans").value + "|" + $("ans2").value : "") : inp.value);
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
  const MARK = (i) => [["?", L("offen", "open")], ["✓", L("hat Alibi", "has alibi")], ["!", L("verdächtig", "suspicious")]][i];
  function blattHtml() {
    const tq = S.questions.find((x) => x.key === "taeter");
    if (!tq || !tq.options) return "";
    const B = blattGet();
    return `<details class="so-blatt" ${B._open ? "open" : ""}><summary>${L("Dein Ermittlungsblatt", "Your investigation sheet")}</summary>
      <p class="small muted">${L("Hak ab, wer ein Alibi hat – nur für dich, auf diesem Gerät.", "Tick off who has an alibi – just for you, on this device.")}</p>
      ${tq.options.map((o) => { const x = B[o[0]] || {}; const m = MARK(x.m || 0); return `<div class="so-brow"><button type="button" class="chipbtn so-mark m${x.m || 0}" data-bl="${esc(o[0])}" title="${m[1]}">${m[0]} ${m[1]}</button><b>${esc(o[1])}</b><input data-bn="${esc(o[0])}" maxlength="80" placeholder="${L("Notiz …", "Note …")}" value="${esc(x.n || "")}"></div>`; }).join("")}
    </details>`;
  }
  function bindBlatt() {
    const save = (B) => MS.set(blattKey(), JSON.stringify(B));
    const det = root.querySelector(".so-blatt");
    if (!det) return;
    det.addEventListener("toggle", () => { const B = blattGet(); B._open = det.open; save(B); });
    root.querySelectorAll("[data-bl]").forEach((b) => (b.onclick = () => {
      const B = blattGet(), k = b.dataset.bl; B[k] = B[k] || {}; B[k].m = ((B[k].m || 0) + 1) % 3; save(B);
      const m = MARK(B[k].m); b.textContent = m[0] + " " + m[1]; b.className = "chipbtn so-mark m" + B[k].m;
    }));
    root.querySelectorAll("[data-bn]").forEach((i) => (i.oninput = () => { const B = blattGet(), k = i.dataset.bn; B[k] = B[k] || {}; B[k].n = i.value; save(B); }));
  }

  async function answer(q, value) {
    if (busy) return;
    if (!String(value || "").trim()) { verdict = { cls: "warn", html: q.type === "select2" ? L("Bitte in beiden Feldern eine Antwort auswählen.", "Please choose an answer in both fields.") : q.type === "select" ? L("Bitte eine Antwort auswählen.", "Please choose an answer.") : q.type === "code" ? L("Bitte den Code eingeben.", "Please enter the code.") : L("Bitte eine Uhrzeit eingeben.", "Please enter a time.") }; return fragenView(); }
    if (q.type === "code" && String(value).replace(/[^0-9]/g, "").length !== 4) {
      verdict = { cls: "warn", html: L("Bitte alle vier Ziffern eingeben.", "Please enter all four digits.") }; fragenView();
      const i = $("ans"); if (i) { i.value = String(value); i.focus(); } return;
    }
    if (q.type === "time") {
      // unvollständige Eingabe nicht werten (keine Strafminuten für Tippfehler)
      const dg = String(value).replace(/[^0-9]/g, "");
      if (dg.length !== 4 || Number(dg.slice(0, 2)) > 23 || Number(dg.slice(2)) > 59) {
        verdict = { cls: "warn", html: L("Bitte die Uhrzeit vollständig als hh:mm eingeben, z. B. 23:05.", "Please enter the full time as hh:mm, e.g. 23:05.") }; fragenView();
        const i = $("ans"); if (i) { i.value = String(value); i.focus(); } return;
      }
    }
    busy = true; $("check").disabled = true; $("check").textContent = L("Wird geprüft …", "Checking …");
    try {
      const d = await api("POST", "answer", { key: q.key, value });
      armed = false;
      if (d.correct) {
        verdict = null;
        openDoc = null;          // neue Beweisstücke: zurück zur Akte führt in die Übersicht
        await refresh(d);
        const vNow = S.verhoer && S.verhoer.open && q.nr === S.verhoer.from_question;
        if (vNow) V = null;
        if (!d.ended) { verdict = { cls: "good", html: L(`<strong>Richtig!</strong>Frage ${q.nr} ist gelöst. Neue Beweisstücke liegen in deiner Akte.${vNow ? " Und der Verhörraum ist offen." : ""}`, `<strong>Correct!</strong>Question ${q.nr} is solved. New evidence is waiting in your file.${vNow ? " And the interrogation room is open." : ""}`) }; fragenView(); toast(vNow ? L(`🗣️ Der Verhörraum ist offen <b>Ansehen</b>`, `🗣️ The interrogation room is open <b>View</b>`) : L(`📁 Neue Beweisstücke in deiner Akte <b>Ansehen</b>`, `📁 New evidence in your file <b>View</b>`)); }
        scrollTo(0, 0);
      } else if (d.stale) {
        verdict = null; await refresh(d);   // schon in einem anderen Tab gelöst
      } else {
        verdict = { cls: "bad", html: L(`<strong>Leider falsch.</strong>+${d.penalty} Minuten Strafzeit. Schau dir die Beweisstücke noch einmal an.`, `<strong>Sorry, that’s wrong.</strong>+${d.penalty} penalty minutes. Take another look at the evidence.`) };
        await refresh(d);
      }
    } catch (e) { verdict = { cls: "warn", html: esc(e.message) }; fragenView(); }
    busy = false;
  }

  // ---------- Ergebnis und Urkunde ----------
  // ---------- Feedback: gezielt nach dem ersten Spiel und (einmal) nach einer Wiederholung ----------
  // Gespeichert wird immer der deutsche Wert (einheitliche Auswertung), angezeigt in der Spielsprache: [Wert, englische Anzeige]
  const chips = (key, list) => `<div class="chips-row">${list.map(([v, en]) => `<button type="button" class="chipbtn" data-${key}="${v}">${EN() ? en : v}</button>`).join("")}</div>`;
  function fbHtml() {
    const fb = S.feedback || {};
    const askReplay = !S.first_play && !fb.replay, askInitial = !fb.initial;
    if (!askReplay && !askInitial) return "";
    const parts = String(S.name || "").trim().split(/\s+/).filter(Boolean);
    const vor = parts[0] || "", ini = parts.length > 1 ? `${vor} ${parts[parts.length - 1][0].toUpperCase()}.` : "";
    const replay = askReplay ? `<section class="report paper so-fb" id="fbr">
      <div class="eyebrow">${L("Kurze Frage zu deiner Wiederholung", "A quick question about your replay")}</div><h3 style="margin-top:6px">${L("Wie war es beim zweiten Mal?", "How was it the second time?")}</h3>
      <div class="field"><span class="label">${L("Mit dem Wissen aus dem ersten Spiel war der Fall …", "Knowing what you knew from the first game, the case was …")}</span>${chips("leicht", [["viel zu leicht", "far too easy"], ["noch spannend", "still exciting"], ["genauso knifflig", "just as tricky"]])}</div>
      <div class="field"><span class="label">${L("Hat sich das Nochmal-Spielen gelohnt?", "Was playing again worth it?")}</span>${chips("lohnt", [["ja", "yes"], ["geht so", "so-so"], ["nein", "no"]])}</div>
      <div class="field"><label for="fbrn">${L("Anmerkung", "Comment")} <span class="opt">${L("optional, nur für uns", "optional, just for us")}</span></label><textarea id="fbrn" maxlength="1000" rows="2"></textarea></div>
      <p class="err" id="fbrerr" hidden></p><button type="button" class="btn btn-red" id="fbrsend">${L("Senden", "Send")}</button></section>` : "";
    const initial = askInitial ? `<section class="report paper so-fb" id="fbi">
      <div class="eyebrow">${L(`Dein Feedback${S.first_play ? "" : " zum ersten Spiel"}`, `Your feedback${S.first_play ? "" : " on your first game"}`)}</div><h3 style="margin-top:6px">${L(`Wie fandest du ${esc(U().fb)}?`, `What did you think of ${esc(U().fb)}?`)}</h3>
      <p class="muted">${L("Zwei Klicks, die uns sehr helfen – neue Fälle bauen wir aus eurem Feedback.", "Two clicks that help us a lot – we build new cases from your feedback.")}</p>
      <div class="stars" role="radiogroup" aria-label="${L("Sterne", "Stars")}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${L(`${n} von 5 Sternen`, `${n} of 5 stars`)}">★</button>`).join("")}</div>
      <div class="field"><span class="label">${L("Wie schwer war der Fall?", "How hard was the case?")}</span>${chips("diff", [["zu leicht", "too easy"], ["genau richtig", "just right"], ["zu schwer", "too hard"]])}</div>
      <div class="field"><label for="fbimp">${L("Was sollen wir besser machen?", "What should we improve?")} <span class="opt">${L("optional, nur für uns", "optional, just for us")}</span></label><textarea id="fbimp" maxlength="1500" rows="2"></textarea></div>
      <div class="fbpub"><div class="field"><label for="fbrev">${L("Ein paar Worte für andere Ermittler?", "A few words for other detectives?")}</label><span class="hint">${L("Über ein nettes Feedback freuen wir uns besonders. Optional.", "We especially love a kind word. Optional.")}</span><textarea id="fbrev" maxlength="600" rows="3" placeholder="${L("Was hat dir gefallen?", "What did you enjoy?")}"></textarea></div>
      <div class="field"><span class="label">${L("Dürfen wir deine Worte auf mordsteam.com zeigen?", "May we show your words on mordsteam.com?")}</span>
        ${vor ? `<label class="check"><input type="radio" name="pub" value="vorname"><span>${L(`Ja, als „${esc(vor)}“`, `Yes, as “${esc(vor)}”`)}</span></label>` : ""}
        ${ini ? `<label class="check"><input type="radio" name="pub" value="initial"><span>${L(`Ja, als „${esc(ini)}“`, `Yes, as “${esc(ini)}”`)}</span></label>` : ""}
        <label class="check"><input type="radio" name="pub" value="anon"><span>${L("Ja, aber anonym", "Yes, but anonymously")}</span></label>
        <label class="check"><input type="radio" name="pub" value="no" checked><span>${L("Nein, nur für euch", "No, just for you")}</span></label></div></div>
      <p class="err" id="fbierr" hidden></p><button type="button" class="btn btn-red" id="fbisend">${L("Feedback senden", "Send feedback")}</button></section>` : "";
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
    const thanks = (id) => { $(id).innerHTML = `<div class="eyebrow">Feedback</div><h3 style="margin-top:6px">${L("Danke!", "Thank you!")}</h3><p class="muted">${L("Dein Feedback ist angekommen.", "Your feedback has arrived.")}</p>`; };
    if ($("fbrsend")) $("fbrsend").onclick = async () => {
      if (!pick.leicht && !pick.lohnt) { $("fbrerr").textContent = L("Bitte wähle mindestens eine Antwort.", "Please choose at least one answer."); $("fbrerr").hidden = false; return; }
      $("fbrsend").disabled = true;
      try { await api("POST", "feedback", { kind: "replay", leicht: pick.leicht || "", lohnt: pick.lohnt || "", notiz: $("fbrn").value }); S.feedback.replay = true; thanks("fbr"); }
      catch (e) { $("fbrerr").textContent = e.message; $("fbrerr").hidden = false; $("fbrsend").disabled = false; }
    };
    if ($("fbisend")) $("fbisend").onclick = async () => {
      if (!pick.star) { $("fbierr").textContent = L("Bitte wähle 1 bis 5 Sterne.", "Please choose 1 to 5 stars."); $("fbierr").hidden = false; return; }
      $("fbisend").disabled = true;
      const pub = (root.querySelector("input[name=pub]:checked") || {}).value || "no";
      try { await api("POST", "feedback", { kind: "initial", rating: Number(pick.star), difficulty: pick.diff || "", improve: $("fbimp").value, review: $("fbrev").value, publish: pub }); S.feedback.initial = true; thanks("fbi"); }
      catch (e) { $("fbierr").textContent = e.message; $("fbierr").hidden = false; $("fbisend").disabled = false; }
    };
  }

  function resultView() {
    const r = S.result || {};
    const solved = S.solved;
    const pctLine = !S.first_play ? L("Wiederholung – zählt nicht für die Wertung.", "Replay – doesn’t count towards the ranking.")
      : !solved ? "" : r.pct === null || r.pct === undefined ? L("Du bist unter den ersten Ermittlern dieses Falls – der Vergleich startet mit den nächsten Spielen.", "You’re among the first detectives on this case – the comparison starts with the next games.")
      : L(`Du warst schneller als <b>${r.pct} %</b> aller Ermittler${r.pct_n < 20 ? ` <span class="small">(bisher ${r.pct_n} Vergleichsspiele)</span>` : ""}.`, `You were faster than <b>${r.pct}%</b> of all detectives${r.pct_n < 20 ? ` <span class="small">(${r.pct_n} game${r.pct_n === 1 ? "" : "s"} to compare so far)</span>` : ""}.`);
    const rp = S.replay || { left: 0 };
    const until = rp.until ? new Intl.DateTimeFormat(loc(), { dateStyle: "long" }).format(new Date(rp.until)) : "";
    root.innerHTML = `<section class="report paper so-result">
      <div class="solved"><div class="bigstamp ${solved ? "" : "grey"}"><div><small>MORDSTEAM SOLO · ${esc(U().stamp)}</small><strong>${solved ? L("FALL GELÖST", "CASE SOLVED") : L("AKTE GESCHLOSSEN", "FILE CLOSED")}</strong><small>${esc((S.name || "").toUpperCase())}</small></div></div></div>
      ${solved ? `<div class="so-score"><div><small>${L("Endzeit", "Final time")}</small><b>${MS.dur(r.score_ms)}</b></div><div><small>${L("Gespielt", "Played")}</small><b>${MS.dur(r.played_ms)}</b></div><div><small>${L("Strafminuten", "Penalty minutes")}</small><b>${S.penalty_min}</b></div></div>
        <p class="so-pct">${pctLine}</p>` : `<p class="so-pct">${S.first_play ? L("Diesmal hat es nicht gereicht – hier ist die Auflösung.", "Not this time – here’s the solution.") : L("Hier ist die Auflösung.", "Here’s the solution.")}</p>`}
      <h3>${L("Die Auflösung", "The solution")}</h3>
      <p>${r.summary ? `<b>${esc(r.summary)}</b>` : `<b>${L("Täter/in", "Culprit")}: ${esc(r.culprit)}</b> · ${L("Tatzeit", "Time of the crime")} ${esc(r.zeit || "01:31")} · ${L("Versteck", "Hiding place")}: ${esc(r.item)}`}</p>
      <p>${esc(r.text)}</p>
      ${r.voucher ? `<div class="so-voucher"><small>${r.voucher_teams ? L("Dein Gutschein für ein Teams-Event", "Your voucher for a Teams event") : L("Dein Gutschein für ein Friends- oder Teams-Spiel", "Your voucher for a Friends or Teams game")}</small><b class="mono">${esc(r.voucher)}</b><span>${r.voucher_teams ? L(`${esc(r.voucher_teams.label)} Rabatt auf euer Mordsteam-Teams-Event · gültig bis ${esc(dmy(r.voucher_teams.until))} · im Bezahlschritt eingeben · nicht mit Early Bird kombinierbar`, `${esc(r.voucher_teams.label)} off your Mordsteam Teams event · valid until ${esc(dmy(r.voucher_teams.until))} · enter it at checkout · can’t be combined with Early Bird`) : L("5 € Rabatt auf ein Friends- oder Teams-Spiel · im Bezahlschritt eingeben · 1 Gutschein pro Bestellung, nicht mit Early Bird kombinierbar", "€5 off a Friends or Teams game · enter it at checkout · 1 voucher per order, can’t be combined with Early Bird")}</span><button type="button" class="btn btn-line" id="copyv">${L("Code kopieren", "Copy code")}</button></div>` : ""}
      ${solved && S.first_play ? `<div class="actions-row" style="margin-top:22px"><button type="button" class="btn btn-red" id="pdf">${L("Urkunde als PDF speichern", "Save certificate as PDF")}</button><button type="button" class="btn btn-line" id="png">${L("Urkunde als Bild", "Certificate as image")}</button></div><p class="small" style="margin-top:6px">${L("A4 im Querformat – zum Ausdrucken oder Teilen.", "A4 landscape – for printing or sharing.")}</p>` : ""}
      ${rp.left > 0 ? `<div class="actions-row" style="margin-top:18px"><button type="button" class="btn btn-line" id="again">${L("Nochmal spielen – anderer Täter", "Play again – different culprit")}</button></div>
      <p class="small" style="margin-top:8px">${L(`Noch ${rp.left} ${rp.left === 1 ? "Wiederholung" : "Wiederholungen"} möglich${until ? `, bis ${until}` : ""}. Jedes Mal wird ein anderer Täter ausgelost, einige Beweisstücke ändern sich. Wiederholungen zählen nicht für die Wertung.`, `${rp.left} ${rp.left === 1 ? "replay" : "replays"} left${until ? `, until ${until}` : ""}. Each time a different culprit is drawn and some of the evidence changes. Replays don’t count towards the ranking.`)}</p>`
      : `<p class="small" style="margin-top:18px">${S.replay && S.replay.until && Date.now() > S.replay.until ? L("Der Zeitraum für Wiederholungen ist vorbei.", "The replay period is over.") : L("Du hast alle Wiederholungen genutzt.", "You’ve used all your replays.")} ${L("Weitere Ermittlungen warten – allein, mit Freunden oder im Team:", "More investigations are waiting – solo, with friends or as a team:")} <a href="${EN() ? "/en/" : "/"}">mordsteam.com</a></p>`}
    </section>
    ${fbHtml()}`;
    bindFeedback();
    if ($("copyv")) $("copyv").onclick = async () => { try { await navigator.clipboard.writeText(r.voucher); $("copyv").textContent = L("Kopiert ✓", "Copied ✓"); } catch { $("copyv").textContent = r.voucher; } };
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
    g.textBaseline = "alphabetic";
    // leichte Sperrung (ein Haarspatium) – nur für kleine Großbuchstaben-Zeilen
    const spaced = (t) => t.split("").join(String.fromCharCode(8202));
    const fit = (t, font, size, max) => { let s = size; do { g.font = font.replace("SIZE", s + "px"); s -= 4; } while (g.measureText(t).width > max && s > 20); };
    // Marke oben: MORDS (rot) TEAM (schwarz) – darunter das Produkt (SOLO), beides mittig
    g.textAlign = "left"; g.font = `900 84px ${serif}`;
    const wM = g.measureText("MORDS").width, wT = g.measureText("TEAM").width, x = W / 2 - (wM + wT) / 2;
    g.fillStyle = RED; g.fillText("MORDS", x, 250); g.fillStyle = INK; g.fillText("TEAM", x + wM, 250);
    g.textAlign = "center"; g.font = `900 104px ${serif}`; g.fillText(U().caseNo.split(" ")[0].toUpperCase(), W / 2, 370);
    g.fillStyle = RED; g.font = `600 52px ${mono}`; g.fillText(spaced(L("URKUNDE", "CERTIFICATE")), W / 2, 500);
    g.fillStyle = INK; fit(S.name, `900 SIZE ${serif}`, 170, W - 500); g.fillText(S.name, W / 2, 690);
    fit(L(`hat den Fall „${S.title}“ gelöst`, `has solved the case “${S.title}”`), `400 SIZE ${sans}`, 52, W - 420);
    g.fillText(L(`hat den Fall „${S.title}“ gelöst`, `has solved the case “${S.title}”`), W / 2, 810);
    fit(U().cert, `400 SIZE ${sans}`, 52, W - 420); g.fillText(U().cert, W / 2, 875);
    // Ergebnis: Spalten nach ihrer echten Breite, damit sich nichts überlappt
    const date = new Intl.DateTimeFormat(loc(), { dateStyle: "long" }).format(new Date(S.started_at + (r.played_ms || 0)));
    const cols = [[L("ENDZEIT", "FINAL TIME"), MS.dur(r.score_ms)], ...(r.pct !== null && r.pct !== undefined ? [[L("SCHNELLER ALS", "FASTER THAN"), r.pct + L(" %", "%")]] : []), [L("DATUM", "DATE"), date]];
    const fL = `600 30px ${mono}`, fV = `700 56px ${mono}`;
    const ws = cols.map(([l, v]) => { g.font = fL; const a = g.measureText(spaced(l)).width; g.font = fV; return Math.max(a, g.measureText(v).width) + 140; });
    let cx = W / 2 - ws.reduce((a, b) => a + b, 0) / 2;
    cols.forEach(([l, v], k) => { const mid = cx + ws[k] / 2; g.fillStyle = MUT; g.font = fL; g.fillText(spaced(l), mid, 1025); g.fillStyle = INK; g.font = fV; g.fillText(v, mid, 1100); cx += ws[k]; });
    // Stempel im Stil der Website: doppelter Rahmen, oben und unten klein, in der Mitte groß
    const top = spaced("MORDSTEAM · " + U().caseNo), mid = L("GELÖST", "SOLVED"), bot = spaced(date.toUpperCase());
    g.font = `500 26px ${mono}`; const wt = Math.max(g.measureText(top).width, g.measureText(bot).width);
    g.font = `900 104px ${serif}`; const wm = g.measureText(mid).width;
    const iw = Math.max(wt, wm) + 90, ih = 230, pad = 16;
    g.save(); g.translate(W - 520, H - 360); g.rotate(-9 * Math.PI / 180);
    g.fillStyle = "rgba(255,253,248,0.92)"; g.fillRect(-iw / 2 - pad, -ih / 2 - pad, iw + 2 * pad, ih + 2 * pad);
    g.strokeStyle = RED; g.lineWidth = 10; g.strokeRect(-iw / 2 - pad, -ih / 2 - pad, iw + 2 * pad, ih + 2 * pad);
    g.lineWidth = 4; g.strokeRect(-iw / 2, -ih / 2, iw, ih);
    g.fillStyle = RED; g.font = `500 26px ${mono}`; g.fillText(top, 0, -62); g.fillText(bot, 0, 92);
    g.font = `900 104px ${serif}`; g.fillText(mid, 0, 46); g.restore();
    g.fillStyle = MUT; g.font = `400 30px ${mono}`; g.fillText(spaced("mordsteam.com"), W / 2, H - 170);
    if (kind === "canvas") return c;
    const base = L("Mordsteam-Urkunde-", "Mordsteam-Certificate-") + (S.name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "Solo");
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


  // Sprachumschalter: nur auf der Code-Eingabe (noch kein Ticket geladen) – dann Code-Eingabe neu zeichnen
  document.addEventListener("ms-lang", () => { if (!S && !token && $("cf")) codeView(); });

  $("ff5").onclick = async () => { try { await refresh(await api("POST", "test/vorspulen")); } catch {} };
  loadTicket();
})();
