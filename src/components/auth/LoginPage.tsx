import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Wifi,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Building2,
  PhoneCall,
  Check,
} from 'lucide-react';

interface DemoAccount {
  name: string;
  role: string;
  username: string;
  badge: string;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Engr. Farman Ullah',
    role: 'Super Admin',
    username: 'admin',
    badge: 'Full Access',
    description: 'Complete administrative control, system settings & financial ledgers',
  },
  {
    name: 'Tariq Mehmood',
    role: 'Operations Admin',
    username: 'manager',
    badge: 'Operations',
    description: 'Customer management, technical packages & staff oversight',
  },
  {
    name: 'Hassan Raza (CPA)',
    role: 'Accountant',
    username: 'accountant',
    badge: 'Finance',
    description: 'Invoicing, payment collection, expense records & payroll',
  },
  {
    name: 'Bilal Ahmed',
    role: 'Staff / Operator',
    username: 'operator',
    badge: 'Front Desk',
    description: 'Subscriber lookup, receipt printing & bill recording',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await login(username.trim(), password);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(
        err.message || 'Invalid username or password. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (account: DemoAccount) => {
    setUsername(account.username);
    setPassword('admin123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <span>ApexFiber ISP</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500">Broadband Management & Billing Platform</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-medium">Gateway Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-700">Role-Based Access</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Form Card */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
                  <span>Sign In</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Operator Login
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Authenticate with your authorized credentials to access customer records, billing, and network operations.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username / Operator ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="login-username-input"
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="admin, manager, accountant, operator"
                      required
                      autoComplete="username"
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <span className="text-xs text-slate-500">Default: admin123</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Notice */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600">Keep session active</span>
                  </label>
                  <span className="text-xs text-amber-700 font-medium">
                    Secure Session
                  </span>
                </div>

                {/* Submit Action */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to System</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Helpline footnote */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>KB's Brothers Network</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                <span>Support: +92 317 8216236</span>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Demo Roles Selector */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select User Role (Demo)
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  4 Profiles
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Click any role below to populate credentials and test permissions:
              </p>

              <div className="space-y-2">
                {DEMO_ACCOUNTS.map(acc => {
                  const isSelected = username === acc.username;
                  return (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg border ${
                              isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-700'
                            } flex items-center justify-center font-bold text-xs`}
                          >
                            {acc.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{acc.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              @{acc.username} • {acc.role}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            isSelected
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {acc.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick master credentials banner */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-xs text-slate-700 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 text-xs">Standard Password</div>
                <div className="text-slate-500 text-[11px]">
                  Default for all profiles: <strong className="text-blue-700">admin123</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-2xs"
              >
                Reset Admin
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-6 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ApexFiber ISP Management System</span>
          <span>Role-Based Access Control (RBAC) & Audit Logs</span>
        </div>
      </footer>
    </div>
  );
};
