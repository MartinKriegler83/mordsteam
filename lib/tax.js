// Umsatzsteuer je Bestellung (Kleinunternehmer Mordsteam e.U., Entscheidung 5.10.2026)
// Aus Rechnungsland, Kundenart und UID wird VOR der Zahlung festgelegt, was auf der Rechnung steht –
// Stripe lässt die Rechnung nach der Zahlung nicht mehr ändern.
//
//   ku       Österreich (alle) · EU-Privatkunden (bis 10.000 €/Jahr) · EU-Firmen ohne gültige UID
//            → steuerfrei als Kleinunternehmer, zählt zur 55.000-€-Grenze
//   rc_eu    EU-Firma (nicht AT) mit gültiger UID (VIES) → Reverse Charge, Zusammenfassende Meldung
//            (österreichische UIDs werden nicht über VIES geprüft, nur Format ATU + 8 Ziffern)
//   dl_b2b   Firma außerhalb der EU, auch Großbritannien (seit 7.10.2026, über Stripe in Pfund) → nicht steuerbar, Steuerschuld beim Kunden
//   dl_b2c   Privatkunde außerhalb der EU (ohne Großbritannien) → nicht steuerbar in Österreich
//   uk_mor   Privatkunden in Großbritannien → Stripe Managed Payments (Link ist Verkäufer, Merchant of Record) in Pfund inkl.
//            britischer USt (seit 7.10.2026, vorher Paddle – abgelehnt). Nur mit Cloudflare-Variable MANAGED_PAYMENTS=true,
//            sonst „in Kürze möglich“
//
// Cloudflare-Variablen: MANAGED_PAYMENTS (true = UK-Privatkunden über Stripe Managed Payments), UID_NR (eigene UID, erscheint auf allen Rechnungen, sobald gesetzt), VIES_API_BASE (nur Tests)

export const EU = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
export const NON_EU = ["CH", "LI", "GB", "NO", "IS", "US", "CA", "MX", "AU", "NZ", "XX"];   // XX = anderes Land außerhalb der EU
export const BILL_COUNTRIES = [...EU, ...NON_EU];

export class TaxInputError extends Error {}

const L = (site, de, en) => (site === "en" ? en : de);
const viesPrefix = (c) => (c === "GR" ? "EL" : c);

// UID vereinheitlichen: Leerzeichen, Punkte, Bindestriche weg, Großbuchstaben, Länderkürzel ergänzen
export function normUid(raw, land) {
  let u = String(raw || "").toUpperCase().replace(/[\s.\-\/]/g, "");
  if (!u) return "";
  const p = land === "GB" ? "GB" : viesPrefix(land);
  if (/^\d/.test(u)) u = p + u;
  return u.slice(0, 20);
}

// VIES (EU-Kommission): gültig ja/nein; wirft bei Ausfall
async function viesCheck(env, uid) {
  const cc = uid.slice(0, 2), num = uid.slice(2);
  const r = await fetch((env.VIES_API_BASE || "https://ec.europa.eu/taxation_customs/vies/rest-api") + "/check-vat-number", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ countryCode: cc, vatNumber: num }),
    signal: AbortSignal.timeout(10000),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d || (d.actionSucceed === false) || typeof d.valid !== "boolean") throw new Error("vies");
  return { valid: d.valid, name: String(d.name || "").replace(/^-+$/, "").trim().slice(0, 120) };
}

