
import React, { useMemo } from 'react';
import MetricCard from '../MetricCard';
import RevenueChart from '../RevenueChart';
import RecentTransactions from '../RecentTransactions';
import { CashIcon, ChartBarIcon, CreditCardIcon, UserGroupIcon, WalletIcon, ArrowPathIcon } from '../icons/Icons';
import CashFlowChart from '../CashFlowChart';
import { Transaction, Employee, BankAccount, TransactionType, Currency, Customer } from '../../types';
import { useTranslations } from '../../contexts/LanguageContext';

interface DashboardProps {
  user: Employee;
  transactions: Transaction[]; // These are pre-filtered based on role
  allTransactions: Transaction[]; // All transactions for metric calculations
  accounts: BankAccount[];
  customers: Customer[];
}

const ManagerDashboard: React.FC<{ allTransactions: Transaction[], customers: Customer[] }> = ({ allTransactions, customers }) => {
  const { t, formatCurrency } = useTranslations();
  
  const { metrics, chartData } = useMemo(() => {
    const approvedTransactions = allTransactions.filter(t => t.approvalStatus !== 'Pending');

    // Metrics calculation
    const calculateMetrics = (txs: Transaction[]) => ({
      revenue: txs.filter(t => t.type === TransactionType.Income).reduce((sum, t) => sum + t.amount, 0),
      expenses: txs.filter(t => t.type === TransactionType.Expense).reduce((sum, t) => sum + t.amount, 0),
      activeClients: new Set(txs.filter(t => t.type === TransactionType.Income && t.customerId).map(t => t.customerId)).size,
    });
    
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const change = ((current - previous) / previous) * 100;
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthTxs = approvedTransactions.filter(t => new Date(t.date) >= currentMonthStart);
    const prevMonthTxs = approvedTransactions.filter(t => new Date(t.date) >= prevMonthStart && new Date(t.date) <= prevMonthEnd);

    // Fix: Calculate metrics and netProfit immutably to resolve TypeScript errors.
    const currentMetricsData = calculateMetrics(currentMonthTxs);
    const prevMetricsData = calculateMetrics(prevMonthTxs);
    
    const currentMetrics = { ...currentMetricsData, netProfit: currentMetricsData.revenue - currentMetricsData.expenses };
    const prevMetrics = { ...prevMetricsData, netProfit: prevMetricsData.revenue - prevMetricsData.expenses };
    
    // Chart data aggregation
    const monthlyData: { [key: string]: { revenue: number, expenses: number } } = {};
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' });

    approvedTransactions.forEach(t => {
      const monthKey = monthFormatter.format(new Date(t.date));
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }
      if (t.type === TransactionType.Income) monthlyData[monthKey].revenue += t.amount;
      else monthlyData[monthKey].expenses += t.amount;
    });

    const chartData = Object.entries(monthlyData)
      .map(([name, values]) => ({
        name,
        revenue: values.revenue,
        expenses: values.expenses,
        cashflow: values.revenue - values.expenses
      }))
      // A bit complex sort to get months in order
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
      .slice(-12); // Last 12 months

    return {
      metrics: {
        revenue: currentMetrics.revenue,
        revenueChange: calculateChange(currentMetrics.revenue, prevMetrics.revenue),
        expenses: currentMetrics.expenses,
        expensesChange: calculateChange(currentMetrics.expenses, prevMetrics.expenses),
        netProfit: currentMetrics.netProfit,
        netProfitChange: calculateChange(currentMetrics.netProfit, prevMetrics.netProfit),
        activeClients: customers.length, // Using total customers as active for now
        activeClientsChange: `+${currentMetrics.activeClients - prevMetrics.activeClients}`
      },
      chartData
    };

  }, [allTransactions, customers]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title={t('totalRevenue')}
          value={formatCurrency(metrics.revenue, Currency.TRY)}
          change={metrics.revenueChange}
          changeType={metrics.revenueChange.startsWith('+') ? "increase" : "decrease"}
          icon={<CashIcon className="w-8 h-8 text-green-500" />} 
        />
        <MetricCard 
          title={t('totalExpenses')}
          value={formatCurrency(metrics.expenses, Currency.TRY)}
          change={metrics.expensesChange}
          changeType={metrics.expensesChange.startsWith('+') ? "increase" : "decrease"}
          icon={<CreditCardIcon className="w-8 h-8 text-red-500" />} 
        />
        <MetricCard 
          title={t('netProfit')}
          value={formatCurrency(metrics.netProfit, Currency.TRY)}
          change={metrics.netProfitChange}
          changeType={metrics.netProfitChange.startsWith('+') ? "increase" : "decrease"}
          icon={<ChartBarIcon className="w-8 h-8 text-blue-500" />} 
        />
        <MetricCard 
          title={t('activeClients')}
          value={metrics.activeClients.toString()}
          change={metrics.activeClientsChange}
          changeType={metrics.activeClientsChange.startsWith('+') ? "increase" : "decrease"}
          icon={<UserGroupIcon className="w-8 h-8 text-indigo-500" />} 
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
        <div className="lg:col-span-3">
          <RevenueChart data={chartData} />
        </div>
        <div className="lg:col-span-2">
          <CashFlowChart data={chartData} />
        </div>
      </div>
      <RecentTransactions transactions={allTransactions} />
    </>
  );
};

