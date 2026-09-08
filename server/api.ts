import { Router, Request, Response } from 'express';
import { dbService } from './db';
import {
  authenticate,
  requirePermission,
  requireSuperAdmin,
  createToken,
  revokeToken,
  AuthenticatedRequest,
} from './auth';
import { verifyPassword, hashPassword } from './security/crypto';
import {
  sanitizeString,
  sanitizeObject,
  isSafeBackupFilename,
  parseSafeAmount,
  isValidDateString,
  isValidEmail,
  isValidUsername,
  isStrongPassword,
} from './security/sanitizer';
import {
  authRateLimiter,
  recordFailedAuth,
  clearAuthFailures,
} from './security/rateLimiter';

export const apiRouter = Router();

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

apiRouter.post('/auth/login', authRateLimiter, (req: Request, res: Response) => {
  try {
    const rawUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!rawUsername || !rawPassword) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = dbService.getUserByUsername(rawUsername);
    if (!user) {
      recordFailedAuth(req);
      dbService.logAudit({
        userId: 'ANONYMOUS',
        userName: rawUsername,
        userRole: 'Unknown',
        action: 'FAILED_LOGIN',
        entityType: 'auth',
        entityId: 'UNKNOWN_USER',
        description: `Failed login attempt for non-existent username: "${rawUsername}".`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Your account is deactivated. Please contact the Super Admin.',
      });
    }

    const { valid, needsUpgrade } = verifyPassword(rawPassword, user.passwordHash);
    if (!valid) {
      recordFailedAuth(req);
      dbService.logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.roleName,
        action: 'FAILED_LOGIN',
        entityType: 'auth',
        entityId: user.id,
        description: `Failed login attempt (incorrect password) for user: "${user.username}".`,
        ipAddress: req.ip || req.socket.remoteAddress,
      });
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Clear failed auth attempts upon successful verification
    clearAuthFailures(req);

    // Seamlessly upgrade legacy hash to modern salted scrypt
    if (needsUpgrade) {
      user.passwordHash = hashPassword(rawPassword);
      user.updatedAt = new Date().toISOString();
      dbService.saveDatabase();
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      roleName: user.roleName,
    });
    dbService.updateLastLogin(user.id);

    // Audit log
    dbService.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.roleName,
      action: 'LOGIN',
      entityType: 'auth',
      entityId: user.id,
      description: `User "${user.username}" authenticated successfully.`,
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    const permissions = dbService.getUserPermissions(user);
    const { passwordHash: _, ...safeUser } = user;

    res.json({
      token,
      user: {
        ...safeUser,
        permissions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'An unexpected authentication error occurred.' });
  }
});

/**
 * Demo Persona Switcher (Allows seamless role switching in demo without transmitting hardcoded passwords)
 */
apiRouter.post('/auth/switch-persona', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUsername = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    if (!targetUsername) {
      return res.status(400).json({ error: 'Target username is required.' });
    }

    const targetUser = dbService.getUserByUsername(targetUsername);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target demo account not found.' });
    }

    if (targetUser.status !== 'active') {
      return res.status(403).json({ error: 'Target user account is inactive.' });
    }

    const token = createToken({
      id: targetUser.id,
      username: targetUser.username,
      roleId: targetUser.roleId,
      roleName: targetUser.roleName,
    });

    dbService.logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.roleName,
      action: 'SWITCH_PERSONA',
      entityType: 'auth',
      entityId: targetUser.id,
      description: `User "${req.user!.username}" switched active demo persona to "${targetUser.username}".`,
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    const permissions = dbService.getUserPermissions(targetUser);
    const { passwordHash: _, ...safeUser } = targetUser;

    res.json({
      token,
      user: {
        ...safeUser,
        permissions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to switch demo persona.' });
  }
});

apiRouter.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

