import React from 'react';
import { DashboardAnalytics } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { KPICard } from '../common/KPICard';
import { RevenueExpenseChart } from './RevenueExpenseChart';
import { CustomerGrowthChart } from './CustomerGrowthChart';
import { PackagePieChart } from './PackagePieChart';
import { RecentTransactions } from './RecentTransactions';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Receipt,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  UserPlus,
  CreditCard,
  RefreshCw,
  PlusCircle,
  Package,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface DashboardViewProps {
  analytics?: DashboardAnalytics | null;
  kpis?: any;
  loading?: boolean;
  onNavigate?: (tab: any) => void;
  onOpenNewCustomer?: () => void;
  onOpenRecordPayment?: () => void;
  onOpenRenewPackage?: () => void;
  onOpenAddExpense?: () => void;
  onOpenCreatePackage?: () => void;
  onOpenCreateInvoice?: () => void;
  onOpenThermalReceipt?: (receiptId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  analytics,
  kpis: propKpis,
  loading = false,
  onNavigate,
  onOpenNewCustomer,
  onOpenRecordPayment,
  onOpenRenewPackage,
  onOpenAddExpense,
  onOpenCreatePackage,
}) => {
  const { hasPermission, isSuperAdmin, user } = useAuth();

  const navigateTo = (tab: any) => {
    if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
  };

  const currentAnalytics = analytics || {
    kpis: propKpis || {
      totalCustomers: 0,
      activeCustomers: 0,
      inactiveCustomers: 0,
      pendingPaymentsCount: 0,
      pendingPaymentAmount: 0,
      todayRevenue: 0,
      monthlyRevenue: 0,
      todayExpenses: 0,
      monthlyExpenses: 0,
      monthlySalariesPaid: 0,
      netProfit: 0,
      activeBandwidthGbps: 0,
    },
    revenueVsExpenses: [],
    customerGrowth: [],
    packageDistribution: [],
    paymentStatusSummary: {
      paidCount: 0,
      paidAmount: 0,
      partialCount: 0,
      partialAmount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      overdueCount: 0,
      overdueAmount: 0,
    },
    recentTransactions: [],
    recentCustomers: [],
  };

  const { kpis } = currentAnalytics;
  const canViewFinancials = isSuperAdmin || hasPermission('view_financial_kpis') || hasPermission('view_reports') || hasPermission('view_profit');

  if (loading && !analytics && !propKpis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm">Calculating real-time metrics from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {isSuperAdmin ? 'ISP Operations & Super Admin Control Center' : `Operator Workspace • ${user?.roleName || 'Staff'}`}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 sm:line-clamp-none">
            {isSuperAdmin
              ? 'Administrative authority across all subscribers, financial records, employee accounts, and system parameters.'
              : `Logged in as ${user?.name} (@${user?.username}). Authorized operational modules active.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {hasPermission('create_customer') && (
            <button
              onClick={onOpenNewCustomer}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>New Customer</span>
            </button>
          )}

          {hasPermission('receive_payment') && (
            <button
              onClick={onOpenRecordPayment}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Collect Payment</span>
            </button>
          )}

          {hasPermission('renew_customer') && (
            <button
              onClick={onOpenRenewPackage}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Renew</span>
            </button>
          )}

          {hasPermission('create_expense') && (
            <button
              onClick={onOpenAddExpense}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Expense</span>
            </button>
          )}

          {hasPermission('manage_packages') && (
            <button
              onClick={onOpenCreatePackage || (() => navigateTo('packages-all'))}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Package</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI CARDS GRID */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Key Performance Indicators</span>
          <span className="text-[11px] text-blue-600 font-medium">Calculated directly from transactional records</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Total Customers */}
          {hasPermission('view_customers') && (
            <KPICard
              title="Total Customers"
              value={kpis.totalCustomers}
              subtitle="Registered in system"
              icon={Users}
              iconColor="text-blue-600"
              iconBg="bg-blue-50 border-blue-200"
              onClick={() => navigateTo('customers-all')}
            />
          )}

          {/* 2. Active Customers */}
          {hasPermission('view_customers') && (
            <KPICard
              title="Active Subscribers"
              value={kpis.activeCustomers}
              badge="Online"
              badgeType="positive"
              icon={UserCheck}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50 border-emerald-200"
              onClick={() => navigateTo('customers-active')}
            />
          )}

          {/* 3. Inactive Customers */}
          {hasPermission('view_customers') && (
            <KPICard
              title="Inactive / Suspended"
              value={kpis.inactiveCustomers}
              badge="Offline"
              badgeType="neutral"
              icon={UserX}
              iconColor="text-slate-500"
              iconBg="bg-slate-100 border-slate-200"
              onClick={() => navigateTo('customers-inactive')}
            />
          )}

          {/* 4. Pending Invoices Count */}
          {hasPermission('view_billing') && (
            <KPICard
              title="Pending Invoices"
              value={kpis.pendingPaymentsCount}
              subtitle="Awaiting settlement"
              icon={Clock}
              iconColor="text-amber-600"
              iconBg="bg-amber-50 border-amber-200"
              onClick={() => navigateTo('billing-pending')}
            />
          )}

          {/* 5. Pending Payment Amount */}
          {hasPermission('view_billing') && (
            <KPICard
              title="Pending Dues"
              value={formatCurrency(kpis.pendingPaymentAmount)}
              badge="Receivable"
              badgeType="warning"
              icon={AlertTriangle}
              iconColor="text-amber-600"
              iconBg="bg-amber-50 border-amber-200"
              onClick={() => navigateTo('customers-pending')}
            />
          )}

          {/* 6. Today's Revenue */}
          {canViewFinancials && (
            <KPICard
              title="Today's Revenue"
              value={formatCurrency(kpis.todayRevenue)}
              subtitle="Collections today"
              icon={DollarSign}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50 border-emerald-200"
              onClick={() => navigateTo('billing-payments')}
            />
          )}

          {/* 7. Monthly Revenue */}
          {canViewFinancials && (
            <KPICard
              title="Monthly Revenue"
              value={formatCurrency(kpis.monthlyRevenue)}
              badge="This Month"
              badgeType="positive"
              icon={TrendingUp}
              iconColor="text-blue-600"
              iconBg="bg-blue-50 border-blue-200"
              onClick={() => navigateTo('reports-monthly')}
            />
          )}

          {/* 8. Today's Expenses */}
          {canViewFinancials && hasPermission('view_expenses') && (
            <KPICard
              title="Today's Expenses"
              value={formatCurrency(kpis.todayExpenses)}
              subtitle="Disbursed today"
              icon={TrendingDown}
              iconColor="text-rose-600"
              iconBg="bg-rose-50 border-rose-200"
              onClick={() => navigateTo('expenses-history')}
            />
          )}

          {/* 9. Monthly Expenses */}
          {canViewFinancials && hasPermission('view_expenses') && (
            <KPICard
              title="Monthly Expenses"
              value={formatCurrency(kpis.monthlyExpenses)}
              subtitle={`Incl. ${formatCurrency(kpis.monthlySalariesPaid)} Salaries`}
              icon={Wallet}
              iconColor="text-rose-600"
              iconBg="bg-rose-50 border-rose-200"
              onClick={() => navigateTo('expenses-history')}
            />
          )}

          {/* 10. Net Profit */}
          {canViewFinancials && (
            <KPICard
              title="Net Profit"
              value={formatCurrency(kpis.netProfit)}
              badge={kpis.netProfit >= 0 ? 'Profitable' : 'Deficit'}
              badgeType={kpis.netProfit >= 0 ? 'positive' : 'negative'}
              subtitle="Revenue − Expenses"
              icon={PiggyBank}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50 border-emerald-200"
              onClick={() => navigateTo('reports-pl')}
            />
          )}
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Revenue vs Expenses Bar/Line Chart */}
        {canViewFinancials && (
          <div className="lg:col-span-2 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Revenue vs. Expenses Trend</h3>
                <p className="text-xs text-slate-500 mt-0.5">Historical 6-month comparison with Net Profit line</p>
              </div>
              <button
                onClick={() => navigateTo('reports-pl')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 shrink-0"
              >
                <span>Full P&L Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <RevenueExpenseChart data={currentAnalytics.revenueVsExpenses} />
          </div>
        )}

        {/* Package Distribution Donut */}
        {hasPermission('view_packages') && (
          <div className={`p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between min-w-0 ${!canViewFinancials ? 'lg:col-span-3' : ''}`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Package Distribution</h3>
                <div className="flex items-center gap-2">
                  {onOpenCreatePackage && hasPermission('manage_packages') && (
                    <button
                      onClick={onOpenCreatePackage}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigateTo('packages-all')}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Manage
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2">Active subscribers by speed tiers</p>
              <PackagePieChart data={currentAnalytics.packageDistribution} />
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Total Plans: {currentAnalytics.packageDistribution.length}</span>
              <span className="text-blue-700 font-bold">{kpis.activeCustomers} Lines</span>
            </div>
          </div>
        )}
      </div>

      {/* LOWER SECTION: Payment Status Summary + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Customer Growth & Payment Breakdown */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          {/* Customer Growth Chart */}
          {hasPermission('view_customers') && (
            <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Customer Growth</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Subscriber onboarding progression over past 6 months</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 shrink-0">
                  +{currentAnalytics.recentCustomers.length} this month
                </span>
              </div>
              <CustomerGrowthChart data={currentAnalytics.customerGrowth} />
            </div>
          )}

          {/* Payment Status Summary Cards */}
          {hasPermission('view_billing') && (
            <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs min-w-0">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3">Invoice Ledger Status Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 min-w-0">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase truncate">Paid In Full</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
                    {currentAnalytics.paymentStatusSummary.paidCount} Bills
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 truncate">
                    {formatCurrency(currentAnalytics.paymentStatusSummary.paidAmount)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 min-w-0">
                  <div className="text-[11px] font-bold text-amber-700 uppercase truncate">Partially Paid</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
                    {currentAnalytics.paymentStatusSummary.partialCount} Bills
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 truncate">
                    Due: {formatCurrency(currentAnalytics.paymentStatusSummary.partialAmount)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 min-w-0">
                  <div className="text-[11px] font-bold text-blue-700 uppercase truncate">Pending Bills</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
                    {currentAnalytics.paymentStatusSummary.pendingCount} Bills
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 truncate">
                    Due: {formatCurrency(currentAnalytics.paymentStatusSummary.pendingAmount)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 min-w-0">
                  <div className="text-[11px] font-bold text-rose-700 uppercase truncate">Overdue Bills</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
                    {currentAnalytics.paymentStatusSummary.overdueCount} Bills
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 truncate">
                    Due: {formatCurrency(currentAnalytics.paymentStatusSummary.overdueAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Stream of Recent Transactions */}
        {(hasPermission('view_payments') || hasPermission('view_billing')) && (
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Transactions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live payments, expenses & renewals</p>
              </div>
              <button
                onClick={() => navigateTo('billing-payments')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                View All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[420px] custom-scrollbar pr-1">
              <RecentTransactions transactions={currentAnalytics.recentTransactions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

