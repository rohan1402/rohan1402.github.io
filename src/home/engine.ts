// @ts-nocheck
/* eslint-disable */
/**
 * Home page engine: the drifting project strip with live canvas covers, the project view,
 * experience and contact sections, and the on-page agent.
 *
 * Plain JavaScript in one function, ported from the single-file prototype. A few names are
 * shadowed below so every window listener, animation frame, timer and observer it creates
 * can be removed by destroy(). The covers draw in a 400 x 250 design space.
 *
 * bridge.ask(text) sends a typed question to the live chat. The page component calls
 * live({ status, messages, error }) whenever the chat updates.
 */
export function startHome(host, markup, bridge) {
  host.innerHTML = markup;
  let dead = false;
  const ac = new AbortController();
  const sig = { signal: ac.signal };
  const withSig = o => (o && typeof o === 'object' ? { ...o, signal: ac.signal } : { capture: o === true, signal: ac.signal });
  const addEventListener = (t, f, o) => window.addEventListener(t, f, withSig(o));
  const onDoc = (t, f, o) => document.addEventListener(t, f, withSig(o));
  const requestAnimationFrame = cb => window.requestAnimationFrame(t => { if (!dead) cb(t); });
  const setTimeout = (cb, ms) => window.setTimeout(() => { if (!dead) cb(); }, ms);
  const observers = [];
  const IntersectionObserver = class extends window.IntersectionObserver {
    constructor(cb, o) { super(cb, o); observers.push(this); }
  };
  const appended = [];
  const bodyAppend = (...nodes) => { for (const n of nodes) { document.body.appendChild(n); appended.push(n); } };
  const api = {};

  /* ---- Project covers ---- */
/* Project covers, v2. Each draw(c, T, P) paints one frame of a looping clip in a
   400 x 250 design space; the caller scales the context to the canvas size.
   Every label and number here comes from the project's README or rohan.ts. */
const TAU = Math.PI * 2;
const BW = 400, BH = 250;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const eio = x => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eout = x => { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); };
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function rr(c, x, y, w, h, r) {
  c.beginPath();
  if (w <= 0.5 || h <= 0.5) return;
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
const SANS = '"Schibsted Grotesk","Helvetica Neue",Arial,sans-serif';
const MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,monospace';
const fs = (px, w = 500) => `${w} ${px}px ${SANS}`;
const fm = (px, w = 400) => `${w} ${px}px ${MONO}`;
const wrapCache = new Map();
function wrap(c, text, maxW) {
  const key = c.font + '|' + maxW + '|' + text;
  let r = wrapCache.get(key);
  if (r) return r;
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (c.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  wrapCache.set(key, lines);
  return lines;
}
function edgeFade(c, T, period, ground) {
  const a = Math.max(1 - prog(T, 0, 0.35), prog(T, period - 0.55, period));
  if (a > 0.001) { c.globalAlpha = a; c.fillStyle = ground; c.fillRect(0, 0, BW, BH); c.globalAlpha = 1; }
}
function check(c, x, y, s, color) {
  c.strokeStyle = color; c.lineWidth = 1.4; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - s * 0.5, y); c.lineTo(x - s * 0.1, y + s * 0.4); c.lineTo(x + s * 0.55, y - s * 0.4); c.stroke();
}
function cross(c, x, y, s, color) {
  c.strokeStyle = color; c.lineWidth = 1.4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - s * 0.4, y - s * 0.4); c.lineTo(x + s * 0.4, y + s * 0.4);
  c.moveTo(x + s * 0.4, y - s * 0.4); c.lineTo(x - s * 0.4, y + s * 0.4); c.stroke();
}
/* A rounded label. Returns its width. */
function pill(c, x, y, text, o = {}) {
  const font = o.font || fs(7, 650), h = o.h || 16, padX = o.padX == null ? 8 : o.padX;
  c.font = font;
  const w = c.measureText(text).width + padX * 2;
  const x0 = o.right ? x - w : x;
  c.fillStyle = o.bg || 'rgba(255,255,255,.08)';
  rr(c, x0, y, w, h, o.r == null ? h / 2 : o.r); c.fill();
  if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = 1; rr(c, x0 + 0.5, y + 0.5, w - 1, h - 1, (o.r == null ? h / 2 : o.r) - 0.5); c.stroke(); }
  c.fillStyle = o.fg || 'rgba(255,255,255,.9)';
  c.textBaseline = 'middle'; c.textAlign = 'left';
  c.fillText(text, x0 + padX, y + h / 2 + 0.5);
  return w;
}
function base(c, P) {
  c.textBaseline = 'middle'; c.textAlign = 'left'; c.globalAlpha = 1;
  c.lineCap = 'butt'; c.lineJoin = 'miter'; c.setLineDash([]);
  c.fillStyle = P.ground; c.fillRect(0, 0, BW, BH);
}
function panel(c, x, y, w, h, a = 0.05) { c.fillStyle = `rgba(255,255,255,${a})`; rr(c, x, y, w, h, 7); c.fill(); }

/* Whyzr: asks back one question at a time, a pre-tool hook blocks direct answers,
   and what the child figured out is committed to a growth journal. */
const drawWhyzr = (() => {
  const msgs = [
    { who: 'kid', t: 0.4, text: 'What is 7 times 8?' },
    { who: 'tutor', t: 2.2, text: 'What is 7 times 4?' },
    { who: 'kid', t: 3.4, text: '28!' },
    { who: 'tutor', t: 4.6, text: 'Nice. What happens if you double 28?' },
    { who: 'kid', t: 5.8, text: '56. So 7 times 8 is 56!' }
  ];
  const typing = [[1.5, 2.2], [3.9, 4.6]];
  const R = rng(3);
  const qs = [];
  for (let i = 0; i < 8; i++) qs.push({ x: 20 + R() * 220, y: R() * 300, s: 14 + R() * 16, sp: 5 + R() * 7 });
  return function (c, T, P) {
    base(c, P);
    qs.forEach(q => {
      const y = ((q.y - T * q.sp) % 300 + 300) % 300 - 25;
      c.font = fs(q.s, 800); c.fillStyle = rgba(P.hue, 0.09); c.fillText('?', q.x, y);
    });
    c.font = fs(7.4, 700); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('Whyzr', 18, 16);
    c.font = fs(6.8, 500); c.fillStyle = 'rgba(255,255,255,.42)'; c.fillText('One question at a time', 50, 16.5);
    c.font = fs(9.4, 500);
    const maxW = 168, pad = 8, lh = 12.5, gapY = 8;
    const items = [];
    msgs.forEach(m => {
      const a = eout(prog(T, m.t, m.t + 0.35));
      if (!a) return;
      const lines = wrap(c, m.text, maxW - pad * 2);
      let mw = 0; for (const l of lines) mw = Math.max(mw, c.measureText(l).width);
      items.push({ key: m.t, m, a, lines, w: Math.min(maxW, mw + pad * 2), h: lines.length * lh + pad * 2 - 2 });
    });
    typing.forEach(([a0, a1]) => { if (T > a0 && T < a1) items.push({ key: a0, typing: true, a: eout(prog(T, a0, a0 + 0.25)), w: 40, h: 22 }); });
    items.sort((a, b) => a.key - b.key);
    let total = 0;
    items.forEach(it => { total += (it.h + gapY) * it.a; });
    const top = 30;
    let y = top - Math.max(0, total - (238 - top));
    c.save();
    c.beginPath(); c.rect(0, 26, 252, 224); c.clip();
    items.forEach(it => {
      const yy = y + (1 - it.a) * 6;
      c.globalAlpha = it.a;
      if (it.typing) {
        c.fillStyle = rgba(P.hue, 0.9); rr(c, 16, yy, it.w, it.h, 11); c.fill();
        for (let k = 0; k < 3; k++) {
          const b = Math.sin(T * 8 - k * 0.9) * 0.5 + 0.5;
          c.fillStyle = `rgba(5,18,29,${0.4 + 0.5 * b})`;
          c.beginPath(); c.arc(27 + k * 9, yy + 11 - b * 2, 2.4, 0, TAU); c.fill();
        }
      } else {
        const kid = it.m.who === 'kid';
        const x = kid ? 244 - it.w : 16;
        c.fillStyle = kid ? 'rgba(255,255,255,.93)' : P.hue; rr(c, x, yy, it.w, it.h, 10); c.fill();
        c.fillStyle = kid ? P.ground : '#05121D';
        c.textBaseline = 'top'; c.font = fs(9.4, 500);
        it.lines.forEach((l, li) => c.fillText(l, x + pad, yy + pad + li * lh));
        c.textBaseline = 'middle';
      }
      y += (it.h + gapY) * it.a;
    });
    c.restore();
    const px = 262, pw = 124;
    const ha = eout(prog(T, 0.9, 1.3));
    if (ha > 0) {
      c.globalAlpha = ha;
      panel(c, px, 26, pw, 64, 0.06);
      c.font = fs(7, 650); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('Safety hook', px + 10, 38);
      c.font = fm(6.2); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillText('pre_tool_use, deny by default', px + 10, 49);
      [['cli', false, 1.3], ['capture_photo', false, 1.6], ['memory', true, 1.9]].forEach(([tool, ok, t0], k) => {
        const ra = eout(prog(T, t0, t0 + 0.3));
        if (!ra) return;
        const y = 61 + k * 10;
        c.globalAlpha = ha * ra;
        c.font = fm(6.8); c.fillStyle = 'rgba(255,255,255,.82)'; c.fillText(tool, px + 10, y);
        c.font = fs(6.4, 700); c.textAlign = 'right';
        c.fillStyle = ok ? P.hue : '#FF8A8A';
        c.fillText(ok ? 'Allowed' : 'Blocked', px + pw - 10, y);
        c.textAlign = 'left';
      });
      c.globalAlpha = 1;
    }
    const ja = eout(prog(T, 1.0, 1.4));
    if (ja > 0) {
      c.globalAlpha = ja;
      panel(c, px, 98, pw, 104, 0.06);
      c.font = fs(7, 650); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('Growth journal', px + 10, 110);
      c.font = fm(6.4); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillText('branch child-a', px + 10, 121);
      const gx = px + 16;
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(gx, 136); c.lineTo(gx, 194); c.stroke();
      [[188, 58], [172, 44]].forEach(([yy, w]) => {
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(gx, yy, 3, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.16)'; rr(c, gx + 10, yy - 2, w, 4, 2); c.fill();
      });
      const ca = eout(prog(T, 6.4, 6.8));
      if (ca > 0) {
        c.globalAlpha = ja * ca;
        const pr = prog(T, 6.4, 7.4);
        if (pr < 1) { c.strokeStyle = rgba(P.hue, 1 - pr); c.lineWidth = 1; c.beginPath(); c.arc(gx, 146, 3.6 + pr * 8, 0, TAU); c.stroke(); }
        c.fillStyle = P.hue; c.beginPath(); c.arc(gx, 146, 3.6, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.font = fs(6.9, 650);
        c.fillText('Found 7 x 8 by', gx + 10, 142);
        c.fillText('doubling 7 x 4', gx + 10, 152);
      }
      c.globalAlpha = 1;
    }
    const ka = eout(prog(T, 7.1, 7.5));
    if (ka > 0) {
      c.globalAlpha = ka;
      const w = pill(c, px, 212, '89/89 checks pass', { h: 18, padX: 9, font: fs(7, 700), bg: rgba(P.hue, 0.18), stroke: rgba(P.hue, 0.8), fg: '#fff' });
      void w;
      c.globalAlpha = 1;
    }
    edgeFade(c, T, 9.5, P.ground);
  };
})();

/* Scail: does ChatGPT, Claude or Gemini recommend the business? Then the audit
   bundle and a CRM-ready lead with drafted outreach. */
const drawScail = (() => {
  const engines = [{ name: 'ChatGPT', you: -1 }, { name: 'Claude', you: 2 }, { name: 'Gemini', you: -1 }];
  const outs = ['Report PDF', 'Workbook', 'Page rewrites', 'llms.txt'];
  return function (c, T, P) {
    base(c, P);
    c.globalAlpha = eout(prog(T, 0.3, 0.7));
    pill(c, 16, 12, 'best financial advisor in Princeton, NJ', { font: fs(7.6, 650), h: 20, padX: 10, bg: 'rgba(255,255,255,.93)', fg: P.ground });
    c.globalAlpha = 1;
    const step = Math.min(27, Math.floor(prog(T, 0.4, 7.2) * 27));
    c.textAlign = 'right'; c.font = fs(6.8, 600); c.fillStyle = 'rgba(255,255,255,.5)';
    c.fillText(`Audit step ${step} of 27`, 384, 22); c.textAlign = 'left';
    engines.forEach((e, i) => {
      const y = 46 + i * 30;
      const a = eout(prog(T, 0.8 + i * 0.3, 1.2 + i * 0.3));
      if (!a) return;
      c.globalAlpha = a;
      c.font = fs(7.8, 650); c.fillStyle = 'rgba(255,255,255,.88)'; c.fillText(e.name, 18, y + 10);
      c.fillStyle = 'rgba(255,255,255,.05)'; rr(c, 62, y, 166, 20, 6); c.fill();
      for (let k = 0; k < 4; k++) {
        const ca = eout(prog(T, 1.3 + i * 0.3 + k * 0.16, 1.6 + i * 0.3 + k * 0.16));
        if (!ca) continue;
        const x = 67 + k * 40;
        c.globalAlpha = a * ca;
        if (k === e.you) {
          c.fillStyle = P.hue; rr(c, x, y + 4, 36, 12, 4); c.fill();
          c.fillStyle = P.ground; c.font = fs(6.6, 750); c.fillText('You', x + 10, y + 10.5);
        } else {
          c.fillStyle = 'rgba(255,255,255,.18)'; rr(c, x, y + 4, 36, 12, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,.3)'; rr(c, x + 6, y + 9, 20, 2.4, 1.2); c.fill();
        }
      }
      const va = eout(prog(T, 3.3 + i * 0.25, 3.6 + i * 0.25));
      if (va > 0) {
        c.globalAlpha = a * va;
        if (e.you >= 0) pill(c, 234, y + 2, 'Cited, #3', { h: 16, padX: 7, font: fs(6.6, 700), bg: rgba(P.hue, 0.2), stroke: rgba(P.hue, 0.85), fg: '#fff' });
        else pill(c, 234, y + 2, 'Not cited', { h: 16, padX: 7, font: fs(6.6, 700), bg: 'rgba(255,110,110,.16)', fg: '#FFB0B0' });
      }
      c.globalAlpha = 1;
    });
    const sa = eout(prog(T, 4.1, 4.6));
    if (sa > 0) {
      c.globalAlpha = sa;
      panel(c, 306, 46, 78, 80, 0.06);
      c.textAlign = 'center';
      c.fillStyle = P.hue; c.font = fs(24, 800); c.fillText('1/3', 345, 76);
      c.fillStyle = 'rgba(255,255,255,.72)'; c.font = fs(6.6, 600);
      c.fillText('assistants', 345, 98); c.fillText('recommend you', 345, 108);
      c.textAlign = 'left'; c.globalAlpha = 1;
    }
    const la = eout(prog(T, 4.8, 5.2));
    if (la > 0) { c.globalAlpha = la; c.font = fs(7, 650); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillText('Audit bundle', 18, 148); c.globalAlpha = 1; }
    outs.forEach((o, k) => {
      const e = eout(prog(T, 5.0 + k * 0.22, 5.4 + k * 0.22));
      if (!e) return;
      const x = 18 + k * 92, y = 158 + (1 - e) * 8;
      c.globalAlpha = e;
      panel(c, x, y, 84, 30, 0.08);
      c.fillStyle = rgba(P.hue, 0.9);
      c.beginPath(); c.moveTo(x + 9, y + 8); c.lineTo(x + 17, y + 8); c.lineTo(x + 21, y + 12); c.lineTo(x + 21, y + 22); c.lineTo(x + 9, y + 22); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.88)';
      c.font = o === 'llms.txt' ? fm(7) : fs(7, 600);
      c.fillText(o, x + 27, y + 15.5);
    });
    c.globalAlpha = 1;
    const oa = eout(prog(T, 6.4, 6.8));
    if (oa > 0) {
      c.globalAlpha = oa;
      const w = pill(c, 18, 204 + (1 - oa) * 6, 'Lead saved to the CRM with a drafted outreach email', { h: 22, padX: 26, font: fs(7.2, 650), bg: rgba(P.hue, 0.16), stroke: rgba(P.hue, 0.8), fg: '#fff' });
      void w;
      const ex = 28, ey = 211 + (1 - oa) * 6;
      c.strokeStyle = P.hue; c.lineWidth = 1.1;
      c.strokeRect(ex, ey, 11, 8);
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + 5.5, ey + 4.5); c.lineTo(ex + 11, ey); c.stroke();
      c.globalAlpha = 1;
    }
    edgeFade(c, T, 9.5, P.ground);
  };
})();

/* Patchwork: issue in, regression test out. It reads the repo's test patterns,
   writes a test that fails before the fix and passes after, then opens a PR. */
const drawPatchwork = (() => {
  const files = ['__tests__/cart.test.ts', '__tests__/auth.test.ts', 'jest.config.js'];
  const test = [
    "test('cart total uses quantity', () => {",
    "  const cart = [{ price: 10, qty: 3 }];",
    "  expect(cartTotal(cart)).toBe(30);",
    "});"
  ];
  const total = test.reduce((s, l) => s + l.length, 0);
  const steps = [['Read test patterns', 0.8, 2.3], ['Write regression test', 2.3, 4.4], ['Run before and after fix', 4.4, 6.1], ['Open pull request', 6.1, 6.9]];
  return function (c, T, P) {
    base(c, P);
    c.font = fs(7.6, 650);
    const issue = 'Issue #12   Cart total ignores quantity';
    const iw = c.measureText(issue).width + 26;
    c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, 16, 12, iw, 20, 10); c.fill();
    c.fillStyle = '#FF6B6B'; c.beginPath(); c.arc(28, 22, 3, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.92)'; c.fillText(issue, 37, 22.5);
    steps.forEach(([label, a0, a1], i) => {
      const y = 58 + i * 30;
      const done = T >= a1, active = T >= a0 && T < a1;
      c.globalAlpha = T >= a0 - 0.2 ? 1 : 0.45;
      if (done) { c.fillStyle = P.hue; c.beginPath(); c.arc(24, y, 5, 0, TAU); c.fill(); check(c, 24, y, 5, P.ground); }
      else if (active) {
        c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.3; c.beginPath(); c.arc(24, y, 4.6, 0, TAU); c.stroke();
        c.strokeStyle = P.hue; c.beginPath(); const s = T * 6; c.arc(24, y, 4.6, s, s + 1.7); c.stroke();
      } else { c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.2; c.beginPath(); c.arc(24, y, 4.6, 0, TAU); c.stroke(); }
      c.fillStyle = done || active ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.55)';
      c.font = fs(7.3, 650); c.fillText(label, 35, y + 0.5);
      if (i === 1 && T >= a0) { c.font = fs(6.4, 500); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillText('Gemini 2.5 Pro', 35, y + 11); }
      c.globalAlpha = 1;
    });
    panel(c, 160, 44, 224, 190, 0.045);
    const fa = 1 - prog(T, 2.2, 2.5);
    if (fa > 0) {
      c.globalAlpha = fa;
      c.font = fs(6.8, 650); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillText('Repository tests', 170, 58);
      const band = Math.floor(prog(T, 0.8, 2.0) * 3.2);
      files.forEach((f, k) => {
        const y = 76 + k * 17;
        if (T > 0.8 && k === Math.min(2, band)) { c.fillStyle = rgba(P.hue, 0.14); c.fillRect(166, y - 7, 212, 14); }
        c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(172, y - 4, 7, 9);
        c.font = fm(7.2); c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText(f, 185, y + 0.5);
      });
      const da = eout(prog(T, 1.7, 2.0));
      if (da > 0) { c.globalAlpha = fa * da; pill(c, 170, 130, 'Matched the repo test style', { h: 16, padX: 8, font: fs(6.8, 650), bg: rgba(P.hue, 0.18), stroke: rgba(P.hue, 0.75) }); }
      c.globalAlpha = 1;
    }
    const ca = eout(prog(T, 2.3, 2.6));
    if (ca > 0) {
      c.globalAlpha = ca;
      c.font = fm(6.4); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillText('__tests__/regression/issue-12.test.ts', 170, 58);
      let n = Math.floor(prog(T, 2.6, 4.3) * total);
      c.font = fm(7.4);
      const cw = c.measureText('M').width;
      test.forEach((l, j) => {
        const y = 78 + j * 13;
        const s = l.slice(0, Math.max(0, n));
        n -= l.length;
        c.fillStyle = 'rgba(232,255,238,.92)'; c.fillText(s, 170, y);
        if (s.length < l.length && s.length > 0 && Math.floor(T * 4) % 2) { c.fillStyle = P.hue; c.fillRect(170 + s.length * cw + 1, y - 5, 1.6, 10); }
      });
      const r1 = eout(prog(T, 4.7, 5.0));
      if (r1 > 0) {
        c.globalAlpha = ca * r1;
        c.fillStyle = '#FF6B6B'; c.beginPath(); c.arc(176, 144, 5, 0, TAU); c.fill(); cross(c, 176, 144, 5, P.ground);
        c.fillStyle = '#fff'; c.font = fs(7.2, 650); c.fillText('Before fix', 186, 144.5);
        c.fillStyle = '#FFB0B0'; c.font = fm(6.8); c.fillText('Expected 30, received 10', 238, 144.5);
      }
      const r2 = eout(prog(T, 5.5, 5.8));
      if (r2 > 0) {
        c.globalAlpha = ca * r2;
        c.fillStyle = P.hue; c.beginPath(); c.arc(176, 162, 5, 0, TAU); c.fill(); check(c, 176, 162, 5, P.ground);
        c.fillStyle = '#fff'; c.font = fs(7.2, 650); c.fillText('After fix', 186, 162.5);
        c.fillStyle = rgba(P.hue, 1); c.font = fm(6.8); c.fillText('Passed', 238, 162.5);
      }
      c.globalAlpha = 1;
    }
    const pa = eout(prog(T, 6.3, 6.8));
    if (pa > 0) {
      const x = 170, y = 182 + (1 - pa) * 14, w = 206, h = 44;
      c.globalAlpha = pa;
      c.fillStyle = P.card; rr(c, x, y, w, h, 8); c.fill();
      c.strokeStyle = rgba(P.hue, 0.8); c.lineWidth = 1; rr(c, x + 0.5, y + 0.5, w - 1, h - 1, 8); c.stroke();
      c.fillStyle = P.hue; c.beginPath(); c.arc(x + 12, y + 14, 3.2, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.font = fs(7.6, 700); c.fillText('Pull request #13 opened', x + 21, y + 14.5);
      c.fillStyle = 'rgba(255,255,255,.68)'; c.font = fs(6.8, 500); c.fillText('Adds one test file, no production code', x + 21, y + 29);
      c.globalAlpha = 1;
    }
    edgeFade(c, T, 9.5, P.ground);
  };
})();