apiRouter.post('/auth/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    revokeToken(authHeader.substring(7).trim());
  }
  if (req.user) {
    dbService.logAudit({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.roleName,
      action: 'LOGOUT',
      entityType: 'auth',
      entityId: req.user.id,
      description: `User "${req.user.username}" logged out.`,
      ipAddress: req.ip,
    });
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.post('/auth/change-password', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const passwordValidation = isStrongPassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    const storedUser = dbService.getUserById(req.user!.id);
    if (!storedUser) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const { valid } = verifyPassword(currentPassword, storedUser.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    storedUser.passwordHash = hashPassword(newPassword);
    storedUser.updatedAt = new Date().toISOString();
    dbService.saveDatabase();

    dbService.logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.roleName,
      action: 'CHANGE_PASSWORD',
      entityType: 'user',
      entityId: req.user!.id,
      description: `User "${req.user!.username}" changed their account password.`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// -------------------------------------------------------------
// DASHBOARD & ANALYTICS
// -------------------------------------------------------------

apiRouter.get('/dashboard/analytics', authenticate, requirePermission('view_dashboard'), (req: Request, res: Response) => {
  try {
    const analytics = dbService.getDashboardAnalytics();
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load dashboard analytics.' });
  }
});

// -------------------------------------------------------------
// CUSTOMER MANAGEMENT
// -------------------------------------------------------------

apiRouter.get('/customers', authenticate, requirePermission('view_customers'), (req: Request, res: Response) => {
  try {
    let customers = dbService.getCustomers();
    const { search, status, paymentStatus, packageId } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      customers = customers.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.contactNumber && c.contactNumber.includes(q)) ||
        (c.subscriberId || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q) ||
        (c.cnic && c.cnic.includes(q))
      );
    }

    if (status && typeof status === 'string') {
      customers = customers.filter(c => c.accountStatus === status);
    }

    if (paymentStatus && typeof paymentStatus === 'string') {
      customers = customers.filter(c => c.paymentStatus === paymentStatus);
    }

    if (packageId && typeof packageId === 'string') {
      customers = customers.filter(c => c.packageId === packageId);
    }

    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve customers list.' });
  }
});

