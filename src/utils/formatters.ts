const THOUSANDS_SEPARATOR = '.';
const DECIMAL_SEPARATOR = ',';
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
  
  // Remove all non-digit and non-comma characters (including minus sign and dots)
  // Only accept comma as decimal separator for user input
  const sanitized = value.replaceAll(/[^\d,]/g, '');

  if (!sanitized) return '';

  // Only keep the first comma as decimal separator
  const firstCommaIndex = sanitized.indexOf(',');
  let integerPart = sanitized;
  let decimalPart = '';
  
  if (firstCommaIndex >= 0) {
    integerPart = sanitized.slice(0, firstCommaIndex);
    decimalPart = sanitized.slice(firstCommaIndex + 1).replaceAll(',', ''); // remove any extra commas
  }

  // Remove leading zeros from integer part (but allow single zero)
  integerPart = integerPart.replace(/^0+(?!$)/, '');

  const formattedInteger = addThousandsSeparators(integerPart);

  let result = '';
  if (firstCommaIndex >= 0) {
    const limitedDecimal = decimalPart.slice(0, MAX_DECIMAL_DIGITS);
    result = `${formattedInteger}${DECIMAL_SEPARATOR}${limitedDecimal}`;
  } else {
    result = formattedInteger;
  }

  // Add the minus sign back if the value was negative
  return isNegative ? `-${result}` : result;
};

// Helper function to format numbers from database (converts JS number format to European format)
export const formatNumberToMonetary = (value: number): string => {
  // Round to 2 decimal places to avoid floating point issues
  const rounded = Math.round(value * 100) / 100;
  
  // Convert to string with 2 decimal places
  const fixed = rounded.toFixed(2);
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = fixed.split('.');
  
  // Add thousands separators to integer part
  const formattedInteger = addThousandsSeparators(integerPart);
  
  // Combine with comma as decimal separator
  return `${formattedInteger}${DECIMAL_SEPARATOR}${decimalPart}`;
};

export const parseMonetaryValue = (formattedValue: string): number => {
  if (!formattedValue?.trim()) {
    return 0;
  }

  // Remove thousands separator and replace decimal separator with dot for parsing
  const numericValue = formattedValue
    .replaceAll(THOUSANDS_SEPARATOR, '')
    .replaceAll(DECIMAL_SEPARATOR, '.');
  const parsedValue = Number.parseFloat(numericValue);
  
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};
