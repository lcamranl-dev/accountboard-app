import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, BellIcon, MenuIcon } from './icons/Icons';
import { Employee, Notification } from '../../types';
import { useTranslations, Language } from '../contexts/LanguageContext';

interface HeaderProps {
  activePage: string;
  user: Employee;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  onMenuClick: () => void;
}

const LanguageSwitcher: React.FC = () => {
    const { lang, setLang } = useTranslations();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages: { code: Language, name: string }[] = [
        { code: 'en', name: 'English' },
        { code: 'tr', name: 'Türkçe' },
        { code: 'fa', name: 'فارسی' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (code: Language) => {
        setLang(code);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-1 p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <span className="text-sm font-medium text-slate-600">{languages.find(l => l.code === lang)?.name}</span>
                 <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute end-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-200 z-10">
                    <ul className="py-1">
                        {languages.map(l => (
                            <li key={l.code}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSelect(l.code); }}
                                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    {l.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ activePage, user, searchTerm, onSearchChange, notifications, onMarkNotificationsRead, onMenuClick }) => {
    const { t } = useTranslations();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return t("justNow");
        let interval = seconds / 31536000;
        if (interval > 1) return t('yearsAgo', { count: Math.floor(interval) });
        interval = seconds / 2592000;
        if (interval > 1) return t('monthsAgo', { count: Math.floor(interval) });
        interval = seconds / 86400;
        if (interval > 1) return t('daysAgo', { count: Math.floor(interval) });
        interval = seconds / 3600;
        if (interval > 1) return t('hoursAgo', { count: Math.floor(interval) });
        interval = seconds / 60;
        if (interval > 1) return t('minutesAgo', { count: Math.floor(interval) });
        return t('secondsAgo', { count: Math.floor(seconds) });
    };

    const handleToggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
        if (!isDropdownOpen && unreadCount > 0) {
            onMarkNotificationsRead();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const pageTitles: { [key: string]: string } = {
        Dashboard: t('dashboard'), Transactions: t('transactions'), Projects: t('projects'), Services: t('services'),
        Customers: t('customers'), Employees: t('employees'), Accounts: t('accounts'), Reports: t('reports'), Settings: t('settings'), AuditLog: t('auditLog'),
    };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="lg:hidden me-3 p-1 text-slate-500 hover:text-slate-800"
          aria-label={t('openMenu')}
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold text-slate-800 whitespace-nowrap">{pageTitles[activePage] || activePage}</h2>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
        {user.role === 'Manager' && (
            <>
                <div className="relative hidden md:block">
                    <SearchIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('searchTransactions')}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="ps-10 pe-4 py-2 w-48 lg:w-64 bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                </div>
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={handleToggleDropdown}
                        className="relative p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <BellIcon className="w-6 h-6 text-slate-500" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 end-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                        )}
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute end-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-10">
                            <div className="p-4 border-b">
                                <h4 className="font-semibold text-slate-800">{t('notifications')}</h4>
                            </div>
                            <ul className="py-2 max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(notif => (
                                    <li key={notif.id} className="px-4 py-3 hover:bg-slate-50 border-b last:border-b-0">
                                        <p className="text-sm text-slate-700">{notif.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">{timeAgo(notif.timestamp)}</p>
                                    </li>
                                )) : (
                                    <li className="px-4 py-6 text-center text-sm text-slate-500">{t('noNewNotifications')}</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </>
        )}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
             <LanguageSwitcher />
            <img
                src={user.avatarUrl}
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
            />
            <div className="hidden sm:block">
                <p className="font-semibold text-sm text-slate-700">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;