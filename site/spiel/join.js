(function () {
  const f = document.getElementById("join");
  const msg = document.getElementById("msg");
  const code = MS.qs("code");
  if (code) document.getElementById("code").value = code.toUpperCase();
  if (MS.get("ms_team")) {
    const p = document.createElement("p");
    p.className = "small";
    p.innerHTML = 'Dieses Gerät ist schon angemeldet. <a href="/spiel/fall.html">Zurück zu eurer Fallakte</a>';
    f.after(p);
  }
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    const btn = f.querySelector("button");
    btn.disabled = true;
    try {
      const d = await MS.api("POST", "join", { code: f.code.value, name: f.name.value });
      MS.set("ms_team", d.token);
      ["ms_seen", "ms_heard", "ms_tab", "ms_doc"].forEach(MS.del);
      location.href = "/spiel/fall.html";
    } catch (err) {
      msg.textContent = err.message;
      btn.disabled = false;
    }
  });
})();
