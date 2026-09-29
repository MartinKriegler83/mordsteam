// Mordsteam – Urkunde
(function () {
  const t = MS.t;
  const root = document.getElementById("root");
  const token = MS.get("ms_team"), orgIdx = MS.qs("org"), orgToken = MS.get("ms_org");
  // Organisator: Urkunde eines beliebigen Teams (Index in der Rangliste)
  const load = orgIdx !== null && orgToken
    ? MS.api("GET", "leitung/state", null, { "x-leitung": orgToken }).then((L) => {
        const r = L.ranking[Number(orgIdx)];
        if (!r) throw new Error(t("Dieses Team gibt es nicht.", "This team does not exist."));
        return { lang: L.lang, solved: r.solved, solved_at: r.solved_at || Date.now(), team: r.name, ranking: L.ranking, fall: L.fall, firma: L.firma, score_ms: r.score_ms, penalty_min: r.penalty_min };
      })
    : token ? MS.api("GET", "state", null, { "x-team": token }) : null;
  if (!load) { root.innerHTML = `<p class="wrap err" style="padding-top:24px">${orgIdx !== null ? t("Bitte zuerst in der Organisator-Ansicht anmelden.", "Please log in to the organiser view first.") : t("Auf diesem Gerät ist kein Team angemeldet.", "No team is registered on this device.")}</p>`; return; }
  load.then((S) => {
    if (S.lang) MS.setLang(S.lang);
    if (!S.solved) { root.innerHTML = `<p class="wrap" style="padding-top:24px">${t("Die Urkunde gibt es, sobald das Team den Fall gelöst hat.", "The certificate is available once the team has solved the case.")}</p>`; return; }
    const place = (S.ranking.find((r) => r.name === S.team) || {}).rank;
    const total = S.ranking.length;
    const btn = document.getElementById("save");
    btn.hidden = false;
    btn.onclick = () => saveImage(S, place, total);
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

  // Urkunde als Bild (PNG) speichern – ohne Druckdialog, funktioniert auch am Handy
  async function saveImage(S, place, total) {
    try { await document.fonts.ready; } catch {}
    const W = 1600, H = 1130, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const cs = getComputedStyle(document.querySelector(".cert h1") || document.body);
    const serif = cs.fontFamily, sans = getComputedStyle(document.body).fontFamily;
    const mono = getComputedStyle(document.querySelector(".cert .facts2") || document.body).fontFamily;
    const INK = "#15171C", RED = "#B3261E";
    g.fillStyle = "#FFFDF8"; g.fillRect(0, 0, W, H);
    g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(30, 30, W - 60, H - 60); g.lineWidth = 3; g.strokeRect(50, 50, W - 100, H - 100);
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    const fit = (txt, font, size, max) => { let s = size; do { g.font = `${font.replace("SIZE", s + "px")}`; s -= 2; } while (g.measureText(txt).width > max && s > 12); };
    g.fillStyle = RED; g.font = `600 22px ${mono}`;
    g.fillText(t("MORDSTEAM · ABTEILUNG FÜR UNGELÖSTE FÄLLE", "MORDSTEAM · COLD CASE UNIT").split("").join(String.fromCharCode(8202)), W / 2, 150);
    g.fillStyle = INK; fit(t("Ermittlungsurkunde", "Certificate of Investigation"), `900 SIZE ${serif}`, 84, W - 240); g.fillText(t("Ermittlungsurkunde", "Certificate of Investigation"), W / 2, 260);
    g.font = `400 30px ${sans}`; g.fillText(t("Hiermit wird bestätigt, dass das Ermittlerteam", "This is to certify that the investigation team"), W / 2, 340);
    g.fillStyle = RED; fit(S.team, `900 SIZE ${serif}`, 80, W - 240); g.fillText(S.team, W / 2, 440);
    g.fillStyle = INK;
    const firma = new DOMParser().parseFromString(S.firma, "text/html").documentElement.textContent;
    const line = t(`den Fall „${S.fall}“ bei der ${firma} aufgeklärt hat.`, `has solved the case “${S.fall}” at ${firma}.`);
    fit(line, `400 SIZE ${sans}`, 30, W - 240); g.fillText(line, W / 2, 510);
    // Stempel
    g.save(); g.translate(W / 2, 680); g.rotate(-0.06);
    g.strokeStyle = RED; g.fillStyle = RED; g.lineWidth = 7; g.strokeRect(-300, -95, 600, 190); g.lineWidth = 3; g.strokeRect(-285, -80, 570, 160);
    g.font = `700 22px ${mono}`; g.fillText(t("MORDSTEAM · AKTE 001", "MORDSTEAM · FILE 001"), 0, -40);
    g.font = `900 64px ${serif}`; g.fillText(t("FALL GELÖST", "CASE SOLVED"), 0, 28);
    const date = new Date(S.solved_at).toLocaleDateString(MS.lang === "en" ? "en-GB" : "de-AT", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
    g.font = `700 22px ${mono}`; g.fillText(date, 0, 64);
    g.restore();
    g.fillStyle = INK; g.font = `500 28px ${mono}`;
    const facts = [`${t("Zeit", "Time")}: ${MS.dur(S.score_ms)}`, place ? t(`Platz ${place} von ${total}`, `Rank ${place} of ${total}`) : "", S.penalty_min ? t(`inkl. ${S.penalty_min} Min. Strafzeit`, `incl. ${S.penalty_min} min penalty`) : ""].filter(Boolean).join("   ·   ");
    g.fillText(facts, W / 2, 880);
    g.font = `400 22px ${sans}`; g.fillStyle = "#5A5D66"; g.fillText("mordsteam.com", W / 2, 1010);
    const name = `${t("Urkunde", "Certificate")}-${S.team.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "Team"}.png`;
    c.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], name, { type: "image/png" });
      // Handy: Teilen-Menü (speichern in Fotos o. Ä.), sonst normaler Download
      if (navigator.canShare && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: name }); return; } catch {}
      }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, "image/png");
  }
})();
