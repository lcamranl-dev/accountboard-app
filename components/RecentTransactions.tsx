import React from 'react';
import { Transaction, TransactionType, Currency } from '../types';
import { useTranslations } from '../contexts/LanguageContext';

const RecentTransactions: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const { t, formatCurrency } = useTranslations();

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case TransactionType.Income:
        return <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">{t('income')}</span>;
      case TransactionType.Expense:
        return <span className="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">{t('expense')}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('recentTransactions')}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-start text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              <th scope="col" className="px-4 sm:px-6 py-3">{t('description')}</th>
              <th scope="col" className="px-4 sm:px-6 py-3 hidden md:table-cell">{t('date')}</th>
              <th scope="col" className="px-4 sm:px-6 py-3">{t('type')}</th>
              <th scope="col" className="px-4 sm:px-6 py-3 hidden sm:table-cell">{t('category')}</th>
              <th scope="col" className="px-4 sm:px-6 py-3 text-end">{t('amountInTRY')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 6).map((transaction) => (
              <tr key={transaction.id} className="bg-white border-b hover:bg-slate-50">
                <th scope="row" className="px-4 sm:px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                  {transaction.description}
                </th>
                <td className="px-4 sm:px-6 py-4 hidden md:table-cell">{new Date(transaction.date).toLocaleDateString()}</td>
                <td className="px-4 sm:px-6 py-4">{getTypeBadge(transaction.type)}</td>
                <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">{transaction.category}</td>
                <td className={`px-4 sm:px-6 py-4 text-end font-medium ${transaction.type === TransactionType.Income ? 'text-green-600' : 'text-red-700'}`}>
                  {transaction.type === TransactionType.Expense && '-'}
                  {formatCurrency(transaction.amount, Currency.TRY)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTransactions;
