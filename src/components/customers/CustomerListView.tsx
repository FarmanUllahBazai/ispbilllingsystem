import React, { useState, useMemo } from 'react';
import { Customer, InternetPackage } from '../../types';
import { formatCurrency, formatDate, getAccountStatusBadge, getPaymentStatusBadge } from '../../utils/formatters';
import {
  Search,
  Filter,
  UserPlus,
  Wifi,
  Eye,
  RefreshCw,
  CreditCard,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface CustomerListViewProps {
  customers?: Customer[];
  packages?: InternetPackage[];
  loading: boolean;
  filterStatus?: string;
  initialFilterStatus?: string;
  filterPaymentStatus?: string;
  onOpenNewCustomer: () => void;
  onViewCustomerProfile?: (customer: Customer) => void;
  onViewProfile?: (customer: Customer) => void;
  onRenewCustomer: (customer: Customer) => void;
  onRecordPayment: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer | string) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  customers = [],
  packages = [],
  loading,
  filterStatus,
  initialFilterStatus,
  filterPaymentStatus = 'all',
  onOpenNewCustomer,
  onViewCustomerProfile,
  onViewProfile,
  onRenewCustomer,
  onRecordPayment,
  onEditCustomer,
  onDeleteCustomer,
}) => {
  const handleViewProfile = (c: Customer) => {
    if (onViewProfile) onViewProfile(c);
    else if (onViewCustomerProfile) onViewCustomerProfile(c);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilterStatus || filterStatus || 'all');
  const [paymentFilter, setPaymentFilter] = useState(filterPaymentStatus);
  const [packageFilter, setPackageFilter] = useState('all');

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return (customers || []).filter(c => {
      // Search
      const search = (searchTerm || '').toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (c.name || '').toLowerCase().includes(search) ||
        (c.subscriberId || '').toLowerCase().includes(search) ||
        (c.contactNumber && c.contactNumber.toLowerCase().includes(search)) ||
        (c.fatherOrCompanyName && c.fatherOrCompanyName.toLowerCase().includes(search)) ||
        (c.address && c.address.toLowerCase().includes(search)) ||
        (c.cityArea && c.cityArea.toLowerCase().includes(search)) ||
        (c.cnic && c.cnic.toLowerCase().includes(search));

      // Status
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      // Payment Status
      const matchesPayment = paymentFilter === 'all' || c.paymentStatus === paymentFilter;

      // Package
      const matchesPackage = packageFilter === 'all' || c.packageId === packageFilter;

      return matchesSearch && matchesStatus && matchesPayment && matchesPackage;
    });
  }, [customers, searchTerm, statusFilter, paymentFilter, packageFilter]);

  // Totals for top bar
  const totalDues = useMemo(() => {
    return filteredCustomers.reduce((acc, c) => acc + (c.balance || 0), 0);
  }, [filteredCustomers]);

  return (
    <div className="space-y-4">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Customer Directory & Subscriber Management</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">
              {filteredCustomers.length} Subscribers
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Outstanding Receivables for selected list:{' '}
            <span className="font-bold text-amber-700">{formatCurrency(totalDues)}</span>
          </p>
        </div>

        <button
          onClick={onOpenNewCustomer}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Register New Customer</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID, mobile, CNIC..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 text-slate-900 placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Account Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
          >
            <option value="all">All Connection Statuses</option>
            <option value="active">Active Online</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid in Full</option>
            <option value="partial">Partially Paid</option>
            <option value="pending">Pending Payment</option>
            <option value="overdue">Overdue Bills</option>
          </select>
        </div>

        {/* Package Filter */}
        <div>
          <select
            value={packageFilter}
            onChange={e => setPackageFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
          >
            <option value="all">All Package Plans</option>
            {packages.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.speed})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Table (Desktop) and Responsive Cards (Mobile) */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 bg-white">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading customers ledger...</span>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No customers found matching your filters.
            </div>
          ) : (
            filteredCustomers.map(c => {
              const accountBadge = getAccountStatusBadge(c.status);
              const paymentBadge = getPaymentStatusBadge(c.paymentStatus);
              const expDate = new Date(c.expiryDate);
              const now = new Date();
              const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = diffDays < 0;
              const isExpiringSoon = diffDays >= 0 && diffDays <= 3;

              return (
                <div key={c.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                  {/* Card Top: Avatar, Name, ID, Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 shrink-0 text-xs">
                        {(c.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => handleViewProfile(c)}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left text-xs sm:text-sm truncate block cursor-pointer"
                        >
                          {c.name}
                        </button>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-blue-700 font-semibold">{c.subscriberId}</span>
                          {c.fatherOrCompanyName && <span className="truncate">• {c.fatherOrCompanyName}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded border ${accountBadge.bg} ${accountBadge.text}`}>
                        {accountBadge.label}
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${paymentBadge.bg} ${paymentBadge.text}`}>
                        {paymentBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Meta Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Package</span>
                      <span className="font-semibold text-slate-800 truncate block mt-0.5">{c.packageName} ({c.speed})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Balance</span>
                      <span className={`font-bold mt-0.5 block ${c.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatCurrency(c.balance)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Expiry</span>
                      <span className={`font-semibold mt-0.5 block ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-700' : 'text-slate-700'}`}>
                        {formatDate(c.expiryDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Contact</span>
                      <a href={`tel:${c.contactNumber}`} className="font-medium text-blue-600 hover:underline mt-0.5 block truncate">
                        {c.contactNumber}
                      </a>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => handleViewProfile(c)}
                      className="flex-1 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ledger</span>
                    </button>
                    <button
                      onClick={() => onRenewCustomer(c)}
                      className="flex-1 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Renew</span>
                    </button>
                    <button
                      onClick={() => onRecordPayment(c)}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay</span>
                    </button>
                    <button
                      onClick={() => onEditCustomer(c)}
                      aria-label="Edit customer"
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCustomer(c)}
                      aria-label="Delete customer"
                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Subscriber</th>
                <th className="p-3.5">Contact & Location</th>
                <th className="p-3.5">Package & Speed</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5">Balance / Dues</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Billing</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading customers ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No customers found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const accountBadge = getAccountStatusBadge(c.status);
                  const paymentBadge = getPaymentStatusBadge(c.paymentStatus);

                  // Check if expiring within 3 days or expired
                  const expDate = new Date(c.expiryDate);
                  const now = new Date();
                  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isExpired = diffDays < 0;
                  const isExpiringSoon = diffDays >= 0 && diffDays <= 3;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Subscriber */}
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 shrink-0">
                            {(c.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <button
                              onClick={() => handleViewProfile(c)}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left cursor-pointer"
                            >
                              {c.name}
                            </button>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-blue-700 font-semibold">{c.subscriberId}</span>
                              {c.fatherOrCompanyName && (
                                <span>• {c.fatherOrCompanyName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td className="p-3.5">
                        <div className="text-slate-900 font-medium">{c.contactNumber}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px] mt-0.5" title={c.address}>
                          {c.cityArea || c.address}
                        </div>
                      </td>

                      {/* Package */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-blue-600" />
                          <span>{c.packageName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {c.speed} • {formatCurrency(c.monthlyPrice)}/mo
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="p-3.5">
                        <div className={`font-semibold ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-700' : 'text-slate-700'}`}>
                          {formatDate(c.expiryDate)}
                        </div>
                        {isExpired && (
                          <div className="text-[10px] text-rose-600 font-medium flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>Expired ({Math.abs(diffDays)}d ago)</span>
                          </div>
                        )}
                        {isExpiringSoon && (
                          <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Expires in {diffDays}d</span>
                          </div>
                        )}
                      </td>

                      {/* Balance / Dues */}
                      <td className="p-3.5">
                        <div
                          className={`font-bold ${
                            c.balance > 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {formatCurrency(c.balance)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Paid: {formatCurrency(c.totalPaid)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${accountBadge.bg} ${accountBadge.text}`}
                        >
                          {accountBadge.label}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${paymentBadge.bg} ${paymentBadge.text}`}
                        >
                          {paymentBadge.label}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewProfile(c)}
                            title="View Full Customer Profile & Ledger"
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onRenewCustomer(c)}
                            title="Renew Package / Extend Subscription"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onRecordPayment(c)}
                            title="Record Payment & Issue Thermal Receipt"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onEditCustomer(c)}
                            title="Edit Details"
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteCustomer(c)}
                            title="Deactivate / Delete Customer"
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
