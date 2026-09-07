/**
 * Draws the app icons from logo 2a (terracotta tile, cream n, sage stop).
 * The "n" is taken as an outline straight out of the display font, so the
 * icons need no font installed at render time and match the wordmark exactly.
 *
 *   node scripts/make-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const FONT = path.join(ROOT, 'assets/fonts/NoteyDisplay-Regular.ttf');
const ASSETS = path.join(ROOT, 'assets');

const TILE = '#c67139';
const LETTER = '#fffdf9';
const STOP = '#ccdbb2';

const font = opentype.parse(fs.readFileSync(FONT).buffer.slice(0));

/** The blob full stop, same squish as the one drawn in the app. */
const BLOB = 'M60 0C88 0 100 18 100 50C100 78 82 100 45 100C18 100 0 80 0 50C0 20 26 0 60 0Z';

const blob = (x, y, size, fill) =>
  `<g transform="translate(${x} ${y}) scale(${size / 100})"><path d="${BLOB}" fill="${fill}"/></g>`;

/** The letter as a path, sitting on the given baseline. */
function letter(fontSize, leftX, baselineY, fill) {
  const probe = font.getPath('n', 0, 0, fontSize);
  const b = probe.getBoundingBox();
  const p = font.getPath('n', leftX - b.x1, baselineY, fontSize);
  return `<path d="${p.toPathData(2)}" fill="${fill}"/>`;
}

/** Bounding box of the mark, so it can be centred inside a canvas. */
function markBox(size, { inset = 0.2, baseline = 0.78, letterRatio = 0.52 } = {}) {
  const fontSize = size * letterRatio;
  const gb = font.getPath('n', 0, 0, fontSize).getBoundingBox();
  const leftX = size * inset;
  const baselineY = size * baseline;
  const stopSize = size * 0.125;
  const stopX = leftX + (gb.x2 - gb.x1) + size * 0.05;
  const stopY = baselineY - stopSize - size * 0.03;
  return {
    x1: leftX,
    y1: Math.min(baselineY + gb.y1, stopY),
    x2: stopX + stopSize,
    y2: baselineY,
  };
}

/** The mark scaled to `target` of the canvas and centred in it. */
function centeredMark(size, letterFill, stopFill, target = 0.62) {
  const box = markBox(size);
  const w = box.x2 - box.x1;
  const h = box.y2 - box.y1;
  const scale = (size * target) / Math.max(w, h);
  const dx = (size - w * scale) / 2 - box.x1 * scale;
  const dy = (size - h * scale) / 2 - box.y1 * scale;
  return `<g transform="translate(${dx} ${dy}) scale(${scale})">${markContent(size, letterFill, stopFill)}</g>`;
}

/** n + blob stop, sitting on a common baseline. */
function markContent(size, letterFill, stopFill, { inset = 0.2, baseline = 0.78, letterRatio = 0.52 } = {}) {
  const fontSize = size * letterRatio;
  const glyph = font.getPath('n', 0, 0, fontSize);
  const gb = glyph.getBoundingBox();
  const leftX = size * inset;
  const baselineY = size * baseline;
  const stopSize = size * 0.125;
  const stopX = leftX + (gb.x2 - gb.x1) + size * 0.05;
  const stopY = baselineY - stopSize - size * 0.03;
  return (
    letter(fontSize, leftX, baselineY, letterFill) +
    blob(stopX, stopY, stopSize, stopFill)
  );
}

function svgSquare(size, { background, radius = 0, content }) {
  const bg = background
    ? `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${background}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}${content}</svg>`;
}

async function write(name, svg) {
  const out = path.join(ASSETS, name);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log('wrote', path.relative(ROOT, out));
}

const S = 1024;

// Store icon: full-bleed terracotta, the OS applies its own mask.
await write(
  'icon.png',
  svgSquare(S, { background: TILE, content: markContent(S, LETTER, STOP) }),
);

// Android adaptive layers. The mark is kept inside the 66% safe circle.
await write('android-icon-background.png', svgSquare(S, { background: TILE, content: '' }));
await write(
  'android-icon-foreground.png',
  svgSquare(S, { content: centeredMark(S, LETTER, STOP, 0.58) }),
);
await write(
  'android-icon-monochrome.png',
  svgSquare(S, { content: centeredMark(S, '#ffffff', '#ffffff', 0.58) }),
);

// Splash: the tile itself, on the sand ground from app.json.
await write(
  'splash-icon.png',
  svgSquare(512, {
    background: TILE,
    radius: 512 * 0.34,
    content: markContent(512, LETTER, STOP),
  }),
);

// Favicon: same tile, small.
await write(
  'favicon.png',
  svgSquare(256, {
    background: TILE,
    radius: 256 * 0.28,
    content: markContent(256, LETTER, STOP),
  }),
);
