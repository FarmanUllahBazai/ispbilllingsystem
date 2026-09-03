import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomerListView } from './components/customers/CustomerListView';
import { InvoicesListView } from './components/billing/InvoicesListView';
import { PaymentsListView } from './components/billing/PaymentsListView';
import { PackagesListView } from './components/packages/PackagesListView';
import { ExpensesListView } from './components/expenses/ExpensesListView';
import { StaffListView } from './components/staff/StaffListView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { AuditLogsView } from './components/logs/AuditLogsView';
import { EmployeeManagementView } from './components/users/EmployeeManagementView';

// Modals
import { NewCustomerModal } from './components/customers/NewCustomerModal';
import { RenewPackageModal } from './components/customers/RenewPackageModal';
import { EditCustomerModal } from './components/customers/EditCustomerModal';
import { CustomerProfileModal } from './components/customers/CustomerProfileModal';
import { RecordPaymentModal } from './components/billing/RecordPaymentModal';
import { CreateInvoiceModal } from './components/billing/CreateInvoiceModal';
import { ThermalReceiptModal } from './components/billing/ThermalReceiptModal';
import { PackageModal } from './components/packages/PackageModal';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { ExpenseCategoriesModal } from './components/expenses/ExpenseCategoriesModal';
import { StaffModal } from './components/staff/StaffModal';
import { PaySalaryModal } from './components/staff/PaySalaryModal';

