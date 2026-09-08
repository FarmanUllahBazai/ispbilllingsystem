import React, { useState, useEffect } from 'react';
import { SystemSettings, UserRole } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Settings,
  Building,
  Printer,
  Shield,
  Save,
  Users,
  Database,
  RefreshCw,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  HardDrive,
  Download,
} from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettings | null;
  onSettingsSaved: (updated: SystemSettings) => void;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsSaved,
  onRefreshData,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'thermal' | 'rbac' | 'database'>('general');

  // Form State
  const [companyName, setCompanyName] = useState(settings?.companyName || 'APEXFIBER BROADBAND ISP');
  const [companyTagline, setCompanyTagline] = useState(settings?.companyTagline || 'Ultra-Fast Fiber Optic Internet');
  const [supportNumber, setSupportNumber] = useState(settings?.supportNumber || '+92 300 1234567');
  const [supportEmail, setSupportEmail] = useState(settings?.supportEmail || 'support@apexfiber.net');
  const [address, setAddress] = useState(settings?.address || 'Main Commercial Market, Sector G-10, Islamabad');
  const [ntnNumber, setNtnNumber] = useState(settings?.ntnNumber || '7894561-2');
  const [currencySymbol, setCurrencySymbol] = useState(settings?.currencySymbol || 'Rs.');

  // Billing
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(settings?.gracePeriodDays || 5);
  const [autoDisconnectUnpaid, setAutoDisconnectUnpaid] = useState<boolean>(settings?.autoDisconnectUnpaid ?? false);
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(settings?.defaultTaxRate || 0);

  // Thermal Receipt
  const [thermalPaperWidth, setThermalPaperWidth] = useState<'58mm' | '80mm'>(settings?.thermalPaperWidth || '80mm');
  const [receiptFooterNote, setReceiptFooterNote] = useState(
    settings?.receiptFooterNote || 'Thank you for choosing APEXFIBER. Valid computer-generated official receipt.'
  );

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName);
      setCompanyTagline(settings.companyTagline);
      setSupportNumber(settings.supportNumber);
      setSupportEmail(settings.supportEmail);
      setAddress(settings.address);
      setNtnNumber(settings.ntnNumber);
      setCurrencySymbol(settings.currencySymbol);
      setGracePeriodDays(settings.gracePeriodDays);
      setAutoDisconnectUnpaid(settings.autoDisconnectUnpaid);
      setDefaultTaxRate(settings.defaultTaxRate);
      setThermalPaperWidth(settings.thermalPaperWidth);
      setReceiptFooterNote(settings.receiptFooterNote);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Partial<SystemSettings> = {
        companyName,
        companyTagline,
        supportNumber,
        supportEmail,
        address,
        ntnNumber,
        currencySymbol,
        gracePeriodDays: Number(gracePeriodDays),
        autoDisconnectUnpaid,
        defaultTaxRate: Number(defaultTaxRate),
        thermalPaperWidth,
        receiptFooterNote,
      };

      const updated = await api.updateSettings(payload);
      success('System configuration saved successfully!');
      onSettingsSaved(updated);
    } catch (err: any) {
      error(err.message || 'Failed to save settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearAllData = async () => {
    setClearing(true);
    try {
      await api.clearAllData();
      success('All operational records (customers, packages, invoices, payments, expenses, staff) cleared!');
      setShowClearConfirm(false);
      onRefreshData();
    } catch (err: any) {
      error(err.message || 'Failed to clear database');
    } finally {
      setClearing(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Are you sure you want to load default demonstration records? This will populate the database with sample data.')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetSeedData();
      success('Database populated with demonstration sample records!');
      onRefreshData();
    } catch (err: any) {
      error(err.message || 'Failed to reset seed data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>System Configuration & Preferences</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company details, POS thermal receipt defaults, billing rules, and role permissions
          </p>
        </div>

        <button
          onClick={onRefreshData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reload Ledger</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Company Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'billing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Billing & Policy Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('thermal')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'thermal'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Thermal Printer Receipts</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'rbac'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Roles & Access Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`pb-2.5 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'database'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Data & Reset Management</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: General Company Profile */}
        {activeTab === 'general' && (
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Company Details & Letterhead</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline / Motto</label>
                <input
                  type="text"
                  value={companyTagline}
                  onChange={e => setCompanyTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Helpline / Support Phone</label>
                <input
                  type="text"
                  value={supportNumber}
                  onChange={e => setSupportNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Office / Headquarter Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tax NTN / Registration #</label>
                <input
                  type="text"
                  value={ntnNumber}
                  onChange={e => setNtnNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Code / Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Billing & Policies */}
        {activeTab === 'billing' && (
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Billing Automation Rules</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grace Period Days (Post Expiry)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={gracePeriodDays}
                  onChange={e => setGracePeriodDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Number of buffer days before subscription status flags as overdue.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Sales Tax / GST (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={defaultTaxRate}
                  onChange={e => setDefaultTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <div className="flex items-center gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    id="autoDisconnect"
                    checked={autoDisconnectUnpaid}
                    onChange={e => setAutoDisconnectUnpaid(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <label htmlFor="autoDisconnect" className="text-xs font-bold text-slate-900 cursor-pointer">
                      Automatic Service Suspension for Overdue Accounts
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Automatically update customer status to 'Suspended' if invoice remains unpaid past grace period.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Thermal Receipt Defaults */}
        {activeTab === 'thermal' && (
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">POS Thermal Printer Templates</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Paper Roll Format</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setThermalPaperWidth('58mm')}
                    className={`p-3 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer ${
                      thermalPaperWidth === '58mm'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>58mm POS Mini Roll</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Portable Bluetooth & Handheld POS</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThermalPaperWidth('80mm')}
                    className={`p-3 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer ${
                      thermalPaperWidth === '80mm'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>80mm Standard POS Slip</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Countertop USB/LAN Thermal Printers</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Footer Note / Terms</label>
                <textarea
                  rows={3}
                  value={receiptFooterNote}
                  onChange={e => setReceiptFooterNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: RBAC */}
        {activeTab === 'rbac' && (
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-slate-500">
              The application enforces granular permissions based on the active role. Switch your preview role in the top header bar to inspect the experience for each tier.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-blue-700 text-sm">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Admin / Owner</span>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <div>✓ Full administrative control across all records</div>
                  <div>✓ Customer onboarding, renewals, editing, deletions</div>
                  <div>✓ Invoices, cash collection, custom billing</div>
                  <div>✓ Expenses ledger, category configuration</div>
                  <div>✓ Staff salaries disbursement & payroll</div>
                  <div>✓ Complete P&L statements, monthly/daily reports</div>
                  <div>✓ System settings & role management</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-indigo-700 text-sm">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Billing Manager</span>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <div>✓ Customer directory & package renewals</div>
                  <div>✓ Create invoices & collect payments</div>
                  <div>✓ Print 58mm/80mm thermal receipts</div>
                  <div>✓ View operational expenses & daily cash flow</div>
                  <div className="text-slate-400">✗ Cannot alter master system settings</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Cashier / Counter Staff</span>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <div>✓ Search customers & check outstanding dues</div>
                  <div>✓ Collect cash payments & generate thermal receipts</div>
                  <div>✓ View own daily collections register</div>
                  <div className="text-slate-400">✗ Restricted from viewing full company P&L</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-amber-700 text-sm">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Line Technician</span>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <div>✓ View subscriber installation addresses & contact info</div>
                  <div>✓ Inspect active packages & fiber parameters</div>
                  <div className="text-slate-400">✗ Restricted from viewing company financial ledgers</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Database & Reset Management */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span>Testing & Operational Data Controls</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage system database state for testing, clearing records, or re-initializing demonstration sample records.
                  </p>
                </div>
              </div>

              {/* Status Alert */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Local JSON Database Engine Active</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  The ISP management system uses an ACID-safe transactional local JSON database file stored at{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">
                    /data/isp_database.json
                  </code>
                  . All changes to customers, packages, invoices, payments, and staff are persisted immediately.
                </p>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Clear All Data Card */}
                <div className="p-5 rounded-xl bg-rose-50/50 border border-rose-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Wipe All Operational Data (Blank Slate)</span>
                    </div>
                    <p className="text-xs text-rose-700/80 leading-relaxed">
                      Removes all customers, broadband packages, invoices, payment transactions, expenses, staff members, and salary records. 
                      User authentication credentials (admin/manager/accountant/operator) and system settings are safely preserved.
                    </p>
                    <div className="text-[11px] text-rose-600 font-medium">
                      Ideal for clean manual testing and custom ISP onboarding.
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      disabled={clearing}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{clearing ? 'Clearing Records...' : 'Clear All Test Data Now'}</span>
                    </button>
                  </div>
                </div>

                {/* Reset to Demo Data Card */}
                <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                      <RotateCcw className="w-4 h-4 text-blue-600" />
                      <span>Load Demonstration Sample Data</span>
                    </div>
                    <p className="text-xs text-blue-700/80 leading-relaxed">
                      Populates the database with realistic sample ISP subscribers, fiber packages (10Mbps to 100Mbps), sample invoices, payment receipts, and operational expenses.
                    </p>
                    <div className="text-[11px] text-blue-600 font-medium">
                      Useful for exploring pre-filled charts and reporting analytics.
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleResetDemoData}
                      disabled={resetting}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{resetting ? 'Populating Demo Data...' : 'Reset to Demo Records'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-3 bg-rose-100 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Clear All Test Data?</h3>
                  <p className="text-xs text-slate-500">This action will wipe all operational records</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <div>The following will be permanently erased:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-rose-700">
                  <li>All Customers & Subscribers</li>
                  <li>All Internet Packages & Plans</li>
                  <li>All Invoices & Billing Records</li>
                  <li>All Payment Transactions & Receipts</li>
                  <li>All Expense Entries & Categories</li>
                  <li>All Staff Profiles & Salary Slips</li>
                  <li>Audit Logs History</li>
                </ul>
              </div>

              <p className="text-xs text-slate-600">
                Are you sure you want to proceed with a blank slate? You will be able to add your own customers, packages, and payments manually.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAllData}
                  disabled={clearing}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{clearing ? 'Wiping All Records...' : 'Yes, Wipe All Data'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button (for non-database tabs) */}
        {activeTab !== 'database' && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Configuration...' : 'Save Configuration'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
