import React from 'react';
import { AuditLog } from '../../types';
import { useTranslations } from '../../contexts/LanguageContext';

interface AuditLogPageProps {
    logs: AuditLog[];
}

const AuditLogPage: React.FC<AuditLogPageProps> = ({ logs }) => {
    const { t } = useTranslations();

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString(t('langCode'), {
            dateStyle: 'medium',
            timeStyle: 'medium',
        });
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('auditLog')}</h2>
            <div className="overflow-x-auto max-h-[70vh] rounded-lg border">
                <table className="w-full text-sm text-start text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('timestamp')}</th>
                            <th scope="col" className="px-6 py-3">{t('user')}</th>
                            <th scope="col" className="px-6 py-3">{t('action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {logs.map(log => (
                            <tr key={log.id} className="bg-white hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                                <td className="px-6 py-4 font-medium text-slate-900">{log.userName}</td>
                                <td className="px-6 py-4">{log.action}</td>
                            </tr>
                        ))}
                         {logs.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-center py-10 text-slate-500">
                                    No audit log entries found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogPage;
