import React, { useState, FormEvent, useMemo } from 'react';
import { Project, Employee, Transaction, ProjectStatus } from '../../types';
import { XMarkIcon } from '../icons/Icons';
import { useTranslations } from '../../contexts/LanguageContext';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: Project) => void;
    projectToEdit: Partial<Project> | null;
    employees: Employee[];
    transactions: Transaction[];
    currentUser: Employee;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, projectToEdit, employees, transactions, currentUser }) => {
    const { t } = useTranslations();
    const [project, setProject] = useState(projectToEdit);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    if (!isOpen || !project) return null;

    const isNew = !project.id;
    
    const filteredTransactions = useMemo(() => {
        if (!searchTerm) return transactions;
        return transactions.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, transactions]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        // FIX: Use e.currentTarget to ensure correct type inference for the event target.
        const { name, value } = e.currentTarget;
        setProject(prev => ({ ...prev, [name]: value } as Partial<Project>));
    };

    const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
        setProject(prev => ({ ...prev, assigneeIds: selectedIds } as Partial<Project>));
    };
    
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const finalProject: Project = {
            id: project.id || '',
            title: project.title || 'New Project',
            description: project.description || '',
            assignerId: project.assignerId || currentUser.id,
            assigneeIds: project.assigneeIds || [],
            status: project.status || ProjectStatus.Active,
            transactionId: project.transactionId || undefined,
            dueDate: project.dueDate ? new Date(project.dueDate).toISOString() : undefined,
        };
        onSave(finalProject);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">{isNew ? t('addNewProject') : t('editProjectTitle')}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                            <XMarkIcon className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1">{t('projectTitle')}</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={project.title || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">{t('description')}</label>
                            <textarea
                                id="description"
                                name="description"
                                value={project.description || ''}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="assigneeIds" className="block text-sm font-medium text-slate-600 mb-1">{t('assignTo')}</label>
                            <select
                                id="assigneeIds"
                                name="assigneeIds"
                                multiple
                                value={project.assigneeIds || []}
                                onChange={handleAssigneeChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-32"
                            >
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">{t('multiSelectHelper')}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="relative">
                                <label htmlFor="transaction-search" className="block text-sm font-medium text-slate-600 mb-1">{t('linkToTransaction')}</label>
                                <input
                                    type="text"
                                    id="transaction-search"
                                    autoComplete="off"
                                    value={searchTerm || (project.transactionId ? transactions.find(t=>t.id === project.transactionId)?.description : '') || ''}
                                    onChange={(e) => { setSearchTerm(e.target.value); setDropdownVisible(true); }}
                                    onFocus={() => setDropdownVisible(true)}
                                    onBlur={() => setTimeout(() => setDropdownVisible(false), 200)}
                                    placeholder={t('searchTransactions')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                {isDropdownVisible && (
                                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        <li 
                                            className="px-3 py-2 cursor-pointer hover:bg-slate-100"
                                            onMouseDown={() => {
                                                setProject(prev => ({...prev, transactionId: undefined}));
                                                setSearchTerm('');
                                                setDropdownVisible(false);
                                            }}
                                        >
                                            {t('none')}
                                        </li>
                                        {filteredTransactions.map(t => (
                                            <li 
                                                key={t.id} 
                                                className="px-3 py-2 cursor-pointer hover:bg-slate-100"
                                                onMouseDown={() => {
                                                    setProject(prev => ({...prev, transactionId: t.id}));
                                                    setSearchTerm(t.description);
                                                    setDropdownVisible(false);
                                                }}
                                            >
                                                {t.description}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-slate-600 mb-1">{t('dueDateOptional')}</label>
                                <input
                                    type="date"
                                    id="dueDate"
                                    name="dueDate"
                                    value={project.dueDate?.split('T')[0] || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                     <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">{t('saveProject')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectModal;
