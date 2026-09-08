import React, { useState, useMemo } from 'react';
import { Invoice, Customer } from '../../types';
import { formatCurrency, formatDate, getPaymentStatusBadge } from '../../utils/formatters';
import {
  Receipt,
  Search,
  Filter,
  CreditCard,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
} from 'lucide-react';

interface InvoicesListViewProps {
  invoices?: Invoice[];
  customers?: Customer[];
  loading: boolean;
  filterStatus?: string;
  onOpenCreateInvoice: () => void;
  onRecordPayment: (customer: Customer, invoiceId: string) => void;
  onPrintInvoice?: (invoiceId: string) => void;
}

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  invoices = [],
  customers = [],
  loading,
  filterStatus = 'all',
  onOpenCreateInvoice,
  onRecordPayment,
  onPrintInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(filterStatus);
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredInvoices = useMemo(() => {
    return (invoices || []).filter(inv => {
      const search = (searchTerm || '').toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (inv.invoiceNumber || '').toLowerCase().includes(search) ||
        (inv.customerName || '').toLowerCase().includes(search) ||
        (inv.subscriberId && inv.subscriberId.toLowerCase().includes(search));

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesType = typeFilter === 'all' || inv.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [invoices, searchTerm, statusFilter, typeFilter]);

  // Summaries
  const totalBilled = useMemo(() => filteredInvoices.reduce((a, b) => a + b.totalAmount, 0), [filteredInvoices]);
  const totalPaid = useMemo(() => filteredInvoices.reduce((a, b) => a + b.paidAmount, 0), [filteredInvoices]);
  const totalDue = useMemo(() => filteredInvoices.reduce((a, b) => a + b.remainingAmount, 0), [filteredInvoices]);

  return (
    <div className="space-y-4">
      {/* Header & Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Invoices & Billing Ledger</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">
              {filteredInvoices.length} Invoices
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Invoiced: <b className="text-slate-900">{formatCurrency(totalBilled)}</b> • Collected:{' '}
            <b className="text-emerald-700">{formatCurrency(totalPaid)}</b> • Outstanding Dues:{' '}
            <b className="text-rose-600">{formatCurrency(totalDue)}</b>
          </p>
        </div>

        <button
          onClick={onOpenCreateInvoice}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Create Custom Bill</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, customer name, subscriber ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid in Full</option>
            <option value="partial">Partially Paid</option>
            <option value="pending">Pending Payment</option>
            <option value="overdue">Overdue Bills</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
          >
            <option value="all">All Invoice Types</option>
            <option value="monthly_bill">Monthly Broadband Bill</option>
            <option value="new_connection">New Connection Setup</option>
            <option value="renewal">Package Renewal</option>
            <option value="hardware">Hardware / Router</option>
            <option value="service_fee">Service / Repair Fee</option>
          </select>
        </div>
      </div>

      {/* Invoices Table (Desktop) & Cards (Mobile) */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 bg-white">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading invoices...</span>
              </div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No invoices matching the current filter.
            </div>
          ) : (
            filteredInvoices.map(inv => {
              const badge = getPaymentStatusBadge(inv.status);
              const isOverdue = inv.status === 'overdue' || (inv.remainingAmount > 0 && new Date(inv.dueDate) < new Date());
              const cust = customers?.find(c => c.id === inv.customerId) || {
                id: inv.customerId,
                subscriberId: inv.subscriberId || 'SUB-000',
                name: inv.customerName,
                contactNumber: inv.customerContact || '',
                address: inv.customerAddress || '',
                packageId: inv.packageId || '',
                packageName: inv.packageName || '',
                status: 'active',
                accountStatus: 'active',
                paymentStatus: 'pending',
                monthlyPrice: inv.totalAmount,
                totalPaid: inv.paidAmount,
                balance: inv.remainingAmount,
                registrationDate: inv.createdAt,
                expiryDate: inv.dueDate,
                connectionType: 'ftth',
                cityArea: '',
              } as unknown as Customer;

              return (
                <div key={inv.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                  {/* Top Bar: Invoice #, Customer Name, Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-700">
                        <Receipt className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{inv.invoiceNumber}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.subscriberId}</div>
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Total Billed</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{formatCurrency(inv.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Outstanding Due</span>
                      <span className={`font-bold mt-0.5 block ${inv.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatCurrency(inv.remainingAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Issued Date</span>
                      <span className="text-slate-700 mt-0.5 block">{formatDate(inv.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Due Date</span>
                      <span className={`mt-0.5 block font-medium ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                        {formatDate(inv.dueDate)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-0.5">
                    {onPrintInvoice && (
                      <button
                        onClick={() => onPrintInvoice(inv.id)}
                        className="flex-1 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Print Bill</span>
                      </button>
                    )}
                    {inv.remainingAmount > 0 && cust ? (
                      <button
                        onClick={() => onRecordPayment(cust, inv.id)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Collect Payment</span>
                      </button>
                    ) : (
                      <div className="flex-1 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paid in Full</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Invoice #</th>
                <th className="p-3.5">Customer / Subscriber</th>
                <th className="p-3.5">Type & Plan</th>
                <th className="p-3.5">Issued Date</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Paid</th>
                <th className="p-3.5">Due</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No invoices matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const badge = getPaymentStatusBadge(inv.status);
                  const isOverdue = inv.status === 'overdue' || (inv.remainingAmount > 0 && new Date(inv.dueDate) < new Date());
                  const cust = customers?.find(c => c.id === inv.customerId) || {
                    id: inv.customerId,
                    subscriberId: inv.subscriberId || 'SUB-000',
                    name: inv.customerName,
                    contactNumber: inv.customerContact || '',
                    address: inv.customerAddress || '',
                    packageId: inv.packageId || '',
                    packageName: inv.packageName || '',
                  };

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                        <Receipt className="w-3.5 h-3.5 text-blue-600" />
                        <span>{inv.invoiceNumber}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{inv.customerName}</div>
                        <div className="text-[11px] text-blue-700 font-semibold font-mono mt-0.5">{inv.subscriberId}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 capitalize">
                          {inv.type?.replace('_', ' ')}
                        </div>
                        {inv.packageName && (
                          <div className="text-[11px] text-slate-500">{inv.packageName}</div>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-700">{formatDate(inv.createdAt)}</td>

                      <td className="p-3.5">
                        <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
                          {formatDate(inv.dueDate)}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                      <td className="p-3.5 font-semibold text-emerald-700">{formatCurrency(inv.paidAmount)}</td>
                      <td className="p-3.5 font-bold text-rose-600">{formatCurrency(inv.remainingAmount)}</td>

                      <td className="p-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onPrintInvoice && (
                            <button
                              onClick={() => onPrintInvoice(inv.id)}
                              title="Print Thermal Bill (ESC/POS)"
                              className="p-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                          )}
                          {inv.remainingAmount > 0 && cust ? (
                            <button
                              onClick={() => onRecordPayment(cust, inv.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Collect</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-end gap-1 px-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Settled</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
