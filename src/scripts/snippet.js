// lilSnippet — preview a Google search result, live, fully client-side.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- theme (OS-aware, matches the family) ---------- */
const MOON_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
const SUN_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4"/></g></svg>';

function setThemeIcon(btn, theme) {
  if (theme === 'dark') {
    btn.innerHTML = SUN_SVG;
    btn.setAttribute('aria-label', 'Switch to light mode');
  } else {
    btn.innerHTML = MOON_SVG;
    btn.setAttribute('aria-label', 'Switch to dark mode');
  }
}

function initTheme() {
  const btn = $('#ui-theme-btn');
  const current = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  setThemeIcon(btn, current());
  btn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('lilsnippet-theme', next); } catch (e) { /* storage may be unavailable; safe to ignore */ }
    setThemeIcon(btn, next);
  });
}

/* ---------- SERP preview ---------- */
const state = { device: 'desktop', gtheme: 'light' };

// Google's approximate limits before it truncates with an ellipsis.
const TITLE_PX = { desktop: 600, mobile: 920 };
const DESC_CH = { desktop: 160, mobile: 120 };

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
function measurePx(text, font) {
  ctx.font = font;
  return Math.round(ctx.measureText(text).width);
}

function parseUrl(raw) {
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '');
  const segs = u.pathname.split('/').filter(Boolean).map((s) => {
    try { return decodeURIComponent(s); } catch { return s; }
  });
  return { host, crumb: [host, ...segs].join(' › ') };
}

function render() {
  const title = $('#f-title').value;
  const desc = $('#f-desc').value;
  const rawUrl = $('#f-url').value.trim();
  const parsed = rawUrl ? parseUrl(rawUrl) : null;

  $('#serp-name').textContent = parsed ? parsed.host : 'example.com';
  $('#serp-url').textContent = parsed ? parsed.crumb : 'example.com';
  $('#serp-title').textContent = title || 'Your page title goes here';
  $('#serp-desc').textContent =
    desc ||
    "Your meta description preview shows here as you type. Keep it under about 155 characters so Google doesn't trim the end.";

  const titlePx = title ? measurePx(title, '20px Arial, sans-serif') : 0;
  const titleBudget = TITLE_PX[state.device];
  const descBudget = DESC_CH[state.device];

  const tc = $('#title-count');
  tc.textContent = title ? `${title.length} chars · ${titlePx}px` : '';
  tc.className = 'count ' + (title && titlePx > titleBudget ? 'count--warn' : 'count--ok');

  const dc = $('#desc-count');
  dc.textContent = desc ? `${desc.length} chars` : '';
  dc.className = 'count ' + (desc && desc.length > descBudget ? 'count--warn' : 'count--ok');

  const notes = [];
  if (title && titlePx > titleBudget) {
    notes.push(`Title is ~${titlePx}px wide. Google trims ${state.device} titles near ${titleBudget}px, so the end will likely be cut.`);
  }
  if (desc && desc.length > descBudget) {
    notes.push(`Description is ${desc.length} characters. ${state.device === 'mobile' ? 'Mobile' : 'Desktop'} results show roughly ${descBudget}, so the tail may be cut.`);
  }
  if (!notes.length && (title || desc)) {
    notes.push("Looks good — within Google's typical limits for this device.");
  }
  $('#notes').innerHTML = notes.map((n) => `<div class="note ${n.startsWith('Looks') ? 'note--ok' : 'note--warn'}">${n}</div>`).join('');
}

function initSnippet() {
  initTheme();
  ['f-title', 'f-url', 'f-desc'].forEach((id) => $('#' + id).addEventListener('input', render));
  $$('[data-device]').forEach((b) =>
    b.addEventListener('click', () => {
      state.device = b.dataset.device;
      $$('[data-device]').forEach((x) => x.classList.toggle('is-active', x === b));
      $('#serp').dataset.device = state.device;
      render();
    }));
  $$('[data-gtheme]').forEach((b) =>
    b.addEventListener('click', () => {
      state.gtheme = b.dataset.gtheme;
      $$('[data-gtheme]').forEach((x) => x.classList.toggle('is-active', x === b));
      $('#serp').dataset.gtheme = state.gtheme;
      render();
    }));
  render();
}

export { initSnippet };
