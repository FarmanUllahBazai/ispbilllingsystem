import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Expense, ExpenseCategory } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TrendingDown, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  expenseData: Expense | null;
  onSaved: (expense: Expense) => void;
  onCategoryCreated?: (category: ExpenseCategory) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  categories,
  expenseData,
  onSaved,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string | number>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'online_transfer' | 'easypaisa_jazzcash' | 'cheque'>('cash');
  const [payee, setPayee] = useState('');
  const [notes, setNotes] = useState('');

  // Quick custom category input toggle
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (expenseData) {
      setCategoryId(expenseData.categoryId || (categories[0]?.id || ''));
      setTitle(expenseData.title || expenseData.description || '');
      setAmount(expenseData.amount || '');
      setDate(expenseData.date ? expenseData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setPaymentMethod((expenseData.paymentMethod as any) || 'cash');
      setPayee(expenseData.payee || expenseData.vendorOrPayee || '');
      setNotes(expenseData.notes || '');
      setIsAddingNewCategory(false);
      setNewCategoryName('');
    } else {
      setCategoryId(categories[0]?.id || '');
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('cash');
      setPayee('');
      setNotes('');
      setIsAddingNewCategory(false);
      setNewCategoryName('');
    }
  }, [expenseData, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAddingNewCategory && !newCategoryName.trim()) {
      return error('Please enter a category name');
    }
    if (!isAddingNewCategory && !categoryId) {
      return error('Please select an expense category');
    }

    if (!title.trim()) {
      return error('Please enter an expense description');
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return error('Please enter a valid expense amount');
    }

    setSubmitting(true);
    try {
      const payload: any = {
        categoryId: isAddingNewCategory ? 'new_custom' : categoryId,
        customCategoryName: isAddingNewCategory ? newCategoryName.trim() : undefined,
        description: title.trim(),
        title: title.trim(),
        amount: numAmount,
        date,
        paymentMethod,
        vendorOrPayee: payee.trim() || undefined,
        payee: payee.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (expenseData) {
        const updated = await api.updateExpense(expenseData.id, payload);
        success('Expense updated successfully');
        onSaved(updated.expense || updated);
      } else {
        const created = await api.createExpense(payload);
        success('Expense recorded successfully');
        onSaved(created.expense || created);
      }
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseData ? 'Edit Expense' : 'Record Expense'}
      subtitle="Quickly record operational costs, bills, and purchases"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Category Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-700">
              Category <span className="text-rose-600">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setIsAddingNewCategory(!isAddingNewCategory);
                setNewCategoryName('');
              }}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              {isAddingNewCategory ? '← Choose Existing' : '+ New Category'}
            </button>
          </div>

          {isAddingNewCategory ? (
            <input
              type="text"
              required
              autoFocus
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Enter new category name (e.g. Generator Fuel, POP Rent)..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-blue-300 text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
            />
          ) : (
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:border-blue-600 focus:outline-none font-medium shadow-xs"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Description / Title */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Expense Description <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Monthly PTCL upstream bandwidth bill, Drop cable drum, Office tea..."
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none text-xs shadow-xs"
          />
        </div>

        {/* Amount and Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-rose-700 mb-1">
              Amount (Rs.) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-rose-600">Rs.</span>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-white border border-rose-300 text-rose-700 font-bold text-sm focus:border-rose-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Date <span className="text-rose-600">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Payment Method & Paid To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="easypaisa_jazzcash">EasyPaisa / JazzCash</option>
              <option value="online_transfer">Online Transfer (IBFT/Raast)</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Paid To / Vendor (Optional)</label>
            <input
              type="text"
              value={payee}
              onChange={e => setPayee(e.target.value)}
              placeholder="e.g. PTCL, Hardware Shop, Landlord"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Note / Remarks */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Remarks / Note (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Additional details or reference number..."
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none shadow-xs"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-all"
          >
            <TrendingDown className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : (expenseData ? 'Update Expense' : 'Save Expense')}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
