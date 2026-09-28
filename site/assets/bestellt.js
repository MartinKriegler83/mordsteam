// Bestätigungsseite: wartet auf die Zahlung und zeigt die Codes
(function(){
  "use strict";
  var out=document.getElementById("out");
  var q=new URLSearchParams(location.search), o=q.get("o"), k=q.get("k"), tries=0;
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m];});}
  function fmt(d){var p=d.split("-");return +p[2]+"."+ +p[1]+"."+p[0];}
  function eur(c){return (c/100).toLocaleString("de-AT",{maximumFractionDigits:2})+" €";}
  function show(h){out.innerHTML=h;}
  function done(d){
    try{localStorage.removeItem("ms_order_draft");}catch(e){}
    var TN={basis:"Basis",premium:"Premium",plus:"Premium Plus"}, MIN={basis:50,premium:70,plus:90}, link=location.origin+"/spiel/?code="+d.join_code;
    show('<div class="eyebrow">Bezahlt · Fall angelegt</div>'+
      '<h1>Euer Fall ist bereit.</h1>'+
      '<p class="lead">Fall 001 für '+esc(d.firma)+' – '+(TN[d.paket]||d.paket)+', '+d.teams+' Team'+(d.teams>1?"s":"")+', Spieltag '+fmt(d.event_date)+'. Bitte diese Seite speichern oder die Codes notieren'+'.</p>'+
      '<div class="codes">'+
      '<div class="codecard dark"><small>ORGANISATOR-CODE · NUR FÜR EUCH</small><div class="code">'+esc(d.org_code)+'</div><p>Damit öffnet und startet ihr den Fall und seht am Ende die Auflösung. Nicht an die Teams weitergeben.</p></div>'+
      '<div class="codecard"><small>SPIELCODE FÜR DIE TEAMS</small><div class="code">'+esc(d.join_code)+'</div><p>Den bekommen alle Teams am Spieltag, zusammen mit dem Link.</p></div>'+
      '</div>'+
      '<div class="prose"><h2>So läuft der Spieltag</h2><ol>'+
      '<li>Ihr öffnet <a href="/spiel/leitung.html">'+esc(location.host)+'/spiel/leitung.html</a>, meldet euch mit dem Organisator-Code an und tippt auf „Fall öffnen“.</li>'+
      '<li>Jedes Team öffnet auf <b>einem</b> Gerät <a href="'+esc(link)+'">'+esc(link.replace(/^https?:\/\//,""))+'</a> und gibt einen Teamnamen ein. Weitere Geräte können sich danach per QR-Code zum Mitlesen verbinden.</li>'+
      '<li>Sind alle angemeldet, startet ihr den Fall. Die Uhr läuft für alle gleichzeitig: '+(MIN[d.paket]||60)+' Minuten.</li>'+
      '<li>Haben alle Teams gelöst, endet die Runde automatisch und alle sehen Rangliste und Auflösung. Schafft es ein Team nicht in der Zeit, beendet ihr die Runde auf der Organisator-Seite selbst.</li>'+
      '</ol><p><b>Tipp:</b> Öffnet ein paar Tage vorher '+esc(location.host)+'/spiel auf einem Firmengerät. Lädt die Seite, bremst euch kein Webfilter.</p><p>Die Rechnung kommt per E-Mail von unserem Zahlungsanbieter Stripe. Fragen? <a href="mailto:office@mordsteam.com">office@mordsteam.com</a></p></div>'+
      '<p style="margin-top:24px"><button class="btn btn-ink" type="button" id="print">Seite drucken</button></p>');
    document.getElementById("print").addEventListener("click",function(){window.print();});
  }
  function poll(){
    if(!o||!k){show('<h1>Bestellung nicht gefunden</h1><p class="lead">Der Link ist unvollständig. Schreibt uns an <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>.</p>');return;}
    fetch("/api/shop/status?o="+encodeURIComponent(o)+"&k="+encodeURIComponent(k)).then(function(r){return r.json().then(function(d){return [r,d];});}).then(function(x){
      var r=x[0], d=x[1];
      if(!r.ok){show('<h1>Bestellung nicht gefunden</h1><p class="lead">'+esc(d.error||"")+' Schreibt uns an <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>.</p>');return;}
      if(d.status==="fulfilled"&&d.join_code) return done(d);
      if(++tries>40){show('<div class="eyebrow">Bestellung</div><h1>Zahlung wird noch bestätigt</h1><p class="lead">Das dauert ungewöhnlich lange. Ladet die Seite in ein paar Minuten neu – oder schreibt uns an <a href="mailto:office@mordsteam.com">office@mordsteam.com</a>. Ihr bezahlt sicher nicht doppelt.</p>');return;}
      setTimeout(poll,tries<10?1500:4000);
    }).catch(function(){ if(++tries<=40) setTimeout(poll,4000); });
  }
  poll();
})();
