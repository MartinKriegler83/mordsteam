// Bestellformular: Daten erfassen, prüfen, an /api/shop/bestellung senden → Stripe
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const form = $("#order");
  const DRAFT = "ms_order_draft";
  let META = null;
  let logoData = null;
  // Sprache der Seite (deutsch unter /, englisch unter /en/). Die Spielsprache wählt man im Formular extra.
  const EN = document.documentElement.lang === "en";
  const T = (de, en) => (EN ? en : de);

  const LABELS = {
    FIRMA: [T("Firmenname *", "Company name *"), ""],
    STADT: [T("Stadt *", "City *"), ""],
    PARK: [T("Park in der Nähe *", "Park nearby *"), T("Ein Detail im Fall", "A detail in the case")],
    RAUM_FEIER: [T("Wo feiert ihr? *", "Where do you celebrate? *"), T("z. B. Kantine, Dachterrasse, Besprechungsraum 3", "e.g. canteen, roof terrace, meeting room 3")],
    RAUM_TATORT: [T("Büro der Chefin / des Chefs *", "The boss's office *"), T("der Tatort", "the crime scene")],
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const eur = (c) => { const o = { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 }; return EN ? "€" + (c / 100).toLocaleString("en-GB", o) : (c / 100).toLocaleString("de-AT", o) + " €"; };
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const fmtDate = (d) => { if (!d) return "–"; const [y, m, t] = d.split("-"); return EN ? `${Number(t)} ${MONTHS[Number(m) - 1]} ${y}` : `${Number(t)}.${Number(m)}.${y}`; };
  const paket = () => form.paket.value;
  const premium = () => paket() !== "basis";
  const fiktiv = () => form.besetzung.value === "fiktiv";
  const TN = EN ? { basis: "Basic, 50 minutes", premium: "Premium, 70 minutes", plus: "Premium Plus, 90 minutes" } : { basis: "Basic, 50 Minuten", premium: "Premium, 70 Minuten", plus: "Premium Plus, 90 Minuten" };
  const field = (key) => META.fields.find((f) => f.key === key);

  function input(key, label, hint, cls = "") {
    const f = field(key);
    return `<div class="field ${cls}"><label for="v_${key}">${label}</label><input id="v_${key}" name="v_${key}" maxlength="80" placeholder="${T("z. B.", "e.g.")} ${esc(f.example)}" autocomplete="off">${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
  }
  function anrede(key, label = T("Anrede *", "Title *")) {
    return `<div class="field anr"><label for="v_${key}">${label}</label><select id="v_${key}" name="v_${key}"><option value="">–</option><option value="Frau">${T("Frau", "Ms")}</option><option value="Herr">${T("Herr", "Mr")}</option></select></div>`;
  }
  function person(prefix, title) {
    return `<div class="prow"><h3 class="subhead">${title}</h3><div class="pgrid">${anrede(prefix + "_ANR")}${input(prefix, T("Vor- und Nachname *", "First and last name *"), "")}${input(prefix + "_FKT", T("Funktion *", "Role *"), "")}${field(prefix + "_ABT") ? input(prefix + "_ABT", T("Abteilung *", "Department *"), "") : ""}</div></div>`;
  }

  function build() {
    $("#f-firma").innerHTML = `<div class="two">${input("FIRMA", ...LABELS.FIRMA)}${input("STADT", ...LABELS.STADT)}</div>
      <div class="two">${input("RAUM_FEIER", ...LABELS.RAUM_FEIER)}${input("RAUM_TATORT", ...LABELS.RAUM_TATORT)}</div>
      <div class="two">${input("PARK", ...LABELS.PARK)}<div></div></div>`;
    $("#f-opfer").innerHTML = person("OPFER", T("Das Opfer", "The victim"));
    $("#f-boss").innerHTML = person("BOSS", T("Der Oberboss", "The top boss"));
    $("#f-sus").innerHTML = [1, 2, 3, 4, 5, 6].map((i) => `<div class="susrow" data-i="${i}">${person("S" + i, `${T("Verdächtige/r", "Suspect")} ${i}${i === 6 ? ` <span class="opt">${T("nur Premium und Premium Plus", "Premium and Premium Plus only")}</span>` : ""}`)}</div>`).join("");
    // Länder und Spielsprache
    const land = $("#land");
    land.innerHTML = META.laender.map(([k, n]) => `<option value="${k}">${esc(k === "XX" ? T("Anderes Land (fiktiver Ort)", "Other country (fictional place)") : n)}</option>`).join("");
    land.value = EN ? "GB" : "AT";
    $("#lang").value = EN ? "en" : "de";
    const sel = $("#teams");
    sel.innerHTML = [...Array(15)].map((_, i) => `<option value="${i + 1}">${i + 1} Team${i ? "s" : ""}</option>`).join("");
    sel.value = "3";
  }

  function update() {
    const p = premium();
    $(".susrow[data-i='6']").hidden = !p;
    const fk = fiktiv();
    $("#plusnote").hidden = paket() !== "plus";
    $("#ab18box").hidden = paket() !== "plus";
    $("#sofortbox").hidden = form.kunde.value !== "b2c";
    form.querySelectorAll("[data-real]").forEach((f) => (f.hidden = fk));
    $("#fiktivnote").hidden = !fk;
    // Early Bird: Feedback ist Teil der Bedingungen – Abwahl der Feedback-Mail ausblenden
    $("#nofbbox").hidden = !!(META.earlybird && form.earlybird.checked);
    $("#zustimmungbox").hidden = fk;
    // Schritte fortlaufend nummerieren (fiktiv: Firma, Opfer, Verdächtige entfallen)
    [...form.querySelectorAll("fieldset.step")].filter((f) => !f.hidden).forEach((f, i) => (f.querySelector("legend span").textContent = i + 1));
    const n = Number($("#teams").value);
    const full = META.prices[paket()] * n;
    const eb = META.earlybird && form.earlybird.checked ? META.earlybird.prozent : 0;
    const sum = Math.round(full * (100 - eb) / 100);
    $("#pb-text").textContent = `${TN[paket()].split(",")[0]} · ${n} Team${n > 1 ? "s" : ""}`;
    $("#pb-sum").textContent = eur(sum);
    const v = (k) => (form["v_" + k]?.value || "").trim();
    $("#summary").innerHTML = `<dl>
      <dt>${T("Paket", "Package")}</dt><dd>${T(`Fall 001 „${esc(META.fall)}“`, `Case 001 “${esc(META.fall)}”`)} – ${TN[paket()]}</dd>
      <dt>${T("Spielsprache", "Game language")}</dt><dd>${esc(form.lang.options[form.lang.selectedIndex].text)}</dd>
      <dt>${T("Land", "Country")}</dt><dd>${esc(form.land.options[form.land.selectedIndex]?.text || "")}</dd>
      <dt>Teams</dt><dd>${n} × ${eur(META.prices[paket()])}</dd>
      <dt>${T("Spielbar", "Playable")}</dt><dd>${T("sofort nach dem Bezahlen, 12 Monate lang, einmal startbar", "right after paying, for 12 months, can be started once")}</dd>
      ${fk ? `<dt>${T("Besetzung", "Cast")}</dt><dd>${T("Fiktive Firma mit erfundenen Figuren", "Fictional company with invented characters")}</dd>` : `<dt>${T("Firma", "Company")}</dt><dd>${esc(v("FIRMA") || "–")}</dd>
      <dt>${T("Opfer", "Victim")}</dt><dd>${esc(v("OPFER") || "–")}</dd>
      <dt>${T("Verdächtige", "Suspects")}</dt><dd>${[...Array(p ? 6 : 5)].map((_, i) => esc(v("S" + (i + 1)) || "–")).join(", ")}</dd>`}
      ${eb ? `<dt>Early Bird</dt><dd>−${eb} % (−${eur(full - sum)})</dd>` : ""}
      <dt class="tot">${T("Gesamt", "Total")}</dt><dd class="tot">${eur(sum)}</dd></dl>`;
  }

  // ---------- Logo: im Browser verkleinern ----------
  function loadLogo(file) {
    if (!file) return;
    if (file.size > 8e6) return showErr(T("Das Logo ist zu groß (max. 8 MB).", "The logo is too large (max. 8 MB)."));
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
    img.onerror = () => { URL.revokeObjectURL(url); showErr(T("Das Bild konnte nicht gelesen werden.", "The image could not be read.")); };
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
    if (!fiktiv()) {
      const need = (k) => { const el = form["v_" + k]; const val = el.value.trim(); if (!val) throw [`${T("Bitte ausfüllen:", "Please fill in:")} ${el.closest(".prow,.field").querySelector("h3,label").textContent.replace(" *", "")}`, el]; return val; };
      for (const k of ["FIRMA", "STADT", "RAUM_FEIER", "RAUM_TATORT", "PARK"]) vars[k] = need(k);
      const people = ["OPFER", "BOSS", ...[...Array(n)].map((_, i) => "S" + (i + 1))];
      for (const pre of people) {
        for (const suf of ["_ANR", "", "_FKT", "_ABT"]) {
          const k = pre + suf;
          if (!form["v_" + k]) continue;
          const val = form["v_" + k].value.trim();
          if (!val) {
            const el = form["v_" + k];
            const who = el.closest(".prow").querySelector("h3").textContent.replace("nur Premium und Premium Plus", "").replace("Premium and Premium Plus only", "").trim();
            const what = (EN ? { _ANR: "title", "": "name", _FKT: "role", _ABT: "department" } : { _ANR: "Anrede", "": "Name", _FKT: "Funktion", _ABT: "Abteilung" })[suf];
            throw [T(`Bitte ausfüllen: ${what} bei „${who}“.`, `Please fill in: ${what} for “${who}”.`), el];
          }
          vars[k] = val;
        }
        if (vars[pre].split(" ").length < 2) throw [T(`Bitte Vor- und Nachnamen angeben: ${vars[pre]}`, `Please enter first and last name: ${vars[pre]}`), form["v_" + pre]];
      }
      const lower = people.map((k) => vars[k].toLowerCase());
      const dup = lower.findIndex((x, i) => lower.indexOf(x) !== i);
      if (dup >= 0) throw [T(`„${vars[people[dup]]}“ kommt doppelt vor. Jede Person darf nur einmal vorkommen.`, `“${vars[people[dup]]}” appears twice. Each person may only appear once.`), form["v_" + people[dup]]];
      const last = people.slice(2).map((k) => vars[k].split(" ").pop().toLowerCase());
      const dl = last.findIndex((x, i) => last.indexOf(x) !== i);
      if (dl >= 0) throw [T(`Zwei Verdächtige heißen „${vars[people[dl + 2]].split(" ").pop()}“. Die Lösung wird mit dem Nachnamen eingegeben – bitte bei einer Person einen Spitznamen oder Zusatz verwenden.`, `Two suspects are called “${vars[people[dl + 2]].split(" ").pop()}”. Answers are entered by last name – please add a nickname or suffix for one of them.`), form["v_" + people[dl + 2]]];

    }


    const contact = { name: form.c_name.value.trim(), email: form.c_email.value.trim(), telefon: form.c_tel.value.trim(), rechnung_firma: form.c_firma.value.trim(), kunde: form.kunde.value };
    if (contact.name.length < 2) throw [T("Bitte deinen Namen angeben.", "Please enter your name."), form.c_name];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw [T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid email address."), form.c_email];
    const consent = { sofort: form.sofort.checked, no_feedback: form.no_feedback.checked && !(META.earlybird && form.earlybird.checked), ab18: form.ab18.checked, zustimmung: form.zustimmung.checked, agb: form.agb.checked, logo_rechte: form.logo_rechte.checked };
    const fk = fiktiv();
    if (!fk && logoData && !consent.logo_rechte) throw [T("Bitte bestätigen, dass ihr das Logo verwenden dürft.", "Please confirm that you may use the logo."), form.logo_rechte];
    if (!fk && !consent.zustimmung) throw [T("Bitte bestätigen, dass alle genannten Personen einverstanden sind.", "Please confirm that everyone named has agreed."), form.zustimmung];
    if (paket() === "plus" && !form.ab18.checked) throw [T("Bitte bestätigen, dass alle Teilnehmenden mindestens 18 Jahre alt sind – oder Basic bzw. Premium wählen.", "Please confirm that all participants are at least 18 – or choose Basic or Premium."), form.ab18];
    if (!contact.kunde) throw [T("Bitte angeben, ob ihr als Unternehmen/Verein oder als Privatperson bestellt.", "Please tell us whether you are ordering as a company/club or as a private individual."), form.kunde[0]];
    if (contact.kunde === "b2c" && !consent.sofort) throw [T("Bitte bestätigen, dass wir eure Spielrunde gleich nach dem Bezahlen anlegen dürfen.", "Please confirm that we may set up your game round right after payment."), form.sofort];
    if (!consent.agb) throw [T("Bitte AGB und Datenschutzerklärung akzeptieren.", "Please accept the terms and the privacy policy."), form.agb];
    return { paket: paket(), teams: Number(form.teams.value), vars: fk ? {} : vars, land: form.land.value, contact, consent, logo: fk ? null : logoData, besetzung: fk ? "fiktiv" : "echt", earlybird: !!(META.earlybird && form.earlybird.checked), lang: form.lang.value === "en" ? "en" : "de", site: EN ? "en" : "de" };
  }

  async function submit(ev) {
    ev.preventDefault();
    let body;
    try { body = collect(); } catch (x) { if (Array.isArray(x)) return showErr(x[0], x[1]); throw x; }
    showErr("");
    if (!META.open) return showErr(T("Bestellungen sind noch nicht geöffnet.", "Orders are not open yet."));
    const btn = $("#submit");
    btn.disabled = true; btn.textContent = T("Einen Moment …", "One moment …");
    try {
      const r = await fetch("/api/shop/bestellung", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.redirect) throw new Error(d.error || T("Die Bestellung konnte nicht angelegt werden.", "The order could not be created."));
      save();
      location.href = d.redirect;
    } catch (e) {
      showErr(e.message);
      btn.disabled = false; btn.textContent = T("Zahlungspflichtig bestellen", "Order and pay");
    }
  }

  async function init() {
    try {
      const r = await fetch("/api/shop/meta" + (EN ? "?lang=en" : ""));
      META = await r.json();
      if (!r.ok) throw new Error();
    } catch {
      form.innerHTML = `<p class="note">${T("Das Bestellformular ist gerade nicht erreichbar. Bitte später nochmals versuchen oder an office@mordsteam.com schreiben.", "The order form is not available right now. Please try again later or write to office@mordsteam.com.")}</p>`;
      return;
    }
    build();
    restore();
    $("#closed").hidden = META.open;
    if (META.earlybird) { $("#ebbox").hidden = false; form.querySelectorAll(".ebp").forEach((x) => (x.textContent = META.earlybird.prozent)); }
    else form.earlybird.checked = false;
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
