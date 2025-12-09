import React from 'react';
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
      <h3>Time Series ({timeWindow})</h3>
      <TimeSeriesChart data={timeSeriesData} />
    </div>
    <div>
      <h3>By Category</h3>
      <CategoryPieChart data={pieChartData} />
    </div>
  </div>
);
