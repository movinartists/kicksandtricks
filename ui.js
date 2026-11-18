/* Kicksandtricks concept — UI: smooth scroll, reveals, event data binding */
(function(){
  var D = window.KT_DATA, html = document.documentElement;
  var reduced = html.classList.contains('reduced');
  function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  // ---------- event cards ----------
  var n = D.next, l = D.last, today = new Date(); today.setHours(0,0,0,0);
  var announced = n.status === 'announced' && n.dateISO && new Date(n.dateISO + 'T23:59:59') >= today;
  var nc = document.getElementById('next-card'), lc = document.getElementById('last-card');
  if (announced){
    nc.innerHTML = '<span class="label live">● Next event</span>' +
      '<h3 class="display big-t">' + esc(n.name || 'Kicksandtricks') + '</h3>' +
      '<dl class="kv mono"><dt>Date</dt><dd>' + esc(n.dateLabel) + '</dd><dt>Hours</dt><dd>' + esc(n.hours) + '</dd>' +
      '<dt>Venue</dt><dd>' + esc(n.venue) + '</dd><dt>Address</dt><dd>' + esc(n.address) + '</dd><dt>Entry</dt><dd>' + esc(n.price) + '</dd></dl>' +
      (n.ticketsUrl ? '<a class="btn btn-fire" target="_blank" rel="noopener" href="' + esc(n.ticketsUrl) + '">Get tickets ↗</a>' : '<a class="btn btn-fire" target="_blank" rel="noopener" href="' + D.instagram + '">Details on IG ↗</a>');
  } else {
    nc.innerHTML = '<span class="label live">● Next event</span>' +
      '<h3 class="display big-t">Next date<br>TBA</h3>' +
      '<p class="mono">' + esc(n.tbaNote) + '</p>' +
      '<p class="mono muted" style="margin-top:12px">Dates, venues and vendor calls drop on Instagram first.</p>' +
      '<a class="btn btn-fire" target="_blank" rel="noopener" href="' + D.instagram + '">Follow ' + esc(D.handle) + ' ↗</a>';
    var hb = document.querySelector('[data-bind="heroNext"]'); if (hb) hb.textContent = 'Next date TBA · follow ' + D.handle;
  }
  if (announced){ var hb2 = document.querySelector('[data-bind="heroNext"]'); if (hb2) hb2.textContent = 'Next: ' + n.dateLabel; }
  lc.innerHTML = '<span class="label past">Last event</span>' +
    '<h3 class="display">' + esc(l.name) + '</h3>' +
    '<dl class="kv mono"><dt>Date</dt><dd>' + esc(l.dateLabel) + '</dd><dt>Hours</dt><dd>' + esc(l.hours) + '</dd>' +
    '<dt>Venue</dt><dd>' + esc(l.venue) + '</dd><dt>Address</dt><dd>' + esc(l.address) + '</dd><dt>Entry</dt><dd>' + esc(l.price) + '</dd>' +
    '<dt>Tour</dt><dd>' + esc(l.tour) + '</dd></dl>' +
    '<p class="mono muted" style="font-size:11px">Vendors named on the listing</p><ul class="vend-list mono">' +
    l.vendors.map(function(v){return '<li>' + esc(v) + '</li>';}).join('') + '</ul>';

  // ---------- smooth scroll ----------
  var lenis = null;
  if (!reduced && window.Lenis){
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: false });
    window.ktLenis = lenis;
    if (window.gsap){
      lenis.on('scroll', function(){ window.ScrollTrigger && ScrollTrigger.update(); });
      gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener('click', function(e){ var id=a.getAttribute('href'); var t=id==='#top'?0:document.querySelector(id); if(t!==null){ e.preventDefault(); lenis.scrollTo(t,{offset:0,duration:1.6}); }});
    });
  }

  // ---------- reveals ----------
  if (window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    if (!reduced){
      gsap.from('.hero-left > *, .hero-right > *', {y:30, opacity:0, duration:1.1, ease:'power3.out', stagger:.08, delay:.15});
      document.querySelectorAll('.chap-text').forEach(function(el){
        var sec = el.closest('.sec');
        gsap.timeline({scrollTrigger:{trigger:sec, start:'top 55%', end:'bottom 45%', toggleActions:'play reverse play reverse'}})
          .from(el.children, {y:40, opacity:0, duration:.8, ease:'power3.out', stagger:.08});
      });
      gsap.utils.toArray('.block-head, .card, .timeline li, .photo-strip figure, .partner-list li, .tagline').forEach(function(el){
        gsap.from(el, {y:50, opacity:0, duration:.9, ease:'power3.out', scrollTrigger:{trigger:el, start:'top 88%'}});
      });
      gsap.from('.cat-grid li', {opacity:0, y:20, stagger:.03, duration:.5, scrollTrigger:{trigger:'.cat-grid', start:'top 85%'}});
      gsap.to('.m1', {xPercent:-8, ease:'none', scrollTrigger:{trigger:'.sfe', start:'top bottom', end:'bottom top', scrub:true}});
      gsap.fromTo('.m2', {xPercent:-8}, {xPercent:0, ease:'none', scrollTrigger:{trigger:'.sfe', start:'top bottom', end:'bottom top', scrub:true}});
    }
  }
})();
