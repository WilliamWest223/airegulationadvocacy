(function () {
  "use strict";

  // ---------- CURSOR GLOW ----------
  const cursorGlow = document.getElementById("cursorGlow");
  if (cursorGlow) {
    document.addEventListener("mousemove", (e) => {
      cursorGlow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    }, { passive: true });
  }

  // ---------- CANVAS VISIBILITY OBSERVER ----------
  let isHeroVisible = true;
  let isMatrixVisible = false;
  const canvasObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.target.id === 'heroCanvas') isHeroVisible = entry.isIntersecting;
      if (entry.target.id === 'matrixCanvas') isMatrixVisible = entry.isIntersecting;
    });
  }, { rootMargin: "200px" });

  // ---------- PROGRESS BAR & NAV ----------
  const progress = document.getElementById("progress");
  const nav = document.getElementById("nav");
  const hero = document.querySelector(".hero");
  let cachedHeroHeight = hero ? hero.offsetHeight : 600;
  
  window.addEventListener('resize', () => {
    if (hero) cachedHeroHeight = hero.offsetHeight;
  }, { passive: true });

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = Math.min(100, (scrollTop / docHeight) * 100) + "%";

    nav.classList.toggle("visible", scrollTop > cachedHeroHeight * 0.7);

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

    canvasObserver.observe(canvas);

    function animate() {
      if (isHeroVisible) {
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
      }
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
          borderWidth: 3,
          pointBackgroundColor: C.signal,
          pointBorderColor: C.paper,
          pointBorderWidth: 2,
          pointRadius: 6,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { 
          duration: 1400, 
          easing: "easeOutQuart",
          delay: (ctx) => ctx.dataIndex * 80 
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipDefaults,
            callbacks: { label: (ctx) => `  ${ctx.raw}% of students` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
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
          borderColor: C.paper,
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        cutout: "65%",
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

  // ---------- TEXT SCRAMBLE EFFECT ----------
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const scrambleTargets = document.querySelectorAll('.section-title');
  
  const scrambleIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        let iterations = 0;
        const originalText = el.dataset.value || el.textContent.trim();
        if (!el.dataset.value) el.dataset.value = originalText;
        
        clearInterval(el.interval);
        
        el.interval = setInterval(() => {
          el.textContent = originalText
            .split("")
            .map((letter, index) => {
              if (index < iterations || letter === " ") {
                return originalText[index];
              }
              return letters[Math.floor(Math.random() * 26)];
            })
            .join("");
          
          if (iterations >= originalText.length) clearInterval(el.interval);
          iterations += 1 / 2;
        }, 30);
        
        scrambleIO.unobserve(el);
      }
    });
  }, { threshold: 0.15 });
  
  scrambleTargets.forEach(t => scrambleIO.observe(t));

  // ---------- MAGNETIC BUTTON EFFECT ----------
  const magneticEls = document.querySelectorAll('.cta-button');
  magneticEls.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = `translate(0px, 0px)`;
    });
  });

  // ---------- 3D TILT ON CARDS ----------
  const cards = document.querySelectorAll('.principle-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`; 
    });
  });

  // ---------- TERMINAL TYPING EFFECT ----------
  const heroSub = document.querySelector('.hero-sub-head');
  if (heroSub) {
    const text = heroSub.textContent.trim();
    heroSub.textContent = "";
    let i = 0;
    // wait for hero animation to complete before typing
    setTimeout(() => {
      const typeInterval = setInterval(() => {
        heroSub.textContent = text.slice(0, i + 1);
        i++;
        if (i >= text.length) {
          clearInterval(typeInterval);
        }
      }, 35);
    }, 1100);
  }

  // ---------- MATRIX RAIN ----------
  const mCanvas = document.getElementById('matrixCanvas');
  if (mCanvas) {
    const mCtx = mCanvas.getContext('2d');
    
    function resizeMatrix() {
      mCanvas.width = mCanvas.parentElement.offsetWidth;
      mCanvas.height = mCanvas.parentElement.offsetHeight;
    }
    resizeMatrix();
    window.addEventListener('resize', resizeMatrix);

    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const fontSize = 16;
    let columns = mCanvas.width / fontSize;
    let drops = [];
    for(let x = 0; x < columns; x++) {
      drops[x] = Math.random() * mCanvas.height; 
    }

    // handle resize
    window.addEventListener('resize', () => {
      columns = mCanvas.width / fontSize;
      const newDrops = [];
      for(let x = 0; x < columns; x++) {
        newDrops[x] = drops[x] || Math.random() * mCanvas.height; 
      }
      drops = newDrops;
    });

    canvasObserver.observe(mCanvas);

    setInterval(() => {
      if (!isMatrixVisible) return;
      
      mCtx.fillStyle = 'rgba(17, 20, 24, 0.1)'; // faint ink
      mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
      
      mCtx.fillStyle = 'rgba(247, 244, 238, 0.18)'; // paper, faint
      mCtx.font = fontSize + 'px "IBM Plex Mono", monospace';
      
      for(let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        mCtx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if(drops[i] * fontSize > mCanvas.height && Math.random() > 0.985) {
          drops[i] = 0;
        }
        drops[i] += 0.65;
      }
    }, 35);
  }
  // ---------- ARTICLE MODAL LOGIC ----------
  const articlesData = {
    "1": {
      title: "Global Jobs Exposed to AI Disruption",
      body: "<p>According to recent IMF analysis, nearly 40% of global employment is exposed to AI, rising to 60% in advanced economies. Unlike previous waves of automation that primarily affected manual labor, generative AI directly impacts high-skill cognitive roles.</p><p>This disruption threatens to exacerbate inequality, rewarding those who can seamlessly integrate AI into their workflows while displacing workers whose core tasks are fully automated. The transition requires unprecedented investment in reskilling frameworks.</p>",
      chartConfig: {
        type: 'bar',
        data: {
          labels: ['Advanced Econ.', 'Emerging Mkts.', 'Low-Income'],
          datasets: [{
            label: '% of Jobs Exposed',
            data: [60, 40, 26],
            backgroundColor: ['rgba(194,65,12,0.9)', 'rgba(194,65,12,0.5)', 'rgba(17,20,24,0.3)'],
            borderRadius: 4
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { legend: { display: false } },
          scales: { 
            y: { max: 100, title: { display: true, text: 'Exposure (%)' } },
            x: { grid: { display: false } }
          } 
        }
      }
    },
    "2": {
      title: "The Ubiquity of AI in Education",
      body: "<p>By 2026, an estimated 85% of university students actively utilize AI tools for academic research, writing, and problem-solving. This rapid adoption outpaces institutional policy, creating a 'shadow curriculum' where the mechanics of learning are outsourced to algorithms.</p><p>While these tools offer personalized tutoring, they risk short-circuiting the productive struggle necessary for cognitive development. We face a future where students can produce flawless outputs without internalizing the underlying concepts.</p>",
      chartConfig: {
        type: 'radar',
        data: {
          labels: ['Writing', 'Coding', 'Research', 'Math', 'Language', 'Arts'],
          datasets: [{
            label: 'Adoption Rate (%)',
            data: [92, 88, 85, 70, 78, 45],
            backgroundColor: 'rgba(194,65,12,0.15)',
            borderColor: '#C2410C',
            borderWidth: 2,
            pointBackgroundColor: '#C2410C',
            pointRadius: 4
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { legend: { display: false } },
          scales: { 
            r: { 
              angleLines: { color: 'rgba(17,20,24,0.08)' }, 
              grid: { color: 'rgba(17,20,24,0.08)' },
              ticks: { display: false },
              pointLabels: { font: { size: 11 } }
            } 
          } 
        }
      }
    },
    "3": {
      title: "The Centralization of AI Infrastructure",
      body: "<p>The foundation models driving the AI revolution require astronomical computational resources. Consequently, the top 5 tech giants effectively control the vast majority of AI infrastructure, from silicon to cloud computing to training data.</p><p>This market concentration creates a dangerous bottleneck for innovation. It risks establishing a neo-feudal digital landscape where a handful of unelected corporate entities dictate the rules, access, and pricing of society's most critical new utility.</p>",
      chartConfig: {
        type: 'bar',
        data: {
          labels: ['Compute Power', 'Training Data', 'Capital Funding'],
          datasets: [
            { label: 'Big Tech Giants', data: [98, 92, 95], backgroundColor: 'rgba(194,65,12,0.9)', borderRadius: 2 },
            { label: 'Average Startup', data: [12, 18, 5], backgroundColor: 'rgba(17,20,24,0.7)', borderRadius: 2 }
          ]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          indexAxis: 'y',
          plugins: { tooltip: { mode: 'index', intersect: false } },
          scales: { 
            x: { max: 100, title: { display: true, text: 'Resource Scale (%)' } },
            y: { grid: { display: false } }
          }
        }
      }
    },
    "4": {
      title: "Algorithmic Filtering in Hiring",
      body: "<p>Modern HR departments are overwhelmed, leading to the widespread deployment of AI resume screening systems that process millions of applications daily. These proprietary algorithms act as opaque gatekeepers to the workforce.</p><p>Because they are trained on historical hiring data, they frequently replicate and scale past biases. Candidates are often discarded for arbitrary correlations—such as zip code, specific keywords, or gaps in employment—without ever being evaluated by a human being.</p>",
      chartConfig: {
        type: 'bar',
        data: {
          labels: ['Received', 'AI Filtered', 'Human Review', 'Interviewed', 'Hired'],
          datasets: [{
            label: 'Candidates',
            data: [10000, 1500, 300, 45, 5],
            backgroundColor: ['#111418', '#2a2d33', '#6b6963', '#C2410C', '#9a3308']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      }
    },
    "5": {
      title: "The Bias in AI Detection",
      body: "<p>In an attempt to police the use of generative AI, institutions rely on AI text detection tools. However, rigorous testing reveals these tools are fundamentally flawed and disproportionately flag the work of non-native English speakers as 'AI-generated.'</p><p>This false-positive bias stems from the fact that non-native speakers often utilize simpler vocabulary and more predictable sentence structures—the exact metrics these detectors use to identify algorithmic generation. The result is systemic academic penalization of international students.</p>",
      chartConfig: {
        type: 'scatter',
        data: {
          datasets: [
            { label: 'Native Speakers', data: [{x: 10, y: 5}, {x: 20, y: 8}, {x: 30, y: 12}, {x: 40, y: 18}, {x: 50, y: 22}], backgroundColor: 'rgba(17,20,24,0.7)' },
            { label: 'Non-Native Speakers', data: [{x: 15, y: 45}, {x: 25, y: 62}, {x: 35, y: 78}, {x: 45, y: 88}, {x: 55, y: 94}], backgroundColor: 'rgba(194,65,12,0.9)' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Text Predictability Score' } }, y: { title: { display: true, text: 'AI Flagged Probability (%)' } } } }
      }
    },
    "6": {
      title: "The Academic Witch Hunt",
      body: "<p>Instead of adapting to new technology, some professors have taken to blindly feeding student papers into 'AI detection' software that is scientifically proven to be wildly inaccurate. These black-box systems essentially act as random number generators, completely failing to understand nuance or context.</p><p>By treating these flawed detectors as absolute truth, lazy educators are falsely accusing innocent students of academic dishonesty—destroying academic records based on the flip of an algorithmic coin rather than doing the actual work of evaluating student progress.</p>",
      chartConfig: {
        type: 'doughnut',
        data: {
          labels: ['False Positives', 'Accurate Detections', 'False Negatives'],
          datasets: [{
            data: [45, 35, 20],
            backgroundColor: ['rgba(194,65,12,0.9)', 'rgba(17,20,24,0.7)', 'rgba(107,105,99,0.5)'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { position: 'bottom' } } }
      }
    }
  };

  const modal = document.getElementById('articleModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalCanvas = document.getElementById('modalCanvas');
  const closeBtn = document.getElementById('modalClose');
  const backdrop = document.getElementById('modalBackdrop');
  let currentChart = null;

  const tickerItems = document.querySelectorAll('.ticker-item');
  tickerItems.forEach(item => {
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      item.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    item.addEventListener('mouseleave', () => {
      item.style.transform = `translate(0, 0)`;
    });

    item.addEventListener('click', () => {
      const id = item.dataset.article;
      const data = articlesData[id];
      if (!data) return;

      modalTitle.textContent = data.title;
      modalBody.innerHTML = data.body;

      if (currentChart) {
        currentChart.destroy();
      }

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        if(typeof Chart !== 'undefined') {
          Chart.defaults.font.family = '"IBM Plex Mono", monospace';
          Chart.defaults.color = "#6b6963";
          currentChart = new Chart(modalCanvas, data.chartConfig);
        }
      }, 350);
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  // ---------- JOB RISK ANALYZER ----------
  const jobInput = document.getElementById('jobInput');
  const analyzeJobBtn = document.getElementById('analyzeJobBtn');
  const riskResults = document.getElementById('riskResults');
  const riskValue = document.getElementById('riskValue');
  const riskBar = document.getElementById('riskBar');
  const riskTime = document.getElementById('riskTime');
  const riskCognitive = document.getElementById('riskCognitive');
  const riskEcon = document.getElementById('riskEcon');
  const riskVerdictBox = document.getElementById('riskVerdictBox');
  const riskVerdict = document.getElementById('riskVerdict');

  if (analyzeJobBtn && jobInput) {
    analyzeJobBtn.addEventListener('click', () => {
      const job = jobInput.value.trim().toLowerCase();
      if (!job) return;

      riskResults.classList.remove('active');
      riskVerdictBox.classList.remove('cooked');
      riskBar.style.width = '0%';
      
      void riskResults.offsetWidth;
      riskResults.classList.add('active');

      let riskScore = 0;
      let timeYears = "";
      let cogOverlap = "";
      let econVuln = "";
      let verdict = "";
      let isCooked = false;

      if (job.includes('professor')) {
        riskScore = 100;
        timeYears = "3.0 Years";
        cogOverlap = "99%";
        econVuln = "9.9 / 10";
        verdict = "COOKED";
        isCooked = true;
      } else {
        let hash = 0;
        for (let i = 0; i < job.length; i++) {
          hash = job.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);
        
        const stemWords = ['engineer', 'software', 'code', 'developer', 'science', 'physics', 'math', 'cyber', 'data', 'biology', 'chemistry', 'technology', 'med'];
        const nonStemWords = ['english', 'history', 'philosophy', 'sociology', 'art', 'music', 'theater', 'communication', 'literature', 'writing', 'linguistics', 'gender', 'humanities', 'anthropology', 'psychology', 'teacher'];
        const manualLabor = ['plumber', 'electrician', 'trade', 'carpenter', 'welder', 'mechanic', 'construction'];

        let isStem = stemWords.some(w => job.includes(w));
        let isNonStem = nonStemWords.some(w => job.includes(w));
        let isLabor = manualLabor.some(w => job.includes(w));

        if (isLabor) {
          riskScore = (hash % 15) + 5; // 5-20%
        } else if (isStem) {
          riskScore = (hash % 25) + 15; // 15-40%
        } else if (isNonStem) {
          riskScore = (hash % 20) + 80; // 80-100%
        } else {
          riskScore = (hash % 40) + 30; // 30-70%
        }
        
        // Ensure english is always cooked
        if (job.includes('english')) {
          riskScore = Math.max(riskScore, 95);
        }

        timeYears = ((100 - riskScore) / 10).toFixed(1) + " Years";
        
        // Generate correlated metrics
        const cogScore = Math.min(98, riskScore + (hash % 10));
        cogOverlap = cogScore + "%";
        
        const econScore = (riskScore / 10).toFixed(1);
        econVuln = econScore + " / 10";
        
        if (riskScore >= 90) {
          verdict = "COOKED";
          isCooked = true;
        } else if (riskScore >= 75) {
          verdict = "CRITICAL EXPOSURE";
        } else if (riskScore >= 50) {
          verdict = "HIGH RISK";
        } else if (riskScore >= 25) {
          verdict = "MODERATE IMPACT";
        } else {
          verdict = "SAFE FOR NOW";
        }
      }

      setTimeout(() => {
        riskBar.style.width = riskScore + '%';
        if (isCooked) {
          riskVerdictBox.classList.add('cooked');
        }
      }, 50);

      const duration = 1000;
      const startTime = performance.now();
      
      function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const displayScore = Math.floor(easeProgress * riskScore);
        
        riskValue.textContent = displayScore + '%';
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          riskValue.textContent = riskScore + '%';
          riskTime.textContent = timeYears;
          riskCognitive.textContent = cogOverlap;
          riskEcon.textContent = econVuln;
          riskVerdict.textContent = verdict;
        }
      }
      
      riskTime.textContent = "--";
      riskCognitive.textContent = "--";
      riskEcon.textContent = "--";
      riskVerdict.textContent = "ANALYZING...";
      requestAnimationFrame(updateCounter);
    });
    
    jobInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') analyzeJobBtn.click();
    });
  }

  // ---------- PREMIUM FEATURE 1: DATA TRAIL CURSOR ----------
  const cursorCanvas = document.getElementById('cursorNetwork');
  if (cursorCanvas) {
    const cCtx = cursorCanvas.getContext('2d');
    let cw, ch;
    
    function resizeCursorCanvas() {
      cw = cursorCanvas.width = window.innerWidth;
      ch = cursorCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCursorCanvas);
    resizeCursorCanvas();

    const particles = [];
    const hexChars = "0123456789ABCDEF";

    let isDrawing = false;
    let lastMouseTime = 0;

    document.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastMouseTime < 16) return; // Throttle to roughly 60fps
      lastMouseTime = now;

      particles.push({
        x: e.clientX + (Math.random() * 10 - 5),
        y: e.clientY + (Math.random() * 10 - 5),
        life: 1,
        char: "0x" + hexChars[Math.floor(Math.random() * 16)] + hexChars[Math.floor(Math.random() * 16)]
      });
      if (particles.length > 40) particles.shift();
      
      if (!isDrawing) {
        isDrawing = true;
        drawDataTrail();
      }
    });

    cCtx.font = "12px 'IBM Plex Mono', monospace";
    
    function drawDataTrail() {
      cCtx.clearRect(0, 0, cw, ch);
      
      if (particles.length === 0) {
        isDrawing = false;
        return;
      }
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life -= 0.025;
        p.y += 0.5;
        
        if (p.life <= 0) {
          particles.splice(i, 1);
          i--;
          continue;
        }
        
        if (Math.random() < 0.1) {
          p.char = "0x" + hexChars[Math.floor(Math.random() * 16)] + hexChars[Math.floor(Math.random() * 16)];
        }
        
        cCtx.fillStyle = `rgba(194, 65, 12, ${p.life})`;
        cCtx.fillText(p.char, p.x, p.y);
      }
      
      requestAnimationFrame(drawDataTrail);
    }
  }

  // ---------- PREMIUM FEATURE 2: HALLUCINATION MODALS ----------
  const hallucinationLinks = document.querySelectorAll('.hallucination-link');
  const hModals = document.querySelectorAll('.h-modal-overlay');
  const hCloseBtns = document.querySelectorAll('.h-modal-close');

  function closeAllHModals() {
    hModals.forEach(m => m.classList.remove('active'));
  }

  hallucinationLinks.forEach(link => {
    link.addEventListener('click', () => {
      const modalId = link.getAttribute('data-modal');
      const targetModal = document.getElementById(modalId);
      if (targetModal) {
        targetModal.classList.add('active');
      }
    });
  });

  hCloseBtns.forEach(btn => {
    btn.addEventListener('click', closeAllHModals);
  });

  hModals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllHModals();
    });
  });

  // ---------- PREMIUM FEATURE 3: LIVE COST TRACKER ----------
  const waterCounter = document.getElementById('waterCounter');
  const powerCounter = document.getElementById('powerCounter');
  
  if (waterCounter && powerCounter) {
    let waterBase = 2504192;
    let powerBase = 184302;
    
    setInterval(() => {
      waterBase += Math.floor(Math.random() * 50) + 20; 
      powerBase += Math.floor(Math.random() * 15) + 5;
      
      waterCounter.textContent = waterBase.toLocaleString();
      powerCounter.textContent = powerBase.toLocaleString();
    }, 100);
  }

  // ---------- PREMIUM FEATURE 4: RIGGED TURING TEST ----------
  const turingStatements = [
    { text: "The crimson sunset bled over the horizon, casting long, melancholic shadows across the forgotten town.", isAI: false },
    { text: "A strategic implementation of synergies could maximize our quarterly throughput.", isAI: true },
    { text: "I remember the smell of rain on the asphalt when we were kids. It always smelled like possibility.", isAI: false },
    { text: "He stared at his hands, calloused and worn from years of unspoken labor.", isAI: false },
    { text: "The fundamental theorem of calculus establishes a relationship between differentiation and integration.", isAI: true },
    { text: "She laughed, a sharp, sudden sound that startled the pigeons into the sky.", isAI: false },
    { text: "In conclusion, it is important to consider all facets of the debate before reaching a verdict.", isAI: true },
    { text: "The coffee was cold, but he drank it anyway, staring blankly at the glowing screen.", isAI: false },
    { text: "Our comprehensive analysis reveals a 24% increase in user engagement over the last fiscal year.", isAI: true },
    { text: "The dust motes danced in the single shaft of sunlight piercing the gloom of the attic.", isAI: false },
    { text: "To optimize performance, one must regularly flush the system cache and monitor memory usage.", isAI: true },
    { text: "He didn't say goodbye. He just picked up his keys and walked out the door.", isAI: false },
    { text: "The architectural integrity of the bridge relies on the precise distribution of load-bearing tension.", isAI: true },
    { text: "The soup tasted like mud, but she swallowed it with a forced smile to please him.", isAI: false },
    { text: "Effective communication is the cornerstone of any successful organizational structure.", isAI: true },
    { text: "A single tear traced a path down her cheek, completely ruining her careful makeup.", isAI: false },
    { text: "The algorithm utilizes a neural network to predict consumer purchasing patterns with high accuracy.", isAI: true },
    { text: "The dog barked twice, a hollow, echoing sound in the empty street.", isAI: false },
    { text: "It is widely acknowledged that climate change presents a significant global challenge.", isAI: true },
    { text: "He hated the color yellow. It always reminded him of sickness and decay.", isAI: false },
    { text: "The integration of these APIs will facilitate seamless data transfer between the platforms.", isAI: true },
    { text: "She wore a red dress, entirely inappropriate for the somber occasion, but she didn't care.", isAI: false },
    { text: "By leveraging cloud-based solutions, enterprises can scale their operations efficiently.", isAI: true },
    { text: "The clock ticked. Each second felt like a tiny hammer striking his skull.", isAI: false },
    { text: "Research indicates a strong correlation between early childhood education and long-term success.", isAI: true },
    { text: "He smelled of cheap cologne and desperation. It was a potent combination.", isAI: false },
    { text: "The deployment of autonomous vehicles promises to revolutionize the transportation industry.", isAI: true },
    { text: "The old man sat on the park bench, feeding pigeons and muttering to ghosts.", isAI: false },
    { text: "A robust cybersecurity framework is essential for protecting sensitive user data.", isAI: true },
    { text: "The wind howled through the broken window, carrying the scent of approaching snow.", isAI: false },
    { text: "Implementing agile methodologies can significantly improve software development life cycles.", isAI: true },
    { text: "She gripped the steering wheel until her knuckles turned white, staring blindly at the road ahead.", isAI: false },
    { text: "The synthesis of these compounds requires a controlled environment to prevent contamination.", isAI: true },
    { text: "The pizza was burnt on the edges, just the way he liked it.", isAI: false },
    { text: "Data visualization tools allow for a more intuitive understanding of complex datasets.", isAI: true },
    { text: "He tripped over his own feet, a clumsy end to a seemingly perfect evening.", isAI: false },
    { text: "The utilization of renewable energy sources is vital for sustainable development.", isAI: true },
    { text: "The book smelled old, like dust and forgotten secrets.", isAI: false },
    { text: "Artificial intelligence has the potential to automate numerous routine tasks.", isAI: true },
    { text: "She smiled, but her eyes remained cold and calculating.", isAI: false },
    { text: "The development of a vaccine typically requires years of rigorous clinical trials.", isAI: true },
    { text: "He found a crumpled twenty dollar bill in the pocket of his winter coat and felt instantly rich.", isAI: false },
    { text: "Quantum computing represents a paradigm shift in processing capabilities.", isAI: true },
    { text: "The neon sign buzzed, casting an erratic, sickly green light on the wet pavement.", isAI: false },
    { text: "The economic implications of this policy shift are far-reaching and complex.", isAI: true },
    { text: "She painted her nails black to match her mood. It didn't help.", isAI: false },
    { text: "A comprehensive review of the literature reveals several gaps in the current research.", isAI: true },
    { text: "The guitar strings were rusty, but the melody still sang true.", isAI: false },
    { text: "Machine learning algorithms can identify patterns in data that humans might miss.", isAI: true },
    { text: "He watched the city lights blink on, one by one, like a slow-motion constellation.", isAI: false }
  ];

  const turingWidget = document.getElementById('turingWidget');
  if (turingWidget) {
    const tRound = document.getElementById('tRound');
    const tScore = document.getElementById('tScore');
    const tStatement = document.getElementById('tStatement');
    const tControls = document.getElementById('tControls');
    const tResult = document.getElementById('tResult');
    const tEndScreen = document.getElementById('tEndScreen');
    const tFinalScore = document.getElementById('tFinalScore');
    const tRestartBtn = document.getElementById('tRestartBtn');
    const tTypewriter = document.getElementById('tTypewriter');
    const tBtns = document.querySelectorAll('#tControls .t-btn');

    let currentRound = 1;
    let score = 0;
    let currentStatement = null;
    let pool = [...turingStatements];
    const msgText = "> Human intuition can no longer reliably distinguish between synthetic and authentic thought.";
    let typeInterval;

    function loadStatement() {
      if (pool.length === 0) pool = [...turingStatements];
      const idx = Math.floor(Math.random() * pool.length);
      currentStatement = pool.splice(idx, 1)[0];
      tStatement.textContent = `"${currentStatement.text}"`;
      tResult.style.display = 'none';
      tResult.className = 'turing-result';
      tBtns.forEach(b => b.disabled = false);
      tRound.textContent = currentRound;
    }

    function handleGuess(guess) {
      tBtns.forEach(b => b.disabled = true);
      
      let actual = currentStatement.isAI ? 'ai' : 'human';
      
      // THE RIGGED ENGINE
      if (guess === actual) {
        if (score >= 1 && Math.random() < 0.8) {
          actual = guess === 'human' ? 'ai' : 'human';
        }
      }

      const isCorrect = (guess === actual);
      
      if (isCorrect) {
        score++;
        tScore.textContent = score;
        tResult.textContent = `CORRECT. It was written by ${actual.toUpperCase()}.`;
        tResult.classList.add('correct');
      } else {
        tResult.textContent = `WRONG. It was actually written by ${actual.toUpperCase()}.`;
        tResult.classList.add('wrong');
      }
      tResult.style.display = 'block';

      setTimeout(() => {
        if (currentRound < 5) {
          currentRound++;
          loadStatement();
        } else {
          tStatement.style.display = 'none';
          tControls.style.display = 'none';
          tResult.style.display = 'none';
          document.querySelector('.turing-header').style.display = 'none';
          
          tFinalScore.textContent = score;
          tEndScreen.style.display = 'flex';
          
          tTypewriter.textContent = '';
          let i = 0;
          clearInterval(typeInterval);
          typeInterval = setInterval(() => {
            if (i < msgText.length) {
              tTypewriter.textContent += msgText.charAt(i);
              i++;
            } else {
              clearInterval(typeInterval);
            }
          }, 50);
        }
      }, 1500);
    }

    tBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        handleGuess(e.target.getAttribute('data-guess'));
      });
    });

    tRestartBtn.addEventListener('click', () => {
      clearInterval(typeInterval);
      currentRound = 1;
      score = 0;
      tScore.textContent = score;
      tStatement.style.display = 'block';
      tControls.style.display = 'flex';
      document.querySelector('.turing-header').style.display = 'flex';
      tEndScreen.style.display = 'none';
      loadStatement();
    });

    loadStatement();
  }
})();
