const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('isp_auth_token');
}

export function getAuthHeader(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('isp_auth_token');
      }
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  }

  // Handle HTML or text fallback safely
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('isp_auth_token');
    }
    const cleanMessage = res.status === 403 
      ? 'Access forbidden or session expired. Please refresh.' 
      : res.status === 401 
      ? 'Unauthorized: please sign in again.'
      : text.replace(/<[^>]*>/g, '').trim().slice(0, 100) || `Request failed (${res.status})`;
    throw new Error(cleanMessage);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Unexpected server response format: Expected JSON but received ${contentType || 'text'}`);
  }
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(res => handleResponse<{ token: string; user: any }>(res)),

  switchPersona: (username: string) =>
    fetch(`${BASE_URL}/auth/switch-persona`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ username }),
    }).then(res => handleResponse<{ token: string; user: any }>(res)),

  getMe: () =>
    fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<{ user: any }>(res)),

  logout: () =>
    fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeader(),
    }).then(res => handleResponse<{ success: boolean }>(res)),

  changePassword: (passwords: { currentPassword: string; newPassword: string }) =>
    fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(passwords),
    }).then(res => handleResponse<{ success: boolean; message: string }>(res)),

  // Dashboard
  getDashboardAnalytics: () =>
    fetch(`${BASE_URL}/dashboard/analytics`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  getDashboardKPIs: () =>
    fetch(`${BASE_URL}/dashboard/analytics`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)).then(res => res.kpis),

  // Customers
  getCustomers: (params?: { search?: string; status?: string; paymentStatus?: string; packageId?: string }) =>
    fetch(`${BASE_URL}/customers${buildQuery(params)}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  getCustomer: (id: string) =>
    fetch(`${BASE_URL}/customers/${id}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  createCustomer: (customerData: any) =>
    fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(customerData),
    }).then(res => handleResponse<any>(res)),

  updateCustomer: (id: string, updates: any) =>
    fetch(`${BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(updates),
    }).then(res => handleResponse<any>(res)),

  deleteCustomer: (id: string) =>
    fetch(`${BASE_URL}/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  renewCustomer: (id: string, renewalData: any) =>
    fetch(`${BASE_URL}/customers/${id}/renew`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(renewalData),
    }).then(res => handleResponse<any>(res)),

  // Packages
  getPackages: () =>
    fetch(`${BASE_URL}/packages`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  createPackage: (data: any) =>
    fetch(`${BASE_URL}/packages`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  updatePackage: (id: string, updates: any) =>
    fetch(`${BASE_URL}/packages/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(updates),
    }).then(res => handleResponse<any>(res)),

  deletePackage: (id: string) =>
    fetch(`${BASE_URL}/packages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  // Invoices & Billing
  getInvoices: (params?: { search?: string; status?: string; customerId?: string }) =>
    fetch(`${BASE_URL}/invoices${buildQuery(params)}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  getInvoice: (id: string) =>
    fetch(`${BASE_URL}/invoices/${id}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  createInvoice: (data: any) =>
    fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  // Payments & Receipts
  getPayments: (params?: { search?: string; customerId?: string; method?: string }) =>
    fetch(`${BASE_URL}/payments${buildQuery(params)}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  recordPayment: (data: any) =>
    fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  getReceipt: (id: string) =>
    fetch(`${BASE_URL}/receipts/${id}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  // Expenses
  getExpenses: (params?: { categoryId?: string; startDate?: string; endDate?: string; search?: string; expenseType?: string; status?: string }) =>
    fetch(`${BASE_URL}/expenses${buildQuery(params)}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  getExpenseCategories: () =>
    fetch(`${BASE_URL}/expenses/categories`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  createExpenseCategory: (data: any) =>
    fetch(`${BASE_URL}/expenses/categories`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  updateExpenseCategory: (id: string, data: any) =>
    fetch(`${BASE_URL}/expenses/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  deleteExpenseCategory: (id: string) =>
    fetch(`${BASE_URL}/expenses/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  createExpense: (data: any) =>
    fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  updateExpense: (id: string, updates: any) =>
    fetch(`${BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(updates),
    }).then(res => handleResponse<any>(res)),

  deleteExpense: (id: string) =>
    fetch(`${BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  // Staff & Salaries
  getStaff: () =>
    fetch(`${BASE_URL}/staff`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  createStaff: (data: any) =>
    fetch(`${BASE_URL}/staff`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  updateStaff: (id: string, updates: any) =>
    fetch(`${BASE_URL}/staff/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(updates),
    }).then(res => handleResponse<any>(res)),

  getSalaries: (params?: { month?: string; staffId?: string }) =>
    fetch(`${BASE_URL}/salaries${buildQuery(params)}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  paySalary: (data: any) =>
    fetch(`${BASE_URL}/salaries`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  // Reports
  getDailyReport: (date?: string) =>
    fetch(`${BASE_URL}/reports/daily${buildQuery({ date })}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  getMonthlyReport: (month?: string) =>
    fetch(`${BASE_URL}/reports/monthly${buildQuery({ month })}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  getProfitLoss: (startDate?: string, endDate?: string) =>
    fetch(`${BASE_URL}/reports/profit-loss${buildQuery({ startDate, endDate })}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  getProfitLossReport: (startDate?: string, endDate?: string) =>
    fetch(`${BASE_URL}/reports/profit-loss${buildQuery({ startDate, endDate })}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  // Users & Roles
  getUsers: () =>
    fetch(`${BASE_URL}/users`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  createUser: (data: any) =>
    fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  updateUser: (id: string, updates: any) =>
    fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(updates),
    }).then(res => handleResponse<any>(res)),

  deleteUser: (id: string) =>
    fetch(`${BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  resetUserPassword: (id: string, password: string) =>
    fetch(`${BASE_URL}/users/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ password }),
    }).then(res => handleResponse<any>(res)),

  toggleUserStatus: (id: string) =>
    fetch(`${BASE_URL}/users/${id}/toggle-status`, {
      method: 'POST',
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  getRoles: () =>
    fetch(`${BASE_URL}/roles`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  getPermissions: () =>
    fetch(`${BASE_URL}/permissions`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  createRole: (data: any) =>
    fetch(`${BASE_URL}/roles`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  updateRole: (id: string, updates: any) =>
    fetch(`${BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(updates),
    }).then(res => handleResponse<any>(res)),

  // Audit Logs
  getAuditLogs: (params?: { search?: string; entityType?: string }) =>
    fetch(`${BASE_URL}/audit-logs${buildQuery(params)}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  getLogs: (params?: { search?: string; entityType?: string }) =>
    fetch(`${BASE_URL}/audit-logs${buildQuery(params)}`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  // Settings & Backups
  getSettings: () =>
    fetch(`${BASE_URL}/settings`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  updateSettings: (data: any) =>
    fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<any>(res)),

  createBackup: () =>
    fetch(`${BASE_URL}/settings/backup`, {
      method: 'POST',
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  getBackups: () =>
    fetch(`${BASE_URL}/settings/backups`, {
      headers: getAuthHeader(),
    }).then(res => handleResponse<any[]>(res)),

  restoreBackup: (filename: string) =>
    fetch(`${BASE_URL}/settings/restore`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ filename }),
    }).then(res => handleResponse<any>(res)),

  resetSeedData: () =>
    fetch(`${BASE_URL}/settings/reset-seed`, {
      method: 'POST',
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),

  clearAllData: () =>
    fetch(`${BASE_URL}/settings/clear-data`, {
      method: 'POST',
      headers: getAuthHeader(),
    }).then(res => handleResponse<any>(res)),
};
