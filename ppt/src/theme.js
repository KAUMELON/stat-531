// Writes the deck's colour scheme and fonts into the theme part(s) of a .pptx,
// so that scheme colours used on the slides resolve to the book's palette.
const fs = require("fs");
const JSZip = require("jszip");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function applyTheme(file, theme) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const names = Object.keys(zip.files).filter((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n));
  const c = theme.colors;
  const order = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  const scheme = `<a:clrScheme name="${esc(theme.name)}">` +
    order.map((k) => `<a:${k}><a:srgbClr val="${c[k]}"/></a:${k}>`).join("") + "</a:clrScheme>";
  for (const n of names) {
    let xml = await zip.file(n).async("string");
    xml = xml.replace(/<a:clrScheme[\s\S]*?<\/a:clrScheme>/, scheme);
    xml = xml.replace(/(<a:majorFont>\s*<a:latin typeface=")[^"]*(")/, `$1${esc(theme.headFontFace)}$2`);
    xml = xml.replace(/(<a:minorFont>\s*<a:latin typeface=")[^"]*(")/, `$1${esc(theme.bodyFontFace)}$2`);
    zip.file(n, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

module.exports = { applyTheme };
