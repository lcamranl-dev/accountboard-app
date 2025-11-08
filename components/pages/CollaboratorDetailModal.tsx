
import React, { useMemo } from 'react';
import { Collaborator, Transaction, Service, TransactionType, Currency } from '../../types';
import { XMarkIcon, CurrencyDollarIcon, BriefcaseIcon } from '../icons/Icons';
import { useTranslations } from '../../contexts/LanguageContext';

interface CollaboratorDetailModalProps {
    collaborator: Collaborator;
    transactions: Transaction[];
    services: Service[];
    onClose: () => void;
}

const DetailCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-100 p-4 rounded-lg flex items-center space-x-4 rtl:space-x-reverse">
        <div className="bg-white p-2 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const CollaboratorDetailModal: React.FC<CollaboratorDetailModalProps> = ({ collaborator, transactions, services, onClose }) => {
    const { t, lang, formatCurrency } = useTranslations();
    
    const { feeItems, payments, totalFees, totalPayments } = useMemo(() => {
        const feeItems = transactions
            .filter(t => t.type === TransactionType.Income && t.items?.some(i => i.collaboratorId === collaborator.id))
            .flatMap(t => t.items?.filter(i => i.collaboratorId === collaborator.id)
                .map(item => ({...item, transactionDate: t.date, transactionDescription: t.description})) || []);

        const payments = transactions
            .filter(t => t.type === TransactionType.Expense && t.collaboratorId === collaborator.id);

        const totalFees = feeItems.reduce((sum, item) => sum + (item.collaboratorFee || 0), 0);
        const totalPayments = payments.reduce((sum, t) => sum + t.amount, 0);

        return { feeItems, payments, totalFees, totalPayments };
    }, [collaborator, transactions]);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl m-4 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{t('employeeDetails', {name: collaborator.name})}</h3>
                        <p className="text-sm text-slate-500">{t(collaborator.type.toLowerCase())}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                        <XMarkIcon className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailCard 
                            title="Total Fees Earned"
                            value={formatCurrency(totalFees, Currency.TRY)}
                            icon={<CurrencyDollarIcon className="w-6 h-6 text-green-500" />}
                        />
                         <DetailCard 
                            title="Total Payments Received"
                            value={formatCurrency(totalPayments, Currency.TRY)}
                            icon={<BriefcaseIcon className="w-6 h-6 text-blue-500" />}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-lg font-semibold text-slate-700 mb-3">Fee History</h4>
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto max-h-[40vh]">
                                    <table className="w-full text-sm text-start text-slate-500">
                                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                                            <tr>
                                                <th scope="col" className="px-4 py-3">{t('date')}</th>
                                                <th scope="col" className="px-4 py-3">Transaction</th>
                                                <th scope="col" className="px-4 py-3 text-end">Fee</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {feeItems.length > 0 ? feeItems.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 whitespace-nowrap">{new Date(item.transactionDate).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-800">{item.transactionDescription}</td>
                                                    <td className="px-4 py-3 text-end font-medium text-green-600">{formatCurrency(item.collaboratorFee || 0, Currency.TRY)}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={3} className="text-center py-8 text-slate-500">No fee history.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                         <div>
                            <h4 className="text-lg font-semibold text-slate-700 mb-3">Payment History</h4>
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto max-h-[40vh]">
                                    <table className="w-full text-sm text-start text-slate-500">
                                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                                            <tr>
                                                <th scope="col" className="px-4 py-3">{t('date')}</th>
                                                <th scope="col" className="px-4 py-3">{t('description')}</th>
                                                <th scope="col" className="px-4 py-3 text-end">{t('amount')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {payments.length > 0 ? payments.map(t => (
                                                <tr key={t.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-800">{t.description}</td>
                                                    <td className="px-4 py-3 text-end font-medium text-red-600">-{formatCurrency(t.amount, Currency.TRY)}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={3} className="text-center py-8 text-slate-500">No payment history.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('close')}</button>
                </div>
            </div>
        </div>
    );
};

export default CollaboratorDetailModal;
