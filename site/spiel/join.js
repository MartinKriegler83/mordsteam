(function () {
  const t = MS.t;
  const f = document.getElementById("join");
  const msg = document.getElementById("msg");
  const code = MS.qs("code");
  const codeIn = document.getElementById("code");
  if (code) codeIn.value = code.toUpperCase();
  let back = null;
  const paintBack = () => {
    if (!MS.get("ms_team")) return;
    if (!back) { back = document.createElement("p"); back.className = "small"; f.after(back); }
    back.innerHTML = `${t("Dieses Gerät ist schon angemeldet.", "This device is already registered.")} <a href="/spiel/fall.html">${t("Zurück zu eurer Fallakte", "Back to your case file")}</a>`;
  };
  paintBack();
  document.addEventListener("ms-lang", paintBack);
  // Spielsprache aus dem Spielcode übernehmen (Englisch gebuchte Runden zeigen die Anmeldung auf Englisch)
  let looked = "";
  async function lookup() {
    const c = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    // Solo-Codes (8 Zeichen, beginnen mit S) gehören zu Mordsteam Solo
    if (/^S[A-Z2-9]{7}$/.test(c)) { location.href = "/spiel/solo.html?c=" + c; return; }
    if (c.length < 6 || c === looked) return;
    looked = c;
    try { const d = await MS.api("GET", "code?code=" + encodeURIComponent(c)); if (d.found) { MS.setLang(d.lang); paintBack(); const b = document.getElementById("langsw"); if (b) b.textContent = MS.lang === "en" ? "DE" : "EN"; } } catch {}
  }
  codeIn.addEventListener("input", lookup);
  lookup();
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    const btn = f.querySelector("button");
    btn.disabled = true;
    try {
      const d = await MS.api("POST", "join", { code: f.code.value, name: f.name.value });
      MS.set("ms_team", d.token);
      if (d.lang) MS.setLang(d.lang);
      ["ms_seen", "ms_heard", "ms_tab", "ms_doc"].forEach(MS.del);
      location.href = "/spiel/fall.html";
    } catch (err) {
      msg.textContent = err.message;
      btn.disabled = false;
    }
  });
})();
