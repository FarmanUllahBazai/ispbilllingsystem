import React, { useState, useEffect } from 'react';
import { User, Role, Permission } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EmployeeModal } from './EmployeeModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  Trash2,
  Power,
  Layers,
  ArrowRightLeft,
  Check,
  X,
  RefreshCw,
  Eye,
  AlertTriangle,
} from 'lucide-react';

export const EmployeeManagementView: React.FC = () => {
  const { user: currentUser, switchUser, isSuperAdmin, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'employees' | 'matrix'>('employees');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getPermissions(),
      ]);
      setUsers(usersRes);
      setRoles(rolesRes);
      setPermissions(permsRes);
    } catch (err: any) {
      error(err.message || 'Failed to load employee accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateEmployee = () => {
    setSelectedEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp: User) => {
    setSelectedEmployee(emp);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenResetPassword = (emp: User) => {
    setResetTargetUser(emp);
    setIsResetPasswordOpen(true);
  };

  const handleToggleStatus = async (emp: User) => {
    if (emp.roleId === 'role_super_admin' || emp.roleName?.toLowerCase() === 'super admin') {
      error('The master Super Admin account cannot be deactivated.');
      return;
    }

    try {
      const updated = await api.toggleUserStatus(emp.id);
      success(`Account for "${emp.name}" is now ${updated.user.status === 'active' ? 'Active' : 'Deactivated'}.`);
      setUsers(prev => prev.map(u => (u.id === emp.id ? { ...u, status: updated.user.status } : u)));
    } catch (err: any) {
      error(err.message || 'Failed to update employee status');
    }
  };

  const handleDeleteUser = async (emp: User) => {
    if (emp.roleId === 'role_super_admin' || emp.roleName?.toLowerCase() === 'super admin') {
      error('The master Super Admin account cannot be deleted.');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete employee account "${emp.name}" (@${emp.username})?`)) {
      try {
        await api.deleteUser(emp.id);
        success(`Employee account "${emp.name}" deleted.`);
        setUsers(prev => prev.filter(u => u.id !== emp.id));
      } catch (err: any) {
        error(err.message || 'Failed to delete employee account');
      }
    }
  };

  const handleSwitchToUser = async (emp: User) => {
    try {
      await switchUser(emp.username);
      success(`Switched active session to employee: ${emp.name} (${emp.roleName})`);
    } catch (err: any) {
      error(err.message || 'Failed to switch user account');
    }
  };

  const handleSavedEmployee = (savedUser: User) => {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === savedUser.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedUser;
        return next;
      }
      return [savedUser, ...prev];
    });
    refreshUser();
  };

  // Filtered employees
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(q));

    const matchesRole = roleFilter === 'all' || u.roleId === roleFilter || u.roleName === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalEmployees = users.length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const deactivatedCount = users.filter(u => u.status === 'inactive').length;
  const superAdminCount = users.filter(u => u.roleId === 'role_super_admin').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Super Admin & Employee Role-Based Access Control</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              RBAC v3.4 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin maintains unrestricted authority. Create, edit, deactivate, or delete employee accounts with granular permission sets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Accounts</span>
          </button>

          <button
            onClick={handleOpenCreateEmployee}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create Employee</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Staff Accounts</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalEmployees}</div>
            <div className="text-[11px] text-blue-700 font-medium mt-0.5">Enrolled in ISP Portal</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Staff</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Permitted to Log In</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Deactivated / Suspended</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">{deactivatedCount}</div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">Login Blocked by Super Admin</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Super Admin Accounts</div>
            <div className="text-2xl font-bold text-indigo-700 mt-1">{superAdminCount}</div>
            <div className="text-[11px] text-indigo-700 font-medium mt-0.5">Unrestricted Master Control</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-4">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'employees'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employees & Staff Directory</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700">
            {filteredUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Preset Roles & Permissions Matrix</span>
        </button>
      </div>

      {/* Tab 1: Employees Directory */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name, username, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Role filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Role:</span>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600"
                >
                  <option value="all">All Roles</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Deactivated Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employees Table */}
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Role & Designation</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Granted Permissions</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Loading employee directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Users className="w-8 h-8 mx-auto text-slate-400" />
                          <p className="font-semibold text-slate-700">No employee accounts found</p>
                          <p className="text-xs text-slate-500">
                            Try adjusting your search criteria or click '+ Create Employee' to enroll a new team member.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(emp => {
                      const isSuper = emp.roleId === 'role_super_admin' || emp.roleName?.toLowerCase() === 'super admin';
                      const isSelf = currentUser?.id === emp.id;
                      const hasCustom = emp.customPermissions && emp.customPermissions.length > 0;
                      const permCount = isSuper ? permissions.length : (emp.customPermissions?.length || emp.permissions?.length || 0);

                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Employee Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs uppercase border ${
                                  isSuper
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : emp.status === 'active'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                {emp.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{emp.name}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  @{emp.username} {emp.employeeId ? `• ID: ${emp.employeeId}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role & Designation */}
                          <td className="py-3.5 px-4">
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${
                                  isSuper
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : emp.roleId === 'role_manager'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : emp.roleId === 'role_sales_staff'
                                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                    : emp.roleId === 'role_accountant'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                <Shield className="w-3 h-3" />
                                <span>{emp.roleName}</span>
                              </span>
                              {emp.jobTitle && (
                                <div className="text-[11px] text-slate-500 mt-1">{emp.jobTitle}</div>
                              )}
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="text-slate-700">{emp.email}</div>
                              {emp.phone && <div className="text-[11px] text-slate-500 font-mono">{emp.phone}</div>}
                            </div>
                          </td>

                          {/* Permissions */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                  isSuper
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : hasCustom
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {isSuper ? 'Full System Access' : `${permCount} Permissions`}
                              </span>
                              {hasCustom && !isSuper && (
                                <span className="text-[10px] text-amber-700 font-medium">(Customized)</span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <button
                              disabled={isSuper}
                              onClick={() => handleToggleStatus(emp)}
                              title={isSuper ? 'Super Admin cannot be deactivated' : 'Click to toggle Active/Deactivated status'}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                                emp.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              } ${isSuper ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  emp.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                              />
                              <span>{emp.status === 'active' ? 'Active' : 'Deactivated'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Switch user test */}
                              <button
                                onClick={() => handleSwitchToUser(emp)}
                                title={`Switch to ${emp.name}'s account to test RBAC view`}
                                className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Profile & Permissions */}
                              <button
                                onClick={() => handleOpenEditEmployee(emp)}
                                title="Edit employee profile and permissions"
                                className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => handleOpenResetPassword(emp)}
                                title="Reset employee password"
                                className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              {!isSuper && (
                                <button
                                  onClick={() => handleDeleteUser(emp)}
                                  title="Delete employee account"
                                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Roles & Permissions Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Preset Roles Comparison Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify baseline capabilities granted to each preset role tier. Super Admin always receives full bypass.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                    <th className="py-3 px-4 w-72">Permission Action / Capability</th>
                    <th className="py-3 px-3 text-center bg-indigo-50 text-indigo-700">
                      Super Admin
                    </th>
                    <th className="py-3 px-3 text-center bg-blue-50 text-blue-700">Manager</th>
                    <th className="py-3 px-3 text-center bg-cyan-50 text-cyan-700">Sales Staff</th>
                    <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-700">
                      Accountant
                    </th>
                    <th className="py-3 px-3 text-center bg-amber-50 text-amber-700">Receptionist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {permissions.map(perm => {
                    const superAdminHas = true;
                    const managerHas = roles.find(r => r.id === 'role_manager')?.permissions.includes(perm.id);
                    const salesHas = roles.find(r => r.id === 'role_sales_staff')?.permissions.includes(perm.id);
                    const accountantHas = roles.find(r => r.id === 'role_accountant')?.permissions.includes(perm.id);
                    const receptionistHas = roles.find(r => r.id === 'role_receptionist')?.permissions.includes(perm.id);

                    return (
                      <tr key={perm.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">{perm.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {perm.module} • <span className="font-mono text-slate-400">{perm.id}</span>
                          </div>
                        </td>

                        {/* Super Admin */}
                        <td className="py-2.5 px-3 text-center bg-indigo-50/30">
                          <Check className="w-4 h-4 text-indigo-600 mx-auto" />
                        </td>

                        {/* Manager */}
                        <td className="py-2.5 px-3 text-center bg-blue-50/30">
                          {managerHas ? (
                            <Check className="w-4 h-4 text-blue-600 mx-auto" />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Sales Staff */}
                        <td className="py-2.5 px-3 text-center bg-cyan-50/30">
                          {salesHas ? (
                            <Check className="w-4 h-4 text-cyan-600 mx-auto" />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Accountant */}
                        <td className="py-2.5 px-3 text-center bg-emerald-50/30">
                          {accountantHas ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Receptionist */}
                        <td className="py-2.5 px-3 text-center bg-amber-50/30">
                          {receptionistHas ? (
                            <Check className="w-4 h-4 text-amber-600 mx-auto" />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        employeeData={selectedEmployee}
        onSaved={handleSavedEmployee}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        user={resetTargetUser}
      />
    </div>
  );
};
