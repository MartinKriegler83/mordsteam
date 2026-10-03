// Handy-Menü nach einem Klick auf einen Link schließen (wichtig bei Sprüngen innerhalb derselben Seite)
document.querySelectorAll("details.menu").forEach((m) => m.addEventListener("click", (e) => { if (e.target.closest("a")) m.open = false; }));

// Newsletter-Links tragen ?nl=<Kürzel>. Das Kürzel wird an interne Links weitergegeben (nichts wird im Browser gespeichert),
// damit eine Bestellung dem Newsletter zugeordnet werden kann. Der Besuch wird einmal gezählt (nur Kürzel und Tag).
(function () {
  const tag = new URLSearchParams(location.search).get("nl");
  if (!tag || !/^[a-z0-9][a-z0-9-]{0,39}$/i.test(tag)) return;
  if (!/[?&]nl=/.test(document.referrer || "")) fetch("/api/shop/nl-besuch?nl=" + encodeURIComponent(tag)).catch(() => {});
  document.querySelectorAll("a[href]").forEach((a) => {
    const h = a.getAttribute("href");
    if (!h || /^(mailto:|tel:|#|https?:\/\/(?!mordsteam\.com|www\.mordsteam\.com))/i.test(h)) return;
    try { const u = new URL(h, location.href); if (u.origin !== location.origin || u.searchParams.has("nl")) return; u.searchParams.set("nl", tag); a.setAttribute("href", u.pathname + u.search + u.hash); } catch {}
  });
})();

// Abschnitts-Hintergründe neu verteilen (gleiche Regel wie tools/zebra.py), z. B. nachdem die Bewertungen eingeblendet wurden
window.msZebra = function () {
  let n = 0;
  document.querySelectorAll("main > section").forEach((s) => {
    s.classList.remove("bg-a", "bg-b");
    if (s.hidden || /\b(facts|cta|sig|bh|tvid-sec)\b/.test(s.className)) return;
    s.classList.add(n++ % 2 ? "bg-b" : "bg-a");
  });
};
