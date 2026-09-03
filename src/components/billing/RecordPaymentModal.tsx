import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Customer, Invoice } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CreditCard, DollarSign, Receipt, CheckCircle2 } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: Customer[];
  initialCustomerId?: string;
  initialInvoiceId?: string;
  onPaymentSuccess: (payment: any, receiptId: string) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  initialCustomerId,
  initialInvoiceId,
  onPaymentSuccess,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || '');
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(initialInvoiceId || '');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'online_transfer' | 'easypaisa_jazzcash' | 'cheque'>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    } else if (customers?.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [initialCustomerId, customers, selectedCustomerId]);

  useEffect(() => {
    if (initialInvoiceId) {
      setSelectedInvoiceId(initialInvoiceId);
    }
  }, [initialInvoiceId]);

  // Load unpaid invoices for chosen customer
  useEffect(() => {
    if (selectedCustomerId) {
      api
        .getInvoices({ customerId: selectedCustomerId })
        .then(invs => {
          const list = Array.isArray(invs) ? invs : [];
          const unpaid = list.filter(i => i.remainingAmount > 0);
          setCustomerInvoices(unpaid);
          if (unpaid.length > 0 && !selectedInvoiceId) {
            setSelectedInvoiceId(unpaid[0].id);
            setAmount(unpaid[0].remainingAmount);
          } else if (unpaid.length === 0) {
            setSelectedInvoiceId('');
            const c = customers?.find(x => x.id === selectedCustomerId);
            setAmount(c?.balance || 0);
          }
        })
        .catch(err => console.error(err));
    }
  }, [selectedCustomerId]);

  const customer = customers?.find(c => c.id === selectedCustomerId);
  const invoice = customerInvoices?.find(i => i.id === selectedInvoiceId);

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    if (invId) {
      const inv = customerInvoices?.find(i => i.id === invId);
      if (inv) setAmount(inv.remainingAmount);
    } else if (customer) {
      setAmount(customer.balance || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return error('Please select a customer');
    if (!amount || amount <= 0) return error('Please enter a valid payment amount');

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        invoiceId: selectedInvoiceId || undefined,
        amount: Number(amount),
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };

      const res = await api.recordPayment(payload);
      success(`Payment of ${formatCurrency(amount)} recorded successfully!`);
      onPaymentSuccess(res.payment, res.receipt?.id || res.payment.id);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collect Payment & Issue Receipt"
      subtitle="Record customer cash/online payment, settle pending invoice dues and generate thermal slip"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Subscriber / Customer <span className="text-rose-600">*</span>
          </label>
          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.subscriberId}) • Balance: {formatCurrency(c.balance)}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Balance Summary */}
        {customer && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Outstanding Dues</div>
              <div
                className={`text-base font-bold mt-0.5 ${
                  customer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(customer.balance)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Package</div>
              <div className="font-semibold text-blue-600">{customer.packageName}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Expiry Date</div>
              <div className="font-semibold text-amber-600">{formatDate(customer.expiryDate)}</div>
            </div>
          </div>
        )}

        {/* Invoice Target Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Apply Payment Against
          </label>
          <select
            value={selectedInvoiceId}
            onChange={e => handleInvoiceChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
          >
            <option value="">General Account Balance Settlement</option>
            {customerInvoices.map(inv => (
              <option key={inv.id} value={inv.id}>
                Invoice {inv.invoiceNumber} ({formatDate(inv.createdAt)}) - Total {formatCurrency(inv.totalAmount)}, Due {formatCurrency(inv.remainingAmount)}
              </option>
            ))}
          </select>
        </div>

        {/* Amount & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-emerald-700 mb-1">
              Amount Received (Rs.) <span className="text-rose-600">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-700 font-bold text-sm focus:border-emerald-600 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method <span className="text-rose-600">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            >
              <option value="cash">Cash Counter</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online_transfer">Online Mobile App</option>
              <option value="easypaisa_jazzcash">Easypaisa / JazzCash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        {/* Reference Number & Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction / Ref # (Optional)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              placeholder="e.g. TRX-982312 or Cheque #102"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Paid at branch office counter"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />
          </div>
        </div>

        {/* Action Buttons */}
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
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>{submitting ? 'Recording...' : 'Record Payment & Print Slip'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