apiRouter.get('/customers/:id', authenticate, requirePermission('view_customers'), (req: Request, res: Response) => {
  try {
    const customer = dbService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const db = dbService.getDatabase();
    const customerInvoices = db.invoices.filter(i => i.customerId === customer.id);
    const customerPayments = db.payments.filter(p => p.customerId === customer.id);
    const customerRenewals = db.packageRenewals.filter(r => r.customerId === customer.id);

    res.json({
      customer,
      invoices: customerInvoices,
      payments: customerPayments,
      renewals: customerRenewals,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve customer details.' });
  }
});

apiRouter.post('/customers', authenticate, requirePermission('create_customer'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitizedBody = sanitizeObject(req.body);
    const {
      name,
      contactNumber,
      address,
      packageId,
      installationDate,
      expiryDate,
    } = sanitizedBody;

    if (!name || !contactNumber || !address || !packageId || !expiryDate) {
      return res.status(400).json({
        error: 'Customer name, contact number, installation address, package selection, and expiry date are required.'
      });
    }

    const result = dbService.createCustomer({
      ...sanitizedBody,
      installationCharges: parseSafeAmount(sanitizedBody.installationCharges),
      routerCharges: parseSafeAmount(sanitizedBody.routerCharges),
      wireCharges: parseSafeAmount(sanitizedBody.wireCharges),
      otherCharges: parseSafeAmount(sanitizedBody.otherCharges),
      advancePayment: parseSafeAmount(sanitizedBody.advancePayment),
      discount: parseSafeAmount(sanitizedBody.discount),
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });

    res.status(201).json({
      message: 'Customer registered successfully and initial invoice generated.',
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to register customer.' });
  }
});

apiRouter.put('/customers/:id', authenticate, requirePermission('edit_customer'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitizedBody = sanitizeObject(req.body);
    const updated = dbService.updateCustomer(req.params.id, sanitizedBody, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Customer updated successfully.', customer: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update customer.' });
  }
});

apiRouter.delete('/customers/:id', authenticate, requirePermission('delete_customer'), (req: AuthenticatedRequest, res: Response) => {
  try {
    dbService.deleteCustomer(req.params.id, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Customer deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete customer.' });
  }
});

// Package Renewal Endpoint
apiRouter.post('/customers/:id/renew', authenticate, requirePermission('renew_package'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitizedBody = sanitizeObject(req.body);
    const { newPackageId, renewalPeriodMonths, paidAmount, paymentMethod, effectiveDate, discount, notes } = sanitizedBody;
    
    if (!newPackageId || !effectiveDate) {
      return res.status(400).json({ error: 'Package selection and effective date are required.' });
    }

    const result = dbService.renewCustomerPackage({
      customerId: req.params.id,
      newPackageId,
      renewalPeriodMonths: Math.max(1, Math.min(36, Number(renewalPeriodMonths) || 1)),
      paidAmount: parseSafeAmount(paidAmount),
      paymentMethod: paymentMethod || 'cash',
      effectiveDate,
      discount: parseSafeAmount(discount),
      notes: sanitizeString(notes, 500),
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });

    res.json({
      message: 'Subscription package renewed successfully.',
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to renew package.' });
  }
});

// -------------------------------------------------------------
// INTERNET PACKAGES
// -------------------------------------------------------------

apiRouter.get('/packages', authenticate, (req: Request, res: Response) => {
  try {
    const packages = dbService.getPackages();
    res.json(packages);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve internet packages.' });
  }
});

apiRouter.post('/packages', authenticate, requirePermission('manage_packages'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const { name, speed, monthlyPrice, billingCycle, description, status, isActive } = sanitized;
    if (!name || (!speed && !sanitized.downloadSpeed) || !monthlyPrice) {
      return res.status(400).json({ error: 'Package name, speed/bandwidth, and monthly price are required.' });
    }

    const downloadVal = Number(sanitized.downloadSpeed) || 0;
    const speedUnit = sanitized.speedUnit || 'Mbps';
    const computedSpeed = sanitizeString(speed || `${downloadVal} ${speedUnit}`, 50);

    const pkg = dbService.createPackage({
      name: sanitizeString(name, 100),
      speed: computedSpeed,
      monthlyPrice: parseSafeAmount(monthlyPrice, 0, 500_000),
      billingCycle: billingCycle || 'monthly',
      validityDays: sanitized.validityDays ? Number(sanitized.validityDays) : 30,
      description: sanitizeString(description || '', 1000),
      status: status === 'inactive' || isActive === false ? 'inactive' : 'active',
      isActive: isActive !== undefined ? Boolean(isActive) : status !== 'inactive',
      isFeatured: Boolean(sanitized.isFeatured),

      // Bandwidth & Speed Customization
      downloadSpeed: downloadVal || undefined,
      uploadSpeed: sanitized.uploadSpeed ? Number(sanitized.uploadSpeed) : undefined,
      speedUnit,
      isSymmetrical: sanitized.isSymmetrical !== undefined ? Boolean(sanitized.isSymmetrical) : true,
      burstSpeed: sanitized.burstSpeed ? sanitizeString(sanitized.burstSpeed, 50) : undefined,
      nightSpeedBoost: Boolean(sanitized.nightSpeedBoost),
      nightSpeedDetails: sanitized.nightSpeedDetails ? sanitizeString(sanitized.nightSpeedDetails, 100) : undefined,

      // Data Quota & FUP
      dataLimitType: sanitized.dataLimitType || 'unlimited',
      monthlyQuotaGB: sanitized.monthlyQuotaGB ? Number(sanitized.monthlyQuotaGB) : undefined,
      postFupSpeed: sanitized.postFupSpeed ? sanitizeString(sanitized.postFupSpeed, 30) : undefined,

      // Connection Medium & Network Profile
      connectionType: sanitized.connectionType || 'ftth',
      mikrotikProfile: sanitized.mikrotikProfile ? sanitizeString(sanitized.mikrotikProfile, 60) : undefined,
      ipAllocation: sanitized.ipAllocation || 'dynamic_cgnat',
      priorityQoS: sanitized.priorityQoS || 'normal',

      // Commercial & Defaults
      taxIncluded: Boolean(sanitized.taxIncluded),
      taxPercentage: sanitized.taxPercentage ? Number(sanitized.taxPercentage) : undefined,
      defaultRouterPrice: sanitized.defaultRouterPrice !== undefined ? Number(sanitized.defaultRouterPrice) : undefined,
      defaultInstallationCharge: sanitized.defaultInstallationCharge !== undefined ? Number(sanitized.defaultInstallationCharge) : undefined,

      // Visuals & Features
      badgeText: sanitized.badgeText ? sanitizeString(sanitized.badgeText, 40) : undefined,
      colorTheme: sanitized.colorTheme || 'cyan',
      features: Array.isArray(sanitized.features) ? sanitized.features.map((f: any) => String(f).trim()).filter(Boolean) : undefined,
      adminNotes: sanitized.adminNotes ? sanitizeString(sanitized.adminNotes, 500) : undefined,
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });

    res.status(201).json({ message: 'Package created successfully.', package: pkg });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create package.' });
  }
});

apiRouter.put('/packages/:id', authenticate, requirePermission('manage_packages'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    if (sanitized.monthlyPrice !== undefined) {
      sanitized.monthlyPrice = parseSafeAmount(sanitized.monthlyPrice, 0, 500_000);
    }
    if (sanitized.isActive !== undefined && sanitized.status === undefined) {
      sanitized.status = sanitized.isActive ? 'active' : 'inactive';
    }
    const updated = dbService.updatePackage(req.params.id, sanitized, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Package updated successfully.', package: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update package.' });
  }
});

apiRouter.delete('/packages/:id', authenticate, requirePermission('manage_packages'), (req: AuthenticatedRequest, res: Response) => {
  try {
    dbService.deletePackage(req.params.id, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ success: true, message: 'Package deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete package.' });
  }
});

// -------------------------------------------------------------
// BILLING & INVOICES
// -------------------------------------------------------------

