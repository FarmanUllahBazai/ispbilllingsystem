import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  PlusCircle,
  Receipt,
  CreditCard,
  Package,
  TrendingDown,
  UserCheck,
  FileText,
  ShieldCheck,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  DollarSign,
  AlertCircle,
  FileCheck2,
  CalendarDays,
  PieChart,
  Layers,
  WalletCards,
  Coins,
  X,
  Wifi,
} from 'lucide-react';

export type NavigationTarget =
  | 'dashboard'
  | 'customers-all'
  | 'customers-new'
  | 'customers-active'
  | 'customers-inactive'
  | 'customers-pending'
  | 'billing-invoices'
  | 'billing-payments'
  | 'billing-pending'
  | 'billing-receipts'
  | 'packages-all'
  | 'packages-new'
  | 'packages-manage'
  | 'expenses-add'
  | 'expenses-history'
  | 'expenses-categories'
  | 'staff-all'
  | 'staff-salaries'
  | 'reports-daily'
  | 'reports-monthly'
  | 'reports-pl'
  | 'users-all'
  | 'users-roles'
  | 'users-permissions'
  | 'audit-logs'
  | 'settings';

interface SidebarProps {
  currentTab?: string;
  currentView?: string;
  onNavigate?: (tab: any) => void;
  onSelectView?: (tab: any) => void;
  pendingCount?: number;
  unreadCount?: number;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  currentView,
  onNavigate,
  onSelectView,
  pendingCount = 0,
  unreadCount = 0,
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { hasPermission, user } = useAuth();

  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    customers: true,
    billing: true,
    packages: false,
    expenses: false,
    staff: false,
    reports: false,
    users: false,
  });

  // Close mobile sidebar on escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const activeTab = currentTab || currentView || 'dashboard';

  const navigateTo = (tab: any) => {
    if (typeof onNavigate === 'function') {
      onNavigate(tab);
    }
    if (typeof onSelectView === 'function') {
      onSelectView(tab);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isCurrent = (tab: string) => activeTab === tab || activeTab.startsWith(tab);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-700 select-none">
      {/* Mobile-only Header with Brand & Close Button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-none">ApexFiber ISP</div>
            <div className="text-[10px] text-blue-600 font-medium mt-0.5">{user?.roleName || 'Operator'}</div>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 text-sm font-medium">
        {/* Dashboard */}
        {hasPermission('view_dashboard') && (
          <button
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              isCurrent('dashboard')
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${isCurrent('dashboard') ? 'text-blue-700' : 'text-slate-500'} shrink-0`} />
            <span className="truncate">Dashboard</span>
          </button>
        )}

        {/* Customers Section */}
        {hasPermission('view_customers') && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('customers')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Customers</span>
              </div>
              {expandedSections.customers ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {expandedSections.customers && (
              <div className="pl-3 space-y-0.5 mt-1 border-l border-slate-200 ml-3">
                <button
                  onClick={() => navigateTo('customers-all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('customers-all')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>All Customers</span>
                </button>

                {hasPermission('create_customer') && (
                  <button
                    onClick={() => navigateTo('customers-new')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                      isCurrent('customers-new')
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>+ New Customer</span>
                  </button>
                )}

                <button
                  onClick={() => navigateTo('customers-active')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('customers-active')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Active Customers</span>
                </button>

                <button
                  onClick={() => navigateTo('customers-inactive')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('customers-inactive')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Inactive Customers</span>
                </button>

                <button
                  onClick={() => navigateTo('customers-pending')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('customers-pending')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Pending Payments</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Billing Section */}
        {hasPermission('view_billing') && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('billing')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900"
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                <span>Billing</span>
              </div>
              {expandedSections.billing ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {expandedSections.billing && (
              <div className="pl-3 space-y-0.5 mt-1 border-l border-slate-200 ml-3">
                <button
                  onClick={() => navigateTo('billing-invoices')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('billing-invoices')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Invoices</span>
                </button>

                <button
                  onClick={() => navigateTo('billing-payments')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('billing-payments')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Payments</span>
                </button>

                <button
                  onClick={() => navigateTo('billing-pending')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('billing-pending')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Pending Bills</span>
                </button>

                <button
                  onClick={() => navigateTo('billing-receipts')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('billing-receipts')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Receipts (Thermal)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Packages Section */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('packages')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900"
          >
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span>Packages</span>
            </div>
            {expandedSections.packages ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {expandedSections.packages && (
            <div className="pl-3 space-y-0.5 mt-1 border-l border-slate-200 ml-3">
              <button
                onClick={() => navigateTo('packages-all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  isCurrent('packages-all')
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>All Packages</span>
              </button>

              {hasPermission('manage_packages') && (
                <>
                  <button
                    onClick={() => navigateTo('packages-new')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                      isCurrent('packages-new')
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <PlusCircle className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>+ Add New Package</span>
                  </button>

                  <button
                    onClick={() => navigateTo('packages-manage')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isCurrent('packages-manage')
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>Package Management</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Expenses Section */}
        {hasPermission('view_expenses') && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('expenses')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900"
            >
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Expenses</span>
              </div>
              {expandedSections.expenses ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {expandedSections.expenses && (
              <div className="pl-3 space-y-0.5 mt-1 border-l border-slate-200 ml-3">
                {hasPermission('create_expense') && (
                  <button
                    onClick={() => navigateTo('expenses-add')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isCurrent('expenses-add')
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>+ Add Expense</span>
                  </button>
                )}

                <button
                  onClick={() => navigateTo('expenses-history')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('expenses-history')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Expense History</span>
                </button>

                <button
                  onClick={() => navigateTo('expenses-categories')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('expenses-categories')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Categories</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Staff & Salaries Section */}
        {hasPermission('view_staff') && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('staff')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Staff & Salaries</span>
              </div>
              {expandedSections.staff ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {expandedSections.staff && (
              <div className="pl-3 space-y-0.5 mt-1 border-l border-slate-200 ml-3">
                <button
                  onClick={() => navigateTo('staff-all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('staff-all')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Staff Members</span>
                </button>

                {hasPermission('view_salaries') && (
                  <button
                    onClick={() => navigateTo('staff-salaries')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isCurrent('staff-salaries')
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>Salary Payments</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reports Section */}
        {hasPermission('view_reports') && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('reports')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Reports</span>
              </div>
              {expandedSections.reports ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {expandedSections.reports && (
              <div className="pl-3 space-y-0.5 mt-1 border-l border-slate-200 ml-3">
                <button
                  onClick={() => navigateTo('reports-daily')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('reports-daily')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Daily Report</span>
                </button>

                <button
                  onClick={() => navigateTo('reports-monthly')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('reports-monthly')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Monthly Report</span>
                </button>

                <button
                  onClick={() => navigateTo('reports-pl')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('reports-pl')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Profit & Loss</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Users & Roles Section */}
        {hasPermission('manage_users') && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('users')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Users & Roles</span>
              </div>
              {expandedSections.users ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {expandedSections.users && (
              <div className="pl-3 space-y-0.5 mt-1 border-l border-slate-200 ml-3">
                <button
                  onClick={() => navigateTo('users-all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isCurrent('users-all')
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Users</span>
                </button>

                {hasPermission('manage_roles') && (
                  <button
                    onClick={() => navigateTo('users-roles')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isCurrent('users-roles')
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>Roles & Permissions</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Audit Logs */}
        {hasPermission('view_audit_logs') && (
          <div className="pt-2">
            <button
              onClick={() => navigateTo('audit-logs')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs font-semibold ${
                isCurrent('audit-logs')
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">Audit Logs</span>
            </button>
          </div>
        )}

        {/* Settings */}
        {hasPermission('manage_settings') && (
          <div className="pt-1">
            <button
              onClick={() => navigateTo('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs font-semibold ${
                isCurrent('settings')
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">Settings & Backup</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-auto p-4 border-t border-slate-200 bg-slate-50/70 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>Engine Status</span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">v3.4.0 • Enterprise ISP Edition</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-[calc(100vh-4rem)] sticky top-16 shrink-0 select-none ${
          collapsed ? 'lg:hidden' : ''
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Drawer Modal / Off-Canvas */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-in Drawer Container */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250 ease-out border-r border-slate-200 bg-white">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

