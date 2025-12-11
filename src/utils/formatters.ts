const THOUSANDS_SEPARATOR = ',';
const DECIMAL_SEPARATOR = '.';
const MAX_DECIMAL_DIGITS = 2;

const addThousandsSeparators = (value: string): string => {
  return value.replaceAll(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
};

export const formatMonetaryValue = (value: string): string => {
  // Remove all non-digit and non-dot characters
  const sanitized = value.replaceAll(/[^\d.]/g, '');

  if (!sanitized) return '';

  // Only keep the first dot as decimal separator
  const firstDotIndex = sanitized.indexOf(DECIMAL_SEPARATOR);
  let integerPart = sanitized;
  let decimalPart = '';
  if (firstDotIndex !== -1) {
    integerPart = sanitized.slice(0, firstDotIndex);
    decimalPart = sanitized.slice(firstDotIndex + 1).replaceAll('.', ''); // remove any extra dots
  }

  // Remove leading zeros from integer part (but allow single zero)
  integerPart = integerPart.replace(/^0+(?!$)/, '');

  const formattedInteger = addThousandsSeparators(integerPart);

  if (firstDotIndex !== -1) {
    const limitedDecimal = decimalPart.slice(0, MAX_DECIMAL_DIGITS);
    return `${formattedInteger}${DECIMAL_SEPARATOR}${limitedDecimal}`;
  }

  return formattedInteger;
};

export const parseMonetaryValue = (formattedValue: string): number => {
  if (!formattedValue?.trim()) {
    return 0;
  }

  const numericValue = formattedValue.replaceAll(THOUSANDS_SEPARATOR, '');
  const parsedValue = Number.parseFloat(numericValue);
  
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};
