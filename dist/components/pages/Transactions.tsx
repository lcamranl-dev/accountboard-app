import React, { useState } from 'react';
import { Transaction, TransactionType, Service, Employee, BankAccount, Customer, ExpenseCategory, Currency, Collaborator } from '../../types';
import { PlusIcon, PencilIcon, EyeIcon, TrashIcon, ClockIcon } from '../icons/Icons';
import TransactionModal from './TransactionModal';
import { useTranslations } from '../../contexts/LanguageContext';

interface TransactionsProps {
    transactions: Transaction[];
    services: Service[];
    employees: Employee[];
    collaborators: Collaborator[];
    accounts: BankAccount[];
    customers: Customer[];
    expenseCategories: ExpenseCategory[];
    onSave: (transaction: Transaction) => void;
    onDelete: (transactionId: string) => void;
    onApprove: (transactionId: string) => void;
    onReject: (transactionId: string) => void;
    onViewInvoice: (transaction: Transaction) => void;
    currentUser: Employee;
    searchTerm: string;
    financialLockDate: string | null;
}

const Transactions: React.FC<TransactionsProps> = (props) => {
    const { t, formatCurrency } = useTranslations();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Partial<Transaction> | null>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

    const getTypeBadge = (type: TransactionType) => {
      switch (type) {
        case TransactionType.Income:
          return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{t('income')}</span>;
        case TransactionType.Expense:
          return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{t('expense')}</span>;
        default:
          return null;
      }
    };

    const getStatusBadge = (transaction: Transaction) => {
        if (transaction.approvalStatus === 'Pending') {
             return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{t('pending')}</span>;
        }

        if (transaction.type === TransactionType.Expense) {
            return <span className="bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{t('approved')}</span>;
        }
        
        switch (transaction.paymentStatus) {
            case 'Paid':
                return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{t('paid')}</span>;
            case 'Partial':
                return <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{t('partial')}</span>;
            case 'Due':
                 return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{t('due')}</span>;
            default:
                return <span className="bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{t('approved')}</span>;
        }
    };

    const handleAddNew = () => {
        setEditingTransaction({});
        setIsModalOpen(true);
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };
    
    const handleViewInvoice = (transaction: Transaction) => {
        if (transaction.type === TransactionType.Income) {
            props.onViewInvoice(transaction);
        }
    };

    const handleDeleteClick = (transaction: Transaction) => {
        setDeletingTransaction(transaction);
    };

    const confirmDelete = () => {
        if (deletingTransaction) {
            props.onDelete(deletingTransaction.id);
            setDeletingTransaction(null);
        }
    };

    const cancelDelete = () => {
        setDeletingTransaction(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    const handleSave = (transaction: Transaction) => {
        props.onSave(transaction);
        handleCloseModal();
    }

    const filteredTransactions = props.transactions.filter(transaction => {
        const searchTermLower = props.searchTerm.toLowerCase();
        const customerName = transaction.type === TransactionType.Income ? (props.customers.find(c => c.id === transaction.customerId)?.name || '') : '';

        return (
            transaction.description.toLowerCase().includes(searchTermLower) ||
            (transaction.internalNotes || '').toLowerCase().includes(searchTermLower) ||
            (transaction.type === TransactionType.Income && customerName.toLowerCase().includes(searchTermLower)) ||
            (transaction.type === TransactionType.Expense && transaction.category.toLowerCase().includes(searchTermLower))
        );
    });
    

    return (
        <>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{t('transactionHistory')}</h2>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>{t('addTransaction')}</span>
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('date')}</th>
                                <th scope="col" className="px-6 py-3">{t('description')}</th>
                                <th scope="col" className="px-6 py-3">{t('type')}</th>
                                <th scope="col" className="px-6 py-3">{t('status')}</th>
                                <th scope="col" className="px-6 py-3 text-end">{t('amount')} ({t('currency')})</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((transaction) => {
                                const isLocked = props.financialLockDate && new Date(transaction.date) <= new Date(props.financialLockDate);
                                return (
                                <tr key={transaction.id} className={`bg-white border-b hover:bg-slate-50 ${transaction.approvalStatus === 'Pending' ? 'bg-yellow-50' : ''}`}>
                                    <td className="px-6 py-4">{new Date(transaction.date).toLocaleDateString()}</td>
                                    <td scope="row" className="px-6 py-4 font-medium text-slate-900">
                                        <div>{transaction.description}</div>
                                        {transaction.internalNotes && <div className="text-xs text-slate-500 mt-1 font-normal max-w-xs truncate" title={transaction.internalNotes}>{transaction.internalNotes}</div>}
                                    </td>
                                    <td className="px-6 py-4">{getTypeBadge(transaction.type)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(transaction)}</td>
                                    <td className={`px-6 py-4 text-end font-medium ${transaction.type === TransactionType.Income ? 'text-green-600' : 'text-red-700'}`}>
                                        {transaction.type === TransactionType.Expense && '-'}
                                        {formatCurrency(transaction.amount, Currency.TRY)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         {transaction.approvalStatus === 'Pending' && props.currentUser.role === 'Manager' ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => props.onApprove(transaction.id)} disabled={isLocked} className="px-3 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed">{t('approve')}</button>
                                                <button onClick={() => props.onReject(transaction.id)} disabled={isLocked} className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed">{t('reject')}</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center space-x-2">
                                                <button 
                                                    onClick={() => handleViewInvoice(transaction)} 
                                                    className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                                    aria-label={t('viewInvoice')}
                                                    disabled={transaction.type !== TransactionType.Income || transaction.approvalStatus === 'Pending'}
                                                    >
                                                    <EyeIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleEdit(transaction)} disabled={isLocked} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500" aria-label={t('edit')}>
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                {props.currentUser.role === 'Manager' && (
                                                    <button 
                                                        onClick={() => handleDeleteClick(transaction)} 
                                                        disabled={isLocked}
                                                        className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500" 
                                                        aria-label={t('delete')}>
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
                {filteredTransactions.map((transaction) => {
                    const isLocked = props.financialLockDate && new Date(transaction.date) <= new Date(props.financialLockDate);
                    return (
                    <div key={transaction.id} className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 ${transaction.approvalStatus === 'Pending' ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                        <div className="flex justify-between items-start">
                            <div className="pr-4">
                                <p className="font-semibold text-slate-800">{transaction.description}</p>
                                <p className="text-sm text-slate-500">
                                {
                                    transaction.type === TransactionType.Income
                                        ? (props.customers.find(c => c.id === transaction.customerId)?.name || t('na'))
                                        : transaction.category
                                }
                                </p>
                            </div>
                            <p className={`text-lg font-bold whitespace-nowrap ${transaction.type === TransactionType.Income ? 'text-green-600' : 'text-red-700'}`}>
                                {transaction.type === TransactionType.Expense && '-'}
                                {formatCurrency(transaction.amount, Currency.TRY)}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            {getTypeBadge(transaction.type)}
                            {getStatusBadge(transaction)}
                            <span className="text-slate-500 flex items-center">
                                <ClockIcon className="w-4 h-4 me-1 text-slate-400" />
                                {new Date(transaction.date).toLocaleDateString()}
                            </span>
                        </div>
                        {transaction.internalNotes && (
                            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md">{transaction.internalNotes}</p>
                        )}
                         {transaction.approvalStatus === 'Pending' && props.currentUser.role === 'Manager' ? (
                                <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
                                    <button onClick={() => props.onApprove(transaction.id)} disabled={isLocked} className="px-4 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed">{t('approve')}</button>
                                    <button onClick={() => props.onReject(transaction.id)} disabled={isLocked} className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed">{t('reject')}</button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-end space-x-1 border-t border-slate-100 pt-3">
                                    <button
                                        onClick={() => handleViewInvoice(transaction)}
                                        className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label={t('viewInvoice')}
                                        disabled={transaction.type !== TransactionType.Income || transaction.approvalStatus === 'Pending'}
                                    >
                                        <EyeIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleEdit(transaction)} disabled={isLocked} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500" aria-label={t('edit')}>
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    {props.currentUser.role === 'Manager' && (
                                        <button
                                            onClick={() => handleDeleteClick(transaction)}
                                            disabled={isLocked}
                                            className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500"
                                            aria-label={t('delete')}>
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                           )}
                    </div>
                )})}
            </div>

            {isModalOpen && (
                <TransactionModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    transactionToEdit={editingTransaction}
                    services={props.services}
                    employees={props.employees}
                    collaborators={props.collaborators}
                    accounts={props.accounts}
                    customers={props.customers}
                    expenseCategories={props.expenseCategories}
                    currentUser={props.currentUser}
                />
            )}

            {deletingTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800">{t('confirmDeletion')}</h3>
                            <p className="mt-2 text-slate-600">
                                {t('confirmDeleteTransaction')}
                            </p>
                            <p className="mt-4 text-sm font-medium bg-slate-100 p-3 rounded-md">{deletingTransaction.description}</p>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                            <button onClick={cancelDelete} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow">{t('deleteTransaction')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Transactions;