apiRouter.get('/invoices', authenticate, requirePermission('view_billing'), (req: Request, res: Response) => {
  try {
    let invoices = dbService.getInvoices();
    const { search, status, customerId } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      invoices = invoices.filter(inv =>
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.customerName || '').toLowerCase().includes(q) ||
        (inv.subscriberId || '').toLowerCase().includes(q)
      );
    }

    if (status && typeof status === 'string') {
      invoices = invoices.filter(inv => inv.paymentStatus === status);
    }

    if (customerId && typeof customerId === 'string') {
      invoices = invoices.filter(inv => inv.customerId === customerId);
    }

    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load invoices.' });
  }
});

apiRouter.get('/invoices/:id', authenticate, requirePermission('view_billing'), (req: Request, res: Response) => {
  try {
    const invoice = dbService.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    const db = dbService.getDatabase();
    const payments = db.payments.filter(p => p.invoiceId === invoice.id);
    const settings = dbService.getSettings();

    res.json({ invoice, payments, settings });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve invoice details.' });
  }
});

apiRouter.post('/invoices', authenticate, requirePermission('create_invoice'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const { customerId, issueDate, dueDate } = sanitized;
    if (!customerId || !issueDate || !dueDate) {
      return res.status(400).json({ error: 'Customer ID, issue date, and due date are required.' });
    }

    const invoice = dbService.createInvoice({
      ...sanitized,
      monthlyPackageFee: parseSafeAmount(sanitized.monthlyPackageFee),
      routerCharges: parseSafeAmount(sanitized.routerCharges),
      installationCharges: parseSafeAmount(sanitized.installationCharges),
      wireCharges: parseSafeAmount(sanitized.wireCharges),
      otherCharges: parseSafeAmount(sanitized.otherCharges),
      discount: parseSafeAmount(sanitized.discount),
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });

    res.status(201).json({ message: 'Invoice generated successfully.', invoice });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create invoice.' });
  }
});

// -------------------------------------------------------------
// PAYMENTS & THERMAL RECEIPTS
// -------------------------------------------------------------

apiRouter.get('/payments', authenticate, requirePermission('view_payments'), (req: Request, res: Response) => {
  try {
    let payments = dbService.getPayments();
    const { search, customerId, method } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      payments = payments.filter(p =>
        (p.receiptNumber || '').toLowerCase().includes(q) ||
        (p.customerName || '').toLowerCase().includes(q) ||
        (p.subscriberId || '').toLowerCase().includes(q) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
      );
    }

    if (customerId && typeof customerId === 'string') {
      payments = payments.filter(p => p.customerId === customerId);
    }

    if (method && typeof method === 'string') {
      payments = payments.filter(p => p.paymentMethod === method);
    }

    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve payments.' });
  }
});

