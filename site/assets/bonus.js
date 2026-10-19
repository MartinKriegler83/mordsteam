// Gratis-Bonus-Rätsel auf der Specials-Seite (19.10.2026) – Inhalt aus tools/bonus_raetsel.mjs.
// Rätsel 1: Skelett mit Schuhen antippen (Lösung „c“), dann auf dem Partyfoto die Person (Lösung „josh“).
// Rätsel 2: Candy-Code – Buchstaben antippen, Wort steht in data-word. Zählung im Trichter: bz0 (erster Tipp), bz1, bz2, bz3.
// Kein Speichern im Browser, keine Cookies.
(function () {
  var sec = document.getElementById("raetsel");
  if (!sec) return;
  var page = (document.documentElement.lang || "de").slice(0, 2) === "en" ? "specials-en" : "specials-de";
  var sent = {};
  function ev(e) {
    if (sent[e]) return; sent[e] = 1;
    try { fetch("/api/shop/ev?p=" + page + "&e=" + e, { keepalive: true }).catch(function () {}); } catch (x) {}
  }
  var $ = function (s) { return sec.querySelector(s); };
  var step = function (n) { return sec.querySelector('[data-step="' + n + '"]'); };
  function show(el) { el.hidden = false; setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 60); }
  function say(box, text, ok) { box.innerHTML = text; box.className = "bz-msg " + (ok ? "ok" : "no"); }
  function pickable(root, fn) {
    root.querySelectorAll(".bz-hit").forEach(function (g) {
      var go = function () { ev("bz0"); fn(g.getAttribute("data-pick"), g); };
      g.addEventListener("click", go);
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }

  // Rätsel 1, Schritt 1
  var s1 = step(1), m1 = s1.querySelector(".bz-msg"), done1 = false;
  pickable(s1, function (k, g) {
    if (done1) return;
    s1.querySelectorAll(".bz-hit").forEach(function (x) { x.classList.remove("no"); });
    if (k === "c") { done1 = true; g.classList.add("yes"); say(m1, m1.getAttribute("data-right"), true); ev("bz1"); show(step(2)); }
    else { g.classList.add("no"); say(m1, m1.getAttribute("data-wrong"), false); }
  });
  // Rätsel 1, Schritt 2
  var s2 = step(2), m2 = s2.querySelector(".bz-msg"), done2 = false;
  pickable(s2, function (k, g) {
    if (done2) return;
    s2.querySelectorAll(".bz-hit").forEach(function (x) { x.classList.remove("no"); });
    if (k === "josh") { done2 = true; g.classList.add("yes"); m2.textContent = ""; ev("bz2"); show(sec.querySelector('[data-done="1"]')); return; }
    g.classList.add("no");
    say(m2, m2.getAttribute(k === "marty" ? "data-height" : "data-shoe"), false);
  });
  // Rätsel 2
  var s3 = step(3), m3 = s3.querySelector(".bz-msg"), out = s3.querySelector(".bz-word"), word = (sec.getAttribute("data-word") || "").toUpperCase(), got = "", done3 = false;
  sec.querySelector(".bz-more").addEventListener("click", function () { this.hidden = true; show(s3); });
  function paint() { var t = got.split(""); while (t.length < word.length) t.push("_"); out.textContent = t.join(" "); }
  function tap(l) {
    if (done3 || got.length >= word.length) return;
    ev("bz0"); got += l; paint(); m3.textContent = ""; m3.className = "bz-msg";
    if (got.length < word.length) return;
    if (got === word) { done3 = true; ev("bz3"); show(sec.querySelector('[data-done="2"]')); }
    else { say(m3, m3.getAttribute("data-wrong"), false); setTimeout(function () { got = ""; paint(); }, 1200); }
  }
  s3.querySelectorAll(".bz-cell").forEach(function (c) {
    var l = c.getAttribute("data-l");
    c.addEventListener("click", function () { tap(l); });
    c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(l); } });
  });
  s3.querySelector(".bz-del").addEventListener("click", function () { if (!done3) { got = ""; paint(); m3.textContent = ""; } });

  // Kommt jemand über die Rätsel-Anzeige (?src=…-r), gleich zum Rätsel springen
  try { if (/-r$/.test(new URLSearchParams(location.search).get("src") || "")) setTimeout(function () { sec.scrollIntoView({ block: "start" }); }, 300); } catch (x) {}
})();
