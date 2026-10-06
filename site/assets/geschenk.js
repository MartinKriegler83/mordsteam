// Geschenkkarte zum Ausdrucken oder als PDF (Go-live-Test 4, 6.10.2026).
// Aufruf: /geschenk.html?o=<Bestellung>&k=<Schlüssel>&l=de|en – nur für bezahlte Solo- und Friends-Bestellungen.
// Solo: Code + Link zum Fall. Friends: Link zur Organisator-Seite (dort gibt es den Einladungslink für die Gäste).
(function () {
  const q = new URLSearchParams(location.search);
  const EN = q.get("l") === "en";
  const T = (de, en) => (EN ? en : de);
  document.documentElement.lang = EN ? "en" : "de";
  document.title = T("Geschenkkarte – Mordsteam", "Gift card – Mordsteam");
  const root = document.getElementById("gk-root"), btn = document.getElementById("gk-print");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  document.getElementById("gk-hint").textContent = T(
    "Trag eine Widmung ein und drück auf „Drucken / als PDF“. Im Druckdialog kannst du „Als PDF sichern“ wählen und die Karte per E-Mail verschicken.",
    "Add a dedication and press “Print / save as PDF”. In the print dialog you can choose “Save as PDF” and send the card by email.");
  btn.textContent = T("Drucken / als PDF", "Print / save as PDF");
  btn.onclick = () => window.print();
  const msg = (t) => { root.innerHTML = `<p class="gk-msg">${esc(t)}</p>`; };

  const o = q.get("o"), k = q.get("k");
  if (!o || !k) return msg(T("Dieser Link ist unvollständig. Öffne die Geschenkkarte bitte über deine Bestellbestätigung.", "This link is incomplete. Please open the gift card from your order confirmation."));
  fetch(`/api/shop/status?o=${encodeURIComponent(o)}&k=${encodeURIComponent(k)}&l=${EN ? "en" : "de"}`).then((r) => r.json()).then((d) => {
    if (d.error) return msg(d.error);
    if (d.status !== "fulfilled") return msg(T("Die Bestellung ist noch nicht abgeschlossen. Bitte in ein paar Sekunden neu laden.", "The order isn't complete yet. Please reload in a few seconds."));
    const origin = location.origin;
    const until = (() => {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d.event_date || ""));
      if (!m) return "";
      const dt = new Date(Date.UTC(Number(m[1]) + 1, Number(m[2]) - 1, Number(m[3])));
      return dt.toLocaleDateString(EN ? "en-GB" : "de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    })();
    let card;
    if (d.produkt === "solo" && d.solo_code) {
      const link = `${origin}/spiel/solo.html?c=${encodeURIComponent(d.solo_code)}`;
      const title = EN ? d.solo_title_en : d.solo_title;
      card = {
        eyebrow: T("Ein Krimi für dich", "A mystery for you"),
        title, sub: T(`Solo-Krimi · ${d.solo_min} Minuten Countdown · im Browser am Handy, Tablet oder Laptop`, `Solo mystery · ${d.solo_min}-minute countdown · in the browser on phone, tablet or laptop`),
        codeLabel: T("Dein Code", "Your code"), code: d.solo_code, link,
        steps: [
          T(`QR-Code scannen oder <span class="mono">${esc(origin.replace(/^https?:\/\//, ""))}/spiel/solo.html</span> öffnen`, `Scan the QR code or open <span class="mono">${esc(origin.replace(/^https?:\/\//, ""))}/spiel/solo.html</span>`),
          T("Code eingeben und deinen Ermittlernamen wählen", "Enter the code and choose your investigator name"),
          T("Die Uhr startet erst, wenn du die Akte öffnest – nimm dir die Zeit am Stück.", "The clock only starts when you open the case file – take the time in one go."),
        ],
      };
    } else if (d.produkt === "friends" && d.org_token) {
      const link = `${origin}/spiel/friends.html?o=${encodeURIComponent(d.org_token)}`;
      card = {
        eyebrow: T("Ein Krimiabend für dich", "A mystery night for you"),
        title: T("Letzte Runde auf der Hütte", "Last Round at the Chalet"),
        sub: T(`Mordsteam Friends${d.plus ? " Plus mit KI-Verhörraum" : ""} · für ${d.teams} Personen · jeder ermittelt am eigenen Handy`, `Mordsteam Friends${d.plus ? " Plus with AI interrogation room" : ""} · for ${d.teams} people · everyone investigates on their own phone`),
        codeLabel: "", code: "", link,
        steps: [
          T("QR-Code scannen – das ist deine Organisator-Seite (gut aufheben, nicht weitergeben)", "Scan the QR code – that’s your organiser page (keep it safe, don’t pass it on)"),
          T("Dort findest du den Einladungslink für deine Gäste", "There you’ll find the invitation link for your guests"),
          d.mode === "week"
            ? T(`Du schaltest den Fall frei, dann hat jede und jeder ${d.days || 7} Tage Zeit, wann es passt`, `You unlock the case, then everyone has ${d.days || 7} days to play whenever it suits them`)
            : T("Du startest den Fall für alle gleichzeitig – am besten einen gemeinsamen Abend ausmachen", "You start the case for everyone at the same time – best to agree on an evening together"),
        ],
      };
    } else {
      return msg(T("Für diese Bestellung gibt es keine Geschenkkarte. Geschenkkarten gibt es für Mordsteam Solo und Friends.", "There is no gift card for this order. Gift cards are available for Mordsteam Solo and Friends."));
    }
    root.innerHTML = `<article class="gk" aria-label="${esc(T("Geschenkkarte", "Gift card"))}">
      <div class="gk-stamp">${esc(T("GESCHENK", "GIFT"))}</div>
      <div class="gk-l">
        <div class="gk-wm"><svg width="30" height="30" viewBox="0 0 34 34" fill="none" stroke="#15171C" stroke-width="3" aria-hidden="true"><circle cx="14" cy="14" r="10"/><line x1="21.5" y1="21.5" x2="31" y2="31" stroke-linecap="round"/></svg><span><span class="r">MORDS</span>TEAM</span></div>
        <div class="gk-eyebrow">${esc(card.eyebrow)}</div>
        <h1 class="gk-title">${esc(card.title)}</h1>
        <p class="gk-sub">${esc(card.sub)}</p>
        <div class="gk-ded">
          <label>${esc(T("Für", "For"))}<input maxlength="60" placeholder="${esc(T("Name", "Name"))}" aria-label="${esc(T("Für", "For"))}"></label>
          <textarea rows="2" maxlength="220" placeholder="${esc(T("Deine Widmung (optional)", "Your dedication (optional)"))}" aria-label="${esc(T("Widmung", "Dedication"))}"></textarea>
          <label>${esc(T("Von", "From"))}<input maxlength="60" placeholder="${esc(T("Name", "Name"))}" aria-label="${esc(T("Von", "From"))}"></label>
        </div>
      </div>
      <div class="gk-r">
        ${card.code ? `<div class="gk-codebox"><small>${esc(card.codeLabel)}</small><div class="gk-code">${esc(card.code)}</div></div>` : ""}
        <div class="gk-qr" id="gk-qr" role="img" aria-label="QR-Code"></div>
        <ol class="gk-steps">${card.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
        <div class="gk-foot">${until ? esc(T(`Gültig bis ${until}`, `Valid until ${until}`)) + " · " : ""}mordsteam.com</div>
      </div>
    </article>`;
    try { const qr = qrcode(0, "M"); qr.addData(card.link); qr.make(); document.getElementById("gk-qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); }
    catch { document.getElementById("gk-qr").remove(); }
    btn.hidden = false;
  }).catch(() => msg(T("Die Geschenkkarte konnte nicht geladen werden. Bitte später noch einmal versuchen.", "The gift card could not be loaded. Please try again later.")));
})();
