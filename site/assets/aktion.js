// Aktionsbanner oben auf der Startseite (Early Bird). Ob die Aktion läuft, wie viel Rabatt und bis wann,
// steuern die Cloudflare-Variablen EARLYBIRD_PROZENT und EARLYBIRD_BIS – ohne neuen Push.
(function () {
  var bar = document.getElementById("ebbar");
  if (!bar) return;
  var EN = document.documentElement.lang === "en";
  fetch("/api/shop/meta" + (EN ? "?lang=en" : "")).then(function (r) { return r.json(); }).then(function (m) {
    var eb = m && m.earlybird;
    if (!eb) return;
    var bis = "";
    if (eb.bis) {
      var p = eb.bis.split("-");
      var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      bis = EN ? " – only until " + (+p[2]) + " " + MON[+p[1] - 1] : " – nur noch bis " + (+p[2]) + "." + (+p[1]) + "." + p[0];
    }
    bar.innerHTML = '<div class="wrap"><span class="tag">' + (EN ? "WE'RE LIVE" : "WIR SIND LIVE") + "</span><span>" +
      (EN ? "Early bird: " + eb.prozent + "% off your first game" : "Early Bird: " + eb.prozent + " % Rabatt auf euer erstes Spiel") +
      '<span class="star">*</span>' + bis + '</span><a href="' + (EN ? "early-bird.html" : "earlybird.html") + '">' +
      (EN ? "*Conditions" : "*Bedingungen") + "</a></div>";
    bar.hidden = false;
  }).catch(function () {});
})();
