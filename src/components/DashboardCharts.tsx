import React from 'react';
import { Title } from '@mantine/core';
import { TimeSeriesChart } from './TimeSeriesChart';
import { CategoryPieChart } from './CategoryPieChart';
import { TransactionTimelineChart } from './TransactionTimelineChart';

interface DashboardChartsProps {
  timeWindow: string;
  timeSeriesData: Array<{ date: string; amount: number }>;
  pieChartData: Array<{ name: string; value: number; fill: string }>;
  timelineData: Array<{ day: string; count: number }>;
  isBalanceHidden?: boolean;
  periodLabel?: string;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  timeWindow, 
  timeSeriesData, 
  pieChartData,
  timelineData,
  isBalanceHidden = false,
  periodLabel 
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div>
        <Title order={5} mb="md">Time Series ({timeWindow})</Title>
        {isBalanceHidden ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <Title order={3} c="dimmed">••••••</Title>
          </div>
        ) : (
          <TimeSeriesChart data={timeSeriesData} />
        )}
      </div>
      <div>
        <Title order={5} mb="md">By Category</Title>
        {isBalanceHidden ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <Title order={3} c="dimmed">••••••</Title>
          </div>
        ) : (
          <CategoryPieChart data={pieChartData} />
        )}
      </div>
    </div>
    <div>
      <Title order={5} mb="md">Transaction Timeline (Daily){periodLabel ? ` - ${periodLabel}` : ''}</Title>
      {isBalanceHidden ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <Title order={3} c="dimmed">••••••</Title>
        </div>
      ) : (
        <TransactionTimelineChart data={timelineData} />
      )}
    </div>
  </div>
);
