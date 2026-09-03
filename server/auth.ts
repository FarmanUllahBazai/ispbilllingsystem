import { Request, Response, NextFunction } from 'express';
import { dbService } from './db';
import { User } from '../src/types';
import {
  createSessionToken,
  verifySessionToken,
  TokenPayload,
} from './security/crypto';

export interface AuthenticatedRequest extends Request {
  user?: User & { permissions: string[] };
  tokenPayload?: TokenPayload;
}

// In-memory token revocation blacklist (for logged out tokens until their natural expiration)
const REVOKED_TOKENS = new Set<string>();

// Prune expired tokens from revoked set periodically (every hour)
setInterval(() => {
  // Clear revoked set if overly large; tokens have built-in expiry
  if (REVOKED_TOKENS.size > 10000) {
    REVOKED_TOKENS.clear();
  }
}, 60 * 60 * 1000);

export function createToken(user: { id: string; username: string; roleId: string; roleName: string }): string {
  const { token } = createSessionToken(user);
  return token;
}

export function revokeToken(token: string) {
  if (token) {
    REVOKED_TOKENS.add(token);
  }
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.substring(7).trim();

  // Check if token was explicitly revoked on logout
  if (REVOKED_TOKENS.has(token)) {
    return res.status(401).json({ error: 'Session has been logged out. Please sign in again.' });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid token signature. Please log in again.' });
  }

  const user = dbService.getUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found or has been removed.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Your account has been suspended or deactivated. Contact the administrator.' });
  }

  const permissions = dbService.getUserPermissions(user);
  const { passwordHash, ...safeUser } = user;

  req.user = {
    ...safeUser,
    permissions,
  };
  req.tokenPayload = payload;

  next();
}

export function requirePermission(permissionId: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Super Admin has unrestricted authority across all operations
    if (req.user.roleId === 'role_super_admin' || req.user.roleName?.toLowerCase() === 'super admin') {
      return next();
    }

    const userPerms = req.user.permissions || [];

    // Direct match check
    if (userPerms.includes(permissionId)) {
      return next();
    }

    // Fallback/Legacy Aliases mapping for broad compatibility
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

    if (aliases[permissionId]?.some(alias => userPerms.includes(alias))) {
      return next();
    }

    return res.status(403).json({
      error: `Access Denied: You do not have the required permission [${permissionId}] to perform this action.`,
    });
  };
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.roleId === 'role_super_admin' || req.user.roleName?.toLowerCase() === 'super admin') {
    return next();
  }
  return res.status(403).json({
    error: 'Access Denied: This operation strictly requires Super Admin privileges.',
  });
}
