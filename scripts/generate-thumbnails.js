#!/usr/bin/env node
/**
 * generate-thumbnails.js
 * Renders each resume template as a realistic PNG thumbnail using Playwright,
 * filled with one of 40 sample personas (assigned via template.id % 40).
 *
 * Run from the PROJECT ROOT:
 *   node scripts/generate-thumbnails.js
 *
 * Requirements (install once):
 *   npm install playwright sharp --save-dev
 *   npx playwright install chromium
 *
 * Output: frontend/public/thumbnails/{slug}.png  (400 x 566)
 */

const fs = require('fs');
const path = require('path');

// ── Resolve paths relative to project root ──────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_PATH = path.join(ROOT, 'frontend/src/data/resume-templates.json');
const PROFILES_PATH = path.join(ROOT, 'frontend/src/data/sample-profiles.json');
const OUT_DIR = path.join(ROOT, 'frontend/public/thumbnails');

// ── Load data ───────────────────────────────────────────────────────────────
const templatesFile = JSON.parse(fs.readFileSync(TEMPLATES_PATH, 'utf8'));
const templates = Array.isArray(templatesFile) ? templatesFile : templatesFile.templates;
const profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));

// ── Lazy-require deps with a friendly error ─────────────────────────────────
let chromium, sharp;
try {
  ({ chromium } = require('playwright'));
  sharp = require('sharp');
} catch (e) {
  console.error('\n[!] Missing dependencies. From the project root run:');
  console.error('    npm install playwright sharp --save-dev');
  console.error('    npx playwright install chromium\n');
  process.exit(1);
}

// ── Config ──────────────────────────────────────────────────────────────────
const A4 = { width: 794, height: 1123 }; // A4 at ~96dpi
const THUMB = { width: 400, height: 566 };
const BATCH_SIZE = 5;
const FONT_SETTLE_MS = 350; // small wait so webfonts paint before screenshot

