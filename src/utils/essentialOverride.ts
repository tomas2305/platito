export type EssentialOverrideOption = 'default' | 'essential' | 'discretionary';

export const essentialOverrideToOption = (value?: boolean): EssentialOverrideOption =>
  value === undefined ? 'default' : value ? 'essential' : 'discretionary';

export const optionToEssentialOverride = (option: EssentialOverrideOption): boolean | undefined =>
  option === 'default' ? undefined : option === 'essential';