apiRouter.post('/payments', authenticate, requirePermission('receive_payment'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const { invoiceId, amount, paymentMethod, paymentDate, referenceNumber, notes } = sanitized;
    const payAmount = parseSafeAmount(amount);

    if (!invoiceId || payAmount <= 0) {
      return res.status(400).json({ error: 'Valid invoice ID and positive payment amount are required.' });
    }

    const result = dbService.recordPayment({
      invoiceId,
      amount: payAmount,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'cash',
      referenceNumber: sanitizeString(referenceNumber, 100),
      notes: sanitizeString(notes, 500),
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });

    res.status(201).json({
      message: 'Payment recorded and balance settled successfully.',
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to record payment.' });
  }
});

// Receipt payload endpoint formatted specifically for Thermal & A4 printing
apiRouter.get('/receipts/:id', authenticate, requirePermission('print_receipt'), (req: Request, res: Response) => {
  try {
    const db = dbService.getDatabase();
    let payment = db.payments.find(p => p.id === req.params.id || p.receiptNumber === req.params.id);
    let invoice = payment ? db.invoices.find(inv => inv.id === payment?.invoiceId) : db.invoices.find(inv => inv.id === req.params.id || inv.invoiceNumber === req.params.id);
    
    if (!payment && invoice) {
      payment = db.payments.filter(p => p.invoiceId === invoice.id).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
    }

    if (!payment && !invoice) {
      return res.status(404).json({ error: 'Bill or receipt not found.' });
    }

    const customerId = payment?.customerId || invoice?.customerId;
    const customer = db.customers.find(c => c.id === customerId);
    const pkg = customer ? db.packages.find(p => p.id === customer.packageId) : undefined;
    const settings = dbService.getSettings();

    const receiptData = {
      receiptNumber: payment?.receiptNumber || invoice?.invoiceNumber || 'BILL-001',
      paymentDate: payment?.paymentDate || invoice?.createdAt || new Date().toISOString(),
      invoiceNumber: invoice?.invoiceNumber || 'INV-001',
      invoiceDate: invoice?.createdAt || payment?.paymentDate || new Date().toISOString(),
      dueDate: invoice?.dueDate,
      customerName: customer?.name || payment?.customerName || invoice?.customerName || 'Walk-in Customer',
      customerId: customer?.id || payment?.customerId || invoice?.customerId || '',
      subscriberId: customer?.subscriberId || payment?.subscriberId || invoice?.subscriberId || 'ACC-001',
      customerContact: customer?.contactNumber || invoice?.customerContact || '',
      customerAddress: customer?.address || invoice?.customerAddress || '',
      packageName: customer?.packageName || invoice?.packageName || 'Standard Broadband',
      speed: pkg?.speed || '',
      expiryDate: customer?.expiryDate,
      receivedByName: payment?.receivedByName || (req as any).user?.name || 'Staff',
      amount: payment ? payment.amount : (invoice ? invoice.paidAmount : 0),
      totalAmount: invoice ? invoice.totalAmount : (payment ? payment.amount : 0),
      subtotal: invoice ? (invoice.subtotal || invoice.totalAmount) : (payment ? payment.amount : 0),
      discount: invoice?.discount || 0,
      previousBalance: customer?.balance || 0,
      remainingBalance: invoice ? invoice.remainingAmount : 0,
      paymentMethod: payment?.paymentMethod || 'cash',
      referenceNumber: payment?.referenceNumber || '',
      remarks: payment?.notes || invoice?.notes || '',
      status: invoice?.status || 'paid',
      items: invoice?.items && invoice.items.length > 0 
        ? invoice.items 
        : [
            {
              description: invoice?.packageName ? `${invoice.packageName} Subscription` : 'Internet Broadband Monthly Fee',
              quantity: 1,
              unitPrice: invoice?.totalAmount || payment?.amount || 0,
              amount: invoice?.totalAmount || payment?.amount || 0,
            }
          ],
      settings,
    };

    res.json(receiptData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to format receipt.' });
  }
});

// -------------------------------------------------------------
// EXPENSES MANAGEMENT
// -------------------------------------------------------------

apiRouter.get('/expenses', authenticate, requirePermission('view_expenses'), (req: Request, res: Response) => {
  try {
    let expenses = dbService.getExpenses();
    const { categoryId, startDate, endDate, search, expenseType, status } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      expenses = expenses.filter(e =>
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.categoryName && e.categoryName.toLowerCase().includes(q)) ||
        (e.vendorOrPayee && e.vendorOrPayee.toLowerCase().includes(q)) ||
        (e.payee && e.payee.toLowerCase().includes(q)) ||
        (e.referenceNumber && e.referenceNumber.toLowerCase().includes(q))
      );
    }

    if (categoryId && typeof categoryId === 'string' && categoryId !== 'all') {
      expenses = expenses.filter(e => e.categoryId === categoryId);
    }

    if (expenseType && typeof expenseType === 'string' && expenseType !== 'all') {
      expenses = expenses.filter(e => e.expenseType === expenseType);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      expenses = expenses.filter(e => e.status === status);
    }

    if (startDate && typeof startDate === 'string') {
      expenses = expenses.filter(e => e.date >= startDate);
    }

    if (endDate && typeof endDate === 'string') {
      expenses = expenses.filter(e => e.date <= endDate);
    }

    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load expenses.' });
  }
});

apiRouter.get('/expenses/categories', authenticate, (req: Request, res: Response) => {
  try {
    const categories = dbService.getExpenseCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve expense categories.' });
  }
});

apiRouter.post('/expenses/categories', authenticate, requirePermission('create_expense'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, color, icon, budgetMonthly } = sanitizeObject(req.body);
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required.' });

    const cat = dbService.createExpenseCategory({
      name: sanitizeString(name, 100).trim(),
      description: sanitizeString(description, 300),
      color: sanitizeString(color, 50),
      icon: sanitizeString(icon, 50),
      budgetMonthly: budgetMonthly ? parseSafeAmount(budgetMonthly) : undefined,
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.status(201).json(cat);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create expense category.' });
  }
});

apiRouter.put('/expenses/categories/:id', authenticate, requirePermission('create_expense'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    if (sanitized.budgetMonthly !== undefined) {
      sanitized.budgetMonthly = parseSafeAmount(sanitized.budgetMonthly);
    }
    const updated = dbService.updateExpenseCategory(req.params.id, sanitized, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Category updated successfully.', category: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update expense category.' });
  }
});

