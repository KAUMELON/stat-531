// Deck engine for "R Programming for Agricultural Data Analysis" chapter slides.
// Each chapter file in this folder exports a spec; build.js renders it to ../<name>.pptx.
// Speaker notes on every slide are written as narration scripts for recorded videos.
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

const THEME = {
  name: "KAU R Textbook",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B2A41", lt1: "FFFFFF", dk2: "1F3A68", lt2: "EEF3FA",
    accent1: "1F4E8C", accent2: "C99A1E", accent3: "2E7D4F",
    accent4: "B5452E", accent5: "5B6B82", accent6: "F4EBCF",
    hlink: "1F4E8C", folHlink: "5B6B82",
  },
};
const H = THEME.colors;
const CODE = "Courier New";
const BOOK = "R Programming for Agricultural Data Analysis";

const iconCache = new Map();
async function icon(name, color = "FFFFFF") {
  const key = name + color;
  if (iconCache.has(key)) return iconCache.get(key);
  const Comp = fa[name];
  if (!Comp) throw new Error("Unknown icon " + name);
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const data = "image/png;base64," + buf.toString("base64");
  iconCache.set(key, data);
  return data;
}

async function buildDeck(spec, outFile) {
  const { applyTheme } = require("./theme");
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.title = spec.title;
  pres.author = "Dr. Pratheesh P. Gopinath";
  pres.subject = `${BOOK} · Chapter ${spec.number}`;
  const C = pres.SchemeColor;
  const colorOf = (k) => (k && C[k]) || k || C.accent1; // scheme name or hex
  const footer = `Chapter ${spec.number} · ${spec.title}  ·  ${BOOK}`;

  pres.defineSlideMaster({
    title: "TITLE_DARK", background: { color: C.text2 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.3, w: 10.2, h: 1.6, fontSize: 44, bold: true, color: C.background1, valign: "top", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.0, w: 10.2, h: 0.8, fontSize: 22, color: C.accent6, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "SECTION", background: { color: C.text2 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 2.6, y: 2.8, w: 9.6, h: 1.3, fontSize: 38, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 2.6, y: 4.15, w: 9.6, h: 0.7, fontSize: 18, color: C.accent6, valign: "top", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 12.4, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: C.accent6, align: "right" },
  });
  pres.defineSlideMaster({
    title: "CONTENT", background: { color: C.background1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontSize: 32, bold: true, color: C.text2, valign: "middle", margin: 0 }, text: "" } },
      { text: { text: footer, options: { x: 0.6, y: 6.95, w: 11, h: 0.3, fontSize: 10, color: C.accent5, margin: 0 } } },
    ],
    slideNumber: { x: 12.1, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: C.accent5, align: "right" },
  });

  // ---------- primitives ----------
  const shadow = () => ({ type: "outer", color: "8A97AB", blur: 6, offset: 2, angle: 90, opacity: 0.25 });
  const card = (s, x, y, w, h, fill = C.background2, name = "card") =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { type: "none" }, shadow: shadow(), objectName: name });
  const text = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, valign: "top", fontSize: 16, color: C.text1, fit: "none", ...o });
  const circleIcon = async (s, name, x, y, d, fill) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: "icon circle" });
    const pad = d * 0.25;
    s.addImage({ data: await icon(name), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, altText: name });
  };
  const numberBadge = (s, n, x, y, d, fill = C.text2) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
    text(s, String(n), { x, y, w: d, h: d, fontSize: Math.round(d * 28), bold: true, color: C.background1, align: "center", valign: "middle", fontFace: "Cambria" });
  };
  const codeBlock = (s, lines, x, y, w, h, fs = 15) => {
    const longest = Math.max(...lines.map((l) => l.length), 1);
    const fitW = Math.floor(((w - 0.6) * 72) / (0.6 * longest * 1.02));
    const fitH = Math.floor(((h - 0.44) * 72) / (lines.length * 1.22));
    fs = Math.max(10, Math.min(fs, fitW, fitH));
    if (fs < 13) console.warn(`  small code font ${fs}pt in chapter ${spec.number}: "${lines.find((l) => l.length === longest)}"`);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: C.text1 }, line: { type: "none" }, objectName: "code panel" });
    const runs = lines.map((ln, i) => {
      const t = ln.trim();
      const isComment = t.startsWith("#");
      return { text: ln.length ? ln : " ", options: { color: isComment ? C.accent2 : C.background1, breakLine: i < lines.length - 1 } };
    });
    s.addText(runs, { isTextBox: true, x: x + 0.3, y: y + 0.22, w: w - 0.6, h: h - 0.44, fontFace: CODE, fontSize: fs, valign: "top", margin: 0, paraSpaceAfter: 2, fit: "none" });
  };
  // Bullet items are written as one plain run each: pptxgenjs emits a stray <a:buNone/>
  // when a bulleted paragraph contains a second, differently styled run.
  const bullets = (items, o = {}) => items.map((t, i) => {
    const str = Array.isArray(t) ? t.map((r) => r.text).join("") : String(t);
    return { text: str.replace(/`/g, "").replace(/\*\*/g, ""), options: { bullet: { indent: 18 }, paraSpaceAfter: 8, breakLine: i < items.length - 1, ...o } };
  });
  // inline `code` markup → runs
  const rich = (str, base = {}) => {
    const parts = String(str).split(/(`[^`]+`|\*\*[^*]+\*\*)/).filter(Boolean);
    return parts.map((p) => p.startsWith("`") ? { text: p.slice(1, -1), options: { ...base, fontFace: CODE, color: base.color === C.accent6 || base.color === C.background1 ? C.accent2 : C.accent1 } }
      : p.startsWith("**") ? { text: p.slice(2, -2), options: { ...base, bold: true } } : { text: p, options: base });
  };
  const content = (sec, t) => { const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: sec }); s.addText(t, { placeholder: "title" }); return s; };
  const keyBox = (s, label, body, y = 5.95, h = 0.75, x = 0.6, w = 12.1) => {
    card(s, x, y, w, h, C.accent6, "key idea");
    text(s, [{ text: label + "  ", options: { bold: true, color: C.accent4 } }, ...rich(body)], { x: x + 0.3, y, w: w - 0.6, h, fontSize: 15, valign: "middle" });
  };

  // ---------- slide kinds ----------
  let section = "Introduction";
  const kinds = {
    async title(d) {
      pres.addSection({ title: "Introduction" });
      const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Introduction" });
      text(s, `${spec.module.toUpperCase()}  ·  CHAPTER ${spec.number}`, { x: 0.8, y: 1.6, w: 10, h: 0.4, fontSize: 16, bold: true, color: C.accent2, charSpacing: 3 });
      s.addText(spec.title, { placeholder: "title" });
      s.addText(BOOK, { placeholder: "body" });
      text(s, [{ text: "Dr. Pratheesh P. Gopinath", options: { bold: true, breakLine: true } },
        { text: "Department of Agricultural Statistics · College of Agriculture, Vellayani · Kerala Agricultural University" }],
        { x: 0.8, y: 5.4, w: 11.5, h: 0.8, fontSize: 15, color: C.background1 });
      s.addImage({ data: await icon(d.icon || "FaSeedling", H.accent2), x: 11.1, y: 1.3, w: 1.4, h: 1.4, altText: "chapter icon" });
      return s;
    },
    async section(d) {
      section = d.title;
      pres.addSection({ title: d.title });
      const s = pres.addSlide({ masterName: "SECTION", sectionTitle: section });
      s.addShape(pres.shapes.OVAL, { x: 0.8, y: 2.85, w: 1.3, h: 1.3, fill: { color: C.accent2 }, line: { type: "none" }, objectName: "section badge" });
      text(s, d.letter, { x: 0.8, y: 2.85, w: 1.3, h: 1.3, fontSize: 30, bold: true, color: C.text2, align: "center", valign: "middle", fontFace: "Cambria" });
      s.addText(d.title, { placeholder: "title" });
      s.addText(d.sub || "", { placeholder: "body" });
      s.addImage({ data: await icon(d.icon || "FaChartBar", "33507E"), x: 10.3, y: 4.6, w: 2.4, h: 2.4, altText: "decorative icon" });
      return s;
    },
    // 2x2 icon cards with an optional key idea
    async outcomes(d) {
      const s = content(section, d.title || "In this chapter you will");
      const n = d.items.length;
      const rows = Math.ceil(n / 2);
      const h = rows > 2 ? 1.15 : 1.5, gap = rows > 2 ? 0.25 : 0.3;
      for (let i = 0; i < n; i++) {
        const [ic, head, desc] = d.items[i];
        const x = 0.6 + (i % 2) * 6.15, y = 1.5 + Math.floor(i / 2) * (h + gap);
        card(s, x, y, 5.95, h);
        await circleIcon(s, ic, x + 0.3, y + (h - 0.8) / 2, 0.8, C.accent1);
        text(s, head, { x: x + 1.35, y: y + (rows > 2 ? 0.17 : 0.3), w: 4.4, h: 0.45, fontSize: 18, bold: true, color: C.text2 });
        text(s, rich(desc), { x: x + 1.35, y: y + (rows > 2 ? 0.6 : 0.78), w: 4.4, h: 0.55, fontSize: 14, color: C.accent5 });
      }
      if (d.key) keyBox(s, d.keyLabel || "Key idea", d.key, 1.5 + rows * (h + gap) + 0.05, 0.9);
      return s;
    },
    // row of cards (2–4 per row, one or more rows); text size and card height fit the content
    async cards(d) {
      const s = content(section, d.title);
      let top = 1.5;
      if (d.intro) {
        card(s, 0.6, top, 12.1, 1.05, C.background2);
        text(s, rich(d.intro), { x: 0.95, y: top, w: 11.4, h: 1.05, fontSize: 17, valign: "middle" });
        top += 1.35;
      }
      const cols = d.cols || Math.min(d.items.length, 4);
      const rows = Math.ceil(d.items.length / cols);
      const gap = 0.25;
      const w = (12.1 - gap * (cols - 1)) / cols;
      const bottom = d.key || d.footer ? 5.75 : 6.6;
      const hMax = (bottom - top - gap * (rows - 1)) / rows;
      const d0 = Math.min(0.8, hMax * 0.32);
      const maxHeadLines = Math.max(...d.items.map((it) => Math.ceil(it.head.length / Math.max(8, ((w - 0.5) * 72) / (17 * 0.45)))));
      const plain = (it) => (it.text || "") + (it.bullets ? it.bullets.join("  ") : "");
      const need = (it, size) => {
        const cpl = Math.max(8, ((w - 0.5) * 72) / (size * 0.48));
        const raw = plain(it).replace(/[`*]/g, "");
        const lines = (it.bullets ? it.bullets.reduce((a, b) => a + Math.ceil(b.length / cpl), 0) : Math.ceil(raw.length / cpl)) || 0;
        const headLines = d.stack ? maxHeadLines : 1;
        const head = d.stack ? 0.25 + d0 + 0.15 + headLines * 0.32 + 0.12 : 0.25 + d0 + 0.2;
        return head + (lines * size * 1.3) / 72 + (it.bullets ? it.bullets.length * 0.11 : 0) + 0.3;
      };
      let size = 14;
      for (const cand of [18, 17, 16, 15, 14]) {
        if (Math.max(...d.items.map((it) => need(it, it.size || cand))) <= hMax) { size = cand; break; }
      }
      const h = Math.min(hMax, Math.max(...d.items.map((it) => need(it, it.size || size))) + 0.1);
      const blockH = rows * h + (rows - 1) * gap + (d.key ? 1.05 : d.footer ? 0.9 : 0);
      const spare = 6.6 - top - blockH;
      if (spare > 0.8 && !d.intro) top += spare * 0.35;
      for (let i = 0; i < d.items.length; i++) {
        const it = d.items[i];
        const x = 0.6 + (i % cols) * (w + gap), y = top + Math.floor(i / cols) * (h + gap);
        card(s, x, y, w, h, it.fill ? colorOf(it.fill) : C.background2);
        const dark = it.fill === "text2";
        if (it.icon) await circleIcon(s, it.icon, x + 0.25, y + 0.25, d0, colorOf(it.color || (i % 2 ? "accent2" : "accent1")));
        else if (it.num !== undefined) numberBadge(s, it.num, x + 0.25, y + 0.25, d0, colorOf(it.color || "text2"));
        const headX = d.stack ? x + 0.25 : x + 0.25 + d0 + 0.2;
        const headY = d.stack ? y + 0.25 + d0 + 0.15 : y + 0.25;
        const headH = d.stack ? maxHeadLines * 0.32 : d0;
        text(s, it.head, { x: headX, y: headY, w: x + w - 0.25 - headX, h: headH, fontSize: it.headSize || 17, bold: true, color: dark ? C.background1 : C.text2, valign: d.stack ? "top" : "middle", fontFace: it.mono ? CODE : undefined });
        const bodyY = d.stack ? headY + headH + 0.12 : y + 0.25 + d0 + 0.2;
        const bs = it.size || size;
        if (it.text) text(s, rich(it.text, dark ? { color: C.accent6 } : {}), { x: x + 0.25, y: bodyY, w: w - 0.5, h: y + h - bodyY - 0.12, fontSize: bs, color: dark ? C.accent6 : C.accent5 });
        if (it.bullets) text(s, bullets(it.bullets.map((b) => rich(b))), { x: x + 0.25, y: bodyY, w: w - 0.5, h: y + h - bodyY - 0.12, fontSize: bs, color: dark ? C.background1 : C.text1 });
      }
      const after = top + rows * h + (rows - 1) * gap + 0.3;
      if (d.key) keyBox(s, d.keyLabel || "Key idea", d.key, Math.min(5.95, after), 0.75);
      else if (d.footer) text(s, rich(d.footer), { x: 0.6, y: Math.min(6.0, after), w: 12.1, h: 0.6, fontSize: 15, italic: true, color: C.accent5, valign: "middle" });
      return s;
    },
    // code on the left, explanation panels on the right
    async code(d) {
      const s = content(section, d.title);
      let top = 1.45;
      if (d.prompt) { text(s, rich(d.prompt), { x: 0.6, y: top, w: 12.1, h: 0.5, fontSize: 17, color: C.text2 }); top += 0.6; }
      const codeW = d.side ? (d.codeW || 7.4) : 12.1;
      const bottom = d.footer || d.key ? 5.8 : 6.6;
      codeBlock(s, d.code, 0.6, top, codeW, bottom - top, d.fs || 15);
      if (d.side) {
        const x = 0.6 + codeW + 0.25, w = 12.1 - codeW - 0.25;
        const gap = 0.25;
        const totalWeight = d.side.reduce((a, p) => a + (p.weight || 1), 0);
        const avail = bottom - top - gap * (d.side.length - 1);
        let y = top;
        for (const p of d.side) {
          const h = avail * (p.weight || 1) / totalWeight;
          const fill = p.kind === "stat" ? C.text2 : p.kind === "warn" ? C.accent6 : p.kind === "good" ? C.accent6 : C.background2;
          card(s, x, y, w, h, fill, p.kind || "note");
          if (p.kind === "stat") {
            text(s, p.big, { x, y: y + 0.1, w, h: h * 0.6, fontSize: p.bigSize || 54, bold: true, color: C.accent2, align: "center", valign: "middle", fontFace: "Cambria" });
            text(s, p.label, { x: x + 0.2, y: y + h * 0.62, w: w - 0.4, h: h * 0.33, fontSize: 15, color: C.background1, align: "center", valign: "top" });
          } else {
            let ty = y + 0.2;
            if (p.icon) { await circleIcon(s, p.icon, x + 0.25, y + 0.22, 0.6, colorOf(p.color || "accent1")); }
            const tx = p.icon ? x + 1.0 : x + 0.25;
            if (p.head) { text(s, p.head, { x: tx, y: ty, w: x + w - 0.2 - tx, h: 0.6, fontSize: 16, bold: true, color: p.kind === "warn" ? C.accent4 : p.kind === "good" ? C.accent3 : C.text2, valign: "middle" }); ty += 0.7; }
            const body = p.bullets ? bullets(p.bullets.map((b) => rich(b))) : rich(p.text || "");
            text(s, body, { x: x + 0.25, y: ty, w: w - 0.5, h: y + h - ty - 0.1, fontSize: p.size || 14, color: C.text1 });
          }
          y += h + gap;
        }
      }
      if (d.key) keyBox(s, d.keyLabel || "Key idea", d.key, 6.0, 0.7);
      else if (d.footer) text(s, rich(d.footer), { x: 0.6, y: 5.95, w: 12.1, h: 0.7, fontSize: 15, italic: true, color: C.accent5, valign: "middle" });
      return s;
    },
    async table(d) {
      const s = content(section, d.title);
      const head = d.header.map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: colorOf(d.headColor || "text2") }, fontSize: d.fs || 15 } }));
      const body = d.rows.map((r, i) => r.map((c, j) => ({ text: rich(c, {}).map(x => x.text).join(""), options: {
        bold: j === 0 && !d.monoFirst, fontFace: (j === 0 && d.monoFirst) || (d.monoCols || []).includes(j) ? CODE : undefined,
        color: j === 0 ? colorOf(d.firstColor || "text2") : C.text1, fill: { color: i % 2 ? C.background1 : C.background2 }, fontSize: d.fs || 14 } })));
      s.addTable([head, ...body], { x: 0.6, y: d.y || 1.5, w: 12.1, colW: d.colW, rowH: d.rowH || Math.min(0.9, (d.key || d.note ? 4.2 : 4.9) / (d.rows.length + 1)), border: { type: "solid", pt: 0.5, color: "D5DDEA" }, valign: "middle", margin: [0, 0.12, 0, 0.12] });
      if (d.key) keyBox(s, d.keyLabel || "Key idea", d.key, 6.0, 0.7);
      else if (d.note) text(s, rich(d.note), { x: 0.6, y: 6.15, w: 12.1, h: 0.5, fontSize: 13, italic: true, color: C.accent5 });
      return s;
    },
    async compare(d) {
      const s = content(section, d.title);
      const bottom = d.key ? 5.75 : 6.6;
      for (const [i, side] of [d.left, d.right].entries()) {
        const x = 0.6 + i * 6.15, dark = i === 1 && !d.flat;
        card(s, x, 1.5, 5.95, bottom - 1.5, dark ? C.text2 : C.background2);
        await circleIcon(s, side.icon, x + 0.35, 1.8, 0.8, dark ? C.accent2 : colorOf(side.color || "accent5"));
        text(s, side.head, { x: x + 1.35, y: 1.8, w: 4.4, h: 0.8, fontSize: 20, bold: true, color: dark ? C.background1 : C.text2, valign: "middle" });
        text(s, bullets(side.bullets.map((b) => rich(b))), { x: x + 0.35, y: 2.85, w: 5.3, h: bottom - 3.0, fontSize: 16, color: dark ? C.background1 : C.text1 });
      }
      if (d.key) keyBox(s, d.keyLabel || "Key idea", d.key, 5.95, 0.75);
      return s;
    },
    async steps(d) {
      const s = content(section, d.title);
      const n = d.items.length;
      const gap = 0.3, w = (12.1 - gap * (n - 1)) / n;
      const bottom = d.note ? 5.8 : 6.6;
      for (let i = 0; i < n; i++) {
        const it = d.items[i];
        const x = 0.6 + i * (w + gap);
        card(s, x, 1.5, w, bottom - 1.5);
        numberBadge(s, i + 1, x + 0.25, 1.75, 0.65);
        if (it.icon) await circleIcon(s, it.icon, x + w - 0.9, 1.75, 0.65, colorOf(it.color || "accent2"));
        text(s, it.head, { x: x + 0.25, y: 2.6, w: w - 0.5, h: 0.75, fontSize: 18, bold: true, color: C.text2 });
        if (it.sub) text(s, it.sub, { x: x + 0.25, y: 3.35, w: w - 0.5, h: 0.4, fontSize: 13, fontFace: CODE, color: C.accent1 });
        text(s, rich(it.text), { x: x + 0.25, y: it.sub ? 3.85 : 3.4, w: w - 0.5, h: bottom - (it.sub ? 3.95 : 3.5), fontSize: 14, color: C.accent5 });
        if (i < n - 1) s.addShape(pres.shapes.LINE, { x: x + w + 0.02, y: 2.07, w: gap - 0.04, h: 0, line: { color: C.accent2, width: 2, endArrowType: "triangle" } });
      }
      if (d.note) keyBox(s, d.noteLabel || "Note", d.note, 6.0, 0.65);
      return s;
    },
    async chart(d) {
      const s = content(section, d.title);
      const sideW = d.side ? 4.2 : 0;
      const cw = 12.1 - (sideW ? sideW + 0.3 : 0);
      const bottom = d.key ? 5.75 : 6.6;
      const type = d.type === "line" ? pres.charts.LINE : pres.charts.BAR;
      const palette = [H.accent1, H.accent2, H.accent3, H.accent4, H.accent5];
      s.addChart(type, d.series.map((ser) => ({ name: ser.name, labels: d.labels, values: ser.values })), {
        x: 0.6, y: 1.45, w: cw, h: bottom - 1.45, barDir: "col", chartColors: palette.slice(0, d.series.length),
        showValue: !!d.showValue, dataLabelPosition: "outEnd", dataLabelColor: H.dk1, dataLabelFontSize: 11, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: d.fmt || "0.0",
        showTitle: true, title: d.chartTitle, titleFontSize: 14, titleColor: H.dk2, titleFontFace: "+mn-lt",
        catAxisLabelColor: H.accent5, valAxisLabelColor: H.accent5, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 12, valAxisLabelFontSize: 11,
        showValAxisTitle: !!d.yTitle, valAxisTitle: d.yTitle || "", valAxisTitleFontSize: 12, valAxisTitleColor: H.accent5, valAxisTitleFontFace: "+mn-lt",
        showCatAxisTitle: !!d.xTitle, catAxisTitle: d.xTitle || "", catAxisTitleFontSize: 12, catAxisTitleColor: H.accent5, catAxisTitleFontFace: "+mn-lt",
        valAxisMinVal: d.min, valAxisMaxVal: d.max, valGridLine: { color: "E1E6EE", size: 0.5 }, catGridLine: { style: "none" },
        showLegend: d.series.length > 1, legendPos: "b", legendFontFace: "+mn-lt", legendFontSize: 12, legendColor: H.accent5,
        lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 9,
      });
      if (d.side) {
        const x = 0.6 + cw + 0.3; let y = 1.45;
        const gap = 0.25, hh = (bottom - 1.45 - gap * (d.side.length - 1)) / d.side.length;
        for (const p of d.side) {
          const dark = p.kind === "stat";
          card(s, x, y, sideW, hh, dark ? C.text2 : p.kind === "warn" ? C.accent6 : C.background2);
          if (dark) {
            text(s, p.big, { x, y: y + 0.05, w: sideW, h: hh * 0.6, fontSize: p.bigSize || 44, bold: true, color: C.accent2, align: "center", valign: "middle", fontFace: "Cambria" });
            text(s, p.label, { x: x + 0.2, y: y + hh * 0.6, w: sideW - 0.4, h: hh * 0.36, fontSize: 14, color: C.background1, align: "center" });
          } else {
            text(s, p.head || "", { x: x + 0.25, y: y + 0.15, w: sideW - 0.5, h: 0.45, fontSize: 16, bold: true, color: p.kind === "warn" ? C.accent4 : C.text2 });
            text(s, rich(p.text), { x: x + 0.25, y: y + 0.6, w: sideW - 0.5, h: hh - 0.7, fontSize: 14, color: C.text1 });
          }
          y += hh + gap;
        }
      }
      if (d.key) keyBox(s, d.keyLabel || "Key idea", d.key, 5.95, 0.75);
      return s;
    },
    async practical(d) {
      const s = content(section, d.title || `Practical ${spec.practical} and exercises`);
      const n = d.tasks.length;
      const gap = 0.15, h = Math.min(0.95, (5.1 - gap * (n - 1)) / n);
      d.tasks.forEach((t, i) => {
        const y = 1.5 + i * (h + gap);
        card(s, 0.6, y, 8.4, h);
        numberBadge(s, i + 1, 0.82, y + (h - 0.55) / 2, 0.55, C.accent1);
        text(s, rich(t), { x: 1.6, y: y + 0.05, w: 7.25, h: h - 0.1, fontSize: n > 5 ? 13 : 14, valign: "middle" });
      });
      card(s, 9.25, 1.5, 3.45, 5.1, C.text2, "submit");
      s.addImage({ data: await icon("FaClipboardCheck", H.accent2), x: 10.48, y: 1.85, w: 1.0, h: 1.0, altText: "clipboard icon" });
      text(s, "Submit", { x: 9.35, y: 3.0, w: 3.25, h: 0.45, fontSize: 20, bold: true, color: C.background1, align: "center" });
      text(s, d.submit || "your script and a short written interpretation. Code that runs is necessary; a defensible explanation is equally necessary.", { x: 9.5, y: 3.5, w: 2.95, h: 2.9, fontSize: 14, color: C.accent6, align: "center" });
      return s;
    },
    async lab(d) {
      const s = content(section, d.title || "Live R laboratory");
      const lines = d.code.split("\n");
      const ch = Math.min(3.75, Math.max(2.0, (lines.length * 17 * 1.25) / 72 + 0.6));
      codeBlock(s, lines, 0.6, 1.5, 12.1, ch, 17);
      const iy = 1.5 + ch + 0.35;
      card(s, 0.6, iy, 12.1, 1.5, C.accent6, "investigate");
      await circleIcon(s, "FaSearch", 0.9, iy + 0.32, 0.85, C.accent2);
      text(s, "Investigate", { x: 2.0, y: iy + 0.12, w: 10.4, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
      text(s, rich(d.investigate), { x: 2.0, y: iy + 0.52, w: 10.45, h: 0.9, fontSize: 15 });
      return s;
    },
    async review(d) {
      pres.addSection({ title: "Review" });
      const s = pres.addSlide({ masterName: "SECTION", sectionTitle: "Review" });
      text(s, "Chapter review", { x: 0.8, y: 0.7, w: 11.7, h: 0.9, fontSize: 40, bold: true, color: C.background1, fontFace: "Cambria" });
      for (let i = 0; i < d.items.length; i++) {
        const [ic, head, desc] = d.items[i];
        const x = 0.8 + (i % 2) * 6.0, y = 2.0 + Math.floor(i / 2) * 1.85;
        await circleIcon(s, ic, x, y, 1.0, C.accent2);
        text(s, head, { x: x + 1.3, y: y + 0.0, w: 4.45, h: 0.5, fontSize: 19, bold: true, color: C.background1 });
        text(s, rich(desc, { color: C.accent6 }), { x: x + 1.3, y: y + 0.52, w: 4.45, h: 0.95, fontSize: 14, color: C.accent6 });
      }
      if (d.next) text(s, d.next, { x: 0.8, y: 6.2, w: 11, h: 0.4, fontSize: 16, italic: true, color: C.accent2 });
      return s;
    },
  };

  for (const sl of spec.slides) {
    const fn = kinds[sl.kind];
    if (!fn) throw new Error("Unknown slide kind " + sl.kind);
    const s = await fn(sl);
    if (!sl.notes) throw new Error(`Missing narration notes on a ${sl.kind} slide in chapter ${spec.number}`);
    s.addNotes(sl.notes);
  }
  await pres.writeFile({ fileName: outFile });
  await applyTheme(outFile, THEME);
}

module.exports = { buildDeck };
