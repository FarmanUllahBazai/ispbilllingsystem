import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StaffMember } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Wallet, DollarSign, CheckCircle2 } from 'lucide-react';

interface PaySalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList?: StaffMember[];
  initialStaffId?: string;
  onSalaryPaid: (salaryRecord: any) => void;
}

export const PaySalaryModal: React.FC<PaySalaryModalProps> = ({
  isOpen,
  onClose,
  staffList = [],
  initialStaffId,
  onSalaryPaid,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [staffId, setStaffId] = useState(initialStaffId || staffList?.[0]?.id || '');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'online_transfer' | 'cheque'>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (initialStaffId) {
      setStaffId(initialStaffId);
    } else if (staffList?.length > 0 && !staffId) {
      setStaffId(staffList[0].id);
    }
  }, [initialStaffId, staffList, staffId]);

  const selectedStaff = staffList?.find(s => s.id === staffId);

  useEffect(() => {
    if (selectedStaff) {
      setBasicSalary(selectedStaff.basicSalary);
    }
  }, [selectedStaff]);

  const netSalary = Math.max(0, (Number(basicSalary) || 0) + (Number(bonus) || 0) - (Number(deductions) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) return error('Please select a staff member');
    if (netSalary <= 0) return error('Net salary must be greater than 0');

    setSubmitting(true);
    try {
      const selectedMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const payload = {
        staffId,
        salaryMonth: selectedMonth,
        month: selectedMonth,
        basicSalary: Number(basicSalary) || 0,
        bonus: Number(bonus) || 0,
        deduction: Number(deductions) || 0,
        deductions: Number(deductions) || 0,
        paidAmount: netSalary,
        netSalary: netSalary,
        paymentMethod,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        notes: remarks.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };

      const res = await api.paySalary(payload);
      const staffName = res.staffName || selectedStaff?.name || 'Staff Member';
      success(`Salary of ${formatCurrency(netSalary)} disbursed for ${staffName} (${selectedMonth})!`);
      onSalaryPaid(res.salaryRecord || res.salary || res);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to disburse salary');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disburse Staff Salary"
      subtitle="Issue monthly payroll slip and auto-log expense in ledger"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Staff Member <span className="text-rose-600">*</span>
          </label>
          <select
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
          >
            {staffList.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.designation}) - Basic: {formatCurrency(s.basicSalary)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Month (YYYY-MM)</label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Calculation Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Basic Salary</label>
              <input
                type="number"
                min="0"
                value={basicSalary}
                onChange={e => setBasicSalary(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-semibold shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-emerald-700 uppercase font-semibold mb-1">+ Bonus (Rs.)</label>
              <input
                type="number"
                min="0"
                value={bonus}
                onChange={e => setBonus(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 text-xs font-semibold shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-rose-700 uppercase font-semibold mb-1">- Deductions</label>
              <input
                type="number"
                min="0"
                value={deductions}
                onChange={e => setDeductions(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 text-xs font-semibold shadow-xs"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase">Net Payable Salary</span>
            <span className="text-base font-bold text-blue-700">{formatCurrency(netSalary)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash Handover</option>
              <option value="online_transfer">Online Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Overtime bonus included"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>{submitting ? 'Processing...' : 'Disburse Salary'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
