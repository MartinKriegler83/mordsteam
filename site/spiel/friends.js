// Mordsteam Friends – Spieloberfläche (jeder Spieler am eigenen Gerät) und Organisator-Ansicht (?o=…)
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const root = $("root"), clock = $("clock"), tabs = $("tabs");
  const esc = MS.esc, pad = (n) => String(n).padStart(2, "0");
  const invite = MS.qs("e") || "", orgTok = MS.qs("o") || "";
  let token = MS.qs("p") || (invite ? MS.get("ms_friends_tok_" + invite) : "") || "";
  let S = null, off = 0, tab = "einsatz", openDoc = null, busy = false, verdict = null, armed = false, giveArmed = false, poll = null;
  const seenKey = () => "ms_friends_seen_" + token.slice(0, 12);
  let seen = new Set();
  const fmtDate = (ms) => new Intl.DateTimeFormat("de-AT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(ms));

  async function api(method, path, body) {
    const r = await fetch("/api/friends/" + path, { method, headers: { "content-type": "application/json", ...(token ? { "x-friends": token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let d = {}; try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d.error || "Fehler " + r.status); e.status = r.status; throw e; }
    return d;
  }
  function toast(html, ms = 4200) {
    const t = $("toast"); t.innerHTML = `<button type="button">${html}</button>`; t.hidden = false;
    t.querySelector("button").onclick = () => { t.hidden = true; openDoc = null; go("akte"); };
    clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), ms);
  }
  function every(ms, fn) { clearInterval(poll); poll = ms ? setInterval(fn, ms) : null; }
  const plain = () => { tabs.hidden = true; clock.innerHTML = ""; clock.className = "clock"; };

  // ---------- Einladung: Namen wählen ----------
  async function inviteView(err) {
    plain(); every(0);
    let g;
    try { g = await api("GET", "invite?e=" + encodeURIComponent(invite)); }
    catch (e) { root.innerHTML = `<div class="panel center"><p class="err">${esc(e.message)}</p></div>`; return; }
    $("fallname").textContent = "Mordsteam Friends"; $("pname").textContent = g.title;
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">Mordsteam Friends · Einladung</span><span class="conf">${g.players.length} Ermittler · ${g.limit_min} Min.</span></div>
      <h1>Letzte Runde auf der <em>Hütte</em></h1>
      <p class="sub">Einer von euch war's. Wer bist du?</p>
      <div class="fr-names">${g.players.map((p) => `<button type="button" class="fr-name" data-idx="${p.idx}"><b>${p.name}</b><span>${p.done ? "fertig" : p.joined ? "schon verbunden" : "noch frei"}</span></button>`).join("")}</div>
      <p class="small">Tippe auf deinen Namen. Du kannst auf jedem Gerät spielen – Handy, Tablet oder Laptop – und über diesen Link jederzeit auf einem anderen Gerät weitermachen.</p>
      <p class="small">${g.mode === "live" ? "Gespielt wird gleichzeitig: Der Fall startet für alle, sobald euer Organisator auf Start drückt." : `Gespielt wird über ${g.days} Tage: Jeder startet, wann er Zeit hat. Die Auflösung kommt für alle gleichzeitig.`}</p>
      <p class="err" role="alert">${err ? esc(err) : ""}</p>
    </div></section>`;
    root.querySelectorAll("[data-idx]").forEach((b) => (b.onclick = async () => {
      const p = g.players.find((x) => x.idx === Number(b.dataset.idx));
      if (p.joined && !b.dataset.sure) { b.dataset.sure = "1"; b.querySelector("span").textContent = "nochmal tippen, wenn du das bist"; return; }
      try { const d = await api("POST", "claim", { e: invite, idx: p.idx }); token = d.token; MS.set("ms_friends_tok_" + invite, token); seen = new Set(JSON.parse(MS.get(seenKey()) || "[]")); tab = "einsatz"; await refresh(); scrollTo(0, 0); }
      catch (e) { inviteView(e.message); }
    }));
  }

  // ---------- Stand laden ----------
  async function refresh(d) {
    try { S = d || (await api("GET", "state")); }
    catch (e) { if (e.status === 401) { token = ""; if (invite) { MS.set("ms_friends_tok_" + invite, ""); return inviteView(e.message); } } root.innerHTML = `<div class="panel center"><p class="err">${esc(e.message)}</p></div>`; return; }
    off = S.now - Date.now();
    $("pname").textContent = S.name;
    // gleichzeitig: sobald der Organisator gestartet hat, läuft die Uhr für alle – Durchgang automatisch beginnen
    if (!S.begun && S.can_begin && S.group.mode === "live") { try { S = await api("POST", "begin"); } catch {} }
    render();
  }
  function render() {
    tick();
    if (S.reveal || S.ended) $("fallname").textContent = "Mordsteam Friends · " + S.title;
    if (S.reveal) { every(0); plain(); return revealView(); }
    if (S.ended) { plain(); every(20000, () => refresh()); return waitRevealView(); }
    if (!S.begun && !S.can_begin) { plain(); every(15000, () => refresh()); return waitStartView(); }
    every(0);
    tabs.hidden = false;
    $("vtab").hidden = !S.plus;
    $("vbadge").hidden = !(S.verhoer && S.verhoer.open && !MS.get(seenKey() + "_v"));
    tabs.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
    const unseen = S.docs.filter((d) => !seen.has(d.id)).length;
    $("newbadge").hidden = !unseen; $("newbadge").textContent = unseen;
    if (!S.begun) tab = tab === "gruppe" ? "gruppe" : "einsatz";
    if (tab === "einsatz") return einsatzView();
    if (tab === "gruppe") return gruppeView();
    if (tab === "verhoer") return verhoerView();
    if (tab === "fragen") return fragenView();
    return openDoc !== null ? docView() : akteView();
  }
  async function go(t) {
    if ((t === "akte" || t === "fragen") && S && !S.begun && !S.ended) {
      if (busy) return;
      busy = true;
      try { const d = await api("POST", "begin"); tab = t; await refresh(d); }
      catch (e) { toast(esc(e.message)); }
      busy = false; scrollTo(0, 0); return;
    }
    if (t === "gruppe") { tab = t; await refresh(); scrollTo(0, 0); return; }
    if (t === "verhoer") { tab = t; render(); scrollTo(0, 0); return; }
    tab = t; render(); scrollTo(0, 0);
  }
  tabs.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => go(b.dataset.tab)));

  // ---------- Uhr ----------
  function tick() {
    if (!S || S.ended || S.reveal) { return; }
    const hut = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
    if (!S.begun) {
      $("fallname").textContent = `Hütte ${hut(S.clock_start)} · ${S.title}`;
      clock.className = "clock";
      clock.innerHTML = `<span class="clk"><span class="clk-label">Uhr steht</span><b class="clk-time">${MS.dur(S.limit_min * 60000)}</b></span>`;
      return;
    }
    const now = Date.now() + off, el = now - S.started_at, left = S.limit_min * 60000 - el;
    const pen = S.penalty_min ? `<span class="pen">+${S.penalty_min} Min. Strafe</span>` : "";
    $("fallname").textContent = `Hütte ${hut(S.clock_start + Math.floor(el / 60000))} · ${S.title}`;
    clock.className = "clock" + (left <= 0 ? " late" : left < 5 * 60000 ? " urgent" : "");
    clock.innerHTML = `<span class="clk"><span class="clk-label">${left > 0 ? S.clock_label : S.late_label}</span><b class="clk-time">${MS.dur(left > 0 ? left : el)}</b>${pen}</span>`;
  }
  setInterval(tick, 1000);

  // ---------- Warten ----------
  const roster = (g, showDone = true) => `<ul class="fr-roster">${g.players.map((p) => `<li class="${p.idx === S.me ? "me" : ""}"><b>${p.name}${p.idx === S.me ? " (du)" : ""}</b><span>${showDone && p.done ? "✓ fertig" : p.playing ? "ermittelt" : p.joined ? "verbunden" : "noch nicht da"}</span></li>`).join("")}</ul>`;
  function waitStartView() {
    const g = S.group;
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">${esc(S.briefing.eyebrow)}</span><span class="conf">Friends · ${S.limit_min} Min.</span></div>
      <h1>${S.briefing.title}</h1>
      <p class="sub">${g.status === "revealed" ? "Dieser Fall ist bereits aufgelöst." : g.mode === "live" ? "Gleich geht's los. Euer Organisator startet den Fall für alle gleichzeitig – die Seite springt dann von selbst um." : g.status === "ready" ? "Der Fall ist noch nicht freigeschaltet. Sobald euer Organisator ihn freigibt, kannst du loslegen." : "Das Zeitfenster für diesen Fall ist vorbei."}</p>
      <h2 class="qhead">Wer schon da ist</h2>${roster(g)}
      <p class="small">Du kannst auf jedem Gerät ermitteln – Handy, Tablet oder Laptop.</p>
    </div></section>`;
  }
  function waitRevealView() {
    const g = S.group, o = S.own || {};
    const when = g.mode === "live" ? "sobald alle fertig sind – spätestens eine Stunde nach dem Start" : `sobald alle fertig sind – spätestens ${g.deadline ? fmtDate(g.deadline) : "am Ende des Zeitfensters"}`;
    root.innerHTML = `<section class="report paper so-result">
      <div class="solved"><div class="bigstamp ${o.solved ? "" : "grey"}"><div><small>MORDSTEAM FRIENDS · HÜTTE</small><strong>${o.solved ? "GELÖST!" : "AKTE ZU"}</strong><small>${String(S.name).toUpperCase()}</small></div></div></div>
      ${o.solved ? `<div class="so-score"><div><small>Endzeit</small><b>${MS.dur(o.score_ms)}</b></div><div><small>Gespielt</small><b>${MS.dur(o.played_ms)}</b></div><div><small>Strafminuten</small><b>${o.penalty}</b></div></div>` : ""}
      <p class="so-pct">Die Auflösung und die Rangliste kommen für alle gleichzeitig, ${when}.</p>
      <div class="fr-hush"><b>Pssst – nichts verraten!</b> Wer anderen hilft, macht sich selbst in der Rangliste schlechter.</div>
      <h3>Wer schon fertig ist</h3>${roster(g)}
      <p class="small">Diese Seite aktualisiert sich von selbst.</p>
    </section>`;
  }

  // ---------- Einsatz, Gruppe ----------
  function einsatzView() {
    const b = S.briefing;
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">${esc(b.eyebrow)}</span><span class="conf">Friends · ${S.limit_min} Min.</span></div>
      <h1>${b.title}</h1><p class="sub">${b.text}${S.begun ? " Die Uhr oben läuft bereits." : ""}</p>
      <ol class="steps">${b.steps.map((x, i) => `<li><span class="n">${i + 1}</span><div><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div></li>`).join("")}</ol>
      <h2 class="qhead">Deine drei Fragen</h2>
      <div class="qcards">${S.questions.map((q) => `<div><i>${pad(q.nr)}</i><span>${esc(q.label)}</span></div>`).join("")}</div>
      ${S.begun ? "" : `<p class="small" style="margin-bottom:12px">Die Uhr startet, sobald du die Akte oder die Fragen öffnest, und lässt sich dann nicht mehr anhalten.</p>`}
      <button type="button" class="btn btn-red btn-big" id="toAkte">${S.begun ? "Zur Akte →" : "Akte öffnen – die Uhr startet →"}</button>
    </div></section>`;
    $("toAkte").onclick = () => go("akte");
  }
  // ---------- Plus: Verhörraum ----------
  let V = null, vSel = null, vBusy = false, vErr = "";
  async function verhoerView() {
    MS.set(seenKey() + "_v", "1"); $("vbadge").hidden = true;
    if (!S.verhoer || !S.verhoer.open) {
      root.innerHTML = `<section class="report paper"><div class="eyebrow">Plus · Verhörraum</div><h2>Noch verschlossen</h2>
        <p class="muted">Der Verhörraum öffnet, sobald du Frage ${S.verhoer ? S.verhoer.from_question : 2} gelöst hast. Dann kannst du die KI-Doppelgänger deiner Freunde verhören – ${S.verhoer ? S.verhoer.max : 12} Fragen hast du.</p></section>`;
      return;
    }
    if (!V) { try { V = await api("GET", "verhoer"); } catch (e) { root.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; } }
    if (vSel === null) vSel = V.suspects.find((x) => !x.me) ? V.suspects.find((x) => !x.me).idx : 0;
    const left = V.max - V.used, th = V.threads[vSel] || [], who = V.suspects[vSel];
    root.innerHTML = `<section class="report paper fr-verhoer">
      <div class="eyebrow">Plus · Verhörraum · KI</div>
      <h2>Wen willst du verhören?</h2>
      <p class="muted">Die Doppelgänger werden von einer KI gespielt und kennen nur die erfundene Welt des Falls. Einer von ihnen lügt. Du hast noch <b>${left} von ${V.max}</b> Fragen.</p>
      <div class="fr-suspects">${V.suspects.map((x) => `<button type="button" class="chipbtn ${x.idx === vSel ? "on" : ""}" data-sus="${x.idx}">${x.name}${x.me ? " (du)" : ""}${(V.threads[x.idx] || []).length ? " ·" + (V.threads[x.idx].filter((m) => m.role === "user").length) : ""}</button>`).join("")}</div>
      <div class="fr-thread" id="thread">${th.length ? th.map((m) => `<div class="fr-msg ${m.role === "user" ? "q" : "a"}"><small>${m.role === "user" ? "Du" : who.name + " · KI-Doppelgänger"}</small>${m.text}</div>`).join("") : `<p class="small muted">Noch keine Fragen an ${who.name}. Tipp: Frag nach der Nacht, nach Ferdl oder nach dem Clip.</p>`}${vBusy ? `<div class="fr-msg a typing"><small>${who.name} · KI-Doppelgänger</small>…</div>` : ""}</div>
      ${left > 0 ? `<form id="vf" class="fr-ask"><input id="vq" maxlength="${V.max_chars}" autocomplete="off" placeholder="Deine Frage an ${who.name} …" ${vBusy ? "disabled" : ""}><button class="btn btn-red" type="submit" ${vBusy ? "disabled" : ""}>Fragen</button></form>` : `<p class="note">Du hast alle Fragen gestellt. Die Hinweise zur letzten Frage helfen dir weiter.</p>`}
      ${vErr ? `<p class="err">${esc(vErr)}</p>` : ""}
      <p class="small" style="margin-top:14px"><button type="button" class="linkbtn" id="toQv">Zu den Fragen →</button></p>
    </section>`;
    const t = $("thread"); if (t) t.scrollTop = t.scrollHeight;
    root.querySelectorAll("[data-sus]").forEach((b) => (b.onclick = () => { vSel = Number(b.dataset.sus); vErr = ""; verhoerView(); }));
    $("toQv").onclick = () => go("fragen");
    if ($("vf")) $("vf").onsubmit = async (e) => {
      e.preventDefault();
      const text = $("vq").value.trim(); if (!text || vBusy) return;
      vBusy = true; vErr = ""; V.threads[vSel] = [...(V.threads[vSel] || []), { role: "user", text: esc(text) }]; verhoerView();
      try { V = await api("POST", "verhoer", { suspect: vSel, text }); } catch (e2) { vErr = e2.message; V.threads[vSel].pop(); }
      vBusy = false; if (tab === "verhoer") verhoerView();
    };
  }

  function gruppeView() {
    const g = S.group;
    root.innerHTML = `<section class="report paper">
      <div class="eyebrow">Eure Gruppe</div><h2>Wer ermittelt gerade?</h2>
      <p class="muted">${g.mode === "live" ? "Ihr spielt gleichzeitig." : `Ihr spielt über ${g.days} Tage – Auflösung spätestens ${g.deadline ? fmtDate(g.deadline) : "am Ende"}.`} Zeiten und Lösungen siehst du erst bei der gemeinsamen Auflösung.</p>
      ${roster(g)}
    </section>`;
  }

  // ---------- Akte ----------
  const kindClass = (d) => ({ Notiz: "k-note", Beleg: "k-receipt", Systemauszug: "k-sys", Liste: "k-mail", Befund: "k-mail", Protokoll: "k-note", Fundstück: "k-press" })[d.kk || d.kind] || "";
  const ROT = [-1.4, 0.9, -0.5, 1.2, -1, 0.6, -0.2, 1.4];
  const STAGE_TITLE = { 2: "Neue Beweisstücke: Alibis und Protokolle", 3: "Neue Beweisstücke: die Speicherkarte" };
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
    seen.add(d.id); MS.set(seenKey(), JSON.stringify([...seen]));
    const unseen = S.docs.filter((x) => !seen.has(x.id)).length;
    $("newbadge").hidden = !unseen; $("newbadge").textContent = unseen;
    const prev = openDoc > 0 ? openDoc - 1 : null, next = openDoc < S.docs.length - 1 ? openDoc + 1 : null;
    const pb = (i, dir) => `<button type="button" data-go="${i}" class="${dir}"><small>${dir === "prev" ? "← Nr. " + pad(i + 1) : "Nr. " + pad(i + 1) + " →"}</small>${esc(S.docs[i].title)}</button>`;
    const wm = ("MORDSTEAM FRIENDS · " + String(S.name).replace(/&[^;]+;/g, "") + "   ").repeat(40);
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
      ? `<select id="ans" class="so-select"><option value="">Bitte wählen …</option>${q.options.map((o) => `<option value="${esc(o[0])}">${o[1]}</option>`).join("")}</select>`
      : `<input id="ans" type="text" inputmode="numeric" pattern="[0-9:]*" autocomplete="off" spellcheck="false" placeholder="hh:mm" maxlength="5" class="so-time"><span class="small">Nur die vier Ziffern tippen – der Doppelpunkt kommt von selbst.</span>`;
    const cost = q && q.next_hint_cost;
    root.innerHTML = `<section class="report paper">
      <div class="eyebrow">Ermittlung · ${done.length} von ${S.questions.length} gelöst</div>
      <h2>${q ? `Frage ${q.nr}` : "Alle Fragen gelöst"}</h2>
      <p class="muted">Jede falsche Antwort kostet ${S.rules.wrong} Strafminuten, Hinweise kosten ${S.rules.hints.join(" / ")} Minuten.</p>
      ${done.map((x) => `<div class="qrow so-done"><span class="qn">${x.nr}</span><div class="qf"><label>${esc(x.label)}</label><span class="so-ans">✓ ${x.answer}</span></div></div>`).join("")}
      ${q ? `<div class="qrow"><span class="qn">${q.nr}</span><div class="qf"><label for="ans">${esc(q.label)}</label><span class="hint">${esc(q.hint)}</span>${field}${hintList(q)}</div></div>
      ${verdict ? `<div class="verdict ${verdict.cls}" role="alert">${verdict.html}</div>` : ""}
      <button type="button" class="btn btn-red btn-big" id="check">Antwort prüfen</button>
      <div class="ctip"><div><b>Hinweis nehmen</b><p>${cost ? `Hinweis ${q.hints.length + 1} von 3 für diese Frage. Kostet ${cost} Strafminuten.` : "Für diese Frage hast du alle Hinweise."}</p></div>
        ${cost ? `<button type="button" class="btn ${armed ? "btn-ink" : "btn-line"}" id="hint">${armed ? `Ja, Hinweis nehmen (+${cost} Min.)` : "Hinweis anzeigen"}</button>${armed ? `<button type="button" class="linkbtn" id="hintno">Abbrechen</button>` : ""}` : ""}</div>` : ""}
      ${locked.map((x) => `<div class="qrow so-locked"><span class="qn">${x.nr}</span><div class="qf"><label>${esc(x.label)}</label><span class="hint">Wird frei, sobald du Frage ${x.nr - 1} gelöst hast.</span></div></div>`).join("")}
      <p style="margin-top:26px;text-align:right">${giveArmed ? `<span class="small">Wirklich aufgeben? Du kommst dann nicht in die Wertung. Die Auflösung siehst du mit allen anderen.</span> <button type="button" class="btn btn-ink" id="give">Ja, aufgeben</button> <button type="button" class="linkbtn" id="giveno">Weiter ermitteln</button>` : `<button type="button" class="linkbtn" id="give">Aufgeben</button>`}</p>
    </section>`;
    const inp = $("ans");
    if (inp && q.type === "time") {
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("check").click(); } });
      inp.addEventListener("input", (e) => {
        const dg = inp.value.replace(/[^0-9]/g, "").slice(0, 4);
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
  async function answer(q, value) {
    if (busy) return;
    if (!String(value || "").trim()) { verdict = { cls: "warn", html: q.type === "select" ? "Bitte eine Antwort auswählen." : "Bitte eine Uhrzeit eingeben." }; return fragenView(); }
    if (q.type === "time") {
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
        verdict = null; openDoc = null;
        await refresh(d);
        const vNow = S.plus && S.verhoer && S.verhoer.open && q.nr === S.verhoer.from_question;
        if (!d.ended) { verdict = { cls: "good", html: vNow ? `<strong>Richtig!</strong>Frage ${q.nr} ist gelöst. Der Verhörraum ist offen – verhöre die Doppelgänger deiner Freunde.` : q.nr >= 3 ? `<strong>Richtig!</strong>Frage ${q.nr} ist gelöst. Jetzt das Finale.` : `<strong>Richtig!</strong>Frage ${q.nr} ist gelöst. Neue Beweisstücke liegen in deiner Akte.` }; fragenView(); if (vNow) { V = null; const tt = $("toast"); tt.innerHTML = `<button type="button">🗣️ Der Verhörraum ist offen <b>Verhören</b></button>`; tt.hidden = false; tt.querySelector("button").onclick = () => { tt.hidden = true; go("verhoer"); }; setTimeout(() => (tt.hidden = true), 5000); } else if (q.nr < 3) toast(`📁 Neue Beweisstücke in deiner Akte <b>Ansehen</b>`); }
        scrollTo(0, 0);
      } else {
        verdict = { cls: "bad", html: `<strong>Leider falsch.</strong>+${d.penalty} Minuten Strafzeit. Schau dir die Beweisstücke noch einmal an.` };
        await refresh(d);
      }
    } catch (e) { verdict = { cls: "warn", html: esc(e.message) }; fragenView(); }
    busy = false;
  }

  // ---------- Gemeinsame Auflösung ----------
  function rankTable(r, me) {
    return `<table class="grid fr-rank"><tr><th>Platz</th><th>Ermittler</th><th>Endzeit</th><th>Auszeichnung</th></tr>
      ${r.ranking.map((x) => `<tr class="${x.idx === me ? "me" : ""}${x.culprit ? " culprit" : ""}"><td>${x.place || "–"}</td><td><b>${x.name}</b>${x.culprit ? `<br><span class="small">war's – und hat gegen sich selbst ermittelt</span>` : ""}</td><td class="mono">${x.solved ? MS.dur(x.score_ms) + (x.penalty ? `<br><span class="small">inkl. ${x.penalty} Strafmin.</span>` : "") : x.played ? "nicht gelöst" : "nicht gespielt"}</td><td>${esc(x.award)}</td></tr>`).join("")}</table>`;
  }
  function revealView() {
    const r = S.reveal, win = r.ranking.find((x) => x.place === 1), mine = r.ranking.find((x) => x.idx === S.me);
    root.innerHTML = `<section class="report paper so-result">
      <div class="solved"><div class="bigstamp"><div><small>MORDSTEAM FRIENDS · AUFLÖSUNG</small><strong>ES WAR ${String(r.culprit).toUpperCase()}</strong><small>LETZTE RUNDE AUF DER HÜTTE</small></div></div></div>
      ${r.ranking[0] && r.ranking[0].idx === S.me && mine.solved ? `<p class="so-pct"><b>Du hast gewonnen!</b></p>` : mine && mine.place ? `<p class="so-pct">Du bist auf <b>Platz ${mine.place}</b>.</p>` : ""}
      <h3>Was in der Nacht geschah</h3>
      <p>${r.text}</p>
      <p><b>Versteck der Speicherkarte:</b> ${r.item}</p>
      <h3>Rangliste</h3>${rankTable(r, S.me)}
      ${win ? `<p class="small">Gewonnen hat ${win.name}. Endzeit = gespielte Zeit plus Strafminuten.</p>` : ""}
      <p class="small" style="margin-top:18px">Lust auf mehr? Weitere Fälle – allein, mit Freunden oder im Team: <a href="/">mordsteam.com</a></p>
    </section>
    ${S.feedback_done ? "" : fbHtml()}`;
    bindFeedback();
  }

  // ---------- Feedback nach der Auflösung (einmal pro Spieler) ----------
  const chips = (key, list) => `<div class="chips-row">${list.map((x) => `<button type="button" class="chipbtn" data-${key}="${x}">${x}</button>`).join("")}</div>`;
  function fbHtml() {
    const vor = String(S.name).split(/\s+/)[0];
    return `<section class="report paper so-fb" id="fbi">
      <div class="eyebrow">Dein Feedback</div><h3 style="margin-top:6px">Wie fandest du den Krimiabend?</h3>
      <p class="muted">Zwei Klicks, die uns sehr helfen – neue Fälle bauen wir aus eurem Feedback.</p>
      <div class="stars" role="radiogroup" aria-label="Sterne">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${n} von 5 Sternen">★</button>`).join("")}</div>
      <div class="field"><span class="label">Wie schwer war der Fall?</span>${chips("diff", ["zu leicht", "genau richtig", "zu schwer"])}</div>
      <div class="field"><label for="fbimp">Was sollen wir besser machen? <span class="opt">optional, nur für uns</span></label><textarea id="fbimp" maxlength="1500" rows="2"></textarea></div>
      <div class="fbpub"><div class="field"><label for="fbrev">Ein paar Worte für andere Gruppen?</label><span class="hint">Optional – über ein nettes Feedback freuen wir uns besonders.</span><textarea id="fbrev" maxlength="600" rows="3" placeholder="Was hat euch gefallen?"></textarea></div>
      <div class="field"><span class="label">Dürfen wir deine Worte auf mordsteam.com zeigen?</span>
        <label class="check"><input type="radio" name="pub" value="vorname"><span>Ja, als „${vor}“</span></label>
        <label class="check"><input type="radio" name="pub" value="anon"><span>Ja, aber anonym</span></label>
        <label class="check"><input type="radio" name="pub" value="no" checked><span>Nein, nur für euch</span></label></div></div>
      <p class="err" id="fbierr" hidden></p><button type="button" class="btn btn-red" id="fbisend">Feedback senden</button></section>`;
  }
  function bindFeedback() {
    if (!$("fbisend")) return;
    const pick = {};
    root.querySelectorAll("[data-star],[data-diff]").forEach((b) => (b.onclick = () => {
      const key = b.dataset.star !== undefined ? "star" : "diff";
      pick[key] = b.dataset[key];
      if (key === "star") root.querySelectorAll("[data-star]").forEach((x) => x.classList.toggle("on", Number(x.dataset.star) <= Number(pick.star)));
      else root.querySelectorAll("[data-diff]").forEach((x) => x.classList.toggle("on", x === b));
    }));
    $("fbisend").onclick = async () => {
      if (!pick.star) { $("fbierr").textContent = "Bitte wähle 1 bis 5 Sterne."; $("fbierr").hidden = false; return; }
      $("fbisend").disabled = true;
      const pub = (root.querySelector("input[name=pub]:checked") || {}).value || "no";
      try {
        await api("POST", "feedback", { rating: Number(pick.star), difficulty: pick.diff || "", improve: $("fbimp").value, review: $("fbrev").value, publish: pub });
        S.feedback_done = true;
        $("fbi").innerHTML = `<div class="eyebrow">Feedback</div><h3 style="margin-top:6px">Danke!</h3><p class="muted">Dein Feedback ist angekommen.</p>`;
      } catch (e) { $("fbierr").textContent = e.message; $("fbierr").hidden = false; $("fbisend").disabled = false; }
    };
  }

  // ---------- Organisator ----------
  async function orgView(msg) {
    plain();
    let g;
    try { g = await (await fetch("/api/friends/org?o=" + encodeURIComponent(orgTok))).json(); if (g.error) throw new Error(g.error); }
    catch (e) { root.innerHTML = `<div class="panel center"><p class="err">${esc(e.message)}</p></div>`; return; }
    $("fallname").textContent = "Mordsteam Friends · Organisator"; $("pname").textContent = g.title;
    const link = `${location.origin}/spiel/friends.html?e=${g.invite}`;
    const n = g.players.length, joined = g.players.filter((p) => p.joined).length, done = g.players.filter((p) => p.done).length;
    root.innerHTML = `<section class="report paper">
      <div class="eyebrow">Organisator · ${g.mode === "live" ? "gleichzeitig" : `über ${g.days} Tage`}${g.test ? " · TEST" : ""}</div>
      <h2>${g.status === "ready" ? "Lade deine Gruppe ein" : g.status === "running" ? "Der Fall läuft" : "Der Fall ist aufgelöst"}</h2>
      <div class="field"><span class="label">Einladungslink für alle (auch für dich, wenn du mitspielst)</span>
        <div class="fr-link"><input readonly value="${esc(link)}" id="lnk"><button type="button" class="btn btn-ink" id="share">${navigator.share ? "Teilen" : "Kopieren"}</button></div>
        <span class="small">Schick den Link in eure Gruppe. Jeder tippt auf seinen Namen.</span></div>
      <h3 style="margin-top:22px">Ermittler (${joined} von ${n} verbunden${g.status !== "ready" ? `, ${done} fertig` : ""})</h3>
      <ul class="fr-roster">${g.players.map((p) => `<li><b>${p.name}</b><span>${p.done ? "✓ fertig" : p.playing ? "ermittelt" : p.joined ? "verbunden" : "noch nicht da"}</span></li>`).join("")}</ul>
      ${g.status === "ready" ? `<p class="muted">${g.mode === "live" ? `Wenn alle da sind, startest du den Fall für alle gleichzeitig. Die Uhr läuft dann ${g.limit_min} Minuten.` : `Mit dem Start beginnen die ${g.days} Tage. Jeder spielt, wann er will – die Auflösung kommt für alle gleichzeitig.`}</p>
        <button type="button" class="btn btn-red btn-big" id="start">${g.mode === "live" ? "Fall für alle starten" : `${g.days} Tage starten`}</button>` : ""}
      ${g.status === "running" ? `<p class="muted">Auflösung ${g.mode === "live" ? "sobald alle fertig sind, spätestens" : "sobald alle fertig sind, spätestens"} ${fmtDate(g.deadline)}.</p>
        ${g.can_reveal ? `<button type="button" class="btn btn-red" id="reveal">Auflösung jetzt zeigen${g.test && done < n ? " (Test)" : ""}</button>` : ""}` : ""}
      ${g.reveal ? `<h3 style="margin-top:22px">Es war ${g.reveal.culprit}</h3><p>${g.reveal.text}</p>${rankTable(g.reveal, -1)}` : ""}
      ${msg ? `<p class="err">${esc(msg)}</p>` : ""}
    </section>`;
    $("share").onclick = async () => { try { if (navigator.share) await navigator.share({ title: "Mordsteam Friends", text: "Einer von uns war's. Such dir deinen Namen aus:", url: link }); else { await navigator.clipboard.writeText(link); $("share").textContent = "Kopiert ✓"; } } catch {} };
    if ($("start")) $("start").onclick = async () => { $("start").disabled = true; const r = await fetch("/api/friends/org/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ o: orgTok }) }); const d = await r.json().catch(() => ({})); orgView(r.ok ? "" : d.error); };
    if ($("reveal")) $("reveal").onclick = async () => { $("reveal").disabled = true; const r = await fetch("/api/friends/org/reveal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ o: orgTok }) }); const d = await r.json().catch(() => ({})); orgView(r.ok ? "" : d.error); };
    every(g.status === "revealed" ? 0 : 15000, () => orgView());
  }

  // ---------- Start ----------
  if (orgTok) orgView();
  else if (token) { seen = new Set(JSON.parse(MS.get(seenKey()) || "[]")); refresh(); }
  else if (invite) inviteView();
  else { plain(); root.innerHTML = `<div class="panel center"><h2>Mordsteam Friends</h2><p>Öffne den Einladungslink, den dir dein Organisator geschickt hat.</p></div>`; }
})();
