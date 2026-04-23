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
})();