// ── Helpers ─────────────────────────────────────────────────────────────────
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildGoogleFontsUrl(display, body) {
  const fonts = [...new Set([display, body])]
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${fonts}&display=swap`;
}

// Initials for photo-placeholder avatars
function initials(name = '') {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

// Detect layout family from template metadata
function detectLayout(template) {
  const lt = (template.layoutType || '').toLowerCase();
  const mf = template.modernFeatures || {};
  if (mf.hasTimeline || lt.includes('timeline')) return 'timeline';
  if (mf.hasBentoGrid || lt.includes('bento') || lt.includes('card') || lt.includes('block')) return 'bento';
  if (mf.hasColorSidebar || lt.includes('coloured sidebar') || lt.includes('color sidebar') || lt.includes('30/70')) return 'color-sidebar';
  if (lt.includes('sidebar') || lt.includes('two-column') || lt.includes('two column') || lt.includes('40/60')) return 'two-column';
  if (mf.hasDarkHeader || lt.includes('dark header') || lt.includes('header band')) return 'dark-header';
  return 'single';
}

// ── Section renderers (shared) ──────────────────────────────────────────────
function expHTML(profile, { compact = false } = {}) {
  return profile.experience
    .map(
      (exp) => `
      <div class="job">
        <div class="job-title">${escapeHtml(exp.role)}</div>
        <div class="job-company">${escapeHtml(exp.company)} · ${escapeHtml(exp.location)}</div>
        <div class="job-dates">${escapeHtml(exp.dates)}</div>
        <ul>${exp.bullets.slice(0, compact ? 2 : 3).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>`
    )
    .join('');
}

function eduHTML(profile) {
  return profile.education
    .map(
      (edu) => `
      <div class="edu">
        <div class="job-title">${escapeHtml(edu.degree)}</div>
        <div class="job-company">${escapeHtml(edu.school)}</div>
        <div class="job-dates">${escapeHtml(edu.year)}</div>
      </div>`
    )
    .join('');
}

function skillTagsHTML(profile) {
  return `<div class="skills-grid">${profile.skills
    .map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`)
    .join('')}</div>`;
}

function skillListHTML(profile, onDark = false) {
  return `<div class="skill-list ${onDark ? 'on-dark' : ''}">${profile.skills
    .map((s) => `<div class="skill-line">${escapeHtml(s)}</div>`)
    .join('')}</div>`;
}

function contactInline(profile) {
  const parts = [profile.email, profile.phone, profile.location];
  if (profile.linkedin) parts.push(profile.linkedin);
  return parts.map(escapeHtml).join(' · ');
}

// ── Layout-specific body builders ───────────────────────────────────────────
function layoutSingle(t, p, c) {
  return `
    <div class="header">
      <h1>${escapeHtml(p.name)}</h1>
      <div class="subtitle">${escapeHtml(p.title)}</div>
      <div class="contact">${contactInline(p)}</div>
    </div>
    <div class="body">
      <section class="section"><h2>Profile</h2><p class="summary">${escapeHtml(p.summary)}</p></section>
      <section class="section"><h2>Experience</h2>${expHTML(p)}</section>
      <section class="section"><h2>Education</h2>${eduHTML(p)}</section>
      <section class="section"><h2>Skills</h2>${skillTagsHTML(p)}</section>
    </div>`;
}

function layoutDarkHeader(t, p, c) {
  return `
    <div class="header dark">
      <h1>${escapeHtml(p.name)}</h1>
      <div class="subtitle">${escapeHtml(p.title)}</div>
      <div class="contact">${contactInline(p)}</div>
    </div>
    <div class="accent-rule"></div>
    <div class="body">
      <section class="section"><h2>Profile</h2><p class="summary">${escapeHtml(p.summary)}</p></section>
      <section class="section"><h2>Experience</h2>${expHTML(p)}</section>
      <section class="section"><h2>Education</h2>${eduHTML(p)}</section>
      <section class="section"><h2>Skills</h2>${skillTagsHTML(p)}</section>
    </div>`;
}

function layoutTwoColumn(t, p, c) {
  const photo = p.photo
    ? `<div class="avatar">${escapeHtml(initials(p.name))}</div>`
    : '';
  return `
    <div class="header">
      <h1>${escapeHtml(p.name)}</h1>
      <div class="subtitle">${escapeHtml(p.title)}</div>
    </div>
    <div class="two-col">
      <aside class="sidebar">
        ${photo}
        <h3>Contact</h3>
        <div class="side-item">${escapeHtml(p.email)}</div>
        <div class="side-item">${escapeHtml(p.phone)}</div>
        <div class="side-item">${escapeHtml(p.location)}</div>
        ${p.linkedin ? `<div class="side-item">${escapeHtml(p.linkedin)}</div>` : ''}
        <h3>Skills</h3>
        ${skillListHTML(p)}
        ${p.languages ? `<h3>Languages</h3>${p.languages.map((l) => `<div class="side-item">${escapeHtml(l)}</div>`).join('')}` : ''}
      </aside>
      <main class="main">
        <section class="section"><h2>Profile</h2><p class="summary">${escapeHtml(p.summary)}</p></section>
        <section class="section"><h2>Experience</h2>${expHTML(p)}</section>
        <section class="section"><h2>Education</h2>${eduHTML(p)}</section>
      </main>
    </div>`;
}

function layoutColorSidebar(t, p, c) {
  const photo = p.photo
    ? `<div class="avatar on-fill">${escapeHtml(initials(p.name))}</div>`
    : '';
  return `
    <div class="color-col">
      <aside class="sidebar fill">
        ${photo}
        <div class="side-name">${escapeHtml(p.name)}</div>
        <div class="side-title">${escapeHtml(p.title)}</div>
        <h3 class="on-dark">Contact</h3>
        <div class="side-item on-dark">${escapeHtml(p.email)}</div>
        <div class="side-item on-dark">${escapeHtml(p.phone)}</div>
        <div class="side-item on-dark">${escapeHtml(p.location)}</div>
        ${p.linkedin ? `<div class="side-item on-dark">${escapeHtml(p.linkedin)}</div>` : ''}
        <h3 class="on-dark">Skills</h3>
        ${skillListHTML(p, true)}
        ${p.languages ? `<h3 class="on-dark">Languages</h3>${p.languages.map((l) => `<div class="side-item on-dark">${escapeHtml(l)}</div>`).join('')}` : ''}
      </aside>
      <main class="main wide">
        <section class="section"><h2>Profile</h2><p class="summary">${escapeHtml(p.summary)}</p></section>
        <section class="section"><h2>Experience</h2>${expHTML(p)}</section>
        <section class="section"><h2>Education</h2>${eduHTML(p)}</section>
      </main>
    </div>`;
}

function layoutTimeline(t, p, c) {
  const timelineJobs = p.experience
    .map(
      (exp) => `
      <div class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-content">
          <div class="job-title">${escapeHtml(exp.role)}</div>
          <div class="job-company">${escapeHtml(exp.company)} · ${escapeHtml(exp.location)}</div>
          <div class="job-dates">${escapeHtml(exp.dates)}</div>
          <ul>${exp.bullets.slice(0, 2).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        </div>
      </div>`
    )
    .join('');
  return `
    <div class="header">
      <h1>${escapeHtml(p.name)}</h1>
      <div class="subtitle">${escapeHtml(p.title)}</div>
      <div class="contact">${contactInline(p)}</div>
    </div>
    <div class="body">
      <section class="section"><h2>Profile</h2><p class="summary">${escapeHtml(p.summary)}</p></section>
      <section class="section"><h2>Experience</h2><div class="timeline">${timelineJobs}</div></section>
      <section class="section"><h2>Education</h2>${eduHTML(p)}</section>
      <section class="section"><h2>Skills</h2>${skillTagsHTML(p)}</section>
    </div>`;
}

function layoutBento(t, p, c) {
  return `
    <div class="header">
      <h1>${escapeHtml(p.name)}</h1>
      <div class="subtitle">${escapeHtml(p.title)}</div>
      <div class="contact">${contactInline(p)}</div>
    </div>
    <div class="body">
      <div class="bento">
        <div class="card span-2"><h2>Profile</h2><p class="summary">${escapeHtml(p.summary)}</p></div>
        <div class="card"><h2>Skills</h2>${skillTagsHTML(p)}</div>
        <div class="card"><h2>Education</h2>${eduHTML(p)}</div>
      </div>
      <section class="section"><h2>Experience</h2>${expHTML(p)}</section>
    </div>`;
}

const LAYOUT_BUILDERS = {
  single: layoutSingle,
  'dark-header': layoutDarkHeader,
  'two-column': layoutTwoColumn,
  'color-sidebar': layoutColorSidebar,
  timeline: layoutTimeline,
  bento: layoutBento,
};

// ── Full HTML document ──────────────────────────────────────────────────────
function generateResumeHTML(template, profile) {
  const c = template.colorPalette;
  const fontDisplay = template.fontPairing.display;
  const fontBody = template.fontPairing.body;
  const googleFontsUrl = buildGoogleFontsUrl(fontDisplay, fontBody);
  const layout = detectLayout(template);
  const bodyHTML = (LAYOUT_BUILDERS[layout] || layoutSingle)(template, profile, c);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsUrl}" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${A4.width}px; height: ${A4.height}px; overflow: hidden;
      font-family: '${fontBody}', Georgia, serif;
      font-size: 10px; line-height: 1.5; color: ${c.text}; background: #ffffff;
    }
    h1 { font-family: '${fontDisplay}', sans-serif; font-size: 26px; font-weight: 700; line-height: 1.1; letter-spacing: -0.01em; }
    h2 {
      font-family: '${fontDisplay}', sans-serif; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.09em; color: ${c.accent};
      border-bottom: 1px solid ${c.accent}; padding-bottom: 2px; margin-bottom: 6px; margin-top: 12px;
    }
    h3 {
      font-family: '${fontDisplay}', sans-serif; font-size: 9.5px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em; color: ${c.primary};
      margin: 12px 0 5px;
    }
    h3.on-dark { color: #ffffff; opacity: 0.9; }

    .header { padding: 26px 30px 18px; }
    .header h1 { color: ${c.primary}; }
    .header .subtitle { font-size: 13px; font-weight: 500; color: ${c.accent}; margin-top: 4px; }
    .header .contact { font-size: 9px; color: #6b7280; margin-top: 8px; }

    .header.dark { background: ${c.primary}; padding: 28px 30px 22px; }
    .header.dark h1 { color: #ffffff; }
    .header.dark .subtitle { color: ${c.accent}; opacity: 0.95; }
    .header.dark .contact { color: rgba(255,255,255,0.75); }
    .accent-rule { height: 4px; background: ${c.accent}; width: 100%; }

    .body { padding: 14px 30px; }
    .section { margin-bottom: 6px; }
    .summary { font-size: 9.8px; color: ${c.text}; }

    .job, .edu { margin-bottom: 9px; }
    .job-title { font-weight: 600; font-size: 10.5px; color: ${c.primary}; }
    .job-company { color: ${c.accent}; font-size: 9.5px; font-weight: 500; }
    .job-dates { color: #9ca3af; font-size: 8.8px; margin-bottom: 3px; }
    ul { padding-left: 14px; }
    li { font-size: 9.4px; margin-bottom: 2px; color: ${c.text}; }

    .skills-grid { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    .skill-tag {
      background: ${c.accent}1A; color: ${c.accent};
      border: 1px solid ${c.accent}33; border-radius: 4px;
      padding: 2px 7px; font-size: 8.6px; font-weight: 500;
    }
    .skill-list { margin-top: 2px; }
    .skill-line { font-size: 9px; padding: 2px 0; border-bottom: 1px solid #00000010; }
    .skill-line.on-dark, .skill-list.on-dark .skill-line { color: rgba(255,255,255,0.88); border-bottom: 1px solid rgba(255,255,255,0.15); }
    .side-item { font-size: 8.8px; color: #4b5563; margin-bottom: 3px; word-break: break-word; }
    .side-item.on-dark { color: rgba(255,255,255,0.85); }

    /* Two-column */
    .two-col { display: flex; padding: 0 30px 18px; gap: 22px; }
    .sidebar { width: 32%; flex-shrink: 0; }
    .main { flex: 1; }
    .main.wide { padding: 18px 26px; }

    /* Color sidebar (30/70) */
    .color-col { display: flex; height: 100%; }
    .sidebar.fill { width: 33%; background: ${c.primary}; color: #fff; padding: 26px 18px; flex-shrink: 0; }
    .side-name { font-family: '${fontDisplay}', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin-top: 6px; }
    .side-title { font-size: 10px; color: ${c.accent}; margin-bottom: 6px; }

    /* Avatar */
    .avatar {
      width: 64px; height: 64px; border-radius: 50%; background: ${c.accent}; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-family: '${fontDisplay}', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 8px;
    }
    .avatar.on-fill { background: rgba(255,255,255,0.18); }

    /* Timeline */
    .timeline { position: relative; padding-left: 16px; }
    .timeline::before { content: ''; position: absolute; left: 4px; top: 4px; bottom: 4px; width: 2px; background: ${c.accent}40; }
    .tl-item { position: relative; margin-bottom: 10px; }
    .tl-dot { position: absolute; left: -15px; top: 3px; width: 8px; height: 8px; border-radius: 50%; background: ${c.accent}; }

    /* Bento */
    .bento { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
    .card { border: 1px solid #00000012; border-radius: 8px; padding: 10px 12px; background: ${c.neutral}; }
    .card.span-2 { grid-column: 1 / -1; }
    .card h2 { margin-top: 0; }
  </style>
</head>
<body>
  ${bodyHTML}
</body>
</html>`;
}

// ── Render one template ─────────────────────────────────────────────────────
async function renderOne(browser, template, index, total) {
  const profile = profiles[template.id % profiles.length];
  const html = generateResumeHTML(template, profile);
  const page = await browser.newPage({ viewport: A4, deviceScaleFactor: 2 });
  try {
    await page.setContent(html, { waitUntil: 'networkidle' });
    // Ensure webfonts are ready before screenshot
    try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch (_) {}
    await page.waitForTimeout(FONT_SETTLE_MS);

    const buffer = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: A4.width, height: A4.height } });
    const outPath = path.join(OUT_DIR, `${template.slug}.png`);
    await sharp(buffer)
      .resize(THUMB.width, THUMB.height, { fit: 'cover', position: 'top' })
      .png({ quality: 90 })
      .toFile(outPath);

    console.log(`Generated ${index}/${total}: ${template.slug}.png`);
    return { ok: true };
  } catch (err) {
    console.error(`  [!] Failed ${index}/${total}: ${template.slug} — ${err.message}`);
    return { ok: false, slug: template.slug, error: err.message };
  } finally {
    await page.close();
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  const start = Date.now();

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\nRendering ${templates.length} thumbnails (batch size ${BATCH_SIZE})...\n`);

  const browser = await chromium.launch({ headless: true });
  const failures = [];
  let done = 0;

  for (let i = 0; i < templates.length; i += BATCH_SIZE) {
    const batch = templates.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((t, j) => renderOne(browser, t, i + j + 1, templates.length))
    );
    results.forEach((r) => { if (!r.ok) failures.push(r); });
    done += batch.length;
  }

  await browser.close();

  const secs = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Generated ${templates.length - failures.length}/${templates.length} thumbnails in ${secs}s`);
  console.log(`📁 Saved to frontend/public/thumbnails/`);
  if (failures.length) {
    console.log(`\n⚠️  ${failures.length} failed:`);
    failures.forEach((f) => console.log(`   - ${f.slug}: ${f.error}`));
    process.exitCode = 1;
  }
})();
