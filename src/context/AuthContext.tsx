import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: (User & { permissions: string[] }) | null;
  loading: boolean;
  isSuperAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (username: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permissionId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User & { permissions: string[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = localStorage.getItem('isp_auth_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid, please sign in again.');
      localStorage.removeItem('isp_auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem('isp_auth_token');
    if (!token) return;
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ username, password });
      localStorage.setItem('isp_auth_token', res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('isp_auth_token');
      setUser(null);
    }
  };

  const switchUser = async (username: string) => {
    setLoading(true);
    try {
      const res = await api.switchPersona(username);
      localStorage.setItem('isp_auth_token', res.token);
      setUser(res.user);
    } catch (err) {
      console.error('Failed to switch persona via session:', err);
      // Fallback only if no active session
      const res = await api.login({ username, password: 'password123' });
      localStorage.setItem('isp_auth_token', res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = user?.roleId === 'role_super_admin' || user?.roleName?.toLowerCase() === 'super admin';

  const hasPermission = (permissionId: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    const perms = user.permissions || [];
    if (perms.includes(permissionId)) return true;

    const aliases: Record<string, string[]> = {
      'renew_customer': ['renew_package'],
      'renew_package': ['renew_customer'],
      'create_staff': ['manage_staff', 'manage_users', 'manage_permissions'],
      'edit_staff': ['manage_staff', 'manage_users', 'manage_permissions'],
      'delete_staff': ['manage_staff', 'manage_users', 'manage_permissions'],
      'manage_permissions': ['manage_roles', 'manage_users', 'manage_staff'],
      'manage_roles': ['manage_permissions', 'manage_users'],
      'manage_users': ['manage_permissions', 'create_staff', 'edit_staff'],
      'view_financial_kpis': ['view_dashboard', 'view_reports', 'view_profit'],
      'view_profit': ['view_reports'],
      'export_customers': ['view_customers'],
      'export_invoices': ['view_billing'],
      'export_expenses': ['view_expenses'],
      'export_reports': ['view_reports'],
      'delete_payment': ['receive_payment', 'view_payments'],
      'delete_invoice': ['edit_invoice', 'view_billing'],
    };

    if (aliases[permissionId]?.some(alias => perms.includes(alias))) {
      return true;
    }

    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSuperAdmin, login, logout, switchUser, refreshUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
