import type { PaletteId } from './types';

export type Palette = {
  id: PaletteId;
  name: string;
  colors: string[];
};

export const PALETTES: Palette[] = [
  {
    id: 0,
    name: 'Candy Glass',
    colors: ['#FF4E89', '#FF7A59', '#FFB347', '#7BE35A', '#2EDDBE', '#23B9FF', '#3674FF', '#8E6BFF', '#D65DFF', '#FF74C6'],
  },
  {
    id: 1,
    name: 'Hyper Neon',
    colors: ['#FF00C8', '#FF2E8D', '#FF5E00', '#FFE600', '#9DFF00', '#00FF6A', '#00FFE1', '#00B7FF', '#3B6DFF', '#9B3DFF'],
  },
  {
    id: 2,
    name: 'Juicy Pop',
    colors: ['#FF6A72', '#2FD7C0', '#FFA64A', '#52A2FF', '#95E33D', '#8C64FF', '#FF67B7', '#68EFD6', '#FFD85A', '#5A82FF'],
  },
  {
    id: 3,
    name: 'Arcade Spectrum',
    colors: ['#FF3A62', '#FF6E3A', '#FFB100', '#7BE000', '#00D98B', '#00C8D9', '#00A6FF', '#4D74FF', '#8B56FF', '#FF3DB1'],
  },
  {
    id: 4,
    name: 'Sorbet Flow',
    colors: ['#FF617E', '#32D4C4', '#FF9B52', '#5D9BFF', '#FFD45D', '#9E68FF', '#FF79AF', '#7EE7CB', '#FFB36A', '#5E78FF'],
  },
];

export function getPalette(id: PaletteId) {
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}
