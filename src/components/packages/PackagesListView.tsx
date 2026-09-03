import React, { useState } from 'react';
import { InternetPackage, Customer } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  Package,
  Wifi,
  Users,
  PlusCircle,
  Edit2,
  Trash2,
  Copy,
  Search,
  Zap,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  Server,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface PackagesListViewProps {
  packages: InternetPackage[];
  customers: Customer[];
  loading: boolean;
  onOpenCreatePackage: () => void;
  onEditPackage: (pkg: InternetPackage) => void;
  onDeletePackage?: (pkg: InternetPackage) => void;
  onDuplicatePackage?: (pkg: InternetPackage) => void;
}

export const PackagesListView: React.FC<PackagesListViewProps> = ({
  packages,
  customers,
  loading,
  onOpenCreatePackage,
  onEditPackage,
  onDeletePackage,
  onDuplicatePackage,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterMedium, setFilterMedium] = useState<string>('all');

  // Compute subscribers and monthly revenue per package
  const packageStats = packages.map(pkg => {
    const subs = customers.filter(c => c.packageId === pkg.id);
    const activeSubs = subs.filter(c => c.status === 'active' || c.accountStatus === 'active');
    const monthlyRev = activeSubs.length * pkg.monthlyPrice;
    return {
      ...pkg,
      totalSubscribers: subs.length,
      activeSubscribers: activeSubs.length,
      monthlyRevenue: monthlyRev,
    };
  });

  const filteredPackages = packageStats.filter(pkg => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.speed.toLowerCase().includes(search.toLowerCase()) ||
      (pkg.description && pkg.description.toLowerCase().includes(search.toLowerCase())) ||
      (pkg.badgeText && pkg.badgeText.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? pkg.isActive !== false && pkg.status !== 'inactive'
        : pkg.isActive === false || pkg.status === 'inactive';

    const matchesMedium =
      filterMedium === 'all' ? true : pkg.connectionType === filterMedium;

    return matchesSearch && matchesStatus && matchesMedium;
  });

  const totalMRR = packageStats.reduce((acc, p) => acc + p.monthlyRevenue, 0);
  const totalSubscribers = packageStats.reduce((acc, p) => acc + p.totalSubscribers, 0);
  const activeSubscribers = packageStats.reduce((acc, p) => acc + p.activeSubscribers, 0);

  const getThemeColors = (theme?: string) => {
    switch (theme) {
      case 'emerald':
        return {
          border: 'border-emerald-200 hover:border-emerald-400',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          accentText: 'text-emerald-700',
        };
      case 'purple':
        return {
          border: 'border-purple-200 hover:border-purple-400',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
          accentText: 'text-purple-700',
        };
      case 'amber':
        return {
          border: 'border-amber-200 hover:border-amber-400',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
          accentText: 'text-amber-700',
        };
      case 'rose':
        return {
          border: 'border-rose-200 hover:border-rose-400',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
          accentText: 'text-rose-700',
        };
      case 'blue':
      case 'cyan':
      default:
        return {
          border: 'border-slate-200 hover:border-blue-300',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
          accentText: 'text-blue-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Internet Packages & Bandwidth Tiers</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">
              {packages.length} Plans
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, customize, and manage broadband speed tiers, tariffs, MikroTik profiles, and subscriber quotas
          </p>
        </div>

        <button
          onClick={onOpenCreatePackage}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Customized Package</span>
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Tariff Plans</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{packages.length} Plans</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {packages.filter(p => p.isActive !== false && p.status !== 'inactive').length} active
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Active Subscribers</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5">{activeSubscribers} Active</div>
            <div className="text-[10px] text-slate-500 mt-0.5">across all plans</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Subscribed Lines</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{totalSubscribers} Accounts</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Total registered lines</div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
            <Wifi className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Estimated Monthly MRR</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5">{formatCurrency(totalMRR)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">from active subscriptions</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plan name, speed, badge..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
          {/* Connection Medium Filter */}
          <select
            value={filterMedium}
            onChange={e => setFilterMedium(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          >
            <option value="all">All Mediums</option>
            <option value="ftth">⚡ Fiber (FTTH)</option>
            <option value="wireless">📡 Wireless</option>
            <option value="dedicated">🏢 Dedicated</option>
            <option value="corporate">🏬 Corporate</option>
          </select>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({packageStats.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                filterStatus === 'active'
                  ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({packageStats.filter(p => p.isActive !== false && p.status !== 'inactive').length})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                filterStatus === 'inactive'
                  ? 'bg-white text-slate-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive ({packageStats.filter(p => p.isActive === false || p.status === 'inactive').length})
            </button>
          </div>
        </div>
      </div>

      {/* Package Cards Grid */}
      {filteredPackages.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No internet packages found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create and customize your broadband speed tiers, bandwidth allocations, and tariffs.
            </p>
          </div>
          <button
            onClick={onOpenCreatePackage}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Customized Package</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map(pkg => {
            const theme = getThemeColors(pkg.colorTheme);
            const isPlanActive = pkg.isActive !== false && pkg.status !== 'inactive';

            return (
              <div
                key={pkg.id}
                className={`p-5 rounded-xl bg-white border shadow-xs transition-all flex flex-col justify-between relative overflow-hidden group ${theme.border}`}
              >
                {/* Featured Ribbon / Badge Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {pkg.badgeText && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${theme.badge}`}>
                          {pkg.badgeText}
                        </span>
                      )}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {pkg.connectionType === 'wireless'
                          ? '📡 Wireless'
                          : pkg.connectionType === 'dedicated'
                          ? '🏢 Leased Line'
                          : pkg.connectionType === 'corporate'
                          ? '🏬 Corporate'
                          : '⚡ Fiber FTTH'}
                      </span>
                      {isPlanActive ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                          Inactive
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                      {pkg.name}
                    </h3>
                  </div>

                  {/* Actions (Edit, Duplicate, Delete) */}
                  <div className="flex items-center gap-1">
                    {onDuplicatePackage && (
                      <button
                        onClick={() => onDuplicatePackage(pkg)}
                        title="Duplicate this plan template"
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onEditPackage(pkg)}
                      title="Edit / Customize Package"
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onDeletePackage && (
                      <button
                        onClick={() => onDeletePackage(pkg)}
                        title="Delete Package"
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Plan Description */}
                <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                  {pkg.description || 'Optical fiber broadband connection with unlimited high-speed data.'}
                </p>

                {/* Speed & Price Showcase Box */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg border ${theme.iconBg}`}>
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Bandwidth Speed</div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                          <span className={theme.accentText}>{pkg.speed}</span>
                          {pkg.isSymmetrical !== false && (
                            <span className="text-[9px] text-slate-500 font-normal">(1:1 Symmetric)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Monthly Tariff</div>
                      <div className="text-base font-bold text-emerald-700">
                        {formatCurrency(pkg.monthlyPrice)}
                        <span className="text-[11px] font-normal text-slate-500"> /mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Network details pill */}
                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500">
                    <span>
                      Quota:{' '}
                      <strong className="text-slate-800">
                        {pkg.dataLimitType === 'capped' ? `${pkg.monthlyQuotaGB} GB` : 'Unlimited FUP'}
                      </strong>
                    </span>
                    {pkg.mikrotikProfile && (
                      <span className="font-mono text-slate-500">
                        Profile: <strong className="text-blue-700">{pkg.mikrotikProfile}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Feature Perks Badges */}
                {pkg.features && pkg.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {pkg.features.slice(0, 3).map((feat, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 truncate max-w-[150px]"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                    {pkg.features.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                        +{pkg.features.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Subscriber & MRR Footer */}
                <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-600" />
                      <span>Subscribers</span>
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {pkg.activeSubscribers}{' '}
                      <span className="text-[11px] font-semibold text-emerald-700">Active</span>{' '}
                      <span className="text-[10px] text-slate-500">({pkg.totalSubscribers} total)</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Estimated MRR</div>
                    <div className="font-bold text-emerald-700 mt-0.5">
                      {formatCurrency(pkg.monthlyRevenue || 0)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
