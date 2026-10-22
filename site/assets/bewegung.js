// Bewegung auf der Website (22.10.2026, Martin: Ideen 1–3, Idee 4 mit der Weihnachtsversion).
// Grundsätze: jede Bewegung läuft nur einmal, nichts bewegt sich neben Text, den man liest; „Bewegung reduzieren“ im
// System schaltet alles ab (dann steht alles sofort da). Ohne JavaScript bleibt die Seite wie bisher.
//  1 Startseite: „Probier's: dein Vorname“ – der Name erscheint in einem Aktenauszug (nur im Browser, nichts wird gespeichert/gesendet)
//  2 Startseite: die drei Fall-Karten werden beim Hereinscrollen wie Akten auf den Tisch gelegt, Stempel „Jetzt spielbar“ fällt nach
//  3 Seiten mit „Drei Schritte …“: roter Faden von Nadel zu Nadel (nur ab 760 px, wenn die Schritte nebeneinander stehen)
//  4 Weihnachts-Abschnitt der Startseite: die Marktlichter gehen aus, vier Minuten im Zeitraffer, dann wieder an
// Zählung (wie Specials): home-de/home-en – „name“ (Name eingetippt), „fall“ (Klick auf Fall wählen / Zu Mordsteam …)
(function () {
  var en = document.documentElement.lang === "en", T = function (de, e) { return en ? e : de; };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IO = "IntersectionObserver" in window && !reduce;
  var root = document.documentElement;
  function once(el, fn, th) {
    if (!IO) { fn(); return; }
    var o = new IntersectionObserver(function (es) { for (var i = 0; i < es.length; i++) if (es[i].isIntersecting) { o.disconnect(); fn(); return; } }, { threshold: th || 0.3 });
    o.observe(el);
  }
  var fs = document.querySelector('script[data-page^="home-"]'), sent = {};
  function ev(e) { if (!fs || sent[e]) return; sent[e] = 1; try { fetch("/api/shop/ev?p=" + fs.getAttribute("data-page") + "&e=" + e, { keepalive: true }).catch(function () {}); } catch (x) {} }

  // ---------- 1 Der Name in der Akte ----------
  var act = document.querySelector(".bh .actions");
  if (act) {
    var box = document.createElement("div");
    box.className = "bw-try";
    box.innerHTML = '<label for="bw-n">' + T("Probier’s: dein Vorname", "Try it: your first name") + '</label><input id="bw-n" maxlength="18" autocomplete="off" spellcheck="false" placeholder="' + T("z. B. Sabine", "e.g. Sarah") + '">' +
      '<div class="bw-akte" aria-live="polite"><p class="k">' + T("Akte 001 · Tatnacht, 23:14 Uhr", "Case file 001 · Night of the crime, 11:14 pm") + "</p>" +
      "<p>" + T("Die Zeugin sah ", "The witness saw ") + '<span class="bw-red"><mark data-n></mark></span>' + T(" um 23:10 Uhr am Kopierer im 2. Stock.", " at the photocopier on the 2nd floor at 11:10 pm.") + "</p>" +
      '<p><span class="bw-red"><mark data-n></mark></span>' + T(" behauptet, um diese Zeit längst zu Hause gewesen zu sein.", " claims to have been at home long before then.") + "</p>" +
      '<p class="k">' + T("Eine der beiden Aussagen ist gelogen.", "One of the two statements is a lie.") + '</p><span class="bw-stamp" aria-hidden="true">' + T("Verdächtig", "Suspect") + "</span></div>";
    act.parentNode.insertBefore(box, act.nextSibling);
    var inp = box.querySelector("input"), def = T("Sabine", "Sarah");
    var setN = function () { var v = inp.value.replace(/[<>]/g, "").trim() || def; box.querySelectorAll("[data-n]").forEach(function (m) { m.textContent = v; }); };
    setN();
    inp.addEventListener("input", function () { setN(); if (inp.value.trim().length >= 2) ev("name"); });
    once(box.querySelector(".bw-akte"), function () { setTimeout(function () { box.classList.add("bw-on"); }, reduce ? 0 : 350); }, 0.5);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".bh .btn-red, .game .btn, .sp-home .btn");
    if (a) ev("fall");
  });

  // ---------- 2 Akten auf den Tisch ----------
  var cards = document.querySelectorAll(".games .game");
  if (cards.length && IO) {
    var vh = window.innerHeight;
    cards.forEach(function (c, i) {
      if (c.getBoundingClientRect().top < vh * 0.9) return;   // schon im Bild → nicht verstecken
      c.style.setProperty("--bw-r", ["-4deg", "3deg", "-2.5deg"][i % 3]);
      c.style.setProperty("--bw-d", (i % 3) * 0.12 + "s");
      c.classList.add("bw-wait");
    });
    var wait = document.querySelector(".games");
    if (wait) once(wait, function () { cards.forEach(function (c) { if (c.classList.contains("bw-wait")) c.classList.add("bw-in"); }); }, 0.15);
  }

  // ---------- 3 Der rote Faden ----------
  document.querySelectorAll(".steps").forEach(function (st) {
    var S = st.querySelectorAll(":scope > .step");
    if (S.length !== 3) return;
    st.classList.add("bw-steps");
    S.forEach(function (s) { var p = document.createElement("span"); p.className = "bw-pin"; p.setAttribute("aria-hidden", "true"); s.appendChild(p); });
    var NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), path = document.createElementNS(NS, "path");
    svg.setAttribute("class", "bw-thread"); svg.setAttribute("aria-hidden", "true"); svg.appendChild(path); st.appendChild(svg);
    var draw = function () {
      var r = st.getBoundingClientRect(), d = "", px = 0;
      st.querySelectorAll(".bw-pin").forEach(function (p, i) {
        var q = p.getBoundingClientRect(), x = q.left - r.left + q.width / 2, y = q.top - r.top + q.height / 2;
        d += i ? " Q " + (px + (x - px) / 2) + " " + (y + 34) + " " + x + " " + y : "M " + x + " " + y; px = x;
      });
      path.setAttribute("d", d);
      var len = path.getTotalLength ? Math.ceil(path.getTotalLength()) : 1500;
      svg.style.setProperty("--bw-len", len);
    };
    draw(); addEventListener("resize", draw);
    once(st, function () { draw(); svg.classList.add("bw-in"); }, 0.4);
  });

  // ---------- 4 Der Markt wird dunkel (nur Weihnachts-Abschnitt der Startseite) ----------
  var xs = document.querySelector(".sp-home.sp-xmas"), xa = xs && xs.querySelector(".actions");
  if (xa) {
    var L = document.createElement("div"); L.className = "bw-lights"; L.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 16; i++) L.appendChild(document.createElement("i"));
    var clk = document.createElement("div"); clk.className = "bw-clock"; clk.setAttribute("aria-hidden", "true");
    xa.parentNode.insertBefore(L, xa); xa.parentNode.insertBefore(clk, xa);
    if (!reduce) once(L, function () {
      var b = L.querySelectorAll("i"), k = 0;
      var t = setInterval(function () {
        if (k < b.length) { b[k++].classList.add("off"); return; }
        clearInterval(t); xs.classList.add("bw-dark");
        var s = 240, c = setInterval(function () {
          s = Math.max(0, s - 8); clk.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
          if (!s) { clearInterval(c); setTimeout(function () { xs.classList.remove("bw-dark"); clk.textContent = ""; b.forEach(function (x, j) { setTimeout(function () { x.classList.remove("off"); }, j * 45); }); }, 600); }
        }, 45);
      }, 110);
    }, 0.6);
  }
  root.classList.add("bw");
})();
