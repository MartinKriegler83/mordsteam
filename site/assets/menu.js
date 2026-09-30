// Handy-Menü nach einem Klick auf einen Link schließen (wichtig bei Sprüngen innerhalb derselben Seite)
document.querySelectorAll("details.menu").forEach((m) => m.addEventListener("click", (e) => { if (e.target.closest("a")) m.open = false; }));
