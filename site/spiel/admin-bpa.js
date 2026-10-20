// Mordsteam-Admin, Tab „BP Aufträge“ (20.10.2026): Anfragen und Aufträge von Brightpage durch alle Stationen
// (Neu → Kontaktiert → Erstgespräch → Angebot → Auftrag → Bau → Korrekturen → Freischaltung → Übergabe → Schlussrechnung → Abgeschlossen/Verloren).
// Server: /api/bp/admin/auftraege, /api/bp/admin/auftrag/* (lib/bpauftrag.js). Formular-Anfragen kommen automatisch von brightpage.net.
(function () {
  const esc = (x) => MS.esc(String(x ?? ""));
  const eur = (c) => (c == null ? "–" : (c / 100).toLocaleString("de-AT", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " €");
  const dat = (ymd) => (ymd ? ymd.split("-").reverse().join(".") : "–");
  const dt = (ms) => new Date(ms).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  let el = null, H = null, D = null, open = null, filter = "offen", neu = false, msg = "", errMsg = "";
  let AN = null, anFor = null, edit = null;   // Angebote des geöffneten Auftrags, Angebot im Editor
  const KLINK = "https://brightpage.net/k/";

  async function api(method, path, body) {
    const r = await fetch("/api/bp/admin/" + path, { method, headers: { "content-type": "application/json", ...H() }, body: body ? JSON.stringify(body) : undefined });
    let d = {}; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d.error || "Fehler " + r.status);
    return d;
  }
  async function reload() { D = await api("GET", "auftraege"); if (open) await loadAN(); paint(); }
  async function loadAN() { AN = await api("GET", "angebote?auftrag=" + encodeURIComponent(open)); anFor = open; if (edit) edit = AN.list.find((x) => x.id === edit.id) || null; }
  async function act(fn, ok) { errMsg = ""; msg = ""; try { await fn(); msg = ok || ""; await reload(); } catch (e) { errMsg = e.message; paint(); } }
  const stName = (k) => (D.stationen.find((s) => s[0] === k) || [k, k])[1];
  const prodName = (k) => (D.produkte.find((p) => p[0] === k) || [k, k])[1];
  const quelleName = (k) => (D.quellen.find((q) => q[0] === k) || [k, k])[1];
  const who = (a) => a.firma ? `${a.firma}${a.name ? " · " + a.name : ""}` : a.name || "–";
  const chipCls = (st) => (st === "neu" ? "open" : st === "abgeschlossen" ? "fin" : st === "verloren" ? "" : "run");

  // Antwort-Mail (Martin schickt selbst aus office@brightpage.net – nichts geht automatisch an Kunden)
  function mailto(a) {
    const en = a.sprache === "en";
    const subj = en ? "Your enquiry at Brightpage" : "Ihre Anfrage bei Brightpage";
    const body = en
      ? `Hello ${a.name || ""},\n\nthank you for your enquiry! I'd be happy to talk through what you need in a short, free call (about 30 minutes, by phone or video). After that you'll get a fixed-price quote.\n\nWould one of these times suit you?\n- …\n- …\n\nExamples of our work: https://brightpage.net/en/#referenzen\nAll prices: https://brightpage.net/en/prices.html\n\nBest regards\nMartin Kriegler\nBrightpage – a service of Mordsteam e.U.\noffice@brightpage.net · brightpage.net`
      : `Guten Tag${a.name ? " " + a.name : ""},\n\nvielen Dank für Ihre Anfrage! Gerne bespreche ich mit Ihnen in einem kurzen, kostenlosen Gespräch (ca. 30 Minuten – telefonisch, per Video oder bei Ihnen vor Ort), was Sie brauchen. Danach bekommen Sie ein Angebot zum Fixpreis.\n\nPasst Ihnen einer dieser Termine?\n- …\n- …\n\nBeispiele unserer Arbeit: https://brightpage.net/#referenzen\nMusterseiten: https://brightpage.net/demo/salon/ · https://brightpage.net/demo/tischlerei/\nAlle Preise: https://brightpage.net/preise.html\n\nLiebe Grüße\nMartin Kriegler\nBrightpage – ein Angebot der Mordsteam e.U.\noffice@brightpage.net · brightpage.net`;
    return `mailto:${encodeURIComponent(a.email || "")}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  }

  function head() {
    const S = D.stats;
    return `<div class="panel"><div class="eyebrow">BP Aufträge · Anfragen und Aufträge von Brightpage</div>
      <div class="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:10px">
        <div><div class="small">Offen</div><b class="mono">${S.offen}</b></div>
        <div><div class="small">Neu, unbeantwortet</div><b class="mono" ${S.neu ? 'style="color:var(--red)"' : ""}>${S.neu}</b></div>
        <div><div class="small">Wert in Arbeit</div><b class="mono">${eur(S.pipeline_cents)}</b></div>
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
        <tr><th>Nr.</th><th>Eingang</th><th>Kunde</th><th>Produkte</th><th>Station</th><th>Nächster Schritt</th><th style="text-align:right">Wert</th></tr>
        ${L.map((a) => { const late = a.next_at && a.next_at < D.today; return `<tr style="cursor:pointer" data-bpaopen="${a.id}">
          <td class="mono">${esc(a.nr)}</td><td>${dt(a.created_at)}<br><span class="muted">${esc(quelleName(a.quelle))}</span></td>
          <td><b>${esc(who(a))}</b>${a.rueckruf ? ` <span class="chip open">Rückruf</span>` : ""}${a.empfohlen ? `<br><span class="muted">empfohlen von ${esc(a.empfohlen)}</span>` : ""}</td>
          <td>${a.produkte.map((p) => esc(prodName(p))).join(", ") || '<span class="muted">–</span>'}</td>
          <td><span class="chip ${chipCls(a.status)}">${esc(stName(a.status))}</span></td>
          <td ${late ? 'style="color:var(--red)"' : ""}>${a.next_at ? dat(a.next_at) + "<br>" : ""}<span class="${late ? "" : "muted"}">${esc(a.next_was || "")}</span></td>
          <td class="mono" style="text-align:right">${eur(a.wert_cents)}</td></tr>`; }).join("")}</table></div>`
        : `<p class="muted" style="margin-top:12px">Keine Einträge in dieser Ansicht.</p>`}
      <p class="small" style="margin-top:10px">Anfragen über das Formular auf brightpage.net erscheinen hier automatisch. Anrufe, Mails und persönliche Anfragen mit „Neue Anfrage erfassen“ eintragen. Mails an Kunden schickst du selbst aus office@brightpage.net – die Knöpfe öffnen dein Mailprogramm mit Vorlage.</p></div>`;
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

  function detail(a) {
    const prods = a.produkte, lf = a.leitfaden, ck = a.checkliste;
    const lfDone = D.leitfaden.filter((l) => lf[l[0]] && lf[l[0]].ok).length;
    const groups = [["basis", "Für jeden Auftrag"], ...prods.filter((p) => D.check[p]).map((p) => [p, prodName(p)])];
    const sumMin = a.zeiten.reduce((x, z) => x + z.min, 0);
    const stIdx = D.stationen.findIndex((s) => s[0] === a.status);
    return `<div class="panel">
      <p><a href="#" id="bpa-back">← Alle Anfragen</a></p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:baseline"><h2 style="margin:6px 0">${esc(who(a))}</h2><span class="mono muted">${esc(a.nr)} · ${dt(a.created_at)} · ${esc(quelleName(a.quelle))}${a.herkunft ? " (" + esc(a.herkunft) + ")" : ""}</span></div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin:10px 0">${D.stationen.filter((s) => s[0] !== "verloren").map((s, i) => `<span class="chip ${s[0] === a.status ? "run" : i < stIdx ? "fin" : ""}" style="opacity:${i <= stIdx || a.status === "verloren" ? 1 : .55}">${i + 1}. ${esc(s[1].split(" – ")[0])}</span>`).join("")}</div>
      <form id="bpa-st" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">
        <div class="field" style="margin:0"><label>Station</label><select name="status">${D.stationen.map((s) => `<option value="${s[0]}" ${s[0] === a.status ? "selected" : ""}>${esc(s[1])}</option>`).join("")}</select></div>
        <button class="btn btn-ink" type="submit">Station setzen</button>
        ${a.email ? `<a class="tipbtn" href="${mailto(a)}">Antwort-Mail öffnen</a>` : ""}${a.telefon ? `<a class="tipbtn" href="tel:${esc(a.telefon.replace(/[^\d+]/g, ""))}">Anrufen ${esc(a.telefon)}</a>` : ""}
      </form>
      <p class="small">Beim Wechsel der Station schlägt das System den nächsten Schritt mit Datum vor – unten anpassbar.</p>
    </div>

    <div class="panel"><div class="eyebrow">Nächster Schritt</div>
      <form id="bpa-next" class="two" style="align-items:end;margin-top:8px">
        <div class="field"><label>Was</label><input name="next_was" maxlength="200" value="${esc(a.next_was || "")}"></div>
        <div class="field"><label>Bis</label><input name="next_at" type="date" value="${esc(a.next_at || "")}"></div>
        <div><button class="btn btn-ink" type="submit">Speichern</button></div></form></div>

    <div class="panel"><div class="eyebrow">Anfrage und Kontakt</div>
      ${a.nachricht ? `<div style="white-space:pre-wrap;border-left:3px solid var(--red);padding:8px 12px;margin:10px 0;background:#faf7f0">${esc(a.nachricht)}</div>` : ""}
      <form id="bpa-kontakt" style="margin-top:8px">
        <div class="two"><div class="field"><label>Name</label><input name="name" value="${esc(a.name)}"></div><div class="field"><label>Firma / Verein</label><input name="firma" value="${esc(a.firma)}"></div></div>
        <div class="two"><div class="field"><label>E-Mail</label><input name="email" value="${esc(a.email)}"></div><div class="field"><label>Telefon</label><input name="telefon" value="${esc(a.telefon)}"></div></div>
        <div class="two"><div class="field"><label>Bisherige Website</label><input name="website" value="${esc(a.website)}"></div><div class="field"><label>Empfohlen von (Empfehlungsbonus)</label><input name="empfohlen" value="${esc(a.empfohlen)}"></div></div>
        <button class="btn btn-ink" type="submit">Kontakt speichern</button></form></div>

    <div class="panel"><div class="eyebrow">Produkte und Auftragswert</div>
      <form id="bpa-prod" style="margin-top:8px">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 12px">${D.produkte.map((p) => `<label class="small"><input type="checkbox" name="p" value="${p[0]}" ${prods.includes(p[0]) ? "checked" : ""}> ${esc(p[1])}</label>`).join("")}</div>
        <div class="two" style="align-items:end;margin-top:8px"><div class="field"><label>Auftragswert laut Angebot (€)</label><input name="wert" inputmode="decimal" value="${a.wert_cents != null ? String(a.wert_cents / 100).replace(".", ",") : ""}"></div>
        <div><button class="btn btn-ink" type="submit">Speichern</button></div></div></form></div>

    ${angebotPanel(a)}

    <div class="panel"><div class="eyebrow">Erstgespräch-Leitfaden · ${lfDone} von ${D.leitfaden.length}</div>
      <form id="bpa-lf" style="margin-top:8px">${D.leitfaden.map(([k, l, hint]) => `<div style="border-top:1px solid var(--line,#ddd);padding:8px 0">
        <label><input type="checkbox" name="ok_${k}" ${lf[k] && lf[k].ok ? "checked" : ""}> <b>${esc(l)}</b></label><div class="small muted">${esc(hint)}</div>
        <textarea name="t_${k}" rows="1" maxlength="1000" style="width:100%;margin-top:4px" placeholder="Notiz">${esc(lf[k] ? lf[k].text : "")}</textarea></div>`).join("")}
        <button class="btn btn-ink" type="submit">Leitfaden speichern</button></form></div>

    <div class="panel"><div class="eyebrow">Interne Checkliste</div>
      ${groups.map(([g, gl]) => `<div style="margin-top:10px"><b class="small">${esc(gl)}</b>${D.check[g].map(([k, l]) => { const key = g + ":" + k; return `<div><label class="small"><input type="checkbox" data-bpack="${key}" ${ck[key] ? "checked" : ""}> ${esc(l)}${ck[key] ? ` <span class="muted">(${dat(ck[key])})</span>` : ""}</label></div>`; }).join("")}</div>`).join("")}
      ${prods.length ? "" : `<p class="small muted">Produkte oben wählen – dann erscheinen die passenden Schritte.</p>`}
      <div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b class="small">Korrekturrunden:</b>
        <button class="tipbtn" data-bparunde="-1" type="button">−</button><b class="mono">${a.runden}</b><button class="tipbtn" data-bparunde="1" type="button">+</button>
        <span class="small ${a.runden > 2 ? "" : "muted"}" ${a.runden > 2 ? 'style="color:var(--red)"' : ""}>${a.runden > 2 ? "Mehr als 2 Runden: vorher ankündigen und mit 85 €/h verrechnen." : "2 Runden sind inklusive."}</span></div></div>

    <div class="panel"><div class="eyebrow">Zeiterfassung · ${(sumMin / 60).toLocaleString("de-AT", { maximumFractionDigits: 1 })} Std.${a.wert_cents && sumMin ? ` · ${eur(Math.round(a.wert_cents / (sumMin / 60)))} pro Std.` : ""}</div>
      <form id="bpa-zeit" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-top:8px">
        <div class="field" style="margin:0"><label>Datum</label><input type="date" name="datum" value="${D.today}"></div>
        <div class="field" style="margin:0;width:90px"><label>Minuten</label><input name="min" inputmode="numeric"></div>
        <div class="field" style="margin:0;flex:1;min-width:160px"><label>Tätigkeit</label><input name="was" maxlength="120" placeholder="z. B. Bau Startseite"></div>
        <button class="btn btn-ink" type="submit">Eintragen</button></form>
      ${a.zeiten.length ? `<table class="grid small" style="margin-top:8px">${a.zeiten.map((z, i) => `<tr><td>${dat(z.datum)}</td><td class="mono">${z.min} Min.</td><td>${esc(z.was)}</td><td><button class="tipbtn" data-bpazdel="${i}">entfernen</button></td></tr>`).join("")}</table>` : ""}
      <p class="small">Zeigt, ob der Fixpreis aufgeht (Ziel: über 85 € pro Stunde).</p></div>

    <div class="panel"><div class="eyebrow">Verlauf und Notizen</div>
      <form id="bpa-notiz" style="display:flex;gap:8px;margin-top:8px"><input name="text" maxlength="2000" style="flex:1" placeholder="z. B. Rückruf 21.10., Termin Do 15 Uhr vor Ort"><button class="btn btn-ink" type="submit">Notiz</button></form>
      ${a.notizen.slice().reverse().map((n) => `<p class="small" style="margin:6px 0"><span class="mono muted">${dt(n.at)}</span> ${n.sys ? `<i>${esc(n.text)}</i>` : esc(n.text)}</p>`).join("")}
      <p style="margin-top:14px"><button class="tipbtn" id="bpa-del" type="button">Anfrage löschen (z. B. Spam)</button></p></div>`;
  }

  // ---------- Angebote (Block 2) ----------
  const AST = { entwurf: ["Entwurf", "open"], gesendet: ["Freigegeben", "run"], angenommen: ["Angenommen", "fin"], abgelaufen: ["Abgelaufen", ""], abgelehnt: ["Abgelehnt", ""], annahme: ["Wird angenommen …", "run"] };
  const RTYP = { rechnung: "Rechnung", anzahlung: "Anzahlung", schluss: "Schlussrechnung", storno: "Storno" };
  const toC = (v) => { let x = String(v ?? "").replace(/\s|€/g, ""); if (/,\d{1,2}$/.test(x)) x = x.replace(/\./g, "").replace(",", "."); else if (/^-?\d{1,3}(\.\d{3})+$/.test(x)) x = x.replace(/\./g, ""); else x = x.replace(/,/g, ""); return Math.round(Number(x) * 100); };
  const cIn = (c) => (c / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");
  function angebotMail(a, x) {
    const en = x.sprache === "en", link = KLINK + "angebot/" + x.token, k = x.kunde || {};
    const subj = en ? `Your quote ${x.nr} from Brightpage` : `Ihr Angebot ${x.nr} von Brightpage`;
    const body = en
      ? `Hello ${k.name || a.name || ""},\n\nthank you again for our conversation! Here is your quote – you can view it and accept it online with one click:\n\n${link}\n\nIt is valid until ${dat(x.gueltig_bis)}. If anything should be different, just reply to this e-mail.\n\nBest regards\nMartin Kriegler\nBrightpage – a service of Mordsteam e.U.\noffice@brightpage.net · brightpage.net`
      : `Guten Tag${k.name || a.name ? " " + (k.name || a.name) : ""},\n\nvielen Dank nochmals für das Gespräch! Hier ist Ihr Angebot – Sie können es online ansehen und mit einem Klick annehmen:\n\n${link}\n\nEs gilt bis ${dat(x.gueltig_bis)}. Wenn etwas anders sein soll, antworten Sie einfach auf diese Mail.\n\nLiebe Grüße\nMartin Kriegler\nBrightpage – ein Angebot der Mordsteam e.U.\noffice@brightpage.net · brightpage.net`;
    return `mailto:${encodeURIComponent(k.email || a.email || "")}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  }
  function bestaetigungMail(a, x) {
    const en = x.sprache === "en", k = x.kunde || {}, r = AN.rechnungen.find((y) => y.id === x.rechnung_id);
    const rl = r && r.token ? KLINK + "rechnung/" + r.token : "";
    const subj = en ? `Order confirmation ${x.nr} – Brightpage` : `Auftragsbestätigung ${x.nr} – Brightpage`;
    const body = en
      ? `Hello ${k.name || ""},\n\nthank you for your order – we're looking forward to it!\n\nYour accepted quote: ${KLINK}angebot/${x.token}\n${rl ? `Advance invoice ${r.nr}: ${rl}\n(bank transfer or QR code in your banking app)\n` : ""}\nNext step: you'll shortly receive our order form for your texts, pictures and access details. We start as soon as the advance payment and your material have arrived.\n\nBest regards\nMartin Kriegler\nBrightpage – a service of Mordsteam e.U.`
      : `Guten Tag${k.name ? " " + k.name : ""},\n\nvielen Dank für Ihren Auftrag – wir freuen uns darauf!\n\nIhr angenommenes Angebot: ${KLINK}angebot/${x.token}\n${rl ? `Anzahlungsrechnung ${r.nr}: ${rl}\n(Überweisung oder QR-Code in der Banking-App)\n` : ""}\nNächster Schritt: Sie bekommen in Kürze unser Auftragsformular für Texte, Bilder und Zugänge. Wir beginnen, sobald Anzahlung und Unterlagen da sind.\n\nLiebe Grüße\nMartin Kriegler\nBrightpage – ein Angebot der Mordsteam e.U.`;
    return `mailto:${encodeURIComponent(k.email || "")}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  }
  function posEdit(p, i) {
    return `<div class="bpa-pos" data-i="${i}" style="border-top:1px solid var(--line,#ddd);padding:8px 0;display:grid;grid-template-columns:1fr 70px 80px 100px;gap:6px;align-items:start">
      <div><input name="text" maxlength="200" value="${esc(p.text)}" placeholder="Leistung" style="width:100%;font-weight:600"><textarea name="detail" rows="2" maxlength="600" style="width:100%;margin-top:4px" placeholder="Beschreibung (optional)">${esc(p.detail || "")}</textarea>
        <div class="small" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:2px"><label><select name="art"><option value="einmal" ${p.art !== "monat" ? "selected" : ""}>einmalig</option><option value="monat" ${p.art === "monat" ? "selected" : ""}>monatlich</option></select></label>
        <label><input type="checkbox" name="opt" ${p.opt ? "checked" : ""}> Option (Kunde wählt selbst)</label><input type="hidden" name="key" value="${esc(p.key || "")}">
        <button type="button" class="tipbtn" data-bpapdel="${i}">entfernen</button></div></div>
      <div><label class="small">Menge</label><input name="menge" inputmode="decimal" value="${String(p.menge ?? 1).replace(".", ",")}" style="width:100%"></div>
      <div><label class="small">Einheit</label><input name="einheit" maxlength="20" value="${esc(p.einheit || "")}" style="width:100%"></div>
      <div><label class="small">Preis €</label><input name="preis" inputmode="decimal" value="${cIn(p.preis_cents || 0)}" style="width:100%"></div></div>`;
  }
  function editor(a, x) {
    const k = x.kunde || {}, lang = x.sprache === "en" ? "en" : "de";
    const groups = {};
    AN.vorlagen.forEach((v) => { const g = v.art === "monat" ? "Laufend" : (D.produkte.find((p) => p[0] === v.prod) || ["", "Sonstiges"])[1]; (groups[g] = groups[g] || []).push(v); });
    return `<form id="bpa-ed" style="margin-top:12px;background:var(--paper,#faf7f0);padding:12px;border-radius:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><b>${x.nr ? esc(x.nr) : "Angebot (Entwurf)"} bearbeiten</b>
        <span class="small">${x.status === "gesendet" ? "Schon freigegeben – Änderungen sieht der Kunde sofort unter seinem Link." : ""}</span></div>
      <div class="two"><div class="field"><label>Sprache</label><select name="sprache"><option value="de" ${lang === "de" ? "selected" : ""}>Deutsch</option><option value="en" ${lang === "en" ? "selected" : ""}>Englisch</option></select></div>
        <div class="field"><label>Titel</label><input name="titel" maxlength="160" value="${esc(x.titel || "")}"></div></div>
      <div class="eyebrow" style="margin-top:8px">Kunde (Kunde prüft und ergänzt bei der Annahme)</div>
      <div class="two"><div class="field"><label>Art</label><select name="k_art"><option value="b2b" ${k.art !== "b2c" ? "selected" : ""}>Firma / Verein / Organisation</option><option value="b2c" ${k.art === "b2c" ? "selected" : ""}>Privatperson (mit Widerrufsrecht)</option></select></div>
        <div class="field"><label>Firma / Verein</label><input name="k_firma" maxlength="120" value="${esc(k.firma || "")}"></div></div>
      <div class="two"><div class="field"><label>Name / Ansprechperson</label><input name="k_name" maxlength="120" value="${esc(k.name || "")}"></div><div class="field"><label>E-Mail</label><input name="k_email" type="email" maxlength="160" value="${esc(k.email || "")}"></div></div>
      <div class="two"><div class="field"><label>Straße</label><input name="k_strasse" maxlength="120" value="${esc(k.strasse || "")}"></div><div class="field"><label>PLZ und Ort</label><input name="k_plz_ort" maxlength="120" value="${esc(k.plz_ort || "")}"></div></div>
      <div class="two"><div class="field"><label>Land (Kürzel)</label><input name="k_land" maxlength="2" value="${esc(k.land || "AT")}"></div><div class="field"><label>UID (optional)</label><input name="k_uid" maxlength="20" value="${esc(k.uid || "")}"></div></div>
      <div class="field"><label>Einleitung (leer = Standardtext „Vielen Dank für das angenehme Gespräch …“)</label><textarea name="text_oben" rows="2" maxlength="2000">${esc(x.text_oben || "")}</textarea></div>
      <div class="eyebrow" style="margin-top:8px">Positionen</div>
      <div id="bpa-poslist">${x.positionen.map(posEdit).join("") || `<p class="small muted">Noch keine Positionen – unten eine Vorlage wählen.</p>`}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">
        <select id="bpa-vl"><option value="">+ Vorlage hinzufügen …</option>${Object.entries(groups).map(([g, vs]) => `<optgroup label="${esc(g)}">${vs.map((v) => `<option value="${v.key}">${esc(v.text.de)} – ${eur(v.preis_cents)}${v.art === "monat" ? "/Monat" : ""}</option>`).join("")}</optgroup>`).join("")}</select>
        <button type="button" class="tipbtn" id="bpa-leer">+ leere Position</button>
        <span class="small" id="bpa-sum" style="margin-left:auto"></span></div>
      <div class="two" style="margin-top:10px"><div class="field"><label>Anzahlung in %</label><input name="anzahlung_pct" inputmode="numeric" value="${x.anzahlung_pct ?? 50}"></div>
        <div class="field"><label>Gültig (Tage ab Freigabe)</label><input name="gueltig_tage" inputmode="numeric" value="${x.gueltig_tage ?? 30}"></div></div>
      <div class="field"><label>Stripe-Zahlungslink für die Anzahlung (optional, https://buy.stripe.com/…)</label><input name="stripe_link" maxlength="300" value="${esc(x.stripe_link || "")}"></div>
      <div class="field"><label>Schlusstext (optional)</label><textarea name="text_unten" rows="2" maxlength="2000">${esc(x.text_unten || "")}</textarea></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ink" type="submit" data-then="">Speichern</button><button class="tipbtn" type="submit" data-then="vorschau">Speichern und Vorschau</button>
        <button class="tipbtn" type="submit" data-then="frei">${x.status === "entwurf" ? "Speichern und freigeben (Nummer + Kundenlink)" : "Speichern und Gültigkeit ab heute erneuern"}</button><button class="tipbtn" type="button" id="bpa-edx">Schließen</button></div></form>`;
  }
  function angebotPanel(a) {
    if (!AN || anFor !== a.id) return `<div class="panel"><div class="eyebrow">Angebote und Rechnungen</div><p class="muted small">Lade …</p></div>`;
    return `<div class="panel"><div class="eyebrow">Angebote und Rechnungen</div>
      ${AN.list.length ? `<div style="overflow-x:auto"><table class="grid small" style="margin-top:8px"><tr><th>Nr.</th><th>Status</th><th style="text-align:right">einmalig</th><th style="text-align:right">monatlich</th><th>gültig bis</th><th></th></tr>
        ${AN.list.map((x) => `<tr><td class="mono">${esc(x.nr || "Entwurf")}</td><td><span class="chip ${AST[x.status][1]}">${AST[x.status][0]}</span>${x.annahme ? `<br><span class="muted">${dat(x.annahme.datum)} ${esc(x.annahme.zeit || "")} · ${esc(x.annahme.name)}${x.annahme.fruehstart ? " · Frühstart" : ""}</span>` : ""}</td>
          <td class="mono" style="text-align:right">${eur(x.summen.einmal)}</td><td class="mono" style="text-align:right">${x.summen.monat ? eur(x.summen.monat) : "–"}</td><td>${dat(x.gueltig_bis)}</td>
          <td style="white-space:nowrap">${["entwurf", "gesendet", "abgelaufen"].includes(x.status) ? `<button class="tipbtn" data-bpaaed="${x.id}">Bearbeiten</button> ` : ""}<button class="tipbtn" data-bpaavs="${x.id}">Vorschau</button>
            ${x.token ? ` <button class="tipbtn" data-bpacopy="${KLINK}angebot/${x.token}">Link kopieren</button>` : ""}
            ${x.status === "gesendet" ? ` <a class="tipbtn" href="${angebotMail(a, x)}">Angebots-Mail öffnen</a>` : ""}
            ${x.status === "angenommen" ? ` <a class="tipbtn" href="${bestaetigungMail(a, x)}">Bestätigungs-Mail öffnen</a>` : ""}
            ${["gesendet", "abgelaufen"].includes(x.status) ? ` <button class="tipbtn" data-bpaast="${x.id}:abgelehnt">Abgelehnt</button>` : ""}${x.status === "entwurf" ? ` <button class="tipbtn" data-bpaast="${x.id}:loeschen">Löschen</button>` : ""}</td></tr>`).join("")}</table></div>`
        : `<p class="small muted" style="margin-top:6px">Noch kein Angebot.</p>`}
      ${edit ? editor(a, edit) : `<p style="margin-top:10px"><button class="btn btn-ink" type="button" id="bpa-anneu">Neues Angebot${a.produkte.length ? " (Positionen aus den Produkten)" : ""}</button></p>`}
      ${AN.rechnungen.length ? `<div class="eyebrow" style="margin-top:14px">Rechnungen dieses Kunden</div><table class="grid small" style="margin-top:6px">${AN.rechnungen.map((r) => `<tr><td class="mono">${esc(r.nr)}</td><td>${RTYP[r.typ] || r.typ}</td><td>${esc(r.status)}${r.status === "offen" && r.faellig ? ` · fällig ${dat(r.faellig)}` : ""}</td><td class="mono" style="text-align:right">${eur(r.summe_cents)}</td>
        <td><button class="tipbtn" data-bparlink="${r.id}">Kundenlink kopieren</button></td></tr>`).join("")}</table>` : ""}
      <p class="small" style="margin-top:8px">Ablauf: Entwurf → „freigeben“ (Nummer, Link, 30 Tage gültig) → Angebots-Mail selbst schicken → Kunde nimmt online an → Anzahlungsrechnung entsteht automatisch, Station springt auf „Auftrag“ → Bestätigungs-Mail schicken.</p></div>`;
  }
  function readEditor(f) {
    const positionen = [...f.querySelectorAll(".bpa-pos")].map((r) => ({ key: r.querySelector('[name="key"]').value, text: r.querySelector('[name="text"]').value, detail: r.querySelector('[name="detail"]').value,
      menge: r.querySelector('[name="menge"]').value, einheit: r.querySelector('[name="einheit"]').value, preis_cents: toC(r.querySelector('[name="preis"]').value),
      art: r.querySelector('[name="art"]').value, opt: r.querySelector('[name="opt"]').checked }));
    const g = (n) => f.querySelector(`[name="${n}"]`).value;
    return { id: edit.id, sprache: g("sprache"), titel: g("titel"), text_oben: g("text_oben"), text_unten: g("text_unten"), anzahlung_pct: g("anzahlung_pct"), gueltig_tage: g("gueltig_tage"), stripe_link: g("stripe_link"),
      kunde: { art: g("k_art"), firma: g("k_firma"), name: g("k_name"), email: g("k_email"), strasse: g("k_strasse"), plz_ort: g("k_plz_ort"), land: g("k_land"), uid: g("k_uid") }, positionen };
  }
  function edSum(f) {
    let e = 0, m = 0, o = 0;
    f.querySelectorAll(".bpa-pos").forEach((r) => { const c = Math.round((Number(r.querySelector('[name="menge"]').value.replace(",", ".")) || 0) * (toC(r.querySelector('[name="preis"]').value) || 0));
      if (r.querySelector('[name="opt"]').checked) o += c; else if (r.querySelector('[name="art"]').value === "monat") m += c; else e += c; });
    const pct = Number(f.querySelector('[name="anzahlung_pct"]').value) || 0;
    f.querySelector("#bpa-sum").textContent = `Fix einmalig ${eur(e)} · Anzahlung ${eur(Math.round(e * pct / 100))}${m ? ` · monatlich ${eur(m)}` : ""}${o ? ` · Optionen ${eur(o)}` : ""}`;
  }
  function vorschauOeffnen(html) {
    const w = window.open("", "_blank");
    if (!w) { errMsg = "Das Fenster wurde vom Browser blockiert – Pop-ups für den Admin erlauben."; paint(); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => { msg = "Link kopiert: " + text; errMsg = ""; paint(); }, () => prompt("Link kopieren:", text));
  }
  function bindAngebot(a) {
    const $ = (s) => el.querySelector(s), $$ = (s) => el.querySelectorAll(s);
    const nb = $("#bpa-anneu"); if (nb) nb.onclick = () => act(async () => { const r = await api("POST", "angebot", { auftrag_id: a.id }); await loadAN(); edit = AN.list.find((x) => x.id === r.id) || null; }, "Angebot angelegt – Positionen prüfen.");
    $$("[data-bpaaed]").forEach((x) => (x.onclick = () => { edit = AN.list.find((y) => y.id === x.dataset.bpaaed); paint(); }));
    $$("[data-bpaavs]").forEach((x) => (x.onclick = async () => { try { vorschauOeffnen((await api("POST", "angebot/vorschau", { id: x.dataset.bpaavs })).html); } catch (e) { errMsg = e.message; paint(); } }));
    $$("[data-bpacopy]").forEach((x) => (x.onclick = () => copy(x.dataset.bpacopy)));
    $$("[data-bparlink]").forEach((x) => (x.onclick = async () => { try { const r = await api("POST", "rechnung/link", { id: x.dataset.bparlink }); await loadAN(); copy(KLINK + "rechnung/" + r.token); } catch (e) { errMsg = e.message; paint(); } }));
    $$("[data-bpaast]").forEach((x) => (x.onclick = () => { const [id, st] = x.dataset.bpaast.split(":"); if (st === "loeschen" && !confirm("Entwurf löschen?")) return;
      act(async () => { await api("POST", "angebot/status", { id, status: st }); if (edit && edit.id === id) edit = null; }, st === "abgelehnt" ? "Als abgelehnt markiert." : "Gelöscht."); }));
    const f = $("#bpa-ed"); if (!f) return;
    edSum(f); f.addEventListener("input", () => edSum(f)); f.addEventListener("change", () => edSum(f));
    $("#bpa-edx").onclick = () => { edit = null; paint(); };
    const keep = () => { edit = { ...edit, ...readEditor(f) }; edit.positionen = edit.positionen.map((p) => ({ ...p, cents: Math.round((Number(String(p.menge).replace(",", ".")) || 0) * p.preis_cents) })); };
    $("#bpa-vl").onchange = (e) => { const v = AN.vorlagen.find((y) => y.key === e.target.value); if (!v) return; keep(); const l = edit.sprache === "en" ? "en" : "de";
      edit.positionen.push({ key: v.key, text: v.text[l], detail: v.detail[l], menge: 1, einheit: v.einheit[l], preis_cents: v.preis_cents, art: v.art, opt: v.opt }); paint(); };
    $("#bpa-leer").onclick = () => { keep(); edit.positionen.push({ text: "", detail: "", menge: 1, einheit: "", preis_cents: 0, art: "einmal", opt: false }); paint(); };
    $$("[data-bpapdel]").forEach((x) => (x.onclick = () => { keep(); edit.positionen.splice(Number(x.dataset.bpapdel), 1); paint(); }));
    let then = "";
    f.querySelectorAll("button[type=submit]").forEach((b) => b.addEventListener("click", () => (then = b.dataset.then)));
    f.onsubmit = (e) => { e.preventDefault(); const body = readEditor(f), id = edit.id;
      if (then === "frei" && !confirm("Angebot freigeben? Es bekommt eine Nummer und einen Kundenlink (gültig ab heute). Die Mail schickst du danach selbst.")) return;
      act(async () => { await api("POST", "angebot", body);
        if (then === "vorschau") vorschauOeffnen((await api("POST", "angebot/vorschau", { id })).html);
        if (then === "frei") { await api("POST", "angebot/freigeben", { id }); edit = null; } },
      then === "frei" ? "Freigegeben – jetzt „Angebots-Mail öffnen“ und selbst schicken." : "Angebot gespeichert."); };
  }

  function paint() {
    if (!el) return;
    const a = open && D.list.find((x) => x.id === open);
    if (open && !a) open = null;
    el.innerHTML = head() + (a ? detail(a) : listPanel());
    const $ = (s) => el.querySelector(s), $$ = (s) => el.querySelectorAll(s);
    $$("[data-bpaopen]").forEach((x) => (x.onclick = (e) => { e.preventDefault(); open = x.dataset.bpaopen; msg = errMsg = ""; paint(); window.scrollTo(0, el.offsetTop); }));
    $$("[data-bpaf]").forEach((x) => (x.onclick = () => { filter = x.dataset.bpaf; paint(); }));
    const nb = $("#bpa-neu"); if (nb) nb.onclick = () => { neu = !neu; paint(); };
    const nfx = $("#bpa-nfx"); if (nfx) nfx.onclick = () => { neu = false; paint(); };
    const nf = $("#bpa-nf"); if (nf) nf.onsubmit = (e) => { e.preventDefault(); const b = Object.fromEntries(new FormData(nf)); b.notiz = ""; act(async () => { const r = await api("POST", "auftrag/neu", b); neu = false; open = r.id; }, "Anfrage angelegt."); };
    if (!a) return;
    if (anFor !== a.id) { AN = null; edit = null; anFor = a.id; loadAN().then(paint, (e) => { errMsg = e.message; paint(); }); }
    bindAngebot(a);
    const back = $("#bpa-back"); if (back) back.onclick = (e) => { e.preventDefault(); open = null; anFor = null; edit = null; msg = errMsg = ""; paint(); };
    $("#bpa-st").onsubmit = (e) => { e.preventDefault(); const st = e.target.status.value; let grund = "";
      if (st === "verloren") { grund = prompt("Warum verloren? (z. B. zu teuer, keine Antwort, anderer Anbieter)", ""); if (grund === null) return; }
      act(() => api("POST", "auftrag/status", { id: a.id, status: st, grund }), "Station gesetzt."); };
    $("#bpa-next").onsubmit = (e) => { e.preventDefault(); const f = e.target; act(() => api("POST", "auftrag", { id: a.id, next_was: f.next_was.value, next_at: f.next_at.value }), "Nächster Schritt gespeichert."); };
    $("#bpa-kontakt").onsubmit = (e) => { e.preventDefault(); act(() => api("POST", "auftrag", { id: a.id, ...Object.fromEntries(new FormData(e.target)) }), "Kontakt gespeichert."); };
    $("#bpa-prod").onsubmit = (e) => { e.preventDefault(); const f = e.target; act(() => api("POST", "auftrag", { id: a.id, produkte: [...f.querySelectorAll('[name="p"]:checked')].map((x) => x.value), wert: f.wert.value }), "Produkte gespeichert."); };
    $("#bpa-lf").onsubmit = (e) => { e.preventDefault(); const f = e.target, lf = {};
      D.leitfaden.forEach(([k]) => (lf[k] = { ok: f["ok_" + k].checked, text: f["t_" + k].value }));
      act(() => api("POST", "auftrag", { id: a.id, leitfaden: lf }), "Leitfaden gespeichert."); };
    $$("[data-bpack]").forEach((x) => (x.onchange = () => act(() => api("POST", "auftrag", { id: a.id, checkliste: { [x.dataset.bpack]: x.checked } }), "")));
    $$("[data-bparunde]").forEach((x) => (x.onclick = () => act(() => api("POST", "auftrag", { id: a.id, runden: a.runden + Number(x.dataset.bparunde) }), "")));
    $("#bpa-zeit").onsubmit = (e) => { e.preventDefault(); act(() => api("POST", "auftrag/zeit", { id: a.id, ...Object.fromEntries(new FormData(e.target)) }), "Zeit eingetragen."); };
    $$("[data-bpazdel]").forEach((x) => (x.onclick = () => act(() => api("POST", "auftrag/zeit", { id: a.id, del: Number(x.dataset.bpazdel) }), "")));
    $("#bpa-notiz").onsubmit = (e) => { e.preventDefault(); act(() => api("POST", "auftrag/notiz", { id: a.id, text: e.target.text.value }), "Notiz gespeichert."); };
    $("#bpa-del").onclick = () => { if (confirm("Anfrage wirklich löschen?")) act(async () => { await api("POST", "auftrag/loeschen", { id: a.id }); open = null; }, "Gelöscht."); };
  }

  window.BPAuftraege = {
    async mount(target, headers) {
      el = target; H = headers;
      el.innerHTML = `<div class="panel"><p class="muted">Lade …</p></div>`;
      try { await reload(); } catch (e) { el.innerHTML = `<div class="panel"><p class="err">${esc(e.message)}</p></div>`; }
    },
  };
})();
