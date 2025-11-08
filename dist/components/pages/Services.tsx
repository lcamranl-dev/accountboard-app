import React, { useState, FormEvent } from 'react';
import { Service, MultiLingualString, Currency, ExpenseCategory } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '../icons/Icons';
import { useTranslations } from '../../contexts/LanguageContext';

// Modal for Expense Category
interface ExpenseCategoryModalProps {
    category: Partial<ExpenseCategory> | null;
    onClose: () => void;
    onSave: (category: ExpenseCategory) => void;
}

const ExpenseCategoryModal: React.FC<ExpenseCategoryModalProps> = ({ category, onClose, onSave }) => {
    if (!category) return null;
    const { t } = useTranslations();

    const [formData, setFormData] = useState(category.name ? category : { ...category, name: { en: '', tr: '', fa: '' } });
    const isNew = !category.id;
    
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, name: { ...(prev.name as MultiLingualString), [name]: value }}));
    };

    const handleDefaultValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, defaultValue: parseFloat(value) || 0 }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const categoryName = formData.name as MultiLingualString;
        if (categoryName?.en && categoryName?.tr && categoryName?.fa) {
            onSave(formData as ExpenseCategory);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{isNew ? t('addCategory') : t('edit')}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                            <XMarkIcon className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="en" className="block text-sm font-medium text-slate-600 mb-1">{t('serviceNameEn')}</label>
                            <input type="text" id="en" name="en" value={(formData.name as MultiLingualString)?.en || ''} onChange={handleNameChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="tr" className="block text-sm font-medium text-slate-600 mb-1">{t('serviceNameTr')}</label>
                            <input type="text" id="tr" name="tr" value={(formData.name as MultiLingualString)?.tr || ''} onChange={handleNameChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="fa" className="block text-sm font-medium text-slate-600 mb-1">{t('serviceNameFa')}</label>
                            <input type="text" id="fa" name="fa" value={(formData.name as MultiLingualString)?.fa || ''} onChange={handleNameChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" dir="rtl" required />
                        </div>
                        <div>
                            <label htmlFor="defaultValue" className="block text-sm font-medium text-slate-600 mb-1">{t('defaultValueOptional')}</label>
                            <input type="number" step="0.01" id="defaultValue" name="defaultValue" value={formData.defaultValue || ''} onChange={handleDefaultValueChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 50.00"/>
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

// Modal component
interface ServiceModalProps {
    service: Partial<Service> | null;
    onClose: () => void;
    onSave: (service: Service) => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose, onSave }) => {
    if (!service) return null;
    const { t } = useTranslations();

    const initialName: MultiLingualString = service.name || { fa: '', tr: '', en: '' };
    const [name, setName] = useState<MultiLingualString>(initialName);
    const [defaultPrice, setDefaultPrice] = useState(service.defaultPrice || 0);
    const [legalCosts, setLegalCosts] = useState(service.legalCosts || 0);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave({
            ...service,
            name,
            defaultPrice,
            legalCosts
        } as Service);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setName(prev => ({ ...prev, [name]: value }));
    }

    const isNew = !service.id;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{isNew ? t('addService') : t('edit')}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                            <XMarkIcon className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="fa" className="block text-sm font-medium text-slate-600 mb-1">{t('serviceNameFa')}</label>
                            <input type="text" id="fa" name="fa" value={name.fa} onChange={handleNameChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" dir="rtl" required />
                        </div>
                        <div>
                            <label htmlFor="tr" className="block text-sm font-medium text-slate-600 mb-1">{t('serviceNameTr')}</label>
                            <input type="text" id="tr" name="tr" value={name.tr} onChange={handleNameChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="en" className="block text-sm font-medium text-slate-600 mb-1">{t('serviceNameEn')}</label>
                            <input type="text" id="en" name="en" value={name.en} onChange={handleNameChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="defaultPrice" className="block text-sm font-medium text-slate-600 mb-1">{t('defaultPriceTRY')}</label>
                                <input type="number" step="0.01" id="defaultPrice" name="defaultPrice" value={defaultPrice} onChange={e => setDefaultPrice(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label htmlFor="legalCosts" className="block text-sm font-medium text-slate-600 mb-1">{t('legalAdminCostsTRY')}</label>
                                <input type="number" step="0.01" id="legalCosts" name="legalCosts" value={legalCosts} onChange={e => setLegalCosts(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
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


// Main component
interface ServicesProps {
    services: Service[];
    onSave: (service: Service) => void;
    onDelete: (serviceId: string) => void;
    expenseCategories: ExpenseCategory[];
    onSaveExpenseCategory: (category: ExpenseCategory) => void;
    onDeleteExpenseCategory: (categoryId: string) => void;
}

const Services: React.FC<ServicesProps> = ({ services, onSave, onDelete, expenseCategories, onSaveExpenseCategory, onDeleteExpenseCategory }) => {
    const { t, lang, formatCurrency } = useTranslations();
    const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
    const [deletingService, setDeletingService] = useState<Service | null>(null);
    const [editingCategory, setEditingCategory] = useState<Partial<ExpenseCategory> | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<ExpenseCategory | null>(null);

    const handleAddNewService = () => {
        setEditingService({ name: { fa: '', tr: '', en: '' }, defaultPrice: 0, legalCosts: 0 });
    };

    const handleEditService = (service: Service) => {
        setEditingService(service);
    };
    
    const handleDeleteService = (service: Service) => {
        setDeletingService(service);
    };

    const confirmDeleteService = () => {
        if (deletingService) {
            onDelete(deletingService.id);
            setDeletingService(null);
        }
    };
    
    const cancelDeleteService = () => {
        setDeletingService(null);
    };

    const handleCloseServiceModal = () => {
        setEditingService(null);
    };

    const handleSaveService = (serviceToSave: Service) => {
        onSave(serviceToSave);
        handleCloseServiceModal();
    };
    
    const handleAddNewCategory = () => setEditingCategory({ name: { en: '', tr: '', fa: '' } });
    const handleEditCategory = (category: ExpenseCategory) => setEditingCategory(category);
    const handleCloseCategoryModal = () => setEditingCategory(null);
    const handleSaveCategory = (category: ExpenseCategory) => {
        onSaveExpenseCategory(category);
        handleCloseCategoryModal();
    };

    const handleDeleteCategory = (category: ExpenseCategory) => {
        setDeletingCategory(category);
    };

    const confirmDeleteCategory = () => {
        if (deletingCategory) {
            onDeleteExpenseCategory(deletingCategory.id);
            setDeletingCategory(null);
        }
    };
    const cancelDeleteCategory = () => {
        setDeletingCategory(null);
    };


    return (
        <div className="space-y-12">
            {/* Services Section */}
            <div>
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-slate-800">{t('services')}</h2>
                    <button
                        onClick={handleAddNewService}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>{t('addService')}</span>
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('services')}</th>
                                    <th scope="col" className="px-6 py-3 hidden sm:table-cell">{t('defaultPriceTRY')}</th>
                                    <th scope="col" className="px-6 py-3 hidden md:table-cell">{t('legalAdminCostsTRY')}</th>
                                    <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((service) => (
                                    <tr key={service.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                                            {service.name[lang]}
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            {formatCurrency(service.defaultPrice, Currency.TRY)}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            {formatCurrency(service.legalCosts, Currency.TRY)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => handleEditService(service)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors" aria-label={t('edit')}>
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDeleteService(service)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-red-600 transition-colors" aria-label={t('delete')}>
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
            </div>

            {/* Expense Categories Section */}
            <div>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">{t('expenseCategories')}</h2>
                    <button onClick={handleAddNewCategory} className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                        <PlusIcon className="w-5 h-5" />
                        <span>{t('addCategory')}</span>
                    </button>
                </div>
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('categoryName')}</th>
                                    <th scope="col" className="px-6 py-3">{t('defaultValue')}</th>
                                    <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenseCategories.map((cat) => (
                                    <tr key={cat.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{cat.name[lang]}</td>
                                        <td className="px-6 py-4">{cat.defaultValue ? formatCurrency(cat.defaultValue, Currency.TRY) : <span className="text-slate-400">{t('notSet')}</span>}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => handleEditCategory(cat)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-blue-600 transition-colors" aria-label={t('edit')}>
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-red-600 transition-colors" aria-label={t('delete')}>
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
            </div>
            
            {editingService && <ServiceModal service={editingService} onClose={handleCloseServiceModal} onSave={handleSaveService} />}
            {deletingService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800">{t('confirmDeletion')}</h3>
                            <p className="mt-2 text-slate-600">
                                {t('confirmDeleteService', { serviceName: deletingService.name[lang] })}
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                            <button onClick={cancelDeleteService} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                            <button onClick={confirmDeleteService} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow">{t('deleteService')}</button>
                        </div>
                    </div>
                </div>
            )}
            {editingCategory && <ExpenseCategoryModal category={editingCategory} onClose={handleCloseCategoryModal} onSave={handleSaveCategory} />}
            {deletingCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800">{t('confirmDeletion')}</h3>
                        <p className="mt-2 text-slate-600">
                            {t('Are you sure you want to delete the category "{categoryName}"? This action cannot be undone.', { categoryName: deletingCategory.name[lang] })}
                        </p>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button onClick={cancelDeleteCategory} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                        <button onClick={confirmDeleteCategory} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow">{t('delete')}</button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
};

export default Services;