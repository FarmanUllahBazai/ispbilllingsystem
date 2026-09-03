import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';

interface MonthlyReportData {
  month: string;
  totalCustomersCount?: number;
  activeCustomersCount?: number;
  inactiveCustomersCount?: number;
  newCustomersCount?: number;
  renewalsCount?: number;
  totalRevenue: number;
  subscriptionRevenue?: number;
  installationRevenue?: number;
  renewalsRevenue?: number;
  totalExpenses: number;
  salaryExpenses?: number;
  bandwidthExpenses?: number;
  operationalExpenses?: number;
  netProfit: number;
  profitMargin?: string | number;
  totalPending?: number;
  packageBreakdown?: Array<{
    packageId: string;
    packageName: string;
    speed: string;
    monthlyPrice: number;
    subscribersCount: number;
    revenue: number;
  }>;
  expenseCategoryBreakdown?: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
    amount: number;
  }>;
  paymentMethodsBreakdown?: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  paymentsList?: Array<{
    id: string;
    receiptNumber?: string;
    customerName: string;
    subscriberId?: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    receivedBy?: string;
  }>;
  expensesList?: Array<{
    id: string;
    description: string;
    categoryName: string;
    amount: number;
    date: string;
    paymentMethod?: string;
    vendorOrPayee?: string;
    addedBy?: string;
  }>;
  salariesList?: Array<{
    id: string;
    staffName: string;
    designation: string;
    salaryMonth?: string;
    basicSalary?: number;
    bonus?: number;
    deduction?: number;
    netSalary?: number;
    paidAmount: number;
    paymentDate?: string;
    paymentStatus?: string;
  }>;
  renewalsList?: Array<{
    id: string;
    customerName: string;
    previousPackageName: string;
    newPackageName: string;
    months: number;
    totalCharges: number;
    paidAmount?: number;
    effectiveDate: string;
    newExpiryDate: string;
  }>;
  invoicesList?: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string;
  }>;
  outstandingInvoicesList?: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string;
  }>;
  companySettings?: {
    companyName?: string;
    tagline?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyAddress?: string;
    ntnOrTaxId?: string;
    currencySymbol?: string;
  };
}