/* Agentically: the agent picks a retrieval mode. A hybrid question fires vector
   search and exact lookup in parallel, then Claude answers with citations. */
const drawAgentically = (() => {
  const modes = ['Semantic', 'Exact citation', 'Browse', 'Hybrid'];
  const R = rng(11);
  const pts = [];
  for (let i = 0; i < 64; i++) pts.push({ x: 24 + R() * 160, y: 92 + R() * 66, ph: R() * TAU });
  const Q = { x: 106, y: 126 };
  const near = pts.map((p, i) => ({ i, d: Math.hypot(p.x - Q.x, p.y - Q.y) })).sort((a, b) => a.d - b.d).slice(0, 4).map(o => o.i);
  const docW = [150, 132, 160, 118, 144, 96];
  return function (c, T, P) {
    base(c, P);
    c.globalAlpha = eout(prog(T, 0.3, 0.7));
    pill(c, 16, 12, 'Explain QM.1 and show me the exact text', { font: fs(7.6, 650), h: 20, padX: 10, bg: 'rgba(255,255,255,.93)', fg: P.ground });
    c.globalAlpha = 1;
    c.font = fs(7, 650); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillText('Route', 18, 50.5);
    let x = 52;
    const scan = T > 0.8 && T < 1.8 ? Math.floor((T - 0.8) * 5) % 4 : -1;
    const chosen = T >= 1.8;
    modes.forEach((m, i) => {
      c.font = fs(6.8, 650);
      const w = c.measureText(m).width + 14;
      let bg = 'rgba(255,255,255,.07)', fg = 'rgba(255,255,255,.7)', st = null;
      if (i === scan) bg = 'rgba(255,255,255,.18)';
      if (chosen && i === 3) { bg = P.hue; fg = P.ground; }
      if (T >= 2.0 && (i === 0 || i === 1)) { st = rgba(P.hue, 0.9); fg = '#fff'; }
      pill(c, x, 42, m, { h: 16, padX: 7, font: fs(6.8, 650), bg, fg, stroke: st });
      x += w + 6;
    });
    const ba = eout(prog(T, 6.3, 6.7));
    if (ba > 0) { c.globalAlpha = ba; pill(c, 384, 42, '13/13 eval queries', { right: true, h: 16, padX: 7, font: fs(6.6, 700), bg: rgba(P.hue, 0.2), stroke: rgba(P.hue, 0.85) }); c.globalAlpha = 1; }
    const la = eout(prog(T, 2.0, 2.4));
    c.globalAlpha = la;
    panel(c, 16, 70, 178, 96, 0.045);
    c.font = fs(6.9, 650); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('Vector search', 26, 82);
    c.textAlign = 'right'; c.font = fs(6.4, 500); c.fillStyle = 'rgba(255,255,255,.42)'; c.fillText('1,919 chunks', 186, 82); c.textAlign = 'left';
    const ray = eio(prog(T, 2.5, 3.4));
    pts.forEach((p, i) => {
      const px = p.x + Math.sin(T * 0.6 + p.ph) * 1.4, py = p.y + Math.cos(T * 0.5 + p.ph) * 1.4;
      const on = near.includes(i) && ray > 0.98;
      c.fillStyle = on ? P.hue : 'rgba(255,255,255,.24)';
      c.beginPath(); c.arc(px, py, on ? 2.8 : 1.5, 0, TAU); c.fill();
      if (near.includes(i) && ray > 0) {
        c.strokeStyle = rgba(P.hue, 0.7); c.lineWidth = 0.9;
        c.beginPath(); c.moveTo(Q.x, Q.y); c.lineTo(lerp(Q.x, px, ray), lerp(Q.y, py, ray)); c.stroke();
      }
    });
    c.fillStyle = '#fff'; c.beginPath(); c.arc(Q.x, Q.y, 3.4, 0, TAU); c.fill();
    panel(c, 202, 70, 182, 96, 0.045);
    c.font = fs(6.9, 650); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('Exact lookup', 212, 82);
    c.textAlign = 'right'; c.font = fm(6.8); c.fillStyle = P.hue; c.fillText('QM.1', 376, 82); c.textAlign = 'left';
    const sweep = prog(T, 2.6, 3.5);
    docW.forEach((w, k) => {
      const y = 96 + k * 11;
      const hl = k >= 1 && k <= 3 && sweep * 4 > k - 0.5;
      if (hl) { c.fillStyle = rgba(P.hue, 0.18); c.fillRect(208, y - 4.5, 170, 9); }
      c.fillStyle = hl ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.2)';
      rr(c, 212, y - 1.6, w, 3.2, 1.6); c.fill();
    });
    c.globalAlpha = 1;
    const aa = eout(prog(T, 4.1, 4.5));
    if (aa > 0) {
      c.globalAlpha = aa;
      panel(c, 16, 176, 368, 62, 0.075);
      c.font = fs(7.4, 700); c.fillStyle = '#fff'; c.fillText('Answer', 26, 189);
      c.textAlign = 'right'; c.font = fs(6.4, 500); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillText('Claude', 376, 189); c.textAlign = 'left';
      [[230, 'QM.1'], [196, '2'], [120, null]].forEach(([w, cite], j) => {
        const e = eout(prog(T, 4.5 + j * 0.35, 4.9 + j * 0.35));
        if (!e) return;
        const y = 204 + j * 11;
        c.fillStyle = 'rgba(255,255,255,.34)'; rr(c, 26, y - 2, w * e, 4, 2); c.fill();
        if (cite && e >= 1) {
          c.font = fs(6, 750);
          const cw = c.measureText(cite).width + 8;
          c.fillStyle = P.hue; rr(c, 26 + w + 4, y - 4.5, cw, 9, 2.5); c.fill();
          c.fillStyle = P.ground; c.fillText(cite, 26 + w + 8, y + 0.3);
        }
      });
      c.globalAlpha = 1;
    }
    edgeFade(c, T, 9.5, P.ground);
  };
})();

/* Rutgers LLM Benchmarking: real results from the README. Phase 1 accuracy over
   14 prompts, then Phase 2 citation validity in the PDF RAG eval. */
const drawLLM = (() => {
  const p1 = [['Llama 3.1 8B', 0.86], ['Qwen 2.5 7B', 0.80], ['Phi-3.5 Mini', 0.71], ['Mistral 7B', 0.54]];
  const p2 = [['Phi-3.5 Mini', 1.0], ['Qwen 2.5 7B', 1.0], ['Llama 3.1 8B', 0.90], ['Mistral 7B', 0.80]];
  function phase(c, T, P, data, tag, title, sub, t0, note, noteT) {
    pill(c, 16, 14, tag, { h: 16, padX: 7, font: fs(6.8, 750), bg: P.hue, fg: P.ground });
    c.font = fs(7.8, 700); c.fillStyle = '#fff'; c.fillText(title, 72, 22.5);
    c.font = fs(6.8, 500); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillText(sub, 18, 42);
    data.forEach(([name, v], i) => {
      const y = 66 + i * 28;
      c.font = fm(7.2); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(name, 18, y + 0.5);
      c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, 84, y - 5, 240, 10, 5); c.fill();
      const e = eio(prog(T, t0 + i * 0.2, t0 + 1.5 + i * 0.2));
      c.fillStyle = i === 0 ? P.hue : rgba(P.hue, 0.62);
      rr(c, 84, y - 5, 240 * v * e, 10, 5); c.fill();
      if (e > 0) { c.font = fs(7.4, 700); c.fillStyle = '#fff'; c.fillText(Math.round(v * e * 100) + '%', 332, y + 0.5); }
    });
    const na = eout(prog(T, noteT, noteT + 0.4));
    if (na > 0) {
      const a0 = c.globalAlpha;
      c.globalAlpha = a0 * na;
      pill(c, 16, 186, note, { h: 20, padX: 9, font: fs(7, 650), bg: rgba(P.hue, 0.16), stroke: rgba(P.hue, 0.8) });
      c.globalAlpha = a0;
    }
  }
  return function (c, T, P) {
    base(c, P);
    const x = prog(T, 4.9, 5.4);
    if (x < 1) { c.globalAlpha = 1 - x; phase(c, T, P, p1, 'Phase 1', 'Accuracy across 14 prompts', '9 capability categories, 4 local GGUF models', 0.4, 'Llama 3.1 8B was the most consistent across runs', 3.0); }
    if (x > 0) { c.globalAlpha = x; phase(c, T, P, p2, 'Phase 2', 'Citation validity, RAG over PDFs', '10-question eval with page-number citations', 5.4, 'Cloud baseline, Groq Llama 3 70B: about 40x faster', 8.0); }
    c.globalAlpha = 1;
    c.font = fm(6.4); c.fillStyle = 'rgba(255,255,255,.38)'; c.fillText('llama-cpp-python, Q4_K_M', 18, 230);
    edgeFade(c, T, 10, P.ground);
  };
})();

/* F1 Race Rewind: fork a real race at a lap, change the strategy, replay actual
   against what-if. Demo scenario from the README. */
