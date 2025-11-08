import React, { useState, useEffect, FormEvent } from 'react';
import { Transaction, TransactionType, Service, Employee, BankAccount, Customer, ExpenseCategory, LineItem, Payment, PaymentStatus, Currency, Collaborator } from '../../types';
import { XMarkIcon, PlusIcon, TrashIcon } from '../icons/Icons';
import { useTranslations } from '../../contexts/LanguageContext';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Transaction) => void;
    transactionToEdit: Partial<Transaction> | null;
    services: Service[];
    employees: Employee[];
    collaborators: Collaborator[];
    accounts: BankAccount[];
    customers: Customer[];
    expenseCategories: ExpenseCategory[];
    currentUser: Employee;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, transactionToEdit, services, employees, collaborators, accounts, customers, expenseCategories, currentUser }) => {
    const { t, lang, formatCurrency } = useTranslations();
    const [transaction, setTransaction] = useState<Partial<Transaction>>({});
    const [type, setType] = useState<TransactionType>(TransactionType.Income);
    const [items, setItems] = useState<LineItem[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);

    const isNew = !transactionToEdit?.id;
    const isManager = currentUser.role === 'Manager';

    const getInitialLineItem = (): LineItem => ({
        id: `item-${Date.now()}`, serviceId: '', description: '', subtotal: 0, legalCosts: 0, vatRate: 0, vatAmount: 0,
        employeeId: currentUser.id, commissionRate: currentUser.defaultCommissionRate, commissionAmount: 0,
        collaboratorId: undefined, collaboratorFee: 0,
    });

    const getInitialPayment = (): Payment => ({
        id: `pay-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: 0, accountId: ''
    });

    useEffect(() => {
        const initialType = transactionToEdit?.type || TransactionType.Income;
        setType(initialType);

        if (isNew) {
            setTransaction({
                type: initialType,
                date: new Date().toISOString().split('T')[0],
                customerId: '',
            });
            setItems([getInitialLineItem()]);
            setPayments([getInitialPayment()]);
        } else {
            setTransaction(transactionToEdit || {});
            setItems(transactionToEdit?.items || []);
            setPayments(transactionToEdit?.payments || []);
        }
    }, [transactionToEdit, currentUser]);

    // Recalculate totals whenever items or payments change
    useEffect(() => {
        if (type === TransactionType.Income) {
            const newItems = items.map(item => {
                const subtotal = item.subtotal || 0;
                const legalCosts = item.legalCosts || 0;
                const vatRate = item.vatRate || 0;
                const commissionRate = item.commissionRate || 0;

                const taxableAmount = subtotal + legalCosts;
                const vatAmount = taxableAmount * (vatRate / 100);
                const commissionAmount = subtotal * (commissionRate / 100);
                return { ...item, vatAmount, commissionAmount };
            });

            if (JSON.stringify(newItems) !== JSON.stringify(items)) {
                setItems(newItems);
            }

            const totalAmount = newItems.reduce((sum, item) => sum + item.subtotal + (item.legalCosts || 0) + item.vatAmount, 0);
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

            let paymentStatus: PaymentStatus = 'Due';
            if (totalAmount > 0 && totalPaid >= totalAmount) {
                paymentStatus = 'Paid';
            } else if (totalPaid > 0) {
                paymentStatus = 'Partial';
            }

            setTransaction(prev => ({ ...prev, amount: totalAmount, paymentStatus }));
        }
    }, [type, items, payments]);


    if (!isOpen) return null;

    const handleTypeChange = (newType: TransactionType) => {
        setType(newType);
        if (isNew) {
            setTransaction(prev => ({ date: prev.date, type: newType }));
             if (newType === TransactionType.Income) {
                setItems([getInitialLineItem()]);
                setPayments([getInitialPayment()]);
             } else {
                setItems([]);
                setPayments([]);
             }
        }
    };

    // --- Item Handlers ---
    const handleItemChange = (itemId: string, field: keyof LineItem, value: any) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'serviceId') {
                    const service = services.find(s => s.id === value);
                    if (service) {
                        updatedItem.description = service.name[lang];
                        updatedItem.subtotal = service.defaultPrice;
                        updatedItem.legalCosts = service.legalCosts;
                    }
                }
                if (field === 'employeeId') {
                    const employee = employees.find(e => e.id === value);
                    if (employee) {
                        updatedItem.commissionRate = employee.defaultCommissionRate;
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    };
    const handleAddItem = () => setItems(prev => [...prev, getInitialLineItem()]);
    const handleRemoveItem = (itemId: string) => setItems(prev => prev.filter(item => item.id !== itemId));

    // --- Payment Handlers ---
    const handlePaymentChange = (paymentId: string, field: keyof Payment, value: any) => {
        setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, [field]: value } : p));
    };
    const handleAddPayment = () => setPayments(prev => [...prev, getInitialPayment()]);
    const handleRemovePayment = (paymentId: string) => setPayments(prev => prev.filter(p => p.id !== paymentId));


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['amount'].includes(name);
        setTransaction(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const finalTransaction: Transaction = {
            ...transaction,
            id: transaction.id || `txn_${Date.now()}`,
            date: new Date(transaction.date || new Date()).toISOString(),
            type,
            items,
            payments,
            description: transaction.description || items[0]?.description || 'Transaction',
            category: type === TransactionType.Income ? 'Service Revenue' : (transaction.category || 'General Expense'),
            amount: transaction.amount || 0,
        };
        onSave(finalTransaction);
    };

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalLegalCosts = items.reduce((sum, item) => sum + item.legalCosts, 0);
    const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalCommission = items.reduce((sum, item) => sum + item.commissionAmount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = (transaction.amount || 0) - totalPaid;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{isNew ? t('addNewTransaction') : t('editTransaction')}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500" /></button>
                    </div>

                    <div className="p-6 max-h-[75vh] overflow-y-auto">
                        <div className="mb-6 flex justify-center p-1 bg-slate-100 rounded-lg">
                            <button type="button" onClick={() => handleTypeChange(TransactionType.Income)} className={`px-8 py-2 w-1/2 rounded-md font-semibold transition-colors ${type === TransactionType.Income ? 'bg-green-500 text-white shadow' : 'text-slate-600'}`}>{t('income')}</button>
                            <button type="button" onClick={() => handleTypeChange(TransactionType.Expense)} className={`px-8 py-2 w-1/2 rounded-md font-semibold transition-colors ${type === TransactionType.Expense ? 'bg-red-500 text-white shadow' : 'text-slate-600'}`}>{t('expense')}</button>
                        </div>

                        {type === TransactionType.Income ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    {/* --- Top Level Info --- */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-1">{t('date')}</label>
                                                <input type="date" id="date" name="date" value={(transaction.date || '').split('T')[0]} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required />
                                            </div>
                                            <div>
                                                <label htmlFor="customerId" className="block text-sm font-medium text-slate-600 mb-1">{t('customer')}</label>
                                                <select id="customerId" name="customerId" value={transaction.customerId || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required>
                                                    <option value="" disabled>{t('selectACustomer')}</option>
                                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                         <div>
                                            <label htmlFor="internalNotes" className="block text-sm font-medium text-slate-600 mb-1">{t('internalNotes')}</label>
                                            <textarea id="internalNotes" name="internalNotes" value={transaction.internalNotes || ''} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder={t('internalNotesPlaceholder')}></textarea>
                                        </div>
                                    </div>
                                    {/* --- Line Items --- */}
                                    <div>
                                        <h4 className="text-lg font-semibold text-slate-700 mb-2">{t('servicesTitle')}</h4>
                                        <div className="space-y-3">
                                            {items.map((item, index) => (
                                                <div key={item.id} className="bg-slate-50 p-3 rounded-lg border">
                                                    <div className="grid grid-cols-12 gap-x-4 gap-y-2">
                                                        <div className="col-span-12">
                                                            <label className="text-xs font-medium text-slate-500">{t('service')}</label>
                                                            <select value={item.serviceId} onChange={e => handleItemChange(item.id, 'serviceId', e.target.value)} className="w-full p-1 border border-slate-300 rounded-md text-sm">
                                                                <option value="" disabled>{t('selectAService')}</option>
                                                                {services.map(s => <option key={s.id} value={s.id}>{s.name[lang]}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="col-span-4">
                                                            <label className="text-xs font-medium text-slate-500">{t('priceSubtotal')}</label>
                                                            <input type="number" value={item.subtotal} onChange={e => handleItemChange(item.id, 'subtotal', parseFloat(e.target.value) || 0)} className="w-full p-1 border border-slate-300 rounded-md text-sm" />
                                                        </div>
                                                        <div className="col-span-4">
                                                            <label className="text-xs font-medium text-slate-500">{t('officialPayments')}</label>
                                                            <input type="number" value={item.legalCosts} onChange={e => handleItemChange(item.id, 'legalCosts', parseFloat(e.target.value) || 0)} className="w-full p-1 border border-slate-300 rounded-md text-sm" />
                                                        </div>
                                                        <div className="col-span-4">
                                                            <label className="text-xs font-medium text-slate-500">{t('vatPercent')}</label>
                                                            <select value={item.vatRate} onChange={e => handleItemChange(item.id, 'vatRate', parseInt(e.target.value))} className="w-full p-1 border border-slate-300 rounded-md text-sm">
                                                                <option value="0">0%</option><option value="10">10%</option><option value="20">20%</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-6">
                                                            <label className="text-xs font-medium text-slate-500">{t('employee')}</label>
                                                            <select value={item.employeeId} onChange={e => handleItemChange(item.id, 'employeeId', e.target.value)} className="w-full p-1 border border-slate-300 rounded-md text-sm disabled:bg-slate-200">
                                                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                                            </select>
                                                        </div>
                                                         <div className="col-span-6">
                                                            <label className="text-xs font-medium text-slate-500">{t('commissionPercent')}</label>
                                                            <input
                                                                type="number"
                                                                value={isManager ? item.commissionRate : ''}
                                                                // Fix: Use `e.currentTarget` to ensure correct type inference for the event target.
                                                                onChange={e => handleItemChange(item.id, 'commissionRate', parseFloat(e.currentTarget.value) || 0)}
                                                                className="w-full p-1 border border-slate-300 rounded-md text-sm disabled:bg-slate-200 disabled:text-slate-500"
                                                                disabled={!isManager}
                                                                placeholder={!isManager ? (item.employeeId === currentUser.id ? `${item.commissionRate}%` : `(${t('manager')})`) : ''}
                                                            />
                                                        </div>
                                                         <div className="col-span-6">
                                                            <label className="text-xs font-medium text-slate-500">{t('collaborator')}</label>
                                                            <select value={item.collaboratorId || ''} onChange={e => handleItemChange(item.id, 'collaboratorId', e.target.value)} className="w-full p-1 border border-slate-300 rounded-md text-sm">
                                                                <option value="">{t('none')}</option>
                                                                {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                            </select>
                                                        </div>
                                                         <div className="col-span-6">
                                                            <label className="text-xs font-medium text-slate-500">{t('collaboratorFee')}</label>
                                                            <input
                                                                type="number"
                                                                value={item.collaboratorFee || ''}
                                                                onChange={e => handleItemChange(item.id, 'collaboratorFee', parseFloat(e.target.value) || 0)}
                                                                className="w-full p-1 border border-slate-300 rounded-md text-sm disabled:bg-slate-200 disabled:text-slate-500"
                                                                disabled={!isManager}
                                                                placeholder={!isManager ? `(${t('manager')})` : ''}
                                                            />
                                                        </div>
                                                    </div>
                                                    {items.length > 1 && <div className="text-right mt-2"><button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 text-red-500 rounded-full hover:bg-red-100"><TrashIcon className="w-4 h-4" /></button></div>}
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={handleAddItem} className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"><PlusIcon className="w-4 h-4"/><span>{t('addServiceItem')}</span></button>
                                    </div>
                                    {/* --- Payments --- */}
                                     <div>
                                        <h4 className="text-lg font-semibold text-slate-700 mb-2">{t('payments')}</h4>
                                        <div className="space-y-3">
                                             {payments.map(p => (
                                                 <div key={p.id} className="bg-slate-50 p-3 rounded-lg border">
                                                      <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs font-medium text-slate-500">{t('amount')}</label>
                                                            <input type="number" value={p.amount} onChange={e => handlePaymentChange(p.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full p-1 border border-slate-300 rounded-md text-sm" />
                                                        </div>
                                                         <div>
                                                            <label className="text-xs font-medium text-slate-500">{t('account')}</label>
                                                            <select value={p.accountId} onChange={e => handlePaymentChange(p.id, 'accountId', e.target.value)} className="w-full p-1 border border-slate-300 rounded-md text-sm">
                                                                <option value="" disabled>{t('selectAccount')}</option>
                                                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                            </select>
                                                        </div>
                                                      </div>
                                                       {payments.length > 1 && <div className="text-right mt-2"><button type="button" onClick={() => handleRemovePayment(p.id)} className="p-1 text-red-500 rounded-full hover:bg-red-100"><TrashIcon className="w-4 h-4" /></button></div>}
                                                 </div>
                                             ))}
                                        </div>
                                        <button type="button" onClick={handleAddPayment} className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"><PlusIcon className="w-4 h-4"/><span>{t('addPayment')}</span></button>
                                    </div>
                                </div>
                                {/* --- Totals SideBar --- */}
                                <div className="lg:col-span-1 bg-slate-50 p-4 rounded-lg border space-y-3">
                                    <h4 className="text-lg font-semibold text-slate-700 text-center mb-4">{t('invoiceSummary')}</h4>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">{t('subtotal')}:</span><span className="font-medium">{formatCurrency(subtotal, Currency.TRY)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">{t('officialCosts')}:</span><span className="font-medium">{formatCurrency(totalLegalCosts, Currency.TRY)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">{t('totalVat')}:</span><span className="font-medium">{formatCurrency(totalVat, Currency.TRY)}</span></div>

                                    {isManager ? (
                                        <>
                                            {Object.entries(
                                                items.reduce((acc, item) => {
                                                    const employeeName = employees.find(e => e.id === item.employeeId)?.name || t('na');
                                                    acc[employeeName] = (acc[employeeName] || 0) + item.commissionAmount;
                                                    return acc;
                                                }, {} as Record<string, number>)
                                            ).map(([name, amount]) => (
                                                <div key={name} className="flex justify-between text-xs text-slate-500 ps-4">
                                                    <span>- {name}</span>
                                                    <span className="font-medium">{formatCurrency(amount, Currency.TRY)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">{t('totalCommission')}:</span><span className="font-medium">{formatCurrency(totalCommission, Currency.TRY)}</span></div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">{t('myCommission')}:</span>
                                            <span className="font-medium">
                                                {formatCurrency(items
                                                    .filter(item => item.employeeId === currentUser.id)
                                                    .reduce((sum, item) => sum + item.commissionAmount, 0),
                                                    Currency.TRY
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    <div className="border-t my-2 pt-2 flex justify-between font-bold text-lg"><span className="text-slate-800">{t('grandTotal')}:</span><span className="text-slate-800">{formatCurrency(transaction.amount || 0, Currency.TRY)}</span></div>
                                    <div className="border-t my-2 pt-2 flex justify-between font-medium"><span className="text-slate-500">{t('totalPaid')}:</span><span className="text-green-600">{formatCurrency(totalPaid, Currency.TRY)}</span></div>
                                    <div className="flex justify-between font-medium"><span className="text-slate-500">{t('balanceDue')}:</span><span className="text-red-600">{formatCurrency(balanceDue, Currency.TRY)}</span></div>
                                    <div className="mt-4 text-center">
                                        <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                                            transaction.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                                            transaction.paymentStatus === 'Partial' ? 'bg-orange-100 text-orange-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>{t((transaction.paymentStatus || 'due').toLowerCase())}</span>
                                    </div>
                                </div>
                            </div>
                        ) : ( // Expense Form
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">{t('description')}</label>
                                    <input type="text" id="description" name="description" value={transaction.description || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">{t('amountInTRY')}</label>
                                        <input type="number" id="amount" name="amount" value={transaction.amount || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required />
                                    </div>
                                    <div>
                                        <label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-1">{t('date')}</label>
                                        <input type="date" id="date" name="date" value={(transaction.date || '').split('T')[0]} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required />
                                    </div>
                                </div>
                                 <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-slate-600 mb-1">{t('category')}</label>
                                    <input type="text" id="category" name="category" value={transaction.category || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder={t('expenseCategoryPlaceholder')} list="expense-categories" />
                                     <datalist id="expense-categories">{expenseCategories.map(cat => <option key={cat.id} value={cat.name[lang]} />)}</datalist>
                                </div>
                                <div>
                                    <label htmlFor="accountId" className="block text-sm font-medium text-slate-600 mb-1">{t('payFromAccount')}</label>
                                    <select id="accountId" name="accountId" value={transaction.accountId || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required>
                                        <option value="" disabled>{t('selectAnAccount')}</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="internalNotes" className="block text-sm font-medium text-slate-600 mb-1">{t('internalNotes')}</label>
                                    <textarea id="internalNotes" name="internalNotes" value={transaction.internalNotes || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder={t('expenseNotesPlaceholder')}></textarea>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow">{t('saveTransaction')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;
