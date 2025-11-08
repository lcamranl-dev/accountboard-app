import React, { useState, FormEvent, useEffect } from 'react';
import { CompanyInfo } from '../../types';
import { CloudArrowDownIcon, CloudArrowUpIcon, ArrowDownTrayIcon } from '../icons/Icons';
import { useTranslations } from '../../contexts/LanguageContext';

interface SettingsProps {
    companyInfo: CompanyInfo;
    onSaveCompanyInfo: (info: CompanyInfo) => void;
    onBackup: () => void;
    onRestore: (backupFileContent: string) => void;
    onExportCustomers: () => void;
    onResetData: () => void;
    financialLockDate: string | null;
    onSetFinancialLockDate: (date: string | null) => void;
}

const Settings: React.FC<SettingsProps> = ({ companyInfo, onSaveCompanyInfo, onBackup, onRestore, onExportCustomers, onResetData, financialLockDate, onSetFinancialLockDate }) => {
    const { t } = useTranslations();
    const [info, setInfo] = useState(companyInfo);
    const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    const [newLockDate, setNewLockDate] = useState(financialLockDate || '');

    const confirmationPhrase = t('yesImSure');

    useEffect(() => {
        setInfo(companyInfo);
        setNewLockDate(financialLockDate || '');
    }, [companyInfo, financialLockDate]);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInfo(prev => ({...prev, [name]: value}));
    };

    const handleInfoSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSaveCompanyInfo(info);
        alert(t('settingsSaved'));
    };
    
    const handleRestoreFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    setRestoreFileContent(text);
                }
            };
            reader.readAsText(file);
        }
        event.target.value = ''; // Allow selecting the same file again
    };

    const confirmRestore = () => {
        if (restoreFileContent) {
            onRestore(restoreFileContent);
            setRestoreFileContent(null);
        }
    };

    const cancelRestore = () => {
        setRestoreFileContent(null);
    };

    const handleReset = () => {
        onResetData();
        setIsResetModalOpen(false);
        setResetConfirmationText('');
    };

    const handleLockDateSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSetFinancialLockDate(newLockDate);
        alert(t('settingsSaved'));
    };

    const handleUnlock = () => {
        onSetFinancialLockDate(null);
        setNewLockDate('');
        alert(t('settingsSaved'));
    };

    return (
    <>
        <div className="space-y-8">
            {/* Company Information Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-4">{t('companyInformation')}</h2>
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">{t('companyName')}</label>
                            <input type="text" name="name" id="name" value={info.name} onChange={handleInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="taxId" className="block text-sm font-medium text-slate-600 mb-1">{t('taxId')}</label>
                            <input type="text" name="taxId" id="taxId" value={info.taxId || ''} onChange={handleInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-600 mb-1">{t('address')}</label>
                        <input type="text" name="address" id="address" value={info.address} onChange={handleInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">{t('emailAddress')}</label>
                            <input type="email" name="email" id="email" value={info.email} onChange={handleInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-600 mb-1">{t('phoneNumber')}</label>
                            <input type="tel" name="phone" id="phone" value={info.phone} onChange={handleInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 pt-2">
                        {info.logoUrl && (
                            <img src={info.logoUrl} alt="Current Logo" className="h-12 bg-slate-100 p-1 rounded-md border" />
                        )}
                        <div className="flex-grow">
                            <label htmlFor="logoUrl" className="block text-sm font-medium text-slate-600 mb-1">{t('companyLogoUrl')}</label>
                            <input 
                                type="text" 
                                name="logoUrl" 
                                id="logoUrl" 
                                value={info.logoUrl || ''} 
                                onChange={handleInfoChange} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="https://example.com/logo.svg"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">{t('saveInformation')}</button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-4">{t('dataManagement')}</h2>
                <div className="space-y-6">
                    {/* Backup */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="md:col-span-2 space-y-1">
                            <h3 className="font-semibold text-slate-800">{t('backupData')}</h3>
                            <p className="text-sm text-slate-500">{t('backupDescription')}</p>
                        </div>
                        <div className="flex md:justify-end">
                            <button onClick={onBackup} className="w-full md:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50">
                                <CloudArrowDownIcon className="w-5 h-5" />
                                <span>{t('backupData')}</span>
                            </button>
                        </div>
                    </div>
                    {/* Restore */}
                    <hr className="border-slate-200" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                         <div className="md:col-span-2 space-y-1">
                            <h3 className="font-semibold text-slate-800">{t('restoreFromFile')}</h3>
                            <p className="text-sm text-slate-500"><span className="font-bold text-red-600">{t('restoreWarning')}</span> {t('restoreDescription')}</p>
                        </div>
                        <div className="flex md:justify-end">
                             <input type="file" id="restore-file" className="hidden" accept=".json" onChange={handleRestoreFileSelect} />
                            <label htmlFor="restore-file" className="w-full md:w-auto cursor-pointer inline-flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                                <CloudArrowUpIcon className="w-5 h-5" />
                                <span>{t('restoreFromFileButton')}</span>
                            </label>
                        </div>
                    </div>
                     {/* Customer Export */}
                    <hr className="border-slate-200" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="md:col-span-2 space-y-1">
                            <h3 className="font-semibold text-slate-800">{t('exportCustomers')}</h3>
                            <p className="text-sm text-slate-500">{t('exportCustomersDescription')}</p>
                        </div>
                        <div className="flex md:justify-end">
                            <button onClick={onExportCustomers} className="w-full md:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                <span>{t('exportCsv')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-4">{t('financialClosing')}</h2>
                <p className="text-sm text-slate-500 mb-4">{t('financialClosingDescription')}</p>
                {financialLockDate && <p className="mb-4 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm">{t('dataLockedUntil', { date: new Date(financialLockDate).toLocaleDateString() })}</p>}
                <form onSubmit={handleLockDateSubmit} className="flex items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="lockDate" className="block text-sm font-medium text-slate-600 mb-1">{t('lockDate')}</label>
                        <input type="date" id="lockDate" value={newLockDate} onChange={(e) => setNewLockDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow">{t('lockData')}</button>
                    {financialLockDate && <button type="button" onClick={handleUnlock} className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 shadow">{t('unlockData')}</button>}
                </form>
            </div>
            
            <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                <h2 className="text-xl font-bold text-red-800 mb-2">{t('dangerZone')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-2 space-y-1">
                        <h3 className="font-semibold text-slate-800">{t('resetAllData')}</h3>
                        <p className="text-sm text-red-600">{t('resetDataDescription')}</p>
                    </div>
                    <div className="flex md:justify-end">
                        <button onClick={() => setIsResetModalOpen(true)} className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
                            {t('resetAllData')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        {restoreFileContent && (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800">{t('confirmRestore')}</h3>
                        <p className="mt-2 text-slate-600">{t('confirmRestoreMessage')}</p>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button onClick={cancelRestore} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                        <button onClick={confirmRestore} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow">{t('yesRestoreData')}</button>
                    </div>
                </div>
            </div>
        )}
        {isResetModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800">{t('resetConfirmationTitle')}</h3>
                        <p className="mt-2 text-slate-600">{t('resetConfirmationMessage', { confirmationText: confirmationPhrase })}</p>
                        <input type="text" value={resetConfirmationText} onChange={(e) => setResetConfirmationText(e.target.value)} className="mt-4 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-xl">
                        <button onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">{t('cancel')}</button>
                        <button onClick={handleReset} disabled={resetConfirmationText !== confirmationPhrase} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow disabled:bg-red-300 disabled:cursor-not-allowed">{t('resetButtonText')}</button>
                    </div>
                </div>
            </div>
        )}
    </>
    );
};

export default Settings;
