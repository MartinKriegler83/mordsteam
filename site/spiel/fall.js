// Mordsteam Fallzentrale – Team-Ansicht („Ermittlerschreibtisch“)
// Titel, Fragen, Hinweise und Dokumente kommen vom Server bereits sicher escaped.
(function () {
  // Mitlesegerät: kommt über den QR-Code des Teamgeräts (?mit=…)
  const t = MS.t;
  const mit = MS.qs("mit");
  if (mit) {
    const r = document.getElementById("root");
    r.innerHTML = `<div class="panel center"><p>${t("Verbinde mit eurem Team …", "Connecting to your team …")}</p></div>`;
    MS.api("POST", "mitlesen", { code: mit }).then((d) => {
      MS.set("ms_view", d.token); MS.del("ms_team"); if (d.lang) MS.setLang(d.lang); ["ms_seen", "ms_heard", "ms_tab", "ms_doc"].forEach(MS.del);
      location.replace(location.pathname);
    }).catch((e) => { r.innerHTML = `<div class="panel center"><div class="eyebrow">${t("Mitlesen", "Follow along")}</div><p style="margin-top:8px">${MS.esc(e.message)}</p></div>`; });
    return;
  }
  const token = MS.get("ms_team"), viewToken = token ? null : MS.get("ms_view");
  if (!token && !viewToken) { location.href = "/spiel/"; return; }
  const VIEWER = !token;
  const H = VIEWER ? { "x-view": viewToken } : { "x-team": token };
  const $ = (id) => document.getElementById(id);
  const root = $("root"), clock = $("clock"), tabsEl = $("tabs"), toastEl = $("toast");
  const TABS = VIEWER ? ["akte", "firma", "funk"] : ["einsatz", "akte", "firma", "funk", "loesung"];
  tabsEl.querySelectorAll("[data-tab]").forEach((b) => { if (!TABS.includes(b.dataset.tab)) b.remove(); });

  let S = null;              // letzter Stand vom Server
  let offset = 0;            // Serverzeit − lokale Zeit
  let docs = null, watermark = "";
  let firma = null, vPage = "start", partnerHtml = null;
  let tab = TABS.includes(MS.get("ms_tab")) ? MS.get("ms_tab") : TABS[0];
  let openDoc = null;        // Index des offenen Dokuments (0 ist gültig!)
  let lastDocId = MS.get("ms_doc");   // zuletzt geöffnetes Dokument – beim Zurückkommen wieder dort
  let vLogin = { u: "", p: "" };      // Eingaben im Partner-Login bleiben stehen
  let aria = null, ariaDraft = "", ariaPw = "", ariaBusy = false, ariaMsg = "";  // ARIA-Chat (Premium Plus)
  let draft = {};
  let bDraft = {}, bBusy = false, bMsg = "", doneArmed = false, bExpiredPolled = false;   // Zusatzermittlung
  let sonder = null, sDraft = "", sBusy = false;                    // Sonderauftrag (Premium Plus)
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
        root.innerHTML = `<div class="panel center"><p>${MS.esc(e.message)}</p><p style="margin-top:14px"><a class="btn btn-red" href="/spiel/">${t("Neu anmelden", "Join again")}</a></p></div>`;
      }
      return;
    }
    if (S.lang && S.lang !== MS.lang) { MS.setLang(S.lang); lastKey = ""; docs = null; firma = null; }
    $("fallname").textContent = S.fall;
    $("teamname").textContent = VIEWER ? `${S.team} · ${t("Mitlesegerät", "follow-along device")}` : S.team;
    const bk = S.bonus ? [S.bonus.done, ...S.bonus.questions.map((q) => q.status), S.bonus.sonder ? S.bonus.sonder.status : ""].join(",") : "";
    const key = [S.status, S.solved, S.stage, S.check_available, bk].join("|");
    if (S.stage !== lastStage) { if (lastStage !== null) docs = null; lastStage = S.stage; }
    if (key !== lastKey) { lastKey = key; await render(); }
    else if (tab === "funk") renderView();
    if (tab === "firma" && vPage === "aria" && !ariaBusy) loadAria();
    announceHints();
    tick();
    const tb = $("testbar");
    if (tb) tb.hidden = !(S.test && !VIEWER && S.status === "running" && !S.solved);
  }

  // Testrunden: Zeit vorspulen, um Hinweise schnell durchzuprobieren
  async function vorspulen(body) {
    try { const d = await MS.api("POST", "test/vorspulen", body, H); await poll(); alertTest(t(`+${d.minuten} Min. vorgespult`, `+${d.minuten} min fast-forwarded`)); }
    catch (e) { alertTest(e.message); }
  }
  function alertTest(m) { const t = $("testbar"); const s = t.querySelector("span"); s.textContent = m; setTimeout(() => (s.textContent = "TEST"), 3000); }
  if ($("ff-hint")) {
    $("ff-hint").onclick = () => vorspulen({ bis: "hinweis" });
    $("ff-5").onclick = () => vorspulen({ minuten: 5 });
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
    const B = S.bonus;
    if (S.solved && S.status === "running" && B && !B.done && B.ends_at) {
      // Fall gelöst: Die Uhr läuft weiter – als Zeit für die Zusatzermittlung bis zum Ende der Spielzeit
      const left = B.ends_at - now;
      if (left > 0) { const cd = MS.countdown(left); clock.className = "clock" + cd.cls; clock.innerHTML = `<span class="clk"><span class="clk-label">${t("Zeit für Bonusfragen", "Time for bonus questions")}</span>${cd.html}</span>`; }
      else { clock.innerHTML = ""; if (!bExpiredPolled) { bExpiredPolled = true; setTimeout(poll, 1500); } }
    } else if (!running() || !S.started_at) { clock.innerHTML = ""; }
    else {
      const left = S.started_at + S.duration_min * 60000 - now;
      const pen = S.penalty_min ? `<span class="pen" title="${t("Strafzeit", "Penalty time")}">+${S.penalty_min} ${t("Min.", "min")}</span>` : "";
      const cd = MS.countdown(left);
      clock.className = "clock" + cd.cls;
      clock.innerHTML = `<span class="clk"><span class="clk-label">${left > 0 ? (S.ui ? S.ui.clockIn : t("Übergabe in", "Handover in")) : (S.ui ? S.ui.clockLate : t("Übergabe verpasst", "Handover missed"))}</span>${cd.html}${pen}</span>`;
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
    const txt = fresh.length === 1 ? t(`Neuer Funkspruch der Zentrale · ${fresh[0].label}`, `New radio message from HQ · ${fresh[0].label}`) : t(`${fresh.length} neue Funksprüche der Zentrale`, `${fresh.length} new radio messages from HQ`);
    toastEl.innerHTML = `<button type="button"><span class="led"></span><span>${txt}</span><b>${t("Anhören →", "Listen →")}</b></button>`;
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

  // Zähler am Reiter „Akte“: ungelesene Beweisstücke (wie bei Solo und Friends)
  function akteBadge() {
    const b = $("aktebadge"); if (!b) return;
    const n = running() && docs ? docs.filter((d) => !seen.has(d.id)).length : 0;
    b.hidden = !n; b.textContent = n;
  }
  // Texte je Fall (Fall 002 …): S.ui überschreibt die Standardtexte von Fall 001
  const U = (k, de, en) => (S && S.ui && S.ui[k] != null ? S.ui[k] : t(de, en));
  function renderView() {
    akteBadge();
    const wt = tabsEl.querySelector('[data-tab="firma"]'); if (wt && S && S.ui && S.ui.webBadge) wt.textContent = S.ui.webBadge;
    if (S.status === "finished") return viewFinal();
    if (S.solved) return viewSolved();
    if (S.status === "created" || S.status === "open") return viewWaiting();
    for (const b of tabsEl.querySelectorAll("[data-tab]")) b.setAttribute("aria-selected", String(b.dataset.tab === tab));
    if (tab === "einsatz") return viewEinsatz();
    if (tab === "akte") return openDoc !== null ? viewDoc() : viewAkte();
    if (tab === "firma") return viewFirma();
    if (tab === "funk") return viewFunk();
    if (tab === "loesung") return viewLoesung();
  }

  // ---------- Vor und nach dem Spiel ----------
  function viewWaiting() {
    root.innerHTML = `<div class="panel center waiting">
      <div class="eyebrow">${t("Team angemeldet", "Team registered")}</div>
      <h1>${MS.esc(S.team)}</h1>
      <p>${VIEWER ? t("Dieses Gerät liest bei eurem Team mit. Sobald der Fall startet, erscheint hier die Akte.", "This device follows along with your team. As soon as the case starts, the case file appears here.") : t("Ihr seid startklar. Sobald euer Organisator den Fall startet, öffnet sich hier euer Einsatzbefehl – bei allen Teams gleichzeitig.", "You're ready to go. As soon as your organiser starts the case, your briefing opens here – for all teams at the same time.")}</p>
      <div class="spinner" aria-hidden="true"></div>
      <h3>${t("Angemeldete Teams", "Registered teams")}</h3>
      <ul class="teamlist">${S.ranking.map((r) => `<li>${MS.esc(r.name)}${r.name === S.team ? ` <span>(${t("ihr", "you")})</span>` : ""}</li>`).join("")}</ul>
      <p class="small">${t("Fair Play: Keine KI und keine Suchmaschinen – der Fall ist mit Köpfchen lösbar.", "Fair play: no AI and no search engines – the case can be solved with brainpower alone.")}</p>
    </div>`;
  }

  // Auszeichnung für gelösten Sonderauftrag (zählt nicht in die Zeit)
  const SB = (r) => r.sonder ? ` <span class="sbadge" title="${t("Sonderauftrag gelöst", "Special assignment solved")}">🕵 ${t("Sonderermittler", "Special investigators")}</span>` : "";
  // Podest der ersten drei gelösten Teams
  function podium() {
    const top = S.ranking.filter((r) => r.solved).slice(0, 3);
    if (!top.length) return `<p class="nopod">${t("Diesmal hat kein Team den Fall rechtzeitig geknackt. Wer es war, lacht sich ins Fäustchen – noch.", "This time no team cracked the case in time. The culprit is laughing up their sleeve – for now.")}</p>`;
    const order = [top[1], top[0], top[2]];
    return `<div class="podium">${order.map((r, i) => r ? `<div class="pod p${r.rank} ${r.name === S.team ? "me" : ""}">
      <span class="pod-name">${MS.esc(r.name)}${r.sonder ? " 🕵" : ""}</span><span class="pod-time">${MS.dur(r.score_ms)}</span>
      <div class="pod-block"><b>${r.rank}</b></div></div>` : `<div class="pod empty"></div>`).join("")}</div>`;
  }

  function bilanz() {
    const me = S.ranking.find((r) => r.name === S.team) || {};
    const total = S.ranking.length;
    const first = S.status !== "finished"
      ? `<div><b>✓</b><span>${t("gelöst · Platz nach Spielende", "solved · rank after the game")}</span></div>`
      : `<div><b>${me.rank ? (MS.lang === "en" ? `#${me.rank}` : `${me.rank}.`) : "–"}</b><span>${me.rank ? t(`Platz von ${total}`, `of ${total} team${total === 1 ? "" : "s"}`) : t("nicht gelöst", "not solved")}</span></div>`;
    return `<div class="stats">
      ${first}
      <div><b>${S.solved ? MS.dur(S.score_ms) : "–"}</b><span>${t("Wertungszeit", "Score time")}</span></div>
      <div><b>${S.wrong}</b><span>${t("Fehlversuche", "Wrong attempts")}</span></div>
      <div><b>${S.penalty_min}</b><span>${t("Min. Strafzeit", "min penalty")}</span></div>
      ${S.bonus && S.bonus.min ? `<div><b>−${S.bonus.min}</b><span>${t("Min. Bonus", "min bonus")}</span></div>` : ""}
      <div><b>${seen.size}</b><span>${t("Beweisstücke gelesen", "Evidence read")}</span></div>
    </div>`;
  }

  function thanks() {
    return `<section class="thanks">
      <div class="eyebrow">${t("Mordsteam · Abteilung für ungelöste Fälle", "Mordsteam · Cold Case Unit")}</div>
      <h2>${t("Danke fürs Ermitteln!", "Thanks for investigating!")}</h2>
      <p>${t("Die Akte ist geschlossen – aber das Verbrechen schläft nie. Wir hoffen, euch bald wiederzusehen, Detektive: Der nächste Fall liegt schon auf dem Schreibtisch.", "The file is closed – but crime never sleeps. We hope to see you again soon, detectives: the next case is already on the desk.")}</p>
      <div class="next-case"><span class="conf">${t("Akte 002", "File 002")}</span><div><b>${t("In Ermittlung", "Under investigation")}</b><span>${t("Neuer Fall, neue Verdächtige – vielleicht diesmal jemand von euch.", "New case, new suspects – maybe one of you this time.")}</span></div></div>
      <div class="actions-row">${S.solved && !VIEWER ? `<a class="btn btn-red" href="/spiel/urkunde.html">${t("Urkunde herunterladen", "Download certificate")}</a>` : ""}<a class="btn btn-ghost" href="https://mordsteam.com${MS.lang === "en" ? "/en/" : ""}" target="_blank" rel="noopener">${t("Weitere Fälle auf mordsteam.com", "More cases at mordsteam.com")}</a></div>
    </section>`;
  }

  // ---------- Spieler-Feedback (jedes Gerät einmal, ohne Namen) ----------
  function playerFb() {
    if (S.feedback_done) return "";
    const ch = (key, list) => `<div class="chips-row">${list.map(([v, l]) => `<button type="button" class="chipbtn" data-${key}="${v}">${l}</button>`).join("")}</div>`;
    return `<section class="paper so-fb" id="pfb">
      <div class="eyebrow">${t("Euer Feedback", "Your feedback")}</div><h2 class="h2p">${t("Wie war der Fall?", "How was the case?")}</h2>
      <p class="muted">${t("30 Sekunden, anonym – und ihr helft uns, noch bessere Fälle zu bauen.", "30 seconds, anonymous – and you help us build even better cases.")}</p>
      <div class="stars" role="radiogroup" aria-label="${t("Sterne", "Stars")}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${n}/5">★</button>`).join("")}</div>
      <div class="field"><span class="label">${t("Wie schwer war der Fall?", "How hard was the case?")}</span>${ch("diff", [["zu leicht", t("zu leicht", "too easy")], ["genau richtig", t("genau richtig", "just right")], ["zu schwer", t("zu schwer", "too hard")]])}</div>
      <div class="field"><label for="pfbest">${t("Die beste Stelle?", "The best moment?")} <span class="opt">${t("optional", "optional")}</span></label><textarea id="pfbest" maxlength="800" rows="2"></textarea></div>
      <div class="field"><label for="pfimp">${t("Was hat genervt oder sollen wir besser machen?", "What annoyed you or what should we improve?")} <span class="opt">${t("optional, nur für uns", "optional, just for us")}</span></label><textarea id="pfimp" maxlength="1500" rows="2"></textarea></div>
      <div class="fbpub"><div class="field"><label for="pfrev">${t("Ein paar Worte für andere Teams?", "A few words for other teams?")}</label><span class="hint">${t("Über ein nettes Feedback freuen wir uns besonders. Optional.", "We especially love a kind word. Optional.")}</span><textarea id="pfrev" maxlength="600" rows="3"></textarea></div>
      <div class="field"><span class="label">${t("Dürfen wir deine Worte auf mordsteam.com zeigen?", "May we show your words on mordsteam.com?")}</span>
        <label class="check"><input type="radio" name="ppub" value="name"><span>${t("Ja, mit Vornamen", "Yes, with my first name")}</span></label>
        <input id="pfname" maxlength="30" placeholder="${t("z. B. Julia oder Julia B.", "e.g. Julia or Julia B.")}" hidden style="margin:4px 0 8px">
        <label class="check"><input type="radio" name="ppub" value="anon"><span>${t("Ja, aber anonym", "Yes, but anonymously")}</span></label>
        <label class="check"><input type="radio" name="ppub" value="no" checked><span>${t("Nein, nur für euch", "No, just for you")}</span></label></div></div>
      <p class="err" id="pferr" hidden></p><button type="button" class="btn btn-red" id="pfsend">${t("Feedback senden", "Send feedback")}</button>
    </section>`;
  }
  function bindPlayerFb() {
    const box = $("pfb");
    if (!box) return;
    const pick = {};
    box.querySelectorAll("[data-star],[data-diff]").forEach((b) => (b.onclick = () => {
      const key = b.dataset.star !== undefined ? "star" : "diff";
      pick[key] = b.dataset[key];
      if (key === "star") box.querySelectorAll("[data-star]").forEach((x) => x.classList.toggle("on", Number(x.dataset.star) <= Number(pick.star)));
      else box.querySelectorAll("[data-diff]").forEach((x) => x.classList.toggle("on", x === b));
    }));
    box.querySelectorAll("input[name=ppub]").forEach((r) => (r.onchange = () => { $("pfname").hidden = r.value !== "name" || !r.checked; }));
    $("pfsend").onclick = async () => {
      const err = $("pferr");
      if (!pick.star) { err.textContent = t("Bitte wähle 1 bis 5 Sterne.", "Please choose 1 to 5 stars."); err.hidden = false; return; }
      const pub = (box.querySelector("input[name=ppub]:checked") || {}).value || "no";
      $("pfsend").disabled = true;
      try {
        await MS.api("POST", "feedback", { rating: Number(pick.star), difficulty: pick.diff || "", best: $("pfbest").value, improve: $("pfimp").value, review: $("pfrev").value, publish: pub, publish_name: $("pfname").value }, H);
        S.feedback_done = true;
        box.innerHTML = `<div class="eyebrow">${t("Euer Feedback", "Your feedback")}</div><h2 class="h2p">${t("Danke!", "Thank you!")}</h2><p class="muted">${t("Euer Feedback ist angekommen.", "Your feedback has arrived.")}</p>`;
      } catch (e) { err.textContent = e.message; err.hidden = false; $("pfsend").disabled = false; }
    };
  }

  function viewFinal() {
    const A = S.aufloesung;
    root.innerHTML = `<div class="final">
      <section class="paper final-head">
        <div class="bigstamp ${S.solved ? "" : "grey"}"><div><small>MORDSTEAM · ${U("akte", "Akte 001", "File 001").toUpperCase()}</small><strong>${S.solved ? t("FALL GELÖST", "CASE SOLVED") : t("AKTE GESCHLOSSEN", "FILE CLOSED")}</strong><small>${MS.esc(/^team\b/i.test(S.team) ? S.team : "Team " + S.team).toUpperCase()}</small></div></div>
        <h1>${S.solved ? t("Stark ermittelt!", "Great detective work!") : t("Die Zeit ist um.", "Time's up.")}</h1>
        <p class="lead">${S.ui ? MS.esc(S.solved ? (S.plus ? S.ui.leadPlus : S.premium ? S.ui.leadPremium : S.ui.leadBasic) : S.ui.leadFail) : S.solved ? (S.plus ? t(`Täter überführt, Mitwisser enttarnt, Schließfach geknackt – ${MS.esc(S.boss || "die Chefetage")} bekommt die ganze Wahrheit.`, `Culprit convicted, accomplice exposed, locker cracked – ${MS.esc(S.boss || "the top floor")} gets the whole truth.`) : S.premium ? t(`Täter überführt, Mitwisser enttarnt, Geld gefunden – ${MS.esc(S.boss || "die Chefetage")} bekommt die ganze Wahrheit.`, `Culprit convicted, accomplice exposed, money found – ${MS.esc(S.boss || "the top floor")} gets the whole truth.`) : t(`Ihr habt den Fall gelöst, bevor die Mappe bei ${MS.esc(S.boss || "der Chefetage")} sein musste.`, `You solved the case before the folder was due with ${MS.esc(S.boss || "the top floor")}.`)) : t(`${MS.esc(S.boss || "Die Chefetage")} wartet vergeblich auf die Mappe. Aber jetzt erfahrt ihr, wer es wirklich war.`, `${MS.esc(S.boss || "The top floor")} waits in vain for the folder. But now you'll find out who really did it.`)}</p>
        ${bilanz()}
      </section>
      <section class="paper">
        <div class="eyebrow">${t("Siegerehrung", "Award ceremony")}</div><h2 class="h2p">${t("Das Podest", "The podium")}</h2>
        ${podium()}
        ${rankTable()}
        <p class="small" style="margin-top:10px">${t("Wertung = Spielzeit bis zur Lösung plus Strafzeit, minus Bonusminuten aus der Zusatzermittlung.", "Score = playing time until solved plus penalty time, minus bonus minutes from the bonus investigation.")}</p>
      </section>
      ${A ? `<section class="paper reveal">
        <div class="eyebrow">${t("Die Auflösung", "The solution")}</div><h2 class="h2p">${t("Was wirklich geschah", "What really happened")}</h2>
        <div id="revealbox"><p class="muted">${t("Wartet mit dem Aufdecken, bis euer Organisator so weit ist.", "Wait with the reveal until your organiser is ready.")}</p>
        <button type="button" class="btn btn-ink btn-big" id="reveal">${t("Umschlag öffnen", "Open the envelope")}</button></div>
      </section>` : ""}
      ${playerFb()}
      ${thanks()}
    </div>`;
    bindPlayerFb();
    const r = $("reveal");
    if (r) r.onclick = () => {
      $("revealbox").innerHTML = `<div class="answers">${A.answers.map((a, i) => `<div><i>${pad(i + 1)}</i><span>${a.label}</span><b>${MS.esc(a.answer)}${a.detail ? ` · ${MS.esc(a.detail)}` : ""}</b></div>`).join("")}
</div>${(A.extra || []).map((a, i) => `${a.section ? `<p class="eyebrow" style="margin-top:18px">${MS.esc(a.section)}</p>` : ""}<div class="answers"><div><i>${a.key === "s_ziel" ? "★" : "+" + (i + 1)}</i><span>${a.label}</span><b>${MS.esc(a.answer)}${a.detail ? ` · ${MS.esc(a.detail)}` : ""}</b></div></div>`).join("")}
        <p class="story">${A.story}</p>${A.story2 ? `<p class="story" style="margin-top:14px">${A.story2}</p>` : ""}${A.story3 ? `<p class="story" style="margin-top:14px">${A.story3}</p>` : ""}`;
    };
  }

  function viewSolved() {
    root.innerHTML = `<div class="final">
      <section class="paper final-head">
        <div class="bigstamp"><div><small>MORDSTEAM · ${U("akte", "Akte 001", "File 001").toUpperCase()}</small><strong>${t("FALL GELÖST", "CASE SOLVED")}</strong><small>${MS.esc(/^team\b/i.test(S.team) ? S.team : "Team " + S.team).toUpperCase()}</small></div></div>
        <h1>${t("Stark ermittelt!", "Great detective work!")}</h1>
        <p class="lead">${t("Gelöst in", "Solved in")} <b>${MS.dur(S.score_ms)}</b>${S.penalty_min ? t(` (inkl. ${S.penalty_min} Min. Strafzeit)`, ` (incl. ${S.penalty_min} min penalty)`) : ""}.</p>
        <p class="muted">${t("Pssst – bitte nichts verraten, vielleicht ermitteln die anderen noch. Wer gewonnen hat, zeigt die Siegerehrung: Sie erscheint hier mit der Auflösung, sobald euer Organisator die Runde beendet.", "Shh – please don't give anything away, the others may still be investigating. The award ceremony shows who won: it appears here with the solution as soon as your organiser ends the round.")}</p>
        ${bilanz()}
        ${VIEWER ? "" : `<a class="btn btn-red" href="/spiel/urkunde.html">${t("Urkunde herunterladen", "Download certificate")}</a>`}
      </section>
      ${bonusHtml()}
    </div>`;
    bindBonus();
  }

  // Auswahlliste der Verdächtigen (Buchstabe – Name) statt Tippfeld
  const hasSus = () => Array.isArray(S.suspects) && S.suspects.length > 0;
  // byName: Wert ist der Name (Komplizen-Frage), sonst der Buchstabe
  function susSelect(id, attr, key, val, byName = false) {
    return `<select id="${id}" ${attr}="${key}"><option value="">${t("Person wählen …", "Choose a person …")}</option>${S.suspects.map((p) => { const v = byName ? p[1] : p[0]; return `<option value="${v}" ${val && (val === v || MS.esc(val) === v) ? "selected" : ""}>${p[0]} – ${p[1]}</option>`; }).join("")}</select>`;
  }

  // ---------- Zusatzermittlung (alle Pakete) und Sonderauftrag (Premium Plus) ----------
  // Was in der Zusatzermittlung noch offen ist (für die Warnung vor dem Abschließen)
  function openItems() {
    const B = S.bonus; if (!B) return [];
    const out = B.sonder && B.sonder.status === "open" ? [t("Sonderauftrag", "special assignment")] : [];
    B.questions.forEach((q, i) => { if (q.status === "open") out.push(t(`Bonusfrage ${i + 1}`, `bonus question ${i + 1}`)); });
    return out;
  }
  function bonusHtml() {
    const B = S.bonus;
    if (!B) return "";
    const res = (q) => q.status === "ok" ? `<p class="bres y">✓ ${t("Richtig", "Correct")} – −${B.per} ${t("Min.", "min")}</p>`
      : `<p class="bres n">✗ ${t("Leider falsch", "Sorry, wrong")} (${t("richtig", "correct")}: ${MS.esc(q.solution || "")})</p>`;
    const qs = B.questions.map((q, i) => `<div class="qrow"><span class="qn">${i + 1}</span><div class="qf">
        <label for="b_${q.key}">${q.label}</label><span class="hint">${MS.esc(q.hint)}</span>
        ${q.status === "open" && !B.done && !VIEWER ? `<div class="brow">${q.pattern === "letter" && hasSus() ? susSelect(`b_${q.key}`, "data-b", q.key, bDraft[q.key] || "")
            : q.pattern === "letters" && hasSus() ? `<span class="bpair">${susSelect(`b_${q.key}`, "data-bpart", q.key, (bDraft[q.key] || "").split(" ")[0] || "")}${susSelect(`b_${q.key}_2`, "data-bpart", q.key, (bDraft[q.key] || "").split(" ")[1] || "")}</span>`
            : `<input id="b_${q.key}" data-b="${q.key}" autocomplete="off" spellcheck="false" value="${MS.esc(bDraft[q.key] || "")}">`}<button type="button" class="btn btn-line" data-bsend="${q.key}">${t("Antworten", "Answer")}</button></div>`
          : q.status === "open" ? `<p class="bres">${t("nicht beantwortet", "not answered")}</p>` : `<p class="bans">${MS.esc(q.answer || "")}</p>${res(q)}`}
      </div></div>`).join("");
    const sd = B.sonder;
    // Texte des Sonderauftrags und Funksprüche kommen vom Server bereits escaped (render) – nicht doppelt escapen (Go-live-Test 4)
    const sonderPart = sd ? `<section class="report paper sonder">
        <div class="eyebrow">${t("Überraschung · nur für schnelle Teams", "Surprise · fast teams only")}</div>
        <div class="verdict good">${sd.surprise}</div>
        <h2>${t("Sonderauftrag", "Special assignment")}</h2>
        <p class="muted">${sd.task} ${t(`Ihr habt ${sd.max} Fragen. Richtig gelöst gibt es die Auszeichnung „Sonderermittler“ in der Rangliste – an eurer Zeit ändert es nichts. Nur ein Versuch.`, `You have ${sd.max} questions. Solve it and you earn the “Special investigators” award in the ranking – it doesn’t change your time. One attempt only.`)}</p>
        <div class="aria-log" id="slog">${sonderLog()}</div>
        ${sd.status === "open" && !B.done && !VIEWER ? `<form class="aria-form" id="sform"><textarea id="sin" rows="2" maxlength="300" placeholder="${t("Frage an die verhörte Person …", "Question for the person being interrogated …")}">${MS.esc(sDraft)}</textarea><button type="submit" class="v-btn" ${sBusy ? "disabled" : ""}>${t("Fragen", "Ask")}</button></form>
          <p class="aria-meta" id="smeta">${sonder ? `${sonder.used} / ${sonder.max} ${t("Fragen", "questions")} · ` : ""}${t("Die verhörte Person wird von einer KI gespielt.", "The person is played by an AI.")}</p>
          <div class="qrow"><span class="qn">★</span><div class="qf"><label for="s_ziel">${sd.label}</label>
          <div class="brow"><select id="s_ziel"><option value="">${t("Ziel wählen …", "Choose a destination …")}</option>${sd.options.map((o) => `<option value="${o[0]}">${MS.esc(o[1])}</option>`).join("")}</select><button type="button" class="btn btn-line" id="ssend">${t("Antworten", "Answer")}</button></div></div></div>`
          : sd.status === "open" ? "" : `<p class="bans">${MS.esc(sd.answer || "")}</p>${sd.status === "ok" ? `<p class="bres y">✓ ${t("Richtig", "Correct")} – 🕵 ${t("Sonderermittler", "Special investigators")}</p>` : `<p class="bres n">✗ ${t("Leider falsch", "Sorry, wrong")} (${t("richtig", "correct")}: ${MS.esc(sd.solution || "")})</p>`}`}
      </section>` : "";
    return `${sonderPart}<section class="report paper bonus">
        <div class="eyebrow">${t("Zusatzermittlung", "Bonus investigation")}</div>
        <h2>${t("Noch Zeit? Holt euch Bonusminuten!", "Time left? Earn bonus minutes!")}</h2>
        <p class="muted">${t(`Drei Fragen aus eurer Akte – jede hat genau einen Versuch. Jede richtige Antwort zieht ${B.per} Minuten von eurer Wertung ab. Am Lösen ändert das nichts, nur an der Rangliste. Die Zusatzermittlung bekommt jedes Team, das vor Spielende löst.`, `Three questions from your file – each has exactly one attempt. Every correct answer takes ${B.per} minutes off your score. It doesn't affect solving, only the ranking. Every team that solves before the end gets the bonus investigation.`)}${B.min ? ` <b>${t(`Bisher: −${B.min} Min.`, `So far: −${B.min} min.`)}</b>` : ""}</p>
        ${B.sonder_missed ? `<p class="small">${t("Teams, die Premium Plus vor Minute 70 komplett lösen, bekommen hier eine Überraschung.", "Teams who solve Premium Plus completely before minute 70 get a surprise here.")}</p>` : ""}
        ${B.expired && !B.questions.some((q) => q.status !== "open") ? `<p class="bres">${t("Für die Zusatzermittlung ist keine Zeit mehr – die Spielzeit ist abgelaufen.", "There's no time left for the bonus investigation – the game time is up.")}</p>` : qs}
        <p class="err" id="bmsg" role="alert">${MS.esc(bMsg)}</p>
        ${B.done ? `<p class="bres y">${B.expired ? t("Die Spielzeit ist abgelaufen, die Ermittlung ist geschlossen.", "Time is up, the investigation is closed.") + " " : ""}${t("Die Auflösung kommt, sobald alle Teams fertig sind oder euer Organisator die Runde beendet.", "The solution appears once all teams are done or your organiser ends the round.")}</p>`
          : VIEWER ? "" : `${doneArmed && openItems().length ? `<p class="warnbox">${t("Noch offen", "Still open")}: ${openItems().join(", ")}. ${t("Trotzdem abschließen? Danach sind keine Antworten mehr möglich.", "Close anyway? No more answers are possible afterwards.")}</p>` : ""}<button type="button" class="btn ${doneArmed ? "btn-ink" : "btn-line"}" id="bdone">${doneArmed ? t("Ja, Ermittlung abschließen", "Yes, close the investigation") : t("Ermittlung abschließen", "Close the investigation")}</button>`}
      </section>`;
  }
  function sonderLog() {
    const m = (sonder ? sonder.msgs : []).map((x) => `<div class="aria-b ${x.role === "user" ? "me" : "bot"}">${nl2br(x.text)}${x.nc ? `<small class="nc"> · ${t("nicht gezählt", "not counted")}</small>` : ""}</div>`).join("")
      + (sonder && sonder.tip ? `<div class="aria-tip">${sonder.tip}</div>` : "");
    return (m || `<p class="aria-empty">${t("Noch keine Fragen gestellt.", "No questions asked yet.")}</p>`) + (sBusy ? `<div class="aria-b bot typing"><span></span><span></span><span></span></div>` : "");
  }
  async function loadSonder() {
    if (!S || !S.bonus || !S.bonus.sonder) return;
    try { sonder = await MS.api("GET", "sonder", null, H); } catch { return; }
    const l = $("slog"); if (l) { l.innerHTML = sonderLog(); l.scrollTop = l.scrollHeight; }
    const m = $("smeta"); if (m && sonder) m.firstChild && (m.innerHTML = `${sonder.used} / ${sonder.max} ${t("Fragen", "questions")} · ${t("Die verhörte Person wird von einer KI gespielt.", "The person is played by an AI.")}`);
  }
  function bindBonus() {
    if (!S.bonus) return;
    root.querySelectorAll("[data-b]").forEach((inp) => { inp.oninput = () => (bDraft[inp.dataset.b] = inp.value); });
    const bparts = (k) => [...root.querySelectorAll(`[data-bpart="${k}"]`)].map((x) => x.value);
    root.querySelectorAll("[data-bpart]").forEach((sel) => { sel.oninput = () => (bDraft[sel.dataset.bpart] = bparts(sel.dataset.bpart).join(" ")); });
    root.querySelectorAll("[data-bsend]").forEach((b) => (b.onclick = () => {
      const k = b.dataset.bsend, parts = bparts(k);
      if (parts.length) {
        if (parts.some((x) => !x)) { bMsg = t("Bitte zwei Personen wählen.", "Please choose two people."); return viewSolved(); }
        if (parts[0] === parts[1]) { bMsg = t("Bitte zwei verschiedene Personen wählen.", "Please choose two different people."); return viewSolved(); }
        return bonusSend(k, parts.join(" "));
      }
      bonusSend(k, (root.querySelector(`[data-b="${k}"]`) || {}).value || "");
    }));
    const ss = $("ssend"); if (ss) ss.onclick = () => bonusSend("s_ziel", $("s_ziel").value);
    const bd = $("bdone");
    if (bd) bd.onclick = async () => {
      if (!doneArmed) { doneArmed = true; return viewSolved(); }
      doneArmed = false;
      try { await MS.api("POST", "bonus/fertig", {}, H); } catch (e) { bMsg = e.message; }
      lastKey = ""; await poll();
    };
    const f = $("sform"), ta = $("sin");
    if (f) {
      ta.oninput = () => (sDraft = ta.value);
      ta.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); f.requestSubmit(); } };
      f.onsubmit = async (e) => {
        e.preventDefault();
        const text = ta.value.trim();
        if (!text || sBusy) return;
        sBusy = true; sDraft = ""; ta.value = "";
        sonder = sonder || { msgs: [], used: 0, max: S.bonus.sonder.max };
        sonder.msgs.push({ role: "user", text }); $("slog").innerHTML = sonderLog();
        try { await MS.api("POST", "sonder/chat", { text }, H); } catch (err) { sonder.msgs.push({ role: "assistant", text: err.message }); }
        sBusy = false; await loadSonder();
      };
    }
    if (S.bonus.sonder && !sonder) loadSonder(); else { const l = $("slog"); if (l) l.scrollTop = l.scrollHeight; }
  }
  async function bonusSend(key, value) {
    if (bBusy) return;
    if (!String(value).trim()) { bMsg = t("Bitte zuerst eine Antwort eingeben.", "Please enter an answer first."); return viewSolved(); }
    bBusy = true; bMsg = "";
    try { await MS.api("POST", "bonus", { key, value }, H); delete bDraft[key]; } catch (e) { bMsg = e.message; }
    bBusy = false; lastKey = ""; await poll();
  }

  // ---------- Einsatz: Regeln in einer Minute ----------
  function viewEinsatz() {
    const n = docs.length;
    root.innerHTML = `<section class="brief"><div class="paper">
      <div class="brief-top"><span class="eyebrow">${t("Einsatzbefehl", "Briefing")} · ${U("akte", "Akte 001", "File 001")}</span><span class="conf">${t("Streng vertraulich", "Strictly confidential")}</span></div>
      <h1>${U("briefH1", "Ein Giftanschlag.<br>Eine rote Mappe.<br><em>Einer von euch.</em>", "A poisoning.<br>A red folder.<br><em>One of you.</em>")}</h1>
      <p class="sub">${S.intro} ${t("Die Uhr oben läuft bereits.", "The clock at the top is already running.")}</p>
      <ol class="steps">
        <li><span class="n">1</span><div><b>${t("Akte lesen", "Read the file")}</b><span>${t(`${n} Beweisstücke. Teilt sie untereinander auf und redet miteinander.`, `${n} pieces of evidence. Split them up and talk to each other.`)}</span></div></li>
        <li><span class="n">2</span><div><b>${S.ui ? S.ui.step2[0] : t("Intranet durchforsten", "Search the intranet")}</b><span>${S.ui ? S.ui.step2[1] : t("Euer eigenes Intranet verrät mehr, als es sollte.", "Your own intranet gives away more than it should.")}</span></div></li>
        <li><span class="n">3</span><div><b>${t("Vier Antworten, ein Versuch", "Four answers, one attempt")}</b><span>${t(`Geprüft wird alles auf einmal. Jeder Fehlversuch kostet ${S.rules.wrong} Minuten Strafzeit.`, `Everything is checked at once. Every wrong attempt costs ${S.rules.wrong} minutes of penalty time.`)}</span></div></li>
        <li><span class="n">4</span><div><b>${t("Funk der Zentrale", "Radio from HQ")}</b><span>${t("Hängt ihr fest, meldet sich die Zentrale von selbst – für alle Teams gleichzeitig, ohne Strafzeit.", "If you get stuck, HQ gets in touch by itself – for all teams at the same time, without penalty.")}</span></div></li>
        <li><span class="n">5</span><div><b>Fair Play</b><span>${t("Keine KI von außen, keine Suchmaschine. Nur ihr und die Akte.", "No outside AI, no search engine. Just you and the file.")}</span></div></li>
        ${S.plus ? `<li class="prem"><span class="n">6</span><div><b>${t("Zwei Akte und ein Finale", "Two acts and a finale")}</b><span>${U("planPlus", "Nach Akt 1 schickt die Zentrale neue Beweisstücke. Im Finale wird ARIA freigeschaltet, die KI-Assistenz eures Intranets.", "After act 1, HQ sends new evidence. In the finale, ARIA – your intranet's AI assistant – is unlocked.")}</span></div></li>`
          : S.premium ? `<li class="prem"><span class="n">6</span><div><b>${t("Zwei Akte", "Two acts")}</b><span>${t("Nach Akt 1 schickt die Zentrale neue Beweisstücke.", "After act 1, HQ sends new evidence.")}</span></div></li>` : ""}
      </ol>
      <h2 class="qhead">${t("Eure vier Fragen", "Your four questions")}${S.premium ? t(" in Akt 1", " in act 1") : ""}</h2>
      <div class="qcards">${S.questions_act1.map((l, i) => `<div><i>${pad(i + 1)}</i><span>${l}</span></div>`).join("")}</div>
      <button type="button" class="btn btn-red btn-big" id="toAkte">${t("Akte öffnen →", "Open the file →")}</button>
      <div class="more-devices">
        <div class="qr" id="qr" aria-label="${t("QR-Code für Mitlesegeräte", "QR code for follow-along devices")}"></div>
        <div><b>${t("Ihr wollt mehr Geräte verwenden?", "Want to use more devices?")}</b>
          <p>${t(`Scannt den Code mit weiteren Handys oder Laptops eures Teams (bis zu ${S.max_viewers} Geräte, verbunden: ${S.viewers}). Dort seht ihr Akte, ${U("webBadge", "Intranet", "Intranet")} und Funk – so könnt ihr euch die Beweisstücke aufteilen.`, `Scan the code with more phones or laptops in your team (up to ${S.max_viewers} devices, connected: ${S.viewers}). They show the file, ${U("webBadge", "intranet", "intranet").toLowerCase()} and radio – so you can split up the evidence.`)}</p>
          <p class="small"><b>${t("Lösungen gebt ihr nur hier auf diesem Gerät ein.", "Answers are entered only here on this device.")}</b></p>
          <button type="button" class="btn btn-line" id="copyLink">${t("Link kopieren", "Copy link")}</button> <span class="small" id="copied"></span></div>
      </div>
    </div></section>`;
    $("toAkte").onclick = () => go("akte");
    const link = `${location.origin}/spiel/fall?mit=${S.view_token}`;
    try { const q = qrcode(0, "M"); q.addData(link); q.make(); $("qr").innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { $("qr").remove(); }
    $("copyLink").onclick = async () => {
      try { await navigator.clipboard.writeText(link); $("copied").textContent = t("Kopiert.", "Copied."); } catch { $("copied").textContent = link; }
    };
  }

  // ---------- Akte ----------
  const kindClass = (d) => ({ Presse: "k-press", Notiz: "k-note", Beleg: "k-receipt", Belege: "k-receipt", Nachweise: "k-receipt", "E-Mail": "k-mail", Systemauszug: "k-sys" })[d.kk || d.kind] || "";
  const ROT = [-1.4, 0.9, -0.5, 1.2, -1, 0.6, -0.2, 1.4];

  function viewAkte() {
    const read = docs.filter((d) => seen.has(d.id)).length;
    root.innerHTML = `${VIEWER ? `<p class="viewer-note">${t("Mitlesegerät · Lösungen gibt euer Team am Hauptgerät ein.", "Follow-along device · your team enters answers on the main device.")}</p>` : ""}<div class="deskhead"><h2>${t("Fallakte", "Case file")}</h2><span>${read} / ${docs.length} ${t("gelesen", "read")}</span></div>
      <div class="evid">${docs.map((d, i) => `${d.act >= 2 && (i === 0 || docs[i - 1].act !== d.act) ? `<div class="actdiv"><span class="conf">${d.act === 3 ? "Finale" : t("Akt 2", "Act 2")}</span><b>${d.act === 3 ? U("actFinal", "Die letzte Notiz", "The last note") : t("Neue Beweisstücke von der Zentrale", "New evidence from HQ")}</b></div>` : ""}<button type="button" class="ev ${kindClass(d)} ${seen.has(d.id) ? "seen" : ""}" data-doc="${i}" style="--r:${ROT[i % ROT.length]}deg">
        <span class="ev-nr">${t("Nr.", "No.")} ${pad(i + 1)}</span><span class="kind">${MS.esc(d.kind)}</span><span class="ttl">${d.title}</span>${seen.has(d.id) ? `<span class="gel">${t("Gelesen", "Read")}</span>` : `<span class="gel neu">${t("Neu", "New")}</span>`}</button>`).join("")}</div>`;
    root.querySelectorAll("[data-doc]").forEach((b) => (b.onclick = () => { openDoc = Number(b.dataset.doc); renderView(); scrollTo(0, 0); }));
  }

  function wrapTables(sel) {
    root.querySelectorAll(sel).forEach((t) => { const w = document.createElement("div"); w.className = "tablewrap"; t.before(w); w.append(t); });
  }

  function viewDoc() {
    const d = docs[openDoc];
    if (!d) { openDoc = null; return viewAkte(); }
    seen.add(d.id); MS.set("ms_seen", JSON.stringify([...seen])); akteBadge();
    lastDocId = d.id; MS.set("ms_doc", d.id);
    const prev = openDoc > 0 ? openDoc - 1 : null, next = openDoc < docs.length - 1 ? openDoc + 1 : null;
    const pbtn = (i, dir) => `<button type="button" data-go="${i}" class="${dir}"><small>${dir === "prev" ? `← ${t("Nr.", "No.")} ` + pad(i + 1) : `${t("Nr.", "No.")} ` + pad(i + 1) + " →"}</small>${docs[i].title}</button>`;
    root.innerHTML = `<div class="docbar"><button type="button" class="back" id="back">${t("← Alle Beweisstücke", "← All evidence")}</button><span class="docpos">${t("Nr.", "No.")} ${pad(openDoc + 1)} / ${docs.length} · ${MS.esc(d.kind)}</span></div>
      <article class="doc" data-wm="${MS.esc((watermark + "   ").repeat(40))}"><div class="doc-inner">${d.html}</div></article>
      <div class="pager three">${prev !== null ? pbtn(prev, "prev") : "<span></span>"}<div class="cur"><small>${t("Nr.", "No.")} ${pad(openDoc + 1)}</small>${d.title}</div>${next !== null ? pbtn(next, "next") : "<span></span>"}</div>`;
    wrapTables(".doc table");
    $("back").onclick = () => { openDoc = null; lastDocId = null; MS.del("ms_doc"); renderView(); };
    root.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { openDoc = Number(b.dataset.go); renderView(); scrollTo(0, 0); }));
  }

  // ---------- Intranet im Browserfenster ----------
  function viewFirma() {
    const nav = firma.pages.map((p) => [p.id, p.title]);
    let body;
    if (vPage === "login") {
      body = partnerHtml ? partnerHtml : `<h2>${MS.esc(firma.login_label)}</h2><p class="v-lead">${t("Geschützter Bereich. Bitte anmelden.", "Protected area. Please log in.")}</p>
        <form id="vlogin" class="v-login">
          <label for="vu">${t("Benutzer", "User")}</label><input id="vu" autocomplete="off" autocapitalize="none" spellcheck="false" value="${MS.esc(vLogin.u)}">
          <label for="vp">${t("Passwort", "Password")}</label><input id="vp" autocomplete="off" autocapitalize="none" spellcheck="false" value="${MS.esc(vLogin.p)}">
          <button type="submit" class="v-btn">${t("Anmelden", "Log in")}</button>
          <p class="err" id="vmsg" role="alert"></p>
        </form>`;
    } else if (vPage === "aria") body = ariaHtml();
    else body = (firma.pages.find((p) => p.id === vPage) || firma.pages[0]).html;
    const path = vPage === "start" ? "" : vPage === "login" ? U("loginPath", "freigaben", "approvals") : vPage === "aria" ? U("ariaPath", "aria", "aria") : vPage;
    const initials = firma.name.split(/\s+/).filter((w) => /^[A-Za-zÄÖÜäöü]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "IN";
    root.innerHTML = `<div class="browser">
      <div class="b-top"><span class="b-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <div class="b-url"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><b>${MS.esc(firma.domain)}</b><span class="path">/${path}</span></div></div>
      <div class="v-site"><nav class="v-nav"><span class="v-logo">${firma.logo && /^data:image\/(png|jpeg|webp);base64,/.test(firma.logo) ? `<img class="v-img" src="${MS.esc(firma.logo)}" alt="${MS.esc(firma.name)}">` : `<span class="v-mark v-initials">${MS.esc(initials)}</span>${MS.esc(firma.name)}`}<b>${MS.esc(U("webBadge", "Intranet", "Intranet"))}</b></span>
        <div class="v-links">${nav.map(([id, t]) => `<button type="button" data-v="${id}" aria-current="${id === vPage}" class="${id === "aria" ? "v-aria" : ""}">${id === "aria" ? "✦ " : ""}${MS.esc(t)}</button>`).join("")}
        <button type="button" data-v="login" class="v-loginbtn" aria-current="${vPage === "login"}">🔒 ${MS.esc(firma.login_label)}</button></div></nav>
      <div class="v-body">${body}</div></div></div>`;
    wrapTables(".v-body table");
    root.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { vPage = b.dataset.v; if (vPage === "aria") loadAria(); renderView(); }));
    if (vPage === "aria") bindAria();
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

  // ---------- ARIA: KI-Assistenz im Intranet (Premium Plus, ab dem Finale) ----------
  const nl2br = (t) => MS.esc(t).replace(/\n/g, "<br>");
  function ariaLog() {
    if (!aria) return `<p class="aria-empty">${t("Verbinde …", "Connecting …")}</p>`;
    const m = aria.msgs.map((x) => x.role === "event" ? `<p class="aria-ev">${MS.esc(x.text)}</p>`
      : `<div class="aria-b ${x.role === "user" ? "me" : "bot"}">${nl2br(x.text)}${x.nc ? `<small class="nc"> · ${t("nicht gezählt", "not counted")}</small>` : ""}</div>`).join("");
    return (m || `<div class="aria-b bot">${S.ui ? MS.esc(S.ui.ariaGreeting) : t(`Hallo! Ich bin ARIA, die KI-Assistenz von ${MS.esc(firma.name)}. Ich kenne den Kalender und das Intranet. Was möchtet ihr wissen?`, `Hi! I'm ARIA, the AI assistant of ${MS.esc(firma.name)}. I know the calendar and the intranet. What would you like to know?`)}</div>`)
      + (ariaBusy ? `<div class="aria-b bot typing"><span></span><span></span><span></span></div>` : "")
      + (aria.tip ? `<div class="aria-tip">${aria.tip}</div>` : "");
  }
  function ariaLock() {
    if (aria ? aria.lock === false : !!(S.ui && S.ui.ariaNoLock)) return "";
    if (aria && aria.unlocked) return `<div class="aria-note"><b>${t("🔓 Geschützte Notiz „privat“", "🔓 Protected note “private”")}</b><p>${MS.esc(aria.note)}</p></div>`;
    return `<form class="aria-lock" id="pwform"><b>${t("🔒 Geschützte Notiz „privat“", "🔒 Protected note “private”")}</b>
      <div class="aria-row"><input id="pwin" placeholder="${t("Kennwort", "Password")}" autocomplete="off" autocapitalize="none" spellcheck="false" value="${MS.esc(ariaPw)}"><button type="submit" class="v-btn">${t("Öffnen", "Open")}</button></div>
      <p class="err" id="pwmsg" role="alert">${MS.esc(ariaMsg)}</p></form>`;
  }
  function ariaHtml() {
    if (S.stage < 3 && !S.solved) return `<section class="aria-soon"><div class="aria-orb"></div><h2>${U("ariaSoonH", "ARIA geht in Kürze live", "ARIA goes live soon")}</h2>
      <p class="v-lead">${S.ui ? S.ui.ariaSoonText : t("Eure neue KI-Assistenz kennt jeden Termin und merkt sich alles für euch. Die Testphase mit der Geschäftsführung läuft – bald ist sie für alle da.", "Your new AI assistant knows every appointment and remembers everything for you. The test phase with management is running – soon she'll be available to everyone.")}</p></section>`;
    return `<section class="aria">
      <div class="aria-head"><span class="aria-orb small"></span><div><b>${MS.esc(U("ariaName", "ARIA", "ARIA"))}</b><span>${MS.esc(U("ariaSub", "KI-Assistenz · Kalender und Intranet", "AI assistant · calendar and intranet"))}</span></div></div>
      <div class="aria-log" id="arialog">${ariaLog()}</div>
      <form class="aria-form" id="ariaform"><textarea id="ariain" rows="2" maxlength="${aria ? aria.max_chars : 300}" placeholder="${MS.esc(U("ariaPlaceholder", "Frag ARIA …", "Ask ARIA …"))}">${MS.esc(ariaDraft)}</textarea><button type="submit" class="v-btn" ${ariaBusy ? "disabled" : ""}>${t("Senden", "Send")}</button></form>
      <p class="aria-meta" id="ariameta">${aria ? `${aria.used} / ${aria.max} ${U("ariaMsgs", "Nachrichten eures Teams", "messages of your team")} · ` : ""}${U("ariaDisclaimer", "ARIA ist eine KI und kann sich irren. Bitte keine echten persönlichen Daten eingeben.", "ARIA is an AI and can make mistakes. Please don't enter real personal data.")}</p>
      <div id="arialock">${ariaLock()}</div>
    </section>`;
  }
  function paintAria() {
    const log = $("arialog");
    if (!log) return;
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.innerHTML = ariaLog();
    if (atBottom) log.scrollTop = log.scrollHeight;
    $("ariameta").innerHTML = `${aria ? `${aria.used} / ${aria.max} ${U("ariaMsgs", "Nachrichten eures Teams", "messages of your team")} · ` : ""}${U("ariaDisclaimer", "ARIA ist eine KI und kann sich irren. Bitte keine echten persönlichen Daten eingeben.", "ARIA is an AI and can make mistakes. Please don't enter real personal data.")}`;
    if (aria && aria.unlocked && $("pwform")) { $("arialock").innerHTML = ariaLock(); }
  }
  async function loadAria() {
    if (!S || !S.plus || (S.stage < 3 && !S.solved)) return;
    try { aria = await MS.api("GET", "aria", null, H); } catch { return; }
    if (tab === "firma" && vPage === "aria") { if ($("arialog")) paintAria(); else renderView(); }
  }
  function bindAria() {
    const log = $("arialog"); if (log) log.scrollTop = log.scrollHeight;
    const f = $("ariaform"), ta = $("ariain");
    if (!f) return;
    ta.oninput = () => (ariaDraft = ta.value);
    ta.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); f.requestSubmit(); } };
    f.onsubmit = async (e) => {
      e.preventDefault();
      const text = ta.value.trim();
      if (!text || ariaBusy) return;
      ariaBusy = true; ariaDraft = ""; ta.value = "";
      aria = aria || { msgs: [], used: 0, max: 100, max_chars: 300 };
      aria.msgs.push({ role: "user", text }); paintAria(); log.scrollTop = log.scrollHeight;
      try { await MS.api("POST", "aria/chat", { text }, H); }
      catch (err) { aria.msgs.push({ role: "event", text: err.message }); }
      ariaBusy = false;
      await loadAria(); const l2 = $("arialog"); if (l2) l2.scrollTop = l2.scrollHeight;
    };
    const pf = $("pwform");
    if (pf) {
      $("pwin").oninput = (e) => (ariaPw = e.target.value);
      pf.onsubmit = async (e) => {
        e.preventDefault();
        try {
          const d = await MS.api("POST", "aria/kennwort", { kennwort: $("pwin").value }, H);
          ariaMsg = d.ok ? "" : t("Falsches Kennwort.", "Wrong password.");
          if (d.ok) ariaPw = "";
        } catch (err) { ariaMsg = err.message; }
        await loadAria();
        if ($("pwmsg")) $("pwmsg").textContent = ariaMsg;
      };
    }
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
      <div class="radio-head"><span class="led"></span>${t("Funkkanal Zentrale", "HQ radio channel")} · ${U("akte", "Akte 001", "File 001")}</div>
      ${S.next_hint ? `<p class="radio-next">${t("Nächster Funkspruch in", "Next radio message in")} <b id="nexthint">${MS.dur(Math.max(0, S.next_hint.time - Date.now() - offset))}</b> <span>· ${S.next_hint.label}</span></p>`
        : `<p class="radio-next">${t("Die Zentrale hat zu dieser Stufe alles gesagt, was sie weiß.", "HQ has said everything it knows about this stage.")}</p>`}
      ${S.hints.length ? S.hints.map((h) => `<div class="rmsg ${unread.has(hid(h)) ? "new" : ""}"><small>${t("Min.", "Min")} ${gameMin(h.time)} · ${h.label} · ${t("Hinweis", "Hint")} ${h.level}${unread.has(hid(h)) ? t(" · neu", " · new") : ""}</small><p>${h.text}</p></div>`).join("")
        : `<p class="radio-empty">${t("Funkstille. Die Zentrale meldet sich von selbst, wenn ihr länger festhängt – bei allen Teams gleichzeitig.", "Radio silence. HQ gets in touch by itself if you're stuck for a while – with all teams at the same time.")}</p>`}
      <p class="radio-rules">${t("Funksprüche kosten keine Strafzeit. Sie stehen auch direkt unter der passenden Frage im Tab „Lösung“.", "Radio messages cost no penalty time. They also appear right under the matching question in the “Answers” tab.")}</p>
    </section>`;
  }

  // ---------- Lösung ----------
  function hintsFor(q) {
    return S.hints.filter((h) => h.q === q).sort((a, b) => a.level - b.level)
      .map((h) => `<div class="funknote"><b>${t("Funk · Hinweis", "Radio · hint")} ${h.level}</b>${h.text}</div>`).join("");
  }

  function viewLoesung() {
    const vHtml = verdict ? `<div class="verdict ${verdict.cls}" role="alert">${verdict.html}</div>` : "";
    // Erfolgsmeldungen (neue Stufe) oben, Fehlermeldungen direkt über dem Prüfen-Knopf
    const top = verdict && verdict.cls === "good" ? vHtml : "", v = verdict && verdict.cls !== "good" ? vHtml : "";
    const qrows = () => S.questions.map((q, i) => `<div class="qrow"><span class="qn">${q.nr}</span><div class="qf">
          <label for="q_${q.key}">${q.label}</label><span class="hint">${MS.esc(q.hint)}</span>
          ${(q.pattern === "letter" || q.pattern === "name") && hasSus() ? susSelect(`q_${q.key}`, "data-q", q.key, draft[q.key] || "", q.pattern === "name")
            : `<input id="q_${q.key}" data-q="${q.key}" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="${i < S.questions.length - 1 ? "next" : "done"}" value="${MS.esc(draft[q.key] || "")}">`}
          ${hintsFor(q.key)}</div></div>`).join("");
    const ctip = S.check_available ? `<div class="ctip"><div><b>${t("Kontrolltipp", "Check")}</b><p>${t(`Zeigt, welche der Antworten, die gerade im Formular stehen, schon stimmen. Kostet ${S.rules.check} Minuten Strafzeit.`, `Shows which of the answers currently in the form are already correct. Costs ${S.rules.check} minutes of penalty time.`)}</p></div>
          <button type="button" class="btn ${checkArmed ? "btn-ink" : "btn-line"}" id="check">${checkArmed ? t(`Ja, Kontrolltipp nutzen (+${S.rules.check} Min.)`, `Yes, use the check (+${S.rules.check} min)`) : t("Kontrolltipp nutzen", "Use the check")}</button>
          ${checkArmed ? `<button type="button" class="linkbtn" id="checkno">${t("Abbrechen", "Cancel")}</button>` : ""}${checkRes}</div>` : "";
    if (S.stage === 3) {
      // Finale (Premium Plus): PIN aus der geschützten Notiz bei ARIA
      root.innerHTML = `<section class="report paper finale-stage">
        <div class="actbanner"><span class="conf">Finale</span><span>${U("finaleBanner", "Akt 2 gelöst · Schließfach gefunden", "Act 2 solved · locker found")}</span></div>${top}
        <div class="eyebrow">${U("finaleEyebrow", "Die letzte Notiz", "The last note")}</div><h2>${t("Zwei letzte Fragen", "Two final questions")}</h2>
        <p class="muted">${S.ui ? S.ui.finaleText : t(`Das Schließfach hat eine vierstellige PIN. Sie steckt in einer geschützten Notiz bei ARIA, der KI-Assistenz in eurem Intranet. Findet das Kennwort und öffnet die Notiz. Danach folgt der Kassensturz: Wie viel hat der Mitwisser schon kassiert? Beide Antworten müssen stimmen. Jeder Fehlversuch kostet ${S.rules.wrong} Minuten.`, `The locker has a four-digit PIN. It's in a protected note in ARIA, the AI assistant on your intranet. Find the password and open the note. Then comes the cash count: how much has the accomplice already pocketed? Both answers must be correct. Every wrong attempt costs ${S.rules.wrong} minutes.`)}</p>
        ${qrows()}${v}
        <button type="button" class="btn btn-red btn-big" id="pruefen">${S.ui ? MS.esc(S.ui.finaleButton) : S.questions.length > 1 ? t("Schließfach öffnen & Kassensturz prüfen", "Open the locker & check the cash count") : t("Schließfach öffnen", "Open the locker")}</button></section>`;
    } else if (S.stage === 2) {
      root.innerHTML = `<section class="report paper">
        <div class="actbanner"><span class="conf">${t("Akt 2", "Act 2")}</span><span>${t(`Akt 1 gelöst · ${MS.esc(S.ueberfuehrt || "")} ist überführt`, `Act 1 solved · ${MS.esc(S.ueberfuehrt || "")} is convicted`)}</span></div>${top}
        <div class="eyebrow">${t("Dem Geld auf der Spur", "Follow the money")}</div><h2>${t("Wer hat geholfen – und wo liegt das Geld?", "Who helped – and where is the money?")}</h2>
        <p class="muted">${t(`In eurer Akte liegen neue Beweisstücke. Beide Antworten müssen stimmen. Jeder Fehlversuch kostet ${S.rules.wrong} Minuten.`, `There's new evidence in your file. Both answers must be correct. Every wrong attempt costs ${S.rules.wrong} minutes.`)}${S.plus ? t(" Danach wartet noch das Finale.", " After that, the finale awaits.") : ""}</p>
        ${qrows()}${v}
        <button type="button" class="btn btn-red btn-big" id="pruefen">${t("Lösung prüfen", "Check answers")}</button>${ctip}
      </section>`;
    } else {
      root.innerHTML = `<section class="report paper">
        <div class="eyebrow">${t("Abschlussbericht", "Final report")}${S.premium ? t(" · Akt 1", " · Act 1") : ""}</div><h2>${t("Wer, wann, warum, wo?", "Who, when, why, where?")}</h2>
        <p class="muted">${t(`Alle vier Antworten müssen stimmen. Jeder Fehlversuch kostet ${S.rules.wrong} Minuten Strafzeit.`, `All four answers must be correct. Every wrong attempt costs ${S.rules.wrong} minutes of penalty time.`)}</p>
        ${qrows()}${v}
        <button type="button" class="btn btn-red btn-big" id="pruefen">${t("Lösung prüfen", "Check answers")}</button>${ctip}
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
        const cur = {};
        for (const inp of root.querySelectorAll("[data-q]")) cur[inp.dataset.q] = inp.value;
        const d = await MS.api("POST", "kontrolle", cur, H);
        checkRes = `<div class="checkrow">${S.questions.map((q, i) => `<span class="${d.result[q.key] ? "y" : "n"}">${t("Frage", "Question")} ${q.nr}: ${d.result[q.key] ? t("richtig", "correct") : t("falsch", "wrong")}</span>`).join("")}</div>`;
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
    if (btn) { btn.disabled = true; btn.textContent = t("Wird geprüft …", "Checking …"); }
    try {
      const d = await MS.api("POST", "loesung", a, H);
      if (d.correct) {
        draft = {};
        verdict = d.next === "akt2" ? { cls: "good", akt2: true, html: "" }
          : d.next === "finale" ? { cls: "good", html: S.ui ? S.ui.verdictFinale : t("<strong>Akt 2 gelöst!</strong>Das Geld liegt im Schließfach – aber das hat ein Zahlenschloss. Neuer Einsatzbrief in der Akte, und ARIA ist jetzt im Intranet freigeschaltet.", "<strong>Act 2 solved!</strong>The money is in the locker – but it has a combination lock. New briefing in the file, and ARIA is now unlocked on the intranet.") } : null;
      }
      else verdict = { cls: "bad", html: d.of ? t(`<strong>Leider falsch – ${d.right} von ${d.of} Antworten stimmen.</strong>+${d.penalty_min} Minuten Strafzeit. Welche nicht stimmen, zeigt euch der Kontrolltipp.`, `<strong>Sorry, that's wrong – ${d.right} of ${d.of} answers are right.</strong>+${d.penalty_min} minutes of penalty time. The check shows which ones are wrong.`)
        : t(`<strong>Leider falsch.</strong>+${d.penalty_min} Minuten Strafzeit. Prüft eure Antworten noch einmal.`, `<strong>Sorry, that's wrong.</strong>+${d.penalty_min} minutes of penalty time. Check your answers again.`) };
      checkRes = "";
    } catch (err) { verdict = { cls: "warn", html: MS.esc(err.message) }; }
    busy = false;
    lastKey = "";
    const before = S.stage;
    await poll();
    if (verdict && verdict.akt2) {
      verdict = { cls: "good", html: S.ui ? S.ui.verdictAkt2 : t(`<strong>Akt 1 gelöst!</strong>${MS.esc(S.ueberfuehrt || "")} ist überführt – aber das Geld ist verschwunden, und es gab Hilfe aus dem Haus. Neue Beweisstücke liegen in eurer Akte.`, `<strong>Act 1 solved!</strong>${MS.esc(S.ueberfuehrt || "")} is convicted – but the money has vanished, and there was help from inside the company. New evidence is in your file.`) };
      renderView();
    }
    if (S.stage !== before) scrollTo(0, 0);
  }

  // ---------- Rangliste ----------
  function rankTable() {
    return `<table class="rank"><thead><tr><th>#</th><th>Team</th><th>${t("Stand", "Status")}</th><th>${t("Zeit", "Time")}</th></tr></thead><tbody>
      ${S.ranking.map((r) => `<tr class="${r.name === S.team ? "me" : ""}"><td class="n">${r.rank || "–"}</td><td>${MS.esc(r.name)}${r.name === S.team ? t(" (ihr)", " (you)") : ""}${SB(r)}</td>
      <td>${MS.stage(r, S.tier)}</td><td class="mono">${r.solved ? MS.dur(r.score_ms) : "–"}</td></tr>`).join("")}
    </tbody></table>`;
  }


  poll();
  setInterval(poll, 8000);
})();
