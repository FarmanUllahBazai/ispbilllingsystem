import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  TrendingDown,
  Search,
  PlusCircle,
  Layers,
  Edit2,
  Trash2,
} from 'lucide-react';

interface ExpensesListViewProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  loading: boolean;
  onOpenAddExpense: () => void;
  onOpenCategories: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
}

export const ExpensesListView: React.FC<ExpensesListViewProps> = ({
  expenses,
  categories,
  loading,
  onOpenAddExpense,
  onOpenCategories,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const search = searchTerm.toLowerCase();
      const titleText = (e.title || e.description || '').toLowerCase();
      const catName = (e.categoryName || '').toLowerCase();
      const payeeName = (e.payee || e.vendorOrPayee || '').toLowerCase();

      const matchesSearch =
        !searchTerm ||
        titleText.includes(search) ||
        catName.includes(search) ||
        payeeName.includes(search);

      const matchesCat = categoryFilter === 'all' || e.categoryId === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const totalExpenseAmount = useMemo(
    () => filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0),
    [filteredExpenses]
  );

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Expense Tracker</h2>
              <p className="text-xs text-slate-500">
                Total Expenses:{' '}
                <span className="font-bold text-rose-600 text-sm">
                  {formatCurrency(totalExpenseAmount)}
                </span>{' '}
                ({filteredExpenses.length} {filteredExpenses.length === 1 ? 'record' : 'records'})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCategories}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Categories</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* Simple Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search expense description, vendor, or category..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clean Expenses Table (Desktop) & Cards (Mobile) */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100 bg-white">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Loading expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No expense records found.
            </div>
          ) : (
            filteredExpenses.map(e => {
              const displayTitle = e.title || e.description || 'Expense';
              const displayPayee = e.payee || e.vendorOrPayee || '-';

              return (
                <div key={e.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-semibold text-blue-700 text-[10px] inline-block mb-1">
                        {e.categoryName || 'General'}
                      </span>
                      <div className="font-bold text-slate-900 text-sm truncate">{displayTitle}</div>
                      {e.notes && <div className="text-[11px] text-slate-500 mt-0.5 truncate">{e.notes}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-rose-600">{formatCurrency(Number(e.amount) || 0)}</div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{formatDate(e.date)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Paid To</span>
                      <span className="text-slate-800 mt-0.5 block truncate">{displayPayee}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Payment Method</span>
                      <span className="text-slate-800 mt-0.5 block capitalize truncate">{e.paymentMethod?.replace('_', ' ') || 'Cash'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-0.5">
                    <button
                      onClick={() => onEditExpense(e)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteExpense(e)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Date</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Paid To</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No expense records found. Click <strong>+ Record Expense</strong> to add one.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(e => {
                  const displayTitle = e.title || e.description || 'Expense';
                  const displayPayee = e.payee || e.vendorOrPayee || '-';

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-4 font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(e.date)}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 font-semibold text-blue-700 text-[11px] inline-block">
                          {e.categoryName || 'General'}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-sm">
                        <div className="font-semibold text-slate-900">{displayTitle}</div>
                        {e.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">{e.notes}</div>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-700 whitespace-nowrap">
                        {displayPayee}
                      </td>

                      <td className="p-3.5 text-slate-700 capitalize whitespace-nowrap">
                        {e.paymentMethod?.replace('_', ' ') || 'Cash'}
                      </td>

                      <td className="p-3.5 font-bold text-rose-600 text-sm whitespace-nowrap">
                        {formatCurrency(Number(e.amount) || 0)}
                      </td>

                      <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditExpense(e)}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(e)}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
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
