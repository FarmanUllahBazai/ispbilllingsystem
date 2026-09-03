import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { generateMonthlyReportPDF, formatMonthName } from '../../utils/pdfGenerator';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Package,
  Layers,
  FileDown,
  Printer,
  RefreshCw,
  CreditCard,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Percent,
} from 'lucide-react';

export const MonthlyReportView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'packages' | 'expenses' | 'transactions'>('overview');

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const data = await api.getMonthlyReport(month);
      setReport(data);
    } catch (err: any) {
      console.error('Error loading monthly report:', err);
      error(err.message || 'Failed to fetch monthly report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [month]);

  const handleDownloadPDF = async () => {
    if (!report) return;
    setDownloadingPdf(true);
    try {
      // Small timeout to allow UI rendering to show feedback
      await new Promise(resolve => setTimeout(resolve, 200));
      generateMonthlyReportPDF(report, user?.name || 'Super Admin');
      success(`Monthly report for ${formatMonthName(month)} downloaded successfully!`);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      error('Failed to generate PDF report: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const monthFormatted = formatMonthName(month);

  return (
    <div className="space-y-6">
      {/* Month selector & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Monthly Financial & Operational Audit Report</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {monthFormatted}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregated monthly collections, recurring subscriptions, OPEX overheads, and PDF export
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Month:</label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="bg-transparent border-0 text-slate-800 text-xs font-medium focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            id="refresh-monthly-report-btn"
            onClick={fetchMonthlyReport}
            disabled={loading}
            className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="print-monthly-report-btn"
            onClick={handlePrint}
            disabled={loading || !report}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          {/* Primary Download PDF Button */}
          <button
            id="download-monthly-report-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={loading || !report || downloadingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {downloadingPdf ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-white" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading || !report ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-xl bg-white border border-slate-200">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500 mt-4">Compiling {monthFormatted} financial records...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Printable Formal Header (visible in print mode) */}
          <div className="hidden print:block mb-6 p-4 border-b border-slate-300">
            <h1 className="text-xl font-bold text-slate-900">ApexFiber Broadband - Monthly Financial Audit Report</h1>
            <p className="text-sm text-slate-600">Reporting Period: {monthFormatted} ({month}) | Generated: {new Date().toLocaleString()}</p>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Total Monthly Revenue</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                {formatCurrency(report.totalRevenue)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between pt-2 border-t border-slate-100">
                <span>Subscriptions: {formatCurrency(report.subscriptionRevenue || 0)}</span>
                <span className="text-slate-400">Installs: {formatCurrency(report.installationRevenue || 0)}</span>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Total Monthly Expenses</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <TrendingDown className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                {formatCurrency(report.totalExpenses)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between pt-2 border-t border-slate-100">
                <span>Salaries: {formatCurrency(report.salaryExpenses || 0)}</span>
                <span className="text-slate-400">Ops: {formatCurrency(report.operationalExpenses || 0)}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Net Operating Profit
                </span>
                <span className={`p-1.5 rounded-lg ${report.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {report.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </span>
              </div>
              <div className={`text-2xl font-bold mt-2 tracking-tight ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(report.netProfit)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between pt-2 border-t border-slate-100">
                <span>Operating Margin:</span>
                <span className={`font-bold ${report.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {report.profitMargin !== undefined ? `${report.profitMargin}%` : (report.totalRevenue > 0 ? `${((report.netProfit / report.totalRevenue) * 100).toFixed(1)}%` : '0%')}
                </span>
              </div>
            </div>

            {/* Operational Metrics */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Subscribers & Dues</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                {report.activeCustomersCount ?? 0} <span className="text-sm font-normal text-slate-500">Active</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-emerald-600">+{report.newCustomersCount ?? 0} Installs</span>
                <span className="text-amber-600">Pending: {formatCurrency(report.totalPending ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* Quick PDF Export Banner / Callout */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Download Complete Official Audit Report (PDF)</h4>
                <p className="text-xs text-slate-600">
                  Includes full ISP header, revenue distributions, package breakdown, OPEX schedules, and verification signature blocks.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>{downloadingPdf ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>

          {/* Sub-Tabs Navigation */}
          <div className="flex border-b border-slate-200 text-xs font-semibold gap-2">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Packages & Expenses Breakdown</span>
            </button>

            <button
              onClick={() => setActiveSubTab('packages')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'packages'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment Channels</span>
            </button>

            <button
              onClick={() => setActiveSubTab('transactions')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'transactions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Monthly Transaction Ledger ({report.paymentsList?.length || 0})</span>
            </button>
          </div>

          {/* Tab 1: Overview Breakdown Tables */}
          {activeSubTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Package Revenue Table */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Broadband Revenue by Package Tier</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {report.packageBreakdown?.length || 0} Packages
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Package Tier</th>
                        <th className="p-3">Speed</th>
                        <th className="p-3 text-center">Subscribers</th>
                        <th className="p-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {report.packageBreakdown && report.packageBreakdown.length > 0 ? (
                        report.packageBreakdown.map((pkg: any) => {
                          const percent = report.totalRevenue > 0 ? (pkg.revenue / report.totalRevenue) * 100 : 0;
                          return (
                            <tr key={pkg.packageId} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-semibold text-slate-900">
                                <div>{pkg.packageName}</div>
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, percent)}%` }}></div>
                                </div>
                              </td>
                              <td className="p-3 text-blue-600 font-mono font-semibold">{pkg.speed}</td>
                              <td className="p-3 text-center text-slate-600">{pkg.subscribersCount} Users</td>
                              <td className="p-3 text-right">
                                <span className="font-bold text-emerald-600">{formatCurrency(pkg.revenue)}</span>
                                <span className="block text-[10px] text-slate-400">{percent.toFixed(1)}% share</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">No package data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expense Categories Table */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-600" />
                    <span>Operating Expenses by Category</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    Total: {formatCurrency(report.totalExpenses)}
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Category Name</th>
                        <th className="p-3 text-center">Records</th>
                        <th className="p-3 text-right">Total Disbursed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {report.expenseCategoryBreakdown && report.expenseCategoryBreakdown.length > 0 ? (
                        report.expenseCategoryBreakdown.map((cat: any) => {
                          const expPercent = report.totalExpenses > 0 ? (cat.amount / report.totalExpenses) * 100 : 0;
                          return (
                            <tr key={cat.categoryId} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-semibold text-slate-900">
                                <div>{cat.categoryName}</div>
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, expPercent)}%` }}></div>
                                </div>
                              </td>
                              <td className="p-3 text-center text-slate-600">{cat.count} Entries</td>
                              <td className="p-3 text-right">
                                <span className="font-bold text-rose-600">{formatCurrency(cat.amount)}</span>
                                <span className="block text-[10px] text-slate-400">{expPercent.toFixed(1)}% of OPEX</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400">No expenses recorded for this month</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Payment Channels Breakdown */}
          {activeSubTab === 'packages' && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-3.5 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Collections Inward Channels Distribution</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(report.paymentMethodsBreakdown || []).map((pm: any) => {
                  const share = report.totalRevenue > 0 ? ((pm.amount / report.totalRevenue) * 100).toFixed(1) : 0;
                  return (
                    <div key={pm.method} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {pm.method.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-xl font-bold text-slate-900 mt-1.5">{formatCurrency(pm.amount)}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                        <span>{pm.count} Receipts</span>
                        <span className="text-blue-600 font-semibold">{share}% share</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Monthly Transactions Stream */}
          {activeSubTab === 'transactions' && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Collections & Disbursement Ledger for {monthFormatted}</span>
                </h4>
                <span className="text-xs text-slate-500">
                  {report.paymentsList?.length || 0} Payments • {report.expensesList?.length || 0} Expenses
                </span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {report.paymentsList && report.paymentsList.length > 0 ? (
                  report.paymentsList.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{p.customerName}</div>
                          <div className="text-[11px] text-slate-500">
                            Receipt: {p.receiptNumber || p.id} • {p.paymentMethod?.replace('_', ' ').toUpperCase()} • {formatDate(p.paymentDate)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-600">+{formatCurrency(p.amount)}</div>
                        <div className="text-[10px] text-slate-400">Collected</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">No payment records logged this month.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
