// Kontaktformular (deutsch unter /kontakt.html, englisch unter /en/contact.html)
(function () {
  "use strict";
  const EN = document.documentElement.lang === "en";
  const T = (de, en) => (EN ? en : de);
  const f = document.getElementById("kf");
  if (!f) return;
  const t0 = Date.now();
  const err = document.getElementById("kferr");
  const btn = f.querySelector("button[type=submit]");
  f.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    err.hidden = true;
    const data = { name: f.name.value, email: f.email.value, message: f.message.value, website: f.website.value, t: t0, lang: EN ? "en" : "de" };
    if (!data.name.trim() || !data.email.trim() || data.message.trim().length < 5) {
      err.textContent = T("Bitte Name, E-Mail und Nachricht ausfüllen.", "Please fill in name, email and message.");
      err.hidden = false; return;
    }
    btn.disabled = true; btn.textContent = T("Wird gesendet …", "Sending …");
    try {
      const r = await fetch("/api/shop/kontakt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || T("Senden hat nicht geklappt.", "Sending failed."));
      f.outerHTML = `<div class="note" role="status"><b>${T("Danke, eure Nachricht ist angekommen!", "Thank you, your message has arrived!")}</b><br>${T("Wir melden uns so schnell wie möglich per E-Mail.", "We'll get back to you by email as soon as we can.")}</div>`;
    } catch (e) {
      err.textContent = e.message; err.hidden = false;
      btn.disabled = false; btn.textContent = T("Nachricht senden", "Send message");
    }
  });
})();
