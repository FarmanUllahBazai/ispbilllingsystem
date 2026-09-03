import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { SystemSettings } from '../../types';
import { api } from '../../services/api';
import { Printer, Scissors, Copy, Check } from 'lucide-react';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId: string | null;
  settings?: SystemSettings | null;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptId,
  settings,
}) => {
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && receiptId) {
      setLoading(true);
      api
        .getReceipt(receiptId)
        .then(data => setReceipt(data))
        .catch(err => console.error('Failed to load receipt:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, receiptId]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=450,height=700');
    if (!printWindow) {
      window.print();
      return;
    }

    const receiptHtml = printContent.innerHTML;
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bill_${receipt?.receiptNumber || receipt?.invoiceNumber || 'POS'}</title>
          <style>
            @page {
              margin: 0;
              size: ${paperWidth === '58mm' ? '58mm auto' : '80mm auto'};
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace, monospace;
              color: #000;
              background: #fff;
              margin: 0 auto;
              padding: ${paperWidth === '58mm' ? '4px 6px' : '8px 12px'};
              font-size: ${paperWidth === '58mm' ? '11px' : '13px'};
              line-height: 1.25;
              width: ${paperWidth === '58mm' ? '56mm' : '78mm'};
              text-rendering: optimizeLegibility;
              -webkit-font-smoothing: antialiased;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: 700; }
            .uppercase { text-transform: uppercase; }
            .divider-solid {
              border-bottom: 1.5px solid #000;
              margin: 5px 0;
            }
            .divider-double {
              border-top: 1.5px solid #000;
              border-bottom: 1.5px solid #000;
              height: 2px;
              margin: 6px 0;
            }
            .divider-dashed {
              border-bottom: 1px dashed #000;
              margin: 6px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 4px 0;
            }
            th {
              font-weight: bold;
              text-align: left;
              padding: 3px 0;
              border-bottom: 1.5px solid #000;
              border-top: 1.5px solid #000;
              font-size: ${paperWidth === '58mm' ? '10px' : '12px'};
            }
            td {
              padding: 3px 0;
              vertical-align: top;
              font-size: ${paperWidth === '58mm' ? '10px' : '12px'};
            }
            .qty { text-align: center; }
            .price { text-align: right; }
            .amount { text-align: right; }
            @media print {
              body {
                padding: 0;
                width: 100%;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body onload="window.focus(); window.print(); window.close();">
          ${receiptHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyReceiptText = () => {
    if (!receipt) return;
    const invNum = receipt.invoiceNumber || receipt.receiptNumber || 'INV-001';
    const dateFormatted = new Date(receipt.paymentDate || receipt.invoiceDate || Date.now()).toLocaleDateString('en-GB') + ' ' + new Date(receipt.paymentDate || receipt.invoiceDate || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const text = `
${settings?.companyName || "ApexFiber Broadband Network"}
${settings?.companyAddress || settings?.address || 'Suite 402, Executive Plaza, Blue Area, Islamabad'}
Tel: ${settings?.companyPhone || settings?.supportNumber || '+92 (051) 843-9000'}
------------------------------------------------
Date : ${dateFormatted}
Inv# : ${invNum}
Staff: ${receipt.receivedBy || receipt.receivedByName || 'Accounts Desk'}
Customer: ${receipt.customerName} (${receipt.subscriberId || receipt.customerId})
------------------------------------------------
ITEM               QTY    PRICE    AMOUNT
${(receipt.items || []).map((i: any) => `${i.description.slice(0, 18).padEnd(18, ' ')} ${String(i.quantity || 1).padStart(3, ' ')} ${(i.unitPrice || i.amount).toFixed(2).padStart(8, ' ')} ${(i.total || i.amount || 0).toFixed(2).padStart(9, ' ')}`).join('\n')}
------------------------------------------------
Subtotal:                    ${(receipt.subtotal || receipt.totalAmount || receipt.amount || 0).toFixed(2)} PKR
TOTAL:                       ${(receipt.totalAmount || receipt.amount || 0).toFixed(2)} PKR
------------------------------------------------
Thank you for choosing ${settings?.companyName || 'ApexFiber'}!
* ${invNum} *
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!receipt && loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading Bill / Receipt..." maxWidth="md">
        <div className="flex items-center justify-center p-12 text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Modal>
    );
  }

  if (!receipt) return null;

  const invoiceNumber = receipt.invoiceNumber || receipt.receiptNumber || 'INV-001';
  const paymentDate = new Date(receipt.paymentDate || receipt.invoiceDate || Date.now());
  const dateString = `${String(paymentDate.getDate()).padStart(2, '0')}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${paymentDate.getFullYear()}  ${String(paymentDate.getHours()).padStart(2, '0')}:${String(paymentDate.getMinutes()).padStart(2, '0')}`;
  
  const subtotal = Number(receipt.subtotal || receipt.totalAmount || receipt.amount || 0);
  const discount = Number(receipt.discount || 0);
  const totalAmount = Number(receipt.totalAmount || receipt.amount || (subtotal - discount));
  const paidAmount = Number(receipt.amount || receipt.paidAmount || totalAmount);
  const remainingDue = Number(receipt.remainingBalance !== undefined ? receipt.remainingBalance : (receipt.remainingAmount !== undefined ? receipt.remainingAmount : Math.max(0, totalAmount - paidAmount)));

  const itemsList = receipt.items && receipt.items.length > 0
    ? receipt.items
    : [
        {
          description: receipt.packageName ? `${receipt.packageName} (${receipt.speed || 'Broadband'})` : 'Broadband Subscription Fee',
          quantity: 1,
          unitPrice: totalAmount,
          amount: totalAmount,
        }
      ];

  const companyTitle = settings?.companyName || 'ApexFiber Broadband Network';
  const companyAddress = settings?.companyAddress || settings?.address || 'Suite 402, Executive Plaza, Blue Area, Islamabad';
  const companyTel = settings?.companyPhone || settings?.supportNumber || settings?.phone || '+92 (051) 843-9000';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thermal Print Bill: ${invoiceNumber}`}
      subtitle="Formatted for 58mm & 80mm Thermal Receipt Printers"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold px-1">Roll Size:</span>
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                paperWidth === '58mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              58mm Roll
            </button>
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                paperWidth === '80mm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              80mm Standard
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyReceiptText}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer shadow-xs"
              title="Copy receipt as plain text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip Now</span>
            </button>
          </div>
        </div>

        {/* Paper Container - Pixel-Matched to the User's Image */}
        <div className="flex justify-center p-4 sm:p-6 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
          <div
            ref={printRef}
            className={`bg-white text-black p-5 sm:p-6 rounded-lg shadow-md border border-slate-300 font-mono transition-all select-all ${
              paperWidth === '58mm' ? 'w-[280px] text-[11px]' : 'w-[360px] text-[13px]'
            }`}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              color: '#000000',
              backgroundColor: '#ffffff',
              lineHeight: 1.25,
            }}
          >
            {/* Top Brand Emblem */}
            <div className="flex flex-col items-center justify-center pb-2 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center mb-1 relative overflow-hidden bg-white">
                <div className="flex flex-col items-center leading-none">
                  <div className="text-lg font-black tracking-tighter" style={{ fontFamily: 'sans-serif' }}>
                    {companyTitle.split(' ')[0].toUpperCase()}
                  </div>
                  <div className="text-[6.5px] font-bold tracking-widest uppercase mt-0.5">
                    FIBER NET
                  </div>
                </div>
              </div>
              <div className="w-20 h-0.5 bg-black my-1"></div>
            </div>

            {/* Business Header */}
            <div className="text-center pb-2 space-y-0.5">
              <div className="font-bold text-sm sm:text-base uppercase tracking-tight text-black">
                {companyTitle}
              </div>
              <div className="text-[11px] sm:text-xs text-black font-semibold">
                {companyAddress}
              </div>
              <div className="text-[11px] sm:text-xs text-black font-bold">
                Tel: {companyTel}
              </div>
            </div>

            {/* Divider Solid */}
            <div className="border-b-[1.5px] border-black my-1.5"></div>

            {/* Invoice Meta Grid */}
            <div className="py-1 space-y-1 text-black font-mono text-[11px] sm:text-xs">
              <div className="flex justify-between">
                <span>Date : {dateString}</span>
              </div>
              <div className="flex justify-between">
                <span>Inv# : {invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Staff: {receipt.receivedBy || receipt.receivedByName || 'Accounts Desk'}</span>
              </div>
              {receipt.customerName && (
                <div className="flex justify-between font-bold pt-0.5">
                  <span>Cust : {receipt.customerName.slice(0, 16)}</span>
                  <span>{receipt.subscriberId || receipt.customerId}</span>
                </div>
              )}
            </div>

            {/* Table Divider */}
            <div className="border-b-[1.5px] border-black mt-1"></div>

            {/* Itemized Table */}
            <table className="w-full text-left font-mono my-1 border-collapse text-[11px] sm:text-xs">
              <thead>
                <tr className="border-b-[1.5px] border-black">
                  <th className="py-1 font-bold text-left text-black">ITEM</th>
                  <th className="py-1 font-bold text-center text-black px-1">QTY</th>
                  <th className="py-1 font-bold text-right text-black px-1">PRICE</th>
                  <th className="py-1 font-bold text-right text-black">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dotted divide-gray-400">
                {itemsList.map((item: any, idx: number) => {
                  const qty = item.quantity || 1;
                  const price = item.unitPrice !== undefined ? item.unitPrice : (item.amount / qty);
                  const amount = item.amount !== undefined ? item.amount : (qty * price);

                  return (
                    <tr key={idx} className="text-black">
                      <td className="py-1.5 pr-1 font-medium leading-tight">
                        <div>{item.description}</div>
                      </td>
                      <td className="py-1.5 text-center font-mono px-1">{qty}</td>
                      <td className="py-1.5 text-right font-mono px-1">{price.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono font-bold">{amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Divider Solid */}
            <div className="border-t-[1.5px] border-black my-1.5"></div>

            {/* Subtotal & Totals in PKR format */}
            <div className="space-y-1 py-1 font-mono text-[11px] sm:text-xs text-black">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{subtotal.toFixed(2)} PKR</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{discount.toFixed(2)} PKR</span>
                </div>
              )}

              {/* High Contrast Double Divider Before TOTAL */}
              <div className="border-t-[2px] border-b-[2px] border-black py-1 my-1">
                <div className="flex justify-between text-xs sm:text-sm font-black tracking-tight">
                  <span className="uppercase">TOTAL</span>
                  <span>{totalAmount.toFixed(2)} PKR</span>
                </div>
              </div>

              {receipt.paymentMethod && (
                <div className="flex justify-between text-[10px] sm:text-[11px] pt-0.5">
                  <span>Payment Mode:</span>
                  <span className="uppercase font-bold">{receipt.paymentMethod.replace('_', ' ')}</span>
                </div>
              )}

              {remainingDue > 0 ? (
                <div className="flex justify-between font-bold text-black pt-0.5">
                  <span>Balance Due:</span>
                  <span>{remainingDue.toFixed(2)} PKR</span>
                </div>
              ) : (
                <div className="flex justify-between text-[10px] sm:text-[11px] text-gray-700">
                  <span>Payment Status:</span>
                  <span className="font-bold">PAID IN FULL</span>
                </div>
              )}
            </div>

            {/* Divider Solid before Footer */}
            <div className="border-t-[1.5px] border-black my-2"></div>

            {/* Footer Section */}
            <div className="text-center pt-1 space-y-1 font-mono text-[10px] sm:text-[11px] text-black">
              <div className="font-bold text-xs">
                Thank you for your visit!
              </div>
              <div className="text-[10px]">
                {settings?.customReceiptNote || 'Fast, Unlimited & High-Speed Fiber Internet.'}
              </div>
              
              <div className="tracking-widest font-mono text-[10px] pt-1">
                * {invoiceNumber} *
              </div>
            </div>

            {/* Cut Here Separator */}
            <div className="pt-3 text-center">
              <div className="border-t border-dashed border-black w-full mb-1"></div>
              <div className="text-[9px] text-black flex items-center justify-center gap-1 tracking-wider">
                <Scissors className="w-2.5 h-2.5 inline" />
                <span>- cut here -</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <div className="text-xs text-slate-500 font-medium">
            Thermal ESC/POS & Standard USB / Bluetooth Printer Ready
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
