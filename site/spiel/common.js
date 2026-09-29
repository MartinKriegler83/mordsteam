// Mordsteam Fallzentrale – gemeinsame Hilfsfunktionen
const MS = {
  // Sprache: ?lang=de|en in der Adresse, sonst zuletzt verwendete, sonst Browsersprache. Das Spiel meldet seine Sprache selbst (S.lang).
  lang: (() => {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "de" || q === "en") { try { localStorage.setItem("ms_lang", q); } catch {} return q; }
    let l = null; try { l = localStorage.getItem("ms_lang"); } catch {}
    return l === "en" || l === "de" ? l : /^de\b/i.test(navigator.language || "de") ? "de" : "en";
  })(),
  t(de, en) { return MS.lang === "en" ? en : de; },
  setLang(l) {
    l = l === "en" ? "en" : "de";
    if (l === MS.lang) return;
    MS.lang = l; MS.set("ms_lang", l); MS.i18n();
  },
  // Statische Texte: Element mit data-en="…" (HTML) bekommt je nach Sprache den englischen oder den ursprünglichen Inhalt
  i18n(root = document) {
    document.documentElement.lang = MS.lang;
    root.querySelectorAll("[data-en]").forEach((el) => {
      if (!el.hasAttribute("data-de")) el.setAttribute("data-de", el.innerHTML);
      el.innerHTML = MS.lang === "en" ? el.getAttribute("data-en") : el.getAttribute("data-de");
    });
    root.querySelectorAll("[data-en-ph]").forEach((el) => {
      if (!el.hasAttribute("data-de-ph")) el.setAttribute("data-de-ph", el.getAttribute("placeholder") || "");
      el.setAttribute("placeholder", MS.lang === "en" ? el.getAttribute("data-en-ph") : el.getAttribute("data-de-ph"));
    });
    root.querySelectorAll("[data-en-aria]").forEach((el) => {
      if (!el.hasAttribute("data-de-aria")) el.setAttribute("data-de-aria", el.getAttribute("aria-label") || "");
      el.setAttribute("aria-label", MS.lang === "en" ? el.getAttribute("data-en-aria") : el.getAttribute("data-de-aria"));
    });
  },
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
  async api(method, path, body, headers = {}) {
    const r = await fetch("/api/spiel/" + path, {
      method,
      headers: { "content-type": "application/json", "x-lang": MS.lang, ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    let d = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d.error || MS.t("Fehler ", "Error ") + r.status); e.status = r.status; throw e; }
    return d;
  },
  dur(ms) {
    const neg = ms < 0; ms = Math.abs(ms);
    const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    const p = (n) => String(n).padStart(2, "0");
    return (neg ? "−" : "") + (h ? `${h}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`);
  },
  esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },
  // Stand eines Teams in der Rangliste
  stage(r, tier) {
    if (r.solved) return MS.t("gelöst", "solved");
    if (!tier) return MS.t("ermittelt", "investigating");
    return ["", MS.t("Akt 1", "Act 1"), MS.t("Akt 2", "Act 2"), "Finale"][r.stage] || MS.t("ermittelt", "investigating");
  },
  qs(name) { return new URLSearchParams(location.search).get(name); },
};

document.addEventListener("DOMContentLoaded", () => MS.i18n());
// Sprachumschalter (nur Anmelde- und Organisatorseite; im Spiel gilt die gebuchte Sprache)
document.addEventListener("DOMContentLoaded", () => {
  const b = document.getElementById("langsw");
  if (!b) return;
  const paint = () => { b.textContent = MS.lang === "en" ? "DE" : "EN"; b.title = MS.lang === "en" ? "Deutsch" : "English"; };
  paint();
  b.onclick = () => { MS.setLang(MS.lang === "en" ? "de" : "en"); paint(); document.dispatchEvent(new Event("ms-lang")); };
});
