/**
 * GHOSTS VINTAGE — Custom Animations & Effects
 * Dark luxury aesthetic · Last Crumb inspired
 *
 * Features:
 *  - Page intro sequence (logo reveal + wipe-out)
 *  - Custom magnetic cursor (dot + ring)
 *  - Header: transparent → opaque on scroll, hide/show on direction
 *  - Scroll-reveal via IntersectionObserver (all sections stagger in)
 *  - Hero parallax (background shifts at 0.35× scroll speed)
 *  - Page transition overlay on internal link clicks
 */

(function () {
  'use strict';

  /* =========================================================
     UTILITIES
     ========================================================= */

  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const isMobile = () => window.innerWidth < 750 || !window.matchMedia('(hover: hover)').matches;
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1. PAGE INTRO
     ========================================================= */

  function initIntro() {
    const intro = qs('.gv-intro');
    if (!intro || sessionStorage.getItem('gv-intro-done')) {
      if (intro) intro.remove();
      revealPage();
      return;
    }

    // Prevent body scroll while intro plays
    document.documentElement.style.overflow = 'hidden';

    // Step 1: show logo
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        intro.classList.add('gv-intro--show');
      });
    });

    // Step 2: after logo settles, wipe the intro away
    const holdTime = prefersReducedMotion() ? 100 : 1300;
    setTimeout(() => {
      intro.classList.add('gv-intro--exit');
      intro.addEventListener('animationend', () => {
        intro.remove();
        document.documentElement.style.overflow = '';
        sessionStorage.setItem('gv-intro-done', '1');
        revealPage();
      }, { once: true });
    }, holdTime);
  }

  function revealPage() {
    // Kick off scroll reveal now that page is visible
    initScrollReveal();
    initHeroParallax();
  }

  /* =========================================================
     2. CUSTOM CURSOR
     ========================================================= */

  function initCursor() {
    if (isMobile()) return;

    const dot  = qs('.gv-cursor');
    const ring = qs('.gv-cursor-ring');
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let rafId;

    // Track mouse position exactly for the dot
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top  = mouseY + 'px';
    });

    // Smoothly lag the ring (lerp)
    function animateRing() {
      ringX += (mouseX - ringX) * 0.14;
      ringY += (mouseY - ringY) * 0.14;
      ring.style.left = ringX + 'px';
      ring.style.top  = ringY + 'px';
      rafId = requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover state on interactive elements
    const interactiveSelectors = [
      'a', 'button', '[role="button"]', 'label',
      'input[type="submit"]', '.button', '.product-card',
      '.collection-card', '.header-logo', 'select'
    ].join(', ');

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        document.body.classList.add('gv-cursor--link');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        document.body.classList.remove('gv-cursor--link');
      }
    });

    // Click pulse
    document.addEventListener('mousedown', () => document.body.classList.add('gv-cursor--click'));
    document.addEventListener('mouseup',   () => document.body.classList.remove('gv-cursor--click'));

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
  }

  /* =========================================================
     3. HEADER — scroll direction + transparency
     ========================================================= */

  function initHeader() {
    const headerGroup = qs('#header-group');
    if (!headerGroup) return;

    const template = document.body.dataset.template || '';
    const isHome = template === 'index' || qs('[data-template="index"]');

    let lastScrollY = window.scrollY;
    let ticking = false;
    const SCROLL_THRESHOLD = 80;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta    = currentY - lastScrollY;

        // Toggle scrolled state (for homepage transparent → opaque)
        if (currentY > SCROLL_THRESHOLD) {
          headerGroup.classList.add('gv-header--scrolled');
        } else {
          headerGroup.classList.remove('gv-header--scrolled');
        }

        // Hide header when scrolling down past threshold; reveal when scrolling up
        if (currentY > 200) {
          if (delta > 4) {
            headerGroup.classList.add('gv-header--hidden');
          } else if (delta < -4) {
            headerGroup.classList.remove('gv-header--hidden');
          }
        } else {
          headerGroup.classList.remove('gv-header--hidden');
        }

        lastScrollY = currentY;
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Set initial body template attribute for CSS targeting
    document.body.dataset.template = template;
  }

  /* =========================================================
     4. SCROLL REVEAL
     ========================================================= */

  function initScrollReveal() {
    if (prefersReducedMotion()) {
      // Skip animation, just show everything
      qsa('.gv-reveal, .gv-reveal-left, .gv-reveal-right, .gv-reveal-scale')
        .forEach(el => el.classList.add('gv-in'));
      return;
    }

    // Auto-tag all shopify sections and cards that aren't already tagged
    const autoRevealTargets = [
      '.shopify-section > .section',
      '.shopify-section > [class*="hero"]',
      '.product-card',
      '.collection-card',
      '.featured-blog-posts-card',
      '.blog-post-card',
      '[class*="section__header"]',
      '.section-header',
    ];

    autoRevealTargets.forEach(sel => {
      qsa(sel).forEach(el => {
        if (!el.closest('.gv-reveal') && !el.classList.contains('gv-reveal')) {
          el.classList.add('gv-reveal');
        }
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('gv-in');
          // Once revealed, stop observing
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.08
    });

    qsa('.gv-reveal, .gv-reveal-left, .gv-reveal-right, .gv-reveal-scale')
      .forEach(el => observer.observe(el));

    // Also stagger product grids
    const productGrids = qsa('.resource-list, .product-list');
    productGrids.forEach(grid => {
      const cards = qsa('.product-card, .collection-card', grid);
      cards.forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.08}s`;
        if (!card.classList.contains('gv-in')) {
          observer.observe(card);
        }
      });
    });
  }

  /* =========================================================
     5. HERO PARALLAX
     ========================================================= */

  function initHeroParallax() {
    if (prefersReducedMotion() || isMobile()) return;

    const heroMedias = qsa('.hero-section .background-media, .hero__media, [class*="hero"] .media');
    if (!heroMedias.length) return;

    let rafId;

    function onScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        heroMedias.forEach(media => {
          const rect = media.closest('[class*="section"]')?.getBoundingClientRect();
          if (!rect || rect.bottom < 0) return;
          // Shift the media layer at 35% of scroll speed
          const offset = scrollY * 0.35;
          media.style.transform = `translateY(${offset}px)`;
        });
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* =========================================================
     6. PAGE TRANSITION
     ========================================================= */

  function initPageTransition() {
    const overlay = qs('.gv-page-transition');
    if (!overlay || prefersReducedMotion()) return;

    // Slide overlay out on page load (in-transition)
    overlay.classList.add('gv-page-transition--in');
    overlay.addEventListener('animationend', () => {
      overlay.classList.remove('gv-page-transition--in');
    }, { once: true });

    // Intercept internal links
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const isInternal =
        href &&
        !href.startsWith('#') &&
        !href.startsWith('mailto:') &&
        !href.startsWith('tel:') &&
        !anchor.hasAttribute('target') &&
        (href.startsWith('/') || href.startsWith(window.location.origin));

      if (!isInternal) return;

      e.preventDefault();
      overlay.classList.add('gv-page-transition--out');
      overlay.addEventListener('transitionend', () => {
        window.location.href = href;
      }, { once: true });
    });
  }

  /* =========================================================
     7. MARQUEE — duplicate content so it loops seamlessly
     ========================================================= */

  function initMarquee() {
    const tracks = qsa('.gv-marquee-track');
    tracks.forEach(track => {
      if (track.dataset.duplicated) return;
      // Duplicate children for infinite loop
      const children = [...track.children];
      children.forEach(child => {
        const clone = child.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
      track.dataset.duplicated = 'true';
    });
  }

  /* =========================================================
     8. PRODUCT IMAGE — secondary image swap on card hover
     ========================================================= */

  function initImageSwap() {
    qsa('.product-card, .card--product').forEach(card => {
      const imgs = qsa('img', card);
      if (imgs.length < 2) return;

      const primary   = imgs[0];
      const secondary = imgs[1];

      secondary.style.position = 'absolute';
      secondary.style.inset = '0';
      secondary.style.opacity = '0';
      secondary.style.transition = 'opacity 0.4s ease';
      secondary.style.objectFit = 'cover';

      card.addEventListener('mouseenter', () => { secondary.style.opacity = '1'; });
      card.addEventListener('mouseleave', () => { secondary.style.opacity = '0'; });
    });
  }

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    initIntro();
    initCursor();
    initHeader();
    initPageTransition();
    initMarquee();
    initImageSwap();
    // scrollReveal & parallax called after intro completes (in revealPage)
    // but also run immediately if no intro:
    if (sessionStorage.getItem('gv-intro-done')) {
      initScrollReveal();
      initHeroParallax();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