// Types & Services
import {
  Customer,
  InternetPackage,
  Invoice,
  Payment,
  Expense,
  ExpenseCategory,
  StaffMember,
  SalaryPayment,
  SystemSettings,
  DashboardKPIs,
  DashboardAnalytics,
} from './types';
import { api } from './services/api';

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const { success, error } = useToast();

  // Navigation State
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Data State
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<InternetPackage[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [salaries, setSalaries] = useState<SalaryPayment[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Modal Control States
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [renewCustomer, setRenewCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [profileCustomer, setProfileCustomer] = useState<Customer | null>(null);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentInitialCustomer, setPaymentInitialCustomer] = useState<string | undefined>();
  const [paymentInitialInvoice, setPaymentInitialInvoice] = useState<string | undefined>();

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);

  const [packageModalData, setPackageModalData] = useState<{ open: boolean; pkg: InternetPackage | null }>({
    open: false,
    pkg: null,
  });

  const [expenseModalData, setExpenseModalData] = useState<{ open: boolean; expense: Expense | null }>({
    open: false,
    expense: null,
  });
  const [isExpenseCategoriesOpen, setIsExpenseCategoriesOpen] = useState(false);

  const [staffModalData, setStaffModalData] = useState<{ open: boolean; staff: StaffMember | null }>({
    open: false,
    staff: null,
  });
  const [paySalaryStaffId, setPaySalaryStaffId] = useState<{ open: boolean; staffId?: string }>({
    open: false,
  });

  // Load all applet data with resilient fault tolerance
  const loadAllData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.getDashboardKPIs(),
        api.getDashboardAnalytics(),
        api.getCustomers(),
        api.getPackages(),
        api.getInvoices(),
        api.getPayments(),
        api.getExpenses(),
        api.getExpenseCategories(),
        api.getStaff(),
        api.getSalaries(),
        api.getSettings(),
      ]);

      const [
        kpiRes,
        analyticsRes,
        customersRes,
        packagesRes,
        invoicesRes,
        paymentsRes,
        expensesRes,
        categoriesRes,
        staffRes,
        salariesRes,
        settingsRes,
      ] = results;

      if (kpiRes.status === 'fulfilled' && kpiRes.value) setKpis(kpiRes.value);
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) setAnalytics(analyticsRes.value);
      if (customersRes.status === 'fulfilled' && customersRes.value) setCustomers(customersRes.value);
      if (packagesRes.status === 'fulfilled' && packagesRes.value) setPackages(packagesRes.value);
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value) setInvoices(invoicesRes.value);
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value) setPayments(paymentsRes.value);
      if (expensesRes.status === 'fulfilled' && expensesRes.value) setExpenses(expensesRes.value);
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value) setCategories(categoriesRes.value);
      if (staffRes.status === 'fulfilled' && staffRes.value) setStaff(staffRes.value);
      if (salariesRes.status === 'fulfilled' && salariesRes.value) setSalaries(salariesRes.value);
      if (settingsRes.status === 'fulfilled' && settingsRes.value) setSettings(settingsRes.value);

      // Check if critical core data failed due to token issues
      const criticalFailures = results.filter(
        r => r.status === 'rejected' && r.reason?.message?.includes('401')
      );
      if (criticalFailures.length > 0 && user) {
        console.warn('Authentication token expired or rejected, session refreshed.');
      }
    } catch (err: any) {
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadAllData();
    }
  }, [authLoading, user, loadAllData]);

  const handleNavigate = (target: string) => {
    setMobileMenuOpen(false);
    if (!target) return;

    if (target === 'dashboard') {
      setCurrentView('dashboard');
    } else if (target === 'customers-all' || target === 'customers') {
      setCurrentView('customers');
    } else if (target === 'customers-new') {
      setIsNewCustomerOpen(true);
      setCurrentView('customers');
    } else if (target === 'customers-active' || target === 'customers-inactive' || target === 'customers-pending') {
      setCurrentView('customers');
    } else if (target === 'billing-invoices' || target === 'invoices') {
      setCurrentView('invoices');
    } else if (target === 'billing-payments' || target === 'payments') {
      setCurrentView('payments');
    } else if (target === 'billing-pending') {
      setCurrentView('invoices');
    } else if (target === 'billing-receipts') {
      setCurrentView('payments');
    } else if (target === 'packages-new') {
      setPackageModalData({ open: true, pkg: null });
      setCurrentView('packages');
    } else if (target === 'packages-all' || target === 'packages-manage' || target === 'packages') {
      setCurrentView('packages');
    } else if (target === 'expenses-add') {
      setExpenseModalData({ open: true, expense: null });
      setCurrentView('expenses');
    } else if (target === 'expenses-history' || target === 'expenses') {
      setCurrentView('expenses');
    } else if (target === 'expenses-categories') {
      setIsExpenseCategoriesOpen(true);
      setCurrentView('expenses');
    } else if (target === 'staff-all' || target === 'staff') {
      setCurrentView('staff');
    } else if (target === 'staff-salaries') {
      setCurrentView('staff');
    } else if (target.startsWith('reports')) {
      setCurrentView('reports');
    } else if (target.startsWith('users') || target === 'employees' || target === 'roles') {
      setCurrentView('users');
    } else if (target === 'settings') {
      setCurrentView('settings');
    } else if (target === 'audit-logs' || target === 'logs') {
      setCurrentView('logs');
    } else {
      setCurrentView(target);
    }
  };

  // Handlers for data updates
  const handleCustomerCreated = (newCust: Customer) => {
    setCustomers(prev => [newCust, ...prev]);
    loadAllData();
  };

  const handleCustomerRenewed = (updated: Customer, invoice: Invoice) => {
    setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    setInvoices(prev => [invoice, ...prev]);
    loadAllData();
  };

  const handleCustomerUpdated = (updated: Customer) => {
    setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    loadAllData();
  };

  const handleCustomerDeleted = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    loadAllData();
  };

  const handlePaymentSuccess = (newPayment: Payment, receiptId: string) => {
    setPayments(prev => [newPayment, ...prev]);
    setActiveReceiptId(receiptId);
    loadAllData();
  };

  const handleInvoiceCreated = (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
    loadAllData();
  };

  const handlePackageSaved = (savedPkg: InternetPackage) => {
    setPackages(prev => {
      const idx = prev.findIndex(p => p.id === savedPkg.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedPkg;
        return next;
      }
      return [savedPkg, ...prev];
    });
    loadAllData();
  };

  const handleDeletePackage = async (pkg: InternetPackage) => {
    const assignedCustomers = customers.filter(c => c.packageId === pkg.id);
    if (assignedCustomers.length > 0) {
      return error(`Cannot delete "${pkg.name}". There are ${assignedCustomers.length} active subscriber lines using this plan.`);
    }

    if (window.confirm(`Are you sure you want to delete the package "${pkg.name}"?`)) {
      try {
        await api.deletePackage(pkg.id);
        success(`Package "${pkg.name}" deleted successfully.`);
        setPackages(prev => prev.filter(p => p.id !== pkg.id));
        loadAllData();
      } catch (err: any) {
        error(err.message || 'Failed to delete package');
      }
    }
  };

  const handleDuplicatePackage = (pkg: InternetPackage) => {
    const duplicated: InternetPackage = {
      ...pkg,
      id: '',
      name: `${pkg.name} (Copy)`,
      totalSubscribers: 0,
      activeSubscribers: 0,
      monthlyRevenue: 0,
    };
    setPackageModalData({ open: true, pkg: duplicated });
  };

  const handleExpenseSaved = (savedExp: Expense) => {
    setExpenses(prev => {
      const idx = prev.findIndex(e => e.id === savedExp.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedExp;
        return next;
      }
      return [savedExp, ...prev];
    });
    loadAllData();
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (window.confirm(`Are you sure you want to delete expense "${expense.title}"?`)) {
      try {
        await api.deleteExpense(expense.id);
        success('Expense record deleted');
        setExpenses(prev => prev.filter(e => e.id !== expense.id));
        loadAllData();
      } catch (err: any) {
        error(err.message || 'Failed to delete expense');
      }
    }
  };

  const handleStaffSaved = (savedStaff: StaffMember) => {
    setStaff(prev => {
      const idx = prev.findIndex(s => s.id === savedStaff.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedStaff;
        return next;
      }
      return [savedStaff, ...prev];
    });
    loadAllData();
  };

  const handleSalaryPaid = (salaryRecord: SalaryPayment) => {
    setSalaries(prev => [salaryRecord, ...prev]);
    loadAllData();
  };

  const openCollectPaymentFor = (customer: Customer, invoiceId?: string) => {
    setPaymentInitialCustomer(customer.id);
    setPaymentInitialInvoice(invoiceId);
    setIsRecordPaymentOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono text-slate-300">Initializing ApexFiber ISP Portal...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => {
          if (window.innerWidth < 1024) {
            setMobileMenuOpen(!mobileMenuOpen);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
        onSearch={query => {
          setSearchQuery(query);
          if (query && currentView !== 'customers') {
            setCurrentView('customers');
          }
        }}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentView}
          currentView={currentView}
          onNavigate={handleNavigate}
          onSelectView={handleNavigate}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          unreadCount={customers.filter(c => c.status === 'expired' || c.status === 'suspended').length}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 min-w-0">
          {currentView === 'dashboard' && (
            <DashboardView
              analytics={analytics}
              kpis={kpis}
              loading={loading}
              onNavigate={handleNavigate}
              onOpenNewCustomer={() => setIsNewCustomerOpen(true)}
              onOpenRecordPayment={() => {
                setPaymentInitialCustomer(undefined);
                setPaymentInitialInvoice(undefined);
                setIsRecordPaymentOpen(true);
              }}
              onOpenRenewPackage={() => {
                if (customers.length > 0) {
                  setRenewCustomer(customers[0]);
                }
              }}
              onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
              onOpenAddExpense={() => setExpenseModalData({ open: true, expense: null })}
              onOpenCreatePackage={() => setPackageModalData({ open: true, pkg: null })}
              onOpenThermalReceipt={receiptId => setActiveReceiptId(receiptId)}
            />
          )}

          {currentView === 'customers' && (
            <CustomerListView
              customers={customers}
              packages={packages}
              loading={loading}
              initialFilterStatus={searchQuery ? 'all' : undefined}
              onOpenNewCustomer={() => setIsNewCustomerOpen(true)}
              onRenewCustomer={c => setRenewCustomer(c)}
              onEditCustomer={c => setEditCustomer(c)}
              onViewProfile={c => setProfileCustomer(c)}
              onRecordPayment={c => openCollectPaymentFor(c)}
              onDeleteCustomer={handleCustomerDeleted}
            />
          )}

          {currentView === 'invoices' && (
            <InvoicesListView
              invoices={invoices}
              customers={customers}
              loading={loading}
              onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
              onRecordPayment={(cust, invId) => openCollectPaymentFor(cust, invId)}
              onPrintInvoice={invoiceId => setActiveReceiptId(invoiceId)}
            />
          )}

          {currentView === 'payments' && (
            <PaymentsListView
              payments={payments}
              customers={customers}
              loading={loading}
              onOpenRecordPayment={() => {
                setPaymentInitialCustomer(undefined);
                setPaymentInitialInvoice(undefined);
                setIsRecordPaymentOpen(true);
              }}
              onPrintReceipt={receiptId => setActiveReceiptId(receiptId)}
            />
          )}

          {currentView === 'packages' && (
            <PackagesListView
              packages={packages}
              customers={customers}
              loading={loading}
              onOpenCreatePackage={() => setPackageModalData({ open: true, pkg: null })}
              onEditPackage={pkg => setPackageModalData({ open: true, pkg })}
              onDeletePackage={handleDeletePackage}
              onDuplicatePackage={handleDuplicatePackage}
            />
          )}

          {currentView === 'expenses' && (
            <ExpensesListView
              expenses={expenses}
              categories={categories}
              loading={loading}
              onOpenAddExpense={() => setExpenseModalData({ open: true, expense: null })}
              onOpenCategories={() => setIsExpenseCategoriesOpen(true)}
              onEditExpense={exp => setExpenseModalData({ open: true, expense: exp })}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {currentView === 'staff' && (
            <StaffListView
              staff={staff}
              salaries={salaries}
              loading={loading}
              onOpenCreateStaff={() => setStaffModalData({ open: true, staff: null })}
              onOpenPaySalary={staffId => setPaySalaryStaffId({ open: true, staffId })}
              onEditStaff={s => setStaffModalData({ open: true, staff: s })}
            />
          )}

          {currentView === 'reports' && <ReportsView />}

          {currentView === 'users' && <EmployeeManagementView />}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onSettingsSaved={updated => setSettings(updated)}
              onRefreshData={loadAllData}
            />
          )}

          {currentView === 'logs' && <AuditLogsView />}
        </main>
      </div>

      {/* ================= GLOBAL MODALS ================= */}

      {/* 1. New Customer Modal */}
      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        packages={packages}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* 2. Package Renewal Modal */}
      <RenewPackageModal
        isOpen={!!renewCustomer}
        onClose={() => setRenewCustomer(null)}
        customer={renewCustomer}
        packages={packages}
        onRenewSuccess={handleCustomerRenewed}
      />

      {/* 3. Edit Customer Modal */}
      <EditCustomerModal
        isOpen={!!editCustomer}
        onClose={() => setEditCustomer(null)}
        customer={editCustomer}
        packages={packages}
        onCustomerUpdated={handleCustomerUpdated}
      />

      {/* 4. Customer Profile Ledger Modal */}
      <CustomerProfileModal
        isOpen={!!profileCustomer}
        onClose={() => setProfileCustomer(null)}
        customer={profileCustomer}
        onRecordPayment={c => openCollectPaymentFor(c)}
        onRenewPackage={c => setRenewCustomer(c)}
        onPrintReceipt={receiptId => setActiveReceiptId(receiptId)}
      />

      {/* 5. Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        customers={customers}
        initialCustomerId={paymentInitialCustomer}
        initialInvoiceId={paymentInitialInvoice}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 6. Create Custom Bill / Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        customers={customers}
        onInvoiceCreated={handleInvoiceCreated}
      />

      {/* 7. Thermal POS Receipt Slip Modal (58mm / 80mm) */}
      <ThermalReceiptModal
        isOpen={!!activeReceiptId}
        onClose={() => setActiveReceiptId(null)}
        receiptId={activeReceiptId}
        settings={settings}
      />

      {/* 8. Package Add/Edit Modal */}
      <PackageModal
        isOpen={packageModalData.open}
        onClose={() => setPackageModalData({ open: false, pkg: null })}
        packageData={packageModalData.pkg}
        onSaved={handlePackageSaved}
      />

      {/* 9. Expense Add/Edit Modal */}
      <ExpenseModal
        isOpen={expenseModalData.open}
        onClose={() => setExpenseModalData({ open: false, expense: null })}
        categories={categories}
        expenseData={expenseModalData.expense}
        onSaved={handleExpenseSaved}
      />

      {/* 10. Expense Categories Modal */}
      <ExpenseCategoriesModal
        isOpen={isExpenseCategoriesOpen}
        onClose={() => setIsExpenseCategoriesOpen(false)}
        categories={categories}
        onCategoryAdded={newCat => {
          setCategories(prev => [...prev, newCat]);
          loadAllData();
        }}
        onCategoryUpdated={updatedCat => {
          setCategories(prev => prev.map(c => (c.id === updatedCat.id ? updatedCat : c)));
          loadAllData();
        }}
        onCategoryDeleted={deletedId => {
          setCategories(prev => prev.filter(c => c.id !== deletedId));
          loadAllData();
        }}
      />

      {/* 11. Staff Add/Edit Modal */}
      <StaffModal
        isOpen={staffModalData.open}
        onClose={() => setStaffModalData({ open: false, staff: null })}
        staffData={staffModalData.staff}
        onSaved={handleStaffSaved}
      />

      {/* 12. Pay Salary Modal */}
      <PaySalaryModal
        isOpen={paySalaryStaffId.open}
        onClose={() => setPaySalaryStaffId({ open: false })}
        staffList={staff.filter(s => s.status === 'active')}
        initialStaffId={paySalaryStaffId.staffId}
        onSalaryPaid={handleSalaryPaid}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
