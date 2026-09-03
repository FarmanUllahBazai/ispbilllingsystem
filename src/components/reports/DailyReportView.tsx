import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { generateDailyReportPDF } from '../../utils/pdfGenerator';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Calendar, DollarSign, TrendingDown, PiggyBank, Users, Receipt, CreditCard, FileDown, Printer, RefreshCw } from 'lucide-react';

export const DailyReportView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [report, setReport] = useState<any>(null);

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const data = await api.getDailyReport(date);
      setReport(data);
    } catch (err) {
      console.error('Error loading daily report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyReport();
  }, [date]);

  const handleDownloadPDF = async () => {
    if (!report) return;
    setDownloadingPdf(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      generateDailyReportPDF(report, user?.name || 'Super Admin');
      success(`Daily report for ${formatDate(date)} downloaded successfully!`);
    } catch (err: any) {
      console.error(err);
      error('Failed to generate daily PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Picker Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Daily Cash Flow & Settlement Report</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time daily collections, cash register summary, and disbursements for {formatDate(date)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <label className="text-xs font-semibold text-slate-600">Date:</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
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
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Today's Revenue</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(report.totalRevenue)}</div>
              <div className="text-xs text-slate-500 mt-0.5">{report.payments?.length || 0} Receipts Collected</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Today's Expenses</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(report.totalExpenses)}</div>
              <div className="text-xs text-slate-500 mt-0.5">{report.expenses?.length || 0} Expenses Logged</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Net Daily Cash Flow</div>
              <div className={`text-xl font-bold mt-1 ${report.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(report.netCashFlow)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Revenue − Expenses</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">New Customers Today</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{report.newCustomersCount} Subscribers</div>
              <div className="text-xs text-slate-500 mt-0.5">New connections activated</div>
            </div>
          </div>

          {/* Today's Payments & Expenses Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Collections */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <h4 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Collections Recorded on {formatDate(date)}</span>
                </h4>
                <span className="font-bold text-slate-900 text-xs">{formatCurrency(report.totalRevenue)}</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {report.payments?.length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center">No payment receipts recorded for this date.</div>
                ) : (
                  report.payments.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{p.customerName}</div>
                        <div className="text-[10px] text-blue-600 font-mono">
                          {p.receiptNumber} • {p.paymentMethod?.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">{formatCurrency(p.amount)}</div>
                        <div className="text-[10px] text-slate-500">{formatDateTime(p.paymentDate)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Daily Expenses */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <h4 className="text-sm font-bold text-rose-700 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  <span>Expenses Paid on {formatDate(date)}</span>
                </h4>
                <span className="font-bold text-slate-900 text-xs">{formatCurrency(report.totalExpenses)}</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {report.expenses?.length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center">No expenses recorded for this date.</div>
                ) : (
                  report.expenses.map((e: any) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{e.title}</div>
                        <div className="text-[10px] text-slate-500">
                          {e.categoryName} {e.payee ? `• ${e.payee}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-rose-600">{formatCurrency(e.amount)}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{e.paymentMethod?.replace('_', ' ')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
