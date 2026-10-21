// Geschenkkarte zum Ausdrucken oder als PDF (Go-live-Test 4, 6.10.2026).
// Aufruf: /geschenk.html?o=<Bestellung>&k=<Schlüssel>&l=de|en – nur für bezahlte Solo- und Friends-Bestellungen.
// Oder: /geschenk.html?c=<Solo-Code>&l=de|en – für Geschenk-Codes, die im Admin angelegt wurden (Werbung, ohne Kauf).
// Solo: Code + Link zum Fall. Friends: Link zur Organisator-Seite (dort gibt es den Einladungslink für die Gäste).
// PDF (12.10.2026, lib/geschenkpdf.js): Der Server bettet die Seite ein und setzt window.__GK (Daten, Herkunft, Bilder, Widmung).
(function () {
  const PRE = window.__GK || null;
  const q = new URLSearchParams(location.search);
  const EN = PRE ? PRE.lang === "en" : q.get("l") === "en";
  const T = (de, en) => (EN ? en : de);
  // Go-live-Test 5 (M17): Euro-Bonus auf Englisch in allen drei Kassenwährungen (wie die Stripe-Gutscheinvorlage)
  const enAmt = (l) => { const m = /^(\d+) €$/.exec(String(l || "")); return m ? `€${m[1]} / £${m[1]} / $${Math.round(m[1] * 1.15)}` : String(l || "").replace(/^(\d+) %$/, "$1%"); };   /* EN: „10%“ ohne Leerzeichen (Go-live-Check 13.10.2026) */
  document.documentElement.lang = EN ? "en" : "de";
  document.title = T("Geschenkkarte – Mordsteam", "Gift card – Mordsteam");
  const root = document.getElementById("gk-root"), btn = document.getElementById("gk-print");
  const dmy = (x) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(x || "")); if (!m) return ""; return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString(EN ? "en-GB" : "de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const hint = document.getElementById("gk-hint"), pbtn = document.getElementById("gk-pdf");
  const HINT = T("Trag eine Widmung ein und drück auf „Als PDF speichern“ – das PDF kannst du per E-Mail oder Messenger verschicken. Für Papier: „Drucken“.",
    "Add a dedication and press “Save as PDF” – you can send the PDF by email or messenger. For paper: “Print”.");
  hint.textContent = HINT;
  btn.textContent = T("Drucken", "Print");
  btn.onclick = () => window.print();
  const msg = (t) => { root.innerHTML = `<p class="gk-msg">${esc(t)}</p>`; hint.textContent = ""; };   // ohne Karte kein „Als PDF speichern“-Hinweis

  const o = q.get("o"), k = q.get("k"), gc = PRE ? (PRE.kind === "c" ? "x" : "") : q.get("c");
  pbtn.textContent = T("Als PDF speichern", "Save as PDF");
  pbtn.onclick = async () => {
    const v = (id) => (document.getElementById(id) || {}).value || "";
    pbtn.disabled = true; pbtn.textContent = T("PDF wird erstellt …", "Creating PDF …");
    try {
      const r = await fetch("/api/shop/geschenk-pdf", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ o, k, c: q.get("c") || "", l: EN ? "en" : "de", fuer: v("gk-for"), von: v("gk-from"), text: v("gk-ded") }) });
      if (r.status === 429) { const e = await r.json().catch(() => ({})); throw Object.assign(new Error("limit"), { text: e.error }); }
      if (!r.ok || !/pdf/.test(r.headers.get("content-type") || "")) throw new Error("pdf");
      const name = (/filename="([^"]+)"/.exec(r.headers.get("content-disposition") || "") || [])[1] || "Mordsteam.pdf";
      const url = URL.createObjectURL(await r.blob()), a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      hint.textContent = HINT; hint.classList.remove("gk-warn");
    } catch (e) {
      hint.classList.add("gk-warn");
      hint.textContent = e && e.text ? e.text : T("Das PDF ging gerade nicht. Bitte „Drucken“ nutzen und dort „Als PDF sichern“ wählen – oder es später noch einmal versuchen.",
        "The PDF didn’t work just now. Please use “Print” and choose “Save as PDF” there – or try again later.");
    }
    pbtn.disabled = false; pbtn.textContent = T("Als PDF speichern", "Save as PDF");
  };
  if (!PRE && !gc && (!o || !k)) return msg(T("Dieser Link ist unvollständig. Öffne die Geschenkkarte bitte über deine Bestellbestätigung.", "This link is incomplete. Please open the gift card from your order confirmation."));
  // Geschenk-Code aus dem Admin: Angaben in die Form einer bezahlten Solo-Bestellung bringen
  const load = PRE ? Promise.resolve(PRE.kind === "c" ? PRE.data : null).then((g) => g === null ? PRE.data : g.error ? { error: "x" } : ({
        status: "fulfilled", produkt: "solo", solo_code: g.code, solo_title: g.title, solo_title_en: g.title_en, solo_min: g.min, gift: true,
        event_date: new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" }).format(new Date(g.created_at)), promo: g.promo, promo_label: g.promo_label, promo_until: g.promo_until }))
    : gc
    ? fetch(`/api/solo/geschenk?c=${encodeURIComponent(gc)}`).then((r) => r.json()).then((g) => g.error ? { error: T("Diese Geschenkkarte gibt es nicht. Bitte den Link prüfen.", "This gift card does not exist. Please check the link.") } : ({
        status: "fulfilled", produkt: "solo", solo_code: g.code, solo_title: g.title, solo_title_en: g.title_en, solo_min: g.min, gift: true,
        event_date: new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" }).format(new Date(g.created_at)), promo: g.promo, promo_label: g.promo_label, promo_until: g.promo_until }))
    : fetch(`/api/shop/status?o=${encodeURIComponent(o)}&k=${encodeURIComponent(k)}&l=${EN ? "en" : "de"}`).then((r) => r.json());
  load.then((d) => {
    if (d.error) return msg(d.error);
    if (d.status !== "fulfilled") return msg(T("Die Bestellung ist noch nicht abgeschlossen. Bitte in ein paar Sekunden neu laden.", "The order isn't complete yet. Please reload in a few seconds."));
    const origin = PRE ? PRE.origin : location.origin;
    const until = (() => {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d.event_date || ""));
      if (!m) return "";
      const dt = new Date(Date.UTC(Number(m[1]) + 1, Number(m[2]) - 1, Number(m[3])));
      return dt.toLocaleDateString(EN ? "en-GB" : "de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    })();
    // Titelbild des Falls (site/assets/cover, tools/cover_bilder.mjs) – Zuordnung über den Titel
    const COVER = { "Nachtzug nach Venedig": "solo001", "Night Train to Venice": "solo001", "Applaus für einen Toten": "solo002", "Applause for a Dead Man": "solo002", "Der letzte Jahrgang": "soloplus", "The Last Vintage": "soloplus", "Süßes oder Saures": "special001", "Trick or Treat": "special001", "Vier Minuten Finsternis": "special002", "Four Minutes Dark": "special002" };
    const coverSrc = (key) => { const p = `/assets/cover/${key}-${EN ? "en" : "de"}.webp`; return PRE ? PRE.img[p] || "" : p; };
    const coverImg = (key) => key && coverSrc(key) ? `<img class="gk-cover" src="${coverSrc(key)}" alt="" width="600" height="750">` : "";
    let card;
    if (d.produkt === "solo" && d.solo_code) {
      // Kurzlink /s/<Code> (functions/s/[code].js) – zum Antippen, Fotografieren (QR) oder Abtippen
      const link = `${origin}/s/${encodeURIComponent(d.solo_code)}`;
      const title = EN ? d.solo_title_en : d.solo_title;
      const ck = COVER[d.solo_title] || COVER[d.solo_title_en] || "", sp = ck.startsWith("special");
      card = {
        eyebrow: T("Ein Krimi für dich", "A mystery for you"),
        title, sub: sp ? (ck === "special002" ? T(`Weihnachts-Special · ${d.solo_min} Minuten Countdown · im Browser am Handy, Tablet oder Laptop`, `Christmas Special · ${d.solo_min}-minute countdown · in the browser on phone, tablet or laptop`) : T(`Halloween-Special · ${d.solo_min} Minuten Countdown · im Browser am Handy, Tablet oder Laptop`, `Halloween Special · ${d.solo_min}-minute countdown · in the browser on phone, tablet or laptop`)) : T(`Solo-Krimi · ${d.solo_min} Minuten Countdown · im Browser am Handy, Tablet oder Laptop`, `Solo mystery · ${d.solo_min}-minute countdown · in the browser on phone, tablet or laptop`),
        kind: sp ? "Special" : "Solo", cover: ck, tagLabel: T("Beweisstück 1 · Dein Code", "Exhibit 1 · Your code"), code: d.solo_code, link,
        tagText: T("Einmal einlösbar · nach dem ersten Durchgang 30 Tage lang bis zu dreimal wiederholbar", "Redeem once · replay up to three times within 30 days of your first run"),
        steps: [
          T("QR-Code scannen, antippen oder den Link oben eingeben – der Code ist schon eingetragen", "Scan or tap the QR code, or type the link above – the code is already filled in"),
          T("Deinen Ermittlernamen wählen", "Choose your investigator name"),
          T("Die Uhr startet erst, wenn du die Akte öffnest – nimm dir die Zeit am Stück.", "The clock only starts when you open the case file – take the time in one go."),
        ],
      };
    } else if (d.produkt === "friends" && d.org_token) {
      // Kurzlink /f/<Kurzcode> (functions/f/[code].js); ältere Antworten ohne Kurzcode → langer Link
      const link = d.org_short ? `${origin}/f/${encodeURIComponent(d.org_short)}` : `${origin}/spiel/friends.html?o=${encodeURIComponent(d.org_token)}`;
      card = {
        eyebrow: T("Ein Krimiabend für dich", "A mystery night for you"),
        title: T("Letzte Runde auf der Hütte", "Last Round at the Chalet"),
        sub: T(`Mordsteam Friends${d.plus ? " Plus mit KI-Verhörraum" : ""} · für ${d.teams} Personen · jeder ermittelt am eigenen Handy`, `Mordsteam Friends${d.plus ? " Plus with AI interrogation room" : ""} · for ${d.teams} people · everyone investigates on their own phone`),
        kind: "Friends", cover: "friends", tagLabel: T("Beweisstück 1 · Deine Einladung", "Exhibit 1 · Your invitation"), code: "", link,
        tagText: T("Führt zu deiner Organisator-Seite. Dort bekommst du den Link für deine Gäste.", "Leads to your organiser page, where you get the link for your guests."),
        steps: [
          T("QR-Code scannen, antippen oder Link oben eingeben – deine Organisator-Seite (nicht weitergeben)", "Scan or tap the QR code, or type the link above – your organiser page (don’t pass it on)"),
          T("Dort findest du den Einladungslink für deine Gäste", "There you’ll find the invitation link for your guests"),
          d.mode === "week"
            ? T(`Du schaltest den Fall frei, dann hat jede und jeder ${d.days || 7} Tage Zeit, wann es passt`, `You unlock the case, then everyone has ${d.days || 7} days to play whenever it suits them`)
            : T("Du startest den Fall für alle gleichzeitig – am besten einen gemeinsamen Abend ausmachen", "You start the case for everyone at the same time – best to agree on an evening together"),
        ],
      };
    } else {
      return msg(T("Für diese Bestellung gibt es keine Geschenkkarte. Geschenkkarten gibt es für Mordsteam Solo und Friends.", "There is no gift card for this order. Gift cards are available for Mordsteam Solo and Friends."));
    }
    // Aktenzeichen = der Code, mit dem gespielt wird (Solo-Code bzw. Kurzcode der Organisator-Seite), sonst Bestellnummer
    const az = card.code || d.org_short || (d.nr ? String(d.nr) : "");
    root.innerHTML = `<div class="gk-sheet"><article class="gk${d.promo ? " has-promo" : ""}" aria-label="${esc(T("Geschenkkarte", "Gift card"))}">
      <header class="gk-head">
        <div class="gk-wm"><svg viewBox="0 0 34 34" fill="none" stroke="#F3EFE6" stroke-width="3" aria-hidden="true"><circle cx="14" cy="14" r="10"/><line x1="21.5" y1="21.5" x2="31" y2="31" stroke-linecap="round"/><circle cx="14" cy="14" r="3.5" fill="#E0463C" stroke="none"/></svg><span><span class="r">MORDS</span>TEAM</span></div>
        <div class="gk-az">${esc(T("Ermittlungsakte", "Case file"))}${az ? `<br>${esc(T("Aktenzeichen", "Ref."))} ${esc(az)}` : ""}</div>
      </header>
      <div class="gk-tabrow"><span class="gk-tab red">${esc(T("Geschenk", "Gift"))}</span><span class="gk-tab">${esc(card.kind)}</span></div>
      <div class="gk-body">
        <div class="gk-stamp" aria-hidden="true"><b>${esc(T("GESCHENK", "GIFT"))}</b><span>${esc(T("STRENG PERSÖNLICH", "STRICTLY PERSONAL"))}</span></div>
        <div class="gk-top${card.cover ? " has-cover" : ""}"><div>
          <div class="gk-eyebrow">${esc(card.eyebrow)}</div>
          <h1 class="gk-title">${esc(card.title)}</h1>
          <p class="gk-sub">${esc(card.sub)}</p>
        </div>${coverImg(card.cover)}</div>
        <div class="gk-field"><label for="gk-for">${esc(T("Für", "For"))}</label><input id="gk-for" name="gk-widmung-fuer" autocomplete="off" data-lpignore="true" data-1p-ignore maxlength="40" placeholder="${esc(T("Wer ermittelt?", "Who’s investigating?"))}"></div>
        <div class="gk-card"><textarea id="gk-ded" autocomplete="off" rows="3" maxlength="180" aria-label="${esc(T("Widmung", "Dedication"))}" placeholder="${esc(T("Deine Widmung, z. B. „Alles Gute zum Geburtstag – löst du ihn schneller als ich?“", "Your dedication, e.g. “Happy birthday – can you crack it faster than me?”"))}"></textarea></div>
        <div class="gk-field"><label for="gk-from">${esc(T("Von", "From"))}</label><input id="gk-from" name="gk-widmung-von" autocomplete="off" data-lpignore="true" data-1p-ignore maxlength="40" placeholder="${esc(T("Dein Name", "Your name"))}"></div>
        <div class="gk-evid">
          <div class="gk-tag"><small>${esc(card.tagLabel)}</small>${card.code ? `<a class="gk-code" href="${esc(card.link)}">${esc(card.code)}</a>` : ""}<a class="gk-link${card.code ? "" : " big"}" href="${esc(card.link)}">${esc(card.link.replace(/^https?:\/\//, ""))}</a><p>${esc(card.tagText)}</p></div>
          <div class="gk-qrbox"><a class="gk-qr" id="gk-qr" href="${esc(card.link)}" aria-label="${esc(T("QR-Code zum Spiel – antippen öffnet den Link", "QR code for the game – tap to open the link"))}"></a><span>${esc(T("Scannen oder antippen", "Scan or tap"))}</span></div>
        </div>
        <ol class="gk-steps">${card.steps.map((x) => `<li>${x}</li>`).join("")}</ol>
        ${d.promo ? `<div class="gk-promo"><small>${esc(T("Beweisstück 2 · Bonus für euer Team", "Exhibit 2 · Bonus for your team"))}</small><b>${esc(T(d.promo_label, enAmt(d.promo_label)))}</b><span>${esc(T("Rabatt auf euer erstes Mordsteam-Teams-Event, das Krimi-Teamevent für Firmen und Vereine. Code im Bezahlschritt eingeben:", "off your first Mordsteam Teams event, the murder mystery team event for companies and clubs. Enter the code at checkout:"))} <span class="mono">${esc(d.promo)}</span> · ${esc(T("gültig bis", "valid until"))} ${esc(dmy(d.promo_until))} · mordsteam.com/teams</span></div>` : ""}
      </div>
      <footer class="gk-foot"><span>${until ? `${esc(T("Spielbar bis", "Playable until"))} <b>${esc(until)}</b>${esc(T(" · danach Erstattung möglich", " · refundable afterwards"))}` : ""}</span><span><b>mordsteam.com</b></span></footer>
    </article></div>`;
    // Widmung: höchstens 3 Zeilen auf der Karteikarte
    const ta = document.getElementById("gk-ded");
    // … und nichts, was unsichtbar über den Rand läuft: lange Zeilen ohne Umbruch wurden in Karte und PDF still abgeschnitten (Go-live-Check 13.10.2026)
    ta.addEventListener("input", () => {
      const lines = ta.value.split("\n"); let cut = false;
      if (lines.length > 3) { ta.value = lines.slice(0, 3).join("\n"); cut = true; } while (ta.value && ta.scrollHeight > ta.clientHeight + 2) { ta.value = ta.value.slice(0, -1); cut = true; }
      hint.classList.toggle("gk-warn", cut);
      hint.textContent = cut ? T("Mehr Text passt nicht auf die Karte.", "That’s all the text that fits on the card.") : HINT;
    });
    try { const qr = qrcode(0, "M"); qr.addData(card.link); qr.make(); document.getElementById("gk-qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); }
    catch { document.getElementById("gk-qr").remove(); }
    if (d.gift) document.getElementById("gk-from").value = "Mordsteam";
    if (PRE) { document.getElementById("gk-for").value = PRE.form.fuer || ""; document.getElementById("gk-from").value = PRE.form.von || ""; ta.value = PRE.form.text || ""; return; }
    btn.hidden = false; pbtn.hidden = false;
  }).catch(() => msg(T("Die Geschenkkarte konnte nicht geladen werden. Bitte später noch einmal versuchen.", "The gift card could not be loaded. Please try again later.")));
})();
