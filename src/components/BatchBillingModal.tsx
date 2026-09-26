import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Filter,
  Check,
  Scissors,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { MonthBill, AgencySettings } from '../types';
import { exportToExcel } from '../utils/billingUtils';
import { PhysicalBillMemo } from './PhysicalBillMemo';

interface BatchBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bills: MonthBill[];
  settings: AgencySettings;
  routes: string[];
}

export const BatchBillingModal: React.FC<BatchBillingModalProps> = ({
  isOpen,
  onClose,
  bills,
  settings,
  routes,
}) => {
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [onlyPending, setOnlyPending] = useState(false);
  const [activePreviewPage, setActivePreviewPage] = useState(1);

  // Filter bills
  const filteredBills = useMemo(() => {
    if (!isOpen) return [];
    return bills.filter((b) => {
      const matchRoute = selectedRoute === 'all' || b.route === selectedRoute;
      const matchPending = !onlyPending || b.remainingDue > 0;
      return matchRoute && matchPending;
    });
  }, [bills, selectedRoute, onlyPending, isOpen]);

  // Chunk bills into sets of 4 (for 4 bills per Legal Sheet)
  const legalPages = useMemo(() => {
    if (!isOpen) return [];
    const pages: MonthBill[][] = [];
    for (let i = 0; i < filteredBills.length; i += 4) {
      pages.push(filteredBills.slice(i, i + 4));
    }
    return pages;
  }, [filteredBills, isOpen]);

  if (!isOpen) return null;

  const totalPages = legalPages.length || 1;
  const currentChunk = legalPages[activePreviewPage - 1] || [];

  const handlePrintAll = () => {
    window.print();
  };

  const handleExportBatchExcel = () => {
    const data = filteredBills.map((b) => ({
      'Bill No': b.billNo,
      'Customer Name': b.customerName,
      'Phone': b.phone,
      'Route': b.route,
      'Month': b.monthFormatted,
      'Billed Days': b.billedDays,
      'Rate': b.ratePerDay,
      'Paper Amount (Rs)': b.dailyPaperAmount,
      'D.C. (Rs)': b.deliveryCharge,
      'Old Due (Rs)': b.oldDue,
      'Total Payable (Rs)': b.totalPayable,
      'Paid (Rs)': b.paidAmount,
      'Remaining Due (Rs)': b.remainingDue,
      'Status': b.remainingDue <= 0 ? 'PAID' : 'DUE',
    }));

    exportToExcel(
      [{ sheetName: 'Legal_Print_Register', data }],
      `Patrika_Legal_Bills_${bills[0]?.month || '2026'}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-stone-200 overflow-hidden transform transition-all flex flex-col max-h-[96vh]">
        {/* Modal Top Bar (Non-print) */}
        <div className="bg-[#003865] px-5 py-3.5 flex items-center justify-between text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <Printer className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  लीगल पेज 4-इन-1 बिल प्रिंटर (Legal Page - 4 Bills Per Sheet)
                </h3>
                <span className="text-[10px] bg-sky-900 text-sky-200 px-2 py-0.5 rounded font-mono border border-sky-700">
                  8.5 × 14 in Legal Paper
                </span>
              </div>
              <p className="text-xs text-sky-200/80">
                एक लीगल पेज पर हुबहू 4 बिल (2×2 ग्रिड) कटिंग गाइड सहित प्रिंट होंगे
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-300 hover:text-white rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Page Navigation Controls (Non-print) */}
        <div className="bg-stone-50 px-5 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          {/* Left filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-stone-700">रूट / एरिया:</span>
              <select
                value={selectedRoute}
                onChange={(e) => {
                  setSelectedRoute(e.target.value);
                  setActivePreviewPage(1);
                }}
                className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-800 focus:outline-none"
              >
                <option value="all">सभी रूट्स ({bills.length} बिल)</option>
                {routes.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-stone-700 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={onlyPending}
                onChange={(e) => {
                  setOnlyPending(e.target.checked);
                  setActivePreviewPage(1);
                }}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>केवल बकाया बिल</span>
            </label>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBatchExcel}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-300 font-semibold cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel सूची</span>
            </button>

            <button
              type="button"
              onClick={handlePrintAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00487c] hover:bg-[#003865] text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer text-xs"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>सभी {legalPages.length} लीगल पेज प्रिंट करें ({filteredBills.length} बिल)</span>
            </button>
          </div>
        </div>

        {/* Page Switcher banner for onscreen preview (Non-print) */}
        <div className="bg-sky-50/70 border-b border-sky-200 px-5 py-2 flex items-center justify-between text-xs text-sky-900 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-700" />
            <span className="font-semibold">
              स्क्रीन प्रीव्यू: लीगल पेज {activePreviewPage} / {totalPages} (कुल {filteredBills.length} बिल)
            </span>
            <span className="text-[11px] text-sky-700 hidden sm:inline">
              · प्रिंट दबाते ही सभी पेज एक साथ प्रिंटर पर जाएंगे
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={activePreviewPage <= 1}
              onClick={() => setActivePreviewPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded bg-white border border-sky-300 disabled:opacity-40 hover:bg-sky-100 text-sky-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-xs px-2">
              पेज {activePreviewPage}
            </span>
            <button
              type="button"
              disabled={activePreviewPage >= totalPages}
              onClick={() => setActivePreviewPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded bg-white border border-sky-300 disabled:opacity-40 hover:bg-sky-100 text-sky-900"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Screen Preview Container (Shows active page in UI, but renders all pages for Print) */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-stone-200/70 flex flex-col items-center">
          {/* Onscreen Single Page Preview */}
          <div className="print:hidden w-full max-w-[850px] bg-white border-2 border-stone-400 rounded-xl p-4 shadow-xl relative">
            <div className="text-[11px] font-bold text-stone-500 mb-2 flex items-center justify-between border-b pb-1">
              <span>लीगल पेज #{activePreviewPage} (2×2 ग्रिड - 4 बिल)</span>
              <span className="flex items-center gap-1 text-stone-600">
                <Scissors className="w-3.5 h-3.5" />
                <span>कटिंग गाइड लाइन्स प्रिंट में शामिल हैं</span>
              </span>
            </div>

            {/* 2x2 grid preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
              {currentChunk.map((bill, index) => (
                <div key={bill.id} className="relative">
                  <div className="absolute top-1 right-2 z-10 text-[9px] font-mono bg-sky-100 text-[#00487c] font-bold px-1.5 py-0.5 rounded border border-sky-300">
                    बिल #{bill.billNo}
                  </div>
                  <PhysicalBillMemo bill={bill} settings={settings} />
                </div>
              ))}
            </div>
          </div>

          {/* PRINT-ONLY CONTAINER (Renders ALL legal pages cleanly) */}
          <div className="hidden print:block w-full">
            {legalPages.map((pageBills, pageIdx) => (
              <div key={pageIdx} className="legal-page-grid">
                {pageBills.map((bill) => (
                  <div key={bill.id} className="h-full">
                    <PhysicalBillMemo bill={bill} settings={settings} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
