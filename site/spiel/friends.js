// Mordsteam Friends – Spieloberfläche (jeder Spieler am eigenen Gerät) und Organisator-Ansicht (?o=…)
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const root = $("root"), clock = $("clock"), tabs = $("tabs");
  const esc = MS.esc, pad = (n) => String(n).padStart(2, "0"), t = MS.t;
  const invite = MS.qs("e") || "", orgTok = MS.qs("o") || "";
  let token = MS.qs("p") || (invite ? MS.get("ms_friends_tok_" + invite) : "") || "";
  let S = null, off = 0, tab = "einsatz", openDoc = null, busy = false, verdict = null, armed = false, giveArmed = false, poll = null;
  const seenKey = () => "ms_friends_seen_" + token.slice(0, 12);
  let seen = new Set();
  const fmtDate = (ms) => new Intl.DateTimeFormat(MS.lang === "en" ? "en-GB" : "de-AT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
  const MIN = () => t("Min.", "min");
  // Platzierung: „Platz 2“ / „2nd place“
  const ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  // Spielsprache der Runde übernehmen (sie gewinnt immer gegenüber Adresse/Browser)
  const useLang = (l) => { if ((l === "de" || l === "en") && l !== MS.lang) MS.setLang(l); };
  const setTitle = (x) => { document.title = x ? `Mordsteam Friends – ${String(x).replace(/<[^>]*>/g, "")}` : "Mordsteam Friends"; };

  async function api(method, path, body) {
    const r = await fetch("/api/friends/" + path, { method, headers: { "content-type": "application/json", "x-lang": MS.lang, ...(token ? { "x-friends": token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let d = {}; try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d.error || t("Fehler ", "Error ") + r.status); e.status = r.status; throw e; }
    return d;
  }
  function toast(html, ms = 4200) {
    const tt = $("toast"); tt.innerHTML = `<button type="button">${html}</button>`; tt.hidden = false;
    tt.querySelector("button").onclick = () => { tt.hidden = true; openDoc = null; go("akte"); };
    clearTimeout(toast.h); toast.h = setTimeout(() => (tt.hidden = true), ms);
  }
  function every(ms, fn) { clearInterval(poll); poll = ms ? setInterval(fn, ms) : null; }
  const plain = () => { tabs.hidden = true; clock.innerHTML = ""; clock.className = "clock"; };

  // ---------- Einladung: Namen wählen ----------
  async function inviteView(err) {
    plain(); every(0);
    let g;
    try { g = await api("GET", "invite?e=" + encodeURIComponent(invite)); }
    catch (e) { root.innerHTML = `<div class="panel center"><p class="err">${esc(e.message)}</p></div>`; return; }
    useLang(g.lang);
    $("fallname").textContent = "Mordsteam Friends"; $("pname").textContent = g.title; setTitle(g.title);
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">${t("Mordsteam Friends · Einladung", "Mordsteam Friends · Invitation")}</span><span class="conf">${g.players.length} ${t("Ermittler", g.players.length === 1 ? "detective" : "detectives")} · ${g.limit_min} ${MIN()}</span></div>
      <h1>${esc(g.title)}</h1>
      <p class="sub">${t("Einer von euch war's. Wer bist du?", "One of you did it. Who are you?")}</p>
      <div class="fr-names">${g.players.map((p) => `<button type="button" class="fr-name" data-idx="${p.idx}"><b>${p.name}</b><span>${p.done ? t("fertig", "finished") : p.joined ? t("schon verbunden", "already connected") : t("noch frei", "still free")}</span></button>`).join("")}</div>
      <p class="small">${t("Tippe auf deinen Namen. Du kannst auf jedem Gerät spielen – Handy, Tablet oder Laptop – und über diesen Link jederzeit auf einem anderen Gerät weitermachen.", "Tap your name. You can play on any device – phone, tablet or laptop – and carry on on another device at any time using this link.")}</p>
      <p class="small">${g.mode === "live" ? t("Gespielt wird gleichzeitig: Der Fall startet für alle, sobald euer Organisator auf Start drückt.", "You all play at the same time: the case starts for everyone as soon as your organiser presses start.") : t(`Gespielt wird über ${g.days} Tage: Jeder startet, wann er Zeit hat. Die Auflösung kommt für alle gleichzeitig.`, `You play over ${g.days} days: everyone starts whenever they have time. The solution is revealed to everyone at the same time.`)}</p>
      <p class="err" role="alert">${err ? esc(err) : ""}</p>
    </div></section>`;
    root.querySelectorAll("[data-idx]").forEach((b) => (b.onclick = async () => {
      const p = g.players.find((x) => x.idx === Number(b.dataset.idx));
      if (p.joined && !b.dataset.sure) { b.dataset.sure = "1"; b.querySelector("span").textContent = t("nochmal tippen, wenn du das bist", "tap again if this is you"); return; }
      try { const d = await api("POST", "claim", { e: invite, idx: p.idx }); token = d.token; MS.set("ms_friends_tok_" + invite, token); seen = new Set(JSON.parse(MS.get(seenKey()) || "[]")); tab = "einsatz"; await refresh(); scrollTo(0, 0); }
      catch (e) { inviteView(e.message); }
    }));
  }

  // ---------- Stand laden ----------
  async function refresh(d) {
    try { S = d || (await api("GET", "state")); }
    catch (e) { if (e.status === 401) { token = ""; if (invite) { MS.set("ms_friends_tok_" + invite, ""); return inviteView(e.message); } } root.innerHTML = `<div class="panel center"><p class="err">${esc(e.message)}</p></div>`; return; }
    off = S.now - Date.now();
    useLang(S.lang);
    $("pname").textContent = S.name; setTitle(S.title);
    // gleichzeitig: sobald der Organisator gestartet hat, läuft die Uhr für alle – Durchgang automatisch beginnen
    if (!S.begun && S.can_begin && S.group.mode === "live") { try { S = await api("POST", "begin"); } catch {} }
    render();
  }
  function render() {
    tick();
    if (S.reveal || S.ended) $("fallname").textContent = "Mordsteam Friends · " + S.title;
    if (S.reveal) { every(0); plain(); return revealView(); }
    if (S.ended) { plain(); every(20000, () => refresh()); return waitRevealView(); }
    if (!S.begun && !S.can_begin) { plain(); every(3000, () => { if (!document.hidden) refresh(); }); return waitStartView(); }
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
  async function go(tb) {
    if ((tb === "akte" || tb === "fragen") && S && !S.begun && !S.ended) {
      if (busy) return;
      busy = true;
      try { const d = await api("POST", "begin"); tab = tb; await refresh(d); }
      catch (e) { toast(esc(e.message)); }
      busy = false; scrollTo(0, 0); return;
    }
    if (tb === "gruppe") { tab = tb; await refresh(); scrollTo(0, 0); return; }
    if (tb === "verhoer") { tab = tb; render(); scrollTo(0, 0); return; }
    tab = tb; render(); scrollTo(0, 0);
  }
  tabs.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => go(b.dataset.tab)));

  // ---------- Uhr ----------
  function tick() {
    if (!S || S.ended || S.reveal) { return; }
    const hut = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
    const place = t("Hütte", "Chalet");
    if (!S.begun) {
      $("fallname").textContent = `${place} ${hut(S.clock_start)} · ${S.title}`;
      clock.className = "clock";
      clock.innerHTML = `<span class="clk"><span class="clk-label">${t("Uhr steht", "Clock stopped")}</span><b class="clk-time">${MS.dur(S.limit_min * 60000)}</b></span>`;
      return;
    }
    const now = Date.now() + off, el = now - S.started_at, left = S.limit_min * 60000 - el;
    const pen = S.penalty_min ? `<span class="pen">+${S.penalty_min} ${t("Min. Strafe", "min penalty")}</span>` : "";
    $("fallname").textContent = `${place} ${hut(S.clock_start + Math.floor(el / 60000))} · ${S.title}`;
    const cd = MS.countdown(left);
    clock.className = "clock" + cd.cls;
    clock.innerHTML = `<span class="clk"><span class="clk-label">${left > 0 ? S.clock_label : S.late_label}</span>${cd.html}${pen}</span>`;
  }
  setInterval(tick, 1000);

  // ---------- Warten ----------
  const pstat = (p, showDone = true) => (showDone && p.done ? t("✓ fertig", "✓ finished") : p.playing ? t("ermittelt", "investigating") : p.joined ? t("verbunden", "connected") : t("noch nicht da", "not here yet"));
  const roster = (g, showDone = true) => `<ul class="fr-roster">${g.players.map((p) => `<li class="${p.idx === S.me ? "me" : ""}"><b>${p.name}${p.idx === S.me ? t(" (du)", " (you)") : ""}</b><span>${pstat(p, showDone)}</span></li>`).join("")}</ul>`;
  // Countdown zwischen dem Klick des Organisators und dem gemeinsamen Start (gleichzeitig)
  let cdTimer = null;
  function countdown() {
    clearInterval(cdTimer); cdTimer = null;
    const g = S && S.group;
    if (!g || g.mode !== "live" || g.status !== "running" || !g.started_at) return;
    const left = () => Math.ceil((g.started_at - (Date.now() + off)) / 1000);
    const show = () => {
      const s = left(), el = $("cdnum");
      if (s <= 0) { clearInterval(cdTimer); cdTimer = null; if (el) el.textContent = "0"; setTimeout(() => refresh(), 400); return; }
      if (el) el.textContent = s;
    };
    cdTimer = setInterval(show, 250); show();
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && S && !S.begun && !S.ended && !S.reveal) refresh(); });
  function waitStartView() {
    const g = S.group;
    const soon = g.mode === "live" && g.status === "running" && g.started_at;
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">${esc(S.briefing.eyebrow)}</span><span class="conf">Friends · ${S.limit_min} ${MIN()}</span></div>
      <h1>${S.briefing.title}</h1>
      <p class="sub">${g.status === "revealed" ? t("Dieser Fall ist bereits aufgelöst.", "This case has already been solved.") : g.mode === "live" ? t("Gleich geht's los. Euer Organisator startet den Fall für alle gleichzeitig – die Seite springt dann von selbst um.", "Almost time. Your organiser starts the case for everyone at once – this page will switch over by itself.") : g.status === "ready" ? t("Der Fall ist noch nicht freigeschaltet. Sobald euer Organisator ihn freigibt, kannst du loslegen.", "The case hasn’t been unlocked yet. As soon as your organiser unlocks it, you can get started.") : t("Das Zeitfenster für diesen Fall ist vorbei.", "The time window for this case is over.")}</p>
      ${soon ? `<div class="fr-cd" role="timer" aria-live="polite"><span>${t("Es geht los in", "Starting in")}</span><strong id="cdnum">10</strong><span>${t("Sekunden", "seconds")}</span></div>` : ""}
      <h2 class="qhead">${t("Wer schon da ist", "Who’s already here")}</h2>${roster(g)}
      <p class="small">${t("Du kannst auf jedem Gerät ermitteln – Handy, Tablet oder Laptop.", "You can investigate on any device – phone, tablet or laptop.")}</p>
    </div></section>`;
    countdown();
  }
  function waitRevealView() {
    const g = S.group, o = S.own || {};
    const when = g.mode === "live" ? t("sobald alle fertig sind – spätestens eine Stunde nach dem Start", "as soon as everyone has finished – at the latest one hour after the start") : t(`sobald alle fertig sind – spätestens ${g.deadline ? fmtDate(g.deadline) : "am Ende des Zeitfensters"}`, `as soon as everyone has finished – at the latest ${g.deadline ? "on " + fmtDate(g.deadline) : "at the end of the time window"}`);
    root.innerHTML = `<section class="report paper so-result">
      <div class="solved"><div class="bigstamp ${o.solved ? "" : "grey"}"><div><small>MORDSTEAM FRIENDS · ${t("HÜTTE", "CHALET")}</small><strong>${o.solved ? t("GELÖST!", "SOLVED!") : t("AKTE ZU", "CASE CLOSED")}</strong><small>${String(S.name).toUpperCase()}</small></div></div></div>
      ${o.solved ? `<div class="so-score"><div><small>${t("Endzeit", "Final time")}</small><b>${MS.dur(o.score_ms)}</b></div><div><small>${t("Gespielt", "Played")}</small><b>${MS.dur(o.played_ms)}</b></div><div><small>${t("Strafminuten", "Penalty minutes")}</small><b>${o.penalty}</b></div></div>` : ""}
      <p class="so-pct">${t(`Die Auflösung und die Rangliste kommen für alle gleichzeitig, ${when}.`, `The solution and the leaderboard are revealed to everyone at the same time, ${when}.`)}</p>
      <div class="fr-hush"><b>${t("Pssst – nichts verraten!", "Shhh – don’t give anything away!")}</b> ${t("Wer anderen hilft, macht sich selbst in der Rangliste schlechter.", "If you help the others, you only push yourself down the leaderboard.")}</div>
      <h3>${t("Wer schon fertig ist", "Who has finished")}</h3>${roster(g)}
      <p class="small">${g.mode === "live" ? t("Diese Seite aktualisiert sich von selbst.", "This page updates by itself.") : t("Du kannst die Seite ruhig schließen: Sobald die Auflösung da ist, bekommt euer Organisator eine E-Mail und schickt sie euch. Mit deinem Einladungslink siehst du sie dann jederzeit.", "Feel free to close this page: as soon as the solution is ready, your organiser gets an email and sends it on to you. You can then see it any time with your invitation link.")}</p>
    </section>`;
  }

  // ---------- Einsatz, Gruppe ----------
  function einsatzView() {
    const b = S.briefing;
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">${esc(b.eyebrow)}</span><span class="conf">Friends · ${S.limit_min} ${MIN()}</span></div>
      <h1>${b.title}</h1><p class="sub">${b.text}${S.begun ? t(" Die Uhr oben läuft bereits.", " The clock at the top is already running.") : ""}</p>
      <ol class="steps">${b.steps.map((x, i) => `<li><span class="n">${i + 1}</span><div><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div></li>`).join("")}</ol>
      <h2 class="qhead">${({ 3: t("Deine drei Fragen", "Your three questions"), 4: t("Deine vier Fragen", "Your four questions"), 5: t("Deine fünf Fragen", "Your five questions") })[S.questions.length] || t("Deine Fragen", "Your questions")}</h2>
      <div class="qcards">${S.questions.map((q) => `<div><i>${pad(q.nr)}</i><span>${esc(q.label)}</span></div>`).join("")}</div>
      ${S.begun ? "" : `<p class="small" style="margin-bottom:12px">${t("Die Uhr startet, sobald du die Akte oder die Fragen öffnest, und lässt sich dann nicht mehr anhalten.", "The clock starts as soon as you open the case file or the questions, and can’t be stopped after that.")}</p>`}
      <button type="button" class="btn btn-red btn-big" id="toAkte">${S.begun ? t("Zur Akte →", "To the case file →") : t("Akte öffnen – die Uhr startet →", "Open the case file – the clock starts →")}</button>
    </div></section>`;
    $("toAkte").onclick = () => go("akte");
  }
  // ---------- Plus: Verhörraum ----------
  let V = null, vSel = null, vBusy = false, vErr = "";
  async function verhoerView() {
    MS.set(seenKey() + "_v", "1"); $("vbadge").hidden = true;
    if (!S.verhoer || !S.verhoer.open) {
      const fq = S.verhoer ? S.verhoer.from_question : 2, mx = S.verhoer ? S.verhoer.max : 12;
      root.innerHTML = `<section class="report paper"><div class="eyebrow">${t("Plus · Verhörraum", "Plus · Interrogation room")}</div><h2>${t("Noch verschlossen", "Still locked")}</h2>
        <p class="muted">${t(`Der Verhörraum öffnet, sobald du Frage ${fq} gelöst hast. Dann kannst du die KI-Doppelgänger deiner Freunde verhören – ${mx} Fragen hast du.`, `The interrogation room opens as soon as you’ve solved question ${fq}. Then you can question your friends’ AI doubles – you have ${mx} questions.`)}</p></section>`;
      return;
    }
    if (!V) { try { V = await api("GET", "verhoer"); } catch (e) { root.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; } }
    if (vSel === null) vSel = V.suspects.find((x) => !x.me) ? V.suspects.find((x) => !x.me).idx : 0;
    const left = V.max - V.used, th = V.threads[vSel] || [], who = V.suspects[vSel];
    const dbl = t("KI-Doppelgänger", "AI double");
    root.innerHTML = `<section class="report paper fr-verhoer">
      <div class="eyebrow">${t("Plus · Verhörraum · KI", "Plus · Interrogation room · AI")}</div>
      <h2>${t("Wen willst du verhören?", "Who do you want to question?")}</h2>
      <p class="muted">${t(`Die Doppelgänger werden von einer KI gespielt und kennen nur die erfundene Welt des Falls. Einer von ihnen lügt. Du hast noch <b>${left} von ${V.max}</b> Fragen.`, `The doubles are played by an AI and only know the fictional world of the case. One of them is lying. You have <b>${left} of ${V.max}</b> questions left.`)}</p>
      <div class="fr-suspects">${V.suspects.map((x) => `<button type="button" class="chipbtn ${x.idx === vSel ? "on" : ""}" data-sus="${x.idx}">${x.name}${x.me ? t(" (du)", " (you)") : ""}${(V.threads[x.idx] || []).length ? " ·" + (V.threads[x.idx].filter((m) => m.role === "user").length) : ""}</button>`).join("")}</div>
      <div class="fr-thread" id="thread">${th.length ? th.map((m) => `<div class="fr-msg ${m.role === "user" ? "q" : "a"}"><small>${m.role === "user" ? t("Du", "You") + (m.nc ? t(" · nicht gezählt", " · not counted") : "") : who.name + " · " + dbl}</small>${m.text}</div>`).join("") : `<p class="small muted">${t(`Noch keine Fragen an ${who.name}. Tipp: Frag, wo die Person in der Nacht war – oder was sie über Ferdl und sein Passwort weiß.`, `No questions for ${who.name} yet. Tip: ask where they were during the night – or what they know about Ferdl and his password.`)}</p>`}${vBusy ? `<div class="fr-msg a typing"><small>${who.name} · ${dbl}</small>…</div>` : ""}</div>
      ${left > 0 ? `<form id="vf" class="fr-ask"><input id="vq" maxlength="${V.max_chars}" autocomplete="off" placeholder="${esc(t(`Deine Frage an ${who.name} …`, `Your question for ${who.name} …`))}" ${vBusy ? "disabled" : ""}><button class="btn btn-red" type="submit" ${vBusy ? "disabled" : ""}>${t("Fragen", "Ask")}</button></form>` : `<p class="note">${t("Du hast alle Fragen gestellt. Die Hinweise zur letzten Frage helfen dir weiter.", "You’ve asked all your questions. The hints for the last question will help you on.")}</p>`}
      ${vErr ? `<p class="err">${esc(vErr)}</p>` : ""}
      <p class="small" style="margin-top:14px"><button type="button" class="linkbtn" id="toQv">${t("Zu den Fragen →", "To the questions →")}</button></p>
    </section>`;
    const th2 = $("thread"); if (th2) th2.scrollTop = th2.scrollHeight;
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
      <div class="eyebrow">${t("Eure Gruppe", "Your group")}</div><h2>${t("Wer ermittelt gerade?", "Who’s investigating right now?")}</h2>
      <p class="muted">${g.mode === "live" ? t("Ihr spielt gleichzeitig.", "You’re all playing at the same time.") : t(`Ihr spielt über ${g.days} Tage – Auflösung spätestens ${g.deadline ? fmtDate(g.deadline) : "am Ende"}.`, `You’re playing over ${g.days} days – solution ${g.deadline ? "by " + fmtDate(g.deadline) + " at the latest" : "at the end"}.`)} ${t("Zeiten und Lösungen siehst du erst bei der gemeinsamen Auflösung.", "You’ll only see times and answers at the joint reveal.")}</p>
      ${roster(g)}
    </section>`;
  }

  // ---------- Akte ----------
  const kindClass = (d) => ({ Notiz: "k-note", Beleg: "k-receipt", Systemauszug: "k-sys", Liste: "k-mail", Befund: "k-mail", Protokoll: "k-note", Fundstück: "k-press" })[d.kk || d.kind] || "";
  const ROT = [-1.4, 0.9, -0.5, 1.2, -1, 0.6, -0.2, 1.4];
  const STAGE_TITLE = () => MS.lang === "en"
    ? { 2: "New evidence: alibis and logs", 3: "New evidence: the memory card", 4: "Finale: the cloud backup", 5: "Finale: Ferdl’s Part 2" }
    : { 2: "Neue Beweisstücke: Alibis und Protokolle", 3: "Neue Beweisstücke: die Speicherkarte", 4: "Finale: das Cloud-Backup", 5: "Finale: Ferdls Teil 2" };
  function akteView() {
    const read = S.docs.filter((d) => seen.has(d.id)).length, ST = STAGE_TITLE();
    root.innerHTML = `<div class="deskhead"><h2>${t("Fallakte", "Case file")}</h2><span>${read} / ${S.docs.length} ${t("gelesen", "read")}</span></div>
      <div class="evid">${S.docs.map((d, i) => `${d.stage >= 2 && (i === 0 || S.docs[i - 1].stage !== d.stage) ? `<div class="actdiv"><span class="conf">${t(`Frage ${d.stage - 1} gelöst`, `Question ${d.stage - 1} solved`)}</span><b>${ST[d.stage] || ""}</b></div>` : ""}
        <button type="button" class="ev ${kindClass(d)} ${seen.has(d.id) ? "seen" : ""}" data-doc="${i}" style="--r:${ROT[i % ROT.length]}deg">
        <span class="ev-nr">${t("Nr.", "No.")} ${pad(i + 1)}</span><span class="kind">${esc(d.kind)}</span><span class="ttl">${esc(d.title)}</span>${seen.has(d.id) ? `<span class="gel">${t("Gelesen", "Read")}</span>` : `<span class="gel neu">${t("Neu", "New")}</span>`}</button>`).join("")}</div>
      <p class="ondesk small" style="margin-top:22px;text-align:center">${t("Mit jeder richtigen Antwort kommen neue Beweisstücke dazu.", "Every correct answer adds new evidence.")} <button type="button" class="linkbtn ondesk" id="toQ" style="color:var(--paper)">${t("Zu den Fragen →", "To the questions →")}</button></p>`;
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
    const nr = t("Nr.", "No.");
    const pb = (i, dir) => `<button type="button" data-go="${i}" class="${dir}"><small>${dir === "prev" ? "← " + nr + " " + pad(i + 1) : nr + " " + pad(i + 1) + " →"}</small>${esc(S.docs[i].title)}</button>`;
    const wm = ("MORDSTEAM FRIENDS · " + String(S.name).replace(/&[^;]+;/g, "") + "   ").repeat(40);
    root.innerHTML = `<div class="docbar"><button type="button" class="back" id="back">${t("← Alle Beweisstücke", "← All evidence")}</button><span class="docpos">${nr} ${pad(openDoc + 1)} / ${S.docs.length} · ${esc(d.kind)}</span></div>
      <article class="doc" data-wm="${esc(wm)}"><div class="doc-inner">${d.html}</div></article>
      <div class="pager three">${prev !== null ? pb(prev, "prev") : "<span></span>"}<div class="cur"><small>${nr} ${pad(openDoc + 1)}</small>${esc(d.title)}</div>${next !== null ? pb(next, "next") : `<button type="button" class="next" id="toQ2"><small>${t("Weiter →", "Next →")}</small>${t("Zu den Fragen", "To the questions")}</button>`}</div>`;
    root.querySelectorAll(".doc table").forEach((tb) => { const w = document.createElement("div"); w.className = "tablewrap"; tb.before(w); w.append(tb); });
    $("back").onclick = () => { openDoc = null; render(); };
    root.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { openDoc = Number(b.dataset.go); render(); scrollTo(0, 0); }));
    if ($("toQ2")) $("toQ2").onclick = () => go("fragen");
  }

  // ---------- Fragen ----------
  function fragenView() {
    const q = S.questions.find((x) => x.status === "open");
    const done = S.questions.filter((x) => x.status === "done");
    const locked = S.questions.filter((x) => x.status === "locked");
    const hintList = (x) => x.hints.map((h, i) => `<div class="funknote"><b>${t("Hinweis", "Hint")} ${i + 1}</b>${h}</div>`).join("");
    let field = "";
    if (q) field = q.type === "select"
      ? `<select id="ans" class="so-select"><option value="">${t("Bitte wählen …", "Please choose …")}</option>${q.options.map((o) => `<option value="${esc(o[0])}">${o[1]}</option>`).join("")}</select>`
      : `<input id="ans" type="text" inputmode="numeric" pattern="[0-9:]*" autocomplete="off" spellcheck="false" placeholder="hh:mm" maxlength="5" class="so-time"><span class="small">${t("Nur die vier Ziffern tippen – der Doppelpunkt kommt von selbst.", "Just type the four digits – the colon appears by itself.")}</span>`;
    const cost = q && q.next_hint_cost;
    root.innerHTML = `<section class="report paper">
      <div class="eyebrow">${t(`Ermittlung · ${done.length} von ${S.questions.length} gelöst`, `Investigation · ${done.length} of ${S.questions.length} solved`)}</div>
      <h2>${q ? `${t("Frage", "Question")} ${q.nr}` : t("Alle Fragen gelöst", "All questions solved")}</h2>
      <p class="muted">${t(`Jede falsche Antwort kostet ${S.rules.wrong} Strafminuten, Hinweise kosten ${S.rules.hints.join(" / ")} Minuten.`, `Every wrong answer costs ${S.rules.wrong} penalty minutes; hints cost ${S.rules.hints.join(" / ")} minutes.`)}</p>
      ${done.map((x) => `<div class="qrow so-done"><span class="qn">${x.nr}</span><div class="qf"><label>${esc(x.label)}</label><span class="so-ans">✓ ${x.answer}</span></div></div>`).join("")}
      ${q ? `<div class="qrow"><span class="qn">${q.nr}</span><div class="qf"><label for="ans">${esc(q.label)}</label><span class="hint">${esc(q.hint)}</span>${field}${hintList(q)}</div></div>
      ${verdict ? `<div class="verdict ${verdict.cls}" role="alert">${verdict.html}</div>` : ""}
      <button type="button" class="btn btn-red btn-big" id="check">${t("Antwort prüfen", "Check answer")}</button>
      <div class="ctip"><div><b>${t("Hinweis nehmen", "Take a hint")}</b><p>${cost ? t(`Hinweis ${q.hints.length + 1} von 3 für diese Frage. Kostet ${cost} Strafminuten.`, `Hint ${q.hints.length + 1} of 3 for this question. Costs ${cost} penalty minutes.`) : t("Für diese Frage hast du alle Hinweise.", "You’ve had all the hints for this question.")}</p></div>
        ${cost ? `<button type="button" class="btn ${armed ? "btn-ink" : "btn-line"}" id="hint">${armed ? t(`Ja, Hinweis nehmen (+${cost} Min.)`, `Yes, take the hint (+${cost} min)`) : t("Hinweis anzeigen", "Show hint")}</button>${armed ? `<button type="button" class="linkbtn" id="hintno">${t("Abbrechen", "Cancel")}</button>` : ""}` : ""}</div>` : ""}
      ${locked.map((x) => `<div class="qrow so-locked"><span class="qn">${x.nr}</span><div class="qf"><label>${esc(x.label)}</label><span class="hint">${t(`Wird frei, sobald du Frage ${x.nr - 1} gelöst hast.`, `Unlocks once you’ve solved question ${x.nr - 1}.`)}</span></div></div>`).join("")}
      <p style="margin-top:26px;text-align:right">${giveArmed ? `<span class="small">${t("Wirklich aufgeben? Du kommst dann nicht in die Wertung. Die Auflösung siehst du mit allen anderen.", "Really give up? You won’t be ranked then. You’ll see the solution together with everyone else.")}</span> <button type="button" class="btn btn-ink" id="give">${t("Ja, aufgeben", "Yes, give up")}</button> <button type="button" class="linkbtn" id="giveno">${t("Weiter ermitteln", "Keep investigating")}</button>` : `<button type="button" class="linkbtn" id="give">${t("Aufgeben", "Give up")}</button>`}</p>
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
    if (!String(value || "").trim()) { verdict = { cls: "warn", html: q.type === "select" ? t("Bitte eine Antwort auswählen.", "Please choose an answer.") : t("Bitte eine Uhrzeit eingeben.", "Please enter a time.") }; return fragenView(); }
    if (q.type === "time") {
      const dg = String(value).replace(/[^0-9]/g, "");
      if (dg.length !== 4 || Number(dg.slice(0, 2)) > 23 || Number(dg.slice(2)) > 59) {
        verdict = { cls: "warn", html: t("Bitte die Uhrzeit vollständig als hh:mm eingeben, z. B. 23:05.", "Please enter the full time as hh:mm, e.g. 23:05.") }; fragenView();
        const i = $("ans"); if (i) { i.value = String(value); i.focus(); } return;
      }
    }
    busy = true; $("check").disabled = true; $("check").textContent = t("Wird geprüft …", "Checking …");
    try {
      const d = await api("POST", "answer", { key: q.key, value });
      armed = false;
      if (d.correct) {
        verdict = null; openDoc = null;
        await refresh(d);
        const vNow = S.plus && S.verhoer && S.verhoer.open && q.nr === S.verhoer.from_question;
        const ok = `<strong>${t("Richtig!", "Correct!")}</strong>${t(`Frage ${q.nr} ist gelöst.`, `Question ${q.nr} is solved.`)} `;
        // Neue Beweisstücke gibt es, wenn eine Akte für die nächste Stufe existiert (auch nach Frage 4: „Teil 2“ im Plus)
        const newDocs = q.nr !== 3 && S.docs.some((x) => x.stage === q.nr + 1);
        if (!d.ended) { verdict = { cls: "good", html: vNow ? ok + t("Der Verhörraum ist offen – verhöre die Doppelgänger deiner Freunde.", "The interrogation room is open – question your friends’ doubles.") : q.nr === 3 ? ok + t("Jetzt das Finale.", "Now for the finale.") : newDocs ? ok + t("Neue Beweisstücke liegen in deiner Akte.", "New evidence is waiting in your case file.") : ok }; fragenView(); if (vNow) { V = null; const tt = $("toast"); tt.innerHTML = `<button type="button">🗣️ ${t("Der Verhörraum ist offen", "The interrogation room is open")} <b>${t("Verhören", "Interrogate")}</b></button>`; tt.hidden = false; tt.querySelector("button").onclick = () => { tt.hidden = true; go("verhoer"); }; setTimeout(() => (tt.hidden = true), 5000); } else if (newDocs) toast(`📁 ${t("Neue Beweisstücke in deiner Akte", "New evidence in your case file")} <b>${t("Ansehen", "View")}</b>`); }
        scrollTo(0, 0);
      } else if (d.stale) {
        // Die Frage wurde schon (z. B. in einem anderen Tab) gelöst – nur neu laden, keine Strafmeldung
        verdict = null; await refresh(d);
      } else {
        verdict = { cls: "bad", html: t(`<strong>Leider falsch.</strong>+${d.penalty} Minuten Strafzeit. Schau dir die Beweisstücke noch einmal an.`, `<strong>Sorry, that’s wrong.</strong>+${d.penalty} penalty minutes. Take another look at the evidence.`) };
        await refresh(d);
      }
    } catch (e) { verdict = { cls: "warn", html: esc(e.message) }; fragenView(); }
    busy = false;
  }

  // ---------- Gemeinsame Auflösung ----------
  function rankTable(r, me) {
    return `<table class="grid fr-rank"><tr><th>${t("Platz", "Place")}</th><th>${t("Ermittler", "Detective")}</th><th>${t("Endzeit", "Final time")}</th><th>${t("Auszeichnung", "Award")}</th></tr>
      ${r.ranking.map((x) => `<tr class="${x.idx === me ? "me" : ""}${x.culprit ? " culprit" : ""}"><td>${x.place ? (MS.lang === "en" ? ord(x.place) : x.place) : "–"}</td><td><b>${x.name}</b>${x.culprit ? `<br><span class="small">${t("war's – und hat gegen sich selbst ermittelt", "did it – and investigated themselves")}</span>` : ""}</td><td class="mono">${x.solved ? MS.dur(x.score_ms) + (x.penalty ? `<br><span class="small">${t(`inkl. ${x.penalty} Strafmin.`, `incl. ${x.penalty} penalty min`)}</span>` : "") : x.played ? t("nicht gelöst", "not solved") : t("nicht gespielt", "didn’t play")}</td><td>${esc(x.award)}</td></tr>`).join("")}</table>`;
  }
  function revealView() {
    const r = S.reveal, win = r.ranking.find((x) => x.place === 1), mine = r.ranking.find((x) => x.idx === S.me);
    root.innerHTML = `<section class="report paper so-result">
      <div class="solved"><div class="bigstamp"><div><small>MORDSTEAM FRIENDS · ${t("AUFLÖSUNG", "SOLUTION")}</small><strong>${t("ES WAR", "IT WAS")} ${String(r.culprit).toUpperCase()}</strong><small>${esc(String(S.title).toUpperCase())}</small></div></div></div>
      ${r.ranking[0] && r.ranking[0].idx === S.me && mine.solved ? `<p class="so-pct"><b>${t("Du hast gewonnen!", "You won!")}</b></p>` : mine && mine.place ? `<p class="so-pct">${t(`Du bist auf <b>Platz ${mine.place}</b>.`, `You came <b>${ord(mine.place)}</b>.`)}</p>` : ""}
      <h3>${t("Was in der Nacht geschah", "What happened that night")}</h3>
      <p>${r.text}</p>
      <p><b>${t("Versteck der Speicherkarte:", "Where the memory card was hidden:")}</b> ${r.item}</p>
      <h3>${t("Rangliste", "Leaderboard")}</h3>${rankTable(r, S.me)}
      ${win ? `<p class="small">${t(`Gewonnen hat ${win.name}. Endzeit = gespielte Zeit plus Strafminuten.`, `The winner is ${win.name}. Final time = time played plus penalty minutes.`)}</p>` : ""}
      <p class="small" style="margin-top:18px">${t("Lust auf mehr? Weitere Fälle – allein, mit Freunden oder im Team:", "Fancy more? Further cases – solo, with friends or as a team:")} <a href="/${MS.lang === "en" ? "en/" : ""}">mordsteam.com</a></p>
    </section>
    ${S.feedback_done ? "" : fbHtml()}`;
    bindFeedback();
  }

  // ---------- Feedback nach der Auflösung (einmal pro Spieler) ----------
  // Wert bleibt der deutsche Schlüssel (Auswertung), Anzeige in der Spielsprache
  const chips = (key, list) => `<div class="chips-row">${list.map((x) => `<button type="button" class="chipbtn" data-${key}="${x[0]}">${x[1]}</button>`).join("")}</div>`;
  function fbHtml() {
    const vor = String(S.name).split(/\s+/)[0];
    return `<section class="report paper so-fb" id="fbi">
      <div class="eyebrow">${t("Dein Feedback", "Your feedback")}</div><h3 style="margin-top:6px">${t("Wie fandest du den Krimiabend?", "How did you like the murder mystery night?")}</h3>
      <p class="muted">${t("Zwei Klicks, die uns sehr helfen – neue Fälle bauen wir aus eurem Feedback.", "Two clicks that help us a lot – we build new cases from your feedback.")}</p>
      <div class="stars" role="radiogroup" aria-label="${t("Sterne", "Stars")}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${t(`${n} von 5 Sternen`, `${n} of 5 stars`)}">★</button>`).join("")}</div>
      <div class="field"><span class="label">${t("Wie schwer war der Fall?", "How difficult was the case?")}</span>${chips("diff", [["zu leicht", t("zu leicht", "too easy")], ["genau richtig", t("genau richtig", "just right")], ["zu schwer", t("zu schwer", "too hard")]])}</div>
      <div class="field"><label for="fbimp">${t("Was sollen wir besser machen?", "What should we do better?")} <span class="opt">${t("optional, nur für uns", "optional, just for us")}</span></label><textarea id="fbimp" maxlength="1500" rows="2"></textarea></div>
      <div class="fbpub"><div class="field"><label for="fbrev">${t("Ein paar Worte für andere Gruppen?", "A few words for other groups?")}</label><span class="hint">${t("Optional – über ein nettes Feedback freuen wir uns besonders.", "Optional – we especially love hearing something nice.")}</span><textarea id="fbrev" maxlength="600" rows="3" placeholder="${t("Was hat euch gefallen?", "What did you enjoy?")}"></textarea></div>
      <div class="field"><span class="label">${t("Dürfen wir deine Worte auf mordsteam.com zeigen?", "May we show your words on mordsteam.com?")}</span>
        <label class="check"><input type="radio" name="pub" value="vorname"><span>${t(`Ja, als „${vor}“`, `Yes, as “${vor}”`)}</span></label>
        <label class="check"><input type="radio" name="pub" value="anon"><span>${t("Ja, aber anonym", "Yes, but anonymously")}</span></label>
        <label class="check"><input type="radio" name="pub" value="no" checked><span>${t("Nein, nur für euch", "No, just for you")}</span></label></div></div>
      <p class="err" id="fbierr" hidden></p><button type="button" class="btn btn-red" id="fbisend">${t("Feedback senden", "Send feedback")}</button></section>`;
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
      if (!pick.star) { $("fbierr").textContent = t("Bitte wähle 1 bis 5 Sterne.", "Please choose 1 to 5 stars."); $("fbierr").hidden = false; return; }
      $("fbisend").disabled = true;
      const pub = (root.querySelector("input[name=pub]:checked") || {}).value || "no";
      try {
        await api("POST", "feedback", { rating: Number(pick.star), difficulty: pick.diff || "", improve: $("fbimp").value, review: $("fbrev").value, publish: pub });
        S.feedback_done = true;
        $("fbi").innerHTML = `<div class="eyebrow">Feedback</div><h3 style="margin-top:6px">${t("Danke!", "Thank you!")}</h3><p class="muted">${t("Dein Feedback ist angekommen.", "Your feedback has arrived.")}</p>`;
      } catch (e) { $("fbierr").textContent = e.message; $("fbierr").hidden = false; $("fbisend").disabled = false; }
    };
  }

  // ---------- Organisator ----------
  const orgPost = (path) => fetch("/api/friends/" + path, { method: "POST", headers: { "content-type": "application/json", "x-lang": MS.lang }, body: JSON.stringify({ o: orgTok }) });
  async function orgView(msg) {
    plain();
    let g;
    try { g = await (await fetch("/api/friends/org?o=" + encodeURIComponent(orgTok), { headers: { "x-lang": MS.lang } })).json(); if (g.error) throw new Error(g.error); }
    catch (e) { root.innerHTML = `<div class="panel center"><p class="err">${esc(e.message)}</p></div>`; return; }
    useLang(g.lang);
    $("fallname").textContent = t("Mordsteam Friends · Organisator", "Mordsteam Friends · Organiser"); $("pname").textContent = g.title; setTitle(g.title);
    const link = `${location.origin}/spiel/friends.html?e=${g.invite}`;
    const n = g.players.length, joined = g.players.filter((p) => p.joined).length, done = g.players.filter((p) => p.done).length;
    root.innerHTML = `<section class="report paper">
      <div class="eyebrow">${t("Organisator", "Organiser")} · ${g.mode === "live" ? t("gleichzeitig", "all at once") : t(`über ${g.days} Tage`, `over ${g.days} days`)}${g.test ? " · TEST" : ""}</div>
      <h2>${g.status === "ready" ? t("Lade deine Gruppe ein", "Invite your group") : g.status === "running" ? t("Der Fall läuft", "The case is running") : t("Der Fall ist aufgelöst", "The case has been solved")}</h2>
      <div class="field"><span class="label">${t("Einladungslink für alle (auch für dich, wenn du mitspielst)", "Invitation link for everyone (you too, if you’re playing)")}</span>
        <div class="fr-link"><input readonly value="${esc(link)}" id="lnk" aria-label="${t("Einladungslink", "Invitation link")}"><button type="button" class="btn btn-ink" id="share">${navigator.share ? t("Teilen", "Share") : t("Kopieren", "Copy")}</button></div>
        <span class="small">${t("Schick den Link in eure Gruppe. Jeder tippt auf seinen Namen.", "Send the link to your group. Everyone taps their own name.")}</span></div>
      <h3 style="margin-top:22px">${t(`Ermittler (${joined} von ${n} verbunden${g.status !== "ready" ? `, ${done} fertig` : ""})`, `Detectives (${joined} of ${n} connected${g.status !== "ready" ? `, ${done} finished` : ""})`)}</h3>
      <ul class="fr-roster">${g.players.map((p) => `<li><b>${p.name}</b><span>${pstat(p)}</span></li>`).join("")}</ul>
      ${g.status === "ready" ? `<p class="muted">${g.mode === "live" ? t(`Wenn alle da sind, startest du den Fall für alle gleichzeitig. Die Uhr läuft dann ${g.limit_min} Minuten.`, `When everyone’s here, you start the case for everyone at once. The clock then runs for ${g.limit_min} minutes.`) : t(`Mit dem Start beginnen die ${g.days} Tage. Jeder spielt, wann er will – die Auflösung kommt für alle gleichzeitig.`, `Starting begins the ${g.days} days. Everyone plays whenever they like – the solution is revealed to everyone at the same time.`)}</p>
        <button type="button" class="btn btn-red btn-big" id="start">${g.mode === "live" ? t("Fall für alle starten", "Start the case for everyone") : t(`${g.days} Tage starten`, `Start the ${g.days} days`)}</button>` : ""}
      ${g.status === "running" && g.mode === "live" && g.started_at > g.now ? `<p class="muted"><b>${t("Der Countdown läuft – in wenigen Sekunden startet der Fall auf allen Geräten gleichzeitig.", "The countdown is running – in a few seconds the case starts on every device at the same time.")}</b></p>` : ""}
      ${g.status === "running" ? `<p class="muted">${t(`Auflösung sobald alle fertig sind, spätestens ${fmtDate(g.deadline)}.`, `Solution as soon as everyone has finished, at the latest on ${fmtDate(g.deadline)}.`)}${g.mode === "live" ? "" : t(" Du bekommst dann eine E-Mail mit dem Link für eure Gruppe.", " You’ll then get an email with the link for your group.")}</p>
        ${g.can_reveal ? `<button type="button" class="btn btn-red" id="reveal">${t("Auflösung jetzt zeigen", "Show the solution now")}${g.test && done < n ? " (Test)" : ""}</button>` : ""}` : ""}
      ${g.reveal ? `<h3 style="margin-top:22px">${t("Es war", "It was")} ${g.reveal.culprit}</h3><p>${g.reveal.text}</p>${rankTable(g.reveal, -1)}` : ""}
      ${msg ? `<p class="err">${esc(msg)}</p>` : ""}
    </section>`;
    $("share").onclick = async () => { try { if (navigator.share) await navigator.share({ title: "Mordsteam Friends", text: t("Einer von uns war's. Such dir deinen Namen aus:", "One of us did it. Pick your name:"), url: link }); else { await navigator.clipboard.writeText(link); $("share").textContent = t("Kopiert ✓", "Copied ✓"); } } catch {} };
    // Zweistufig bestätigen: beim ersten Klick eine Warnung unter dem Knopf, erst der zweite Klick führt aus
    const confirmFirst = (id, warnText, againLabel, run) => {
      const btn = $(id); if (!btn) return;
      btn.onclick = async () => {
        if (warnText && !btn.dataset.armed) {
          btn.dataset.armed = "1"; btn.textContent = againLabel;
          btn.insertAdjacentHTML("beforebegin", `<p class="err" id="${id}-warn">${warnText}</p>`);
          return;
        }
        btn.disabled = true; const r = await orgPost(run); const d = await r.json().catch(() => ({})); orgView(r.ok ? "" : d.error);
      };
    };
    confirmFirst("start", g.mode === "live" && joined < n
      ? t(`Achtung: Erst ${joined} von ${n} sind verbunden. Wenn du jetzt startest, läuft die Zeit für alle los und lässt sich nicht mehr anhalten.`, `Careful: only ${joined} of ${n} are connected. If you start now, the clock starts for everyone and can’t be stopped.`)
      : "", t("Trotzdem jetzt starten", "Start anyway"), "org/start");
    confirmFirst("reveal", done < n
      ? t(`Achtung: Erst ${done} von ${n} sind fertig. Die Auflösung beendet den Fall für alle – wer noch spielt, kann nicht mehr weitermachen.`, `Careful: only ${done} of ${n} have finished. Showing the solution ends the case for everyone – anyone still playing can’t continue.`)
      : "", t("Trotzdem auflösen", "Show the solution anyway"), "org/reveal");
    every(g.status === "revealed" ? 0 : 15000, () => orgView());
  }

  // ---------- Start ----------
  if (orgTok) orgView();
  else if (token) { seen = new Set(JSON.parse(MS.get(seenKey()) || "[]")); refresh(); }
  else if (invite) inviteView();
  else { plain(); $("pname").textContent = ""; root.innerHTML = `<div class="panel center"><h2>Mordsteam Friends</h2><p>${t("Öffne den Einladungslink, den dir dein Organisator geschickt hat.", "Open the invitation link your organiser sent you.")}</p></div>`; }
})();
