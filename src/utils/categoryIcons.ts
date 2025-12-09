import type { ComponentType } from 'react';
import * as TablerIcons from '@tabler/icons-react';

export const CATEGORY_ICON_OPTIONS = [
  'shopping-cart',
  'fork-knife',
  'car',
  'gas-station',
  'home',
  'wifi',
  'heart',
  'scissors',
  'music',
  'movie',
  'gift',
  'book',
  'briefcase',
  'paw',
  'plane',
  'chart-pie',
  'receipt',
  'tag',
  'star',
] as const;

export type CategoryIconName = typeof CATEGORY_ICON_OPTIONS[number];

export const CATEGORY_ICON_MAP: Record<string, string> = {
  'shopping-cart': 'IconShoppingCart',
  'fork-knife': 'IconForkKnife',
  car: 'IconCar',
  'gas-station': 'IconGasStation',
  home: 'IconHome',
  wifi: 'IconWifi',
  heart: 'IconHeart',
  scissors: 'IconScissors',
  music: 'IconMusic',
  movie: 'IconMovie',
  gift: 'IconGift',
  book: 'IconBook',
  briefcase: 'IconBriefcase',
  paw: 'IconPaw',
  plane: 'IconPlane',
  'chart-pie': 'IconChartPie',
  receipt: 'IconReceipt',
  tag: 'IconTag',
  star: 'IconStar',
};

export const resolveCategoryIcon = (name: string) => {
  const iconKey = CATEGORY_ICON_MAP[name] ?? 'IconTag';
  const icons = TablerIcons as unknown as Record<string, ComponentType<{ size?: number; stroke?: number }>>;
  return icons[iconKey] ?? TablerIcons.IconTag;
};
