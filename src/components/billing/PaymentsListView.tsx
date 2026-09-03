import React, { useState, useMemo } from 'react';
import { Payment, Customer } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import {
  CreditCard,
  Search,
  Printer,
  Calendar,
  DollarSign,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';

interface PaymentsListViewProps {
  payments?: Payment[];
  customers?: Customer[];
  loading: boolean;
  onOpenRecordPayment: () => void;
  onPrintReceipt: (receiptId: string) => void;
}

export const PaymentsListView: React.FC<PaymentsListViewProps> = ({
  payments = [],
  customers = [],
  loading,
  onOpenRecordPayment,
  onPrintReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredPayments = useMemo(() => {
    return (payments || []).filter(p => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        p.receiptNumber.toLowerCase().includes(search) ||
        p.customerName.toLowerCase().includes(search) ||
        (p.subscriberId && p.subscriberId.toLowerCase().includes(search)) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(search));

      const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [payments, searchTerm, methodFilter]);

  const totalCollected = useMemo(
    () => filteredPayments.reduce((acc, p) => acc + p.amount, 0),
    [filteredPayments]
  );

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Payment Receipts & Cash Register</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              {filteredPayments.length} Receipts
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Collected Receipts in View:{' '}
            <span className="font-bold text-emerald-700">{formatCurrency(totalCollected)}</span>
          </p>
        </div>

        <button
          onClick={onOpenRecordPayment}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>+ Collect Payment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search receipt #, subscriber ID, customer, transaction ref..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
          />
        </div>

        <div>
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash Counter</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="online_transfer">Online Mobile App</option>
            <option value="easypaisa_jazzcash">Easypaisa / JazzCash</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Payments Table (Desktop) & Cards (Mobile) */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 bg-white">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading payments register...</span>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No payment records found.
            </div>
          ) : (
            filteredPayments.map(p => (
              <div key={p.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                {/* Top Bar: Receipt #, Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-blue-700">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{p.receiptNumber}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">{p.customerName}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.subscriberId}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-emerald-700">{formatCurrency(p.amount)}</div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 uppercase font-semibold text-[9px] block mt-1">
                      {p.paymentMethod?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Date & Time</span>
                    <span className="text-slate-700 mt-0.5 block">{formatDateTime(p.paymentDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Cashier / Staff</span>
                    <span className="text-slate-700 mt-0.5 block truncate">{p.receivedByName || 'Cashier'}</span>
                  </div>
                  {p.referenceNumber && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Ref / Trans ID</span>
                      <span className="font-mono text-blue-700 mt-0.5 block truncate">{p.referenceNumber}</span>
                    </div>
                  )}
                </div>

                {/* Print Button */}
                <button
                  onClick={() => onPrintReceipt(p.id)}
                  className="w-full py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-medium border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Print Thermal Receipt</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Receipt #</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Subscriber</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Ref # / Remarks</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Collected By</th>
                <th className="p-3.5 pr-4 text-right">Thermal Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading payments register...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{p.receiptNumber}</span>
                    </td>

                    <td className="p-3.5 text-slate-700">{formatDateTime(p.paymentDate)}</td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{p.customerName}</div>
                      <div className="text-[11px] text-blue-700 font-semibold font-mono mt-0.5">{p.subscriberId}</div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 uppercase font-semibold text-[10px]">
                        {p.paymentMethod?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-700">
                      {p.referenceNumber ? (
                        <span className="font-mono text-blue-700 font-medium">{p.referenceNumber}</span>
                      ) : (
                        <span className="text-slate-500 italic">{p.remarks || '-'}</span>
                      )}
                    </td>

                    <td className="p-3.5 font-bold text-emerald-700 text-sm">
                      {formatCurrency(p.amount)}
                    </td>

                    <td className="p-3.5 text-slate-600">{p.receivedByName || 'Cashier'}</td>

                    <td className="p-3.5 pr-4 text-right">
                      <button
                        onClick={() => onPrintReceipt(p.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-medium border border-slate-200 ml-auto transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
