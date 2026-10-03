// Early-Bird-Banner oben auf der Startseite. Er steht fest im HTML (sichtbar auch ohne Server);
// dieses Skript gleicht ihn mit dem Shop ab: Prozentsatz, „nur noch bis …“ oder ausblenden, wenn die Aktion aus ist.
// Gesteuert über die Cloudflare-Variablen EARLYBIRD_PROZENT (0 = aus, Standard 25) und EARLYBIRD_BIS (Standard 2026-11-30) – nach Änderung neu ausrollen.
(function () {
  if (location.protocol === "file:") return;
  var bar = document.getElementById("ebbar");
  var EN = document.documentElement.lang === "en";
  if (bar) fetch("/api/shop/meta" + (EN ? "?lang=en" : "")).then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
    if (!m) return;                       // Shop nicht erreichbar: Banner so lassen
    var eb = m.earlybird;
    if (!eb) { bar.hidden = true; return; }
    bar.querySelectorAll(".ebp").forEach(function (x) { x.textContent = eb.prozent; });
    if (eb.bis) {
      var p = eb.bis.split("-");
      var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      bar.querySelector(".ebbis").textContent = EN ? " – only until " + (+p[2]) + " " + MON[+p[1] - 1] : " – nur noch bis " + (+p[2]) + "." + (+p[1]) + "." + p[0];
    }
  }).catch(function () {});

  // Bewertungen (nur freigegebene, mit Zustimmung der Kunden): bis zu 3 auf der Startseite, sonst bleibt der Block unsichtbar
  var sec = document.getElementById("bewertungen");
  if (!sec) return;
  fetch("/api/shop/bewertungen?lang=" + (EN ? "en" : "de") + (sec.dataset.produkt ? "&produkt=" + sec.dataset.produkt : "") + (sec.dataset.ort ? "&ort=" + sec.dataset.ort : "")).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    var list = (d && d.reviews || []).slice(0, 3);
    if (!list.length) return;
    var esc = function (s) { return String(s || "").replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); };
    document.getElementById("reviews").innerHTML = list.map(function (r) {
      return '<figure class="review"><span class="rs" aria-label="' + r.rating + '/5">' + "★★★★★".slice(0, r.rating) + '</span><p>' + (EN ? "“" : "„") + esc(r.text) + (EN ? "”" : "“") + '</p><small>' +
        esc((r.name || (r.produkt === "solo" || r.produkt === "friends" ? (EN ? "Investigator" : "Ermittler/in") : r.von === "spieler" ? (EN ? "Player" : "Mitspieler/in") : (EN ? "Investigator team" : "Ermittlerteam"))) + (sec.dataset.ort === "home" ? (r.produkt === "solo" ? " · Mordsteam Solo" : r.produkt === "friends" ? " · Mordsteam Friends" : " · Mordsteam Teams") : "")) + "</small></figure>";
    }).join("");
    sec.hidden = false; if (window.msZebra) window.msZebra();
  }).catch(function () {});
})();