apiRouter.delete('/expenses/categories/:id', authenticate, requirePermission('delete_expense'), (req: AuthenticatedRequest, res: Response) => {
  try {
    dbService.deleteExpenseCategory(req.params.id, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Expense category deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete expense category.' });
  }
});

apiRouter.post('/expenses', authenticate, requirePermission('create_expense'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const {
      categoryId,
      customCategoryName,
      description,
      title,
      amount,
      date,
      paymentMethod,
      vendorOrPayee,
      payee,
      referenceNumber,
      notes,
      expenseType,
      items,
      taxAmount,
      taxRatePercent,
      isRecurring,
      recurrenceInterval,
      tags,
      status,
    } = sanitized;

    const desc = sanitizeString(description || title || (Array.isArray(items) && items.length > 0 ? items[0].description : ''), 300).trim();
    const vendor = sanitizeString(vendorOrPayee || payee, 150).trim();
    const expAmount = parseSafeAmount(amount);

    if (!desc) {
      return res.status(400).json({ error: 'Expense description/title is required.' });
    }
    if (expAmount <= 0) {
      return res.status(400).json({ error: 'Expense amount must be a positive number greater than 0.' });
    }

    let finalCategoryId = categoryId;
    if ((!finalCategoryId || finalCategoryId === 'new_custom' || finalCategoryId === 'custom') && customCategoryName) {
      const customCat = dbService.findOrCreateExpenseCategory(customCategoryName, {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.roleName,
      });
      finalCategoryId = customCat.id;
    } else if (!finalCategoryId) {
      const categories = dbService.getExpenseCategories();
      finalCategoryId = categories[0]?.id || 'cat_office';
    }

    const expense = dbService.createExpense({
      categoryId: finalCategoryId,
      description: desc,
      title: desc,
      amount: expAmount,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'cash',
      vendorOrPayee: vendor,
      payee: vendor,
      referenceNumber: sanitizeString(referenceNumber, 100),
      notes: sanitizeString(notes, 500),
      expenseType: sanitizeString(expenseType, 50) || 'operational',
      taxAmount: taxAmount ? parseSafeAmount(taxAmount) : undefined,
      taxRatePercent: taxRatePercent ? parseSafeAmount(taxRatePercent) : undefined,
      items: Array.isArray(items) ? items : undefined,
      isRecurring: Boolean(isRecurring),
      recurrenceInterval: sanitizeString(recurrenceInterval, 50),
      tags: Array.isArray(tags) ? tags.map(t => sanitizeString(t, 50)) : undefined,
      status: sanitizeString(status, 50) || 'paid',
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });

    res.status(201).json({ message: 'Expense recorded successfully.', expense });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to record expense.' });
  }
});

apiRouter.put('/expenses/:id', authenticate, requirePermission('edit_expense'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    if (sanitized.amount !== undefined) {
      sanitized.amount = parseSafeAmount(sanitized.amount);
    }
    if (sanitized.customCategoryName && (!sanitized.categoryId || sanitized.categoryId === 'new_custom')) {
      const customCat = dbService.findOrCreateExpenseCategory(sanitized.customCategoryName, {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.roleName,
      });
      sanitized.categoryId = customCat.id;
    }
    if (sanitized.title && !sanitized.description) {
      sanitized.description = sanitized.title;
    }
    if (sanitized.payee && !sanitized.vendorOrPayee) {
      sanitized.vendorOrPayee = sanitized.payee;
    }

    const updated = dbService.updateExpense(req.params.id, sanitized, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Expense updated successfully.', expense: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update expense.' });
  }
});

apiRouter.delete('/expenses/:id', authenticate, requirePermission('delete_expense'), (req: AuthenticatedRequest, res: Response) => {
  try {
    dbService.deleteExpense(req.params.id, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Expense deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete expense.' });
  }
});

// -------------------------------------------------------------
// STAFF & SALARY DISBURSEMENT
// -------------------------------------------------------------

apiRouter.get('/staff', authenticate, requirePermission('view_staff'), (req: Request, res: Response) => {
  try {
    const staff = dbService.getStaff();
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve staff members.' });
  }
});

apiRouter.post('/staff', authenticate, requirePermission('manage_staff'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const { name, contact, designation, basicSalary, cnic, joiningDate, notes, status } = sanitized;
    const salaryNum = parseSafeAmount(basicSalary);

    if (!name || !contact || !designation || salaryNum <= 0) {
      return res.status(400).json({ error: 'Staff name, contact number, designation, and valid basic salary are required.' });
    }

    const newStaff = dbService.createStaff({
      name: sanitizeString(name, 100),
      contact: sanitizeString(contact, 50),
      designation: sanitizeString(designation, 100),
      basicSalary: salaryNum,
      cnic: sanitizeString(cnic, 30),
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      status: status === 'inactive' ? 'inactive' : 'active',
      notes: sanitizeString(notes, 500),
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });

    res.status(201).json({ message: 'Staff member added successfully.', staff: newStaff });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to add staff member.' });
  }
});

