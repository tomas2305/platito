import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine } from 'recharts';
import type { SavingsMetrics } from '../types';
import { formatNumberToMonetary } from '../utils/formatters';

export interface SavingsTimelineChartProps {
  data: SavingsMetrics[];
  targetRate?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: SavingsMetrics }>;
}

interface SavingsDotProps {
  cx: number;
  cy: number;
  payload: SavingsMetrics & { monthLabel: string };
}

const SavingsDot = ({ cx, cy, payload }: SavingsDotProps) => {
  const color = payload.isTargetMet ? '#12b886' : '#fab005';
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={1} />;
};

const renderSavingsDot = (dotProps: unknown) => <SavingsDot {...(dotProps as SavingsDotProps)} />;

const CustomSavingsTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    const [year, month] = data.period.split('-');
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short' });
    const borderColor = data.isTargetMet ? '#12b886' : '#fab005';
    const rateColor = data.isTargetMet ? '#12b886' : '#fab005';
    
    return (
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        padding: '10px 12px', 
        border: `2px solid ${borderColor}`, 
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#000' }}>
          {monthName} {year}
        </p>
        <p style={{ margin: '6px 0 0 0', color: rateColor, fontSize: '14px', fontWeight: 600 }}>
          Savings Rate: {data.savingsRate.toFixed(1)}%
        </p>
        {data.targetSavingsRate !== undefined && (
          <p style={{ margin: '4px 0 0 0', color: '#868e96', fontSize: '12px' }}>
            Target: {data.targetSavingsRate}% {data.isTargetMet ? '✓' : '✗'}
          </p>
        )}
        <p style={{ margin: '4px 0 0 0', color: '#495057', fontSize: '12px' }}>
          Saved: {formatNumberToMonetary(data.totalSaved)}
        </p>
      </div>
    );
  }
  return null;
};

export const SavingsTimelineChart: React.FC<SavingsTimelineChartProps> = ({ data, targetRate }) => {
  if (data.length === 0) {
    return (
      <div style={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#868e96'
      }}>
        <p>No savings data available</p>
      </div>
    );
  }

  const chartData = data.map(m => ({
    ...m,
    monthLabel: new Date(m.period + '-01').toLocaleDateString('en-US', { month: 'short' })
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="monthLabel" />
        <YAxis 
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomSavingsTooltip />} />
        <Legend />
        {targetRate !== undefined && (
          <ReferenceLine 
            y={targetRate} 
            stroke="#fa5252" 
            strokeDasharray="5 5"
            label={{ value: `Target ${targetRate}%`, position: 'right', fill: '#fa5252', fontSize: 12 }}
          />
        )}
        <Line 
          type="monotone" 
          dataKey="savingsRate" 
          stroke="#12b886" 
          strokeWidth={2}
          name="Savings Rate (%)" 
          dot={renderSavingsDot}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