const drawF1 = (() => {
  const cx = 118, cy = 132, rx = 86, ry = 66;
  const path = th => [cx + rx * Math.cos(th) + 14 * Math.cos(2 * th), cy + ry * Math.sin(th) - 10 * Math.sin(2 * th)];
  const field = [0.03, -0.05, -0.09, -0.14];
  function prg(i, T) { return 0.07 * T + field[i]; }
  function actual(T) { return 0.07 * T; }
  function whatIf(T) {
    const A = 2.2, B = 3.2, s = 0.07;
    if (T < A) return s * T;
    if (T < B) return s * A + s * 0.4 * (T - A);
    return s * A + s * 0.4 * (B - A) + s * 1.13 * (T - B);
  }
  const lapsX = n => 246 + (n - 50) / 8 * 128;
  return function (c, T, P) {
    base(c, P);
    c.font = fs(7.6, 700); c.fillStyle = '#fff'; c.fillText('2021 Abu Dhabi Grand Prix', 18, 16);
    c.font = fs(6.8, 600); c.fillStyle = P.hue; c.fillText('Fork at lap 52: pit on lap 53 for Softs', 18, 29);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    for (let k = 0; k <= 160; k++) { const [x, y] = path(k / 160 * TAU); k ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath();
    c.strokeStyle = 'rgba(255,255,255,.09)'; c.lineWidth = 13; c.stroke();
    c.setLineDash([3, 5]); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1; c.stroke(); c.setLineDash([]);
    const [s0x, s0y] = path(0);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2; c.beginPath(); c.moveTo(s0x - 8, s0y); c.lineTo(s0x + 8, s0y); c.stroke();
    const at = (p, inward) => {
      const th = TAU * (((p % 1) + 1) % 1);
      let [x, y] = path(th);
      if (inward) { const dx = cx - x, dy = cy - y, d = Math.hypot(dx, dy); x += dx / d * inward; y += dy / d * inward; }
      return [x, y];
    };
    field.forEach((_, i) => {
      const [x, y] = at(prg(i, T), 0);
      c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.fill();
    });
    const [ax, ay] = at(actual(T), 0);
    c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.beginPath(); c.arc(ax, ay, 4.4, 0, TAU); c.stroke();
    const pit = Math.sin(Math.PI * prog(T, 2.0, 3.4));
    const [wx, wy] = at(whatIf(T), 13 * pit);
    const pr = (T * 1.4) % 1;
    c.strokeStyle = rgba(P.hue, 0.55 * (1 - pr)); c.lineWidth = 1.2; c.beginPath(); c.arc(wx, wy, 5 + pr * 9, 0, TAU); c.stroke();
    c.fillStyle = P.hue; c.strokeStyle = P.ground; c.lineWidth = 1.6; c.beginPath(); c.arc(wx, wy, 4.6, 0, TAU); c.fill(); c.stroke();
    const lx = 246;
    c.strokeStyle = '#fff'; c.lineWidth = 1.4; c.beginPath(); c.arc(lx + 4, 50, 3.6, 0, TAU); c.stroke();
    c.font = fs(7, 600); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText('Actual', lx + 13, 50.5);
    c.fillStyle = P.hue; c.beginPath(); c.arc(lx + 64, 50, 3.6, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText('What-if', lx + 73, 50.5);
    const lap = Math.min(58, 50 + Math.floor(T * 0.9));
    c.font = fs(7.4, 700); c.fillStyle = '#fff'; c.fillText(`Replay, lap ${lap} of 58`, lx, 70);
    panel(c, 238, 82, 148, 112, 0.05);
    c.font = fs(6.6, 650); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillText('Gap to leader', 246, 93);
    const fx = lapsX(52);
    c.setLineDash([2, 3]); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(fx, 102); c.lineTo(fx, 184); c.stroke(); c.setLineDash([]);
    c.font = fs(6.2, 600); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillText('Fork', fx + 3, 106);
    const upto = 50 + clamp(T / 8.6, 0, 1) * 8;
    const gy = 150;
    const aY = n => gy + Math.sin(n * 1.3) * 3;
    const wY = n => n <= 52 ? aY(n) : gy + (n < 54 ? (n - 52) * 12 : 24 - (n - 54) * 7) + Math.sin(n * 1.3) * 2;
    c.lineWidth = 1.6; c.lineCap = 'round';
    [[aY, 'rgba(255,255,255,.7)'], [wY, P.hue]].forEach(([fn, col]) => {
      c.strokeStyle = col; c.beginPath();
      for (let n = 50; n <= upto + 0.001; n += 0.25) { const x = lapsX(n), y = fn(n); n === 50 ? c.moveTo(x, y) : c.lineTo(x, y); }
      c.stroke();
    });
    c.font = fs(6.2, 500); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillText('Lap 50', 246, 188); c.textAlign = 'right'; c.fillText('58', 378, 188); c.textAlign = 'left';
    c.font = fs(6.8, 600); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('6 historical races', 246, 212);
    c.fillText('Pit earlier, pit later, or swap tyres', 246, 224);
    const kx = 18 + 200 * clamp(T / 9.4, 0, 1);
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(18, 236, 200, 2);
    c.fillStyle = P.hue; c.fillRect(18, 236, kx - 18, 2);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(kx, 237, 3.6, 0, TAU); c.fill();
    edgeFade(c, T, 10, P.ground);
  };
})();

/* Cohesity Auto-Triage: logs stream in, failures get classified as product,
   automation or environment issues, and the two resume metrics land. */
const drawTriage = (() => {
  const lines = [
    ['INFO', 'backup job 4812 started'],
    ['WARN', 'retry 2/3 on node-07'],
    ['ERROR', 'assertion failed: snapshot size'],
    ['INFO', 'replica sync ok'],
    ['ERROR', 'timeout waiting for cluster VIP'],
    ['INFO', 'test_restore_vm passed'],
    ['ERROR', "KeyError 'policy_id' in setup"],
    ['WARN', 'disk latency 220 ms'],
    ['INFO', 'verifying checksums'],
    ['ERROR', 'restore returned stale index'],
    ['INFO', 'cleanup complete'],
    ['ERROR', 'host unreachable: esx-12']
  ];
  const errCat = { 2: 0, 4: 2, 6: 1, 9: 0, 11: 2 };
  const cats = ['Product', 'Automation', 'Environment'];
  const startW = [0.42, 0.3, 0.22];
  const appear = k => 0.3 + k * 0.3;
  return function (c, T, P) {
    base(c, P);
    panel(c, 16, 14, 182, 222, 0.045);
    c.font = fs(7, 650); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('Test logs', 26, 27);
    const n = Math.floor(150000 * eio(prog(T, 0.3, 4.0)));
    c.textAlign = 'right'; c.font = fm(6.6); c.fillStyle = 'rgba(255,255,255,.5)';
    c.fillText(T >= 4.0 ? '150,000+ events' : n.toLocaleString('en-US') + ' events', 190, 27);
    c.textAlign = 'left';
    lines.forEach(([lvl, msg], k) => {
      const a = eout(prog(T, appear(k), appear(k) + 0.25));
      if (!a) return;
      const y = 44 + k * 15.5;
      c.globalAlpha = a;
      const isErr = lvl === 'ERROR';
      const classified = isErr && T > appear(k) + 0.35;
      if (classified) { c.fillStyle = rgba(P.hue, 0.14); c.fillRect(20, y - 6.5, 174, 13); }
      c.font = fm(6.2, 700);
      c.fillStyle = isErr ? (classified ? P.hue : '#FF8A8A') : lvl === 'WARN' ? '#F2C36B' : 'rgba(255,255,255,.4)';
      c.fillText(lvl, 24, y + 0.5);
      c.font = fm(6.4); c.fillStyle = isErr ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.55)';
      c.fillText(msg, 58, y + 0.5);
      c.globalAlpha = 1;
    });
    c.font = fs(7, 650); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('Classified failures', 210, 27);
    const counts = [0, 0, 0];
    for (const [k, cat] of Object.entries(errCat)) {
      const t0 = appear(+k) + 0.35;
      const p = prog(T, t0, t0 + 0.65);
      if (p >= 1) counts[cat]++;
      else if (p > 0) {
        const e = eio(p);
        const sy = 44 + (+k) * 15.5, ty = 46 + cat * 26;
        c.fillStyle = P.hue; c.beginPath();
        c.arc(lerp(196, 280, e), lerp(sy, ty, e) - Math.sin(e * Math.PI) * 10, 2.6, 0, TAU); c.fill();
      }
    }
    cats.forEach((name, i) => {
      const y = 46 + i * 26;
      c.font = fs(7, 600); c.fillStyle = 'rgba(255,255,255,.82)'; c.fillText(name, 210, y + 0.5);
      c.fillStyle = 'rgba(255,255,255,.08)'; rr(c, 268, y - 4.5, 116, 9, 4.5); c.fill();
      const w = 116 * clamp(startW[i] + counts[i] * 0.16, 0, 1);
      c.fillStyle = i === 0 ? P.hue : rgba(P.hue, 0.6); rr(c, 268, y - 4.5, w, 9, 4.5); c.fill();
    });
    const ka = eout(prog(T, 5.0, 5.4)), kb = eout(prog(T, 5.7, 6.1));
    panel(c, 206, 128, 178, 108, 0.055);
    if (ka > 0) {
      c.globalAlpha = ka;
      c.font = fs(6.8, 600); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('Debugging turnaround', 216, 146);
      c.font = fs(26, 800); c.fillStyle = P.hue; c.fillText('-37%', 216, 172);
    }
    if (kb > 0) {
      c.globalAlpha = kb;
      c.font = fs(6.8, 600); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('Manual QA effort', 216, 200);
      c.font = fs(18, 800); c.fillStyle = '#fff'; c.fillText('-20%', 216, 220);
    }
    c.globalAlpha = 1;
    edgeFade(c, T, 9.5, P.ground);
  };
})();


/* Rutgers production apps: one browser window, one tab per app.
   The SEL App is public, so its two screens follow the live site at
   selapp.psych.rutgers.edu (colors, nav, resource cards and their real titles).
   The Resident Survival Guide sits behind Rutgers NetID, so after its real sign-in
   screen the library and PDF viewer are a stand-in drawn from the app's features.
   Static parts are painted once per scale into small layers and reused, so a frame
   is mostly image copies and stays as cheap as the other covers on phones. */
const drawRutgers = (() => {
  const SEL = { bg: '#222836', coral: '#DF6A61', text: '#EA786F', field: '#3A4153', side: '#3A4050', blue: '#5B83E5', green: '#429E4B' };
  const RSG = { bg: '#F5F5F5', red: '#BB2639', redDk: '#961C2C', ink: '#1F2023', soft: '#74777C', line: '#E1E2E4' };
  const WX = 14, WY = 12, WW = 372, WH = 226, CY = 48, NAVY = 63, BODY = 75;
  const TABS = [
    { title: 'Social Emotional Learning', url: 'selapp.psych.rutgers.edu', fav: SEL.coral, x: 48 },
    { title: 'Resident Survival Guide', url: 'rsgapp.gme.rutgers.edu', fav: RSG.red, x: 196 }
  ];
  const TABW = 146;
  const NAV = ['Resources', 'Categories', 'FAQ', 'Help', 'About Us'];
  const HERO = ['Culturally Responsive Education: Essential and Connected to SEL', 'Resource on Confronting Racial Discrimination in Student Discipline', 'Teaching Young Children About Bias, Diversity, and Social Justice'];
  const TOP = [
    ['doc', 'Culturally Responsive Education: Essential and Connected to SEL'],
    ['doc', 'Resource on Confronting Racial Discrimination in Student Discipline'],
    ['doc', 'Teaching Young Children About Bias, Diversity, and Social Justice'],
    ['video', 'Teaching Culturally Diverse Classrooms'],
    ['pod', 'Empowering Educators: ChatGPT’s Role in Facilitating SEL in the Classroom with Dr. Monica Burns']
  ];
  const TYPES = [['all', ''], ['article', '4'], ['podcast', '0'], ['video', '0'], ['mp3', '0']];
  const CHIPS = ['All', 'Assessment', 'Bullying and SEL', 'Character Development Basics', 'Classroom Practices', 'Parent Education'];
  const CARDS = [
    ['Guidelines for effective SEL implementation', 'proficient'],
    ['How to use RTI’s Guidebook on promoting social and emotional learning in the classroom', 'advanced'],
    ['Measuring Social-Emotional Skills: Designs Show Current State of Assessment', 'advanced'],
    ['SEL Assessment guide: a one stop shop for real world examples of how progress is being measured', 'advanced']
  ];
  const LEVEL = { proficient: ['#FFEAFF', '#694B8B'], advanced: ['#FFDCDE', '#B8433F'] };
  const GUIDES = ['Orientation', 'Night float', 'Admissions', 'Consults', 'Procedures', 'Discharges', 'Call schedule', 'Night admits'];
  const PAGES = [6, 12, 8, 5, 9, 7, 4, 10];
  const THUMB = ['#E9D8C8', '#CCDAEA', '#D7E5D0', '#EAD6E2', '#DAD7EE', '#EEE2C6', '#CFE3E4', '#E6D2D2'];
  const MATCH = [1, 7];
  const QUERY = 'night';
  const CLICKS = [1.42, 5.05, 6.3, 7.2, 9.0, 9.55];
  const PATH = [
    [0, 318, 212], [0.75, 318, 212], [1.35, 54, 69],
    [1.75, 54, 69], [2.55, 140, 150],
    [4.3, 140, 150], [4.95, 268, 22],
    [5.45, 268, 22], [6.15, 204, 150],
    [6.85, 204, 150], [7.15, 128, 80],
    [8.45, 128, 80], [8.95, 95, 105],
    [9.15, 95, 105], [9.45, 66, 118],
    [9.75, 66, 118], [10.4, 318, 212], [12, 318, 212]
  ];
  const cardX = i => 92 + (i % 3) * 98, cardY = i => 107 + Math.floor(i / 3) * 106;
  const slotX = i => 22 + (i % 4) * 90, slotY = i => 94 + Math.floor(i / 4) * 68;

  /* Layer cache, one set per drawing scale (strip card, open project) */
  const caches = new Map();
  function layerSet(sx, sy) {
    if (!wrapCache.has('rutgers-layers')) { caches.clear(); wrapCache.set('rutgers-layers', true); }
    const key = sx.toFixed(4) + ',' + sy.toFixed(4);
    let set = caches.get(key);
    if (!set) {
      set = new Map();
      caches.set(key, set);
      if (caches.size > 3) caches.delete(caches.keys().next().value);
    }
    return set;
  }
  /* Draws a region painted by paint() at offset (dx, dy) and scale s, all in design units.
     Must be called while the context holds the plain design transform. */
  function blit(c, name, x, y, w, h, paint, dx = 0, dy = 0, s = 1) {
    const m = c.getTransform(), sx = m.a, sy = m.d;
    if (sx * sy > 7) {
      c.save();
      if (s !== 1) { c.translate(x + w / 2 + dx, y + h / 2 + dy); c.scale(s, s); c.translate(-(x + w / 2), -(y + h / 2)); }
      else if (dx || dy) c.translate(dx, dy);
      paint(c);
      c.restore();
      return;
    }
    const set = layerSet(sx, sy);
    let L = set.get(name);
    if (!L) {
      const X = Math.floor(x * sx), Y = Math.floor(y * sy);
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.ceil((x + w) * sx) - X);
      cv.height = Math.max(1, Math.ceil((y + h) * sy) - Y);
      const lc = cv.getContext('2d');
      lc.setTransform(sx, 0, 0, sy, -X, -Y);
      lc.textBaseline = 'middle'; lc.textAlign = 'left';
      paint(lc);
      L = { cv, X, Y };
      set.set(name, L);
    }
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (s !== 1) {
      const W = L.cv.width * s, H = L.cv.height * s;
      const cx = L.X + L.cv.width / 2 + dx * sx, cy = L.Y + L.cv.height / 2 + dy * sy;
      c.drawImage(L.cv, cx - W / 2, cy - H / 2, W, H);
    } else c.drawImage(L.cv, L.X + Math.round(dx * sx), L.Y + Math.round(dy * sy));
    c.restore();
  }

  function fit(c, text, maxW) {
    const key = 'fit|' + c.font + '|' + maxW + '|' + text;
    let r = wrapCache.get(key);
    if (r !== undefined) return r;
    if (c.measureText(text).width <= maxW) r = text;
    else {
      let s = text;
      while (s.length > 1 && c.measureText(s + '…').width > maxW) s = s.slice(0, -1);
      r = s.trimEnd() + '…';
    }
    wrapCache.set(key, r);
    return r;
  }
  function lines(c, text, maxW, n) {
    const key = 'clamp|' + c.font + '|' + maxW + '|' + n + '|' + text;
    let r = wrapCache.get(key);
    if (r) return r;
    const all = wrap(c, text, maxW);
    r = all.length <= n ? all.slice() : all.slice(0, n - 1).concat([fit(c, all.slice(n - 1).join(' '), maxW)]);
    wrapCache.set(key, r);
    return r;
  }
  function cursorAt(T) {
    for (let i = 1; i < PATH.length; i++) {
      const [t1, x1, y1] = PATH[i], [t0, x0, y0] = PATH[i - 1];
      if (T <= t1) { const k = eio(prog(T, t0, t1)); return [lerp(x0, x1, k), lerp(y0, y1, k)]; }
    }
    const L = PATH[PATH.length - 1];
    return [L[1], L[2]];
  }

  /* Small glyphs */
  function magnifier(c, x, y, s, color) {
    c.strokeStyle = color; c.lineWidth = 0.9; c.lineCap = 'round';
    c.beginPath(); c.arc(x, y, s * 0.36, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.26, y + s * 0.26); c.lineTo(x + s * 0.55, y + s * 0.55); c.stroke();
  }
  function bookmark(c, x, y, color) {
    c.strokeStyle = color; c.lineWidth = 0.8; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - 2.2, y - 3); c.lineTo(x + 2.2, y - 3); c.lineTo(x + 2.2, y + 3); c.lineTo(x, y + 1.6); c.lineTo(x - 2.2, y + 3); c.closePath(); c.stroke();
  }
  function typeIcon(c, kind, x, y, color) {
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 0.75;
    if (kind === 'doc') {
      c.strokeRect(x - 2.2, y - 2.6, 4.4, 5.2);
      c.beginPath(); c.moveTo(x - 1.2, y - 0.9); c.lineTo(x + 1.2, y - 0.9); c.moveTo(x - 1.2, y + 0.6); c.lineTo(x + 1.2, y + 0.6); c.stroke();
    } else if (kind === 'video') {
      c.strokeRect(x - 2.6, y - 2.2, 5.2, 4.4);
      c.beginPath(); c.moveTo(x - 0.8, y - 1.2); c.lineTo(x + 1.3, y); c.lineTo(x - 0.8, y + 1.2); c.closePath(); c.fill();
    } else {
      c.beginPath(); c.arc(x, y + 0.6, 2.4, Math.PI, TAU); c.stroke();
      c.fillRect(x - 2.7, y + 0.2, 1.2, 2.2); c.fillRect(x + 1.5, y + 0.2, 1.2, 2.2);
    }
  }
  function lock(c, x, y, s, color) {
    c.strokeStyle = color; c.lineWidth = s * 0.14; c.lineCap = 'round';
    c.beginPath(); c.arc(x, y - s * 0.12, s * 0.27, Math.PI, TAU); c.stroke();
    c.beginPath(); c.moveTo(x - s * 0.27, y - s * 0.12); c.lineTo(x - s * 0.27, y + s * 0.05); c.moveTo(x + s * 0.27, y - s * 0.12); c.lineTo(x + s * 0.27, y + s * 0.05); c.stroke();
    c.fillStyle = color; rr(c, x - s * 0.42, y + 0.02 * s, s * 0.84, s * 0.6, s * 0.1); c.fill();
  }
  function pin(c, x, y, on) {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill();
    c.strokeStyle = on ? RSG.red : '#C9CBCF'; c.lineWidth = 0.7; c.stroke();
    c.lineWidth = 0.8; c.lineCap = 'round'; c.strokeStyle = on ? RSG.red : '#7C7F84';
    c.beginPath(); c.arc(x, y - 1.1, 1.6, 0, TAU);
    if (on) { c.fillStyle = RSG.red; c.fill(); }
    c.stroke();
    c.beginPath(); c.moveTo(x, y + 0.5); c.lineTo(x, y + 3); c.stroke();
  }
  function arrow(c, x, y, press) {
    c.save();
    c.translate(x, y);
    const s = press ? 0.86 : 1;
    c.scale(s, s);
    c.beginPath();
    c.moveTo(0, 0); c.lineTo(0, 10.6); c.lineTo(2.7, 8.2); c.lineTo(4.5, 12.2); c.lineTo(6.2, 11.4); c.lineTo(4.5, 7.6); c.lineTo(7.9, 7.6); c.closePath();
    c.fillStyle = '#fff'; c.fill();
    c.strokeStyle = '#111317'; c.lineWidth = 0.8; c.lineJoin = 'round'; c.stroke();
    c.restore();
  }

  /* Painters for the cached layers */
  const paintFrame = (active, hue) => c => {
    c.fillStyle = '#171C26'; rr(c, WX, WY, WW, WH, 8); c.fill();
    c.fillStyle = 'rgba(255,255,255,.16)';
    [24, 31, 38].forEach(x => { c.beginPath(); c.arc(x, 21.5, 2, 0, TAU); c.fill(); });
    TABS.forEach((tb, i) => {
      const on = i === active;
      if (on) {
        c.fillStyle = '#2A303C';
        c.beginPath();
        c.moveTo(tb.x - 3, 31); c.quadraticCurveTo(tb.x, 31, tb.x, 27.5);
        c.lineTo(tb.x, 18.5); c.quadraticCurveTo(tb.x, 15.5, tb.x + 3, 15.5);
        c.lineTo(tb.x + TABW - 3, 15.5); c.quadraticCurveTo(tb.x + TABW, 15.5, tb.x + TABW, 18.5);
        c.lineTo(tb.x + TABW, 27.5); c.quadraticCurveTo(tb.x + TABW, 31, tb.x + TABW + 3, 31);
        c.closePath(); c.fill();
      }
      c.fillStyle = tb.fav; rr(c, tb.x + 7, 20, 6, 6, 1.5); c.fill();
      c.font = fs(6.4, on ? 650 : 500);
      c.fillStyle = on ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.5)';
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(fit(c, tb.title, TABW - 30), tb.x + 17, 23.3);
      c.strokeStyle = on ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.25)'; c.lineWidth = 0.7; c.lineCap = 'round';
      const cx = tb.x + TABW - 9;
      c.beginPath(); c.moveTo(cx - 1.6, 21.7); c.lineTo(cx + 1.6, 24.9); c.moveTo(cx + 1.6, 21.7); c.lineTo(cx - 1.6, 24.9); c.stroke();
    });
    c.fillStyle = '#2A303C'; c.fillRect(WX, 31, WW, CY - 31);
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 0.9; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(25, 37); c.lineTo(22.5, 39.5); c.lineTo(25, 42); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.22)';
    c.beginPath(); c.moveTo(32, 37); c.lineTo(34.5, 39.5); c.lineTo(32, 42); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.45)';
    c.beginPath(); c.arc(44, 39.5, 2.6, -0.3, TAU - 1.2); c.stroke();
    c.fillStyle = '#171C26'; rr(c, 52, 34, 326, 11, 5.5); c.fill();
    lock(c, 59, 39.4, 5.2, 'rgba(255,255,255,.55)');
    c.font = fs(6.3, 500); c.fillStyle = 'rgba(255,255,255,.86)'; c.textAlign = 'left';
    c.fillText(TABS[active].url, 65, 39.8);
    c.fillStyle = hue; c.beginPath(); c.arc(354, 39.5, 1.7, 0, TAU); c.fill();
    c.font = fs(5.8, 700); c.fillText('Live', 359, 39.8);
  };
  const paintSelChrome = navOn => c => {
    c.fillStyle = SEL.bg; c.fillRect(WX, CY, WW, BODY - CY);
    c.strokeStyle = SEL.coral; c.lineWidth = 0.9;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(21, 52.5 + k * 2.8); c.lineTo(28, 52.5 + k * 2.8); c.stroke(); }
    c.fillStyle = SEL.field; rr(c, 33, 51, 64, 9, 4.5); c.fill();
    c.font = fs(4.8, 500); c.fillStyle = 'rgba(255,255,255,.78)'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('Search here …', 37, 55.7);
    magnifier(c, 91.5, 54.8, 5, SEL.coral);
    c.font = fs(7.8, 500); c.fillStyle = SEL.text; c.fillText('Social Emotional Learning', 103, 55.8);
    c.font = fs(5, 500); c.textAlign = 'right'; c.fillText('Login / Create Account', 379, 55.8); c.textAlign = 'left';
    c.fillStyle = SEL.coral; c.fillRect(WX, NAVY, WW, BODY - NAVY);
    NAV.forEach((n, i) => {
      const cx = WX + WW * (i + 0.5) / 5;
      if (i === 0 && navOn) { c.fillStyle = SEL.bg; c.fillRect(cx - 22, NAVY, 44, BODY - NAVY); }
      c.font = fs(6, 600); c.textAlign = 'center';
      c.fillStyle = i === 0 && navOn ? SEL.text : '#fff';
      c.fillText(n, cx, 69.4);
    });
    c.textAlign = 'left';
  };
  function heroTile(c, x, w, k) {
    const y = BODY, h = 46;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    if (k === 0) {
      c.fillStyle = '#ECE7DE'; c.fillRect(x, y, w, h);
      c.save(); c.translate(x + w * 0.55, y + h * 0.45); c.rotate(-0.22);
      const L = 'ABCDEFGHIJKL', col = ['#D2493F', '#3D7BC9', '#E2A23A', '#3C9A5F', '#8B5BB8', '#D2493F'];
      c.font = fs(9, 800); c.textAlign = 'center';
      for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) {
        c.fillStyle = col[(r * 4 + q) % col.length];
        c.fillText(L[r * 4 + q], -26 + q * 17, -12 + r * 13);
      }
      c.restore();
      c.strokeStyle = '#E0578F'; c.lineWidth = 2.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x + 4, y + 36); c.lineTo(x + 34, y + 30); c.stroke();
      c.strokeStyle = '#F2C14E'; c.beginPath(); c.moveTo(x + 2, y + 41); c.lineTo(x + 30, y + 37); c.stroke();
    } else {
      c.fillStyle = '#26302D'; c.fillRect(x, y, w, h);
      c.font = fs(17, 400); c.fillStyle = 'rgba(240,240,232,.72)'; c.textAlign = 'center';
      c.fillText('ABC', x + w * 0.58 + (k - 1) * 3, y + 16);
      c.fillStyle = '#C5473F'; c.fillRect(x + 8, y + 27, 38, 5);
      c.fillStyle = '#EDE6D4'; c.fillRect(x + 6, y + 32, 42, 6);
      c.fillStyle = '#5A3A2B'; c.fillRect(x, y + 38, w, 8);
      c.fillStyle = '#9DBFD6'; rr(c, x + 62, y + 34, 12, 3, 1.5); c.fill();
    }
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x, y + h - 11, w, 11);
    c.font = fs(5.6, 600); c.fillStyle = '#fff'; c.textAlign = 'left';
    c.fillText(fit(c, HERO[k], w - 10), x + 5, y + h - 5.3);
    c.restore();
  }
  function paintSelHome(c) {
    c.fillStyle = SEL.bg; c.fillRect(WX, BODY, WW, CY + 190 - BODY);
    heroTile(c, WX, 123, 0); heroTile(c, WX + 124.5, 123, 1); heroTile(c, WX + 249, 123, 2);
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(22, 128.6); c.lineTo(26, 128.6); c.lineTo(24, 131.2); c.closePath(); c.fill();
    c.font = fs(6.4, 650); c.textAlign = 'left'; c.fillText('Top Resources', 29, 130);
    TOP.forEach(([kind, title], i) => {
      const y = 137 + i * 14;
      c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 0.7; rr(c, 24.5, y + 0.5, 355, 10.5, 2.5); c.stroke();
      typeIcon(c, kind, 30, y + 5.8, 'rgba(255,255,255,.75)');
      c.font = fs(5.3, 500); c.fillStyle = 'rgba(255,255,255,.9)';
      c.fillText(fit(c, title, 320), 37, y + 6);
      bookmark(c, 373, y + 5.8, 'rgba(255,255,255,.7)');
    });
  }
  function paintSelTop(c) {
    c.font = fs(6.2, 650); c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('Types', 22, 86);
    TYPES.forEach(([t, n], i) => {
      const y = 96 + i * 11;
      if (i === 0) { c.fillStyle = SEL.side; c.fillRect(20, y - 4.5, 64, 9); c.fillStyle = SEL.blue; c.fillRect(20, y - 4.5, 1.6, 9); }
      c.font = fs(5.2, 500); c.fillStyle = i === 0 ? '#fff' : 'rgba(255,255,255,.82)'; c.fillText(t, 25, y + 0.3);
      if (n) { c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.45)'; c.fillText(n, 81, y + 0.3); c.textAlign = 'left'; }
    });
    c.font = fs(6.2, 650); c.fillStyle = '#fff'; c.fillText('all', 92, 86);
    let x = 92;
    CHIPS.forEach((ch, i) => {
      if (x > 384) return;
      x += pill(c, x, 92, ch, { font: fs(4.9, 600), h: 9, padX: 5, bg: i === 1 ? SEL.green : 'rgba(255,255,255,.11)', fg: i === 1 ? '#fff' : 'rgba(255,255,255,.84)' }) + 4;
    });
    const g = c.createLinearGradient(360, 0, 386, 0);
    g.addColorStop(0, rgba(SEL.bg, 0)); g.addColorStop(1, SEL.bg);
    c.fillStyle = g; c.fillRect(360, 90, 26, 13);
  }
  const paintSelCard = i => c => {
    const x = cardX(i), y = cardY(i), w = 92, h = 100, card = CARDS[i];
    c.fillStyle = '#fff'; rr(c, x, y, w, h, 5); c.fill();
    c.fillStyle = '#E8ECFA'; rr(c, x + 6, y + 6, 9, 9, 2); c.fill();
    c.strokeStyle = '#4E5EA9'; c.lineWidth = 0.7;
    c.strokeRect(x + 8.2, y + 8.3, 2.1, 4.4); c.strokeRect(x + 10.6, y + 8.3, 2.1, 4.4);
    c.font = fs(5.2, 650); c.fillStyle = '#2B2E35'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('Article', x + 18, y + 10.6);
    pill(c, x + 40, y + 6.6, 'website', { font: fs(4.4, 600), h: 8, padX: 3.5, bg: '#F4F4F4', stroke: '#E0E0E0', fg: '#5B5E64' });
    c.font = fs(6, 750); c.fillStyle = '#1C1E24';
    lines(c, card[0], 80, 3).forEach((l, k) => c.fillText(l, x + 6, y + 23 + k * 7.4));
    c.fillStyle = '#DADCE1';
    rr(c, x + 6, y + 47.5, 78, 2.4, 1.2); c.fill();
    rr(c, x + 6, y + 52.5, 56, 2.4, 1.2); c.fill();
    const lv = LEVEL[card[1]];
    pill(c, x + 6, y + 60, card[1], { font: fs(4.8, 650), h: 8, padX: 4, bg: lv[0], fg: lv[1] });
    pill(c, x + 6, y + 71, 'Assessment', { font: fs(4.8, 650), h: 8, padX: 4, r: 2, bg: '#FFDBDE', fg: '#BD6466' });
    c.fillStyle = '#EEEEEE'; c.fillRect(x + 6, y + 84, w - 12, 0.7);
    c.strokeStyle = '#8A8D93'; c.lineWidth = 0.6;
    c.beginPath(); c.ellipse(x + 9, y + 91.5, 2.4, 1.5, 0, 0, TAU); c.stroke();
    c.font = fs(4.4, 500); c.fillStyle = '#7A7D83'; c.fillText('0', x + 13, y + 91.7);
    c.textAlign = 'right'; c.font = fs(4.4, 600); c.fillStyle = '#5A5D63';
    c.fillText('by SEL Admin', x + w - 6, y + 89.8);
    c.font = fs(4, 500); c.fillStyle = '#8A8D93'; c.fillText('August 28, 2026', x + w - 6, y + 95);
    c.textAlign = 'left';
  };
  function paintLogin(c) {
    c.fillStyle = RSG.bg; c.fillRect(WX, CY, WW, 190);
    lock(c, 200, 120, 22, RSG.red);
  }
  function paintRsgHeader(c) {
    c.fillStyle = '#fff'; c.fillRect(WX, CY, WW, 18);
    c.fillStyle = RSG.line; c.fillRect(WX, CY + 18, WW, 0.7);
    c.fillStyle = RSG.red; rr(c, 22, 54, 6, 6, 1.5); c.fill();
    c.font = fs(7, 750); c.fillStyle = RSG.ink; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('Resident Survival Guide', 32, 57.3);
    c.fillStyle = '#DADBDE'; c.beginPath(); c.arc(372, 57, 5, 0, TAU); c.fill();
    c.fillStyle = '#9C9EA3'; c.beginPath(); c.arc(372, 55.6, 1.7, 0, TAU); c.fill();
    c.beginPath(); c.arc(372, 60.6, 3, Math.PI, TAU); c.fill();
  }
  const paintGuide = (i, pinned) => c => {
    const x = slotX(i), y = slotY(i), w = 83, h = 62;
    c.fillStyle = '#fff'; rr(c, x, y, w, h, 4); c.fill();
    c.strokeStyle = RSG.line; c.lineWidth = 0.7; rr(c, x + 0.35, y + 0.35, w - 0.7, h - 0.7, 4); c.stroke();
    c.fillStyle = THUMB[i]; rr(c, x + 4, y + 4, w - 8, 34, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)'; rr(c, x + w / 2 - 8, y + 10, 16, 21, 1.5); c.fill();
    c.fillStyle = 'rgba(0,0,0,.14)';
    for (let k = 0; k < 4; k++) c.fillRect(x + w / 2 - 5, y + 14 + k * 4, k === 3 ? 6 : 10, 1.2);
    pin(c, x + w - 10, y + 11, pinned);
    c.font = fs(6.2, 700); c.fillStyle = RSG.ink; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(GUIDES[i], x + 5, y + 46);
    c.font = fs(4.8, 500); c.fillStyle = RSG.soft; c.fillText(`PDF, ${PAGES[i]} pages`, x + 5, y + 54.5);
  };
  function paintPage(c) {
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(136, 72, 132, 200);
    c.fillStyle = '#fff'; c.fillRect(134, 70, 132, 200);
    c.fillStyle = RSG.ink; c.fillRect(146, 82, 64, 4.4);
    c.fillStyle = RSG.red; c.fillRect(146, 91, 34, 2.6);
    const bars = [104, 98, 108, 70, 0, 100, 94, 60, 0, 0, 0, 0, 102, 88, 96, 52, 0, 106, 90, 74];
    let y = 100;
    bars.forEach((w, i) => {
      if (i >= 8 && i <= 11) {
        c.strokeStyle = '#B5B7BC'; c.lineWidth = 0.6; c.strokeRect(146.5, y - 1.5, 3.4, 3.4);
        if (i < 10) check(c, 148.2, y + 0.2, 3.2, RSG.red);
        c.fillStyle = '#C9CBD0'; c.fillRect(154, y - 0.6, 60 + (i % 2) * 18, 1.6);
        y += 7.4; return;
      }
      if (!w) { y += 4; return; }
      c.fillStyle = '#C9CBD0'; c.fillRect(146, y - 0.6, w, 1.6);
      y += 5.4;
    });
  }
  function paintViewerBar(c) {
    c.fillStyle = '#2C2F34'; c.fillRect(WX, CY, WW, 14);
    c.font = fs(6, 650); c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('‹  Night float', 22, 55.3);
    c.textAlign = 'center'; c.font = fs(5.6, 600); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillText('1 / 12', 200, 55.3);
    c.textAlign = 'right'; c.fillText('−   100%   +', 378, 55.3); c.textAlign = 'left';
  }
  const selCardPainters = CARDS.map((_, i) => paintSelCard(i));
  const guidePainters = GUIDES.map((_, i) => paintGuide(i, false));
  const pinnedPainter = paintGuide(1, true);
  const chromePainters = [paintSelChrome(false), paintSelChrome(true)];
  const framePainters = new Map();
  function framePainter(active, hue) {
    const k = active + hue;
    if (!framePainters.has(k)) framePainters.set(k, paintFrame(active, hue));
    return framePainters.get(k);
  }

  /* Per-frame scenes */
  let GA = 1;
  function selResources(c, T) {
    c.fillStyle = SEL.bg; c.fillRect(WX, BODY, WW, CY + 190 - BODY);
    const sc = 46 * eio(prog(T, 3.3, 4.0));
    blit(c, 'selTop', 14, 75, 372, 80, paintSelTop, 0, -sc);
    const lift = eout(prog(T, 2.5, 2.75)) * (1 - prog(T, 4.3, 4.55));
    CARDS.forEach((card, i) => {
      const a = eout(prog(T, 1.75 + i * 0.12, 2.15 + i * 0.12));
      if (!a) return;
      const l = i === 0 ? lift : 0;
      const dy = (1 - a) * 6 - l * 2.2 - sc;
      c.globalAlpha = GA * a;
      if (l > 0) { c.fillStyle = `rgba(0,0,0,${0.35 * l})`; rr(c, cardX(i) + 1, cardY(i) + dy + 3, 92, 100, 5); c.fill(); }
      blit(c, 'selCard' + i, cardX(i), cardY(i), 92, 100, selCardPainters[i], 0, dy);
      c.globalAlpha = GA;
    });
  }
  function rsgLogin(c, T) {
    blit(c, 'login', WX, CY, WW, 190, paintLogin);
    const down = T > 6.3 && T < 6.5;
    c.fillStyle = down ? RSG.redDk : RSG.red; rr(c, 170, 141, 60, 16, 3); c.fill();
    c.font = fs(6.4, 650); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('NetID Login', 200, 149.4);
    c.textAlign = 'left';
  }
  function rsgLibrary(c, T) {
    c.fillStyle = RSG.bg; c.fillRect(WX, CY, WW, 190);
    blit(c, 'rsgHeader', WX, CY, WW, 19, paintRsgHeader);
    const focus = T > 7.2;
    c.fillStyle = '#fff'; rr(c, 22, 72, 214, 14, 7); c.fill();
    c.strokeStyle = focus ? RSG.red : '#CDCED2'; c.lineWidth = focus ? 0.9 : 0.7; rr(c, 22.4, 72.4, 213.2, 13.2, 6.6); c.stroke();
    magnifier(c, 30, 78.4, 6, '#8A8C91');
    const n = T < 7.25 ? 0 : Math.min(QUERY.length, Math.floor((T - 7.25) / 0.13) + 1);
    c.textAlign = 'left'; c.textBaseline = 'middle';
    if (n) { c.font = fs(5.8, 600); c.fillStyle = RSG.ink; c.fillText(QUERY.slice(0, n), 37, 79.3); }
    else { c.font = fs(5.6, 500); c.fillStyle = '#8A8C91'; c.fillText('Search guides', 37, 79.3); }
    if (focus && T < 8.6 && (T * 2.4) % 1 < 0.6) {
      c.font = fs(5.8, 600);
      const cw = n ? c.measureText(QUERY.slice(0, n)).width : 0;
      c.fillStyle = RSG.ink; c.fillRect(37.6 + cw, 75.4, 0.7, 7.4);
    }
    const pinned = T >= 9.0;
    const px = 244 + pill(c, 244, 73, 'All guides', { font: fs(5.4, 650), h: 12, padX: 6, bg: RSG.ink, fg: '#fff' }) + 5;
    const flash = pinned ? 1 - prog(T, 9.0, 9.6) : 0;
    pill(c, px, 73, pinned ? 'Pinned 1' : 'Pinned', { font: fs(5.4, 650), h: 12, padX: 6, bg: flash > 0 ? rgba(RSG.red, 0.14 * flash) : '#fff', stroke: pinned ? rgba(RSG.red, 0.6 + 0.4 * flash) : '#CDCED2', fg: pinned ? RSG.red : RSG.ink });
    const kf = eio(prog(T, 7.95, 8.45));
    GUIDES.forEach((g, i) => {
      if (MATCH.includes(i)) return;
      const a = 1 - kf;
      if (a <= 0.01) return;
      c.globalAlpha = GA * a;
      blit(c, 'guide' + i, slotX(i), slotY(i), 83, 62, guidePainters[i], 0, 0, 1 - 0.08 * kf);
      c.globalAlpha = GA;
    });
    MATCH.forEach((i, m) => {
      const on = i === 1 && pinned;
      blit(c, on ? 'guide1p' : 'guide' + i, slotX(i), slotY(i), 83, 62, on ? pinnedPainter : guidePainters[i], (slotX(m) - slotX(i)) * kf, (slotY(m) - slotY(i)) * kf);
    });
  }
  function rsgViewer(c, T) {
    const ox = (1 - eout(prog(T, 9.6, 10.05))) * WW;
    c.fillStyle = '#3B3E44'; c.fillRect(WX + ox, CY, WW, 190);
    blit(c, 'page', 134, 70, 134, 202, paintPage, ox, -30 * eio(prog(T, 10.4, 11.15)));
    blit(c, 'viewerBar', WX, CY, WW, 14, paintViewerBar, ox, 0);
  }

  return function (c, T, P) {
    base(c, P);
    const onRsg = T >= 5.08;
    c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, WX + 2, WY + 4, WW, WH, 8); c.fill();
    blit(c, 'frame' + (onRsg ? 1 : 0) + P.hue, WX, WY, WW, CY - WY, framePainter(onRsg ? 1 : 0, P.hue));
    const dip = Math.sin(Math.PI * prog(T, 5.05, 5.25)) * 0.85;
    if (dip > 0.01) { c.globalAlpha = dip; c.fillStyle = '#171C26'; c.fillRect(64, 35, 270, 9); c.globalAlpha = 1; }
    const pulse = Math.sin(T * 3.2) * 0.5 + 0.5;
    c.fillStyle = rgba(P.hue, 0.25 * pulse); c.beginPath(); c.arc(354, 39.5, 3.4, 0, TAU); c.fill();
    c.save();
    rr(c, WX, WY, WW, WH, 8); c.clip();
    c.beginPath(); c.rect(WX, CY, WW, 190); c.clip();
    const navOn = eout(prog(T, 1.42, 1.6));
    const toRes = eio(prog(T, 1.45, 1.85));
    const toRsg = eio(prog(T, 5.08, 5.45));
    if (toRsg < 1) {
      c.globalAlpha = 1;
      blit(c, 'selChrome0', WX, CY, WW, BODY - CY, chromePainters[0]);
      if (navOn > 0) { c.globalAlpha = navOn; blit(c, 'selChrome1', WX, CY, WW, BODY - CY, chromePainters[1]); c.globalAlpha = 1; }
      c.save(); c.beginPath(); c.rect(WX, BODY, WW, 200); c.clip();
      if (toRes < 1) blit(c, 'selHome', WX, BODY, WW, CY + 190 - BODY, paintSelHome);
      if (toRes > 0) { GA = toRes; c.globalAlpha = GA; selResources(c, T); }
      c.restore();
      c.globalAlpha = 1;
    }
    if (toRsg > 0) {
      const toLib = eio(prog(T, 6.75, 7.05));
      GA = toRsg; c.globalAlpha = GA;
      if (toLib < 1) rsgLogin(c, T);
      if (toLib > 0) { GA = toRsg * toLib; c.globalAlpha = GA; rsgLibrary(c, T); }
      if (T > 6.3 && T < 7.0) { c.globalAlpha = 1; c.fillStyle = RSG.red; c.fillRect(WX, CY, WW * eout(prog(T, 6.3, 6.95)), 1.6); }
      c.globalAlpha = 1;
      if (T >= 9.6) rsgViewer(c, T);
    }
    c.restore();
    GA = 1;
    for (const tc of CLICKS) {
      const r = prog(T, tc, tc + 0.42);
      if (r > 0 && r < 1) {
        const [x, y] = cursorAt(tc);
        c.strokeStyle = rgba(P.hue, 0.85 * (1 - r)); c.lineWidth = 1.3;
        c.beginPath(); c.arc(x, y, 2.5 + r * 10, 0, TAU); c.stroke();
      }
    }
    const ca = Math.min(eout(prog(T, 0.45, 0.75)), 1 - prog(T, 10.15, 10.45));
    if (ca > 0) {
      const [x, y] = cursorAt(T);
      const press = CLICKS.some(tc => T >= tc && T < tc + 0.12);
      c.globalAlpha = ca; arrow(c, x, y, press); c.globalAlpha = 1;
    }
    edgeFade(c, T, 12, P.ground);
  };
})();


  /* ---- Page ---- */


