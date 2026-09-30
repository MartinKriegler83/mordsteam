// Mordsteam – Admin: Spielrunden anlegen (nur mit ADMIN_KEY)
(function () {
  const root = document.getElementById("root");
  let key = null;
  try { key = sessionStorage.getItem("ms_admin"); } catch {}
  let meta = null, created = null, err = "";
  const H = () => ({ "x-admin": key });

  function keyView(e) {
    root.innerHTML = `<div class="panel center"><h1 style="font-family:var(--serif);font-size:30px;margin-bottom:10px">Admin</h1>
      <form id="kf" class="form"><div class="field"><label for="k">Admin-Schlüssel</label><input id="k" type="password" required autocomplete="off"></div>
      <div><button class="btn btn-ink" type="submit">Weiter</button></div><p class="err">${e ? MS.esc(e) : ""}</p></form></div>`;
    document.getElementById("kf").onsubmit = (ev) => {
      ev.preventDefault(); key = document.getElementById("k").value.trim();
      try { sessionStorage.setItem("ms_admin", key); } catch {}
      load();
    };
  }

  async function load() {
    if (!key) return keyView();
    try {
      meta = meta || (await MS.api("GET", "admin/meta", null, H()));
      const list = await MS.api("GET", "admin/sessions", null, H());
      const ord = await MS.api("GET", "admin/orders", null, H()).catch(() => ({ orders: [] }));
      const st = await MS.api("GET", "admin/stats" + (statTests ? "?tests=1" : ""), null, H()).catch(() => ({ stats: {} }));
      fb = await MS.api("GET", "admin/feedback", null, H()).catch(() => null);
      soloList = await fetch("/api/solo/admin/list", { headers: H() }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      ops = await MS.api("GET", "admin/ops", null, H()).catch(() => null);
      render(list.sessions, ord.orders, st.stats);
    } catch (e) {
      if (e.status === 401 || e.status === 503) { try { sessionStorage.removeItem("ms_admin"); } catch {} key = null; return keyView(e.status === 401 ? "Schlüssel falsch." : e.message); }
      root.innerHTML = `<p class="err">${MS.esc(e.message)}</p>`;
    }
  }

  // ---------- Schnelltest mit Zufallsdaten ----------
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const R = {
    firmen: ["Alpenblick Logistik GmbH", "Donautec AG", "Brenner & Partner", "Kaiser Maschinenbau GmbH", "Lindner Software GmbH", "Sonnleitner Bau", "Hofmann Feinkost GmbH", "Steirerwerk AG", "Pannonia Solar GmbH"],
    orte: [["Wien", "Stadtpark"], ["Graz", "Stadtpark"], ["Linz", "Donaupark"], ["Salzburg", "Mirabellgarten"], ["Innsbruck", "Hofgarten"], ["Eisenstadt", "Schlosspark"], ["Klagenfurt", "Europapark"]],
    feier: ["Kantine", "Dachterrasse", "Foyer", "Seminarraum Alpen", "Betriebsrestaurant"],
    tatort: ["Büro der Geschäftsführung", "Chefbüro", "Besprechungsraum Donau", "Büro 4.01"],
    frau: ["Julia", "Lisa", "Sarah", "Katharina", "Anna", "Eva", "Sabrina", "Theresa"],
    herr: ["Tom", "Markus", "Florian", "Stefan", "Michael", "Lukas", "David", "Georg"],
    nachnamen: ["Berger", "Hofer", "Wagner", "Steiner", "Gruber", "Huber", "Bauer", "Pichler", "Moser", "Mayer", "Leitner", "Fuchs", "Eder", "Schwarz", "Wolf", "Brunner"],
    funktionen: ["Teamleitung", "Abteilungsleitung", "Key Account", "Controlling", "Projektleitung", "Assistenz der Geschäftsführung", "Senior Consultant", "Einkauf"],
    abteilungen: ["Vertrieb", "IT", "Kundenbetreuung", "Finanzen", "Marketing", "Einkauf", "Produktion", "Personal"],
  };
  function randomVars() {
    const used = new Set();
    const person = (anr) => {
      let n; do { n = `${pick(R[anr === "Herr" ? "herr" : "frau"])} ${pick(R.nachnamen)}`; } while (used.has(n)); used.add(n); return n;
    };
    const [stadt, park] = pick(R.orte);
    const oAnr = pick(["Frau", "Herr"]);
    const v = { FIRMA: pick(R.firmen), STADT: stadt, PARK: park, RAUM_FEIER: pick(R.feier), RAUM_TATORT: pick(R.tatort),
      OPFER_ANR: oAnr, OPFER: person(oAnr), OPFER_FKT: oAnr === "Herr" ? "Geschäftsführer" : "Geschäftsführerin" };
    const bAnr = pick(["Frau", "Herr"]);
    Object.assign(v, { BOSS_ANR: bAnr, BOSS: `Dr. ${person(bAnr)}`,
      BOSS_FKT: pick(bAnr === "Herr" ? ["CEO der Gruppe", "Vorsitzender des Aufsichtsrats", "Eigentümer"] : ["CEO der Gruppe", "Vorsitzende des Aufsichtsrats", "Eigentümerin"]) });
    for (const i of [1, 2, 3, 4, 5, 6]) { const a = pick(["Frau", "Herr"]); v[`S${i}_ANR`] = a; v[`S${i}`] = person(a); v[`S${i}_FKT`] = pick(R.funktionen); v[`S${i}_ABT`] = pick(R.abteilungen); }
    return v;
  }
  const TN = ["Basis", "Premium", "Premium Plus"], TMIN = [50, 70, 90];
  let qLang = "de", qLand = "AT";
  async function quickTest(tier) {
    const premium = tier >= 1;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date());
    created = await MS.api("POST", "admin/session", { event_date: today, tier, test_mode: true, cast: "fiktiv", lang: qLang, vars: { LAND: qLand } }, H());
    const vars = { FIRMA: created.quick.firma, OPFER: created.quick.opfer, BOSS: created.quick.boss };
    for (let i = 1; i <= 6; i++) vars["S" + i] = created.quick.people[i - 1];
    // Organisator gleich anmelden und den Fall öffnen
    const o = await MS.api("POST", "leitung/login", { code: created.org_code });
    MS.set("ms_org", o.token);
    await MS.api("POST", "leitung/aktion", { aktion: "oeffnen" }, { "x-leitung": o.token });
    created.quick = { ...created.quick, tier, premium, people: created.quick.people.slice(0, premium ? 6 : 5) };
  }

  let statTests = true;
  let fb = null, fbMsg = "";
  let soloMsg = "", soloList = null, ops = null, last = [[], [], {}];
  let tab = "uebersicht";
  try { tab = sessionStorage.getItem("ms_admtab") || "uebersicht"; } catch {}
  const TABS = [["uebersicht", "Übersicht"], ["finanzen", "Bestellungen & Finanzen"], ["runden", "Spielrunden & Tests"], ["statistik", "Spielstatistik"], ["system", "Kapazität & System"], ["feedback", "Feedback"]];
  const tabBar = () => `<nav class="admtabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === tab}">${l}${k === "system" && ops && (ops.errors.today || ops.alerts.some((a) => Date.now() - a.at < 86400000)) ? ' <span class="dot"></span>' : ""}</button>`).join("")}</nav>`;
  const eur = (c) => (c / 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const usd = (x) => (x || 0).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";
  const n0 = (x) => (x || 0).toLocaleString("de-AT");
  // Ampel: grün unter 70 %, gelb bis 90 %, rot darüber
  function tile(label, val, lim, sub, fmt = n0) {
    const r = lim > 0 ? val / lim : 0;
    const cls = lim > 0 ? (r >= 0.9 ? "red" : r >= 0.7 ? "yellow" : "green") : "green";
    return `<div class="tile ${cls}"><small>${label}</small><b>${fmt(val)}</b><span>${lim > 0 ? `von ${fmt(lim)} (${Math.round(r * 100)} %)` : sub || "kein Limit"}</span>${lim > 0 ? `<i style="width:${Math.min(100, Math.round(r * 100))}%"></i>` : ""}</div>`;
  }
  const WARNTXT = (k) => k.replace(/^mail-day-.*/, "Mails am Tag").replace(/^mail-month-.*/, "Mails im Monat").replace(/^ai-err-.*/, "KI-Fehler").replace(/^ai-.*/, "KI-Budget").replace(/^req-.*/, "Server-Aufrufe").replace(/^err-.*/, "Serverfehler");
  function overviewPanel(orders) {
    if (!ops) return `<div class="panel"><p class="err">Betriebsdaten konnten nicht geladen werden.</p></div>`;
    const L = ops.limits, C = ops.configured;
    const paid = orders.filter((o) => o.status !== "pending" && o.status !== "withdrawn");
    const mon = paid.filter((o) => new Date(o.created_at).toISOString().slice(0, 7) === ops.month);
    const chk = (ok, txt, warn) => `<li class="${ok ? "ok" : warn ? "bad" : "no"}">${ok ? "✓" : warn ? "!" : "–"} ${txt}</li>`;
    return `<div class="panel"><div class="eyebrow">Ampel · heute ${ops.today}</div>
      <div class="tiles">
        ${tile("Mails heute", ops.mail.today, L.mail_day, "kein Tageslimit")}
        ${tile("Mails im Monat", ops.mail.month, L.mail_month)}
        ${tile("KI-Kosten im Monat", ops.ai.month_cost, L.ai_budget, "", usd)}
        ${tile("Server-Aufrufe heute", ops.hits.today, L.req_day, "Workers Paid: kein Tageslimit")}
        <div class="tile ${ops.errors.today > 10 ? "red" : ops.errors.today ? "yellow" : "green"}"><small>Fehler heute</small><b>${ops.errors.today}</b><span>Warnung ab 11</span></div>
        <div class="tile green"><small>Umsatz im Monat</small><b>${eur(mon.reduce((a, o) => a + o.amount_cents, 0))}</b><span>${mon.length} Bestellung(en)</span></div>
      </div></div>
      <div class="two-col">
      <div class="panel"><div class="eyebrow">Einrichtung dieser Umgebung</div><ul class="checks">
        ${chk(C.mail, "Mailversand (Resend)")}${chk(C.ai, "Claude-API für ARIA")}${chk(C.stripe, C.stripe_live ? "Stripe LIVE" : "Stripe (Testmodus)")}
        ${chk(C.shop_open, "Shop offen (SHOP_OPEN)")}${C.fake_pay ? chk(false, "ORDER_FAKE_PAY ist AN – nie in Produktion!", true) : ""}</ul>
        <p class="small">Limits: Mails ${L.mail_day || "∞"}/Tag, ${L.mail_month || "∞"}/Monat · Aufrufe ${L.req_day ? n0(L.req_day) + "/Tag" : "ohne Tageslimit"} · KI-Budget ${L.ai_budget} $/Monat. Warnmail an office@ ab 70 %.</p></div>
      <div class="panel"><div class="eyebrow">Letzte Warnungen</div>${ops.alerts.length ? `<ul class="list small">${ops.alerts.slice(0, 6).map((a) => `<li>${new Date(a.at).toLocaleString("de-AT")} · ${WARNTXT(a.key)}</li>`).join("")}</ul>` : `<p class="muted">Keine Warnungen.</p>`}</div>
      </div>
      <div class="panel"><div class="eyebrow">Letzte Bestellungen</div>${orders.length ? `<table class="grid small"><tr><th>Zeit</th><th>Kunde</th><th>Produkt</th><th>Betrag</th><th>Status</th></tr>${orders.slice(0, 5).map((o) => `<tr><td>${new Date(o.created_at).toLocaleString("de-AT")}</td><td>${MS.esc((o.contact || {}).name || "")}</td><td>${o.paket === "solo" ? "Solo" : `${({ basis: "Basis", premium: "Premium", plus: "Premium Plus" })[o.paket] || o.paket} · ${o.teams} Teams`}</td><td>${eur(o.amount_cents)}</td><td>${o.status}</td></tr>`).join("")}</table>` : `<p class="muted">Noch keine Bestellungen.</p>`}</div>`;
  }
  // Balken für die letzten 30 Tage
  function bars(rows, key, fmt = n0) {
    const map = Object.fromEntries(rows.map((r) => [r.day, r[key] || 0]));
    const days = [];
    for (let i = 29; i >= 0; i--) days.push(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date(Date.now() - i * 86400000)));
    const max = Math.max(1, ...days.map((d) => map[d] || 0));
    return `<div class="bars">${days.map((d) => `<div title="${d}: ${fmt(map[d] || 0)}"><i style="height:${Math.round(((map[d] || 0) / max) * 100)}%"></i></div>`).join("")}</div><div class="bars-axis"><span>${days[0].slice(5)}</span><span>max ${fmt(max)}</span><span>heute</span></div>`;
  }
  function systemPanel() {
    if (!ops) return `<div class="panel"><p class="err">Betriebsdaten konnten nicht geladen werden.</p></div>`;
    const K = { bestellung: "Bestellbestätigung", solo: "Solo-Bestellung", feedback: "Feedback", kontakt: "Kontaktformular", widerruf: "Widerruf (Kunde)", "widerruf-office": "Widerruf (an office)" };
    const A = { "spiel-abfrage": "Spielgeräte fragen Stand ab (hochgerechnet)", spiel: "Spiel (Aktionen)", aria: "ARIA-Chat", solo: "Solo", shop: "Shop & Formulare", stripe: "Stripe-Webhook", admin: "Admin", sonstiges: "Sonstiges" };
    return `<div class="panel"><div class="eyebrow">Mails · letzte 30 Tage</div>${bars(ops.mail.days, "n")}
      <table class="grid small" style="margin-top:12px"><tr><th>Art (dieser Monat)</th><th>Versuche</th><th>Zugestellt</th></tr>${ops.mail.kinds.filter((k) => k.kind !== "warnung").map((k) => `<tr><td>${K[k.kind] || k.kind}</td><td>${k.n}</td><td>${k.ok}${k.ok < k.n ? ` <b style="color:var(--red)">(${k.n - k.ok} fehlgeschlagen)</b>` : ""}</td></tr>`).join("") || `<tr><td colspan="3" class="muted">Noch keine Mails.</td></tr>`}</table>
      <p class="small"><a href="https://resend.com/emails" target="_blank" rel="noopener">Resend öffnen</a> · Tarif ändern: Resend → Settings → Billing</p></div>
    <div class="panel"><div class="eyebrow">Claude-API (ARIA) · letzte 30 Tage, Kosten in $</div>${bars(ops.ai.days, "cost_usd", usd)}
      <p style="margin-top:12px">Dieser Monat: <b>${n0(ops.ai.month_calls)}</b> Antworten · <b>${usd(ops.ai.month_cost)}</b> · ${n0(ops.ai.month_input)} Eingabe- / ${n0(ops.ai.month_output)} Ausgabe-Token${ops.ai.month_errors ? ` · <b style="color:var(--red)">${ops.ai.month_errors} Fehler</b>` : ""}</p>
      <p class="small">Kosten berechnet mit ${ops.price.input} $ / ${ops.price.output} $ je Million Eingabe-/Ausgabe-Token (Haiku 4.5). Guthaben nachsehen: <a href="https://platform.claude.com/settings/billing" target="_blank" rel="noopener">Claude Console → Billing</a>.</p></div>
    <div class="panel"><div class="eyebrow">Server-Aufrufe · letzte 30 Tage</div>${bars(ops.hits.days, "n")}
      <table class="grid small" style="margin-top:12px"><tr><th>Bereich (dieser Monat)</th><th>Aufrufe</th></tr>${ops.hits.areas.map((a) => `<tr><td>${A[a.area] || a.area}</td><td>${n0(a.n)}</td></tr>`).join("") || `<tr><td colspan="2" class="muted">Noch keine Daten.</td></tr>`}</table>
      <p class="small">Gezählt werden Aufrufe des Servers (Spiel, Shop, Formulare). Seitenaufrufe der Website zeigt <a href="https://dash.cloudflare.com/?to=/:account/web-analytics" target="_blank" rel="noopener">Cloudflare Web Analytics</a>.</p></div>
    <div class="panel"><div class="eyebrow">Serverfehler · letzte 50</div>${ops.errors.list.length ? `<table class="grid small"><tr><th>Zeit</th><th>Bereich</th><th>Code</th><th>Meldung</th></tr>${ops.errors.list.map((e) => `<tr><td>${new Date(e.at).toLocaleString("de-AT")}</td><td>${MS.esc(e.area)}</td><td>${e.status}</td><td class="mono" style="font-size:12px;word-break:break-word">${MS.esc(e.msg)}</td></tr>`).join("")}</table>` : `<p class="muted">Keine Fehler.</p>`}</div>`;
  }
  function soloStatsPanel() {
    if (!soloList) return "";
    const row = (z) => `<tr><td>${z.test_mode ? "Test" : "Echt"}</td><td>${z.n}</td><td class="mono">${MS.dur(z.avg)}</td><td>${Number(z.hints).toFixed(1)}</td><td>${Number(z.wrong).toFixed(1)}</td></tr>`;
    return `<div class="panel"><div class="eyebrow">Mordsteam Solo · Nachtzug nach Venedig (erste Durchgänge)</div>
      <table class="grid small"><tr><th>Art</th><th>Gelöst</th><th>Ø Endzeit</th><th>Ø Hinweise</th><th>Ø Fehlversuche</th></tr>${soloList.scores.map(row).join("") || `<tr><td colspan="5" class="muted">Noch keine Wertungen.</td></tr>`}</table>
      <p class="small">Endzeit = Spielzeit + Strafminuten. Richtwert: 30 Minuten.</p></div>`;
  }
  // ---------- Feedback ----------
  function feedbackPanel() {
    if (!fb) return "";
    const pub = { no: "nicht veröffentlichen", anon: "anonym erlaubt", name: "mit Namen erlaubt" };
    const A = { spieler: "Spieler/in", geloest: "Gelöst", test: "Test", wiederholung_leicht: "Wiederholung war", wiederholung_lohnt: "Hat sich gelohnt", wiederholung_notiz: "Anmerkung Wiederholung", best: "Am meisten Spaß", improve: "Verbessern", difficulty: "Schwierigkeit", duration: "Spielzeit", aria: "ARIA", tech: "Technik", players: "Personen", again: "Wieder spielen", call: "Gespräch" };
    return `<div class="panel"><div class="eyebrow">Feedback nach dem Spiel</div>
      <p class="small" style="margin:6px 0">Mailversand: <b>${fb.mail ? "eingerichtet" : "NICHT eingerichtet (RESEND_API_KEY / MAIL_FROM fehlen) – Links unten selbst verschicken"}</b> · Täglicher Lauf: <b>${fb.cron ? "CRON_KEY gesetzt" : "CRON_KEY fehlt"}</b></p>
      <p style="margin:8px 0">${fb.due.length} Runde(n) beendet und noch ohne Feedback-Mail.</p>
      <div class="actions-row"><button class="btn btn-line" id="fbrun">Fällige jetzt senden</button><button class="btn btn-line" id="fbforce">Test: auch heute beendete sofort</button></div>
      ${fbMsg ? `<p class="small" style="margin-top:8px">${fbMsg}</p>` : ""}
      ${fb.links.length ? `<p class="small" style="margin-top:10px"><b>Nicht per Mail zugestellt – Link selbst schicken:</b><br>${fb.links.map((l) => `${MS.esc(l.email || "")}: <a href="${l.link}" target="_blank" rel="noopener">${location.origin}${l.link}</a>`).join("<br>")}</p>` : ""}
      <div class="list-sessions" style="margin-top:12px">${fb.feedback.length ? fb.feedback.map((f) => `<div class="sess">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${"★".repeat(f.rating || 0)}${f.nps != null ? ` · Empfehlung ${f.nps}/10` : ""} · ${f.paket === "solo" ? "Mordsteam Solo" + (f.answers.test === "ja" ? " (Test)" : "") : MS.esc(f.firma || "–")}</b><span class="chip ${f.approved ? "open" : ""}">${f.variant === "eb" ? "Early Bird" : f.variant === "solo" ? "Solo" : f.variant === "solo-replay" ? "Solo · Wiederholung" : "Standard"} · ${pub[f.publish]}</span></div>
        <div class="small">${new Date(f.created_at).toLocaleString("de-AT")} · ${MS.esc(f.name || "")} · ${MS.esc(f.email || "")} · ${f.paket}${f.publish === "name" ? ` · Name: <b>${MS.esc(f.publish_name || "")}</b>` : ""}</div>
        ${f.review ? `<p style="margin:8px 0"><i>„${MS.esc(f.review)}“</i></p>` : ""}
        <div class="small">${Object.entries(f.answers).map(([k, v]) => `<b>${A[k] || k}:</b> ${MS.esc(v)}`).join("<br>")}</div>
        ${f.publish !== "no" && f.review ? `<div style="margin-top:8px"><button class="tipbtn" data-fbok="${f.id}" data-v="${f.approved ? 0 : 1}">${f.approved ? "Von Startseite nehmen" : "Auf Startseite zeigen"}</button></div>` : ""}
      </div>`).join("") : `<p class="muted">Noch kein Feedback.</p>`}</div></div>`;
  }
  function statsPanel(stats) {
    const lab = { wer: "1 Wer", wann: "2 Wann", warum: "3 Konto", wo: "4 Mappe", helfer: "5 Helfer", fach: "6 Fach", pin: "7 PIN" };
    const f = (x) => (x && x.n ? `${x.median} <span class="muted">(${x.p25}–${x.p75})</span>` : "–");
    const col = (k, g) => g ? `<td>${g.teams} Teams / ${g.runden} Runden</td><td>${g.akt1_geloest} / ${g.teams}${k !== "basis" ? ` · ganz: ${g.ganz_geloest}` : ""}</td><td>${f(g.akt1_min)}</td><td>${f(g.akt2_min)}</td><td>${f(g.finale_min)}</td><td>${f(g.hinweise_akt1)}</td><td>${Object.entries(g.fehler_je_team).map(([q, n]) => `${lab[q] || q}: ${n}`).join("<br>") || "–"}</td>` : `<td colspan="7" class="muted">noch keine Daten</td>`;
    return `<div class="panel"><div class="eyebrow">Statistik (anonym, ab Rundenende)</div>
      <p class="small" style="margin:6px 0">Minuten ab Start: Median (mittlere Hälfte der Teams). Akt 2 und Finale jeweils ab Lösung der Stufe davor. Fehler = falsche Antworten je Frage pro Team.</p>
      <label class="check small"><input type="checkbox" id="stattests" ${statTests ? "checked" : ""}><span>Testrunden einbeziehen</span></label>
      <div style="overflow-x:auto"><table class="grid small"><tr><th>Paket</th><th>Daten</th><th>Akt 1 gelöst</th><th>Akt 1 Min.</th><th>Akt 2 Min.</th><th>Finale Min.</th><th>Hinweise bis Akt 1</th><th>Fehler je Frage</th></tr>
      <tr><th>Basis</th>${col("basis", stats.basis)}</tr><tr><th>Premium</th>${col("premium", stats.premium)}</tr><tr><th>Premium Plus</th>${col("plus", stats.plus)}</tr></table></div></div>`;
  }

  function ordersPanel(orders) {
    const eur = (c) => (c / 100).toLocaleString("de-AT", { maximumFractionDigits: 2 }) + " €";
    const lbl = { pending: "offen", paid: "bezahlt", fulfilling: "in Arbeit", fulfilled: "bezahlt · Runde angelegt", withdrawn: "WIDERRUFEN – erstatten!" };
    const paid = orders.filter((o) => o.status !== "pending" && o.status !== "withdrawn");
    const toShip = [];
    const y = new Date().getFullYear();
    return `<div class="panel"><div class="eyebrow">Bestellungen</div>
      <div class="actions-row" style="margin:8px 0;align-items:end;flex-wrap:wrap;gap:8px">
        <label class="small">von <input type="date" id="exvon" value="${y}-01-01"></label>
        <label class="small">bis <input type="date" id="exbis" value="${y}-12-31"></label>
        <button class="btn btn-line" id="exbtn" type="button">Einnahmen exportieren (CSV)</button></div>
      <p style="margin:8px 0">${paid.length} bezahlt · Umsatz ${eur(paid.reduce((a, o) => a + o.amount_cents, 0))}</p>
      <div class="list-sessions">${orders.length ? orders.map((o) => {
        const c = o.contact || {}, l = c.liefer;
        return `<div class="sess">
          <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${o.paket === "solo" ? "Mordsteam Solo" : MS.esc(o.firma || "–")}</b><span class="chip ${o.status === "fulfilled" ? "open" : ""}">${o.paket === "solo" && o.status === "fulfilled" ? "bezahlt · Code erstellt" : lbl[o.status] || o.status}</span></div>
          <div class="mono">${new Date(o.created_at).toLocaleString("de-AT")} · ${o.paket === "solo" ? `SOLO · ${eur(o.amount_cents)}${o.solo_code ? ` · Solo-Code ${o.solo_code}` : ""}` : `${({ basis: "Basis", premium: "PREMIUM", plus: "PREMIUM PLUS" })[o.paket] || o.paket} · ${o.teams} Teams · ${eur(o.amount_cents)} · gekauft ${o.event_date}${o.join_code ? ` · Spielcode ${o.join_code} · Organisator ${o.org_code}` : ""}`}</div>
          <div class="small">${MS.esc(c.name || "")} · <a href="mailto:${MS.esc(c.email || "")}">${MS.esc(c.email || "")}</a>${c.telefon ? " · " + MS.esc(c.telefon) : ""}${c.rechnung_firma ? " · Rechnung: " + MS.esc(c.rechnung_firma) : ""}${c.lang ? " · Spielsprache " + c.lang.toUpperCase() : ""}${c.site ? " · Seite " + c.site.toUpperCase() : ""}${c.kunde ? " · " + (c.kunde === "b2c" ? "Privat" : "Firma/Verein") : ""}${c.fiktiv ? " · fiktiv" : ""}${c.earlybird ? ` · <b style="color:var(--red)">EARLY BIRD −${c.earlybird} % (Feedback einholen!)</b>` : ""}</div>
        </div>`;
      }).join("") : `<p class="muted">Noch keine Bestellungen.</p>`}</div></div>`;
  }

  function render(sessions, orders = [], stats = {}) {
    last = [sessions, orders, stats];
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date());
    root.innerHTML = `<div class="stack" style="gap:22px;max-width:980px">
      ${tabBar()}
      ${tab === "runden" ? `${created ? `<div class="panel" style="border-color:var(--red)"><div class="eyebrow">Runde angelegt</div>
        <p style="margin:8px 0">Spielcode für Teams: <span class="bigcode" style="font-size:26px">${created.join_code}</span></p>
        <p>Organisator-Code: <b class="mono" style="font-size:20px">${created.org_code}</b></p>
        <p class="mono small">Teams: ${location.origin}/spiel/?code=${created.join_code}<br>Organisator: ${location.origin}/spiel/leitung.html</p>
        ${created.quick ? `<p class="small" style="margin-top:8px"><b>${TN[created.quick.tier]}, ${TMIN[created.quick.tier]} Min. · ${created.quick.land} · ${created.quick.lang.toUpperCase()}</b> · ${MS.esc(created.quick.firma)} (${MS.esc(created.quick.stadt)}) · Opfer: ${MS.esc(created.quick.opfer)} · Oberboss: ${MS.esc(created.quick.boss)} · Verdächtige: ${created.quick.people.map(MS.esc).join(", ")} · Täter/in: per Zufall (steht in der Auflösung)</p>
        <div class="actions-row" style="margin-top:10px"><a class="btn btn-ink" href="/spiel/leitung.html" target="_blank" rel="noopener">Organisator-Ansicht öffnen</a><a class="btn btn-line" href="/spiel/?code=${created.join_code}&lang=${created.quick.lang}" target="_blank" rel="noopener">Als Team beitreten</a></div>
        <p class="small" style="margin-top:8px">${created.quick.custom ? "Der Fall ist noch nicht geöffnet. In der Organisator-Ansicht zuerst „Fall öffnen“, dann Teams anmelden lassen und „Fall starten“." : "Der Fall ist geöffnet. Teams anmelden lassen, dann in der Organisator-Ansicht „Fall starten“."}</p>` : ""}</div>` : ""}
      <div class="panel"><div class="eyebrow">Mordsteam Solo · Testcode</div>
        <p style="margin:8px 0 14px">Legt einen Solo-Code „Nachtzug nach Venedig“ im Testmodus an (eigene Wertung, getrennt von echten Spielen; mit „+5 Min.“-Knopf).</p>
        <div class="actions-row"><button class="btn btn-red" id="solonew">Solo-Testcode anlegen</button></div>
        ${soloMsg ? `<div style="margin-top:12px">${soloMsg}</div>` : ""}
        ${soloList && soloList.tickets.length ? `<details style="margin-top:12px"><summary>Letzte Solo-Codes (${soloList.tickets.length})</summary><table class="grid" style="margin-top:8px"><tr><th>Code</th><th>Name</th><th>Test</th><th>Durchgänge</th><th>Erste Zeit</th><th>Gutschein</th></tr>
          ${soloList.tickets.map((x) => `<tr><td class="mono"><a href="/spiel/solo.html?c=${x.code}" target="_blank" rel="noopener">${x.code}</a></td><td>${MS.esc(x.name || "–")}</td><td>${x.test_mode ? "ja" : "nein"}</td><td>${x.runs}</td><td class="mono">${x.score ? MS.dur(x.score) : "–"}</td><td class="mono">${MS.esc(x.voucher || "–")}${x.voucher ? (x.voucher_synced ? " ✓ Stripe" : " (nicht in Stripe)") : ""}</td></tr>`).join("")}</table>
          <p class="small">${soloList.scores.map((z) => `${z.test_mode ? "Test" : "Echt"}: ${z.n} Wertungen, Ø ${MS.dur(z.avg)}, Ø ${Number(z.hints).toFixed(1)} Hinweise, Ø ${Number(z.wrong).toFixed(1)} Fehlversuche`).join(" · ") || "Noch keine Wertungen."}</p></details>` : ""}
      </div>
      <div class="panel"><div class="eyebrow">Schnelltest</div>
        <p style="margin:8px 0 14px">Ein Klick: Runde mit fiktiver Besetzung anlegen (Land und Spielsprache wählbar), Fall öffnen und dich als Organisator anmelden.</p>
        <div class="two" style="margin-bottom:12px"><div class="field"><label for="qlang">Spielsprache</label><select id="qlang">${meta.langs.map((l) => `<option value="${l}" ${l === qLang ? "selected" : ""}>${l === "en" ? "Englisch" : "Deutsch"}</option>`).join("")}</select></div>
        <div class="field"><label for="qland">Land</label><select id="qland">${meta.countries.map((c) => `<option value="${c.code}" ${c.code === qLand ? "selected" : ""}>${MS.esc(c.de)} (${c.code})</option>`).join("")}</select></div></div>
        <div class="actions-row"><button class="btn btn-red" data-quick="0">Basis (50 Min.)</button><button class="btn btn-line" data-quick="1">Premium (70 Min.)</button><button class="btn btn-line" data-quick="2">Premium Plus (90 Min., ARIA)</button></div>
      </div>
      <div class="panel"><div class="eyebrow">Neue Spielrunde (mit eigenen Daten)</div>
      <form id="nf" class="form">
        <div class="two">
          <div class="field"><label for="label">Bezeichnung (intern)</label><input id="label" name="label" placeholder="z. B. Test Freunde"></div>
          <div class="field"><label for="event_date">Datum (intern)</label><input id="event_date" name="event_date" type="date" value="${today}" required></div>
        </div>
        <div class="two">
          <div class="field"><label for="max_teams">Gebuchte Teams</label><input id="max_teams" name="max_teams" type="number" min="1" max="15" value="3"></div>

        </div>
        <label class="check"><input type="checkbox" name="test_mode" checked><span><b>Testmodus</b>: Fall lässt sich an jedem Tag öffnen (für Probeläufe).</span></label>
        <div class="two"><div class="field"><label for="land">Land</label><select id="land" name="LAND">${meta.countries.map((c) => `<option value="${c.code}">${MS.esc(c.de)} (${c.code})</option>`).join("")}</select></div>
        <div class="field"><label for="nlang">Spielsprache</label><select id="nlang" name="lang"><option value="de">Deutsch</option><option value="en">Englisch</option></select></div></div>
        <div class="field"><label for="tier">Paket</label><select id="tier" name="tier"><option value="0">Basis – 50 Min., Akt 1</option><option value="1">Premium – 70 Min., Akt 1 + 2</option><option value="2">Premium Plus – 90 Min., Akt 1 + 2 + Finale mit ARIA</option></select></div>
        <h3 style="margin-top:8px">Personalisierung</h3>
        <p class="small">Leere Felder bekommen den Beispielwert (grau). Basis nutzt Verdächtige 1–5, Premium 1–6. Wer Täter/in ist, entscheidet der Zufall.</p>
        <div class="two">${meta.fields.map((f) => `<div class="field"><label for="f_${f.key}">${MS.esc(f.label)}</label>${f.type === "anrede"
          ? `<select id="f_${f.key}" name="${f.key}">${["Frau", "Herr"].map((o) => `<option ${o === f.example ? "selected" : ""}>${o}</option>`).join("")}</select>`
          : `<input id="f_${f.key}" name="${f.key}" placeholder="${MS.esc(f.example)}" maxlength="80">`}</div>`).join("")}</div>
        <div><button class="btn btn-red" type="submit">Runde anlegen</button></div>
        <p class="err">${MS.esc(err)}</p>
      </form></div>` : ""}
      ${tab === "uebersicht" ? overviewPanel(orders) : ""}
      ${tab === "finanzen" ? ordersPanel(orders) : ""}
      ${tab === "statistik" ? statsPanel(stats) + soloStatsPanel() : ""}
      ${tab === "system" ? systemPanel() : ""}
      ${tab === "feedback" ? feedbackPanel() : ""}
      ${tab === "runden" ? `<div class="panel"><div class="eyebrow">Alle Runden</div>
        <div class="list-sessions" style="margin-top:10px">${sessions.length ? sessions.map((s) => `<div class="sess">
          <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${MS.esc(s.label || s.id)}</b><span class="chip ${({ open: "open", running: "run", finished: "fin" })[s.status] || ""}">${s.status}</span></div>
          <div class="mono">Angelegt ${s.event_date} · Teams ${s.teams} · Spielcode ${s.join_code} · Organisator ${s.org_code}${s.test_mode ? " · TEST" : ""}${s.premium ? " · " + TN[s.premium].toUpperCase() : ""} · ${s.land || "AT"} · ${(s.lang || "de").toUpperCase()}</div>
          <div><button class="tipbtn" data-del="${s.id}">Löschen</button></div></div>`).join("") : `<p class="muted">Noch keine Runden.</p>`}</div></div>` : ""}
    </div>`;
    root.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; try { sessionStorage.setItem("ms_admtab", tab); } catch {} render(...last); }));
    const nfEl = document.getElementById("nf");
    if (nfEl) nfEl.onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target, vars = {};
      for (const fl of meta.fields) vars[fl.key] = f.elements[fl.key].value;
      vars.LAND = f.elements.LAND.value;
      try {
        created = await MS.api("POST", "admin/session", {
          label: f.label.value, event_date: f.event_date.value, max_teams: Number(f.max_teams.value),
          test_mode: f.test_mode.checked, tier: Number(f.tier.value), lang: f.elements.lang.value, vars,
        }, H());
        // Organisator-Ansicht auf genau diese Runde umstellen (sonst öffnet sie die zuletzt benutzte Runde)
        const o = await MS.api("POST", "leitung/login", { code: created.org_code });
        MS.set("ms_org", o.token);
        const tier = Number(f.tier.value);
        created.quick = { ...created.quick, tier, premium: tier >= 1, custom: true, people: created.quick.people.slice(0, tier >= 1 ? 6 : 5) };
        err = ""; scrollTo(0, 0);
      } catch (e2) { err = e2.message; }
      load();
    };
    root.querySelectorAll("[data-quick]").forEach((b) => (b.onclick = async () => {
      b.disabled = true;
      try { await quickTest(Number(b.dataset.quick)); err = ""; scrollTo(0, 0); } catch (e2) { err = e2.message; }
      load();
    }));
    const sn = document.getElementById("solonew");
    if (sn) sn.onclick = async () => {
      sn.disabled = true;
      try {
        const r = await fetch("/api/solo/admin/ticket", { method: "POST", headers: { "content-type": "application/json", ...H() }, body: "{}" });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || "Fehler");
        soloMsg = `<p style="margin:0">Solo-Code: <span class="bigcode" style="font-size:26px">${d.code}</span></p><p class="mono small">${location.origin}/spiel/solo.html?c=${d.code}</p><div class="actions-row" style="margin-top:8px"><a class="btn btn-ink" href="/spiel/solo.html?c=${d.code}" target="_blank" rel="noopener">Solo-Fall öffnen</a></div>`;
      } catch (e2) { soloMsg = `<p class="err">${MS.esc(e2.message)}</p>`; }
      load();
    };
    const ql = document.getElementById("qlang"), qd = document.getElementById("qland");
    if (ql) ql.onchange = () => (qLang = ql.value);
    if (qd) qd.onchange = () => (qLand = qd.value);
    const fr = (force) => async () => { try { const d = await MS.api("POST", "admin/feedback-run", { force }, H()); fbMsg = `${d.sent.length} bearbeitet: ` + d.sent.map((x) => `${MS.esc(x.email || "")} ${x.sent ? "✓ gesendet" : "– nicht gesendet (Link oben)"}`).join(", "); } catch (e2) { fbMsg = e2.message; } load(); };
    const b1 = document.getElementById("fbrun"), b2 = document.getElementById("fbforce");
    if (b1) b1.onclick = fr(false);
    if (b2) b2.onclick = fr(true);
    root.querySelectorAll("[data-fbok]").forEach((b) => (b.onclick = async () => { await MS.api("POST", "admin/feedback-approve", { id: b.dataset.fbok, approved: b.dataset.v === "1" }, H()); load(); }));
    const exb = document.getElementById("exbtn");
    if (exb) exb.onclick = async () => {
      const v = document.getElementById("exvon").value, b2 = document.getElementById("exbis").value;
      const r = await fetch(`/api/spiel/admin/export?von=${v}&bis=${b2}`, { headers: H() });
      if (!r.ok) { alert("Export fehlgeschlagen."); return; }
      const a2 = document.createElement("a"); a2.href = URL.createObjectURL(await r.blob()); a2.download = `mordsteam-einnahmen-${v}-bis-${b2}.csv`;
      document.body.append(a2); a2.click(); a2.remove();
    };
    const stc = document.getElementById("stattests");
    if (stc) stc.onchange = () => { statTests = stc.checked; load(); };
    root.querySelectorAll("[data-ship]").forEach((b) => (b.onclick = async () => {
      await MS.api("POST", "admin/order-shipped", { id: b.dataset.ship, undo: !!b.dataset.undo }, H()); load();
    }));
    root.querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => {
      if (!confirm("Diese Runde samt Teams und Ergebnissen endgültig löschen?")) return;
      await MS.api("POST", "admin/delete", { id: b.dataset.del }, H()); load();
    }));
  }

  load();
})();
