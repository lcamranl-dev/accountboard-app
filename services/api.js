// API configuration and base functions
// Auto-detect environment and set appropriate API URL
const API_BASE_URL = (() => {
  // Check if we're in production (deployed)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Production environment - use your Render backend URL
    return 'https://accountboard-backend.onrender.com/api';  // Your actual Render backend URL
  }
  // Development environment
  return 'http://localhost:3001/api';
})();

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/login';
        return;
      }
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async login(name, password, companyId = null) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { name, password, companyId },
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  }

  // Employee endpoints
  async getEmployees() {
    const response = await this.request('/employees');
    return response.employees;
  }

  async getEmployee(id) {
    const response = await this.request(`/employees/${id}`);
    return response.employee;
  }

  async createEmployee(employeeData) {
    const response = await this.request('/employees', {
      method: 'POST',
      body: employeeData,
    });
    return response.employee;
  }

  async updateEmployee(id, employeeData) {
    const response = await this.request(`/employees/${id}`, {
      method: 'PUT',
      body: employeeData,
    });
    return response.employee;
  }

  async deleteEmployee(id) {
    return this.request(`/employees/${id}`, { method: 'DELETE' });
  }

  async makePaymentToEmployee(id, paymentData) {
    return this.request(`/employees/${id}/payment`, {
      method: 'POST',
      body: paymentData,
    });
  }

  // Account endpoints
  async getAccounts() {
    const response = await this.request('/accounts');
    return response.accounts;
  }

  async getAccount(id) {
    const response = await this.request(`/accounts/${id}`);
    return response.account;
  }

  async createAccount(accountData) {
    const response = await this.request('/accounts', {
      method: 'POST',
      body: accountData,
    });
    return response.account;
  }

  async updateAccount(id, accountData) {
    const response = await this.request(`/accounts/${id}`, {
      method: 'PUT',
      body: accountData,
    });
    return response.account;
  }

  async deleteAccount(id) {
    return this.request(`/accounts/${id}`, { method: 'DELETE' });
  }

  async transferBetweenAccounts(fromAccountId, toAccountId, amount, description) {
    return this.request('/accounts/transfer', {
      method: 'POST',
      body: { fromAccountId, toAccountId, amount, description },
    });
  }

  async getAccountTransactions(id, page = 1, limit = 50) {
    const response = await this.request(`/accounts/${id}/transactions?page=${page}&limit=${limit}`);
    return response;
  }

  // Transaction endpoints
  async getTransactions(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await this.request(`/transactions?${params}`);
    return response;
  }

  async getTransaction(id) {
    const response = await this.request(`/transactions/${id}`);
    return response.transaction;
  }

  async createTransaction(transactionData) {
    const response = await this.request('/transactions', {
      method: 'POST',
      body: transactionData,
    });
    return response.transaction;
  }

  async updateTransaction(id, transactionData) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: transactionData,
    });
  }

  async deleteTransaction(id) {
    return this.request(`/transactions/${id}`, { method: 'DELETE' });
  }

  async approveTransaction(id, status) {
    return this.request(`/transactions/${id}/approval`, {
      method: 'PUT',
      body: { status },
    });
  }

  async addPaymentToTransaction(id, paymentData) {
    return this.request(`/transactions/${id}/payments`, {
      method: 'POST',
      body: paymentData,
    });
  }

  // Customer endpoints
  async getCustomers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await this.request(`/customers?${params}`);
    return response;
  }

  async getCustomer(id) {
    const response = await this.request(`/customers/${id}`);
    return response.customer;
  }

  async createCustomer(customerData) {
    const response = await this.request('/customers', {
      method: 'POST',
      body: customerData,
    });
    return response.customer;
  }

  async updateCustomer(id, customerData) {
    const response = await this.request(`/customers/${id}`, {
      method: 'PUT',
      body: customerData,
    });
    return response.customer;
  }

  async deleteCustomer(id) {
    return this.request(`/customers/${id}`, { method: 'DELETE' });
  }

  async getCustomerTransactions(id, page = 1, limit = 50) {
    const response = await this.request(`/customers/${id}/transactions?page=${page}&limit=${limit}`);
    return response;
  }

  async exportCustomersCSV() {
    const response = await fetch(`${API_BASE_URL}/customers/export/csv`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    return response.blob();
  }

  // Service endpoints
  async getServices() {
    const response = await this.request('/services');
    return response;
  }

  async getService(id) {
    const response = await this.request(`/services/services/${id}`);
    return response.service;
  }

  async createService(serviceData) {
    const response = await this.request('/services/services', {
      method: 'POST',
      body: serviceData,
    });
    return response.service;
  }

  async updateService(id, serviceData) {
    const response = await this.request(`/services/services/${id}`, {
      method: 'PUT',
      body: serviceData,
    });
    return response.service;
  }

  async deleteService(id) {
    return this.request(`/services/services/${id}`, { method: 'DELETE' });
  }

  async createExpenseCategory(categoryData) {
    const response = await this.request('/services/expense-categories', {
      method: 'POST',
      body: categoryData,
    });
    return response.expenseCategory;
  }

  async updateExpenseCategory(id, categoryData) {
    const response = await this.request(`/services/expense-categories/${id}`, {
      method: 'PUT',
      body: categoryData,
    });
    return response.expenseCategory;
  }

  async deleteExpenseCategory(id) {
    return this.request(`/services/expense-categories/${id}`, { method: 'DELETE' });
  }

  async getServiceStatistics(id) {
    const response = await this.request(`/services/services/${id}/statistics`);
    return response;
  }
}

// Create and export singleton instance
const apiService = new ApiService();

export default apiService;