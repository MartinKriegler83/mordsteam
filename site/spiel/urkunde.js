// Mordsteam – Urkunde
(function () {
  const root = document.getElementById("root");
  const token = MS.get("ms_team");
  document.getElementById("print").onclick = () => window.print();
  if (!token) { root.innerHTML = `<p class="wrap err" style="padding-top:24px">Auf diesem Gerät ist kein Team angemeldet.</p>`; return; }
  MS.api("GET", "state", null, { "x-team": token }).then((S) => {
    if (!S.solved) { root.innerHTML = `<p class="wrap" style="padding-top:24px">Die Urkunde gibt es, sobald euer Team den Fall gelöst hat.</p>`; return; }
    const place = (S.ranking.find((r) => r.name === S.team) || {}).rank;
    const total = S.ranking.length;
    const date = new Date(S.solved_at).toLocaleDateString("de-AT", { day: "numeric", month: "long", year: "numeric" });
    root.innerHTML = `<div class="cert">
      <div class="eyebrow">Mordsteam · Abteilung für ungelöste Fälle</div>
      <h1>Ermittlungs&shy;urkunde</h1>
      <p>Hiermit wird bestätigt, dass das Ermittlerteam</p>
      <div class="team">${MS.esc(S.team)}</div>
      <p>den Fall <b>„${MS.esc(S.fall)}“</b> bei der <b>${S.firma}</b> aufgeklärt hat.</p>
      <div class="bigstamp"><div><small>MORDSTEAM · AKTE 001</small><strong>FALL GELÖST</strong><small>${MS.esc(date).toUpperCase()}</small></div></div>
      <div class="facts2"><span>Zeit: ${MS.dur(S.score_ms)}</span>${place ? `<span>Platz ${place} von ${total}</span>` : ""}${S.penalty_min ? `<span>inkl. ${S.penalty_min} Min. Strafzeit</span>` : ""}</div>
      <p class="small" style="margin-top:14px">mordsteam.com</p>
    </div>`;
  }).catch((e) => { root.innerHTML = `<p class="wrap err" style="padding-top:24px">${MS.esc(e.message)}</p>`; });
})();
