import React from 'react';
import { CreditCard, Receipt, TrendingDown, UserPlus, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TransactionItem {
  id: string;
  type: 'payment' | 'invoice' | 'expense' | 'customer' | 'renewal';
  title: string;
  subtitle: string;
  amount?: number;
  status?: string;
  date: string;
}

interface RecentTransactionsProps {
  transactions: TransactionItem[];
  onViewAll?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, onViewAll }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowDownRight className="w-4 h-4 text-emerald-600" />;
      case 'expense':
        return <ArrowUpRight className="w-4 h-4 text-rose-600" />;
      case 'renewal':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'customer':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-emerald-50 border-emerald-200';
      case 'expense':
        return 'bg-rose-50 border-rose-200';
      case 'renewal':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-2.5">
      {transactions.length === 0 ? (
        <div className="text-xs text-slate-400 py-6 text-center">No recent transactions recorded yet.</div>
      ) : (
        transactions.map((tx, idx) => (
          <div
            key={`${tx.id}-${idx}`}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className={`p-2 rounded-lg border shrink-0 ${getBg(tx.type)}`}>
                {getIcon(tx.type)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 tracking-tight truncate">{tx.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">{tx.subtitle}</div>
              </div>
            </div>

            <div className="text-right shrink-0">
              {tx.amount !== undefined && (
                <div
                  className={`text-xs font-bold ${
                    tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {tx.type === 'expense' ? '-' : '+'}
                  {formatCurrency(tx.amount)}
                </div>
              )}
              <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(tx.date)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

