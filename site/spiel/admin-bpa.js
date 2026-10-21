// Mordsteam-Admin, Brightpage → Untertab „Aufträge“ (Umbau 21.10.2026): jede Anfrage läuft durch 8 Schritte in Ablauf-Reihenfolge
// 1 Anfrage beantworten → 2 Erstgespräch → 3 Angebot → 4 Auftrag und Anzahlung → 5 Bau und Korrekturen → 6 Freischaltung und Übergabe
// → 7 Schlussrechnung → 8 Nachbetreuung. Der aktuelle Schritt ist offen, erledigte sind zugeklappt. Rechts: Kontakt, nächster Schritt, Zeit, Verlauf.
// Mails an Kunden: „Mail vorbereiten“ zeigt die Mail mit Brightpage-Kopf; kopieren, im Mailprogramm einfügen, selbst senden (nichts geht automatisch raus).
// Server: /api/bp/admin/auftraege, auftrag/*, angebot*, rechnung/* (lib/bpauftrag.js, lib/bpangebot.js, lib/brightpage.js).
(function () {
  const esc = (x) => MS.esc(String(x ?? ""));
  const eur = (c) => (c == null ? "–" : (c / 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €");
  const eur0 = (c) => (c == null ? "–" : (c / 100).toLocaleString("de-AT", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €");
  const dat = (ymd) => (ymd ? ymd.split("-").reverse().join(".") : "–");
  const dt = (ms) => new Date(ms).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const KLINK = "https://brightpage.net/k/";
  let el = null, H = null, D = null, open = null, filter = "offen", neu = false, msg = "", errMsg = "";
  let artInit = null;   // Verein-Regel nur einmal je Angebot beim ersten Öffnen anwenden
  let AN = null, anFor = null, edit = null, aufSteps = new Set(), mailDlg = null, kontaktEdit = false, payFor = null, curStep = 0, rStep = 0, zeigFormular = false, prodVorschlag = null;

  async function api(method, path, body) {
    const r = await fetch("/api/bp/admin/" + path, { method, headers: { "content-type": "application/json", ...H() }, body: body ? JSON.stringify(body) : undefined });
    let d = {}; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d.error || "Fehler " + r.status);
    return d;
  }
  async function loadAN() { AN = await api("GET", "angebote?auftrag=" + encodeURIComponent(open)); anFor = open; if (edit) edit = AN.list.find((x) => x.id === edit.id) || null; }
  async function reload() { D = await api("GET", "auftraege"); if (open) await loadAN(); paint(); }
  async function act(fn, ok) { errMsg = ""; msg = ""; try { await fn(); msg = ok || ""; await reload(); } catch (e) { errMsg = e.message; paint(); } }
  const stName = (k) => (D.stationen.find((s) => s[0] === k) || [k, k])[1];
  const prodName = (k) => (D.produkte.find((p) => p[0] === k) || [k, k])[1];
  const quelleName = (k) => (D.quellen.find((q) => q[0] === k) || [k, k])[1];
  const who = (a) => a.firma ? `${a.firma}${a.name ? " · " + a.name : ""}` : a.name || "–";
  const chipCls = (st, late) => (late ? "run" : st === "abgeschlossen" ? "fin" : "");
  const chipStyle = (st, late) => `white-space:nowrap${st === "neu" && !late ? ";background:#D9820B;color:#15171C" : ""}`;
  // Herkunft lesbar (wie in der Anfrage-Mail, functions/api/kontakt.js)
  const herkunftName = (hk) => (!hk ? "" : hk === "gads" ? "Google-Anzeige" : hk === "chat" ? "über den Chat" : hk.startsWith("ref:") ? "Link von " + hk.slice(4) : "Kürzel " + hk);

  // ---------- Schritte ----------
  const STEPS = [
    [1, "Anfrage beantworten", ["neu"]],
    [2, "Erstgespräch", ["kontaktiert"]],
    [3, "Angebot", ["gespraech", "angebot"]],
    [4, "Auftrag und Anzahlung", ["auftrag"]],
    [5, "Bau und Korrekturen", ["bau", "korrektur"]],
    [6, "Freischaltung und Übergabe", ["freischaltung", "uebergabe"]],
    [7, "Schlussrechnung", ["schluss"]],
    [8, "Nachbetreuung", ["abgeschlossen"]],
  ];
  const stepOf = (st) => (STEPS.find((s) => s[2].includes(st)) || [0])[0];
  // Punkte der Produkt-Checklisten, die erst beim Go-live dran sind (Schritt 6 statt 5)
  const GOLIVE = new Set(["dns-sicher", "domain", "mailtest", "weiterleitung", "suche", "live"]);

  // ---------- Mails mit Brightpage-Kopf ----------
  // Dunkler Kopfbalken mit festen Farben: sieht im hellen und im dunklen Modus des Mailprogramms gleich aus.
  // Fließtext ohne feste Farbe, damit das Mailprogramm ihn im dunklen Modus selbst hell stellt.
  function mailHtml(lang, body) {
    const en = lang === "en";
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:600px;table-layout:fixed;-webkit-text-size-adjust:100%;text-size-adjust:100%">
<tr><td style="background:#15171C;padding:20px 26px;border-radius:12px 12px 0 0"><span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;letter-spacing:1.5px;color:#D9820B">BRIGHT</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;letter-spacing:1.5px;color:#F3EFE6">PAGE</span>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#B9BCC3;margin-top:4px">${en ? "Websites, shops and AI solutions for small businesses" : "Websites, Shops und KI-Lösungen für Betriebe"}</div></td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:#D9820B">&nbsp;</td></tr>
<tr><td data-mailbody style="padding:24px 22px 8px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.6;word-break:break-word;overflow-wrap:anywhere">${body.replace(/<a href="([^"]+)">/g, '<a href="$1" style="color:#D9820B;text-decoration:underline">')}</td></tr>
<tr><td style="padding:8px 22px 22px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.6">${en ? "Best regards" : "Liebe Grüße"}<br><b>Martin Kriegler</b><br>Brightpage – ${en ? "a service of" : "ein Angebot der"} Mordsteam e.U.</td></tr>
<tr><td style="padding:12px 26px;border-top:1px solid #D9D6CF;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#8A8D94">office@brightpage.net · <a href="https://brightpage.net" style="color:#D9820B;text-decoration:none">brightpage.net</a></td></tr></table>`;
  }
  const btn = (text, url) => `<p style="margin:20px 0"><a href="${esc(url)}" style="display:inline-block;background:#D9820B;color:#15171C;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:17px;text-decoration:none;padding:14px 22px;border-radius:8px">${esc(text)}</a></p>`;
  const P = (x) => `<p style="margin:0 0 14px">${x}</p>`;
  const UL = (items) => `<ul style="margin:0 0 14px;padding-left:20px">${items.map((i) => `<li style="margin:0 0 4px">${i}</li>`).join("")}</ul>`;
  // Termin aus „Erstgespräch (Video) 26.10.2026 um 15:00“ englisch formulieren (Nachttest 21.10.2026, UX8)
  const terminEn = (t) => { const m = /^Erstgespräch \(([^)]+)\) (\d{2})\.(\d{2})\.(\d{4})(?: um (\d{1,2}:\d{2}))?/.exec(t || ""); if (!m) return t;
    const d = new Date(Date.UTC(+m[4], +m[3] - 1, +m[2], 12)), wie = { Video: "video call", Telefon: "phone call", "vor Ort": "on site" }[m[1]] || m[1];
    return `${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}${m[5] ? " at " + m[5] : ""} (${wie})`; };
  const anrede = (lang, name) => (lang === "en" ? `Hello${name ? " " + esc(name) : ""},` : `Guten Tag${name ? " " + esc(name) : ""},`);

  // Vorlagen: liefern { to, subject, body, lang }
  function mailVorlage(art, a, x) {
    const lang = (x && x.sprache) || a.sprache || "de", en = lang === "en", k = (x && x.kunde) || {}, name = k.name || a.name || "";
    const R = (AN && AN.rechnungen) || [];
    const to = k.email || (AN && AN.kunde && AN.kunde.email) || a.email || "";
    if (art === "antwort") return { to: a.email, lang, subject: en ? "Your enquiry to Brightpage" : "Ihre Anfrage an Brightpage", body:
      P(anrede(lang, a.name)) + (en
        ? P("thank you for your enquiry! I'd be happy to talk through what you need in a short, free call – about 30 minutes, by phone, video or on site. Afterwards you'll receive a fixed-price quote.") + P("Would one of these times suit you?") + UL(["[Day, date, time]", "[Day, date, time]"]) + P(`Examples of our work: <a href="https://brightpage.net/en/#referenzen">brightpage.net</a> · all prices: <a href="https://brightpage.net/en/prices.html">price list</a>`)
        : P("vielen Dank für Ihre Anfrage! Gerne bespreche ich mit Ihnen in einem kurzen, kostenlosen Gespräch, was Sie brauchen – ca. 30 Minuten, telefonisch, per Video oder bei Ihnen vor Ort. Danach bekommen Sie ein Angebot zum Fixpreis.") + P("Passt Ihnen einer dieser Termine?") + UL(["[Wochentag, Datum, Uhrzeit]", "[Wochentag, Datum, Uhrzeit]"]) + P(`Beispiele unserer Arbeit: <a href="https://brightpage.net/demo/weingut/">Weingut</a> · <a href="https://brightpage.net/demo/salon/">Friseursalon</a> · <a href="https://brightpage.net/demo/tischlerei/">Tischlerei</a> · <a href="https://brightpage.net/demo/verein/">Musikverein</a><br>Alle Preise: <a href="https://brightpage.net/preise.html">brightpage.net/preise</a>`)) };
    if (art === "termin") return { to: a.email, lang, subject: en ? "Our call – Brightpage" : "Unser Gespräch – Brightpage", body:
      P(anrede(lang, a.name)) + (en ? P(`thank you – I've noted our appointment: <b>${esc(terminEn(a.next_was) || "[date, time]")}</b>.`) + P("To make the most of our time, you could jot down beforehand: what the website should achieve, 2–3 websites you like, and whether you have a logo, texts and photos.")
        : P(`danke – ich habe unseren Termin notiert: <b>${esc(a.next_was || "[Datum, Uhrzeit]")}</b>.`) + P("Damit wir die Zeit gut nutzen, können Sie sich vorab notieren: was die Website erreichen soll, 2–3 Websites, die Ihnen gefallen, und ob Logo, Texte und Fotos schon da sind.")) };
    if (art === "angebot") return { to, lang, subject: en ? `Your quote ${x.nr} from Brightpage` : `Ihr Angebot ${x.nr} von Brightpage`, body:
      P(anrede(lang, name)) + (en ? P("thank you again for our conversation! Here is your fixed-price quote. You can view it online and accept it with one click – options can be added there too.")
        : P("vielen Dank nochmals für das angenehme Gespräch! Hier ist Ihr Angebot zum Fixpreis. Sie können es online ansehen und mit einem Klick annehmen – Optionen wählen Sie dort direkt dazu.")) +
      btn(en ? "View and accept quote" : "Angebot ansehen und annehmen", KLINK + "angebot/" + x.token) +
      P(en ? `The quote is valid until ${dat(x.gueltig_bis)}. If anything should be different, simply reply to this e-mail.` : `Das Angebot gilt bis ${dat(x.gueltig_bis)}. Wenn etwas anders sein soll, antworten Sie einfach auf diese Mail.`) };
    if (art === "bestaetigung") { const r = R.find((y) => y.id === x.rechnung_id); return { to, lang, subject: en ? `Order confirmation ${x.nr} – Brightpage` : `Auftragsbestätigung ${x.nr} – Brightpage`, body:
      P(anrede(lang, name)) + P(en ? "thank you for your order – we're looking forward to working with you!" : "vielen Dank für Ihren Auftrag – wir freuen uns auf die Zusammenarbeit!") +
      (r && r.token ? P(en ? `Here is your advance invoice <b>${esc(r.nr)}</b> (${eur(r.summe_cents)}, due ${dat(r.faellig)}) – payable by bank transfer or QR code in your banking app:` : `Hier ist Ihre Anzahlungsrechnung <b>${esc(r.nr)}</b> (${eur(r.summe_cents)}, fällig am ${dat(r.faellig)}) – per Überweisung oder QR-Code in der Banking-App:`) + btn(en ? "View invoice" : "Rechnung ansehen", KLINK + "rechnung/" + r.token) : "") +
      (x.annahme && x.annahme.fruehstart ? P(en ? "<b>Your request for an early start:</b> you expressly asked us to begin before the 14-day withdrawal period ends, and you confirmed that you are aware you lose your right of withdrawal once we have fully performed the contract. If you withdraw before then, you pay a proportionate amount for the work done." : "<b>Ihr Wunsch nach vorzeitigem Beginn:</b> Sie haben ausdrücklich verlangt, dass wir schon vor Ende der 14-tägigen Widerrufsfrist beginnen, und bestätigt, dass Ihnen bekannt ist: Ihr Widerrufsrecht erlischt, sobald wir den Vertrag vollständig erfüllt haben. Widerrufen Sie davor, zahlen Sie einen anteiligen Betrag für die bereits erbrachten Leistungen.") : x.kunde && x.kunde.art === "b2c" ? P(en ? `You may withdraw within 14 days of acceptance – online at <a href="${KLINK}widerrufen?lang=en">brightpage.net/k/widerrufen</a>, by e-mail or with the <a href="${KLINK}widerruf?lang=en">model withdrawal form</a>; we start after the withdrawal period.` : `Sie können binnen 14 Tagen ab Annahme widerrufen – online unter <a href="${KLINK}widerrufen">brightpage.net/k/widerrufen</a>, per E-Mail oder mit dem <a href="${KLINK}widerruf">Muster-Widerrufsformular</a>; wir beginnen nach Ablauf der Widerrufsfrist.`) : "") +
      P(en ? `<b>Attached</b> you'll find your accepted quote as a PDF with all terms${x.kunde && x.kunde.art === "b2c" ? ", the withdrawal information and the model withdrawal form" : ""}.` : `<b>Im Anhang</b> finden Sie Ihr angenommenes Angebot als PDF mit allen Bedingungen${x.kunde && x.kunde.art === "b2c" ? ", der Widerrufsbelehrung und dem Muster-Widerrufsformular" : ""}.`) +
      P(en ? "Next step: you'll shortly receive our order form for your texts, pictures and access details. We start as soon as the advance payment and your material have arrived." : "Nächster Schritt: Sie bekommen in Kürze unser Auftragsformular für Texte, Bilder und Zugänge. Wir beginnen, sobald Anzahlung und Unterlagen da sind.") +
      P(`<a href="${KLINK}angebot/${esc(x.token)}">${en ? "Your accepted quote" : "Ihr angenommenes Angebot"} ${esc(x.nr)}</a>`) }; }
    if (art === "formular") { const G = (AN && AN.anleitungen) || []; return { to, lang, subject: en ? "Your order form – Brightpage" : "Ihr Auftragsformular – Brightpage", body:
      P(anrede(lang, name)) + P(en ? "to get started we need a few details: your business details for the imprint, your design wishes, content and domain. You can save in between and continue later." : "damit wir loslegen können, brauchen wir ein paar Angaben: Firmendaten fürs Impressum, Ihre Design-Wünsche, Inhalte und Domain. Sie können zwischendurch speichern und später weitermachen.") +
      btn(en ? "Open order form" : "Auftragsformular öffnen", KLINK + "formular/" + a.token) +
      (G.length ? P(en ? "A few short steps you do yourself (a few minutes each, never send us passwords):" : "Ein paar kurze Schritte machen Sie selbst – je ein paar Minuten, Passwörter bitte nie an uns schicken:") + UL(G.map((g) => `<a href="${KLINK}anleitung/${g.key}${en ? "?lang=en" : ""}">${esc((en && g.titel_en) || g.titel)}</a>`)) : "") +
      P(en ? "We start as soon as the form and the advance payment have arrived." : "Wir beginnen, sobald Formular und Anzahlung da sind.") }; }
    if (art === "uebergabe") return { to, lang, subject: en ? "Your website is live – handover record" : "Ihre Website ist online – Übergabeprotokoll", body:
      P(anrede(lang, name)) + P(en ? "your website is live! Here is the handover record with everything we set up and handed over. Please check it and confirm with one click." : "Ihre Website ist online! Hier ist das Übergabeprotokoll mit allem, was wir eingerichtet und übergeben haben. Bitte kurz durchsehen und mit einem Klick bestätigen.") +
      btn(en ? "View and confirm" : "Protokoll ansehen und bestätigen", KLINK + "uebergabe/" + a.token) + P(en ? "After confirmation you'll receive the final invoice." : "Nach der Bestätigung bekommen Sie die Schlussrechnung.") };
    if (art === "vorschau") return { to, lang, subject: en ? "Your new website – preview" : "Ihre neue Website – Vorschau", body:
      P(anrede(lang, name)) + P(en ? "your new website is ready for a first look! Please take your time and collect all requests for changes in one e-mail – two rounds of corrections are included." : "Ihre neue Website ist bereit für einen ersten Blick! Nehmen Sie sich Zeit und sammeln Sie alle Änderungswünsche in einer Mail – zwei Korrekturrunden sind inklusive.") +
      btn(en ? "Open preview" : "Vorschau öffnen", "https://[vorschau-adresse]") + P(en ? "The preview is not visible to search engines." : "Die Vorschau ist für Suchmaschinen unsichtbar.") };
    if (art === "rechnung" || art === "erinnerung") { const r = x; return { to, lang, subject: art === "erinnerung" ? (en ? `Friendly reminder: invoice ${r.nr}` : `Freundliche Erinnerung: Rechnung ${r.nr}`) : (en ? `Invoice ${r.nr} – Brightpage` : `Rechnung ${r.nr} – Brightpage`), body:
      P(anrede(lang, name)) + (art === "erinnerung"
        ? P(en ? `a quick friendly reminder – we haven't yet received the payment for invoice <b>${esc(r.nr)}</b> (${eur(r.summe_cents)}, due ${dat(r.faellig)}). If you've already paid, please ignore this e-mail.` : `eine kurze, freundliche Erinnerung – zur Rechnung <b>${esc(r.nr)}</b> (${eur(r.summe_cents)}, fällig am ${dat(r.faellig)}) ist bei uns noch keine Zahlung eingegangen. Falls Sie schon überwiesen haben, betrachten Sie diese Mail bitte als gegenstandslos.`)
        : P(en ? `thank you for the good cooperation! Here is your ${r.typ === "schluss" ? "final " : ""}invoice <b>${esc(r.nr)}</b> over ${eur(r.summe_cents)}, payable by ${dat(r.faellig)}.` : `vielen Dank für die gute Zusammenarbeit! Hier ist Ihre ${r.typ === "schluss" ? "Schluss" : ""}rechnung <b>${esc(r.nr)}</b> über ${eur(r.summe_cents)}, zahlbar bis ${dat(r.faellig)}.`)) +
      btn(en ? "View invoice" : "Rechnung ansehen", KLINK + "rechnung/" + r.token) + P(en ? "You can pay by bank transfer or scan the QR code with your banking app." : "Sie können per Überweisung zahlen oder den QR-Code mit der Banking-App scannen.") }; }
    if (art === "bewertung") return { to, lang, subject: en ? "Thank you – and a small request" : "Danke – und eine kleine Bitte", body:
      P(anrede(lang, name)) + P(en ? "thank you for your trust – it was a pleasure working with you! If you're happy with your new website, a short Google review would help us a lot:" : "danke für Ihr Vertrauen – es hat Freude gemacht! Wenn Sie mit Ihrer neuen Website zufrieden sind, würde uns eine kurze Google-Bewertung sehr helfen:") +
      btn(en ? "Write a review" : "Bewertung schreiben", "https://g.page/r/[bewertungslink]/review") +
      P(en ? `<b>Do you know someone who needs a website?</b> If you refer a new customer, you receive a Brightpage voucher (or half of it as a universal shopping voucher) once their order is paid. Details: <a href="https://brightpage.net/en/prices.html#empfehlung">referral bonus</a>.` : `<b>Kennen Sie jemanden, der eine Website braucht?</b> Für jeden neuen Kunden, den Sie empfehlen, bekommen Sie nach bezahltem Auftrag einen Brightpage-Gutschein – oder die Hälfte als universellen Einkaufsgutschein. Details: <a href="https://brightpage.net/preise.html#empfehlung">Empfehlungsbonus</a>.`) };
    if (art === "bericht") return { to, lang, subject: en ? "Your 30-day report – Brightpage" : "Ihr 30-Tage-Bericht – Brightpage", body:
      P(anrede(lang, name)) + P(en ? "it's been 30 days – here is a short summary:" : "30 Tage sind um – hier eine kurze Zusammenfassung:") + UL(en ? ["Visitors: [number]", "Enquiries via the website: [number]", "Google profile: [views / calls / route requests]", "Our recommendation: [one sentence]"] : ["Besucher: [Zahl]", "Anfragen über die Website: [Zahl]", "Google-Profil: [Aufrufe / Anrufe / Routen]", "Unsere Empfehlung: [ein Satz]"]) };
    return { to, lang, subject: "", body: "" };
  }

  function openMail(art, a, x) { const m = mailVorlage(art, a, x); mailDlg = { ...m, html: mailHtml(m.lang, m.body) }; paint(); }
  function mailDialog() {
    if (!mailDlg) return "";
    return `<div id="bpa-mail" style="position:fixed;inset:0;background:rgba(21,23,28,.55);z-index:1000;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 10px">
      <div class="panel" style="max-width:720px;width:100%;margin:0">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div class="eyebrow">Mail vorbereiten</div><button class="tipbtn" type="button" id="bpa-mx">Schließen</button></div>
        <div class="two" style="margin-top:8px"><div class="field"><label>An</label><input id="bpa-mto" value="${esc(mailDlg.to || "")}"></div><div class="field"><label>Betreff</label><input id="bpa-msub" value="${esc(mailDlg.subject)}"></div></div>
        <p class="small">Text in [eckigen Klammern] ersetzen – du kannst direkt in der Mail unten tippen.</p>
        <div id="bpa-mprev" style="border:1px solid var(--line,#ddd);border-radius:12px;padding:14px;background:#fff;color:#15171C">${mailDlg.html}</div>
        <ol class="small" style="margin:12px 0 8px 18px;line-height:1.9"><li><button class="btn btn-ink" type="button" id="bpa-mcopy">Mail kopieren</button> <span id="bpa-mok" class="muted"></span></li>
          <li><a class="tipbtn" id="bpa-mopen" href="#">Mailprogramm öffnen</a> – Empfänger und Betreff sind ausgefüllt. Ins Textfeld klicken, <b>⌘V</b>, aus office@brightpage.net senden.</li></ol>
        <p class="small muted">Der dunkle Kopf mit „BRIGHTPAGE“ sieht im hellen und dunklen Modus gleich aus; der Text passt sich dem Modus des Empfängers an.</p></div></div>`;
  }
  function bindMail() {
    const box = el.querySelector("#bpa-mail"); if (!box) return;
    const close = () => { mailDlg = null; paint(); };
    el.querySelector("#bpa-mx").onclick = close;
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    const prev = el.querySelector("#bpa-mprev"), body = prev.querySelector("[data-mailbody]");
    const editOn = (on) => { if (!body) return; body.contentEditable = on ? "true" : "false"; body.style.outline = on ? "1px dashed #D9820B" : ""; body.style.outlineOffset = "4px"; };
    editOn(true);
    el.querySelector("#bpa-mcopy").onclick = () => {
      editOn(false);
      const html = prev.innerHTML;
      const done = (ok) => { el.querySelector("#bpa-mok").textContent = ok ? "kopiert ✓ – jetzt Schritt 2" : "Kopieren ging nicht – Mail markieren und mit ⌘C kopieren."; editOn(true); };
      function fallback() { const r = document.createRange(); r.selectNodeContents(prev); const s = getSelection(); s.removeAllRanges(); s.addRange(r); let ok = false; try { ok = document.execCommand("copy"); } catch {} s.removeAllRanges(); done(ok); }
      try {
        if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([prev.innerText], { type: "text/plain" }) })]).then(() => done(true), fallback);
        else fallback();
      } catch { fallback(); }
    };
    el.querySelector("#bpa-mopen").onclick = (e) => { e.preventDefault(); location.href = `mailto:${encodeURIComponent(el.querySelector("#bpa-mto").value)}?subject=${encodeURIComponent(el.querySelector("#bpa-msub").value)}`; };
  }

  // ---------- Liste ----------
  function head() {
    const S = D.stats;
    return `<div class="panel">
      <div class="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
        <div><div class="small">Offen</div><b class="mono">${S.offen}</b></div>
        <div><div class="small">Neu, unbeantwortet</div><b class="mono" ${S.neu ? 'style="color:var(--red)"' : ""}>${S.neu}</b></div>
        <div><div class="small">Wert in Arbeit</div><b class="mono">${eur0(S.pipeline_cents)}</b></div>
        <div><div class="small">Gewonnen / verloren</div><b class="mono">${S.gewonnen} / ${S.verloren}</b></div>
      </div>
      ${D.warn.length ? `<div style="margin-top:12px">${D.warn.map((w) => `<p class="${w.heute ? "note" : "err"}" style="margin:4px 0"><a href="#" data-bpaopen="${w.id}">${esc(w.text)}</a></p>`).join("")}</div>` : ""}
      ${msg ? `<p class="note" role="status" style="margin-top:10px">${esc(msg)}</p>` : ""}${errMsg ? `<p class="err" style="margin-top:10px">${esc(errMsg)}</p>` : ""}</div>`;
  }
  function listPanel() {
    const F = { offen: (a) => a.status !== "abgeschlossen" && a.status !== "verloren", abgeschlossen: (a) => a.status === "abgeschlossen", verloren: (a) => a.status === "verloren", alle: () => true };
    const L = D.list.filter(F[filter]);
    return `<div class="panel">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-ink" id="bpa-neu" type="button">Neue Anfrage erfassen</button>
        <nav class="admtabs" role="tablist" style="margin-left:auto">${[["offen", "Offen"], ["abgeschlossen", "Abgeschlossen"], ["verloren", "Verloren"], ["alle", "Alle"]].map(([k, l]) => `<button type="button" role="tab" data-bpaf="${k}" aria-selected="${k === filter}">${l}</button>`).join("")}</nav>
      </div>
      ${neu ? newForm() : ""}
      ${L.length ? `<div style="overflow-x:auto;margin-top:12px"><table class="grid small">
        <tr><th>Nr.</th><th>Eingang</th><th>Kunde</th><th>Schritt</th><th>Nächster Schritt</th><th style="text-align:right">Wert</th></tr>
        ${L.map((a) => { const late = a.next_at && a.next_at < D.today, n = stepOf(a.status); return `<tr style="cursor:pointer" data-bpaopen="${a.id}">
          <td class="mono" style="white-space:nowrap">${esc(a.nr)}</td><td>${dt(a.created_at)}<br><span class="muted">${esc(quelleName(a.quelle))}</span></td>
          <td><b>${esc(who(a))}</b>${a.rueckruf ? ` <span class="chip open">Rückruf</span>` : ""}<br><span class="muted">${a.produkte.map((p) => esc(prodName(p))).join(", ")}</span></td>
          <td>${a.status === "verloren" ? `<span class="chip">Verloren</span>` : `<span class="chip ${chipCls(a.status, late)}" style="${chipStyle(a.status, late)}">${n}/8 ${esc(STEPS[n - 1][1])}</span>`}</td>
          <td ${late ? 'style="color:var(--red)"' : ""}>${a.next_at ? dat(a.next_at) + "<br>" : ""}<span class="${late ? "" : "muted"}">${esc(a.next_was || "")}</span></td>
          <td class="mono" style="text-align:right">${eur0(a.wert_cents)}</td></tr>`; }).join("")}</table></div>`
        : `<p class="muted" style="margin-top:12px">Keine Einträge in dieser Ansicht.</p>`}
      <p class="small" style="margin-top:10px">Anfragen über das Formular auf brightpage.net erscheinen hier automatisch. Anrufe, Mails und persönliche Anfragen mit „Neue Anfrage erfassen“ eintragen.</p></div>`;
  }
  function newForm() {
    return `<form id="bpa-nf" class="panel" style="margin-top:12px;background:var(--paper,#faf7f0)">
      <div class="two"><div class="field"><label>Name</label><input name="name" maxlength="120"></div><div class="field"><label>Firma / Verein (optional)</label><input name="firma" maxlength="120"></div></div>
      <div class="two"><div class="field"><label>E-Mail</label><input name="email" type="email" maxlength="160"></div><div class="field"><label>Telefon</label><input name="telefon" maxlength="40"></div></div>
      <div class="two"><div class="field"><label>Wie kam die Anfrage?</label><select name="quelle">${D.quellen.map((q) => `<option value="${q[0]}" ${q[0] === "telefon" ? "selected" : ""}>${esc(q[1])}</option>`).join("")}</select></div>
        <div class="field"><label>Empfohlen von (optional)</label><input name="empfohlen" maxlength="120"></div></div>
      <div class="field"><label>Worum geht es?</label><textarea name="nachricht" rows="3" maxlength="5000"></textarea></div>
      <div style="display:flex;gap:8px"><button class="btn btn-ink" type="submit">Anfrage anlegen</button><button class="tipbtn" type="button" id="bpa-nfx">Abbrechen</button></div></form>`;
  }

  // Produkt-Vorauswahl aus dem Leitfaden: Schnellauswahl zuerst, sonst Stichworte in den Notizen
  const STICH = [[/web\s*shop|online.?shop|\bshop\b/i, "shop-start"], [/newsletter/i, "newsletter"], [/google|maps|gefunden/i, "gefunden"], [/werbung|anzeige|\bads\b/i, "werbung"],
    [/instagram|facebook|social/i, "social"], [/fotograf|fotos vor ort|fotoshooting/i, "fotos"], [/\bki\b|chatbot|faq.?assistent/i, "ki"], [/calendly|buchungssystem|online.?buchung/i, "termin-a"], [/texte schreiben|wir schreiben/i, "texte"]];
  function vorschlagAusLeitfaden(lf) {
    const set = new Set();
    D.leitfaden.forEach(([k, , , w]) => { const v = lf[k] || {};
      if (w && v.wahl && v.wahl.length) v.wahl.forEach((o) => { const p = (w.opts.find((x) => x[0] === o) || [])[1]; if (p) set.add(p); });
      else if (v.text) STICH.forEach(([re, p]) => { if (re.test(v.text)) set.add(p); }); });
    if (set.has("editor") && [...set].some((p) => ["web-premium", "shop-start", "shop-premium"].includes(p))) set.delete("editor");   // Editor ist dort inklusive
    return set;
  }
  // Ausdrücklich abgewählt (z. B. „Kein Service-Plan“, „Nicht nötig“) → bisherige Auswahl nicht behalten
  function abgewaehlt(lf, p) {
    return D.leitfaden.some(([k, , , w]) => w && (lf[k] || {}).wahl && lf[k].wahl.length && w.opts.some((o) => o[1] === p) && !lf[k].wahl.some((o) => (w.opts.find((x) => x[0] === o) || [])[1] === p));
  }

  // ---------- Bausteine ----------
  // „weiter“-Knöpfe nur im aktuellen Schritt – ein erledigter Schritt setzt die Station nie zurück
  const nextBtn = (st, label, cls = "btn btn-ink") => (rStep !== curStep ? "" : `<button class="${cls}" type="button" data-bpanext="${st}">${label}</button>`);
  const mailBtn = (art, id = "", label = "Mail vorbereiten") => `<button class="tipbtn" type="button" data-bpamail="${art}" data-x="${id}">✉ ${label}</button>`;
  const ckItem = (a, key, label) => `<div><label class="small"><input type="checkbox" data-bpack="${key}" ${a.checkliste[key] ? "checked" : ""}> ${esc(label)}${a.checkliste[key] ? ` <span class="muted">(${dat(a.checkliste[key])})</span>` : ""}</label></div>`;
  const basisLabel = (k) => (D.check.basis.find((c) => c[0] === k) || [k, k])[1];
  function rechnungZeile(r, mailArt) {
    const ST = { entwurf: "Entwurf", offen: "offen", bezahlt: "bezahlt", storniert: "storniert" };
    const late = r.status === "offen" && r.faellig && r.faellig < D.today;
    return `<div style="border:1px solid var(--line,#ddd);border-radius:10px;padding:10px 12px;margin:8px 0">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${r.typ === "anzahlung" ? "Anzahlungsrechnung" : r.typ === "schluss" ? "Schlussrechnung" : "Rechnung"} <span class="mono">${esc(r.nr || "(Entwurf)")}</span></b>
        <span><b class="mono">${eur(r.summe_cents)}</b> · <span class="chip ${r.status === "bezahlt" ? "fin" : r.status === "offen" ? "open" : ""}">${ST[r.status] || r.status}</span>${r.status === "offen" ? ` <span class="small" ${late ? 'style="color:var(--red)"' : ""}>fällig ${dat(r.faellig)}</span>` : r.status === "bezahlt" ? ` <span class="small muted">am ${dat(r.bezahlt_am)}</span>` : ""}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
        ${r.status === "entwurf" ? `<button class="btn btn-ink" type="button" data-bpaissue="${r.id}">Ausstellen (bekommt Nummer)</button><button class="tipbtn" type="button" data-bpgo="rechnungen">Entwurf unter „Rechnungen“ ansehen/ändern</button>`
          : `<button class="tipbtn" type="button" data-bparshow="${r.id}">Ansehen / PDF</button><button class="tipbtn" type="button" data-bparlink="${r.id}">Kundenlink kopieren</button>
             ${r.status === "offen" ? `${mailBtn(late ? "erinnerung" : mailArt || "rechnung", r.id, late ? "Zahlungserinnerung" : "Rechnungs-Mail")}<button class="tipbtn" type="button" data-bpapay="${r.id}">Zahlung eingelangt …</button>` : ""}`}</div>
      ${payFor === r.id ? `<form data-bpapayform="${r.id}" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-top:8px">
        <div class="field" style="margin:0"><label>Gutschrift am Konto am</label><input type="date" name="bezahlt_am" value="${D.today}" required></div>
        <div class="field" style="margin:0"><label>Betrag (€)</label><input name="betrag" value="${(r.summe_cents / 100).toFixed(2).replace(".", ",")}" inputmode="decimal" style="width:120px"></div>
        <button class="btn btn-ink" type="submit">Als bezahlt buchen</button></form>` : ""}</div>`;
  }

  // ---------- Schritte im Detail ----------
  function step1(a) {
    return `${a.nachricht ? `<div style="white-space:pre-wrap;border-left:3px solid #D9820B;padding:8px 12px;margin:4px 0 10px;background:#faf7f0">${esc(a.nachricht)}</div>` : `<p class="small muted">Keine Nachricht.</p>`}
      <p class="small">${esc(quelleName(a.quelle))}${a.herkunft ? " · " + esc(herkunftName(a.herkunft)) : ""}${a.website ? ` · bisherige Website: <a href="${esc(/^https?:/.test(a.website) ? a.website : "https://" + a.website)}" target="_blank" rel="noopener">${esc(a.website)}</a>` : ""}${a.empfohlen ? ` · <b>empfohlen von ${esc(a.empfohlen)}</b> (Empfehlungsbonus nach Bezahlung)` : ""}${a.rueckruf ? " · <b>wünscht Rückruf</b>" : ""}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${a.email ? mailBtn("antwort", "", "Antwort-Mail vorbereiten") : ""}${a.telefon ? `<a class="tipbtn" href="tel:${esc(a.telefon.replace(/[^\d+]/g, ""))}">☎ Anrufen ${esc(a.telefon)}</a>` : ""}</div>
      <div style="margin-top:12px">${nextBtn("kontaktiert", "Kunde kontaktiert → weiter zu 2 Erstgespräch")}</div>`;
  }
  function step2(a) {
    const lf = a.leitfaden, lfDone = D.leitfaden.filter((l) => lf[l[0]] && lf[l[0]].ok).length;
    return `<div class="eyebrow" style="margin-top:4px">a · Termin</div>
      <form id="bpa-termin" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-top:6px">
        <div class="field" style="margin:0"><label>Datum</label><input type="date" name="d" value="${esc(a.next_at || "")}"></div>
        <div class="field" style="margin:0;width:100px"><label>Uhrzeit</label><input name="z" placeholder="15:00" maxlength="5"></div>
        <div class="field" style="margin:0"><label>Wie</label><select name="w"><option>Video</option><option>Telefon</option><option>vor Ort</option></select></div>
        <button class="btn btn-ink" type="submit">Termin speichern</button>${a.email ? mailBtn("termin", "", "Terminbestätigung") : ""}</form>
      <div class="eyebrow" style="margin-top:16px">b · Leitfaden fürs Gespräch · ${lfDone} von ${D.leitfaden.length}</div>
      <form id="bpa-lf" style="margin-top:4px">${D.leitfaden.map(([k, l, hint, w]) => `<div style="border-top:1px solid var(--line,#ddd);padding:7px 0">
        <label><input type="checkbox" name="ok_${k}" ${lf[k] && lf[k].ok ? "checked" : ""}> <b>${esc(l)}</b></label> <span class="small muted">${esc(hint)}</span>
        ${w ? `<div class="bpa-chips">${w.opts.map(([o]) => `<label><input type="${w.multi ? "checkbox" : "radio"}" name="w_${k}" value="${esc(o)}" ${lf[k] && (lf[k].wahl || []).includes(o) ? "checked" : ""}> ${esc(o)}</label>`).join("")}</div>` : ""}
        <textarea name="t_${k}" rows="1" maxlength="1000" style="width:100%;margin-top:4px" placeholder="Notiz">${esc(lf[k] ? lf[k].text : "")}</textarea></div>`).join("")}
        <button class="btn btn-ink" type="submit">Leitfaden speichern</button> <span class="small muted">Beim Speichern entsteht unten eine Produkt-Vorauswahl.</span></form>
      <div class="eyebrow" style="margin-top:16px">c · Was braucht der Kunde?</div>
      <form id="bpa-prod" style="margin-top:6px">
        ${prodVorschlag ? `<p class="note" style="margin:0 0 8px">Vorauswahl aus dem Leitfaden${prodVorschlag.neu.length ? `: <b>${prodVorschlag.neu.map(prodName).map(esc).join(", ")}</b> dazu` : " – keine neuen Produkte"}. Prüfen, anpassen, dann „Produkte speichern“.</p>` : ""}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px 12px">${D.produkte.map((p) => { const vs = prodVorschlag && prodVorschlag.set.has(p[0]), on = vs || (!prodVorschlag && a.produkte.includes(p[0])) || (prodVorschlag && prodVorschlag.behalten.has(p[0]));
          return `<label class="small" ${prodVorschlag && vs && !a.produkte.includes(p[0]) ? 'style="background:#FBEBD3;border-radius:6px;padding:0 4px"' : ""}><input type="checkbox" name="p" value="${p[0]}" ${on ? "checked" : ""}> ${esc(p[1])}</label>`; }).join("")}</div>
        <p class="small muted" style="margin:6px 0">Die Auswahl befüllt das Angebot in Schritt 3 (in Standard-Reihenfolge) und die Checklisten für den Bau.</p>
        <button class="btn btn-ink" type="submit">Produkte speichern</button></form>
      <div style="margin-top:14px">${nextBtn("gespraech", "Erstgespräch geführt → weiter zu 3 Angebot")}</div>`;
  }
  const AST = { entwurf: ["Entwurf", "open"], gesendet: ["Freigegeben", "run"], angenommen: ["Angenommen", "fin"], abgelaufen: ["Abgelaufen", ""], abgelehnt: ["Abgelehnt", ""], annahme: ["Wird angenommen …", "run"] };
  function step3(a) {
    if (!AN || anFor !== a.id) return `<p class="muted small">Lade …</p>`;
    const L = AN.list;
    return `${L.length ? `<div style="overflow-x:auto"><table class="grid small"><tr><th>Nr.</th><th>Status</th><th style="text-align:right">einmalig</th><th style="text-align:right">monatlich</th><th>gültig bis</th><th></th></tr>
        ${L.map((x) => `<tr><td class="mono">${esc(x.nr || "Entwurf")}</td><td><span class="chip ${AST[x.status][1]}">${AST[x.status][0]}</span>${x.annahme ? `<br><span class="muted">${dat(x.annahme.datum)} ${esc(x.annahme.zeit || "")} · ${esc(x.annahme.name)}</span>` : ""}</td>
          <td class="mono" style="text-align:right">${eur(x.summen.einmal)}</td><td class="mono" style="text-align:right">${x.summen.monat ? eur(x.summen.monat) : "–"}</td><td>${dat(x.gueltig_bis)}</td>
          <td style="white-space:nowrap">${["entwurf", "gesendet", "abgelaufen"].includes(x.status) ? `<button class="tipbtn" data-bpaaed="${x.id}">Bearbeiten</button> ` : ""}<button class="tipbtn" data-bpaavs="${x.id}">Vorschau</button>
            ${x.token ? ` <button class="tipbtn" data-bpacopy="${KLINK}angebot/${x.token}">Link kopieren</button>` : ""}${x.status === "gesendet" ? " " + mailBtn("angebot", x.id, "Angebots-Mail") : ""}
            ${["gesendet", "abgelaufen"].includes(x.status) ? ` <button class="tipbtn" data-bpaast="${x.id}:abgelehnt">Abgelehnt</button>` : ""}${x.status === "entwurf" ? ` <button class="tipbtn" data-bpaast="${x.id}:loeschen">Löschen</button>` : ""}</td></tr>`).join("")}</table></div>` : ""}
      ${edit ? editor(a, edit) : L.some((x) => x.status === "angenommen") ? "" : `<p style="margin-top:10px"><button class="btn btn-ink" type="button" id="bpa-anneu">${L.length ? "Weiteres Angebot" : "Angebot erstellen"}${a.produkte.length ? " (Positionen aus Schritt 2)" : ""}</button></p>`}
      ${L.some((x) => x.status === "angenommen") ? `<div style="margin-top:12px">${nextBtn("auftrag", "Angebot angenommen → weiter zu 4 Auftrag und Anzahlung")}</div>` : `<div style="margin-top:12px">${nextBtn("auftrag", "Kunde hat anders zugesagt (z. B. per Mail) → weiter zu 4", "tipbtn")}</div>`}
      <ol class="small" style="margin:10px 0 0 18px;line-height:1.6"><li>Angebot erstellen, Positionen prüfen, <b>Vorschau</b></li><li><b>Freigeben</b> – Nummer, Kundenlink, 30 Tage gültig</li><li><b>Angebots-Mail</b> vorbereiten und selbst senden</li><li>Kunde nimmt online an → Schritt 4 öffnet sich automatisch</li></ol>`;
  }
  function posEdit(p, i) {
    return `<div class="bpa-pos" data-i="${i}" style="border-top:1px solid var(--line,#ddd);padding:8px 0;display:grid;grid-template-columns:minmax(0,1fr) 70px 90px 100px;gap:6px;align-items:start">
      <div><input name="text" maxlength="200" value="${esc(p.text)}" placeholder="Leistung" style="width:100%;font-weight:600"><textarea name="detail" rows="2" maxlength="600" style="width:100%;margin-top:4px" placeholder="Beschreibung (optional)">${esc(p.detail || "")}</textarea>
        <div class="small" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:2px;align-items:center"><select name="art"><option value="einmal" ${p.art !== "monat" ? "selected" : ""}>einmalig</option><option value="monat" ${p.art === "monat" ? "selected" : ""}>monatlich</option></select>
        <label><input type="checkbox" name="opt" ${p.opt ? "checked" : ""}> Option (Kunde wählt selbst)</label><input type="hidden" name="key" value="${esc(p.key || "")}">
        <button type="button" class="tipbtn" data-bpapmv="${i}:-1" title="nach oben">↑</button><button type="button" class="tipbtn" data-bpapmv="${i}:1" title="nach unten">↓</button>
        <button type="button" class="tipbtn" data-bpapdel="${i}">entfernen</button></div></div>
      <div><label class="small">Menge</label><input name="menge" inputmode="decimal" value="${String(p.menge ?? 1).replace(".", ",")}" style="width:100%"></div>
      <div><label class="small">Einheit</label><input name="einheit" maxlength="20" value="${esc(p.einheit || "")}" style="width:100%"></div>
      <div><label class="small">Preis €</label><input name="preis" inputmode="decimal" value="${((p.preis_cents || 0) / 100).toFixed(2).replace(".", ",").replace(/,00$/, "")}" style="width:100%"></div></div>`;
  }
  function editor(a, x) {
    const k = x.kunde || {}, lang = x.sprache === "en" ? "en" : "de", groups = {};
    AN.vorlagen.forEach((v) => { const g = v.art === "monat" ? "Laufend (monatlich)" : (D.produkte.find((p) => p[0] === v.prod) || ["", "Sonstiges"])[1]; (groups[g] = groups[g] || []).push(v); });
    const f = (n, l, v, extra = "") => `<div class="field"><label>${l}</label><input name="${n}" value="${esc(v ?? "")}" ${extra}></div>`;
    return `<form id="bpa-ed" style="margin-top:12px;background:var(--paper,#faf7f0);padding:12px;border-radius:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><b>${x.nr ? esc(x.nr) : "Angebot (Entwurf)"}</b><span class="small">${x.status === "gesendet" ? "Schon freigegeben – Änderungen sieht der Kunde sofort." : ""}</span></div>
      <div class="eyebrow" style="margin-top:10px">1 · Kunde (ergänzt seine Daten bei der Annahme)</div>
      <div class="two"><div class="field"><label>Art</label><select name="k_art"><option value="b2b" ${k.art !== "b2c" ? "selected" : ""}>Unternehmer: Firma, Selbstständige, Verein mit Geschäftsbetrieb</option><option value="b2c" ${k.art === "b2c" ? "selected" : ""}>Verbraucher: Privatperson oder Verein ohne Geschäftsbetrieb (Widerrufsrecht)</option></select></div>${f("k_firma", "Firma / Verein", k.firma, 'maxlength="120"')}</div>
      <div class="two">${f("k_name", "Ansprechperson", k.name, 'maxlength="120"')}${f("k_email", "E-Mail", k.email, 'type="email" maxlength="160"')}</div>
      <div class="two">${f("k_strasse", "Straße und Hausnummer", k.strasse, 'maxlength="120"')}<div style="display:grid;grid-template-columns:100px 1fr;gap:8px">${f("k_plz", "PLZ", k.plz, 'maxlength="10"')}${f("k_ort", "Ort", k.ort, 'maxlength="100"')}</div></div>
      <div class="two">${f("k_land", "Land (Kürzel)", k.land || "AT", 'maxlength="2"')}${f("k_uid", "UID (optional)", k.uid, 'maxlength="20"')}</div>
      <div class="eyebrow" style="margin-top:10px">2 · Inhalt</div>
      <div class="two"><div class="field"><label>Sprache</label><select name="sprache"><option value="de" ${lang === "de" ? "selected" : ""}>Deutsch</option><option value="en" ${lang === "en" ? "selected" : ""}>Englisch</option></select></div>${f("titel", "Titel", x.titel, 'maxlength="160"')}</div>
      <div class="field"><label>Einleitung (leer = „Vielen Dank für das angenehme Gespräch …“)</label><textarea name="text_oben" rows="2" maxlength="2000">${esc(x.text_oben || "")}</textarea></div>
      <div class="eyebrow" style="margin-top:10px">3 · Positionen</div>
      <div id="bpa-poslist">${x.positionen.map(posEdit).join("") || `<p class="small muted">Noch keine Positionen – unten eine Vorlage wählen.</p>`}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">
        <select id="bpa-vl"><option value="">+ Position aus der Preisliste …</option>${Object.entries(groups).map(([g, vs]) => `<optgroup label="${esc(g)}">${vs.map((v) => `<option value="${v.key}">${esc(v.text.de)} – ${eur0(v.preis_cents)}${v.art === "monat" ? " / Monat" : ""}</option>`).join("")}</optgroup>`).join("")}</select>
        <button type="button" class="tipbtn" id="bpa-leer">+ freie Position</button></div>
      <p class="small" id="bpa-sum" style="font-weight:600;margin-top:8px"></p>
      <div class="eyebrow" style="margin-top:10px">4 · Bedingungen</div>
      <div class="two">${f("anzahlung_pct", "Anzahlung in % (Test: 0 = keine Rechnung)", x.anzahlung_pct ?? 50, 'inputmode="numeric"')}${f("gueltig_tage", "Gültig (Tage ab Freigabe)", x.gueltig_tage ?? 30, 'inputmode="numeric"')}</div>
      ${f("stripe_link", "Stripe-Zahlungslink für die Anzahlung (optional)", x.stripe_link, 'maxlength="300" placeholder="https://buy.stripe.com/…"')}
      <div class="field"><label>Schlusstext (optional)</label><textarea name="text_unten" rows="2" maxlength="2000">${esc(x.text_unten || "")}</textarea></div>
      ${errMsg ? `<p class="err" id="bpa-ederr" role="alert" style="margin:8px 0 0">${esc(errMsg)}</p>` : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><button class="tipbtn" type="submit" data-then="">Speichern</button><button class="tipbtn" type="submit" data-then="vorschau">Speichern + Vorschau</button>
        <button class="btn btn-ink" type="submit" data-then="frei">${x.status === "entwurf" ? "Speichern + freigeben" : "Speichern + Gültigkeit erneuern"}</button><button class="tipbtn" type="button" id="bpa-edx">Schließen</button></div></form>`;
  }
  function step4(a) {
    if (!AN || anFor !== a.id) return `<p class="muted small">Lade …</p>`;
    const x = AN.list.find((y) => y.status === "angenommen"), R = AN.rechnungen, K = AN.kunde;
    const anz = x && R.find((r) => r.id === x.rechnung_id);
    return `${x ? `<p><b>Angebot ${esc(x.nr)} angenommen</b> am ${dat(x.annahme.datum)} um ${esc(x.annahme.zeit || "")} von ${esc(x.annahme.name)} · ${eur(x.summen.einmal)} einmalig${x.summen.monat ? ` · ${eur(x.summen.monat)} monatlich` : ""}${x.annahme.fruehstart ? " · <b>vorzeitiger Beginn verlangt</b>" : x.kunde.art === "b2c" ? ' · <b style="color:var(--red)">Verbraucher: erst nach 14 Tagen Widerrufsfrist beginnen</b>' : ""}</p>`
        : `<p class="small">Noch kein angenommenes Angebot. Hat der Kunde anders zugesagt (z. B. per Mail), trotzdem weitermachen und die Anzahlungsrechnung unter „Rechnungen“ anlegen.</p>`}
      <div class="eyebrow" style="margin-top:12px">a · Kunde</div>
      ${K ? `<p class="small"><b>${esc(K.firma || K.name)}</b>${K.firma && K.name ? ", " + esc(K.name) : ""} · ${esc(K.strasse)}, ${esc(((K.plz || "") + " " + (K.ort || "")).trim() || K.plz_ort || "")} · ${esc(K.email || "")} <button class="tipbtn" type="button" data-bpkunde="${K.id}">In der Kundendatenbank öffnen</button></p>` : `<p class="small muted">Der Kunde wird bei der Online-Annahme automatisch in der Kundendatenbank angelegt.</p>`}
      <div class="eyebrow" style="margin-top:12px">b · Anzahlung</div>
      ${anz ? rechnungZeile(anz) : `<p class="small muted">${x && !x.rechnung_id ? "Ohne Anzahlung angenommen." : "Noch keine Anzahlungsrechnung."}</p>`}
      ${x ? `<div style="margin-top:8px">${mailBtn("bestaetigung", x.id, anz ? "Auftragsbestätigung mit Rechnungslink" : "Auftragsbestätigung")}</div>
      <p class="small" style="margin:6px 0 0"><b>Pflicht-Anhang (§ 7 FAGG):</b> <a href="${KLINK}angebot/${esc(x.token)}" target="_blank" rel="noopener">angenommenes Angebot öffnen</a> → Drucken → „Als PDF sichern“ → an die Mail hängen${x.kunde && x.kunde.art === "b2c" ? ` – dazu das <a href="${KLINK}widerruf" target="_blank" rel="noopener">Muster-Widerrufsformular</a> als PDF` : ""}. Erst danach mit der Arbeit beginnen.</p>` : ""}
      <div class="eyebrow" style="margin-top:14px">c · Auftragsformular und Anleitungen</div>
      ${formularBlock(a)}
      <div style="margin-top:10px">${["anzahlung", "formular", "zustimmungen"].map((k) => ckItem(a, "basis:" + k, basisLabel(k))).join("")}</div>
      <div style="margin-top:12px">${nextBtn("bau", "Anzahlung und Unterlagen da → weiter zu 5 Bau")}</div>`;
  }
  function formularBlock(a) {
    const F = a.formular || {}, link = KLINK + "formular/" + a.token, G = (AN && AN.anleitungen) || [];
    const st = F.eingereicht_at ? `<span class="chip fin">eingereicht ${dt(F.eingereicht_at)}</span>` : F.gespeichert_at ? `<span class="chip open">zwischengespeichert ${dt(F.gespeichert_at)}</span>` : `<span class="chip">noch nicht ausgefüllt</span>`;
    return `<p class="small" style="margin:6px 0">${st}</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${mailBtn("formular", "", "Formular-Mail mit Anleitungen")}<button class="tipbtn" type="button" data-bpacopy="${link}">Formular-Link kopieren</button>${F.gespeichert_at ? `<button class="tipbtn" type="button" id="bpa-fzeig">${zeigFormular ? "Antworten ausblenden" : "Antworten ansehen"}</button>` : ""}</div>
      ${zeigFormular && F.daten ? formularAntworten(F) : ""}
      ${G.length ? `<p class="small" style="margin:10px 0 4px"><b>Anleitungen für diesen Kunden</b> (stehen auch im Formular):</p>${G.map((g) => `<div class="small" style="display:flex;gap:8px;align-items:center;margin:3px 0">${esc(g.titel)} <button class="tipbtn" type="button" data-bpacopy="${KLINK}anleitung/${g.key}">Link</button></div>`).join("")}` : ""}`;
  }
  function formularAntworten(F) {
    const d = F.daten || {}, Z = F.zustimmungen || {};
    const val = (f) => { const v = d[f[0]]; return f[2] === "check" ? (v ? `✓ zugestimmt${Z[f[0]] ? " am " + dt(Z[f[0]].at) : ""}` : "–") : Array.isArray(v) ? v.join(", ") : v || "–"; };
    return `<div style="margin-top:10px;border:1px solid var(--line,#ddd);border-radius:10px;padding:10px 12px;background:#faf7f0">${(AN.formular_def || []).map((x) => `<div style="margin:8px 0"><b class="small" style="color:#9A5C06">${esc(x.t)}</b>
      <table class="grid small" style="margin-top:4px">${x.felder.map((f) => `<tr><td style="width:38%">${esc(f[1].replace(/\s*\(.*$/, "").slice(0, 70))}</td><td style="white-space:pre-wrap">${esc(val(f))}</td></tr>`).join("")}</table></div>`).join("")}</div>`;
  }
  function protokollBlock(a) {
    const U = a.uebergabe || {}, V = (AN && AN.uebergabe_vorlage) || { punkte: [], hinweise: "" }, punkte = U.punkte && U.punkte.length ? U.punkte : V.punkte;
    if (U.bestaetigt) return `<p><span class="chip fin">bestätigt</span> am ${dat(U.bestaetigt.datum)} um ${esc(U.bestaetigt.zeit)} von <b>${esc(U.bestaetigt.name)}</b> <button class="tipbtn" type="button" data-bpacopy="${KLINK}uebergabe/${a.token}">Link kopieren</button></p>`;
    return `${U.freigegeben_at ? `<p class="small"><span class="chip open">freigegeben, wartet auf Bestätigung</span> ${mailBtn("uebergabe", "", "Protokoll-Mail")} <button class="tipbtn" type="button" data-bpacopy="${KLINK}uebergabe/${a.token}">Link kopieren</button></p>` : ""}
      <form id="bpa-ueb" style="margin-top:6px">
        <div class="two"><div class="field"><label>Website-Adresse</label><input name="website" value="${esc(U.website || a.website || "")}" placeholder="www.beispiel.at"></div><div class="field"><label>Einschulung am</label><input type="date" name="einschulung" value="${esc(U.einschulung || "")}"></div></div>
        <div class="small" style="font-weight:600;margin:6px 0 2px">Übergeben und geprüft</div>
        ${punkte.map((p, i) => `<div style="display:flex;gap:8px;align-items:center;margin:3px 0"><input type="checkbox" name="pok_${i}" ${p.ok ? "checked" : ""}><input name="pt_${i}" value="${esc(p.t)}" style="flex:1;min-width:0"></div>`).join("")}
        <div style="display:flex;gap:8px;align-items:center;margin:3px 0"><input type="checkbox" name="pok_${punkte.length}" checked><input name="pt_${punkte.length}" placeholder="weiterer Punkt (optional)" style="flex:1;min-width:0"></div>
        <div class="field"><label>Offene Punkte (optional)</label><textarea name="offen" rows="2">${esc(U.offen || "")}</textarea></div>
        <div class="field"><label>Gut zu wissen (eine Zeile je Hinweis)</label><textarea name="hinweise" rows="4">${esc(U.hinweise ?? V.hinweise)}</textarea></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="tipbtn" type="submit" data-fr="0">Speichern</button><button class="btn btn-ink" type="submit" data-fr="1">${U.freigegeben_at ? "Speichern (Kunde sieht es sofort)" : "Speichern und zur Bestätigung freigeben"}</button></div></form>`;
  }
  function prodChecks(a, golive) {
    const groups = a.produkte.filter((p) => D.check[p]).map((p) => [p, prodName(p), D.check[p].filter(([k]) => GOLIVE.has(k) === golive)]).filter((g) => g[2].length);
    return groups.length ? groups.map(([g, gl, items]) => `<div style="margin-top:8px"><b class="small">${esc(gl)}</b>${items.map(([k, l]) => ckItem(a, g + ":" + k, l)).join("")}</div>`).join("") : `<p class="small muted">Keine Punkte – Produkte in Schritt 2 wählen.</p>`;
  }
  function step5(a) {
    return `${prodChecks(a, false)}
      <div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b class="small">Korrekturrunden:</b>
        <button class="tipbtn" data-bparunde="-1" type="button">−</button><b class="mono">${a.runden}</b><button class="tipbtn" data-bparunde="1" type="button">+</button>
        <span class="small ${a.runden > 2 ? "" : "muted"}" ${a.runden > 2 ? 'style="color:var(--red)"' : ""}>${a.runden > 2 ? "Mehr als 2 Runden: vorher ankündigen und mit 85 €/h verrechnen." : "2 Runden sind inklusive."}</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${mailBtn("vorschau", "", "Vorschau-Mail")}${a.status !== "korrektur" ? nextBtn("korrektur", "Korrekturen laufen", "tipbtn") : ""}${nextBtn("freischaltung", "Kunde hat freigegeben → weiter zu 6 Freischaltung")}</div>`;
  }
  function step6(a) {
    return `${prodChecks(a, true)}
      <div class="eyebrow" style="margin-top:14px">Übergabeprotokoll</div>
      ${protokollBlock(a)}
      <div style="margin-top:10px">${ckItem(a, "basis:uebergabe", basisLabel("uebergabe"))}</div>
      <div style="margin-top:12px">${nextBtn("schluss", "Übergeben → weiter zu 7 Schlussrechnung")}</div>`;
  }
  function step7(a) {
    if (!AN || anFor !== a.id) return `<p class="muted small">Lade …</p>`;
    const R = AN.rechnungen.filter((r) => r.typ === "schluss" && r.status !== "storniert"), x = AN.list.find((y) => y.status === "angenommen");
    const mon = x ? x.positionen.map((p, i) => [p, i]).filter(([p, i]) => p.art === "monat" && (!p.opt || (x.annahme.gewaehlt || []).includes(i))) : [];
    const hasAbo = (t) => AN.abos.some((b) => b.titel === t && b.aktiv);
    return `${R.length ? R.map((r) => rechnungZeile(r, "rechnung")).join("") : `<p>${x ? `<button class="btn btn-ink" type="button" id="bpa-schluss">Schlussrechnung aus Angebot ${esc(x.nr)} erstellen</button>` : ""}</p><p class="small muted">Übernimmt alle gewählten einmaligen Positionen und zieht die bezahlte Anzahlung ab. Entsteht als Entwurf – prüfen, dann „Ausstellen“.${x ? "" : " Ohne angenommenes Angebot: unter „Rechnungen“ anlegen."}</p>`}
      ${ckItem(a, "basis:schluss", basisLabel("schluss"))}${ckItem(a, "basis:bezahlt", basisLabel("bezahlt"))}
      ${mon.length ? `<div class="eyebrow" style="margin-top:14px">Laufende Leistungen aus dem Angebot</div>${mon.map(([p, i]) => `<div class="small" style="margin:4px 0">${esc(p.text)} – ${eur(p.cents)} / Monat ${hasAbo(p.text) ? `<span class="chip fin">Abo läuft</span>` : `<button class="tipbtn" type="button" data-bpaabo="${i}">Als Abo anlegen (ab nächstem Monat)</button>`}</div>`).join("")}` : ""}
      <div style="margin-top:12px">${nextBtn("abgeschlossen", "Bezahlt → weiter zu 8 Nachbetreuung")}</div>`;
  }
  function step8(a) {
    const p = a.produkte, bericht = p.includes("gefunden") || p.includes("werbung");
    return `<div style="display:flex;gap:8px;flex-wrap:wrap">${mailBtn("bewertung", "", "Bitte um Bewertung + Empfehlungsbonus")}${bericht ? mailBtn("bericht", "", "30-Tage-Bericht") : ""}</div>
      <div style="margin-top:10px">${ckItem(a, "basis:bewertung", basisLabel("bewertung"))}</div>
      ${a.empfohlen ? `<p class="note" style="margin-top:10px"><b>Empfohlen von ${esc(a.empfohlen)}:</b> Auftrag bezahlt → Empfehlungsbonus fällig (Gutschein laut Preisliste). Gutschein vorbereiten und schicken.</p>` : ""}
      ${bericht ? `<p class="small">Kurzbericht nach 30 Tagen (Gefunden werden / Werbung): rechts als nächsten Schritt mit Datum eintragen.</p>` : ""}
      <p class="small muted">Laufende Leistungen (Service, KI-Betrieb, Werbe-Betreuung) verrechnen sich über Brightpage → Abos.</p>`;
  }

  function sidebar(a) {
    const sumMin = a.zeiten.reduce((x, z) => x + z.min, 0);
    return `<div class="panel" style="margin:0 0 12px"><div class="eyebrow">Kontakt</div>
        ${kontaktEdit ? `<form id="bpa-kontakt" style="margin-top:6px">${[["name", "Name"], ["firma", "Firma / Verein"], ["email", "E-Mail"], ["telefon", "Telefon"], ["website", "Bisherige Website"], ["empfohlen", "Empfohlen von"]].map(([k, l]) => `<div class="field"><label>${l}</label><input name="${k}" value="${esc(a[k])}"></div>`).join("")}
          <div style="display:flex;gap:6px"><button class="btn btn-ink" type="submit">Speichern</button><button class="tipbtn" type="button" id="bpa-kx">Abbrechen</button></div></form>`
        : `<p style="margin:6px 0"><b>${esc(a.firma || a.name || "–")}</b>${a.firma && a.name ? "<br>" + esc(a.name) : ""}</p>
          <p class="small" style="margin:0;line-height:1.7">${a.email ? `✉ <a href="mailto:${esc(a.email)}">${esc(a.email)}</a><br>` : ""}${a.telefon ? `☎ <a href="tel:${esc(a.telefon.replace(/[^\d+]/g, ""))}">${esc(a.telefon)}</a><br>` : ""}${a.empfohlen ? `★ empfohlen von ${esc(a.empfohlen)}<br>` : ""}</p>
          <button class="tipbtn" type="button" id="bpa-ke" style="margin-top:6px">Bearbeiten</button>${a.kunde_id ? ` <button class="tipbtn" type="button" data-bpkunde="${a.kunde_id}">Kundendatenbank</button>` : ""}`}</div>
      <div class="panel" style="margin:0 0 12px"><div class="eyebrow">Nächster Schritt</div>
        <form id="bpa-next" style="margin-top:6px"><div class="field"><label>Was</label><input name="next_was" maxlength="200" value="${esc(a.next_was || "")}"></div>
          <div class="field"><label>Bis</label><input name="next_at" type="date" value="${esc(a.next_at || "")}"></div><button class="btn btn-ink" type="submit">Speichern</button></form></div>
      <div class="panel" style="margin:0 0 12px"><div class="eyebrow">Zeit · ${(sumMin / 60).toLocaleString("de-AT", { maximumFractionDigits: 1 })} Std.${a.wert_cents && sumMin ? ` · ${eur0(Math.round(a.wert_cents / (sumMin / 60)))}/Std.` : ""}</div>
        <form id="bpa-zeit" style="display:grid;grid-template-columns:1fr 70px;gap:6px;margin-top:6px">
          <input name="was" maxlength="120" placeholder="Tätigkeit"><input name="min" inputmode="numeric" placeholder="Min.">
          <input type="date" name="datum" value="${D.today}"><button class="btn btn-ink" type="submit">+</button></form>
        ${a.zeiten.length ? `<details style="margin-top:6px"><summary class="small">${a.zeiten.length} Einträge</summary><table class="grid small" style="margin-top:4px">${a.zeiten.map((z, i) => `<tr><td>${dat(z.datum)}</td><td class="mono">${z.min}′</td><td>${esc(z.was)}</td><td><button class="tipbtn" data-bpazdel="${i}" title="entfernen">×</button></td></tr>`).join("")}</table></details>` : ""}
        <p class="small muted" style="margin:6px 0 0">Ziel: über 85 € pro Stunde.</p></div>
      <div class="panel" style="margin:0 0 12px"><div class="eyebrow">Verlauf</div>
        <form id="bpa-notiz" style="display:flex;gap:6px;margin-top:6px"><input name="text" maxlength="2000" style="flex:1;min-width:0" placeholder="Notiz"><button class="btn btn-ink" type="submit">+</button></form>
        ${a.notizen.slice().reverse().slice(0, 12).map((n) => `<p class="small" style="margin:6px 0"><span class="mono muted">${dt(n.at)}</span><br>${n.sys ? `<i>${esc(n.text)}</i>` : esc(n.text)}</p>`).join("")}</div>
      <div class="panel" style="margin:0"><details><summary class="small">Station von Hand setzen, verloren, löschen</summary>
        <form id="bpa-st" style="margin-top:8px"><select name="status" style="width:100%">${D.stationen.map((s) => `<option value="${s[0]}" ${s[0] === a.status ? "selected" : ""}>${esc(s[1])}</option>`).join("")}</select>
          <button class="tipbtn" type="submit" style="margin-top:6px">Station setzen</button></form>
        <p style="margin-top:10px"><button class="tipbtn" id="bpa-del" type="button">Anfrage löschen (z. B. Spam)</button></p></details></div>`;
  }

  function detail(a) {
    const cur = a.status === "verloren" ? 0 : stepOf(a.status);
    const BODY = [null, step1, step2, step3, step4, step5, step6, step7, step8];
    const ok = AN && anFor === a.id;
    const sum = (n) => {
      if (n === 1) return a.status === "neu" ? "noch nicht beantwortet" : "beantwortet";
      if (n === 2) { const d = D.leitfaden.filter((l) => a.leitfaden[l[0]] && a.leitfaden[l[0]].ok).length; return `${a.produkte.length ? a.produkte.map(prodName).join(", ") : "Produkte offen"} · Leitfaden ${d}/${D.leitfaden.length}`; }
      if (n === 3 && ok) { const x = AN.list[0]; return x ? `${x.nr || "Entwurf"} · ${AST[x.status][0]} · ${eur(x.summen.einmal)}` : "noch kein Angebot"; }
      if (n === 4 && ok) { const x = AN.list.find((y) => y.status === "angenommen"), r = x && AN.rechnungen.find((y) => y.id === x.rechnung_id); return r ? `Anzahlung ${r.nr || ""} ${r.status}` : x ? "angenommen" : ""; }
      if (n === 5) return `Korrekturrunden ${a.runden}`;
      if (n === 7 && ok) { const r = AN.rechnungen.find((y) => y.typ === "schluss" && y.status !== "storniert"); return r ? `${r.nr || "Entwurf"} ${r.status}` : ""; }
      return "";
    };
    return `<div class="panel" style="padding-bottom:10px">
        <p style="margin:0 0 6px"><a href="#" id="bpa-back">← Alle Aufträge</a></p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:baseline"><h2 style="margin:4px 0">${esc(who(a))}</h2><span class="mono muted">${esc(a.nr)} · ${dt(a.created_at)}</span></div>
        ${a.status === "verloren" ? `<p class="err">Verloren${a.verloren_grund ? ": " + esc(a.verloren_grund) : ""}</p>` : `<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px;margin-top:10px">${STEPS.map(([n, t]) => `<div title="${esc(t)}" style="height:6px;border-radius:3px;background:${n < cur ? "#2F7D4F" : n === cur ? "#D9820B" : "var(--line,#ddd)"}"></div>`).join("")}</div>`}
      </div>
      <div class="bpa-grid">
        <div>${STEPS.map(([n, t]) => { const isOpen = (n === cur) !== aufSteps.has(n), done = n < cur; curStep = cur; rStep = n;
          return `<section class="panel" style="margin:0 0 10px;${n === cur ? "border-left:4px solid #D9820B" : ""}">
            <button type="button" data-bpastep="${n}" style="all:unset;cursor:pointer;display:flex;gap:12px;align-items:center;width:100%">
              <span style="flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:13px;${done ? "background:#2F7D4F;color:#fff" : n === cur ? "background:#D9820B;color:#15171C" : "background:var(--line,#e5e2db);color:#555"}">${done ? "✓" : n}</span>
              <span style="flex:1"><b>${esc(t)}</b><br><span class="small muted">${esc(sum(n))}</span></span><span class="small muted">${isOpen ? "▲" : "▼"}</span></button>
            ${isOpen ? `<div style="margin-top:12px">${BODY[n](a)}</div>` : ""}</section>`; }).join("")}</div>
        <aside>${sidebar(a)}</aside>
      </div>`;
  }

  // ---------- Zeichnen und Ereignisse ----------
  function readEditor(f) {
    const toC = (v) => { let x = String(v ?? "").replace(/\s|€/g, ""); if (/,\d{1,2}$/.test(x)) x = x.replace(/\./g, "").replace(",", "."); else if (/^-?\d{1,3}(\.\d{3})+$/.test(x)) x = x.replace(/\./g, ""); else x = x.replace(/,/g, ""); return Math.round(Number(x) * 100); };
    const positionen = [...f.querySelectorAll(".bpa-pos")].map((r) => ({ key: r.querySelector('[name="key"]').value, text: r.querySelector('[name="text"]').value, detail: r.querySelector('[name="detail"]').value,
      menge: r.querySelector('[name="menge"]').value, einheit: r.querySelector('[name="einheit"]').value, preis_cents: toC(r.querySelector('[name="preis"]').value),
      art: r.querySelector('[name="art"]').value, opt: r.querySelector('[name="opt"]').checked }));
    const g = (n) => f.querySelector(`[name="${n}"]`).value;
    return { id: edit.id, sprache: g("sprache"), titel: g("titel"), text_oben: g("text_oben"), text_unten: g("text_unten"), anzahlung_pct: g("anzahlung_pct"), gueltig_tage: g("gueltig_tage"), stripe_link: g("stripe_link"),
      kunde: { art: g("k_art"), firma: g("k_firma"), name: g("k_name"), email: g("k_email"), strasse: g("k_strasse"), plz: g("k_plz"), ort: g("k_ort"), land: g("k_land"), uid: g("k_uid") }, positionen };
  }
  function edSum(f) {
    let e = 0, m = 0, o = 0;
    readEditor(f).positionen.forEach((p) => { const c = Math.round((Number(String(p.menge).replace(",", ".")) || 0) * (p.preis_cents || 0)); if (p.opt) o += c; else if (p.art === "monat") m += c; else e += c; });
    const pct = Number(f.querySelector('[name="anzahlung_pct"]').value) || 0;
    f.querySelector("#bpa-sum").textContent = `Fix einmalig ${eur(e)} · Anzahlung ${eur(Math.round(e * pct / 100))}${m ? ` · monatlich ${eur(m)}` : ""}${o ? ` · Optionen zusätzlich ${eur(o)}` : ""}`;
  }
  function htmlFenster(html) {
    const w = window.open("", "_blank");
    if (!w) { errMsg = "Das Fenster wurde vom Browser blockiert – Pop-ups für den Admin erlauben."; paint(); return; }
    w.document.open(); w.document.write(html); w.document.close();
    const pb = w.document.getElementById("pr"); if (pb) pb.addEventListener("click", () => w.print());   // Drucken-Knopf ohne Inline-Skript (CSP)
  }
  function copy(text) { (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => { msg = "Link kopiert: " + text; errMsg = ""; paint(); }, () => prompt("Link kopieren:", text)); }

  function paint() {
    if (!el) return;
    const a = open && D.list.find((x) => x.id === open);
    if (open && !a) open = null;
    el.innerHTML = head() + (a ? detail(a) : listPanel()) + mailDialog();
    const $ = (s) => el.querySelector(s), $$ = (s) => el.querySelectorAll(s);
    bindMail();
    $$("[data-bpaopen]").forEach((x) => (x.onclick = (e) => { e.preventDefault(); openAuftrag(x.dataset.bpaopen); }));
    $$("[data-bpaf]").forEach((x) => (x.onclick = () => { filter = x.dataset.bpaf; paint(); }));
    const nb = $("#bpa-neu"); if (nb) nb.onclick = () => { neu = !neu; paint(); };
    const nfx = $("#bpa-nfx"); if (nfx) nfx.onclick = () => { neu = false; paint(); };
    const nf = $("#bpa-nf"); if (nf) nf.onsubmit = (e) => { e.preventDefault(); const b = Object.fromEntries(new FormData(nf)); act(async () => { const r = await api("POST", "auftrag/neu", b); neu = false; open = r.id; }, "Anfrage angelegt."); };
    if (!a) return;
    if (anFor !== a.id) { AN = null; edit = null; anFor = a.id; loadAN().then(paint, (e) => { errMsg = e.message; paint(); }); }
    $("#bpa-back").onclick = (e) => { e.preventDefault(); open = null; anFor = null; edit = null; aufSteps = new Set(); msg = errMsg = ""; paint(); };
    $$("[data-bpastep]").forEach((x) => (x.onclick = () => { const n = Number(x.dataset.bpastep); if (aufSteps.has(n)) aufSteps.delete(n); else aufSteps.add(n); paint(); }));
    $$("[data-bpanext]").forEach((x) => (x.onclick = () => { const st = x.dataset.bpanext;
      if (st === "bau") { const R = AN && AN.rechnungen.find((r) => r.typ === "anzahlung"); if (R && R.status !== "bezahlt" && !confirm("Die Anzahlung ist noch nicht als bezahlt gebucht. Trotzdem mit dem Bau beginnen?")) return; }
      aufSteps = new Set(); act(() => api("POST", "auftrag/status", { id: a.id, status: st }), "Weiter: " + stName(st)); }));
    $$("[data-bpamail]").forEach((x) => (x.onclick = () => { const art = x.dataset.bpamail, id = x.dataset.x;
      const base = AN && (AN.list.find((y) => y.status === "angenommen") || AN.list[0]);
      const ctx = (o) => (o ? { ...o, sprache: o.sprache || (base && base.sprache) || a.sprache, kunde: o.kunde || (base && base.kunde) || {} } : null);
      if (["rechnung", "erinnerung"].includes(art)) {
        const r = AN.rechnungen.find((y) => y.id === id);
        if (r && !r.token) { api("POST", "rechnung/link", { id }).then(loadAN).then(() => openMail(art, a, ctx(AN.rechnungen.find((y) => y.id === id))), (e) => { errMsg = e.message; paint(); }); return; }
        openMail(art, a, ctx(r)); return;
      }
      openMail(art, a, ctx(id ? AN.list.find((y) => y.id === id) : base)); }));
    $$("[data-bpkunde]").forEach((x) => (x.onclick = () => window.BPAdmin && BPAdmin.go("kunden", { kunde: x.dataset.bpkunde })));
    $$("[data-bpgo]").forEach((x) => (x.onclick = () => window.BPAdmin && BPAdmin.go(x.dataset.bpgo)));
    // Schritt 2
    const tf = $("#bpa-termin"); if (tf) tf.onsubmit = (e) => { e.preventDefault(); const d = tf.d.value, z = tf.z.value.trim(), w = tf.w.value;
      if (!d) { errMsg = "Bitte ein Datum wählen."; paint(); return; }
      act(async () => { await api("POST", "auftrag", { id: a.id, next_at: d, next_was: `Erstgespräch (${w}) ${dat(d)}${z ? " um " + z : ""}` }); await api("POST", "auftrag/notiz", { id: a.id, text: `Erstgespräch vereinbart: ${w}, ${dat(d)}${z ? " " + z : ""}` }); }, "Termin gespeichert."); };
    const lff = $("#bpa-lf"); if (lff) lff.onsubmit = (e) => { e.preventDefault(); const lf = {};
      D.leitfaden.forEach(([k]) => (lf[k] = { ok: lff["ok_" + k].checked, text: lff["t_" + k].value, wahl: [...lff.querySelectorAll(`[name="w_${k}"]:checked`)].map((x) => x.value) }));
      const set = vorschlagAusLeitfaden(lf);
      act(async () => { await api("POST", "auftrag", { id: a.id, leitfaden: lf }); prodVorschlag = { set, neu: [...set].filter((p) => !a.produkte.includes(p)), behalten: new Set(a.produkte.filter((p) => !abgewaehlt(lf, p))) }; },
        "Leitfaden gespeichert – Produkt-Vorauswahl unten prüfen."); };
    const pf = $("#bpa-prod"); if (pf) pf.onsubmit = (e) => { e.preventDefault(); prodVorschlag = null; act(() => api("POST", "auftrag", { id: a.id, produkte: [...pf.querySelectorAll('[name="p"]:checked')].map((x) => x.value) }), "Produkte gespeichert."); };
    // Schritt 3: Angebote
    const an = $("#bpa-anneu"); if (an) an.onclick = () => act(async () => { const r = await api("POST", "angebot", { auftrag_id: a.id }); await loadAN(); edit = AN.list.find((x) => x.id === r.id) || null; }, "Angebot angelegt – Positionen prüfen.");
    $$("[data-bpaaed]").forEach((x) => (x.onclick = () => { edit = AN.list.find((y) => y.id === x.dataset.bpaaed); paint(); }));
    $$("[data-bpaavs]").forEach((x) => (x.onclick = async () => { try { htmlFenster((await api("POST", "angebot/vorschau", { id: x.dataset.bpaavs })).html); } catch (e) { errMsg = e.message; paint(); } }));
    $$("[data-bpacopy]").forEach((x) => (x.onclick = () => copy(x.dataset.bpacopy)));
    $$("[data-bpaast]").forEach((x) => (x.onclick = () => { const [id, st] = x.dataset.bpaast.split(":"); if (st === "loeschen" && !confirm("Entwurf löschen?")) return;
      const grund = st === "abgelehnt" && !AN.list.some((y) => y.id !== id && ["gesendet", "angenommen", "annahme"].includes(y.status))
        ? prompt("Angebot abgelehnt. Auftrag auch auf „Verloren“ setzen? Dann kurz den Grund eintragen (leer lassen = Auftrag bleibt offen):", "") : null;
      act(async () => { await api("POST", "angebot/status", { id, status: st }); if (edit && edit.id === id) edit = null;
        if (grund && grund.trim()) await api("POST", "auftrag/status", { id: a.id, status: "verloren", grund: grund.trim() }); },
        st === "abgelehnt" ? (grund && grund.trim() ? "Abgelehnt – Auftrag auf „Verloren“ gesetzt." : "Als abgelehnt markiert.") : "Gelöscht."); }));
    const f = $("#bpa-ed");
    if (f) {
      // D-M1: Firma eingetragen → Art automatisch „Firma“ (sonst bekäme eine Firma die Verbraucher-Bedingungen)
      // Vereine ohne Geschäftsbetrieb sind Verbraucher (§ 1 KSchG) – „Verein“ im Namen und keine UID → Verbraucher vorschlagen (AGB-Prüfung 21.10.2026)
      const artAuto = () => { const fi = f.k_firma.value.trim(), uid = f.k_uid && f.k_uid.value.trim(); if (!fi) return; f.k_art.value = /verein/i.test(fi) && !uid ? "b2c" : "b2b"; };
      if (f.k_firma && f.k_art) { f.k_firma.addEventListener("input", artAuto); if (f.k_uid) f.k_uid.addEventListener("input", artAuto); if (artInit !== edit.id) { artInit = edit.id; if (edit.status === "entwurf" && !f.k_strasse.value.trim()) artAuto(); } }
      edSum(f); f.addEventListener("input", () => edSum(f)); f.addEventListener("change", () => edSum(f));
      $("#bpa-edx").onclick = () => { edit = null; paint(); };
      const keep = () => { edit = { ...edit, ...readEditor(f) }; edit.positionen = edit.positionen.map((p) => ({ ...p, cents: Math.round((Number(String(p.menge).replace(",", ".")) || 0) * p.preis_cents) })); };
      $("#bpa-vl").onchange = (e) => { const v = AN.vorlagen.find((y) => y.key === e.target.value); if (!v) return; keep(); const l = edit.sprache === "en" ? "en" : "de";
        // an der Standard-Stelle einfügen (z. B. „Zusätzliche Seite“ gleich nach Web Premium), sonst ans Ende
        const rang = (k) => { const i = AN.vorlagen.findIndex((y) => y.key === k); return i < 0 ? -1 : i; }, r = rang(v.key);
        let at = 0; edit.positionen.forEach((p, i) => { const pr = rang(p.key); if (pr >= 0 && pr <= r) at = i + 1; if (pr < 0 && at === i) at = i + 1; });
        edit.positionen.splice(at, 0, { key: v.key, text: v.text[l], detail: v.detail[l], menge: 1, einheit: v.einheit[l], preis_cents: v.preis_cents, art: v.art, opt: v.opt }); paint(); };
      $$("[data-bpapmv]").forEach((x) => (x.onclick = () => { keep(); const [i, d] = x.dataset.bpapmv.split(":").map(Number), j = i + d; if (j < 0 || j >= edit.positionen.length) return;
        [edit.positionen[i], edit.positionen[j]] = [edit.positionen[j], edit.positionen[i]]; paint(); }));
      $("#bpa-leer").onclick = () => { keep(); edit.positionen.push({ text: "", detail: "", menge: 1, einheit: "", preis_cents: 0, art: "einmal", opt: false }); paint(); };
      $$("[data-bpapdel]").forEach((x) => (x.onclick = () => { keep(); edit.positionen.splice(Number(x.dataset.bpapdel), 1); paint(); }));
      let then = "";
      f.querySelectorAll("button[type=submit]").forEach((b) => b.addEventListener("click", () => (then = b.dataset.then)));
      f.onsubmit = (e) => { e.preventDefault(); const body = readEditor(f), id = edit.id;
        if (then === "frei" && !confirm("Angebot freigeben? Es bekommt eine Nummer und einen Kundenlink (gültig ab heute). Die Mail schickst du danach selbst.")) return;
        act(async () => { await api("POST", "angebot", body);
          if (then === "vorschau") htmlFenster((await api("POST", "angebot/vorschau", { id })).html);
          if (then === "frei") { await api("POST", "angebot/freigeben", { id }); edit = null; } },
        then === "frei" ? "Freigegeben – jetzt „Angebots-Mail“ vorbereiten und selbst senden." : "Angebot gespeichert.").then(() => { const er = $("#bpa-ederr"); if (er) er.scrollIntoView({ block: "center", behavior: "smooth" }); }); };
    }
    // Rechnungen (Schritt 4 und 7)
    $$("[data-bparshow]").forEach((x) => (x.onclick = async () => { try { htmlFenster((await api("POST", "rechnung/html", { id: x.dataset.bparshow })).html); } catch (e) { errMsg = e.message; paint(); } }));
    $$("[data-bparlink]").forEach((x) => (x.onclick = async () => { try { const r = await api("POST", "rechnung/link", { id: x.dataset.bparlink }); await loadAN(); copy(KLINK + "rechnung/" + r.token); } catch (e) { errMsg = e.message; paint(); } }));
    $$("[data-bpapay]").forEach((x) => (x.onclick = () => { payFor = payFor === x.dataset.bpapay ? null : x.dataset.bpapay; paint(); }));
    $$("[data-bpapayform]").forEach((fm) => (fm.onsubmit = (e) => { e.preventDefault(); const id = fm.dataset.bpapayform, r = AN.rechnungen.find((y) => y.id === id);
      act(async () => { await api("POST", "rechnung/bezahlt", { id, bezahlt_am: fm.bezahlt_am.value, betrag: fm.betrag.value }); payFor = null;
        const key = r && r.typ === "anzahlung" ? "basis:anzahlung" : r && r.typ === "schluss" ? "basis:bezahlt" : ""; if (key) await api("POST", "auftrag", { id: a.id, checkliste: { [key]: true } }); }, "Als bezahlt gebucht – zählt jetzt zu den Einnahmen."); }));
    $$("[data-bpaissue]").forEach((x) => (x.onclick = () => { if (confirm("Rechnung jetzt ausstellen? Sie bekommt die nächste Nummer und lässt sich danach nicht mehr ändern."))
      act(async () => { await api("POST", "rechnung/ausstellen", { id: x.dataset.bpaissue }); await api("POST", "rechnung/link", { id: x.dataset.bpaissue });
        const r = AN.rechnungen.find((y) => y.id === x.dataset.bpaissue); if (r && r.typ === "schluss") await api("POST", "auftrag", { id: a.id, checkliste: { "basis:schluss": true } }); }, "Ausgestellt – jetzt „Rechnungs-Mail“ vorbereiten."); }));
    const fz = $("#bpa-fzeig"); if (fz) fz.onclick = () => { zeigFormular = !zeigFormular; paint(); };
    const uf = $("#bpa-ueb");
    if (uf) { let fr = "0"; uf.querySelectorAll("button[type=submit]").forEach((b) => b.addEventListener("click", () => (fr = b.dataset.fr)));
      uf.onsubmit = (e) => { e.preventDefault(); const punkte = []; for (let i = 0; uf["pt_" + i]; i++) punkte.push({ t: uf["pt_" + i].value, ok: uf["pok_" + i].checked });
        if (fr === "1" && !confirm("Protokoll zur Bestätigung freigeben? Danach „Protokoll-Mail“ vorbereiten und selbst senden.")) return;
        act(() => api("POST", "auftrag/uebergabe", { id: a.id, website: uf.website.value, einschulung: uf.einschulung.value, punkte, offen: uf.offen.value, hinweise: uf.hinweise.value, freigeben: fr === "1" }), fr === "1" ? "Freigegeben – jetzt „Protokoll-Mail“ vorbereiten." : "Protokoll gespeichert."); }; }
    const sb = $("#bpa-schluss"); if (sb) sb.onclick = () => act(() => api("POST", "auftrag/schluss", { auftrag_id: a.id }), "Schlussrechnung als Entwurf angelegt – prüfen und ausstellen.");
    $$("[data-bpaabo]").forEach((x) => (x.onclick = () => { const ang = AN.list.find((y) => y.status === "angenommen"), pos = ang && ang.positionen[Number(x.dataset.bpaabo)]; if (!pos) return; const titel = pos.text, cents = pos.cents; const d = new Date(D.today + "T12:00:00Z"); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1);
      act(() => api("POST", "abo", { kunde_id: a.kunde_id, titel, preis: (Number(cents) / 100).toFixed(2).replace(".", ","), rhythmus: "monat", start: d.toISOString().slice(0, 7) }), "Abo angelegt – Rechnungen entstehen unter Brightpage → Abos."); }));
    // Checkliste, Runden
    $$("[data-bpack]").forEach((x) => (x.onchange = () => act(() => api("POST", "auftrag", { id: a.id, checkliste: { [x.dataset.bpack]: x.checked } }), "")));
    $$("[data-bparunde]").forEach((x) => (x.onclick = () => act(() => api("POST", "auftrag", { id: a.id, runden: a.runden + Number(x.dataset.bparunde) }), "")));
    // Seitenleiste
    const ke = $("#bpa-ke"); if (ke) ke.onclick = () => { kontaktEdit = true; paint(); };
    const kx = $("#bpa-kx"); if (kx) kx.onclick = () => { kontaktEdit = false; paint(); };
    const kf = $("#bpa-kontakt"); if (kf) kf.onsubmit = (e) => { e.preventDefault(); act(async () => { await api("POST", "auftrag", { id: a.id, ...Object.fromEntries(new FormData(kf)) }); kontaktEdit = false; }, "Kontakt gespeichert."); };
    $("#bpa-next").onsubmit = (e) => { e.preventDefault(); const t = e.target; act(() => api("POST", "auftrag", { id: a.id, next_was: t.next_was.value, next_at: t.next_at.value }), "Nächster Schritt gespeichert."); };
    $("#bpa-zeit").onsubmit = (e) => { e.preventDefault(); act(() => api("POST", "auftrag/zeit", { id: a.id, ...Object.fromEntries(new FormData(e.target)) }), "Zeit eingetragen."); };
    $$("[data-bpazdel]").forEach((x) => (x.onclick = () => act(() => api("POST", "auftrag/zeit", { id: a.id, del: Number(x.dataset.bpazdel) }), "")));
    $("#bpa-notiz").onsubmit = (e) => { e.preventDefault(); act(() => api("POST", "auftrag/notiz", { id: a.id, text: e.target.text.value }), "Notiz gespeichert."); };
    $("#bpa-st").onsubmit = (e) => { e.preventDefault(); const st = e.target.status.value; let grund = "";
      if (st === "verloren") { grund = prompt("Warum verloren? (z. B. zu teuer, keine Antwort, anderer Anbieter)", ""); if (grund === null) return; }
      aufSteps = new Set(); act(() => api("POST", "auftrag/status", { id: a.id, status: st, grund }), "Station gesetzt."); };
    $("#bpa-del").onclick = () => { if (confirm("Anfrage wirklich löschen?")) act(async () => { await api("POST", "auftrag/loeschen", { id: a.id }); open = null; }, "Gelöscht."); };
  }
  function openAuftrag(id) { open = id; prodVorschlag = null; msg = errMsg = ""; kontaktEdit = false; payFor = null; aufSteps = new Set(); paint(); if (el) window.scrollTo(0, el.offsetTop); }

  const css = document.createElement("style");
  css.textContent = `.bpa-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:12px;align-items:start;margin-top:12px}.bpa-grid aside{position:sticky;top:10px}
    .bpa-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 2px}.bpa-chips label{display:flex;gap:6px;align-items:center;border:1px solid var(--line,#ccc);border-radius:999px;padding:4px 10px;font-size:13px;cursor:pointer;background:#fff}
    .bpa-chips label:has(input:checked){border-color:#D9820B;background:#FBEBD3}
    .bpa-grid aside input:not([type=checkbox]),.bpa-grid aside select{font:inherit;font-size:14px;padding:8px 10px;border:1px solid var(--line,#ccc);border-radius:8px;background:#fff;color:inherit;min-width:0;width:100%}
    .bpa-pos input,.bpa-pos textarea,.bpa-pos select{font:inherit;font-size:14px;padding:6px 8px;border:1px solid var(--line,#ccc);border-radius:6px;background:#fff;color:inherit;min-width:0}
    @media(max-width:900px){.bpa-grid{grid-template-columns:1fr}.bpa-grid aside{position:static}.bpa-pos{grid-template-columns:1fr 1fr 1fr!important}.bpa-pos>div:first-child{grid-column:1/-1}}`;
  document.head.appendChild(css);

  window.BPAuftraege = {
    async mount(target, headers, opts = {}) {
      el = target; H = headers;
      if (opts.open) { open = opts.open; anFor = null; aufSteps = new Set(); }
      if (D) paint(); else el.innerHTML = `<div class="panel"><p class="muted">Lade …</p></div>`;
      try { await reload(); } catch (e) { el.innerHTML = `<div class="panel"><p class="err">${esc(e.message)}</p></div>`; }
    },
    mailHtml, mailVorlage, openMail: (art, a, x) => openMail(art, a, x),
  };
})();
