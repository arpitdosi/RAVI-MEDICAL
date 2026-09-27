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
  PlusCircle,
  FileDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { MonthBill, AgencySettings } from '../types';
import {
  generateWhatsAppBillText,
  createWhatsAppUrl,
  buildUpiUri,
} from '../utils/billingUtils';
import { generateSingleBillPdf } from '../utils/pdfUtils';
import { shareBillOnWhatsApp } from '../utils/shareUtils';
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');

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

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf || !bill) return;
    setIsGeneratingPdf(true);
    try {
      await generateSingleBillPdf(
        'printable-single-bill',
        `Patrika_Bill_${bill.billNo}_${bill.customerName.replace(/\s+/g, '_')}`
      );
    } catch (err) {
      console.error('Failed to download single bill PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsAppWithImage = async () => {
    if (isSharingWhatsApp || !bill) return;
    setIsSharingWhatsApp(true);
    setShareFeedback('');

    try {
      const result = await shareBillOnWhatsApp(bill, settings, 'printable-single-bill');
      if (result.message && result.mode !== 'cancelled') {
        setShareFeedback(result.message);
        setTimeout(() => setShareFeedback(''), 4500);
      }
    } catch (err) {
      console.error('Error sharing bill on WhatsApp:', err);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('window.print blocked or failed, downloading PDF instead', e);
      handleDownloadPdf();
    }
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

        {/* Feedback Alert Banner */}
        {shareFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{shareFeedback}</span>
          </div>
        )}

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
        <div className="bg-white px-4 py-3 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer border border-stone-300"
              title="सिंगल बिल प्रिंट निकालें"
            >
              <Printer className="w-4 h-4 text-stone-700" />
              <span>प्रिंट</span>
            </button>

            {/* Direct Single Bill PDF Download */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer border border-emerald-300 disabled:opacity-50"
              title="बिल की PDF फाइल डाउनलोड करें"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <FileDown className="w-4 h-4 text-emerald-600" />
              )}
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrBox(!showQrBox)}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-stone-300"
              title="QR कोड दिखाएं"
            >
              <QrCode className="w-4 h-4 text-[#00487c]" />
              <span>QR कोड</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-stone-300"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-600" />}
              <span>{copied ? 'कॉपी' : 'टेक्स्ट'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onRecordPayment(bill)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#00487c] hover:bg-[#003865] text-white rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer"
              title="पेमेंट दर्ज करें"
            >
              <CreditCard className="w-4 h-4 text-sky-200" />
              <span>पेमेंट लें</span>
            </button>

            {onOpenTransaction && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransaction(bill.customerId, 'udhar');
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer"
                title="ग्राहक के खाते में नया उधार जोड़ें"
              >
                <PlusCircle className="w-4 h-4 text-amber-100" />
                <span>+ उधार जोड़ें</span>
              </button>
            )}

            {/* Smart WhatsApp Share Button with Image */}
            <button
              type="button"
              onClick={handleShareWhatsAppWithImage}
              disabled={isSharingWhatsApp}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
              title="बिल की फोटो और विवरण WhatsApp पर भेजें"
            >
              {isSharingWhatsApp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>तैयार हो रहा है...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-emerald-100" />
                  <span>WhatsApp (बिल फोटो सहित)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
