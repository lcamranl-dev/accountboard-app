import React from 'react';
import { ChartPieIcon, CogIcon, HomeIcon, LogoutIcon, ArrowPathIcon, BriefcaseIcon, UserGroupIcon, UserIcon, BuildingLibraryIcon, ClipboardDocumentListIcon, DocumentTextIcon } from './icons/Icons';
import { Employee, NavItem, Project, ProjectStatus } from '../types';
import { useTranslations } from '../contexts/LanguageContext';

interface SidebarProps {
  activeItem: string;
  companyName: string;
  onItemClick: (item: string) => void;
  onLogout: () => void;
  user: Employee;
  isOpen: boolean;
  projects: Project[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, companyName, onItemClick, onLogout, user, isOpen, projects }) => {
  const { t, lang } = useTranslations();
  const hasUnfinishedProjects = user.role === 'Employee' && projects.some(p => p.status === ProjectStatus.Active && p.assigneeIds.includes(user.id));

  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: <HomeIcon className="w-6 h-6" /> },
    { name: 'Transactions', icon: <ArrowPathIcon className="w-6 h-6" /> },
    { name: 'Projects', icon: <ClipboardDocumentListIcon className="w-6 h-6" />, notification: hasUnfinishedProjects },
    { name: 'Services', icon: <BriefcaseIcon className="w-6 h-6" />, roles: ['Manager'] },
    { name: 'Customers', icon: <UserGroupIcon className="w-6 h-6" /> },
    { name: 'Collaborators', icon: <UserIcon className="w-6 h-6" />, roles: ['Manager'] },
    { name: 'Employees', icon: <UserIcon className="w-6 h-6" />, roles: ['Manager'] },
    { name: 'Accounts', icon: <BuildingLibraryIcon className="w-6 h-6" /> },
    { name: 'Reports', icon: <ChartPieIcon className="w-6 h-6" />, roles: ['Manager'] },
    { name: 'AuditLog', icon: <DocumentTextIcon className="w-6 h-6" />, roles: ['Manager'] },
    { name: 'Settings', icon: <CogIcon className="w-6 h-6" />, roles: ['Manager'] },
  ];
  
  const navTranslations: { [key: string]: string } = {
    Dashboard: t('dashboard'),
    Transactions: t('transactions'),
    Projects: t('projects'),
    Services: t('servicesAndExpenses'),
    Customers: t('customers'),
    Collaborators: t('collaborators'),
    Employees: t('employees'),
    Accounts: t('accounts'),
    Reports: t('reports'),
    Settings: t('settings'),
    AuditLog: t('auditLog'),
  };

  return (
    <aside className={`w-64 flex-shrink-0 bg-white border-e border-slate-200 flex flex-col
      fixed inset-y-0 z-30
      transform transition-transform duration-300 ease-in-out
      ltr:left-0 rtl:right-0
      ${isOpen ? 'translate-x-0' : (lang === 'fa' ? 'translate-x-full' : '-translate-x-full')}
      lg:static lg:transform-none lg:transition-none`}>
      <div className="h-16 flex items-center justify-center border-b border-slate-200 ps-4 pe-4">
        <h1 className="text-2xl font-bold text-slate-800 truncate">{companyName}</h1>
      </div>
      <nav className="flex-1 ps-4 pe-4 py-6 space-y-2">
        {navItems
          .filter(item => !item.roles || item.roles.includes(user.role))
          .map((item) => (
          <a
            key={item.name}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onItemClick(item.name);
            }}
            className={`flex items-center justify-between space-x-3 ps-4 pe-4 py-3 rounded-lg transition-colors duration-200 ${
              activeItem === item.name
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {item.icon}
              <span className="font-medium">{navTranslations[item.name]}</span>
            </div>
            {item.notification && (
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full"></span>
            )}
          </a>
        ))}
      </nav>
      <div className="ps-4 pe-4 py-6 border-t border-slate-200">
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onLogout();
            }}
            className="flex items-center space-x-3 rtl:space-x-reverse ps-4 pe-4 py-3 rounded-lg transition-colors duration-200 text-slate-600 hover:bg-slate-100"
        >
            <LogoutIcon className="w-6 h-6" />
            <span className="font-medium">{t('logout')}</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;