import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from './security/crypto';
import { isSafeBackupFilename, isPathInsideDirectory } from './security/sanitizer';
import {
  Customer,
  InternetPackage,
  Invoice,
  Payment,
  PackageRenewal,
  Expense,
  ExpenseCategory,
  ExpenseItem,
  Staff,
  SalaryPayment,
  User,
  Role,
  Permission,
  AuditLog,
  SystemSettings,
  DashboardAnalytics,
  DashboardKPIs
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'isp_database.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

export { hashPassword, verifyPassword };

export interface StoredUser extends User {
  passwordHash: string;
}

export interface DatabaseSchema {
  version: number;
  settings: SystemSettings;
  permissions: Permission[];
  roles: Role[];
  users: StoredUser[];
  packages: InternetPackage[];
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  packageRenewals: PackageRenewal[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  staff: Staff[];
  salaryPayments: SalaryPayment[];
  auditLogs: AuditLog[];
  lastBackupDate?: string;
}

export function generateId(prefix: string, length = 6): string {
  const num = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
  return `${prefix}-${num}`;
}

export function generateSubscriberId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `SUB-${num}`;
}

// All Granular Action-Level System Permissions
export const SYSTEM_PERMISSIONS: Permission[] = [
  // Dashboard
  { id: 'view_dashboard', name: 'View Dashboard', category: 'dashboard', action: 'view', module: 'Dashboard', description: 'Access dashboard summary metrics and status cards' },
  { id: 'view_financial_kpis', name: 'View Financial KPIs', category: 'dashboard', action: 'view', module: 'Dashboard', description: 'View revenue, net profit, expenses, and growth analytics' },

  // Customers
  { id: 'view_customers', name: 'View Customers', category: 'customers', action: 'view', module: 'Customers', description: 'Access customer subscriber ledger and profile sheets' },
  { id: 'create_customer', name: 'Add / Register Customer', category: 'customers', action: 'create', module: 'Customers', description: 'Register new customer subscriptions with package & installation charges' },
  { id: 'edit_customer', name: 'Edit Customer', category: 'customers', action: 'edit', module: 'Customers', description: 'Update customer contact info, address, CNIC, and connection parameters' },
  { id: 'delete_customer', name: 'Delete Customer', category: 'customers', action: 'delete', module: 'Customers', description: 'Deactivate or permanently remove customer records' },
  { id: 'renew_customer', name: 'Renew / Upgrade Package', category: 'customers', action: 'manage', module: 'Customers', description: 'Process subscription package renewals, speed upgrades, and term extensions' },
  { id: 'export_customers', name: 'Export Customers', category: 'customers', action: 'export', module: 'Customers', description: 'Download customer lists as CSV or formatted Excel sheets' },

  // Sales & Billing (Invoices)
  { id: 'view_billing', name: 'View Sales / Invoices', category: 'billing', action: 'view', module: 'Sales & Billing', description: 'View monthly subscription invoices and sales records' },
  { id: 'create_invoice', name: 'Create Sale / Invoice', category: 'billing', action: 'create', module: 'Sales & Billing', description: 'Generate new manual bills, hardware sales, or connection invoices' },
  { id: 'edit_invoice', name: 'Edit Sale / Invoice', category: 'billing', action: 'edit', module: 'Sales & Billing', description: 'Update invoice items, due dates, discounts, or notes' },
  { id: 'delete_invoice', name: 'Delete Sale / Invoice', category: 'billing', action: 'delete', module: 'Sales & Billing', description: 'Cancel or delete unpaid invoice records' },
  { id: 'export_invoices', name: 'Export Sales / Invoices', category: 'billing', action: 'export', module: 'Sales & Billing', description: 'Export invoice registries to CSV/PDF' },

  // Payments & Receipts
  { id: 'view_payments', name: 'View Payments', category: 'payments', action: 'view', module: 'Payments & Receipts', description: 'Access payment transaction ledger and collections' },
  { id: 'receive_payment', name: 'Receive / Record Payment', category: 'payments', action: 'create', module: 'Payments & Receipts', description: 'Collect customer payments via Cash, Bank, EasyPaisa/JazzCash' },
  { id: 'delete_payment', name: 'Delete / Void Payment', category: 'payments', action: 'delete', module: 'Payments & Receipts', description: 'Void erroneous payment transactions and recalculate balances' },
  { id: 'print_receipt', name: 'Print Receipts (Thermal/POS)', category: 'payments', action: 'export', module: 'Payments & Receipts', description: 'Print 58mm/80mm thermal receipts and full printable payment vouchers' },

  // Expenses & Purchases
  { id: 'view_expenses', name: 'View Expenses & Purchases', category: 'expenses', action: 'view', module: 'Expenses', description: 'View operational expenses, upstream bandwidth bills, and purchases' },
  { id: 'create_expense', name: 'Add Expense / Purchase', category: 'expenses', action: 'create', module: 'Expenses', description: 'Record company purchases, hardware costs, and utility expenses' },
  { id: 'edit_expense', name: 'Edit Expense', category: 'expenses', action: 'edit', module: 'Expenses', description: 'Modify recorded expense details, categories, and payment methods' },
  { id: 'delete_expense', name: 'Delete Expense', category: 'expenses', action: 'delete', module: 'Expenses', description: 'Remove expense records from company ledger' },
  { id: 'export_expenses', name: 'Export Expenses', category: 'expenses', action: 'export', module: 'Expenses', description: 'Export expense breakdowns to spreadsheet formats' },

  // Packages & Services
  { id: 'view_packages', name: 'View Packages & Services', category: 'packages', action: 'view', module: 'Packages', description: 'Inspect available internet speeds and pricing plans' },
  { id: 'create_package', name: 'Add New Package', category: 'packages', action: 'create', module: 'Packages', description: 'Create new bandwidth speeds and tariff plans' },
  { id: 'edit_package', name: 'Edit Package', category: 'packages', action: 'edit', module: 'Packages', description: 'Update package rates, speed descriptions, and billing cycles' },
  { id: 'delete_package', name: 'Delete Package', category: 'packages', action: 'delete', module: 'Packages', description: 'Archive or remove unused internet package offerings' },

  // Employees & Staff Management
  { id: 'view_staff', name: 'View Employees / Staff', category: 'staff', action: 'view', module: 'Staff & Employees', description: 'View employee directory, roles, and designations' },
  { id: 'create_staff', name: 'Create Employee Account', category: 'staff', action: 'create', module: 'Staff & Employees', description: 'Add new employee user accounts and credentials' },
  { id: 'edit_staff', name: 'Edit Employee', category: 'staff', action: 'edit', module: 'Staff & Employees', description: 'Update employee contact details, status, and designations' },
  { id: 'delete_staff', name: 'Delete Employee', category: 'staff', action: 'delete', module: 'Staff & Employees', description: 'Deactivate or delete employee accounts' },
  { id: 'manage_permissions', name: 'Manage Roles & Permissions', category: 'staff', action: 'manage', module: 'Staff & Employees', description: 'Assign granular action-level permissions and customize access matrices' },
  { id: 'view_salaries', name: 'View Salaries', category: 'staff', action: 'view', module: 'Staff & Employees', description: 'Inspect monthly salary payment logs and staff payout status' },
  { id: 'manage_salaries', name: 'Manage & Disburse Salaries', category: 'staff', action: 'manage', module: 'Staff & Employees', description: 'Disburse staff salaries, bonuses, and record payroll expenses' },

  // Reports & Analytics
  { id: 'view_reports', name: 'View Reports', category: 'reports', action: 'view', module: 'Reports', description: 'Access daily, monthly, and operational performance reports' },
  { id: 'view_profit', name: 'View Revenue & Profit / Loss', category: 'reports', action: 'view', module: 'Reports', description: 'Inspect gross revenue, expenses margin, and net profit statements' },
  { id: 'export_reports', name: 'Export Reports', category: 'reports', action: 'export', module: 'Reports', description: 'Download financial and customer growth reports as CSV/Excel/PDF' },

  // Settings & System Security
  { id: 'manage_settings', name: 'Manage System Settings', category: 'settings', action: 'manage', module: 'Settings', description: 'Configure company profile, letterhead, thermal POS printer, and billing policies' },
  { id: 'manage_backups', name: 'Manage Database Backups', category: 'settings', action: 'manage', module: 'Settings', description: 'Create database snapshots, download backups, and restore data' },
  { id: 'view_audit_logs', name: 'View Activity / Audit Logs', category: 'audit', action: 'view', module: 'Audit Logs', description: 'Inspect detailed employee activity timeline, logins, and audit trails' },
];

const ALL_PERMISSION_IDS = SYSTEM_PERMISSIONS.map(p => p.id);

const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'ApexFiber Telecom & Broadband',
  companySlogan: 'Ultra High-Speed Gigabit Fiber & Corporate Internet',
  companyPhone: '+92 (051) 843-9000',
  companyEmail: 'billing@apexfiber.pk',
  companyAddress: 'Suite 402, Executive Plaza, Blue Area, Islamabad, Pakistan',
  ntnOrTaxId: 'NTN-8924019-3',
  currencySymbol: 'Rs.',
  currencyCode: 'PKR',
  thermalPrinterWidth: '80mm',
  receiptFooterNote: 'Thank you for choosing ApexFiber. For 24/7 Helpline & Support call 051-843-9000 or email support@apexfiber.pk',
  supportPhone: '+92 300 555-4321',
  wireRatePerMeter: 35,
  defaultInstallationFee: 2000,
  defaultRouterPrice: 4500,
  invoiceDueDays: 10,
};

