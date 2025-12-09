import React from 'react';
import type { Category } from '../types';

interface CategoryListProps {
  data: Array<{ category: Category; amount: number }>;
  total: number;
}

export const CategoryBreakdown: React.FC<CategoryListProps> = ({ data, total }) => {
  if (data.length === 0) {
    return <p>No transactions</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((item) => {
        const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0.0';
        return (
          <li
            key={item.category.id}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong>{item.category.name}</strong>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {pct}%
              </div>
            </div>
          </li>
        );
      })}
      <li
        style={{
          padding: '8px',
          borderTop: '2px solid #000',
          marginTop: '8px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Total</span>
        <span>{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </li>
    </ul>
  );
};
