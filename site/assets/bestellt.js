// Bestätigungsseite: wartet auf die Zahlung und zeigt die Codes (deutsch unter /, englisch unter /en/)
(function(){
  "use strict";
  var EN=document.documentElement.lang==="en";
  function T(de,en){return EN?en:de;}
  var out=document.getElementById("out");
  var q=new URLSearchParams(location.search), o=q.get("o"), k=q.get("k"), tries=0;
  var MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m];});}
  function fmt(d){var p=d.split("-");return EN?(+p[2]+" "+MONTHS[+p[1]-1]+" "+p[0]):(+p[2]+"."+ +p[1]+"."+p[0]);}
  function show(h){out.innerHTML=h;}
  var MAIL='<a href="mailto:office@mordsteam.com">office@mordsteam.com</a>';
  function done(d){
    try{localStorage.removeItem("ms_order_draft");}catch(e){}
    var TN=EN?{basis:"Basic",premium:"Premium",plus:"Premium Plus"}:{basis:"Basis",premium:"Premium",plus:"Premium Plus"}, MIN={basis:50,premium:70,plus:90};
    var gl=d.lang==="en"?"&lang=en":"";
    var link=location.origin+"/spiel/?code="+d.join_code+gl, org="/spiel/leitung.html"+(d.lang==="en"?"?lang=en":"");
    var langName=d.lang==="en"?T("Englisch","English"):T("Deutsch","German");
    show('<div class="eyebrow">'+T("Bezahlt · Fall angelegt","Paid · case created")+'</div>'+
      '<h1>'+T("Euer Fall ist bereit.","Your case is ready.")+'</h1>'+
      '<p class="lead">'+T('Fall 001 für '+esc(d.firma)+' – '+(TN[d.paket]||d.paket)+', '+d.teams+' Team'+(d.teams>1?"s":"")+', Spieltag '+fmt(d.event_date)+', Spielsprache '+langName+'. Bitte diese Seite speichern oder die Codes notieren.',
        'Case 001 for '+esc(d.firma)+' – '+(TN[d.paket]||d.paket)+', '+d.teams+' team'+(d.teams>1?"s":"")+', game day '+fmt(d.event_date)+', game language '+langName+'. Please save this page or write down the codes.')+'</p>'+
      '<div class="codes">'+
      '<div class="codecard dark"><small>'+T("ORGANISATOR-CODE · NUR FÜR EUCH","ORGANISER CODE · JUST FOR YOU")+'</small><div class="code">'+esc(d.org_code)+'</div><p>'+T("Damit öffnet und startet ihr den Fall und seht am Ende die Auflösung. Nicht an die Teams weitergeben.","Use it to open and start the case and to see the solution at the end. Don't pass it on to the teams.")+'</p></div>'+
      '<div class="codecard"><small>'+T("SPIELCODE FÜR DIE TEAMS","GAME CODE FOR THE TEAMS")+'</small><div class="code">'+esc(d.join_code)+'</div><p>'+T("Den bekommen alle Teams am Spieltag, zusammen mit dem Link.","All teams get this on the game day, together with the link.")+'</p></div>'+
      '</div>'+
      '<div class="prose"><h2>'+T("So läuft der Spieltag","How the game day works")+'</h2><ol>'+
      '<li>'+T('Ihr öffnet <a href="'+org+'">'+esc(location.host)+'/spiel/leitung.html</a>, meldet euch mit dem Organisator-Code an und tippt auf „Fall öffnen“.','Open <a href="'+org+'">'+esc(location.host)+'/spiel/leitung.html</a>, log in with the organiser code and tap “Open case”.')+'</li>'+
      '<li>'+T('Jedes Team öffnet auf <b>einem</b> Gerät <a href="'+esc(link)+'">'+esc(link.replace(/^https?:\/\//,""))+'</a> und gibt einen Teamnamen ein. Weitere Geräte können sich danach per QR-Code zum Mitlesen verbinden.','Each team opens <a href="'+esc(link)+'">'+esc(link.replace(/^https?:\/\//,""))+'</a> on <b>one</b> device and enters a team name. More devices can then follow along via QR code.')+'</li>'+
      '<li>'+T('Sind alle angemeldet, startet ihr den Fall. Die Uhr läuft für alle gleichzeitig: '+(MIN[d.paket]||60)+' Minuten.','Once everyone has joined, start the case. The clock runs for everyone at the same time: '+(MIN[d.paket]||60)+' minutes.')+'</li>'+
      '<li>'+T('Haben alle Teams gelöst, endet die Runde automatisch und alle sehen Rangliste und Auflösung. Schafft es ein Team nicht in der Zeit, beendet ihr die Runde auf der Organisator-Seite selbst.','Once all teams have solved it, the round ends automatically and everyone sees the ranking and the solution. If a team doesn\'t make it in time, end the round yourself on the organiser page.')+'</li>'+
      '</ol><p><b>'+T("Tipp:","Tip:")+'</b> '+T('Öffnet ein paar Tage vorher '+esc(location.host)+'/spiel auf einem Firmengerät. Lädt die Seite, bremst euch kein Webfilter.','A few days before, open '+esc(location.host)+'/spiel on a company device. If the page loads, no web filter will get in your way.')+'</p><p>'+T('Die Rechnung kommt per E-Mail von unserem Zahlungsanbieter Stripe. Fragen? ','The invoice will be emailed by our payment provider Stripe. Questions? ')+MAIL+'</p></div>'+
      '<p style="margin-top:24px"><button class="btn btn-ink" type="button" id="print">'+T("Seite drucken","Print page")+'</button></p>');
    document.getElementById("print").addEventListener("click",function(){window.print();});
  }
  function poll(){
    if(!o||!k){show('<h1>'+T("Bestellung nicht gefunden","Order not found")+'</h1><p class="lead">'+T("Der Link ist unvollständig. Schreibt uns an ","The link is incomplete. Write to us at ")+MAIL+'.</p>');return;}
    fetch("/api/shop/status?o="+encodeURIComponent(o)+"&k="+encodeURIComponent(k)).then(function(r){return r.json().then(function(d){return [r,d];});}).then(function(x){
      var r=x[0], d=x[1];
      if(!r.ok){show('<h1>'+T("Bestellung nicht gefunden","Order not found")+'</h1><p class="lead">'+esc(d.error||"")+' '+T("Schreibt uns an ","Write to us at ")+MAIL+'.</p>');return;}
      if(d.status==="fulfilled"&&d.join_code) return done(d);
      if(++tries>40){show('<div class="eyebrow">'+T("Bestellung","Order")+'</div><h1>'+T("Zahlung wird noch bestätigt","Payment is still being confirmed")+'</h1><p class="lead">'+T("Das dauert ungewöhnlich lange. Ladet die Seite in ein paar Minuten neu – oder schreibt uns an "+MAIL+". Ihr bezahlt sicher nicht doppelt.","This is taking unusually long. Reload the page in a few minutes – or write to us at "+MAIL+". You definitely won't be charged twice.")+'</p>');return;}
      setTimeout(poll,tries<10?1500:4000);
    }).catch(function(){ if(++tries<=40) setTimeout(poll,4000); });
  }
  poll();
})();
