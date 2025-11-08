import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import { BankAccount, AccountType, Currency, Transaction, Employee, TransactionType } from '../../types';
import { BuildingLibraryIcon, WalletIcon, PlusIcon, PencilIcon, TrashIcon, ClockIcon, XMarkIcon, ArrowsRightLeftIcon } from '../icons/Icons';
import { useTranslations } from '../../contexts/LanguageContext';

// #region Modals
interface AccountModalProps {
    account: Partial<BankAccount> | null;
    onClose: () => void;
    onSave: (account: BankAccount) => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ account, onClose, onSave }) => {
    if (!account) return null;
    const { t } = useTranslations();
    const [formData, setFormData] = useState(account);
    const isNew = !account.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'balance' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (formData.name) {
            onSave(formData as BankAccount);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{isNew ? t('addAccount') : t('edit')}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">{t('accountName')}</label>
                            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-slate-600 mb-1">{t('accountType')}</label>
                                <select id="type" name="type" value={formData.type || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    <option value={AccountType.Bank}>{t('bank')}</option>
                                    <option value={AccountType.Cash}>{t('cash')}</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="currency" className="block text-sm font-medium text-slate-600 mb-1">{t('currency')}</label>
                                <select id="currency" name="currency" value={formData.currency || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    <option value={Currency.TRY}>TRY</option>
                                    <option value={Currency.USD}>USD</option>
                                    <option value={Currency.EUR}>EUR</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="balance" className="block text-sm font-medium text-slate-600 mb-1">{t('currentBalance')}</label>
                            <input type="number" step="0.01" id="balance" name="balance" value={formData.balance || 0} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        {formData.type === AccountType.Bank && (
                             <div>
                                <label htmlFor="accountNumber" className="block text-sm font-medium text-slate-600 mb-1">{t('accountNumber')}</label>
                                <input type="text" id="accountNumber" name="accountNumber" value={formData.accountNumber || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        )}
                         {formData.type === AccountType.Cash && (
                             <div>
                                <label htmlFor="owner" className="block text-sm font-medium text-slate-600 mb-1">{t('ownerOptional')}</label>
                                <input type="text" id="owner" name="owner" value={formData.owner || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface HistoryModalProps {
    account: BankAccount;
    transactions: Transaction[];
    onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ account, transactions, onClose }) => {
    const { t, formatCurrency } = useTranslations();
    const accountTransactions = useMemo(() => {
        const movements: { date: string, description: string, amount: number, type: TransactionType, id: string }[] = [];

        transactions.forEach(t => {
            // Expenses from this account
            if (t.type === TransactionType.Expense && t.accountId === account.id) {
                movements.push({
                    id: t.id,
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                    type: TransactionType.Expense,
                });
            }
            // Incomes to this account
            if (t.type === TransactionType.Income && t.payments) {
                t.payments.forEach(p => {
                    if (p.accountId === account.id) {
                        movements.push({
                            id: `${t.id}-${p.id}`,
                            date: p.date,
                            description: t.description,
                            amount: p.amount,
                            type: TransactionType.Income,
                        });
                    }
                });
            }
        });

        return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [account, transactions]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl m-4 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">{t('historyFor', {accountName: account.name})}</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="border rounded-lg overflow-hidden">
                         <table className="w-full text-sm text-start text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('date')}</th>
                                    <th scope="col" className="px-6 py-3">{t('description')}</th>
                                    <th scope="col" className="px-6 py-3 text-end">{t('amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accountTransactions.length > 0 ? accountTransactions.map(t => (
                                    <tr key={t.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{t.description}</td>
                                        <td className={`px-6 py-4 text-end font-medium ${t.type === TransactionType.Income ? 'text-green-600' : 'text-red-700'}`}>
                                            {t.type === TransactionType.Expense && '-'}{formatCurrency(t.amount, account.currency)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="text-center p-8 text-slate-500">{t('noTransactionsFound')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('close')}</button>
                </div>
            </div>
        </div>
    );
};

interface TransferModalProps {
    accounts: BankAccount[];
    onClose: () => void;
    onTransfer: (transfer: { fromAccountId: string; toAccountId: string; amount: number; exchangeRate: number; description: string; }) => void;
}
const TransferModal: React.FC<TransferModalProps> = ({ accounts, onClose, onTransfer }) => {
    const { t, formatCurrency } = useTranslations();
    const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
    const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
    const [amount, setAmount] = useState(0);
    const [exchangeRate, setExchangeRate] = useState(1);
    const [description, setDescription] = useState(t('fundTransfer'));

    const fromAccount = accounts.find(a => a.id === fromAccountId);
    const toAccount = accounts.find(a => a.id === toAccountId);
    const showExchangeRate = fromAccount && toAccount && fromAccount.currency !== toAccount.currency;
    const receivedAmount = showExchangeRate ? amount * exchangeRate : amount;

    useEffect(() => {
        // Prevent selecting the same account for from and to
        if (fromAccountId === toAccountId) {
            const nextAvailableAccount = accounts.find(a => a.id !== fromAccountId);
            setToAccountId(nextAvailableAccount?.id || '');
        }
    }, [fromAccountId, toAccountId, accounts]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (amount > 0 && fromAccountId && toAccountId) {
            onTransfer({ fromAccountId, toAccountId, amount, exchangeRate, description });
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{t('transferFunds')}</h3>
                         <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="fromAccountId" className="block text-sm font-medium text-slate-600 mb-1">{t('fromAccount')}</label>
                                <select id="fromAccountId" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="toAccountId" className="block text-sm font-medium text-slate-600 mb-1">{t('toAccount')}</label>
                                <select id="toAccountId" value={toAccountId} onChange={e => setToAccountId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    {accounts.filter(a => a.id !== fromAccountId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">{t('amountToTransfer', { currency: fromAccount?.currency || '' })}</label>
                            <input type="number" step="0.01" id="amount" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        {showExchangeRate && (
                            <div>
                                <label htmlFor="exchangeRate" className="block text-sm font-medium text-slate-600 mb-1">{t('exchangeRate', { from: fromAccount?.currency || '', to: toAccount?.currency || '' })}</label>
                                <input type="number" step="0.0001" id="exchangeRate" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        )}
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">{t('description')}</label>
                            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg text-center">
                            <p className="text-sm text-slate-500">{t('amountToBeReceived')}</p>
                            <p className="text-2xl font-bold text-slate-800">{toAccount && formatCurrency(receivedAmount, toAccount.currency)}</p>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow">{t('confirmTransfer')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// #endregion

interface AccountCardProps {
  account: BankAccount;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
  onViewHistory: (account: BankAccount) => void;
  currentUser: Employee;
}
const AccountCard: React.FC<AccountCardProps> = ({ account, onEdit, onDelete, onViewHistory, currentUser }) => {
  const { t, formatCurrency } = useTranslations();
  const isBank = account.type === AccountType.Bank;
  const Icon = isBank ? BuildingLibraryIcon : WalletIcon;
  const iconBgColor = isBank ? 'bg-blue-100' : 'bg-green-100';
  const iconTextColor = isBank ? 'text-blue-600' : 'text-green-600';

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
             <p className="text-sm font-medium text-slate-500 truncate">{account.owner ? `${account.owner} • ${t(account.type.toLowerCase())}` : t(account.type.toLowerCase())}</p>
             <p className="text-lg font-bold text-slate-800 mt-1 truncate">{account.name}</p>
          </div>
          <div className={`p-3 rounded-full ${iconBgColor} ms-4`}>
            <Icon className={`w-6 h-6 ${iconTextColor}`} />
          </div>
        </div>
        <div className="mt-6">
            <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(account.balance, account.currency)}
            </p>
            <p className="text-sm font-medium text-slate-400 mt-1">
                {account.accountNumber ? t('accountColon', { accountNumber: account.accountNumber}) : t('cashOnHand')}
            </p>
        </div>
      </div>
      <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-end space-x-2">
          <button onClick={() => onViewHistory(account)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600" aria-label={t('viewHistory')}><ClockIcon className="w-5 h-5" /></button>
          {currentUser.role === 'Manager' && (
              <>
                <button onClick={() => onEdit(account)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600" aria-label={t('editAccount')}><PencilIcon className="w-5 h-5" /></button>
                <button onClick={() => onDelete(account)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-red-600" aria-label={t('delete')}><TrashIcon className="w-5 h-5" /></button>
              </>
          )}
      </div>
    </div>
  );
};

interface AccountsProps {
  accounts: BankAccount[];
  allAccounts: BankAccount[];
  transactions: Transaction[];
  onSave: (account: BankAccount) => void;
  onDelete: (accountId: string) => void;
  onTransfer: (transfer: { fromAccountId: string; toAccountId: string; amount: number; exchangeRate: number; description: string; }) => void;
  currentUser: Employee;
}

const Accounts: React.FC<AccountsProps> = ({ accounts, allAccounts, transactions, onSave, onDelete, onTransfer, currentUser }) => {
    const { t } = useTranslations();
    const [editingAccount, setEditingAccount] = useState<Partial<BankAccount> | null>(null);
    const [historyAccount, setHistoryAccount] = useState<BankAccount | null>(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null);

    const handleAddNew = () => setEditingAccount({ name: '', type: AccountType.Bank, currency: Currency.TRY, balance: 0 });
    const handleEdit = (account: BankAccount) => setEditingAccount(account);
    const handleDelete = (account: BankAccount) => {
        setDeletingAccount(account);
    };
    const confirmDelete = () => {
        if (deletingAccount) {
            onDelete(deletingAccount.id);
            setDeletingAccount(null);
        }
    };
    const cancelDelete = () => {
        setDeletingAccount(null);
    };
    const handleViewHistory = (account: BankAccount) => setHistoryAccount(account);
    const handleSave = (account: BankAccount) => {
        onSave(account);
        setEditingAccount(null);
    };
     const handleTransfer = (transfer: { fromAccountId: string; toAccountId: string; amount: number; exchangeRate: number; description: string; }) => {
        onTransfer(transfer);
        setIsTransferModalOpen(false);
    };

  return (
    <>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-slate-800">{t('bankCashAccounts')}</h2>
             <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button onClick={() => setIsTransferModalOpen(true)} className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                    <ArrowsRightLeftIcon className="w-5 h-5" />
                    <span>{t('transferFunds')}</span>
                </button>
                {currentUser.role === 'Manager' && (
                    <button onClick={handleAddNew} className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                        <PlusIcon className="w-5 h-5" />
                        <span>{t('addAccount')}</span>
                    </button>
                )}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {accounts.map(acc => (
                <AccountCard key={acc.id} account={acc} onEdit={handleEdit} onDelete={handleDelete} onViewHistory={handleViewHistory} currentUser={currentUser} />
            ))}
        </div>
        
        {/* Modals */}
        {editingAccount && <AccountModal account={editingAccount} onClose={() => setEditingAccount(null)} onSave={handleSave} />}
        {historyAccount && <HistoryModal account={historyAccount} transactions={transactions} onClose={() => setHistoryAccount(null)} />}
        {isTransferModalOpen && <TransferModal accounts={allAccounts} onClose={() => setIsTransferModalOpen(false)} onTransfer={handleTransfer} />}
        {deletingAccount && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800">{t('confirmDeletion')}</h3>
                        <p className="mt-2 text-slate-600">
                            {t('confirmDeleteAccount', { accountName: deletingAccount.name })}
                        </p>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button onClick={cancelDelete} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                        <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow">{t('deleteAccount')}</button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default Accounts;
