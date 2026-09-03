import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PackagePieChartProps {
  data: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

const COLORS = ['#1E3A8A', '#2563EB', '#3B82F6', '#D97706', '#0D9488', '#64748B'];

export const PackagePieChart: React.FC<PackagePieChartProps> = ({ data }) => {
  const filteredData = data.filter(d => d.count > 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={75}
            paddingAngle={3}
            dataKey="count"
            nameKey="name"
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '0.5rem',
              color: '#0F172A',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
            }}
            formatter={(value: any, name: any, item: any) => [
              `${value} Subscribers (Rs. ${item.payload.revenue.toLocaleString()})`,
              name
            ]}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#475569' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

