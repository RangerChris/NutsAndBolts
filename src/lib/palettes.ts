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
    colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8C42', '#A56BFF', '#00C2A8', '#FF4DA6', '#C7F464', '#2F2FFF'],
  },
  {
    id: 1,
    name: 'Pastel',
    colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BFFCC6', '#B3D9FF', '#E2B8FF', '#FDE2FF', '#DFF8E1', '#FFF3B0', '#CDEFFF'],
  },
  {
    id: 2,
    name: 'Dark',
    colors: ['#D7263D', '#021827', '#0F4C5C', '#8EA7E9', '#6A1B4D', '#124E4A', '#3B2F2F', '#5C3E91', '#1F6F8B', '#7A4A2F'],
  },
  {
    id: 3,
    name: 'Colorblind',
    colors: ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#88CCEE', '#999999', '#4D4D4D'],
  },
];

export function getPalette(id: PaletteId) {
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}
