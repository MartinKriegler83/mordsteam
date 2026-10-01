// Mordsteam Solo kaufen (deutsch unter /solo-kaufen.html, englisch unter /en/solo-buy.html)
(function () {
  "use strict";
  const EN = document.documentElement.lang === "en";
  const T = (de, en) => (EN ? en : de);
  const form = document.getElementById("solo"), err = document.getElementById("err"), btn = document.getElementById("submit");
  const q = new URLSearchParams(location.search);
  if (q.get("abgebrochen")) document.getElementById("cancelled").hidden = false;
  const CASES = {
    "solo-001": { p: 890, de: "Mordsteam Solo 001 „Nachtzug nach Venedig“ · 40 Minuten", en: "Mordsteam Solo 001 “Night Train to Venice” · 40 minutes" },
    "solo-002": { p: 890, de: "Mordsteam Solo 002 „Applaus für einen Toten“ · 30 Minuten", en: "Mordsteam Solo 002 “Applause for a Dead Man” · 30 minutes" },
    "solo-plus-001": { p: 1590, plus: true, de: "Mordsteam Solo Plus „Der letzte Jahrgang“ · 45 Minuten · mit KI-Verhörraum", en: "Mordsteam Solo Plus “The Last Vintage” · 45 minutes · with AI interrogation room" },
  };
  const want = { "002": "solo-002", plus: "solo-plus-001", "001": "solo-001" }[q.get("fall") || ""];
  if (want) form.querySelector(`input[name=fall][value="${want}"]`).checked = true;
  const eur = (c) => (EN ? "€" + (c / 100).toFixed(2) : (c / 100).toFixed(2).replace(".", ",") + " €");
  const paint = () => {
    document.getElementById("sofortbox").hidden = form.kunde.value !== "b2c";
    const C = CASES[form.fall.value] || CASES["solo-001"];
    document.getElementById("ab18box").hidden = !C.plus;
    document.getElementById("sumtxt").textContent = (EN ? C.en : C.de) + T(" · Spielsprache Deutsch", " · game language German");
    document.getElementById("sumprice").textContent = eur(C.p);
    btn.textContent = T("Zahlungspflichtig bestellen – ", "Order with obligation to pay – ") + eur(C.p);
  };
  form.querySelectorAll("input[name=kunde],input[name=fall]").forEach((r) => r.addEventListener("change", paint));
  paint();
  let open = true;
  fetch("/api/shop/meta" + (EN ? "?lang=en" : "")).then((r) => r.json()).then((m) => { open = !!m.open; document.getElementById("closed").hidden = open; if (!open) btn.disabled = true; }).catch(() => {});
  function fail(msg, el) { err.textContent = msg; err.hidden = false; if (el && el.focus) el.focus(); }
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    err.hidden = true;
    const contact = { name: form.c_name.value.trim(), email: form.c_email.value.trim(), kunde: form.kunde.value };
    const consent = { sofort: form.sofort.checked, agb: form.agb.checked, ab18: form.ab18.checked };
    const fall = form.fall.value;
    if (contact.name.length < 2) return fail(T("Bitte deinen Namen angeben.", "Please enter your name."), form.c_name);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return fail(T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid email address."), form.c_email);
    if (!contact.kunde) return fail(T("Bitte angeben, ob du als Privatperson oder für ein Unternehmen bestellst.", "Please tell us whether you are ordering as a private individual or for a company."), form.kunde[0]);
    if (contact.kunde === "b2c" && !consent.sofort) return fail(T("Bitte bestätigen, dass wir deinen Code gleich nach dem Bezahlen bereitstellen dürfen.", "Please confirm that we may provide your code right after payment."), form.sofort);
    if (CASES[fall] && CASES[fall].plus && !consent.ab18) return fail(T("Solo Plus ist ab 18 Jahren – bitte bestätigen.", "Solo Plus is for ages 18 and over – please confirm."), form.ab18);
    if (!consent.agb) return fail(T("Bitte AGB und Datenschutzerklärung akzeptieren.", "Please accept the terms and the privacy policy."), form.agb);
    btn.disabled = true; const label = btn.textContent; btn.textContent = T("Weiter zur Zahlung …", "On to payment …");
    try {
      const r = await fetch("/api/shop/solo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ site: EN ? "en" : "de", fall, contact, consent }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.redirect) throw new Error(d.error || T("Das hat nicht geklappt.", "That didn't work."));
      location.href = d.redirect;
    } catch (e) { fail(e.message); btn.disabled = !open; btn.textContent = label; }
  });
})();
