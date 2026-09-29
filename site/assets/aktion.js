// Early-Bird-Banner oben auf der Startseite. Er steht fest im HTML (sichtbar auch ohne Server);
// dieses Skript gleicht ihn mit dem Shop ab: Prozentsatz, „nur noch bis …“ oder ausblenden, wenn die Aktion aus ist.
// Gesteuert über die Cloudflare-Variablen EARLYBIRD_PROZENT (0 = aus, Standard 40) und EARLYBIRD_BIS – nach Änderung neu ausrollen.
(function () {
  var bar = document.getElementById("ebbar");
  if (!bar || location.protocol === "file:") return;
  var EN = document.documentElement.lang === "en";
  fetch("/api/shop/meta" + (EN ? "?lang=en" : "")).then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
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
})();
