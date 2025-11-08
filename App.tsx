
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/pages/Dashboard';
import Reports from './components/pages/Reports';
import Settings from './components/pages/Settings';
import Accounts from './components/pages/Accounts';
import Transactions from './components/pages/Transactions';
import Services from './components/pages/Services';
import Customers from './components/pages/Customers';
import Employees from './components/pages/Employees';
import Projects from './components/pages/Projects';
import LoginPage from './components/pages/LoginPage';
import InvoiceModal from './components/pages/InvoiceModal';
import AuditLogPage from './components/pages/AuditLogPage';
import Collaborators from './components/pages/Collaborators';
import { AccountType, BankAccount, Currency, Employee, Service, Transaction, TransactionType, Customer, CompanyInfo, ExpenseCategory, Notification, BackupData, Project, ProjectStatus, Language, AuditLog, Collaborator } from './types';
import { useTranslations } from './contexts/LanguageContext';

const initialAccounts: BankAccount[] = [
  { id: 'acc001', name: 'Main Business Lira Account', type: AccountType.Bank, currency: Currency.TRY, balance: 152340.75, accountNumber: 'TR...5001' },
  { id: 'acc002', name: 'Company USD Account', type: AccountType.Bank, currency: Currency.USD, balance: 25450.00, accountNumber: 'TR...3012' },
  { id: 'acc003', name: 'Company EUR Account', type: AccountType.Bank, currency: Currency.EUR, balance: 18200.50, accountNumber: 'TR...3013' },
  { id: 'acc004', name: 'Petty Cash Fund', type: AccountType.Cash, currency: Currency.TRY, balance: 1250.00 },
  { id: 'acc_kamran', name: "Kamran's Cash Wallet", type: AccountType.Cash, currency: Currency.TRY, balance: 0, owner: 'Kamran' },
  { id: 'acc_reza', name: "Reza's Cash Wallet", type: AccountType.Cash, currency: Currency.TRY, balance: 350.50, owner: 'Reza' },
  { id: 'acc_linda', name: "Linda's Cash Wallet", type: AccountType.Cash, currency: Currency.TRY, balance: 125.00, owner: 'Linda' },
];

const initialEmployees: Employee[] = [
  { id: 'emp001', name: 'Kamran', role: 'Manager', avatarUrl: 'https://picsum.photos/seed/kamran/40/40', defaultCommissionRate: 0, monthlySalary: 15000, salaryDueDate: '28th of each month', outstandingBalance: 0, cashAccountId: 'acc_kamran', defaultLanguage: 'en', password: 'password123' },
  { id: 'emp002', name: 'Reza', role: 'Employee', avatarUrl: 'https://picsum.photos/seed/reza/40/40', defaultCommissionRate: 20, monthlySalary: 7000, salaryDueDate: '28th of each month', outstandingBalance: -500.00, cashAccountId: 'acc_reza', defaultLanguage: 'fa', password: 'password123' },
  { id: 'emp003', name: 'Linda', role: 'Employee', avatarUrl: 'https://picsum.photos/seed/linda/40/40', defaultCommissionRate: 25, monthlySalary: 7000, salaryDueDate: '28th of each month', outstandingBalance: 1200.00, cashAccountId: 'acc_linda', defaultLanguage: 'tr', password: 'password123' },
];

const initialCollaborators: Collaborator[] = [
  { id: 'col001', name: 'Ahmad Karimi', type: 'Broker', outstandingBalance: 0 },
  { id: 'col002', name: 'Sara Yilmaz', type: 'Translator', outstandingBalance: 250 },
  { id: 'col003', name: 'Babak Tehrani', type: 'Broker', outstandingBalance: -100 },
];

