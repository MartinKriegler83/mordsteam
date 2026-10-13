// Datenbank-Absicherung (13.10.2026): Meldet D1 „überlastet“ oder „busy/locked“, wurde die Abfrage NICHT ausgeführt –
// dann einmal kurz warten und dieselbe Abfrage noch einmal schicken, bevor ein Fehler beim Spieler ankommt.
// Andere Fehler (z. B. Syntax, Constraint) werden nie wiederholt. Wirkt für alle /api/*-Aufrufe über functions/api/_middleware.js.
const TRANSIENT = /overloaded|SQLITE_BUSY|database is locked/i;
const RAW = Symbol("raw");
const pause = () => new Promise((r) => setTimeout(r, 150 + Math.floor(Math.random() * 250)));
export const retryStats = { retried: 0 };

async function again(fn) {
  try { return await fn(); }
  catch (e) {
    if (!TRANSIENT.test(String((e && e.message) || e))) throw e;
    retryStats.retried++;
    await pause();
    return fn();
  }
}
function stmt(s) {
  return new Proxy(s, {
    get(t, k) {
      if (k === RAW) return t;
      if (k === "bind") return (...a) => stmt(t.bind(...a));
      if (k === "run" || k === "first" || k === "all" || k === "raw") return (...a) => again(() => t[k](...a));
      const v = t[k];
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}
export function withRetry(db) {
  if (!db || db[RAW]) return db;
  return new Proxy(db, {
    get(t, k) {
      if (k === RAW) return t;
      if (k === "prepare") return (...a) => stmt(t.prepare(...a));
      if (k === "batch") return (list) => again(() => t.batch(list.map((x) => (x && x[RAW]) || x)));
      const v = t[k];
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}
