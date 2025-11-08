
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslations } from '../contexts/LanguageContext';
import { Currency } from '../types';

interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
}

interface RevenueChartProps {
  data: ChartData[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const { t, formatCurrency } = useTranslations();
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('revenueVsExpenses')}</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `₺${value/1000}k`} />
            <Tooltip
              cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number) => formatCurrency(value, Currency.TRY)}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
            <Bar dataKey="revenue" fill="#3b82f6" name={t('revenue')} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name={t('expense')} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
