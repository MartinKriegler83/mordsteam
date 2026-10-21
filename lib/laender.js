// Länderliste für Brightpage-Kunden (Annahmeformular, Prüfung des Ländercodes) – 21.10.2026.
// [ISO-Code, Deutsch, Englisch]; zuerst die häufigsten, dann EU und wichtige Drittländer alphabetisch.
export const LAENDER = [
  ["AT", "Österreich", "Austria"], ["DE", "Deutschland", "Germany"], ["CH", "Schweiz", "Switzerland"], ["LI", "Liechtenstein", "Liechtenstein"],
  ["IT", "Italien", "Italy"], ["GB", "Vereinigtes Königreich", "United Kingdom"], ["US", "USA", "United States"],
  ["AU", "Australien", "Australia"], ["BE", "Belgien", "Belgium"], ["BG", "Bulgarien", "Bulgaria"], ["CA", "Kanada", "Canada"], ["CY", "Zypern", "Cyprus"],
  ["CZ", "Tschechien", "Czechia"], ["DK", "Dänemark", "Denmark"], ["EE", "Estland", "Estonia"], ["ES", "Spanien", "Spain"], ["FI", "Finnland", "Finland"],
  ["FR", "Frankreich", "France"], ["GR", "Griechenland", "Greece"], ["HR", "Kroatien", "Croatia"], ["HU", "Ungarn", "Hungary"], ["IE", "Irland", "Ireland"],
  ["IS", "Island", "Iceland"], ["LT", "Litauen", "Lithuania"], ["LU", "Luxemburg", "Luxembourg"], ["LV", "Lettland", "Latvia"], ["MT", "Malta", "Malta"],
  ["NL", "Niederlande", "Netherlands"], ["NO", "Norwegen", "Norway"], ["NZ", "Neuseeland", "New Zealand"], ["PL", "Polen", "Poland"], ["PT", "Portugal", "Portugal"],
  ["RO", "Rumänien", "Romania"], ["RS", "Serbien", "Serbia"], ["SE", "Schweden", "Sweden"], ["SI", "Slowenien", "Slovenia"], ["SK", "Slowakei", "Slovakia"],
  ["BA", "Bosnien und Herzegowina", "Bosnia and Herzegovina"], ["TR", "Türkei", "Turkey"], ["UA", "Ukraine", "Ukraine"], ["AE", "Vereinigte Arabische Emirate", "United Arab Emirates"],
  ["JP", "Japan", "Japan"], ["SG", "Singapur", "Singapore"],
];
export const LAND_OK = new Set(LAENDER.map((l) => l[0]));
