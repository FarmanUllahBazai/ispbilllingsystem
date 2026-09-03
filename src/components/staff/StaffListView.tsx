import React, { useState, useMemo } from 'react';
import { StaffMember, SalaryPayment } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  UserCheck,
  PlusCircle,
  Wallet,
  Phone,
  Calendar,
  DollarSign,
  Edit2,
  CheckCircle2,
  History,
} from 'lucide-react';

interface StaffListViewProps {
  staff: StaffMember[];
  salaries: SalaryPayment[];
  loading: boolean;
  onOpenCreateStaff: () => void;
  onOpenPaySalary: (staffId?: string) => void;
  onEditStaff: (staff: StaffMember) => void;
}

export const StaffListView: React.FC<StaffListViewProps> = ({
  staff,
  salaries,
  loading,
  onOpenCreateStaff,
  onOpenPaySalary,
  onEditStaff,
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'salaries'>('staff');
  const [monthFilter, setMonthFilter] = useState('all');

  const totalPayroll = useMemo(() => {
    return staff.filter(s => s.status === 'active').reduce((a, b) => a + b.basicSalary, 0);
  }, [staff]);

  const filteredSalaries = useMemo(() => {
    return salaries.filter(s => monthFilter === 'all' || s.month === monthFilter);
  }, [salaries, monthFilter]);

  const totalSalariesPaid = useMemo(() => {
    return filteredSalaries.reduce((a, b) => a + b.netSalary, 0);
  }, [filteredSalaries]);

  // Unique months in salary history
  const uniqueMonths = Array.from(new Set(salaries.map(s => s.month))).sort().reverse();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Staff & Payroll Management</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">
              {staff.length} Members
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Monthly Payroll Commitment:{' '}
            <span className="font-bold text-emerald-700">{formatCurrency(totalPayroll)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenPaySalary()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>Disburse Salary</span>
          </button>

          <button
            onClick={onOpenCreateStaff}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Staff</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-4">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'staff'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Staff Directory ({staff.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('salaries')}
          className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'salaries'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Disbursed Slips History ({salaries.length})</span>
        </button>
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(member => (
            <div
              key={member.id}
              className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">{member.name}</h3>
                      <div className="text-xs text-blue-700 font-medium">{member.designation}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      member.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {member.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="my-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.contactNumber}</span>
                  </div>
                  {member.cnic && (
                    <div className="text-[11px] text-slate-500 font-mono">CNIC: {member.cnic}</div>
                  )}
                  {member.address && (
                    <div className="text-[11px] text-slate-500 truncate">{member.address}</div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Basic Compensation</div>
                  <div className="text-sm font-bold text-emerald-700">
                    {formatCurrency(member.basicSalary)} / mo
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenPaySalary(member.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Pay</span>
                  </button>

                  <button
                    onClick={() => onEditStaff(member)}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Salary Disbursement History */}
      {activeTab === 'salaries' && (
        <div className="space-y-3">
          {uniqueMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-semibold">Filter Month:</span>
              <select
                value={monthFilter}
                onChange={e => setMonthFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                <option value="all">All Disbursed Months</option>
                {uniqueMonths.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            {/* Mobile View: Cards */}
            <div className="block md:hidden divide-y divide-slate-100 bg-white">
              {filteredSalaries.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No salary disbursement records found.
                </div>
              ) : (
                filteredSalaries.map(s => (
                  <div key={s.id} className="p-3.5 space-y-2 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-blue-700 font-bold text-xs bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {s.month}
                        </span>
                        <div className="font-bold text-slate-900 text-sm mt-1.5">{s.staffName}</div>
                        {s.remarks && <div className="text-[10px] text-slate-500 mt-0.5">{s.remarks}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-700">{formatCurrency(s.netSalary)}</div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{formatDate(s.paymentDate)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                      <div>
                        <span className="text-[9px] text-slate-500 block font-semibold">Basic</span>
                        <span className="font-medium text-slate-800 text-[11px] mt-0.5 block">{formatCurrency(s.basicSalary)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-emerald-700 block font-semibold">Bonus</span>
                        <span className="font-medium text-emerald-700 text-[11px] mt-0.5 block">+{formatCurrency(s.bonus)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-rose-600 block font-semibold">Deductions</span>
                        <span className="font-medium text-rose-600 text-[11px] mt-0.5 block">-{formatCurrency(s.deductions)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-4">Month</th>
                    <th className="p-3.5">Staff Member</th>
                    <th className="p-3.5">Basic</th>
                    <th className="p-3.5">Bonus</th>
                    <th className="p-3.5">Deductions</th>
                    <th className="p-3.5">Net Disbursed</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSalaries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No salary disbursement records found.
                      </td>
                    </tr>
                  ) : (
                    filteredSalaries.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-4 font-bold text-slate-900 font-mono">{s.month}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{s.staffName}</div>
                          {s.remarks && (
                            <div className="text-[10px] text-slate-500 mt-0.5">{s.remarks}</div>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-700">{formatCurrency(s.basicSalary)}</td>
                        <td className="p-3.5 text-emerald-700 font-medium">+{formatCurrency(s.bonus)}</td>
                        <td className="p-3.5 text-rose-600 font-medium">-{formatCurrency(s.deductions)}</td>
                        <td className="p-3.5 font-bold text-emerald-700 text-sm">
                          {formatCurrency(s.netSalary)}
                        </td>
                        <td className="p-3.5 capitalize text-slate-700">
                          {s.paymentMethod?.replace('_', ' ')}
                        </td>
                        <td className="p-3.5 pr-4 text-slate-500">{formatDate(s.paymentDate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
