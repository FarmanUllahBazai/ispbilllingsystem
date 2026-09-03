import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, ChevronDown, RefreshCw, Wifi, Menu, Search, X } from 'lucide-react';

interface HeaderProps {
  onOpenSettings?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onToggleSidebar?: () => void;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  refreshing,
  onToggleSidebar,
  onSearch,
}) => {
  const { user, logout, switchUser } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const demoRoles = [
    { username: 'admin', label: 'Super Admin (Full Access)', role: 'Super Admin' },
    { username: 'manager', label: 'Admin (Operations)', role: 'Admin' },
    { username: 'accountant', label: 'Accountant (Finance & Billing)', role: 'Accountant' },
    { username: 'operator', label: 'Operator (Front Desk)', role: 'Staff / Operator' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchVal);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-2xs">
      {/* Left side: Hamburger menu + Logo Brand */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-2 -ml-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">ApexFiber ISP</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Enterprise
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 font-medium">Broadband Operations & Billing System</p>
          </div>
        </div>
      </div>

      {/* Middle: Clean Search for larger screens */}
      {onSearch && (
        <div className="hidden lg:flex items-center flex-1 max-w-sm mx-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchVal}
              onChange={e => {
                setSearchVal(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="Search subscribers, phone, CNIC..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 text-xs text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </form>
        </div>
      )}

      {/* Right side: Refresh + Role Switcher + User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Real-time Data"
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}

        {/* Quick Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="hidden sm:inline text-slate-500">Role:</span>
            <span className="font-semibold text-slate-900 max-w-[90px] sm:max-w-none truncate">
              {user?.roleName || 'Guest'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {roleDropdownOpen && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-1.5 w-[calc(100vw-1rem)] sm:w-64 max-w-sm rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Switch User Role</span>
                <button
                  onClick={() => setRoleDropdownOpen(false)}
                  className="sm:hidden p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {demoRoles.map(r => (
                  <button
                    key={r.username}
                    onClick={() => {
                      switchUser(r.username);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors ${
                      user?.username === r.username ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{r.role}</div>
                      <div className="text-[11px] text-slate-500">{r.label}</div>
                    </div>
                    {user?.username === r.username && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User profile info */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden md:block text-left max-w-[140px] lg:max-w-[180px]">
            <div className="text-xs font-semibold text-slate-900 leading-none truncate">{user?.name || 'Administrator'}</div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">{user?.email || 'admin@isp.pk'}</div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

