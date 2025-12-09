import type { ComponentType } from 'react';
import {
  IconBook,
  IconBriefcase,
  IconCar,
  IconChartPie,
  IconToolsKitchen2,
  IconGasStation,
  IconGift,
  IconHeart,
  IconHome,
  IconMovie,
  IconMusic,
  IconPaw,
  IconPlane,
  IconReceipt,
  IconScissors,
  IconShoppingCart,
  IconStar,
  IconTag,
  IconWifi,
} from '@tabler/icons-react';

const ICON_COMPONENTS: Record<string, ComponentType<{ size?: number; stroke?: number }>> = {
  'shopping-cart': IconShoppingCart,
  'fork-knife': IconToolsKitchen2,
  car: IconCar,
  'gas-station': IconGasStation,
  home: IconHome,
  wifi: IconWifi,
  heart: IconHeart,
  scissors: IconScissors,
  music: IconMusic,
  movie: IconMovie,
  gift: IconGift,
  book: IconBook,
  briefcase: IconBriefcase,
  paw: IconPaw,
  plane: IconPlane,
  'chart-pie': IconChartPie,
  receipt: IconReceipt,
  tag: IconTag,
  star: IconStar,
};

interface CategoryIconProps {
  readonly name: string;
  readonly size?: number;
  readonly stroke?: number;
}

export function CategoryIcon({ name, size = 20, stroke = 1.5 }: CategoryIconProps) {
  const IconComponent = ICON_COMPONENTS[name] ?? IconTag;
  return <IconComponent size={size} stroke={stroke} />;
}
