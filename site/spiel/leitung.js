// Mordsteam Fallzentrale – Organisator
(function () {
  const root = document.getElementById("root");
  let token = MS.get("ms_org");
  let S = null, offset = 0, solutionHtml = "", msg = "";

  function loginView(err) {
    root.innerHTML = `<div class="panel center"><div class="eyebrow">Organisator</div>
      <h1 style="font-family:var(--serif);font-size:32px;margin:8px 0">Spielrunde steuern</h1>
      <p class="muted">Den Organisator-Code findet ihr in eurer Bestellbestätigung. Er ist nur für euch – nicht an die Teams weitergeben.</p>
      <form id="lf" class="form"><div class="field"><label for="c">Organisator-Code</label>
      <input id="c" required autocomplete="off" style="text-transform:uppercase;font-family:var(--mono);font-size:22px;letter-spacing:3px"></div>
      <div><button class="btn btn-red" type="submit">Anmelden</button></div>
      <p class="err" role="alert">${err ? MS.esc(err) : ""}</p></form></div>`;
    document.getElementById("lf").onsubmit = async (e) => {
      e.preventDefault();
      try { const d = await MS.api("POST", "leitung/login", { code: document.getElementById("c").value }); token = d.token; MS.set("ms_org", token); poll(); }
      catch (e2) { loginView(e2.message); }
    };
  }

  async function poll() {
    if (!token) return loginView();
    try { S = await MS.api("GET", "leitung/state", null, { "x-leitung": token }); offset = S.now - Date.now(); render(); }
    catch (e) { if (e.status === 401 || e.status === 410) { MS.del("ms_org"); token = null; loginView(e.message); } }
  }

  async function act(aktion) {
    if (aktion === "beenden" && !confirm("Runde wirklich beenden? Danach ist die Akte für alle Teams gesperrt.")) return;
    try { await MS.api("POST", "leitung/aktion", { aktion }, { "x-leitung": token }); msg = ""; }
    catch (e) { msg = e.message; }
    poll();
  }

  async function showSolution() {
    if (S.status === "running" && !confirm("Die Auflösung verrät den ganzen Fall. Nur öffnen, wenn niemand mehr mitspielt oder zusieht.")) return;
    try {
      const d = await MS.api("GET", "leitung/aufloesung", null, { "x-leitung": token });
      solutionHtml = `<div class="panel" style="margin-top:18px"><div class="eyebrow">Auflösung</div>
        <ol class="list" style="margin:10px 0">${d.answers.map((a) => `<li><b>${a.label}</b><br><span class="mono">${MS.esc(a.answer)}</span>${a.detail ? ` · ${MS.esc(a.detail)}` : ""}</li>`).join("")}
        ${d.premium_answer ? `<li><b>Code auf der Zugangskarte (Kuvert)</b><br><span class="mono">${MS.esc(d.premium_answer)}</span></li>` : ""}</ol>
        <p>${d.story}</p>${d.story2 ? `<p style="margin-top:10px">${d.story2}</p>` : ""}</div>`;
    } catch (e) { msg = e.message; }
    render();
  }

  function render() {
    const link = `${location.origin}/spiel/?code=${S.join_code}`;
    const chip = { created: ["Noch geschlossen", ""], open: ["Anmeldung offen", "open"], running: ["Läuft", "run"], finished: ["Beendet", "fin"] }[S.status];
    const now = Date.now() + offset;
    let steps = "";
    if (S.status === "created") steps = S.may_open
      ? `<p>Heute ist Spieltag. Öffnet den Fall, dann können sich die Teams mit dem Spielcode anmelden.</p><button class="btn btn-red" id="a-open">Fall öffnen</button>`
      : `<p>Der Fall lässt sich erst am Spieltag öffnen: <b>${MS.esc(S.event_date)}</b>.</p>`;
    const kuvert = S.premium ? `<p class="note" style="margin:10px 0"><b>Premium:</b> Jedes Team bekommt ein versiegeltes Kuvert mit der Zugangskarte. Es bleibt zu, bis die Fallzentrale dem Team das Öffnen erlaubt (nach Akt 2).</p>` : "";
    if (S.status === "open") steps = kuvert + `<p>Die Teams melden sich jetzt an. Startet den Fall, wenn alle bereit sind – die Uhr läuft dann für alle gleichzeitig.</p><button class="btn btn-red" id="a-start">Fall starten</button>`;
    if (S.status === "running") steps = `<p>Läuft seit <b class="mono">${MS.dur(now - S.started_at)}</b>. Übergabe der Mappe (Spielende) nach ${S.duration_min} Minuten${S.premium ? " (Premium mit Akt 2 und Kuvert)" : ""}. Haben alle Teams gelöst, endet die Runde automatisch und alle sehen Rangliste und Auflösung. Schafft es ein Team nicht, beendet ihr die Runde hier selbst.</p><button class="btn btn-line" id="a-stop">Runde beenden</button>`;
    if (S.status === "finished") steps = `<p>Die Runde ist beendet. Rangliste und Urkunden bleiben 30 Tage abrufbar, dann werden alle Daten gelöscht.</p>`;
    root.innerHTML = `<div class="stack" style="gap:18px;max-width:900px">
      <div class="panel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
        <div><div class="eyebrow">${MS.esc(S.fall)}</div><h1 style="font-family:var(--serif);font-size:30px;margin:4px 0">${S.firma}</h1></div>
        <span class="chip ${chip[1]}">${chip[0]}</span></div>
        <div style="margin-top:14px">${steps}</div>
        ${msg ? `<p class="err">${MS.esc(msg)}</p>` : ""}
      </div>
      ${S.status !== "finished" ? `<div class="panel"><div class="eyebrow">Für die Teams</div>
        <p style="margin:8px 0">Jedes Team öffnet diesen Link auf einem Gerät und gibt einen Teamnamen ein:</p>
        <p><span class="bigcode">${S.join_code}</span></p>
        <p class="mono" style="word-break:break-all;margin-top:10px">${MS.esc(link)}</p>
        <button class="tipbtn" id="copy" type="button">Link kopieren</button></div>` : ""}
      <div class="panel"><div class="eyebrow">Teams und Rangliste · ${S.ranking.length} von ${S.max_teams} Teams angemeldet</div>
        ${S.ranking.length ? `<table class="rank"><thead><tr><th>#</th><th>Team</th><th>Stand</th><th>Fehlversuche</th><th>Zeit</th></tr></thead><tbody>
        ${S.ranking.map((r) => `<tr><td class="n">${r.rank || "–"}</td><td>${MS.esc(r.name)}</td><td>${MS.stage(r, S.premium)}</td><td>${r.wrong}</td><td class="mono">${r.solved ? MS.dur(r.score_ms) : "–"}</td></tr>`).join("")}
        </tbody></table>` : `<p class="muted">Noch kein Team angemeldet.</p>`}
      </div>
      ${S.solution_available ? `<div><button class="btn btn-ink" id="a-sol">Auflösung anzeigen</button></div>` : ""}
      ${solutionHtml}
      <p class="small"><a href="#" id="logout">Abmelden</a></p>
    </div>`;
    const b = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    b("a-open", () => act("oeffnen")); b("a-start", () => act("starten")); b("a-stop", () => act("beenden"));
    b("a-sol", showSolution);
    b("copy", () => { try { navigator.clipboard.writeText(link); } catch {} });
    b("logout", (e) => { e.preventDefault(); MS.del("ms_org"); token = null; loginView(); });
  }

  poll();
  setInterval(() => { if (token && !document.querySelector("input:focus")) poll(); }, 5000);
})();
