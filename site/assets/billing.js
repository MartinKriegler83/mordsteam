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
    GB: ["Vereinigtes Königreich", "United Kingdom"], NO: ["Norwegen", "Norway"], IS: ["Island", "Iceland"], US: ["USA", "United States"],
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
    <div class="field" id="uidfield" hidden><label for="c_uid">${T("UID-Nummer", "VAT ID")} <span class="opt">${T("optional", "optional")}</span></label>
      <input id="c_uid" name="c_uid" maxlength="24" autocomplete="off" spellcheck="false" placeholder="${T("z. B. DE123456789", "e.g. DE123456789")}">
      <span class="hint" id="uidhint"></span></div>
    <p class="hint" id="billnote" hidden></p>`;
  const sel = box.querySelector("#bill_land"), uidF = box.querySelector("#uidfield"), uid = box.querySelector("#c_uid"), note = box.querySelector("#billnote"), uidHint = box.querySelector("#uidhint");
  // Vorbelegung: Spielland (Teams) bzw. Seitensprache
  try { const g = form && form.land && form.land.value; if (g && N[g]) sel.value = g; else if (!EN) sel.value = "AT"; } catch {}
  const kunde = () => (form && form.kunde ? form.kunde.value : "");

  function paint() {
    const l = sel.value, b2b = kunde() === "b2b";
    uidF.hidden = !b2b || !l;
    let n = "";
    if (b2b && EU.includes(l) && l !== "AT") uidHint.textContent = T("Mit gültiger UID (geprüft über das EU-System VIES) stellen wir ohne österreichische USt aus – Reverse Charge, die Steuer zahlt ihr in eurem Land.", "With a valid VAT ID (checked via the EU VIES system) we invoice without Austrian VAT – reverse charge, you account for VAT in your country.");
    else if (b2b && l === "GB") uidHint.textContent = T("Mit britischer VAT-Nummer (GB…) bestellt ihr direkt bei uns, Reverse Charge.", "With a UK VAT number (GB…) you order directly from us, reverse charge.");
    else uidHint.textContent = T("Erscheint auf der Rechnung.", "Shown on the invoice.");
    if (l === "GB" && (!b2b || !/^GB/i.test(uid.value.trim().replace(/\s/g, "")))) {
      n = paddle && paddle.on
        ? T("Für Privatkunden im Vereinigten Königreich zahlt ihr in Pfund über unseren Partner Paddle (paddle.com): gleiche Zahl wie in Euro, inkl. britischer Umsatzsteuer (z. B. 29 € → £29, 8,90 € → £8.99). Paddle ist dort Verkäufer und stellt die Rechnung aus. Gutscheincodes können dabei leider nicht eingelöst werden.",
            "For private customers in the United Kingdom you pay in pounds via our partner Paddle (paddle.com): the same figure as in euros, including UK VAT (e.g. €29 → £29, €8.90 → £8.99). Paddle is the seller and issues the invoice. Unfortunately, promo codes cannot be redeemed this way.")
        : T("Bestellungen von Privatpersonen aus dem Vereinigten Königreich sind in Kürze möglich. Firmen mit britischer VAT-Nummer können schon jetzt bestellen.",
            "Orders from private customers in the United Kingdom will be possible very soon. Businesses with a UK VAT number can already order.");
    }
    note.textContent = n; note.hidden = !n;
  }
  sel.addEventListener("change", paint);
  uid.addEventListener("input", paint);
  if (form) form.addEventListener("change", (e) => { if (e.target && e.target.name === "kunde") paint(); });
  paint();

  window.MSBill = {
    read: () => ({ bill_land: sel.value, uid: kunde() === "b2b" ? uid.value.trim() : "" }),
    check: () => (sel.value ? null : [T("Bitte das Rechnungsland auswählen.", "Please choose the billing country."), sel]),
  };
})();
