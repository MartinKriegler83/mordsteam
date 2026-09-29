// Mordsteam Fallzentrale – Organisator
(function () {
  const t = MS.t;
  const root = document.getElementById("root");
  let lastErr = "";
  document.addEventListener("ms-lang", () => (S ? render() : loginView(lastErr)));
  let token = MS.get("ms_org");
  let S = null, offset = 0, solutionHtml = "", msg = "";

  function loginView(err) {
    lastErr = err || "";
    root.innerHTML = `<div class="panel center"><div class="eyebrow">${t("Organisator", "Organiser")}</div>
      <h1 style="font-family:var(--serif);font-size:32px;margin:8px 0">${t("Spielrunde steuern", "Run your game round")}</h1>
      <p class="muted">${t("Den Organisator-Code findet ihr in eurer Bestellbestätigung. Er ist nur für euch – nicht an die Teams weitergeben.", "You'll find the organiser code in your order confirmation. It's just for you – don't pass it on to the teams.")}</p>
      <form id="lf" class="form"><div class="field"><label for="c">${t("Organisator-Code", "Organiser code")}</label>
      <input id="c" required autocomplete="off" style="text-transform:uppercase;font-family:var(--mono);font-size:22px;letter-spacing:3px"></div>
      <div><button class="btn btn-red" type="submit">${t("Anmelden", "Log in")}</button></div>
      <p class="err" role="alert">${err ? MS.esc(err) : ""}</p></form></div>`;
    document.getElementById("lf").onsubmit = async (e) => {
      e.preventDefault();
      try { const d = await MS.api("POST", "leitung/login", { code: document.getElementById("c").value }); token = d.token; MS.set("ms_org", token); if (d.lang) MS.setLang(d.lang); poll(); }
      catch (e2) { loginView(e2.message); }
    };
  }

  async function poll() {
    if (!token) return loginView();
    try { S = await MS.api("GET", "leitung/state", null, { "x-leitung": token }); offset = S.now - Date.now(); if (S.lang && S.lang !== MS.lang && !MS.qs("lang")) MS.setLang(S.lang); paintSw(); render(); }
    catch (e) { if (e.status === 401 || e.status === 410) { MS.del("ms_org"); token = null; loginView(e.message); } }
  }

  async function act(aktion) {
    if (aktion === "starten" && !confirm(t("Fall jetzt starten? Die Uhr läuft dann für alle Teams – und jeder Fall lässt sich nur einmal starten.", "Start the case now? The clock then runs for all teams – and each case can only be started once."))) return;
    if (aktion === "beenden" && !confirm(t("Runde wirklich beenden? Danach ist die Akte für alle Teams gesperrt.", "Really end the round? The file will then be locked for all teams."))) return;
    try { await MS.api("POST", "leitung/aktion", { aktion }, { "x-leitung": token }); msg = ""; }
    catch (e) { msg = e.message; }
    poll();
  }

  async function showSolution() {
    if (S.status === "running" && !confirm(t("Die Auflösung verrät den ganzen Fall. Nur öffnen, wenn niemand mehr mitspielt oder zusieht.", "The solution gives away the whole case. Only open it when nobody is playing or watching any more."))) return;
    try {
      const d = await MS.api("GET", "leitung/aufloesung", null, { "x-leitung": token });
      solutionHtml = `<div class="panel" style="margin-top:18px"><div class="eyebrow">${t("Auflösung", "Solution")}</div>
        <ol class="list" style="margin:10px 0">${d.answers.map((a) => `<li><b>${a.label}</b><br><span class="mono">${MS.esc(a.answer)}</span>${a.detail ? ` · ${MS.esc(a.detail)}` : ""}</li>`).join("")}</ol>
        <p>${d.story}</p>${d.story2 ? `<p style="margin-top:10px">${d.story2}</p>` : ""}${d.story3 ? `<p style="margin-top:10px">${d.story3}</p>` : ""}</div>`;
    } catch (e) { msg = e.message; }
    render();
  }

  function render() {
    const link = `${location.origin}/spiel/?code=${S.join_code}${S.lang === "en" ? "&lang=en" : ""}`;
    const chip = { created: [t("Noch geschlossen", "Not open yet"), ""], open: [t("Anmeldung offen", "Registration open"), "open"], running: [t("Läuft", "Running"), "run"], finished: [t("Beendet", "Finished"), "fin"] }[S.status];
    const now = Date.now() + offset;
    let steps = "";
    if (S.status === "created") steps = `<p>${t("Bereit, wann immer ihr es seid: Öffnet den Fall, dann können sich die Teams mit dem Spielcode anmelden. Gestartet wird erst im nächsten Schritt.", "Ready whenever you are: open the case and the teams can join with the game code. The clock only starts in the next step.")}</p><button class="btn btn-red" id="a-open">${t("Fall öffnen", "Open case")}</button>`;
    if (S.status === "open") steps = `<p>${t("Die Teams melden sich jetzt an. Startet den Fall, wenn alle bereit sind – die Uhr läuft dann für alle gleichzeitig.", "The teams are joining now. Start the case when everyone is ready – the clock then runs for everyone at the same time.")}</p><button class="btn btn-red" id="a-start">${t("Fall starten", "Start case")}</button>`;
    if (S.status === "running") steps = `<p>${t("Läuft seit", "Running for")} <b class="mono">${MS.dur(now - S.started_at)}</b>. ${t(`Übergabe der Mappe (Spielende) nach ${S.duration_min} Minuten (${MS.esc(S.tier_name || "")}). Haben alle Teams gelöst, endet die Runde automatisch und alle sehen Rangliste und Auflösung. Schafft es ein Team nicht, beendet ihr die Runde hier selbst.`, `Handover of the folder (end of game) after ${S.duration_min} minutes (${MS.esc(S.tier_name || "")}). Once all teams have solved it, the round ends automatically and everyone sees the ranking and the solution. If a team doesn't make it, end the round here yourself.`)}</p><button class="btn btn-line" id="a-stop">${t("Runde beenden", "End round")}</button>`;
    if (S.status === "finished") steps = `<p>${t("Die Runde ist beendet. Rangliste und Urkunden bleiben 30 Tage abrufbar, dann werden alle Daten gelöscht.", "The round has ended. Ranking and certificates remain available for 30 days, then all data is deleted.")}</p>`;
    root.innerHTML = `<div class="stack" style="gap:18px;max-width:900px">
      <div class="panel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
        <div><div class="eyebrow">${MS.esc(S.fall)}</div><h1 style="font-family:var(--serif);font-size:30px;margin:4px 0">${S.firma}</h1></div>
        <span class="chip ${chip[1]}">${chip[0]}</span></div>
        <div style="margin-top:14px">${steps}</div>
        ${msg ? `<p class="err">${MS.esc(msg)}</p>` : ""}
      </div>
      ${S.status !== "finished" ? `<div class="panel"><div class="eyebrow">${t("Für die Teams", "For the teams")}</div>
        <p style="margin:8px 0">${t("Jedes Team öffnet diesen Link auf einem Gerät und gibt einen Teamnamen ein:", "Each team opens this link on one device and enters a team name:")}</p>
        <p><span class="bigcode">${S.join_code}</span></p>
        <p class="mono" style="word-break:break-all;margin-top:10px">${MS.esc(link)}</p>
        <button class="tipbtn" id="copy" type="button">${t("Link kopieren", "Copy link")}</button></div>` : ""}
      <div class="panel"><div class="eyebrow">${t(`Teams und Rangliste · ${S.ranking.length} von ${S.max_teams} Teams angemeldet`, `Teams and ranking · ${S.ranking.length} of ${S.max_teams} teams joined`)}</div>
        ${S.ranking.length ? `<table class="rank"><thead><tr><th>#</th><th>Team</th><th>${t("Stand", "Status")}</th><th>${t("Fehlversuche", "Wrong attempts")}</th><th>${t("Zeit", "Time")}</th></tr></thead><tbody>
        ${S.ranking.map((r) => `<tr><td class="n">${r.rank || "–"}</td><td>${MS.esc(r.name)}</td><td>${MS.stage(r, S.tier)}</td><td>${r.wrong}</td><td class="mono">${r.solved ? MS.dur(r.score_ms) : "–"}</td></tr>`).join("")}
        </tbody></table>` : `<p class="muted">${t("Noch kein Team angemeldet.", "No team has joined yet.")}</p>`}
      </div>
      ${S.solution_available ? `<div><button class="btn btn-ink" id="a-sol">${t("Auflösung anzeigen", "Show solution")}</button></div>` : ""}
      ${solutionHtml}
      <p class="small"><a href="#" id="logout">${t("Abmelden", "Log out")}</a></p>
    </div>`;
    const b = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    b("a-open", () => act("oeffnen")); b("a-start", () => act("starten")); b("a-stop", () => act("beenden"));
    b("a-sol", showSolution);
    b("copy", () => { try { navigator.clipboard.writeText(link); } catch {} });
    b("logout", (e) => { e.preventDefault(); MS.del("ms_org"); token = null; loginView(); });
  }

  function paintSw() { const b = document.getElementById("langsw"); if (b) b.textContent = MS.lang === "en" ? "DE" : "EN"; }
  poll();
  setInterval(() => { if (token && !document.querySelector("input:focus")) poll(); }, 5000);
})();
