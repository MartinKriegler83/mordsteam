// Rückblende-Player (10.10.2026): spielt die animierten Szenen einer Auflösung ab – 16:9-Bühne, Untertitel,
// Musik (m4a) und Geräusche (im Browser erzeugt, keine Dateien). Überspringen jederzeit, Ton abschaltbar.
// Aufruf: window.Rueckblende.play({ music, scenes }, { en, onEnd })
(function () {
  const CSS = `
.rb-ov{position:fixed;inset:0;z-index:9999;background:#07080B;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px}
.rb-stage{position:relative;width:min(100%,calc((100vh - 150px)*16/9));aspect-ratio:16/9;background:#101830;overflow:hidden;border:2px solid #2A2E3A;border-radius:6px}
.rb-stage svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.rb-scene{position:absolute;inset:0;animation:rbIn .6s ease both}
.rb-scene.out{animation:rbOut .5s ease both}
.rb-sub{min-height:3.2em;max-width:min(100%,900px);margin:14px auto 0;color:#F1EADB;font:500 clamp(15px,2.4vw,20px)/1.4 'IBM Plex Sans',system-ui,sans-serif;text-align:center;padding:0 8px}
.rb-bar{display:flex;gap:10px;align-items:center;margin-top:10px;width:min(100%,900px)}
.rb-prog{flex:1;height:4px;background:#2A2E3A;border-radius:2px;overflow:hidden}.rb-prog i{display:block;height:100%;width:0;background:#C8342A}
.rb-btn{background:transparent;color:#F1EADB;border:1.5px solid #5E5A52;border-radius:4px;padding:8px 14px;font:600 14px 'IBM Plex Sans',system-ui,sans-serif;cursor:pointer}
.rb-btn:hover{border-color:#F1EADB}
@keyframes rbIn{from{opacity:0}to{opacity:1}} @keyframes rbOut{to{opacity:0}}
.rb-fadein{opacity:0;animation:rbIn .8s ease forwards;animation-delay:var(--d,0s)}
.rb-pan-slow{animation:rbPan 6s linear both} @keyframes rbPan{to{transform:translateX(-30px)}}
.rb-train{animation:rbTrain 5s linear both} @keyframes rbTrain{from{transform:translateX(60px)}to{transform:translateX(-20px)}}
.rb-glow{animation:rbGlow 1.2s ease-in-out .8s infinite alternate} @keyframes rbGlow{from{opacity:.4}to{opacity:1}}
.rb-twinkle{animation:rbTw 2.4s ease-in-out infinite alternate;animation-delay:var(--d,0s)} @keyframes rbTw{to{opacity:.25}}
.rb-streak{animation:rbStreak 1.1s linear infinite;animation-delay:var(--d,0s)} @keyframes rbStreak{from{transform:translateX(30px);opacity:0}50%{opacity:1}to{transform:translateX(-30px);opacity:0}}
.rb-walk{animation:rbWalk 1.4s ease-out both} @keyframes rbWalk{from{transform:translateX(-260px)}to{transform:none}}
.rb-door{transform-box:fill-box;transform-origin:right center;animation:rbDoor 1.2s ease 3s forwards} @keyframes rbDoor{to{transform:scaleX(.78)}}
.rb-light{opacity:0;animation:rbLight 1.2s ease 3.1s forwards} @keyframes rbLight{to{opacity:.32}}
.rb-pop{opacity:0;transform-box:fill-box;transform-origin:center;animation:rbPop .5s ease forwards;animation-delay:var(--d,0s)} @keyframes rbPop{0%{opacity:0;transform:scale(.4)}40%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1)}}
.rb-nod{transform-box:fill-box;transform-origin:center bottom;animation:rbNod 1.6s ease .6s forwards} @keyframes rbNod{to{transform:rotate(9deg) translateY(4px)}}
.rb-pill{opacity:0;animation:rbPill .7s ease-in forwards;animation-delay:var(--d,0s)} @keyframes rbPill{0%{opacity:1;transform:translateY(-40px)}90%{opacity:1}100%{opacity:0;transform:translateY(95px)}}
.rb-roll{animation:rbRoll 1.6s ease-out .9s both} @keyframes rbRoll{from{transform:translate(-200px,-30px) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}
.rb-flash{opacity:0;animation:rbFlash .5s ease-out forwards;animation-delay:var(--d,0s)} @keyframes rbFlash{0%{opacity:0}15%{opacity:.75}100%{opacity:0}}
.rb-draw{stroke-dasharray:100;stroke-dashoffset:100;animation:rbDraw 2.4s ease-in-out .5s forwards} @keyframes rbDraw{to{stroke-dashoffset:0}}
.rb-pulse{transform-box:fill-box;transform-origin:center;opacity:.25;animation:rbPulse 1s ease-in-out infinite alternate} @keyframes rbPulse{to{transform:scale(1.8);opacity:.05}}
.rb-slideup{opacity:0;animation:rbUp .7s ease-out forwards;animation-delay:var(--d,0s)} @keyframes rbUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
.rb-slidein{opacity:0;animation:rbSi .8s ease-out forwards;animation-delay:var(--d,0s)} @keyframes rbSi{from{opacity:0;transform:translateX(120px)}to{opacity:1;transform:none}}
.rb-stamp{opacity:0;transform-box:fill-box;transform-origin:center;animation:rbStamp .35s cubic-bezier(.2,.8,.3,1.2) forwards;animation-delay:var(--d,0s)} @keyframes rbStamp{from{opacity:0;transform:scale(2.4)}to{opacity:1;transform:scale(1)}}
.rb-curtL{animation:rbCL 1.4s ease-in-out 4.6s forwards} @keyframes rbCL{to{transform:translateX(330px)}}
.rb-curtR{animation:rbCR 1.4s ease-in-out 4.6s forwards} @keyframes rbCR{to{transform:translateX(-330px)}}
.rb-pop2{opacity:0;transform-box:fill-box;transform-origin:center;animation:rbPop2 .35s ease forwards;animation-delay:var(--d,0s)} @keyframes rbPop2{from{opacity:0;transform:scale(1.8)}to{opacity:1;transform:none}}
.rb-burst{opacity:0;animation:rbBurst 1.6s ease-out infinite;animation-delay:var(--d,0s)} @keyframes rbBurst{0%{opacity:0;transform:scale(.1)}15%{opacity:1}70%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.12)}}
.rb-sneak{animation:rbSneak 3s ease-in 2.6s forwards} @keyframes rbSneak{to{transform:translateX(160px);opacity:0}}
.rb-fan{animation:rbFan .25s linear 7,rbFan 1.6s ease-out 1.75s 1 forwards} @keyframes rbFan{to{transform:rotate(360deg)}}
.rb-switch{animation:rbSw .2s ease 2s forwards} @keyframes rbSw{to{transform:translateY(24px);fill:#C8342A}}
.rb-flame{transform-box:fill-box;transform-origin:center bottom;animation:rbFl .3s ease-in-out 8 alternate,rbOutF .6s ease 3.2s forwards} @keyframes rbFl{to{transform:scale(.85,1.12)}} @keyframes rbOutF{to{transform:scale(0);opacity:0}}
.rb-gas{opacity:0;animation:rbGas 6s ease-in forwards} @keyframes rbGas{to{opacity:.2}}
.rb-co2{animation:rbBlink .6s steps(2) infinite}
@keyframes rbBlink{50%{opacity:.2}}
.rb-into{animation:rbInto 1.3s ease-in-out forwards;animation-delay:var(--d,1.5s)} @keyframes rbInto{to{transform:translate(var(--x,0),var(--y,0)) scale(.45);opacity:0}}
.rb-snow{animation:rbSnow 7s linear infinite;animation-delay:var(--d,0s)} @keyframes rbSnow{from{transform:translate(0,-30px)}to{transform:translate(-30px,330px)}}
.rb-bolt{animation:rbBolt .5s ease-in 1.2s forwards} @keyframes rbBolt{to{transform:translateX(-36px)}}
.rb-heat{opacity:0;animation:rbOn .3s ease 3.6s forwards} @keyframes rbOn{to{opacity:1}}
.rb-heat0{animation:rbOff .3s ease 2.8s forwards} @keyframes rbOff{to{opacity:0}}
.rb-card{animation:rbCard 1.4s ease-in 1.6s forwards} @keyframes rbCard{to{transform:translate(60px,90px) rotate(30deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.rb-ov *{animation-duration:.01s!important;animation-delay:0s!important}}`;

  // Geräusche, im Browser erzeugt
  let ac = null;
  const ctx = () => (ac ||= new (window.AudioContext || window.webkitAudioContext)());
  function noise(t, dur, f, q, gain) { const a = ctx(), n = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = a.createBufferSource(); s.buffer = n; const bf = a.createBiquadFilter(); bf.type = "bandpass"; bf.frequency.value = f; bf.Q.value = q; const g = a.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(bf).connect(g).connect(a.destination); s.start(t); s.stop(t + dur); }
  function tone(t, f1, f2, dur, gain, type = "sine") { const a = ctx(), os = a.createOscillator(), g = a.createGain(); os.type = type; os.frequency.setValueAtTime(f1, t); os.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); os.connect(g).connect(a.destination); os.start(t); os.stop(t + dur); }
  const SFX = {
    knock: (t) => { tone(t, 140, 60, 0.12, 0.6); noise(t, 0.06, 900, 2, 0.35); },
    creak: (t) => { tone(t, 320, 180, 0.7, 0.05, "sawtooth"); },
    plop: (t) => { tone(t, 900, 300, 0.12, 0.25); },
    rustle: (t) => { noise(t, 0.9, 3000, 0.7, 0.18); },
    sting: (t) => { tone(t, 220, 218, 0.9, 0.12, "triangle"); tone(t, 311, 309, 0.9, 0.08, "triangle"); },
    step: (t) => { tone(t, 90, 50, 0.1, 0.35); noise(t, 0.05, 400, 1, 0.15); },
    click: (t) => { noise(t, 0.04, 2500, 4, 0.4); tone(t, 600, 300, 0.05, 0.15); },
    stamp: (t) => { tone(t, 120, 40, 0.3, 0.9); noise(t, 0.12, 300, 0.8, 0.6); },
    chord: (t) => { [147, 175, 220].forEach((f) => tone(t, f, f, 2.4, 0.07, "triangle")); },
    applause: (t) => { for (let i = 0; i < 26; i++) noise(t + Math.random() * 1.6, 0.05, 1800 + Math.random() * 1500, 2, 0.12); },
    boom: (t) => { tone(t, 80, 30, 0.9, 0.5); noise(t, 0.6, 200, 0.6, 0.25); },
    wind: (t) => { noise(t, 3.5, 500, 0.5, 0.06); noise(t + 1, 2.5, 900, 0.8, 0.04); },
    dice: (t) => { for (let i = 0; i < 6; i++) { noise(t + i * 0.09 + Math.random() * 0.03, 0.03, 2200, 3, 0.3); tone(t + i * 0.09, 700, 500, 0.03, 0.06); } },
    beep: (t) => { tone(t, 1320, 1320, 0.12, 0.12, "square"); },
    rattle: (t) => { for (let i = 0; i < 8; i++) noise(t + i * 0.55, 0.08, 500, 1.5, 0.08); },
  };

  function play(data, { en = false, onEnd } = {}) {
    if (!document.getElementById("rb-css")) { const st = document.createElement("style"); st.id = "rb-css"; st.textContent = CSS; document.head.appendChild(st); }
    const L = (d, e) => (en ? e : d);
    const ov = document.createElement("div"); ov.className = "rb-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", L("Rückblende", "Flashback"));
    ov.innerHTML = `<div class="rb-stage"></div><div class="rb-sub" aria-live="polite"></div><div class="rb-bar"><button class="rb-btn" data-a="mute" type="button">${L("Ton aus", "Sound off")}</button><div class="rb-prog"><i></i></div><button class="rb-btn" data-a="skip" type="button">${L("Überspringen", "Skip")}</button></div>`;
    document.body.appendChild(ov); document.body.style.overflow = "hidden";
    const stage = ov.querySelector(".rb-stage"), subEl = ov.querySelector(".rb-sub"), bar = ov.querySelector(".rb-prog i");
    let muted = false, timers = [], done = false;
    const audio = data.music ? new Audio(data.music) : null;
    // Ton freischalten: im Klick-Handler starten (Safari/iOS); klappt das nicht, Knopf „Ton einschalten“ zeigen
    const muteBtn = () => ov.querySelector('[data-a="mute"]');
    const unlock = () => { try { const a = ctx(); a.resume(); const b = a.createBuffer(1, 1, 22050), s = a.createBufferSource(); s.buffer = b; s.connect(a.destination); s.start(0); } catch {} };
    unlock();
    if (audio) { audio.volume = 0.55; audio.setAttribute("playsinline", ""); audio.play().catch(() => { muted = true; const b = muteBtn(); if (b) b.textContent = L("🔊 Ton einschalten", "🔊 Turn sound on"); }); }
    const total = data.scenes.reduce((a, s) => a + s.dur, 0), t0 = performance.now();
    const tick = () => { if (done) return; bar.style.width = Math.min(100, ((performance.now() - t0) / 1000 / total) * 100) + "%"; requestAnimationFrame(tick); }; tick();
    const end = () => { if (done) return; done = true; timers.forEach(clearTimeout); if (audio) { const a = audio; let v = a.volume; const f = setInterval(() => { v -= 0.05; if (v <= 0) { a.pause(); clearInterval(f); } else a.volume = v; }, 40); } ov.remove(); document.body.style.overflow = ""; if (onEnd) onEnd(); };
    ov.addEventListener("click", (e) => { const a = e.target.dataset && e.target.dataset.a; if (a === "skip") end(); if (a === "mute") { muted = !muted; unlock(); if (audio) { audio.muted = muted; if (!muted && audio.paused) { audio.currentTime = (performance.now() - t0) / 1000; audio.play().catch(() => {}); } } e.target.textContent = muted ? L("Ton an", "Sound on") : L("Ton aus", "Sound off"); } });
    document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { document.removeEventListener("keydown", k); end(); } });
    let at = 0;
    data.scenes.forEach((sc, i) => {
      timers.push(setTimeout(() => {
        const old = stage.querySelector(".rb-scene"); if (old) { old.classList.add("out"); setTimeout(() => old.remove(), 500); }
        const el = document.createElement("div"); el.className = "rb-scene"; el.innerHTML = sc.svg; stage.appendChild(el);
        subEl.textContent = sc.sub || "";
        try { const a = ctx(), now = a.currentTime; (sc.sfx || []).forEach(([t, k]) => { if (!muted && SFX[k]) SFX[k](now + t); }); } catch {}
      }, at * 1000));
      at += sc.dur;
    });
    timers.push(setTimeout(end, at * 1000 + 400));
  }
  window.Rueckblende = { play };
})();
