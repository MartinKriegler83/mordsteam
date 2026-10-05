// Paddle-Kasse für britische Privatkunden. Paddle hängt ?_ptxn=… an und öffnet die Kasse nach Paddle.Initialize automatisch.
(function () {
  const q = new URLSearchParams(location.search);
  const EN = q.get("l") !== "de", T = (de, en) => (EN ? en : de);
  const $ = (id) => document.getElementById(id);
  document.documentElement.lang = EN ? "en" : "de";
  if (!EN) {
    $("zh").textContent = "Bezahlung";
    $("zt").textContent = "Die sichere Kasse unseres Partners Paddle öffnet sich gleich …";
    $("zi").textContent = "Für Privatkunden im Vereinigten Königreich ist Paddle.com Verkäufer (Merchant of Record): Paddle berechnet die britische Umsatzsteuer und stellt die Rechnung aus. Eure Spielrunde legt wie gewohnt Mordsteam an.";
    $("zopen").textContent = "Kasse öffnen"; $("zback").textContent = "Zurück";
  }
  const o = q.get("o"), k = q.get("k"), txn = q.get("_ptxn");
  const done = `${location.origin}${EN ? "/en/ordered.html" : "/bestellt.html"}?o=${encodeURIComponent(o || "")}&k=${encodeURIComponent(k || "")}`;
  $("zback").href = EN ? "/en/" : "/";
  const err = (m) => { $("zerr").textContent = m; $("zerr").hidden = false; };
  if (!txn || !o || !k) return err(T("Der Link ist unvollständig. Bitte die Bestellung neu starten.", "This link is incomplete. Please start your order again."));
  fetch("/api/shop/paddle-config").then((r) => r.json()).then((c) => {
    if (!c.on || !window.Paddle) return err(T("Die Zahlung ist gerade nicht verfügbar. Bitte später noch einmal versuchen.", "Payment is not available right now. Please try again later."));
    if (c.env !== "live") Paddle.Environment.set("sandbox");
    Paddle.Initialize({
      token: c.token,
      checkout: { settings: { displayMode: "overlay", locale: EN ? "en" : "de", successUrl: done } },
      eventCallback: (ev) => { if (ev && ev.name === "checkout.completed") setTimeout(() => (location.href = done), 800); },
    });
    $("zopen").hidden = false;
    $("zopen").onclick = (e) => { e.preventDefault(); Paddle.Checkout.open({ transactionId: txn, settings: { displayMode: "overlay", locale: EN ? "en" : "de", successUrl: done } }); };
  }).catch(() => err(T("Die Zahlung konnte nicht geladen werden.", "The payment could not be loaded.")));
})();
