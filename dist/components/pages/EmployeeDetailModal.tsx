import React from 'react';
import { Employee, Transaction, Service, TransactionType, Currency } from '../../types';
import { XMarkIcon, CurrencyDollarIcon, BriefcaseIcon } from '../icons/Icons';
import { useTranslations } from '../../contexts/LanguageContext';

interface EmployeeDetailModalProps {
    employee: Employee;
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

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employee, transactions, services, onClose }) => {
    const { t, lang, formatCurrency } = useTranslations();
    
    const employeeIncomeItems = transactions
        .filter(t => t.type === TransactionType.Income)
        .flatMap(t => t.items || [])
        .filter(item => item.employeeId === employee.id);

    const totalCommissionEarned = employeeIncomeItems.reduce((sum, item) => sum + item.commissionAmount, 0);
    const totalServicesRendered = employeeIncomeItems.length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl m-4 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{t('employeeDetails', {name: employee.name})}</h3>
                        <p className="text-sm text-slate-500">{t(employee.role.toLowerCase())}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                        <XMarkIcon className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailCard 
                            title={t('totalCommissionEarned')}
                            value={formatCurrency(totalCommissionEarned, Currency.TRY)}
                            icon={<CurrencyDollarIcon className="w-6 h-6 text-green-500" />}
                        />
                        <DetailCard 
                            title={t('totalServicesRendered')}
                            value={totalServicesRendered.toString()}
                            icon={<BriefcaseIcon className="w-6 h-6 text-blue-500" />}
                        />
                    </div>
                    
                    {/* Commission History */}
                    <div>
                        <h4 className="text-lg font-semibold text-slate-700 mb-3">{t('commissionHistory')}</h4>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto max-h-[40vh]">
                                <table className="w-full text-sm text-start text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">{t('date')}</th>
                                            <th scope="col" className="px-6 py-3">{t('serviceProvided')}</th>
                                            <th scope="col" className="px-6 py-3 text-end">{t('commissionEarned')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {employeeIncomeItems.length > 0 ? (
                                            transactions.filter(t => t.items?.some(i => i.employeeId === employee.id)).map(t => 
                                                t.items?.filter(i => i.employeeId === employee.id).map(item => {
                                                    const service = services.find(s => s.id === item.serviceId);
                                                    return (
                                                        <tr key={item.id} className="hover:bg-slate-50">
                                                            <td className="px-6 py-4">{new Date(t.date).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 font-medium text-slate-800">{service?.name[lang] || item.description}</td>
                                                            <td className="px-6 py-4 text-end font-medium text-green-600">{formatCurrency(item.commissionAmount || 0, Currency.TRY)}</td>
                                                        </tr>
                                                    );
                                                })
                                            )
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center py-8 text-slate-500">{t('noCommissionHistory')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400">{t('close')}</button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailModal;
