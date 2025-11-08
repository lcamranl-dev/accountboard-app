
import React, { useState, useMemo, FormEvent } from 'react';
import { Collaborator, BankAccount, AccountType, Currency, Transaction, Service } from '../../types';
import { PlusIcon, PencilIcon, CurrencyDollarIcon, XMarkIcon, TrashIcon, EyeIcon } from '../icons/Icons';
import CollaboratorDetailModal from './CollaboratorDetailModal';
import { useTranslations } from '../../contexts/LanguageContext';

// Modals
interface CollaboratorModalProps {
    collaborator: Partial<Collaborator> | null;
    onClose: () => void;
    onSave: (collaborator: Collaborator) => void;
}

const CollaboratorModal: React.FC<CollaboratorModalProps> = ({ collaborator, onClose, onSave }) => {
    if (!collaborator) return null;
    const { t } = useTranslations();
    const [formData, setFormData] = useState(collaborator);
    const isNew = !collaborator.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.type) {
            onSave(formData as Collaborator);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{isNew ? t('addCollaborator') : t('edit')}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XMarkIcon className="w-6 h-6 text-slate-500" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">{t('collaboratorName')}</label>
                            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-slate-600 mb-1">{t('collaboratorType')}</label>
                            <select id="type" name="type" value={formData.type || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                                <option value="" disabled>{t('selectType')}</option>
                                <option value="Broker">{t('broker')}</option>
                                <option value="Translator">{t('translator')}</option>
                            </select>
                        </div>
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

interface PaymentModalProps {
    collaborator: Collaborator;
    accounts: BankAccount[];
    onClose: () => void;
    onSave: (payment: { collaboratorId: string; amount: number; sourceAccountId: string; description: string; }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ collaborator, accounts, onClose, onSave }) => {
    const { t, formatCurrency } = useTranslations();
    const [amount, setAmount] = useState(0);
    const [sourceAccountId, setSourceAccountId] = useState(accounts.find(a => a.type === AccountType.Bank)?.id || '');
    const [description, setDescription] = useState(`${t('makePayment')} ${collaborator.name}`);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (amount > 0 && sourceAccountId) {
            onSave({ collaboratorId: collaborator.id, amount, sourceAccountId, description });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{t('makePayment')} {collaborator.name}</h3>
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
                            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">{t('description')}</label>
                            <input type="text" id="description" name="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow">{t('confirmPayment')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CollaboratorsProps {
    collaborators: Collaborator[];
    accounts: BankAccount[];
    transactions: Transaction[];
    services: Service[];
    onSave: (collaborator: Collaborator) => void;
    onDelete: (collaboratorId: string) => void;
    onMakePayment: (payment: { collaboratorId: string; amount: number; sourceAccountId: string; description: string; }) => void;
}

const Collaborators: React.FC<CollaboratorsProps> = ({ collaborators, accounts, transactions, services, onSave, onDelete, onMakePayment }) => {
    const { t, formatCurrency } = useTranslations();
    const [editingCollaborator, setEditingCollaborator] = useState<Partial<Collaborator> | null>(null);
    const [payingCollaborator, setPayingCollaborator] = useState<Collaborator | null>(null);
    const [deletingCollaborator, setDeletingCollaborator] = useState<Collaborator | null>(null);
    const [viewingCollaborator, setViewingCollaborator] = useState<Collaborator | null>(null);
    
    const handleCloseModal = () => {
        setEditingCollaborator(null);
        setPayingCollaborator(null);
        setDeletingCollaborator(null);
        setViewingCollaborator(null);
    };

    return (
        <>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{t('collaboratorManagement')}</h2>
                <button
                    onClick={() => setEditingCollaborator({ name: '', type: 'Broker', outstandingBalance: 0 })}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>{t('addCollaborator')}</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('collaboratorName')}</th>
                                <th scope="col" className="px-6 py-3">{t('type')}</th>
                                <th scope="col" className="px-6 py-3">{t('outstandingBalance')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {collaborators.map(c => (
                                <tr key={c.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                                    <td className="px-6 py-4">{t(c.type.toLowerCase())}</td>
                                    <td className={`px-6 py-4 font-medium ${c.outstandingBalance > 0 ? 'text-green-600' : c.outstandingBalance < 0 ? 'text-red-600' : 'text-slate-700'}`}>{formatCurrency(c.outstandingBalance, Currency.TRY)}</td>
                                    <td className="px-6 py-4 text-center">
                                         <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => setViewingCollaborator(c)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors" aria-label={t('viewDetails')}>
                                                <EyeIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => setPayingCollaborator(c)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-green-600 transition-colors" aria-label={t('makePayment')}>
                                                <CurrencyDollarIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => setEditingCollaborator(c)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors" aria-label={t('edit')}>
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => setDeletingCollaborator(c)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-red-600 transition-colors" aria-label={t('delete')}>
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingCollaborator && <CollaboratorModal collaborator={editingCollaborator} onClose={handleCloseModal} onSave={onSave} />}
            {payingCollaborator && <PaymentModal collaborator={payingCollaborator} accounts={accounts} onClose={handleCloseModal} onSave={onMakePayment} />}
            {viewingCollaborator && <CollaboratorDetailModal collaborator={viewingCollaborator} transactions={transactions} services={services} onClose={handleCloseModal} />}
            {deletingCollaborator && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800">{t('confirmDeletion')}</h3>
                            <p className="mt-2 text-slate-600">
                                {t('confirmDeleteCollaborator', { collaboratorName: deletingCollaborator.name })}
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                            <button onClick={handleCloseModal} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                            <button onClick={() => { onDelete(deletingCollaborator.id); handleCloseModal(); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow">{t('deleteCollaborator')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Collaborators;
