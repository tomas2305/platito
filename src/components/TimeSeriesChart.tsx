import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

export interface TimeSeriesChartProps {
  data: Array<{ date: string; amount: number }>;
}

const CustomTimeSeriesTooltip = ({ active, payload }: any) => {
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
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#000' }}>{data.date}</p>
        <p style={{ margin: '6px 0 0 0', color: '#8884d8', fontSize: '14px' }}>
          amount: {data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => {
  if (data.length === 0) {
    return <p>No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip content={<CustomTimeSeriesTooltip />} />
        <Legend />
        <Bar dataKey="amount" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};
