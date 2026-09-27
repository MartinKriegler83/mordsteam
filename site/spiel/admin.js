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
      render(list.sessions);
    } catch (e) {
      if (e.status === 401 || e.status === 503) { try { sessionStorage.removeItem("ms_admin"); } catch {} key = null; return keyView(e.status === 401 ? "Schlüssel falsch." : e.message); }
      root.innerHTML = `<p class="err">${MS.esc(e.message)}</p>`;
    }
  }

  // ---------- Schnelltest mit Zufallsdaten ----------
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const R = {
    firmen: ["Alpenblick Logistik GmbH", "Donautec AG", "Brenner & Partner", "Kaiser Maschinenbau GmbH", "Lindner Software GmbH", "Sonnleitner Bau", "Hofmann Feinkost GmbH", "Steirerwerk AG", "Pannonia Solar GmbH"],
    orte: [["Wien", "Mödling", "Stadtpark"], ["Graz", "Gratkorn", "Stadtpark"], ["Linz", "Leonding", "Donaupark"], ["Salzburg", "Hallein", "Mirabellgarten"], ["Innsbruck", "Hall in Tirol", "Hofgarten"], ["Eisenstadt", "Neusiedl am See", "Schlosspark"], ["Klagenfurt", "Velden", "Europapark"]],
    feier: ["Kantine", "Dachterrasse", "Foyer", "Seminarraum Alpen", "Betriebsrestaurant"],
    tatort: ["Besprechungsraum Donau", "Besprechungsraum Mur", "Besprechungsraum Inn", "Konferenzraum Traun", "Besprechungsraum Enns"],
    vornamen: ["Julia", "Tom", "Lisa", "Markus", "Sarah", "Florian", "Katharina", "Stefan", "Anna", "Michael", "Eva", "Lukas", "Sabrina", "David", "Theresa", "Georg"],
    nachnamen: ["Berger", "Hofer", "Wagner", "Steiner", "Gruber", "Huber", "Bauer", "Pichler", "Moser", "Mayer", "Leitner", "Fuchs", "Eder", "Schwarz", "Wolf", "Brunner"],
    funktionen: ["Teamleitung", "Abteilungsleitung", "Key Account", "Controlling", "Projektleitung", "Assistenz der Geschäftsführung", "Senior Consultant", "Einkauf"],
    abteilungen: ["Vertrieb", "IT", "Kundenbetreuung", "Finanzen", "Marketing", "Einkauf", "Produktion", "Personal"],
    chefs: ["Geschäftsführerin", "Geschäftsführer", "Vorständin", "Standortleiter"],
  };
  function randomVars() {
    const used = new Set();
    const person = () => {
      let n; do { n = `${pick(R.vornamen)} ${pick(R.nachnamen)}`; } while (used.has(n)); used.add(n); return n;
    };
    const [stadt, nachbar, park] = pick(R.orte);
    const v = { FIRMA: pick(R.firmen), STADT: stadt, NACHBARSTADT: nachbar, PARK: park, RAUM_FEIER: pick(R.feier), RAUM_TATORT: pick(R.tatort),
      AUFTRAGGEBER: person(), AUFTRAGGEBER_FKT: pick(R.chefs), DIEBESGUT: pick(meta.diebesgut).key };
    for (const i of [1, 2, 3, 4]) { v[`S${i}`] = person(); v[`S${i}_FKT`] = pick(R.funktionen); v[`S${i}_ABT`] = pick(R.abteilungen); }
    return v;
  }
  async function quickTest(duration) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date());
    const vars = randomVars();
    created = await MS.api("POST", "admin/session", { label: `Schnelltest · ${vars.FIRMA}`, event_date: today, duration_min: duration, test_mode: true, vars }, H());
    // Organisator gleich anmelden und den Fall öffnen
    const o = await MS.api("POST", "leitung/login", { code: created.org_code });
    MS.set("ms_org", o.token);
    await MS.api("POST", "leitung/aktion", { aktion: "oeffnen" }, { "x-leitung": o.token });
    created.quick = { firma: vars.FIRMA, dg: meta.diebesgut.find((d) => d.key === vars.DIEBESGUT).label, people: [1, 2, 3, 4].map((i) => vars[`S${i}`]) };
  }

  function render(sessions) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date());
    root.innerHTML = `<div class="stack" style="gap:22px;max-width:980px">
      ${created ? `<div class="panel" style="border-color:var(--red)"><div class="eyebrow">Runde angelegt</div>
        <p style="margin:8px 0">Spielcode für Teams: <span class="bigcode" style="font-size:26px">${created.join_code}</span></p>
        <p>Organisator-Code: <b class="mono" style="font-size:20px">${created.org_code}</b></p>
        <p class="mono small">Teams: ${location.origin}/spiel/?code=${created.join_code}<br>Organisator: ${location.origin}/spiel/leitung.html</p>
        ${created.quick ? `<p class="small" style="margin-top:8px">${MS.esc(created.quick.firma)} · Diebesgut: ${MS.esc(created.quick.dg)} · Verdächtige: ${created.quick.people.map(MS.esc).join(", ")}</p>
        <div class="actions-row" style="margin-top:10px"><a class="btn btn-ink" href="/spiel/leitung.html" target="_blank" rel="noopener">Organisator-Ansicht öffnen</a><a class="btn btn-line" href="/spiel/?code=${created.join_code}" target="_blank" rel="noopener">Als Team beitreten</a></div>
        <p class="small" style="margin-top:8px">Der Fall ist geöffnet. Teams anmelden lassen, dann in der Organisator-Ansicht „Fall starten“.</p>` : ""}</div>` : ""}
      <div class="panel"><div class="eyebrow">Schnelltest</div>
        <p style="margin:8px 0 14px">Ein Klick: Runde mit Zufallsdaten anlegen, Fall öffnen und dich als Organisator anmelden.</p>
        <div class="actions-row"><button class="btn btn-red" data-quick="60">Schnelltest 60 Min.</button><button class="btn btn-line" data-quick="90">Schnelltest 90 Min.</button></div>
      </div>
      <div class="panel"><div class="eyebrow">Neue Spielrunde (mit eigenen Daten)</div>
      <form id="nf" class="form">
        <div class="two">
          <div class="field"><label for="label">Bezeichnung (intern)</label><input id="label" name="label" placeholder="z. B. Test Freunde"></div>
          <div class="field"><label for="event_date">Spieltag</label><input id="event_date" name="event_date" type="date" value="${today}" required></div>
        </div>
        <div class="two">
          <div class="field"><label for="duration_min">Spieldauer</label><select id="duration_min" name="duration_min"><option value="60">60 Minuten</option><option value="75">75 Minuten</option><option value="90" selected>90 Minuten</option></select></div>
          <div class="field"><label for="DIEBESGUT">Diebesgut</label><select id="DIEBESGUT" name="DIEBESGUT">${meta.diebesgut.map((d) => `<option value="${d.key}">${MS.esc(d.label)}</option>`).join("")}</select></div>
        </div>
        <label class="check"><input type="checkbox" name="test_mode" checked><span><b>Testmodus</b>: Fall lässt sich an jedem Tag öffnen (für Probeläufe).</span></label>
        <label class="check"><input type="checkbox" name="premium"><span><b>Premium</b> mit Zugangskarte (Lithophan) als 5. Stufe</span></label>
        <div class="field"><label for="premium_answer">Lösung der Zugangskarte (nur Premium)</label><input id="premium_answer" name="premium_answer" placeholder="noch offen – erst nach Kartendesign"></div>
        <h3 style="margin-top:8px">Personalisierung</h3>
        <p class="small">Leere Felder bekommen den Beispielwert (grau).</p>
        <div class="two">${meta.fields.map((f) => `<div class="field"><label for="f_${f.key}">${MS.esc(f.label)}</label><input id="f_${f.key}" name="${f.key}" placeholder="${MS.esc(f.example)}" maxlength="80"></div>`).join("")}</div>
        <div><button class="btn btn-red" type="submit">Runde anlegen</button></div>
        <p class="err">${MS.esc(err)}</p>
      </form></div>
      <div class="panel"><div class="eyebrow">Alle Runden</div>
        <div class="list-sessions" style="margin-top:10px">${sessions.length ? sessions.map((s) => `<div class="sess">
          <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${MS.esc(s.label || s.id)}</b><span class="chip ${({ open: "open", running: "run", finished: "fin" })[s.status] || ""}">${s.status}</span></div>
          <div class="mono">Spieltag ${s.event_date} · Teams ${s.teams} · Spielcode ${s.join_code} · Organisator ${s.org_code}${s.test_mode ? " · TEST" : ""}${s.premium ? " · PREMIUM" : ""}</div>
          <div><button class="tipbtn" data-del="${s.id}">Löschen</button></div></div>`).join("") : `<p class="muted">Noch keine Runden.</p>`}</div></div>
    </div>`;
    document.getElementById("nf").onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target, vars = {};
      for (const fl of meta.fields) vars[fl.key] = f.elements[fl.key].value;
      vars.DIEBESGUT = f.DIEBESGUT.value;
      try {
        created = await MS.api("POST", "admin/session", {
          label: f.label.value, event_date: f.event_date.value, duration_min: Number(f.duration_min.value),
          test_mode: f.test_mode.checked, premium: f.premium.checked, premium_answer: f.premium_answer.value, vars,
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
    root.querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => {
      if (!confirm("Diese Runde samt Teams und Ergebnissen endgültig löschen?")) return;
      await MS.api("POST", "admin/delete", { id: b.dataset.del }, H()); load();
    }));
  }

  load();
})();
