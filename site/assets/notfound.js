// 404-Seite: auf englischen Adressen (/en/…) Englisch zuerst (inline-Skripte verbietet die CSP).
if(/^\/en(\/|$)/.test(location.pathname)){document.documentElement.lang="en";document.title="Page not found – Mordsteam";var m=document.querySelector(".nf");m.insertBefore(m.querySelector(".nf-en"),m.firstChild);}
