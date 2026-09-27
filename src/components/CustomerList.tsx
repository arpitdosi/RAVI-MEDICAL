import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Phone,
  Share2,
  Printer,
  CreditCard,
  Edit,
  Trash2,
  MapPin,
  ChevronDown,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Clock,
  LayoutList,
  LayoutGrid,
  CalendarOff,
  History,
  Receipt,
  UploadCloud,
  Download,
  Plus,
  PlusCircle,
  BookUser,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Customer, MonthBill, AgencySettings } from '../types';
import {
  createWhatsAppUrl,
  generateWhatsAppBillText,
  exportToExcel,
  downloadCustomerExcelTemplate,
} from '../utils/billingUtils';
import { shareBillOnWhatsApp } from '../utils/shareUtils';
import { PhysicalBillMemo } from './PhysicalBillMemo';

interface CustomerListProps {
  bills: MonthBill[];
  customers: Customer[];
  settings: AgencySettings;
  routes: string[];
  onOpenBill: (bill: MonthBill) => void;
  onRecordPayment: (bill: MonthBill) => void;
  onOpenTransaction?: (customerId: string, defaultType?: 'jama' | 'udhar') => void;
  onOpenLedger?: (customer: Customer, bill?: MonthBill) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onUpdatePauseDays: (customerId: string, days: number) => void;
  onOpenExcelImport?: () => void;
  onOpenNewCustomer?: () => void;
  onClearAllData?: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  bills,
  customers,
  settings,
  routes,
  onOpenBill,
  onRecordPayment,
  onOpenTransaction,
  onOpenLedger,
  onEditCustomer,
  onDeleteCustomer,
  onUpdatePauseDays,
  onOpenExcelImport,
  onOpenNewCustomer,
  onClearAllData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unpaid' | 'paid' | 'paused'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // Default to cards on mobile (<768px), table on desktop
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'cards' : 'table';
    }
    return 'cards';
  });
  const [quickVacationCustomerId, setQuickVacationCustomerId] = useState<string | null>(null);
  const [quickVacationDays, setQuickVacationDays] = useState<number>(0);

  // WhatsApp Smart Share states
  const [sharingBillId, setSharingBillId] = useState<string | null>(null);
  const [sharingBill, setSharingBill] = useState<MonthBill | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string>('');

  const handleShareWhatsApp = async (bill: MonthBill) => {
    if (sharingBillId) return;
    setSharingBillId(bill.id);
    setSharingBill(bill);
    setShareFeedback('');

    // Wait a brief moment for React to mount the hidden bill memo in the DOM
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const result = await shareBillOnWhatsApp(bill, settings, 'customer-list-share-memo');
      if (result.message && result.mode !== 'cancelled') {
        setShareFeedback(`${bill.customerName}: ${result.message}`);
        setTimeout(() => setShareFeedback(''), 4500);
      }
    } catch (err) {
      console.error('Error sharing bill from customer list:', err);
    } finally {
      setSharingBillId(null);
    }
  };

  // Map customer dictionary for quick lookup
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  // Filtering
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        b.customerName.toLowerCase().includes(search) ||
        b.phone.includes(search) ||
        b.customerCode.toLowerCase().includes(search) ||
        b.route.toLowerCase().includes(search);

      // Route
      const matchRoute = selectedRoute === 'all' || b.route === selectedRoute;

      // Status
      let matchStatus = true;
      if (selectedStatus === 'unpaid') {
        matchStatus = b.remainingDue > 0;
      } else if (selectedStatus === 'paid') {
        matchStatus = b.status === 'paid' && b.totalPayable > 0;
      } else if (selectedStatus === 'paused') {
        const cust = customerMap.get(b.customerId);
        matchStatus = cust?.status === 'paused' || b.pauseDays > 0;
      }

      return matchSearch && matchRoute && matchStatus;
    });
  }, [bills, searchTerm, selectedRoute, selectedStatus, customerMap]);

  // Pagination
  const totalPages = Math.ceil(filteredBills.length / pageSize) || 1;
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  // Handle Export Filtered List to Excel
  const handleExportFiltered = () => {
    const exportData = filteredBills.map((b) => ({
      'ग्राहक कोड': b.customerCode,
      'ग्राहक नाम': b.customerName,
      'व्हाट्सएप फोन': b.phone,
      'रूट / एरिया': b.route,
      'बिल माह': b.month,
      'दैनिक पेपर दिन': b.billedDays,
      'पेपर दर (₹)': b.ratePerDay,
      'पेपर राशि (₹)': b.dailyPaperAmount,
      'डिलीवरी चार्ज (₹)': b.deliveryCharge,
      'पुराना बकाया (₹)': b.oldDue,
      'कुल बिल (₹)': b.totalPayable,
      'जमा राशि (₹)': b.paidAmount,
      'शेष देय (₹)': b.remainingDue,
      'भुगतान स्थिति': b.remainingDue <= 0 ? 'सफल भुगतान (Paid)' : 'बकाया (Pending)',
    }));

    exportToExcel(
      [{ sheetName: 'Bills_Register', data: exportData }],
      `Patrika_Billing_${settings.shopName.replace(/\s+/g, '_')}_${filteredBills[0]?.month || '2026'}`
    );
  };

  // If there are no customers, show clean state with single-click Excel import options (AFTER all hooks to obey Rules of Hooks)
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-10 shadow-xs text-center max-w-3xl mx-auto space-y-6 my-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>डेटाबेस साफ़ है (0 ग्राहक) · एक्सेल अपलोड हेतु तैयार</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            सारा पुराना डेटा डिलीट कर दिया गया है!
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
            अब आप अपनी 400 से 500 ग्राहकों की एक्सेल शीट (<span className="font-mono text-emerald-700 font-semibold">.xlsx, .xls, .csv</span>) सीधे अपलोड कर सकते हैं। बिल कोड, एरिया/रूट, पुराना बकाया और डिलीवरी चार्ज अपने आप सेट हो जाएंगे।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onOpenExcelImport && (
            <button
              type="button"
              onClick={onOpenExcelImport}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all text-sm cursor-pointer"
            >
              <UploadCloud className="w-5 h-5 text-emerald-200" />
              <span>एक्सेल फाइल अपलोड करें (Upload Excel)</span>
            </button>
          )}

          <button
            type="button"
            onClick={downloadCustomerExcelTemplate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl border border-stone-300 transition-all text-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span>सैंपल एक्सेल फॉर्मेट डाउनलोड करें</span>
          </button>

          {onOpenNewCustomer && (
            <button
              type="button"
              onClick={onOpenNewCustomer}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 text-stone-700 hover:text-stone-900 font-medium text-sm transition-all cursor-pointer hover:bg-stone-50 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>+ मैन्युअल ग्राहक जोड़ें</span>
            </button>
          )}
        </div>

        {/* Accepted Excel Columns Guidance */}
        <div className="bg-stone-50/80 rounded-xl p-4 sm:p-5 border border-stone-200 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
              <span>📋</span>
              <span>आपकी एक्सेल शीट में समर्थित कॉलम (Supported Columns):</span>
            </span>
            <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              हिंदी अथवा English दोनों मान्य
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-stone-700 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
              <span className="font-bold text-stone-900 block text-xs">नाम (Customer Name)</span>
              <span className="text-[11px] text-stone-500">उदा: कैलाश होटल, राजेन्द्र सेवक</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
              <span className="font-bold text-stone-900 block text-xs">मोबाइल (Phone / WhatsApp)</span>
              <span className="text-[11px] text-stone-500">उदा: 9413015952 (10 अंक)</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
              <span className="font-bold text-stone-900 block text-xs">रूट / मोहल्ला (Route / Area)</span>
              <span className="text-[11px] text-stone-500">उदा: मेन मार्केट, पंचाल वाड़ा</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
              <span className="font-bold text-stone-900 block text-xs">बिल नं / कोड (Bill No / Code)</span>
              <span className="text-[11px] text-stone-500">उदा: 35390, 35391 या 101</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
              <span className="font-bold text-stone-900 block text-xs">पुराना बकाया (Old Due / Balance)</span>
              <span className="text-[11px] text-stone-500">उदा: 450, 0, 1200</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
              <span className="font-bold text-stone-900 block text-xs">डिलीवरी चार्ज (Delivery Charge)</span>
              <span className="text-[11px] text-stone-500">उदा: ₹5 (मासिक ₹5)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden off-screen bill memo for capturing authentic bill image on WhatsApp share */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '420px',
          background: '#ffffff',
          zIndex: -999,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {sharingBill && (
          <div id="customer-list-share-memo" className="p-2 bg-white">
            <PhysicalBillMemo bill={sharingBill} settings={settings} />
          </div>
        )}
      </div>

      {/* WhatsApp Share Feedback Notification Toast */}
      {shareFeedback && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#002f54] text-white px-4 py-3 rounded-xl shadow-2xl border border-sky-400 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-400/30">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-xs sm:text-sm font-semibold leading-snug">{shareFeedback}</p>
        </div>
      )}

      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ग्राहक नाम, मोबाइल, कोड (RP-101) या एरिया खोजें..."
              className="w-full pl-9 pr-4 py-2 text-sm sm:text-base border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder:text-stone-400"
            />
          </div>

          {/* Filters & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Route Filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedRoute}
                onChange={(e) => {
                  setSelectedRoute(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto pl-3 pr-8 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-stone-700"
              >
                <option value="all">सभी रूट्स (All Routes)</option>
                {routes.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="flex-1 sm:flex-none pl-3 pr-8 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-stone-700"
            >
              <option value="all">सभी स्थिति (All)</option>
              <option value="unpaid">केवल बकाया (Pending Dues)</option>
              <option value="paid">पूर्ण भुगतान (Paid)</option>
              <option value="paused">रोक / छुट्टी (Paused / Leave)</option>
            </select>

            {/* View Mode Toggle (Available for Mobile & Desktop) */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 sm:px-2.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="मोबाइल कार्ड दृश्य (Mobile Card View)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">कार्ड</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 sm:px-2.5 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="तालिका दृश्य (Table View)"
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline">तालिका</span>
              </button>
            </div>

            {/* Excel Export Button */}
            <button
              type="button"
              onClick={handleExportFiltered}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-300 transition-colors cursor-pointer"
              title="वर्तमान सूची को एक्सेल में एक्सपोर्ट करें"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>एक्सेल निकालें</span>
            </button>

            {/* Clear All Data Button (Fresh Excel Start) */}
            {onClearAllData && (
              <button
                type="button"
                onClick={onClearAllData}
                className="hidden xl:inline-flex items-center gap-1 px-2.5 py-2 text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 text-xs font-medium transition-colors cursor-pointer"
                title="सभी ग्राहकों और लेन-देन का डेटा डिलीट करें (नई एक्सेल अपलोड के लिए)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>सारा डेटा साफ़ करें</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Result Counter */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
          <div>
            कुल <strong>{filteredBills.length}</strong> ग्राहक दिखे (पृष्ठ {currentPage}/{totalPages})
          </div>
          <div className="flex items-center gap-2">
            <span>प्रति पृष्ठ:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-stone-300 rounded px-1.5 py-0.5 text-xs bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Listing View */}
      {viewMode === 'table' ? (
        /* Dense Desktop Table View */
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#002f54] text-white font-semibold border-b border-[#00223d] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">बिल नं. / ग्राहक (Shri)</th>
                  <th className="py-3 px-3">रूट व फोन</th>
                  <th className="py-3 px-2 text-center">पेपर दिन (@₹5)</th>
                  <th className="py-3 px-2 text-right">D.C. (₹)</th>
                  <th className="py-3 px-2 text-right">Old Due (₹)</th>
                  <th className="py-3 px-2 text-right">TOTAL (₹)</th>
                  <th className="py-3 px-2 text-right">जमा (₹)</th>
                  <th className="py-3 px-3 text-right">शेष देय (₹)</th>
                  <th className="py-3 px-3 text-center">स्थिति</th>
                  <th className="py-3 px-3 text-right">कार्य (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {paginatedBills.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-stone-500">
                      कोई ग्राहक या बिल नहीं मिला। (No matching customers found)
                    </td>
                  </tr>
                ) : (
                  paginatedBills.map((bill) => {
                    const cust = customerMap.get(bill.customerId);
                    const whatsAppText = generateWhatsAppBillText(bill, settings);
                    const whatsAppUrl = createWhatsAppUrl(bill.phone, whatsAppText);

                    return (
                      <tr key={bill.id} className="hover:bg-sky-50/40 transition-colors">
                        {/* Customer Code & Name */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-[#00487c] bg-sky-100/80 px-2 py-0.5 rounded border border-sky-200">
                              #{bill.billNo}
                            </span>
                            <span className="font-bold text-stone-900 text-sm">
                              {bill.customerName}
                            </span>
                          </div>
                          {cust?.address && (
                            <p className="text-[11px] text-stone-500 truncate max-w-xs mt-0.5">
                              {cust.address}
                            </p>
                          )}
                        </td>

                        {/* Route & Phone */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 text-stone-800 font-medium">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{bill.route}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {bill.phone ? (
                              <span>{bill.phone}</span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </div>
                        </td>

                        {/* Billed Days & Paper Cost */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="font-bold text-stone-900">
                            {bill.billedDays} दिन
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono">
                            = ₹{bill.dailyPaperAmount}
                          </div>
                          {bill.pauseDays > 0 && (
                            <span className="inline-block text-[10px] text-amber-700 font-semibold bg-amber-50 px-1 rounded">
                              -${bill.pauseDays} दिन छुट्टी
                            </span>
                          )}
                        </td>

                        {/* Delivery Charge */}
                        <td className="py-2.5 px-2 text-right font-mono font-medium text-stone-700">
                          ₹{bill.deliveryCharge}
                        </td>

                        {/* Old Due */}
                        <td className="py-2.5 px-2 text-right font-mono">
                          {bill.oldDue > 0 ? (
                            <span className="text-rose-600 font-bold">₹{bill.oldDue}</span>
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </td>

                        {/* Total Bill */}
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-stone-900">
                          ₹{bill.totalPayable}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-2.5 px-2 text-right font-mono">
                          {bill.paidAmount > 0 ? (
                            <span className="text-emerald-700 font-bold">₹{bill.paidAmount}</span>
                          ) : (
                            <span className="text-stone-400">0</span>
                          )}
                        </td>

                        {/* Remaining Due */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          {bill.remainingDue > 0 ? (
                            <span className="text-sm font-black text-rose-600">
                              ₹{bill.remainingDue}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700">चुक्ता</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center">
                          {bill.remainingDue <= 0 && bill.totalPayable > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              <span>जमा</span>
                            </span>
                          ) : bill.paidAmount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>आंशिक</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              <span>बकाया</span>
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Button with Bill Image */}
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(bill)}
                              disabled={sharingBillId === bill.id}
                              className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-60"
                              title="WhatsApp पर बिल पर्ची (फोटो सहित) भेजें"
                            >
                              {sharingBillId === bill.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* View / Print Bill Slip */}
                            <button
                              type="button"
                              onClick={() => onOpenBill(bill)}
                              className="p-1.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                              title="बिल रसीद व QR कोड देखें"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Record Payment (पेमेंट लें) */}
                            <button
                              type="button"
                              onClick={() => onRecordPayment(bill)}
                              className="p-1.5 rounded-md bg-[#00487c] hover:bg-[#003865] text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                              title="पेमेंट लें (भुगतान प्राप्त दर्ज करें)"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline text-xs font-semibold">पेमेंट लें</span>
                            </button>

                            {/* Add Udhar (उधार जोड़ें) */}
                            {onOpenTransaction && (
                              <button
                                type="button"
                                onClick={() => onOpenTransaction(bill.customerId, 'udhar')}
                                className="p-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                                title="उधार जोड़ें (नया उधार दर्ज करें)"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline text-xs font-semibold">उधार जोड़ें</span>
                              </button>
                            )}

                            {/* Khata Statement / Passbook */}
                            {onOpenLedger && cust && (
                              <button
                                type="button"
                                onClick={() => onOpenLedger(cust, bill)}
                                className="p-1.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors cursor-pointer"
                                title="ग्राहक खाता बही (Ledger / Statement)"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit Customer */}
                            {cust && (
                              <button
                                type="button"
                                onClick={() => onEditCustomer(cust)}
                                className="p-1.5 rounded-md hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                                title="ग्राहक विवरण एडिट करें"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Customer */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`क्या आप ${bill.customerName} को हटाना चाहते हैं?`)) {
                                  onDeleteCustomer(bill.customerId);
                                }
                              }}
                              className="p-1.5 rounded-md hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="ग्राहक हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mobile Card Grid View (Touch Optimized) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedBills.map((bill) => {
            const cust = customerMap.get(bill.customerId);
            const whatsAppText = generateWhatsAppBillText(bill, settings);
            const whatsAppUrl = createWhatsAppUrl(bill.phone, whatsAppText);

            return (
              <div
                key={bill.id}
                className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-[#00487c] bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                        बिल #{bill.billNo}
                      </span>
                      <h4 className="font-bold text-stone-900 text-sm leading-tight">
                        {bill.customerName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{bill.route}</span>
                      </p>
                      {bill.phone && (
                        <p className="text-xs text-stone-600 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{bill.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {bill.remainingDue <= 0 ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        जमा (Paid)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        ₹{bill.remainingDue} बाकी
                      </span>
                    )}
                  </div>
                </div>

                {/* Bill Breakdown Line */}
                <div className="bg-stone-50 rounded-lg p-2.5 text-xs grid grid-cols-3 gap-1 text-center border border-stone-100">
                  <div>
                    <span className="text-stone-500 block text-[10px]">पेपर ({bill.billedDays} दिन)</span>
                    <span className="font-bold text-stone-800 font-mono">₹{bill.dailyPaperAmount}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px]">डिलीवरी</span>
                    <span className="font-bold text-stone-800 font-mono">₹{bill.deliveryCharge}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px]">पुराना बकाया</span>
                    <span className={`font-bold font-mono ${bill.oldDue > 0 ? 'text-rose-600' : 'text-stone-400'}`}>
                      ₹{bill.oldDue}
                    </span>
                  </div>
                </div>

                {/* Total & Due */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                  <div>
                    <span className="text-stone-500">कुल बिल: </span>
                    <span className="font-bold font-mono text-stone-900">₹{bill.totalPayable}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">अंतिम देय: </span>
                    <span className="font-extrabold font-mono text-base text-rose-600">
                      ₹{bill.remainingDue}
                    </span>
                  </div>
                </div>

                {/* Mobile Optimized Touch Actions */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  {/* Primary Financial Action Pair: पेमेंट लें & उधार जोड़ें Side-by-Side */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onRecordPayment(bill)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#00487c] hover:bg-[#003865] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer active:scale-98"
                      title="भुगतान प्राप्त दर्ज करें (पेमेंट लें)"
                    >
                      <CreditCard className="w-4 h-4 text-sky-200 shrink-0" />
                      <span>पेमेंट लें</span>
                    </button>

                    {onOpenTransaction && (
                      <button
                        type="button"
                        onClick={() => onOpenTransaction(bill.customerId, 'udhar')}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer active:scale-98"
                        title="ग्राहक के खाते में नया उधार जोड़ें"
                      >
                        <PlusCircle className="w-4 h-4 text-amber-100 shrink-0" />
                        <span>उधार जोड़ें</span>
                      </button>
                    )}
                  </div>

                  {/* Primary WhatsApp Action Button with Bill Image */}
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(bill)}
                    disabled={sharingBillId === bill.id}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-70 w-full"
                    title="WhatsApp पर बिल फोटो और विवरण भेजें"
                  >
                    {sharingBillId === bill.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                        <span>बिल फोटो तैयार हो रही है...</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-emerald-100 shrink-0" />
                        <span>WhatsApp बिल भेजें (फोटो सहित)</span>
                      </>
                    )}
                  </button>

                  {/* Secondary Mobile Actions 4-Column Grid */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenBill(bill)}
                      className="flex flex-col items-center justify-center py-2 px-1 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                      title="बिल पर्ची रसीद देखें व प्रिंट करें"
                    >
                      <Printer className="w-3.5 h-3.5 text-stone-600 mb-0.5" />
                      <span>पर्ची</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cust && onOpenLedger?.(cust, bill)}
                      className="flex flex-col items-center justify-center py-2 px-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                      title="खाता बही (Ledger / Statement)"
                    >
                      <History className="w-3.5 h-3.5 text-amber-700 mb-0.5" />
                      <span>खाता</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cust && onEditCustomer(cust)}
                      className="flex flex-col items-center justify-center py-2 px-1 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                      title="ग्राहक विवरण एडिट करें"
                    >
                      <Edit className="w-3.5 h-3.5 text-stone-500 mb-0.5" />
                      <span>एडिट</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`क्या आप ${bill.customerName} को हटाना चाहते हैं?`)) {
                          onDeleteCustomer(bill.customerId);
                        }
                      }}
                      className="flex flex-col items-center justify-center py-2 px-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                      title="ग्राहक हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500 mb-0.5" />
                      <span>हटाएं</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 border border-stone-300 rounded-md font-medium text-stone-700 disabled:opacity-40 cursor-pointer"
          >
            पिछला पृष्ठ (Previous)
          </button>
          <span className="text-stone-600 font-medium">
            पृष्ठ {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 border border-stone-300 rounded-md font-medium text-stone-700 disabled:opacity-40 cursor-pointer"
          >
            अगला पृष्ठ (Next)
          </button>
        </div>
      )}
    </div>
  );
};
