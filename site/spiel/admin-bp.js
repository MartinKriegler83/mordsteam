// Mordsteam-Admin, Tab „Brightpage“ (19.10.2026, Umbau 21.10.2026): ein Bereich mit Untertabs in Ablauf-Reihenfolge
// Aufträge (site/spiel/admin-bpa.js) · Kunden (eigene Brightpage-Kundendatenbank) · Rechnungen · Abos · Einnahmen · Einstellungen.
// Kunden, Aufträge und Einnahmen laufen getrennt von Mordsteam; nur die E/A-Rechnung (Finanzen) zählt beide zusammen.
// Server: /api/bp/admin/* (functions/api/bp/[[route]].js, lib/brightpage.js). Bezahlte Rechnungen landen automatisch in Finanzen und Steuer.
// Rechnung ansehen/drucken: eigenes Fenster mit A4-Layout und QR-Code „Zahlen mit Code“ (EPC/GiroCode) → „Drucken → Als PDF sichern“.
(function () {
  const esc = (x) => MS.esc(String(x ?? ""));
  const eur = (c) => (c == null ? "–" : (c / 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €");
  const num = (c) => (c / 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dat = (ymd) => (ymd ? ymd.split("-").reverse().join(".") : "–");
  const STATUS = { entwurf: ["Entwurf", ""], offen: ["offen", "open"], bezahlt: ["bezahlt", "fin"], storniert: ["storniert", ""] };
  const TYP = { rechnung: "Rechnung", anzahlung: "Anzahlung", schluss: "Schlussrechnung", storno: "Storno" };
  // Preisliste von brightpage.net (Stand 20.10.2026, siehe brightpage.net/preise) als Schnellauswahl – Preise im Formular frei änderbar
  const VORLAGEN = [
    ["Web Start – One-Pager mit bis zu 6 Abschnitten, Kontaktformular, für Google vorbereitet", 990, "pauschal", "Web Start – one-page website with up to 6 sections, contact form, prepared for Google"],
    ["Web Premium – Firmenwebsite mit bis zu 8 Seiten und Online-Editor", 2490, "pauschal", "Web Premium – company website with up to 8 pages and online editor"],
    ["Zusätzliche Seite (Web Premium)", 150, "Seite", "Additional page (Web Premium)"],
    ["Online-Editor für Web Start", 190, "pauschal", "Online editor for Web Start"],
    ["Shop Start – bis zu 15 Produkte, Kartenzahlung über Stripe", 2490, "pauschal", "Shop Start – up to 15 products, card payment via Stripe"],
    ["Shop Premium – bis zu 30 Produkte, Gutscheine, Rechnungen, Produktverwaltung", 3900, "pauschal", "Shop Premium – up to 30 products, vouchers, invoices, product management"],
    ["Zusätzliches Produkt (Shop)", 15, "Stück", "Additional product (shop)"],
    ["Paket „Gefunden werden“ (Google-Profil, Apple Maps, Bing, Verzeichnisse, Bewertungs-QR)", 290, "pauschal", "“Get found” package (Google Business Profile, Apple Maps, Bing, directories, review QR)"],
    ["Paket „Gefunden werden“ zusammen mit neuer Website", 150, "pauschal", "“Get found” package with a new website"],
    ["Online-Werbung starten – eine Plattform, eine Kampagne, Auswertung nach 30 Tagen", 390, "pauschal", "Start online advertising – one platform, one campaign, review after 30 days"],
    ["Online-Werbung – zweite Plattform", 190, "pauschal", "Online advertising – second platform"],
    ["Newsletter-Paket – Anmeldung, Tool, Vorlage, Einschulung", 490, "pauschal", "Newsletter package – sign-up, tool, template, training"],
    ["Newsletter – Anbindung an den Shop", 190, "pauschal", "Newsletter – connection to the shop"],
    ["Fotos vom Betrieb – vor Ort bis 2 Stunden, 15 bearbeitete Bilder", 190, "pauschal", "Photos of your business – on site up to 2 hours, 15 edited pictures"],
    ["Anfahrt (amtliches Kilometergeld)", 0.5, "km", "Travel (official mileage rate)"],
    ["KI-Lösung Einrichtung – Bewertungs-Antworthelfer", 390, "pauschal", "AI solution setup – review reply helper"],
    ["KI-Lösung Einrichtung – FAQ-Assistent", 490, "pauschal", "AI solution setup – FAQ assistant"],
    ["KI-Lösung Einrichtung – Anfrage-Sortierer", 690, "pauschal", "AI solution setup – enquiry sorter"],
    ["KI-Lösung Einrichtung – Angebotsgenerator", 890, "pauschal", "AI solution setup – quote generator"],
    ["KI-Lösung Einrichtung – alle vier zusammen", 2190, "pauschal", "AI solution setup – all four together"],
    ["Terminbuchung einbinden – bestehendes Buchungssystem auf der Website", 99, "pauschal", "Embed booking system – existing booking system on the website"],
    ["Terminanfrage Plus – Wunschtermine aus den Öffnungszeiten, Bestätigung per Mail", 290, "pauschal", "Appointment request Plus – free slots from opening hours, confirmation by e-mail"],
    ["Texte schreiben – One-Pager", 190, "pauschal", "Copywriting – one-page website"],
    ["Texte schreiben", 90, "Seite", "Copywriting"],
    ["Arbeitszeit (Extras, Sonderwünsche)", 85, "Std.", "Working time (extras, special requests)"],
    ["Arbeitszeit mit Service-Plan", 75, "Std.", "Working time with service plan"],
    ["Kleine Änderung (bis 15 Minuten)", 35, "pauschal", "Small change (up to 15 minutes)"],
    // Empfehlungsbonus als Brightpage-Gutschein (20.10.2026): Betrag laut Preisliste (50/100/200/300 €) eintragen, negativ = Abzug auf der Rechnung des Empfehlers
    ["Gutschrift Empfehlungsbonus (Empfehlung von …)", -100, "pauschal", "Referral bonus credit (referral of …)"],
  ];
  const EINHEIT_EN = { pauschal: "flat rate", Seite: "page", "Stück": "pc.", km: "km", "Std.": "hrs" };   // Einheit auf englischen Rechnungen
  const ABO_VORLAGEN = [["Service Basis", 29], ["Service Komfort", 59], ["Service Plus", 119], ["Werbe-Betreuung", 79],
    ["KI-Betrieb bis 1.000 Vorgänge", 29], ["KI-Betrieb bis 2.500 Vorgänge", 59], ["KI-Betrieb bis 5.000 Vorgänge", 89], ["KI-Betrieb bis 10.000 Vorgänge", 159]];

  let el = null, H = null, D = null, sub = "auftraege", edit = null, msg = "", errMsg = "", editKunde = null, editAbo = null;
  let kundeOpen = null, kundeNeu = false, kSuche = "", einJahr = null, aufOpen = null;
  try { sub = sessionStorage.getItem("bp_sub") || "auftraege"; } catch {}
  const SUBS = [["auftraege", "Aufträge"], ["kunden", "Kunden"], ["rechnungen", "Rechnungen"], ["abos", "Abos"], ["einnahmen", "Einnahmen"], ["einstellungen", "Einstellungen"]];
  if (!SUBS.some((x) => x[0] === sub) && sub !== "neu") sub = "auftraege";

  async function api(method, path, body) {
    const r = await fetch("/api/bp/admin/" + path, { method, headers: { "content-type": "application/json", ...H() }, body: body ? JSON.stringify(body) : undefined });
    let d = {}; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d.error || "Fehler " + r.status);
    return d;
  }
  async function reload() { D = await api("GET", "daten"); paint(); }
  async function act(fn, ok) { errMsg = ""; msg = ""; try { const r = await fn(); msg = typeof ok === "function" ? ok(r) : ok || ""; await reload(); } catch (e) { errMsg = e.message; paint(); } }

  const kName = (k) => (k ? (k.art === "b2b" ? k.firma || k.name : k.name || k.firma) || "–" : "–");

  function head() {
    return `<div class="panel" style="padding-bottom:6px"><div class="eyebrow">Brightpage · Websites, Shops und KI-Lösungen · getrennt von Mordsteam</div>
      ${D.fehlt.length ? `<p class="err" style="margin-top:10px">Vor der ersten Rechnung unter „Einstellungen“ eintragen: ${D.fehlt.map(esc).join(", ")}.</p>` : ""}
      ${D.stats.abo_offen ? `<p class="small" style="margin-top:8px"><b>${D.stats.abo_offen} Abo-Rechnung(en) fällig.</b> <button class="tipbtn" id="bp-abo-gen">Als Entwürfe anlegen</button></p>` : ""}
      <nav class="admtabs" role="tablist" style="margin-top:10px">${SUBS.map(([k, l], i) => `<button type="button" role="tab" data-bpsub="${k}" aria-selected="${k === sub || (k === "rechnungen" && sub === "neu")}">${i + 1} ${l}</button>`).join("")}</nav>
      ${msg && sub !== "auftraege" ? `<p class="note" role="status" style="margin-top:10px">${esc(msg)}</p>` : ""}${errMsg && sub !== "auftraege" ? `<p class="err" style="margin-top:10px">${esc(errMsg)}</p>` : ""}</div>`;
  }
  function kpiRechnungen() {
    const S = D.stats;
    return `<div class="panel"><div class="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
        <div><div class="small">Bezahlt ${S.jahr}</div><b class="mono">${eur(S.bezahlt)}</b></div>
        <div><div class="small">Offen (${S.offen_n})</div><b class="mono" ${S.ueberfaellig_n ? 'style="color:var(--red)"' : ""}>${eur(S.offen)}</b>${S.ueberfaellig_n ? `<div class="small" style="color:var(--red)">${S.ueberfaellig_n} überfällig</div>` : ""}</div>
        <div><div class="small">Abos je Monat</div><b class="mono">${eur(S.abo_monat)}</b></div>
        <div><div class="small">Entwürfe</div><b class="mono">${S.entwuerfe_n}</b></div></div>
      <p style="margin-top:10px"><button class="btn btn-ink" type="button" data-bpsub="neu">${edit && edit.id ? "Entwurf bearbeiten" : "Neue Rechnung"}</button></p>
      <p class="small">Rechnungen zu Aufträgen entstehen meist direkt im Auftrag (Anzahlung bei Annahme, Schlussrechnung in Schritt 7). Hier: alle Rechnungen, Einzelrechnungen, Abo-Rechnungen, Storno.</p></div>`;
  }

  // ---------- Rechnungen ----------
  function listPanel() {
    const R = D.rechnungen;
    if (!R.length) return kpiRechnungen() + `<div class="panel"><p class="muted">Noch keine Rechnungen.</p></div>`;
    return kpiRechnungen() + `<div class="panel"><div class="eyebrow">Rechnungen</div><div style="overflow-x:auto;margin-top:10px"><table class="grid small">
      <tr><th>Nr.</th><th>Datum</th><th>Kunde</th><th>Art</th><th style="text-align:right">Betrag</th><th>Status</th><th></th></tr>
      ${R.map((r) => {
        const st = STATUS[r.status] || [r.status, ""], late = r.status === "offen" && r.faellig && r.faellig < D.today;
        return `<tr><td class="mono">${esc(r.nr || "–")}</td><td>${dat(r.datum)}</td><td>${esc(kName(r.kunde))}${r.titel ? `<br><span class="muted">${esc(r.titel)}</span>` : ""}</td>
          <td>${TYP[r.typ] || r.typ}${r.regime !== "ku" ? `<br><span class="muted">${esc(r.regime)}</span>` : ""}</td><td class="mono" style="text-align:right">${eur(r.summe_cents)}${r.status === "bezahlt" && r.bezahlt_cents !== r.summe_cents ? `<br><span class="muted">bezahlt ${eur(r.bezahlt_cents)}</span>` : ""}</td>
          <td><span class="chip ${st[1]}">${st[0]}</span>${late ? `<br><span style="color:var(--red)">fällig ${dat(r.faellig)}</span>` : r.status === "offen" ? `<br><span class="muted">fällig ${dat(r.faellig)}</span>` : r.status === "bezahlt" ? `<br><span class="muted">${dat(r.bezahlt_am)}</span>` : r.storno_nr ? `<br><span class="muted">${esc(r.storno_nr)}</span>` : ""}</td>
          <td style="white-space:nowrap">
            <button class="tipbtn" data-bpshow="${r.id}">${r.status === "entwurf" ? "Vorschau" : "Ansehen / PDF"}</button>${r.nr ? `<button class="tipbtn" data-bplink="${r.id}">Kundenlink</button>` : ""}
            ${r.status === "entwurf" ? `<button class="tipbtn" data-bpedit="${r.id}">Bearbeiten</button><button class="tipbtn" data-bpissue="${r.id}">Ausstellen</button><button class="tipbtn" data-bpdel="${r.id}">Löschen</button>` : ""}
            ${r.status === "offen" ? `<button class="tipbtn" data-bppay="${r.id}">Bezahlt …</button>${r.typ !== "storno" ? `<button class="tipbtn" data-bpstorno="${r.id}">Stornieren</button>` : ""}` : ""}
            ${r.status === "bezahlt" ? `<button class="tipbtn" data-bpunpay="${r.id}">Zahlung zurücknehmen</button>` : ""}
          </td></tr>
          <tr hidden id="bppay-${r.id}"><td colspan="7"><form class="two" data-bppayform="${r.id}" style="align-items:end">
            <div class="field"><label>Gutschrift am Konto am</label><input type="date" name="bezahlt_am" value="${D.today}" required></div>
            <div class="field"><label>Betrag laut Kontoauszug (€)</label><input name="betrag" value="${num(r.summe_cents)}" inputmode="decimal"></div>
            <div><button class="btn btn-ink" type="submit">Als bezahlt buchen</button></div></form></td></tr>`;
      }).join("")}</table></div>
      <p class="small">Ausgestellte Rechnungen sind gesperrt (fortlaufende Nummer, Aufbewahrung 7 Jahre). Fehler korrigieren: stornieren und neu ausstellen. Bezahlt = Datum der Gutschrift am Geschäftskonto (Zufluss für die E/A-Rechnung).</p></div>`;
  }

  function posRow(p = {}) {
    return `<div class="bp-pos" style="display:grid;grid-template-columns:minmax(0,1fr) 70px 80px 110px 32px;gap:6px;align-items:start;margin-bottom:6px">
      <textarea name="text" rows="2" maxlength="400" placeholder="Leistung">${esc(p.text || "")}</textarea>
      <input name="menge" value="${p.menge ?? 1}" inputmode="decimal" aria-label="Menge">
      <input name="einheit" value="${esc(p.einheit || "pauschal")}" aria-label="Einheit">
      <input name="preis" value="${p.preis_cents != null ? num(p.preis_cents) : ""}" inputmode="decimal" placeholder="Preis €" aria-label="Einzelpreis in Euro">
      <button type="button" class="tipbtn" data-bpposdel title="Position entfernen">×</button></div>`;
  }
  function formPanel() {
    const e = edit || { typ: "rechnung", positionen: [{}], sprache: "", abzuege: [] };
    if (!D.kunden.length) return `<div class="panel"><p>Zuerst einen Kunden anlegen: <a href="#" data-bpsub="kunden">Kunden</a>.</p></div>`;
    const kid = e.kunde_id || (D.kunden[0] && D.kunden[0].id);
    const anz = D.rechnungen.filter((r) => r.typ === "anzahlung" && r.status === "bezahlt" && r.kunde_id === kid);
    const used = new Set(D.rechnungen.filter((r) => r.id !== e.id && r.status !== "storniert" && r.typ !== "storno").flatMap((r) => r.abzuege.map((a) => a.id)));
    const kd = D.kunden.find((k) => k.id === kid);
    return `<div class="panel"><div class="eyebrow">${e.id ? "Entwurf bearbeiten" : "Neue Rechnung"}</div>
      <form id="bp-form" class="form" style="margin-top:10px">
        <div class="two"><div class="field"><label for="bp-k">Kunde</label><select id="bp-k" name="kunde_id">${D.kunden.map((k) => `<option value="${k.id}" ${k.id === kid ? "selected" : ""}>${esc(kName(k))} (${esc(k.land)})</option>`).join("")}</select></div>
          <div class="field"><label for="bp-t">Art</label><select id="bp-t" name="typ">${[["rechnung", "Rechnung"], ["anzahlung", "Anzahlungsrechnung"], ["schluss", "Schlussrechnung (zieht Anzahlungen ab)"]].map(([v, l]) => `<option value="${v}" ${v === e.typ ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
        ${kd ? `<p class="small">Steuer: <b>${esc(D.regime_label[kd.regime])}</b> – Hinweis auf der Rechnung: „${esc(D.vat[kd.sprache === "en" ? "en" : "de"][kd.regime])}“</p>` : ""}
        <div class="two"><div class="field"><label for="bp-ti">Betreff</label><input id="bp-ti" name="titel" maxlength="160" value="${esc(e.titel || "")}" placeholder="z. B. Website Tischlerei Muster"></div>
          <div class="field"><label for="bp-l">Leistungszeitraum / Leistungsdatum</label><input id="bp-l" name="leistung" maxlength="120" value="${esc(e.leistung || "")}" placeholder="z. B. Oktober 2026 – leer = Rechnungsdatum"></div></div>
        <div class="two"><div class="field"><label for="bp-s">Sprache der Rechnung</label><select id="bp-s" name="sprache"><option value="">wie beim Kunden</option><option value="de" ${e.sprache === "de" ? "selected" : ""}>Deutsch</option><option value="en" ${e.sprache === "en" ? "selected" : ""}>Englisch</option></select></div>
          <div class="field"><label for="bp-v">Position aus der Preisliste</label><select id="bp-v"><option value="">– auswählen und hinzufügen –</option>${VORLAGEN.map((v, i) => `<option value="${i}">${esc(v[0].split(" – ")[0])} · ${v[1]} €</option>`).join("")}</select></div></div>
        <div class="field"><label for="bp-o">Text über den Positionen (optional)</label><textarea id="bp-o" name="text_oben" rows="2" maxlength="1000" placeholder="z. B. Vielen Dank für Ihren Auftrag laut Angebot vom …">${esc(e.text_oben || "")}</textarea></div>
        <div class="small" style="display:grid;grid-template-columns:minmax(0,1fr) 70px 80px 110px 32px;gap:6px;font-weight:600"><span>Leistung</span><span>Menge</span><span>Einheit</span><span>Einzelpreis €</span><span></span></div>
        <div id="bp-pos">${(e.positionen.length ? e.positionen : [{}]).map(posRow).join("")}</div>
        <div><button type="button" class="tipbtn" id="bp-posadd">+ Position</button></div>
        <div id="bp-anz" ${e.typ === "schluss" ? "" : "hidden"}><div class="small" style="font-weight:600;margin-top:8px">Bezahlte Anzahlungen abziehen</div>
          ${anz.length ? anz.map((a) => `<label class="check"><input type="checkbox" name="anz" value="${a.id}" ${e.abzuege.some((x) => x.id === a.id) ? "checked" : ""} ${used.has(a.id) ? "disabled" : ""}><span>${esc(a.nr)} vom ${dat(a.datum)} – ${eur(a.bezahlt_cents)}${used.has(a.id) ? " (schon in einer anderen Rechnung abgezogen)" : ""}</span></label>`).join("") : `<p class="small muted">Für diesen Kunden gibt es keine bezahlte Anzahlung.</p>`}</div>
        <p class="small" id="bp-sum" style="font-weight:600"></p>
        <div class="field"><label for="bp-u">Text unter der Rechnung (optional)</label><textarea id="bp-u" name="text_unten" rows="2" maxlength="1000" placeholder="z. B. Service ab November laut Servicevertrag.">${esc(e.text_unten || "")}</textarea></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ink" type="submit">Entwurf speichern</button>${e.id ? `<button class="btn btn-line" type="button" id="bp-cancel">Abbrechen</button>` : ""}</div>
        <p class="small">Gespeichert wird als Entwurf ohne Nummer. In der Liste: „Vorschau“ prüfen, dann „Ausstellen“ – erst dann bekommt die Rechnung ihre Nummer.</p>
      </form></div>`;
  }
  function readForm(f) {
    const pos = [...f.querySelectorAll(".bp-pos")].map((r) => ({ text: r.querySelector('[name="text"]').value, menge: r.querySelector('[name="menge"]').value, einheit: r.querySelector('[name="einheit"]').value, preis: r.querySelector('[name="preis"]').value }));
    return { id: edit && edit.id, kunde_id: f.kunde_id.value, typ: f.typ.value, titel: f.titel.value, leistung: f.leistung.value, sprache: f.sprache.value, text_oben: f.text_oben.value, text_unten: f.text_unten.value,
      positionen: pos, anzahlungen: [...f.querySelectorAll('[name="anz"]:checked')].map((x) => x.value) };
  }
  const toC = (v) => { let t = String(v || "").replace(/\s|€/g, ""); if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", "."); else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); else t = t.replace(/,/g, ""); const n = Math.round(Number(t) * 100); return Number.isFinite(n) ? n : 0; };
  function updateSum(f) {
    const b = readForm(f);
    const tot = b.positionen.reduce((a, p) => a + Math.round((Number(String(p.menge).replace(",", ".")) || 0) * toC(p.preis)), 0);
    const abz = b.typ === "schluss" ? D.rechnungen.filter((r) => b.anzahlungen.includes(r.id)).reduce((a, r) => a + (r.bezahlt_cents || 0), 0) : 0;
    f.querySelector("#bp-sum").textContent = `Summe ${eur(tot)}${abz ? ` − Anzahlungen ${eur(abz)} = zu zahlen ${eur(tot - abz)}` : ""}`;
  }

  // ---------- Kunden (Brightpage-Kundendatenbank) ----------
  const STN = { neu: "1 Anfrage", kontaktiert: "2 Erstgespräch", gespraech: "3 Angebot", angebot: "3 Angebot", auftrag: "4 Auftrag", bau: "5 Bau", korrektur: "5 Korrekturen", freischaltung: "6 Freischaltung", uebergabe: "6 Übergabe", schluss: "7 Schlussrechnung", abgeschlossen: "8 Abgeschlossen", verloren: "Verloren" };
  function kundeForm(k) {
    const f = (n, l, v, extra = "") => `<div class="field"><label>${l}</label><input name="${n}" value="${esc(v ?? "")}" ${extra}></div>`;
    return `<form id="bp-kf" class="form" style="margin-top:10px">
        <div class="two"><div class="field"><label>Art</label><select name="art"><option value="b2b" ${k.art !== "b2c" ? "selected" : ""}>Firma, Verein, Organisation</option><option value="b2c" ${k.art === "b2c" ? "selected" : ""}>Privatperson</option></select></div>${f("firma", "Firma / Verein", k.firma, 'maxlength="120"')}</div>
        <div class="two">${f("name", "Ansprechperson / Name", k.name, 'maxlength="120"')}${f("email", "E-Mail", k.email, 'type="email" maxlength="160"')}</div>
        <div class="two">${f("telefon", "Telefon", k.telefon, 'maxlength="40"')}${f("website", "Website", k.website, 'maxlength="200"')}</div>
        <div class="two">${f("strasse", "Straße und Hausnummer", k.strasse, 'maxlength="120" required')}<div style="display:grid;grid-template-columns:110px 1fr;gap:8px">${f("plz", "PLZ", k.plz, 'maxlength="10" required')}${f("ort", "Ort", k.ort, 'maxlength="100" required')}</div></div>
        <div class="two">${f("land", "Land (Kürzel)", k.land || "AT", 'maxlength="2" style="text-transform:uppercase" required')}${f("uid", "UID (Firmen, optional)", k.uid, 'maxlength="20" placeholder="z. B. ATU12345678"')}</div>
        <div class="two"><div class="field"><label>Sprache der Rechnungen</label><select name="sprache"><option value="de">Deutsch</option><option value="en" ${k.sprache === "en" ? "selected" : ""}>Englisch</option></select></div>${f("notiz", "Notiz (intern)", k.notiz, 'maxlength="500"')}</div>
        <p class="small">EU-Firma mit UID → Reverse Charge (UID vorher im <a href="https://ec.europa.eu/taxation_customs/vies/" target="_blank" rel="noopener">VIES</a> prüfen). Verein ohne eigene Einnahmen am Markt gilt oft als Verbraucher.</p>
        <div style="display:flex;gap:8px"><button class="btn btn-ink" type="submit">${k.id ? "Speichern" : "Kunde anlegen"}</button><button type="button" class="btn btn-line" id="bp-kcancel">Abbrechen</button></div></form>`;
  }
  function kundenPanel() {
    if (kundeNeu) return `<div class="panel"><div class="eyebrow">Neuer Kunde</div>${kundeForm({ art: "b2b", land: "AT", sprache: "de" })}</div>`;
    const k = kundeOpen && D.kunden.find((x) => x.id === kundeOpen);
    if (k) {
      const R = D.rechnungen.filter((r) => r.kunde_id === k.id), A = (D.auftraege || []).filter((x) => x.kunde_id === k.id), B = D.abos.filter((x) => x.kunde_id === k.id);
      const bez = R.filter((r) => r.status === "bezahlt").reduce((a, r) => a + r.bezahlt_cents, 0), off = R.filter((r) => r.status === "offen").reduce((a, r) => a + r.summe_cents, 0);
      return `<div class="panel"><p style="margin:0 0 6px"><a href="#" id="bp-kback">← Alle Kunden</a></p>
          <h2 style="margin:4px 0">${esc(kName(k))}</h2><p class="small muted">${esc(D.regime_label[k.regime])}${k.uid ? " · " + esc(k.uid) : ""} · Kunde seit ${new Date(k.created_at).toLocaleDateString("de-AT")}</p>
          <div class="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:8px"><div><div class="small">Umsatz bezahlt</div><b class="mono">${eur(bez)}</b></div><div><div class="small">Offen</div><b class="mono">${eur(off)}</b></div><div><div class="small">Aufträge</div><b class="mono">${A.length}</b></div><div><div class="small">Abos aktiv</div><b class="mono">${B.filter((b) => b.aktiv).length}</b></div></div></div>
        <div class="panel"><div class="eyebrow">Aufträge</div>${A.length ? `<table class="grid small" style="margin-top:6px">${A.map((x) => `<tr><td class="mono">${esc(x.nr)}</td><td>${esc(STN[x.status] || x.status)}</td><td class="mono">${x.wert_cents != null ? eur(x.wert_cents) : "–"}</td><td><button class="tipbtn" data-bpauf="${x.id}">Auftrag öffnen</button></td></tr>`).join("")}</table>` : `<p class="small muted">Keine Aufträge verknüpft.</p>`}</div>
        <div class="panel"><div class="eyebrow">Rechnungen</div>${R.length ? `<table class="grid small" style="margin-top:6px">${R.map((r) => `<tr><td class="mono">${esc(r.nr || "Entwurf")}</td><td>${TYP[r.typ] || r.typ}</td><td>${dat(r.datum)}</td><td class="mono">${eur(r.summe_cents)}</td><td><span class="chip ${(STATUS[r.status] || ["", ""])[1]}">${(STATUS[r.status] || [r.status])[0]}</span></td>
            <td style="white-space:nowrap"><button class="tipbtn" data-bpshow="${r.id}">Ansehen</button>${r.nr ? `<button class="tipbtn" data-bplink="${r.id}">Kundenlink</button>` : ""}</td></tr>`).join("")}</table>` : `<p class="small muted">Noch keine Rechnungen.</p>`}
          <p style="margin-top:8px"><button class="tipbtn" data-bpknew="${k.id}">Neue Rechnung für diesen Kunden</button></p></div>
        <div class="panel"><div class="eyebrow">Abos</div>${B.length ? B.map((b) => `<p class="small" style="margin:4px 0">${esc(b.titel)} · ${eur(b.preis_cents)} / ${({ monat: "Monat", quartal: "Quartal", jahr: "Jahr" })[b.rhythmus]} · ab ${esc(b.start)} · ${b.aktiv ? "aktiv" : "beendet"}</p>`).join("") : `<p class="small muted">Keine Abos.</p>`}</div>
        <div class="panel"><div class="eyebrow">Stammdaten</div>${kundeForm(editKunde && editKunde.id === k.id ? editKunde : k)}
          <p style="margin-top:12px"><button class="tipbtn" data-bpkdel="${k.id}">Kunden löschen</button></p></div>`;
    }
    const q = kSuche.trim().toLowerCase(), L = D.kunden.filter((x) => !q || [x.firma, x.name, x.email, x.ort, x.plz_ort].join(" ").toLowerCase().includes(q));
    return `<div class="panel"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn btn-ink" type="button" id="bp-kneu">Neuer Kunde</button>
        <input id="bp-ksuche" placeholder="Suchen: Name, Firma, Ort, E-Mail" value="${esc(kSuche)}" style="flex:1;min-width:200px"></div>
      <p class="small" style="margin-top:8px">Brightpage-Kunden – getrennt von den Mordsteam-Kunden (Tab „Kunden &amp; Newsletter“). Wer ein Angebot online annimmt, landet automatisch hier.</p>
      ${L.length ? `<div style="overflow-x:auto;margin-top:10px"><table class="grid small"><tr><th>Kunde</th><th>Kontakt</th><th>Ort</th><th>Aufträge</th><th style="text-align:right">Umsatz</th><th style="text-align:right">offen</th></tr>
        ${L.map((x) => { const R = D.rechnungen.filter((r) => r.kunde_id === x.id), u = R.filter((r) => r.status === "bezahlt").reduce((a, r) => a + r.bezahlt_cents, 0), o = R.filter((r) => r.status === "offen").reduce((a, r) => a + r.summe_cents, 0), A = (D.auftraege || []).filter((y) => y.kunde_id === x.id);
          return `<tr style="cursor:pointer" data-bpkopen="${x.id}"><td><b>${esc(kName(x))}</b>${x.art === "b2b" && x.name ? `<br>${esc(x.name)}` : ""}</td><td>${esc(x.email || "")}${x.telefon ? `<br>${esc(x.telefon)}` : ""}</td><td>${esc(((x.plz || "") + " " + (x.ort || "")).trim())} · ${esc(x.land)}</td>
            <td>${A.map((y) => esc(STN[y.status] || y.status)).join("<br>") || "–"}</td><td class="mono" style="text-align:right">${eur(u)}</td><td class="mono" style="text-align:right;${o ? "color:var(--red)" : ""}">${o ? eur(o) : "–"}</td></tr>`; }).join("")}</table></div>` : `<p class="muted" style="margin-top:10px">${q ? "Keine Treffer." : "Noch keine Kunden."}</p>`}</div>`;
  }

  // ---------- Einnahmen (nur Brightpage) ----------
  function einnahmenPanel() {
    const MON = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    const jahre = [...new Set([D.today.slice(0, 4), ...D.rechnungen.filter((r) => r.bezahlt_am).map((r) => r.bezahlt_am.slice(0, 4))])].sort().reverse();
    const y = einJahr || jahre[0];
    const P = D.rechnungen.filter((r) => r.status === "bezahlt" && (r.bezahlt_am || "").startsWith(y));
    const art = (r) => (r.abo_id ? "abo" : r.typ === "anzahlung" ? "anzahlung" : r.typ === "schluss" ? "schluss" : "einzel");
    const COL = [["anzahlung", "Anzahlungen"], ["schluss", "Schlussrechnungen"], ["einzel", "Einzelrechnungen"], ["abo", "Abos"]];
    const rows = MON.map((m, i) => { const mm = `${y}-${String(i + 1).padStart(2, "0")}`, R = P.filter((r) => r.bezahlt_am.slice(0, 7) === mm), c = {}; COL.forEach(([k]) => (c[k] = R.filter((r) => art(r) === k).reduce((a, r) => a + r.bezahlt_cents, 0))); return { m, c, sum: R.reduce((a, r) => a + r.bezahlt_cents, 0) }; });
    const tot = {}; COL.forEach(([k]) => (tot[k] = rows.reduce((a, r) => a + r.c[k], 0))); const total = rows.reduce((a, r) => a + r.sum, 0);
    const offen = D.rechnungen.filter((r) => r.status === "offen"), late = offen.filter((r) => r.faellig && r.faellig < D.today);
    const top = D.kunden.map((k) => [k, P.filter((r) => r.kunde_id === k.id).reduce((a, r) => a + r.bezahlt_cents, 0)]).filter((x) => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return `<div class="panel"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div class="eyebrow" style="margin:0">Einnahmen Brightpage</div><select id="bp-ejahr">${jahre.map((j) => `<option ${j === y ? "selected" : ""}>${j}</option>`).join("")}</select></div>
        <div class="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:10px">
          <div><div class="small">Bezahlt ${y}</div><b class="mono">${eur(total)}</b></div><div><div class="small">Offen (${offen.length})</div><b class="mono">${eur(offen.reduce((a, r) => a + r.summe_cents, 0))}</b></div>
          <div><div class="small">Überfällig (${late.length})</div><b class="mono" ${late.length ? 'style="color:var(--red)"' : ""}>${eur(late.reduce((a, r) => a + r.summe_cents, 0))}</b></div><div><div class="small">Abos je Monat</div><b class="mono">${eur(D.stats.abo_monat)}</b></div></div>
        <div style="overflow-x:auto;margin-top:12px"><table class="grid small"><tr><th>Monat</th>${COL.map(([, l]) => `<th style="text-align:right">${l}</th>`).join("")}<th style="text-align:right">Summe</th></tr>
          ${rows.map((r) => `<tr><td>${r.m}</td>${COL.map(([k]) => `<td class="mono" style="text-align:right">${r.c[k] ? eur(r.c[k]) : "–"}</td>`).join("")}<td class="mono" style="text-align:right"><b>${r.sum ? eur(r.sum) : "–"}</b></td></tr>`).join("")}
          <tr><th>Summe</th>${COL.map(([k]) => `<th class="mono" style="text-align:right">${eur(tot[k])}</th>`).join("")}<th class="mono" style="text-align:right">${eur(total)}</th></tr></table></div>
        <p class="small" style="margin-top:8px">Zahlungseingang nach Datum der Gutschrift (Zufluss). Die gemeinsame E/A-Rechnung von Mordsteam und Brightpage (eine Firma) steht unter <b>Finanzen</b>, dort auch je Sparte getrennt.</p></div>
      ${late.length ? `<div class="panel"><div class="eyebrow">Überfällig</div><table class="grid small" style="margin-top:6px">${late.map((r) => `<tr><td class="mono">${esc(r.nr)}</td><td>${esc(kName(r.kunde))}</td><td>fällig ${dat(r.faellig)}</td><td class="mono">${eur(r.summe_cents)}</td></tr>`).join("")}</table><p class="small">Zahlungserinnerung im jeweiligen Auftrag (Schritt 4 bzw. 7) vorbereiten.</p></div>` : ""}
      ${top.length ? `<div class="panel"><div class="eyebrow">Kunden nach Umsatz ${y}</div><table class="grid small" style="margin-top:6px">${top.map(([k, c]) => `<tr style="cursor:pointer" data-bpkopen="${k.id}"><td>${esc(kName(k))}</td><td class="mono" style="text-align:right">${eur(c)}</td></tr>`).join("")}</table></div>` : ""}`;
  }

  // ---------- Abos (Service, Werbe-Betreuung, KI-Betrieb) ----------
  function abosPanel() {
    const a = editAbo || { rhythmus: "monat", start: D.today.slice(0, 7) };
    if (!D.kunden.length) return `<div class="panel"><p>Zuerst einen Kunden anlegen: <a href="#" data-bpsub="kunden">Kunden</a>.</p></div>`;
    return `<div class="panel"><div class="eyebrow">${a.id ? "Abo bearbeiten" : "Neues Abo"}</div>
      <form id="bp-af" class="form" style="margin-top:10px">
        <div class="two"><div class="field"><label>Kunde</label><select name="kunde_id">${D.kunden.map((k) => `<option value="${k.id}" ${k.id === a.kunde_id ? "selected" : ""}>${esc(kName(k))}</option>`).join("")}</select></div>
          <div class="field"><label>Vorlage</label><select id="bp-av"><option value="">–</option>${ABO_VORLAGEN.map((v, i) => `<option value="${i}">${esc(v[0])} · ${v[1]} €</option>`).join("")}</select></div></div>
        <div class="two"><div class="field"><label>Bezeichnung</label><input name="titel" maxlength="160" value="${esc(a.titel || "")}" required></div>
          <div class="field"><label>Preis je Zeitraum (€)</label><input name="preis" inputmode="decimal" value="${a.preis_cents != null ? num(a.preis_cents) : ""}" required></div></div>
        <div class="two"><div class="field"><label>Verrechnung</label><select name="rhythmus">${[["monat", "monatlich im Voraus"], ["quartal", "vierteljährlich im Voraus"], ["jahr", "jährlich im Voraus"]].map(([v, l]) => `<option value="${v}" ${v === a.rhythmus ? "selected" : ""}>${l}</option>`).join("")}</select></div>
          <div class="field"><label>Beginn (Monat)</label><input name="start" type="month" value="${esc(a.start || "")}" required></div></div>
        <div class="two"><div class="field"><label>Ende (Monat, leer = läuft)</label><input name="ende" type="month" value="${esc(a.ende || "")}"></div>
          <div class="field">${a.id ? `<label class="check"><input type="checkbox" name="aktiv" ${a.aktiv ? "checked" : ""}><span>aktiv</span></label>` : ""}</div></div>
        <div style="display:flex;gap:8px"><button class="btn btn-ink" type="submit">${a.id ? "Speichern" : "Abo anlegen"}</button>${a.id ? `<button type="button" class="btn btn-line" id="bp-acancel">Abbrechen</button>` : ""}</div>
        <p class="small">Für jeden begonnenen Zeitraum ohne Rechnung erscheint oben „Abo-Rechnung fällig“. Daraus werden Entwürfe, die du prüfst und ausstellst.</p>
      </form></div>
      <div class="panel"><div class="eyebrow">Abos (Service, Werbe-Betreuung, KI-Betrieb)</div>${D.abos.length ? `<div style="overflow-x:auto;margin-top:10px"><table class="grid small"><tr><th>Kunde</th><th>Abo</th><th>Preis</th><th>seit</th><th>Status</th><th></th></tr>
        ${D.abos.map((x) => `<tr><td>${esc(kName(D.kunden.find((k) => k.id === x.kunde_id)))}</td><td>${esc(x.titel)}</td><td class="mono">${eur(x.preis_cents)} / ${({ monat: "Monat", quartal: "Quartal", jahr: "Jahr" })[x.rhythmus]}</td>
          <td>${esc(x.start)}${x.ende ? " – " + esc(x.ende) : ""}</td><td>${x.aktiv ? (x.offen ? `<b>${x.offen} fällig</b>` : "aktuell") : "beendet"}</td><td><button class="tipbtn" data-bpaedit="${x.id}">Bearbeiten</button></td></tr>`).join("")}</table></div>` : `<p class="muted">Noch keine Abos.</p>`}</div>`;
  }

  // ---------- Einstellungen ----------
  function cfgPanel() {
    const c = D.cfg, f = (k, l, ph = "", t = "text") => `<div class="field"><label>${l}</label><input name="${k}" type="${t}" value="${esc(c[k] || "")}" placeholder="${esc(ph)}" maxlength="120"></div>`;
    return `<div class="panel"><div class="eyebrow">Einstellungen für Rechnungen</div>
      <form id="bp-cf" class="form" style="margin-top:10px">
        <div class="two">${f("firma", "Firmenwortlaut", "Mordsteam e.U.")}${f("marke", "Marke (Kopf der Rechnung)", "Brightpage")}</div>
        <div class="two">${f("inhaber", "Inhaber")}${f("telefon", "Telefon (optional)")}</div>
        <div class="two">${f("strasse", "Straße und Hausnummer")}${f("plz_ort", "PLZ und Ort")}</div>
        <div class="two">${f("email", "E-Mail")}${f("web", "Website")}</div>
        <div class="two">${f("fn", "Firmenbuchnummer", "FN 123456a")}${f("fb_gericht", "Firmenbuchgericht", "Landesgericht Eisenstadt")}</div>
        <div class="two">${f("iban", "IBAN Geschäftskonto")}${f("bic", "BIC")}</div>
        <div class="two">${f("bank", "Bank")}${f("ziel_tage", "Zahlungsziel (Tage)", "14", "number")}</div>
        <div class="field"><label>Zusatz in der Fußzeile (optional)</label><input name="fusszeile" maxlength="300" value="${esc(c.fusszeile || "")}"></div>
        <p class="small">Eigene UID: <b class="mono">${esc(c.uid || "nicht gesetzt")}</b> (kommt aus der Cloudflare-Variable UID_NR). Die Steuernummer gehört nicht auf die Rechnung und wird hier nicht gespeichert.</p>
        <div><button class="btn btn-ink" type="submit">Speichern</button></div></form></div>`;
  }

  // ---------- Rechnung als A4-Seite ----------
  const L = (lang, de, en) => (lang === "en" ? en : de);
  function epc(c, r) {
    if (!c.iban || r.summe_cents <= 0) return "";
    const lines = ["BCD", "002", "1", "SCT", c.bic || "", (c.firma || "").slice(0, 70), c.iban, "EUR" + (r.summe_cents / 100).toFixed(2), "", "", (r.nr || "").slice(0, 140)];
    try {
      const q = qrcode(0, "M");
      q.addData(unescape(encodeURIComponent(lines.join("\n"))));   // UTF-8 als Bytefolge
      q.make();
      return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
    } catch { return ""; }
  }
  function invoiceHtml(r) {
    const c = D.cfg, k = r.kunde, lang = r.sprache === "en" ? "en" : "de", T = (de, en) => L(lang, de, en);
    const titel = { rechnung: T("Rechnung", "Invoice"), anzahlung: T("Anzahlungsrechnung", "Advance invoice"), schluss: T("Schlussrechnung", "Final invoice"), storno: T("Stornorechnung", "Cancellation invoice") }[r.typ];
    const money = (x) => (x / 100).toLocaleString(lang === "en" ? "en-GB" : "de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
    const d = (ymd) => (ymd ? (lang === "en" ? new Date(ymd + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : dat(ymd)) : "");
    const brutto = r.positionen.reduce((a, p) => a + p.cents, 0);
    const qr = r.status === "offen" ? epc(c, r) : "";   // Entwurf: kein Zahl-Code, sonst zahlt jemand eine nie ausgestellte Rechnung
    const addDays = (ymd, n) => new Date(Date.parse(ymd + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
    const faellig = d(r.faellig || addDays(r.datum || D.today, Number(c.ziel_tage) || 14));   // Entwurf: voraussichtlich, aus dem Zahlungsziel (wie der Server beim Ausstellen)
    const draft = r.status === "entwurf";
    return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(r.nr || "Entwurf")} ${esc(kName(k))}</title>
<style>
@page{size:A4;margin:18mm 18mm 16mm}
*{box-sizing:border-box}body{font-family:"Helvetica Neue",Arial,sans-serif;font-size:10pt;line-height:1.45;color:#1D1F24;margin:0}
.page{max-width:180mm;margin:0 auto;position:relative}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12mm}
.brand{font-size:22pt;font-weight:800;letter-spacing:-.02em}.brand span{color:#D9820B}.sub{font-size:8.5pt;color:#555}
.from{font-size:7.5pt;color:#555;border-bottom:1px solid #999;display:inline-block;margin-bottom:2mm}
.addr{min-height:32mm}.meta{border-collapse:collapse;font-size:9pt}.meta td{padding:1px 0 1px 10px;vertical-align:top}.meta td:first-child{color:#555;padding-left:0}
.cols{display:flex;justify-content:space-between;gap:10mm}
h1{font-size:15pt;margin:10mm 0 2mm}
table.pos{width:100%;border-collapse:collapse;margin-top:5mm}table.pos th{text-align:left;font-size:8.5pt;color:#555;border-bottom:1.5px solid #1D1F24;padding:4px 4px}
table.pos th.r{text-align:right}table.pos td{padding:6px 4px;border-bottom:1px solid #ddd;vertical-align:top}.r{text-align:right;white-space:nowrap}
.tot td{border:0;padding:3px 4px}.tot .big td{font-weight:700;font-size:11.5pt;border-top:1.5px solid #1D1F24;padding-top:6px}
.vat{margin-top:5mm;font-size:9pt}.pay{display:flex;gap:8mm;align-items:center;margin-top:7mm;padding:4mm;border:1px solid #ccc;border-radius:3mm}
.pay svg{width:30mm;height:30mm}.pay small{color:#555}
.foot{margin-top:12mm;border-top:1px solid #ccc;padding-top:3mm;font-size:7.5pt;color:#555;display:flex;justify-content:space-between;gap:6mm}
.draft{position:fixed;top:40%;left:0;right:0;text-align:center;font-size:60pt;color:rgba(179,38,30,.15);transform:rotate(-20deg);font-weight:800;pointer-events:none}
.bar{position:sticky;top:0;background:#F3EFE6;padding:8px;text-align:center;margin-bottom:10px;font-family:system-ui}.bar button{font:inherit;padding:6px 14px}
@media print{.bar{display:none}}
</style></head><body>
<div class="bar"><button type="button" id="bp-print">Drucken / Als PDF sichern</button> <small>Im Druckdialog „Als PDF sichern“ wählen, Kopf- und Fußzeilen des Browsers ausschalten.</small></div>
${draft ? `<div class="draft">${T("ENTWURF", "DRAFT")}</div>` : ""}
<div class="page">
<div class="top"><div><div class="brand">${esc(c.marke || "Brightpage")}<span>.</span></div><div class="sub">${esc(T("eine Marke der", "a brand of"))} ${esc(c.firma)}</div></div>
<div class="sub" style="text-align:right">${esc(c.firma)}<br>${esc(c.strasse)}<br>${esc(c.plz_ort)}<br>${esc(c.email)}${c.telefon ? "<br>" + esc(c.telefon) : ""}<br>${esc(c.web)}</div></div>
<div class="cols"><div class="addr"><div class="from">${esc(c.firma)} · ${esc(c.strasse)} · ${esc(c.plz_ort)}</div><br>
${k.art === "b2b" && k.firma ? `<b>${esc(k.firma)}</b><br>${k.name ? esc(k.name) + "<br>" : ""}` : `<b>${esc(k.name)}</b><br>`}${esc(k.strasse)}<br>${esc(k.plz_ort)}${k.land && k.land !== "AT" ? "<br>" + esc(k.land) : ""}</div>
<table class="meta"><tr><td>${T("Rechnungsnummer", "Invoice no.")}</td><td><b>${esc(r.nr || T("(Entwurf)", "(draft)"))}</b></td></tr>
<tr><td>${T("Rechnungsdatum", "Invoice date")}</td><td>${d(r.datum || D.today)}</td></tr>
<tr><td>${r.typ === "anzahlung" ? T("Leistung", "Service") : T("Leistungszeitraum", "Service period")}</td><td>${esc(r.leistung || d(r.datum || D.today))}</td></tr>
${r.typ !== "storno" ? `<tr><td>${T("Fällig am", "Due date")}</td><td>${faellig}</td></tr>` : ""}
${k.uid ? `<tr><td>${T("UID Kunde", "Customer VAT ID")}</td><td>${esc(k.uid)}</td></tr>` : ""}
${c.uid ? `<tr><td>${T("Unsere UID", "Our VAT ID")}</td><td>${esc(c.uid)}</td></tr>` : ""}</table></div>
<h1>${titel}${r.titel ? ": " + esc(r.titel) : ""}</h1>
${r.text_oben ? `<p>${esc(r.text_oben).replace(/\n/g, "<br>")}</p>` : ""}
<table class="pos"><tr><th style="width:6%">${T("Pos.", "Item")}</th><th>${T("Leistung", "Description")}</th><th class="r">${T("Menge", "Qty")}</th><th class="r">${T("Einzelpreis", "Unit price")}</th><th class="r">${T("Betrag", "Amount")}</th></tr>
${r.positionen.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.text).replace(/\n/g, "<br>")}</td><td class="r">${String(p.menge).replace(".", lang === "en" ? "." : ",")} ${esc(p.einheit || "")}</td><td class="r">${money(p.preis_cents)}</td><td class="r">${money(p.cents)}</td></tr>`).join("")}
</table>
<table class="pos tot">${r.abzuege.length ? `<tr><td></td><td class="r">${T("Summe", "Subtotal")}</td><td class="r" style="width:28mm">${money(brutto)}</td></tr>
${r.abzuege.map((a) => `<tr><td></td><td class="r">${a.cents < 0 ? T("Rücknahme Abzug Anzahlung", "reversal of advance payment") : T("abzüglich Anzahlung", "less advance payment")} ${esc(a.nr)} ${T("vom", "of")} ${d(a.datum)}</td><td class="r">${a.cents < 0 ? "+" : "−"}${money(Math.abs(a.cents)).replace("-", "")}</td></tr>`).join("")}` : ""}
<tr class="big"><td></td><td class="r">${r.typ === "storno" ? T("Gutschrift", "Credit") : r.abzuege.length ? T("Zu zahlen", "Amount due") : T("Gesamtbetrag", "Total")}</td><td class="r" style="width:28mm">${money(r.summe_cents)}</td></tr></table>
<p class="vat">${esc(D.vat[lang][r.regime] || "")}</p>
${r.typ !== "storno" && r.status !== "bezahlt" ? `<div class="pay">${qr ? `<div>${qr}</div>` : ""}<div>${T("Bitte überweisen Sie den Betrag bis", "Please transfer the amount by")} <b>${faellig}</b> ${T("auf folgendes Konto", "to")}:<br>
<b>${esc(c.firma)}</b> · IBAN <b>${esc((c.iban || "").replace(/(.{4})/g, "$1 ").trim())}</b>${c.bic ? " · BIC " + esc(c.bic) : ""}${c.bank ? "<br>" + esc(c.bank) : ""}<br>${T("Verwendungszweck", "Reference")}: <b>${esc(r.nr || "")}</b>
${qr ? `<br><small>${T("Mit der Banking-App scannen („Zahlen mit Code“) – Betrag und Verwendungszweck sind schon ausgefüllt.", "Scan with your banking app (EPC QR code) – amount and reference are pre-filled.")}</small>` : ""}</div></div>` : r.status === "bezahlt" ? `<p><b>${T("Bezahlt am", "Paid on")} ${d(r.bezahlt_am)}.</b> ${T("Vielen Dank!", "Thank you!")}</p>` : ""}
${r.text_unten ? `<p style="margin-top:6mm">${esc(r.text_unten).replace(/\n/g, "<br>")}</p>` : ""}
<div class="foot"><div>${esc(c.firma)}${c.inhaber ? ", " + T("Inhaber", "owner") + " " + esc(c.inhaber) : ""}<br>${esc(c.strasse)}, ${esc(c.plz_ort)}, ${T("Österreich", "Austria")}</div>
<div>${c.fn ? T("Firmenbuch", "Company register") + " " + esc(c.fn) + (c.fb_gericht ? ", " + esc(c.fb_gericht) : "") + "<br>" : ""}${c.uid ? "UID " + esc(c.uid) : ""}</div>
<div>${esc(c.email)}<br>${esc(c.web)}${c.fusszeile ? "<br>" + esc(c.fusszeile) : ""}</div></div>
</div></body></html>`;
  }
  async function show(id) {
    const r = D.rechnungen.find((x) => x.id === id);
    if (!r) return;
    if (r.nr) {   // ausgestellte Rechnung: dasselbe Belegdesign mit Logo, das der Kunde unter seinem Link sieht
      const w = window.open("", "_blank");
      if (!w) { errMsg = "Das Fenster wurde vom Browser blockiert – Pop-ups für den Admin erlauben."; paint(); return; }
      try { const h = (await api("POST", "rechnung/html", { id })).html; w.document.open(); w.document.write(h); w.document.close(); const pb = w.document.getElementById("pr"); if (pb) pb.addEventListener("click", () => w.print()); }
      catch (e) { w.close(); errMsg = e.message; paint(); }
      return;
    }
    const w = window.open("", "_blank");
    if (!w) { errMsg = "Das Fenster wurde vom Browser blockiert – Pop-ups für den Admin erlauben."; paint(); return; }
    w.document.open(); w.document.write(invoiceHtml(r)); w.document.close();
    const pb = w.document.getElementById("bp-print"); if (pb) pb.addEventListener("click", () => w.print());   // kein onclick im HTML (CSP)
  }

  // ---------- Zeichnen und Ereignisse ----------
  function paint() {
    if (!el) return;
    if (sub === "auftraege") {
      el.innerHTML = head() + `<div id="bp-auf"></div>`;
      bindSub();
      if (window.BPAuftraege) { BPAuftraege.mount(el.querySelector("#bp-auf"), H, { open: aufOpen }); aufOpen = null; }
      return;
    }
    el.innerHTML = head() + (sub === "rechnungen" ? listPanel() : sub === "neu" ? formPanel() : sub === "kunden" ? kundenPanel() : sub === "abos" ? abosPanel() : sub === "einnahmen" ? einnahmenPanel() : cfgPanel());
    const $ = (s) => el.querySelector(s), $$ = (s) => el.querySelectorAll(s);
    bindSub();
    $$("[data-bplink]").forEach((b) => (b.onclick = async () => { try { const r = await api("POST", "rechnung/link", { id: b.dataset.bplink }); const url = "https://brightpage.net/k/rechnung/" + r.token;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { msg = "Kundenlink kopiert: " + url; paint(); }, () => prompt("Kundenlink kopieren:", url)); } catch (e) { errMsg = e.message; paint(); } }));
    $$("[data-bpkopen]").forEach((b) => (b.onclick = () => { sub = "kunden"; kundeOpen = b.dataset.bpkopen; kundeNeu = false; editKunde = null; msg = errMsg = ""; paint(); window.scrollTo(0, el.offsetTop); }));
    $$("[data-bpauf]").forEach((b) => (b.onclick = () => go("auftraege", { open: b.dataset.bpauf })));
    const kb = $("#bp-kback"); if (kb) kb.onclick = (e) => { e.preventDefault(); kundeOpen = null; editKunde = null; paint(); };
    const kn = $("#bp-kneu"); if (kn) kn.onclick = () => { kundeNeu = true; kundeOpen = null; paint(); };
    const ks = $("#bp-ksuche"); if (ks) { ks.oninput = () => { kSuche = ks.value; const pos = ks.selectionStart; paint(); const n = el.querySelector("#bp-ksuche"); n.focus(); n.setSelectionRange(pos, pos); }; }
    const ej = $("#bp-ejahr"); if (ej) ej.onchange = () => { einJahr = ej.value; paint(); };
    const gen = $("#bp-abo-gen"); if (gen) gen.onclick = () => act(() => api("POST", "abo/rechnungen", {}), (r) => `${r.angelegt} Entwurf/Entwürfe angelegt – unter „Rechnungen“ prüfen und ausstellen.`);
    $$("[data-bpshow]").forEach((b) => (b.onclick = () => show(b.dataset.bpshow)));
    $$("[data-bpedit]").forEach((b) => (b.onclick = () => { const r = D.rechnungen.find((x) => x.id === b.dataset.bpedit); edit = { ...r, abzuege: r.abzuege || [] }; sub = "neu"; paint(); }));
    $$("[data-bpissue]").forEach((b) => (b.onclick = () => { if (confirm("Rechnung jetzt ausstellen? Sie bekommt die nächste Nummer und lässt sich danach nicht mehr ändern.")) act(() => api("POST", "rechnung/ausstellen", { id: b.dataset.bpissue }), (r) => `Rechnung ${r.nr} ausgestellt. „Ansehen / PDF“ öffnet sie zum Speichern und Versenden.`); }));
    $$("[data-bpdel]").forEach((b) => (b.onclick = () => { if (confirm("Entwurf löschen?")) act(() => api("POST", "rechnung/storno", { id: b.dataset.bpdel }), "Entwurf gelöscht."); }));
    $$("[data-bpstorno]").forEach((b) => (b.onclick = () => { const g = prompt("Rechnung stornieren – es entsteht eine Stornorechnung mit eigener Nummer. Grund (erscheint auf dem Storno):", ""); if (g !== null) act(() => api("POST", "rechnung/storno", { id: b.dataset.bpstorno, grund: g }), (r) => `Storniert – Stornorechnung ${r.nr}.`); }));
    $$("[data-bppay]").forEach((b) => (b.onclick = () => { const row = $("#bppay-" + b.dataset.bppay); row.hidden = !row.hidden; }));
    $$("[data-bpunpay]").forEach((b) => (b.onclick = () => { if (confirm("Zahlung zurücknehmen? Die Rechnung ist dann wieder offen und zählt nicht mehr zu den Einnahmen.")) act(() => api("POST", "rechnung/bezahlt", { id: b.dataset.bpunpay, zurueck: true }), "Zahlung zurückgenommen."); }));
    $$("[data-bppayform]").forEach((f) => (f.onsubmit = (e) => { e.preventDefault(); act(() => api("POST", "rechnung/bezahlt", { id: f.dataset.bppayform, bezahlt_am: f.bezahlt_am.value, betrag: f.betrag.value }), (r) => r.abweichung ? `Gebucht. Achtung: ${eur(Math.abs(r.abweichung))} ${r.abweichung < 0 ? "weniger" : "mehr"} als der Rechnungsbetrag.` : "Als bezahlt gebucht – zählt jetzt zu den Einnahmen."); }));
    // Formular Rechnung
    const f = $("#bp-form");
    if (f) {
      const sum = () => updateSum(f);
      f.oninput = sum; sum();
      $("#bp-posadd").onclick = () => { $("#bp-pos").insertAdjacentHTML("beforeend", posRow()); wirePos(); sum(); };
      const wirePos = () => f.querySelectorAll("[data-bpposdel]").forEach((x) => (x.onclick = () => { if (f.querySelectorAll(".bp-pos").length > 1) x.closest(".bp-pos").remove(); sum(); }));
      wirePos();
      $("#bp-v").onchange = (e) => { const v = VORLAGEN[e.target.value]; if (!v) return;
        const empty = [...f.querySelectorAll(".bp-pos")].find((r) => !r.querySelector('[name="text"]').value.trim());
        const kd = D.kunden.find((k) => k.id === f.kunde_id.value), en = (f.sprache.value || (kd && kd.sprache)) === "en";   // englische Rechnung → englischer Vorlagentext
        const html = posRow({ text: en ? v[3] : v[0], menge: 1, einheit: en ? EINHEIT_EN[v[2]] || v[2] : v[2], preis_cents: Math.round(v[1] * 100) });
        if (empty) empty.outerHTML = html; else $("#bp-pos").insertAdjacentHTML("beforeend", html);
        e.target.value = ""; wirePos(); sum(); };
      $("#bp-t").onchange = () => { $("#bp-anz").hidden = $("#bp-t").value !== "schluss"; sum(); };
      $("#bp-k").onchange = () => { edit = { ...readForm(f), positionen: readForm(f).positionen.map((p) => ({ ...p, preis_cents: toC(p.preis) })), abzuege: [] }; paint(); };
      const cc = $("#bp-cancel"); if (cc) cc.onclick = () => { edit = null; sub = "rechnungen"; paint(); };
      f.onsubmit = (e) => { e.preventDefault(); const b = readForm(f); act(async () => { const r = await api("POST", "rechnung", b); edit = null; sub = "rechnungen"; return r; }, "Entwurf gespeichert. „Vorschau“ prüfen, dann „Ausstellen“."); };
    }
    // Kunden
    const kf = $("#bp-kf");
    if (kf) {
      kf.onsubmit = (e) => { e.preventDefault(); const b = Object.fromEntries(new FormData(kf)); b.id = kundeOpen || ""; act(async () => { const r = await api("POST", "kunde", b); editKunde = null; if (kundeNeu) { kundeNeu = false; kundeOpen = r.id; } return r; }, "Kunde gespeichert."); };
      const kc = $("#bp-kcancel"); if (kc) kc.onclick = () => { editKunde = null; kundeNeu = false; paint(); };
    }
    $$("[data-bpknew]").forEach((b) => (b.onclick = () => { edit = { kunde_id: b.dataset.bpknew, typ: "rechnung", positionen: [{}], abzuege: [] }; sub = "neu"; paint(); }));
    $$("[data-bpkdel]").forEach((b) => (b.onclick = () => { if (confirm("Kunden löschen?")) act(async () => { await api("POST", "kunde/loeschen", { id: b.dataset.bpkdel }); kundeOpen = null; }, "Kunde gelöscht."); }));
    // Abos
    const af = $("#bp-af");
    if (af) {
      $("#bp-av").onchange = (e) => { const v = ABO_VORLAGEN[e.target.value]; if (!v) return; af.titel.value = v[0]; af.preis.value = num(v[1] * 100); };
      af.onsubmit = (e) => { e.preventDefault(); const b = Object.fromEntries(new FormData(af)); b.id = editAbo && editAbo.id; if (editAbo) b.aktiv = !!af.querySelector('[name="aktiv"]:checked'); act(async () => { const r = await api("POST", "abo", b); editAbo = null; return r; }, "Abo gespeichert."); };
      const ac = $("#bp-acancel"); if (ac) ac.onclick = () => { editAbo = null; paint(); };
      $$("[data-bpaedit]").forEach((b) => (b.onclick = () => { editAbo = D.abos.find((x) => x.id === b.dataset.bpaedit); paint(); }));
    }
    $$("form").forEach((fm) => fm.addEventListener("invalid", (ev) => {
      const fld = ev.target, lab = (fld.closest(".field") && fld.closest(".field").querySelector("label")) || null;
      let p = fm.querySelector(".bp-inv");
      if (!p) { p = document.createElement("p"); p.className = "err bp-inv"; p.setAttribute("role", "alert"); p.style.marginTop = "10px"; fm.appendChild(p); p.dataset.n = ""; }
      const name = lab ? lab.textContent.trim() : fld.name;
      const list = p.dataset.n ? p.dataset.n.split("|") : [];
      if (!list.includes(name)) list.push(name);
      p.dataset.n = list.join("|");
      p.textContent = (fld.validity.valueMissing || list.length > 1 ? "Bitte ausfüllen bzw. prüfen: " : "Bitte prüfen: ") + list.join(", ");
      clearTimeout(p._t); p._t = setTimeout(() => { p.dataset.n = ""; }, 50);   // nächster Absendeversuch beginnt eine neue Liste
    }, true));
    const cf = $("#bp-cf");
    if (cf) cf.onsubmit = (e) => { e.preventDefault(); act(() => api("POST", "einstellungen", Object.fromEntries(new FormData(cf))), "Einstellungen gespeichert."); };
  }

  // Eingabefelder der Positionszeilen wie die übrigen Admin-Felder; am Handy untereinander
  const css = document.createElement("style");
  css.textContent = `.bp-pos textarea,.bp-pos input{font:inherit;font-size:15px;padding:8px 10px;border:1px solid var(--line,#ccc);border-radius:8px;background:#fff;color:inherit;width:100%;min-width:0}
    @media(max-width:640px){.bp-pos{grid-template-columns:1fr 1fr!important}.bp-pos textarea{grid-column:1/-1}}`;
  document.head.appendChild(css);

  function bindSub() {
    el.querySelectorAll("[data-bpsub]").forEach((b) => (b.onclick = (e) => { e.preventDefault(); sub = b.dataset.bpsub; if (sub === "kunden") { kundeOpen = null; kundeNeu = false; } msg = errMsg = ""; try { sessionStorage.setItem("bp_sub", sub === "neu" ? "rechnungen" : sub); } catch {} paint(); }));
    const gen = el.querySelector("#bp-abo-gen"); if (gen) gen.onclick = () => act(() => api("POST", "abo/rechnungen", {}), (r) => `${r.angelegt} Entwurf/Entwürfe angelegt – unter „Rechnungen“ prüfen und ausstellen.`);
  }
  // Sprung zwischen Untertabs (z. B. aus einem Auftrag in die Kundendatenbank)
  async function go(to, opts = {}) {
    sub = to; msg = errMsg = "";
    if (opts.kunde) { kundeOpen = opts.kunde; kundeNeu = false; }
    if (opts.open) aufOpen = opts.open;
    try { sessionStorage.setItem("bp_sub", sub); } catch {}
    if (to !== "auftraege") { try { D = await api("GET", "daten"); } catch {} }
    paint(); if (el) window.scrollTo(0, el.offsetTop);
  }

  window.BPAdmin = {
    go,
    async mount(target, headers) {
      el = target; H = headers;
      if (D) paint();
      else el.innerHTML = `<div class="panel"><p class="muted">Lade Brightpage …</p></div>`;
      try { await reload(); } catch (e) { el.innerHTML = `<div class="panel"><p class="err">${esc(e.message)}</p></div>`; }
    },
  };
})();
