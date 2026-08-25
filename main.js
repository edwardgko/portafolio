(function () {
  "use strict";

  const data = window.__BRAND__ || {};
  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  function initNav() {
    const nav = $(".nav");
    if (!nav) return;
    const on = () => { if (scrollY > 60) nav.classList.add("is-scrolled"); else nav.classList.remove("is-scrolled"); };
    on();
    window.addEventListener("scroll", on, { passive: true });
  }

  function initMobileMenu() {
    const burger = $("[data-menu-open]");
    const closeBtn = $("[data-menu-close]");
    const menu = $("[data-menu]");
    if (!burger || !menu) return;
    const open = () => menu.setAttribute("aria-hidden", "false");
    const close = () => menu.setAttribute("aria-hidden", "true");
    burger.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    $$("a", menu).forEach(a => a.addEventListener("click", close));
  }

  function initSmoothAnchors() {
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const navOffset = 76;
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth",
      });
    });
  }

  function initScrollProgress() {
    const bar = $("[data-scroll-progress]");
    if (!bar) return;
    let raf = null;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? scrollY / max : 0;
      bar.style.transform = "scaleX(" + pct + ")";
      raf = null;
    }
    window.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  function initReveals() {
    const els = $$("[data-reveal]");
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(el => io.observe(el));

    setTimeout(() => {
      els.forEach(el => {
        if (!el.classList.contains("is-revealed") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-revealed");
        }
      });
    }, 6000);
  }

  function initTilt() {
    if (!fineHover) return;
    $$(".project-card").forEach(card => {
      const MAX = 5;
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
      function loop() {
        cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
        card.style.setProperty("--rx", cx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  function initMagnetic() {
    if (!fineHover) return;
    $$("[data-magnetic]").forEach(el => {
      const strength = parseFloat(el.dataset.magneticStrength || "0.25");
      const inner = document.createElement("span");
      inner.className = "magnetic-inner";
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add("has-magnetic");
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) - r.width / 2) * strength;
        ty = ((e.clientY - r.top) - r.height / 2) * strength;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("mouseleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
      function loop() {
        cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
        inner.style.transform = "translate3d(" + cx + "px, " + cy + "px, 0)";
        raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  function initMockTabs() {
    $$("[data-tabs]").forEach(tabs => {
      const mock = tabs.closest(".browser-mock");
      if (!mock) return;
      const panels = $$("img[data-tab-panel]", mock);
      $$(".mock-tab", tabs).forEach(btn => {
        btn.addEventListener("click", () => {
          const target = btn.dataset.tab;
          $$(".mock-tab", tabs).forEach(b => {
            const active = b === btn;
            b.classList.toggle("is-active", active);
            b.setAttribute("aria-selected", String(active));
          });
          panels.forEach(p => p.classList.toggle("is-active", p.dataset.tabPanel === target));
        });
      });
    });
  }

  function initWorkCarousel() {
    const track = $("[data-carousel-track]");
    if (!track) return;
    const cards = $$(".project-card", track);
    if (!cards.length) return;
    const prevBtn = $("[data-carousel-prev]");
    const nextBtn = $("[data-carousel-next]");
    const dotsWrap = $("[data-carousel-dots]");

    function scrollToIndex(idx) {
      const i = Math.min(cards.length - 1, Math.max(0, idx));
      const card = cards[i];
      const delta = card.getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollTo({ left: track.scrollLeft + delta, behavior: reduced ? "auto" : "smooth" });
    }

    const dots = dotsWrap ? cards.map((card, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", "Ir al proyecto " + (i + 1));
      dot.addEventListener("click", () => scrollToIndex(i));
      dotsWrap.appendChild(dot);
      return dot;
    }) : [];

    function closestIndex() {
      const trackLeft = track.getBoundingClientRect().left;
      let best = 0, bestDist = Infinity;
      cards.forEach((card, i) => {
        const dist = Math.abs(card.getBoundingClientRect().left - trackLeft);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      return best;
    }

    function update() {
      const idx = closestIndex();
      dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
      const max = track.scrollWidth - track.clientWidth - 2;
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
      if (nextBtn) nextBtn.disabled = max <= 0 || track.scrollLeft >= max;
    }

    function go(dir) {
      scrollToIndex(closestIndex() + dir);
    }

    if (prevBtn) prevBtn.addEventListener("click", () => go(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => go(1));

    let raf = null;
    track.addEventListener("scroll", () => {
      if (!raf) raf = requestAnimationFrame(() => { update(); raf = null; });
    }, { passive: true });
    window.addEventListener("resize", () => { if (!raf) raf = requestAnimationFrame(() => { update(); raf = null; }); });

    update();
  }

  function initLightbox() {
    const dialog = $("[data-lightbox]");
    const imgEl = dialog && $("[data-lightbox-img]", dialog);
    if (!dialog || !imgEl) return;
    $$(".browser-mock__body").forEach(body => {
      body.addEventListener("click", () => {
        const active = body.querySelector("img.is-active") || body.querySelector("img");
        if (!active) return;
        imgEl.src = active.currentSrc || active.src;
        imgEl.alt = active.alt || "";
        if (typeof dialog.showModal === "function") dialog.showModal();
      });
    });
    const closeBtn = $("[data-lightbox-close]", dialog);
    if (closeBtn) closeBtn.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
  }

  function initCopyEmail() {
    const btn = $("[data-copy-email]");
    if (!btn || !data.email) return;
    const feedback = $(".copy-feedback", btn.parentElement);
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(data.email);
        if (feedback) {
          feedback.textContent = "¡Copiado!";
          feedback.classList.add("is-visible");
          setTimeout(() => feedback.classList.remove("is-visible"), 1800);
        }
      } catch (_) { /* clipboard unavailable — mailto link still works */ }
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    const el = $("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 3000);
  }

  function initMailFallback() {
    if (!data.email) return;
    $$('a[href^="mailto:"]').forEach(a => {
      a.addEventListener("click", () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(data.email).catch(() => {});
        }
        showToast("Se abrió tu cliente de correo — o copié " + data.email);
      });
    });
  }

  function boot() {
    safe(initNav, "initNav");
    safe(initMobileMenu, "initMobileMenu");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initScrollProgress, "initScrollProgress");
    safe(initReveals, "initReveals");
    safe(initTilt, "initTilt");
    safe(initMagnetic, "initMagnetic");
    safe(initMockTabs, "initMockTabs");
    safe(initWorkCarousel, "initWorkCarousel");
    safe(initLightbox, "initLightbox");
    safe(initCopyEmail, "initCopyEmail");
    safe(initMailFallback, "initMailFallback");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
