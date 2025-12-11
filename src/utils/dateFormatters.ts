export type TimeRange = 'day' | 'week' | 'month' | 'year';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatShortDate = (date: Date): string => {
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
};

const formatFullDate = (date: Date): string => {
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export const formatPeriodLabel = (range: TimeRange, start: Date, end: Date): string => {
  if (range === 'day') {
    return formatFullDate(start);
  }
  
  if (range === 'week') {
    const endAdjusted = new Date(end);
    endAdjusted.setDate(endAdjusted.getDate() - 1); // Adjust to last day of week
    
    // If same month and year
    if (start.getMonth() === endAdjusted.getMonth() && start.getFullYear() === endAdjusted.getFullYear()) {
      return `${monthNames[start.getMonth()]} ${start.getDate()}-${endAdjusted.getDate()}, ${start.getFullYear()}`;
    }
    // If same year
    if (start.getFullYear() === endAdjusted.getFullYear()) {
      return `${formatShortDate(start)} - ${formatShortDate(endAdjusted)}, ${start.getFullYear()}`;
    }
    // Different years
    return `${formatFullDate(start)} - ${formatFullDate(endAdjusted)}`;
  }
  
  if (range === 'month') {
    return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
  }
  
  return String(start.getFullYear());
};
