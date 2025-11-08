import React, { useState, FormEvent, useMemo } from 'react';
import { Customer, Transaction, TransactionType, Employee, Currency } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';
import { useTranslations } from '../../contexts/LanguageContext';

// Modal component for Add/Edit Customer
interface CustomerModalProps {
    customer: Partial<Customer> | null;
    onClose: () => void;
    onSave: (customer: Customer) => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose, onSave }) => {
    if (!customer) return null;
    const { t } = useTranslations();

    const [formData, setFormData] = useState(customer);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (formData.name) {
            onSave(formData as Customer);
        }
    };

    const isNew = !customer.id;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{isNew ? t('addCustomer') : t('edit')}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                            <XMarkIcon className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">{t('customerName')}</label>
                            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">{t('emailAddress')}</label>
                            <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., contact@example.com" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-600 mb-1">{t('phoneNumber')}</label>
                            <input type="tel" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., +90 555 123 4567" />
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
};

// Main Customers page component
interface CustomersProps {
    customers: Customer[];
    transactions: Transaction[];
    onSave: (customer: Customer) => void;
    onDelete: (customerId: string) => void;
    currentUser: Employee;
}

type SortableKey = 'name' | 'debt';

const Customers: React.FC<CustomersProps> = ({ customers, transactions, onSave, onDelete, currentUser }) => {
    const { t, formatCurrency } = useTranslations();
    const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    const customersWithDebt = useMemo(() => {
        return customers.map(customer => {
            const debt = transactions
                .filter(t => t.type === TransactionType.Income && t.customerId === customer.id)
                .reduce((totalDebt, t) => {
                    const totalPaid = t.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                    const balanceDue = (t.amount || 0) - totalPaid;
                    return totalDebt + (balanceDue > 0 ? balanceDue : 0);
                }, 0);
            return { ...customer, debt };
        });
    }, [customers, transactions]);

    const sortedCustomers = useMemo(() => {
        const sortableItems = [...customersWithDebt];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [customersWithDebt, sortConfig]);

    const requestSort = (key: SortableKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleAddNew = () => {
        setEditingCustomer({ name: '', email: '', phone: '' });
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
    };

    const handleDelete = (customer: Customer) => {
        setDeletingCustomer(customer);
    };

    const confirmDelete = () => {
        if(deletingCustomer) {
            onDelete(deletingCustomer.id);
            setDeletingCustomer(null);
        }
    };

    const cancelDelete = () => {
        setDeletingCustomer(null);
    };

    const handleCloseModal = () => {
        setEditingCustomer(null);
    };

    const handleSave = (customerToSave: Customer) => {
        onSave(customerToSave);
        handleCloseModal();
    };

    const SortableHeader: React.FC<{ sortKey: SortableKey, children: React.ReactNode }> = ({ sortKey, children }) => {
        const isActive = sortConfig.key === sortKey;
        const icon = isActive ?
            (sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />) :
            <span className="w-4 h-4 opacity-0 group-hover:opacity-50"><ChevronDownIcon className="w-4 h-4 text-slate-400" /></span>;

        return (
             <th scope="col" className="px-6 py-3">
                <button onClick={() => requestSort(sortKey)} className="flex items-center space-x-1 group text-xs text-slate-700 uppercase">
                    <span>{children}</span>
                    {icon}
                </button>
            </th>
        );
    }

    return (
        <>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{t('customerManagement')}</h2>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>{t('addCustomer')}</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start text-slate-500">
                        <thead className="bg-slate-50">
                            <tr>
                                <SortableHeader sortKey="name">{t('customerName')}</SortableHeader>
                                <th scope="col" className="px-6 py-3 text-xs text-slate-700 uppercase hidden sm:table-cell">{t('phone')}</th>
                                {currentUser.role === 'Manager' && <SortableHeader sortKey="debt">{t('debt')}</SortableHeader>}
                                <th scope="col" className="px-6 py-3 text-center text-xs text-slate-700 uppercase">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCustomers.map((customer) => (
                                <tr key={customer.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                        {customer.name}
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                       {customer.phone || <span className="text-slate-400">{t('na')}</span>}
                                    </td>
                                    {currentUser.role === 'Manager' && (
                                        <td className={`px-6 py-4 font-medium ${customer.debt > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                            {formatCurrency(customer.debt, Currency.TRY)}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => handleEdit(customer)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors" aria-label={t('edit')}>
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            {currentUser.role === 'Manager' && (
                                                <button onClick={() => handleDelete(customer)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-red-600 transition-colors" aria-label={t('delete')}>
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingCustomer && <CustomerModal customer={editingCustomer} onClose={handleCloseModal} onSave={handleSave} />}
            {deletingCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800">{t('confirmDeletion')}</h3>
                            <p className="mt-2 text-slate-600">
                                {t('confirmDeleteCustomer', { customerName: deletingCustomer.name })}
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                            <button onClick={cancelDelete} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow">{t('deleteCustomer')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Customers;