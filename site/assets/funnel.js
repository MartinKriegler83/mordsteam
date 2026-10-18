// Trichter der Specials-Seite (18.10.2026): zählt anonym, wie weit Besucher kommen.
// Gemeldet werden nur Seite + Ereignis – keine Cookies, nichts im Browser gespeichert:
// view (Seite geladen), s50/s90 (halb/fast ganz gescrollt), video (Teaser startet, also ins Bild gescrollt),
// ton (Ton am Teaser eingeschaltet), probe (Klick „Erste Frage gratis“), buy (Klick auf einen Kaufknopf).
(function () {
  var me = document.currentScript || document.querySelector("script[data-page]");
  var page = me && me.getAttribute("data-page");
  if (!page) return;
  var sent = {};
  function send(e) {
    if (sent[e]) return;
    sent[e] = 1;
    try { fetch("/api/shop/ev?p=" + encodeURIComponent(page) + "&e=" + e, { keepalive: true }).catch(function () {}); } catch (x) {}
  }
  send("view");
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (h <= 0) return;
    var p = scrollY / h;
    if (p >= 0.5) send("s50");
    if (p >= 0.9) { send("s90"); removeEventListener("scroll", onScroll); }
  }
  addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("[data-fn]");
    if (a) send(a.getAttribute("data-fn"));
    var s = ev.target.closest && ev.target.closest(".tvid-sound:not(.tvid-pause)");
    if (s) send("ton");
  });
  document.addEventListener("play", function (ev) { if (ev.target && ev.target.tagName === "VIDEO") send("video"); }, true);
})();
