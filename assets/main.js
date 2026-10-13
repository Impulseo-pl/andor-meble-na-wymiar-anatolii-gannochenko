// ANDOR - układ wg wzoru klindworthroofing.com: menu, karuzele, opinie, filtry, odsłanianie
document.documentElement.classList.add('js');

// MENU pełnoekranowe (pigułka na środku paska)
(function () {
  var btn = document.querySelector('.menu-pill');
  var root = document.documentElement;
  if (!btn) return;
  function ustaw(otw) {
    root.classList.toggle('menu-open', otw);
    btn.setAttribute('aria-expanded', otw ? 'true' : 'false');
    btn.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
  }
  btn.addEventListener('click', function () { ustaw(!root.classList.contains('menu-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ustaw(false); });
  document.querySelectorAll('.menu a').forEach(function (a) { a.addEventListener('click', function () { ustaw(false); }); });
})();

// Pasek: po zejściu z góry zostaje sama pigułka menu
(function () {
  var h = document.querySelector('.site-header');
  if (!h) return;
  var tik = false;
  function stan() { h.classList.toggle('scrolled', (window.scrollY || 0) > 80); tik = false; }
  window.addEventListener('scroll', function () { if (!tik) { tik = true; requestAnimationFrame(stan); } }, { passive: true });
  stan();
})();

// Odsłanianie sekcji przy przewijaniu. Dwa tory: IntersectionObserver + sprawdzenie
// pozycji przy każdym przewinięciu (szybkie przewijanie potrafi ominąć obserwatora),
// a twardy bezpiecznik po 3,5 s pokazuje wszystko - nigdy pusty ekran.
(function () {
  var el = [].slice.call(document.querySelectorAll('.rv'));
  function pokazWszystko() { el.forEach(function (x) { x.classList.add('in'); }); }
  try {
    function sprawdz() {
      var h = window.innerHeight * 0.94;
      el.forEach(function (x) { if (!x.classList.contains('in') && x.getBoundingClientRect().top < h) x.classList.add('in'); });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (w) {
        w.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
      el.forEach(function (x) { io.observe(x); });
    }
    window.addEventListener('scroll', sprawdz, { passive: true });
    window.addEventListener('resize', sprawdz);
    sprawdz();
    setTimeout(pokazWszystko, 3500);
  } catch (e) { pokazWszystko(); }
})();

// Okno na nieruchome zdjęcie: tło przyklejone do okna rysujemy tylko przy sekcji w kadrze
(function () {
  var sek = [].slice.call(document.querySelectorAll('.stopklatka'));
  if (!sek.length) return;
  try {
    var tik = false;
    function stan() {
      var h = window.innerHeight;
      sek.forEach(function (x) {
        var r = x.getBoundingClientRect();
        x.classList.toggle('vis', r.bottom > -200 && r.top < h + 200);
      });
      tik = false;
    }
    window.addEventListener('scroll', function () { if (!tik) { tik = true; requestAnimationFrame(stan); } }, { passive: true });
    window.addEventListener('resize', stan);
    stan();
  } catch (e) { sek.forEach(function (x) { x.classList.add('vis'); }); }
})();

// Karuzele: strzałki + pasek postępu
(function () {
  document.querySelectorAll('[data-carousel]').forEach(function (box) {
    var tr = box.querySelector('.track');
    var bar = box.querySelector('.progress i');
    if (!tr) return;
    function krok() {
      var s = tr.children[0];
      return s ? s.getBoundingClientRect().width + parseFloat(getComputedStyle(tr).columnGap || 0) : tr.clientWidth;
    }
    box.querySelectorAll('[data-dir]').forEach(function (b) {
      b.addEventListener('click', function () {
        var max = tr.scrollWidth - tr.clientWidth;
        var cel = tr.scrollLeft + krok() * (+b.getAttribute('data-dir'));
        if (cel > max + 4) cel = 0; else if (cel < -4) cel = max;
        tr.scrollTo({ left: cel, behavior: 'smooth' });
      });
    });
    function postep() {
      if (!bar) return;
      var max = Math.max(1, tr.scrollWidth - tr.clientWidth);
      var w = Math.min(1, tr.clientWidth / tr.scrollWidth);
      bar.style.width = (w * 100) + '%';
      bar.style.transform = 'translateX(' + ((tr.scrollLeft / max) * (1 - w) / w * 100) + '%)';
    }
    tr.addEventListener('scroll', function () { requestAnimationFrame(postep); }, { passive: true });
    window.addEventListener('resize', postep);
    postep();
  });
})();

// Opinie: cytat + zdjęcie, przełączane strzałkami
(function () {
  var box = document.querySelector('[data-kudos]');
  if (!box) return;
  var q = box.querySelectorAll('.q'), im = box.querySelectorAll('.q-imgs .ph'), i = 0;
  function pokaz(n) {
    i = (n + q.length) % q.length;
    q.forEach(function (x, k) { x.classList.toggle('on', k === i); });
    im.forEach(function (x, k) { x.classList.toggle('on', k === i); });
  }
  box.querySelectorAll('[data-q]').forEach(function (b) {
    b.addEventListener('click', function () { pokaz(i + (+b.getAttribute('data-q'))); });
  });
})();

// Realizacje: filtr kategorii
(function () {
  var chips = document.querySelectorAll('.chip[data-f]');
  if (!chips.length) return;
  var el = document.querySelectorAll('[data-cat]');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var f = c.getAttribute('data-f');
      chips.forEach(function (x) { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      el.forEach(function (x) {
        var ok = f === 'all' || (' ' + x.getAttribute('data-cat') + ' ').indexOf(' ' + f + ' ') >= 0;
        x.classList.toggle('is-hidden', !ok);
        if (ok) x.classList.add('in');
      });
    });
  });
})();

// LICZNIK WAŻNOŚCI DEMA (K. 09.08: pełne odliczanie dni/godzin/minut/sekund).
// Element wstrzykuje multipage TYLKO w dema. Nie wita klienta przy wejściu - wjeżdża
// po zejściu z pierwszego ekranu i chowa się po powrocie na górę.
(function () {
  var el = document.querySelector('.demo-wazne');
  if (!el || !el.getAttribute('data-do')) return;
  var koniec = new Date(el.getAttribute('data-do') + 'T23:59:59');
  if (isNaN(koniec)) return;
  var txt = el.querySelector('.dw-txt') || el;
  var dwa = function (n) { return (n < 10 ? '0' : '') + n; };

  var cykl = parseInt(el.getAttribute('data-cykl') || '0', 10);   // dni; 0 = brak wznowienia
  function tyka() {
    var teraz = new Date(), ms = koniec - teraz;
    // po wygaśnięciu licznik rusza od nowa (K. 10.08) - dema i tak zostają, a odliczanie
    // ma dawać klientowi realne poczucie, że sprawa ma termin.
    while (ms <= 0 && cykl > 0) {
      koniec = new Date(koniec.getTime() + cykl * 86400000);
      ms = koniec - teraz;
    }
    if (ms <= 0) { txt.innerHTML = 'Wersja pokazowa wygasła'; el.classList.add('is-koniec'); return false; }
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
    var g = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
    var zegar = dwa(g) + ':' + dwa(m) + ':' + dwa(sek);
    txt.innerHTML = d > 0
      ? 'Wersja pokazowa · <b>' + d + ' dni</b> <span class="dw-zeg">' + zegar + '</span>'
      : 'Wersja pokazowa · <b class="dw-pilne">' + zegar + '</b>';
    el.classList.toggle('is-pilne', d === 0);
    return true;
  }
  if (tyka() !== false) setInterval(tyka, 1000);
  el.hidden = false;

  var tick = false;
  function stan() {
    el.classList.toggle('is-on', (window.scrollY || 0) > window.innerHeight * 0.55);
    tick = false;
  }
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true; requestAnimationFrame(stan);
  }, { passive: true });
  stan();
})();


/* === DOLNY PASEK MOBILE: chowa się przy stopce ===
   Lekcja 13.08.2026 (Zielony Azymut): klient zgłosił, że pasek „Zapytaj o termin"
   zasłania treść na dole strony. Rezerwę pod treścią daje CSS (razem z safe-area
   iPhone'a), a tu drugie zabezpieczenie: gdy w kadrze jest stopka albo sekcja CTA
   — czyli te same przyciski — pasek zjeżdża w dół i wraca po odjechaniu w górę.
   Brak IntersectionObserver = pasek zostaje widoczny, czyli stan sprzed zmiany. */
(function () {
  try {
    var pasek = document.querySelector('.sticky-reserve, .sticky-call');
    if (!pasek || !('IntersectionObserver' in window)) return;
    var cele = document.querySelectorAll('footer, .cta');
    if (!cele.length) return;
    var widoczne = 0;
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) { widoczne += w.isIntersecting ? 1 : -1; });
      if (widoczne < 0) widoczne = 0;
      pasek.classList.toggle('schowany', widoczne > 0);
    }, { threshold: 0.01 });
    cele.forEach(function (el) { io.observe(el); });
  } catch (e) {}
})();

/* === licznik otwarć demo (buy-signal) v3 — geo po stronie serwera === */
(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if(/crm-newbeginning|crm\.impulseo\.pl/.test(document.referrer||''))return;try{if(navigator.webdriver)return;}catch(e){}try{if(/^https?:\/\/(kris20032|impulseo-pl)\.github\.io\/?$/i.test(document.referrer||''))return;}catch(e){}if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/functions/v1/demo-view';try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null)})}).catch(function(){});}catch(e){}}catch(e){}})();
