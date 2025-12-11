import React from 'react';
import { Title } from '@mantine/core';
import { TimeSeriesChart } from './TimeSeriesChart';
import { CategoryPieChart } from './CategoryPieChart';

interface DashboardChartsProps {
  timeWindow: string;
  timeSeriesData: Array<{ date: string; amount: number }>;
  pieChartData: Array<{ name: string; value: number; fill: string }>;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ timeWindow, timeSeriesData, pieChartData }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
    <div>
      <Title order={5} mb="md">Time Series ({timeWindow})</Title>
      <TimeSeriesChart data={timeSeriesData} />
    </div>
    <div>
      <Title order={5} mb="md">By Category</Title>
      <CategoryPieChart data={pieChartData} />
    </div>
  </div>
);
