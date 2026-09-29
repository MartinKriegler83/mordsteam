// Widerrufsfunktion: Schritt 1 „Vertrag widerrufen“ (Formular öffnen) → Schritt 2 „Widerruf bestätigen“ (absenden)
(function () {
  "use strict";
  const EN = document.documentElement.lang === "en";
  const T = (de, en) => (EN ? en : de);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const start = document.getElementById("wr-start"), f = document.getElementById("wf"), err = document.getElementById("wferr");
  const q = new URLSearchParams(location.search);
  if (q.get("nr")) f.nr.value = q.get("nr");
  start.addEventListener("click", () => { start.hidden = true; f.hidden = false; (f.nr.value ? f.name : f.nr).focus(); });
  if (q.get("nr")) start.click();
  f.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    err.hidden = true;
    const btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const r = await fetch("/api/shop/widerruf", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ nr: f.nr.value, email: f.email.value, name: f.name.value, grund: f.grund.value, lang: EN ? "en" : "de" }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || T("Das hat nicht geklappt.", "That didn't work."));
      f.outerHTML = d.already
        ? `<div class="note" role="status"><b>${T("Für diese Bestellung ist euer Widerruf bereits eingegangen.", "Your withdrawal for this order has already been received.")}</b></div>`
        : `<div class="note" role="status"><b>${T("Euer Widerruf ist eingegangen.", "Your withdrawal has been received.")}</b><br>${T("Bestellnummer", "Order number")} ${esc(d.nr)} · ${T("eingegangen am", "received on")} ${esc(d.when)}.<br>${d.mail ? T("Die Bestätigung haben wir euch per E-Mail geschickt.", "We have sent you the confirmation by email.") : T("Die Bestätigungsmail konnte gerade nicht versendet werden – bitte speichert diese Seite; wir melden uns.", "The confirmation email could not be sent right now – please save this page; we will be in touch.")} ${d.started ? T("Da die Spielrunde schon gestartet war, erstatten wir anteilig.", "As the game round had already started, we will refund proportionately.") : T("Die Spielrunde ist gesperrt; wir erstatten den vollen Betrag innerhalb von 14 Tagen.", "The game round is locked; we will refund the full amount within 14 days.")}</div>`;
    } catch (e) { err.textContent = e.message; err.hidden = false; btn.disabled = false; }
  });
})();
