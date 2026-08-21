var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tabs ---------- */

  var buttons = document.querySelectorAll('.tab-btn[data-tab]');
  var panels = document.querySelectorAll('.panel');

  function activateTab(key) {
    buttons.forEach(function (b) { b.classList.toggle('active', b.dataset.tab === key); });
    panels.forEach(function (p) {
      if (p.id === 'panel-' + key) {
        p.classList.add('active');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { p.classList.add('panel-in'); updateRail(); });
        });
      } else {
        p.classList.remove('active', 'panel-in');
      }
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activateTab(btn.dataset.tab);
      document.getElementById('tabbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- counters ---------- */

  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10);
    if (reduceMotion) { el.textContent = target; return; }
    var start = null;
    var duration = 900;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- reveal on scroll ---------- */

  var revealEls = document.querySelectorAll('.reveal');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        entry.target.querySelectorAll('[data-count-to]').forEach(function (c) {
          if (!c.dataset.done) { c.dataset.done = '1'; runCounter(c); }
        });
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(function (el) { io.observe(el); });

  document.querySelectorAll('.panel.active .reveal').forEach(function (el) {
    el.classList.add('in-view');
  });

  /* ---------- scroll rail ---------- */

  var railTrack = document.querySelector('.rail-track');
  var railFill = document.getElementById('railFill');
  var railRocket = document.getElementById('railRocket');

  function updateRail() {
    if (!railTrack) return;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
    var trackH = railTrack.clientHeight;
    railFill.style.height = (progress * 100) + '%';
    railRocket.style.top = (progress * trackH) + 'px';
  }

  /* ---------- o rail so aparece depois da barra de abas ---------- */

  var railEl = document.getElementById('scrollRail');
  var tabbarEl = document.getElementById('tabbar');

  function atualizaRail() {
    if (!railEl || !tabbarEl) return;
    var gatilho = tabbarEl.offsetTop + tabbarEl.offsetHeight;
    var y = window.scrollY || document.documentElement.scrollTop;
    railEl.classList.toggle('rail-ativo', y > gatilho);
  }

  /* ---------- hero parallax (liftoff on scroll) ---------- */

  var heroParallax = document.getElementById('heroParallax');
  var heroEl = document.querySelector('.hero');

  function updateHeroParallax() {
    if (reduceMotion || !heroParallax) return;
    var h = heroEl.offsetHeight;
    var y = window.scrollY || document.documentElement.scrollTop;
    var progress = Math.min(Math.max(y / h, 0), 1);
    heroParallax.style.transform = 'translateY(' + (progress * -60) + 'px)';
    heroParallax.style.opacity = String(1 - progress * 1.1);
  }

  window.addEventListener('scroll', function () { updateRail(); updateHeroParallax(); atualizaRail(); }, { passive: true });
  window.addEventListener('resize', function () { updateRail(); updateHeroParallax(); atualizaRail(); });
  updateRail();
  updateHeroParallax();
  atualizaRail();

  /* ---------- 3D tilt on benefit cards ---------- */

  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.benefit-item').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--rx', (px * 10) + 'deg');
        card.style.setProperty('--ry', (py * -10) + 'deg');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- living background: constellation canvas ---------- */

  (function () {
    var canvas = document.getElementById('bgCanvas');
    var ctx = canvas.getContext('2d');
    var W, H, DPR;
    var particles = [];
    var mouse = { x: null, y: null };

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function initParticles() {
      var count = Math.min(85, Math.floor((W * H) / 17000));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.3 + 0.6
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 125) {
            ctx.strokeStyle = 'rgba(76,138,255,' + (0.16 * (1 - dist / 125)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        if (mouse.x !== null) {
          var mdx = p.x - mouse.x, mdy = p.y - mouse.y;
          var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 170) {
            ctx.strokeStyle = 'rgba(147,182,255,' + (0.4 * (1 - mdist / 170)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = 'rgba(147,182,255,0.75)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(frame);
    }

    window.addEventListener('resize', function () { resize(); initParticles(); });
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseleave', function () { mouse.x = null; mouse.y = null; });
    window.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
    }, { passive: true });

    resize();
    initParticles();
    frame();
  })();