const initialTransactions: Transaction[] = [
    {
      id: 'txn001',
      date: '2023-07-15T10:00:00Z',
      description: 'Web Design Project for Client X',
      amount: 15600.00,
      type: TransactionType.Income,
      category: 'Service Revenue',
      customerId: 'cus001',
      paymentStatus: 'Paid',
      approvalStatus: 'Approved',
      internalNotes: 'Initial project kick-off. High priority client.',
      items: [{ id: 'item_1_1', serviceId: 'srv001', description: 'Web Design Project', subtotal: 15600, legalCosts: 0, vatRate: 0, vatAmount: 0, employeeId: 'emp001', commissionRate: 0, commissionAmount: 0 }],
      payments: [{ id: 'pay_1_1', date: '2023-07-15T10:00:00Z', amount: 15600, accountId: 'acc001' }]
    },
    { id: 'txn002', date: '2023-07-12T14:30:00Z', description: 'Monthly Hosting Fees', amount: 135.00, type: TransactionType.Expense, category: 'Software & Subscriptions', accountId: 'acc002', internalNotes: 'Paid via company USD card.', approvalStatus: 'Approved' },
    { id: 'txn003', date: '2023-07-10T11:00:00Z', description: 'Office Supplies Purchase', amount: 452.25, type: TransactionType.Expense, category: 'Office Supplies', accountId: 'acc004', approvalStatus: 'Approved' },
    {
      id: 'txn004',
      date: '2023-07-18T09:00:00Z',
      description: 'Residence Registration for Global Tech Inc.',
      amount: 1800,
      type: TransactionType.Income,
      category: 'Service Revenue',
      customerId: 'cus002',
      paymentStatus: 'Paid',
      approvalStatus: 'Approved',
      items: [{ id: 'item_4_1', serviceId: 'srv004', description: 'Residence Registration for Global Tech Inc.', subtotal: 1200, legalCosts: 300, vatRate: 20, vatAmount: 300, employeeId: 'emp002', commissionRate: 20, commissionAmount: 240 }],
      payments: [{ id: 'pay_4_1', date: '2023-07-18T09:00:00Z', amount: 1800, accountId: 'acc001' }]
    },
    {
      id: 'txn005',
      date: '2023-07-19T14:00:00Z',
      description: 'Marriage Registration for Client X',
      amount: 7800,
      type: TransactionType.Income,
      category: 'Service Revenue',
      customerId: 'cus001',
      paymentStatus: 'Paid',
      approvalStatus: 'Approved',
      items: [{ id: 'item_5_1', serviceId: 'srv003', description: 'Marriage Registration for Client X', subtotal: 5000, legalCosts: 1500, vatRate: 20, vatAmount: 1300, employeeId: 'emp003', commissionRate: 25, commissionAmount: 1250, collaboratorId: 'col001', collaboratorFee: 500 }],
      payments: [{ id: 'pay_5_1', date: '2023-07-19T14:00:00Z', amount: 7800, accountId: 'acc001' }]
    },
];

const initialServices: Service[] = [
  { id: 'srv001', name: { fa: 'تایید ترجمه ایرانی', en: 'Iranian Translation Approval', tr: 'İran Tercüme Onayı' }, defaultPrice: 150, legalCosts: 50 },
  { id: 'srv002', name: { fa: 'تایید مدارک ترک', en: 'Turkish Document Approval', tr: 'Türk Belge Onayı' }, defaultPrice: 200, legalCosts: 75 },
  { id: 'srv003', name: { fa: 'ثبت ازدواج', en: 'Marriage Registration', tr: 'Evlilik Tescili' }, defaultPrice: 5000, legalCosts: 1500 },
  { id: 'srv004', name: { fa: 'ثبت نام اقامت', en: 'Residence Registration', tr: 'İkamet Kaydı' }, defaultPrice: 1200, legalCosts: 300 },
  { id: 'srv005', name: { fa: 'کپی برابر اصل', en: 'Certified Copy', tr: 'Noter Tasdikli Kopya' }, defaultPrice: 100, legalCosts: 40 },
  { id: 'srv006', name: { fa: 'سامانه میخک', en: 'Mikhak System', tr: 'Mihak Sistemi' }, defaultPrice: 250, legalCosts: 0 },
  { id: 'srv007', name: { fa: 'بیمه اقامتی', en: 'Residence Insurance', tr: 'İkamet Sigortası' }, defaultPrice: 800, legalCosts: 100 },
  { id: 'srv008', name: { fa: 'ترجمه نوتری', en: 'Notarized Translation', tr: 'Noterli Tercüme' }, defaultPrice: 300, legalCosts: 120 },
  { id: 'srv009', name: { fa: 'ترجمه حضوری', en: 'In-person Translation', tr: 'Sözlü Tercüme' }, defaultPrice: 1000, legalCosts: 0 },
  { id: 'srv010', name: { fa: 'ترجمه گذرنامه', en: 'Passport Translation', tr: 'Pasaport Tercümesi' }, defaultPrice: 150, legalCosts: 60 },
  { id: 'srv011', name: { fa: 'ترجمه بدون نوتر', en: 'Translation without Notary', tr: 'Notersiz Tercüme' }, defaultPrice: 120, legalCosts: 0 },
  { id: 'srv012', name: { fa: 'ویزای الکترونیک', en: 'Electronic Visa', tr: 'Elektronik Vize' }, defaultPrice: 600, legalCosts: 50 },
  { id: 'srv013', name: { fa: 'فتوکپی', en: 'Photocopy', tr: 'Fotokopi' }, defaultPrice: 2, legalCosts: 0 },
  { id: 'srv014', name: { fa: 'عکس پرسنلی', en: 'ID Photo', tr: 'Vesikalık Fotoğraf' }, defaultPrice: 50, legalCosts: 0 },
  { id: 'srv015', name: { fa: 'تایپ متنی', en: 'Text Typing', tr: 'Metin Yazma' }, defaultPrice: 20, legalCosts: 0 },
];

