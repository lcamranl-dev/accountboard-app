
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslations } from '../contexts/LanguageContext';
import { Currency } from '../types';

interface ChartData {
  name: string;
  cashflow: number;
}

interface CashFlowChartProps {
  data: ChartData[];
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  const { t, formatCurrency } = useTranslations();
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('cashFlow')}</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `₺${value/1000}k`} />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number) => formatCurrency(value, Currency.TRY)}
            />
            <Area type="monotone" dataKey="cashflow" stroke="#22c55e" fillOpacity={1} fill="url(#colorCashflow)" strokeWidth={2} name={t('cashFlow')}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlowChart;
