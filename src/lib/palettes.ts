import type { PaletteId } from './types';

export type Palette = {
  id: PaletteId;
  name: string;
  colors: string[];
};

export const PALETTES: Palette[] = [
  {
    id: 0,
    name: 'Clarity Bright',
    colors: ['#FF4D6D', '#FF9F1C', '#FFD60A', '#8AC926', '#2EC4B6', '#00BBF9', '#4D96FF', '#9B5DE5', '#F15BB5', '#F9844A'],
  },
  {
    id: 1,
    name: 'Neon',
    // Neon palette: high-saturation, easily distinguishable bright hues
    colors: ['#FF00FF', '#FF007F', '#FF4D00', '#FFDD00', '#7CFF00', '#00FF00', '#00FF9F', '#00FFFF', '#007BFF', '#8A00FF'],
  },
  {
    id: 2,
    name: 'Tropical Mix',
    // Designed as 5 complementary pairs for clear separation:
    // (Coral, Teal), (Orange, Blue), (Lime, Purple), (Pink, Mint), (Yellow, Indigo)
    colors: ['#FF6B6B', '#2EC4B6', '#FF9F43', '#4D96FF', '#8AC926', '#9B5DE5', '#F15BB5', '#7AE7C7', '#FFD60A', '#6C63FF'],
  },
  {
    id: 3,
    name: 'Bold Spectrum',
    colors: ['#FF3B30', '#FF6D00', '#FFB703', '#70E000', '#00C853', '#00B8D4', '#00A6FB', '#4361EE', '#8338EC', '#FF2D92'],
  },
  {
    id: 4,
    name: 'Sunrise Energy',
    // Complementary warm/cool pairs for distinctness
    colors: ['#FF5A5F', '#2EC4B6', '#FF9F3D', '#4D96FF', '#FFD60A', '#9B5DE5', '#FF70A6', '#7AE7C7', '#FF8C42', '#4361EE'],
  },
];

export function getPalette(id: PaletteId) {
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}
