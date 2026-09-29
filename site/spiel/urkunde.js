// Mordsteam – Urkunde
(function () {
  const t = MS.t;
  const root = document.getElementById("root");
  const token = MS.get("ms_team");
  document.getElementById("print").onclick = () => window.print();
  if (!token) { root.innerHTML = `<p class="wrap err" style="padding-top:24px">${t("Auf diesem Gerät ist kein Team angemeldet.", "No team is registered on this device.")}</p>`; return; }
  MS.api("GET", "state", null, { "x-team": token }).then((S) => {
    if (S.lang) MS.setLang(S.lang);
    if (!S.solved) { root.innerHTML = `<p class="wrap" style="padding-top:24px">${t("Die Urkunde gibt es, sobald euer Team den Fall gelöst hat.", "The certificate is available once your team has solved the case.")}</p>`; return; }
    const place = (S.ranking.find((r) => r.name === S.team) || {}).rank;
    const total = S.ranking.length;
    const date = new Date(S.solved_at).toLocaleDateString(MS.lang === "en" ? "en-GB" : "de-AT", { day: "numeric", month: "long", year: "numeric" });
    root.innerHTML = `<div class="cert">
      <div class="eyebrow">${t("Mordsteam · Abteilung für ungelöste Fälle", "Mordsteam · Cold Case Unit")}</div>
      <h1>${t("Ermittlungs&shy;urkunde", "Certificate of Investigation")}</h1>
      <p>${t("Hiermit wird bestätigt, dass das Ermittlerteam", "This is to certify that the investigation team")}</p>
      <div class="team">${MS.esc(S.team)}</div>
      <p>${t(`den Fall <b>„${MS.esc(S.fall)}“</b> bei der <b>${S.firma}</b> aufgeklärt hat.`, `has solved the case <b>“${MS.esc(S.fall)}”</b> at <b>${S.firma}</b>.`)}</p>
      <div class="bigstamp"><div><small>${t("MORDSTEAM · AKTE 001", "MORDSTEAM · FILE 001")}</small><strong>${t("FALL GELÖST", "CASE SOLVED")}</strong><small>${MS.esc(date).toUpperCase()}</small></div></div>
      <div class="facts2"><span>${t("Zeit", "Time")}: ${MS.dur(S.score_ms)}</span>${place ? `<span>${t(`Platz ${place} von ${total}`, `Rank ${place} of ${total}`)}</span>` : ""}${S.penalty_min ? `<span>${t(`inkl. ${S.penalty_min} Min. Strafzeit`, `incl. ${S.penalty_min} min penalty`)}</span>` : ""}</div>
      <p class="small" style="margin-top:14px">mordsteam.com</p>
    </div>`;
  }).catch((e) => { root.innerHTML = `<p class="wrap err" style="padding-top:24px">${MS.esc(e.message)}</p>`; });
})();
