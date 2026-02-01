import type { TimeWindow } from '../types';

export const getStartOfPeriod = (timeWindow: TimeWindow, rangeOffset: number): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (timeWindow === 'day') {
    const start = new Date(now);
    start.setDate(now.getDate() - rangeOffset);
    return start;
  }

  if (timeWindow === 'week') {
    const start = new Date(now);
    const day = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - day - rangeOffset * 7);
    return start;
  }

  if (timeWindow === 'month') {
    return new Date(now.getFullYear(), now.getMonth() - rangeOffset, 1);
  }

  return new Date(now.getFullYear() - rangeOffset, 0, 1);
};

export const getEndOfPeriod = (timeWindow: TimeWindow, rangeOffset: number): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (timeWindow === 'day') {
    const end = new Date(now);
    end.setDate(now.getDate() - rangeOffset + 1);
    return end;
  }

  if (timeWindow === 'week') {
    const start = new Date(now);
    const day = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - day - rangeOffset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return end;
  }

  if (timeWindow === 'month') {
    return new Date(now.getFullYear(), now.getMonth() - rangeOffset + 1, 1);
  }

  return new Date(now.getFullYear() - rangeOffset + 1, 0, 1);
};
