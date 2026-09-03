export function formatCurrency(amount: number | string | undefined | null, symbol: string = 'Rs.'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (isNaN(num)) return `${symbol} 0`;
  return `${symbol} ${num.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString;
  }
}

export function getPaymentStatusBadge(status: string): { bg: string; text: string; label: string } {
  switch (status?.toLowerCase()) {
    case 'paid':
      return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'PAID' };
    case 'partial':
      return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'PARTIAL' };
    case 'pending':
      return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'PENDING' };
    case 'overdue':
      return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'OVERDUE' };
    default:
      return { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', label: status?.toUpperCase() || 'UNKNOWN' };
  }
}

export function getAccountStatusBadge(status: string): { bg: string; text: string; label: string } {
  switch (status?.toLowerCase()) {
    case 'active':
      return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Active' };
    case 'inactive':
      return { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', label: 'Inactive' };
    case 'suspended':
      return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Suspended' };
    default:
      return { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', label: status || 'Unknown' };
  }
}
