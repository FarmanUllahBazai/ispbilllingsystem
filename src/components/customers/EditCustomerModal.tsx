import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Customer, InternetPackage } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Edit2, Shield, Wifi } from 'lucide-react';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  packages: InternetPackage[];
  onCustomerUpdated: (updatedCustomer: Customer) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  packages,
  onCustomerUpdated,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [fatherOrCompanyName, setFatherOrCompanyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [cityArea, setCityArea] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [packageId, setPackageId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setFatherOrCompanyName(customer.fatherOrCompanyName || '');
      setContactNumber(customer.contactNumber || '');
      setCnic(customer.cnic || '');
      setAddress(customer.address || '');
      setCityArea(customer.cityArea || '');
      setNotes(customer.notes || '');
      setStatus(customer.status || 'active');
      setPackageId(customer.packageId || '');
      setExpiryDate(customer.expiryDate || '');
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    if (!name.trim()) return error('Name is required');
    if (!contactNumber.trim()) return error('Contact number is required');

    setSubmitting(true);
    try {
      const updates = {
        name: name.trim(),
        fatherOrCompanyName: fatherOrCompanyName.trim(),
        contactNumber: contactNumber.trim(),
        cnic: cnic.trim(),
        address: address.trim(),
        cityArea: cityArea.trim(),
        notes: notes.trim(),
        status,
        packageId,
        expiryDate,
      };

      const updated = await api.updateCustomer(customer.id, updates);
      success(`Customer details updated successfully`);
      onCustomerUpdated(updated);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  if (!customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Customer: ${customer.name}`}
      subtitle={`Subscriber ID: ${customer.subscriberId}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Father / Company Name</label>
            <input
              type="text"
              value={fatherOrCompanyName}
              onChange={e => setFatherOrCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number *</label>
            <input
              type="text"
              required
              value={contactNumber}
              onChange={e => setContactNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">CNIC</label>
            <input
              type="text"
              value={cnic}
              onChange={e => setCnic(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Sector</label>
            <input
              type="text"
              value={cityArea}
              onChange={e => setCityArea(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            >
              <option value="active">Active (Broadband Enabled)</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended (Due Non-Payment)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Package Plan</label>
            <select
              value={packageId}
              onChange={e => setPackageId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            >
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.speed})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Package Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
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
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
