
import React from 'react';
import { ArrowSmUpIcon, ArrowSmDownIcon } from './icons/Icons';
import { useTranslations } from '../contexts/LanguageContext';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon }) => {
  const { t } = useTranslations();
  const isIncrease = changeType === 'increase';
  const changeColor = isIncrease ? 'text-green-600' : 'text-red-600';
  const ChangeIcon = isIncrease ? ArrowSmUpIcon : ArrowSmDownIcon;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className="bg-slate-100 p-2 rounded-full">
          {icon}
        </div>
      </div>
      <div className={`flex items-center mt-4 text-sm ${changeColor}`}>
        <ChangeIcon className="w-5 h-5" />
        <span className="font-semibold ms-1">{change}</span>
        <span className="text-slate-500 ms-1">{t('vsLastMonth')}</span>
      </div>
    </div>
  );
};

export default MetricCard;