const PROJECTS = [
  {
    slug: 'patchwork', name: 'Patchwork', tag: 'Bug reports in, regression tests out',
    hue: '#3FB868', ground: '#0B1A11', card: '#12301D', draw: drawPatchwork, period: 9.5, freeze: 8.2,
    lede: 'GitHub App that turns a bug report into a targeted regression-test pull request. It reads the repository’s existing test patterns, uses Gemini 2.5 Pro to write a test that fails before the fix and passes after it, then creates the branch, commit, and PR.',
    context: 'Built solo at Zero to Agent, the Vercel and Google DeepMind hackathon in NYC, March 2026.',
    proof: ['Issue-to-PR automation', 'Test-only changes', 'Solo hackathon build'],
    flow: ['GitHub issue', 'Read test patterns', 'Generate test', 'Open PR'],
    story: [
      ['Problem', 'When a bug is fixed, the regression test that would prevent it from returning is often skipped.'],
      ['My contribution', 'I built the GitHub App end to end: webhook handling, repository analysis, Gemini test generation, branch and commit creation, pull-request automation, and the activity dashboard.'],
      ['Key decision', 'The agent is deliberately limited to test-only changes. That keeps every action reviewable and avoids trusting generated code to modify production behavior.'],
      ['Outcome', 'A reviewable test-only pull request that raises coverage without allowing the agent to change production code.']
    ],
    stack: ['Gemini 2.5 Pro', 'Next.js', 'Octokit', 'Supabase', 'Vercel'],
    links: [['Open live dashboard', 'https://pensive-jang.vercel.app'], ['View the code on GitHub', 'https://github.com/rohan1402/patchwork']],
    keys: { bug: 3, bugs: 3, 'pull request': 3, 'pull requests': 3, pr: 3, prs: 3, github: 2, regression: 3, test: 2, tests: 2, testing: 2, hackathon: 3, gemini: 1, 'writes code': 2, 'write code': 2, coding: 2, patchwork: 4 }
  },
  {
    slug: 'rutgers-apps', name: 'Rutgers Production Apps', short: 'Rutgers Apps', tag: 'Two web apps live at Rutgers',
    hue: '#2DB8A8', ground: '#111722', draw: drawRutgers, period: 12, freeze: 3.05,
    lede: 'Two web apps I build and run in production at Rutgers. Medical residents use the Resident Survival Guide to search and read clinical guides. The SEL App helps educators find social-emotional learning resources curated by the Rutgers Psychology Department.',
    context: 'Rutgers SAS IT, 2026. The code is private, so the links go to the live apps.',
    proof: ['2 apps in production', 'Educator beta for SEL', '39-test suite for RSG'],
    flowTitle: 'What I did',
    flow: ['Fixed what blocked launch', 'Shipped new features', 'Set up staging and production', 'Supported real users'],
    story: [
      ['Resident Survival Guide', 'A searchable library of clinical guides that Rutgers medical residents read in the browser after signing in with their NetID. I fixed a sign-in crash for residents whose NetID email didn’t match their account, kept personal data out of production logs, built the S3 file storage, and wrote the app’s first automated test suite.'],
      ['SEL App', 'A library of social-emotional learning resources for educators, built for the Rutgers Psychology Department’s SECD Lab. I migrated it, launched it at selapp.psych.rutgers.edu, and shipped fixes and features through its beta: each user’s tier listed first, levels on resources, better similar-resource picks, a Load more that works on the first click, and clearer sign-up rules.'],
      ['My role', 'I work on both apps end to end, from features and bug fixes to tests and releases, and I work directly with the faculty, staff and beta testers who use them.'],
      ['Outcome', 'Both apps are live. Residents sign in to the Resident Survival Guide with their NetID, and the SEL App opened to educators for its beta in October 2026.']
    ],
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'AWS', 'Docker', 'GitLab CI/CD'],
    links: [['Open the SEL App', 'https://selapp.psych.rutgers.edu'], ['Open the Resident Survival Guide', 'https://rsgapp.gme.rutgers.edu']],
    linkNote: 'The SEL App is open to everyone. The Resident Survival Guide is only for Rutgers medical residents, so its link opens the NetID sign-in page.',
    keys: { rsg: 4, sel: 4, 'survival guide': 4, resident: 3, residents: 3, medical: 3, psychology: 3, 'social emotional': 4, 'social-emotional': 4, educator: 2, educators: 2, live: 2, 'live app*': 3, 'web app*': 3, 'production app*': 3, production: 2, 'full stack': 3, 'full-stack': 3, fullstack: 3, 'next.js': 3, nextjs: 3, postgres: 2, postgresql: 2, 'rutgers app*': 4, deploy: 2, deployed: 2, deployment: 2, shipped: 1, users: 1 }
  },
  {
    slug: 'auto-triage', name: 'Cohesity Auto-Triage', short: 'Auto-Triage', tag: 'Production ML at Cohesity',
    hue: '#EF6FA6', ground: '#200D17', draw: drawTriage, period: 9.5, freeze: 8.2,
    lede: 'A production system that automatically classifies defects as product, automation, or environment issues, cutting debugging turnaround by 37%.',
    context: 'Production work at Cohesity, 2022 to 2025. Details stay general because the system is proprietary.',
    proof: ['37% faster debugging turnaround', '150k+ log events processed', '20% less manual QA'],
    flow: ['Test failures', 'Log pattern detection', 'Defect classification', 'Monitoring dashboard'],
    story: [
      ['Problem', 'Working out whether a failure was a product bug, an automation issue, or an environment problem took engineers a lot of manual debugging.'],
      ['My contribution', 'I engineered the auto-triage system in Python with ML classification, built backend workflows that process 150k+ log events with NLP-based pattern detection, and owned the Jenkins CI/CD pipeline and a Grafana monitoring dashboard.'],
      ['Outcome', 'Debugging turnaround dropped by 37%, root-cause analysis got faster across distributed systems, and manual QA effort fell by 20%.']
    ],
    stack: ['Python', 'Machine learning', 'NLP', 'Jenkins', 'Grafana'],
    links: [],
    keys: { triage: 3, 'auto-triage': 4, log: 2, logs: 2, 'root cause': 2, jenkins: 2, grafana: 2, production: 2, defect: 2, defects: 2, cohesity: 2 }
  },
  {
    slug: 'agentically', name: 'Agentically', tag: 'Healthcare compliance RAG',
    hue: '#9B7BFF', ground: '#15102B', draw: drawAgentically, period: 9.5, freeze: 8.2,
    lede: 'AI compliance intelligence that lets healthcare staff search accreditation standards in plain English and get precise, cited answers without digging through PDFs.',
    context: '',
    proof: ['1,919 indexed chunks', '13/13 eval queries', '3 to 8 second responses'],
    flow: ['Question', 'Vector search', 'Claude', 'Cited answer'],
    story: [
      ['Problem', 'Accreditation standards live across long documents, making precise answers slow to find and difficult to verify.'],
      ['My contribution', 'I built the document-ingestion pipeline, Voyage embedding flow, MongoDB Atlas search tools, Claude agent, evaluation set, and Next.js interface.'],
      ['Key decision', 'The agent routes each request through semantic, exact-citation, browse, or hybrid retrieval instead of forcing every question through one vector-search path.'],
      ['Outcome', 'The system indexes 1,919 standards chunks and passed 13 of 13 test queries across semantic, exact-citation, browse, and hybrid retrieval modes.']
    ],
    stack: ['Claude Sonnet', 'MongoDB Atlas', 'Voyage AI', 'Next.js', 'Vercel'],
    links: [['View product site', 'https://agentically-webui.vercel.app'], ['View the code on GitHub', 'https://github.com/rohan1402/agentically']],
    keys: { rag: 3, retrieval: 3, 'vector*': 3, 'embedding*': 3, compliance: 3, healthcare: 3, hospital: 2, mongodb: 3, voyage: 3, claude: 1, standards: 2, accreditation: 3, 'citation*': 2, search: 1, documents: 1, agentically: 4 }
  },
  {
    slug: 'scail', name: 'Scail', tag: 'AI visibility audit and outreach',
    hue: '#F07A3A', ground: '#21150E', draw: drawScail, period: 9.5, freeze: 8.4,
    lede: 'An AI-visibility audit and outreach engine that measures whether major assistants recommend a business, identifies the gaps, and turns the analysis into reports, rewrites, and CRM-ready outreach.',
    context: 'Built during my AI engineering internship at Peregrine, May to August 2026.',
    proof: ['Step 0 to 27 audit pipeline', 'ChatGPT, Claude, Gemini', '5-part audit bundle'],
    flow: ['Business queries', 'Multi-model audit', 'Deliverable bundle', 'Outreach pipeline'],
    story: [
      ['Problem', 'Businesses have little visibility into whether AI assistants recommend them or what changes could improve their presence in generated answers.'],
      ['My contribution', 'I designed and built the Python audit engine, external-data collectors, deliverable assembly, FastAPI control panel, and CRM-ready prospecting flow.'],
      ['Key decision', 'Every collector can resolve to a live API or a deterministic offline fallback, so the full workflow remains testable even when a third-party integration is unavailable.'],
      ['Outcome', 'One system carries an audit from raw business queries to an actionable report, page rewrites, an AI scorecard, and a CRM-ready lead record.']
    ],
    stack: ['Python', 'OpenAI', 'Claude', 'Gemini', 'FastAPI', 'Supabase'],
    links: [['View the code on GitHub', 'https://github.com/rohan1402/scail']],
    keys: { seo: 3, visibility: 3, 'ai visibility': 3, audit: 3, outreach: 3, 'lead*': 2, marketing: 2, chatgpt: 2, recommend: 2, business: 2, businesses: 2, crm: 3, report: 1, 'scrap*': 1, scail: 4, peregrine: 3 }
  },
  {
    slug: 'whyzr', name: 'Whyzr', tag: 'Safe Socratic learning agent',
    hue: '#4AA8F0', ground: '#0A1724', draw: drawWhyzr, period: 9.5, freeze: 8.4,
    lede: 'A Socratic thinking companion for children that asks one guiding question at a time, enforces tool safety in code, and records each child’s learning journey in a private git-backed growth journal.',
    context: 'Built end to end on gitagent.',
    proof: ['89/89 machinery checks', '17 to 21 of 21 behavior scores', 'Zero direct-answer leaks'],
    flow: ['Child’s question', 'Socratic guidance', 'Safety guard', 'Growth journal'],
    story: [
      ['Problem', 'AI can help children reach answers while quietly replacing the thinking process that produces real learning.'],
      ['My contribution', 'A constitution-driven tutor with fail-closed tool guards, per-child git memory, a voice interface, and separate runtime and behavioral evaluation layers.'],
      ['Key decision', 'Safety-critical limits live in a fail-closed pre-tool hook instead of relying on prompts, while each child’s learning history gets an isolated git branch and worktree.'],
      ['Outcome', 'The machinery and security suite passes 89 of 89 checks, while committed behavioral runs score 17 to 21 out of 21 without leaking direct answers.']
    ],
    stack: ['gitagent', 'Claude', 'Gemini', 'Node.js', 'Git'],
    links: [['View the code on GitHub', 'https://github.com/rohan1402/Whyzr']],
    keys: { tutor: 3, kid: 3, kids: 3, child: 3, children: 3, 'educat*': 3, socratic: 3, gitagent: 3, 'teach*': 2, learning: 2, school: 2, parent: 2, parents: 2, safety: 1, journal: 2, students: 1 }
  },
  {
    slug: 'llm-benchmarking', name: 'Rutgers LLM Benchmarking', short: 'LLM Benchmarking', tag: 'Local model evaluation',
    hue: '#F2B33D', ground: '#1D170A', draw: drawLLM, period: 10, freeze: 9.0,
    lede: 'Two-phase evaluation platform that benchmarks four local GGUF models across 14 prompts and nine capability categories, then compares them in a PDF RAG pipeline using retrieval, citation-validity, and latency metrics.',
    context: 'Built on my own initiative at Rutgers SAS IT.',
    proof: ['4 local models', '14 prompts, 9 categories', '10-question RAG eval'],
    flow: ['4 local models', 'Shared eval suite', 'PDF RAG', 'Compare results'],
    story: [
      ['Problem', 'Local language models need a consistent retrieval and scoring setup before their quality can be compared fairly.'],
      ['My contribution', 'I built the two-phase TypeScript benchmark and PDF RAG harness, including model adapters, deterministic scoring, LLM-judge comparison, and temperature analysis.'],
      ['Key decision', 'Only one quantized GGUF is served at a time through llama-cpp-python, preventing same-model-different-label artifacts and keeping comparisons reproducible.'],
      ['Outcome', 'Llama 3.1 8B was the most consistent local model, while Phi-3.5 and Qwen each reached 100% citation validity in the shared RAG evaluation.']
    ],
    stack: ['TypeScript', 'llama-cpp-python', 'React', 'Express', 'Groq'],
    links: [['View the code on GitHub', 'https://github.com/rohan1402/llm-playground']],
    keys: { 'benchmark*': 3, local: 2, 'llama*': 3, eval: 3, evals: 3, 'evaluat*': 3, judge: 3, groq: 3, qwen: 3, mistral: 3, phi: 3, pdf: 2, pdfs: 2, latency: 2, models: 1, inference: 2, gguf: 3 }
  },
  {
    slug: 'f1-race-rewind', name: 'F1 Race Rewind', tag: 'What-if race simulator',
    hue: '#F0484D', ground: '#1C0D0E', draw: drawF1, period: 10, freeze: 8.6,
    lede: 'ML-powered what-if simulator for six historical Formula 1 races. Change a pit-stop lap or tyre compound, then compare the actual race with a lap-by-lap replay driven by predicted lap times.',
    context: 'Team project for an Advanced Python course, spring 2026.',
    proof: ['6 historical races', '3 strategy changes', 'Lap-by-lap replay'],
    flow: ['Pick a race', 'Fork the strategy', 'Predict lap times', 'Replay both'],
    story: [
      ['Problem', 'After every race, fans and analysts argue about strategy calls, but there was no tool to try a different decision and watch the race play out lap by lap.'],
      ['What we built', 'A Streamlit app on real FastF1 data. Pick one of six races, a driver and a fork lap, then pit earlier, pit later, or change compound. A gradient-boosted model predicts the lap times after the fork.'],
      ['Key assumption', 'Only the chosen driver’s strategy changes. Every other driver follows their real race, so each what-if isolates a single decision.'],
      ['Outcome', 'A side-by-side animated replay of the actual race against the what-if on the real circuit layout, with a gap chart and the final standings.']
    ],
    stack: ['Python', 'Streamlit', 'FastF1', 'scikit-learn', 'Pandas'],
    links: [['Open live demo', 'https://f1-race-simulator-adv-programming.streamlit.app/'], ['View the code on GitHub', 'https://github.com/rohan1402/f1-race-simulator']],
    keys: { f1: 3, formula: 3, race: 3, racing: 3, car: 2, cars: 2, strategy: 2, pit: 3, tyre: 3, tire: 3, sport: 2, sports: 2, 'simulat*': 2, 'what-if': 2, 'what if': 2, streamlit: 3, fastf1: 3, fun: 1, 'machine learning': 1 }
  }
];

