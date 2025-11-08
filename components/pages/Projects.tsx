import React, { useState, useMemo } from 'react';
import { Project, Employee, Transaction, ProjectStatus } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '../icons/Icons';
import ProjectModal from './ProjectModal';
import { useTranslations } from '../../contexts/LanguageContext';

interface ProjectsProps {
    projects: Project[];
    employees: Employee[];
    transactions: Transaction[];
    currentUser: Employee;
    onSave: (project: Project) => void;
    onComplete: (projectId: string) => void;
    onDelete: (projectId: string) => void;
    onViewInvoice: (transaction: Transaction) => void;
}

const ProjectCard: React.FC<{ 
    project: Project; 
    employees: Employee[]; 
    transaction: Transaction | undefined; 
    onComplete: (id: string) => void; 
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
    canComplete: boolean;
    onViewInvoice: (transaction: Transaction) => void;
}> = ({ project, employees, transaction, onComplete, onEdit, onDelete, canComplete, onViewInvoice }) => {
    const { t } = useTranslations();
    const assigner = employees.find(e => e.id === project.assignerId);
    const assignees = project.assigneeIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
                 <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-slate-800 pr-2">{project.title}</h3>
                    {project.status === ProjectStatus.Active && (
                        <div className="flex items-center space-x-1 flex-shrink-0">
                            <button onClick={() => onEdit(project)} className="p-1 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100" aria-label={t('editProject')}>
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDelete(project)} className="p-1 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100" aria-label={t('deleteProject')}>
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{project.description}</p>
            </div>
            <div className="space-y-3 pt-3 border-t border-slate-100">
                {project.dueDate && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{t('dueDateColon')}</span>
                        <span className="font-medium text-slate-700">{new Date(project.dueDate).toLocaleDateString()}</span>
                    </div>
                )}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{t('assignedBy')}</span>
                    <span className="font-medium text-slate-700">{assigner?.name || 'Unknown'}</span>
                </div>
                 <div className="flex items-start justify-between text-sm">
                    <span className="text-slate-500">{t('assignedTo')}</span>
                     <span className="font-medium text-slate-700 text-right">{assignees.map(e => e.name).join(', ')}</span>
                </div>
                {transaction && (
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{t('linkedTxn')}</span>
                        <button
                            onClick={() => onViewInvoice(transaction)}
                            className="font-medium text-blue-600 hover:underline truncate text-right" title={transaction.description}>
                            {transaction.description}
                        </button>
                    </div>
                )}
            </div>
            {project.status === ProjectStatus.Active && canComplete && (
                <button
                    onClick={() => onComplete(project.id)}
                    className="w-full mt-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                    {t('markAsDone')}
                </button>
            )}
        </div>
    );
};


const Projects: React.FC<ProjectsProps> = ({ projects, employees, transactions, currentUser, onSave, onComplete, onDelete, onViewInvoice }) => {
    const { t } = useTranslations();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'finished'>('active');
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);

    const visibleProjects = useMemo(() => {
        if (currentUser.role === 'Manager') {
            return projects;
        }
        return projects.filter(p => p.assignerId === currentUser.id || p.assigneeIds.includes(currentUser.id));
    }, [projects, currentUser]);

    const activeProjects = visibleProjects.filter(p => p.status === ProjectStatus.Active);
    const finishedProjects = visibleProjects.filter(p => p.status === ProjectStatus.Finished);

    const handleAddNew = () => {
        setEditingProject({
            title: '',
            description: '',
            assignerId: currentUser.id,
            assigneeIds: [],
            status: ProjectStatus.Active,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleDelete = (project: Project) => {
        setDeletingProject(project);
    };

    const confirmDelete = () => {
        if (deletingProject) {
            onDelete(deletingProject.id);
            setDeletingProject(null);
        }
    };

    const cancelDelete = () => {
        setDeletingProject(null);
    };

    const handleSave = (project: Project) => {
        onSave(project);
        setIsModalOpen(false);
        setEditingProject(null);
    };
    
    return (
        <>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{t('projectsTitle')}</h2>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>{t('addProject')}</span>
                </button>
            </div>
            
            <div className="mb-6 border-b border-slate-200">
                <nav className="-mb-px flex space-x-6 rtl:space-x-reverse">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        {t('activeProjects')}
                    </button>
                    {currentUser.role === 'Manager' && (
                        <button
                           onClick={() => setActiveTab('finished')}
                           className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'finished' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            {t('finishedProjects')}
                        </button>
                    )}
                </nav>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(activeTab === 'active' ? activeProjects : finishedProjects).map(p => {
                    const transaction = transactions.find(t => t.id === p.transactionId);
                    const canComplete = currentUser.role === 'Manager' || p.assignerId === currentUser.id || p.assigneeIds.includes(currentUser.id);
                    return <ProjectCard 
                                key={p.id} 
                                project={p} 
                                employees={employees} 
                                transaction={transaction} 
                                onComplete={onComplete}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                canComplete={canComplete}
                                onViewInvoice={onViewInvoice}
                            />
                })}
            </div>

            {isModalOpen && (
                <ProjectModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    projectToEdit={editingProject}
                    employees={employees}
                    transactions={transactions}
                    currentUser={currentUser}
                />
            )}

            {deletingProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800">{t('confirmDeletion')}</h3>
                            <p className="mt-2 text-slate-600">
                                {t('confirmDeleteProject', { title: deletingProject.title })}
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                            <button onClick={cancelDelete} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow">{t('deleteProject')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Projects;
