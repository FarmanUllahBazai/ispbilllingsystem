export type UserRole = 'super_admin' | 'manager' | 'sales_staff' | 'accountant' | 'receptionist' | 'custom' | string;

export interface Permission {
  id: string;
  name: string;
  category: 'dashboard' | 'customers' | 'billing' | 'payments' | 'expenses' | 'packages' | 'staff' | 'reports' | 'users' | 'settings' | 'audit';
  action?: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'manage';
  module?: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
  permissions: string[]; // array of permission IDs
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  employeeId?: string;
  jobTitle?: string;
  roleId: string;
  roleName: string;
  status: 'active' | 'inactive';
  customPermissions?: string[]; // Granular permissions overridden for this specific employee
  permissions?: string[]; // Computed effective permissions
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternetPackage {
  id: string;
  name: string;
  speed: string; // e.g. "12 Mbps", "20 Mbps", "50 Mbps"
  monthlyPrice: number;
  billingCycle?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | string;
  validityDays?: number;
  description?: string;
  status?: 'active' | 'inactive' | string;
  isActive?: boolean;
  isFeatured?: boolean;

  // Bandwidth & Speed Customization
  downloadSpeed?: number;
  uploadSpeed?: number;
  speedUnit?: 'Mbps' | 'Gbps' | 'Kbps' | string;
  isSymmetrical?: boolean;
  burstSpeed?: string;
  nightSpeedBoost?: boolean;
  nightSpeedDetails?: string;

  // Data Quota & FUP
  dataLimitType?: 'unlimited' | 'capped' | string;
  monthlyQuotaGB?: number;
  postFupSpeed?: string;

  // Connection Medium & Network Profile
  connectionType?: 'ftth' | 'wireless' | 'dedicated' | 'corporate' | 'hotspot' | string;
  mikrotikProfile?: string;
  ipAllocation?: 'dynamic_cgnat' | 'static_real_ip' | 'dhcp_pool' | string;
  priorityQoS?: 'normal' | 'high' | 'vip' | string;

  // Commercial & Defaults
  taxIncluded?: boolean;
  taxPercentage?: number;
  defaultRouterPrice?: number;
  defaultInstallationCharge?: number;

  // Visuals & Features
  badgeText?: string;
  colorTheme?: 'cyan' | 'emerald' | 'purple' | 'amber' | 'rose' | 'blue' | 'indigo' | string;
  features?: string[];
  adminNotes?: string;

  // Metrics
  totalSubscribers?: number;
  activeSubscribers?: number;
  monthlyRevenue?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string; // e.g. "CUST-1001"
  subscriberId: string; // e.g. "SUB-94021"
  name: string;
  fatherOrCompanyName?: string;
  fatherName?: string;
  contactNumber: string;
  contact?: string;
  cnic?: string;
  address: string;
  cityArea?: string;
  notes?: string;

  // Package subscription
  packageId: string;
  packageName: string;
  packageSpeed?: string;
  monthlyFee?: number;
  monthlyPrice?: number;
  billingCycle?: string;

  // Key dates
  installationDate?: string;
  activationDate?: string;
  expiryDate?: string;

  // Initial installation charges breakdown
  routerPrice?: number;
  installationCharges?: number;
  wireCharges?: number;
  wireLengthMeters?: number;
  otherCharges?: number;
  discount?: number;
  totalInitialCharges?: number;
  paidInitialAmount?: number;
  remainingInitialAmount?: number;

  // Financial summary
  accountStatus?: 'active' | 'inactive' | 'suspended' | string;
  status?: 'active' | 'inactive' | 'suspended' | 'expired' | string;
  paymentStatus?: 'paid' | 'partial' | 'pending' | 'overdue' | string;
  totalBilled?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  balance?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice?: number;
  amount?: number;
  total?: number;
}

export interface Invoice {
  id: string; // e.g. "INV-2026-001"
  invoiceNumber: string;
  customerId: string;
  subscriberId?: string;
  customerName: string;
  customerContact?: string;
  customerAddress?: string;

  invoiceType?: 'initial_connection' | 'monthly_subscription' | 'package_renewal' | 'hardware_charge' | 'custom' | string;
  type?: string;
  
  packageId?: string;
  packageName?: string;
  packageSpeed?: string;

  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  issueDate?: string;
  dueDate?: string;

  monthlyPackageFee?: number;
  routerCharges?: number;
  installationCharges?: number;
  wireCharges?: number;
  otherCharges?: number;
  previousBalance?: number;
  subtotal?: number;
  discount?: number;
  tax?: number;

  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus?: 'paid' | 'partial' | 'pending' | 'overdue' | string;
  status?: 'paid' | 'partial' | 'pending' | 'overdue' | string;

