// Standardized color palette (10 colors max)
export const COLOR_PALETTE = [
  { name: 'red', hex: '#FF6B6B' },
  { name: 'orange', hex: '#FFA500' },
  { name: 'amber', hex: '#FFD93D' },
  { name: 'green', hex: '#1DD1A1' },
  { name: 'cyan', hex: '#4ECDC4' },
  { name: 'blue', hex: '#5567FF' },
  { name: 'purple', hex: '#A55EEA' },
  { name: 'pink', hex: '#FF6FAB' },
  { name: 'gray', hex: '#9E9E9E' },
  { name: 'teal', hex: '#10AC84' },
] as const;

export type ColorName = typeof COLOR_PALETTE[number]['name'];

export const COLOR_NAMES: readonly ColorName[] = COLOR_PALETTE.map(c => c.name) as readonly ColorName[];

export function getColorHex(colorName: string): string {
  const color = COLOR_PALETTE.find(c => c.name === colorName);
  return color?.hex ?? COLOR_PALETTE[0].hex;
}

export function getColorName(hex: string): ColorName {
  const color = COLOR_PALETTE.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return (color?.name as ColorName) ?? 'gray';
}
