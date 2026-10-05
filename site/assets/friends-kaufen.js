// Mordsteam Friends bestellen (deutsch unter /friends-kaufen.html, englisch unter /en/friends-buy.html)
(function () {
  "use strict";
  const EN = document.documentElement.lang === "en";
  const T = (de, en) => (EN ? en : de);
  const form = document.getElementById("friends"), err = document.getElementById("err"), btn = document.getElementById("submit");
  const people = document.getElementById("people");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const q = new URLSearchParams(location.search);
  if (q.get("abgebrochen")) document.getElementById("cancelled").hidden = false;
  let M = { open: true, earlybird: null, price: { base: 2900, extra: 500, included: 4 }, price_plus: { base: 4900, extra: 800, included: 4 }, quirks: [] }, open = true;
  if (q.get("v") === "plus") form.variant.value = "plus";
  const isPlus = () => form.variant.value === "plus";
  const eur = (c) => (c / 100).toLocaleString(EN ? "en-IE" : "de-AT", { minimumFractionDigits: 2 }) + (EN ? "" : " €");
  const money = (c) => (EN ? "€" + eur(c) : eur(c));
  const priceOf = (n) => { const P = isPlus() ? M.price_plus : M.price; return P.base + Math.max(0, n - P.included) * P.extra; };
  const draftKey = "ms_friends_draft";
  function rows() {
    const n = Number(form.n.value), keep = [...people.querySelectorAll(".fr-person")].map((r) => ({ name: r.querySelector("input").value, quirk: r.querySelector("select").value }));
    let saved = []; try { saved = JSON.parse(localStorage.getItem(draftKey) || "[]"); } catch {}
    const src = keep.length ? keep : saved;
    people.innerHTML = Array.from({ length: n }, (_, i) => {
      const v = src[i] || {};
      return `<div class="fr-person"><span class="fr-nr">${i + 1}</span>
        <input maxlength="30" autocomplete="off" placeholder="${T("Vorname", "First name")}" aria-label="${T("Name Person", "Name person")} ${i + 1}" value="${esc(v.name || "")}">
        <select aria-label="${T("Eigenheit Person", "Quirk person")} ${i + 1}"><option value="">${T("Eigenheit wählen …", "Choose a quirk …")}</option>${M.quirks.map(([k, l]) => `<option value="${k}" ${v.quirk === k ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>`;
    }).join("");
    paint();
  }
  function save() { try { localStorage.setItem(draftKey, JSON.stringify([...people.querySelectorAll(".fr-person")].map((r) => ({ name: r.querySelector("input").value, quirk: r.querySelector("select").value })))); } catch {} }
  function paint() {
    const n = Number(form.n.value), full = priceOf(n);
    const eb = M.earlybird && form.earlybird.checked, pay = eb ? Math.round(full * (100 - M.earlybird.prozent) / 100) : full;
    document.getElementById("sofortbox").hidden = form.kunde.value !== "b2c";
    document.getElementById("daysbox").hidden = form.mode.value !== "week";
    document.getElementById("ab18box").hidden = !isPlus();
    const gl = form.lang.value === "en", sl = T(`Spielsprache ${gl ? "Englisch" : "Deutsch"}`, `game language ${gl ? "English" : "German"}`);
    document.getElementById("sumtxt").textContent = isPlus()
      ? T(`Mordsteam Friends 001 „Letzte Runde auf der Hütte“ · Krimiabend Plus mit KI-Verhörraum · ${n} Personen · Countdown 75 Min. · ${sl}`, `Mordsteam Friends 001 “Last Round at the Chalet” · Mystery Night Plus with AI interrogation room · ${n} people · 75-minute countdown · ${sl}`)
      : T(`Mordsteam Friends 001 „Letzte Runde auf der Hütte“ · Krimiabend · ${n} Personen · Countdown 50 Min. · ${sl}`, `Mordsteam Friends 001 “Last Round at the Chalet” · Mystery Night · ${n} people · 50-minute countdown · ${sl}`);
    document.getElementById("sumprice").textContent = money(full);
    document.getElementById("ebrow").hidden = !eb;
    if (eb) document.getElementById("ebprice").textContent = money(pay - full);
    document.getElementById("voucherhint").hidden = !!eb;
    btn.innerHTML = T("Zahlungspflichtig bestellen – ", "Order and pay – ") + money(pay).replace(" ", "&nbsp;");
  }
  form.n.addEventListener("change", () => { save(); rows(); });
  people.addEventListener("input", save); people.addEventListener("change", save);
  form.addEventListener("change", paint);
  fetch("/api/shop/friends-meta" + (EN ? "?lang=en" : "")).then((r) => r.json()).then((m) => {
    M = m; open = !!m.open;
    document.getElementById("closed").hidden = open; if (!open) btn.disabled = true;
    if (m.earlybird) { document.getElementById("ebbox").hidden = false; document.querySelectorAll(".ebp").forEach((x) => (x.textContent = m.earlybird.prozent)); }
    rows();
  }).catch(() => rows());

  // Fehlermeldung direkt beim betroffenen Feld zeigen (zusätzlich zur Meldung über dem Bestellknopf)
  function markField(el, msg) {
    document.querySelectorAll(".fielderr").forEach((x) => x.remove());
    document.querySelectorAll("form .bad").forEach((x) => x.classList.remove("bad"));
    if (!el || !msg) return;
    el.classList.add("bad");
    const p = document.createElement("p");
    p.className = "fielderr"; p.setAttribute("role", "alert"); p.textContent = msg;
    if (el.type === "radio") (el.closest(".check") || el).parentElement.appendChild(p);
    else (el.closest(".field") || el.closest(".check") || el).insertAdjacentElement("afterend", p);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => el.focus({ preventScroll: true }), 300);
  }
  document.addEventListener("input", (e) => { if (e.target.classList && e.target.classList.contains("bad")) markField(null); });
  document.addEventListener("change", (e) => { if (e.target.classList && e.target.classList.contains("bad")) markField(null); });
  function fail(msg, el) { err.textContent = msg; err.hidden = false; if (el && el.focus) markField(el, msg); else { markField(null); err.scrollIntoView({ behavior: "smooth", block: "center" }); } }
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    err.hidden = true;
    const list = [...people.querySelectorAll(".fr-person")].map((r) => ({ name: r.querySelector("input").value.trim(), quirk: r.querySelector("select").value, el: r }));
    const emptyName = list.find((p) => !p.name), emptyQ = list.find((p) => !p.quirk);
    if (emptyName) return fail(T("Bitte für jede Person einen Namen eintragen.", "Please enter a name for every person."), emptyName.el.querySelector("input"));
    if (emptyQ) return fail(T("Bitte für jede Person eine Eigenheit auswählen.", "Please choose a quirk for every person."), emptyQ.el.querySelector("select"));
    const low = list.map((p) => p.name.toLowerCase());
    if (new Set(low).size !== low.length) return fail(T("Zwei Personen haben denselben Namen. Bitte unterscheidbar machen, z. B. mit Initial.", "Two people have the same name. Please make them distinguishable, e.g. with an initial."));
    if (!form.zustimmung.checked) return fail(T("Bitte bestätigen, dass alle Genannten einverstanden sind.", "Please confirm that everyone named has agreed."), form.zustimmung);
    const contact = { name: form.c_name.value.trim(), email: form.c_email.value.trim(), kunde: form.kunde.value };
    const consent = { zustimmung: true, sofort: form.sofort.checked, agb: form.agb.checked, ab18: form.ab18.checked, no_news: !!(form.no_news && form.no_news.checked) };
    if (isPlus() && !consent.ab18) return fail(T("Bitte bestätigen, dass alle mindestens 18 Jahre alt und mit den KI-Doppelgängern einverstanden sind – oder den Krimiabend wählen.", "Please confirm that everyone is at least 18 and agrees to the AI doubles – or choose the Mystery Night."), form.ab18);
    if (contact.name.length < 2) return fail(T("Bitte deinen Namen angeben.", "Please enter your name."), form.c_name);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return fail(T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid email address."), form.c_email);
    if (!contact.kunde) return fail(T("Bitte angeben, ob du als Privatperson oder für ein Unternehmen bestellst.", "Please tell us whether you are ordering as a private individual or for a company."), form.kunde[0]);
    if (contact.kunde === "b2c" && !consent.sofort) return fail(T("Bitte bestätigen, dass wir eure Runde gleich nach dem Bezahlen anlegen dürfen.", "Please confirm that we may set up your round right after payment."), form.sofort);
    if (!consent.agb) return fail(T("Bitte AGB und Datenschutzerklärung akzeptieren.", "Please accept the terms and the privacy policy."), form.agb);
    btn.disabled = true; const label = btn.innerHTML; btn.textContent = T("Weiter zur Zahlung …", "On to payment …");
    try {
      const r = await fetch("/api/shop/friends", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ site: EN ? "en" : "de", lang: form.lang.value === "en" ? "en" : "de", variant: isPlus() ? "plus" : "basis", players: list.map((p) => ({ name: p.name, quirk: p.quirk })), mode: form.mode.value, days: Number(form.days.value), earlybird: !!(M.earlybird && form.earlybird.checked), contact, consent, nl: new URLSearchParams(location.search).get("nl") || "", src: window.msSrc || "" }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.redirect) throw new Error(d.error || T("Das hat nicht geklappt.", "That didn't work."));
      try { localStorage.removeItem(draftKey); } catch {}
      location.href = d.redirect;
    } catch (e) { fail(e.message); btn.disabled = !open; btn.innerHTML = label; }
  });
})();