const initialCustomers: Customer[] = [
  { id: 'cus001', name: 'Client X Solutions', email: 'contact@clientx.com', phone: '+90 555 123 4567' },
  { id: 'cus002', name: 'Global Tech Inc.', email: 'info@globaltech.net', phone: '+1 415 555 8901' },
  { id: 'cus003', name: 'Innovate Group', email: 'hello@innovate.co', phone: '+44 20 7946 0123' },
];

const initialCompanyInfo: CompanyInfo = {
  name: 'Acme Inc.',
  address: '123 Business Rd, Suite 100, Istanbul, Turkey',
  email: 'contact@acmeinc.com',
  phone: '+90 212 555 1234',
  taxId: 'TR1234567890',
  logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=blue&shade=600'
};

const initialExpenseCategories: ExpenseCategory[] = [
    { id: 'exp_cat_1', name: { en: 'Office Supplies', tr: 'Ofis Malzemeleri', fa: 'لوازم اداری' }, defaultValue: 100 },
    { id: 'exp_cat_2', name: { en: 'Software & Subscriptions', tr: 'Yazılım ve Abonelikler', fa: 'نرم افزار و اشتراک' } },
    { id: 'exp_cat_3', name: { en: 'Travel', tr: 'Seyahat', fa: 'سفر' } },
    { id: 'exp_cat_4', name: { en: 'Utilities', tr: 'Hizmetler', fa: 'خدمات رفاهی' } },
    { id: 'exp_cat_5', name: { en: 'Salary', tr: 'Maaş', fa: 'حقوق' } },
];

const initialNotifications: Notification[] = [
    { id: 'notif1', message: 'Reza added a new income transaction for Global Tech Inc.', timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), isRead: true },
    { id: 'notif2', message: 'Linda submitted an expense for Office Supplies.', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), isRead: true },
    { id: 'notif3', message: 'Reza added a payment for a client.', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), isRead: false },
];

