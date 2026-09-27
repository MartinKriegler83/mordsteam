// Mordsteam Fallzentrale – gemeinsame Hilfsfunktionen
const MS = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
  async api(method, path, body, headers = {}) {
    const r = await fetch("/api/spiel/" + path, {
      method,
      headers: { "content-type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    let d = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d.error || "Fehler " + r.status); e.status = r.status; throw e; }
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
  qs(name) { return new URLSearchParams(location.search).get(name); },
};
