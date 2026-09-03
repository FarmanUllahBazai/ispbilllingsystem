import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateProfitLossReportPDF } from '../../utils/pdfGenerator';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle2,
  FileSpreadsheet,
  FileDown,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ProfitLossReportView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [report, setReport] = useState<any>(null);

  const fetchPLReport = async () => {
    setLoading(true);
    try {
      const data = await api.getProfitLossReport(startDate, endDate);
      setReport(data);
    } catch (err) {
      console.error('Failed to load P&L statement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPLReport();
  }, [startDate, endDate]);

  const handleDownloadPDF = async () => {
    if (!report) return;
    setDownloadingPdf(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      generateProfitLossReportPDF(report, user?.name || 'Super Admin');
      success(`P&L statement for ${formatDate(startDate)} to ${formatDate(endDate)} downloaded successfully!`);
    } catch (err: any) {
      console.error(err);
      error('Failed to generate P&L PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const chartData = report
    ? [
        { name: 'Revenue', amount: report.totalRevenue, fill: '#2563eb' },
        { name: 'Expenses', amount: report.totalExpenses, fill: '#f43f5e' },
        { name: 'Net Profit', amount: Math.max(0, report.netProfit), fill: '#10b981' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Date Range Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Comprehensive Profit & Loss Statement (P&L)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Full accounting breakdown of Operating Revenue, Cost of Goods/Services, Overhead, and Net Margin
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent border-0 text-slate-800 text-xs font-medium focus:outline-hidden cursor-pointer"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent border-0 text-slate-800 text-xs font-medium focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={() => window.print()}
            disabled={loading || !report}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={loading || !report || downloadingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloadingPdf ? 'Exporting...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {loading || !report ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Gross Revenue</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(report.totalRevenue)}</div>
              <div className="text-xs text-slate-500 mt-0.5">{formatDate(startDate)} - {formatDate(endDate)}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Operating Expenses</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(report.totalExpenses)}</div>
              <div className="text-xs text-slate-500 mt-0.5">All operating costs & payroll</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Net Profit</div>
              <div
                className={`text-2xl font-bold mt-1 ${
                  report.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(report.netProfit)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Revenue − Total Expenses</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Net Profit Margin</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{report.profitMarginPercentage?.toFixed(1)}%</div>
              <div className="text-xs text-slate-500 mt-0.5">Profit margin ratio</div>
            </div>
          </div>

          {/* Statement Layout + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* P&L Statement */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  Income Statement
                </h4>
                <div className="text-xs text-slate-500">
                  Period: {formatDate(startDate)} to {formatDate(endDate)}
                </div>
              </div>

              {/* 1. Operating Revenue */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-blue-700 uppercase tracking-wider">
                  <span>1. Operating Revenue</span>
                  <span>Amount (Rs.)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span>Recurring Broadband Monthly Subscriptions</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(report.revenueBreakdown?.monthlySubscriptions || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>New Connection Setup & Fiber Installation Fees</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(report.revenueBreakdown?.installationCharges || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Optical Router, ONU & Hardware Sales</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(report.revenueBreakdown?.routerCharges || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Fiber Drop Wire & Cable Charges</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(report.revenueBreakdown?.wireCharges || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Other Service & Maintenance Surcharges</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(report.revenueBreakdown?.other || 0)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-blue-700">
                    <span>TOTAL OPERATING REVENUE</span>
                    <span>{formatCurrency(report.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* 2. Operating Expenses */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-rose-700 uppercase tracking-wider">
                  <span>2. Operating & Administrative Expenses</span>
                  <span>Amount (Rs.)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                  {report.expenseBreakdown?.length === 0 ? (
                    <div className="text-slate-500">No categorized expenses in this period.</div>
                  ) : (
                    report.expenseBreakdown?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>{item.categoryName}</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-rose-600">
                    <span>TOTAL OPERATING EXPENSES</span>
                    <span>{formatCurrency(report.totalExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Net Bottom Line */}
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    NET PROFIT BEFORE TAX
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Net Profit Margin: {report.profitMarginPercentage?.toFixed(1)}%
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(report.netProfit)}
                </div>
              </div>
            </div>

            {/* Visual Chart */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Financial Distribution</h4>
                <p className="text-xs text-slate-500 mb-4">Revenue vs. Cost vs. Net Bottom Line</p>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        tickFormatter={val => `Rs. ${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                          color: '#0f172a',
                        }}
                        formatter={(val: any) => [formatCurrency(val), 'Amount']}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2 mt-4">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>Revenue</span>
                  </span>
                  <span className="font-bold text-slate-900">{formatCurrency(report.totalRevenue)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>Expenses</span>
                  </span>
                  <span className="font-bold text-slate-900">{formatCurrency(report.totalExpenses)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Net Profit</span>
                  </span>
                  <span className="font-bold text-emerald-600">{formatCurrency(report.netProfit)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
