import React from 'react';
import { Transaction, Customer, CompanyInfo, Currency } from '../../types';
import { useTranslations } from '../../contexts/LanguageContext';

interface InvoiceDocumentProps {
    transaction: Transaction;
    customer: Customer | undefined;
    companyInfo: CompanyInfo;
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ transaction, customer, companyInfo }) => {
  const { t, lang, formatCurrency } = useTranslations();
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-GB');

  const totalSubtotal = transaction.items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
  const totalLegalCosts = transaction.items?.reduce((sum, item) => sum + item.legalCosts, 0) || 0;
  const totalVat = transaction.items?.reduce((sum, item) => sum + item.vatAmount, 0) || 0;
  const totalPaid = transaction.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const balanceDue = transaction.amount - totalPaid;


  return (
    <div className="bg-white p-8 md:p-12 font-sans text-slate-800">
        <div className="flex justify-between items-start mb-12">
            <div>
                {companyInfo.logoUrl && <img src={companyInfo.logoUrl} alt="Company Logo" className="h-12 mb-4" />}
                <h1 className="text-2xl font-bold text-slate-900">{companyInfo.name}</h1>
                <p className="text-sm text-slate-500">{companyInfo.address}</p>
                <p className="text-sm text-slate-500">{companyInfo.email} • {companyInfo.phone}</p>
                {companyInfo.taxId && <p className="text-sm text-slate-500 mt-1">{t('taxId')}: {companyInfo.taxId}</p>}
            </div>
            <div className="text-end">
                <h2 className="text-3xl font-bold text-slate-500 uppercase tracking-wider">{t('proformaInvoice')}</h2>
                <p className="text-sm text-slate-500 mt-2">{t('invoiceNumber', {id: transaction.id.slice(-6)})}</p>
                <p className="text-sm text-slate-500">{t('date')}: {formatDate(transaction.date)}</p>
            </div>
        </div>

        <div className="mb-12">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('billTo')}</h3>
            <p className="font-bold text-slate-700">{customer?.name || t('na')}</p>
            <p className="text-sm text-slate-500">{customer?.email || ''}</p>
            <p className="text-sm text-slate-500">{customer?.phone || ''}</p>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b-2 border-slate-200">
                    <tr>
                        <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-start">{t('description')}</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-end">{t('priceSubtotal')}</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-end">{t('officialCosts')}</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-end">{t('vatPercent')}</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-end">{t('total')}</th>
                    </tr>
                </thead>
                <tbody>
                    {transaction.items?.map(item => (
                       <tr key={item.id} className="border-b border-slate-100">
                            <td className="px-4 py-4 text-slate-700">{item.description}</td>
                            <td className="px-4 py-4 text-slate-700 text-end">{formatCurrency(item.subtotal, Currency.TRY)}</td>
                            <td className="px-4 py-4 text-slate-700 text-end">{formatCurrency(item.legalCosts, Currency.TRY)}</td>
                            <td className="px-4 py-4 text-slate-700 text-end">{formatCurrency(item.vatAmount, Currency.TRY)}</td>
                            <td className="px-4 py-4 text-slate-700 text-end">{formatCurrency(item.subtotal + item.legalCosts + item.vatAmount, Currency.TRY)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="flex justify-end mt-8">
            <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between">
                    <span className="text-slate-500">{t('subtotal')}</span>
                    <span className="font-medium text-slate-700">{formatCurrency(totalSubtotal, Currency.TRY)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-slate-500">{t('officialCosts')}</span>
                    <span className="font-medium text-slate-700">{formatCurrency(totalLegalCosts, Currency.TRY)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-slate-500">{t('totalVat')}</span>
                    <span className="font-medium text-slate-700">{formatCurrency(totalVat, Currency.TRY)}</span>
                </div>
                 <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-800 text-lg">{t('grandTotal')}</span>
                    <span className="font-bold text-slate-800 text-lg">{formatCurrency(transaction.amount, Currency.TRY)}</span>
                </div>
                 <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">{t('paymentsReceived')}</span>
                    <span className="font-medium text-green-600">{formatCurrency(totalPaid, Currency.TRY)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold text-slate-800">{t('balanceDue')}</span>
                    <span className="font-bold text-red-600">{formatCurrency(balanceDue, Currency.TRY)}</span>
                </div>
            </div>
        </div>

        <div className="mt-16 text-center text-xs text-slate-400">
            <p>{t('invoiceFooter1')}</p>
            <p>{t('invoiceFooter2')}</p>
        </div>
    </div>
  );
};

export default InvoiceDocument;