apiRouter.put('/staff/:id', authenticate, requirePermission('manage_staff'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    if (sanitized.basicSalary !== undefined) {
      sanitized.basicSalary = parseSafeAmount(sanitized.basicSalary);
    }
    const updated = dbService.updateStaff(req.params.id, sanitized, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Staff record updated successfully.', staff: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update staff record.' });
  }
});

apiRouter.get('/salaries', authenticate, requirePermission('view_salaries'), (req: Request, res: Response) => {
  try {
    let salaries = dbService.getSalaryPayments();
    const { month, staffId } = req.query;

    if (month && typeof month === 'string') {
      salaries = salaries.filter(s => s.salaryMonth === month);
    }

    if (staffId && typeof staffId === 'string') {
      salaries = salaries.filter(s => s.staffId === staffId);
    }

    res.json(salaries);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve salary payments.' });
  }
});

apiRouter.post('/salaries', authenticate, requirePermission('manage_salaries'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const staffId = sanitized.staffId;
    const salaryMonth = sanitized.salaryMonth || sanitized.month;
    const paidAmount = sanitized.paidAmount !== undefined
      ? sanitized.paidAmount
      : (sanitized.netSalary !== undefined
          ? sanitized.netSalary
          : sanitized.paid);
    const basicSalary = sanitized.basicSalary !== undefined ? sanitized.basicSalary : 0;
    const bonus = sanitized.bonus !== undefined ? sanitized.bonus : 0;
    const deduction = sanitized.deduction !== undefined
      ? sanitized.deduction
      : (sanitized.deductions !== undefined ? sanitized.deductions : 0);
    const paymentDate = sanitized.paymentDate;
    const paymentMethod = sanitized.paymentMethod;
    const notes = sanitized.notes || sanitized.remarks;

    const paidNum = parseSafeAmount(paidAmount);

    if (!staffId || !salaryMonth || paidAmount === undefined) {
      return res.status(400).json({ error: 'Staff member, salary month (YYYY-MM), and payment amount are required.' });
    }

    const result = dbService.paySalary({
      staffId,
      salaryMonth,
      basicSalary: parseSafeAmount(basicSalary),
      bonus: parseSafeAmount(bonus),
      deduction: parseSafeAmount(deduction),
      paidAmount: paidNum,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Bank Transfer',
      notes: sanitizeString(notes, 500),
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });

    res.status(201).json({
      message: 'Staff salary disbursed and logged to financial expenses.',
      ...result.salary,
      ...result,
      salaryRecord: result.salary,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to process salary payment.' });
  }
});

// -------------------------------------------------------------
// REPORTS & FINANCIAL ANALYTICS
// -------------------------------------------------------------

apiRouter.get('/reports/daily', authenticate, requirePermission('view_reports'), (req: Request, res: Response) => {
  try {
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const report = dbService.getDailyReport(dateStr);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate daily report.' });
  }
});

apiRouter.get('/reports/monthly', authenticate, requirePermission('view_reports'), (req: Request, res: Response) => {
  try {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStr = (req.query.month as string) || currentMonthStr;
    const report = dbService.getMonthlyReport(monthStr);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate monthly report.' });
  }
});

apiRouter.get('/reports/profit-loss', authenticate, requirePermission('view_reports'), (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const todayStr = now.toISOString().split('T')[0];

    const startDate = (req.query.startDate as string) || startOfMonth;
    const endDate = (req.query.endDate as string) || todayStr;

    const report = dbService.getProfitLossStatement(startDate, endDate);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate profit and loss statement.' });
  }
});

// -------------------------------------------------------------
// USER & ROLE MANAGEMENT (SUPER ADMIN / ADMIN)
// -------------------------------------------------------------

apiRouter.get('/users', authenticate, requirePermission('manage_users'), (req: Request, res: Response) => {
  try {
    const users = dbService.getUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve users list.' });
  }
});