// Predefined Roles exactly matching prompt requirements
const DEFAULT_ROLES: Role[] = [
  {
    id: 'role_super_admin',
    name: 'Super Admin',
    description: 'Unrestricted full authority over all application modules, employees, financial data, and system settings.',
    isSystem: true,
    permissions: ALL_PERMISSION_IDS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role_manager',
    name: 'Manager',
    description: 'Management-level access to oversee customers, billing, expenses, packages, staff, and analytical reports.',
    isSystem: true,
    permissions: [
      'view_dashboard',
      'view_financial_kpis',
      'view_customers',
      'create_customer',
      'edit_customer',
      'delete_customer',
      'renew_customer',
      'export_customers',
      'view_billing',
      'create_invoice',
      'edit_invoice',
      'delete_invoice',
      'export_invoices',
      'view_payments',
      'receive_payment',
      'delete_payment',
      'print_receipt',
      'view_expenses',
      'create_expense',
      'edit_expense',
      'delete_expense',
      'export_expenses',
      'view_packages',
      'create_package',
      'edit_package',
      'delete_package',
      'view_staff',
      'edit_staff',
      'view_salaries',
      'view_reports',
      'view_profit',
      'export_reports',
      'view_audit_logs',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role_sales_staff',
    name: 'Sales Staff',
    description: 'Sales-focused role for customer registration, renewals, generating invoices, receiving payments, and receipts.',
    isSystem: true,
    permissions: [
      'view_dashboard',
      'view_customers',
      'create_customer',
      'edit_customer',
      'renew_customer',
      'export_customers',
      'view_billing',
      'create_invoice',
      'export_invoices',
      'view_payments',
      'receive_payment',
      'print_receipt',
      'view_packages',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role_accountant',
    name: 'Accountant',
    description: 'Financial authority covering expenses, invoices, payments, payroll disbursements, revenue, and profit/loss reports.',
    isSystem: true,
    permissions: [
      'view_dashboard',
      'view_financial_kpis',
      'view_customers',
      'view_billing',
      'create_invoice',
      'edit_invoice',
      'export_invoices',
      'view_payments',
      'receive_payment',
      'print_receipt',
      'view_expenses',
      'create_expense',
      'edit_expense',
      'delete_expense',
      'export_expenses',
      'view_staff',
      'view_salaries',
      'manage_salaries',
      'view_reports',
      'view_profit',
      'export_reports',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role_receptionist',
    name: 'Receptionist',
    description: 'Front-desk operations for onboarding subscribers, package renewals, receiving payments, and printing thermal slips.',
    isSystem: true,
    permissions: [
      'view_dashboard',
      'view_customers',
      'create_customer',
      'renew_customer',
      'view_billing',
      'view_payments',
      'receive_payment',
      'print_receipt',
      'view_packages',
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role_custom',
    name: 'Custom Role',
    description: 'Custom employee role configured with individualized action-level permissions by Super Admin.',
    isSystem: true,
    permissions: ['view_dashboard', 'view_customers', 'view_billing'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'usr_super_admin',
    name: 'Engr. Farman Ullah',
    username: 'admin',
    email: 'admin@apexfiber.pk',
    phone: '+92 300 8439000',
    employeeId: 'EMP-001',
    jobTitle: 'Chief Executive Officer & Super Admin',
    roleId: 'role_super_admin',
    roleName: 'Super Admin',
    passwordHash: hashPassword('admin123'),
    status: 'active',
    lastLogin: '2026-08-26T09:15:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_manager',
    name: 'Tariq Mehmood',
    username: 'manager',
    email: 'manager@apexfiber.pk',
    phone: '+92 301 5551234',
    employeeId: 'EMP-102',
    jobTitle: 'Operations & Network Manager',
    roleId: 'role_manager',
    roleName: 'Manager',
    passwordHash: hashPassword('admin123'),
    status: 'active',
    lastLogin: '2026-08-25T14:20:00.000Z',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'usr_sales',
    name: 'Zeeshan Malik',
    username: 'sales',
    email: 'sales@apexfiber.pk',
    phone: '+92 333 9876543',
    employeeId: 'EMP-103',
    jobTitle: 'Senior Sales Executive',
    roleId: 'role_sales_staff',
    roleName: 'Sales Staff',
    passwordHash: hashPassword('admin123'),
    status: 'active',
    lastLogin: '2026-08-26T11:30:00.000Z',
    createdAt: '2026-01-08T00:00:00.000Z',
    updatedAt: '2026-01-08T00:00:00.000Z',
  },
  {
    id: 'usr_accountant',
    name: 'Hassan Raza (CPA)',
    username: 'accountant',
    email: 'finance@apexfiber.pk',
    phone: '+92 321 4567890',
    employeeId: 'EMP-104',
    jobTitle: 'Chief Financial Accountant',
    roleId: 'role_accountant',
    roleName: 'Accountant',
    passwordHash: hashPassword('admin123'),
    status: 'active',
    lastLogin: '2026-08-26T08:45:00.000Z',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'usr_receptionist',
    name: 'Bilal Ahmed',
    username: 'operator',
    email: 'frontdesk@apexfiber.pk',
    phone: '+92 312 7654321',
    employeeId: 'EMP-105',
    jobTitle: 'Customer Care & Receptionist',
    roleId: 'role_receptionist',
    roleName: 'Receptionist',
    passwordHash: hashPassword('admin123'),
    status: 'active',
    lastLogin: '2026-08-26T10:00:00.000Z',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
  },
];

const DEFAULT_PACKAGES: InternetPackage[] = [
  {
    id: 'pkg_12mbps',
    name: '12 Mbps Home Starter',
    speed: '12 Mbps',
    monthlyPrice: 1800,
    billingCycle: 'monthly',
    description: 'Unlimited high-speed optical fiber for web browsing, streaming and social media.',
    status: 'active',
    totalSubscribers: 14,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_16mbps',
    name: '16 Mbps Turbo Home',
    speed: '16 Mbps',
    monthlyPrice: 2400,
    billingCycle: 'monthly',
    description: 'Fast dual-channel fiber connection with HD video support and low latency.',
    status: 'active',
    totalSubscribers: 18,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_20mbps',
    name: '20 Mbps Smart Family',
    speed: '20 Mbps',
    monthlyPrice: 3000,
    billingCycle: 'monthly',
    description: 'Popular choice for medium households with 4-6 connected smart devices.',
    status: 'active',
    totalSubscribers: 26,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_30mbps',
    name: '30 Mbps Pro Streamer & Gaming',
    speed: '30 Mbps',
    monthlyPrice: 4200,
    billingCycle: 'monthly',
    description: 'Dedicated low ping route for 4K streaming, Twitch and competitive gaming.',
    status: 'active',
    totalSubscribers: 19,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_50mbps',
    name: '50 Mbps Business Fiber',
    speed: '50 Mbps',
    monthlyPrice: 6500,
    billingCycle: 'monthly',
    description: 'Symmetric bandwidth for corporate offices, software houses and creators.',
    status: 'active',
    totalSubscribers: 9,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_100mbps',
    name: '100 Mbps Gigabit Enterprise',
    speed: '100 Mbps',
    monthlyPrice: 11000,
    billingCycle: 'monthly',
    description: 'Enterprise grade leased-line grade SLA with static public IP address included.',
    status: 'active',
    totalSubscribers: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat_salaries', name: 'Staff Salary & Bonuses', description: 'Technician, operator and staff remuneration' },
  { id: 'cat_upstream', name: 'Internet / Upstream Bandwidth Cost', description: 'Monthly upstream provider (PTCL / Transworld) bandwidth fee' },
  { id: 'cat_rent', name: 'Office & POP Site Rent', description: 'Premises rent for central NOC and distribution POPs' },
  { id: 'cat_electricity', name: 'Electricity & Generator Fuel', description: 'WAPDA utility bills and backup generator diesel' },
  { id: 'cat_routers', name: 'Router & ONU Equipment Purchase', description: 'Dual-band routers, GPON ONTs, and media converters' },
  { id: 'cat_cable', name: 'Fiber Cable & Drop Wire Purchase', description: '2-core, 4-core drop cables and steel messenger wires' },
  { id: 'cat_splicing_tools', name: 'Splicing & Tool Maintenance', description: 'Fusion splicer electrodes, cleavers, OTDR and toolkits' },
  { id: 'cat_transport', name: 'Fuel & Vehicle Maintenance', description: 'Motorcycles and service van fuel for line repair team' },
  { id: 'cat_office', name: 'Office Supplies & Refreshment', description: 'Printing papers, thermal rolls, stationary and team tea' },
  { id: 'cat_marketing', name: 'Marketing & Local Flyers', description: 'Banners, flyers and local awareness campaigns' },
  { id: 'cat_other', name: 'Miscellaneous Expenses', description: 'Unplanned repairs and general operational costs' },
];

const DEFAULT_STAFF: Staff[] = [
  {
    id: 'stf_01',
    staffId: 'STF-101',
    name: 'Muhammad Asif',
    contact: '+92 300 1234567',
    cnic: '61101-1234567-1',
    designation: 'Senior Fiber Network Engineer',
    joiningDate: '2025-02-01',
    basicSalary: 65000,
    status: 'active',
    notes: 'In-charge of central OLT and main ring distribution',
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'stf_02',
    staffId: 'STF-102',
    name: 'Zubair Shah',
    contact: '+92 312 9876543',
    cnic: '61101-9876543-3',
    designation: 'Field Splicing Technician',
    joiningDate: '2025-06-15',
    basicSalary: 45000,
    status: 'active',
    notes: 'Handles drop line joints and new home connections',
    createdAt: '2025-06-15T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'stf_03',
    staffId: 'STF-103',
    name: 'Kamran Ali',
    contact: '+92 333 4567890',
    cnic: '61101-4567890-5',
    designation: 'Customer Support & Billing Operator',
    joiningDate: '2025-09-01',
    basicSalary: 38000,
    status: 'active',
    notes: 'Handles front desk inquiries, renewals and payments',
    createdAt: '2025-09-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'stf_04',
    staffId: 'STF-104',
    name: 'Arslan Nawaz',
    contact: '+92 345 6789012',
    cnic: '61101-6789012-7',
    designation: 'Line Repair & Maintenance Helper',
    joiningDate: '2025-11-10',
    basicSalary: 30000,
    status: 'active',
    notes: 'Emergency night shifts and aerial cable re-pulling',
    createdAt: '2025-11-10T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

class DatabaseService {
  private db: DatabaseSchema | null = null;

  constructor() {
    this.ensureDataDirectories();
    this.loadDatabase();
  }

  private ensureDataDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  private loadDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
      } else {
        this.initDefaultDatabase();
      }
    } catch (err) {
      console.error('Error loading database, initializing defaults:', err);
      this.initDefaultDatabase();
    }
  }

  public saveDatabase() {
    try {
      if (this.db) {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  private initDefaultDatabase() {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthStr = now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

    // Generate Seed Customers
    const sampleCustomers: Customer[] = [
      {
        id: 'CUST-1001',
        subscriberId: 'SUB-841920',
        name: 'Dr. Zeeshan Haider',
        fatherOrCompanyName: 'Haider Clinic & Lab',
        contactNumber: '+92 300 5123456',
        cnic: '37405-1829304-1',
        address: 'House 42, Street 18, Sector G-10/2',
        cityArea: 'Islamabad West',
        notes: 'VIP Customer. Installed GPON Dual Band ONU.',
        packageId: 'pkg_30mbps',
        packageName: '30 Mbps Pro Streamer & Gaming',
        packageSpeed: '30 Mbps',
        monthlyFee: 4200,
        billingCycle: 'monthly',
        installationDate: '2026-03-10',
        activationDate: '2026-03-10',
        expiryDate: `${currentMonthStr}-10`,
        routerPrice: 4500,
        installationCharges: 2000,
        wireCharges: 1050,
        wireLengthMeters: 30,
        otherCharges: 0,
        discount: 500,
        totalInitialCharges: 7050,
        paidInitialAmount: 7050,
        remainingInitialAmount: 0,
        accountStatus: 'active',
        paymentStatus: 'paid',
        totalBilled: 28050,
        totalPaid: 28050,
        totalOutstanding: 0,
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-08-10T10:00:00.000Z',
      },
      {
        id: 'CUST-1002',
        subscriberId: 'SUB-841921',
        name: 'Muhammad Usman Khan',
        fatherOrCompanyName: 'Khan Brothers Traders',
        contactNumber: '+92 321 9845120',
        cnic: '37405-7281930-3',
        address: 'Shop 14, Commercial Market, Sector F-8/3',
        cityArea: 'Blue Area Commercial',
        notes: 'Requires static IP for remote surveillance cameras.',
        packageId: 'pkg_50mbps',
        packageName: '50 Mbps Business Fiber',
        packageSpeed: '50 Mbps',
        monthlyFee: 6500,
        billingCycle: 'monthly',
        installationDate: '2026-04-05',
        activationDate: '2026-04-05',
        expiryDate: `${currentMonthStr}-05`,
        routerPrice: 5000,
        installationCharges: 2500,
        wireCharges: 1400,
        wireLengthMeters: 40,
        otherCharges: 500,
        discount: 0,
        totalInitialCharges: 9400,
        paidInitialAmount: 9400,
        remainingInitialAmount: 0,
        accountStatus: 'active',
        paymentStatus: 'paid',
        totalBilled: 41900,
        totalPaid: 41900,
        totalOutstanding: 0,
        createdAt: '2026-04-05T11:30:00.000Z',
        updatedAt: '2026-08-05T11:30:00.000Z',
      },
      {
        id: 'CUST-1003',
        subscriberId: 'SUB-841922',
        name: 'Saira Bano',
        fatherOrCompanyName: 'Late Capt. Mansoor',
        contactNumber: '+92 333 5849102',
        cnic: '37405-9018273-6',
        address: 'Flat 3B, Margalla Heights, Sector E-11/1',
        cityArea: 'E-11 Heights',
        notes: 'Online teaching and Zoom meetings setup.',
        packageId: 'pkg_20mbps',
        packageName: '20 Mbps Smart Family',
        packageSpeed: '20 Mbps',
        monthlyFee: 3000,
        billingCycle: 'monthly',
        installationDate: '2026-06-01',
        activationDate: '2026-06-01',
        expiryDate: `${currentMonthStr}-01`,
        routerPrice: 4500,
        installationCharges: 2000,
        wireCharges: 875,
        wireLengthMeters: 25,
        otherCharges: 0,
        discount: 375,
        totalInitialCharges: 7000,
        paidInitialAmount: 5000,
        remainingInitialAmount: 2000,
        accountStatus: 'active',
        paymentStatus: 'partial',
        totalBilled: 16000,
        totalPaid: 13000,
        totalOutstanding: 3000,
        createdAt: '2026-06-01T09:00:00.000Z',
        updatedAt: '2026-08-01T09:00:00.000Z',
      },
      {
        id: 'CUST-1004',
        subscriberId: 'SUB-841923',
        name: 'TechMatrix Software House',
        fatherOrCompanyName: 'CEO Daniyal Ahmed',
        contactNumber: '+92 345 8192034',
        cnic: '37405-3920194-9',
        address: 'Plot 89, Software Tech Park, I-9/3',
        cityArea: 'Industrial Zone',
        notes: 'Dual WAN failover setup. 24/7 dedicated line.',
        packageId: 'pkg_100mbps',
        packageName: '100 Mbps Gigabit Enterprise',
        packageSpeed: '100 Mbps',
        monthlyFee: 11000,
        billingCycle: 'monthly',
        installationDate: '2026-02-15',
        activationDate: '2026-02-15',
        expiryDate: `${currentMonthStr}-15`,
        routerPrice: 8500,
        installationCharges: 4000,
        wireCharges: 2800,
        wireLengthMeters: 80,
        otherCharges: 1000,
        discount: 1300,
        totalInitialCharges: 15000,
        paidInitialAmount: 15000,
        remainingInitialAmount: 0,
        accountStatus: 'active',
        paymentStatus: 'paid',
        totalBilled: 81000,
        totalPaid: 81000,
        totalOutstanding: 0,
        createdAt: '2026-02-15T14:00:00.000Z',
        updatedAt: '2026-08-15T14:00:00.000Z',
      },
      {
        id: 'CUST-1005',
        subscriberId: 'SUB-841924',
        name: 'Chaudhry Waqas',
        fatherOrCompanyName: 'Chaudhry Akram',
        contactNumber: '+92 301 7778899',
        cnic: '37405-5544332-1',
        address: 'House 112, Street 4, Sector I-10/4',
        cityArea: 'I-10 Residential',
        notes: 'Payment delayed for 2 weeks. Reminder SMS sent.',
        packageId: 'pkg_16mbps',
        packageName: '16 Mbps Turbo Home',
        packageSpeed: '16 Mbps',
        monthlyFee: 2400,
        billingCycle: 'monthly',
        installationDate: '2026-05-18',
        activationDate: '2026-05-18',
        expiryDate: `${currentMonthStr}-18`,
        routerPrice: 4500,
        installationCharges: 2000,
        wireCharges: 1225,
        wireLengthMeters: 35,
        otherCharges: 0,
        discount: 225,
        totalInitialCharges: 7500,
        paidInitialAmount: 7500,
        remainingInitialAmount: 0,
        accountStatus: 'active',
        paymentStatus: 'pending',
        totalBilled: 14700,
        totalPaid: 12300,
        totalOutstanding: 2400,
        createdAt: '2026-05-18T16:00:00.000Z',
        updatedAt: '2026-08-18T16:00:00.000Z',
      },
      {
        id: 'CUST-1006',
        subscriberId: 'SUB-841925',
        name: 'Ahmad Bilal',
        fatherOrCompanyName: 'Bilal Cloth House',
        contactNumber: '+92 313 4455667',
        cnic: '37405-6677889-7',
        address: 'House 9, Lane 2, Sector G-9/1',
        cityArea: 'Karachi Company',
        notes: 'Overdue bill from last month. Grace period active.',
        packageId: 'pkg_12mbps',
        packageName: '12 Mbps Home Starter',
        packageSpeed: '12 Mbps',
        monthlyFee: 1800,
        billingCycle: 'monthly',
        installationDate: '2026-01-20',
        activationDate: '2026-01-20',
        expiryDate: `${prevMonthStr}-20`,
        routerPrice: 4500,
        installationCharges: 2000,
        wireCharges: 700,
        wireLengthMeters: 20,
        otherCharges: 0,
        discount: 200,
        totalInitialCharges: 7000,
        paidInitialAmount: 7000,
        remainingInitialAmount: 0,
        accountStatus: 'active',
        paymentStatus: 'overdue',
        totalBilled: 19600,
        totalPaid: 16000,
        totalOutstanding: 3600,
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-08-20T10:00:00.000Z',
      },
      {
        id: 'CUST-1007',
        subscriberId: 'SUB-841926',
        name: 'Rana Hammad',
        fatherOrCompanyName: 'Rana Munir (Advocate)',
        contactNumber: '+92 300 9988776',
        cnic: '37405-1122334-5',
        address: 'House 77, Street 25, Sector F-10/2',
        cityArea: 'F-10 Sector',
        notes: 'Temporarily inactive due to house renovation.',
        packageId: 'pkg_20mbps',
        packageName: '20 Mbps Smart Family',
        packageSpeed: '20 Mbps',
        monthlyFee: 3000,
        billingCycle: 'monthly',
        installationDate: '2026-03-01',
        activationDate: '2026-03-01',
        expiryDate: `${prevMonthStr}-01`,
        routerPrice: 4500,
        installationCharges: 2000,
        wireCharges: 1050,
        wireLengthMeters: 30,
        otherCharges: 0,
        discount: 500,
        totalInitialCharges: 7050,
        paidInitialAmount: 7050,
        remainingInitialAmount: 0,
        accountStatus: 'inactive',
        paymentStatus: 'paid',
        totalBilled: 19050,
        totalPaid: 19050,
        totalOutstanding: 0,
        createdAt: '2026-03-01T12:00:00.000Z',
        updatedAt: '2026-07-01T12:00:00.000Z',
      }
    ];

    // Generate Seed Invoices
    const sampleInvoices: Invoice[] = [
      {
        id: 'INV-2026-001',
        invoiceNumber: 'INV-2026-001',
        customerId: 'CUST-1001',
        subscriberId: 'SUB-841920',
        customerName: 'Dr. Zeeshan Haider',
        customerContact: '+92 300 5123456',
        customerAddress: 'House 42, Street 18, Sector G-10/2',
        invoiceType: 'monthly_subscription',
        packageId: 'pkg_30mbps',
        packageName: '30 Mbps Pro Streamer & Gaming',
        packageSpeed: '30 Mbps',
        billingPeriodStart: `${currentMonthStr}-01`,
        billingPeriodEnd: `${currentMonthStr}-30`,
        issueDate: `${currentMonthStr}-01`,
        dueDate: `${currentMonthStr}-10`,
        monthlyPackageFee: 4200,
        routerCharges: 0,
        installationCharges: 0,
        wireCharges: 0,
        otherCharges: 0,
        previousBalance: 0,
        discount: 0,
        totalAmount: 4200,
        paidAmount: 4200,
        remainingAmount: 0,
        paymentStatus: 'paid',
        items: [
          { id: 'item_1', description: 'Monthly Subscription (30 Mbps Pro Fiber)', quantity: 1, unitPrice: 4200, total: 4200 }
        ],
        notes: 'Regular monthly bill paid via Bank Transfer.',
        createdAt: `${currentMonthStr}-01T08:00:00.000Z`,
        updatedAt: `${currentMonthStr}-03T10:30:00.000Z`,
      },
      {
        id: 'INV-2026-002',
        invoiceNumber: 'INV-2026-002',
        customerId: 'CUST-1002',
        subscriberId: 'SUB-841921',
        customerName: 'Muhammad Usman Khan',
        customerContact: '+92 321 9845120',
        customerAddress: 'Shop 14, Commercial Market, Sector F-8/3',
        invoiceType: 'monthly_subscription',
        packageId: 'pkg_50mbps',
        packageName: '50 Mbps Business Fiber',
        packageSpeed: '50 Mbps',
        billingPeriodStart: `${currentMonthStr}-01`,
        billingPeriodEnd: `${currentMonthStr}-30`,
        issueDate: `${currentMonthStr}-01`,
        dueDate: `${currentMonthStr}-10`,
        monthlyPackageFee: 6500,
        routerCharges: 0,
        installationCharges: 0,
        wireCharges: 0,
        otherCharges: 0,
        previousBalance: 0,
        discount: 0,
        totalAmount: 6500,
        paidAmount: 6500,
        remainingAmount: 0,
        paymentStatus: 'paid',
        items: [
          { id: 'item_2', description: 'Monthly Corporate Internet (50 Mbps)', quantity: 1, unitPrice: 6500, total: 6500 }
        ],
        notes: 'Paid in Cash at NOC office.',
        createdAt: `${currentMonthStr}-01T08:15:00.000Z`,
        updatedAt: `${currentMonthStr}-04T14:20:00.000Z`,
      },
      {
        id: 'INV-2026-003',
        invoiceNumber: 'INV-2026-003',
        customerId: 'CUST-1003',
        subscriberId: 'SUB-841922',
        customerName: 'Saira Bano',
        customerContact: '+92 333 5849102',
        customerAddress: 'Flat 3B, Margalla Heights, Sector E-11/1',
        invoiceType: 'monthly_subscription',
        packageId: 'pkg_20mbps',
        packageName: '20 Mbps Smart Family',
        packageSpeed: '20 Mbps',
        billingPeriodStart: `${currentMonthStr}-01`,
        billingPeriodEnd: `${currentMonthStr}-30`,
        issueDate: `${currentMonthStr}-01`,
        dueDate: `${currentMonthStr}-10`,
        monthlyPackageFee: 3000,
        routerCharges: 0,
        installationCharges: 0,
        wireCharges: 0,
        otherCharges: 0,
        previousBalance: 2000,
        discount: 0,
        totalAmount: 5000,
        paidAmount: 2000,
        remainingAmount: 3000,
        paymentStatus: 'partial',
        items: [
          { id: 'item_3_1', description: 'Monthly Subscription (20 Mbps Family)', quantity: 1, unitPrice: 3000, total: 3000 },
          { id: 'item_3_2', description: 'Previous Remaining Balance (Installation Dues)', quantity: 1, unitPrice: 2000, total: 2000 }
        ],
        notes: 'Partial payment of Rs. 2,000 received via Easypaisa.',
        createdAt: `${currentMonthStr}-01T08:30:00.000Z`,
        updatedAt: `${currentMonthStr}-06T16:00:00.000Z`,
      },
      {
        id: 'INV-2026-004',
        invoiceNumber: 'INV-2026-004',
        customerId: 'CUST-1004',
        subscriberId: 'SUB-841924',
        customerName: 'TechMatrix Software House',
        customerContact: '+92 345 8192034',
        customerAddress: 'Plot 89, Software Tech Park, I-9/3',
        invoiceType: 'monthly_subscription',
        packageId: 'pkg_100mbps',
        packageName: '100 Mbps Gigabit Enterprise',
        packageSpeed: '100 Mbps',
        billingPeriodStart: `${currentMonthStr}-01`,
        billingPeriodEnd: `${currentMonthStr}-30`,
        issueDate: `${currentMonthStr}-01`,
        dueDate: `${currentMonthStr}-10`,
        monthlyPackageFee: 11000,
        routerCharges: 0,
        installationCharges: 0,
        wireCharges: 0,
        otherCharges: 0,
        previousBalance: 0,
        discount: 0,
        totalAmount: 11000,
        paidAmount: 11000,
        remainingAmount: 0,
        paymentStatus: 'paid',
        items: [
          { id: 'item_4', description: 'Monthly Gigabit Enterprise Leased Line (100 Mbps)', quantity: 1, unitPrice: 11000, total: 11000 }
        ],
        notes: 'Direct Online Bank Transfer to company account.',
        createdAt: `${currentMonthStr}-01T08:45:00.000Z`,
        updatedAt: `${currentMonthStr}-02T11:00:00.000Z`,
      },
      {
        id: 'INV-2026-005',
        invoiceNumber: 'INV-2026-005',
        customerId: 'CUST-1005',
        subscriberId: 'SUB-841924',
        customerName: 'Chaudhry Waqas',
        customerContact: '+92 301 7778899',
        customerAddress: 'House 112, Street 4, Sector I-10/4',
        invoiceType: 'monthly_subscription',
        packageId: 'pkg_16mbps',
        packageName: '16 Mbps Turbo Home',
        packageSpeed: '16 Mbps',
        billingPeriodStart: `${currentMonthStr}-01`,
        billingPeriodEnd: `${currentMonthStr}-30`,
        issueDate: `${currentMonthStr}-01`,
        dueDate: `${currentMonthStr}-10`,
        monthlyPackageFee: 2400,
        routerCharges: 0,
        installationCharges: 0,
        wireCharges: 0,
        otherCharges: 0,
        previousBalance: 0,
        discount: 0,
        totalAmount: 2400,
        paidAmount: 0,
        remainingAmount: 2400,
        paymentStatus: 'pending',
        items: [
          { id: 'item_5', description: 'Monthly Subscription (16 Mbps Turbo Home)', quantity: 1, unitPrice: 2400, total: 2400 }
        ],
        notes: 'Payment collection pending. Due date passed.',
        createdAt: `${currentMonthStr}-01T09:00:00.000Z`,
        updatedAt: `${currentMonthStr}-01T09:00:00.000Z`,
      },
      {
        id: 'INV-2026-006',
        invoiceNumber: 'INV-2026-006',
        customerId: 'CUST-1006',
        subscriberId: 'SUB-841925',
        customerName: 'Ahmad Bilal',
        customerContact: '+92 313 4455667',
        customerAddress: 'House 9, Lane 2, Sector G-9/1',
        invoiceType: 'monthly_subscription',
        packageId: 'pkg_12mbps',
        packageName: '12 Mbps Home Starter',
        packageSpeed: '12 Mbps',
        billingPeriodStart: `${prevMonthStr}-01`,
        billingPeriodEnd: `${prevMonthStr}-30`,
        issueDate: `${prevMonthStr}-01`,
        dueDate: `${prevMonthStr}-10`,
        monthlyPackageFee: 1800,
        routerCharges: 0,
        installationCharges: 0,
        wireCharges: 0,
        otherCharges: 0,
        previousBalance: 1800,
        discount: 0,
        totalAmount: 3600,
        paidAmount: 0,
        remainingAmount: 3600,
        paymentStatus: 'overdue',
        items: [
          { id: 'item_6_1', description: 'Monthly Subscription (12 Mbps)', quantity: 1, unitPrice: 1800, total: 1800 },
          { id: 'item_6_2', description: 'Previous Unpaid Subscription Bill', quantity: 1, unitPrice: 1800, total: 1800 }
        ],
        notes: 'Overdue bill. Second reminder issued.',
        createdAt: `${prevMonthStr}-01T09:00:00.000Z`,
        updatedAt: `${prevMonthStr}-01T09:00:00.000Z`,
      }
    ];

    // Generate Seed Payments
    const samplePayments: Payment[] = [
      {
        id: 'PAY-1001',
        receiptNumber: 'RCP-2026-001',
        invoiceId: 'INV-2026-004',
        customerId: 'CUST-1004',
        subscriberId: 'SUB-841924',
        customerName: 'TechMatrix Software House',
        amount: 11000,
        paymentDate: `${currentMonthStr}-02`,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'HBL-FT-94018274',
        receivedBy: 'Hassan Raza (CPA)',
        notes: 'Direct online transfer via HBL digital banking.',
        createdAt: `${currentMonthStr}-02T11:00:00.000Z`,
      },
      {
        id: 'PAY-1002',
        receiptNumber: 'RCP-2026-002',
        invoiceId: 'INV-2026-001',
        customerId: 'CUST-1001',
        subscriberId: 'SUB-841920',
        customerName: 'Dr. Zeeshan Haider',
        amount: 4200,
        paymentDate: `${currentMonthStr}-03`,
        paymentMethod: 'online_transfer',
        referenceNumber: 'MZN-7749201',
        receivedBy: 'Hassan Raza (CPA)',
        notes: 'Meezan Bank mobile app payment.',
        createdAt: `${currentMonthStr}-03T10:30:00.000Z`,
      },
      {
        id: 'PAY-1003',
        receiptNumber: 'RCP-2026-003',
        invoiceId: 'INV-2026-002',
        customerId: 'CUST-1002',
        subscriberId: 'SUB-841921',
        customerName: 'Muhammad Usman Khan',
        amount: 6500,
        paymentDate: `${currentMonthStr}-04`,
        paymentMethod: 'cash',
        referenceNumber: 'CASH-REC-104',
        receivedBy: 'Bilal Ahmed',
        notes: 'Received in cash at main counter. Thermal receipt issued.',
        createdAt: `${currentMonthStr}-04T14:20:00.000Z`,
      },
      {
        id: 'PAY-1004',
        receiptNumber: 'RCP-2026-004',
        invoiceId: 'INV-2026-003',
        customerId: 'CUST-1003',
        subscriberId: 'SUB-841922',
        customerName: 'Saira Bano',
        amount: 2000,
        paymentDate: `${currentMonthStr}-06`,
        paymentMethod: 'easypaisa_jazzcash',
        referenceNumber: 'EP-9028194',
        receivedBy: 'Bilal Ahmed',
        notes: 'Partial payment received through Easypaisa merchant code.',
        createdAt: `${currentMonthStr}-06T16:00:00.000Z`,
      },
    ];

    // Seed Expenses
    const sampleExpenses: Expense[] = [
      {
        id: 'EXP-1001',
        categoryId: 'cat_upstream',
        categoryName: 'Internet / Upstream Bandwidth Cost',
        description: 'PTCL / Transworld 1 Gbps Main Fiber Upstream Bandwidth Monthly Fee',
        amount: 45000,
        date: `${currentMonthStr}-02`,
        paymentMethod: 'bank_transfer',
        vendorOrPayee: 'PTCL Enterprise Wholesale Division',
        addedBy: 'Engr. Farman Ullah',
        referenceNumber: 'PTCL-BW-2026-08',
        notes: 'Main upstream transit link paid on time.',
        createdAt: `${currentMonthStr}-02T09:00:00.000Z`,
        updatedAt: `${currentMonthStr}-02T09:00:00.000Z`,
      },
      {
        id: 'EXP-1002',
        categoryId: 'cat_rent',
        categoryName: 'Office & POP Site Rent',
        description: 'Executive Plaza NOC Office & 2 Distribution Tower POP site rent',
        amount: 35000,
        date: `${currentMonthStr}-05`,
        paymentMethod: 'bank_transfer',
        vendorOrPayee: 'Executive Plaza Management',
        addedBy: 'Hassan Raza (CPA)',
        referenceNumber: 'RENT-AUG-26',
        notes: 'Includes rooftop tower generator space.',
        createdAt: `${currentMonthStr}-05T10:00:00.000Z`,
        updatedAt: `${currentMonthStr}-05T10:00:00.000Z`,
      },
      {
        id: 'EXP-1003',
        categoryId: 'cat_electricity',
        categoryName: 'Electricity & Generator Fuel',
        description: 'WAPDA Commercial NOC Electricity Bill + 50 Liters Diesel for Backup GenSet',
        amount: 18500,
        date: `${currentMonthStr}-08`,
        paymentMethod: 'cash',
        vendorOrPayee: 'IESCO / PSO Fuel Station',
        addedBy: 'Hassan Raza (CPA)',
        notes: 'UPS batteries checked and fully operational.',
        createdAt: `${currentMonthStr}-08T11:30:00.000Z`,
        updatedAt: `${currentMonthStr}-08T11:30:00.000Z`,
      },
      {
        id: 'EXP-1004',
        categoryId: 'cat_cable',
        categoryName: 'Fiber Cable & Drop Wire Purchase',
        description: 'Purchased 4 Drums (4000 meters) 2-Core Aerial Drop Fiber Cable',
        amount: 28000,
        date: `${currentMonthStr}-12`,
        paymentMethod: 'cash',
        vendorOrPayee: 'Al-Madina Optic Traders Rawalpindi',
        addedBy: 'Tariq Mehmood',
        notes: 'For expansion in Sector G-10 and F-10.',
        createdAt: `${currentMonthStr}-12T14:00:00.000Z`,
        updatedAt: `${currentMonthStr}-12T14:00:00.000Z`,
      },
      {
        id: 'EXP-1005',
        categoryId: 'cat_routers',
        categoryName: 'Router & ONU Equipment Purchase',
        description: 'Purchased 15 Units XPON Dual Band Gigabit ONU Routers',
        amount: 48000,
        date: `${currentMonthStr}-15`,
        paymentMethod: 'online_transfer',
        vendorOrPayee: 'FiberStore Pakistan Tech',
        addedBy: 'Tariq Mehmood',
        referenceNumber: 'FS-XPON-490',
        notes: 'Stock received and tested for customer installations.',
        createdAt: `${currentMonthStr}-15T15:00:00.000Z`,
        updatedAt: `${currentMonthStr}-15T15:00:00.000Z`,
      },
      {
        id: 'EXP-1006',
        categoryId: 'cat_transport',
        categoryName: 'Fuel & Vehicle Maintenance',
        description: 'Monthly petrol allowance for 3 technician motorcycles',
        amount: 9000,
        date: `${currentMonthStr}-18`,
        paymentMethod: 'cash',
        vendorOrPayee: 'Field Technical Team',
        addedBy: 'Hassan Raza (CPA)',
        notes: 'For daily complaints and installation visits.',
        createdAt: `${currentMonthStr}-18T10:00:00.000Z`,
        updatedAt: `${currentMonthStr}-18T10:00:00.000Z`,
      }
    ];

    // Seed Salary Payments
    const sampleSalaries: SalaryPayment[] = [
      {
        id: 'SAL-2026-08-01',
        staffId: 'STF-101',
        staffName: 'Muhammad Asif',
        designation: 'Senior Fiber Network Engineer',
        salaryMonth: currentMonthStr,
        basicSalary: 65000,
        bonus: 5000,
        deduction: 0,
        netSalary: 70000,
        paidAmount: 70000,
        remainingSalary: 0,
        paymentDate: `${currentMonthStr}-01`,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'paid',
        processedBy: 'Hassan Raza (CPA)',
        expenseId: 'EXP-SAL-01',
        notes: 'Monthly salary with On-Time Maintenance Bonus.',
        createdAt: `${currentMonthStr}-01T10:00:00.000Z`,
      },
      {
        id: 'SAL-2026-08-02',
        staffId: 'STF-102',
        staffName: 'Zubair Shah',
        designation: 'Field Splicing Technician',
        salaryMonth: currentMonthStr,
        basicSalary: 45000,
        bonus: 3000,
        deduction: 0,
        netSalary: 48000,
        paidAmount: 48000,
        remainingSalary: 0,
        paymentDate: `${currentMonthStr}-01`,
        paymentMethod: 'Cash',
        paymentStatus: 'paid',
        processedBy: 'Hassan Raza (CPA)',
        expenseId: 'EXP-SAL-02',
        notes: 'Includes new connection target incentive.',
        createdAt: `${currentMonthStr}-01T10:15:00.000Z`,
      },
      {
        id: 'SAL-2026-08-03',
        staffId: 'STF-103',
        staffName: 'Kamran Ali',
        designation: 'Customer Support & Billing Operator',
        salaryMonth: currentMonthStr,
        basicSalary: 38000,
        bonus: 0,
        deduction: 0,
        netSalary: 38000,
        paidAmount: 38000,
        remainingSalary: 0,
        paymentDate: `${currentMonthStr}-01`,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'paid',
        processedBy: 'Hassan Raza (CPA)',
        expenseId: 'EXP-SAL-03',
        notes: 'Monthly salary disbursed.',
        createdAt: `${currentMonthStr}-01T10:30:00.000Z`,
      },
      {
        id: 'SAL-2026-08-04',
        staffId: 'STF-104',
        staffName: 'Arslan Nawaz',
        designation: 'Line Repair & Maintenance Helper',
        salaryMonth: currentMonthStr,
        basicSalary: 30000,
        bonus: 2000,
        deduction: 0,
        netSalary: 32000,
        paidAmount: 32000,
        remainingSalary: 0,
        paymentDate: `${currentMonthStr}-01`,
        paymentMethod: 'Cash',
        paymentStatus: 'paid',
        processedBy: 'Hassan Raza (CPA)',
        expenseId: 'EXP-SAL-04',
        notes: 'Night shift emergency response allowance included.',
        createdAt: `${currentMonthStr}-01T10:45:00.000Z`,
      },
    ];

    // Automatically link salaries into expenses
    sampleSalaries.forEach(sal => {
      sampleExpenses.push({
        id: sal.expenseId || `EXP-SAL-${sal.id}`,
        categoryId: 'cat_salaries',
        categoryName: 'Staff Salary & Bonuses',
        description: `Staff Salary for ${sal.staffName} (${sal.designation}) - Month ${sal.salaryMonth}`,
        amount: sal.paidAmount,
        date: sal.paymentDate,
        paymentMethod: (sal.paymentMethod.toLowerCase().includes('bank') ? 'bank_transfer' : 'cash'),
        vendorOrPayee: sal.staffName,
        addedBy: sal.processedBy,
        isSalaryExpense: true,
        salaryPaymentId: sal.id,
        createdAt: sal.createdAt,
        updatedAt: sal.createdAt,
      });
    });

    const sampleRenewals: PackageRenewal[] = [
      {
        id: 'RNW-1001',
        customerId: 'CUST-1001',
        subscriberId: 'SUB-841920',
        customerName: 'Dr. Zeeshan Haider',
        previousPackageId: 'pkg_20mbps',
        previousPackageName: '20 Mbps Smart Family',
        newPackageId: 'pkg_30mbps',
        newPackageName: '30 Mbps Pro Streamer & Gaming',
        renewalPeriodMonths: 1,
        renewalFee: 4200,
        discount: 0,
        totalCharges: 4200,
        paidAmount: 4200,
        remainingAmount: 0,
        paymentMethod: 'online_transfer',
        effectiveDate: `${currentMonthStr}-01`,
        newExpiryDate: `${currentMonthStr}-30`,
        processedBy: 'Bilal Ahmed',
        receiptNumber: 'RCP-2026-002',
        createdAt: `${currentMonthStr}-03T10:30:00.000Z`,
      }
    ];

    const sampleAuditLogs: AuditLog[] = [
      {
        id: 'LOG-1001',
        timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        userId: 'usr_super_admin',
        userName: 'Engr. Farman Ullah',
        userRole: 'Super Admin',
        action: 'SYSTEM_INITIALIZED',
        entityType: 'settings',
        entityId: 'SYSTEM',
        description: 'System database successfully initialized with ISP packages and security permissions.',
        ipAddress: '127.0.0.1',
      },
      {
        id: 'LOG-1002',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        userId: 'usr_operator',
        userName: 'Bilal Ahmed',
        userRole: 'Staff / Operator',
        action: 'PAYMENT_RECEIVED',
        entityType: 'payment',
        entityId: 'PAY-1003',
        description: 'Collected Rs. 6,500 cash payment for Invoice INV-2026-002 from customer Muhammad Usman Khan.',
        ipAddress: '192.168.1.104',
      },
      {
        id: 'LOG-1003',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        userId: 'usr_accountant',
        userName: 'Hassan Raza (CPA)',
        userRole: 'Accountant',
        action: 'SALARIES_DISBURSED',
        entityType: 'salary',
        entityId: 'SAL_BATCH_2026_08',
        description: 'Processed monthly staff salaries of Rs. 188,000 for August 2026.',
        ipAddress: '192.168.1.102',
      }
    ];

    this.db = {
      version: 1,
      settings: DEFAULT_SETTINGS,
      permissions: SYSTEM_PERMISSIONS,
      roles: DEFAULT_ROLES,
      users: DEFAULT_USERS,
      packages: DEFAULT_PACKAGES,
      customers: sampleCustomers,
      invoices: sampleInvoices,
      payments: samplePayments,
      packageRenewals: sampleRenewals,
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      expenses: sampleExpenses,
      staff: DEFAULT_STAFF,
      salaryPayments: sampleSalaries,
      auditLogs: sampleAuditLogs,
      lastBackupDate: new Date().toISOString(),
    };

    this.saveDatabase();
  }

  // --- Getter Methods ---
  public getDatabase(): DatabaseSchema {
    if (!this.db) this.loadDatabase();
    return this.db!;
  }

  // --- Audit Log Helper ---
  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const db = this.getDatabase();
    const log: AuditLog = {
      id: generateId('LOG', 6),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    db.auditLogs.unshift(log);
    // Keep max 500 logs in storage
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(0, 500);
    }
    this.saveDatabase();
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return this.getDatabase().settings;
  }

  public updateSettings(updates: Partial<SystemSettings>, user: { id: string; name: string; role: string }): SystemSettings {
    const db = this.getDatabase();
    db.settings = { ...db.settings, ...updates };
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_SETTINGS',
      entityType: 'settings',
      entityId: 'CONFIG',
      description: 'Updated ISP company profile and default billing parameters',
    });
    this.saveDatabase();
    return db.settings;
  }

  // --- Roles & Permissions ---
  public getRoles(): Role[] {
    return this.getDatabase().roles;
  }

  public getPermissions(): Permission[] {
    return this.getDatabase().permissions;
  }

  public createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>, user: { id: string; name: string; role: string }): Role {
    const db = this.getDatabase();
    const newRole: Role = {
      id: `role_${Date.now()}`,
      ...roleData,
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.roles.push(newRole);
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_ROLE',
      entityType: 'role',
      entityId: newRole.id,
      description: `Created new custom role "${newRole.name}" with ${newRole.permissions.length} permissions.`,
    });
    this.saveDatabase();
    return newRole;
  }

  public updateRole(id: string, updates: Partial<Role>, user: { id: string; name: string; role: string }): Role {
    const db = this.getDatabase();
    const index = db.roles.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Role not found');
    db.roles[index] = {
      ...db.roles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_ROLE',
      entityType: 'role',
      entityId: id,
      description: `Updated role permissions for "${db.roles[index].name}".`,
    });
    this.saveDatabase();
    return db.roles[index];
  }

  // --- Users & RBAC Permissions ---
  public getUserPermissions(user: StoredUser | User): string[] {
    const isSuperAdmin = user.roleId === 'role_super_admin' || user.roleName?.toLowerCase() === 'super admin';
    if (isSuperAdmin) {
      return SYSTEM_PERMISSIONS.map(p => p.id);
    }
    if (Array.isArray(user.customPermissions) && user.customPermissions.length > 0) {
      return user.customPermissions;
    }
    const db = this.getDatabase();
    const role = db.roles.find(r => r.id === user.roleId);
    if (role && Array.isArray(role.permissions)) {
      return role.permissions;
    }
    return ['view_dashboard'];
  }

  public getUsers(): User[] {
    return this.getDatabase().users.map(({ passwordHash, ...safeUser }) => ({
      ...safeUser,
      permissions: this.getUserPermissions(safeUser),
    }));
  }

  public getUserByUsername(username: string): StoredUser | undefined {
    return this.getDatabase().users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserById(id: string): StoredUser | undefined {
    return this.getDatabase().users.find(u => u.id === id);
  }

  public createUser(userData: {
    name: string;
    username: string;
    email: string;
    phone?: string;
    employeeId?: string;
    jobTitle?: string;
    roleId: string;
    password: string;
    status: 'active' | 'inactive';
    customPermissions?: string[];
  }, user: { id: string; name: string; role: string }): User {
    const db = this.getDatabase();
    if (db.users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      throw new Error('Username already exists. Please choose a different username.');
    }
    const role = db.roles.find(r => r.id === userData.roleId);
    const roleName = role ? role.name : 'Custom Role';

    const empId = userData.employeeId?.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`;

    const newUser: StoredUser = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      username: userData.username.trim(),
      email: userData.email.trim(),
      phone: userData.phone?.trim() || '',
      employeeId: empId,
      jobTitle: userData.jobTitle?.trim() || roleName,
      roleId: userData.roleId,
      roleName: roleName,
      passwordHash: hashPassword(userData.password),
      status: userData.status || 'active',
      customPermissions: userData.customPermissions && userData.customPermissions.length > 0 ? userData.customPermissions : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_EMPLOYEE',
      entityType: 'user',
      entityId: newUser.id,
      description: `Created new employee account "${newUser.name}" (Username: @${newUser.username}, Role: ${newUser.roleName}, ID: ${newUser.employeeId}).`,
    });
    this.saveDatabase();
    const { passwordHash, ...safeUser } = newUser;
    return {
      ...safeUser,
      permissions: this.getUserPermissions(safeUser),
    };
  }

  public updateUser(id: string, updates: Partial<StoredUser> & { password?: string }, user: { id: string; name: string; role: string }): User {
    const db = this.getDatabase();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');

    const currentUser = db.users[index];

    // Protect Super Admin from being deactivated or having role stripped by non-super admin
    if (currentUser.id === 'usr_super_admin' || currentUser.roleId === 'role_super_admin') {
      if (updates.status === 'inactive') {
        throw new Error('The primary Super Admin account cannot be deactivated.');
      }
      if (updates.roleId && updates.roleId !== 'role_super_admin') {
        throw new Error('The primary Super Admin role cannot be altered.');
      }
    }

    let roleName = currentUser.roleName;
    if (updates.roleId && updates.roleId !== currentUser.roleId) {
      const role = db.roles.find(r => r.id === updates.roleId);
      if (role) roleName = role.name;
    }

    const updatedUser: StoredUser = {
      ...currentUser,
      ...updates,
      roleName,
      passwordHash: updates.password ? hashPassword(updates.password) : currentUser.passwordHash,
      updatedAt: new Date().toISOString(),
    };

    db.users[index] = updatedUser;
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_EMPLOYEE',
      entityType: 'user',
      entityId: id,
      description: `Updated employee profile & permissions for "${updatedUser.name}" (@${updatedUser.username}, ${updatedUser.roleName}).`,
    });
    this.saveDatabase();
    const { passwordHash, ...safeUser } = updatedUser;
    return {
      ...safeUser,
      permissions: this.getUserPermissions(safeUser),
    };
  }

  public deleteUser(id: string, user: { id: string; name: string; role: string }): boolean {
    const db = this.getDatabase();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');

    const targetUser = db.users[index];
    if (targetUser.id === 'usr_super_admin' || targetUser.roleId === 'role_super_admin') {
      throw new Error('Super Admin account cannot be deleted.');
    }
    if (targetUser.id === user.id) {
      throw new Error('You cannot delete your own active session account.');
    }

    db.users.splice(index, 1);
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'DELETE_EMPLOYEE',
      entityType: 'user',
      entityId: id,
      description: `Permanently deleted employee account "${targetUser.name}" (@${targetUser.username}).`,
    });
    this.saveDatabase();
    return true;
  }

  public resetUserPassword(id: string, newPass: string, user: { id: string; name: string; role: string }): boolean {
    const db = this.getDatabase();
    const target = db.users.find(u => u.id === id);
    if (!target) throw new Error('User not found');

    target.passwordHash = hashPassword(newPass);
    target.updatedAt = new Date().toISOString();

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'RESET_PASSWORD',
      entityType: 'user',
      entityId: id,
      description: `Reset security password for employee "${target.name}" (@${target.username}).`,
    });
    this.saveDatabase();
    return true;
  }

  public toggleUserStatus(id: string, user: { id: string; name: string; role: string }): User {
    const db = this.getDatabase();
    const target = db.users.find(u => u.id === id);
    if (!target) throw new Error('User not found');

    if (target.id === 'usr_super_admin' || target.roleId === 'role_super_admin') {
      throw new Error('Cannot change status of Super Admin.');
    }

    target.status = target.status === 'active' ? 'inactive' : 'active';
    target.updatedAt = new Date().toISOString();

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: target.status === 'active' ? 'ACTIVATE_EMPLOYEE' : 'DEACTIVATE_EMPLOYEE',
      entityType: 'user',
      entityId: id,
      description: `${target.status === 'active' ? 'Activated' : 'Deactivated'} employee account "${target.name}" (@${target.username}).`,
    });
    this.saveDatabase();
    const { passwordHash, ...safeUser } = target;
    return {
      ...safeUser,
      permissions: this.getUserPermissions(safeUser),
    };
  }

  public updateLastLogin(userId: string) {
    const db = this.getDatabase();
    const u = db.users.find(x => x.id === userId);
    if (u) {
      u.lastLogin = new Date().toISOString();
      this.saveDatabase();
    }
  }

  // --- Packages ---
  public getPackages(): InternetPackage[] {
    const db = this.getDatabase();
    // Dynamically calculate live subscriber counts
    return db.packages.map(pkg => {
      const count = db.customers.filter(c => c.packageId === pkg.id && c.accountStatus === 'active').length;
      return {
        ...pkg,
        totalSubscribers: count,
      };
    });
  }

  public createPackage(pkgData: Omit<InternetPackage, 'id' | 'createdAt' | 'updatedAt'>, user: { id: string; name: string; role: string }): InternetPackage {
    const db = this.getDatabase();
    const newPkg: InternetPackage = {
      id: `pkg_${Date.now()}`,
      ...pkgData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.packages.push(newPkg);
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_PACKAGE',
      entityType: 'package',
      entityId: newPkg.id,
      description: `Added new internet package "${newPkg.name}" (${newPkg.speed} at Rs. ${newPkg.monthlyPrice}).`,
    });
    this.saveDatabase();
    return newPkg;
  }

  public updatePackage(id: string, updates: Partial<InternetPackage>, user: { id: string; name: string; role: string }): InternetPackage {
    const db = this.getDatabase();
    const index = db.packages.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Package not found');

    db.packages[index] = {
      ...db.packages[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If package name or price changed, update customer active cached values
    if (updates.name || updates.monthlyPrice || updates.speed) {
      db.customers.forEach(c => {
        if (c.packageId === id) {
          if (updates.name) c.packageName = updates.name;
          if (updates.speed) c.packageSpeed = updates.speed;
        }
      });
    }

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_PACKAGE',
      entityType: 'package',
      entityId: id,
      description: `Modified internet package details for "${db.packages[index].name}".`,
    });
    this.saveDatabase();
    return db.packages[index];
  }

  public deletePackage(id: string, user: { id: string; name: string; role: string }): boolean {
    const db = this.getDatabase();
    const index = db.packages.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Package not found');

    const pkg = db.packages[index];
    const assignedCustomers = db.customers.filter(c => c.packageId === id);
    if (assignedCustomers.length > 0) {
      throw new Error(`Cannot delete "${pkg.name}". There are ${assignedCustomers.length} subscribers currently assigned to this plan.`);
    }

    db.packages.splice(index, 1);
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'DELETE_PACKAGE',
      entityType: 'package',
      entityId: id,
      description: `Deleted internet package "${pkg.name}".`,
    });
    this.saveDatabase();
    return true;
  }

  // --- Customers & Complete Financial Balance Recalculation ---
  public getCustomers(): Customer[] {
    return this.getDatabase().customers;
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.getDatabase().customers.find(c => c.id === id || c.subscriberId === id);
  }

  public recalculateCustomerBalances(customerId: string) {
    const db = this.getDatabase();
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) return;

    const customerInvoices = db.invoices.filter(inv => inv.customerId === customerId);
    const totalBilled = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = customerInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalOutstanding = Math.max(0, totalBilled - totalPaid);

    customer.totalBilled = totalBilled;
    customer.totalPaid = totalPaid;
    customer.totalOutstanding = totalOutstanding;

    if (totalOutstanding === 0) {
      customer.paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      customer.paymentStatus = 'partial';
    } else {
      // Check if any invoice is overdue
      const now = new Date();
      const hasOverdue = customerInvoices.some(inv => inv.remainingAmount > 0 && new Date(inv.dueDate) < now);
      customer.paymentStatus = hasOverdue ? 'overdue' : 'pending';
    }

    this.saveDatabase();
  }

  public createCustomer(customerData: {
    name: string;
    fatherOrCompanyName: string;
    contactNumber: string;
    cnic?: string;
    address: string;
    cityArea: string;
    notes?: string;
    packageId: string;
    installationDate: string;
    activationDate: string;
    expiryDate: string;
    routerPrice: number;
    installationCharges: number;
    wireCharges: number;
    wireLengthMeters?: number;
    otherCharges: number;
    discount: number;
    paidInitialAmount: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'online_transfer' | 'easypaisa_jazzcash' | 'cheque';
  }, user: { id: string; name: string; role: string }): { customer: Customer; invoice: Invoice; payment?: Payment } {
    const db = this.getDatabase();
    const pkg = db.packages.find(p => p.id === customerData.packageId);
    if (!pkg) throw new Error('Selected package not found');

    const customerId = generateId('CUST', 4);
    const subscriberId = generateSubscriberId();

    // Exact mathematical formula:
    // Total Initial Charges = Router + Installation + Wire + Other Charges − Discount
    const routerPrice = Math.max(0, Number(customerData.routerPrice) || 0);
    const installationCharges = Math.max(0, Number(customerData.installationCharges) || 0);
    const wireCharges = Math.max(0, Number(customerData.wireCharges) || 0);
    const otherCharges = Math.max(0, Number(customerData.otherCharges) || 0);
    const discount = Math.max(0, Number(customerData.discount) || 0);

    const totalInitialCharges = Math.max(0, routerPrice + installationCharges + wireCharges + otherCharges - discount);
    const paidInitialAmount = Math.min(totalInitialCharges, Math.max(0, Number(customerData.paidInitialAmount) || 0));
    const remainingInitialAmount = Math.max(0, totalInitialCharges - paidInitialAmount);

    const newCustomer: Customer = {
      id: customerId,
      subscriberId,
      name: customerData.name,
      fatherOrCompanyName: customerData.fatherOrCompanyName || '',
      contactNumber: customerData.contactNumber,
      cnic: customerData.cnic || '',
      address: customerData.address,
      cityArea: customerData.cityArea || 'Main Area',
      notes: customerData.notes || '',

      packageId: pkg.id,
      packageName: pkg.name,
      packageSpeed: pkg.speed,
      monthlyFee: pkg.monthlyPrice,
      billingCycle: pkg.billingCycle,

      installationDate: customerData.installationDate || new Date().toISOString().split('T')[0],
      activationDate: customerData.activationDate || new Date().toISOString().split('T')[0],
      expiryDate: customerData.expiryDate,

      routerPrice,
      installationCharges,
      wireCharges,
      wireLengthMeters: Number(customerData.wireLengthMeters) || 0,
      otherCharges,
      discount,
      totalInitialCharges,
      paidInitialAmount,
      remainingInitialAmount,

      accountStatus: 'active',
      paymentStatus: remainingInitialAmount === 0 ? 'paid' : (paidInitialAmount > 0 ? 'partial' : 'pending'),
      totalBilled: totalInitialCharges,
      totalPaid: paidInitialAmount,
      totalOutstanding: remainingInitialAmount,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.customers.push(newCustomer);

    // Automatically generate Initial Connection Invoice
    const invoiceId = generateId('INV-2026', 4);
    const invoiceItems = [];
    if (routerPrice > 0) invoiceItems.push({ id: 'item_router', description: 'XPON / GPON Dual-Band Fiber Router', quantity: 1, unitPrice: routerPrice, total: routerPrice });
    if (installationCharges > 0) invoiceItems.push({ id: 'item_install', description: 'Fiber Optical Line Installation & Splicing', quantity: 1, unitPrice: installationCharges, total: installationCharges });
    if (wireCharges > 0) invoiceItems.push({ id: 'item_wire', description: `Fiber Drop Cable Wire (${newCustomer.wireLengthMeters || 0} meters)`, quantity: 1, unitPrice: wireCharges, total: wireCharges });
    if (otherCharges > 0) invoiceItems.push({ id: 'item_other', description: 'Connectors & Accessories', quantity: 1, unitPrice: otherCharges, total: otherCharges });
    if (discount > 0) invoiceItems.push({ id: 'item_disc', description: 'Promotional Installation Discount', quantity: 1, unitPrice: -discount, total: -discount });

    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber: invoiceId,
      customerId: newCustomer.id,
      subscriberId: newCustomer.subscriberId,
      customerName: newCustomer.name,
      customerContact: newCustomer.contactNumber,
      customerAddress: newCustomer.address,
      invoiceType: 'initial_connection',
      packageId: pkg.id,
      packageName: pkg.name,
      packageSpeed: pkg.speed,
      billingPeriodStart: newCustomer.activationDate,
      billingPeriodEnd: newCustomer.expiryDate,
      issueDate: newCustomer.installationDate,
      dueDate: newCustomer.activationDate,
      monthlyPackageFee: 0,
      routerCharges: routerPrice,
      installationCharges,
      wireCharges,
      otherCharges,
      previousBalance: 0,
      discount,
      totalAmount: totalInitialCharges,
      paidAmount: paidInitialAmount,
      remainingAmount: remainingInitialAmount,
      paymentStatus: remainingInitialAmount === 0 ? 'paid' : (paidInitialAmount > 0 ? 'partial' : 'pending'),
      items: invoiceItems,
      notes: `New customer connection onboarding bill. Package: ${pkg.name}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.invoices.push(invoice);

    // If paid amount was recorded, generate payment receipt
    let payment: Payment | undefined;
    if (paidInitialAmount > 0) {
      const paymentId = generateId('PAY', 4);
      const receiptNumber = generateId('RCP-2026', 4);
      payment = {
        id: paymentId,
        receiptNumber,
        invoiceId: invoice.id,
        customerId: newCustomer.id,
        subscriberId: newCustomer.subscriberId,
        customerName: newCustomer.name,
        amount: paidInitialAmount,
        paymentDate: newCustomer.installationDate,
        paymentMethod: customerData.paymentMethod || 'cash',
        receivedBy: user.name,
        notes: 'Initial connection setup & installation charges paid.',
        createdAt: new Date().toISOString(),
      };
      db.payments.push(payment);
    }

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_CUSTOMER',
      entityType: 'customer',
      entityId: newCustomer.id,
      description: `Registered new customer "${newCustomer.name}" (${newCustomer.subscriberId}) on package ${pkg.name}. Initial billed: Rs. ${totalInitialCharges}, Paid: Rs. ${paidInitialAmount}.`,
    });

    this.saveDatabase();
    return { customer: newCustomer, invoice, payment };
  }

  public updateCustomer(id: string, updates: Partial<Customer>, user: { id: string; name: string; role: string }): Customer {
    const db = this.getDatabase();
    const index = db.customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer not found');

    db.customers[index] = {
      ...db.customers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_CUSTOMER',
      entityType: 'customer',
      entityId: id,
      description: `Updated customer profile info for "${db.customers[index].name}" (${db.customers[index].subscriberId}).`,
    });

    this.saveDatabase();
    return db.customers[index];
  }

  public deleteCustomer(id: string, user: { id: string; name: string; role: string }): boolean {
    const db = this.getDatabase();
    const index = db.customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer not found');

    const customer = db.customers[index];
    db.customers.splice(index, 1);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'DELETE_CUSTOMER',
      entityType: 'customer',
      entityId: id,
      description: `Deleted customer record "${customer.name}" (${customer.subscriberId}).`,
    });

    this.saveDatabase();
    return true;
  }

  // --- Package Renewal / Upgrades / Downgrades ---
  public renewCustomerPackage(renewalData: {
    customerId: string;
    newPackageId: string;
    renewalPeriodMonths: number;
    discount?: number;
    paidAmount: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'online_transfer' | 'easypaisa_jazzcash' | 'cheque';
    effectiveDate: string;
    notes?: string;
  }, user: { id: string; name: string; role: string }): { renewal: PackageRenewal; invoice: Invoice; payment?: Payment; customer: Customer } {
    const db = this.getDatabase();
    const customer = db.customers.find(c => c.id === renewalData.customerId);
    if (!customer) throw new Error('Customer not found');

    const newPkg = db.packages.find(p => p.id === renewalData.newPackageId);
    if (!newPkg) throw new Error('Selected package not found');

    const months = Math.max(1, Number(renewalData.renewalPeriodMonths) || 1);
    const renewalFee = newPkg.monthlyPrice * months;
    const discount = Math.max(0, Number(renewalData.discount) || 0);
    const totalCharges = Math.max(0, renewalFee - discount);
    const paidAmount = Math.min(totalCharges, Math.max(0, Number(renewalData.paidAmount) || 0));
    const remainingAmount = Math.max(0, totalCharges - paidAmount);

    // Calculate new expiry date
    const effDate = new Date(renewalData.effectiveDate || new Date());
    const newExp = new Date(effDate);
    newExp.setMonth(newExp.getMonth() + months);
    const newExpiryDateStr = newExp.toISOString().split('T')[0];

    const prevPackageId = customer.packageId;
    const prevPackageName = customer.packageName;

    // Update customer's active package and dates
    customer.packageId = newPkg.id;
    customer.packageName = newPkg.name;
    customer.packageSpeed = newPkg.speed;
    customer.monthlyFee = newPkg.monthlyPrice;
    customer.expiryDate = newExpiryDateStr;
    customer.accountStatus = 'active';
    customer.updatedAt = new Date().toISOString();

    // Create Invoice for Renewal
    const invoiceId = generateId('INV-2026', 4);
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber: invoiceId,
      customerId: customer.id,
      subscriberId: customer.subscriberId,
      customerName: customer.name,
      customerContact: customer.contactNumber,
      customerAddress: customer.address,
      invoiceType: 'package_renewal',
      packageId: newPkg.id,
      packageName: newPkg.name,
      packageSpeed: newPkg.speed,
      billingPeriodStart: renewalData.effectiveDate,
      billingPeriodEnd: newExpiryDateStr,
      issueDate: renewalData.effectiveDate,
      dueDate: renewalData.effectiveDate,
      monthlyPackageFee: newPkg.monthlyPrice,
      routerCharges: 0,
      installationCharges: 0,
      wireCharges: 0,
      otherCharges: 0,
      previousBalance: customer.totalOutstanding,
      discount,
      totalAmount: totalCharges,
      paidAmount,
      remainingAmount,
      paymentStatus: remainingAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'pending'),
      items: [
        {
          id: `item_rnw_${Date.now()}`,
          description: `Package Subscription Renewal: ${newPkg.name} (${months} Month${months > 1 ? 's' : ''})`,
          quantity: months,
          unitPrice: newPkg.monthlyPrice,
          total: renewalFee,
        },
        ...(discount > 0 ? [{
          id: `item_rnw_disc`,
          description: 'Renewal Discount',
          quantity: 1,
          unitPrice: -discount,
          total: -discount,
        }] : []),
      ],
      notes: renewalData.notes || `Renewed package to ${newPkg.name} for ${months} month(s).`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.invoices.push(invoice);

    // Create Payment & Receipt if collected
    let payment: Payment | undefined;
    let receiptNumber: string | undefined;
    if (paidAmount > 0) {
      const paymentId = generateId('PAY', 4);
      receiptNumber = generateId('RCP-2026', 4);
      payment = {
        id: paymentId,
        receiptNumber,
        invoiceId: invoice.id,
        customerId: customer.id,
        subscriberId: customer.subscriberId,
        customerName: customer.name,
        amount: paidAmount,
        paymentDate: renewalData.effectiveDate,
        paymentMethod: renewalData.paymentMethod || 'cash',
        receivedBy: user.name,
        notes: `Subscription Renewal Payment for ${newPkg.name}.`,
        createdAt: new Date().toISOString(),
      };
      db.payments.push(payment);
    }

    // Record Renewal History
    const renewal: PackageRenewal = {
      id: generateId('RNW', 4),
      customerId: customer.id,
      subscriberId: customer.subscriberId,
      customerName: customer.name,
      previousPackageId: prevPackageId,
      previousPackageName: prevPackageName,
      newPackageId: newPkg.id,
      newPackageName: newPkg.name,
      renewalPeriodMonths: months,
      renewalFee,
      discount,
      totalCharges,
      paidAmount,
      remainingAmount,
      paymentMethod: renewalData.paymentMethod,
      effectiveDate: renewalData.effectiveDate,
      newExpiryDate: newExpiryDateStr,
      processedBy: user.name,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };
    db.packageRenewals.unshift(renewal);

    this.recalculateCustomerBalances(customer.id);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'RENEW_PACKAGE',
      entityType: 'renewal',
      entityId: renewal.id,
      description: `Processed package renewal for "${customer.name}" (${customer.subscriberId}). Upgraded/Renewed to ${newPkg.name}, charged Rs. ${totalCharges}, collected Rs. ${paidAmount}.`,
    });

    this.saveDatabase();
    return { renewal, invoice, payment, customer };
  }

  // --- Invoices & Billing ---
  public getInvoices(): Invoice[] {
    return this.getDatabase().invoices;
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.getDatabase().invoices.find(inv => inv.id === id || inv.invoiceNumber === id);
  }

  public createInvoice(invoiceData: {
    customerId: string;
    invoiceType?: Invoice['invoiceType'];
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
    issueDate: string;
    dueDate: string;
    monthlyPackageFee?: number;
    routerCharges?: number;
    installationCharges?: number;
    wireCharges?: number;
    otherCharges?: number;
    discount?: number;
    items?: Invoice['items'];
    notes?: string;
  }, user: { id: string; name: string; role: string }): Invoice {
    const db = this.getDatabase();
    const customer = db.customers.find(c => c.id === invoiceData.customerId);
    if (!customer) throw new Error('Customer not found');

    const invoiceId = generateId('INV-2026', 4);
    const fee = Number(invoiceData.monthlyPackageFee) || 0;
    const router = Number(invoiceData.routerCharges) || 0;
    const install = Number(invoiceData.installationCharges) || 0;
    const wire = Number(invoiceData.wireCharges) || 0;
    const other = Number(invoiceData.otherCharges) || 0;
    const discount = Number(invoiceData.discount) || 0;

    let items = invoiceData.items || [];
    if (items.length === 0) {
      if (fee > 0) items.push({ id: `item_${Date.now()}_1`, description: `Monthly Internet Fee (${customer.packageName})`, quantity: 1, unitPrice: fee, total: fee });
      if (router > 0) items.push({ id: `item_${Date.now()}_2`, description: 'Optical Router Device', quantity: 1, unitPrice: router, total: router });
      if (install > 0) items.push({ id: `item_${Date.now()}_3`, description: 'Technician Labor & Setup', quantity: 1, unitPrice: install, total: install });
      if (wire > 0) items.push({ id: `item_${Date.now()}_4`, description: 'Optical Wire Cable', quantity: 1, unitPrice: wire, total: wire });
      if (other > 0) items.push({ id: `item_${Date.now()}_5`, description: 'Service / Accessories', quantity: 1, unitPrice: other, total: other });
      if (discount > 0) items.push({ id: `item_${Date.now()}_6`, description: 'Discount Applied', quantity: 1, unitPrice: -discount, total: -discount });
    }

    const totalAmount = Math.max(0, items.reduce((sum, it) => sum + it.total, 0));

    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber: invoiceId,
      customerId: customer.id,
      subscriberId: customer.subscriberId,
      customerName: customer.name,
      customerContact: customer.contactNumber,
      customerAddress: customer.address,
      invoiceType: invoiceData.invoiceType || 'monthly_subscription',
      packageId: customer.packageId,
      packageName: customer.packageName,
      packageSpeed: customer.packageSpeed,
      billingPeriodStart: invoiceData.billingPeriodStart,
      billingPeriodEnd: invoiceData.billingPeriodEnd,
      issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
      monthlyPackageFee: fee,
      routerCharges: router,
      installationCharges: install,
      wireCharges: wire,
      otherCharges: other,
      previousBalance: customer.totalOutstanding,
      discount,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      paymentStatus: 'pending',
      items,
      notes: invoiceData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.invoices.unshift(invoice);
    this.recalculateCustomerBalances(customer.id);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_INVOICE',
      entityType: 'invoice',
      entityId: invoice.id,
      description: `Generated invoice ${invoice.id} for "${customer.name}" of Rs. ${totalAmount}.`,
    });

    this.saveDatabase();
    return invoice;
  }

  // --- Payments & Thermal Receipts ---
  public getPayments(): Payment[] {
    return this.getDatabase().payments;
  }

  public recordPayment(paymentData: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: Payment['paymentMethod'];
    referenceNumber?: string;
    notes?: string;
  }, user: { id: string; name: string; role: string }): { payment: Payment; invoice: Invoice; customer: Customer } {
    const db = this.getDatabase();
    const invoice = db.invoices.find(inv => inv.id === paymentData.invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const customer = db.customers.find(c => c.id === invoice.customerId);
    if (!customer) throw new Error('Customer not found');

    const payAmount = Math.max(0, Number(paymentData.amount) || 0);
    if (payAmount <= 0) throw new Error('Payment amount must be greater than zero');

    const paymentId = generateId('PAY', 4);
    const receiptNumber = generateId('RCP-2026', 4);

    const payment: Payment = {
      id: paymentId,
      receiptNumber,
      invoiceId: invoice.id,
      customerId: customer.id,
      subscriberId: customer.subscriberId,
      customerName: customer.name,
      amount: payAmount,
      paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: paymentData.paymentMethod || 'cash',
      referenceNumber: paymentData.referenceNumber,
      receivedBy: user.name,
      notes: paymentData.notes,
      createdAt: new Date().toISOString(),
    };

    db.payments.unshift(payment);

    // Settle against invoice
    invoice.paidAmount += payAmount;
    invoice.remainingAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    if (invoice.remainingAmount === 0) {
      invoice.paymentStatus = 'paid';
    } else if (invoice.paidAmount > 0) {
      invoice.paymentStatus = 'partial';
    }
    invoice.updatedAt = new Date().toISOString();

    this.recalculateCustomerBalances(customer.id);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'RECEIVE_PAYMENT',
      entityType: 'payment',
      entityId: payment.id,
      description: `Received Rs. ${payAmount} via ${payment.paymentMethod} from "${customer.name}" for Invoice ${invoice.id}. Receipt #${receiptNumber} generated.`,
    });

    this.saveDatabase();
    return { payment, invoice, customer };
  }

  // --- Expenses ---
  public getExpenses(): Expense[] {
    return this.getDatabase().expenses;
  }

  public getExpenseCategories(): ExpenseCategory[] {
    return this.getDatabase().expenseCategories;
  }

  public findOrCreateExpenseCategory(categoryName: string, user: { id: string; name: string; role: string }): ExpenseCategory {
    const db = this.getDatabase();
    const cleanName = categoryName.trim();
    let cat = db.expenseCategories.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
    if (cat) return cat;

    cat = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      description: 'Custom added expense category',
      isSystem: false,
      createdAt: new Date().toISOString(),
    };
    db.expenseCategories.push(cat);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_EXPENSE_CATEGORY',
      entityType: 'expense_category',
      entityId: cat.id,
      description: `Created new custom expense category "${cleanName}".`,
    });

    this.saveDatabase();
    return cat;
  }

  public createExpenseCategory(category: Omit<ExpenseCategory, 'id'>, user: { id: string; name: string; role: string }): ExpenseCategory {
    const db = this.getDatabase();
    const newCat: ExpenseCategory = {
      id: `cat_${Date.now()}`,
      ...category,
      createdAt: new Date().toISOString(),
    };
    db.expenseCategories.push(newCat);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_EXPENSE_CATEGORY',
      entityType: 'expense_category',
      entityId: newCat.id,
      description: `Created new expense category "${newCat.name}".`,
    });

    this.saveDatabase();
    return newCat;
  }

  public updateExpenseCategory(id: string, updates: Partial<ExpenseCategory>, user: { id: string; name: string; role: string }): ExpenseCategory {
    const db = this.getDatabase();
    const index = db.expenseCategories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Expense category not found');

    db.expenseCategories[index] = {
      ...db.expenseCategories[index],
      ...updates,
    };

    // Also update any expenses referencing this category if name changed
    if (updates.name) {
      db.expenses.forEach(e => {
        if (e.categoryId === id) {
          e.categoryName = updates.name;
        }
      });
    }

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_EXPENSE_CATEGORY',
      entityType: 'expense_category',
      entityId: id,
      description: `Updated expense category "${db.expenseCategories[index].name}".`,
    });

    this.saveDatabase();
    return db.expenseCategories[index];
  }

  public deleteExpenseCategory(id: string, user: { id: string; name: string; role: string }): boolean {
    const db = this.getDatabase();
    const index = db.expenseCategories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Expense category not found');

    const cat = db.expenseCategories[index];
    if (cat.isSystem) {
      throw new Error('System core categories cannot be deleted.');
    }

    db.expenseCategories.splice(index, 1);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'DELETE_EXPENSE_CATEGORY',
      entityType: 'expense_category',
      entityId: id,
      description: `Deleted custom expense category "${cat.name}".`,
    });

    this.saveDatabase();
    return true;
  }

  public createExpense(expenseData: {
    categoryId: string;
    description: string;
    title?: string;
    amount: number;
    date: string;
    paymentMethod: Expense['paymentMethod'];
    vendorOrPayee?: string;
    payee?: string;
    referenceNumber?: string;
    notes?: string;
    expenseType?: string;
    taxAmount?: number;
    taxRatePercent?: number;
    items?: ExpenseItem[];
    isRecurring?: boolean;
    recurrenceInterval?: string;
    tags?: string[];
    status?: string;
  }, user: { id: string; name: string; role: string }): Expense {
    const db = this.getDatabase();
    const cat = db.expenseCategories.find(c => c.id === expenseData.categoryId);
    const categoryName = cat ? cat.name : 'Operational Expense';

    const expenseId = generateId('EXP', 4);
    const amount = Math.max(0, Number(expenseData.amount) || 0);
    const desc = expenseData.description || expenseData.title || 'Expense Item';
    const payee = expenseData.vendorOrPayee || expenseData.payee || '';

    const expense: Expense = {
      id: expenseId,
      categoryId: expenseData.categoryId,
      categoryName,
      description: desc,
      title: desc,
      amount,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      paymentMethod: expenseData.paymentMethod || 'cash',
      vendorOrPayee: payee,
      payee: payee,
      addedBy: user.name,
      referenceNumber: expenseData.referenceNumber,
      notes: expenseData.notes,
      expenseType: expenseData.expenseType || 'operational',
      taxAmount: expenseData.taxAmount,
      taxRatePercent: expenseData.taxRatePercent,
      items: expenseData.items,
      isRecurring: expenseData.isRecurring,
      recurrenceInterval: expenseData.recurrenceInterval,
      tags: expenseData.tags,
      status: expenseData.status || 'paid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.expenses.unshift(expense);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_EXPENSE',
      entityType: 'expense',
      entityId: expense.id,
      description: `Added expense "${desc}" of Rs. ${amount} under [${categoryName}].`,
    });

    this.saveDatabase();
    return expense;
  }

  public updateExpense(id: string, updates: Partial<Expense>, user: { id: string; name: string; role: string }): Expense {
    const db = this.getDatabase();
    const index = db.expenses.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Expense not found');

    if (updates.categoryId) {
      const cat = db.expenseCategories.find(c => c.id === updates.categoryId);
      if (cat) updates.categoryName = cat.name;
    }

    if (updates.title && !updates.description) {
      updates.description = updates.title;
    }
    if (updates.description && !updates.title) {
      updates.title = updates.description;
    }
    if (updates.payee && !updates.vendorOrPayee) {
      updates.vendorOrPayee = updates.payee;
    }
    if (updates.vendorOrPayee && !updates.payee) {
      updates.payee = updates.vendorOrPayee;
    }

    db.expenses[index] = {
      ...db.expenses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_EXPENSE',
      entityType: 'expense',
      entityId: id,
      description: `Modified expense record "${db.expenses[index].description}".`,
    });

    this.saveDatabase();
    return db.expenses[index];
  }

  public deleteExpense(id: string, user: { id: string; name: string; role: string }): boolean {
    const db = this.getDatabase();
    const index = db.expenses.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Expense not found');

    const exp = db.expenses[index];
    db.expenses.splice(index, 1);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'DELETE_EXPENSE',
      entityType: 'expense',
      entityId: id,
      description: `Deleted expense record "${exp.description}" of Rs. ${exp.amount}.`,
    });

    this.saveDatabase();
    return true;
  }

  // --- Staff & Salaries ---
  public getStaff(): Staff[] {
    return this.getDatabase().staff;
  }

  public createStaff(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt' | 'staffId'> & { staffId?: string }, user: { id: string; name: string; role: string }): Staff {
    const db = this.getDatabase();
    const newStaff: Staff = {
      id: `stf_${Date.now()}`,
      staffId: staffData.staffId || generateId('STF', 3),
      name: staffData.name,
      contact: staffData.contact,
      cnic: staffData.cnic,
      designation: staffData.designation,
      joiningDate: staffData.joiningDate || new Date().toISOString().split('T')[0],
      basicSalary: Number(staffData.basicSalary) || 0,
      status: staffData.status || 'active',
      notes: staffData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.staff.push(newStaff);
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_STAFF',
      entityType: 'staff',
      entityId: newStaff.id,
      description: `Added staff member "${newStaff.name}" (${newStaff.designation}).`,
    });

    this.saveDatabase();
    return newStaff;
  }

  public updateStaff(id: string, updates: Partial<Staff>, user: { id: string; name: string; role: string }): Staff {
    const db = this.getDatabase();
    const index = db.staff.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Staff not found');

    db.staff[index] = {
      ...db.staff[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_STAFF',
      entityType: 'staff',
      entityId: id,
      description: `Updated staff record for "${db.staff[index].name}".`,
    });

    this.saveDatabase();
    return db.staff[index];
  }

  public getSalaryPayments(): SalaryPayment[] {
    return this.getDatabase().salaryPayments.map(s => ({
      ...s,
      month: s.month || s.salaryMonth,
      salaryMonth: s.salaryMonth || s.month,
      deductions: s.deductions !== undefined ? s.deductions : s.deduction,
      deduction: s.deduction !== undefined ? s.deduction : s.deductions,
      remarks: s.remarks || s.notes,
      notes: s.notes || s.remarks,
    }));
  }

  public paySalary(salaryData: {
    staffId: string;
    salaryMonth: string; // YYYY-MM
    basicSalary: number;
    bonus: number;
    deduction: number;
    paidAmount: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  }, user: { id: string; name: string; role: string }): { salary: SalaryPayment; expense: Expense } {
    const db = this.getDatabase();
    const staff = db.staff.find(s => s.id === salaryData.staffId || s.staffId === salaryData.staffId);
    if (!staff) throw new Error('Staff member not found');

    const basic = Math.max(0, Number(salaryData.basicSalary) || staff.basicSalary);
    const bonus = Math.max(0, Number(salaryData.bonus) || 0);
    const deduction = Math.max(0, Number(salaryData.deduction) || 0);
    const netSalary = Math.max(0, basic + bonus - deduction);
    const paidAmount = Math.min(netSalary, Math.max(0, Number(salaryData.paidAmount) || 0));
    const remainingSalary = Math.max(0, netSalary - paidAmount);

    const salId = generateId('SAL', 4);
    const expenseId = generateId('EXP-SAL', 4);

    const salary: SalaryPayment = {
      id: salId,
      staffId: staff.staffId,
      staffName: staff.name,
      designation: staff.designation,
      salaryMonth: salaryData.salaryMonth,
      month: salaryData.salaryMonth,
      basicSalary: basic,
      bonus,
      deduction,
      deductions: deduction,
      netSalary,
      paidAmount,
      remainingSalary,
      paymentDate: salaryData.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: salaryData.paymentMethod || 'Bank Transfer',
      paymentStatus: remainingSalary === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'),
      processedBy: user.name,
      expenseId,
      notes: salaryData.notes,
      remarks: salaryData.notes,
      createdAt: new Date().toISOString(),
    };

    db.salaryPayments.unshift(salary);

    // Automatically record into company expenses
    const expense: Expense = {
      id: expenseId,
      categoryId: 'cat_salaries',
      categoryName: 'Staff Salary & Bonuses',
      description: `Staff Salary for ${staff.name} (${staff.designation}) - Month ${salaryData.salaryMonth}`,
      amount: paidAmount,
      date: salary.paymentDate,
      paymentMethod: salary.paymentMethod.toLowerCase().includes('bank') ? 'bank_transfer' : 'cash',
      vendorOrPayee: staff.name,
      addedBy: user.name,
      isSalaryExpense: true,
      salaryPaymentId: salary.id,
      notes: salary.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.expenses.unshift(expense);

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PAY_SALARY',
      entityType: 'salary',
      entityId: salary.id,
      description: `Disbursed salary of Rs. ${paidAmount} to ${staff.name} for month ${salaryData.salaryMonth}. Recorded under financial expenses.`,
    });

    this.saveDatabase();
    return { salary, expense };
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.getDatabase().auditLogs;
  }

  // --- Complete Real-Time Dashboard & Financial Analytics ---
  public getDashboardAnalytics(): DashboardAnalytics {
    const db = this.getDatabase();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Customer counts
    const totalCustomers = db.customers.length;
    const activeCustomers = db.customers.filter(c => c.accountStatus === 'active').length;
    const inactiveCustomers = db.customers.filter(c => c.accountStatus !== 'active').length;

    // Invoices and pending calculation
    const pendingInvoices = db.invoices.filter(inv => inv.remainingAmount > 0);
    const pendingPaymentsCount = pendingInvoices.length;
    const pendingPaymentAmount = pendingInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

    // Revenue calculations from actual recorded payments
    const todayRevenue = db.payments
      .filter(p => p.paymentDate === todayStr || p.createdAt.startsWith(todayStr))
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyRevenue = db.payments
      .filter(p => p.paymentDate.startsWith(currentMonthStr) || p.createdAt.startsWith(currentMonthStr))
      .reduce((sum, p) => sum + p.amount, 0);

    // Expenses calculations
    const todayExpenses = db.expenses
      .filter(e => e.date === todayStr || e.createdAt.startsWith(todayStr))
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyExpenses = db.expenses
      .filter(e => e.date.startsWith(currentMonthStr) || e.createdAt.startsWith(currentMonthStr))
      .reduce((sum, e) => sum + e.amount, 0);

    // Net Profit = Monthly Revenue - Monthly Expenses
    const netProfit = monthlyRevenue - monthlyExpenses;

    const monthlySalariesPaid = db.salaryPayments
      .filter(s => s.salaryMonth === currentMonthStr)
      .reduce((sum, s) => sum + s.paidAmount, 0);

    const kpis: DashboardKPIs = {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      pendingPaymentsCount,
      pendingPaymentAmount,
      todayRevenue,
      monthlyRevenue,
      todayExpenses,
      monthlyExpenses,
      netProfit,
      monthlySalariesPaid,
    };

    // Revenue vs Expenses for past 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueVsExpenses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

      const rev = db.payments
        .filter(p => p.paymentDate.startsWith(mStr) || p.createdAt.startsWith(mStr))
        .reduce((sum, p) => sum + p.amount, 0);

      const exp = db.expenses
        .filter(e => e.date.startsWith(mStr) || e.createdAt.startsWith(mStr))
        .reduce((sum, e) => sum + e.amount, 0);

      revenueVsExpenses.push({
        month: label,
        revenue: rev,
        expenses: exp,
        profit: rev - exp,
      });
    }

    // Customer Growth Past 6 Months
    const customerGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]}`;

      const newSubs = db.customers.filter(c => c.installationDate.startsWith(mStr) || c.createdAt.startsWith(mStr)).length;
      // cumulative estimate
      const totalSoFar = db.customers.filter(c => c.createdAt <= `${mStr}-31T23:59:59.999Z`).length;

      customerGrowth.push({
        month: label,
        customers: totalSoFar,
        newSubscribers: newSubs,
      });
    }

    // Package Distribution
    const packageDistribution = db.packages.map(pkg => {
      const subscribed = db.customers.filter(c => c.packageId === pkg.id);
      return {
        name: pkg.speed,
        count: subscribed.length,
        revenue: subscribed.length * pkg.monthlyPrice,
      };
    });

    // Payment Status Summary
    const paidInvoices = db.invoices.filter(i => i.paymentStatus === 'paid');
    const partialInvoices = db.invoices.filter(i => i.paymentStatus === 'partial');
    const pendingOnlyInvoices = db.invoices.filter(i => i.paymentStatus === 'pending');
    const overdueInvoices = db.invoices.filter(i => i.paymentStatus === 'overdue');

    const paymentStatusSummary = {
      paidCount: paidInvoices.length,
      paidAmount: paidInvoices.reduce((sum, i) => sum + i.paidAmount, 0),
      partialCount: partialInvoices.length,
      partialAmount: partialInvoices.reduce((sum, i) => sum + i.remainingAmount, 0),
      pendingCount: pendingOnlyInvoices.length,
      pendingAmount: pendingOnlyInvoices.reduce((sum, i) => sum + i.remainingAmount, 0),
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, i) => sum + i.remainingAmount, 0),
    };

    // Recent Transactions stream
    const recentTransactions: DashboardAnalytics['recentTransactions'] = [];

    db.payments.slice(0, 5).forEach(p => {
      recentTransactions.push({
        id: p.id,
        type: 'payment',
        title: `Payment Received: ${p.customerName}`,
        subtitle: `Receipt ${p.receiptNumber} • ${p.paymentMethod.replace('_', ' ').toUpperCase()}`,
        amount: p.amount,
        status: 'received',
        date: p.paymentDate,
      });
    });

    db.expenses.slice(0, 4).forEach(e => {
      recentTransactions.push({
        id: e.id,
        type: 'expense',
        title: `Expense: ${e.description}`,
        subtitle: `Category: ${e.categoryName}`,
        amount: e.amount,
        status: 'expense',
        date: e.date,
      });
    });

    db.packageRenewals.slice(0, 3).forEach(r => {
      recentTransactions.push({
        id: r.id,
        type: 'renewal',
        title: `Renewal: ${r.customerName}`,
        subtitle: `${r.previousPackageName} → ${r.newPackageName}`,
        amount: r.totalCharges,
        status: 'renewed',
        date: r.effectiveDate,
      });
    });

    recentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      kpis,
      revenueVsExpenses,
      customerGrowth,
      packageDistribution,
      paymentStatusSummary,
      recentTransactions: recentTransactions.slice(0, 8),
      recentCustomers: db.customers.slice(-5).reverse(),
    };
  }

  // --- Reports (Daily, Monthly, Profit & Loss) ---
  public getDailyReport(dateStr: string) {
    const db = this.getDatabase();
    const newCustomers = db.customers.filter(c => c.installationDate === dateStr || c.createdAt.startsWith(dateStr));
    const renewals = db.packageRenewals.filter(r => r.effectiveDate === dateStr || r.createdAt.startsWith(dateStr));
    const payments = db.payments.filter(p => p.paymentDate === dateStr || p.createdAt.startsWith(dateStr));
    const expenses = db.expenses.filter(e => e.date === dateStr || e.createdAt.startsWith(dateStr));
    const salaries = db.salaryPayments.filter(s => s.paymentDate === dateStr || s.createdAt.startsWith(dateStr));

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSalaries = salaries.reduce((sum, s) => sum + s.paidAmount, 0);
    const netCashFlow = totalRevenue - totalExpenses;

    const invoicesIssued = db.invoices.filter(i => i.issueDate === dateStr || i.createdAt.startsWith(dateStr));
    const pendingFromIssued = invoicesIssued.reduce((sum, i) => sum + i.remainingAmount, 0);

    return {
      date: dateStr,
      newCustomersCount: newCustomers.length,
      newCustomers,
      renewalsCount: renewals.length,
      renewals,
      paymentsCount: payments.length,
      payments,
      expensesCount: expenses.length,
      expenses,
      salariesCount: salaries.length,
      salaries,
      invoicesIssuedCount: invoicesIssued.length,
      invoicesIssued,
      totalRevenue,
      totalExpenses,
      totalSalaries,
      pendingFromIssued,
      netCashFlow,
    };
  }

  public getMonthlyReport(monthStr: string) { // YYYY-MM
    const db = this.getDatabase();
    const newCustomers = db.customers.filter(c => c.installationDate.startsWith(monthStr) || c.createdAt.startsWith(monthStr));
    const renewals = db.packageRenewals.filter(r => r.effectiveDate.startsWith(monthStr) || r.createdAt.startsWith(monthStr));
    const payments = db.payments.filter(p => p.paymentDate.startsWith(monthStr) || p.createdAt.startsWith(monthStr));
    const expenses = db.expenses.filter(e => e.date.startsWith(monthStr) || e.createdAt.startsWith(monthStr));
    const salaries = db.salaryPayments.filter(s => s.salaryMonth === monthStr || s.paymentDate.startsWith(monthStr));
    const monthInvoices = db.invoices.filter(i => i.issueDate.startsWith(monthStr) || i.createdAt.startsWith(monthStr));
    const outstandingInvoices = db.invoices.filter(i => i.remainingAmount > 0);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Revenue Breakdown: Installation Revenue vs Subscription Revenue vs Renewals
    const installationRevenue = monthInvoices
      .filter(i => i.invoiceType === 'initial_connection')
      .reduce((sum, i) => sum + i.paidAmount, 0);

    const renewalsRevenue = renewals.reduce((sum, r) => sum + (r.paidAmount || r.totalCharges || 0), 0);
    const subscriptionRevenue = Math.max(0, totalRevenue - installationRevenue);

    // Expenses Breakdown
    const salaryExpenses = expenses.filter(e => e.categoryId === 'cat_salaries' || e.isSalaryExpense).reduce((sum, e) => sum + e.amount, 0);
    const bandwidthExpenses = expenses.filter(e => e.categoryId === 'cat_upstream').reduce((sum, e) => sum + e.amount, 0);
    const operationalExpenses = expenses.filter(e => e.categoryId !== 'cat_salaries' && !e.isSalaryExpense).reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = totalRevenue - totalExpenses;

    const totalCustomersCount = db.customers.length;
    const activeCustomersCount = db.customers.filter(c => c.accountStatus === 'active').length;
    const inactiveCustomersCount = db.customers.filter(c => c.accountStatus !== 'active').length;
    const totalPending = outstandingInvoices.reduce((sum, i) => sum + i.remainingAmount, 0);

    const packageBreakdown = db.packages.map(pkg => {
      const pkgPayments = payments.filter(p => {
        const cust = db.customers.find(c => c.id === p.customerId);
        return cust && cust.packageId === pkg.id;
      });
      const revenue = pkgPayments.reduce((sum, p) => sum + p.amount, 0);
      const subscribersCount = db.customers.filter(c => c.packageId === pkg.id && c.accountStatus === 'active').length;
      return {
        packageId: pkg.id,
        packageName: pkg.name,
        speed: pkg.speed,
        monthlyPrice: pkg.monthlyPrice,
        subscribersCount,
        revenue,
      };
    });

    const expenseCategoryBreakdown = db.expenseCategories.map(cat => {
      const catExpenses = expenses.filter(e => e.categoryId === cat.id);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        count: catExpenses.length,
        amount: catExpenses.reduce((sum, e) => sum + e.amount, 0),
      };
    }).filter(c => c.amount > 0 || c.count > 0);

    // Payment methods breakdown
    const paymentMethods: { [key: string]: { count: number; amount: number } } = {};
    payments.forEach(p => {
      const m = p.paymentMethod || 'cash';
      if (!paymentMethods[m]) paymentMethods[m] = { count: 0, amount: 0 };
      paymentMethods[m].count += 1;
      paymentMethods[m].amount += p.amount;
    });

    return {
      month: monthStr,
      totalCustomersCount,
      activeCustomersCount,
      inactiveCustomersCount,
      newCustomersCount: newCustomers.length,
      renewalsCount: renewals.length,
      totalRevenue,
      subscriptionRevenue,
      installationRevenue,
      renewalsRevenue,
      totalExpenses,
      salaryExpenses,
      bandwidthExpenses,
      operationalExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0.00',
      totalPending,
      packageBreakdown,
      expenseCategoryBreakdown,
      paymentMethodsBreakdown: Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount,
      })),
      paymentsList: payments.map(p => {
        const cust = db.customers.find(c => c.id === p.customerId);
        return {
          ...p,
          subscriberId: cust ? cust.subscriberId : (p.customerId || '-'),
        };
      }),
      expensesList: expenses,
      salariesList: salaries,
      renewalsList: renewals,
      invoicesList: monthInvoices,
      outstandingInvoicesList: outstandingInvoices.slice(0, 30),
      companySettings: db.settings,
    };
  }

  public getProfitLossStatement(startDate: string, endDate: string) {
    const db = this.getDatabase();
    const payments = db.payments.filter(p => p.paymentDate >= startDate && p.paymentDate <= endDate);
    const expenses = db.expenses.filter(e => e.date >= startDate && e.date <= endDate);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Group expenses by category
    const categoryBreakdown: { [catId: string]: { name: string; amount: number } } = {};
    db.expenseCategories.forEach(c => {
      categoryBreakdown[c.id] = { name: c.name, amount: 0 };
    });

    expenses.forEach(e => {
      if (categoryBreakdown[e.categoryId]) {
        categoryBreakdown[e.categoryId].amount += e.amount;
      } else {
        categoryBreakdown[e.categoryId] = { name: e.categoryName || 'Other', amount: e.amount };
      }
    });

    return {
      startDate,
      endDate,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMarginPercent: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0.00',
      categoryBreakdown: Object.values(categoryBreakdown).filter(c => c.amount > 0),
      totalPaymentsCount: payments.length,
      totalExpensesCount: expenses.length,
    };
  }

  // --- Database Backup & Restore ---
  public createBackup(user: { id: string; name: string; role: string }): { filename: string; timestamp: string; sizeBytes: number } {
    this.ensureDataDirectories();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `isp_backup_${timestamp}.json`;
    const dest = path.join(BACKUPS_DIR, filename);

    const rawData = JSON.stringify(this.getDatabase(), null, 2);
    fs.writeFileSync(dest, rawData, 'utf-8');

    const db = this.getDatabase();
    db.lastBackupDate = new Date().toISOString();
    this.saveDatabase();

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'DATABASE_BACKUP',
      entityType: 'backup',
      entityId: filename,
      description: `Created full database snapshot backup: ${filename}.`,
    });

    return {
      filename,
      timestamp: new Date().toISOString(),
      sizeBytes: Buffer.byteLength(rawData),
    };
  }

  public listBackups(): Array<{ filename: string; createdAt: string; size: number }> {
    this.ensureDataDirectories();
    const files = fs.readdirSync(BACKUPS_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(BACKUPS_DIR, f);
        const stats = fs.statSync(fullPath);
        return {
          filename: f,
          createdAt: stats.mtime.toISOString(),
          size: stats.size,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public restoreBackup(filename: string, user: { id: string; name: string; role: string }): boolean {
    if (!isSafeBackupFilename(filename)) {
      throw new Error('Invalid backup filename. Only alphanumeric, hyphens, and underscores are allowed.');
    }

    const fullPath = path.join(BACKUPS_DIR, filename);
    if (!isPathInsideDirectory(BACKUPS_DIR, fullPath)) {
      throw new Error('Path traversal attempt detected. Access denied.');
    }

    if (!fs.existsSync(fullPath)) throw new Error('Backup file not found');

    const content = fs.readFileSync(fullPath, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.users || !parsed.customers) {
      throw new Error('Invalid database backup structure');
    }

    this.db = parsed;
    this.saveDatabase();

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'RESTORE_BACKUP',
      entityType: 'backup',
      entityId: filename,
      description: `Restored entire database from backup file ${filename}.`,
    });

    return true;
  }

  public resetToDefaultSeed(user: { id: string; name: string; role: string }): boolean {
    this.initDefaultDatabase();
    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'RESET_SEED_DATA',
      entityType: 'settings',
      entityId: 'SYSTEM',
      description: 'Reset system database back to default demonstration records.',
    });
    return true;
  }
}

export const dbService = new DatabaseService();
