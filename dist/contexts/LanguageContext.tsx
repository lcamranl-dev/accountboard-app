import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Currency } from '../types';

export type Language = 'en' | 'fa' | 'tr';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
    formatCurrency: (amount: number, currency: Currency) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // General
  description: { en: 'Description', tr: 'Açıklama', fa: 'توضیحات' },
  date: { en: 'Date', tr: 'Tarih', fa: 'تاریخ' },
  type: { en: 'Type', tr: 'Tür', fa: 'نوع' },
  category: { en: 'Category', tr: 'Kategori', fa: 'دسته بندی' },
  amount: { en: 'Amount', tr: 'Tutar', fa: 'مبلغ' },
  status: { en: 'Status', tr: 'Durum', fa: 'وضعیت' },
  actions: { en: 'Actions', tr: 'Eylemler', fa: 'عملیات' },
  cancel: { en: 'Cancel', tr: 'İptal', fa: 'انصراف' },
  save: { en: 'Save', tr: 'Kaydet', fa: 'ذخیره' },
  edit: { en: 'Edit', tr: 'Düzenle', fa: 'ویرایش' },
  delete: { en: 'Delete', tr: 'Sil', fa: 'حذف' },
  add: { en: 'Add', tr: 'Ekle', fa: 'افزودن' },
  close: { en: 'Close', tr: 'Kapat', fa: 'بستن' },
  income: { en: 'Income', tr: 'Gelir', fa: 'درآمد' },
  expense: { en: 'Expense', tr: 'Gider', fa: 'هزینه' },
  paid: { en: 'Paid', tr: 'Ödendi', fa: 'پرداخت شده' },
  partial: { en: 'Partial', tr: 'Kısmi', fa: 'جزئی' },
  due: { en: 'Due', tr: 'Vadesi Geçmiş', fa: 'سررسید' },
  completed: { en: 'Completed', tr: 'Tamamlandı', fa: 'تکمیل شد' },
  na: { en: 'N/A', tr: 'N/A', fa: 'نامشخص' },
  other: { en: 'Other', tr: 'Diğer', fa: 'دیگر' },
  financials: { en: 'Financials', tr: 'Finansallar', fa: 'مالی' },
  openMenu: { en: 'Open menu', tr: 'Menüyü aç', fa: 'باز کردن منو' },
  amountInTRY: { en: 'Amount (TRY)', tr: 'Tutar (TRY)', fa: 'مبلغ (TRY)' },
  accountName: { en: 'Account Name', tr: 'Hesap Adı', fa: 'نام حساب' },
  accountType: { en: 'Account Type', tr: 'Hesap Türü', fa: 'نوع حساب' },
  currency: { en: 'Currency', tr: 'Para Birimi', fa: 'واحد پول' },
  currentBalance: { en: 'Current Balance', tr: 'Mevcut Bakiye', fa: 'موجودی فعلی' },
  accountNumber: { en: 'Account Number', tr: 'Hesap Numarası', fa: 'شماره حساب' },
  ownerOptional: { en: 'Owner (Optional)', tr: 'Sahip (İsteğe Bağlı)', fa: 'صاحب (اختیاری)' },
  bank: { en: 'Bank', tr: 'Banka', fa: 'بانک' },
  cash: { en: 'Cash', tr: 'Nakit', fa: 'نقد' },
  user: { en: 'User', tr: 'Kullanıcı', fa: 'کاربر' },
  action: { en: 'Action', tr: 'Eylem', fa: 'عمل' },
  timestamp: { en: 'Timestamp', tr: 'Zaman Damgası', fa: 'مهر زمانی' },
  password: { en: 'Password', tr: 'Şifre', fa: 'رمز عبور' },
  login: { en: 'Login', tr: 'Giriş Yap', fa: 'ورود' },
  approved: { en: 'Approved', tr: 'Onaylandı', fa: 'تایید شده' },
  pending: { en: 'Pending', tr: 'Beklemede', fa: 'در انتظار' },
  approve: { en: 'Approve', tr: 'Onayla', fa: 'تایید' },
  reject: { en: 'Reject', tr: 'Reddet', fa: 'رد کردن' },

  // Sidebar
  dashboard: { en: 'Dashboard', tr: 'Gösterge Paneli', fa: 'داشبورد' },
  transactions: { en: 'Transactions', tr: 'İşlemler', fa: 'تراکنش‌ها' },
  projects: { en: 'Projects', tr: 'Projeler', fa: 'پروژه‌ها' },
  services: { en: 'Services', tr: 'Hizmetler', fa: 'خدمات' },
  servicesAndExpenses: { en: 'Services & Expenses', tr: 'Hizmetler ve Giderler', fa: 'خدمات و هزینه‌ها' },
  customers: { en: 'Customers', tr: 'Müşteriler', fa: 'مشتریان' },
  employees: { en: 'Employees', tr: 'Çalışanlar', fa: 'کارمندان' },
  collaborators: { en: 'Collaborators', tr: 'İş Ortakları', fa: 'همکاران' },
  accounts: { en: 'Accounts', tr: 'Hesaplar', fa: 'حساب‌ها' },
  reports: { en: 'Reports', tr: 'Raporlar', fa: 'گزارش‌ها' },
  settings: { en: 'Settings', tr: 'Ayarlar', fa: 'تنظیمات' },
  auditLog: { en: 'Audit Log', tr: 'Denetim Kaydı', fa: 'گزارش بازرسی' },
  logout: { en: 'Logout', tr: 'Çıkış Yap', fa: 'خروج' },

  // Header
  searchTransactions: { en: 'Search transactions...', tr: 'İşlemlerde ara...', fa: 'جستجوی تراکنش‌ها...' },
  notifications: { en: 'Notifications', tr: 'Bildirimler', fa: 'اعلان‌ها' },
  noNewNotifications: { en: 'No new notifications.', tr: 'Yeni bildirim yok.', fa: 'اعلان جدیدی وجود ندارد.' },
  justNow: { en: 'just now', tr: 'şimdi', fa: 'همین الان' },
  yearsAgo: { en: '{count} years ago', tr: '{count} yıl önce', fa: '{count} سال پیش' },
  monthsAgo: { en: '{count} months ago', tr: '{count} ay önce', fa: '{count} ماه پیش' },
  daysAgo: { en: '{count} days ago', tr: '{count} gün önce', fa: '{count} روز پیش' },
  hoursAgo: { en: '{count} hours ago', tr: '{count} saat önce', fa: '{count} ساعت پیش' },
  minutesAgo: { en: '{count} minutes ago', tr: '{count} dakika önce', fa: '{count} دقیقه پیش' },
  secondsAgo: { en: '{count} seconds ago', tr: '{count} saniye önce', fa: '{count} ثانیه پیش' },

  // Login Page
  selectUserToLogin: { en: 'Select your account to log in', tr: 'Giriş yapmak için hesabınızı seçin', fa: 'برای ورود به سیستم حساب خود را انتخاب کنید' },
  invalidCredentials: { en: 'Invalid employee or password.', tr: 'Geçersiz çalışan veya şifre.', fa: 'کارمند یا رمز عبور نامعتبر است.' },
  invalidUserSelection: { en: 'Could not find selected user.', tr: 'Seçilen kullanıcı bulunamadı.', fa: 'کاربر انتخاب شده یافت نشد.' },

  // Dashboard
  totalRevenue: { en: 'Total Revenue', tr: 'Toplam Gelir', fa: 'درآمد کل' },
  totalExpenses: { en: 'Total Expenses', tr: 'Toplam Gider', fa: 'هزینه‌های کل' },
  netProfit: { en: 'Net Profit', tr: 'Net Kâr', fa: 'سود خالص' },
  activeClients: { en: 'Active Clients', tr: 'Aktif Müşteriler', fa: 'مشتریان فعال' },
  vsLastMonth: { en: 'vs last month', tr: 'geçen aya göre', fa: 'نسبت به ماه گذشته' },
  revenueVsExpenses: { en: 'Revenue vs. Expenses', tr: 'Gelir - Gider Karşılaştırması', fa: 'درآمد در مقابل هزینه‌ها' },
  revenue: { en: 'Revenue', tr: 'Gelir', fa: 'درآمد' },
  cashFlow: { en: 'Cash Flow', tr: 'Nakit Akışı', fa: 'جریان نقدی' },
  recentTransactions: { en: 'Recent Transactions', tr: 'Son İşlemler', fa: 'تراکنش‌های اخیر' },
  myCashBalance: { en: 'My Cash Balance', tr: 'Nakit Bakiyem', fa: 'موجودی نقد من' },
  updatedLive: { en: 'Updated live', tr: 'Canlı güncellendi', fa: 'بروزرسانی زنده' },
  myOutstandingBalance: { en: 'My Outstanding Balance', tr: 'Ödenmemiş Bakiyem', fa: 'مانده حساب من' },
  youAreOwed: { en: 'You are owed', tr: 'Alacaklısınız', fa: 'طلبکارید' },
  youOwe: { en: 'You owe', tr: 'Borçlusunuz', fa: 'بدهکارید' },
  commissionEarnedMonth: { en: 'Commission Earned (Month)', tr: 'Kazanılan Komisyon (Bu Ay)', fa: 'کمیسیون کسب شده (ماه)' },
  thisMonth: { en: 'This month', tr: 'Bu ay', fa: 'این ماه' },
  transactionsMonth: { en: 'Transactions (Month)', tr: 'İşlemler (Bu Ay)', fa: 'تراکنش‌ها (ماه)' },

  // Transactions Page
  transactionHistory: { en: 'Transaction History', tr: 'İşlem Geçmişi', fa: 'تاریخچه تراکنش' },
  addTransaction: { en: 'Add Transaction', tr: 'İşlem Ekle', fa: 'افزودن تراکنش' },
  customerCategory: { en: 'Customer / Category', tr: 'Müşteri / Kategori', fa: 'مشتری / دسته‌بندی' },
  viewInvoice: { en: 'View Invoice', tr: 'Faturayı Görüntüle', fa: 'مشاهده فاکتور' },
  confirmDeletion: { en: 'Confirm Deletion', tr: 'Silmeyi Onayla', fa: 'تایید حذف' },
  confirmDeleteTransaction: { en: 'Are you sure you want to delete this transaction? This action will reverse all associated payments and commissions. This cannot be undone.', tr: 'Bu işlemi silmek istediğinizden emin misiniz? Bu eylem, ilgili tüm ödemeleri ve komisyonları geri alacaktır. Bu eylem geri alınamaz.', fa: 'آیا از حذف این تراکنش مطمئن هستید؟ این عمل تمام پرداخت‌ها و کمیسیون‌های مرتبط را برمی‌گرداند. این عمل قابل بازگشت نیست.' },
  deleteTransaction: { en: 'Delete Transaction', tr: 'İşlemi Sil', fa: 'حذف تراکنش' },
  
  // Services Page
  serviceManagement: { en: 'Service Management', tr: 'Hizmet Yönetimi', fa: 'مدیریت خدمات' },
  addService: { en: 'Add Service', tr: 'Hizmet Ekle', fa: 'افزودن خدمت' },
  serviceNameFa: { en: 'Service Name (Farsi)', tr: 'Hizmet Adı (Farsça)', fa: 'نام سرویس (فارسی)' },
  serviceNameTr: { en: 'Service Name (Turkish)', tr: 'Hizmet Adı (Türkçe)', fa: 'نام سرویس (ترکی)' },
  serviceNameEn: { en: 'Service Name (English)', tr: 'Hizmet Adı (İngilizce)', fa: 'نام سرویس (انگلیسی)' },
  defaultPrice: { en: 'Default Price', tr: 'Varsayılan Fiyat', fa: 'قیمت پیش‌فرض' },
  legalAdminCosts: { en: 'Legal/Admin Costs', tr: 'Yasal/İdari Masraflar', fa: 'هزینه‌های قانونی/اداری' },
  defaultPriceTRY: { en: 'Default Price (TRY)', tr: 'Varsayılan Fiyat (TRY)', fa: 'قیمت پیش‌فرض (لیر)' },
  legalAdminCostsTRY: { en: 'Legal/Admin Costs (TRY)', tr: 'Yasal/İdari Masraflar (TRY)', fa: 'هزینه‌های قانونی/اداری (لیر)' },
  confirmDeleteService: { en: 'Are you sure you want to delete the service "{serviceName}"? This action cannot be undone.', tr: '"{serviceName}" hizmetini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.', fa: 'آیا از حذف سرویس "{serviceName}" مطمئن هستید؟ این عمل قابل بازگشت نیست.' },
  deleteService: { en: 'Delete Service', tr: 'Hizmeti Sil', fa: 'حذف سرویس' },

  // Customers Page
  customerManagement: { en: 'Customer Management', tr: 'Müşteri Yönetimi', fa: 'مدیریت مشتریان' },
  addCustomer: { en: 'Add Customer', tr: 'Müşteri Ekle', fa: 'افزودن مشتری' },
  customerName: { en: 'Customer Name', tr: 'Müşteri Adı', fa: 'نام مشتری' },
  phone: { en: 'Phone', tr: 'Telefon', fa: 'تلفن' },
  debt: { en: 'Debt', tr: 'Borç', fa: 'بدهی' },
  confirmDeleteCustomer: { en: 'Are you sure you want to delete the customer "{customerName}"? This action cannot be undone.', tr: '"{customerName}" müşterisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.', fa: 'آیا از حذف مشتری "{customerName}" مطمئن هستید؟ این عمل قابل بازگشت نیست.' },
  deleteCustomer: { en: 'Delete Customer', tr: 'Müşteriyi Sil', fa: 'حذف مشتری' },
  
  // Employees Page
  employeeManagement: { en: 'Employee Management', tr: 'Çalışan Yönetimi', fa: 'مدیریت کارمندان' },
  addEmployee: { en: 'Add Employee', tr: 'Çalışan Ekle', fa: 'افزودن کارمند' },
  salary: { en: 'Salary', tr: 'Maaş', fa: 'حقوق' },
  dueDate: { en: 'Due Date', tr: 'Vade Tarihi', fa: 'تاریخ سررسید' },
  outstandingBalance: { en: 'Outstanding Balance', tr: 'Ödenmemiş Bakiye', fa: 'مانده حساب' },
  makePayment: { en: 'Make Payment', tr: 'Ödeme Yap', fa: 'پرداخت کردن' },
  viewDetails: { en: "View Details", tr: "Detayları Görüntüle", fa: "مشاهده جزئیات" },
  fullName: { en: 'Full Name', tr: 'Tam Adı', fa: 'نام کامل' },
  avatarUrl: { en: 'Avatar URL', tr: 'Avatar URL', fa: 'آدرس آواتار' },
  role: { en: 'Role', tr: 'Rol', fa: 'نقش' },
  defaultLanguage: { en: 'Default Language', tr: 'Varsayılan Dil', fa: 'زبان پیش‌فرض' },
  cashAccount: { en: 'Cash Account', tr: 'Nakit Hesabı', fa: 'حساب نقدی' },
  defaultCommissionRate: { en: 'Default Commission Rate (%)', tr: 'Varsayılan Komisyon Oranı (%)', fa: 'نرخ کمیسیون پیش‌فرض (%)' },
  monthlySalaryTRY: { en: 'Monthly Salary (TRY)', tr: 'Aylık Maaş (TRY)', fa: 'حقوق ماهانه (لیر)' },
  salaryDueDate: { en: 'Salary Due Date', tr: 'Maaş Ödeme Tarihi', fa: 'تاریخ سررسید حقوق' },
  employee: { en: 'Employee', tr: 'Çalışan', fa: 'کارمند' },
  manager: { en: 'Manager', tr: 'Yönetici', fa: 'مدیر' },
  selectAnAccount: { en: 'Select an account', tr: 'Bir hesap seçin', fa: 'یک حساب انتخاب کنید' },
  selectedAccountBalance: { en: 'Selected account balance: {balance}', tr: 'Seçili hesap bakiyesi: {balance}', fa: 'موجودی حساب انتخاب شده: {balance}' },
  paymentAmountTRY: { en: 'Payment Amount (TRY)', tr: 'Ödeme Tutarı (TRY)', fa: 'مبلغ پرداخت (لیر)' },
  sourceAccount: { en: 'Source Account', tr: 'Kaynak Hesap', fa: 'حساب مبدا' },
  commission: { en: 'Commission', tr: 'Komisyon', fa: 'کمیسیون' },
  advance: { en: 'Advance', tr: 'Avans', fa: 'پیش پرداخت' },
  confirmPayment: { en: 'Confirm Payment', tr: 'Ödemeyi Onayla', fa: 'تایید پرداخت' },
  passwordRequired: { en: 'Password is required for new employees.', tr: 'Yeni çalışanlar için şifre gereklidir.', fa: 'رمز عبور برای کارمندان جدید الزامی است.' },
  required: { en: 'Required', tr: 'Gerekli', fa: 'الزامی' },
  passwordPlaceholder: { en: 'Leave blank to keep unchanged', tr: 'Değiştirmemek için boş bırakın', fa: 'برای عدم تغییر، خالی بگذارید' },

  // Collaborators Page
  collaboratorManagement: { en: 'Collaborator Management', tr: 'İş Ortağı Yönetimi', fa: 'مدیریت همکاران' },
  addCollaborator: { en: 'Add Collaborator', tr: 'İş Ortağı Ekle', fa: 'افزودن همکار' },
  collaboratorName: { en: 'Collaborator Name', tr: 'İş Ortağı Adı', fa: 'نام همکار' },
  collaboratorType: { en: 'Collaborator Type', tr: 'İş Ortağı Türü', fa: 'نوع همکار' },
  broker: { en: 'Broker', tr: 'Aracı', fa: 'کارگزار' },
  translator: { en: 'Translator', tr: 'Tercüman', fa: 'مترجم' },
  selectType: { en: 'Select type', tr: 'Tür seçin', fa: 'نوع را انتخاب کنید' },
  confirmDeleteCollaborator: { en: 'Are you sure you want to delete the collaborator "{collaboratorName}"?', tr: '"{collaboratorName}" adlı iş ortağını silmek istediğinizden emin misiniz?', fa: 'آیا از حذف همکار "{collaboratorName}" مطمئن هستید؟' },
  deleteCollaborator: { en: 'Delete Collaborator', tr: 'İş Ortağını Sil', fa: 'حذف همکار' },

  // Accounts Page
  bankCashAccounts: { en: 'Bank & Cash Accounts', tr: 'Banka ve Nakit Hesapları', fa: 'حساب‌های بانکی و نقدی' },
  transferFunds: { en: 'Transfer Funds', tr: 'Para Transferi', fa: 'انتقال وجه' },
  addAccount: { en: 'Add Account', tr: 'Hesap Ekle', fa: 'افزودن حساب' },
  confirmDeleteAccount: { en: 'Are you sure you want to delete the account "{accountName}"? This action cannot be undone.', tr: '"{accountName}" hesabını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.', fa: 'آیا از حذف حساب "{accountName}" مطمئن هستید؟ این عمل قابل بازگشت نیست.' },
  deleteAccount: { en: 'Delete Account', tr: 'Hesabı Sil', fa: 'حذف حساب' },
  historyFor: { en: 'History for {accountName}', tr: '{accountName} için Geçmiş', fa: 'تاریخچه برای {accountName}' },
  noTransactionsFound: { en: 'No transactions found for this account.', tr: 'Bu hesap için işlem bulunamadı.', fa: 'هیچ تراکنشی برای این حساب یافت نشد.' },
  fromAccount: { en: 'From Account', tr: 'Gönderen Hesap', fa: 'از حساب' },
  toAccount: { en: 'To Account', tr: 'Alıcı Hesap', fa: 'به حساب' },
  amountToTransfer: { en: 'Amount to Transfer ({currency})', tr: 'Transfer Edilecek Tutar ({currency})', fa: 'مبلغ انتقال ({currency})' },
  exchangeRate: { en: 'Exchange Rate (1 {from} = ? {to})', tr: 'Döviz Kuru (1 {from} = ? {to})', fa: 'نرخ ارز (۱ {from} = ? {to})' },
  amountToBeReceived: { en: 'Amount to be Received', tr: 'Alınacak Tutar', fa: 'مبلغ دریافتی' },
  fundTransfer: { en: 'Fund Transfer', tr: 'Para Transferi', fa: 'انتقال وجه' },
  confirmTransfer: { en: 'Confirm Transfer', tr: 'Transferi Onayla', fa: 'تایید انتقال' },
  accountColon: { en: 'Account: {accountNumber}', tr: 'Hesap: {accountNumber}', fa: 'حساب: {accountNumber}' },
  cashOnHand: { en: 'Cash on hand', tr: 'Eldeki Nakit', fa: 'نقد در دست' },
  viewHistory: { en: 'View History', tr: 'Geçmişi Görüntüle', fa: 'مشاهده تاریخچه' },
  editAccount: { en: 'Edit Account', tr: 'Hesabı Düzenle', fa: 'ویرایش حساب' },

  // Reports Page
  financialReports: { en: 'Financial Reports', tr: 'Finansal Raporlar', fa: 'گزارش‌های مالی' },
  exportCsv: { en: 'Export CSV', tr: 'CSV Olarak Dışa Aktar', fa: 'خروجی CSV' },
  totalIncome: { en: 'Total Income', tr: 'Toplam Gelir', fa: 'درآمد کل' },
  totalCommissions: { en: 'Total Commissions', tr: 'Toplam Komisyonlar', fa: 'کمیسیون‌های کل' },
  incomeByService: { en: 'Income by Service', tr: 'Hizmete Göre Gelir', fa: 'درآمد بر اساس سرویس' },
  expensesByCategory: { en: 'Expenses by Category', tr: 'Kategoriye Göre Giderler', fa: 'هزینه‌ها بر اساس دسته‌بندی' },
  commissionDistribution: { en: 'Commission Distribution', tr: 'Komisyon Dağılıمı', fa: 'توزیع کمیسیون' },
  detailedLog: { en: 'Detailed Log', tr: 'Detaylı Kayıt', fa: 'گزارش دقیق' },
  searchLog: { en: 'Search log...', tr: 'Kayıtlarda ara...', fa: 'جستجو در گزارش...' },
  noDataAvailable: { en: 'No data available for this period.', tr: 'Bu dönem için veri bulunamadı.', fa: 'داده‌ای برای این دوره موجود نیست.' },

  // Settings Page
  companyInformation: { en: 'Company Information', tr: 'Şirket Bilgileri', fa: 'اطلاعات شرکت' },
  companyName: { en: 'Company Name', tr: 'Şirket Adı', fa: 'نام شرکت' },
  taxId: { en: 'Tax ID / VAT Number', tr: 'Vergi No / KDV Numarası', fa: 'شناسه مالیاتی / شماره ارزش افزوده' },
  address: { en: 'Address', tr: 'Adres', fa: 'آدرس' },
  emailAddress: { en: 'Email Address', tr: 'E-posta Adresi', fa: 'آدرس ایمیل' },
  phoneNumber: { en: 'Phone Number', tr: 'Telefon Numarası', fa: 'شماره تلفن' },
  companyLogoUrl: { en: 'Company Logo URL', tr: 'Şirket Logo URL', fa: 'آدرس لوگوی شرکت' },
  saveInformation: { en: 'Save Information', tr: 'Bilgileri Kaydet', fa: 'ذخیره اطلاعات' },
  expenseCategories: { en: 'Expense Categories', tr: 'Gider Kategorileri', fa: 'دسته‌بندی هزینه‌ها' },
  addCategory: { en: 'Add Category', tr: 'Kategori Ekle', fa: 'افزودن دسته‌بندی' },
  categoryName: { en: 'Category Name', tr: 'Kategori Adı', fa: 'نام دسته‌بندی' },
  defaultValue: { en: 'Default Value', tr: 'Varsayılan Değer', fa: 'مقدار پیش‌فرض' },
  defaultValueOptional: { en: 'Default Value (TRY, Optional)', tr: 'Varsayılan Değer (TRY, İsteğe Bağlı)', fa: 'مقدار پیش‌فرض (لیر، اختیاری)' },
  notSet: { en: 'Not set', tr: 'Ayarlanmamış', fa: 'تنظیم نشده' },
  dataManagement: { en: 'Data Management & Exports', tr: 'Veri Yönetimi ve Dışa Aktarımlar', fa: 'مدیریت و خروجی داده‌ها' },
  backupData: { en: 'Backup Data', tr: 'Verileri Yedekle', fa: 'پشتیبان‌گیری از داده‌ها' },
  backupDescription: { en: 'Download all application data into a single JSON file.', tr: 'Tüm uygulama verilerini tek bir JSON dosyasına indirin.', fa: 'تمام داده‌های برنامه خود را در یک فایل JSON دانلود کنید.' },
  restoreFromFile: { en: 'Restore from File', tr: 'Dosyadan Geri Yükle', fa: 'بازیابی از فایل' },
  restoreWarning: { en: 'Warning:', tr: 'Uyarı:', fa: 'هشدار:' },
  restoreDescription: { en: 'This will overwrite all current data in the application.', tr: 'Bu, uygulamadaki tüm mevcut verilerin üzerine yazacaktır.', fa: 'این عمل تمام داده‌های فعلی برنامه را بازنویسی خواهد کرد.' },
  restoreFromFileButton: { en: 'Restore from File...', tr: 'Dosyadan Geri Yükle...', fa: 'بازیابی از فایل...' },
  confirmRestore: { en: 'Confirm Restore', tr: 'Geri Yüklemeyi Onayla', fa: 'تایید بازیابی' },
  confirmRestoreMessage: { en: 'Are you sure you want to restore data from this file? This will overwrite all existing data in the application. This action cannot be undone.', tr: 'Bu dosyadan verileri geri yüklemek istediğinizden emin misiniz? Bu, uygulamadaki tüm mevcut verilerin üzerine yazacaktır. Bu işlem geri alınamaz.', fa: 'آیا مطمئن هستید که می‌خواهید داده‌ها را از این فایل بازیابی کنید؟ این عمل تمام داده‌های موجود در برنامه را بازنویسی می‌کند. این عمل قابل بازگشت نیست.' },
  yesRestoreData: { en: 'Yes, Restore Data', tr: 'Evet, Verileri Geri Yükle', fa: 'بله، بازیابی داده‌ها' },
  exportCustomers: { en: 'Export Customers (CSV)', tr: 'Müşterileri Dışa Aktar (CSV)', fa: 'خروجی مشتریان (CSV)' },
  exportCustomersDescription: { en: 'Download a CSV file of all your customer information.', tr: 'Tüm müşteri bilgilerinizin bir CSV dosyasını indirin.', fa: 'یک فایل CSV از تمام اطلاعات مشتریان خود دانلود کنید.' },
  financialClosing: { en: 'Financial Closing', tr: 'Finansal Kapanış', fa: 'بستن سال مالی' },
  financialClosingDescription: { en: 'Lock all transactions up to a specific date to prevent edits or deletions. This is useful for closing financial periods.', tr: 'Düzenlemeleri veya silmeleri önlemek için belirli bir tarihe kadar olan tüm işlemleri kilitleyin. Bu, mali dönemleri kapatmak için kullanışlıdır.', fa: 'تمام تراکنش‌های تا یک تاریخ مشخص را برای جلوگیری از ویرایش یا حذف قفل کنید. این برای بستن دوره‌های مالی مفید است.' },
  lockDate: { en: 'Lock Date', tr: 'Kilitleme Tarihi', fa: 'تاریخ قفل' },
  dataLockedUntil: { en: 'Data is locked for all dates up to and including {date}.', tr: 'Veriler, {date} dahil olmak üzere tüm tarihler için kilitlenmiştir.', fa: 'داده‌ها برای تمام تاریخ‌ها تا {date} (شامل) قفل شده است.' },
  lockData: { en: 'Lock Data', tr: 'Verileri Kilitle', fa: 'قفل کردن داده‌ها' },
  unlockData: { en: 'Unlock Data', tr: 'Verilerin Kilidini Aç', fa: 'باز کردن قفل داده‌ها' },
  settingsSaved: { en: 'Settings saved successfully!', tr: 'Ayarlar başarıyla kaydedildi!', fa: 'تنظیمات با موفقیت ذخیره شد!' },
  dangerZone: { en: 'Danger Zone', tr: 'Tehlikeli Bölge', fa: 'منطقه خطر' },
  resetAllData: { en: 'Reset All Data', tr: 'Tüm Verileri Sıfırla', fa: 'بازنشانی تمام داده‌ها' },
  resetDataDescription: { en: 'Permanently delete all transactional data (transactions, customers, projects, etc.). Base data like employees and services will remain. This action is irreversible.', tr: 'Tüm işlem verilerini (işlemler, müşteriler, projeler vb.) kalıcı olarak silin. Çalışanlar ve hizmetler gibi temel veriler kalacaktır. Bu işlem geri alınamaz.', fa: 'تمام داده‌های تراکنشی (تراکنش‌ها، مشتریان، پروژه‌ها و غیره) را برای همیشه حذف کنید. داده‌های پایه مانند کارمندان و خدمات باقی خواهند ماند. این عمل غیرقابل برگشت است.' },
  resetConfirmationTitle: { en: 'Are you absolutely sure?', tr: 'Kesinlikle emin misiniz?', fa: 'آیا کاملاً مطمئن هستید؟' },
  resetConfirmationMessage: { en: 'This is irreversible. To confirm, please type "{confirmationText}" in the box below.', tr: 'Bu işlem geri alınamaz. Onaylamak için lütfen aşağıdaki kutuya "{confirmationText}" yazın.', fa: 'این عمل غیرقابل برگشت است. برای تأیید، لطفاً "{confirmationText}" را در کادر زیر تایپ کنید.' },
  yesImSure: { en: "yes I'm sure", tr: "evet eminim", fa: "بله مطمئنم" },
  resetButtonText: { en: 'Yes, Reset Everything', tr: 'Evet, Her Şeyi Sıfırla', fa: 'بله، همه چیز را بازنشانی کن' },

  // Transaction Modal
  addNewTransaction: { en: 'Add New Transaction', tr: 'Yeni İşlem Ekle', fa: 'افزودن تراکنش جدید' },
  editTransaction: { en: 'Edit Transaction', tr: 'İşlemi Düzenle', fa: 'ویرایش تراکنش' },
  customer: { en: 'Customer', tr: 'Müşteri', fa: 'مشتری' },
  internalNotes: { en: 'Internal Notes (not on invoice)', tr: 'Dahili Notlar (faturada görünmez)', fa: 'یادداشت‌های داخلی (در فاکتور نمایش داده نمی‌شود)' },
  selectACustomer: { en: 'Select a customer', tr: 'Bir müşteri seçin', fa: 'یک مشتری انتخاب کنید' },
  servicesTitle: { en: 'Services', tr: 'Hizmetler', fa: 'خدمات' },
  service: { en: 'Service', tr: 'Hizmet', fa: 'سرویس' },
  priceSubtotal: { en: 'Price (Subtotal)', tr: 'Fiyat (Ara Toplam)', fa: 'قیمت (جمع جزئی)' },
  officialPayments: { en: 'Official Payments', tr: 'Resmi Ödemeler', fa: 'پرداخت‌های رسمی' },
  vatPercent: { en: 'VAT (%)', tr: 'KDV (%)', fa: 'مالیات بر ارزش افزوده (%)' },
  commissionPercent: { en: 'Commission (%)', tr: 'Komisyon (%)', fa: 'کمیسیون (%)' },
  collaborator: { en: 'Collaborator', tr: 'İş Ortağı', fa: 'همکار' },
  collaboratorFee: { en: 'Collaborator Fee', tr: 'İş Ortağı Ücreti', fa: 'هزینه همکار' },
  selectACollaborator: { en: 'Select a collaborator', tr: 'Bir iş ortağı seçin', fa: 'یک همکار انتخاب کنید' },
  selectAService: { en: 'Select a service', tr: 'Bir hizmet seçin', fa: 'یک سرویس انتخاب کنید' },
  addServiceItem: { en: 'Add Service Item', tr: 'Hizmet Kalemi Ekle', fa: 'افزودن آیتم سرویس' },
  payments: { en: 'Payments', tr: 'Ödemeler', fa: 'پرداخت‌ها' },
  selectAccount: { en: 'Select account', tr: 'Hesap seçin', fa: 'انتخاب حساب' },
  addPayment: { en: 'Add Payment', tr: 'Ödeme Ekle', fa: 'افزودن پرداخت' },
  invoiceSummary: { en: 'Invoice Summary', tr: 'Fatura Özeti', fa: 'خلاصه فاکتور' },
  subtotal: { en: 'Subtotal', tr: 'Ara Toplam', fa: 'جمع جزئی' },
  officialCosts: { en: 'Official Costs', tr: 'Resmi Masraflar', fa: 'هزینه‌های رسمی' },
  totalVat: { en: 'Total VAT', tr: 'Toplam KDV', fa: 'کل مالیات بر ارزش افزوده' },
  totalCommission: { en: 'Total Commission', tr: 'Toplam Komisyon', fa: 'کل کمیسیون' },
  myCommission: { en: 'My Commission', tr: 'Komisyonum', fa: 'کمیسیون من' },
  grandTotal: { en: 'Grand Total', tr: 'Genel Toplam', fa: 'مجموع کل' },
  totalPaid: { en: 'Total Paid', tr: 'Toplam Ödenen', fa: 'کل پرداخت شده' },
  balanceDue: { en: 'Balance Due', tr: 'Kalan Bakiye', fa: 'مانده بدهی' },
  payFromAccount: { en: 'Pay from Account', tr: 'Hesaptan Öde', fa: 'پرداخت از حساب' },
  saveTransaction: { en: 'Save Transaction', tr: 'İşlemi Kaydet', fa: 'ذخیره تراکنش' },
  internalNotesPlaceholder: { en: "e.g., Client requested a follow-up call.", tr: "Örn., Müşteri bir takip araması talep etti.", fa: "مثال: مشتری درخواست تماس پیگیری کرد." },
  expenseCategoryPlaceholder: { en: "e.g., Office Supplies, Travel...", tr: "Örn., Ofis Malzemeleri, Seyahat...", fa: "مثال: لوازم اداری، سفر..." },
  expenseNotesPlaceholder: { en: "e.g., Purchased new printer paper and ink.", tr: "Örn., Yeni yazıcı kağıdı ve mürekkebi satın alındı.", fa: "مثال: کاغذ و جوهر پرینتر جدید خریداری شد." },

  // Invoice
  invoicePreview: { en: 'Invoice Preview', tr: 'Fatura Önizlemesi', fa: 'پیش‌نمایش فاکتور' },
  print: { en: 'Print', tr: 'Yazdır', fa: 'چاپ' },
  proformaInvoice: { en: 'PROFORMA INVOICE', tr: 'PROFORMA FATURA', fa: 'پیش فاکتور' },
  invoiceNumber: { en: 'INVOICE #{id}', tr: 'FATURA #{id}', fa: 'فاکتور #{id}' },
  billTo: { en: 'Bill To', tr: 'Fatura Adresi', fa: 'صورتحساب به' },
  total: { en: 'Total', tr: 'Toplam', fa: 'جمع کل' },
  paymentsReceived: { en: 'Payments Received', tr: 'Alınan Ödemeler', fa: 'پرداخت‌های دریافتی' },
  invoiceFooter1: { en: 'Thank you for your business.', tr: 'Bizi tercih ettiğiniz için teşekkür ederiz.', fa: 'از کسب و کار شما متشکریم.' },
  invoiceFooter2: { en: 'Please contact us with any questions.', tr: 'Sorularınız için lütfen bizimle iletişime geçin.', fa: 'لطفا در صورت داشتن هرگونه سوال با ما تماس بگیرید.' },
  
  // Projects
  projectsTitle: { en: 'Projects & Tasks', tr: 'Projeler ve Görevler', fa: 'پروژه‌ها و وظایf' },
  addProject: { en: 'Add Project', tr: 'Proje Ekle', fa: 'افزودن پروژه' },
  activeProjects: { en: 'Active Projects', tr: 'Aktif Projeler', fa: 'پروژه‌های فعال' },
  finishedProjects: { en: 'Finished Projects', tr: 'Biten Projeler', fa: 'پروژه‌های تمام شده' },
  dueDateColon: { en: 'Due Date:', tr: 'Bitiş Tarihi:', fa: 'تاریخ سررسید:' },
  assignedBy: { en: 'Assigned by:', tr: 'Atayan:', fa: 'محول شده توسط:' },
  assignedTo: { en: 'Assigned to:', tr: 'Atanan:', fa: 'محول شده به:' },
  linkedTxn: { en: 'Linked Txn:', tr: 'Bağlı İşlem:', fa: 'تراکنش مرتبط:' },
  markAsDone: { en: 'Mark as Done', tr: 'Tamamlandı Olarak İşaretle', fa: 'علامت‌گذاری به عنوان انجام شده' },
  editProject: { en: 'Edit Project', tr: 'Projeyi Düzenle', fa: 'ویرایش پروژه' },
  deleteProject: { en: 'Delete Project', tr: 'Projeyi Sil', fa: 'حذف پروژه' },
  confirmDeleteProject: { en: 'Are you sure you want to delete the project "{title}"?', tr: '"{title}" projesini silmek istediğinizden emin misiniz?', fa: 'آیا از حذف پروژه "{title}" مطمئن هستید؟' },
  addNewProject: { en: 'Add New Project', tr: 'Yeni Proje Ekle', fa: 'افزودن پروژه جدید' },
  editProjectTitle: { en: 'Edit Project', tr: 'Projeyi Düzenle', fa: 'ویرایش پروژه' },
  projectTitle: { en: 'Project Title', tr: 'Proje Başlığı', fa: 'عنوان پروژه' },
  assignTo: { en: 'Assign To', tr: 'Ata', fa: 'اختصاص به' },
  multiSelectHelper: { en: 'Hold Ctrl/Cmd to select multiple.', tr: 'Birden çok seçmek için Ctrl/Cmd tuşunu basılı tutun.', fa: 'برای انتخاب چندگانه کلید Ctrl/Cmd را نگه دارید.' },
  linkToTransaction: { en: 'Link to Transaction (Optional)', tr: 'İşleme Bağla (İsteğe Bağlı)', fa: 'اتصال به تراکنش (اختیاری)' },
  none: { en: 'None', tr: 'Hiçbiri', fa: 'هیچکدام' },
  dueDateOptional: { en: 'Due Date (Optional)', tr: 'Bitiş Tarihi (İsteğe Bağlı)', fa: 'تاریخ سررسید (اختیاری)' },
  saveProject: { en: 'Save Project', tr: 'Projeyi Kaydet', fa: 'ذخیره پروژه' },

  // Employee Detail Modal
  employeeDetails: { en: "{name}'s Details", tr: "{name}'in Detayları", fa: "جزئیات {name}" },
  totalCommissionEarned: { en: "Total Commission Earned", tr: "Kazanılan Toplam Komisyon", fa: "کل کمیسیون کسب شده" },
  totalServicesRendered: { en: "Total Services Rendered", tr: "Sunulan Toplam Hizmet", fa: "کل خدمات ارائه شده" },
  commissionHistory: { en: "Commission History", tr: "Komisyon Geçmişi", fa: "تاریخچه کمیسیون" },
  serviceProvided: { en: "Service Provided", tr: "Sağlanan Hizmet", fa: "خدمات ارائه شده" },
  commissionEarned: { en: "Commission Earned", tr: "Kazanılan Komisyon", fa: "کمیسیون کسب شده" },
  noCommissionHistory: { en: "No commission history to display.", tr: "Görüntülenecek komisyon geçmişi yok.", fa: "تاریخچه کمیسیونی برای نمایش وجود ندارد." },
};


const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lang, setLang] = useState<Language>('en');

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    }, [lang]);

    const t = useCallback((key: string, replacements?: Record<string, string | number>) => {
        let translation = translations[key]?.[lang] || key;
        if (replacements) {
            Object.entries(replacements).forEach(([placeholder, value]) => {
                translation = translation.replace(`{${placeholder}}`, String(value));
            });
        }
        return translation;
    }, [lang]);

    const formatCurrency = useCallback((amount: number, currency: Currency): string => {
        const options: Intl.NumberFormatOptions = {
            style: 'currency',
            currency: currency,
        };

        let locale = 'en-US';
        if (lang === 'tr') locale = 'tr-TR';
        // Farsi uses TRY formatting for this app's context
        if (lang === 'fa' && currency !== Currency.TRY) locale = 'fa-IR';
        if (currency === Currency.TRY) locale = 'tr-TR';

        return new Intl.NumberFormat(locale, options).format(amount);
    }, [lang]);


    return (
        <LanguageContext.Provider value={{ lang, setLang, t, formatCurrency }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslations = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslations must be used within a LanguageProvider');
    }
    return context;
};
