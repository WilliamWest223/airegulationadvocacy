(function () {
  "use strict";

  // ---------- PROGRESS BAR ----------
  const progress = document.getElementById("progress");
  const nav = document.getElementById("nav");
  const hero = document.querySelector(".hero");

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
    progress.style.width = pct + "%";

    // Show nav after scrolling past 70% of hero
    const heroHeight = hero ? hero.offsetHeight : 600;
    if (scrollTop > heroHeight * 0.7) {
      nav.classList.add("visible");
    } else {
      nav.classList.remove("visible");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- REVEAL ON SCROLL ----------
  const targets = document.querySelectorAll(
    ".section-header, .section-lede, .stat-block, .pullquote, .comparison, .two-col, .concentration-viz, .principle-card, .cta, .section-close"
  );
  targets.forEach((t) => t.classList.add("reveal"));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("in"), i * 40);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  targets.forEach((t) => io.observe(t));

  // ---------- HERO HORIZON VISUAL ----------
  // Build an SVG of dots that are orderly above the horizon and drift chaotically below it.
  const heroSvg = document.querySelector(".hero-visual svg");
  if (heroSvg) {
    const svgNS = "http://www.w3.org/2000/svg";
    const orderly = heroSvg.querySelector("#orderly");
    const chaotic = heroSvg.querySelector("#chaotic");

    const cols = 13;
    const rows = 10;
    const xStart = 40, xEnd = 360;
    const yTop = 30, yHorizon = 300;
    const stepX = (xEnd - xStart) / (cols - 1);
    const stepY = (yHorizon - yTop) / rows;

    // Orderly grid above horizon
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = xStart + c * stepX;
        const cy = yTop + r * stepY;
        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", cx);
        dot.setAttribute("cy", cy);
        dot.setAttribute("r", 1.4);
        // Subtle fade as they approach horizon (most visible at top, fading near horizon)
        const fade = 0.25 + (1 - r / rows) * 0.55;
        dot.setAttribute("opacity", fade);
        orderly.appendChild(dot);
      }
    }

    // Chaotic dots below horizon — random scatter, signal-colored
    const chaoticRows = 9;
    const yBottom = 570;
    const stepYc = (yBottom - yHorizon) / chaoticRows;
    for (let r = 0; r < chaoticRows; r++) {
      for (let c = 0; c < cols; c++) {
        // Increasing jitter with depth
        const jitterAmt = (r / chaoticRows) * 28;
        const baseX = xStart + c * stepX;
        const baseY = yHorizon + 8 + r * stepYc;
        const jx = (Math.random() - 0.5) * jitterAmt * 2;
        const jy = (Math.random() - 0.5) * jitterAmt;
        // Some drop out entirely as chaos increases
        if (Math.random() < r / chaoticRows * 0.45) continue;

        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", baseX + jx);
        dot.setAttribute("cy", baseY + jy);
        // Radius varies more with depth
        const rad = 1.4 + (Math.random() - 0.5) * (r / chaoticRows) * 2.5;
        dot.setAttribute("r", Math.max(0.8, rad));
        const fade = 0.55 - (r / chaoticRows) * 0.35;
        dot.setAttribute("opacity", fade);
        dot.setAttribute("fill", "#C2410C");
        chaotic.appendChild(dot);
      }
    }
  }

  // ---------- SMOOTH ANCHOR SCROLL (with nav offset) ----------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = nav.classList.contains("visible") ? 60 : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
})();
