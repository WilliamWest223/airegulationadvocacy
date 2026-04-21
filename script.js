(function () {
  "use strict";

  // ---------- CURSOR GLOW ----------
  const cursorGlow = document.getElementById("cursorGlow");
  if (cursorGlow) {
    document.addEventListener("mousemove", (e) => {
      cursorGlow.style.left = e.clientX + "px";
      cursorGlow.style.top = e.clientY + "px";
    });
  }

  // ---------- PROGRESS BAR & NAV ----------
  const progress = document.getElementById("progress");
  const nav = document.getElementById("nav");
  const hero = document.querySelector(".hero");

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = Math.min(100, (scrollTop / docHeight) * 100) + "%";

    const heroHeight = hero ? hero.offsetHeight : 600;
    nav.classList.toggle("visible", scrollTop > heroHeight * 0.7);

    updateChapterNav(scrollTop);
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- CHAPTER NAV ----------
  const sectionIds = ["top", "workforce", "education", "society", "action"];
  const dots = document.querySelectorAll(".chapter-dot");

  function updateChapterNav(scrollTop) {
    const threshold = scrollTop + window.innerHeight * 0.35;
    let active = 0;
    sectionIds.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= threshold) active = i;
    });
    dots.forEach((d, i) => d.classList.toggle("active", i === active));
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      const el = document.getElementById(sectionIds[i]);
      if (!el) return;
      const navH = nav.classList.contains("visible") ? 60 : 0;
      window.scrollTo({ top: el.offsetTop - navH, behavior: "smooth" });
    });
  });

  onScroll();

  // ---------- SMOOTH ANCHOR SCROLL ----------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = nav.classList.contains("visible") ? 64 : 0;
      window.scrollTo({ top: target.offsetTop - navH, behavior: "smooth" });
    });
  });

  // ---------- REVEAL ON SCROLL ----------
  const revealTargets = document.querySelectorAll(
    ".section-header, .section-lede, .stats-row, .split-left, .split-right, .principle-card, .cta"
  );
  revealTargets.forEach((t) => t.classList.add("reveal"));

  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("in"), i * 60);
          revealIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
  );
  revealTargets.forEach((t) => revealIO.observe(t));

  // ---------- COUNTER ANIMATION ----------
  const counters = document.querySelectorAll(".stat-pill-num[data-target]");
  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const duration = 1600;
        const start = performance.now();

        function tick(now) {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(eased * target);
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        counterIO.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((c) => counterIO.observe(c));

  // ---------- HERO PARTICLE CANVAS ----------
  const canvas = document.getElementById("heroCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    const COUNT = 70;
    const CONNECT_DIST = 110;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    new ResizeObserver(resize).observe(canvas.parentElement);

    canvas.parentElement.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    canvas.parentElement.addEventListener("mouseleave", () => {
      mouse = { x: -9999, y: -9999 };
    });

    class Particle {
      constructor() { this.reset(true); }
      reset(rand) {
        this.x = rand ? Math.random() * canvas.width : -10;
        this.y = rand ? Math.random() * canvas.height : Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.28;
        this.vy = (Math.random() - 0.5) * 0.28;
        this.r = Math.random() * 1.4 + 0.5;
        this.op = Math.random() * 0.35 + 0.08;
      }
      update() {
        const dx = this.x - mouse.x, dy = this.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 90) {
          const f = ((90 - d) / 90) * 0.45;
          this.vx += (dx / d) * f;
          this.vy += (dy / d) * f;
        }
        this.vx *= 0.975;
        this.vy *= 0.975;
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -20 || this.x > canvas.width + 20 ||
            this.y < -20 || this.y > canvas.height + 20) this.reset(false);
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(17,20,24,${this.op})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < COUNT; i++) particles.push(new Particle());

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CONNECT_DIST * CONNECT_DIST) {
            const alpha = (1 - Math.sqrt(d2) / CONNECT_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(17,20,24,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      particles.forEach((p) => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ---------- HERO SVG HORIZON ----------
  const heroSvg = document.querySelector(".hero-visual svg");
  if (heroSvg) {
    const NS = "http://www.w3.org/2000/svg";
    const orderly = heroSvg.querySelector("#orderly");
    const chaotic = heroSvg.querySelector("#chaotic");
    const cols = 13, rows = 10;
    const xS = 40, xE = 360, yT = 30, yH = 300;
    const sX = (xE - xS) / (cols - 1), sY = (yH - yT) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dot = document.createElementNS(NS, "circle");
        dot.setAttribute("cx", xS + c * sX);
        dot.setAttribute("cy", yT + r * sY);
        dot.setAttribute("r", 1.4);
        dot.setAttribute("opacity", 0.25 + (1 - r / rows) * 0.55);
        orderly.appendChild(dot);
      }
    }

    const cRows = 9, yB = 570;
    const sYc = (yB - yH) / cRows;
    for (let r = 0; r < cRows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < (r / cRows) * 0.45) continue;
        const j = (r / cRows) * 28;
        const dot = document.createElementNS(NS, "circle");
        dot.setAttribute("cx", xS + c * sX + (Math.random() - 0.5) * j * 2);
        dot.setAttribute("cy", yH + 8 + r * sYc + (Math.random() - 0.5) * j);
        dot.setAttribute("r", Math.max(0.8, 1.4 + (Math.random() - 0.5) * (r / cRows) * 2.5));
        dot.setAttribute("opacity", 0.55 - (r / cRows) * 0.35);
        dot.setAttribute("fill", "#C2410C");
        chaotic.appendChild(dot);
      }
    }
  }

  // ---------- CHARTS (lazy-init when in view) ----------
  if (typeof Chart === "undefined") return;

  Chart.defaults.font.family = '"IBM Plex Mono", monospace';
  Chart.defaults.color = "#6b6963";

  const C = {
    signal: "#C2410C",
    ink: "#111418",
    paper: "#f7f4ee",
    grid: "rgba(17,20,24,0.06)",
  };

  const tooltipDefaults = {
    backgroundColor: C.ink,
    titleColor: C.paper,
    bodyColor: "rgba(247,244,238,0.7)",
    padding: 10,
    cornerRadius: 0,
    borderColor: "rgba(194,65,12,0.3)",
    borderWidth: 1,
  };

  function lazyChart(id, initFn) {
    const el = document.getElementById(id);
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { initFn(el); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
  }

  // Workforce — horizontal bar
  lazyChart("workforceChart", (el) => {
    new Chart(el, {
      type: "bar",
      data: {
        labels: ["Technology", "Admin & Legal", "Finance", "Healthcare", "Education", "Manufacturing", "Retail"],
        datasets: [{
          label: "% of roles exposed",
          data: [72, 69, 58, 46, 41, 35, 28],
          backgroundColor: (ctx) =>
            ctx.raw >= 50 ? "rgba(194,65,12,0.82)" : "rgba(17,20,24,0.65)",
          borderColor: "transparent",
          borderRadius: 1,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 1100, easing: "easeOutQuart", delay: (ctx) => ctx.dataIndex * 80 },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipDefaults,
            callbacks: { label: (ctx) => `  ${ctx.raw}% of roles exposed to AI` },
          },
        },
        scales: {
          x: {
            max: 100,
            grid: { color: C.grid },
            border: { display: false },
            ticks: { callback: (v) => v + "%", font: { size: 10 } },
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 10 } },
          },
        },
      },
    });
  });

  // Education — line chart with fill
  lazyChart("educationChart", (el) => {
    const gCtx = el.getContext("2d");
    const grad = gCtx.createLinearGradient(0, 0, 0, 280);
    grad.addColorStop(0, "rgba(194,65,12,0.22)");
    grad.addColorStop(1, "rgba(194,65,12,0)");

    new Chart(el, {
      type: "line",
      data: {
        labels: ["2020", "2021", "2022", "2023", "2024", "2025", "2026*"],
        datasets: [{
          label: "% using AI tools",
          data: [5, 12, 28, 51, 68, 79, 85],
          borderColor: C.signal,
          backgroundColor: grad,
          borderWidth: 2,
          pointBackgroundColor: C.signal,
          pointBorderColor: C.paper,
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 1400, easing: "easeOutQuart" },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipDefaults,
            callbacks: { label: (ctx) => `  ${ctx.raw}% of students` },
          },
        },
        scales: {
          x: {
            grid: { color: C.grid },
            border: { display: false },
            ticks: { font: { size: 10 } },
          },
          y: {
            max: 100,
            grid: { color: C.grid },
            border: { display: false },
            ticks: { callback: (v) => v + "%", font: { size: 10 } },
          },
        },
      },
    });
  });

  // Society — doughnut
  lazyChart("societyChart", (el) => {
    new Chart(el, {
      type: "doughnut",
      data: {
        labels: ["Big Tech (Top 5)", "Mid-tier Tech", "Open Source / Others"],
        datasets: [{
          data: [78, 14, 8],
          backgroundColor: [C.signal, "#2a2d33", "#9a8f82"],
          borderColor: "#efeade",
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        cutout: "74%",
        animation: { animateRotate: true, duration: 1300, easing: "easeOutQuart" },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipDefaults,
            callbacks: { label: (ctx) => `  ${ctx.raw}% of AI infrastructure` },
          },
        },
      },
    });
  });
})();
