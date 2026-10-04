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
      meta = meta || (await MS.api("GET", "admin/meta?case=" + encodeURIComponent(qCase), null, H()));
      const list = await MS.api("GET", "admin/sessions", null, H());
      const ord = await MS.api("GET", "admin/orders", null, H()).catch(() => ({ orders: [] }));
      const st = await MS.api("GET", "admin/stats" + (statTests ? "?tests=1" : ""), null, H()).catch(() => ({ stats: {} }));
      fb = await MS.api("GET", "admin/feedback", null, H()).catch(() => null);
      soloList = await fetch("/api/solo/admin/list", { headers: H() }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      friendsList = await fetch("/api/friends/admin/list", { headers: H() }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      ops = await MS.api("GET", "admin/ops", null, H()).catch(() => null);
      kosten = await MS.api("GET", "admin/kosten", null, H()).catch(() => null);
      kunden = await MS.api("GET", "admin/kunden", null, H()).catch(() => null);
      nlData = await MS.api("GET", "admin/newsletter", null, H()).catch(() => null);
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
  const TN = ["Basic", "Premium", "Premium Plus"], TMIN = [50, 70, 90];
  let qLang = "de", qLand = "AT", qCase = (() => { try { return sessionStorage.getItem("ms_admcase") || "fall-001"; } catch { return "fall-001"; } })();
  async function quickTest(tier) {
    const premium = tier >= 1;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date());
    created = await MS.api("POST", "admin/session", { case_id: qCase, event_date: today, tier, test_mode: true, cast: "fiktiv", lang: qLang, vars: { LAND: qLand } }, H());
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
  let friendsMsg = "", friendsList = null;
  let soloMsg = "", soloList = null, ops = null, last = [[], [], {}];
  let kosten = null, kostenEdit = null, kostenMsg = "";
  let kunden = null, nlData = null, nlMsg = "", nlSyncMsg = "", nlPrev = "", nlForm = { lang: "de" }, kundenAll = false;
  let tab = "uebersicht";
  try { tab = sessionStorage.getItem("ms_admtab") || "uebersicht"; } catch {}
  const TABS = [["uebersicht", "Übersicht"], ["finanzen", "Bestellungen & Finanzen"], ["runden", "Spielrunden & Tests"], ["statistik", "Spielstatistik"], ["system", "Kapazität & System"], ["feedback", "Feedback"], ["kunden", "Kunden & Newsletter"]];
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
      <div class="panel"><div class="eyebrow">Letzte Bestellungen</div>${orders.length ? `<table class="grid small"><tr><th>Zeit</th><th>Kunde</th><th>Produkt</th><th>Betrag</th><th>Status</th></tr>${orders.slice(0, 5).map((o) => `<tr><td>${new Date(o.created_at).toLocaleString("de-AT")}</td><td>${MS.esc((o.contact || {}).name || "")}</td><td>${o.paket === "solo" ? "Solo" : o.paket === "friends" || o.paket === "friends-plus" ? `Friends${o.paket === "friends-plus" ? " Plus" : ""} · ${o.teams} Personen` : `${({ basis: "Basic", premium: "Premium", plus: "Premium Plus" })[o.paket] || o.paket} · ${o.teams} Teams`}</td><td>${eur(o.amount_cents)}</td><td>${o.status}</td></tr>`).join("")}</table>` : `<p class="muted">Noch keine Bestellungen.</p>`}</div>`;
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
    const K = { bestellung: "Bestellbestätigung", solo: "Solo-Bestellung", friends: "Friends-Bestellung", feedback: "Feedback", kontakt: "Kontaktformular", widerruf: "Widerruf (Kunde)", "widerruf-office": "Widerruf (an office)" };
    const A = { "spiel-abfrage": "Spielgeräte fragen Stand ab (hochgerechnet)", spiel: "Spiel (Aktionen)", aria: "ARIA-Chat", solo: "Solo", friends: "Friends", shop: "Shop & Formulare", stripe: "Stripe-Webhook", admin: "Admin", sonstiges: "Sonstiges" };
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
    const CN = { "solo-001": "001 Nachtzug", "solo-002": "002 Applaus", "solo-plus-001": "Plus Jahrgang" };
    const row = (z) => `<tr><td>${CN[z.case_id] || z.case_id} · ${z.test_mode ? "Test" : "Echt"}</td><td>${z.n}</td><td class="mono">${MS.dur(z.avg)}</td><td>${Number(z.hints).toFixed(1)}</td><td>${Number(z.wrong).toFixed(1)}</td></tr>`;
    return `<div class="panel"><div class="eyebrow">Mordsteam Solo (erste Durchgänge)</div>
      <table class="grid small"><tr><th>Fall · Art</th><th>Gelöst</th><th>Ø Endzeit</th><th>Ø Hinweise</th><th>Ø Fehlversuche</th></tr>${soloList.scores.map(row).join("") || `<tr><td colspan="5" class="muted">Noch keine Wertungen.</td></tr>`}</table>
      <p class="small">Endzeit = Spielzeit + Strafminuten. Richtwert: 30 Minuten.</p></div>`;
  }
  // ---------- Feedback ----------
  let fbFilter = "org";
  function feedbackPanel() {
    if (!fb) return "";
    const pub = { no: "nicht veröffentlichen", anon: "anonym erlaubt", name: "mit Namen erlaubt" };
    const A = { spieler: "Spieler/in", geloest: "Gelöst", test: "Test", wiederholung_leicht: "Wiederholung war", wiederholung_lohnt: "Hat sich gelohnt", wiederholung_notiz: "Anmerkung Wiederholung",
      runde: "Runde", team: "Team", geraet: "Gerät", event: "Event bereichert", stimmung: "Stimmung", aufwand: "Aufwand Organisation", best: "Beste Stelle / am meisten Spaß", improve: "Verbessern", difficulty: "Schwierigkeit",
      duration: "Spielzeit", aria: "ARIA", tech: "Technik", players: "Personen", again: "Wieder buchen/spielen", call: "Gespräch" };
    const all = fb.feedback;
    const kind = (f) => (f.variant === "spieler" ? "spieler" : f.paket === "solo" ? "solo" : f.paket === "friends" ? "friends" : "org");
    const homeCount = all.filter((f) => f.home).length;
    const list = all.filter((f) => kind(f) === fbFilter);
    const item = (f) => `<div class="sess">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${f.rating ? "★".repeat(f.rating) : "–"}${f.nps != null ? ` · Empfehlung ${f.nps}/10` : ""} · ${f.variant === "spieler" ? MS.esc(f.answers.team || "") + " · " + MS.esc(f.answers.geraet || "") : f.paket === "friends" ? "Mordsteam Friends · " + MS.esc(f.answers.spieler || "") : f.paket === "solo" ? "Mordsteam Solo" + (f.variant === "solo-replay" ? " · Wiederholung" : "") : MS.esc(f.firma || "–")}${f.answers.test === "ja" ? " (Test)" : ""}</b><span class="chip">${f.variant === "eb" ? "Early Bird" : f.variant === "spieler" ? "Spieler" : f.paket === "solo" ? "Solo" : f.paket === "friends" ? "Friends" : "Organisator"} · ${pub[f.publish] || f.publish}</span></div>
        <div class="small">${new Date(f.created_at).toLocaleString("de-AT")}${f.name ? " · " + MS.esc(f.name) : ""}${f.email ? " · " + MS.esc(f.email) : ""}${f.paket && f.paket !== "solo" ? " · " + f.paket : ""}${f.publish === "name" ? ` · Name: <b>${MS.esc(f.publish_name || "")}</b>` : ""}</div>
        ${f.review ? `<p style="margin:8px 0"><i>„${MS.esc(f.review)}“</i></p>` : ""}
        <div class="small">${Object.entries(f.answers).filter(([k, v]) => v && !["runde", "team", "geraet", "test"].includes(k)).map(([k, v]) => `<b>${A[k] || k}:</b> ${MS.esc(v)}`).join("<br>")}</div>
        ${f.publish !== "no" && f.review ? `<div class="actions-row" style="margin-top:8px"><button class="tipbtn ${f.approved ? "on" : ""}" data-fbok="${f.id}" data-place="page" data-v="${f.approved ? 0 : 1}">${f.approved ? "✓ auf Unterseite" : "Auf Unterseite zeigen"}</button><button class="tipbtn ${f.home ? "on" : ""}" data-fbok="${f.id}" data-place="home" data-v="${f.home ? 0 : 1}">${f.home ? "✓ auf Startseite" : "Auf Startseite zeigen"}</button></div>` : ""}
      </div>`;
    let body;
    if (fbFilter === "spieler") {
      const groups = {};
      for (const f of list) { const sid = f.order_id.split(":")[1]; (groups[sid] = groups[sid] || []).push(f); }
      body = Object.values(groups).map((g) => `<details class="sess" style="padding:0"><summary style="padding:12px 14px;cursor:pointer"><b>${MS.esc(g[0].answers.runde || "Runde")}</b>${g[0].answers.test === "ja" ? " (Test)" : ""} · ${g.length} Antwort${g.length === 1 ? "" : "en"} · Ø ${(g.reduce((a, f) => a + (f.rating || 0), 0) / g.length).toFixed(1)} ★ · ${new Date(g[0].created_at).toLocaleDateString("de-AT")}</summary><div class="list-sessions" style="padding:0 10px 10px">${g.map(item).join("")}</div></details>`).join("");
    } else body = list.map(item).join("");
    const cnt = (k) => all.filter((f) => kind(f) === k).length;
    return `<div class="panel"><div class="eyebrow">Feedback</div>
      <p class="small" style="margin:6px 0">Organisator-Mail am Tag nach dem Spiel: <b>${fb.mail ? "Mailversand eingerichtet" : "Mailversand NICHT eingerichtet – Links unten selbst verschicken"}</b> · Täglicher Lauf: <b>${fb.cron ? "CRON_KEY gesetzt" : "CRON_KEY fehlt"}</b> · ${fb.due.length} Runde(n) fällig</p>
      <div class="actions-row"><button class="btn btn-line" id="fbrun">Fällige jetzt senden</button><button class="btn btn-line" id="fbforce">Test: auch heute beendete sofort</button></div>
      ${fbMsg ? `<p class="small" style="margin-top:8px">${fbMsg}</p>` : ""}
      ${fb.links.length ? `<p class="small" style="margin-top:10px"><b>Nicht per Mail zugestellt – Link selbst schicken:</b><br>${fb.links.map((l) => `${MS.esc(l.email || "")}: <a href="${l.link}" target="_blank" rel="noopener">${location.origin}${l.link}</a>`).join("<br>")}</p>` : ""}
      <p class="small" style="margin-top:10px">Startseite: <b>${homeCount}</b> Stimme(n) ausgewählt – ideal sind 2–3 kurze, echte Lobeshymnen. Unterseite: alle freigegebenen des Produkts (Teams bzw. Solo).</p>
      <div class="chips-row" style="margin:12px 0">${[["org", "Organisatoren"], ["spieler", "Spieler (Teams)"], ["solo", "Solo"], ["friends", "Friends"]].map(([k, l]) => `<button type="button" class="chipbtn ${fbFilter === k ? "on" : ""}" data-fbf="${k}">${l} (${cnt(k)})</button>`).join("")}</div>
      <div class="list-sessions">${body || `<p class="muted">Noch kein Feedback.</p>`}</div></div>`;
  }
  function statsPanel(stats) {
    const lab = { wer: "1 Wer", wann: "2 Wann", warum: "3 Konto", wo: "4 Mappe", helfer: "5 Helfer", fach: "6 Fach", pin: "7 PIN" };
    const f = (x) => (x && x.n ? `${x.median} <span class="muted">(${x.p25}–${x.p75})</span>` : "–");
    const col = (k, g) => g ? `<td>${g.teams} Teams / ${g.runden} Runden</td><td>${g.akt1_geloest} / ${g.teams}${k !== "basis" ? ` · ganz: ${g.ganz_geloest}` : ""}</td><td>${f(g.akt1_min)}</td><td>${f(g.akt2_min)}</td><td>${f(g.finale_min)}</td><td>${f(g.hinweise_akt1)}</td><td>${Object.entries(g.fehler_je_team).map(([q, n]) => `${lab[q] || q}: ${n}`).join("<br>") || "–"}</td>` : `<td colspan="7" class="muted">noch keine Daten</td>`;
    return `<div class="panel"><div class="eyebrow">Statistik (anonym, ab Rundenende)</div>
      <p class="small" style="margin:6px 0">Minuten ab Start: Median (mittlere Hälfte der Teams). Akt 2 und Finale jeweils ab Lösung der Stufe davor. Fehler = falsche Antworten je Frage pro Team.</p>
      <label class="check small"><input type="checkbox" id="stattests" ${statTests ? "checked" : ""}><span>Testrunden einbeziehen</span></label>
      <div style="overflow-x:auto"><table class="grid small"><tr><th>Paket</th><th>Daten</th><th>Akt 1 gelöst</th><th>Akt 1 Min.</th><th>Akt 2 Min.</th><th>Finale Min.</th><th>Hinweise bis Akt 1</th><th>Fehler je Frage</th></tr>
      <tr><th>Basic</th>${col("basis", stats.basis)}</tr><tr><th>Premium</th>${col("premium", stats.premium)}</tr><tr><th>Premium Plus</th>${col("plus", stats.plus)}</tr></table></div></div>`;
  }

  // ---------- Kunden: Wiederkäufe, Gutscheine, Newsletter-Wirkung ----------
  function customersPanel() {
    if (!kunden) return `<div class="panel"><div class="eyebrow">Kunden</div><p class="small">Kundenauswertung konnte nicht geladen werden.</p></div>`;
    const k = kunden.kpi, e = MS.esc, pct = (x) => Math.round(x * 100) + " %";
    const d = (t) => t ? new Date(t).toLocaleDateString("de-AT") : "–";
    const NS = { active: "aktiv", pending: "unbestätigt", unsub: "abgemeldet", ecg: "ECG-Liste", "–": "–" };
    const list = kundenAll ? kunden.list : kunden.list.slice(0, 30);
    return `<div class="panel"><div class="eyebrow">Kunden · kommen sie wieder?</div>
      <div class="tiles" style="margin-top:10px">
        ${tile("Kunden (E-Mail-Adressen)", k.customers, 0, `${n0(k.orders)} bezahlte Bestellungen`)}
        ${tile("Umsatz gesamt", k.cents, 0, `Ø ${eur(k.customers ? k.cents / k.customers : 0)} pro Kunde`, eur)}
        ${tile("Wiederkäufer", k.repeat, 0, `${pct(k.repeat_rate)} der Kunden haben mehr als einmal gekauft`)}
        ${tile("Tage bis zum 2. Kauf", k.days_to_second == null ? 0 : Math.round(k.days_to_second), 0, k.days_to_second == null ? "noch keine Wiederkäufe" : "Median")}
        ${tile("Solo → Gruppe", k.solo_up, 0, `von ${n0(k.solo_first)} Kunden, die mit Solo angefangen haben`)}
        ${tile("Solo-Gutscheine eingelöst", k.voucher_used, 0, `davon ${n0(k.voucher_same)} vom selben Kunden`)}
        ${tile("Bestellungen über Newsletter", k.nl_orders, 0, "Links mit Newsletter-Kürzel")}
      </div>
      ${kunden.list.length ? `<div style="overflow-x:auto;margin-top:12px"><table class="grid small"><tr><th>Kunde</th><th>Käufe</th><th>Umsatz</th><th>Erster / letzter Kauf</th><th>Teams · Friends · Solo</th><th>Gutschein</th><th>Newsletter</th></tr>
        ${list.map((c) => `<tr><td><b>${e(c.name || "–")}</b><br><span class="mono">${e(c.email)}</span>${c.kunde === "b2b" ? ' <span class="chip">Firma</span>' : ""}</td><td>${c.orders}${c.orders > 1 ? " ★" : ""}</td><td class="mono">${eur(c.cents)}</td><td>${d(c.first)}<br>${d(c.last)}</td><td>${c.products.teams} · ${c.products.friends} · ${c.products.solo}</td><td>${c.voucher || "–"}</td><td>${NS[c.news] || e(c.news)}</td></tr>`).join("")}</table></div>
        ${kunden.list.length > 30 ? `<p class="small"><button class="btn btn-line" type="button" id="kall">${kundenAll ? "Nur die letzten 30 zeigen" : `Alle ${kunden.list.length} zeigen`}</button></p>` : ""}` : `<p class="small" style="margin-top:10px">Noch keine bezahlten Bestellungen.</p>`}
      <p class="small" style="margin-top:8px">Gezählt werden bezahlte Bestellungen, zusammengefasst nach E-Mail-Adresse. ★ = mehr als ein Kauf.</p></div>
    <div class="panel"><div class="eyebrow">Werbung · bringt sie Bestellungen?</div>
      ${(kunden.sources || []).length ? `<div style="overflow-x:auto;margin-top:10px"><table class="grid small"><tr><th>Herkunft</th><th>Besuche<br>30 Tage / gesamt</th><th>Bestellungen<br>30 Tage / gesamt</th><th>Umsatz<br>30 Tage / gesamt</th><th>Werbekosten<br>letzte 30 Tage</th><th>Kosten je Bestellung</th><th>Umsatz je € Werbung</th></tr>
        ${kunden.sources.map((s, i) => `<tr><td class="mono"><b>${e(s.src)}</b>${s.src === "gads" ? "<br>Google Ads" : s.src === "meta" ? "<br>Facebook/Instagram" : s.src === "linkedin" ? "<br>LinkedIn" : s.src === "bing" ? "<br>Microsoft Ads" : ""}</td><td>${n0(s.visits30)} / ${n0(s.visits)}</td><td>${n0(s.orders30)} / ${n0(s.orders)}${s.visits30 ? `<br><span class="small">${(s.orders30 / s.visits30 * 100).toFixed(1).replace(".", ",")} % kaufen</span>` : ""}</td><td class="mono">${eur(s.cents30)} / ${eur(s.cents)}</td>
          <td><input class="srccost" data-i="${i}" inputmode="decimal" placeholder="z. B. 500" style="width:90px"> €</td><td class="mono" id="srccpo${i}">–</td><td class="mono" id="srcroas${i}">–</td></tr>`).join("")}</table></div>
        <p class="small">Werbekosten der letzten 30 Tage aus dem Werbekonto abschreiben (Google Ads: Kampagnen → Kosten, Zeitraum „Letzte 30 Tage“); sie werden nicht gespeichert. Rechnet sich Werbung, ist der Umsatz je € Werbung über 1,20 (wegen 20 % Reverse Charge).</p>`
        : `<p class="small" style="margin-top:10px">Noch keine Besuche über Werbung. Im Google-Ads-Konto unter <b>Verwaltung → Kontoeinstellungen → Tracking → Suffix der finalen URL</b> <span class="mono">src=gads</span> eintragen. Klicks mit Google-Kennung (gclid) werden auch ohne Suffix als <span class="mono">gads</span> gezählt.</p>`}
    </div>`;
  }

  // ---------- Newsletter: Liste, ECG-Abgleich, Entwurf ----------
  function newsletterPanel() {
    const n = nlData, e = MS.esc;
    if (!n) return `<div class="panel"><div class="eyebrow">Newsletter</div><p class="small">Newsletter-Daten konnten nicht geladen werden.</p></div>`;
    const c = (src, st) => n.counts.filter((x) => (!src || x.source === src) && x.status === st).reduce((a, x) => a + x.n, 0);
    const synced = n.counts.filter((x) => x.status === "active").reduce((a, x) => a + (x.synced || 0), 0);
    const active = c(null, "active");
    const ecgAge = n.ecg.at ? Math.floor((Date.now() - n.ecg.at) / 86400000) : null;
    const f = nlForm, v = (x) => e(f[x] || "");
    return `<div class="panel"><div class="eyebrow">Newsletter · Liste</div>
      <div class="tiles" style="margin-top:10px">
        ${tile("Empfänger aktiv", active, 0, `${n0(c("kunde", "active"))} Kunden · ${n0(c("anmeldung", "active"))} Anmeldungen`)}
        ${tile("In Resend übertragen", synced, 0, active - synced > 0 ? `${active - synced} noch offen` : "alles übertragen")}
        ${tile("Unbestätigt", c("anmeldung", "pending"), 0, "Bestätigungslink noch nicht geklickt")}
        ${tile("Gesperrt / abgemeldet", c(null, "ecg") + c(null, "unsub"), 0, `${n0(c(null, "ecg"))} ECG-Liste · ${n0(c(null, "unsub"))} abgemeldet`)}
      </div>
      ${!n.key ? `<p class="err">RESEND_API_KEY fehlt – Übertragung und Entwürfe gehen erst, wenn der Schlüssel gesetzt ist.</p>` : ""}
      ${n.errors.length ? `<p class="err">Letzter Übertragungsfehler: ${e(n.errors[0].sync_error)}</p>` : ""}
      <div class="actions-row" style="margin-top:10px"><button class="btn btn-red" type="button" id="nlsync">Kunden nachtragen und übertragen</button></div>
      ${nlSyncMsg ? `<p class="small"><b>${e(nlSyncMsg)}</b></p>` : ""}
      <p class="small">Neue Kunden und bestätigte Anmeldungen werden automatisch übertragen. Der Knopf trägt ältere Bestellungen nach und wiederholt Fehlgeschlagenes. Wer sich bei Resend abgemeldet hat, wird nie wieder aufgenommen.</p>

      <div class="eyebrow" style="margin-top:18px">ECG-Liste der RTR</div>
      ${n.ecg.api ? `<p class="small"><b style="color:#2E6B3A">Automatisch:</b> Jede Kundenadresse wird vor der Übertragung über die Schnittstelle der RTR geprüft (Secret ECG_API_KEY). Ein Datei-Upload ist nicht nötig.</p>` : ""}
      <p class="small">${n.ecg.at ? `Stand: ${new Date(n.ecg.at).toLocaleDateString("de-AT")} · ${n0(n.ecg.count)} Einträge${ecgAge > 30 ? ` · <b style="color:var(--red)">älter als 30 Tage – vor dem nächsten Newsletter neu hochladen</b>` : ""}` : (n.ecg.api ? "Datei-Upload nur als Ersatz, falls die Schnittstelle ausfällt." : `<b style="color:var(--red)">Weder Schnittstelle (ECG_API_KEY) noch Liste vorhanden.</b> Ohne Prüfung werden Kunden ungeprüft übertragen.`)}</p>
      <p class="small">Die Datei <span class="mono">ecg-liste.hash</span> bekommst du bei der RTR. Hochladen ersetzt die alte Liste; Kunden, die jetzt auf der Liste stehen, werden automatisch aus Resend entfernt.</p>
      <div class="actions-row"><input type="file" id="ecgfile" accept=".hash,application/octet-stream"><button class="btn btn-line" type="button" id="ecgup">Liste hochladen</button></div>
      <p class="small" id="ecgout"></p>

      <div class="eyebrow" style="margin-top:18px">Wirkung je Newsletter</div>
      ${n.tags.length ? `<table class="grid small" style="margin-top:6px"><tr><th>Kürzel</th><th>Besuche</th><th>Bestellungen</th><th>Umsatz</th></tr>${n.tags.map((t) => `<tr><td class="mono">${e(t.tag)}</td><td>${n0(t.visits)}</td><td>${n0(t.orders)}</td><td class="mono">${eur(t.cents)}</td></tr>`).join("")}</table>
        <p class="small">Öffnungen und Klicks zeigt Resend unter Broadcasts. Besuche = Aufrufe der Website über einen Newsletter-Link.</p>` : `<p class="small">Noch kein Newsletter verschickt.</p>`}
    </div>
    <div class="panel"><div class="eyebrow">Newsletter schreiben</div>
      <p class="small" style="margin:6px 0 10px">Hier schreiben, Vorschau prüfen, dann als Entwurf an Resend schicken. Abgeschickt wird in Resend unter <b>Broadcasts</b>: Entwurf öffnen, an dich selbst testen, dann „Send“. Je Sprache ein eigener Entwurf (Deutsch und Englisch haben getrennte Listen).</p>
      <form id="nlform" class="form">
        <div class="two"><div class="field"><label>Kürzel *</label><input name="tag" placeholder="2026-12" maxlength="40" value="${v("tag")}"><span class="hint">Wird an alle Links zu mordsteam.com gehängt. Kleinbuchstaben, Ziffern, Bindestrich.</span></div>
        <div class="field"><label>Sprache</label><select name="lang"><option value="de" ${f.lang !== "en" ? "selected" : ""}>Deutsch</option><option value="en" ${f.lang === "en" ? "selected" : ""}>Englisch</option></select></div></div>
        <div class="field"><label>Betreff *</label><input name="subject" maxlength="150" value="${v("subject")}"></div>
        <div class="field"><label>Vorschautext</label><input name="preheader" maxlength="150" placeholder="Erscheint im Postfach neben dem Betreff" value="${v("preheader")}"></div>
        <div class="field"><label>Überschrift</label><input name="headline" maxlength="120" value="${v("headline")}"></div>
        <div class="field"><label>Text *</label><textarea name="text" rows="9">${v("text")}</textarea><span class="hint">Leerzeile = neuer Absatz · „- “ am Zeilenanfang = Aufzählung · **fett** · [Linktext](https://mordsteam.com/…)</span></div>
        <div class="two"><div class="field"><label>Knopf-Text</label><input name="button" maxlength="60" placeholder="z. B. Zum neuen Fall" value="${v("button")}"></div>
        <div class="field"><label>Knopf-Link</label><input name="button_url" maxlength="300" placeholder="https://mordsteam.com/teams.html" value="${v("button_url")}"></div></div>
        <div class="actions-row"><button class="btn btn-line" type="button" id="nlprev">Vorschau</button><button class="btn btn-red" type="submit">Als Entwurf an Resend</button></div>
        <p class="small">${e(nlMsg)}</p>
      </form>
      ${nlPrev ? `<iframe title="Vorschau" style="width:100%;height:640px;border:1px solid #ddd;border-radius:8px;margin-top:10px;background:#fff" srcdoc="${e(nlPrev)}"></iframe>` : ""}
      ${n.drafts.length ? `<div class="eyebrow" style="margin-top:14px">Entwürfe in Resend</div><table class="grid small"><tr><th>Datum</th><th>Kürzel</th><th>Sprache</th><th>Betreff</th></tr>${n.drafts.map((x) => `<tr><td>${new Date(x.created_at).toLocaleDateString("de-AT")}</td><td class="mono">${e(x.tag)}</td><td>${x.lang.toUpperCase()}</td><td>${e(x.subject)}</td></tr>`).join("")}</table>` : ""}
    </div>`;
  }

  // ---------- Ausgaben: Kostenliste (Checkliste für die E/A-Rechnung) ----------
  function costsPanel() {
    if (!kosten) return `<div class="panel"><div class="eyebrow">Ausgaben</div><p class="small">Kostenliste konnte nicht geladen werden.</p></div>`;
    const money = (c, w) => c == null ? "<i>offen</i>" : (c / 100).toLocaleString("de-AT", { minimumFractionDigits: 2 }) + (w === "USD" ? " $" : " €");
    const A = kosten.arten, e = MS.esc;
    const rows = kosten.items.map((x) => `<tr>
      <td><b>${e(x.name)}</b>${x.anbieter ? `<br><span class="small">${e(x.anbieter)}</span>` : ""}</td>
      <td>${e(A[x.art] || x.art)}${x.seit ? `<br><span class="small">seit ${e(x.seit)}</span>` : ""}</td>
      <td class="mono">${x.art === "nutzung" && x.betrag_cents == null ? "<span class=\"small\">laut Rechnung</span>" : money(x.betrag_cents, x.waehrung)}</td>
      <td style="white-space:nowrap">${x.anteil == null ? "<i>offen</i>" : x.anteil + "&nbsp;%"}</td>
      <td class="small">${e(x.beleg || "")}${x.hinweis ? `<br><i>${e(x.hinweis)}</i>` : ""}</td>
      <td><button class="btn btn-line" type="button" data-kedit="${e(x.id)}">Ändern</button></td></tr>`).join("");
    const sums = Object.entries(kosten.sums).map(([w, s]) => `${money(Math.round(s.year_full / 12), w)} pro Monat · ${money(s.year_full, w)} pro Jahr (betrieblich: ${money(s.year_business, w)} pro Jahr)`).join("<br>");
    const k = kostenEdit || {};
    const opt = (v, cur) => Object.entries(A).map(([key, l]) => `<option value="${key}" ${key === cur ? "selected" : ""}>${l}</option>`).join("");
    const val = (v) => (v == null ? "" : e(String(v)));
    return `<div class="panel"><div class="eyebrow">Ausgaben · was wir absetzen können</div>
      <p class="small" style="margin:6px 0 10px">Checkliste aller Kosten, damit nichts vergessen wird. Die einzelnen Zahlungen mit Datum kommen später in die E/A-Rechnung. „Anteil“ = betrieblich genutzter Teil; bei gemischter Nutzung (privat und Mordsteam) nur dieser Teil absetzbar.${kosten.open ? ` <b>${kosten.open} Posten mit offenem Betrag oder Anteil.</b>` : ""}</p>
      <div style="overflow-x:auto"><table class="grid small"><tr><th>Posten</th><th>Rhythmus</th><th>Betrag</th><th>Anteil</th><th>Beleg · Hinweis</th><th></th></tr>${rows}</table></div>
      <p class="small" style="margin-top:8px"><b>Fixkosten mit bekanntem Betrag:</b><br>${sums || "–"}</p>
      <form id="kform" class="form" style="margin-top:14px;border-top:1px solid var(--line, #ddd);padding-top:12px">
        <div class="eyebrow">${k.id ? "Posten ändern" : "Neuer Posten"}</div>
        <input type="hidden" name="id" value="${val(k.id)}">
        <div class="two"><div class="field"><label>Name *</label><input name="name" maxlength="120" value="${val(k.name)}"></div>
        <div class="field"><label>Anbieter</label><input name="anbieter" maxlength="80" value="${val(k.anbieter)}"></div></div>
        <div class="two"><div class="field"><label>Rhythmus</label><select name="art">${opt(0, k.art || "monatlich")}</select></div>
        <div class="field"><label>Betrag (leer = offen)</label><div style="display:flex;gap:6px"><input name="betrag" inputmode="decimal" placeholder="z. B. 149,99" value="${k.betrag_cents == null ? "" : (k.betrag_cents / 100).toFixed(2).replace(".", ",")}"><select name="waehrung"><option ${k.waehrung !== "USD" ? "selected" : ""}>EUR</option><option ${k.waehrung === "USD" ? "selected" : ""}>USD</option></select></div></div></div>
        <div class="two"><div class="field"><label>Betrieblicher Anteil in % (leer = offen)</label><input name="anteil" inputmode="numeric" value="${val(k.anteil)}"></div>
        <div class="field"><label>Seit (JJJJ-MM oder JJJJ-MM-TT)</label><input name="seit" placeholder="2026-09" value="${val(k.seit)}"></div></div>
        <div class="field"><label>Wo liegt der Beleg?</label><input name="beleg" maxlength="300" value="${val(k.beleg)}"></div>
        <div class="field"><label>Hinweis</label><input name="hinweis" maxlength="500" value="${val(k.hinweis)}"></div>
        <div class="actions-row"><button class="btn btn-red" type="submit">Speichern</button>${k.id ? `<button class="btn btn-line" type="button" id="kcancel">Abbrechen</button><button class="btn btn-ghost" type="button" id="kdel">Posten löschen</button>` : ""}</div>
        <p class="err">${e(kostenMsg)}</p>
      </form></div>`;
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
        <button class="btn btn-line" id="exbtn" type="button">Einnahmen exportieren (CSV)</button>
        <button class="btn btn-line" id="bhbtn" type="button">Buchhaltung: Übersicht</button></div>
      <div id="bhout"></div>
      <p style="margin:8px 0">${paid.length} bezahlt · Umsatz ${eur(paid.reduce((a, o) => a + o.amount_cents, 0))}</p>
      <div class="list-sessions">${orders.length ? orders.map((o) => {
        const c = o.contact || {}, l = c.liefer;
        return `<div class="sess">
          <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${o.paket === "solo" ? "Mordsteam Solo" : o.paket === "friends" ? "Mordsteam Friends" : o.paket === "friends-plus" ? "Mordsteam Friends Plus" : MS.esc(o.firma || "–")}</b><span class="chip ${o.status === "fulfilled" ? "open" : ""}">${(o.paket === "solo" || o.paket === "friends" || o.paket === "friends-plus") && o.status === "fulfilled" ? "bezahlt · Runde angelegt" : lbl[o.status] || o.status}</span></div>
          <div class="mono">${new Date(o.created_at).toLocaleString("de-AT")} · ${o.paket === "solo" ? `SOLO · ${eur(o.amount_cents)}${o.solo_code ? ` · Solo-Code ${o.solo_code}` : ""}` : o.paket === "friends" || o.paket === "friends-plus" ? `FRIENDS${o.paket === "friends-plus" ? " PLUS" : ""} · ${o.teams} Personen · ${eur(o.amount_cents)}${o.friends_org ? ` · <a href="/spiel/friends.html?o=${o.friends_org}" target="_blank" rel="noopener">Organisator-Seite</a>` : ""}` : `${({ basis: "Basic", premium: "PREMIUM", plus: "PREMIUM PLUS" })[o.paket] || o.paket} · ${o.teams} Teams · ${eur(o.amount_cents)} · gekauft ${o.event_date}${o.join_code ? ` · Spielcode ${o.join_code} · Organisator ${o.org_code}` : ""}`}</div>
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
      <div class="panel"><div class="eyebrow">Mordsteam Friends · Testgruppe</div>
        <p style="margin:8px 0 14px">Legt eine Gruppe „Letzte Runde auf der Hütte“ mit Testnamen (Anna, Bernd, Clara …) an. Du bekommst einen Organisator-Link und einen Einladungslink. Mit mehreren Browserfenstern kannst du mehrere Spieler spielen; in Testgruppen darf der Organisator jederzeit auflösen.</p>
        <div class="actions-row"><label class="small">Spieler <select id="frn">${[4, 5, 6, 7, 8].map((n) => `<option ${n === 6 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          <label class="small">Spielart <select id="frm"><option value="live">gleichzeitig</option><option value="week">über 3 Tage</option></select></label>
          <label class="small">Variante <select id="frv"><option value="">Krimiabend</option><option value="plus">Plus (KI-Verhörraum)</option></select></label>
          <label class="small">Sprache <select id="frl"><option value="de">Deutsch</option><option value="en">Englisch</option></select></label>
          <button class="btn btn-red" id="frnew">Friends-Testgruppe anlegen</button></div>
        ${friendsMsg ? `<div style="margin-top:12px">${friendsMsg}</div>` : ""}
        ${friendsList && friendsList.groups.length ? `<details style="margin-top:12px"><summary>Letzte Friends-Gruppen (${friendsList.groups.length})</summary><table class="grid" style="margin-top:8px"><tr><th>Gruppe</th><th>Spielart</th><th>Status</th><th>Verbunden</th><th>Gelöst</th><th>Ø Endzeit</th><th>Links</th></tr>
          ${friendsList.groups.map((x) => `<tr><td class="mono">${x.id}${x.test_mode ? " (Test)" : ""}</td><td>${x.mode === "live" ? "gleichzeitig" : "Woche"}${x.plus ? " · Plus" : ""}</td><td>${({ ready: "wartet auf Start", running: "läuft", revealed: "aufgelöst" })[x.status] || x.status}</td><td>${x.joined} / ${x.n}</td><td>${x.solved}</td><td class="mono">${x.avg ? MS.dur(x.avg) : "–"}</td><td><a href="/spiel/friends.html?o=${x.org_token}" target="_blank" rel="noopener">Organisator</a> · <a href="/spiel/friends.html?e=${x.invite}" target="_blank" rel="noopener">Einladung</a></td></tr>`).join("")}</table></details>` : ""}</div>
      <div class="panel"><div class="eyebrow">Mordsteam Solo · Testcode</div>
        <p style="margin:8px 0 14px">Legt einen Solo-Code im Testmodus an (eigene Wertung, getrennt von echten Spielen; mit „+5 Min.“-Knopf).</p>
        <div class="actions-row"><label class="small">Fall <select id="solocase"><option value="solo-001">001 · Nachtzug nach Venedig</option><option value="solo-002">002 · Applaus für einen Toten</option><option value="solo-plus-001">Plus · Der letzte Jahrgang (KI)</option></select></label><label class="small">Sprache <select id="solol"><option value="de">Deutsch</option><option value="en">Englisch</option></select></label><button class="btn btn-red" id="solonew" data-test="1">Solo-Testcode anlegen</button><button class="btn btn-line" id="solonew2" data-test="0">Solo-Code für Tester (ohne Vorspulen)</button></div>
        <p class="small" style="margin-top:6px">Tester-Codes verhalten sich wie gekaufte Codes: kein „+5 Min.“, sie zählen in der echten Wertung und ihr Gutschein ist ein echter Stripe-Code.</p>
        ${soloMsg ? `<div style="margin-top:12px">${soloMsg}</div>` : ""}
        ${soloList && soloList.tickets.length ? `<details style="margin-top:12px"><summary>Letzte Solo-Codes (${soloList.tickets.length})</summary><table class="grid" style="margin-top:8px"><tr><th>Code</th><th>Fall</th><th>Name</th><th>Test</th><th>Durchgänge</th><th>Erste Zeit</th><th>Gutschein</th></tr>
          ${soloList.tickets.map((x) => `<tr><td class="mono"><a href="/spiel/solo.html?c=${x.code}" target="_blank" rel="noopener">${x.code}</a></td><td>${MS.esc((x.case_id || "").replace("solo-", ""))}</td><td>${MS.esc(x.name || "–")}</td><td>${x.test_mode ? "ja" : "nein"}</td><td>${x.runs}</td><td class="mono">${x.score ? MS.dur(x.score) : "–"}</td><td class="mono">${MS.esc(x.voucher || "–")}${x.voucher ? (x.voucher_synced ? " ✓ Stripe" : " (nicht in Stripe)") : ""}</td></tr>`).join("")}</table>
          <p class="small">${soloList.scores.map((z) => `${(z.case_id || "").replace("solo-", "")} ${z.test_mode ? "Test" : "Echt"}: ${z.n} Wertungen, Ø ${MS.dur(z.avg)}, Ø ${Number(z.hints).toFixed(1)} Hinweise, Ø ${Number(z.wrong).toFixed(1)} Fehlversuche`).join(" · ") || "Noch keine Wertungen."}</p></details>` : ""}
      </div>
      <div class="panel"><div class="eyebrow">Schnelltest</div>
        <p style="margin:8px 0 14px">Ein Klick: Runde mit fiktiver Besetzung anlegen (Land und Spielsprache wählbar), Fall öffnen und dich als Organisator anmelden.</p>
        <div class="field" style="margin-bottom:12px"><label for="qcase">Teams-Fall (gilt auch für „Eigene Runde“)</label><select id="qcase">${meta.cases.map((c) => `<option value="${c.id}" ${c.id === qCase ? "selected" : ""}>${c.id} · ${MS.esc(c.title)} (${MS.esc(c.audience || "")})</option>`).join("")}</select></div>
        <div class="two" style="margin-bottom:12px"><div class="field"><label for="qlang">Spielsprache</label><select id="qlang">${meta.langs.map((l) => `<option value="${l}" ${l === qLang ? "selected" : ""}>${l === "en" ? "Englisch" : "Deutsch"}</option>`).join("")}</select></div>
        <div class="field"><label for="qland">Land</label><select id="qland">${meta.countries.map((c) => `<option value="${c.code}" ${c.code === qLand ? "selected" : ""}>${MS.esc(c.de)} (${c.code})</option>`).join("")}</select></div></div>
        <div class="actions-row"><button class="btn btn-red" data-quick="0">Basic (50 Min.)</button><button class="btn btn-line" data-quick="1">Premium (70 Min.)</button><button class="btn btn-line" data-quick="2">Premium Plus (90 Min., ARIA)</button></div>
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
        <div class="field"><label for="tier">Paket</label><select id="tier" name="tier"><option value="0">Basic – 50 Min., Akt 1</option><option value="1">Premium – 70 Min., Akt 1 + 2</option><option value="2">Premium Plus – 90 Min., Akt 1 + 2 + Finale mit ARIA</option></select></div>
        <h3 style="margin-top:8px">Personalisierung</h3>
        <p class="small">Leere Felder bekommen den Beispielwert (grau). Basic nutzt Verdächtige 1–5, Premium 1–6. Wer Täter/in ist, entscheidet der Zufall.</p>
        <div class="two">${meta.fields.map((f) => `<div class="field"><label for="f_${f.key}">${MS.esc(f.label)}</label>${f.type === "anrede"
          ? `<select id="f_${f.key}" name="${f.key}">${["Frau", "Herr"].map((o) => `<option ${o === f.example ? "selected" : ""}>${o}</option>`).join("")}</select>`
          : f.type === "select" ? `<select id="f_${f.key}" name="${f.key}">${(f.options || []).map((o) => `<option value="${o[0]}">${MS.esc(o[1])}</option>`).join("")}</select>`
          : `<input id="f_${f.key}" name="${f.key}" placeholder="${MS.esc(f.example)}" maxlength="80">`}</div>`).join("")}</div>
        <div><button class="btn btn-red" type="submit">Runde anlegen</button></div>
        <p class="err">${MS.esc(err)}</p>
      </form></div>` : ""}
      ${tab === "uebersicht" ? overviewPanel(orders) : ""}
      ${tab === "finanzen" ? ordersPanel(orders) + costsPanel() : ""}
      ${tab === "statistik" ? statsPanel(stats) + soloStatsPanel() : ""}
      ${tab === "system" ? systemPanel() : ""}
      ${tab === "feedback" ? feedbackPanel() : ""}
      ${tab === "kunden" ? customersPanel() + newsletterPanel() : ""}
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
          case_id: qCase, test_mode: f.test_mode.checked, tier: Number(f.tier.value), lang: f.elements.lang.value, vars,
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
    ["solonew", "solonew2"].map((id) => document.getElementById(id)).filter(Boolean).forEach((sn) => sn.onclick = async () => {
      sn.disabled = true;
      try {
        const r = await fetch("/api/solo/admin/ticket", { method: "POST", headers: { "content-type": "application/json", ...H() }, body: JSON.stringify({ test: sn.dataset.test === "1", case: (document.getElementById("solocase") || {}).value || "solo-001", lang: (document.getElementById("solol") || {}).value || "de" }) });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || "Fehler");
        soloMsg = `<p style="margin:0">${sn.dataset.test === "1" ? "Solo-Testcode" : "Solo-Code für Tester"}: <span class="bigcode" style="font-size:26px">${d.code}</span></p><p class="mono small">${location.origin}/spiel/solo.html?c=${d.code}</p><div class="actions-row" style="margin-top:8px"><a class="btn btn-ink" href="/spiel/solo.html?c=${d.code}" target="_blank" rel="noopener">Solo-Fall öffnen</a></div>`;
      } catch (e2) { soloMsg = `<p class="err">${MS.esc(e2.message)}</p>`; }
      load();
    });
    const frnew = document.getElementById("frnew");
    if (frnew) frnew.onclick = async () => {
      frnew.disabled = true;
      try {
        const r = await fetch("/api/friends/admin/group", { method: "POST", headers: { "content-type": "application/json", ...H() }, body: JSON.stringify({ n: Number(document.getElementById("frn").value), mode: document.getElementById("frm").value, days: 3, test: true, plus: document.getElementById("frv").value === "plus", lang: (document.getElementById("frl") || {}).value || "de" }) });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || "Fehler");
        friendsMsg = `<p style="margin:0">Friends-Testgruppe <b class="mono">${d.id}</b></p><p class="mono small">Organisator: ${location.origin}/spiel/friends.html?o=${d.org}<br>Einladung: ${location.origin}/spiel/friends.html?e=${d.invite}</p><div class="actions-row" style="margin-top:8px"><a class="btn btn-ink" href="/spiel/friends.html?o=${d.org}" target="_blank" rel="noopener">Organisator-Ansicht öffnen</a><a class="btn btn-line" href="/spiel/friends.html?e=${d.invite}" target="_blank" rel="noopener">Als Spieler beitreten</a></div>`;
      } catch (e2) { friendsMsg = `<p class="err">${MS.esc(e2.message)}</p>`; }
      load();
    };
    const ql = document.getElementById("qlang"), qd = document.getElementById("qland");
    if (ql) ql.onchange = () => (qLang = ql.value);
    const qc = document.getElementById("qcase");
    if (qc) qc.onchange = () => { qCase = qc.value; try { sessionStorage.setItem("ms_admcase", qCase); } catch {} meta = null; load(); };
    if (qd) qd.onchange = () => (qLand = qd.value);
    const fr = (force) => async () => { try { const d = await MS.api("POST", "admin/feedback-run", { force }, H()); fbMsg = `${d.sent.length} bearbeitet: ` + d.sent.map((x) => `${MS.esc(x.email || "")} ${x.sent ? "✓ gesendet" : "– nicht gesendet (Link oben)"}`).join(", "); } catch (e2) { fbMsg = e2.message; } load(); };
    const b1 = document.getElementById("fbrun"), b2 = document.getElementById("fbforce");
    if (b1) b1.onclick = fr(false);
    if (b2) b2.onclick = fr(true);
    root.querySelectorAll("[data-fbok]").forEach((b) => (b.onclick = async () => { await MS.api("POST", "admin/feedback-approve", { id: b.dataset.fbok, place: b.dataset.place, approved: b.dataset.v === "1" }, H()); load(); }));
    root.querySelectorAll("[data-fbf]").forEach((b) => (b.onclick = () => { fbFilter = b.dataset.fbf; render(...last); }));
    const exb = document.getElementById("exbtn");
    if (exb) exb.onclick = async () => {
      const v = document.getElementById("exvon").value, b2 = document.getElementById("exbis").value;
      const r = await fetch(`/api/spiel/admin/export?von=${v}&bis=${b2}`, { headers: H() });
      if (!r.ok) { alert("Export fehlgeschlagen."); return; }
      const a2 = document.createElement("a"); a2.href = URL.createObjectURL(await r.blob()); a2.download = `mordsteam-einnahmen-${v}-bis-${b2}.csv`;
      document.body.append(a2); a2.click(); a2.remove();
    };
    root.querySelectorAll("[data-kedit]").forEach((b) => (b.onclick = () => { kostenEdit = kosten.items.find((x) => x.id === b.dataset.kedit) || null; kostenMsg = ""; render(...last); const f = document.getElementById("kform"); if (f) f.scrollIntoView({ behavior: "smooth" }); }));
    const kf = document.getElementById("kform");
    if (kf) {
      kf.onsubmit = async (ev) => {
        ev.preventDefault();
        const d = Object.fromEntries(new FormData(kf).entries());
        try { kosten = await MS.api("POST", "admin/kosten", d, H()); kostenEdit = null; kostenMsg = ""; } catch (e2) { kostenMsg = e2.message; }
        render(...last);
      };
      const kc = document.getElementById("kcancel"); if (kc) kc.onclick = () => { kostenEdit = null; kostenMsg = ""; render(...last); };
      const kd = document.getElementById("kdel"); if (kd) kd.onclick = async () => {
        if (!confirm("Diesen Posten aus der Liste löschen?")) return;
        kosten = await MS.api("POST", "admin/kosten/loeschen", { id: kostenEdit.id }, H()); kostenEdit = null; render(...last);
      };
    }
    const bhb = document.getElementById("bhbtn");
    if (bhb) bhb.onclick = async () => {
      const out = document.getElementById("bhout"); out.innerHTML = `<p class="small">Lade … (holt fehlende Gebühren und Länder bei Stripe)</p>`;
      try {
        const v = document.getElementById("exvon").value, b2 = document.getElementById("exbis").value;
        const d = await MS.api("GET", `admin/buchhaltung?von=${v}&bis=${b2}`, null, H());
        const eu = (c) => (c / 100).toLocaleString("de-AT", { minimumFractionDigits: 2 }) + " €";
        const RL = { inland: "Inland (AT)", eu: "EU-Ausland", drittland: "Nicht-EU-Ausland", unbekannt: "Land unbekannt" };
        const order = ["unternehmen:inland", "unternehmen:eu", "unternehmen:drittland", "unternehmen:unbekannt", "privat:inland", "privat:eu", "privat:drittland", "privat:unbekannt"];
        const G = Object.fromEntries(d.groups.map((g) => [g.kunde + ":" + g.region, g]));
        const rows = order.filter((k) => G[k] || !k.endsWith("unbekannt")).map((k) => { const g = G[k] || { count: 0, gross: 0, fee: 0, net: 0 }; const [kd, rg] = k.split(":");
          return `<tr><td>${kd === "unternehmen" ? "Unternehmen" : "Privat"}</td><td>${RL[rg]}</td><td>${g.count}</td><td class="mono">${eu(g.gross)}</td><td class="mono">${eu(g.fee)}</td><td class="mono">${eu(g.net)}</td></tr>`; }).join("");
        const sum = d.groups.reduce((a, g) => ({ c: a.c + g.count, g: a.g + g.gross, f: a.f + g.fee, n: a.n + g.net }), { c: 0, g: 0, f: 0, n: 0 });
        const pct = Math.round((d.eu_b2c.cents / d.eu_b2c.limit) * 100);
        out.innerHTML = `<table class="grid small" style="margin-top:10px"><tr><th>Kundenart</th><th>Region</th><th>Anzahl</th><th>Einnahmen brutto</th><th>Stripe-Gebühren</th><th>Auszahlung netto</th></tr>${rows}
          <tr><th colspan="2">Summe</th><th>${sum.c}</th><th class="mono">${eu(sum.g)}</th><th class="mono">${eu(sum.f)}</th><th class="mono">${eu(sum.n)}</th></tr></table>
          <p class="small" style="margin-top:8px"><b>EU-Privatkunden ${d.eu_b2c.year}:</b> ${eu(d.eu_b2c.cents)} von 10.000,00 € (${pct} %)${pct >= 80 ? ` <b style="color:var(--red)">– Schwelle fast erreicht: mit Steuerberater klären (OSS)!</b>` : ""}</p>
          <p class="small">Region nach dem Rechnungsland aus Stripe. Unternehmen = als Unternehmen bestellt oder UID angegeben. Stripe-Gebühren sind eigene Ausgaben (Rechnung bzw. Gebührenaufstellung von Stripe).</p>`;
      } catch (e2) { out.innerHTML = `<p class="err">${MS.esc(e2.message)}</p>`; }
    };

    // Kunden & Newsletter
    const kall = document.getElementById("kall"); if (kall) kall.onclick = () => { kundenAll = !kundenAll; render(...last); };
    document.querySelectorAll(".srccost").forEach((inp) => (inp.oninput = () => {
      const s = kunden.sources[+inp.dataset.i], cost = parseFloat(String(inp.value).replace(",", ".")) || 0;
      document.getElementById("srccpo" + inp.dataset.i).textContent = cost && s.orders30 ? eur(cost * 100 / s.orders30) : "–";
      document.getElementById("srcroas" + inp.dataset.i).textContent = cost ? (s.cents30 / 100 / cost).toFixed(2).replace(".", ",") : "–";
    }));
    const nls = document.getElementById("nlsync");
    if (nls) nls.onclick = async () => {
      nls.disabled = true; nls.textContent = "Überträgt …";
      try { const d = await MS.api("POST", "admin/newsletter/sync", {}, H()); alertBox(`Übertragen: ${d.ok} · ECG-Liste: ${d.ecg} · abgemeldet: ${d.unsub}${d.errors ? ` · Fehler: ${d.errors} (${d.error})` : ""}`); }
      catch (e2) { alertBox(e2.message); }
      load();
    };
    const nlf = document.getElementById("nlform");
    if (nlf) {
      const grab = () => (nlForm = Object.fromEntries(new FormData(nlf).entries()));
      document.getElementById("nlprev").onclick = async () => {
        grab();
        try { const d = await MS.api("POST", "admin/newsletter/entwurf", { ...nlForm, preview: true }, H()); nlPrev = d.html; nlMsg = ""; } catch (e2) { nlMsg = e2.message; }
        render(...last);
      };
      nlf.onsubmit = async (ev) => {
        ev.preventDefault(); grab();
        if (!confirm(`Entwurf „${nlForm.subject}“ (${nlForm.lang === "en" ? "Englisch" : "Deutsch"}) an Resend schicken? Verschickt wird erst, wenn du ihn in Resend absendest.`)) return;
        try { const d = await MS.api("POST", "admin/newsletter/entwurf", nlForm, H()); nlPrev = d.html; nlMsg = "Entwurf liegt jetzt in Resend unter Broadcasts. Dort an dich selbst testen und dann senden."; } catch (e2) { nlMsg = e2.message; }
        load();
      };
    }
    const eup = document.getElementById("ecgup");
    if (eup) eup.onclick = async () => {
      const out = document.getElementById("ecgout"), file = document.getElementById("ecgfile").files[0];
      if (!file) { out.textContent = "Bitte zuerst die Datei auswählen."; return; }
      const buf = new Uint8Array(await file.arrayBuffer());
      if (!buf.length || buf.length % 20) { out.textContent = "Das ist keine gültige ECG-Hash-Datei (Größe passt nicht)."; return; }
      eup.disabled = true;
      try {
        const total = buf.length / 20, { v } = await MS.api("POST", "admin/newsletter/ecg", { phase: "start" }, H());
        for (let i = 0; i < total; i += 2000) {
          const hashes = [];
          for (let j = i; j < Math.min(total, i + 2000); j++) { let h = ""; for (let b = 0; b < 20; b++) h += buf[j * 20 + b].toString(16).padStart(2, "0"); hashes.push(h); }
          await MS.api("POST", "admin/newsletter/ecg", { phase: "chunk", v, hashes }, H());
          out.textContent = `Lädt hoch … ${Math.min(total, i + 2000).toLocaleString("de-AT")} von ${total.toLocaleString("de-AT")}`;
        }
        const d = await MS.api("POST", "admin/newsletter/ecg", { phase: "done", v }, H());
        alertBox(`ECG-Liste aktualisiert: ${d.count.toLocaleString("de-AT")} Einträge. Aus der Newsletter-Liste entfernt: ${d.removed}.`);
        load();
      } catch (e2) { out.textContent = e2.message; eup.disabled = false; }
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

  function alertBox(m) { nlSyncMsg = m; }

  load();
})();
