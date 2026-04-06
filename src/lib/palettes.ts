import type { PaletteId } from './types';

export type Palette = {
  id: PaletteId;
  name: string;
  colors: string[];
};

export const PALETTES: Palette[] = [
  {
    id: 0,
    name: 'Vibrant',
    // high-contrast, highly separable hues (10 distinct identifiers)
    colors: ['#E41A1C', '#377EB8', '#4DAF4A', '#984EA3', '#FF7F00', '#A65628', '#F781BF', '#66C2A5', '#D9C100', '#2B3A67'],
  },
  {
    id: 1,
    name: 'Pastel',
    // softer, but still visually separated pastel tones
    colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BFFCC6', '#B3D9FF', '#E2B8FF', '#FDE2FF', '#DFF8E1', '#FFF3B0', '#CDEFFF'],
  },
  {
    id: 2,
    name: 'Jewel',
    // deep, jewel-like tones with good separation
    colors: ['#0B486B', '#1B9AAA', '#FFD166', '#EF476F', '#118AB2', '#2A6F97', '#9B2F7A', '#6A994E', '#4B2E83', '#00A6A6'],
  },
  {
    id: 3,
    name: 'Colorblind',
    // Okabe–Ito + extras for colorblind-safe separation
    colors: ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#88CCEE', '#999999', '#000000'],
  },
  {
    id: 4,
    name: 'Warm Sunset',
    colors: ['#FF6A88', '#FF8C66', '#FFB86B', '#FFD166', '#FFEDD5', '#E07A5F', '#F4A261', '#FFBC42', '#D65A31', '#FF9F1C'],
  },
  {
    id: 5,
    name: 'Ocean',
    colors: ['#012A4A', '#013A63', '#01497C', '#2A6F97', '#38A3A5', '#57CC99', '#7EE8B8', '#B3E5FC', '#D6F5FF', '#EAF6FF'],
  },
  {
    id: 6,
    name: 'Earth',
    colors: ['#4B2E2B', '#7C4A2A', '#B66E49', '#D99B6C', '#F0C987', '#C1D37F', '#7FB069', '#3B6E47', '#2E5143', '#162520'],
  },
  {
    id: 7,
    name: 'Retro',
    colors: ['#D7263D', '#F46036', '#2E294E', '#1B998B', '#E2C044', '#7FDD4C', '#F6A9A9', '#FBE7C6', '#2B2D42', '#8D99AE'],
  },
  {
    id: 8,
    name: 'Cyberpunk',
    colors: ['#00F5FF', '#FF00C8', '#7B2CFF', '#FF6B6B', '#00FFD5', '#FAFF00', '#01A3A4', '#FF4D4D', '#6A00FF', '#00B3FF'],
  },
  {
    id: 9,
    name: 'High Contrast',
    colors: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF', '#888888', '#444444'],
  },
];

export function getPalette(id: PaletteId) {
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}
