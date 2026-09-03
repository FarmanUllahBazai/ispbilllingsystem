import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Customer } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Receipt, Plus, Trash2, Calendar } from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: Customer[];
  onInvoiceCreated: (invoice: any) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  onInvoiceCreated,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState(customers?.[0]?.id || '');
  const [type, setType] = useState<'monthly_bill' | 'new_connection' | 'hardware' | 'service_fee'>('monthly_bill');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<Array<{ description: string; amount: number; quantity: number }>>([
    { description: 'Monthly Internet Broadband Tariff', amount: 2500, quantity: 1 },
  ]);

  useEffect(() => {
    if (customers?.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const customer = customers?.find(c => c.id === customerId);

  // When customer or type changes, preset item
  useEffect(() => {
    if (customer && type === 'monthly_bill') {
      setItems([{ description: `Monthly Broadband Package (${customer.packageName})`, amount: customer.monthlyPrice || customer.monthlyFee || 0, quantity: 1 }]);
    }
  }, [customerId, type]);

  const handleAddItem = () => {
    setItems(prev => [...prev, { description: 'Hardware / Service Charge', amount: 500, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const subtotal = items.reduce((acc, item) => acc + (Number(item.amount) || 0) * (Number(item.quantity) || 1), 0);
  const totalAmount = Math.max(0, subtotal + Number(tax) - Number(discount));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return error('Please select a customer');
    if (items.length === 0) return error('Please add at least one line item');

    setSubmitting(true);
    try {
      const payload = {
        customerId,
        type,
        dueDate,
        items: items.map(item => ({
          description: item.description,
          amount: Number(item.amount),
          quantity: Number(item.quantity),
          total: Number(item.amount) * Number(item.quantity),
        })),
        subtotal,
        discount: Number(discount),
        tax: Number(tax),
        totalAmount,
        notes: notes.trim() || undefined,
      };

      const res = await api.createInvoice(payload);
      success(`Invoice ${res.invoice.invoiceNumber} created successfully!`);
      onInvoiceCreated(res.invoice);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Custom Invoice / Bill"
      subtitle="Issue custom broadband billing, hardware fees or maintenance invoices"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Customer <span className="text-rose-600">*</span>
            </label>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.subscriberId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            >
              <option value="monthly_bill">Monthly Bill</option>
              <option value="hardware">Hardware / Router</option>
              <option value="service_fee">Service / Wire Repair</option>
              <option value="new_connection">New Connection</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 shadow-xs"
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Line Items</span>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <input
                  type="text"
                  required
                  value={item.description}
                  onChange={e => handleItemChange(idx, 'description', e.target.value)}
                  placeholder="Item Description"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs shadow-xs focus:border-blue-600"
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                  placeholder="Qty"
                  className="w-16 px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs shadow-xs focus:border-blue-600"
                />
                <input
                  type="number"
                  min="0"
                  value={item.amount}
                  onChange={e => handleItemChange(idx, 'amount', Number(e.target.value))}
                  placeholder="Price"
                  className="w-24 px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-semibold shadow-xs focus:border-blue-600"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Calculation Panel */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Subtotal</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrency(subtotal)}</div>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Discount (Rs.)</label>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={e => setDiscount(Number(e.target.value))}
              className="w-full px-2 py-1 rounded-md bg-white border border-slate-200 text-rose-600 text-xs font-semibold shadow-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Govt Tax (Rs.)</label>
            <input
              type="number"
              min="0"
              value={tax}
              onChange={e => setTax(Number(e.target.value))}
              className="w-full px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-900 text-xs font-semibold shadow-xs"
            />
          </div>
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-[10px] text-blue-700 font-semibold uppercase">Total Invoice</div>
            <div className="text-base font-bold text-slate-900">{formatCurrency(totalAmount)}</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Remarks (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Standard billing for August cycle"
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
        </div>

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
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>{submitting ? 'Generating...' : 'Create Invoice'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
