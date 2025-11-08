import React, { useState, useMemo } from 'react';
import { Transaction, Employee, Customer, TransactionType, Service, Currency } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { CashIcon, CreditCardIcon, ChartBarIcon, ChartPieIcon, ArrowDownTrayIcon } from '../icons/Icons';
import { useTranslations } from '../../contexts/LanguageContext';

interface ReportsProps {
    transactions: Transaction[];
    employees: Employee[];
    customers: Customer[];
    services: Service[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4f', '#f5222d', '#faad14', '#13c2c2', '#52c41a'];

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-full">
                {icon}
            </div>
        </div>
    </div>
);

const CustomPieChart: React.FC<{ data: { name: string, value: number }[], title: string }> = ({ data, title }) => {
    const { formatCurrency, t } = useTranslations();
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
            {data.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            {/* FIX: Handled potentially undefined 'percent' prop to prevent type errors during arithmetic operations. */}
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label={({ percent }) => `${(typeof percent === 'number' ? percent * 100 : 0).toFixed(0)}%`}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value, Currency.TRY)} />
                            <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">{t('noDataAvailable')}</div>
            )}
        </div>
    );
}


const Reports: React.FC<ReportsProps> = ({ transactions, employees, customers, services }) => {
    const { t, lang, formatCurrency } = useTranslations();
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (t.approvalStatus === 'Pending') return false; // Exclude pending transactions from reports
            const transactionDate = new Date(t.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the whole end day
            return transactionDate >= start && transactionDate <= end;
        });
    }, [transactions, startDate, endDate]);
    
    const reportData = useMemo(() => {
        const totalIncome = filteredTransactions
            .filter(t => t.type === TransactionType.Income)
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = filteredTransactions
            .filter(t => t.type === TransactionType.Expense)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const commissionByEmployee = employees.map(employee => {
            const commission = filteredTransactions
                .filter(t => t.type === TransactionType.Income)
                .flatMap(t => t.items || [])
                .filter(item => item.employeeId === employee.id)
                .reduce((sum, item) => sum + item.commissionAmount, 0);
            return { name: employee.name, value: commission };
        }).filter(e => e.value > 0);

        const totalCommissions = commissionByEmployee.reduce((sum, e) => sum + e.value, 0);
        const netProfit = totalIncome - totalExpenses;

        const incomeByService = filteredTransactions
            .filter(t => t.type === TransactionType.Income)
            .flatMap(t => t.items || [])
            .reduce((acc, item) => {
                const serviceName = services.find(s => s.id === item.serviceId)?.name[lang] || t('other');
                acc[serviceName] = (acc[serviceName] || 0) + item.subtotal;
                return acc;
            }, {} as Record<string, number>);
        
        const expensesByCategory = filteredTransactions
            .filter(t => t.type === TransactionType.Expense)
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

        return {
            totalIncome,
            totalExpenses,
            netProfit,
            totalCommissions,
            commissionByEmployee,
            incomeVsExpenseData: [ { name: t('financials'), income: totalIncome, expenses: totalExpenses } ],
            incomeByServiceData: Object.entries(incomeByService).map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a,b) => b.value - a.value),
            expensesByCategoryData: Object.entries(expensesByCategory).map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a,b) => b.value - a.value)
        };
    }, [filteredTransactions, employees, services, lang, t]);

    const detailedLog = useMemo(() => {
        return filteredTransactions.filter(t =>
            t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.internalNotes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customers.find(c => c.id === t.customerId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [filteredTransactions, searchTerm, customers]);

    const handleExportCsv = () => {
        const headers = ['Date', 'Type', 'Description', 'Internal Notes', 'Customer', 'Category', 'Amount (TRY)', 'Employee(s)'];
        const rows = detailedLog.map(txn => {
            const customerName = txn.customerId ? customers.find(c => c.id === txn.customerId)?.name || '' : '';
            const employeeNames = txn.items ? 
                [...new Set(txn.items.map(item => employees.find(e => e.id === item.employeeId)?.name || ''))].join('; ') : 
                (txn.employeeId ? employees.find(e => e.id === txn.employeeId)?.name || '' : '');
            
            const rowData = [
                new Date(txn.date).toLocaleDateString('en-CA'),
                txn.type,
                txn.description,
                txn.internalNotes || '',
                customerName,
                txn.category,
                txn.amount.toString(),
                employeeNames,
            ];

            return rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `report-${startDate}-to-${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            {/* Header and Date Filter */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{t('financialReports')}</h2>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white p-2 rounded-lg border">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-1 border-e" />
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-1" />
                    </div>
                     <button onClick={handleExportCsv} className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">{t('exportCsv')}</span>
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('totalIncome')} value={formatCurrency(reportData.totalIncome, Currency.TRY)} icon={<CashIcon className="w-8 h-8 text-green-500" />} />
                <StatCard title={t('totalExpenses')} value={formatCurrency(reportData.totalExpenses, Currency.TRY)} icon={<CreditCardIcon className="w-8 h-8 text-red-500" />} />
                <StatCard title={t('totalCommissions')} value={formatCurrency(reportData.totalCommissions, Currency.TRY)} icon={<ChartPieIcon className="w-8 h-8 text-orange-500" />} />
                <StatCard title={t('netProfit')} value={formatCurrency(reportData.netProfit, Currency.TRY)} icon={<ChartBarIcon className="w-8 h-8 text-blue-500" />} />
            </div>
            
            {/* Category Breakdown */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CustomPieChart data={reportData.incomeByServiceData} title={t('incomeByService')} />
                <CustomPieChart data={reportData.expensesByCategoryData} title={t('expensesByCategory')} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('commissionDistribution')}</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                {/* FIX: Handled potentially undefined 'percent' prop to prevent type errors during arithmetic operations. */}
                                <Pie data={reportData.commissionByEmployee} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label={({ name, percent }) => `${name} ${(typeof percent === 'number' ? percent * 100 : 0).toFixed(0)}%`}>
                                    {reportData.commissionByEmployee.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value, Currency.TRY)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('revenueVsExpenses')}</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                             <BarChart data={reportData.incomeVsExpenseData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                {/* FIX: Added a type check for 'value' to ensure it's a number before performing arithmetic operations. */}
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => (typeof value === 'number' && isFinite(value) ? `${formatCurrency(value / 1000, Currency.TRY).replace('₺', '')}k` : String(value))} />
                                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} formatter={(value: number) => formatCurrency(value, Currency.TRY)} />
                                <Legend iconType="circle" iconSize={8} />
                                <Bar dataKey="income" fill="#22c55e" name={t('income')} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" fill="#ef4444" name={t('expense')} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Transaction Log */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">{t('detailedLog')}</h3>
                    <input type="text" placeholder={t('searchLog')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md shadow-sm w-64" />
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-start text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('date')}</th>
                                <th scope="col" className="px-6 py-3">{t('description')}</th>
                                <th scope="col" className="px-6 py-3 hidden sm:table-cell">{t('type')}</th>
                                <th scope="col" className="px-6 py-3 hidden md:table-cell">{t('customerCategory')}</th>
                                <th scope="col" className="px-6 py-3 text-end">{t('amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detailedLog.map(txn => (
                                <tr key={txn.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">{new Date(txn.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{txn.description}</td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            txn.type === TransactionType.Income ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>{txn.type === TransactionType.Income ? t('income') : t('expense')}</span>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">{txn.type === TransactionType.Income ? customers.find(c => c.id === txn.customerId)?.name || t('na') : txn.category}</td>
                                    <td className={`px-6 py-4 text-end font-medium ${txn.type === TransactionType.Income ? 'text-green-600' : 'text-red-700'}`}>
                                        {formatCurrency(txn.amount, Currency.TRY)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;