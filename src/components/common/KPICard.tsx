import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
  badgeType?: 'positive' | 'negative' | 'neutral' | 'warning';
  trend?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-700',
  iconBg = 'bg-blue-50 border-blue-200',
  badge,
  badgeType = 'neutral',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-2xs min-w-0 ${
        onClick ? 'cursor-pointer hover:bg-slate-50/50 active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{title}</div>
        <div className={`p-2 rounded-lg border shrink-0 ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{value}</div>
        {(subtitle || badge) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {badge && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                  badgeType === 'positive'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : badgeType === 'negative'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : badgeType === 'warning'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {badge}
              </span>
            )}
            {subtitle && <span className="text-xs text-slate-500 truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