const ROLES = [
  { when: 'Jan 2026 to now', role: 'Software Developer', org: 'Rutgers SAS IT', line: 'Shipping two live Rutgers web apps and building AI tools for academic content.', project: 'rutgers-apps', projectLabel: 'See the apps',
    points: [
      'Took two web apps to production for Rutgers: the Resident Survival Guide for medical residents and the SEL App for the Psychology Department (Next.js, TypeScript, PostgreSQL, AWS).',
      'Shipped features and fixes across both apps, from sign-in and S3 file storage to tier-aware resource lists, and wrote RSG’s first automated test suite (39 unit, schema and API integration cases in CI).',
      'Built an agentic AI chatbot from scratch (Node.js, TypeScript, Express, React), integrating LLM APIs with tool use and retrieval to deliver context-aware academic content across departments.',
      'Designed a modular LLM evaluation framework supporting 4+ models with structured logging, latency tracking, and token-usage metrics for benchmarking RAG quality and instruction-following.',
      'Implemented RAG to ground responses in structured academic content, enabling automated MCQ, programming, and essay-question generation mapped to learning objectives.'
    ] },
  { when: 'May to Aug 2026', role: 'AI Engineering Intern', org: 'Peregrine', line: 'Built Scail, an AI search visibility audit engine, in Python.', project: 'scail', projectLabel: 'See Scail',
    points: [
      'Built Scail, an AI search visibility audit engine in Python: a 28-step pipeline with dependency-ordered execution, per-step persistence to Supabase, exponential-backoff retries, and resume-on-retry that skips completed steps.',
      'Engineered concurrent fan-out of 30 queries across 5 AI platforms (ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews) with ThreadPoolExecutor, using Claude Sonnet to write queries and Gemini Flash to parse answers via OpenRouter.',
      'Developed LeadGenAgent, an idempotent multi-step agent chaining prospect discovery, contact enrichment, email verification, scorecard generation, and Netlify deployment across the Google Maps, Apollo, and MillionVerifier APIs.'
    ] },
  { when: 'Jul 2022 to Jul 2025', role: 'Member of Technical Staff 2', org: 'Cohesity', line: 'Built a production auto-triage system that cut debugging turnaround by 37%.',
    points: [
      'Engineered a production Auto-Triage system (Python and ML) classifying defects across Product, Automation, and Environment, cutting debugging turnaround by 37%.',
      'Built backend workflows processing 150k+ log events with NLP-based pattern detection for faster root-cause analysis across distributed systems.',
      'Owned a full Jenkins CI/CD pipeline and a Grafana monitoring dashboard, reducing manual QA effort by 20%.'
    ] },
  { when: 'Jun to Jul 2021', role: 'Data Science Intern', org: 'Alpha AI', line: 'Built facial expression and speech emotion recognition pipelines.',
    points: [
      'Built Facial Expression and Speech Emotion Recognition pipelines (Keras, 27k 48x48 grayscale images).',
      'Used OpenCV for face detection and emotion prediction, reaching about 73% accuracy.'
    ] }
];
const EDU = [
  { when: 'Sep 2025 to May 2027', degree: 'M.S. Data Science', school: 'Rutgers University', note: '4.0 GPA' },
  { when: 'Aug 2018 to May 2022', degree: 'B.Tech, Computer Science and Engineering (Big Data)', school: 'University of Petroleum and Energy Studies', note: '' }
];
const SKILLS = {
  'Agentic AI': ['Claude Agent SDK', 'MCP servers', 'Tool use', 'Gemini tool calling', 'Autonomous workflows', 'Prompt engineering'],
  'RAG and vector DBs': ['RAG pipelines', 'Semantic search', 'MongoDB Atlas', 'OpenSearch', 'S3 Vectors', 'sentence-transformers'],
  'AWS': ['Lambda', 'Bedrock', 'S3', 'EC2'],
  'Languages': ['Python', 'Node.js', 'TypeScript', 'Java', 'SQL'],
  'Backend and DevOps': ['Express', 'Next.js', 'PostgreSQL', 'REST APIs', 'Jenkins and GitLab CI/CD', 'Docker', 'Git']
};
const LINKS = {
  email: 'rohan.pant14@gmail.com',
  linkedin: 'https://www.linkedin.com/in/rohan1402',
  github: 'https://github.com/rohan1402',
  resume: '/resume',
  pdf: '/assets/Rohan_Pant_Resume.pdf'
};

const N = PROJECTS.length;
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const el = (tag, props = {}, kids = []) => {
  const n = document.createElement(tag);
  for (const [k, val] of Object.entries(props)) {
    if (k === 'text') n.textContent = val;
    else if (k === 'class') n.className = val;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), val);
    else n.setAttribute(k, val);
  }
  for (const kid of [].concat(kids)) if (kid) n.appendChild(kid);
  return n;
};
const strip = $('strip'), wordA = $('wordA'), wordB = $('wordB'), ticksEl = $('ticks');
const proj = $('project'), pBody = $('pBody'), pMedia = $('pMedia'), pCanvas = $('pCanvas'), pctx = pCanvas.getContext('2d');
const pBack = $('pBack'), pPrev = $('pPrev'), pNext = $('pNext');
const DPR = Math.min(2, window.devicePixelRatio || 1);
const COARSE = matchMedia('(pointer: coarse)').matches;
const CARD_DPR = Math.min(window.devicePixelRatio || 1, COARSE ? 1.5 : 2);
const DRIFT = reduce ? 0 : 0.42;
const t0 = performance.now();

let vw = 0, cardW = 0, clipH = 0, pitch = 0, M = 0, span = 0;
let slots = [];
const offs = PROJECTS.map(() => { const cv = document.createElement('canvas'); return { cv, ctx: cv.getContext('2d'), drawn: false }; });
let offset = 0, v = 0, vis = 0, target = null, hover = false, dragging = false, holdUntil = 0, centered = -1;
let settle = null, centerCard = null;
let openP = -1, openSlot = null, closing = false, swapping = false, suppressHash = false;

/* Avatar */
const poses = {};
document.querySelectorAll('#avatar img').forEach(img => { poses[img.dataset.pose] = img; });
let poseTimer = 0;
function setPose(name, holdMs) {
  clearTimeout(poseTimer);
  for (const [k, img] of Object.entries(poses)) img.classList.toggle('on', k === name);
  if (holdMs) poseTimer = setTimeout(() => setPose(document.activeElement === $('askInput') ? 'listening' : 'idle'), holdMs);
}

/* Jump links */
const ticks = PROJECTS.map((P, i) => {
  const b = el('button', { type: 'button', class: 'pdot', 'aria-label': P.name, title: P.name, onclick: () => flyToProject(i) });
  b.style.setProperty('--h', P.hue);
  ticksEl.appendChild(b);
  return b;
});

