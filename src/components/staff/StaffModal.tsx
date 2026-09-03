import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StaffMember } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { UserCheck, DollarSign } from 'lucide-react';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffData: StaffMember | null;
  onSaved: (staff: StaffMember) => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  staffData,
  onSaved,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Line Technician & Splicer');
  const [contactNumber, setContactNumber] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [basicSalary, setBasicSalary] = useState<number>(35000);
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    if (staffData) {
      setName(staffData.name);
      setDesignation(staffData.designation);
      setContactNumber(staffData.contactNumber);
      setCnic(staffData.cnic || '');
      setAddress(staffData.address || '');
      setBasicSalary(staffData.basicSalary);
      setJoiningDate(staffData.joiningDate ? staffData.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      setStatus(staffData.status);
    } else {
      setName('');
      setDesignation('Line Technician & Splicer');
      setContactNumber('');
      setCnic('');
      setAddress('');
      setBasicSalary(35000);
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setStatus('active');
    }
  }, [staffData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return error('Staff name is required');
    if (!contactNumber.trim()) return error('Contact number is required');
    if (basicSalary <= 0) return error('Basic salary must be greater than 0');

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        designation: designation.trim(),
        contactNumber: contactNumber.trim(),
        cnic: cnic.trim() || undefined,
        address: address.trim() || undefined,
        basicSalary: Number(basicSalary),
        joiningDate,
        status,
      };

      if (staffData) {
        const updated = await api.updateStaff(staffData.id, payload);
        success(`Staff member "${updated.name}" updated!`);
        onSaved(updated);
      } else {
        const created = await api.createStaff(payload);
        success(`Staff member "${created.name}" created!`);
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save staff member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={staffData ? `Edit Staff: ${staffData.name}` : 'Register Staff Member'}
      subtitle="Manage field technicians, linemen, support staff, and payroll basic compensation"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Asim Riaz"
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
            <input
              type="text"
              required
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              placeholder="e.g. Senior Optical Fiber Splicer"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number *</label>
            <input
              type="text"
              required
              value={contactNumber}
              onChange={e => setContactNumber(e.target.value)}
              placeholder="e.g. 0312 9876543"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">CNIC Number</label>
            <input
              type="text"
              value={cnic}
              onChange={e => setCnic(e.target.value)}
              placeholder="e.g. 37405-1234567-3"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-700 mb-1">Basic Salary (Rs.) *</label>
            <input
              type="number"
              required
              min="1000"
              value={basicSalary}
              onChange={e => setBasicSalary(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-700 font-bold text-xs focus:border-emerald-600 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
            <input
              type="date"
              value={joiningDate}
              onChange={e => setJoiningDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
            >
              <option value="active">Active Employed</option>
              <option value="inactive">Inactive / Resigned</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="e.g. Street 4, Sector G-9/1, Islamabad"
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Save Staff Record'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
