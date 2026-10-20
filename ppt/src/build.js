// Build chapter decks:  node ppt/src/build.js            (all chapters)
//                        node ppt/src/build.js 13 14      (selected chapters)
// Requires pptxgenjs, react, react-dom, react-icons and sharp, plus the
// apply_theme.js helper (set PPTX_SKILL_DIR to the folder containing scripts/).
const path = require("path");
const fs = require("fs");
const { buildDeck } = require("./engine");

(async () => {
  const want = process.argv.slice(2).map(Number);
  const files = fs.readdirSync(__dirname).filter((f) => /^ch\d\d\.js$/.test(f)).sort();
  for (const f of files) {
    const spec = require(path.join(__dirname, f));
    if (want.length && !want.includes(spec.number)) continue;
    const out = path.join(__dirname, "..", spec.file + ".pptx");
    await buildDeck(spec, out);
    console.log(`Chapter ${spec.number}: ${spec.slides.length} slides -> ${path.basename(out)}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
