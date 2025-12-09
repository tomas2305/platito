import type { ComponentType } from 'react';
import {
  IconBuildingBank,
  IconCash,
  IconCoins,
  IconCreditCard,
  IconCurrencyDollar,
  IconCurrencyEuro,
  IconDeviceMobile,
  IconPig,
  IconTrendingUp,
  IconWallet,
} from '@tabler/icons-react';

const ACCOUNT_ICON_COMPONENTS: Record<string, ComponentType<{ size?: number; stroke?: number }>> = {
  IconCash,
  IconWallet,
  IconBuildingBank,
  IconDeviceMobile,
  IconCreditCard,
  IconPig,
  IconTrendingUp,
  IconCurrencyDollar,
  IconCurrencyEuro,
  IconCoins,
};

interface AccountIconProps {
  readonly name: string;
  readonly size?: number;
  readonly stroke?: number;
}

export function AccountIcon({ name, size = 24, stroke = 1.5 }: AccountIconProps) {
  const IconComponent = ACCOUNT_ICON_COMPONENTS[name] ?? IconCash;
  return <IconComponent size={size} stroke={stroke} />;
}