  items: InvoiceItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string; // e.g. "PAY-1001"
  receiptNumber: string; // e.g. "RCP-2026-001"
  invoiceId?: string;
  customerId: string;
  subscriberId?: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'online_transfer' | 'easypaisa_jazzcash' | 'cheque' | string;
  referenceNumber?: string;
  receivedBy?: string;
  receivedByName?: string;
  notes?: string;
  remarks?: string;
  createdAt?: string;
}

export interface PaymentReceipt {
  id?: string;
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  receivedByName?: string;
  receivedBy?: string;
  customerId: string;
  subscriberId?: string;
  customerName: string;
  customerContact?: string;
  packageName?: string;
  speed?: string;
  expiryDate?: string;
  remainingBalance?: number;
  items?: Array<{ description: string; amount: number }>;
}

export interface PackageRenewal {
  id: string;
  customerId: string;
  subscriberId: string;
  customerName: string;
  previousPackageId: string;
  previousPackageName: string;
  newPackageId: string;
  newPackageName: string;
  renewalPeriodMonths: number;
  renewalFee: number;
  discount: number;
  totalCharges: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  effectiveDate: string;
  newExpiryDate: string;
  processedBy: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  color?: string;
  icon?: string;
  budgetMonthly?: number;
  monthlyBudget?: number;
  createdAt?: string;
}

export interface ExpenseItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Expense {
  id: string; // e.g. "EXP-1001"
  categoryId: string;
  categoryName?: string;
  customCategoryName?: string;
  description: string;
  title?: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'online_transfer' | 'easypaisa_jazzcash' | 'cheque' | 'petty_cash' | 'company_card' | string;
  vendorOrPayee?: string;
  payee?: string;
  referenceNumber?: string;
  expenseType?: 'operational' | 'capital' | 'emergency_repair' | 'maintenance' | 'administrative' | 'bandwidth' | 'custom' | string;
  taxAmount?: number;
  taxRatePercent?: number;
  items?: ExpenseItem[];
  isRecurring?: boolean;
  recurrenceInterval?: 'monthly' | 'quarterly' | 'yearly' | 'biweekly' | 'none' | string;
  tags?: string[];
  status?: 'paid' | 'pending_approval' | 'under_review' | string;
  addedBy?: string;
  notes?: string;
  isSalaryExpense?: boolean;
  salaryPaymentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Staff {
  id: string;
  staffId?: string; // e.g. "STF-101"
  name: string;
  contact?: string;
  contactNumber?: string;
  cnic?: string;
  designation: string; // e.g. "Network Technician", "Support Operator", "Accountant"
  joiningDate?: string;
  basicSalary: number;
  status: 'active' | 'inactive' | string;
  address?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StaffMember = Staff;

export interface SalaryPayment {
  id: string;
  staffId: string;
  staffName?: string;
  designation?: string;
  salaryMonth?: string; // "YYYY-MM"
  month?: string;
  basicSalary: number;
  bonus: number;
  deduction?: number;
  deductions?: number;
  netSalary: number; // basic + bonus - deduction
  paidAmount?: number;
  remainingSalary?: number;
  paymentDate: string;
  paymentMethod: string;
  paymentStatus?: 'paid' | 'partial' | 'unpaid' | string;
  processedBy?: string;
  expenseId?: string;
  remarks?: string;
  notes?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName: string;
  userRole?: string;
  action: string;
  entityType: 'customer' | 'invoice' | 'payment' | 'renewal' | 'expense' | 'staff' | 'salary' | 'package' | 'user' | 'role' | 'settings' | 'auth' | 'backup' | string;
  entityId?: string;
  description?: string;
  details?: string;
  ipAddress?: string;
}

export interface SystemSettings {
  companyName: string;
  companySlogan?: string;
  companyTagline?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  supportPhone?: string;
  supportNumber?: string;
  supportEmail?: string;
  address?: string;
  ntnOrTaxId?: string;
  ntnNumber?: string;
  currencySymbol: string;
  currencyCode?: string;
  thermalPrinterWidth?: '58mm' | '80mm';
  thermalPaperWidth?: '58mm' | '80mm';
  receiptFooterNote?: string;
  wireRatePerMeter?: number;
  defaultInstallationFee?: number;
  defaultRouterPrice?: number;
  invoiceDueDays?: number;
  gracePeriodDays?: number;
  autoDisconnectUnpaid?: boolean;
  defaultTaxRate?: number;
}

export interface DashboardKPIs {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  pendingPaymentsCount: number;
  pendingPaymentAmount: number;
  todayRevenue: number;
  monthlyRevenue: number;
  todayExpenses: number;
  monthlyExpenses: number;
  netProfit: number;
  monthlySalariesPaid: number;
}

export interface DashboardAnalytics {
  kpis: DashboardKPIs;
  revenueVsExpenses: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  customerGrowth: Array<{
    month: string;
    customers: number;
    newSubscribers: number;
  }>;
  packageDistribution: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  paymentStatusSummary: {
    paidCount: number;
    paidAmount: number;
    partialCount: number;
    partialAmount: number;
    pendingCount: number;
    pendingAmount: number;
    overdueCount: number;
    overdueAmount: number;
  };
  recentTransactions: Array<{
    id: string;
    type: 'payment' | 'invoice' | 'expense' | 'customer' | 'renewal';
    title: string;
    subtitle: string;
    amount?: number;
    status?: string;
    date: string;
  }>;
  recentCustomers: Customer[];
}
