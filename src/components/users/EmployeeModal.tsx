import React, { useState, useEffect } from 'react';
import { User, Role, Permission } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Shield,
  ShieldAlert,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  Briefcase,
  BadgeCheck,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeData?: User | null;
  onSaved: (savedUser: User) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeData,
  onSaved,
}) => {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Available metadata
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [roleId, setRoleId] = useState('role_sales_staff');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Fetch roles and permissions
  useEffect(() => {
    if (isOpen) {
      setLoadingMeta(true);
      Promise.all([api.getRoles(), api.getPermissions()])
        .then(([rolesRes, permsRes]) => {
          setRoles(rolesRes);
          setAllPermissions(permsRes);
        })
        .catch(err => {
          console.error('Failed to load roles and permissions:', err);
        })
        .finally(() => {
          setLoadingMeta(false);
        });
    }
  }, [isOpen]);

  // Populate form on edit or reset on new
  useEffect(() => {
    if (isOpen) {
      if (employeeData) {
        setName(employeeData.name || '');
        setUsername(employeeData.username || '');
        setEmail(employeeData.email || '');
        setPhone(employeeData.phone || '');
        setEmployeeId(employeeData.employeeId || '');
        setJobTitle(employeeData.jobTitle || '');
        setPassword('');
        setStatus(employeeData.status || 'active');
        setRoleId(employeeData.roleId || 'role_sales_staff');

        if (employeeData.customPermissions && employeeData.customPermissions.length > 0) {
          setSelectedPermissions(employeeData.customPermissions);
          setIsCustomMode(true);
        } else if (employeeData.permissions && employeeData.permissions.length > 0) {
          setSelectedPermissions(employeeData.permissions);
          setIsCustomMode(false);
        } else {
          setSelectedPermissions([]);
          setIsCustomMode(false);
        }
      } else {
        setName('');
        setUsername('');
        setEmail('');
        setPhone('');
        setEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
        setJobTitle('');
        setPassword('staff123');
        setStatus('active');
        setRoleId('role_sales_staff');
        setIsCustomMode(false);
        // Default permissions for sales staff
        setSelectedPermissions([
          'view_dashboard',
          'view_customers',
          'create_customer',
          'edit_customer',
          'renew_customer',
          'view_billing',
          'create_invoice',
          'view_payments',
          'receive_payment',
          'print_receipt',
        ]);
      }
    }
  }, [isOpen, employeeData]);

  // When role changes, update default permissions if not in custom mode
  const handleRoleChange = (newRoleId: string) => {
    setRoleId(newRoleId);
    const chosenRole = roles.find(r => r.id === newRoleId);
    if (chosenRole) {
      if (newRoleId === 'role_super_admin') {
        setSelectedPermissions(allPermissions.map(p => p.id));
      } else if (newRoleId === 'role_custom') {
        setIsCustomMode(true);
      } else {
        setSelectedPermissions([...chosenRole.permissions]);
        setIsCustomMode(false);
      }
    }
  };

  const handleTogglePermission = (permId: string) => {
    setIsCustomMode(true);
    setSelectedPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAllPermissions = () => {
    setIsCustomMode(true);
    setSelectedPermissions(allPermissions.map(p => p.id));
  };

  const handleClearAllPermissions = () => {
    setIsCustomMode(true);
    setSelectedPermissions([]);
  };

  const handleToggleModulePermissions = (module: string) => {
    setIsCustomMode(true);
    const modulePermIds = allPermissions.filter(p => p.module === module).map(p => p.id);
    const allSelected = modulePermIds.every(id => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
    } else {
      setSelectedPermissions(prev => Array.from(new Set([...prev, ...modulePermIds])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) {
      error('Full Name, Username, and Email are required.');
      return;
    }

    if (!employeeData && (!password || password.length < 4)) {
      error('Please set an initial password with at least 4 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedRoleObj = roles.find(r => r.id === roleId);
      const isSuperAdminRole = roleId === 'role_super_admin';

      const payload: any = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        employeeId: employeeId.trim(),
        jobTitle: jobTitle.trim(),
        roleId,
        roleName: selectedRoleObj ? selectedRoleObj.name : 'Custom Staff',
        status,
        customPermissions: isSuperAdminRole ? undefined : selectedPermissions,
      };

      if (!employeeData) {
        payload.password = password;
        const res = await api.createUser(payload);
        success(`Employee "${payload.name}" created successfully!`);
        onSaved(res.user);
      } else {
        if (password && password.trim().length >= 4) {
          payload.password = password.trim();
        }
        const res = await api.updateUser(employeeData.id, payload);
        success(`Employee profile for "${payload.name}" updated!`);
        onSaved(res.user);
      }

      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save employee account');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Group permissions by module
  const modulesList: string[] = Array.from(new Set(allPermissions.map(p => p.module)));
  const isSuperAdminSelected = roleId === 'role_super_admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{employeeData ? 'Edit Employee & Permissions' : 'Create New Employee Account'}</span>
                {employeeData && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                    ID: {employeeData.id}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Configure profile credentials, assign predefined role, and customize granular permissions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Profile & Credentials */}
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Employee Identity & Credentials</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-hidden"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tariq_sales"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-hidden"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="tariq@apexfiber.net"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-hidden"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-hidden"
                />
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Badge / ID</label>
                <input
                  type="text"
                  placeholder="EMP-1082"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-hidden"
                />
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Designation</label>
                <input
                  type="text"
                  placeholder="Senior Billing Executive"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-hidden"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {employeeData ? 'Change Password (leave blank to keep)' : 'Initial Password *'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder={employeeData ? '••••••••' : 'Enter login password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 focus:outline-hidden"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Login Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="active">Active (Permitted to Log In)</option>
                  <option value="inactive">Deactivated / Suspended (Blocked from Login)</option>
                </select>
              </div>

              {/* Predefined Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Preset Role <span className="text-blue-600">*</span>
                </label>
                <select
                  value={roleId}
                  onChange={e => handleRoleChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-blue-300 text-blue-700 text-xs font-semibold focus:border-blue-600 focus:outline-hidden"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.id === 'role_super_admin' ? '★ Full Access' : ''}
                    </option>
                  ))}
                  <option value="role_custom">Custom Permissions (Manual)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Permission Selection Panel */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-blue-600" />
                  <span>Permission Selection Panel</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {isSuperAdminSelected
                      ? 'All Permissions Active'
                      : `${selectedPermissions.length} of ${allPermissions.length} Enabled`}
                  </span>
                  {isCustomMode && !isSuperAdminSelected && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Customized Overrides
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select specific capabilities granted to this staff member. Unauthorized modules are hidden and blocked at API level.
                </p>
              </div>

              {!isSuperAdminSelected && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-blue-700 text-[11px] font-semibold border border-slate-300 transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllPermissions}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-semibold border border-slate-300 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Super Admin Notice Banner */}
            {isSuperAdminSelected ? (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-indigo-900">Super Admin Supreme Authority</div>
                  <p className="text-indigo-800 mt-0.5 leading-relaxed">
                    The Super Admin account holds unrestricted access across every existing and future module, function, setting, employee management, financial ledger, and database backup. Permissions cannot be restricted for this role.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {modulesList.map(moduleName => {
                  const modulePerms = allPermissions.filter(p => p.module === moduleName);
                  const allSelectedInModule = modulePerms.every(p => selectedPermissions.includes(p.id));

                  return (
                    <div
                      key={moduleName}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 tracking-wide">{moduleName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({modulePerms.filter(p => selectedPermissions.includes(p.id)).length}/{modulePerms.length})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleModulePermissions(moduleName)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                        >
                          {allSelectedInModule ? 'Deselect Module' : 'Select All in Module'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {modulePerms.map(perm => {
                          const isChecked = selectedPermissions.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-blue-50 border-blue-300 text-slate-900'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.id)}
                                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate text-slate-900">{perm.name}</div>
                                <div className="text-[10px] text-slate-500 leading-tight line-clamp-2 mt-0.5">
                                  {perm.description}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{submitting ? 'Saving Employee...' : employeeData ? 'Update Employee & Permissions' : 'Create Employee Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