const EmployeeDashboard: React.FC<DashboardProps> = ({ user, transactions, allTransactions, accounts }) => {
  const { t, formatCurrency } = useTranslations();
  const cashAccount = accounts.find(a => a.id === user.cashAccountId);
  
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const employeeCommissionThisMonth = allTransactions
    .filter(t =>
      t.type === TransactionType.Income &&
      t.approvalStatus !== 'Pending' &&
      new Date(t.date).getMonth() === thisMonth &&
      new Date(t.date).getFullYear() === thisYear
    )
    .flatMap(t => t.items || [])
    .filter(item => item.employeeId === user.id)
    .reduce((sum, item) => sum + item.commissionAmount, 0);


  const employeeTransactionsThisMonth = allTransactions
    .filter(t => {
      if (new Date(t.date).getMonth() !== thisMonth || new Date(t.date).getFullYear() !== thisYear) {
          return false;
      }
      if (t.type === TransactionType.Expense && t.employeeId === user.id) {
          return true;
      }
      if (t.type === TransactionType.Income && t.items?.some(item => item.employeeId === user.id)) {
          return true;
      }
      return false;
    }).length;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title={t('myCashBalance')}
          value={formatCurrency(cashAccount?.balance || 0, cashAccount?.currency || Currency.TRY)}
          change={t('updatedLive')}
          changeType="increase"
          icon={<WalletIcon className="w-8 h-8 text-green-500" />} 
        />
        <MetricCard 
          title={t('myOutstandingBalance')}
          value={formatCurrency(user.outstandingBalance, Currency.TRY)}
          change={user.outstandingBalance >= 0 ? t('youAreOwed') : t('youOwe')}
          changeType={user.outstandingBalance >= 0 ? "increase" : "decrease"}
          icon={<CreditCardIcon className="w-8 h-8 text-orange-500" />} 
        />
        <MetricCard 
          title={t('commissionEarnedMonth')}
          value={formatCurrency(employeeCommissionThisMonth, Currency.TRY)}
          change={t('thisMonth')}
          changeType="increase"
          icon={<ChartBarIcon className="w-8 h-8 text-blue-500" />} 
        />
        <MetricCard 
          title={t('transactionsMonth')}
          value={employeeTransactionsThisMonth.toString()}
          change={t('thisMonth')}
          changeType="increase"
          icon={<ArrowPathIcon className="w-8 h-8 text-indigo-500" />} 
        />
      </div>
      <RecentTransactions transactions={transactions} />
    </>
  );
};

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { user, allTransactions, customers } = props;

  if (user.role === 'Manager') {
    return <ManagerDashboard allTransactions={allTransactions} customers={customers} />;
  }

  return <EmployeeDashboard {...props} />;
};

export default Dashboard;
