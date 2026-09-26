import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  Copy,
  Check,
  CreditCard,
  QrCode,
  Eye,
  FileText,
  Receipt,
} from 'lucide-react';
import { MonthBill, AgencySettings } from '../types';
import {
  generateWhatsAppBillText,
  createWhatsAppUrl,
  buildUpiUri,
} from '../utils/billingUtils';
import { PhysicalBillMemo } from './PhysicalBillMemo';
import { QRCodeView } from './QRCodeView';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: MonthBill | null;
  settings: AgencySettings;
  onRecordPayment: (bill: MonthBill) => void;
  onOpenTransaction?: (customerId: string, defaultType: 'jama' | 'udhar') => void;
}

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  bill,
  settings,
  onRecordPayment,
  onOpenTransaction,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrBox, setShowQrBox] = useState(false);

  if (!isOpen || !bill) return null;

  const upiUri = buildUpiUri(
    settings.upiId,
    settings.headerName,
    bill.remainingDue > 0 ? bill.remainingDue : bill.totalPayable,
    `Patrika Bill ${bill.billNo}`
  );

  const whatsAppText = generateWhatsAppBillText(bill, settings);
  const whatsAppUrl = createWhatsAppUrl(bill.phone, whatsAppText);

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden transform transition-all flex flex-col max-h-[95vh]">
        {/* Top Control Bar (Non-print) */}
        <div className="bg-stone-900 px-5 py-3 flex items-center justify-between text-white print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-sky-300">
              क्रेडिट मेमो बिल पर्ची (Bill No. {bill.billNo})
            </span>
            <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded border border-stone-700">
              {bill.customerName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-5 overflow-y-auto bg-stone-100 flex flex-col items-center justify-center">
          <div id="printable-single-bill" className="w-full max-w-[420px]">
            {/* The exact authentic Physical Bill Memo */}
            <PhysicalBillMemo bill={bill} settings={settings} />
          </div>

          {/* Optional Quick QR expand for customer counter payment */}
          {showQrBox && (
            <div className="mt-3 p-3 bg-white rounded-xl border border-stone-300 shadow-sm flex items-center gap-3 w-full max-w-[420px] print:hidden">
              <div className="shrink-0 bg-white p-1 rounded border border-stone-200">
                <QRCodeView value={upiUri} size={90} />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-stone-900 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-[#00487c]" />
                  <span>ग्राहक से UPI स्कैन करवाएं</span>
                </div>
                <div className="font-mono text-[11px] font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded inline-block">
                  UPI: {settings.upiId}
                </div>
                <div className="text-rose-700 font-bold font-mono text-sm">
                  देय राशि: ₹{bill.remainingDue}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar (Non-print) */}
        <div className="bg-white px-4 py-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 print:hidden shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-stone-300"
              title="सिंगल बिल प्रिंट निकालें"
            >
              <Printer className="w-4 h-4 text-stone-700" />
              <span>प्रिंट करें</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrBox(!showQrBox)}
              className="inline-flex items-center gap-1 px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-stone-300"
              title="QR कोड दिखाएं"
            >
              <QrCode className="w-4 h-4 text-[#00487c]" />
              <span className="hidden sm:inline">QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-stone-300"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-600" />}
              <span className="hidden sm:inline">{copied ? 'कॉपी हो गया' : 'टेक्स्ट'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTransaction && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransaction(bill.customerId, 'jama');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 transition-colors cursor-pointer"
                title="रकम जमा या नया उधार दर्ज करें"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>+ जमा / नया उधार</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onRecordPayment(bill)}
              className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>पेमेंट दर्ज करें</span>
            </button>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
