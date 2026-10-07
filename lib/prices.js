// Preise in Landeswährung (Entscheidung 5.10.2026). Eine Tabelle für Server und Website (/api/shop/geo liefert sie aus).
//   Großbritannien → GBP: gleiche Zahl wie in Euro, ,90 → ,99 (inkl. britischer USt bei Privatkunden über Stripe Managed Payments)
//   USA, Kanada, Mexiko → USD: etwa Euro × 1,15, auf glatte Preise gerundet (Kanada/Mexiko zahlen per Stripe Adaptive Pricing in Landeswährung)
//   alle anderen → EUR (Stripe Adaptive Pricing rechnet an der Kasse in Landeswährung um)
// Schlüssel = Euro-Betrag in Cent. Auch abgeleitete Beträge der Website (z. B. 3 Teams, Preis pro Person) stehen hier,
// damit die englischen Seiten jeden Preis umrechnen können. Neuen Euro-Preis eingeführt? Hier ergänzen (Checker prüft das).
export const PRICE_TABLE = {
  //  EUR       GBP     USD
  8900:  { GBP: 8900,  USD: 9900 },    // Teams Basic pro Team
  11900: { GBP: 11900, USD: 13900 },   // Teams Premium
  14900: { GBP: 14900, USD: 16900 },   // Teams Premium Plus
  2900:  { GBP: 2900,  USD: 3300 },    // Friends bis 4 Personen
  500:   { GBP: 500,   USD: 600 },     // Friends je weitere Person · Solo-Gutschein
  4900:  { GBP: 4900,  USD: 5600 },    // Friends Plus bis 4 Personen
  800:   { GBP: 800,   USD: 900 },     // Friends Plus je weitere Person
  890:   { GBP: 899,   USD: 999 },     // Solo 001/002
  1590:  { GBP: 1599,  USD: 1799 },    // Solo Plus
  1800:  { GBP: 1800,  USD: 2000 },    // Teams-Seite: Basic pro Person (Team mit 5)
  2400:  { GBP: 2400,  USD: 2800 },    // … Premium pro Person
  3000:  { GBP: 3000,  USD: 3400 },    // … Premium Plus pro Person
  26700: { GBP: 26700, USD: 29700 },   // Beispiel 3 Teams Basic
  35700: { GBP: 35700, USD: 41700 },   // … Premium
  44700: { GBP: 44700, USD: 50700 },   // … Premium Plus
  600:   { GBP: 600,   USD: 700 },     // Friends-Seite: pro Person bei 8 Personen (49 / 8)
  3900:  { GBP: 3900,  USD: 4500 },    // Friends-Bestellung: Startwert der Summe (6 Personen)
};
export const USD_LANDS = ["US", "CA", "MX"];
export const curOfLand = (land) => (land === "GB" ? "GBP" : USD_LANDS.includes(land) ? "USD" : "EUR");
// Euro-Preis in Währung umrechnen (nur Tabellenwerte; unbekannte Beträge werfen, damit nie ein falscher Preis kassiert wird)
export function convPrice(eurCents, cur) {
  if (cur === "EUR") return eurCents;
  const row = PRICE_TABLE[eurCents];
  if (!row || row[cur] == null) throw new Error(`Kein ${cur}-Preis für ${eurCents} Cent hinterlegt (lib/prices.js)`);
  return row[cur];
}
export const fmtMoney = (cents, cur) => {
  const v = cents / 100, s = Number.isInteger(v) ? String(v) : v.toFixed(2);
  return cur === "GBP" ? `£${s}` : cur === "USD" ? `$${s}` : `${s.replace(".", ",")} €`;
};