// Hauptfunktion: liest bill_land/uid aus dem Kontakt, prüft und gibt die Steuerdaten zurück
export async function taxContext(env, k, site, kunde) {
  const land = String(k.bill_land || "").toUpperCase();
  if (!BILL_COUNTRIES.includes(land)) throw new TaxInputError(L(site, "Bitte das Rechnungsland auswählen.", "Please choose the billing country."));
  let uid = normUid(k.uid, land), uidOk = false, uidName = "";
  if (kunde !== "b2b") uid = "";
  if (uid) {
    if (land === "AT") {
      // Österreich: immer Kleinunternehmer (ku) – keine VIES-Abfrage nötig, nur grobe Formatprüfung.
      // So kann eine österreichische Firma auch bestellen, wenn VIES gerade nicht erreichbar ist.
      if (!/^ATU\d{8}$/.test(uid)) throw new TaxInputError(L(site, "Bitte eine österreichische UID im Format ATU12345678 angeben – oder das Feld leer lassen.", "Please enter an Austrian VAT ID in the format ATU12345678 – or leave the field empty."));
      uidOk = true;
    } else if (EU.includes(land)) {
      if (uid.slice(0, 2) !== viesPrefix(land)) throw new TaxInputError(L(site, `Die UID passt nicht zum Rechnungsland (sie muss mit ${viesPrefix(land)} beginnen).`, `The VAT ID does not match the billing country (it must start with ${viesPrefix(land)}).`));
      let v;
      try { v = await viesCheck(env, uid); }
      catch { throw new TaxInputError(L(site, "Die UID kann gerade nicht geprüft werden (EU-Prüfsystem nicht erreichbar). Bitte in ein paar Minuten noch einmal versuchen – oder das UID-Feld leer lassen.", "The VAT ID cannot be checked right now (EU checking system unavailable). Please try again in a few minutes – or leave the VAT ID field empty.")); }
      if (!v.valid) throw new TaxInputError(L(site, "Diese UID ist laut EU-Prüfsystem (VIES) nicht gültig. Bitte prüfen oder das Feld leer lassen.", "According to the EU system (VIES) this VAT ID is not valid. Please check it or leave the field empty."));
      uidOk = true; uidName = v.name;
    } else if (land === "GB") {
      if (!/^GB(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/.test(uid)) throw new TaxInputError(L(site, "Bitte eine britische VAT-Nummer im Format GB123456789 angeben – oder das Feld leer lassen.", "Please enter a UK VAT number in the format GB123456789 – or leave the field empty."));
      uidOk = true;   // Großbritannien ist nicht mehr in VIES; Formatprüfung
    } else {
      uidOk = uid.length >= 4;   // andere Länder: Steuernummer wird nur angedruckt
    }
  }
  let regime;
  if (land === "AT") regime = "ku";
  else if (EU.includes(land)) regime = kunde === "b2b" && uidOk ? "rc_eu" : "ku";
  else if (land === "GB") regime = kunde === "b2b" ? "dl_b2b" : "uk_mor";
  else regime = kunde === "b2b" ? "dl_b2b" : "dl_b2c";
  return { bill_land: land, uid: uid || "", uid_ok: uidOk, uid_name: uidName, regime };
}

// Rechnungsfußzeile je Fall (DE/EN nach Bestellseite)
// Firmenangaben nach § 14 UGB auf jeder Rechnung (Stripe nimmt die Fußzeile aus der Bestellung, nicht aus den Kontoeinstellungen)
export const companyLine = (site) => L(site, "Mordsteam e.U. · Inhaber Martin Kriegler · Sportplatzgasse 16, 7152 Pamhagen, Österreich · Firmenbuch FN 689638z, Landesgericht Eisenstadt",
  "Mordsteam e.U. · Owner Martin Kriegler · Sportplatzgasse 16, 7152 Pamhagen, Austria · Company register FN 689638z, Regional Court Eisenstadt");
export function invoiceFooter(regime, site) { return vatLine(regime, site) + "\n" + companyLine(site); }
function vatLine(regime, site) {
  if (regime === "rc_eu") return L(site,
    "Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, Art. 196 MwSt-RL): Die Umsatzsteuer schuldet der Leistungsempfänger.",
    "Reverse charge (Art. 196 EU VAT Directive): VAT is to be accounted for by the recipient.");
  if (regime === "dl_b2b") return L(site,
    "Nicht im Inland steuerbare Leistung – Steuerschuldnerschaft des Leistungsempfängers.",
    "Not subject to Austrian VAT (place of supply outside Austria) – reverse charge: any VAT is to be accounted for by the recipient.");
  if (regime === "dl_b2c") return L(site,
    "Nicht im Inland steuerbare Leistung (Leistungsort im Land des Kunden), keine österreichische Umsatzsteuer.",
    "Not subject to Austrian VAT (place of supply in the customer's country).");
  return L(site, "Umsatzsteuerfrei aufgrund der Kleinunternehmerregelung gemäß § 6 Abs. 1 Z 27 UStG.", "VAT exempt under the Austrian small business scheme (§ 6 (1) no. 27 UStG).");
}

// Zusatzfelder der Stripe-Rechnung (höchstens 4): Firma, UID des Kunden, eigene UID
export function invoiceFields(env, site, contact) {
  const f = [];
  if (contact.rechnung_firma) f.push({ name: L(site, "Firma", "Company"), value: contact.rechnung_firma.slice(0, 30) });
  if (contact.uid) f.push({ name: L(site, "UID Kunde", "Customer VAT ID"), value: contact.uid.slice(0, 30) });
  if (env.UID_NR) f.push({ name: L(site, "UID Mordsteam", "Our VAT ID"), value: String(env.UID_NR).slice(0, 30) });
  return f.length ? { custom_fields: f.slice(0, 4) } : {};
}
