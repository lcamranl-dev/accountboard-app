
import React, { useState, useMemo, FormEvent } from 'react';
import { Employee, BankAccount, AccountType, Currency, Transaction, Service, Language } from '../../types';
import { PlusIcon, PencilIcon, CurrencyDollarIcon, XMarkIcon, EyeIcon } from '../icons/Icons';
import EmployeeDetailModal from './EmployeeDetailModal';
import { useTranslations } from '../../contexts/LanguageContext';

const currencySymbols = {
  [Currency.TRY]: '₺',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
};

interface EmployeeModalProps {
    employee: Partial<Employee> | null;
    accounts: BankAccount[];
    onClose: () => void;
    onSave: (employee: Employee) => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ employee, accounts, onClose, onSave }) => {
    if (!employee) return null;
    const { t, formatCurrency } = useTranslations();

    const [formData, setFormData] = useState({ ...employee });

    const cashAccounts = useMemo(() => accounts.filter(acc => acc.type === AccountType.Cash), [accounts]);
    
    const selectedAccountBalance = useMemo(() => {
        const account = cashAccounts.find(acc => acc.id === formData.cashAccountId);
        return account ? formatCurrency(account.balance, account.currency) : t('na');
    }, [formData.cashAccountId, cashAccounts, formatCurrency, t]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name.includes('Rate') || name.includes('Salary') ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const employeeToSave = { ...formData };
        onSave(employeeToSave as Employee);
    };
    
    const isNew = !employee.id;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{isNew ? t('addEmployee') : `${t('edit')} ${employee.name}`}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                            <XMarkIcon className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">{t('fullName')}</label>
                            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="password">{t('password')} {!isNew && <span className="text-xs text-slate-400">({t('passwordPlaceholder')})</span>}</label>
                            <input type="password" name="password" id="password" onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required={isNew} placeholder={isNew ? t('required') : t('passwordPlaceholder')} />
                        </div>
                        <div>
                            <label htmlFor="avatarUrl" className="block text-sm font-medium text-slate-600 mb-1">{t('avatarUrl')}</label>
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                <img
                                    src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${formData.name || '?'}&background=random`}
                                    alt="Avatar Preview"
                                    className="w-16 h-16 rounded-full bg-slate-200 object-cover border"
                                />
                                <input
                                    type="text"
                                    id="avatarUrl"
                                    name="avatarUrl"
                                    value={formData.avatarUrl || ''}
                                    onChange={handleChange}
                                    placeholder="https://example.com/photo.jpg"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-slate-600 mb-1">{t('role')}</label>
                            <select id="role" name="role" value={formData.role || 'Employee'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="Employee">{t('employee')}</option>
                                <option value="Manager">{t('manager')}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="defaultLanguage" className="block text-sm font-medium text-slate-600 mb-1">{t('defaultLanguage')}</label>
                            <select id="defaultLanguage" name="defaultLanguage" value={formData.defaultLanguage || 'en'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="en">English</option>
                                <option value="tr">Türkçe</option>
                                <option value="fa">فارسی</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="cashAccountId" className="block text-sm font-medium text-slate-600 mb-1">{t('cashAccount')}</label>
                            <select id="cashAccountId" name="cashAccountId" value={formData.cashAccountId || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="" disabled>{t('selectAnAccount')}</option>
                                {cashAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                            {formData.cashAccountId && (
                                <p className="text-xs text-slate-500 mt-2">{t('selectedAccountBalance', { balance: selectedAccountBalance })}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="defaultCommissionRate" className="block text-sm font-medium text-slate-600 mb-1">{t('defaultCommissionRate')}</label>
                            <input type="number" step="0.1" id="defaultCommissionRate" name="defaultCommissionRate" value={formData.defaultCommissionRate || 0} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                         <div>
                            <label htmlFor="monthlySalary" className="block text-sm font-medium text-slate-600 mb-1">{t('monthlySalaryTRY')}</label>
                            <input type="number" step="0.01" id="monthlySalary" name="monthlySalary" value={formData.monthlySalary || 0} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="salaryDueDate" className="block text-sm font-medium text-slate-600 mb-1">{t('salaryDueDate')}</label>
                            <input type="text" id="salaryDueDate" name="salaryDueDate" value={formData.salaryDueDate || ''} onChange={handleChange} placeholder="e.g., 28th of each month" className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface PaymentModalProps {
    employee: Employee;
    accounts: BankAccount[];
    onClose: () => void;
    onSave: (payment: { employeeId: string; amount: number; sourceAccountId: string; description: string; category: string; }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ employee, accounts, onClose, onSave }) => {
    const { t, formatCurrency } = useTranslations();
    const [amount, setAmount] = useState(0);
    const [sourceAccountId, setSourceAccountId] = useState(accounts.find(a => a.type === AccountType.Bank)?.id || '');
    const [category, setCategory] = useState('Salary');
    const [description, setDescription] = useState(`${t('makePayment')} ${employee.name}`);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (amount > 0 && sourceAccountId) {
            onSave({ employeeId: employee.id, amount, sourceAccountId, description, category });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{t('makePayment')} {employee.name}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                            <XMarkIcon className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">{t('paymentAmountTRY')}</label>
                            <input type="number" step="0.01" id="amount" name="amount" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="sourceAccountId" className="block text-sm font-medium text-slate-600 mb-1">{t('sourceAccount')}</label>
                            <select id="sourceAccountId" name="sourceAccountId" value={sourceAccountId} onChange={e => setSourceAccountId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                                <option value="" disabled>{t('selectAnAccount')}</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance, acc.currency)})</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-600 mb-1">{t('category')}</label>
                            <select id="category" name="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="Salary">{t('salary')}</option>
                                <option value="Commission">{t('commission')}</option>
                                <option value="Advance">{t('advance')}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">{t('description')}</label>
                            <input type="text" id="description" name="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">{t('confirmPayment')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface EmployeesProps {
    employees: Employee[];
    accounts: BankAccount[];
    transactions: Transaction[];
    services: Service[];
    onSave: (employee: Employee) => void;
    onMakePayment: (payment: { employeeId: string; amount: number; sourceAccountId: string; description: string; category: string; }) => void;
}

const Employees: React.FC<EmployeesProps> = ({ employees, accounts, transactions, services, onSave, onMakePayment }) => {
    const { t, formatCurrency } = useTranslations();
    const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
    const [payingEmployee, setPayingEmployee] = useState<Employee | null>(null);
    const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

    const handleAddNew = () => {
        setEditingEmployee({ name: '', role: 'Employee', defaultCommissionRate: 0, monthlySalary: 0, salaryDueDate: '', outstandingBalance: 0, cashAccountId: '' });
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
    };
    
    const handlePay = (employee: Employee) => {
        setPayingEmployee(employee);
    };

    const handleView = (employee: Employee) => {
        setViewingEmployee(employee);
    };

    const handleCloseModal = () => {
        setEditingEmployee(null);
        setPayingEmployee(null);
        setViewingEmployee(null);
    };

    const handleSave = (employeeToSave: Employee) => {
        onSave(employeeToSave);
        handleCloseModal();
    };

    const handleSavePayment = (payment: { employeeId: string; amount: number; sourceAccountId: string; description: string; category: string; }) => {
        onMakePayment(payment);
        handleCloseModal();
    }

    return (
    <>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-slate-800">{t('employeeManagement')}</h2>
            <button
                onClick={handleAddNew}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
                <PlusIcon className="w-5 h-5" />
                <span>{t('addEmployee')}</span>
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {employees.map((employee) => (
                <div key={employee.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                                <img className="w-12 h-12 rounded-full" src={employee.avatarUrl} alt={`${employee.name} avatar`} />
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{employee.name}</h3>
                                    <p className="text-sm text-slate-500">{t(employee.role.toLowerCase())}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => handleView(employee)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors" aria-label={t('viewDetails')}>
                                    <EyeIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleEdit(employee)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors" aria-label={t('edit')}>
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                             <div className="flex justify-between items-baseline">
                                <span className="text-sm text-slate-500">{t('salary')}</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(employee.monthlySalary, Currency.TRY)} / month</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-slate-500">{t('dueDate')}</span>
                                <span className="font-semibold text-slate-700">{employee.salaryDueDate}</span>
                            </div>
                             <div className="mt-4 p-4 rounded-lg bg-slate-50">
                                <p className="text-sm text-slate-500 text-center">{t('outstandingBalance')}</p>
                                <p className={`text-center text-2xl font-bold ${employee.outstandingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(employee.outstandingBalance, Currency.TRY)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6">
                         <button 
                            onClick={() => handlePay(employee)} 
                            className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 font-semibold"
                        >
                            <CurrencyDollarIcon className="w-5 h-5" />
                            <span>{t('makePayment')}</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
        
        {editingEmployee && <EmployeeModal employee={editingEmployee} accounts={accounts} onClose={handleCloseModal} onSave={handleSave} />}
        {payingEmployee && <PaymentModal employee={payingEmployee} accounts={accounts} onClose={handleCloseModal} onSave={handleSavePayment} />}
        {viewingEmployee && (
            <EmployeeDetailModal 
                employee={viewingEmployee} 
                transactions={transactions} 
                services={services}
                onClose={handleCloseModal} 
            />
        )}
    </>
    );
};

export default Employees;