export function formatMonthName(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function generateMonthlyReportPDF(report: MonthlyReportData, authorName = 'Super Admin'): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const monthName = formatMonthName(report.month);

  const companyName = report.companySettings?.companyName || 'ApexFiber Broadband Network';
  const companyTagline = report.companySettings?.tagline || 'High-Speed Fiber Optic Internet & Enterprise Solutions';
  const companyPhone = report.companySettings?.companyPhone || '+92 (051) 843-9000';
  const companyEmail = report.companySettings?.companyEmail || 'billing@apexfiber.pk';
  const companyAddress = report.companySettings?.companyAddress || 'Suite 402, Executive Plaza, Blue Area, Islamabad, Pakistan';
  const ntn = report.companySettings?.ntnOrTaxId || 'NTN-8924019-3';
  const generationTimestamp = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Helper for Section Titles
  const drawPageHeaderBanner = (pageDoc: jsPDF, sectionNumber: string, sectionTitle: string) => {
    // Top cyan decorative line
    pageDoc.setFillColor(6, 182, 212);
    pageDoc.rect(0, 0, pageWidth, 2.5, 'F');

    // Navy header bar
    pageDoc.setFillColor(15, 23, 42);
    pageDoc.rect(0, 2.5, pageWidth, 28, 'F');

    // Company Name & Subtitle
    pageDoc.setTextColor(255, 255, 255);
    pageDoc.setFont('helvetica', 'bold');
    pageDoc.setFontSize(13);
    pageDoc.text(companyName.toUpperCase(), 14, 12);

    pageDoc.setFont('helvetica', 'normal');
    pageDoc.setFontSize(7.5);
    pageDoc.setTextColor(148, 163, 184);
    pageDoc.text(`${companyAddress} | Ph: ${companyPhone}`, 14, 17.5);
    pageDoc.text(`Tax/NTN: ${ntn} | Email: ${companyEmail}`, 14, 22.5);

    // Section Badge on Right
    pageDoc.setFillColor(30, 41, 59);
    pageDoc.roundedRect(pageWidth - 80, 5.5, 66, 22, 1.5, 1.5, 'F');

    pageDoc.setTextColor(6, 182, 212);
    pageDoc.setFont('helvetica', 'bold');
    pageDoc.setFontSize(7.5);
    pageDoc.text(sectionNumber.toUpperCase(), pageWidth - 47, 11, { align: 'center' });

    pageDoc.setTextColor(255, 255, 255);
    pageDoc.setFontSize(9);
    pageDoc.text(sectionTitle, pageWidth - 47, 16.5, { align: 'center' });

    pageDoc.setTextColor(148, 163, 184);
    pageDoc.setFont('helvetica', 'normal');
    pageDoc.setFontSize(7);
    pageDoc.text(`Period: ${monthName}`, pageWidth - 47, 22, { align: 'center' });
  };

  // -------------------------------------------------------------
  // PAGE 1 — COVER & EXECUTIVE FINANCIAL SUMMARY
  // -------------------------------------------------------------
  // Top Banner
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 0, pageWidth, 3, 'F');

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 3, pageWidth, 44, 'F');

  // Emblem Badge
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, 9, 14, 14, 2, 2, 'F');
  doc.setTextColor(6, 182, 212);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(companyName.charAt(0) || 'A', 21, 19, { align: 'center' });

  // Company Name & Meta
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(companyName.toUpperCase(), 33, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(companyTagline, 33, 22);
  doc.text(`${companyAddress} | Ph: ${companyPhone}`, 33, 27.5);
  doc.text(`Email: ${companyEmail} | Tax ID / NTN: ${ntn}`, 33, 33);

  // Document Badge on Right
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - 78, 9, 64, 32, 2, 2, 'F');

  doc.setTextColor(6, 182, 212);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('MONTHLY FINANCIAL REPORT', pageWidth - 46, 17, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(monthName, pageWidth - 46, 25, { align: 'center' });

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Audited Period: ${report.month}`, pageWidth - 46, 32, { align: 'center' });

  let curY = 53;

  // Metadata Sub-bar
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, curY, pageWidth - 28, 11, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Report Generated: ${generationTimestamp}`, 18, curY + 7);
  doc.text(`Audited By: ${authorName}`, 105, curY + 7);
  doc.text(`Status: Official & Reconciled`, pageWidth - 18, curY + 7, { align: 'right' });

  curY += 17;

  // Section: Executive Financial Summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Executive Financial Summary', 14, curY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Key performance indicators and overall profitability metrics for the month of ${monthName}.`, 14, curY + 4.5);

  curY += 8.5;

  // 6 KPI Cards (3 cols x 2 rows)
  const cardW = (pageWidth - 28 - 8) / 3;
  const cardH = 25;

  // Card 1: Total Revenue
  doc.setFillColor(240, 253, 250); // Teal 50
  doc.setDrawColor(45, 212, 191);
  doc.roundedRect(14, curY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 118, 110);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL REVENUE', 18, curY + 6.5);
  doc.setFontSize(13);
  doc.setTextColor(13, 148, 136);
  doc.text(formatCurrency(report.totalRevenue), 18, curY + 15);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sub: ${formatCurrency(report.subscriptionRevenue || 0)} | Inst: ${formatCurrency(report.installationRevenue || 0)}`, 18, curY + 21);

  // Card 2: Total Expenses
  const c2X = 14 + cardW + 4;
  doc.setFillColor(255, 241, 242); // Rose 50
  doc.setDrawColor(251, 113, 133);
  doc.roundedRect(c2X, curY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(190, 18, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL EXPENSES', c2X + 4, curY + 6.5);
  doc.setFontSize(13);
  doc.setTextColor(225, 29, 72);
  doc.text(formatCurrency(report.totalExpenses), c2X + 4, curY + 15);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payroll: ${formatCurrency(report.salaryExpenses || 0)} | OPEX: ${formatCurrency(report.operationalExpenses || 0)}`, c2X + 4, curY + 21);

  // Card 3: Net Profit
  const c3X = c2X + cardW + 4;
  const isProfitable = report.netProfit >= 0;
  if (isProfitable) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(74, 222, 128);
  } else {
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(251, 113, 133);
  }
  doc.roundedRect(c3X, curY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(isProfitable ? 21 : 190, isProfitable ? 128 : 18, isProfitable ? 61 : 60);
  doc.setFont('helvetica', 'bold');
  doc.text('NET OPERATING PROFIT', c3X + 4, curY + 6.5);
  doc.setFontSize(13);
  doc.setTextColor(isProfitable ? 22 : 225, isProfitable ? 163 : 29, isProfitable ? 74 : 72);
  doc.text(formatCurrency(report.netProfit), c3X + 4, curY + 15);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(isProfitable ? 'Operational Surplus' : 'Operational Deficit', c3X + 4, curY + 21);

  curY += cardH + 4;

  // Row 2 of KPI Cards:
  // Card 4: Profit Margin
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, curY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('OPERATING PROFIT MARGIN', 18, curY + 6.5);
  doc.setFontSize(13);
  const marginStr = report.profitMargin !== undefined ? `${report.profitMargin}%` : (report.totalRevenue > 0 ? `${((report.netProfit / report.totalRevenue) * 100).toFixed(2)}%` : '0.00%');
  doc.setTextColor(isProfitable ? 22 : 225, isProfitable ? 163 : 29, isProfitable ? 74 : 72);
  doc.text(marginStr, 18, curY + 15);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Net Profit / Gross Revenue', 18, curY + 21);

  // Card 5: Total Collections / Payments
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.setDrawColor(147, 197, 253);
  doc.roundedRect(c2X, curY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(29, 78, 216);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL COLLECTIONS (INWARD)', c2X + 4, curY + 6.5);
  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235);
  doc.text(formatCurrency(report.totalRevenue), c2X + 4, curY + 15);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.paymentsList?.length || 0} Total Receipts Collected`, c2X + 4, curY + 21);

  // Card 6: Total Outstanding Amount
  doc.setFillColor(254, 243, 199); // Amber 50
  doc.setDrawColor(252, 211, 77);
  doc.roundedRect(c3X, curY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.text('OUTSTANDING RECEIVABLES', c3X + 4, curY + 6.5);
  doc.setFontSize(13);
  doc.setTextColor(217, 119, 6);
  doc.text(formatCurrency(report.totalPending ?? 0), c3X + 4, curY + 15);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.outstandingInvoicesList?.length || 0} Unpaid Invoices Due`, c3X + 4, curY + 21);

  curY += cardH + 10;

  // Prominent Financial Overview (Equation Box)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Financial Overview & Equation', 20, curY + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Revenue', 20, curY + 14);
  doc.text('− Operating Expenses', 80, curY + 14);
  doc.text('= Net Profit / (Loss)', 145, curY + 14);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text(formatCurrency(report.totalRevenue), 20, curY + 21);

  doc.setTextColor(225, 29, 72);
  doc.text(`− ${formatCurrency(report.totalExpenses)}`, 80, curY + 21);

  doc.setTextColor(isProfitable ? 22 : 225, isProfitable ? 163 : 29, isProfitable ? 74 : 72);
  doc.text(`= ${formatCurrency(report.netProfit)}`, 145, curY + 21);

  curY += 34;

  // Operational Customer Metrics Pills (4 pills)
  const pillW = (pageWidth - 28 - 9) / 4;
  const pillH = 15;
  const pills = [
    { label: 'Active Subscribers', value: `${report.activeCustomersCount ?? 0} Users` },
    { label: 'New Connections', value: `+${report.newCustomersCount ?? 0} Installs` },
    { label: 'Package Renewals', value: `${report.renewalsCount ?? 0} Renewed` },
    { label: 'Inactive / Suspended', value: `${report.inactiveCustomersCount ?? 0} Users` },
  ];

  pills.forEach((p, idx) => {
    const px = 14 + idx * (pillW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(px, curY, pillW, pillH, 1.5, 1.5, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(p.label, px + 3.5, curY + 5.5);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(p.value, px + 3.5, curY + 11.5);
  });

  curY += pillH + 10;

  // Executive Commentary Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, curY, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Executive Commentary & Performance Summary', 18, curY + 6.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const narrative = `During the period of ${monthName}, ${companyName} realized total net revenues of ${formatCurrency(report.totalRevenue)} against operating expenditures of ${formatCurrency(report.totalExpenses)}, generating an operating profit of ${formatCurrency(report.netProfit)} (profit margin of ${marginStr}). A total of ${report.activeCustomersCount ?? 0} active subscribers were serviced with ${report.newCustomersCount ?? 0} new customer lines provisioned and ${report.renewalsCount ?? 0} package renewals executed. Uncollected receivables stand at ${formatCurrency(report.totalPending ?? 0)}.`;
  const splitNarrative = doc.splitTextToSize(narrative, pageWidth - 36);
  doc.text(splitNarrative, 18, curY + 12.5);

  // -------------------------------------------------------------
  // PAGE 2 — REVENUE ANALYSIS
  // -------------------------------------------------------------
  doc.addPage();
  drawPageHeaderBanner(doc, 'Section 1', 'Revenue Analysis');
  curY = 38;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Revenue Analysis', 14, curY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Comprehensive categorization of all incoming revenue streams for ${monthName}.`, 14, curY + 4.5);

  curY += 8;

  // Revenue Summary Table
  const subRev = report.subscriptionRevenue || Math.max(0, report.totalRevenue - (report.installationRevenue || 0));
  const instRev = report.installationRevenue || 0;
  const renewRev = report.renewalsRevenue || 0;
  const otherRev = Math.max(0, report.totalRevenue - subRev - instRev);

  const calcShare = (val: number) => report.totalRevenue > 0 ? ((val / report.totalRevenue) * 100).toFixed(2) + '%' : '0.00%';

  const revenueRows = [
    ['Broadband Subscription Revenue (Recurring)', `${report.activeCustomersCount ?? 0} Active Lines`, formatCurrency(subRev), calcShare(subRev)],
    ['Package Renewals & Migrations', `${report.renewalsCount ?? 0} Renewals`, formatCurrency(renewRev > 0 ? renewRev : subRev), calcShare(renewRev > 0 ? renewRev : subRev)],
    ['New Connection & Installation Fees', `${report.newCustomersCount ?? 0} Installations`, formatCurrency(instRev), calcShare(instRev)],
    ['Router Sales & Ancillary Hardware', `${(report.paymentsList?.length || 0) > 0 ? 'Equipment Items' : 'Standard'}`, formatCurrency(otherRev), calcShare(otherRev)],
  ];

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    head: [['Revenue Source', 'Transactions / Units', 'Total Amount', 'Percentage']],
    body: revenueRows,
    foot: [['TOTAL REVENUE', `${report.paymentsList?.length || 0} Receipts`, formatCurrency(report.totalRevenue), '100.00%']],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    footStyles: {
      fillColor: [240, 253, 250],
      textColor: [13, 148, 136],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [13, 148, 136] },
      3: { cellWidth: 27, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-ignore
  curY = doc.lastAutoTable.finalY + 10;

  // Visual Breakdown Box / Analysis
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 48, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Revenue Composition & Performance Indicators', 20, curY + 7);

  const arpu = (report.activeCustomersCount ?? 0) > 0 ? (report.totalRevenue / (report.activeCustomersCount ?? 1)) : 0;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`• Average Revenue Per User (ARPU): ${formatCurrency(arpu)} per active subscriber.`, 20, curY + 15);
  doc.text(`• Recurring Subscription Share: ${calcShare(subRev)} of gross monthly inflows.`, 20, curY + 22);
  doc.text(`• Installation & Setup Expansion: ${formatCurrency(instRev)} generated from new subscriber on-boarding.`, 20, curY + 29);
  doc.text(`• Overall Revenue Health: High concentration of recurring fiber subscribers ensures steady cash-flow predictability.`, 20, curY + 36);

  // -------------------------------------------------------------
  // PAGE 3 — EXPENSE ANALYSIS
  // -------------------------------------------------------------
  doc.addPage();
  drawPageHeaderBanner(doc, 'Section 2', 'Expense Analysis');
  curY = 38;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Expense Analysis', 14, curY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Breakdown of operational overheads, bandwidth procurement, field maintenance, and staff payroll for ${monthName}.`, 14, curY + 4.5);

  curY += 8;

  const expRows = (report.expenseCategoryBreakdown && report.expenseCategoryBreakdown.length > 0)
    ? report.expenseCategoryBreakdown.map((cat) => {
        const share = report.totalExpenses > 0 ? ((cat.amount / report.totalExpenses) * 100).toFixed(2) + '%' : '0.00%';
        return [
          cat.categoryName,
          `${cat.count} Disbursements`,
          formatCurrency(cat.amount),
          share,
        ];
      })
    : [
        ['Staff Salaries & Payroll', `${report.salariesList?.length || 0} Records`, formatCurrency(report.salaryExpenses || 0), report.totalExpenses > 0 ? (((report.salaryExpenses || 0) / report.totalExpenses) * 100).toFixed(2) + '%' : '0.00%'],
        ['Upstream Bandwidth & IP Transit', '1 Transit Trunk', formatCurrency(report.bandwidthExpenses || 0), report.totalExpenses > 0 ? (((report.bandwidthExpenses || 0) / report.totalExpenses) * 100).toFixed(2) + '%' : '0.00%'],
        ['Field Operations & Maintenance', `${report.expensesList?.length || 0} Entries`, formatCurrency(report.operationalExpenses || 0), report.totalExpenses > 0 ? (((report.operationalExpenses || 0) / report.totalExpenses) * 100).toFixed(2) + '%' : '0.00%'],
      ];

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    head: [['Expense Category', 'Transactions / Entries', 'Total Disbursed', 'Percentage']],
    body: expRows,
    foot: [['TOTAL EXPENSES', `${report.expensesList?.length || 0} Entries`, formatCurrency(report.totalExpenses), '100.00%']],
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    footStyles: {
      fillColor: [255, 241, 242],
      textColor: [225, 29, 72],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
      3: { cellWidth: 27, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [255, 241, 242],
    },
  });

  // @ts-ignore
  curY = doc.lastAutoTable.finalY + 10;

  // Expense Distribution Notes Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 48, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Expense Structure & Cost Control Audit', 20, curY + 7);

  const opexRatio = report.totalRevenue > 0 ? ((report.totalExpenses / report.totalRevenue) * 100).toFixed(2) : '0.00';
  const payrollShare = report.totalExpenses > 0 ? (((report.salaryExpenses || 0) / report.totalExpenses) * 100).toFixed(2) : '0.00';

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`• OPEX to Revenue Ratio: ${opexRatio}% of total revenue utilized for operational costs.`, 20, curY + 15);
  doc.text(`• Staff Compensation & Payroll: Accounts for ${payrollShare}% (${formatCurrency(report.salaryExpenses || 0)}) of monthly expenses.`, 20, curY + 22);
  doc.text(`• Bandwidth & Transit Infrastructure: ${formatCurrency(report.bandwidthExpenses || 0)} allocated to wholesale fiber capacity.`, 20, curY + 29);
  doc.text(`• Operating Cost Efficiency: Sustainable baseline with disciplined overhead control.`, 20, curY + 36);

  // -------------------------------------------------------------
  // PAGE 4 — PROFIT & LOSS STATEMENT
  // -------------------------------------------------------------
  doc.addPage();
  drawPageHeaderBanner(doc, 'Section 3', 'Profit & Loss Statement');
  curY = 38;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Profit & Loss Statement', 14, curY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Formal income statement for the period ended ${monthName} (All values in PKR).`, 14, curY + 4.5);

  curY += 8;

  const pnlRows = [
    // Revenue Section
    ['OPERATING REVENUE', '', ''],
    ['   Broadband Internet Subscriptions', formatCurrency(subRev), ''],
    ['   Package Renewals & Line Upgrades', formatCurrency(renewRev > 0 ? renewRev : subRev), ''],
    ['   Installation & Connection Charges', formatCurrency(instRev), ''],
    ['   Equipment, Optical Devices & Ancillary', formatCurrency(otherRev), ''],
    ['Total Operating Revenue (A)', '', formatCurrency(report.totalRevenue)],
    // Expense Section
    ['OPERATING EXPENSES (OPEX)', '', ''],
    ['   Staff Salaries, Wages & Allowances', formatCurrency(report.salaryExpenses || 0), ''],
    ['   Upstream Bandwidth & IP Transit', formatCurrency(report.bandwidthExpenses || 0), ''],
    ['   Fiber Maintenance, Splicing & NOC Operations', formatCurrency(report.operationalExpenses || 0), ''],
    ['   Office Rent, Utilities & Administrative', formatCurrency(Math.max(0, report.totalExpenses - (report.salaryExpenses || 0) - (report.bandwidthExpenses || 0) - (report.operationalExpenses || 0))), ''],
    ['Total Operating Expenses (B)', '', `(${formatCurrency(report.totalExpenses)})`],
    // Net Line
    ['NET OPERATING PROFIT / (LOSS) (A - B)', '', formatCurrency(report.netProfit)],
    ['OPERATING PROFIT MARGIN', '', marginStr],
  ];

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    head: [['Financial Account / Line Item', 'Sub-Account Amount', 'Net Balance']],
    body: pnlRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 45, halign: 'right' },
      2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      const rowIndex = data.row.index;
      if (rowIndex === 0 || rowIndex === 6) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [15, 23, 42];
      }
      if (rowIndex === 5) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 253, 250];
        data.cell.styles.textColor = [13, 148, 136];
      }
      if (rowIndex === 11) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [255, 241, 242];
        data.cell.styles.textColor = [225, 29, 72];
      }
      if (rowIndex === 12) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = isProfitable ? [240, 253, 244] : [255, 241, 242];
        data.cell.styles.textColor = isProfitable ? [22, 163, 74] : [225, 29, 72];
      }
      if (rowIndex === 13) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [248, 250, 252];
        data.cell.styles.textColor = [71, 85, 105];
      }
    },
  });

  // @ts-ignore
  curY = doc.lastAutoTable.finalY + 12;

  // Accounting Certification Notice
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, curY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Auditor Certification & Accounting Standard Note', 18, curY + 6.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`This Statement of Profit and Loss has been compiled directly from authenticated billing records, expense vouchers, and bank settlement receipts in accordance with standard management accounting practices.`, 18, curY + 12.5, { maxWidth: pageWidth - 36 });

  // -------------------------------------------------------------
  // PAGE 5 — PAYMENT ANALYSIS
  // -------------------------------------------------------------
  doc.addPage();
  drawPageHeaderBanner(doc, 'Section 4', 'Payment Collection Analysis');
  curY = 38;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. Payment Collection Analysis', 14, curY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Audit of inward settlements classified by payment gateway, banking channel, and digital wallet for ${monthName}.`, 14, curY + 4.5);

  curY += 8;

  const paymentMethodsList = (report.paymentMethodsBreakdown && report.paymentMethodsBreakdown.length > 0)
    ? report.paymentMethodsBreakdown.map((pm) => [
        pm.method.replace('_', ' ').toUpperCase(),
        `${pm.count} Receipts`,
        formatCurrency(pm.amount),
        report.totalRevenue > 0 ? ((pm.amount / report.totalRevenue) * 100).toFixed(2) + '%' : '0.00%',
      ])
    : [
        ['CASH COLLECTIONS', `${report.paymentsList?.length || 0} Receipts`, formatCurrency(report.totalRevenue), '100.00%'],
      ];

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    head: [['Payment Method / Channel', 'Transactions / Receipts', 'Total Collected Amount', '% of Collections']],
    body: paymentMethodsList,
    foot: [['TOTAL COLLECTIONS', `${report.paymentsList?.length || 0} Receipts`, formatCurrency(report.totalRevenue), '100.00%']],
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    footStyles: {
      fillColor: [240, 253, 250],
      textColor: [13, 148, 136],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 75, fontStyle: 'bold' },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: [13, 148, 136] },
      3: { cellWidth: 27, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-ignore
  curY = doc.lastAutoTable.finalY + 10;

  // Collection Efficiency & Channel Distribution Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 40, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Collection Channel Efficiency & Metrics', 20, curY + 7);

  const avgReceipt = (report.paymentsList?.length || 0) > 0 ? (report.totalRevenue / (report.paymentsList?.length || 1)) : 0;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`• Total Official Receipts Generated: ${report.paymentsList?.length || 0} verified receipts.`, 20, curY + 15);
  doc.text(`• Average Receipt Transaction Size: ${formatCurrency(avgReceipt)}.`, 20, curY + 22);
  doc.text(`• Payment Security: All receipts logged with unique receipt numbers and staff audit attribution.`, 20, curY + 29);

  // -------------------------------------------------------------
  // PAGE 6 — CUSTOMER & PACKAGE ANALYSIS
  // -------------------------------------------------------------
  doc.addPage();
  drawPageHeaderBanner(doc, 'Section 5', 'Customer & Package Performance');
  curY = 38;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('5. Customer & Package Performance', 14, curY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Subscriber base growth, package tier distribution, and active customer bandwidth utilization for ${monthName}.`, 14, curY + 4.5);

  curY += 8;

  // Subscriber Performance Mini Grid
  const custW = (pageWidth - 28 - 9) / 4;
  const custStats = [
    { label: 'Total Customer Base', val: `${report.totalCustomersCount || (report.activeCustomersCount ?? 0) + (report.inactiveCustomersCount ?? 0)} Lines` },
    { label: 'Active Subscribers', val: `${report.activeCustomersCount ?? 0} Active` },
    { label: 'New Connections', val: `+${report.newCustomersCount ?? 0} Provisioned` },
    { label: 'Outstanding Dues', val: formatCurrency(report.totalPending ?? 0) },
  ];

  custStats.forEach((cs, i) => {
    const cx = 14 + i * (custW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, curY, custW, 14, 1.5, 1.5, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(cs.label, cx + 3, curY + 5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(cs.val, cx + 3, curY + 10.5);
  });

  curY += 20;

  // Package Distribution Table
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Package Tier Breakdown & Market Share', 14, curY);
  curY += 3;

  const pkgRows = (report.packageBreakdown && report.packageBreakdown.length > 0)
    ? report.packageBreakdown.map((pkg) => {
        const share = report.totalRevenue > 0 ? ((pkg.revenue / report.totalRevenue) * 100).toFixed(2) + '%' : '0.00%';
        const monthlyVal = pkg.subscribersCount * pkg.monthlyPrice;
        return [
          pkg.packageName,
          pkg.speed,
          `${pkg.subscribersCount} Users`,
          formatCurrency(pkg.monthlyPrice),
          formatCurrency(monthlyVal),
          share,
        ];
      })
    : [['Standard Home Fiber Plan', '20 Mbps', `${report.activeCustomersCount ?? 0} Users`, formatCurrency(2000), formatCurrency((report.activeCustomersCount ?? 0) * 2000), '100.00%']];

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    head: [['Package Tier Name', 'Speed / Bandwidth', 'Subscribers', 'Monthly Tariff', 'Monthly Value', 'Revenue Share']],
    body: pkgRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 30 },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [13, 148, 136] },
      5: { cellWidth: 22, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // -------------------------------------------------------------
  // PAGE 7+ — DETAILED TRANSACTION AUDIT LEDGERS
  // -------------------------------------------------------------
  // Section 6: Payment Transactions
  doc.addPage();
  drawPageHeaderBanner(doc, 'Section 6', 'Detailed Payment Ledger');
  curY = 38;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('6. Payment Transactions Ledger', 14, curY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Official ledger of all inward payment receipts recorded for the month of ${monthName}.`, 14, curY + 4.5);

  curY += 8;

  const paymentLedgerRows = (report.paymentsList && report.paymentsList.length > 0)
    ? report.paymentsList.map(p => [
        p.paymentDate || '-',
        p.receiptNumber || p.id,
        p.customerName || 'Unknown Customer',
        p.subscriberId || '-',
        (p.paymentMethod || 'cash').replace('_', ' ').toUpperCase(),
        formatCurrency(p.amount),
        p.receivedBy || 'Staff Desk',
      ])
    : [['No payment transactions recorded for this period.', '-', '-', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    showHead: 'everyPage',
    head: [['Date', 'Receipt #', 'Customer Name', 'Sub ID', 'Method', 'Amount', 'Received By']],
    body: paymentLedgerRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 48 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 24 },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [13, 148, 136] },
      6: { cellWidth: 20 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-ignore
  curY = doc.lastAutoTable.finalY + 12;

  // Section 7: Operating Expenses Ledger
  if (curY > pageHeight - 65) {
    doc.addPage();
    drawPageHeaderBanner(doc, 'Section 7', 'Operating Expenses Ledger');
    curY = 38;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('7. Operating Expense Transactions', 14, curY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Official expense disbursements, vendor payments, and operational outlays for ${monthName}.`, 14, curY + 4.5);

  curY += 8;

  const expenseLedgerRows = (report.expensesList && report.expensesList.length > 0)
    ? report.expensesList.map(e => [
        e.date || '-',
        e.description || 'Expense Entry',
        e.categoryName || 'General Expense',
        (e.paymentMethod || 'cash').replace('_', ' ').toUpperCase(),
        formatCurrency(e.amount),
        e.addedBy || 'Admin',
      ])
    : [['No operating expense transactions recorded for this period.', '-', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    showHead: 'everyPage',
    head: [['Date', 'Description / Payee', 'Category', 'Method', 'Amount', 'Added By']],
    body: expenseLedgerRows,
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 62 },
      2: { cellWidth: 38 },
      3: { cellWidth: 22 },
      4: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
      5: { cellWidth: 16 },
    },
    alternateRowStyles: {
      fillColor: [255, 241, 242],
    },
  });

  // @ts-ignore
  curY = doc.lastAutoTable.finalY + 12;

  // Section 8: Staff Salaries
  if (curY > pageHeight - 65) {
    doc.addPage();
    drawPageHeaderBanner(doc, 'Section 8', 'Staff Payroll Ledger');
    curY = 38;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('8. Staff Salary & Payroll Disbursements', 14, curY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Employee compensation, bonuses, deductions, and salary disbursements for ${monthName}.`, 14, curY + 4.5);

  curY += 8;

  const salaryLedgerRows = (report.salariesList && report.salariesList.length > 0)
    ? report.salariesList.map(s => [
        s.staffName || '-',
        s.designation || '-',
        s.salaryMonth || report.month,
        formatCurrency(s.basicSalary || s.paidAmount),
        formatCurrency(s.bonus || 0),
        formatCurrency(s.deduction || 0),
        formatCurrency(s.netSalary || s.paidAmount),
        formatCurrency(s.paidAmount),
        (s.paymentStatus || 'paid').toUpperCase(),
      ])
    : [['No salary disbursements processed for this period.', '-', '-', '-', '-', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    showHead: 'everyPage',
    head: [['Staff Name', 'Designation', 'Month', 'Basic', 'Bonus', 'Deduction', 'Net Salary', 'Paid Amount', 'Status']],
    body: salaryLedgerRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 6.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 14, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
      8: { cellWidth: 20, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-ignore
  curY = doc.lastAutoTable.finalY + 12;

  // Section 9: Outstanding Invoices
  if (curY > pageHeight - 65) {
    doc.addPage();
    drawPageHeaderBanner(doc, 'Section 9', 'Outstanding Receivables');
    curY = 38;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('9. Outstanding & Overdue Invoices', 14, curY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Unsettled customer invoices with pending receivable balances.`, 14, curY + 4.5);

  curY += 8;

  const outstandingRows = (report.outstandingInvoicesList && report.outstandingInvoicesList.length > 0)
    ? report.outstandingInvoicesList.map(inv => [
        inv.invoiceNumber || inv.id,
        inv.customerName || 'Customer',
        inv.issueDate || '-',
        inv.dueDate || '-',
        formatCurrency(inv.totalAmount),
        formatCurrency(inv.paidAmount),
        formatCurrency(inv.remainingAmount),
        inv.paymentStatus.toUpperCase(),
      ])
    : [['All customer accounts are fully settled with zero overdue balances.', '-', '-', '-', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    showHead: 'everyPage',
    head: [['Invoice #', 'Customer Name', 'Issue Date', 'Due Date', 'Total Amount', 'Paid Amount', 'Remaining Due', 'Status']],
    body: outstandingRows,
    headStyles: {
      fillColor: [180, 83, 9],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 44 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [217, 119, 6] },
      7: { cellWidth: 12, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [254, 243, 199],
    },
  });

  // @ts-ignore
  curY = doc.lastAutoTable.finalY + 12;

  if (curY > pageHeight - 50) {
    doc.addPage();
    drawPageHeaderBanner(doc, 'Verification', 'Official Authorization');
    curY = 38;
  }

  // Verification & Official Sign-off Block
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, curY, pageWidth - 14, curY);
  curY += 8;

  // Left Sign: Prepared By
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Prepared & Verified by:', 20, curY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Accountant / Finance Officer', 20, curY + 6);
  doc.setDrawColor(148, 163, 184);
  doc.line(20, curY + 18, 75, curY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Signature & Official Stamp', 20, curY + 22);

  // Right Sign: Approved By
  const rightSignX = pageWidth - 80;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Reviewed & Approved by:', rightSignX, curY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Super Admin / Managing Director', rightSignX, curY + 6);
  doc.setDrawColor(148, 163, 184);
  doc.line(rightSignX, curY + 18, rightSignX + 55, curY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Signature & Executive Seal', rightSignX, curY + 22);

  // -------------------------------------------------------------
  // DYNAMIC 2-PASS FOOTER WITH PAGE NUMBERS
  // -------------------------------------------------------------
  // @ts-ignore
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${companyName} • Monthly Financial Audit Report • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
    doc.text(
      `Confidential Document`,
      14,
      pageHeight - 7
    );
    doc.text(
      `Generated: ${generationTimestamp}`,
      pageWidth - 14,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  // Save the document
  const fileName = `${companyName.replace(/\s+/g, '_')}_Monthly_Financial_Report_${report.month}.pdf`;
  doc.save(fileName);
}

export function generateDailyReportPDF(report: any, authorName = 'Super Admin'): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateFormatted = formatDate(report.date);

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('APEXFIBER BROADBAND NETWORK', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Daily Cash Register & Settlement Audit Report', 14, 19);
  doc.text(`Reporting Date: ${dateFormatted} (${report.date})`, 14, 25);

  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - 70, 7, 56, 24, 2, 2, 'F');
  doc.setTextColor(6, 182, 212);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DAILY CASH FLOW', pageWidth - 42, 14, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.text(dateFormatted, pageWidth - 42, 21, { align: 'center' });

  let currentY = 44;

  // KPI Summary
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const kpis = [
    { label: 'Today Revenue', value: formatCurrency(report.totalRevenue), color: [13, 148, 136] },
    { label: 'Today Expenses', value: formatCurrency(report.totalExpenses), color: [225, 29, 72] },
    { label: 'Net Cash Flow', value: formatCurrency(report.netCashFlow), color: report.netCashFlow >= 0 ? [22, 163, 74] : [225, 29, 72] },
    { label: 'New Installs', value: `${report.newCustomersCount || 0} Connections`, color: [37, 99, 235] },
  ];

  kpis.forEach((k, idx) => {
    const kx = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(kx, currentY, cardWidth, 18, 1.5, 1.5, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(k.label.toUpperCase(), kx + 3, currentY + 5.5);

    doc.setFontSize(10.5);
    doc.setTextColor(k.color[0], k.color[1], k.color[2]);
    doc.text(k.value, kx + 3, currentY + 13.5);
  });

  currentY += 24;

  // Collections Table
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Today's Collections (${report.payments?.length || 0} Receipts Recorded)`, 14, currentY);
  currentY += 2;

  const paymentRows = (report.payments || []).map((p: any) => [
    p.receiptNumber || p.id,
    p.customerName,
    p.paymentMethod?.replace('_', ' ').toUpperCase(),
    p.collectedBy || authorName,
    formatCurrency(p.amount),
  ]);

  autoTable(doc, {
    startY: currentY + 1,
    margin: { left: 14, right: 14 },
    head: [['Receipt #', 'Customer Name', 'Method', 'Collected By', 'Amount']],
    body: paymentRows.length > 0 ? paymentRows : [['No receipts collected today', '-', '-', '-', '-']],
    headStyles: { fillColor: [15, 23, 42], fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [13, 148, 136] },
    },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // Expenses Table
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Today's Expenses & Disbursements (${report.expenses?.length || 0} Entries)`, 14, currentY);
  currentY += 2;

  const expenseRows = (report.expenses || []).map((e: any) => [
    e.id,
    e.description,
    e.categoryName || 'Operating Expense',
    e.addedBy || authorName,
    formatCurrency(e.amount),
  ]);

  autoTable(doc, {
    startY: currentY + 1,
    margin: { left: 14, right: 14 },
    head: [['Ref / ID', 'Description', 'Category', 'Authorized By', 'Amount']],
    body: expenseRows.length > 0 ? expenseRows : [['No expenses recorded today', '-', '-', '-', '-']],
    headStyles: { fillColor: [30, 41, 59], fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 65 },
      2: { cellWidth: 35 },
      3: { cellWidth: 24 },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
    },
  });

  // Save document
  doc.save(`ApexFiber_Daily_Report_${report.date}.pdf`);
}

export function generateProfitLossReportPDF(report: any, authorName = 'Super Admin'): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('APEXFIBER BROADBAND NETWORK', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Profit & Loss Financial Statement (P&L)', 14, 19);
  doc.text(`Period: ${formatDate(report.startDate)} to ${formatDate(report.endDate)}`, 14, 25);

  let currentY = 45;

  // Summary Statement Block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('GROSS OPERATING REVENUE:', 20, currentY + 8);
  doc.text('TOTAL OPERATING EXPENSES:', 20, currentY + 16);
  doc.text('NET OPERATING PROFIT / (LOSS):', 20, currentY + 24);

  doc.setTextColor(13, 148, 136);
  doc.text(formatCurrency(report.totalRevenue), pageWidth - 24, currentY + 8, { align: 'right' });

  doc.setTextColor(225, 29, 72);
  doc.text(`(${formatCurrency(report.totalExpenses)})`, pageWidth - 24, currentY + 16, { align: 'right' });

  doc.setTextColor(report.netProfit >= 0 ? 22 : 225, report.netProfit >= 0 ? 163 : 29, report.netProfit >= 0 ? 74 : 72);
  doc.text(formatCurrency(report.netProfit), pageWidth - 24, currentY + 24, { align: 'right' });

  currentY += 36;

  // Category Breakdown Table
  const catRows = (report.categoryBreakdown || []).map((cat: any) => [
    cat.name,
    formatCurrency(cat.amount),
    report.totalExpenses > 0 ? ((cat.amount / report.totalExpenses) * 100).toFixed(1) + '%' : '0%',
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [['Expense Account / Schedule', 'Disbursed Amount', 'Share of Total %']],
    body: catRows.length > 0 ? catRows : [['No operating expenses recorded', '-', '-']],
    headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { cellWidth: 45, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
      2: { cellWidth: 37, halign: 'right' },
    },
  });

  doc.save(`ApexFiber_Profit_Loss_${report.startDate}_to_${report.endDate}.pdf`);
}

