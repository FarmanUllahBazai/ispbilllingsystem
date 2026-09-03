import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { InternetPackage, SystemSettings } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { UserPlus, Wifi, Shield, DollarSign, Calculator, Receipt } from 'lucide-react';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages?: InternetPackage[];
  settings?: SystemSettings | null;
  onCustomerCreated: (createdData: any) => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  packages = [],
  settings,
  onCustomerCreated,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [fatherOrCompanyName, setFatherOrCompanyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [cityArea, setCityArea] = useState('Sector G-10 / Central Area');
  const [notes, setNotes] = useState('');

  // Package & Dates
  const [selectedPackageId, setSelectedPackageId] = useState(packages?.[0]?.id || '');
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().split('T')[0]);
  const [activationDate, setActivationDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (packages?.length > 0 && !selectedPackageId) {
      setSelectedPackageId(packages[0].id);
    }
  }, [packages, selectedPackageId]);

  // Calculate default expiry date (1 month from today)
  const defaultExp = new Date();
  defaultExp.setMonth(defaultExp.getMonth() + 1);
  const [expiryDate, setExpiryDate] = useState(defaultExp.toISOString().split('T')[0]);

  // Initial Charges
  const [routerPrice, setRouterPrice] = useState(settings?.defaultRouterPrice || 4500);
  const [installationCharges, setInstallationCharges] = useState(settings?.defaultInstallationFee || 2000);
  const [wireLengthMeters, setWireLengthMeters] = useState(30);
  const wireRate = settings?.wireRatePerMeter || 35;
  const [wireCharges, setWireCharges] = useState(30 * wireRate);
  const [otherCharges, setOtherCharges] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Payment
  const [paidInitialAmount, setPaidInitialAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'online_transfer' | 'easypaisa_jazzcash' | 'cheque'>('cash');

  // Sync package changes
  useEffect(() => {
    if (packages.length > 0 && !selectedPackageId) {
      setSelectedPackageId(packages[0].id);
    }
  }, [packages, selectedPackageId]);

  // Sync wire length calculation
  const handleWireLengthChange = (meters: number) => {
    setWireLengthMeters(meters);
    setWireCharges(meters * wireRate);
  };

  // Live Formula Calculation:
  // Total Initial Charges = Router + Installation + Wire + Other Charges − Discount
  const totalInitialCharges = Math.max(
    0,
    (Number(routerPrice) || 0) +
    (Number(installationCharges) || 0) +
    (Number(wireCharges) || 0) +
    (Number(otherCharges) || 0) -
    (Number(discount) || 0)
  );

  const remainingInitialAmount = Math.max(0, totalInitialCharges - (Number(paidInitialAmount) || 0));

  // Initialize paid amount to total upon opening
  useEffect(() => {
    if (isOpen) {
      setPaidInitialAmount(totalInitialCharges);
    }
  }, [isOpen, totalInitialCharges]);

  const selectedPkg = packages?.find(p => p.id === selectedPackageId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return error('Customer name is required');
    if (!contactNumber.trim()) return error('Contact number is required');
    if (!address.trim()) return error('Installation address is required');
    if (!selectedPackageId) return error('Please select an internet package');

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        fatherOrCompanyName: fatherOrCompanyName.trim(),
        contactNumber: contactNumber.trim(),
        cnic: cnic.trim(),
        address: address.trim(),
        cityArea: cityArea.trim(),
        notes: notes.trim(),
        packageId: selectedPackageId,
        installationDate,
        activationDate,
        expiryDate,
        routerPrice: Number(routerPrice) || 0,
        installationCharges: Number(installationCharges) || 0,
        wireCharges: Number(wireCharges) || 0,
        wireLengthMeters: Number(wireLengthMeters) || 0,
        otherCharges: Number(otherCharges) || 0,
        discount: Number(discount) || 0,
        paidInitialAmount: Number(paidInitialAmount) || 0,
        paymentMethod,
      };

      const result = await api.createCustomer(payload);
      success(`Customer "${result.customer.name}" (${result.customer.subscriberId}) registered successfully!`);
      onCustomerCreated(result);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to register customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Customer & Connection"
      subtitle="Complete onboarding with optical hardware charges, line wire measurement and initial invoice"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Information */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>1. Personal & Contact Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Tariq Mehmood / ABC Traders"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 text-xs placeholder:text-slate-400 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Father Name / Company Name
              </label>
              <input
                type="text"
                value={fatherOrCompanyName}
                onChange={e => setFatherOrCompanyName(e.target.value)}
                placeholder="e.g. Muhammad Akram"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 text-xs placeholder:text-slate-400 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                placeholder="e.g. +92 300 1234567"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 text-xs placeholder:text-slate-400 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNIC Number (Optional)
              </label>
              <input
                type="text"
                value={cnic}
                onChange={e => setCnic(e.target.value)}
                placeholder="e.g. 37405-1234567-1"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 text-xs placeholder:text-slate-400 shadow-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Installation Address <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. House 24, Street 12, Sector F-8/2"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 text-xs placeholder:text-slate-400 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City / Area Zone</label>
              <input
                type="text"
                value={cityArea}
                onChange={e => setCityArea(e.target.value)}
                placeholder="e.g. Blue Area / Sector I-10"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 text-xs placeholder:text-slate-400 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Technician Remark</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Spliced at Joint Box #4 on Pole 12"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 text-xs placeholder:text-slate-400 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Internet Package Selection */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
            <Wifi className="w-4 h-4 text-blue-600" />
            <span>2. Internet Package & Subscription Period</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Internet Package <span className="text-rose-600">*</span>
              </label>
              <select
                value={selectedPackageId}
                onChange={e => setSelectedPackageId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 text-xs shadow-xs"
              >
                {packages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.speed}) - {formatCurrency(p.monthlyPrice)} / Month
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Package Fee</label>
              <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-blue-600 font-bold text-xs">
                {formatCurrency(selectedPkg?.monthlyPrice || 0)} / Mo
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Installation Date</label>
              <input
                type="date"
                value={installationDate}
                onChange={e => setInstallationDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Activation Date</label>
              <input
                type="date"
                value={activationDate}
                onChange={e => setActivationDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Bill Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-600 text-slate-900 text-xs shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Installation & Hardware Charges Calculation */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-600" />
              <span>3. Installation & Initial Charges Calculation</span>
            </div>
            <span className="text-[11px] text-slate-500 lowercase font-normal">
              total = router + installation + wire + other − discount
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Router Price (Rs.)</label>
              <input
                type="number"
                min="0"
                value={routerPrice}
                onChange={e => setRouterPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Installation Labor (Rs.)</label>
              <input
                type="number"
                min="0"
                value={installationCharges}
                onChange={e => setInstallationCharges(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Wire Length ({wireRate} Rs/m)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={wireLengthMeters}
                  onChange={e => handleWireLengthChange(Number(e.target.value))}
                  placeholder="Meters"
                  className="w-20 px-2 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs shadow-xs"
                />
                <span className="text-xs text-slate-500">m =</span>
                <input
                  type="number"
                  min="0"
                  value={wireCharges}
                  onChange={e => setWireCharges(Number(e.target.value))}
                  className="w-full px-2 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Other Charges (Rs.)</label>
              <input
                type="number"
                min="0"
                value={otherCharges}
                onChange={e => setOtherCharges(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount (Rs.)</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-rose-600 font-semibold text-xs shadow-xs"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-[10px] text-blue-700 font-semibold uppercase">Total Initial Billed</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {formatCurrency(totalInitialCharges)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-700 mb-1">Paid Now (Rs.)</label>
              <input
                type="number"
                min="0"
                max={totalInitialCharges}
                value={paidInitialAmount}
                onChange={e => setPaidInitialAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-700 font-semibold text-xs shadow-xs"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Remaining Balance</div>
              <div className="text-base font-bold text-amber-600 mt-0.5">
                {formatCurrency(remainingInitialAmount)}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs shadow-xs"
              >
                <option value="cash">Cash Counter</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online_transfer">Online App (HBL / Meezan / etc.)</option>
                <option value="easypaisa_jazzcash">Easypaisa / JazzCash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{submitting ? 'Creating...' : 'Register Customer & Issue Bill'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
