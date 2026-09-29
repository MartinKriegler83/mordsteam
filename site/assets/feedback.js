// Feedbackbogen nach dem Spiel (Link aus der Feedback-Mail: feedback.html?f=…)
// Early Bird: ausführlicher Bogen. Sonst: kurzer Bogen.
(function () {
  "use strict";
  const EN = document.documentElement.lang === "en";
  const T = (de, en) => (EN ? en : de);
  const root = document.getElementById("fb");
  const f = new URLSearchParams(location.search).get("f") || "";
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const msg = (h) => (root.innerHTML = h);

  const radios = (name, opts) => `<div class="fb-opts">${opts.map(([v, l]) => `<label class="fb-opt"><input type="radio" name="${name}" value="${v}"><span>${l}</span></label>`).join("")}</div>`;
  const q = (label, inner, hint) => `<div class="field fb-q"><span class="label">${label}</span>${hint ? `<span class="hint">${hint}</span>` : ""}${inner}</div>`;
  const text = (name, rows = 3) => `<textarea name="${name}" rows="${rows}" maxlength="1500"></textarea>`;

  function form(d) {
    const eb = d.variant === "eb";
    const stars = `<div class="fb-stars" role="radiogroup" aria-label="${T("Sterne", "Stars")}">${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="rating" value="${n}"><span aria-hidden="true">★</span><b class="sr">${n}</b></label>`).join("")}</div>`;
    const nps = `<div class="fb-nps">${[...Array(11)].map((_, n) => `<label><input type="radio" name="nps" value="${n}"><span>${n}</span></label>`).join("")}</div><div class="fb-npsl"><span>${T("unwahrscheinlich", "not likely")}</span><span>${T("sehr wahrscheinlich", "very likely")}</span></div>`;
    return `<form id="fbform" class="form">
      ${q(T("Wie hat euch der Fall insgesamt gefallen? *", "How did you like the case overall? *"), stars)}
      ${eb ? q(T("Wie wahrscheinlich empfehlt ihr Mordsteam weiter?", "How likely are you to recommend Mordsteam?"), nps) : ""}
      ${eb ? q(T("Wie schwer war der Fall?", "How hard was the case?"), radios("difficulty", [["leicht", T("zu leicht", "too easy")], ["passend", T("genau richtig", "just right")], ["schwer", T("zu schwer", "too hard")]])) : ""}
      ${eb ? q(T("Und die Spielzeit?", "And the playing time?"), radios("duration", [["kurz", T("zu kurz", "too short")], ["passend", T("passend", "about right")], ["lang", T("zu lang", "too long")]])) : ""}
      ${q(T("Was hat am meisten Spaß gemacht?", "What was the most fun?"), text("best"))}
      ${q(T("Was sollen wir besser machen?", "What should we improve?"), text("improve"))}
      ${eb && d.paket === "plus" ? q(T("Wie hat euch das Finale mit ARIA gefallen?", "How did you like the finale with ARIA?"), text("aria", 2)) : ""}
      ${eb ? q(T("Gab es technische Probleme?", "Were there any technical problems?"), text("tech", 2), T("Gerät, Browser, Firmen-Laptop …", "Device, browser, company laptop …")) : ""}
      ${eb ? q(T("Wie viele Personen haben mitgespielt?", "How many people played?"), `<input name="players" type="number" min="1" max="500" inputmode="numeric" style="max-width:140px">`) : ""}
      ${eb ? q(T("Würdet ihr wieder einen Mordsteam-Fall spielen?", "Would you play another Mordsteam case?"), radios("again", [["ja", T("ja", "yes")], ["vielleicht", T("vielleicht", "maybe")], ["nein", T("nein", "no")]])) : ""}
      <hr class="fb-hr">
      ${q(T("Eure Bewertung in 1–3 Sätzen", "Your review in 1–3 sentences"), text("review", 3), T("So, wie ihr es anderen erzählen würdet, die überlegen, Mordsteam zu buchen.", "The way you'd tell others who are thinking about booking Mordsteam."))}
      ${q(T("Dürfen wir eure Bewertung auf mordsteam.com zeigen?", "May we show your review on mordsteam.com?"),
        radios("publish", [["no", T("Nein, nur für euch", "No, just for you")], ["anon", T("Ja, anonym", "Yes, anonymously")], ["name", T("Ja, mit Namen", "Yes, with a name")]]) +
        `<input name="publish_name" id="pubname" maxlength="80" placeholder="${T("z. B. Julia B., Muster GmbH", "e.g. Julia B., Example Ltd")}" hidden style="margin-top:10px">`)}
      ${eb ? q(T("Dürfen wir euch für ein kurzes Gespräch (10 Minuten) kontaktieren?", "May we contact you for a short call (10 minutes)?"), radios("call", [["ja", T("ja, gerne", "yes, happy to")], ["nein", T("lieber nicht", "rather not")]])) : ""}
      <p class="formerr" id="fberr" role="alert" hidden></p>
      <div><button class="btn btn-red" type="submit">${T("Feedback senden", "Send feedback")}</button></div>
    </form>`;
  }

  async function init() {
    if (!f) return msg(`<p class="lead">${T("Der Link ist unvollständig.", "The link is incomplete.")}</p>`);
    let d;
    try { const r = await fetch("/api/shop/feedback?f=" + encodeURIComponent(f)); d = await r.json(); if (!r.ok) throw new Error(d.error); }
    catch (e) { return msg(`<p class="lead">${T("Dieser Feedback-Link ist ungültig. Schreibt uns gerne direkt an", "This feedback link is invalid. Feel free to write to us at")} <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>.</p>`); }
    if (d.done) return msg(`<h2>${T("Schon erledigt – danke!", "Already done – thank you!")}</h2><p class="lead">${T("Euer Feedback ist bei uns angekommen.", "Your feedback has reached us.")}</p>`);
    document.getElementById("fbintro").textContent = d.variant === "eb"
      ? T(`Danke, dass ihr als Early Bird dabei wart${d.firma ? " – " + d.firma : ""}! Das dauert rund 5 Minuten.`, `Thanks for joining as an early bird${d.firma ? " – " + d.firma : ""}! This takes about 5 minutes.`)
      : T("Das dauert rund 2 Minuten. Nur die Sterne sind Pflicht.", "This takes about 2 minutes. Only the stars are required.");
    msg(form(d));
    const fm = document.getElementById("fbform");
    fm.addEventListener("change", () => { document.getElementById("pubname").hidden = (fm.publish.value !== "name"); });
    fm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const err = document.getElementById("fberr");
      const data = { f, lang: EN ? "en" : "de" };
      for (const el of fm.elements) {
        if (!el.name) continue;
        if (el.type === "radio") { if (el.checked) data[el.name] = el.value; }
        else data[el.name] = el.value;
      }
      if (!data.rating) { err.textContent = T("Bitte eine Sternebewertung wählen.", "Please choose a star rating."); err.hidden = false; return; }
      if (data.publish === "name" && !String(data.publish_name || "").trim()) { err.textContent = T("Bitte den Namen angeben, unter dem wir die Bewertung zeigen dürfen.", "Please enter the name we may show with the review."); err.hidden = false; return; }
      const btn = fm.querySelector("button[type=submit]"); btn.disabled = true;
      try {
        const r = await fetch("/api/shop/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
        const x = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(x.error || "Error");
        document.getElementById("fbintro").textContent = "";
        msg(`<h2>${T("Danke! Euer Feedback ist angekommen.", "Thank you! Your feedback has arrived.")}</h2><p class="lead">${T("Es hilft uns wirklich weiter. Bis zum nächsten Fall!", "It really helps us. See you at the next case!")}</p><p><a class="btn btn-ink" href="${EN ? "index.html" : "index.html"}">${T("Zur Startseite", "To the home page")}</a></p>`);
      } catch (e) { err.textContent = e.message; err.hidden = false; btn.disabled = false; }
    });
  }
  init();
})();
