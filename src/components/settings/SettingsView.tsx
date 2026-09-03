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
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'thermal' | 'rbac'>('general');

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

        {/* Save Button */}
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
      </form>
    </div>
  );
};