const initialProjects: Project[] = [
  {
    id: 'proj001',
    title: 'Prepare Q3 Financial Summary',
    description: 'Compile all income and expense data for the third quarter and create a summary report for the management meeting.',
    assignerId: 'emp001', // Kamran (Manager)
    assigneeIds: ['emp002'], // Reza
    status: ProjectStatus.Active,
    transactionId: 'txn001',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  },
  {
    id: 'proj002',
    title: 'Follow up with Innovate Group',
    description: 'Contact Innovate Group regarding their outstanding payment and see if they need any further services.',
    assignerId: 'emp001', // Kamran (Manager)
    assigneeIds: ['emp003'], // Linda
    status: ProjectStatus.Active,
  },
  {
    id: 'proj003',
    title: 'Finalize Documentation for Client X',
    description: 'All legal documents for the marriage registration must be double-checked and filed by the end of the week.',
    assignerId: 'emp003', // Linda
    assigneeIds: ['emp002'], // Reza
    status: ProjectStatus.Finished,
    dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
  },
];

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('Dashboard');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(initialCollaborators);
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewingInvoiceTransaction, setViewingInvoiceTransaction] = useState<Transaction | null>(null);
  const [financialLockDate, setFinancialLockDate] = useState<string | null>(null);
  const { setLang, lang } = useTranslations();

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function to restore scroll on component unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);

  const logAction = (action: string, user: Employee | null = currentUser) => {
    if (!user) return;
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      action: action,
    };
    setAuditLog(prev => [newLog, ...prev]);
  };

  const handleLogin = (employee: Employee) => {
    setCurrentUser(employee);
    if (employee.defaultLanguage) {
        setLang(employee.defaultLanguage);
    }
    setActivePage('Dashboard');
    logAction('Logged in', employee);
  };

  const handleLogout = () => {
    logAction('Logged out');
    setCurrentUser(null);
  };

  const handleSaveEmployee = (employeeToSave: Employee) => {
      const existingEmployee = employees.find(e => e.id === employeeToSave.id);
      if (existingEmployee) {
          const updatedEmployee = {
              ...employeeToSave,
              // Keep old password if the new one is blank
              password: employeeToSave.password ? employeeToSave.password : existingEmployee.password,
          };
          setEmployees(employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
          logAction(`Updated details for employee: ${updatedEmployee.name}`);
      } else {
          const newEmployee = { ...employeeToSave, id: `emp${Date.now()}`, avatarUrl: employeeToSave.avatarUrl || `https://picsum.photos/seed/${employeeToSave.name}/40/40` };
          setEmployees([...employees, newEmployee]);
          logAction(`Created new employee: ${newEmployee.name}`);
      }
  };

  const handleMakePayment = (payment: { employeeId: string; amount: number; sourceAccountId: string; description: string; category: string; }) => {
    // 1. Update source account balance
    setAccounts(prevAccounts =>
        prevAccounts.map(acc =>
            acc.id === payment.sourceAccountId ? { ...acc, balance: acc.balance - payment.amount } : acc
        )
    );

    // 2. Update employee outstanding balance
    setEmployees(prevEmployees =>
        prevEmployees.map(emp =>
            emp.id === payment.employeeId ? { ...emp, outstandingBalance: emp.outstandingBalance - payment.amount } : emp
        )
    );

    // 3. Create a new transaction record
    const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        date: new Date().toISOString(),
        description: payment.description,
        amount: payment.amount,
        type: TransactionType.Expense,
        category: payment.category,
        accountId: payment.sourceAccountId,
        employeeId: payment.employeeId,
        approvalStatus: 'Approved', // Payments are manager-only actions and are auto-approved
    };
    setTransactions(prevTransactions => [newTransaction, ...prevTransactions]);
    logAction(`Made payment of ${payment.amount} for: ${payment.description}`);
  };

  const handleSaveService = (serviceToSave: Service) => {
    if (serviceToSave.id) {
        setServices(services.map(s => s.id === serviceToSave.id ? serviceToSave : s));
        logAction(`Updated service: ${serviceToSave.name[lang]}`);
    } else {
        const newService = { ...serviceToSave, id: `srv${Date.now()}` };
        setServices([newService, ...services]);
        logAction(`Created service: ${newService.name[lang]}`);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    setServices(services.filter(s => s.id !== serviceId));
    if (service) logAction(`Deleted service: ${service.name[lang]}`);
  };

  const handleSaveCustomer = (customerToSave: Customer) => {
    if (customerToSave.id) {
        setCustomers(customers.map(c => c.id === customerToSave.id ? customerToSave : c));
        logAction(`Updated customer: ${customerToSave.name}`);
    } else {
        const newCustomer = { ...customerToSave, id: `cus${Date.now()}` };
        setCustomers([newCustomer, ...customers]);
        logAction(`Created customer: ${newCustomer.name}`);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setCustomers(customers.filter(c => c.id !== customerId));
    if (customer) logAction(`Deleted customer: ${customer.name}`);
  };
  
  const applyTransactionFinancials = (transaction: Transaction) => {
    if (transaction.type === TransactionType.Income) {
        if (transaction.payments) {
            const paymentUpdates = new Map<string, number>();
            transaction.payments.forEach(p => paymentUpdates.set(p.accountId, (paymentUpdates.get(p.accountId) || 0) + p.amount));
            setAccounts(prev => prev.map(acc => paymentUpdates.has(acc.id) ? { ...acc, balance: acc.balance + (paymentUpdates.get(acc.id) || 0) } : acc));
        }

        if (transaction.items) {
            const commissionUpdates = new Map<string, number>();
            const collaboratorFeeUpdates = new Map<string, number>();
            transaction.items.forEach(item => {
                commissionUpdates.set(item.employeeId, (commissionUpdates.get(item.employeeId) || 0) + item.commissionAmount);
                if(item.collaboratorId && item.collaboratorFee) {
                    collaboratorFeeUpdates.set(item.collaboratorId, (collaboratorFeeUpdates.get(item.collaboratorId) || 0) + item.collaboratorFee);
                }
            });

            setEmployees(prev => prev.map(emp => commissionUpdates.has(emp.id) ? { ...emp, outstandingBalance: emp.outstandingBalance + (commissionUpdates.get(emp.id) || 0) } : emp));
            setCollaborators(prev => prev.map(c => collaboratorFeeUpdates.has(c.id) ? { ...c, outstandingBalance: c.outstandingBalance + (collaboratorFeeUpdates.get(c.id) || 0) } : c));
        }
    } else if (transaction.type === TransactionType.Expense && transaction.accountId) {
        setAccounts(prev => prev.map(acc => acc.id === transaction.accountId ? { ...acc, balance: acc.balance - transaction.amount } : acc));
    }
  }

  const reverseTransactionFinancials = (transaction: Transaction) => {
     if (transaction.type === TransactionType.Income) {
        if (transaction.payments) {
            const paymentUpdates = new Map<string, number>();
            transaction.payments.forEach(p => paymentUpdates.set(p.accountId, (paymentUpdates.get(p.accountId) || 0) + p.amount));
            setAccounts(prev => prev.map(acc => paymentUpdates.has(acc.id) ? { ...acc, balance: acc.balance - (paymentUpdates.get(acc.id) || 0) } : acc));
        }
        if (transaction.items) {
            const commissionUpdates = new Map<string, number>();
            const collaboratorFeeUpdates = new Map<string, number>();
            transaction.items.forEach(item => {
                commissionUpdates.set(item.employeeId, (commissionUpdates.get(item.employeeId) || 0) + item.commissionAmount);
                if (item.collaboratorId && item.collaboratorFee) {
                    collaboratorFeeUpdates.set(item.collaboratorId, (collaboratorFeeUpdates.get(item.collaboratorId) || 0) + item.collaboratorFee);
                }
            });
            setEmployees(prev => prev.map(emp => commissionUpdates.has(emp.id) ? { ...emp, outstandingBalance: emp.outstandingBalance - (commissionUpdates.get(emp.id) || 0) } : emp));
            setCollaborators(prev => prev.map(c => collaboratorFeeUpdates.has(c.id) ? { ...c, outstandingBalance: c.outstandingBalance - (collaboratorFeeUpdates.get(c.id) || 0) } : c));
        }
    } else if (transaction.type === TransactionType.Expense) {
        if (transaction.accountId) {
             setAccounts(prev => prev.map(acc => acc.id === transaction.accountId ? { ...acc, balance: acc.balance + transaction.amount } : acc));
        }
        if (transaction.employeeId) {
             setEmployees(prev => prev.map(emp => emp.id === transaction.employeeId ? { ...emp, outstandingBalance: emp.outstandingBalance + transaction.amount } : emp));
        }
    }
  }

  const handleSaveTransaction = (transactionToSave: Transaction) => {
    // FIX: Moved isNew declaration before its first use.
    const isNew = !transactions.some(t => t.id === transactionToSave.id);

    if (financialLockDate) {
        const isEditingLocked = !isNew && transactionToSave.id && new Date(transactionToSave.date) <= new Date(financialLockDate);
        if(isEditingLocked) {
            alert("This transaction is in a locked period and cannot be edited.");
            return;
        }
    }

    if (!currentUser) return;
    
    let finalTransaction = transactionToSave;

    if (currentUser.role === 'Employee') {
        finalTransaction = { ...transactionToSave, approvalStatus: 'Pending' };
        const newNotification: Notification = {
            id: `notif_${Date.now()}`,
            message: `${currentUser.name} submitted a new transaction for approval: ${finalTransaction.description}`,
            timestamp: new Date().toISOString(),
            isRead: false,
            transactionId: finalTransaction.id
        };
        setNotifications(prev => [newNotification, ...prev]);
    } else {
        finalTransaction = { ...transactionToSave, approvalStatus: 'Approved' };
    }
    
    const existingTxIndex = transactions.findIndex(t => t.id === finalTransaction.id);
    if (existingTxIndex > -1) {
        const oldTx = transactions[existingTxIndex];
        if(oldTx.approvalStatus === 'Approved') reverseTransactionFinancials(oldTx);
        
        const newTransactions = [...transactions];
        newTransactions[existingTxIndex] = finalTransaction;
        setTransactions(newTransactions);
        logAction(`Updated transaction: ${finalTransaction.description}`);
    } else {
        setTransactions([finalTransaction, ...transactions]);
        logAction(`Created transaction: ${finalTransaction.description}`);
    }

    if (finalTransaction.approvalStatus === 'Approved') {
        applyTransactionFinancials(finalTransaction);
    }
  };

  const handleApproveTransaction = (transactionId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.approvalStatus !== 'Pending') return;

    if (financialLockDate && new Date(tx.date) <= new Date(financialLockDate)) {
        alert("This transaction is in a locked period and cannot be approved.");
        return;
    }

    const approvedTx = { ...tx, approvalStatus: 'Approved' as const };
    setTransactions(prev => prev.map(t => t.id === transactionId ? approvedTx : t));
    applyTransactionFinancials(approvedTx);
    logAction(`Approved transaction: ${approvedTx.description}`);
  };

  const handleRejectTransaction = (transactionId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.approvalStatus !== 'Pending') return;
     if (financialLockDate && new Date(tx.date) <= new Date(financialLockDate)) {
        alert("This transaction is in a locked period and cannot be rejected.");
        return;
    }
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    logAction(`Rejected transaction: ${tx.description}`);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

    if (financialLockDate && new Date(transactionToDelete.date) <= new Date(financialLockDate)) {
        alert("This transaction is in a locked period and cannot be deleted.");
        return;
    }

    if(transactionToDelete.approvalStatus === 'Approved') {
      reverseTransactionFinancials(transactionToDelete);
    }

    setTransactions(prevTransactions => prevTransactions.filter(t => t.id !== transactionId));
    logAction(`Deleted transaction: ${transactionToDelete.description}`);
  };

  const handleSaveCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info);
    logAction('Updated company information');
  };

  const handleSaveExpenseCategory = (categoryToSave: ExpenseCategory) => {
    if (categoryToSave.id) {
        setExpenseCategories(expenseCategories.map(c => c.id === categoryToSave.id ? categoryToSave : c));
        logAction(`Updated expense category: ${categoryToSave.name[lang]}`);
    } else {
        const newCategory = { ...categoryToSave, id: `exp_cat_${Date.now()}` };
        setExpenseCategories([newCategory, ...expenseCategories]);
        logAction(`Created expense category: ${newCategory.name[lang]}`);
    }
  };

  const handleDeleteExpenseCategory = (categoryId: string) => {
    const category = expenseCategories.find(c => c.id === categoryId);
    setExpenseCategories(expenseCategories.filter(c => c.id !== categoryId));
    if (category) logAction(`Deleted expense category: ${category.name[lang]}`);
  };

  const handleSaveAccount = (accountToSave: BankAccount) => {
    if (accountToSave.id) {
        setAccounts(accounts.map(acc => acc.id === accountToSave.id ? accountToSave : acc));
        logAction(`Updated account: ${accountToSave.name}`);
    } else {
        const newAccount = { ...accountToSave, id: `acc_${Date.now()}`};
        setAccounts([newAccount, ...accounts]);
        logAction(`Created account: ${newAccount.name}`);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    setAccounts(accounts.filter(acc => acc.id !== accountId));
    if (account) logAction(`Deleted account: ${account.name}`);
  };

  const handleTransferFunds = (transfer: { fromAccountId: string; toAccountId: string; amount: number; exchangeRate: number; description: string; }) => {
    const { fromAccountId, toAccountId, amount, exchangeRate, description } = transfer;

    const fromAccount = accounts.find(a => a.id === fromAccountId);
    const toAccount = accounts.find(a => a.id === toAccountId);

    if (!fromAccount || !toAccount) {
        alert("Source or destination account not found.");
        return;
    }
    if (fromAccount.balance < amount) {
        alert("Insufficient funds in the source account.");
        return;
    }

    const receivedAmount = fromAccount.currency === toAccount.currency ? amount : amount * exchangeRate;

    setAccounts(prevAccounts =>
        prevAccounts.map(acc => {
            if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
            if (acc.id === toAccountId) return { ...acc, balance: acc.balance + receivedAmount };
            return acc;
        })
    );

    const date = new Date().toISOString();
    const expenseTx: Transaction = {
        id: `txn_exp_${Date.now()}`, date, description: description || `Transfer to ${toAccount.name}`, amount: amount, type: TransactionType.Expense,
        category: 'Internal Transfer', accountId: fromAccountId, approvalStatus: 'Approved'
    };
     const incomeTx: Transaction = {
        id: `txn_inc_${Date.now()}`, date, description: description || `Transfer from ${fromAccount.name}`, amount: receivedAmount,
        type: TransactionType.Income, category: 'Internal Transfer',
        payments: [{ id: `pay_${Date.now()}`, date, amount: receivedAmount, accountId: toAccountId }],
        paymentStatus: 'Paid', approvalStatus: 'Approved'
    };
    setTransactions(prev => [incomeTx, expenseTx, ...prev]);
    logAction(`Transferred funds from ${fromAccount.name} to ${toAccount.name}`);
  };

  const handleMarkNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleSaveProject = (projectToSave: Project) => {
      if (projectToSave.id) {
          setProjects(projects.map(p => p.id === projectToSave.id ? projectToSave : p));
          logAction(`Updated project: ${projectToSave.title}`);
      } else {
          const newProject = { ...projectToSave, id: `proj${Date.now()}` };
          setProjects([newProject, ...projects]);
          logAction(`Created project: ${newProject.title}`);
      }
  };

  const handleCompleteProject = (projectId: string) => {
      const project = projects.find(p => p.id === projectId);
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: ProjectStatus.Finished } : p));
      if (project) logAction(`Completed project: ${project.title}`);
  };
  
  const handleDeleteProject = (projectId: string) => {
      const project = projects.find(p => p.id === projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (project) logAction(`Deleted project: ${project.title}`);
  };
  
  const handleSaveCollaborator = (collaboratorToSave: Collaborator) => {
    if (collaboratorToSave.id) {
        setCollaborators(collaborators.map(c => c.id === collaboratorToSave.id ? collaboratorToSave : c));
        logAction(`Updated collaborator: ${collaboratorToSave.name}`);
    } else {
        const newCollaborator = { ...collaboratorToSave, id: `col${Date.now()}`, outstandingBalance: 0 };
        setCollaborators([newCollaborator, ...collaborators]);
        logAction(`Created collaborator: ${newCollaborator.name}`);
    }
  };

  const handleDeleteCollaborator = (collaboratorId: string) => {
      const collaborator = collaborators.find(c => c.id === collaboratorId);
      setCollaborators(collaborators.filter(c => c.id !== collaboratorId));
      if (collaborator) logAction(`Deleted collaborator: ${collaborator.name}`);
  };

  const handleMakeCollaboratorPayment = (payment: { collaboratorId: string; amount: number; sourceAccountId: string; description: string; }) => {
    setAccounts(prev => prev.map(acc => acc.id === payment.sourceAccountId ? { ...acc, balance: acc.balance - payment.amount } : acc));
    setCollaborators(prev => prev.map(c => c.id === payment.collaboratorId ? { ...c, outstandingBalance: c.outstandingBalance - payment.amount } : c));

    const newTransaction: Transaction = {
        id: `txn_${Date.now()}`, date: new Date().toISOString(), description: payment.description, amount: payment.amount, type: TransactionType.Expense,
        category: 'Collaborator Payment', accountId: payment.sourceAccountId, approvalStatus: 'Approved', collaboratorId: payment.collaboratorId,
    };
    setTransactions(prev => [newTransaction, ...prev]);
    logAction(`Made payment of ${payment.amount} to collaborator for: ${payment.description}`);
  };

  const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
  };

  const handleBackup = () => {
      const backupData: BackupData = {
          accounts, employees, transactions, services, customers, companyInfo,
          expenseCategories, projects, notifications, auditLog, collaborators,
          financialLockDate
      };
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `accounting-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleRestore = (backupFileContent: string) => {
      try {
          const data = JSON.parse(backupFileContent) as BackupData;
          if (data.accounts && data.employees && data.transactions && data.services && data.customers && data.companyInfo && data.expenseCategories) {
              setAccounts(data.accounts); setEmployees(data.employees); setTransactions(data.transactions);
              setServices(data.services); setCustomers(data.customers); setCompanyInfo(data.companyInfo);
              setExpenseCategories(data.expenseCategories); setProjects(data.projects || []);
              setNotifications(data.notifications || []); setAuditLog(data.auditLog || []);
              setCollaborators(data.collaborators || []);
              setFinancialLockDate(data.financialLockDate || null);
              alert("Data restored successfully!");
          } else {
              throw new Error("Invalid backup file structure.");
          }
      } catch (error) {
          console.error("Failed to restore data:", error);
          alert("Failed to restore data. The file may be corrupted or in the wrong format.");
      }
  };
  
  const handleExportCustomers = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone'];
    const rows = customers.map(c => 
        [c.id, c.name, c.email || '', c.phone || ''].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logAction('Exported customer data to CSV');
  };

  const handleResetData = () => {
    logAction('!!! PERFORMED A FULL DATA RESET !!!');
    setTransactions([]);
    setCustomers([]);
    setProjects([]);
    setNotifications([]);
    setAuditLog([]);
    // Reset balances
    setAccounts(initialAccounts.map(a => ({...a})));
    setEmployees(initialEmployees.map(e => ({...e, outstandingBalance: 0})));
    setCollaborators(initialCollaborators.map(c => ({...c, outstandingBalance: 0})));
    alert("All transactional data (transactions, customers, projects, etc.) has been reset. Base data like employees and services remain.");
  };

  const handleViewInvoice = (transaction: Transaction) => {
    setViewingInvoiceTransaction(transaction);
  };

  const handleCloseInvoice = () => {
    setViewingInvoiceTransaction(null);
  };

  const managerPages = ['Services', 'Employees', 'Collaborators', 'Reports', 'Settings', 'AuditLog'];

  if (!currentUser) {
    return <LoginPage employees={employees} onLogin={handleLogin} companyName={companyInfo.name} />;
  }

  const visibleTransactions = currentUser.role === 'Manager'
    ? transactions
    : transactions.filter(t => {
        if (t.employeeId === currentUser.id) return true;
        if (t.items?.some(item => item.employeeId === currentUser.id)) return true;
        return false;
    });

  const visibleAccounts = currentUser.role === 'Manager'
    ? accounts
    : accounts.filter(acc => acc.id === currentUser.cashAccountId);


  const renderContent = () => {
    if (managerPages.includes(activePage) && currentUser.role !== 'Manager') {
        return <Dashboard user={currentUser} transactions={visibleTransactions} allTransactions={transactions} accounts={accounts} customers={customers} />;
    }

    switch (activePage) {
      case 'Dashboard':
        return <Dashboard user={currentUser} transactions={visibleTransactions} allTransactions={transactions} accounts={accounts} customers={customers}/>;
      case 'Transactions':
        return <Transactions
                    transactions={visibleTransactions} services={services} employees={employees}
                    collaborators={collaborators} accounts={accounts} customers={customers} onSave={handleSaveTransaction}
                    onDelete={handleDeleteTransaction} onApprove={handleApproveTransaction} onReject={handleRejectTransaction}
                    expenseCategories={expenseCategories} currentUser={currentUser}
                    searchTerm={searchTerm} onViewInvoice={handleViewInvoice} financialLockDate={financialLockDate}
                />;
      case 'Services':
        return <Services 
                    services={services} 
                    onSave={handleSaveService} 
                    onDelete={handleDeleteService} 
                    expenseCategories={expenseCategories}
                    onSaveExpenseCategory={handleSaveExpenseCategory}
                    onDeleteExpenseCategory={handleDeleteExpenseCategory}
                />;
      case 'Customers':
        return <Customers customers={customers} onSave={handleSaveCustomer} onDelete={handleDeleteCustomer} transactions={transactions} currentUser={currentUser} />;
      case 'Collaborators':
        return <Collaborators collaborators={collaborators} accounts={accounts} transactions={transactions} services={services} onSave={handleSaveCollaborator} onDelete={handleDeleteCollaborator} onMakePayment={handleMakeCollaboratorPayment} />;
      case 'Employees':
        return <Employees employees={employees} accounts={accounts} onSave={handleSaveEmployee} onMakePayment={handleMakePayment} transactions={transactions} services={services} />;
      case 'Accounts':
        return <Accounts accounts={visibleAccounts} allAccounts={accounts} transactions={transactions} onSave={handleSaveAccount} onDelete={handleDeleteAccount} onTransfer={handleTransferFunds} currentUser={currentUser} />;
      case 'Projects':
        return <Projects projects={projects} employees={employees} transactions={transactions} currentUser={currentUser} onSave={handleSaveProject} onComplete={handleCompleteProject} onDelete={handleDeleteProject} onViewInvoice={handleViewInvoice} />;
      case 'Reports':
        return <Reports transactions={transactions} employees={employees} customers={customers} services={services} />;
      case 'Settings':
        return <Settings 
                    companyInfo={companyInfo} 
                    onSaveCompanyInfo={handleSaveCompanyInfo} 
                    onBackup={handleBackup} 
                    onRestore={handleRestore} 
                    onExportCustomers={handleExportCustomers}
                    onResetData={handleResetData}
                    financialLockDate={financialLockDate}
                    onSetFinancialLockDate={setFinancialLockDate}
                />;
      case 'AuditLog':
        return <AuditLogPage logs={auditLog} />;
      default:
        return <Dashboard user={currentUser} transactions={visibleTransactions} allTransactions={transactions} accounts={accounts} customers={customers}/>;
    }
  };
  
  const viewingCustomer = customers.find(c => c.id === viewingInvoiceTransaction?.customerId);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar
        activeItem={activePage}
        onItemClick={(page) => {
            setActivePage(page);
            setIsSidebarOpen(false);
        }}
        onLogout={handleLogout}
        companyName={companyInfo.name}
        user={currentUser}
        isOpen={isSidebarOpen}
        projects={projects}
      />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
            activePage={activePage}
            user={currentUser}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            notifications={notifications}
            onMarkNotificationsRead={handleMarkNotificationsAsRead}
            onMenuClick={toggleSidebar}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
      {viewingInvoiceTransaction && (
        <InvoiceModal
            transaction={viewingInvoiceTransaction}
            customer={viewingCustomer}
            companyInfo={companyInfo}
            onClose={handleCloseInvoice}
        />
      )}
    </div>
  );
};

export default App;
