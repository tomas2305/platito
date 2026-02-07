import React from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

export interface TransactionTimelineChartProps {
  data: Array<{ day: string; count: number }>;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { day: string; count: number } }>;
}

const CustomTimelineTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        padding: '10px 12px', 
        border: '1px solid #999', 
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#000' }}>Day {data.day}</p>
        <p style={{ margin: '6px 0 0 0', color: '#82ca9d', fontSize: '14px' }}>
          Transactions: {data.count}
        </p>
      </div>
    );
  }
  return null;
};

export const TransactionTimelineChart: React.FC<TransactionTimelineChartProps> = ({ data }) => {
  if (data.length === 0) {
    return <p>No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis allowDecimals={false} />
        <Tooltip content={<CustomTimelineTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="count" stroke="#82ca9d" name="Transactions" />
      </LineChart>
    </ResponsiveContainer>
  );
};
