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
    const lbl = { pending: "offen", paid: "bezahlt", fulfilling: "in Arbeit", fulfilled: "bezahlt · Runde angelegt" };
    const paid = orders.filter((o) => o.status !== "pending");
    const toShip = [];
    return `<div class="panel"><div class="eyebrow">Bestellungen</div>
      <p style="margin:8px 0">${paid.length} bezahlt · Umsatz ${eur(paid.reduce((a, o) => a + o.amount_cents, 0))}</p>
      <div class="list-sessions">${orders.length ? orders.map((o) => {
        const c = o.contact || {}, l = c.liefer;
        return `<div class="sess">
          <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${MS.esc(o.firma || "–")}</b><span class="chip ${o.status === "fulfilled" ? "open" : ""}">${lbl[o.status] || o.status}</span></div>
          <div class="mono">${new Date(o.created_at).toLocaleString("de-AT")} · ${({ basis: "Basis", premium: "PREMIUM", plus: "PREMIUM PLUS" })[o.paket] || o.paket} · ${o.teams} Teams · ${eur(o.amount_cents)} · gekauft ${o.event_date}${o.join_code ? ` · Spielcode ${o.join_code} · Organisator ${o.org_code}` : ""}</div>
          <div class="small">${MS.esc(c.name || "")} · <a href="mailto:${MS.esc(c.email || "")}">${MS.esc(c.email || "")}</a>${c.telefon ? " · " + MS.esc(c.telefon) : ""}${c.rechnung_firma ? " · Rechnung: " + MS.esc(c.rechnung_firma) : ""}${c.lang ? " · Spielsprache " + c.lang.toUpperCase() : ""}${c.site ? " · Seite " + c.site.toUpperCase() : ""}${c.fiktiv ? " · fiktiv" : ""}${c.earlybird ? ` · <b style="color:var(--red)">EARLY BIRD −${c.earlybird} % (Feedback einholen!)</b>` : ""}</div>
        </div>`;
      }).join("") : `<p class="muted">Noch keine Bestellungen.</p>`}</div></div>`;
  }

  function render(sessions, orders = [], stats = {}) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date());
    root.innerHTML = `<div class="stack" style="gap:22px;max-width:980px">
      ${created ? `<div class="panel" style="border-color:var(--red)"><div class="eyebrow">Runde angelegt</div>
        <p style="margin:8px 0">Spielcode für Teams: <span class="bigcode" style="font-size:26px">${created.join_code}</span></p>
        <p>Organisator-Code: <b class="mono" style="font-size:20px">${created.org_code}</b></p>
        <p class="mono small">Teams: ${location.origin}/spiel/?code=${created.join_code}<br>Organisator: ${location.origin}/spiel/leitung.html</p>
        ${created.quick ? `<p class="small" style="margin-top:8px"><b>${TN[created.quick.tier]}, ${TMIN[created.quick.tier]} Min. · ${created.quick.land} · ${created.quick.lang.toUpperCase()}</b> · ${MS.esc(created.quick.firma)} (${MS.esc(created.quick.stadt)}) · Opfer: ${MS.esc(created.quick.opfer)} · Oberboss: ${MS.esc(created.quick.boss)} · Verdächtige: ${created.quick.people.map(MS.esc).join(", ")} · Täter/in: per Zufall (steht in der Auflösung)</p>
        <div class="actions-row" style="margin-top:10px"><a class="btn btn-ink" href="/spiel/leitung.html" target="_blank" rel="noopener">Organisator-Ansicht öffnen</a><a class="btn btn-line" href="/spiel/?code=${created.join_code}&lang=${created.quick.lang}" target="_blank" rel="noopener">Als Team beitreten</a></div>
        <p class="small" style="margin-top:8px">Der Fall ist geöffnet. Teams anmelden lassen, dann in der Organisator-Ansicht „Fall starten“.</p>` : ""}</div>` : ""}
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
      </form></div>
      ${ordersPanel(orders)}
      ${statsPanel(stats)}
      <div class="panel"><div class="eyebrow">Alle Runden</div>
        <div class="list-sessions" style="margin-top:10px">${sessions.length ? sessions.map((s) => `<div class="sess">
          <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${MS.esc(s.label || s.id)}</b><span class="chip ${({ open: "open", running: "run", finished: "fin" })[s.status] || ""}">${s.status}</span></div>
          <div class="mono">Angelegt ${s.event_date} · Teams ${s.teams} · Spielcode ${s.join_code} · Organisator ${s.org_code}${s.test_mode ? " · TEST" : ""}${s.premium ? " · " + TN[s.premium].toUpperCase() : ""} · ${s.land || "AT"} · ${(s.lang || "de").toUpperCase()}</div>
          <div><button class="tipbtn" data-del="${s.id}">Löschen</button></div></div>`).join("") : `<p class="muted">Noch keine Runden.</p>`}</div></div>
    </div>`;
    document.getElementById("nf").onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target, vars = {};
      for (const fl of meta.fields) vars[fl.key] = f.elements[fl.key].value;
      vars.LAND = f.elements.LAND.value;
      try {
        created = await MS.api("POST", "admin/session", {
          label: f.label.value, event_date: f.event_date.value, max_teams: Number(f.max_teams.value),
          test_mode: f.test_mode.checked, tier: Number(f.tier.value), lang: f.elements.lang.value, vars,
        }, H());
        err = ""; scrollTo(0, 0);
      } catch (e2) { err = e2.message; }
      load();
    };
    root.querySelectorAll("[data-quick]").forEach((b) => (b.onclick = async () => {
      b.disabled = true;
      try { await quickTest(Number(b.dataset.quick)); err = ""; scrollTo(0, 0); } catch (e2) { err = e2.message; }
      load();
    }));
    const ql = document.getElementById("qlang"), qd = document.getElementById("qland");
    if (ql) ql.onchange = () => (qLang = ql.value);
    if (qd) qd.onchange = () => (qLand = qd.value);
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
