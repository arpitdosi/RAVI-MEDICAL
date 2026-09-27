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
  FileDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { MonthBill, AgencySettings } from '../types';
import { exportToExcel } from '../utils/billingUtils';
import { generateLegalBatchPdf } from '../utils/pdfUtils';
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
  const [previewMode, setPreviewMode] = useState<'2x2' | 'stacked'>('2x2');

  // PDF Generation States
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);

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

  const handleDownloadLegalPdf = async (singlePageOnly?: boolean) => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfSuccess(false);

    const pageIdsToExport = singlePageOnly
      ? [`pdf-page-${activePreviewPage - 1}`]
      : legalPages.map((_, idx) => `pdf-page-${idx}`);

    const monthStr = filteredBills[0]?.month || '2026';
    const fileName = singlePageOnly
      ? `Patrika_Legal_Bills_${monthStr}_Page_${activePreviewPage}`
      : `Patrika_Legal_Bills_${monthStr}_All_${filteredBills.length}_Bills`;

    try {
      const success = await generateLegalBatchPdf(
        pageIdsToExport,
        fileName,
        (current, total) => setPdfProgress({ current, total })
      );

      if (success) {
        setPdfSuccess(true);
        setTimeout(() => setPdfSuccess(false), 4000);
      }
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  const handlePrintAll = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('window.print blocked or failed, generating PDF instead', e);
      handleDownloadLegalPdf(false);
    }
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportBatchExcel}
              className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl border border-stone-300 font-semibold cursor-pointer text-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel सूची</span>
            </button>

            {/* Direct Printer button */}
            <button
              type="button"
              onClick={handlePrintAll}
              className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold border border-stone-300 shadow-2xs transition-colors cursor-pointer text-xs"
              title="ब्राउज़र प्रिंट डायलॉग"
            >
              <Printer className="w-3.5 h-3.5 text-stone-700" />
              <span>प्रिंटर</span>
            </button>

            {/* PRIMARY PRINT TO PDF BUTTON */}
            <button
              type="button"
              onClick={() => handleDownloadLegalPdf(false)}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black shadow-md transition-all cursor-pointer text-xs disabled:opacity-60"
              title="सभी लीगल पेजों की 2×2 PDF फाइल डाउनलोड करें"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>
                    PDF बन रही है {pdfProgress ? `(${pdfProgress.current}/${pdfProgress.total})` : '...'}
                  </span>
                </>
              ) : pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>PDF डाउनलोड हो गई!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-100" />
                  <span>
                    सभी {legalPages.length} लीगल पेज PDF डाउनलोड करें ({filteredBills.length} बिल)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Page Switcher banner & Layout Toggle (Non-print) */}
        <div className="bg-sky-50/70 border-b border-sky-200 px-4 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-sky-900 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-700" />
            <span className="font-semibold">
              स्क्रीन प्रीव्यू: लीगल पेज {activePreviewPage} / {totalPages} (कुल {filteredBills.length} बिल)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 2-2 Set vs 1-1 Zoom Layout Toggle */}
            <div className="inline-flex rounded-lg border border-sky-300 bg-white p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setPreviewMode('2x2')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  previewMode === '2x2'
                    ? 'bg-[#00487c] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="लीगल पेपर 2-2 सेट (2 ऊपर, 2 नीचे)"
              >
                2-2 सेट व्यू
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('stacked')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  previewMode === 'stacked'
                    ? 'bg-[#00487c] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="1-1 बड़ा ज़ूम व्यू"
              >
                1-1 बड़ा व्यू
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activePreviewPage <= 1}
                onClick={() => setActivePreviewPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded bg-white border border-sky-300 disabled:opacity-40 hover:bg-sky-100 text-sky-900"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold text-xs px-1.5">
                {activePreviewPage}/{totalPages}
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

            {/* Quick Single Page PDF button */}
            <button
              type="button"
              onClick={() => handleDownloadLegalPdf(true)}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 rounded-lg text-[11px] font-bold shadow-2xs cursor-pointer disabled:opacity-50"
              title="केवल यह वर्तमान लीगल पेज PDF में डाउनलोड करें"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-700" />
              <span className="hidden sm:inline">यह पेज</span>
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Screen Preview Container (Shows active page in UI, but renders all pages for Print) */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-stone-200/70 flex flex-col items-center">
          {/* Onscreen Single Page Preview */}
          <div className="print:hidden w-full max-w-[850px] bg-white border-2 border-stone-400 rounded-xl p-3 sm:p-4 shadow-xl relative">
            <div className="text-[11px] font-bold text-stone-600 mb-3 flex items-center justify-between border-b pb-1.5">
              <span className="text-[#00487c] font-black">
                लीगल शीट #{activePreviewPage} • 2-2 सेट (ऊपर 2 बिल + नीचे 2 बिल)
              </span>
              <span className="flex items-center gap-1 text-stone-500">
                <Scissors className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">कटिंग गाइड लाइन्स प्रिंट में शामिल हैं</span>
              </span>
            </div>

            {previewMode === '2x2' ? (
              /* 2-2 SET VIEW: Top 2 Bills + Cutting Guide + Bottom 2 Bills */
              <div className="overflow-x-auto w-full pb-2">
                <div className="min-w-[560px] sm:min-w-0 space-y-4">
                  {/* Top Set: 2 Bills Side by Side */}
                  <div>
                    <div className="text-[10px] font-bold text-sky-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span className="bg-sky-100 text-[#00487c] px-2 py-0.5 rounded font-mono border border-sky-200">
                        ऊपर का सेट (2 बिल)
                      </span>
                      <span className="text-stone-500">बायां बिल • दायां बिल</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {currentChunk[0] ? (
                        <div className="relative">
                          <div className="absolute top-1 right-2 z-10 text-[9px] font-mono bg-sky-100 text-[#00487c] font-bold px-1.5 py-0.5 rounded border border-sky-300">
                            बिल #{currentChunk[0].billNo}
                          </div>
                          <PhysicalBillMemo bill={currentChunk[0]} settings={settings} />
                        </div>
                      ) : (
                        <div className="border border-dashed border-stone-300 rounded-xl p-4 flex items-center justify-center text-xs text-stone-400">
                          खाली स्लॉट
                        </div>
                      )}

                      {currentChunk[1] ? (
                        <div className="relative">
                          <div className="absolute top-1 right-2 z-10 text-[9px] font-mono bg-sky-100 text-[#00487c] font-bold px-1.5 py-0.5 rounded border border-sky-300">
                            बिल #{currentChunk[1].billNo}
                          </div>
                          <PhysicalBillMemo bill={currentChunk[1]} settings={settings} />
                        </div>
                      ) : (
                        <div className="border border-dashed border-stone-300 rounded-xl p-4 flex items-center justify-center text-xs text-stone-400">
                          खाली स्लॉट
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Cut Line between Top & Bottom sets */}
                  <div className="relative my-2 py-1 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-dashed border-stone-300" />
                    </div>
                    <span className="relative bg-white px-3 text-[10px] font-mono text-stone-500 flex items-center gap-1 border border-stone-300 rounded-full shadow-2xs">
                      <Scissors className="w-3.5 h-3.5 text-stone-600" />
                      <span>2-2 सेट कटिंग लाइन (ऊपर के 2 बिल | नीचे के 2 बिल)</span>
                    </span>
                  </div>

                  {/* Bottom Set: 2 Bills Side by Side */}
                  {(currentChunk[2] || currentChunk[3]) && (
                    <div>
                      <div className="text-[10px] font-bold text-sky-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="bg-sky-100 text-[#00487c] px-2 py-0.5 rounded font-mono border border-sky-200">
                          नीचे का सेट (2 बिल)
                        </span>
                        <span className="text-stone-500">बायां बिल • दायां बिल</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {currentChunk[2] ? (
                          <div className="relative">
                            <div className="absolute top-1 right-2 z-10 text-[9px] font-mono bg-sky-100 text-[#00487c] font-bold px-1.5 py-0.5 rounded border border-sky-300">
                              बिल #{currentChunk[2].billNo}
                            </div>
                            <PhysicalBillMemo bill={currentChunk[2]} settings={settings} />
                          </div>
                        ) : (
                          <div className="border border-dashed border-stone-300 rounded-xl p-4 flex items-center justify-center text-xs text-stone-400">
                            खाली स्लॉट
                          </div>
                        )}

                        {currentChunk[3] ? (
                          <div className="relative">
                            <div className="absolute top-1 right-2 z-10 text-[9px] font-mono bg-sky-100 text-[#00487c] font-bold px-1.5 py-0.5 rounded border border-sky-300">
                              बिल #{currentChunk[3].billNo}
                            </div>
                            <PhysicalBillMemo bill={currentChunk[3]} settings={settings} />
                          </div>
                        ) : (
                          <div className="border border-dashed border-stone-300 rounded-xl p-4 flex items-center justify-center text-xs text-stone-400">
                            खाली स्लॉट
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Stacked large 1-by-1 zoom view */
              <div className="space-y-4">
                {currentChunk.map((bill) => (
                  <div key={bill.id} className="relative">
                    <div className="absolute top-1 right-2 z-10 text-[9px] font-mono bg-sky-100 text-[#00487c] font-bold px-1.5 py-0.5 rounded border border-sky-300">
                      बिल #{bill.billNo}
                    </div>
                    <PhysicalBillMemo bill={bill} settings={settings} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRINT-ONLY CONTAINER: 2-2 SETS ON LEGAL PAPER */}
          <div className="hidden print:block w-full">
            {legalPages.map((pageBills, pageIdx) => (
              <div key={pageIdx} className="legal-sheet-page">
                {/* Top 2 Bills Set (Left & Right) */}
                <div className="legal-row">
                  {pageBills[0] && (
                    <div className="legal-col">
                      <PhysicalBillMemo bill={pageBills[0]} settings={settings} />
                    </div>
                  )}
                  {pageBills[1] && (
                    <div className="legal-col">
                      <PhysicalBillMemo bill={pageBills[1]} settings={settings} />
                    </div>
                  )}
                </div>

                {/* Horizontal Scissors Cutting Guide */}
                <div className="legal-cut-line">
                  <span>✂ - - - - - - - - - - - - - - - - - - - 2-2 सेट कटिंग लाइन - - - - - - - - - - - - - - - - - - - ✂</span>
                </div>

                {/* Bottom 2 Bills Set (Left & Right) */}
                {(pageBills[2] || pageBills[3]) && (
                  <div className="legal-row">
                    {pageBills[2] && (
                      <div className="legal-col">
                        <PhysicalBillMemo bill={pageBills[2]} settings={settings} />
                      </div>
                    )}
                    {pageBills[3] && (
                      <div className="legal-col">
                        <PhysicalBillMemo bill={pageBills[3]} settings={settings} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* OFF-SCREEN HIGH-RESOLUTION CONTAINER FOR 1-CLICK LEGAL PDF EXPORT */}
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '820px',
            zIndex: -999,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          {legalPages.map((pageBills, pageIdx) => (
            <div
              key={pageIdx}
              id={`pdf-page-${pageIdx}`}
              style={{
                width: '820px',
                backgroundColor: '#ffffff',
                padding: '16px',
                boxSizing: 'border-box',
                marginBottom: '30px',
              }}
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="text-[10px] font-bold text-sky-900 uppercase tracking-wider flex items-center justify-between border-b pb-1">
                  <span className="font-mono text-[#00487c]">
                    लीगल शीट #{pageIdx + 1} • ऊपर का सेट (2 बिल)
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    8.5 × 14 in Legal Paper (2×2 ग्रिड)
                  </span>
                </div>

                {/* Top 2 Bills Set */}
                <div className="grid grid-cols-2 gap-3">
                  {pageBills[0] && (
                    <div className="relative">
                      <div className="absolute top-1 right-2 z-10 text-[9px] font-mono bg-sky-100 text-[#00487c] font-bold px-1.5 py-0.5 rounded border border-sky-300">
                        बिल #{pageBills[0].billNo}
                      </div>
                      <PhysicalBillMemo bill={pageBills[0]} settings={settings} />
                    </div>
                  )}
                  {pageBills[1] && (
                    <div className="relative">
                      <div className="absolute top-1 right-2 z-10 text-[9px] font-mono bg-sky-100 text-[#00487c] font-bold px-1.5 py-0.5 rounded border border-sky-300">
                        बिल #{pageBills[1].billNo}
                      </div>
                      <PhysicalBillMemo bill={pageBills[1]} settings={settings} />
                    </div>
                  )}
                </div>

                {/* Horizontal Scissors Cutting Guide */}
                <div className="relative my-2 py-1 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-stone-400" />
                  </div>
                  <span className="relative bg-white px-3 text-[10px] font-mono text-stone-600 border border-stone-300 rounded-full shadow-2xs">
                    ✂ 2-2 सेट कटिंग लाइन (ऊपर के 2 बिल | नीचे के 2 बिल) ✂
                  </span>
                </div>

                {/* Bottom 2 Bills Set */}
                {(pageBills[2] || pageBills[3]) && (
                  <div>
                    <div className="text-[10px] font-bold text-sky-900 uppercase tracking-wider mb-2 flex items-center justify-between border-b pb-1">
                      <span className="font-mono text-[#00487c]">
                        लीगल शीट #{pageIdx + 1} • नीचे का सेट (2 बिल)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {pageBills[2] && (
                        <div className="relative">
                          <div className="absolute top-1 right-2 z-10 text-[9px] font-mono bg-sky-100 text-[#00487c] font-bold px-1.5 py-0.5 rounded border border-sky-300">
                            बिल #{pageBills[2].billNo}
                          </div>
                          <PhysicalBillMemo bill={pageBills[2]} settings={settings} />
                        </div>
                      )}
                      {pageBills[3] && (
                        <div className="relative">
                          <div className="absolute top-1 right-2 z-10 text-[9px] font-mono bg-sky-100 text-[#00487c] font-bold px-1.5 py-0.5 rounded border border-sky-300">
                            बिल #{pageBills[3].billNo}
                          </div>
                          <PhysicalBillMemo bill={pageBills[3]} settings={settings} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* LOADING MODAL WHILE PDF IS BEING GENERATED */}
        {isGeneratingPdf && (
          <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 flex flex-col items-center max-w-sm w-full text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-inner">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h4 className="font-bold text-base text-stone-900">
                  लीगल 2×2 PDF तैयार हो रही है...
                </h4>
                <p className="text-xs text-stone-600 mt-1 font-medium">
                  {pdfProgress
                    ? `पेज ${pdfProgress.current} / ${pdfProgress.total} तैयार किया जा रहा है`
                    : 'कृपया कुछ सेकंड प्रतीक्षा करें...'}
                </p>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden border border-stone-200">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{
                    width: pdfProgress ? `${(pdfProgress.current / pdfProgress.total) * 100}%` : '40%',
                  }}
                />
              </div>
              <p className="text-[11px] text-stone-500">
                PDF तैयार होते ही आपकी डिवाइस में अपने-आप डाउनलोड हो जाएगी, जिसे आप सीधे किसी भी प्रिंटर पर प्रिंट कर सकते हैं।
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
