import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export interface CategoryPieChartProps {
  data: Array<{ name: string; value: number; fill: string }>;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  if (data.length === 0) {
    return <p>No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
          {data.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};
