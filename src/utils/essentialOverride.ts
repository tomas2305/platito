export type EssentialOverrideOption = 'default' | 'essential' | 'discretionary';

export const essentialOverrideToOption = (value?: boolean): EssentialOverrideOption => {
  if (value === undefined) return 'default';
  return value ? 'essential' : 'discretionary';
};

export const optionToEssentialOverride = (option: EssentialOverrideOption): boolean | undefined =>
  option === 'default' ? undefined : option === 'essential';
