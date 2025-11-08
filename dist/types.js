import React from 'react';

export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense',
}

export interface LineItem {
  id: string; // for React key
  serviceId: string;
  description: string;
  subtotal: number; // Price of the service item
  legalCosts: number;
  vatRate: number;
  vatAmount: number;
  employeeId: string;
  commissionRate: number;
  commissionAmount: number;
  collaboratorId?: string;
  collaboratorFee?: number;
}

export interface Payment {
  id: string; // for React key
  date: string;
  amount: number;
  accountId: string;
}

export type PaymentStatus = 'Paid' | 'Partial' | 'Due';


export interface Transaction {
  id:string;
  date: string; // The date of the invoice/expense
  description: string;
  amount: number; // For Expense: the expense amount. For Income: the FINAL total invoice amount.
  type: TransactionType;
  category: string; // e.g., 'Service Revenue', 'Office Supplies'
  internalNotes?: string;
  approvalStatus?: 'Pending' | 'Approved';

  // Common optional fields
  customerId?: string;
  
  // Expense-specific field (accountId is where money came from)
  accountId?: string; 
  // Expense employee link
  employeeId?: string; 
  // Expense collaborator link
  collaboratorId?: string;

  // Income-specific fields
  items?: LineItem[];
  payments?: Payment[];
  paymentStatus?: PaymentStatus;
}


export enum AccountType {
  Bank = 'Bank',
  Cash = 'Cash',
}

export enum Currency {
  TRY = 'TRY',
  USD = 'USD',
  EUR = 'EUR',
}

export interface BankAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  owner?: string; // For employee cash accounts
  accountNumber?: string; // For bank accounts
}

export type Language = 'en' | 'fa' | 'tr';

export interface Employee {
  id:string;
  name: string;
  role: 'Manager' | 'Employee';
  avatarUrl: string;
  defaultCommissionRate: number;
  monthlySalary: number;
  salaryDueDate: string; // e.g., "28th of each month"
  outstandingBalance: number;
  cashAccountId: string;
  defaultLanguage?: Language;
  password?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  type: 'Broker' | 'Translator';
  outstandingBalance: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface MultiLingualString {
  en: string;
  fa: string;
  tr: string;
}

export interface Service {
  id: string;
  name: MultiLingualString;
  defaultPrice: number;
  legalCosts: number;
}

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  taxId?: string;
  logoUrl?: string;
}

export interface ExpenseCategory {
  id: string;
  name: MultiLingualString;
  defaultValue?: number;
}

export interface NavItem {
  name: string;
  icon: React.ReactNode;
  roles?: ('Manager' | 'Employee')[];
  notification?: boolean;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string; // ISO string
  isRead: boolean;
  transactionId?: string; // To link to pending transactions
}

export enum ProjectStatus {
  Active = 'Active',
  Finished = 'Finished',
}

export interface Project {
  id: string;
  title: string;
  description: string;
  assignerId: string;
  assigneeIds: string[];
  status: ProjectStatus;
  transactionId?: string;
  dueDate?: string; // ISO string date
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  action: string;
}

export interface BackupData {
  accounts: BankAccount[];
  employees: Employee[];
  transactions: Transaction[];
  services: Service[];
  customers: Customer[];
  companyInfo: CompanyInfo;
  expenseCategories: ExpenseCategory[];
  projects: Project[];
  notifications: Notification[];
  auditLog: AuditLog[];
  collaborators?: Collaborator[];
  financialLockDate?: string | null;
}
