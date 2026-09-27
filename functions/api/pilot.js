// Cloudflare Pages Function: POST /api/pilot
// Speichert Pilot-Bewerbungen im KV-Namespace, der im Cloudflare-Dashboard
// unter dem Namen PILOT an das Pages-Projekt gebunden wird.

const FIELDS = {
  gruppe: 40, firma: 120, name: 120, email: 160, telefon: 40, land: 40,
  teamgroesse: 40, anlass: 60, zeitraum: 80, nachricht: 2000,
};
const REQUIRED = ["gruppe", "firma", "name", "email", "land", "teamgroesse"];
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  const redirect = (path) => Response.redirect(new URL(path, request.url).toString(), 303);

  // Honeypot: Bots füllen das versteckte Feld aus – still ignorieren.
  if ((form.get("website") || "").toString().trim() !== "") return redirect("/danke.html");

  const entry = {};
  for (const [key, max] of Object.entries(FIELDS)) {
    entry[key] = (form.get(key) || "").toString().trim().slice(0, max);
  }
  const missing = REQUIRED.filter((k) => !entry[k]);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email);
  if (missing.length || !emailOk || form.get("datenschutz") !== "ja") {
    return new Response("Bitte alle Pflichtfelder ausfüllen und die Datenschutzerklärung bestätigen.", {
      status: 400, headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (!env.PILOT) {
    return new Response("Speicher nicht eingerichtet (KV-Binding PILOT fehlt).", { status: 500 });
  }

  entry.eingegangen = new Date().toISOString();
  const key = `pilot:${entry.eingegangen}:${crypto.randomUUID().slice(0, 8)}`;
  await env.PILOT.put(key, JSON.stringify(entry), { expirationTtl: ONE_YEAR });

  return redirect("/danke.html");
}

export function onRequestGet({ request }) {
  return Response.redirect(new URL("/pilot.html", request.url).toString(), 303);
}