/* Experience and education. The top entry is the open next role. */
$('roles').appendChild(el('li', { class: 'role next' }, [
  el('p', { class: 'when', text: 'Next' }),
  el('span', { class: 'mark', 'aria-hidden': 'true' }),
  el('div', { class: 'what' }, [
    el('h3', { text: 'Open to internships and full-time roles' }),
    el('p', { text: 'AI, ML and software engineering. Internships now, full-time after I graduate in May 2027. Based in New Brunswick, NJ. F-1 OPT eligible.' })
  ]),
  el('div', { class: 'role-actions' }, [
    el('button', { type: 'button', class: 'more solid', text: 'Get in touch', onclick: () => $('contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }) }),
    el('a', { class: 'more', href: LINKS.resume, rel: 'noopener', text: 'Resume' })
  ])
]));
ROLES.forEach((r, i) => {
  const pts = el('ul', { class: 'points', id: 'pts' + i }, r.points.map(p => el('li', { text: p })));
  pts.hidden = true;
  const btn = el('button', { class: 'more', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'pts' + i, text: 'Details' });
  btn.setAttribute('aria-label', `Details for ${r.role} at ${r.org}`);
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    btn.textContent = open ? 'Details' : 'Hide';
    pts.hidden = open;
  });
  const h = el('h3', {}, [document.createTextNode(r.role + ', '), el('span', { text: r.org })]);
  const acts = [btn];
  if (r.project) {
    const pi = PROJECTS.findIndex(P => P.slug === r.project);
    if (pi >= 0) acts.push(el('button', { class: 'more', type: 'button', text: r.projectLabel || 'See the project', 'aria-label': `${r.projectLabel || 'See the project'}: ${PROJECTS[pi].name}`, onclick: () => goProject(pi) }));
  }
  $('roles').appendChild(el('li', { class: 'role' }, [el('p', { class: 'when', text: r.when }), el('span', { class: 'mark', 'aria-hidden': 'true' }), el('div', { class: 'what' }, [h, el('p', { text: r.line }), pts]), el('div', { class: 'role-actions' }, acts)]));
});
EDU.forEach(e => {
  const h = el('h3', {}, [document.createTextNode(e.degree + ', '), el('span', { text: e.school })]);
  $('edu').appendChild(el('li', {}, [el('p', { class: 'when', text: e.when }), el('div', { class: 'what' }, e.note ? [h, el('p', { text: e.note })] : [h])]));
});

/* Strip */
function layout() {
  vw = root.clientWidth;
  const keep = centered >= 0 ? centered : 0;
  const vh = innerHeight;
  cardW = vw < 700 ? Math.round(vw * 0.74) : Math.round(clamp(Math.min(vw * 0.29, vh * 0.46), 280, 440));
  clipH = Math.round(cardW * 10 / 16);
  pitch = cardW + (vw < 700 ? 14 : 24);
  root.style.setProperty('--card-w', cardW + 'px');
  root.style.setProperty('--clip-h', clipH + 'px');
  const narrow = cardW < 380;
  strip.classList.toggle('narrow', narrow);
  root.style.setProperty('--cap-h', (narrow ? 58 : 44) + 'px');
  M = N * Math.max(1, Math.ceil((vw + 2 * pitch) / (N * pitch)));
  span = M * pitch;
  strip.textContent = '';
  slots = [];
  centerCard = null;
  for (let j = 0; j < M; j++) {
    const p = j % N, P = PROJECTS[p];
    const cv = el('canvas', { width: Math.round(cardW * CARD_DPR), height: Math.round(clipH * CARD_DPR), 'aria-hidden': 'true' });
    const inner = el('span', { class: 'card-inner' }, [cv, el('span', { class: 'cap' }, [el('b', { text: P.short || P.name }), el('span', { class: 'cap-tag', text: P.tag })])]);
    const card = el('button', { type: 'button', class: 'card', 'aria-label': `${P.name}, ${P.tag}. Open project` }, [inner]);
    card.style.setProperty('--g', P.ground);
    if (j >= N) card.tabIndex = -1;
    const s = { j, el: card, p, x: 0, cv, ctx: cv.getContext('2d'), inner, vis: false, stale: true };
    card.addEventListener('click', e => { if (e.detail === 0) openProject(s.p, s); });
    card.addEventListener('focus', () => { if (card.matches(':focus-visible')) flyToSlot(s); });
    strip.appendChild(card);
    slots.push(s);
  }
  offs.forEach(o => { o.cv.width = Math.round(cardW * CARD_DPR); o.cv.height = Math.round(clipH * CARD_DPR); o.drawn = false; o.t = 0; });
  offset = vw / 2 - cardW / 2 - keep * pitch + pitch;
  prevOffset = offset;
  target = null;
  posKey = '';
  positionCards(0);
  if (openP >= 0) {
    openSlot = nearestSlot(openP);
    openSlot.inner.style.visibility = 'hidden';
    sizeBig();
  }
}
let posKey = '';
function positionCards(ev) {
  const key = offset.toFixed(2) + '|' + ev.toFixed(3);
  if (key === posKey) return;
  posKey = key;
  const skew = clamp(-ev * 0.5, -8, 8).toFixed(2);
  let best = 0, bd = Infinity, bestSlot = null;
  for (const s of slots) {
    const x = ((s.j * pitch + offset) % span + span) % span - pitch;
    s.x = x;
    const was = s.vis;
    s.vis = x + cardW > -40 && x < vw + 40;
    if (s.vis && !was) s.stale = true;
    s.el.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${skew}deg)`;
    const d = Math.abs(x + cardW / 2 - vw / 2);
    if (d < bd) { bd = d; best = s.p; bestSlot = s; }
  }
  if (bestSlot !== centerCard) {
    if (centerCard) centerCard.el.classList.remove('center');
    centerCard = bestSlot;
    if (centerCard) centerCard.el.classList.add('center');
  }
  if (best !== centered) {
    centered = best;
    root.style.setProperty('--accent', PROJECTS[best].hue);
    ticks.forEach((b, i) => b.setAttribute('aria-current', i === best ? 'true' : 'false'));
  }
}
function centerSlot() {
  return slots.reduce((a, b) => Math.abs(a.x + cardW / 2 - vw / 2) <= Math.abs(b.x + cardW / 2 - vw / 2) ? a : b);
}
function nearestSlot(p) {
  let best = null, bd = Infinity;
  for (const s of slots) if (s.p === p) { const d = Math.abs(s.x + cardW / 2 - vw / 2); if (d < bd) { bd = d; best = s; } }
  return best;
}
function flyToSlot(s, extra = 0) {
  settle = null;
  const t = offset + (vw / 2 - (s.x + cardW / 2)) + extra;
  if (reduce) { offset = t; prevOffset = offset; target = null; v = 0; positionCards(0); holdUntil = performance.now() + 1400; return; }
  target = t;
}
function flyToProject(p, extra = 0) {
  const s = nearestSlot(p);
  flyToSlot(s, extra);
  if (target === null) return Promise.resolve(s);
  return new Promise(res => { settle = () => res(s); });
}
function step(dir) {
  const cur = centerSlot();
  const want = cur.x + dir * pitch;
  flyToSlot(slots.reduce((a, b) => Math.abs(a.x - want) <= Math.abs(b.x - want) ? a : b));
}

/* Covers. Drawn at 30 fps, frozen while the strip is being swiped, and copied
   into the cards only when something changed. The trail fades with speed. */
let lastBigT = -1e9, lastGa = 0;
const trail = sp => { const x = clamp((sp - 0.8) / 6.2, 0, 1); return x * x * (3 - 2 * x); };
function renderClips(now, ev) {
  const tt = (now - t0) / 1000;
  const speed = Math.abs(ev);
  const busy = dragging || speed > 2.5;
  const due = [];
  for (let p = 0; p < N; p++) {
    const o = offs[p];
    let needed = false;
    for (const s of slots) if (s.vis && s.p === p) { needed = true; break; }
    if (!needed) continue;
    if (!o.drawn) { due.unshift(p); continue; }
    if (reduce || busy || now - (o.t || 0) < 33) continue;
    due.push(p);
  }
  due.sort((x, y) => (offs[x].drawn ? 1 : 0) - (offs[y].drawn ? 1 : 0) || (offs[x].t || 0) - (offs[y].t || 0));
  let budget = COARSE ? 1 : 2;
  for (const p of due) {
    const o = offs[p];
    if (o.drawn && budget <= 0) break;
    const P = PROJECTS[p];
    const T = reduce ? P.freeze : (tt + p * 1.7) % P.period;
    o.ctx.setTransform(o.cv.width / BW, 0, 0, o.cv.height / BH, 0, 0);
    P.draw(o.ctx, T, P);
    o.drawn = true; o.fresh = true; o.t = now;
    budget--;
  }
  const ga = reduce ? 0 : trail(speed);
  const moving = ga > 0.004 || lastGa > 0.004;
  for (const s of slots) {
    if (!s.vis || (openP >= 0 && s === openSlot)) continue;
    const o = offs[s.p];
    if (!(o.fresh || moving || s.stale)) continue;
    const c = s.ctx, src = o.cv;
    c.globalAlpha = 1;
    c.drawImage(src, 0, 0);
    if (ga > 0.004) {
      for (let k = 1; k <= 2; k++) { c.globalAlpha = ga * 0.32 / k; c.drawImage(src, -ev * k * 2.2 * CARD_DPR, 0); }
      c.globalAlpha = 1;
    }
    s.stale = false;
  }
  for (const o of offs) o.fresh = false;
  lastGa = ga;
  if (openP >= 0 && now - lastBigT >= 33) { drawBig(tt); lastBigT = now; }
}
function drawBig(tt) {
  const P = PROJECTS[openP];
  const T = reduce ? P.freeze : (tt + openP * 1.7) % P.period;
  pctx.setTransform(pCanvas.width / BW, 0, 0, pCanvas.height / BH, 0, 0);
  P.draw(pctx, T, P);
}
let lastSX = -1, lastTX = 1e9;
function stretchWords(ev) {
  if (reduce) return;
  const sx = 1 + Math.min(Math.abs(ev) * 0.02, 0.3);
  const tx = clamp(ev * 5, -70, 70);
  if (Math.abs(sx - lastSX) < 0.0015 && Math.abs(tx - lastTX) < 0.25) return;
  lastSX = sx; lastTX = tx;
  wordA.style.transform = `translate3d(${tx.toFixed(1)}px,0,0) scaleX(${sx.toFixed(4)})`;
  wordB.style.transform = `translate3d(${(-tx * 0.7).toFixed(1)}px,0,0) scaleX(${sx.toFixed(4)})`;
}

/* Motion loop */
let last = performance.now(), lastMove = 0, prevOffset = 0, stageOn = true;
let stripEV = 0, stripDX = 0;
function frame(now) {
  const dt = Math.min(3, Math.max(0.25, (now - last) / 16.667));
  last = now;
  if (!dragging) {
    if (target !== null) {
      v += (target - offset) * 0.022 * dt;
      v *= Math.pow(0.8, dt);
      v = clamp(v, -64, 64);
      offset += v * dt;
      if (Math.abs(target - offset) < 0.5 && Math.abs(v) < 0.2) {
        offset = target; v = 0; target = null;
        holdUntil = now + 1400;
        if (settle) { const r = settle; settle = null; r(); }
      }
    } else {
      const focusIn = strip.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
      const want = (hover || openP >= 0 || now < holdUntil || focusIn) ? 0 : DRIFT;
      v += (want - v) * (1 - Math.pow(0.95, dt));
      offset += v * dt;
    }
  }
  const fv = (offset - prevOffset) / dt;
  prevOffset = offset;
  vis += (fv - vis) * Math.min(1, (dragging ? 0.4 : 0.22) * dt);
  if (Math.abs(vis) < 0.01) vis = 0;
  const ev = reduce ? 0 : clamp(vis, -16, 16);
  stripEV = ev; stripDX = fv * dt;
  if (stageOn || openP >= 0) {
    positionCards(ev);
    renderClips(now, ev);
    stretchWords(ev);
  }
  requestAnimationFrame(frame);
}

/* Drag, tap, hover, wheel */
let lastX = 0, moved = 0, downSlot = null, pid = null, samples = [];
strip.addEventListener('pointerdown', e => {
  if (e.button !== 0 || openP >= 0) return;
  dragging = true; moved = 0; lastX = e.clientX; lastMove = performance.now();
  samples = [[lastMove, e.clientX]];
  target = null; settle = null; pid = e.pointerId;
  const cardEl = e.target.closest('.card');
  downSlot = cardEl ? slots.find(s => s.el === cardEl) : null;
  try { strip.setPointerCapture(pid); } catch (_) {}
  strip.classList.add('grabbing');
});
strip.addEventListener('pointermove', e => {
  if (!dragging || e.pointerId !== pid) return;
  const dx = e.clientX - lastX;
  lastX = e.clientX; moved += Math.abs(dx);
  offset += dx; lastMove = performance.now();
  samples.push([lastMove, e.clientX]);
  if (samples.length > 10) samples.shift();
});
function endDrag(e, cancelled) {
  if (!dragging || e.pointerId !== pid) return;
  dragging = false;
  strip.classList.remove('grabbing');
  try { strip.releasePointerCapture(pid); } catch (_) {}
  const tNow = performance.now();
  const recent = samples.filter(s => tNow - s[0] < 100);
  let rv = 0;
  if (recent.length >= 2) {
    const a = recent[0], b = recent[recent.length - 1];
    if (b[0] > a[0]) rv = (b[1] - a[1]) / (b[0] - a[0]) * 16.667;
  }
  v = clamp(rv, -40, 40);
  if (!cancelled && moved < 6 && downSlot) openProject(downSlot.p, downSlot);
  else if (moved >= 6) holdUntil = performance.now() + 900;
}
strip.addEventListener('pointerup', e => endDrag(e, false));
strip.addEventListener('pointercancel', e => endDrag(e, true));
strip.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
strip.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover = false; });
strip.addEventListener('wheel', e => {
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (!d || openP >= 0) return;
  e.preventDefault();
  target = null; settle = null;
  v = clamp(v - d * (e.deltaMode === 1 ? 16 : 1) * 0.045, -32, 32);
  holdUntil = performance.now() + 700;
}, { passive: false });

onDoc('keydown', e => {
  if (openP >= 0) {
    if (e.key === 'Escape') { e.preventDefault(); closeProject(); }
    else if (e.key === 'Tab') trapTab(e);
    return;
  }
  const tag = document.activeElement ? document.activeElement.tagName : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const r = strip.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    e.preventDefault();
    step(e.key === 'ArrowRight' ? 1 : -1);
  }
});

/* Project view */
function fill(p) {
  const P = PROJECTS[p];
  $('pTag').textContent = P.tag;
  $('pTitle').textContent = P.name;
  $('pLede').textContent = P.lede;
  const ctx = $('pContext');
  ctx.textContent = P.context || '';
  ctx.hidden = !P.context;
  $('pProof').replaceChildren(...P.proof.map(t => el('li', { text: t })));
  $('pLinks').replaceChildren(...P.links.map(([label, url], i) => el('a', { class: i === 0 ? 'btn solid' : 'btn', href: url, rel: 'noopener', text: label })));
  const note = $('pNote');
  note.textContent = P.linkNote || '';
  note.hidden = !P.linkNote;
  $('pFlowTitle').textContent = P.flowTitle || 'How it works';
  $('pFlow').replaceChildren(...P.flow.map(t => el('li', { text: t })));
  $('pStory').replaceChildren(...P.story.map(([h, t]) => el('section', {}, [el('h4', { text: h }), el('p', { text: t })])));
  $('pStack').replaceChildren(...P.stack.map(t => el('li', { text: t })));
  pMedia.style.setProperty('--g', P.ground);
  proj.style.setProperty('--accent', P.hue);
  const nx = PROJECTS[(p + 1) % N], pv = PROJECTS[(p - 1 + N) % N];
  pNext.replaceChildren(document.createTextNode('Next'), el('span', { class: 'nx', text: `: ${nx.short || nx.name}` }));
  pPrev.replaceChildren(document.createTextNode('Previous'), el('span', { class: 'nx', text: `: ${pv.short || pv.name}` }));
  pNext.setAttribute('aria-label', `Next project: ${nx.name}`);
  pPrev.setAttribute('aria-label', `Previous project: ${pv.name}`);
}
function sizeBig() {
  const w = Math.round(pMedia.offsetWidth * DPR);
  const h = Math.round(w * 10 / 16);
  if (w > 0 && pCanvas.width !== w) { pCanvas.width = w; pCanvas.height = h; }
}
function setHash(slug) {
  const cur = location.hash.slice(1);
  if (slug && cur !== slug) { suppressHash = true; location.hash = slug; }
  else if (!slug && PROJECTS.some(P => P.slug === cur)) {
    try { history.replaceState(null, '', location.href.split('#')[0]); } catch (_) { suppressHash = true; location.hash = ''; }
  }
}
function flipFrom(rect) {
  const R = pMedia.getBoundingClientRect();
  return `translate(${rect.left - R.left}px, ${rect.top - R.top}px) scale(${rect.width / R.width}, ${rect.height / R.height})`;
}
function openProject(p, s) {
  if (openP >= 0 || closing) return;
  openP = p; openSlot = s || nearestSlot(p);
  fill(p);
  proj.hidden = false;
  proj.scrollTop = 0;
  root.classList.add('locked');
  sizeBig();
  drawBig((performance.now() - t0) / 1000);
  setHash(PROJECTS[p].slug);
  const canFlip = !reduce && s && s.vis;
  if (canFlip) {
    pMedia.classList.remove('flip');
    pMedia.style.transform = flipFrom(s.cv.getBoundingClientRect());
    pMedia.getBoundingClientRect();
  }
  if (openSlot) openSlot.inner.style.visibility = 'hidden';
  requestAnimationFrame(() => {
    if (canFlip) { pMedia.classList.add('flip'); pMedia.style.transform = ''; }
    proj.classList.add('in');
  });
  setTimeout(() => pBack.focus({ preventScroll: true }), 60);
}
function closeProject() {
  if (openP < 0 || closing) return;
  closing = true;
  const s = openSlot;
  proj.classList.remove('in');
  const r = s ? s.el.getBoundingClientRect() : null;
  const canFlip = !reduce && s && s.vis && r && r.bottom > 0 && r.top < innerHeight;
  if (canFlip) {
    proj.scrollTop = 0;
    pMedia.classList.add('flip');
    pMedia.style.transform = flipFrom(s.cv.getBoundingClientRect());
  }
  setTimeout(() => {
    proj.hidden = true;
    pMedia.classList.remove('flip');
    pMedia.style.transform = '';
    if (s) s.inner.style.visibility = '';
    root.classList.remove('locked');
    openP = -1; openSlot = null; closing = false;
    holdUntil = performance.now() + 1200;
    setHash('');
    if (s && canFlip) s.el.focus({ preventScroll: true });
    setPose('idle');
  }, canFlip ? 560 : 260);
}
function swapTo(p, dir) {
  if (swapping || closing || openP < 0 || p === openP) return;
  swapping = true;
  pBody.style.setProperty('--dir', dir);
  pBody.classList.add('out');
  setTimeout(() => {
    const s = nearestSlot(p);
    offset += vw / 2 - (s.x + cardW / 2);
    prevOffset = offset;
    target = null; v = 0;
    positionCards(0);
    if (openSlot) openSlot.inner.style.visibility = '';
    openP = p; openSlot = nearestSlot(p);
    openSlot.inner.style.visibility = 'hidden';
    fill(p);
    proj.scrollTop = 0;
    drawBig((performance.now() - t0) / 1000);
    setHash(PROJECTS[p].slug);
    pBody.classList.remove('out');
    pBody.classList.add('from');
    pBody.getBoundingClientRect();
    pBody.classList.remove('from');
    swapping = false;
  }, reduce ? 0 : 230);
}
function trapTab(e) {
  const f = [...proj.querySelectorAll('button, a[href]')].filter(n => !n.closest('[hidden]') && n.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], lastEl = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
  else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
}
pBack.addEventListener('click', closeProject);
pNext.addEventListener('click', () => swapTo((openP + 1) % N, 1));
pPrev.addEventListener('click', () => swapTo((openP - 1 + N) % N, -1));
function projectFromHash() { return PROJECTS.findIndex(P => P.slug === location.hash.slice(1)); }
addEventListener('hashchange', function onHash() {
  if (suppressHash) { suppressHash = false; return; }
  if (closing || swapping) { setTimeout(onHash, 620); return; }
  const p = projectFromHash();
  if (p >= 0 && openP < 0) { const s = nearestSlot(p); offset += vw / 2 - (s.x + cardW / 2); prevOffset = offset; positionCards(0); openProject(p, null); }
  else if (p >= 0 && openP !== p) swapTo(p, 1);
  else if (p < 0 && openP >= 0) closeProject();
});

/* Ask me: a scripted router over the same facts the live chat uses */
const INTENTS = {
  experience: { 'experience': 3, 'where did you work': 4, 'where have you worked': 4, 'work before': 3, 'cohesity': 3, 'rutgers': 2, 'peregrine': 3, 'worked': 2, 'work history': 3, 'job': 2, 'jobs': 2, 'impact': 2, 'intern': 1, 'alpha ai': 3, 'career': 2, 'company': 1, 'companies': 1 },
  skills: { 'skill': 3, 'skills': 3, 'stack': 2, 'build with': 3, 'tech': 2, 'technologies': 3, 'languages': 3, 'tools': 2, 'aws': 2, 'python': 1, 'typescript': 1, 'frameworks': 2 },
  resume: { 'resume': 4, 'cv': 4, 'résumé': 4 },
  availability: { 'available': 3, 'availability': 3, 'open to': 3, 'internship': 3, 'internships': 3, 'full-time': 3, 'full time': 3, 'opt': 3, 'visa': 3, 'graduat*': 2, 'hiring': 2, 'start': 1, 'sponsor*': 3, 'roles': 1 },
  contact: { 'contact': 3, 'email': 3, 'reach': 3, 'linkedin': 3, 'get in touch': 3, 'talk': 1, 'connect': 2, 'message': 1 },
  about: { 'who are you': 4, 'about you': 3, 'yourself': 3, 'background': 2, 'introduce': 3, 'who is rohan': 4, 'about rohan': 3, 'bio': 3 },
  projects: { 'projects': 3, 'project': 2, 'portfolio': 2, 'built': 1, 'what have you built': 3, 'your work': 1 }
};
const GENERIC = { ml: ['auto-triage', 'f1-race-rewind'], production: ['rutgers-apps', 'auto-triage'], agent: ['patchwork', 'agentically', 'whyzr', 'scail'], agents: ['patchwork', 'agentically', 'whyzr', 'scail'], agentic: ['agentically', 'patchwork'], llm: ['llm-benchmarking', 'agentically'], llms: ['llm-benchmarking', 'agentically'] };
const SHORT = { rsg: 'RSG', sel: 'SEL', 'next.js': 'Next.js', nextjs: 'Next.js', postgresql: 'PostgreSQL', postgres: 'Postgres', rag: 'RAG', seo: 'SEO', pr: 'PR', prs: 'PRs', f1: 'F1', pdf: 'PDF', pdfs: 'PDFs', crm: 'CRM', chatgpt: 'ChatGPT', gguf: 'GGUF', github: 'GitHub', claude: 'Claude', mongodb: 'MongoDB', gemini: 'Gemini', qwen: 'Qwen', groq: 'Groq', fastf1: 'FastF1', gitagent: 'gitagent', voyage: 'Voyage' };
function hit(s, k) {
  const pre = k.endsWith('*'), word = pre ? k.slice(0, -1) : k;
  return pre ? s.includes(' ' + word) : s.includes(' ' + word + ' ');
}
function route(q) {
  const s = ' ' + q.toLowerCase().replace(/[^a-z0-9.+\-é ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const ps = PROJECTS.map(() => 0), terms = PROJECTS.map(() => []);
  PROJECTS.forEach((P, i) => { for (const [k, w] of Object.entries(P.keys)) if (hit(s, k)) { ps[i] += w; terms[i].push(SHORT[k.replace('*', '')] || k.replace('*', '')); } });
  for (const [k, list] of Object.entries(GENERIC)) if (hit(s, k)) list.forEach((slug, r) => { ps[PROJECTS.findIndex(P => P.slug === slug)] += 0.6 - r * 0.1; });
  const order = ps.map((sc, i) => [sc, i]).sort((a, b) => b[0] - a[0]);
  let bestI = null, bestIS = 0;
  for (const [name, keys] of Object.entries(INTENTS)) {
    let sc = 0;
    for (const [k, w] of Object.entries(keys)) if (hit(s, k)) sc += w;
    if (sc > bestIS) { bestIS = sc; bestI = name; }
  }
  if (order[0][0] >= 2.5 && order[0][0] >= bestIS) return { kind: 'project', p: order[0][1], second: order[1][0] > 0 ? order[1][1] : -1, terms: terms[order[0][1]].slice(0, 3) };
  if (bestI) return { kind: bestI };
  if (order[0][0] > 0) return { kind: 'project', p: order[0][1], second: order[1][0] > 0 ? order[1][1] : -1, terms: terms[order[0][1]].slice(0, 3) };
  return { kind: 'fallback' };
}
const answer = $('answer'), askInput = $('askInput');
let askRun = 0;
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
function scrollToStage() {
  const top = $('stage').getBoundingClientRect().top;
  if (top < -40 || top > innerHeight * 0.4) window.scrollTo({ top: window.scrollY + top - 8, behavior: reduce ? 'auto' : 'smooth' });
}
const linkBtn = (label, url, solid) => el('a', { class: solid ? 'btn solid' : 'btn', href: url, rel: 'noopener', text: label });
function replyFor(kind) {
  const p = t => el('p', { text: t });
  if (kind === 'about') return [p('I’m an AI/ML engineer. I build agentic AI systems, LLM-integrated backends and RAG pipelines, mostly with Claude and Gemini. I’m finishing an MS in Data Science at Rutgers and work as a software developer at Rutgers SAS IT, where I took two web apps to production. Before that I spent three years at Cohesity.'),
    el('div', { class: 'row-btns' }, [el('button', { type: 'button', class: 'btn', text: 'See my projects', onclick: () => scrollToStage() }), el('button', { type: 'button', class: 'btn', text: 'See my experience', onclick: () => $('experience').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }) })])];
  if (kind === 'experience') return [p('Right now I build and run two live web apps at Rutgers. Before that, at Cohesity, I built a production auto-triage system that cut debugging turnaround by 37%. Here is where I’ve worked.'),
    el('div', { class: 'acard' }, [el('ul', { class: 'alist' }, ROLES.map(r => el('li', {}, [el('b', { text: `${r.role}, ${r.org}` }), el('span', { text: `${r.when}. ${r.line}` })]))),
      el('button', { type: 'button', class: 'linky', text: 'Open the full experience section', onclick: () => $('experience').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }) })])];
  if (kind === 'skills') return [p('Mostly agentic AI and retrieval, on Python and TypeScript backends.'),
    el('div', { class: 'acard skill-groups' }, Object.entries(SKILLS).map(([g, items]) => el('div', {}, [el('h4', { text: g }), el('ul', { class: 'tags' }, items.map(t => el('li', { text: t })))])))];
  if (kind === 'resume') return [p('Here’s my resume. The web version is easier to read on a phone.'), el('div', { class: 'row-btns' }, [linkBtn('View resume', LINKS.resume, true), linkBtn('Resume PDF', LINKS.pdf)])];
  if (kind === 'availability') return [p('Yes. I’m open to internships now and full-time roles after I graduate in May 2027, in AI, ML and software engineering. I’m based in New Brunswick, NJ, and I’m F-1 OPT eligible.'), el('div', { class: 'row-btns' }, [linkBtn('View resume', LINKS.resume, true), el('button', { type: 'button', class: 'btn', text: 'Contact me', onclick: () => $('contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }) })])];
  if (kind === 'contact') return [p(`Email is fastest: ${LINKS.email}. I’m also on LinkedIn and GitHub.`), el('div', { class: 'row-btns' }, [el('button', { type: 'button', class: 'btn solid', text: 'Copy email', onclick: e => copyEmail(e.currentTarget) }), linkBtn('LinkedIn', LINKS.linkedin), linkBtn('GitHub', LINKS.github)])];
  if (kind === 'projects') return [p('Here are my projects. Pick one and I’ll open it.'), el('div', { class: 'row-btns' }, PROJECTS.map((P, i) => el('button', { type: 'button', class: 'btn', text: P.short || P.name, onclick: () => goProject(i) })))];
  return [p('I can answer questions about my projects, experience, skills, resume, availability, and how to reach me. Try one of the questions above.')];
}
async function goProject(i) {
  const run = ++askRun;
  scrollToStage();
  setPose('presenting', 3000);
  await wait(reduce ? 0 : 450);
  if (run !== askRun) return;
  const s = await flyToProject(i, reduce ? 0 : -span);
  if (run !== askRun || openP >= 0) return;
  s.el.classList.add('hit');
  setTimeout(() => s.el.classList.remove('hit'), 1500);
  await wait(420);
  if (run !== askRun || openP >= 0) return;
  openProject(i, s);
}
async function runAsk(q) {
  q = q.trim();
  if (!q) { askInput.focus(); return; }
  const run = ++askRun;
  answer.replaceChildren(el('p', { class: 'q-echo', text: `You asked: ${q}` }));
  setPose('thinking');
  const r = route(q);
  if (r.kind !== 'project') {
    await wait(650); if (run !== askRun) return;
    answer.appendChild(el('div', { class: 'reply' }, replyFor(r.kind)));
    setPose('explaining', 4200);
    return;
  }
  const trace = el('ol', { class: 'trace' });
  answer.appendChild(trace);
  const say = t => trace.appendChild(el('li', { text: t }));
  await wait(380); if (run !== askRun) return;
  say(r.terms.length ? `Matches ${r.terms.join(', ')}` : 'Matches my agent work');
  await wait(380); if (run !== askRun) return;
  say(`Best fit is ${PROJECTS[r.p].name}` + (r.second >= 0 ? `, then ${PROJECTS[r.second].name}` : ''));
  await wait(380); if (run !== askRun) return;
  say(`Opening ${PROJECTS[r.p].name}`);
  setPose('presenting', 3200);
  await wait(300); if (run !== askRun) return;
  run === askRun && goProject(r.p);
}
/* Copy email */
async function copyEmail(btn) {
  const note = $('copyNote');
  try {
    await navigator.clipboard.writeText(LINKS.email);
    const old = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = old; }, 1600);
    if (btn.id === 'copyMail') note.textContent = '';
  } catch (_) {
    if (btn.id === 'copyMail') note.textContent = `Copying is blocked here. The address is ${LINKS.email}.`;
    else btn.textContent = LINKS.email;
  }
}
$('copyMail').addEventListener('click', e => copyEmail(e.currentTarget));

/* Start */
let lastVW = 0, lastVH = innerHeight;
addEventListener('resize', () => {
  clearTimeout(layout.t);
  layout.t = setTimeout(() => {
    const wide = root.clientWidth >= 700;
    if (root.clientWidth !== lastVW || (wide && Math.abs(innerHeight - lastVH) > 60)) { lastVW = root.clientWidth; lastVH = innerHeight; layout(); }
    else sizeBig();
  }, 150);
});
if (document.fonts) document.fonts.ready.then(() => { wrapCache.clear(); offs.forEach(o => { o.drawn = false; }); });

if ('IntersectionObserver' in window) {
  new IntersectionObserver(es => { stageOn = es[es.length - 1].isIntersecting; if (stageOn) posKey = ''; }, { rootMargin: '120px 0px' }).observe($('stage'));
}
layout();
lastVW = vw;
const start = projectFromHash();
if (start >= 0) {
  const s = nearestSlot(start);
  offset += vw / 2 - (s.x + cardW / 2);
  prevOffset = offset;
  positionCards(0);
  openProject(start, null);
} else if (!reduce) {
  const home = offset;
  offset = home - 1100;
  prevOffset = offset;
  target = home;
  positionCards(0);
}
requestAnimationFrame(frame);



  /* ---- Mini avatar ---- */
/* A small copy of the avatar that can stand on things, walk, jump and point anywhere on the page.
   Every pose is exported at one scale (a standing figure is 440 px tall) and aligned on the point
   between its feet, so switching poses never makes him jump. (0, 0) is that point. */
const MINI_META = {
  idle: { w: 152, h: 444, bottom: 441, feet: 76.0 },
  listening: { w: 171, h: 445, bottom: 442, feet: 101.5 },
  thinking: { w: 143, h: 454, bottom: 451, feet: 71.0 },
  explaining: { w: 195, h: 451, bottom: 448, feet: 99.5 },
  presenting: { w: 216, h: 448, bottom: 445, feet: 136.0 },
  point: { w: 250, h: 447, bottom: 445, feet: 86.5 },
  pointUp: { w: 211, h: 440, bottom: 438, feet: 84.5 },
  wave: { w: 187, h: 444, bottom: 442, feet: 99.0 },
  cheer: { w: 252, h: 434, bottom: 432, feet: 124.5 },
  jump: { w: 309, h: 424, bottom: 422, feet: 156.5 },
  crouch: { w: 258, h: 343, bottom: 341, feet: 99.5 },
  walkA: { w: 179, h: 447, bottom: 445, feet: 126.5 },
  walkB: { w: 170, h: 439, bottom: 437, feet: 116.0 }
};
function makeMini(cls) {
  const flip = el('div', { class: 'mini-flip' });
  const imgs = {};
  for (const p of Object.keys(MINI_META)) {
    const im = el('img', { src: `/assets/avatar/mini/${p}.webp`, alt: '', draggable: 'false', decoding: 'async' });
    imgs[p] = im;
    flip.appendChild(im);
  }
  const shadow = el('div', { class: 'mini-shadow' });
  const body = el('div', { class: 'mini-body' }, [flip]);
  const wrap = el('div', { class: 'mini ' + cls, 'aria-hidden': 'true' }, [shadow, body]);
  bodyAppend(wrap);
  const m = { wrap, body, flip, shadow, imgs, H: 100, pose: '', x: -300, y: -300, bob: 0, rot: 0, pivot: 0.45, sx: 1, sy: 1, dir: 1, ground: 1 };
  m.size = h => {
    m.H = h;
    const k = h / 440;
    for (const [p, im] of Object.entries(imgs)) {
      const M = MINI_META[p];
      Object.assign(im.style, { width: M.w * k + 'px', height: M.h * k + 'px', left: -M.feet * k + 'px', top: -M.bottom * k + 'px' });
    }
    Object.assign(shadow.style, { width: 70 * k + 'px', left: -35 * k + 'px' });
  };
  m.setPose = p => {
    if (p === m.pose) return;
    m.pose = p;
    for (const [k, im] of Object.entries(imgs)) im.classList.toggle('on', k === p);
  };
  m.render = () => {
    wrap.style.transform = `translate3d(${m.x.toFixed(1)}px,${m.y.toFixed(1)}px,0)`;
    const pv = m.pivot * m.H;
    body.style.transform = `translateY(${(m.bob - pv).toFixed(1)}px) rotate(${m.rot.toFixed(2)}deg) translateY(${pv.toFixed(1)}px) scale(${m.sx.toFixed(3)},${m.sy.toFixed(3)})`;
    flip.style.transform = m.dir < 0 ? 'scaleX(-1)' : 'none';
    shadow.style.opacity = m.ground.toFixed(2);
  };
  m.setPose('idle');
  return m;
}
const easeIO = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const small = () => innerWidth < 640;

/* The big avatar in the Ask section uses the same cutouts: line each pose up on its feet too. */
function alignBigAvatar() {
  const box = $('avatar');
  if (!box) return;
  const k = box.clientHeight * 0.97 / 440;
  box.querySelectorAll('img').forEach(im => {
    const M = MINI_META[im.dataset.pose];
    if (!M) return;
    Object.assign(im.style, { height: M.h * k + 'px', width: M.w * k + 'px', left: `calc(50% - ${(M.feet * k).toFixed(1)}px)`, bottom: (-(M.h - M.bottom) * k).toFixed(1) + 'px', transform: 'none' });
  });
}
alignBigAvatar();
addEventListener('resize', alignBigAvatar);


  /* ---- Agent ---- */
/* The agent: a small Rohan who answers questions by doing them on the page.
   Typed questions go to the live chat (Claude with tools, through bridge.ask). Each tool call
   becomes an action: getProject opens that project, getExperience walks to the role, getContact
   copies the email, and so on. The suggestion chips, and any failure of the live chat, use the
   scripted router above instead, so the agent always works, even without an API key. */
const FACE = n => `/assets/avatar/faces/${n}.webp`;
const ag = makeMini('ag-mini');
ag.pivot = 0.5;
const agFace = el('img', { class: 'ag-face', src: FACE('smile'), alt: '' });
const agQ = el('p', { class: 'ag-q' });
const agSay = el('p', { class: 'ag-say', 'aria-live': 'polite' });
const agSteps = el('ol', { class: 'ag-steps', 'aria-label': 'What I did' });
const agChips = el('div', { class: 'ag-chips' });
const agInput = el('input', { class: 'ag-input', type: 'text', maxlength: '400', placeholder: 'Ask me anything', 'aria-label': 'Ask Rohan anything', autocomplete: 'off', enterkeyhint: 'send' });
const agSend = el('button', { class: 'ag-send', type: 'submit', 'aria-label': 'Send' });
agSend.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const agForm = el('form', { class: 'ag-form', autocomplete: 'off' }, [agInput, agSend]);
const agOpen = el('button', { type: 'button', class: 'ag-open', text: 'Ask me' });
const agMin = el('button', { type: 'button', class: 'ag-min', 'aria-label': 'Minimize' });
agMin.innerHTML = '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const agCard = el('section', { class: 'ag-card', 'aria-label': 'Ask Rohan' }, [
  agFace,
  el('div', { class: 'ag-main' }, [agQ, agSay, agSteps, agChips, agForm, agOpen]),
  agMin
]);
bodyAppend(agCard);
['smile', 'thinking', 'explaining', 'listening', 'asleep'].forEach(n => { const im = new Image(); im.src = FACE(n); });

/* Where he can stand. Each place is read fresh every frame, so he rides along when the page moves. */
const onCard = () => {
  const r = agCard.getBoundingClientRect();
  return { x: r.right - (agCard.classList.contains('compact') ? 28 : small() ? 44 : 60), y: r.top + 1 };
};
const onTopOf = (node, fx = 0.5, dx = 0) => () => { const r = node.getBoundingClientRect(); return { x: r.left + r.width * fx + dx, y: r.top + 1 }; };
const onLineOf = (node, fx = 0.5, dx = 0) => () => { const r = node.getBoundingClientRect(); return { x: r.left + r.width * fx + dx, y: r.bottom - 1 }; };
const onStrip = fx => () => ({ x: innerWidth * fx, y: strip.getBoundingClientRect().top + 1 });

let agAt = null, agJ = null, agW = null, agMode = 'still', agSq = 0, agSqV = 0, agLast = performance.now(), agBusy = false, agOffT = 0, agRun = 0, agMet = false, agTouched = false;
let agWant = 'idle', agWantDir = 1, agLandT = -1e9, agLandDir = 1, agIdleT = performance.now() + 9000;
/* The pose he should hold. While he crouches, jumps, lands or walks, the frame loop shows
   those poses instead and comes back to this one. dir -1 mirrors him (to point or face left). */
const want = (pose, dir = 1) => { agWant = pose; agWantDir = dir; };

function agJump(to, o = {}) {
  return new Promise(res => {
    if (agW) { agW.res(); agW = null; }
    const p = to();
    const x0 = ag.x, y0 = ag.y;
    const dist = Math.hypot(p.x - x0, p.y - y0);
    if (reduce || (dist < 2 && !o.h)) { agAt = to; agJ = null; res(); return; }
    const dur = o.dur || clamp(420 + dist * 0.42, 460, 900);
    const h = o.h != null ? o.h : 46 + Math.max(0, y0 - p.y) * 0.32 + dist * 0.06;
    const dir = p.x >= x0 ? 1 : -1;
    agJ = { to, x0, y0, t0: performance.now() + (o.crouch === 0 ? 0 : 140), dur, h, res, dir, lean: dir * Math.min(12, dist / 30) };
  });
}
/* Walk along the surface he is on, to another spot on it. */
function agWalk(to) {
  return new Promise(res => {
    const p = to(), dx = p.x - ag.x;
    if (reduce || Math.abs(dx) < 3) { agAt = to; res(); return; }
    agW = { to, x0: ag.x, t0: performance.now(), dur: Math.abs(dx) / (small() ? 0.13 : 0.17), res, dir: Math.sign(dx) };
  });
}
function agFrame(now) {
  const dt = Math.min(3, Math.max(0.25, (now - agLast) / 16.667));
  agLast = now;
  const H = small() ? 104 : 150;
  if (ag.H !== H) ag.size(H);
  let air = false, pose = agWant, dir = agWantDir;
  if (agJ) {
    const J = agJ, p = J.to();
    if (now < J.t0) { ag.x = J.x0; ag.y = J.y0; agSq = 0.18; agSqV = 0; pose = 'crouch'; dir = -J.dir; }
    else {
      if (!J.up) { J.up = true; agSq = -0.4; agSqV = 0; }
      const t = Math.min(1, (now - J.t0) / J.dur);
      ag.x = J.x0 + (p.x - J.x0) * t;
      ag.y = J.y0 + (p.y - J.y0) * t - J.h * 4 * t * (1 - t);
      ag.rot = J.lean * Math.sin(Math.PI * t);
      air = t < 1; pose = 'jump'; dir = J.dir;
      if (t >= 1) { agJ = null; agAt = J.to; ag.rot = 0; agSq = 0.5; agSqV = 0; agLandT = now; agLandDir = J.dir; J.res(); }
    }
  } else if (agW) {
    const W = agW, p = W.to();
    const t = Math.min(1, (now - W.t0) / W.dur);
    ag.x = W.x0 + (p.x - W.x0) * t; ag.y = p.y;
    const step = (now - W.t0) / 170;
    pose = Math.floor(step) % 2 ? 'walkB' : 'walkA'; dir = W.dir;
    ag.bob = -Math.abs(Math.sin(step * Math.PI)) * 2.5;
    if (t >= 1) { agW = null; agAt = W.to; ag.bob = 0; W.res(); }
  } else if (agAt) {
    const p = agAt();
    ag.x = p.x; ag.y = p.y;
  }
  if (!agJ && !agW && now - agLandT < 150) { pose = 'crouch'; dir = -agLandDir; }
  if (agMode === 'cheer' && !agJ) {
    const ph = now / 130;
    ag.bob = -Math.abs(Math.sin(ph)) * 11;
    ag.rot = Math.sin(ph) * 4;
    if (Math.abs(Math.sin(ph)) < 0.12 && agSq < 0.2) { agSq = 0.3; agSqV = 0; }
  } else if (agMode === 'run' && !agJ) {
    const ph = now / 120;
    pose = Math.floor(ph / Math.PI) % 2 ? 'walkB' : 'walkA'; dir = 1;
    ag.bob = -Math.abs(Math.sin(ph)) * 6;
    ag.rot = 7 + Math.sin(ph * 2) * 2;
  } else if (!agJ && !agW) { ag.bob = 0; ag.rot *= 0.7; }
  ag.setPose(pose); ag.dir = dir;
  // Left alone on his card for a while, he paces a little.
  if (!agBusy && !agJ && !agW && agAt === onCard && agMode === 'still' && !agCard.classList.contains('compact') && now > agIdleT) {
    agIdleT = now + 9000 + Math.random() * 7000;
    if (agWant === 'idle') {
      const off = small() ? 34 : 50;
      agWalk(() => { const c = onCard(); return { x: c.x - off, y: c.y }; }).then(() => { if (!agBusy && !agJ && agAt !== onCard) agWalk(onCard); });
    }
  }
  const acc = -0.3 * agSq - 0.34 * agSqV;
  agSqV += acc * dt; agSq += agSqV * dt;
  if (Math.abs(agSq) < 0.002 && Math.abs(agSqV) < 0.002) agSq = agSqV = 0;
  ag.sx = 1 + 0.12 * agSq; ag.sy = 1 - 0.16 * agSq;
  ag.ground += ((air ? 0 : 1) - ag.ground) * 0.35;
  // If you scroll away from where he was standing, he comes back to the card.
  if (!agBusy && !agJ && agAt && agAt !== onCard) {
    if (ag.y < 0 || ag.y - H > innerHeight) {
      if (!agOffT) agOffT = now;
      else if (now - agOffT > 400) { agOffT = 0; const c = onCard(); ag.x = innerWidth + 30; ag.y = c.y - 80; agJump(onCard, { h: 30 }); }
    } else agOffT = 0;
  }
  ag.render();
  requestAnimationFrame(agFrame);
}

/* The card is his home base. He stands on it and talks through it. */
const setFace = f => { agFace.src = FACE(f); };
const say = t => { agSay.classList.remove('typing'); agSay.textContent = t; };
function agStep(code) {
  const res = el('span', { class: 'ag-res' });
  const li = el('li', {}, [el('span', { class: 'ag-st', 'aria-hidden': 'true' }), el('code', { text: code }), res]);
  agSteps.appendChild(li);
  while (agSteps.children.length > 3) agSteps.firstChild.remove();
  return r => { li.classList.add('ok'); res.textContent = r || ''; };
}
/* What he is doing right now, in one line under the tool calls. */
function agNote(t) {
  let li = agSteps.querySelector('li.note');
  if (!li) li = el('li', { class: 'note ok' }, [el('span', { class: 'ag-st', 'aria-hidden': 'true' }), el('span')]);
  li.lastChild.textContent = t;
  agSteps.appendChild(li);
  while (agSteps.children.length > 3) agSteps.firstChild.remove();
}
const narrate = (ctx, t) => { if (ctx.live) agNote(t); else say(t); };
const CHIP = {
  rag: 'Show me your RAG work',
  work: 'Where did you work before?',
  reach: 'How do I reach you?',
  apps: 'Show me your live production apps',
  stack: 'What do you build with?',
  open: 'Are you open to full-time roles?',
  pr: 'Show me the agent that opens GitHub PRs',
  all: 'What have you built?'
};
const FOLLOW = {
  project: ['work', 'reach', 'all'], projects: ['rag', 'apps', 'pr'], experience: ['apps', 'stack', 'reach'],
  skills: ['rag', 'work', 'open'], resume: ['reach', 'work', 'rag'], availability: ['reach', 'work', 'rag'],
  contact: ['rag', 'work', 'apps'], about: ['rag', 'work', 'reach'], fallback: ['rag', 'work', 'reach'], text: ['rag', 'work', 'reach']
};
function chips(keys) {
  agChips.replaceChildren(...keys.map(k => el('button', { type: 'button', class: 'ag-chip', text: CHIP[k], onclick: () => askScripted(CHIP[k]) })));
}
function linkChips(list) {
  agChips.replaceChildren(...list.map(([label, href, solid]) => el('a', { class: 'ag-chip' + (solid ? ' solid' : ''), href, text: label })));
}
function agIdle(again) {
  agRun++; agBusy = false; agMode = 'still'; live = null;
  agCard.classList.remove('compact');
  agQ.textContent = ''; agSteps.replaceChildren();
  setFace('smile'); want('idle');
  say(again ? 'Anything else you want to see?' : 'Hi, I’m Rohan. Ask me anything and I’ll show you on the page.');
  chips(['rag', 'work', 'reach']);
  if (agAt && agAt !== onCard) agJump(onCard);
}
function agCompact() {
  agRun++; agBusy = false; agMode = 'still'; live = null;
  agCard.classList.add('compact');
  agQ.textContent = ''; agSteps.replaceChildren(); agChips.replaceChildren(); say('');
  setFace('smile'); want('idle');
  agJump(onCard, { h: 40 });
}
agMin.addEventListener('click', () => { agTouched = true; agCompact(); });
agOpen.addEventListener('click', () => { agTouched = true; agIdle(agMet); if (!COARSE) setTimeout(() => agInput.focus({ preventScroll: true }), 50); });
agCard.addEventListener('pointerdown', () => { agTouched = true; });
agInput.addEventListener('focus', () => { agTouched = true; if (!agBusy) { setFace('listening'); want('listening'); } });
agInput.addEventListener('blur', () => { if (!agBusy) { setFace('smile'); want('idle'); } });
agForm.addEventListener('submit', e => {
  e.preventDefault();
  const q = agInput.value.trim();
  if (!q) { agInput.focus(); return; }
  agInput.value = '';
  agInput.blur();
  askLive(q);
});

/* On phones the keyboard covers the bottom of the screen: lift the card above it. */
const vv = window.visualViewport;
function agKeyboard() {
  if (!vv) return;
  const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop);
  agCard.style.setProperty('--kb', (kb > 60 ? kb : 0) + 'px');
}
if (vv) { vv.addEventListener('resize', agKeyboard, sig); vv.addEventListener('scroll', agKeyboard, sig); }

/* Out of the way while reading: if you scroll down without using it, the card folds into a pill. */
addEventListener('scroll', () => {
  if (!agTouched && !agBusy && !agCard.classList.contains('compact') && agCard.classList.contains('in') && scrollY > innerHeight * 0.75) agCompact();
}, { passive: true });

function settleScroll() {
  return new Promise(res => {
    let lastY = scrollY, still = 0, n = 0;
    const tick = () => {
      n++;
      still = Math.abs(scrollY - lastY) < 0.5 ? still + 1 : 0;
      lastY = scrollY;
      if (still >= 6 || n > 150) res(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
function scrollToFrac(node, frac) {
  const r = node.getBoundingClientRect();
  window.scrollTo({ top: Math.max(0, scrollY + r.top - innerHeight * frac), behavior: reduce ? 'auto' : 'smooth' });
  return settleScroll();
}
/* Keep a spot clear of the card: scroll so the element's bottom sits above it. */
function keepAboveCard(node, margin = 24) {
  const r = node.getBoundingClientRect(), top = agCard.getBoundingClientRect().top - margin;
  if (r.bottom <= top) return Promise.resolve();
  window.scrollTo({ top: scrollY + Math.min(r.bottom - top, Math.max(0, r.top - 60)), behavior: reduce ? 'auto' : 'smooth' });
  return settleScroll();
}
function scrollForStrip() {
  window.scrollTo({ top: Math.max(0, scrollY + strip.getBoundingClientRect().top - (ag.H + 40)), behavior: reduce ? 'auto' : 'smooth' });
  return settleScroll();
}
function puff(x, y) {
  const r = el('span', { class: 'ag-puff', 'aria-hidden': 'true' });
  r.style.left = x + 'px'; r.style.top = y + 'px';
  bodyAppend(r);
  setTimeout(() => r.remove(), 650);
}
async function stomp(node, ok) {
  await agJump(agAt, { h: small() ? 34 : 46, dur: 380, crouch: 0 });
  if (!ok()) return false;
  puff(ag.x, ag.y);
  node.classList.add('ag-press');
  setTimeout(() => node.classList.remove('ag-press'), 200);
  return true;
}
function markLine(li, phrase) {
  const p = li.querySelector('.what > p');
  if (p && phrase && !p.querySelector('.ag-mark')) {
    const t = p.textContent, k = t.indexOf(phrase);
    if (k >= 0) p.replaceChildren(document.createTextNode(t.slice(0, k)), el('mark', { class: 'ag-mark', text: phrase }), document.createTextNode(t.slice(k + phrase.length)));
  }
  requestAnimationFrame(() => requestAnimationFrame(() => li.classList.add('ag-lit')));
}
async function closeFirst(ok) {
  if (openP < 0) return true;
  closeProject();
  await wait(620);
  return ok();
}

/* Actions. Each one walks the page and returns when he is done. */
const MARK = {
  'Rutgers SAS IT': 'two live Rutgers web apps',
  'Peregrine': 'an AI search visibility audit engine',
  'Cohesity': 'cut debugging turnaround by 37%',
  'Alpha AI': 'speech emotion recognition pipelines'
};
const WORK_SAY = {
  'Rutgers SAS IT': 'I’m a software developer at Rutgers SAS IT, where I took two web apps to production.',
  'Peregrine': 'At Peregrine I built Scail, an AI search visibility audit engine, as an AI engineering intern.',
  'Cohesity': 'Three years at Cohesity. I built the auto-triage system that cut debugging time by 37%.',
  'Alpha AI': 'At Alpha AI I built facial expression and speech emotion recognition pipelines.'
};
function roleFor(q) {
  const s = ' ' + q.toLowerCase() + ' ';
  const pick = org => ROLES.findIndex(r => r.org === org);
  if (/cohesity|triage|auto-triage/.test(s)) return pick('Cohesity');
  if (/peregrine|scail|intern(ship)? at/.test(s)) return pick('Peregrine');
  if (/alpha/.test(s)) return pick('Alpha AI');
  if (/rutgers|sas it|now|current/.test(s)) return pick('Rutgers SAS IT');
  if (/before|previous|prior|past|used to/.test(s)) return pick('Cohesity');
  return 0;
}
async function actProject(i, ok, ctx) {
  narrate(ctx, 'Found it. Follow me.');
  setFace('explaining'); want('explaining'); setPose('presenting', 3000);
  await wait(500); if (!ok()) return;
  if (openP === i) return;
  if (!(await closeFirst(ok))) return;
  await scrollForStrip(); if (!ok()) return;
  // The dots under the strip are its controls. He hops onto the right one and stomps it.
  const dot = ticks[i];
  want('idle');
  await agJump(onTopOf(dot, 0.5)); if (!ok()) return;
  narrate(ctx, 'Spinning to it.');
  if (!(await stomp(dot, ok))) return;
  const spin = flyToProject(i, reduce ? 0 : -span);
  want('pointUp', innerWidth / 2 >= ag.x ? 1 : -1);
  agMode = 'cheer';
  const s = await Promise.race([spin, wait(4000).then(() => nearestSlot(i))]);
  agMode = 'still'; if (!ok()) return;
  narrate(ctx, 'There it is.');
  want('cheer');
  await wait(520); if (!ok()) return;
  // Landing on the card opens it, and he bounces straight back to the chat card.
  await agJump(onStrip(0.5), { h: 80 }); if (!ok()) return;
  puff(ag.x, ag.y);
  s.el.classList.add('ag-press', 'hit');
  setTimeout(() => s.el.classList.remove('ag-press'), 200);
  setTimeout(() => s.el.classList.remove('hit'), 700);
  openProject(i, s);
  want('explaining');
  await agJump(onCard, { h: 110, crouch: 0 });
}
async function actProjects(ok, ctx) {
  narrate(ctx, 'Here they are.');
  setFace('explaining'); want('explaining');
  if (!(await closeFirst(ok))) return;
  await scrollForStrip(); if (!ok()) return;
  want('idle');
  await agJump(onStrip(small() ? 0.8 : 0.68)); if (!ok()) return;
  // He runs on top while the strip goes once around under his feet
  agMode = 'run';
  await Promise.race([flyToProject(centered >= 0 ? centered : 0, reduce ? 0 : -span), wait(4000)]);
  agMode = 'still'; if (!ok()) return;
  want('cheer');
  await wait(700); if (!ok()) return;
  want('explaining');
  await agJump(onCard, { h: 90 });
}
async function actWork(ri, ok, ctx) {
  const li = $('roles').children[ri + 1];
  if (!li) return;
  const btn = li.querySelector('.role-actions .more');
  narrate(ctx, 'Here, let me show you.');
  setFace('explaining'); want('explaining');
  if (!(await closeFirst(ok))) return;
  await scrollToFrac(li, small() ? 0.12 : 0.22); if (!ok()) return;
  want('idle');
  if (small()) {
    /* On a phone the open role is taller than the room above the card, so the details stay closed
       and he lands on the role's line, where his hand is level with the summary he marks. */
    if (btn.getAttribute('aria-expanded') === 'true') { btn.click(); await wait(260); if (!ok()) return; }
    await agJump(onLineOf(li, 0.5)); if (!ok()) return;
  } else {
    await agJump(onTopOf(btn, 0.5)); if (!ok()) return;
    narrate(ctx, 'Opening the details.');
    if (!(await stomp(btn, ok))) return;
    if (btn.getAttribute('aria-expanded') !== 'true') btn.click();
    await wait(260); if (!ok()) return;
    await keepAboveCard(li); if (!ok()) return;
    // Down onto the row's line, then a walk to its end, and he points back at it
    await agJump(() => { const L = li.getBoundingClientRect(); return { x: btn.getBoundingClientRect().left + btn.getBoundingClientRect().width / 2, y: L.bottom - 1 }; }, { h: 30 }); if (!ok()) return;
  }
  await agWalk(onLineOf(li, 1, small() ? -26 : -48)); if (!ok()) return;
  want('point', -1); setPose('presenting', 2500);
  markLine(li, MARK[ROLES[ri].org]);
}
async function actAvailability(ok, ctx) {
  const li = $('roles').children[0];
  narrate(ctx, 'Here’s what I’m looking for.');
  setFace('explaining'); want('explaining');
  if (!(await closeFirst(ok))) return;
  await scrollToFrac(li, small() ? 0.14 : 0.22); if (!ok()) return;
  want('idle');
  await agJump(onLineOf(li, small() ? 0.45 : 0.6)); if (!ok()) return;
  await agWalk(onLineOf(li, 1, small() ? -26 : -48)); if (!ok()) return;
  want('point', -1);
  markLine(li, 'Internships now, full-time after I graduate in May 2027.');
}
async function actContact(ok, ctx) {
  narrate(ctx, 'This way.');
  setFace('explaining'); want('explaining');
  if (!(await closeFirst(ok))) return;
  const btn = $('copyMail');
  await scrollToFrac($('contact'), small() ? 0.2 : 0.3); if (!ok()) return;
  want('idle');
  await agJump(onTopOf(btn, 0.5)); if (!ok()) return;
  if (!(await stomp(btn, ok))) return;
  await copyEmail(btn);
  await wait(250); if (!ok()) return;
  await agJump(onTopOf($('contact'), 1, small() ? -40 : -90)); if (!ok()) return;
  want('wave'); setFace('smile');
}
async function actResume(ok, ctx) {
  narrate(ctx, 'Here you go.');
  setFace('explaining'); want('explaining');
  if (!(await closeFirst(ok))) return;
  const btn = [...document.querySelectorAll('.contact-row .btn')].find(b => /resume/i.test(b.textContent)) || $('copyMail');
  await scrollToFrac($('contact'), small() ? 0.2 : 0.3); if (!ok()) return;
  want('idle');
  /* Stand on the rule below the buttons, just right of Resume: his hand lands at its height. */
  await agJump(() => ({ x: btn.getBoundingClientRect().right + (small() ? 50 : 68), y: $('contact').getBoundingClientRect().bottom - 1 })); if (!ok()) return;
  want('point', -1);
  btn.classList.add('ag-press'); puff(btn.getBoundingClientRect().left + btn.offsetWidth / 2, btn.getBoundingClientRect().top + btn.offsetHeight / 2);
  setTimeout(() => btn.classList.remove('ag-press'), 220);
}
async function actAbout(ok, ctx) {
  narrate(ctx, 'That’s me.');
  setFace('smile'); want('explaining');
  if (!(await closeFirst(ok))) return;
  const box = document.querySelector('.about');
  await scrollToFrac(box, small() ? 0.2 : 0.18); if (!ok()) return;
  want('idle');
  await agJump(onTopOf(box, small() ? 0.82 : 0.9)); if (!ok()) return;
  want('point', -1); setFace('smile');
}
async function actSkills(ok, ctx) {
  narrate(ctx, 'Here’s what I use.');
  setFace('explaining'); want('explaining');
  if (!(await closeFirst(ok))) return;
  const box = el('div', { class: 'acard skill-groups' }, Object.entries(SKILLS).map(([g, items]) => el('div', {}, [el('h4', { text: g }), el('ul', { class: 'tags' }, items.map(t => el('li', { text: t })))])));
  $('answer').replaceChildren(box);
  await scrollToFrac(box, small() ? 0.16 : 0.26); if (!ok()) return;
  want('idle');
  await agJump(onTopOf(box, 1, small() ? -36 : -60)); if (!ok()) return;
  want('point', -1);
}

/* What each answer looks like: the tool call shown in the trace, and the action that goes with it. */
const TOOL_SLUG = { llm: 'llm-benchmarking', f1: 'f1-race-rewind' };
const SLUG_TOOL = Object.fromEntries(Object.entries(TOOL_SLUG).map(([a, b]) => [b, a]));
const projectIndex = id => PROJECTS.findIndex(P => P.slug === (TOOL_SLUG[id] || id));
function planFor(kind, q, p) {
  switch (kind) {
    case 'project': return { kind, call: `getProject({ id: "${SLUG_TOOL[PROJECTS[p].slug] || PROJECTS[p].slug}" })`, result: PROJECTS[p].name, run: (ok, ctx) => actProject(p, ok, ctx) };
    case 'projects': return { kind, call: 'getProjects()', result: `${N} projects`, run: actProjects };
    case 'experience': { const ri = roleFor(q); return { kind, call: 'getExperience()', result: `${ROLES.length} roles`, run: (ok, ctx) => actWork(ri, ok, ctx), ri }; }
    case 'skills': return { kind, call: 'getSkills()', result: `${Object.keys(SKILLS).length} groups`, run: actSkills };
    case 'resume': return { kind, call: 'getResume()', result: 'web and PDF', run: actResume };
    case 'availability': return { kind, call: 'getAvailability()', result: 'open', run: actAvailability };
    case 'contact': return { kind, call: 'getContact()', result: 'email, LinkedIn, GitHub', run: actContact };
    case 'about': return { kind, call: 'getPresentation()', result: 'about me', run: actAbout };
  }
  return null;
}
function planForTool(name, input, q) {
  if (name === 'getProject') {
    const i = projectIndex(input && input.id);
    return i >= 0 ? planFor('project', q, i) : planFor('projects', q);
  }
  const kind = { getProjects: 'projects', getExperience: 'experience', getSkills: 'skills', getResume: 'resume', getAvailability: 'availability', getContact: 'contact', getPresentation: 'about' }[name];
  return kind ? planFor(kind, q) : null;
}
const firstSentence = t => (t.match(/^.*?[.!?](\s|$)/) || [t])[0].trim();
const PROJECT_SAY = {
  'patchwork': 'This is Patchwork. It turns a bug report into a regression-test pull request.',
  'rutgers-apps': 'These are the two web apps I run in production at Rutgers.',
  'auto-triage': 'This is the auto-triage system I built at Cohesity. It cut debugging turnaround by 37%.',
  'agentically': 'This is Agentically. Healthcare staff ask about accreditation in plain English and get cited answers.',
  'scail': 'This is Scail, the AI visibility audit engine I built at Peregrine.',
  'whyzr': 'This is Whyzr, a Socratic thinking companion for kids. It asks one guiding question at a time.',
  'llm-benchmarking': 'This is my LLM benchmarking platform. It compares four local models on the same tests.',
  'f1-race-rewind': 'This is F1 Race Rewind. Change a pit stop and replay the race lap by lap.'
};
function scriptedReply(plan, r, copied) {
  if (!plan) return 'I can show you my projects, experience, skills, resume, or how to reach me. Try one of these.';
  switch (plan.kind) {
    case 'project': { const P = PROJECTS[r.p]; return PROJECT_SAY[P.slug] || `This is ${P.name}. ${firstSentence(P.lede)}`; }
    case 'projects': return 'These are my projects. Ask me about any of them and I’ll open it.';
    case 'experience': return WORK_SAY[ROLES[plan.ri].org] || 'Here’s where I’ve worked.';
    case 'skills': return 'Mostly agentic AI and retrieval, on Python and TypeScript backends. Here’s the full list.';
    case 'resume': return 'Here’s my resume. The web version is easier to read on a phone.';
    case 'availability': return 'Yes. I’m open to internships now and full-time roles after I graduate in May 2027, in AI, ML and software engineering. F-1 OPT eligible.';
    case 'contact': return copied ? 'Copied my email for you. Say hi anytime.' : `My email is ${LINKS.email}. Say hi anytime.`;
    case 'about': return 'I’m an AI/ML engineer. I build agentic AI systems and RAG pipelines, work as a software developer at Rutgers SAS IT, and spent three years at Cohesity before that.';
  }
  return '';
}
function endRun(kind) {
  agBusy = false;
  if (kind === 'resume') linkChips([['View resume', LINKS.resume, true], ['Resume PDF', LINKS.pdf]]);
  else chips(FOLLOW[kind] || FOLLOW.text);
}

/* Runs */
let live = null, liveLen = 0;
function beginRun(q) {
  const id = ++agRun;
  agMet = true; agTouched = true; agBusy = true; agMode = 'still';
  agCard.classList.remove('compact');
  document.querySelectorAll('.ag-lit').forEach(n => n.classList.remove('ag-lit'));
  agChips.replaceChildren(); agSteps.replaceChildren();
  agQ.textContent = q; say('');
  setFace('listening'); want('listening'); setPose('listening');
  return id;
}
async function homeFirst(ok) {
  if (agAt !== onCard || agJ) await agJump(onCard, { h: 60 });
  return ok();
}
async function runScripted(q, id) {
  const ok = () => id === agRun;
  const r = route(q);
  const plan = r.kind === 'project' ? planFor('project', q, r.p) : planFor(r.kind, q);
  setFace('thinking'); want('thinking'); setPose('thinking');
  say(plan ? (plan.kind === 'project' ? 'Let me find it.' : 'Let me check.') : 'Hmm.');
  let done = null;
  if (plan) done = agStep(plan.call);
  await wait(900); if (!ok()) return;
  if (done) done(plan.result);
  if (plan) await plan.run(ok, { live: false });
  if (!ok()) return;
  const copied = plan && plan.kind === 'contact' && /copied/i.test($('copyMail').textContent);
  setFace(plan && plan.kind === 'contact' ? 'smile' : 'explaining');
  say(scriptedReply(plan, r, copied));
  setPose('explaining', 3000);
  endRun(plan ? plan.kind : 'fallback');
}
async function askScripted(q) {
  live = null;
  const id = beginRun(q);
  const ok = () => id === agRun;
  if (!(await homeFirst(ok))) return;
  await wait(380); if (!ok()) return;
  await runScripted(q, id);
}
function askLive(q) {
  if (!bridge || typeof bridge.ask !== 'function') { askScripted(q); return; }
  const id = beginRun(q);
  const ok = () => id === agRun;
  const L = live = { id, q, base: liveLen, text: '', steps: new Map(), done: new Set(), plan: null, actP: null, streamDone: false, failed: false, any: false };
  L.homeP = homeFirst(ok);
  setFace('thinking'); want('thinking'); setPose('thinking');
  agSay.replaceChildren(el('span'), el('span'), el('span')); agSay.classList.add('typing');
  try { bridge.ask(q); } catch (_) { liveFail(L); return; }
  L.timer = setTimeout(() => { if (live === L && !L.any) liveFail(L); }, 15000);
}
function liveFail(L) {
  if (L.failed || live !== L) return;
  L.failed = true;
  live = null;
  agSay.classList.remove('typing');
  agNote('Answering from my notes');
  runScripted(L.q, L.id);
}
const cleanText = t => t.replace(/\s*—\s*/g, ', ').replace(/\*\*?|__|`/g, '').replace(/^\s*[-•]\s+/gm, '').trim();
function callLabel(name, input) {
  const args = input && typeof input === 'object' ? Object.entries(input).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ') : '';
  return `${name}(${args ? `{ ${args} }` : ''})`;
}
function resultLabel(name, input, output) {
  if (name === 'getProject') { const i = projectIndex(input && input.id); return i >= 0 ? PROJECTS[i].name : 'project'; }
  if (name === 'getProjects') return `${N} projects`;
  if (name === 'getExperience') return `${ROLES.length} roles`;
  if (name === 'getSkills') return `${Object.keys(SKILLS).length} groups`;
  if (name === 'getContact') return 'email, LinkedIn, GitHub';
  if (name === 'getResume') return 'web and PDF';
  if (name === 'getAvailability') return 'open';
  if (name === 'getPresentation') return 'about me';
  return 'done';
}
/* Updates from the live chat (React's useChat), on every change of messages or status. */
api.live = ({ status, messages, error }) => {
  if (messages) liveLen = messages.length;
  const L = live;
  if (!L || L.id !== agRun || L.failed) return;
  const ok = () => L.id === agRun;
  if (error || status === 'error') { liveFail(L); return; }
  const msg = messages && messages.length >= L.base + 2 ? messages[messages.length - 1] : null;
  if (!msg || msg.role !== 'assistant') return;
  L.any = true;
  let text = '';
  for (const part of msg.parts || []) {
    if (part.type === 'text') { text += part.text || ''; continue; }
    if (typeof part.type !== 'string' || !part.type.startsWith('tool-')) continue;
    const name = part.type.slice(5), key = part.toolCallId || name;
    if (part.state === 'input-streaming') continue;
    if (!L.steps.has(key)) L.steps.set(key, agStep(callLabel(name, part.input)));
    if (part.state === 'output-available' && !L.done.has(key)) { L.done.add(key); L.steps.get(key)(resultLabel(name, part.input, part.output)); }
    if (!L.plan) {
      const plan = planForTool(name, part.input, L.q);
      if (plan) {
        L.plan = plan;
        L.actP = (async () => { await L.homeP; if (ok()) await plan.run(ok, { live: true }); })();
      }
    }
  }
  if (text && text !== L.text) {
    L.text = text;
    say(cleanText(text));
    setFace('explaining');
    if (!L.plan) want('explaining');
  }
  if (status === 'ready' && !L.streamDone) {
    L.streamDone = true;
    clearTimeout(L.timer);
    (async () => {
      if (L.actP) await L.actP;
      if (!ok()) return;
      if (!L.text) say(scriptedReply(L.plan, { p: L.plan && L.plan.kind === 'project' ? projectIndex(L.plan.call.match(/"([^"]+)"/)[1]) : -1 }, true));
      if (!L.plan || L.plan.kind !== 'contact') setFace('explaining');
      live = null;
      endRun(L.plan ? L.plan.kind : 'text');
    })();
  }
};

/* The Ask section sends its questions to the agent too. */
const askForm = $('askForm');
askForm.addEventListener('submit', e => {
  e.preventDefault();
  const q = askInput.value.trim();
  if (!q) { askInput.focus(); return; }
  askInput.value = '';
  askInput.blur();
  askLive(q);
});
$('chips').addEventListener('click', e => {
  const b = e.target.closest('.chip');
  if (b) askScripted(b.textContent);
});
askInput.addEventListener('focus', () => setPose('listening'));
askInput.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== askInput && poses.listening.classList.contains('on')) setPose('idle'); }, 50));

/* Room at the bottom of the page so nothing ends up hidden behind the card. */
const agPad = () => { document.body.style.paddingBottom = (small() ? 250 : 210) + 'px'; };
agPad();
addEventListener('resize', agPad);
requestAnimationFrame(agFrame);
setTimeout(() => {
  agCard.classList.add('in');
  agIdle(false);
  setTimeout(() => {
    const c = onCard(); ag.x = innerWidth + 40; ag.y = c.y - 150;
    agJump(onCard, { h: 40, crouch: 0 }).then(() => { if (!agBusy) { want('wave'); setTimeout(() => { if (!agBusy && agWant === 'wave') want('idle'); }, 1700); } });
  }, reduce ? 0 : 420);
}, reduce ? 0 : 1100);


  return {
    live: update => { if (!dead && api.live) api.live(update); },
    destroy() {
      dead = true;
      ac.abort();
      observers.forEach(o => o.disconnect());
      appended.forEach(n => n.remove());
      document.documentElement.classList.remove('locked');
      document.body.style.paddingBottom = '';
    }
  };
}
