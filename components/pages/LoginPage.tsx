
import React, { useState, FormEvent } from 'react';
import { Employee } from '../../types';
import { useTranslations } from '../../contexts/LanguageContext';

interface LoginPageProps {
    employees: Employee[];
    onLogin: (employee: Employee) => void;
    companyName: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ employees, onLogin, companyName }) => {
    const { t } = useTranslations();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string>('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const employee = employees.find(emp => emp.id === selectedEmployeeId);
        if (employee && employee.password === password) {
            onLogin(employee);
        } else {
            setError(t('invalidCredentials'));
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 font-sans">
            <div className="w-full max-w-sm mx-auto p-4">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-800">{companyName}</h1>
                        <p className="text-slate-500 mt-2">{t('selectUserToLogin')}</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="employee-select" className="block text-sm font-medium text-slate-700 mb-1">{t('user')}</label>
                            <select
                                id="employee-select"
                                value={selectedEmployeeId}
                                onChange={e => setSelectedEmployeeId(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {employees.map(employee => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
                             <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        
                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {t('login')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
