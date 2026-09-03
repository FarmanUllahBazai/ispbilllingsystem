import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Customer, InternetPackage } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { RefreshCw, CheckCircle2, Shield, Calendar, CreditCard } from 'lucide-react';

interface RenewPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: Customer[];
  packages?: InternetPackage[];
  customer?: Customer | null;
  initialCustomerId?: string;
  onRenewalSuccess?: (result: { customer: Customer; invoice: any; payment: any; receipt: any }) => void;
  onRenewSuccess?: (customer: Customer, invoice: any) => void;
}

export const RenewPackageModal: React.FC<RenewPackageModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  packages = [],
  customer,
  initialCustomerId,
  onRenewalSuccess,
  onRenewSuccess,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const initialId = initialCustomerId || customer?.id || (customers.length > 0 ? customers[0].id : '');
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialId);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [months, setMonths] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'online_transfer' | 'easypaisa_jazzcash'>('cash');
  const [remarks, setRemarks] = useState('');

  // Combined customers list
  const allCustomers = Array.isArray(customers) && customers.length > 0 
    ? customers 
    : (customer ? [customer] : []);

  // Update selected customer
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    } else if (customer?.id) {
      setSelectedCustomerId(customer.id);
    } else if (allCustomers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(allCustomers[0]?.id || '');
    }
  }, [initialCustomerId, customer, allCustomers.length]);

  const currentCustomer = allCustomers?.find(c => c?.id === selectedCustomerId) || customer;

  // Set package from customer by default
  useEffect(() => {
    if (currentCustomer && !selectedPackageId) {
      setSelectedPackageId(currentCustomer.packageId);
    }
  }, [currentCustomer, selectedPackageId]);

  const targetPackage = Array.isArray(packages) ? packages.find(p => p?.id === (selectedPackageId || currentCustomer?.packageId)) : undefined;

  // Calculation
  const monthlyRate = targetPackage?.monthlyPrice || 0;
  const subtotal = monthlyRate * months;
  const totalAmount = Math.max(0, subtotal - discount);
  const remaining = Math.max(0, totalAmount - paidAmount);

  // Auto set paidAmount to total when amount changes
  useEffect(() => {
    if (isOpen) {
      setPaidAmount(totalAmount);
    }
  }, [isOpen, totalAmount]);

  // Calculate new proposed expiry date
  const computeNewExpiry = (): string => {
    if (!currentCustomer) return '-';
    let base = new Date();
    if (currentCustomer.expiryDate) {
      const curExp = new Date(currentCustomer.expiryDate);
      if (curExp > base) {
        base = curExp;
      }
    }
    const newExp = new Date(base);
    newExp.setMonth(newExp.getMonth() + months);
    return newExp.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return error('Please select a customer');
    if (!selectedPackageId) return error('Please select a renewal package');

    setSubmitting(true);
    try {
      const payload = {
        packageId: selectedPackageId,
        months: Number(months),
        discount: Number(discount),
        paidAmount: Number(paidAmount),
        paymentMethod,
        remarks: remarks.trim() || undefined,
      };

      const res = await api.renewCustomer(selectedCustomerId, payload);
      success(`Subscription renewed successfully for ${res.customer.name}! Valid until ${formatDate(res.customer.expiryDate)}`);
      if (onRenewalSuccess) onRenewalSuccess(res);
      if (onRenewSuccess) onRenewSuccess(res.customer, res.invoice);
      onClose();
    } catch (err: any) {
      error(err.message || 'Renewal failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Package Renewal & Bill Generation"
      subtitle="Renew monthly broadband subscription, upgrade/downgrade speeds and collect renewal dues"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select Customer / Subscriber <span className="text-rose-600">*</span>
          </label>
          <select
            value={selectedCustomerId}
            onChange={e => {
              setSelectedCustomerId(e.target.value);
              const c = allCustomers?.find(x => x?.id === e.target.value);
              if (c) setSelectedPackageId(c.packageId);
            }}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
          >
            {allCustomers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.subscriberId}) • {c.contactNumber} • Exp: {formatDate(c.expiryDate)}
              </option>
            ))}
          </select>
        </div>

        {/* Current Customer Status Info */}
        {currentCustomer && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Current Package</div>
              <div className="font-semibold text-blue-600">{currentCustomer.packageName}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Current Expiry</div>
              <div className="font-semibold text-amber-600">{formatDate(currentCustomer.expiryDate)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Account Balance</div>
              <div className={`font-semibold ${currentCustomer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {currentCustomer.balance > 0 ? `Due ${formatCurrency(currentCustomer.balance)}` : 'Cleared (Rs. 0)'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Account Status</div>
              <div className="font-semibold text-emerald-600 capitalize">{currentCustomer.status}</div>
            </div>
          </div>
        )}

        {/* Renewal Package and Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Package Tier <span className="text-rose-600">*</span>
            </label>
            <select
              value={selectedPackageId}
              onChange={e => setSelectedPackageId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            >
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.speed}) - {formatCurrency(p.monthlyPrice)} / Mo
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Renewal Duration (Months)
            </label>
            <select
              value={months}
              onChange={e => setMonths(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            >
              <option value={1}>1 Month (Standard)</option>
              <option value={2}>2 Months</option>
              <option value={3}>3 Months (Quarterly)</option>
              <option value={6}>6 Months (Half Yearly)</option>
              <option value={12}>12 Months (Annual)</option>
            </select>
          </div>
        </div>

        {/* Live Calculation Panel */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-200">
            <span>Renewal Billing Computation</span>
            <span className="text-[11px] text-emerald-700 font-medium">
              New Expiry: {formatDate(computeNewExpiry())}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Monthly Price</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrency(monthlyRate)}</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Subtotal ({months} Mo)</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrency(subtotal)}</div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Discount (Rs.)</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full px-2 py-1 rounded-md bg-white border border-slate-200 text-rose-600 font-semibold text-xs shadow-xs"
              />
            </div>

            <div className="p-2 rounded-lg bg-blue-100/60 border border-blue-200">
              <div className="text-[10px] text-blue-700 font-semibold uppercase">Payable Total</div>
              <div className="text-base font-bold text-slate-900">{formatCurrency(totalAmount)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-emerald-700 mb-1">
                Paid Now (Rs.)
              </label>
              <input
                type="number"
                min="0"
                max={totalAmount}
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 font-semibold text-xs shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs shadow-xs"
              >
                <option value="cash">Cash Counter</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online_transfer">Online Banking</option>
                <option value="easypaisa_jazzcash">Easypaisa / JazzCash</option>
              </select>
            </div>
          </div>

          {remaining > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
              Partial Payment: Remaining <b>{formatCurrency(remaining)}</b> will be recorded as pending customer dues.
            </div>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
          <input
            type="text"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="e.g. Speed upgrade requested by subscriber"
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
            <span>{submitting ? 'Processing...' : 'Confirm Renewal & Issue Receipt'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
