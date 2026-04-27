# The Algorithmic Horizon

A one-page informative website arguing for proactive AI regulation. Built for ENGL 102 "Public Turn" project.

## Structure

- `index.html` — Single-page site with hero + 4 argument sections + footer
- `styles.css` — Editorial-authority design system (Fraunces + IBM Plex Sans, warm paper palette, Signal-orange accent)
- `script.js` — Navigation, reveal effects, lazy charts, modal interactions, and interactive widgets
- `vercel.json` — Static deployment config

## Implemented Interactive Features

- Sticky progress bar and chapter-dot navigation synced to scroll position
- Animated hero particle field, horizon SVG visual, and reduced-motion fallbacks
- Infinite news ticker with article modal deep-dives and chart embeds
- Lazy-loaded Chart.js visualizations for workforce, education, and infrastructure data
- Job-risk analyzer with deterministic scoring and keyboard submit support
- Hallucination case-study modal dialogs and focus/scroll lock handling
- Matrix-rain background and live resource-consumption counters in the action section
- Turing-test mini-game with round tracking and restart flow

## Content Sections

1. **Workforce Disruption** — Automation exposure + hiring-bias case (Amazon 2018)
2. **Educational Dilemma** — Cognitive-struggle argument + AI-detection false positives
3. **Societal Risks** — Synthetic-media misinformation + AI compute concentration
4. **The Turn** — Three policy principles: Transparency, Human-in-the-Loop, Inclusive Policy Making

## Local Preview

Open `index.html` in a browser. No build step or package install is required for local preview.

## Dependencies and Runtime Notes

- Primary runtime dependency: [Chart.js CDN](https://cdn.jsdelivr.net/npm/chart.js) loaded in `index.html`
- Typography dependency: Google Fonts (`Fraunces`, `IBM Plex Sans`, `IBM Plex Mono`)
- All other behavior is vanilla HTML/CSS/JavaScript (no framework or bundler)
- If third-party CDNs are blocked, charts/fonts gracefully degrade but core content remains available

## Deployment

Static site, deploys directly to Vercel via the connector — no framework, no build.