apiRouter.post('/users', authenticate, requirePermission('manage_users'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const { name, username, email, phone, employeeId, jobTitle, roleId, password, status, customPermissions } = sanitized;
    
    if (!name || !username || !email || !roleId || !password) {
      return res.status(400).json({ error: 'Name, username, email, role, and password are required.' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({ error: 'Username must be 3-30 characters with letters, numbers, hyphens or underscores only.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const passwordValidation = isStrongPassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    const newUser = dbService.createUser({
      name: sanitizeString(name, 100),
      username: sanitizeString(username, 30),
      email: sanitizeString(email, 150),
      phone: sanitizeString(phone, 50),
      employeeId: sanitizeString(employeeId, 50),
      jobTitle: sanitizeString(jobTitle, 100),
      roleId,
      password,
      status: status === 'inactive' ? 'inactive' : 'active',
      customPermissions,
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });

    res.status(201).json({ message: 'Employee account created successfully.', user: newUser });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create user account.' });
  }
});

apiRouter.put('/users/:id', authenticate, requirePermission('manage_users'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    if (sanitized.password) {
      const passwordValidation = isStrongPassword(sanitized.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
    }
    const updated = dbService.updateUser(req.params.id, sanitized, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Employee updated successfully.', user: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update employee.' });
  }
});

apiRouter.delete('/users/:id', authenticate, requirePermission('manage_users'), (req: AuthenticatedRequest, res: Response) => {
  try {
    dbService.deleteUser(req.params.id, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Employee account deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete employee account.' });
  }
});

apiRouter.post('/users/:id/reset-password', authenticate, requirePermission('manage_users'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { password } = req.body;
    const passwordValidation = isStrongPassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }
    dbService.resetUserPassword(req.params.id, password, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Password reset successfully for this employee.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to reset password.' });
  }
});

apiRouter.post('/users/:id/toggle-status', authenticate, requirePermission('manage_users'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = dbService.toggleUserStatus(req.params.id, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: `Employee status set to ${updated.status}`, user: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to toggle employee status.' });
  }
});

apiRouter.get('/roles', authenticate, (req: Request, res: Response) => {
  try {
    const roles = dbService.getRoles();
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve roles.' });
  }
});

apiRouter.get('/permissions', authenticate, (req: Request, res: Response) => {
  try {
    const permissions = dbService.getPermissions();
    res.json(permissions);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve permissions.' });
  }
});

apiRouter.post('/roles', authenticate, requirePermission('manage_roles'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const { name, description, permissions } = sanitized;
    if (!name || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Role name and permissions array are required.' });
    }

    const role = dbService.createRole({
      name: sanitizeString(name, 100),
      description: sanitizeString(description, 300),
      permissions,
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });

    res.status(201).json({ message: 'Role created successfully.', role });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create role.' });
  }
});

apiRouter.put('/roles/:id', authenticate, requirePermission('manage_roles'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const updated = dbService.updateRole(req.params.id, sanitized, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Role permissions updated successfully.', role: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update role.' });
  }
});

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------

apiRouter.get('/audit-logs', authenticate, requirePermission('view_audit_logs'), (req: Request, res: Response) => {
  try {
    let logs = dbService.getAuditLogs();
    const { search, entityType } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      logs = logs.filter(l =>
        (l.description || '').toLowerCase().includes(q) ||
        (l.userName || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q)
      );
    }

    if (entityType && typeof entityType === 'string') {
      logs = logs.filter(l => l.entityType === entityType);
    }

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

// -------------------------------------------------------------
// SETTINGS & DATABASE BACKUPS
// -------------------------------------------------------------

apiRouter.get('/settings', authenticate, (req: Request, res: Response) => {
  try {
    const settings = dbService.getSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

apiRouter.put('/settings', authenticate, requirePermission('manage_settings'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const updated = dbService.updateSettings(sanitized, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Company settings updated successfully.', settings: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update settings.' });
  }
});

apiRouter.post('/settings/backup', authenticate, requirePermission('manage_backups'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const backup = dbService.createBackup({
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Database backup snapshot created successfully.', backup });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate database backup.' });
  }
});

apiRouter.get('/settings/backups', authenticate, requirePermission('manage_backups'), (req: Request, res: Response) => {
  try {
    const backups = dbService.listBackups();
    res.json(backups);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list backups.' });
  }
});

apiRouter.post('/settings/restore', authenticate, requirePermission('manage_backups'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawFilename = typeof req.body?.filename === 'string' ? req.body.filename.trim() : '';
    if (!rawFilename || !isSafeBackupFilename(rawFilename)) {
      return res.status(400).json({ error: 'Invalid backup filename. Only alphanumeric .json backup filenames are permitted.' });
    }

    dbService.restoreBackup(rawFilename, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Database restored successfully from backup.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to restore database.' });
  }
});

apiRouter.post('/settings/clear-data', authenticate, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    dbService.clearAllData({
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'All operational data (customers, packages, invoices, payments, expenses, staff, payroll) cleared.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clear data.' });
  }
});

apiRouter.post('/settings/reset-seed', authenticate, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    dbService.resetToDefaultSeed({
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.roleName,
    });
    res.json({ message: 'Database has been reset to default demo records.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reset seed data.' });
  }
});
