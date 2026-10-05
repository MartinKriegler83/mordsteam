// Preise in Landeswährung (lib/prices.js): Großbritannien £, USA/Kanada/Mexiko $, sonst €.
// – Englische Seiten: alle markierten Preise (<span data-eur="2900">) nach dem Land des Besuchers (Cloudflare) oder der Auswahl unten.
// – Bestellformulare (DE und EN): Währung nach dem Rechnungsland (billing.js), siehe MSCur.forLand.
// Deutsche Seiten und Suchmaschinen bleiben in Euro.
(function () {
  const EN = document.documentElement.lang === "en";
  const BOT = navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent || "");
  const KEY = "ms_cur";
  const USD_LANDS = ["US", "CA", "MX"];
  let table = null, country = "";
  const listeners = [];
  const forLand = (l) => (l === "GB" ? "GBP" : USD_LANDS.includes(l) ? "USD" : "EUR");
  const conv = (eur, cur) => {
    if (!cur || cur === "EUR") return eur;
    const row = table && table[eur];
    return row && row[cur] != null ? row[cur] : null;
  };
  const fmt = (cents, cur, en = EN) => {
    const v = cents / 100, dec = !Number.isInteger(v);
    if (cur === "GBP") return "£" + (dec ? v.toFixed(2) : v);
    if (cur === "USD") return "$" + (dec ? v.toFixed(2) : v);
    return en ? "€" + (dec ? v.toFixed(2) : v) : (dec ? v.toFixed(2).replace(".", ",") : v) + " €";
  };
  let saved = null; try { saved = localStorage.getItem(KEY); } catch {}
  const pageCur = () => (["EUR", "GBP", "USD"].includes(saved) ? saved : forLand(country));

  function apply() {
    if (!EN || BOT || !table) return;
    const cur = pageCur();
    document.querySelectorAll("[data-eur]").forEach((el) => {
      const eur = Number(el.dataset.eur), c = conv(eur, cur);
      el.textContent = c == null ? fmt(eur, "EUR") : fmt(c, cur);
    });
    const sw = document.getElementById("cursw");
    if (sw) sw.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.c === cur)));
  }
  function switcher() {
    if (!EN || BOT || document.getElementById("cursw") || !document.querySelector("[data-eur]")) return;
    const f = document.querySelector(".footer .wrap");
    if (!f) return;
    const d = document.createElement("div");
    d.id = "cursw"; d.className = "cursw small";
    d.innerHTML = `<span>Prices in</span> <button type="button" data-c="EUR">€ EUR</button> <button type="button" data-c="GBP">£ GBP</button> <button type="button" data-c="USD">$ USD</button>`;
    d.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; saved = b.dataset.c; try { localStorage.setItem(KEY, saved); } catch {} apply(); });
    f.appendChild(d);
  }
  let cache = null; try { cache = JSON.parse(sessionStorage.getItem("ms_geo") || "null"); } catch {}
  const whenDom = (fn) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn());
  const ready = (d) => { table = d.table; country = d.country || ""; whenDom(() => { switcher(); apply(); listeners.splice(0).forEach((fn) => fn()); }); };
  if (cache && cache.table) ready(cache);
  else fetch("/api/shop/geo").then((r) => r.json()).then((d) => { try { sessionStorage.setItem("ms_geo", JSON.stringify(d)); } catch {} ready(d); }).catch(() => {});

  window.MSCur = {
    forLand, fmt,
    conv: (eur, cur) => { const c = conv(eur, cur); return c == null ? eur : c; },
    has: (eur, cur) => cur === "EUR" || conv(eur, cur) != null,
    country: () => country,
    ready: () => !!table,
    onReady: (fn) => (table && document.readyState !== "loading" ? fn() : listeners.push(fn)),
  };
})();
