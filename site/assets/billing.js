// Rechnungsland und UID in allen Bestellformularen (Teams, Friends, Solo; DE und EN).
// Danach richtet sich die Rechnung: Kleinunternehmer, Reverse Charge, nicht steuerbar – oder Paddle für Privatkunden in Großbritannien.
(function () {
  const box = document.getElementById("billbox");
  if (!box) return;
  const EN = document.documentElement.lang === "en";
  const T = (de, en) => (EN ? en : de);
  const form = box.closest("form");
  const EU = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
  const N = {
    AT: ["Österreich", "Austria"], DE: ["Deutschland", "Germany"], CH: ["Schweiz", "Switzerland"], LI: ["Liechtenstein", "Liechtenstein"],
    BE: ["Belgien", "Belgium"], BG: ["Bulgarien", "Bulgaria"], CY: ["Zypern", "Cyprus"], CZ: ["Tschechien", "Czechia"], DK: ["Dänemark", "Denmark"],
    EE: ["Estland", "Estonia"], ES: ["Spanien", "Spain"], FI: ["Finnland", "Finland"], FR: ["Frankreich", "France"], GR: ["Griechenland", "Greece"],
    HR: ["Kroatien", "Croatia"], HU: ["Ungarn", "Hungary"], IE: ["Irland", "Ireland"], IT: ["Italien", "Italy"], LT: ["Litauen", "Lithuania"],
    LU: ["Luxemburg", "Luxembourg"], LV: ["Lettland", "Latvia"], MT: ["Malta", "Malta"], NL: ["Niederlande", "Netherlands"], PL: ["Polen", "Poland"],
    PT: ["Portugal", "Portugal"], RO: ["Rumänien", "Romania"], SE: ["Schweden", "Sweden"], SI: ["Slowenien", "Slovenia"], SK: ["Slowakei", "Slovakia"],
    GB: ["Vereinigtes Königreich", "United Kingdom"], MX: ["Mexiko", "Mexico"], NO: ["Norwegen", "Norway"], IS: ["Island", "Iceland"], US: ["USA", "United States"],
    CA: ["Kanada", "Canada"], AU: ["Australien", "Australia"], NZ: ["Neuseeland", "New Zealand"],
  };
  const name = (k) => N[k][EN ? 1 : 0];
  const top = EN ? ["GB", "IE", "US", "AT", "DE"] : ["AT", "DE", "CH"];
  const rest = Object.keys(N).filter((k) => !top.includes(k)).sort((a, b) => name(a).localeCompare(name(b), EN ? "en" : "de"));
  const opt = (k) => `<option value="${k}">${name(k)}</option>`;
  let paddle = null;
  fetch("/api/shop/paddle-config").then((r) => r.json()).then((d) => { paddle = d; paint(); }).catch(() => {});

  box.innerHTML = `
    <div class="field"><label for="bill_land">${T("Rechnungsland *", "Billing country *")}</label>
      <select id="bill_land" name="bill_land"><option value="">${T("Bitte wählen …", "Please choose …")}</option>${top.map(opt).join("")}<option disabled>──────────</option>${rest.map(opt).join("")}<option value="XX">${T("anderes Land außerhalb der EU", "other country outside the EU")}</option></select>
      <span class="hint">${T("Land der Rechnungsadresse – danach richtet sich die Umsatzsteuer.", "Country of the billing address – this determines the VAT treatment.")}</span></div>
    ${form && form.c_firma ? "" : `<div class="field" id="rfirmafield" hidden><label for="c_rfirma">${T("Firma, Verein oder Organisation (für die Rechnung) *", "Company, club or organisation (for the invoice) *")}</label>
      <input id="c_rfirma" name="c_rfirma" maxlength="120" autocomplete="organization"><span class="hint">${T("Die Rechnungsadresse gebt ihr beim Bezahlen an.", "You enter the billing address when paying.")}</span></div>`}
    <div class="field" id="uidfield" hidden><label for="c_uid">${T("UID-Nummer", "VAT ID")} <span class="opt">${T("optional", "optional")}</span></label>
      <input id="c_uid" name="c_uid" maxlength="24" autocomplete="off" spellcheck="false" placeholder="${T("z. B. DE123456789", "e.g. DE123456789")}">
      <span class="hint" id="uidhint"></span></div>
    <p class="hint" id="billnote" hidden></p>`;
  const rfF = box.querySelector("#rfirmafield"), rf = box.querySelector("#c_rfirma");
  const sel = box.querySelector("#bill_land"), uidF = box.querySelector("#uidfield"), uid = box.querySelector("#c_uid"), note = box.querySelector("#billnote"), uidHint = box.querySelector("#uidhint");
  // Vorbelegung: Land des Besuchers (Cloudflare), sonst Spielland (Teams) bzw. Österreich auf der deutschen Seite
  let touched = false;
  try { const g = form && form.land && form.land.value; if (g && N[g]) sel.value = g; else if (!EN) sel.value = "AT"; } catch {}
  if (window.MSCur) MSCur.onReady(() => { const c = MSCur.country(); if (!touched && !sel.dataset.restored && c && N[c]) sel.value = c; sel.dispatchEvent(new Event("change", { bubbles: true })); });
  sel.addEventListener("change", (e) => { if (e.isTrusted) touched = true; });
  // Hinweis unter dem Bestellknopf („Bezahlt wird sicher über Stripe …“) passend zum Bezahlweg
  const payhint = document.getElementById("payhint"), payhint0 = payhint ? payhint.innerHTML : "";
  const kunde = () => (form && form.kunde ? form.kunde.value : "");
  const SOLO = !!(form && form.id === "solo");
  // „Umsatzsteuerfrei (Kleinunternehmerregelung)“ in der Zusammenfassung stimmt bei Paddle nicht – dort ist die britische USt enthalten (Go-live-Test 4)
  const VAT_RE = /Umsatzsteuerfrei \(Kleinunternehmerregelung\)\.|VAT exempt \(small business scheme\)\./;
  const vatEls = [...document.querySelectorAll(".summary p, .summary .small")].filter((el) => el !== payhint && VAT_RE.test(el.innerHTML)).map((el) => [el, el.innerHTML]);

  function paint() {
    const l = sel.value, b2b = kunde() === "b2b";
    uidF.hidden = !b2b || !l;
    if (rfF) rfF.hidden = !b2b;   // Firmenname für die Rechnung (Solo/Friends; Teams hat c_firma) – M15
    let n = "";
    if (b2b && EU.includes(l) && l !== "AT") uidHint.textContent = T("Mit gültiger UID (geprüft über das EU-System VIES) stellen wir ohne österreichische USt aus – Reverse Charge, die Steuer zahlt ihr in eurem Land.", "With a valid VAT ID (checked via the EU VIES system) we invoice without Austrian VAT – reverse charge, you account for VAT in your country.");
    else if (b2b && l === "GB") uidHint.textContent = T("Optional, erscheint auf der Rechnung. Ihr zahlt in Pfund ohne Umsatzsteuer – Reverse Charge, die britische USt meldet ihr selbst.", "Optional, shown on the invoice. You pay in pounds without VAT – reverse charge, you account for UK VAT yourselves.");
    else uidHint.textContent = T("Erscheint auf der Rechnung.", "Shown on the invoice.");
    if (l === "GB" && !b2b) {
      n = paddle && paddle.on
        ? T("Im Vereinigten Königreich zahlt ihr in Pfund (Preis inkl. britischer Umsatzsteuer) über unseren Partner Paddle (paddle.com). Paddle ist dort Verkäufer und stellt die Rechnung aus; Firmen geben Firmenname und VAT-Nummer direkt bei Paddle an. Gutscheincodes können dabei leider nicht eingelöst werden.",
            "In the United Kingdom you pay in pounds (price incl. UK VAT) via our partner Paddle (paddle.com). Paddle is the seller and issues the invoice; businesses enter their company name and VAT number directly at Paddle. Unfortunately, promo codes cannot be redeemed this way.")
          + (SOLO ? " " + T("Bei Käufen über Paddle gibt es keinen 5-€-Gutschein für Friends oder Teams.", "Purchases via Paddle do not include the £5 voucher for Friends or Teams.") : "")
        : T("Bestellungen von Privatpersonen aus dem Vereinigten Königreich sind in Kürze möglich. Firmen, Vereine und Organisationen können schon bestellen („Unternehmen, Verein oder Organisation“ wählen).", "Orders from private individuals in the United Kingdom will be possible very soon. Businesses, clubs and organisations can already order (choose “Company, club or organisation”).");
    }
    note.textContent = n; note.hidden = !n;
    const viaPaddle = l === "GB" && !b2b && paddle && paddle.on;
    vatEls.forEach(([el, html]) => { el.innerHTML = viaPaddle ? html.replace(VAT_RE, T("Inkl. britischer Umsatzsteuer (Verkauf über Paddle).", "Including UK VAT (sold via Paddle).")) : html; });
    if (payhint) payhint.innerHTML = viaPaddle
      ? T("Bezahlt wird in Pfund über Paddle (paddle.com), inkl. britischer Umsatzsteuer – Paddle ist für Kunden im Vereinigten Königreich Verkäufer und stellt die Rechnung aus. Spielcode und Links seht ihr direkt danach.", "You pay in pounds via Paddle (paddle.com), including UK VAT – Paddle is the seller for customers in the United Kingdom and issues the invoice. You'll see your code and links right afterwards.")
      : MSCur_cur() !== "EUR" ? payhint0.replace(/Prices in euros\.|Preise in Euro\./, "") + " " + T(`Bezahlt wird in ${MSCur_cur() === "GBP" ? "Pfund" : "US-Dollar"}.`, `You pay in ${MSCur_cur() === "GBP" ? "pounds" : "US dollars"}.`) : payhint0;
  }
  sel.addEventListener("change", paint);
  uid.addEventListener("input", paint);
  if (form) form.addEventListener("change", (e) => { if (e.target && e.target.name === "kunde") paint(); });
  paint();

  function MSCur_cur() { return window.MSCur ? MSCur.forLand(sel.value) : "EUR"; }
  window.MSBill = {
    cur: MSCur_cur,
    price: (eur) => (window.MSCur ? MSCur.conv(eur, MSCur_cur()) : eur),
    fmt: (cents) => (window.MSCur ? MSCur.fmt(cents, MSCur_cur()) : (EN ? "€" + (cents / 100).toFixed(2) : (cents / 100).toFixed(2).replace(".", ",") + " €")),
    read: () => ({ bill_land: sel.value, uid: kunde() === "b2b" ? uid.value.trim() : "", ...(rf && kunde() === "b2b" ? { rechnung_firma: rf.value.trim() } : {}) }),
    check: () => {
      if (!sel.value) return [T("Bitte das Rechnungsland auswählen.", "Please choose the billing country."), sel];
      const firmEl = rf || (form && form.c_firma);
      if (kunde() === "b2b" && firmEl && !firmEl.value.trim()) return [T("Bitte den Namen von Firma, Verein oder Organisation für die Rechnung angeben.", "Please enter the name of the company, club or organisation for the invoice."), firmEl];
      return null;
    },
  };
})();
