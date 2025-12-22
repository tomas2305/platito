const THOUSANDS_SEPARATOR = ',';
const DECIMAL_SEPARATOR = '.';
const MAX_DECIMAL_DIGITS = 2;

const addThousandsSeparators = (value: string): string => {
  // Avoid ReDoS by processing the string in reverse without nested quantifiers
  if (value.length <= 3) return value;
  
  let result = '';
  let count = 0;
  
  for (let i = value.length - 1; i >= 0; i--) {
    if (count === 3) {
      result = THOUSANDS_SEPARATOR + result;
      count = 0;
    }
    result = value[i] + result;
    count++;
  }
  
  return result;
};

export const formatMonetaryValue = (value: string): string => {
  // Check if the value is negative
  const isNegative = value.startsWith('-');
  
  // Remove all non-digit and non-dot characters (including the minus sign)
  const sanitized = value.replaceAll(/[^\d.]/g, '');

  if (!sanitized) return '';

  // Only keep the first dot as decimal separator
  const firstDotIndex = sanitized.indexOf(DECIMAL_SEPARATOR);
  let integerPart = sanitized;
  let decimalPart = '';
  if (firstDotIndex >= 0) {
    integerPart = sanitized.slice(0, firstDotIndex);
    decimalPart = sanitized.slice(firstDotIndex + 1).replaceAll('.', ''); // remove any extra dots
  }

  // Remove leading zeros from integer part (but allow single zero)
  integerPart = integerPart.replace(/^0+(?!$)/, '');

  const formattedInteger = addThousandsSeparators(integerPart);

  let result = '';
  if (firstDotIndex >= 0) {
    const limitedDecimal = decimalPart.slice(0, MAX_DECIMAL_DIGITS);
    result = `${formattedInteger}${DECIMAL_SEPARATOR}${limitedDecimal}`;
  } else {
    result = formattedInteger;
  }

  // Add the minus sign back if the value was negative
  return isNegative ? `-${result}` : result;
};

export const parseMonetaryValue = (formattedValue: string): number => {
  if (!formattedValue?.trim()) {
    return 0;
  }

  const numericValue = formattedValue.replaceAll(THOUSANDS_SEPARATOR, '');
  const parsedValue = Number.parseFloat(numericValue);
  
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};
