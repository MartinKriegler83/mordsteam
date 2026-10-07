// Kurzlink für Solo-Codes (Geschenkkarte, 7.10.2026): /s/SWPFQ5YH → /spiel/solo.html?c=SWPFQ5YH
// Der Code selbst ist der Schlüssel – keine Datenbank nötig. Ungültiges Format → Solo-Startseite.
export function onRequestGet({ params, request }) {
  const c = String(params.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const to = /^S[A-Z2-9]{7}$/.test(c) ? `/spiel/solo.html?c=${c}` : "/spiel/solo.html";
  return Response.redirect(new URL(to, request.url).toString(), 302);
}
