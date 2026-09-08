import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Customer } from '../../types';
import { api } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime, getAccountStatusBadge, getPaymentStatusBadge } from '../../utils/formatters';
import {
  User,
  Wifi,
  Receipt,
  CreditCard,
  History,
  Calendar,
  MapPin,
  Phone,
  Shield,
  Printer,
  RefreshCw,
  Clock,
  PlusCircle,
  FileCheck,
} from 'lucide-react';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string | null;
  customer?: Customer | null;
  onRenewCustomer?: (customer: Customer) => void;
  onRenewPackage?: (customer: Customer) => void;
  onRecordPayment: (customer: Customer, invoiceId?: string) => void;
  onPrintReceipt: (receiptId: string) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customer: propCustomer,
  onRenewCustomer,
  onRenewPackage,
  onRecordPayment,
  onPrintReceipt,
}) => {
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments' | 'renewals'>('overview');

  const activeId = customerId || propCustomer?.id;

  const fetchCustomerDetails = async () => {
    if (!activeId) return;
    setLoading(true);
    try {
      const data = await api.getCustomer(activeId);
      setCustomerData(data);
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeId) {
      fetchCustomerDetails();
    }
  }, [isOpen, activeId]);

  const handleRenew = (c: Customer) => {
    if (onRenewPackage) onRenewPackage(c);
    else if (onRenewCustomer) onRenewCustomer(c);
  };

  if (!customerData && loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading Subscriber..." maxWidth="3xl">
        <div className="flex items-center justify-center p-12 text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Modal>
    );
  }

  const { customer, invoices = [], payments = [], renewalHistory = [] } = customerData || {};
  if (!customer) return null;

  const accountBadge = getAccountStatusBadge(customer.status);
  const paymentBadge = getPaymentStatusBadge(customer.paymentStatus);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${customer.name} (${customer.subscriberId})`}
      subtitle="Complete Customer Profile, Billing Ledger & Subscription History"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Header KPI Profile Strip */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
              {(customer.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{customer.name}</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${accountBadge.bg} ${accountBadge.text}`}>
                  {accountBadge.label}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${paymentBadge.bg} ${paymentBadge.text}`}>
                  {paymentBadge.label}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {customer.contactNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-blue-600" />
                  {customer.packageName} ({customer.speed})
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
            <button
              onClick={() => handleRenew(customer)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew</span>
            </button>
            <button
              onClick={() => onRecordPayment(customer)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Collect</span>
            </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Invoiced</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{formatCurrency(customer.totalBilled)}</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Paid</div>
            <div className="text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(customer.totalPaid)}</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Current Balance / Dues</div>
            <div className={`text-sm font-bold mt-0.5 ${customer.balance > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {formatCurrency(customer.balance)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Package Expiry Date</div>
            <div className="text-sm font-bold text-amber-600 mt-0.5">{formatDate(customer.expiryDate)}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 text-xs font-semibold gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoices ({invoices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Receipts ({payments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('renewals')}
            className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'renewals'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Renewal Logs ({renewalHistory.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-2.5">
                <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                  Subscription & Package
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Package Tier:</span>
                  <span className="font-semibold text-slate-900">{customer.packageName}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Allocated Bandwidth:</span>
                  <span className="font-semibold text-blue-600">{customer.speed}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Monthly Tariff:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(customer.monthlyPrice)} / Mo</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Installation Date:</span>
                  <span className="font-semibold text-slate-900">{formatDate(customer.installationDate)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Activation Date:</span>
                  <span className="font-semibold text-slate-900">{formatDate(customer.activationDate)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Current Expiry:</span>
                  <span className="font-semibold text-amber-600">{formatDate(customer.expiryDate)}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-2.5">
                <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                  Customer & Technical Meta
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Father / Company:</span>
                  <span className="font-semibold text-slate-900">{customer.fatherOrCompanyName || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>CNIC ID:</span>
                  <span className="font-semibold text-slate-900">{customer.cnic || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Area / Sector:</span>
                  <span className="font-semibold text-slate-900">{customer.cityArea}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Full Address:</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[200px]">{customer.address}</span>
                </div>
                {customer.notes && (
                  <div className="flex justify-between text-slate-500 border-t border-slate-100 pt-1.5">
                    <span>Notes:</span>
                    <span className="text-slate-700 italic">{customer.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hardware & Initial Charges Breakdown */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
              <div className="font-bold text-slate-900 text-xs mb-3">Onboarding Hardware & Cable Breakdown</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Optical Router</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{formatCurrency(customer.routerPrice)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Installation Labor</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{formatCurrency(customer.installationCharges)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Wire ({customer.wireLengthMeters || 0}m)
                  </div>
                  <div className="font-semibold text-slate-900 mt-0.5">{formatCurrency(customer.wireCharges)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Discount Given</div>
                  <div className="font-semibold text-rose-600 mt-0.5">{formatCurrency(customer.discount)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Invoices */}
        {activeTab === 'invoices' && (
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No invoices recorded for this customer.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Paid</th>
                      <th className="p-3">Balance</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {invoices.map((inv: any) => {
                      const badge = getPaymentStatusBadge(inv.status);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="p-3 text-slate-600">{formatDate(inv.createdAt)}</td>
                          <td className="p-3 text-slate-600 capitalize">{inv.type?.replace('_', ' ')}</td>
                          <td className="p-3 font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                          <td className="p-3 text-emerald-600 font-medium">{formatCurrency(inv.paidAmount)}</td>
                          <td className="p-3 text-rose-600 font-medium">{formatCurrency(inv.remainingAmount)}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {inv.remainingAmount > 0 && (
                              <button
                                onClick={() => onRecordPayment(customer, inv.id)}
                                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payment Receipts */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No payment receipts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Receipt #</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">Received By</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-blue-600">{p.receiptNumber}</td>
                        <td className="p-3 text-slate-600">{formatDateTime(p.paymentDate)}</td>
                        <td className="p-3 font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                        <td className="p-3 text-slate-600 capitalize">{p.paymentMethod?.replace('_', ' ')}</td>
                        <td className="p-3 text-slate-500">{p.receivedByName || 'Cashier'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onPrintReceipt(p.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-blue-600 text-[11px] font-medium border border-slate-200 shadow-xs ml-auto transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                            <span>Thermal Print</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Renewal Logs */}
        {activeTab === 'renewals' && (
          <div className="space-y-3">
            {renewalHistory.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No package renewal history recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Renewal Date</th>
                      <th className="p-3">Package Tier</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Old Expiry</th>
                      <th className="p-3">New Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {renewalHistory.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-600">{formatDate(r.createdAt)}</td>
                        <td className="p-3 font-semibold text-slate-900">{r.packageName} ({r.speed})</td>
                        <td className="p-3 text-blue-600 font-medium">{r.months} Month(s)</td>
                        <td className="p-3 font-bold text-slate-900">{formatCurrency(r.amount)}</td>
                        <td className="p-3 text-slate-500">{formatDate(r.previousExpiryDate)}</td>
                        <td className="p-3 text-emerald-600 font-semibold">{formatDate(r.newExpiryDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
