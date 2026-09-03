import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { InternetPackage } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Package,
  Wifi,
  DollarSign,
  Zap,
  Shield,
  Layers,
  Settings2,
  Check,
  Plus,
  X,
  Clock,
  Sparkles,
  Server,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: InternetPackage | null;
  onSaved: (pkg: InternetPackage) => void;
}

type TabType = 'basic' | 'speed' | 'quota' | 'network' | 'features';

export const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  packageData,
  onSaved,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  // Basic Information
  const [name, setName] = useState('');
  const [connectionType, setConnectionType] = useState<'ftth' | 'wireless' | 'dedicated' | 'corporate' | 'hotspot'>('ftth');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(2500);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [validityDays, setValidityDays] = useState<number>(30);
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [description, setDescription] = useState('');

  // Bandwidth & Speed
  const [downloadSpeed, setDownloadSpeed] = useState<number>(25);
  const [speedUnit, setSpeedUnit] = useState<'Mbps' | 'Gbps' | 'Kbps'>('Mbps');
  const [isSymmetrical, setIsSymmetrical] = useState(true);
  const [uploadSpeed, setUploadSpeed] = useState<number>(25);
  const [burstSpeed, setBurstSpeed] = useState('');
  const [nightSpeedBoost, setNightSpeedBoost] = useState(false);
  const [nightSpeedDetails, setNightSpeedDetails] = useState('');

  // Quota & Hardware
  const [dataLimitType, setDataLimitType] = useState<'unlimited' | 'capped'>('unlimited');
  const [monthlyQuotaGB, setMonthlyQuotaGB] = useState<number>(1000);
  const [postFupSpeed, setPostFupSpeed] = useState('2 Mbps');
  const [defaultRouterPrice, setDefaultRouterPrice] = useState<number>(0);
  const [defaultInstallationCharge, setDefaultInstallationCharge] = useState<number>(0);

  // Network & RouterOS
  const [mikrotikProfile, setMikrotikProfile] = useState('');
  const [ipAllocation, setIpAllocation] = useState<'dynamic_cgnat' | 'static_real_ip' | 'dhcp_pool'>('dynamic_cgnat');
  const [priorityQoS, setPriorityQoS] = useState<'normal' | 'high' | 'vip'>('normal');

  // Visuals & Badges
  const [badgeText, setBadgeText] = useState('');
  const [colorTheme, setColorTheme] = useState<'cyan' | 'emerald' | 'purple' | 'amber' | 'rose' | 'blue'>('cyan');
  const [features, setFeatures] = useState<string[]>([
    'Optical Fiber (FTTH)',
    'Unlimited Downloads',
    'HD Video & Streaming',
    '24/7 Technical Support',
  ]);
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Quick Presets
  const presets = [
    {
      id: 'p12',
      name: '12 Mbps Home Starter',
      downloadSpeed: 12,
      price: 1800,
      connectionType: 'ftth' as const,
      isSymmetrical: true,
      badgeText: 'Starter',
      colorTheme: 'blue' as const,
      desc: 'Budget-friendly fiber internet for light browsing and video calling.',
      features: ['12 Mbps Symmetrical Speed', 'Optical Fiber (FTTH)', 'Unlimited Data', 'Standard Support'],
    },
    {
      id: 'p25',
      name: '25 Mbps Family Fiber',
      downloadSpeed: 25,
      price: 2500,
      connectionType: 'ftth' as const,
      isSymmetrical: true,
      badgeText: 'Most Popular',
      colorTheme: 'cyan' as const,
      desc: 'High-speed fiber for multi-device households, 4K streaming and study.',
      features: ['25 Mbps Symmetrical Speed', 'Optical Fiber (FTTH)', 'Zero Buffering 4K', '24/7 Priority Support'],
    },
    {
      id: 'p50',
      name: '50 Mbps Gamer Pro',
      downloadSpeed: 50,
      price: 4000,
      connectionType: 'ftth' as const,
      isSymmetrical: true,
      badgeText: 'Gamer Edition',
      colorTheme: 'purple' as const,
      desc: 'Low ping gaming route, fast downloads, and Twitch live streaming.',
      features: ['50 Mbps Dedicated Route', 'Ultra-Low Latency Routing', 'Unlimited Bandwidth', 'VIP Priority Queue'],
    },
    {
      id: 'p100',
      name: '100 Mbps Ultra Corporate',
      downloadSpeed: 100,
      price: 6500,
      connectionType: 'dedicated' as const,
      isSymmetrical: true,
      badgeText: 'Enterprise',
      colorTheme: 'emerald' as const,
      desc: 'Gigabit-ready enterprise bandwidth with static IP and 99.9% uptime SLA.',
      features: ['100 Mbps Symmetrical', 'Static Real IP Included', '99.9% Uptime SLA', 'Dedicated Account Manager'],
    },
    {
      id: 'w15',
      name: '15 Mbps Wireless AirFiber',
      downloadSpeed: 15,
      price: 2000,
      connectionType: 'wireless' as const,
      isSymmetrical: false,
      uploadSpeed: 8,
      badgeText: 'Wireless',
      colorTheme: 'amber' as const,
      desc: 'Wireless antenna link for areas without physical fiber optic cable coverage.',
      features: ['15 Mbps Wireless Link', 'No Wire Breakage Risk', 'Weatherproof Link', 'Fast Installation'],
    },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setName(p.name);
    setDownloadSpeed(p.downloadSpeed);
    setSpeedUnit('Mbps');
    setMonthlyPrice(p.price);
    setConnectionType(p.connectionType);
    setIsSymmetrical(p.isSymmetrical);
    setUploadSpeed(p.uploadSpeed || p.downloadSpeed);
    setBadgeText(p.badgeText);
    setColorTheme(p.colorTheme);
    setDescription(p.desc);
    setFeatures(p.features);
    setMikrotikProfile(`pppoe_${p.downloadSpeed}M`);
  };

  useEffect(() => {
    if (packageData) {
      setName(packageData.name || '');

      // Parse speed string like "25 Mbps" if numerical downloadSpeed is not set
      const parsedSpeed = parseInt(packageData.speed, 10);
      const isGbps = packageData.speed.toLowerCase().includes('gbps');
      const isKbps = packageData.speed.toLowerCase().includes('kbps');

      setDownloadSpeed(packageData.downloadSpeed || (!isNaN(parsedSpeed) ? parsedSpeed : 25));
      setSpeedUnit(packageData.speedUnit as any || (isGbps ? 'Gbps' : isKbps ? 'Kbps' : 'Mbps'));
      setMonthlyPrice(packageData.monthlyPrice || 2500);
      setBillingCycle(packageData.billingCycle || 'monthly');
      setValidityDays(packageData.validityDays || 30);
      setDescription(packageData.description || '');
      setIsActive(packageData.isActive !== false && packageData.status !== 'inactive');
      setIsFeatured(Boolean(packageData.isFeatured));

      setConnectionType((packageData.connectionType as any) || 'ftth');
      setIsSymmetrical(packageData.isSymmetrical !== false);
      setUploadSpeed(packageData.uploadSpeed || (packageData.downloadSpeed || (!isNaN(parsedSpeed) ? parsedSpeed : 25)));
      setBurstSpeed(packageData.burstSpeed || '');
      setNightSpeedBoost(Boolean(packageData.nightSpeedBoost));
      setNightSpeedDetails(packageData.nightSpeedDetails || '');

      setDataLimitType((packageData.dataLimitType as any) || 'unlimited');
      setMonthlyQuotaGB(packageData.monthlyQuotaGB || 1000);
      setPostFupSpeed(packageData.postFupSpeed || '2 Mbps');
      setDefaultRouterPrice(packageData.defaultRouterPrice || 0);
      setDefaultInstallationCharge(packageData.defaultInstallationCharge || 0);

      setMikrotikProfile(packageData.mikrotikProfile || `pppoe_${parsedSpeed || 25}M`);
      setIpAllocation((packageData.ipAllocation as any) || 'dynamic_cgnat');
      setPriorityQoS((packageData.priorityQoS as any) || 'normal');

      setBadgeText(packageData.badgeText || '');
      setColorTheme((packageData.colorTheme as any) || 'cyan');
      setFeatures(packageData.features && packageData.features.length > 0 ? packageData.features : [
        'Optical Fiber (FTTH)',
        'Unlimited Downloads',
        'HD Video Streaming',
      ]);
      setAdminNotes(packageData.adminNotes || '');
      setTaxIncluded(packageData.taxIncluded !== false);
      setTaxPercentage(packageData.taxPercentage || 0);
    } else {
      // Default initial state
      setName('');
      setDownloadSpeed(25);
      setSpeedUnit('Mbps');
      setIsSymmetrical(true);
      setUploadSpeed(25);
      setMonthlyPrice(2500);
      setBillingCycle('monthly');
      setValidityDays(30);
      setConnectionType('ftth');
      setBadgeText('Recommended');
      setColorTheme('cyan');
      setDescription('High-speed reliable optical fiber internet for home and office');
      setFeatures([
        'Optical Fiber (FTTH)',
        'Unlimited Downloads',
        'HD Video & Streaming',
        '24/7 Technical Support',
      ]);
      setMikrotikProfile('pppoe_25M');
      setDefaultRouterPrice(0);
      setDefaultInstallationCharge(0);
      setIsActive(true);
      setIsFeatured(false);
      setDataLimitType('unlimited');
      setIpAllocation('dynamic_cgnat');
      setPriorityQoS('normal');
      setBurstSpeed('');
      setNightSpeedBoost(false);
      setNightSpeedDetails('');
      setTaxIncluded(true);
      setTaxPercentage(0);
      setAdminNotes('');
    }
    setActiveTab('basic');
  }, [packageData, isOpen]);

  // Adjust upload speed automatically when download changes if symmetrical is active
  const handleDownloadSpeedChange = (val: number) => {
    setDownloadSpeed(val);
    if (isSymmetrical) {
      setUploadSpeed(val);
    }
    if (!mikrotikProfile || mikrotikProfile.startsWith('pppoe_')) {
      setMikrotikProfile(`pppoe_${val}M`);
    }
  };

  const handleAddCustomFeature = () => {
    if (customFeatureInput.trim() && !features.includes(customFeatureInput.trim())) {
      setFeatures([...features, customFeatureInput.trim()]);
      setCustomFeatureInput('');
    }
  };

  const handleRemoveFeature = (feat: string) => {
    setFeatures(features.filter(f => f !== feat));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setActiveTab('basic');
      return error('Package name is required');
    }
    if (downloadSpeed <= 0) {
      setActiveTab('speed');
      return error('Download speed must be greater than 0');
    }
    if (monthlyPrice <= 0) {
      setActiveTab('basic');
      return error('Monthly price must be greater than 0');
    }

    setSubmitting(true);
    try {
      const speedLabel = isSymmetrical
        ? `${downloadSpeed} ${speedUnit}`
        : `↓${downloadSpeed}${speedUnit} / ↑${uploadSpeed}${speedUnit}`;

      const payload = {
        name: name.trim(),
        speed: speedLabel,
        downloadSpeed,
        uploadSpeed: isSymmetrical ? downloadSpeed : uploadSpeed,
        speedUnit,
        isSymmetrical,
        burstSpeed: burstSpeed.trim() || undefined,
        nightSpeedBoost,
        nightSpeedDetails: nightSpeedBoost ? nightSpeedDetails.trim() : undefined,

        monthlyPrice: Number(monthlyPrice),
        billingCycle,
        validityDays: Number(validityDays) || 30,
        taxIncluded,
        taxPercentage: Number(taxPercentage) || 0,

        connectionType,
        dataLimitType,
        monthlyQuotaGB: dataLimitType === 'capped' ? Number(monthlyQuotaGB) : undefined,
        postFupSpeed: dataLimitType === 'capped' ? postFupSpeed.trim() : undefined,

        defaultRouterPrice: Number(defaultRouterPrice) || 0,
        defaultInstallationCharge: Number(defaultInstallationCharge) || 0,

        mikrotikProfile: mikrotikProfile.trim() || undefined,
        ipAllocation,
        priorityQoS,

        badgeText: badgeText.trim() || undefined,
        colorTheme,
        features,
        description: description.trim(),
        adminNotes: adminNotes.trim() || undefined,

        isActive,
        isFeatured,
        status: isActive ? 'active' : 'inactive',
      };

      if (packageData) {
        const updated = await api.updatePackage(packageData.id, payload);
        success(`Package "${updated.name || name}" updated successfully!`);
        onSaved({ ...packageData, ...payload, id: packageData.id });
      } else {
        const created = await api.createPackage(payload);
        success(`Package "${created.name || name}" created successfully!`);
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save package');
    } finally {
      setSubmitting(false);
    }
  };

  // Pre-defined quick feature tags
  const suggestedFeatures = [
    'Optical Fiber (FTTH)',
    'Low Latency Gaming',
    '4K UHD Streaming',
    'Dual-Band ONU Free',
    'Static Public IP',
    'No Speed Throttling',
    '99.9% Uptime SLA',
    'Free Router Included',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={packageData ? `Customize Package: ${packageData.name}` : 'Add & Customize Internet Package'}
      subtitle="Configure broadband bandwidth, tariff pricing, line medium, network profile, and subscriber perks"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Quick Presets / Templates (for new packages) */}
        {!packageData && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>1-Click Preset Templates</span>
              </span>
              <span className="text-[10px] text-slate-500">Click any preset to auto-fill & customize</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {presets.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                      {p.downloadSpeed}M
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                      {p.connectionType === 'ftth' ? 'Fiber' : p.connectionType === 'wireless' ? 'Wireless' : 'Leased'}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 mt-1">
                    Rs. {p.price.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.badgeText}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation for Seamless Customization */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'basic'
                ? 'bg-white text-blue-600 font-semibold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>1. Basic & Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('speed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'speed'
                ? 'bg-white text-blue-600 font-semibold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>2. Speed & Bandwidth</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quota')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'quota'
                ? 'bg-white text-blue-600 font-semibold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Quota & Setup Fees</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('network')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'network'
                ? 'bg-white text-blue-600 font-semibold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>4. Network & RouterOS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'features'
                ? 'bg-white text-blue-600 font-semibold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>5. Badges & Perks</span>
          </button>
        </div>

        {/* Tab 1: Basic & Pricing */}
        {activeTab === 'basic' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Package Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 25 Mbps Smart Family Fiber"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Connection Medium <span className="text-rose-600">*</span>
                </label>
                <select
                  value={connectionType}
                  onChange={e => setConnectionType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                >
                  <option value="ftth">⚡ FTTH (Fiber Optic to the Home)</option>
                  <option value="wireless">📡 Wireless AirFiber / Radio Link</option>
                  <option value="dedicated">🏢 Dedicated Leased Line (Corporate)</option>
                  <option value="corporate">🏬 Corporate Business Internet</option>
                  <option value="hotspot">📶 Public / Shared Wi-Fi Hotspot</option>
                </select>
              </div>
            </div>

            {/* Monthly Tariff & Quick Increments */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Monthly Subscription Tariff (PKR) <span className="text-rose-600">*</span></span>
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500 mr-1">Quick add:</span>
                  {[500, 1000, 2000, 3000].map(inc => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setMonthlyPrice(prev => (Number(prev) || 0) + inc)}
                      className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer shadow-xs"
                    >
                      +{inc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <input
                    type="number"
                    required
                    min="100"
                    step="50"
                    value={monthlyPrice}
                    onChange={e => setMonthlyPrice(Number(e.target.value))}
                    placeholder="2500"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-700 text-sm font-bold focus:border-emerald-600 focus:outline-none shadow-xs"
                  />
                </div>

                <div>
                  <select
                    value={billingCycle}
                    onChange={e => {
                      setBillingCycle(e.target.value);
                      if (e.target.value === 'monthly') setValidityDays(30);
                      if (e.target.value === 'quarterly') setValidityDays(90);
                      if (e.target.value === 'semi_annual') setValidityDays(180);
                      if (e.target.value === 'annual') setValidityDays(365);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                  >
                    <option value="monthly">Monthly Cycle (30 Days)</option>
                    <option value="quarterly">Quarterly Cycle (90 Days)</option>
                    <option value="semi_annual">Semi-Annual (180 Days)</option>
                    <option value="annual">Annual Plan (365 Days)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Validity:</span>
                    <input
                      type="number"
                      min="1"
                      value={validityDays}
                      onChange={e => setValidityDays(Number(e.target.value))}
                      className="w-14 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-900 font-bold text-center text-xs"
                    />
                    <span className="text-slate-500">days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer-Facing Plan Summary / Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Blazing fast optical fiber connection suitable for 4-6 smart connected devices, online gaming, and 4K Netflix streaming."
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>

            {/* Status & Featured */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-slate-300 shadow-xs">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Active Tariff Plan</div>
                  <div className="text-[10px] text-slate-500">Available for new registrations and renewals</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-slate-300 shadow-xs">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={e => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Featured Highlight</div>
                  <div className="text-[10px] text-slate-500">Highlight this plan on onboarding forms</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Speed & Bandwidth */}
        {activeTab === 'speed' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Download & Upload Speed Customizer */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-blue-600" />
                    <span>Download & Upload Bandwidth Configuration</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Set symmetric (equal upload/download) or dedicated asymmetric bandwidth
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[11px] shadow-xs">
                  {(['Mbps', 'Gbps', 'Kbps'] as const).map(unit => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setSpeedUnit(unit)}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        speedUnit === unit
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Download Speed */}
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <span>↓ Download Speed</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {downloadSpeed} {speedUnit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={downloadSpeed}
                      onChange={e => handleDownloadSpeedChange(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-blue-600 font-bold text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  {/* Quick speed buttons */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[12, 16, 20, 25, 30, 50, 100, 200].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleDownloadSpeedChange(s)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          downloadSpeed === s
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        {s}M
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Speed */}
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>↑ Upload Speed</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {isSymmetrical ? downloadSpeed : uploadSpeed} {speedUnit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      disabled={isSymmetrical}
                      min="1"
                      max="10000"
                      value={isSymmetrical ? downloadSpeed : uploadSpeed}
                      onChange={e => setUploadSpeed(Math.max(1, Number(e.target.value)))}
                      className={`w-full px-3 py-2 rounded-lg bg-white border text-slate-800 font-bold text-sm focus:border-blue-600 focus:outline-none ${
                        isSymmetrical ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200'
                      }`}
                    />
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSymmetrical}
                      onChange={e => {
                        setIsSymmetrical(e.target.checked);
                        if (e.target.checked) setUploadSpeed(downloadSpeed);
                      }}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-slate-700">
                      Symmetrical Bandwidth (1:1 Ratio)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Advanced Bandwidth Boosters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                  <Zap className="w-3.5 h-3.5" />
                  <span>MikroTik Burst Rate (Optional)</span>
                </div>
                <input
                  type="text"
                  value={burstSpeed}
                  onChange={e => setBurstSpeed(e.target.value)}
                  placeholder="e.g. 50M for first 15s"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                />
                <div className="text-[10px] text-slate-500">
                  Delivers ultra-fast page and media loading spikes
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Night / Off-Peak Booster</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={nightSpeedBoost}
                    onChange={e => setNightSpeedBoost(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                </label>
                <input
                  type="text"
                  disabled={!nightSpeedBoost}
                  value={nightSpeedDetails}
                  onChange={e => setNightSpeedDetails(e.target.value)}
                  placeholder="e.g. Double speed from 12:00 AM to 08:00 AM"
                  className={`w-full px-3 py-2 rounded-lg bg-white border text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs ${
                    !nightSpeedBoost ? 'border-slate-200 bg-slate-50 opacity-50' : 'border-slate-200'
                  }`}
                />
                <div className="text-[10px] text-slate-500">
                  Off-peak bandwidth multiplier for overnight downloads
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Quota & Setup Fees */}
        {activeTab === 'quota' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Data Quota & FUP */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Fair Usage Policy (FUP) & Data Quota</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setDataLimitType('unlimited')}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    dataLimitType === 'unlimited'
                      ? 'bg-blue-50/60 border-blue-300 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">♾️ Unlimited Data</span>
                    {dataLimitType === 'unlimited' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    No data caps, fair usage throttling, or overage charges
                  </div>
                </label>

                <label
                  onClick={() => setDataLimitType('capped')}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    dataLimitType === 'capped'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">📊 Capped Monthly Quota</span>
                    {dataLimitType === 'capped' && <Check className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Specific GB quota with throttled speed after limit
                  </div>
                </label>
              </div>

              {dataLimitType === 'capped' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monthly Quota (GB)
                    </label>
                    <input
                      type="number"
                      min="50"
                      step="50"
                      value={monthlyQuotaGB}
                      onChange={e => setMonthlyQuotaGB(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Throttled Speed After Quota
                    </label>
                    <input
                      type="text"
                      value={postFupSpeed}
                      onChange={e => setPostFupSpeed(e.target.value)}
                      placeholder="e.g. 2 Mbps"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hardware & Setup Defaults */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-emerald-600" />
                <span>Onboarding Defaults (Router Device & Installation)</span>
              </div>
              <div className="text-[11px] text-slate-500">
                These default charges auto-populate when creating a new subscriber under this package.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Router / ONU Device Price (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={defaultRouterPrice}
                    onChange={e => setDefaultRouterPrice(Number(e.target.value))}
                    placeholder="0 (or 3500)"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                  <span className="text-[10px] text-slate-500">Set 0 if ONU is provided on security deposit/free promo</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Installation / Setup Labor (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={defaultInstallationCharge}
                    onChange={e => setDefaultInstallationCharge(Number(e.target.value))}
                    placeholder="0 (or 1500)"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                  <span className="text-[10px] text-slate-500">Set 0 if free installation promotional offer</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Network & RouterOS */}
        {activeTab === 'network' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-blue-600" />
                <span>MikroTik RouterOS & Radius Bandwidth Profile</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Maps this tariff plan directly to MikroTik PPPoE / Simple Queue profiles.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RouterOS Profile Name (PPPoE / Hotspot Profile)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mikrotikProfile}
                    onChange={e => setMikrotikProfile(e.target.value)}
                    placeholder="e.g. pppoe_25M_unlimited"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-blue-600 font-mono text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setMikrotikProfile(`pppoe_${downloadSpeed}M_${dataLimitType}`)}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[11px] text-slate-700 font-medium whitespace-nowrap cursor-pointer shadow-xs"
                  >
                    Auto-Generate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IP Address Allocation
                  </label>
                  <select
                    value={ipAllocation}
                    onChange={e => setIpAllocation(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                  >
                    <option value="dynamic_cgnat">Dynamic Private IP (Carrier-Grade NAT)</option>
                    <option value="static_real_ip">Static Real Public IP (Dedicated)</option>
                    <option value="dhcp_pool">DHCP Local Pool Assignment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Traffic QoS Priority
                  </label>
                  <select
                    value={priorityQoS}
                    onChange={e => setPriorityQoS(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                  >
                    <option value="normal">Standard Priority (Queue Level 8)</option>
                    <option value="high">High Priority (Queue Level 4 - Gaming)</option>
                    <option value="vip">VIP Low-Latency Priority (Queue Level 1)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Admin Private Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Operator / ISP Notes (Private)
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="e.g. Bandwidth sourced from upstream CIR tier-1 optical trunk. Minimum margin Rs. 800."
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>
        )}

        {/* Tab 5: Badges & Perks */}
        {activeTab === 'features' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Visual Badge Ribbon & Color Theme */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Marketing Badge Ribbon & Color Palette</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Promotional Ribbon Badge
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={e => setBadgeText(e.target.value)}
                    placeholder="e.g. Most Popular / Best Value / Gamer Edition"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Most Popular', 'Best Value', 'Gaming Edition', 'Enterprise', 'Budget Choice', 'New Launch'].map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBadgeText(b)}
                        className="px-2 py-0.5 rounded text-[10px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Color Accent Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'blue', label: 'Royal Blue', class: 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-500' },
                      { id: 'emerald', label: 'Emerald Green', class: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-500' },
                      { id: 'purple', label: 'Purple Gamer', class: 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-500' },
                      { id: 'amber', label: 'Amber Gold', class: 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-500' },
                      { id: 'rose', label: 'Rose Red', class: 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-500' },
                      { id: 'cyan', label: 'Cyan Fiber', class: 'bg-cyan-50 text-cyan-700 border-cyan-300 ring-1 ring-cyan-500' },
                    ].map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setColorTheme(theme.id as any)}
                        className={`p-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                          colorTheme === theme.id
                            ? theme.class
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Feature Perks */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-900">
                Feature Highlights & Subscriber Perks
              </label>

              {/* Active features chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                {features.length === 0 ? (
                  <span className="text-xs text-slate-400 p-1">No feature perks added yet</span>
                ) : (
                  features.map(f => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(f)}
                        className="p-0.5 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add custom feature input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFeatureInput}
                  onChange={e => setCustomFeatureInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomFeature();
                    }
                  }}
                  placeholder="Type custom feature perk (e.g. Free 5GHz Dual-Band Router)"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomFeature}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  Add
                </button>
              </div>

              {/* Quick suggestions pills */}
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Click to add suggested perk:</span>
                <div className="flex flex-wrap gap-1">
                  {suggestedFeatures.map(sf => (
                    <button
                      key={sf}
                      type="button"
                      disabled={features.includes(sf)}
                      onClick={() => setFeatures([...features, sf])}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                        features.includes(sf)
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-xs'
                      }`}
                    >
                      + {sf}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Plan Card Preview Callout */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-sm">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{name || 'New Custom Package'}</span>
                {badgeText && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {badgeText}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                Speed: <span className="text-blue-600 font-bold">{downloadSpeed} {speedUnit}</span> ({isSymmetrical ? 'Symmetric 1:1' : `Up to ${uploadSpeed} ${speedUnit} upload`}) •{' '}
                <span className="text-slate-700 font-medium">{connectionType.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Tariff</div>
            <div className="text-base font-bold text-emerald-600">
              Rs. {Number(monthlyPrice || 0).toLocaleString()}
              <span className="text-[10px] font-normal text-slate-500"> / {validityDays} days</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="text-[11px] text-slate-500">
            {packageData ? `Editing Plan #${packageData.id}` : 'Creating new customized plan'}
          </div>

          <div className="flex items-center gap-2">
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
              <Package className="w-4 h-4" />
              <span>{submitting ? 'Saving Package...' : packageData ? 'Update Package' : 'Create Package'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
