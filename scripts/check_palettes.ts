import { PALETTES } from '../src/lib/palettes';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function srgbChannelToLinear(c: number) {
  const cs = c / 255;
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const R = srgbChannelToLinear(r);
  const G = srgbChannelToLinear(g);
  const B = srgbChannelToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hexA: string, hexB: string) {
  const L1 = luminance(hexA);
  const L2 = luminance(hexB);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

function compositeOver(baseHex: string, overlayHex: string, alpha: number) {
  const base = hexToRgb(baseHex);
  const overlay = hexToRgb(overlayHex);
  const comp = base.map((c, i) => Math.round((1 - alpha) * c + alpha * overlay[i]));
  return `#${comp.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function analyze() {
  console.log('Palette accessibility report (contrast ratios and overlay visibility)');
  console.log('Thresholds: contrast >= 3.0 recommended for text; overlay delta >= 1.05 indicates visible pattern');
  for (const p of PALETTES) {
    console.log(`\nPalette ${p.id} — ${p.name}`);
    p.colors.forEach((c, i) => {
      const contrastWithWhite = contrastRatio(c, '#ffffff').toFixed(2);
      const contrastWithBlack = contrastRatio(c, '#000000').toFixed(2);
      // overlay composites used in BoltView: dots alpha 0.3, stripes alpha 0.18, grid stroke ~0.18
      const compDots = compositeOver(c, '#ffffff', 0.3);
      const compStripes = compositeOver(c, '#ffffff', 0.18);
      const deltaDots = (contrastRatio(c, compDots)).toFixed(3);
      const deltaStripes = (contrastRatio(c, compStripes)).toFixed(3);
      console.log(`  color[${i}] ${c} — white:${contrastWithWhite} black:${contrastWithBlack} overlayDelta(dots:${deltaDots} stripes:${deltaStripes})`);
    });
  }
}

analyze();
