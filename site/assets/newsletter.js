// Newsletter-Anmeldung: Formular → /api/shop/newsletter → Bestätigungsmail (Double-Opt-in)
(function () {
  const EN = document.documentElement.lang === "en";
  const T = (de, en) => (EN ? en : de);
  const form = document.getElementById("nlf"), err = document.getElementById("nlerr"), st = document.getElementById("nl-status");
  const t0 = Date.now();
  const s = new URLSearchParams(location.search).get("s");
  const MSG = {
    bestaetigt: T("<b>Danke, du bist angemeldet!</b> Ab jetzt erfährst du als Erste/r von neuen Fällen.", "<b>Thank you, you're signed up!</b> You'll be the first to hear about new cases."),
    abgemeldet: T("<b>Du bist abgemeldet.</b> Du bekommst keine Neuigkeiten mehr von uns.", "<b>You have unsubscribed.</b> You won't receive any more news from us."),
    ungueltig: T("Dieser Link ist ungültig oder abgelaufen. Melde dich einfach unten neu an.", "This link is invalid or has expired. Simply sign up again below."),
  };
  if (s && MSG[s]) { st.innerHTML = MSG[s]; st.hidden = false; if (s === "bestaetigt") form.hidden = true; }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    const email = form.email.value.trim();
    const show = (m, el) => { err.textContent = m; err.hidden = false; if (el) el.focus(); };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return show(T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid email address."), form.email);
    if (!form.consent.checked) return show(T("Bitte bestätige, dass du Neuigkeiten per E-Mail bekommen möchtest.", "Please confirm that you would like to receive news by email."), form.consent);
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
    try {
      const r = await fetch("/api/shop/newsletter", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, consent: true, website: form.website.value, t: t0, lang: EN ? "en" : "de", page: location.pathname }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || T("Das hat nicht geklappt.", "That didn't work."));
      form.hidden = true;
      st.innerHTML = T(`<b>Fast geschafft!</b> Wir haben dir eine Mail an ${email.replace(/[<>&"]/g, "")} geschickt. Bitte klicke dort auf „Anmeldung bestätigen“. Keine Mail da? Schau im Spam-Ordner nach.`,
        `<b>Almost done!</b> We've sent an email to ${email.replace(/[<>&"]/g, "")}. Please click “Confirm sign-up” in it. No email? Check your spam folder.`);
      st.hidden = false; st.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e2) { show(e2.message); btn.disabled = false; }
  });
})();
