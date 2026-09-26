import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Share2,
  Printer,
  FileSpreadsheet,
  History,
  CreditCard,
} from 'lucide-react';
import { Customer, MonthBill, LedgerTransaction, AgencySettings } from '../types';
import { createWhatsAppUrl, exportToExcel } from '../utils/billingUtils';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  bill: MonthBill | null;
  transactions: LedgerTransaction[];
  settings: AgencySettings;
  onOpenNewTransaction: (customerId: string, defaultType: 'jama' | 'udhar') => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  onClose,
  customer,
  bill,
  transactions,
  settings,
  onOpenNewTransaction,
}) => {
  if (!isOpen || !customer) return null;

  // Filter transactions for this customer and sort descending
  const customerTxs = transactions
    .filter((t) => t.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const currentDue = bill ? bill.remainingDue : customer.oldDue;

  // Generate complete statement text for WhatsApp
  const generateStatementText = () => {
    let msg = `📜 *ग्राहक खाता विवरण (Account Statement)*\n*${settings.shopName}*\n*${settings.headerName} (${settings.subHeader})*\n${settings.location}\n━━━━━━━━━━━━━━━━━━━━\nग्राहक: *${customer.name}* (कोड: *${customer.customerCode}*)\nरूट: *${customer.route}*\n━━━━━━━━━━━━━━━━━━━━\n`;

    if (bill) {
      msg += `📰 चालू माह बिल (${bill.monthFormatted}): *₹${bill.totalPayable}*\n(पेपर: ₹${bill.dailyPaperAmount} + D.C.: ₹${bill.deliveryCharge} + पिछला बकाया: ₹${bill.oldDue})\n\n`;
    }

    msg += `📋 हाल के लेन-देन (Recent Transactions):\n`;
    if (customerTxs.length === 0) {
      msg += `कोई अतिरिक्त प्रविष्टि नहीं।\n`;
    } else {
      customerTxs.slice(0, 5).forEach((t) => {
        const sign = t.type === 'jama' ? '✅ जमा (-)' : '🔴 उधार (+)';
        msg += `• ${t.date}: ${sign} ₹${t.amount} (${t.reason || ''})\n`;
      });
    }

    msg += `━━━━━━━━━━━━━━━━━━━━\n💰 *कुल वर्तमान शेष बकाया: ₹${currentDue}*\n━━━━━━━━━━━━━━━━━━━━\nUPI ID: *${settings.upiId}*\nसम्पर्क: ${settings.mobiles}\n${settings.medicalStoreName}`;
    return msg;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportStatement = () => {
    const data = customerTxs.map((t) => ({
      'दिनांक': t.date,
      'समय': t.time || '',
      'प्रकार': t.type === 'jama' ? 'रकम जमा (Credit)' : 'नया उधार (Debit)',
      'राशि (₹)': t.amount,
      'मद / विवरण': t.reason || '',
      'माध्यम': t.mode || '',
      'रेफरेंस नं': t.referenceNo || '',
      'पिछला शेष': t.previousBalance,
      'नया शेष': t.newBalance,
      'टिप्पणी': t.notes || '',
    }));

    exportToExcel(
      [{ sheetName: 'Khata_Statement', data }],
      `Khata_${customer.name.replace(/\s+/g, '_')}_${customer.customerCode}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden transform transition-all flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-[#003865] px-5 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <History className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">ग्राहक खाता बही (Customer Khata Passbook)</h3>
                <span className="text-[11px] font-mono bg-sky-900 text-sky-200 px-2 py-0.5 rounded border border-sky-700">
                  #{customer.customerCode}
                </span>
              </div>
              <p className="text-xs text-sky-200/80">{customer.name} · {customer.route}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-300 hover:text-white rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card & Quick Entry Action Buttons */}
        <div className="bg-stone-50 border-b border-stone-200 p-4 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-stone-500 block uppercase font-bold">वर्तमान कुल बकाया</span>
              <span className="text-2xl font-black font-mono text-rose-600">
                ₹{currentDue}
              </span>
            </div>
            <div className="h-8 w-px bg-stone-200" />
            <div className="text-xs space-y-0.5">
              <div className="text-stone-600">
                फोन: <span className="font-mono font-medium">{customer.phone}</span>
              </div>
              {bill && (
                <div className="text-[11px] text-stone-500">
                  चालू बिल: ₹{bill.dailyPaperAmount + bill.deliveryCharge} (पुराना: ₹{bill.oldDue})
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewTransaction(customer.id, 'jama');
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>रकम जमा</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewTransaction(customer.id, 'udhar');
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>नया उधार</span>
            </button>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="p-4 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-bold">खाता लेन-देन इतिहास ({customerTxs.length})</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportStatement}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-800 hover:underline cursor-pointer"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 text-[11px] text-stone-800 hover:underline cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>प्रिंट</span>
              </button>
            </div>
          </div>

          <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">दिनांक/समय</th>
                  <th className="py-2.5 px-3">प्रकार व विवरण</th>
                  <th className="py-2.5 px-3 text-right">रकम (₹)</th>
                  <th className="py-2.5 px-3 text-right">शेष बकाया (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {customerTxs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-stone-400">
                      इस ग्राहक का कोई लेन-देन रिकॉर्ड नहीं मिला। ऊपर दिए बटन से जमा या उधार एंट्री दर्ज करें।
                    </td>
                  </tr>
                ) : (
                  customerTxs.map((t) => (
                    <tr key={t.id} className="hover:bg-stone-50">
                      <td className="py-2 px-3 font-mono text-[11px]">
                        <div>{t.date}</div>
                        {t.time && <div className="text-[10px] text-stone-400">{t.time}</div>}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1 font-semibold">
                          {t.type === 'jama' ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>जमा प्राप्त</span>
                            </span>
                          ) : (
                            <span className="text-rose-700 flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>नया उधार नामे</span>
                            </span>
                          )}
                          {t.mode && (
                            <span className="text-[10px] uppercase font-mono bg-stone-100 px-1 rounded text-stone-600">
                              {t.mode}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {t.reason || '-'}
                          {t.notes && ` (${t.notes})`}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        <span
                          className={`text-sm ${
                            t.type === 'jama' ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {t.type === 'jama' ? '-' : '+'}₹{t.amount}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                        ₹{t.newBalance}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-50 px-5 py-3 border-t border-stone-200 flex items-center justify-between shrink-0">
          <a
            href={createWhatsAppUrl(customer.phone, generateStatementText())}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>पूरा खाता स्टेटमेंट WhatsApp भेजें</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
