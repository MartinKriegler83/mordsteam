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
    var TN=EN?{basis:"Basic",premium:"Premium",plus:"Premium Plus"}:{basis:"Basic",premium:"Premium",plus:"Premium Plus"}, MIN={basis:50,premium:70,plus:90};
    var gl=d.lang==="en"?"&lang=en":"";
    var link=location.origin+"/spiel/?code="+d.join_code+gl, org="/spiel/leitung.html"+(d.lang==="en"?"?lang=en":"");
    var langName=d.lang==="en"?T("Englisch","English"):T("Deutsch","German");
    show('<div class="eyebrow">'+T("Bezahlt · Fall angelegt","Paid · case created")+'</div>'+
      '<h1>'+T("Euer Fall ist bereit.","Your case is ready.")+'</h1>'+
      '<p class="lead">'+T('Fall '+(d.fall_nr||'001')+' für '+esc(d.firma)+' – '+(TN[d.paket]||d.paket)+', '+d.teams+' Team'+(d.teams>1?"s":"")+', Spielsprache '+langName+'. Spielbar ab sofort, 12 Monate lang – einmal startbar. Bitte diese Seite speichern oder die Codes notieren.',
        'Case '+(d.fall_nr||'001')+' for '+esc(d.firma)+' – '+(TN[d.paket]||d.paket)+', '+d.teams+' team'+(d.teams>1?"s":"")+', game language '+langName+'. Playable right away, for 12 months – it can be started once. Please save this page or write down the codes.')+'</p>'+
      '<div class="codes">'+
      '<div class="codecard dark"><small>'+T("ORGANISATOR-CODE · NICHT WEITERGEBEN","ORGANISER CODE · DON'T PASS ON")+'</small><div class="code">'+esc(d.org_code)+'</div><p>'+T("Damit öffnet und startet ihr den Fall und seht am Ende die Auflösung. Nicht an die Teams weitergeben.","Use it to open and start the case and to see the solution at the end. Don't pass it on to the teams.")+'</p></div>'+
      '<div class="codecard"><small>'+T("SPIELCODE FÜR DIE TEAMS","GAME CODE FOR THE TEAMS")+'</small><div class="code">'+esc(d.join_code)+'</div><p>'+T("Den bekommen alle Teams, wenn ihr spielt – zusammen mit dem Link.","All teams get this when you play, together with the link.")+'</p></div>'+
      '</div>'+
      (d.earlybird?'<p class="note">'+T('Early Bird: Danke, dass ihr uns helft! Nach dem Spiel melden wir uns per E-Mail für euer Feedback.','Early bird: thanks for helping us! After the game we\'ll email you for your feedback.')+'</p>':'')+
      '<div class="prose"><h2>'+T("So läuft das Spiel","How the game works")+'</h2><ol>'+
      '<li>'+T('Wann immer ihr spielen wollt – auch gleich jetzt: Öffnet <a href="'+org+'">'+esc(location.host)+'/spiel/leitung.html</a>, meldet euch mit dem Organisator-Code an und tippt auf „Fall öffnen“.','Whenever you want to play – even right now: open <a href="'+org+'">'+esc(location.host)+'/spiel/leitung.html</a>, log in with the organiser code and tap “Open case”.')+'</li>'+
      '<li>'+T('Jedes Team öffnet auf <b>einem</b> Gerät <a href="'+esc(link)+'">'+esc(link.replace(/^https?:\/\//,""))+'</a> und gibt einen Teamnamen ein.','Each team opens <a href="'+esc(link)+'">'+esc(link.replace(/^https?:\/\//,""))+'</a> on <b>one</b> device and enters a team name.')+'</li>'+
      '<li>'+T('Sind alle Teams angemeldet, startet ihr den Fall auf der Organisator-Seite (Knopf „Fall starten“). Die Uhr läuft für alle gleichzeitig: '+(MIN[d.paket]||60)+' Minuten. Erst ab dem Start können sich weitere Geräte pro Team per QR-Code zum Mitlesen verbinden (im Tab „Einsatz“).','Once all teams have joined, start the case on the organiser page (“Start case” button). The clock runs for everyone at the same time: '+(MIN[d.paket]||60)+' minutes. Only once the case has started can more devices per team follow along via QR code (in the “Briefing” tab).')+'</li>'+
      '<li>'+T('Haben alle Teams gelöst, endet die Runde automatisch und alle sehen Rangliste und Auflösung. Schafft es ein Team nicht in der Zeit, beendet ihr die Runde auf der Organisator-Seite selbst.','Once all teams have solved it, the round ends automatically and everyone sees the ranking and the solution. If a team doesn\'t make it in time, end the round yourself on the organiser page.')+'</li>'+
      '</ol><p><b>'+T("Tipp:","Tip:")+'</b> '+T('Öffnet ein paar Tage vorher '+esc(location.host)+'/spiel auf einem Firmengerät. Lädt die Seite, bremst euch kein Webfilter.','A few days before, open '+esc(location.host)+'/spiel on a company device. If the page loads, no web filter will get in your way.')+'</p><p>'+T('Die Rechnung kommt per E-Mail von unserem Zahlungsanbieter Stripe. Fragen? ','The invoice will be emailed by our payment provider Stripe. Questions? ')+MAIL+'</p>'+(d.nr?'<p class="small">'+T('Bestellnummer','Order number')+': <b>'+esc(d.nr)+'</b></p>':'')+'</div>'+
      '');
  }
  function soloDone(d){
    var link=location.origin+"/spiel/solo.html?c="+d.solo_code;
    show('<div class="eyebrow">'+T("Bezahlt · Mordsteam Solo","Paid · Mordsteam Solo")+'</div>'+
      '<h1>'+T((d.solo_head||["Der Nachtzug wartet."])[0],(d.solo_head||["","The night train is waiting."])[1])+'</h1>'+
      '<p class="lead">'+T('Dein Code für „'+esc(d.solo_title||"Nachtzug nach Venedig")+'“ ist 12 Monate gültig. Wir haben ihn dir auch per E-Mail geschickt.','Your code for “'+esc(d.solo_title_en||"Night Train to Venice")+'” (game language German) is valid for 12 months. We have also emailed it to you.')+'</p>'+
      '<div class="codes"><div class="codecard dark"><small>'+T("DEIN SOLO-CODE","YOUR SOLO CODE")+'</small><div class="code">'+esc(d.solo_code)+'</div><p>'+T("Als Geschenk einfach Code oder Link weitergeben – den Namen gibt ein, wer spielt.","As a gift, just pass on the code or link – the name is entered by whoever plays.")+'</p></div></div>'+
      '<p style="margin:22px 0"><a class="btn btn-red" href="'+esc(link)+'">'+T("Fall öffnen","Open the case")+'</a></p>'+
      '<div class="prose"><p>'+T('Die Uhr startet erst, wenn du die Akte öffnest – dann hast du '+(d.solo_min||30)+' Minuten, '+((d.solo_goal||["bis Udine"])[0])+'. Link zum Spielen: ','The clock only starts when you open the case file – then you have '+(d.solo_min||30)+' minutes '+((d.solo_goal||["","until Udine"])[1])+'. Link to play: ')+'<a href="'+esc(link)+'">'+esc(link.replace(/^https?:\/\//,""))+'</a></p>'+
      '<p>'+T('Die Rechnung kommt per E-Mail von unserem Zahlungsanbieter Stripe. Fragen? ','The invoice will be emailed by our payment provider Stripe. Questions? ')+MAIL+'</p>'+(d.nr?'<p class="small">'+T('Bestellnummer','Order number')+': <b>'+esc(d.nr)+'</b></p>':'')+'</div>');
  }
  function friendsDone(d){
    var inv=location.origin+"/spiel/friends.html?e="+d.invite, org=location.origin+"/spiel/friends.html?o="+d.org_token;
    var mode=d.mode==="week"?T("über "+d.days+" Tage – jeder spielt, wann er Zeit hat","over "+d.days+" days – everyone plays when they have time"):T("gleichzeitig – du startest den Fall für alle","all at once – you start the case for everyone");
    show('<div class="eyebrow">'+T("Bezahlt · Mordsteam Friends","Paid · Mordsteam Friends")+'</div>'+
      '<h1>'+T("Die Hütte wartet.","The hut is waiting.")+'</h1>'+
      '<p class="lead">'+T('„Letzte Runde auf der Hütte“'+(d.plus?' – Krimiabend Plus mit KI-Verhörraum –':'')+' für '+d.teams+' Personen, gespielt '+mode+'. 12 Monate spielbar, einmal startbar. Wir haben dir beide Links auch per E-Mail geschickt.','“Last Round at the Chalet”'+(d.plus?' – Mystery Night Plus with AI interrogation room –':'')+' (game language German) for '+d.teams+' people, played '+mode+'. Playable for 12 months, can be started once. We have also emailed you both links.')+'</p>'+
      '<div class="codes">'+
      '<div class="codecard"><small>'+T("1 · EINLADUNGSLINK FÜR ALLE","1 · INVITATION LINK FOR EVERYONE")+'</small><p style="word-break:break-all"><a href="'+esc(inv)+'">'+esc(inv.replace(/^https?:\/\//,""))+'</a></p><p>'+T("Schick ihn in eure Gruppe. Jeder tippt auf seinen Namen – auch du, wenn du mitspielst.","Send it to your group. Everyone taps their name – you too, if you're playing.")+'</p><p><button type="button" class="btn btn-ink" id="cpinv">'+T("Link kopieren","Copy link")+'</button></p></div>'+
      '<div class="codecard dark"><small>'+T("2 · DEINE ORGANISATOR-SEITE · NICHT WEITERGEBEN","2 · YOUR ORGANISER PAGE · DON'T PASS ON")+'</small><p>'+T("Hier siehst du, wer schon da ist, und startest den Fall.","Here you can see who has joined and start the case.")+'</p><p><a class="btn btn-red" href="'+esc(org)+'">'+T("Organisator-Seite öffnen","Open organiser page")+'</a></p></div>'+
      '</div>'+
      (d.earlybird?'<p class="note">'+T('Early Bird: Danke, dass ihr uns helft! Nach der Auflösung fragt euch das Spiel direkt nach eurem Feedback.','Early bird: thanks for helping us! After the solution, the game will ask you for your feedback right away.')+'</p>':'')+
      '<div class="prose"><p>'+T('Die Rechnung kommt per E-Mail von unserem Zahlungsanbieter Stripe. Fragen? ','The invoice will be emailed by our payment provider Stripe. Questions? ')+MAIL+'</p>'+(d.nr?'<p class="small">'+T('Bestellnummer','Order number')+': <b>'+esc(d.nr)+'</b></p>':'')+'</div>');
    var b=document.getElementById("cpinv");
    if(b) b.onclick=function(){ if(navigator.share){navigator.share({title:"Mordsteam Friends",text:T("Einer von uns war's. Such dir deinen Namen aus:","One of us did it. Pick your name:"),url:inv}).catch(function(){});} else if(navigator.clipboard){navigator.clipboard.writeText(inv).then(function(){b.textContent=T("Kopiert ✓","Copied ✓");});} };
    if(b&&navigator.share) b.textContent=T("Link teilen","Share link");
  }
  function poll(){
    if(!o||!k){show('<h1>'+T("Bestellung nicht gefunden","Order not found")+'</h1><p class="lead">'+T("Der Link ist unvollständig. Schreibt uns an ","The link is incomplete. Write to us at ")+MAIL+'.</p>');return;}
    fetch("/api/shop/status?o="+encodeURIComponent(o)+"&k="+encodeURIComponent(k)).then(function(r){return r.json().then(function(d){return [r,d];});}).then(function(x){
      var r=x[0], d=x[1];
      if(!r.ok){show('<h1>'+T("Bestellung nicht gefunden","Order not found")+'</h1><p class="lead">'+esc(d.error||"")+' '+T("Schreibt uns an ","Write to us at ")+MAIL+'.</p>');return;}
      if(d.produkt==="solo"&&d.status==="fulfilled"&&d.solo_code) return soloDone(d);
      if(d.produkt==="friends"&&d.status==="fulfilled"&&d.invite) return friendsDone(d);
      if(d.status==="fulfilled"&&d.join_code) return done(d);
      if(++tries>40){show('<div class="eyebrow">'+T("Bestellung","Order")+'</div><h1>'+T("Zahlung wird noch bestätigt","Payment is still being confirmed")+'</h1><p class="lead">'+T("Das dauert ungewöhnlich lange. Ladet die Seite in ein paar Minuten neu – oder schreibt uns an "+MAIL+". Ihr bezahlt sicher nicht doppelt.","This is taking unusually long. Reload the page in a few minutes – or write to us at "+MAIL+". You definitely won't be charged twice.")+'</p>');return;}
      setTimeout(poll,tries<10?1500:4000);
    }).catch(function(){ if(++tries<=40) setTimeout(poll,4000); });
  }
  poll();
})();
