/* NSBJJ homepage enhancements (no dependencies, ~3 KB):
   1. "We win together" photo slider: native scroll-snap (swipe works without JS), arrows, dots, auto-advance
      that pauses on hover/focus/touch, when off-screen or hidden, and never runs with prefers-reduced-motion.
   2. Inline self-hosted film: swaps the poster link for a <video> on click.
   3. "This week" timetable day tabs (opens on today). */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Slider */
  document.querySelectorAll('.story').forEach(function (root) {
    var track = root.querySelector('.story-track');
    var slides = [].slice.call(track.children);
    var ui = root.querySelector('.story-ui');
    if (!track || slides.length < 2 || !ui) return;
    ui.hidden = false;
    root.classList.add('is-enhanced');
    var dotsWrap = ui.querySelector('.story-dots');
    var toggle = ui.querySelector('.story-toggle');
    var interval = +root.getAttribute('data-interval') || 6000;
    var current = 0, timer = null, userPaused = reduce, hover = false, visible = false;

    var dots = slides.map(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'story-dot';
      b.setAttribute('aria-label', 'Photo ' + (i + 1) + ': ' + (s.querySelector('figcaption b') || {}).textContent);
      b.addEventListener('click', function () { go(i); stopForGood(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function mark(i) {
      current = i;
      dots.forEach(function (d, j) { d.setAttribute('aria-current', j === i ? 'true' : 'false'); });
      slides.forEach(function (s, j) { s.setAttribute('aria-hidden', j === i ? 'false' : 'true'); s.inert = j !== i; });
    }
    function go(i, smooth) {
      i = (i + slides.length) % slides.length;
      track.scrollTo({ left: i * track.clientWidth, behavior: (reduce || smooth === false) ? 'auto' : 'smooth' });
      mark(i);
    }
    function running() { return !userPaused && !hover && visible && !document.hidden; }
    function tick() {
      clearTimeout(timer);
      if (running()) timer = setTimeout(function () { go(current + 1); tick(); }, interval);
      track.setAttribute('aria-live', userPaused ? 'polite' : 'off');
    }
    function setPaused(p) {
      userPaused = p;
      root.classList.toggle('is-paused', p);
      toggle.setAttribute('aria-label', toggle.getAttribute(p ? 'data-label-play' : 'data-label-pause'));
      tick();
    }
    function stopForGood() { setPaused(true); }

    ui.querySelector('.story-prev').addEventListener('click', function () { go(current - 1); stopForGood(); });
    ui.querySelector('.story-next').addEventListener('click', function () { go(current + 1); stopForGood(); });
    toggle.addEventListener('click', function () { setPaused(!userPaused); });

    /* keep state in sync with swipes / trackpad scrolls */
    var st;
    track.addEventListener('scroll', function () {
      clearTimeout(st);
      st = setTimeout(function () {
        var i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== current && slides[i]) mark(i);
      }, 80);
    }, { passive: true });
    track.addEventListener('touchstart', function () { stopForGood(); }, { passive: true });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(current - 1); stopForGood(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(current + 1); stopForGood(); e.preventDefault(); }
    });
    root.addEventListener('mouseenter', function () { hover = true; tick(); });
    root.addEventListener('mouseleave', function () { hover = false; tick(); });
    root.addEventListener('focusin', function () { hover = true; tick(); });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) { hover = false; tick(); } });
    document.addEventListener('visibilitychange', tick);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; tick(); }, { threshold: 0.4 }).observe(root);
    } else { visible = true; }
    window.addEventListener('resize', function () { go(current, false); });

    mark(0);
    setPaused(userPaused);
  });

  /* 2. Inline video */
  document.querySelectorAll('[data-inline-video]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var v = document.createElement('video');
      v.className = 'video-el';
      v.controls = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
      v.setAttribute('playsinline', '');
      v.poster = a.getAttribute('data-poster') || '';
      v.setAttribute('aria-label', 'Welcome to NSBJJ, film');
      v.src = a.getAttribute('data-inline-video');
      var box = document.createElement('div');
      box.className = a.className.replace('rv', '') + ' is-playing';
      box.appendChild(v);
      a.parentNode.replaceChild(box, a);
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      v.focus();
    });
  });

  /* 3. Timetable tabs */
  document.querySelectorAll('.tt-static').forEach(function (box) {
    var tabs = [].slice.call(box.querySelectorAll('[role=tab]'));
    if (!tabs.length) return;
    box.classList.add('is-tabbed');
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length;
        if (k === 'ArrowRight' || k === 'ArrowLeft' || k === 'Home' || k === 'End') {
          e.preventDefault();
          select(k === 'Home' ? 0 : k === 'End' ? n - 1 : (i + (k === 'ArrowRight' ? 1 : -1) + n) % n, true);
        }
      });
    });
    select((new Date().getDay() + 6) % 7); /* Monday = 0 */
  });
  /* 4. Review arrows and keyboard navigation, alongside native swipe/scroll. */
  document.querySelectorAll('#reviews').forEach(function(root){
    var track=root.querySelector('.reviews'),controls=root.querySelector('.review-controls');
    if(!track||!controls||track.children.length<2)return;
    var prev=controls.querySelector('.review-prev'),next=controls.querySelector('.review-next'),status=controls.querySelector('.review-position');
    controls.hidden=false;
    function stride(){return track.children[1].offsetLeft-track.children[0].offsetLeft;}
    function update(){var step=stride(),i=step?Math.round(track.scrollLeft/step):0;prev.disabled=track.scrollLeft<=1;next.disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-1;status.textContent='Review '+Math.min(i+1,track.children.length)+' of '+track.children.length;}
    function move(direction){track.scrollBy({left:direction*stride(),behavior:reduce?'auto':'smooth'});}
    prev.addEventListener('click',function(){move(-1);});next.addEventListener('click',function(){move(1);});
    track.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
    var timer;track.addEventListener('scroll',function(){clearTimeout(timer);timer=setTimeout(update,100);},{passive:true});
    window.addEventListener('resize',update);update();
  });
})();
