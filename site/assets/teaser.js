// Teaser-Video auf den Fallseiten: Hochformat am Handy, Querformat am Laptop.
// Startet stumm, sobald es ins Bild kommt – auf allen Geräten (Entscheidung 4.10.2026, auch bei „Bewegung reduzieren“).
// Blockiert der Browser das automatische Abspielen (z. B. Safari-Einstellung oder Stromsparmodus), erscheinen die
// Bedienelemente, und das Video startet beim ersten Klick oder Tastendruck auf der Seite. Knopf für Ton.
(function () {
  document.querySelectorAll(".tvid").forEach(function (box) {
    var v = box.querySelector("video"), btn = box.querySelector(".tvid-sound");
    if (!v) return;
    var hoch = window.matchMedia("(max-aspect-ratio: 1/1)").matches;
    var name = box.getAttribute("data-video"), fmt = hoch ? "916" : "169";
    box.classList.add(hoch ? "hoch" : "quer");
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("autoplay", "");
    v.poster = "/assets/video/" + name + "-" + fmt + ".jpg";
    v.src = "/assets/video/" + name + "-" + fmt + ".mp4";
    var sichtbar = false, wartet = false;
    function nachKlick() {
      if (wartet) return;
      wartet = true;
      v.controls = true;
      var los = function () {
        document.removeEventListener("pointerdown", los, true);
        document.removeEventListener("keydown", los, true);
        wartet = false;
        if (sichtbar) play();
      };
      document.addEventListener("pointerdown", los, true);
      document.addEventListener("keydown", los, true);
    }
    function play() { var p = v.play(); if (p && p.catch) p.catch(nachKlick); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { sichtbar = e.isIntersecting; if (sichtbar) play(); else v.pause(); });
      }, { threshold: 0.25 }).observe(v);
    } else { sichtbar = true; play(); }
    if (btn) btn.addEventListener("click", function () {
      v.muted = !v.muted;
      if (!v.muted) { v.currentTime = 0; play(); }
      btn.setAttribute("aria-pressed", String(!v.muted));
      btn.textContent = v.muted ? btn.getAttribute("data-on") : btn.getAttribute("data-off");
    });
  });
})();
