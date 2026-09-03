import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface RevenueExpenseChartProps {
  data: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export const RevenueExpenseChart: React.FC<RevenueExpenseChartProps> = ({ data }) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
          <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            tickFormatter={val => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '0.5rem',
              color: '#0F172A',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
            }}
            formatter={(value: any, name: any) => [
              formatCurrency(Number(value)),
              name === 'revenue' ? 'Revenue' : name === 'expenses' ? 'Expenses' : 'Net Profit'
            ]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingBottom: '12px', color: '#475569' }}
          />
          <Bar dataKey="revenue" fill="#2563EB" name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" fill="#E11D48" name="Expenses" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#059669"
            name="Net Profit"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#059669' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

