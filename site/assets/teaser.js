// Teaser-Video auf den Fallseiten: Hochformat am Handy, Querformat am Laptop.
// Startet stumm, sobald es ins Bild kommt (nicht bei „Bewegung reduzieren“), Knopf für Ton.
(function () {
  document.querySelectorAll(".tvid").forEach(function (box) {
    var v = box.querySelector("video"), btn = box.querySelector(".tvid-sound");
    if (!v) return;
    var hoch = window.matchMedia("(max-aspect-ratio: 1/1)").matches;
    var name = box.getAttribute("data-video"), fmt = hoch ? "916" : "169";
    box.classList.add(hoch ? "hoch" : "quer");
    v.poster = "/assets/video/" + name + "-" + fmt + ".jpg";
    v.src = "/assets/video/" + name + "-" + fmt + ".mp4";
    var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    if (!ruhig && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) play(); else v.pause(); });
      }, { threshold: 0.4 }).observe(v);
    } else { v.controls = true; }
    if (btn) btn.addEventListener("click", function () {
      v.muted = !v.muted;
      if (!v.muted) { v.currentTime = 0; play(); }
      btn.setAttribute("aria-pressed", String(!v.muted));
      btn.textContent = v.muted ? btn.getAttribute("data-on") : btn.getAttribute("data-off");
    });
  });
})();
