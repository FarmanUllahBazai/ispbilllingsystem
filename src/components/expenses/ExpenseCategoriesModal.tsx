import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ExpenseCategory } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2 } from 'lucide-react';

interface ExpenseCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onCategoryAdded: (cat: ExpenseCategory) => void;
  onCategoryUpdated?: (cat: ExpenseCategory) => void;
  onCategoryDeleted?: (id: string) => void;
}

export const ExpenseCategoriesModal: React.FC<ExpenseCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoryAdded,
  onCategoryDeleted,
}) => {
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return error('Please enter a category name');

    setSubmitting(true);
    try {
      const created = await api.createExpenseCategory({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      success(`Category "${created.name}" created!`);
      onCategoryAdded(created);
      setName('');
      setDescription('');
    } catch (err: any) {
      error(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;

    try {
      await api.deleteExpenseCategory(id);
      success(`Category "${catName}" deleted`);
      if (onCategoryDeleted) onCategoryDeleted(id);
    } catch (err: any) {
      error(err.message || 'Failed to delete category');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expense Categories"
      subtitle="Organize operational costs and overheads"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Existing Categories List */}
        <div className="space-y-2">
          <label className="font-semibold text-slate-700 block">
            Existing Categories ({categories.length})
          </label>
          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </div>
                  {cat.description && (
                    <div className="text-[11px] text-slate-500 mt-0.5">{cat.description}</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {cat.isSystem ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAdd} className="pt-3 border-t border-slate-200 space-y-3">
          <label className="font-semibold text-blue-600 block">
            + Add New Category
          </label>

          <div>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Category Name (e.g. Electricity & Fuel, Office Rent)..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short Description (Optional)..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Adding...' : 'Add Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
