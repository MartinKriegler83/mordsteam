// Bestellformular: Daten erfassen, prüfen, an /api/shop/bestellung senden → Stripe
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const form = $("#order");
  const DRAFT = "ms_order_draft";
  let META = null;
  let logoData = null;

  const LABELS = {
    FIRMA: ["Firmenname *", ""],
    STADT: ["Stadt *", ""],
    PARK: ["Park in der Nähe *", "Ein Detail im Fall"],
    RAUM_FEIER: ["Wo feiert ihr? *", "z. B. Kantine, Dachterrasse, Besprechungsraum 3"],
    RAUM_TATORT: ["Büro der Chefin / des Chefs *", "der Tatort"],
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const eur = (c) => (c / 100).toLocaleString("de-AT", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €";
  const fmtDate = (d) => { if (!d) return "–"; const [y, m, t] = d.split("-"); return `${Number(t)}.${Number(m)}.${y}`; };
  const paket = () => form.paket.value;
  const premium = () => paket() !== "basis";
  const TN = { basis: "Basis, 50 Minuten", premium: "Premium, 70 Minuten", plus: "Premium Plus, 90 Minuten" };
  const field = (key) => META.fields.find((f) => f.key === key);

  function input(key, label, hint, cls = "") {
    const f = field(key);
    return `<div class="field ${cls}"><label for="v_${key}">${label}</label><input id="v_${key}" name="v_${key}" maxlength="80" placeholder="z. B. ${esc(f.example)}" autocomplete="off">${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
  }
  function anrede(key, label = "Anrede *") {
    return `<div class="field anr"><label for="v_${key}">${label}</label><select id="v_${key}" name="v_${key}"><option value="">–</option><option>Frau</option><option>Herr</option></select></div>`;
  }
  function person(prefix, title) {
    return `<div class="prow"><h3 class="subhead">${title}</h3><div class="pgrid">${anrede(prefix + "_ANR")}${input(prefix, "Vor- und Nachname *", "")}${input(prefix + "_FKT", "Funktion *", "")}${field(prefix + "_ABT") ? input(prefix + "_ABT", "Abteilung *", "") : ""}</div></div>`;
  }

  function build() {
    $("#f-firma").innerHTML = `<div class="two">${input("FIRMA", ...LABELS.FIRMA)}${input("STADT", ...LABELS.STADT)}</div>
      <div class="two">${input("RAUM_FEIER", ...LABELS.RAUM_FEIER)}${input("RAUM_TATORT", ...LABELS.RAUM_TATORT)}</div>
      <div class="two">${input("PARK", ...LABELS.PARK)}<div></div></div>`;
    $("#f-opfer").innerHTML = person("OPFER", "Das Opfer");
    $("#f-boss").innerHTML = person("BOSS", "Der Oberboss");
    $("#f-sus").innerHTML = [1, 2, 3, 4, 5, 6].map((i) => `<div class="susrow" data-i="${i}">${person("S" + i, `Verdächtige/r ${i}${i === 6 ? ' <span class="opt">nur Premium und Premium Plus</span>' : ""}`)}</div>`).join("");
    const sel = $("#teams");
    sel.innerHTML = [...Array(15)].map((_, i) => `<option value="${i + 1}">${i + 1} Team${i ? "s" : ""}</option>`).join("");
    sel.value = "3";
  }

  function update() {
    const p = premium();
    $(".susrow[data-i='6']").hidden = !p;
    const min = META.earliest;
    const d = $("#event_date");
    d.min = min;
    $("#datehint").textContent = `Frühestens ${fmtDate(min)}. Der Spielcode ist sofort nach dem Bezahlen da.`;
    const n = Number($("#teams").value);
    const sum = META.prices[paket()] * n;
    $("#pb-text").textContent = `${TN[paket()].split(",")[0]} · ${n} Team${n > 1 ? "s" : ""}`;
    $("#pb-sum").textContent = eur(sum);
    const v = (k) => (form["v_" + k]?.value || "").trim();
    $("#summary").innerHTML = `<dl>
      <dt>Paket</dt><dd>Fall 001 „${esc(META.fall)}“ – ${TN[paket()]}</dd>
      <dt>Teams</dt><dd>${n} × ${eur(META.prices[paket()])}</dd>
      <dt>Spieltag</dt><dd>${esc(fmtDate(d.value))}</dd>
      <dt>Firma</dt><dd>${esc(v("FIRMA") || "–")}</dd>
      <dt>Opfer</dt><dd>${esc(v("OPFER") || "–")}</dd>
      <dt>Verdächtige</dt><dd>${[...Array(p ? 6 : 5)].map((_, i) => esc(v("S" + (i + 1)) || "–")).join(", ")}</dd>
      <dt class="tot">Gesamt</dt><dd class="tot">${eur(sum)}</dd></dl>`;
  }

  // ---------- Logo: im Browser verkleinern ----------
  function loadLogo(file) {
    if (!file) return;
    if (file.size > 8e6) return showErr("Das Logo ist zu groß (max. 8 MB).");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 360;
      let w = img.naturalWidth || 360, h = img.naturalHeight || 120;
      const s = Math.min(1, max / Math.max(w, h));
      w = Math.max(1, Math.round(w * s)); h = Math.max(1, Math.round(h * s));
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      let data = cv.toDataURL("image/png");
      if (data.length > 380000) data = cv.toDataURL("image/webp", 0.85);
      if (data.length > 380000) data = cv.toDataURL("image/jpeg", 0.85);
      URL.revokeObjectURL(url);
      setLogo(data);
      save();
    };
    img.onerror = () => { URL.revokeObjectURL(url); showErr("Das Bild konnte nicht gelesen werden."); };
    img.src = url;
  }
  function setLogo(data) {
    logoData = data;
    $("#logoprev").hidden = !data;
    if (data) $("#logoprev").src = data; else $("#logoprev").removeAttribute("src");
    $("#logodel").hidden = !data;
    $("#logorechte").hidden = !data;
    if (!data) $("#logo").value = "";
  }

  // ---------- Entwurf merken (falls die Zahlung abgebrochen wird) ----------
  function save() {
    const d = {};
    for (const el of form.elements) {
      if (!el.name || el.type === "file") continue;
      d[el.name] = el.type === "checkbox" ? el.checked : el.type === "radio" ? (el.checked ? el.value : d[el.name]) : el.value;
    }
    d.paket = paket();
    d._logo = logoData;
    try { localStorage.setItem(DRAFT, JSON.stringify(d)); } catch { try { delete d._logo; localStorage.setItem(DRAFT, JSON.stringify(d)); } catch {} }
  }
  function restore() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT) || "null"); } catch {}
    const qp = new URLSearchParams(location.search).get("paket");
    if (d) {
      for (const el of form.elements) {
        if (!el.name || !(el.name in d) || el.type === "file") continue;
        if (el.type === "checkbox") el.checked = !!d[el.name];
        else if (el.type === "radio") el.checked = el.value === d[el.name];
        else el.value = d[el.name];
      }
      if (d._logo) setLogo(d._logo);
    }
    if (qp === "basis" || qp === "premium" || qp === "plus") form.querySelector(`input[name=paket][value=${qp}]`).checked = true;
  }

  // ---------- Prüfen und senden ----------
  function showErr(msg, el) {
    const e = $("#err");
    e.textContent = msg; e.hidden = !msg;
    form.querySelectorAll(".bad").forEach((x) => x.classList.remove("bad"));
    if (el) {
      el.classList.add("bad");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.focus({ preventScroll: true }), 300);
    } else if (msg) e.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function collect() {
    const p = premium();
    const n = p ? 6 : 5;
    const vars = {};
    const need = (k) => { const el = form["v_" + k]; const val = el.value.trim(); if (!val) throw [`Bitte ausfüllen: ${el.closest(".prow,.field").querySelector("h3,label").textContent.replace(" *", "")}`, el]; return val; };
    for (const k of ["FIRMA", "STADT", "RAUM_FEIER", "RAUM_TATORT", "PARK"]) vars[k] = need(k);
    const people = ["OPFER", "BOSS", ...[...Array(n)].map((_, i) => "S" + (i + 1))];
    for (const pre of people) {
      for (const suf of ["_ANR", "", "_FKT", "_ABT"]) {
        const k = pre + suf;
        if (!form["v_" + k]) continue;
        const val = form["v_" + k].value.trim();
        if (!val) {
          const el = form["v_" + k];
          const who = el.closest(".prow").querySelector("h3").textContent.replace("nur Premium und Premium Plus", "").trim();
          const what = { _ANR: "Anrede", "": "Name", _FKT: "Funktion", _ABT: "Abteilung" }[suf];
          throw [`Bitte ausfüllen: ${what} bei „${who}“.`, el];
        }
        vars[k] = val;
      }
      if (vars[pre].split(" ").length < 2) throw [`Bitte Vor- und Nachnamen angeben: ${vars[pre]}`, form["v_" + pre]];
    }
    const lower = people.map((k) => vars[k].toLowerCase());
    const dup = lower.findIndex((x, i) => lower.indexOf(x) !== i);
    if (dup >= 0) throw [`„${vars[people[dup]]}“ kommt doppelt vor. Jede Person darf nur einmal vorkommen.`, form["v_" + people[dup]]];
    const last = people.slice(2).map((k) => vars[k].split(" ").pop().toLowerCase());
    const dl = last.findIndex((x, i) => last.indexOf(x) !== i);
    if (dl >= 0) throw [`Zwei Verdächtige heißen „${vars[people[dl + 2]].split(" ").pop()}“. Die Lösung wird mit dem Nachnamen eingegeben – bitte bei einer Person einen Spitznamen oder Zusatz verwenden.`, form["v_" + people[dl + 2]]];

    const date = form.event_date.value;
    if (!date) throw ["Bitte einen Spieltag wählen.", form.event_date];
    if (date < META.earliest) throw [`Der Spieltag muss frühestens ${fmtDate(META.earliest)} sein.`, form.event_date];

    const contact = { name: form.c_name.value.trim(), email: form.c_email.value.trim(), telefon: form.c_tel.value.trim(), rechnung_firma: form.c_firma.value.trim() };
    if (contact.name.length < 2) throw ["Bitte deinen Namen angeben.", form.c_name];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw ["Bitte eine gültige E-Mail-Adresse angeben.", form.c_email];
    const consent = { zustimmung: form.zustimmung.checked, agb: form.agb.checked, logo_rechte: form.logo_rechte.checked };
    if (logoData && !consent.logo_rechte) throw ["Bitte bestätigen, dass ihr das Logo verwenden dürft.", form.logo_rechte];
    if (!consent.zustimmung) throw ["Bitte bestätigen, dass alle genannten Personen einverstanden sind.", form.zustimmung];
    if (!consent.agb) throw ["Bitte AGB und Datenschutzerklärung akzeptieren.", form.agb];
    return { paket: paket(), teams: Number(form.teams.value), event_date: date, vars, contact, consent, logo: logoData, lang: "de" };
  }

  async function submit(ev) {
    ev.preventDefault();
    let body;
    try { body = collect(); } catch (x) { if (Array.isArray(x)) return showErr(x[0], x[1]); throw x; }
    showErr("");
    if (!META.open) return showErr("Bestellungen sind noch nicht geöffnet.");
    const btn = $("#submit");
    btn.disabled = true; btn.textContent = "Einen Moment …";
    try {
      const r = await fetch("/api/shop/bestellung", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.redirect) throw new Error(d.error || "Die Bestellung konnte nicht angelegt werden.");
      save();
      location.href = d.redirect;
    } catch (e) {
      showErr(e.message);
      btn.disabled = false; btn.textContent = "Zahlungspflichtig bestellen";
    }
  }

  async function init() {
    try {
      const r = await fetch("/api/shop/meta");
      META = await r.json();
      if (!r.ok) throw new Error();
    } catch {
      form.innerHTML = '<p class="note">Das Bestellformular ist gerade nicht erreichbar. Bitte später nochmals versuchen oder an office@mordsteam.com schreiben.</p>';
      return;
    }
    build();
    restore();
    $("#closed").hidden = META.open;
    $("#cancelled").hidden = !new URLSearchParams(location.search).has("abgebrochen");
    update();
    form.addEventListener("input", () => { update(); save(); });
    form.addEventListener("change", () => { update(); save(); });
    form.addEventListener("submit", submit);
    $("#logo").addEventListener("change", (e) => loadLogo(e.target.files[0]));
    $("#logodel").addEventListener("click", () => { setLogo(null); form.logo_rechte.checked = false; save(); });
  }
  init();
})();
