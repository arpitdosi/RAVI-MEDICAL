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
  BookUser,
  Sparkles,
} from 'lucide-react';
import { Customer, MonthBill, AgencySettings } from '../types';
import {
  createWhatsAppUrl,
  generateWhatsAppBillText,
  exportToExcel,
  downloadCustomerExcelTemplate,
} from '../utils/billingUtils';

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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [quickVacationCustomerId, setQuickVacationCustomerId] = useState<string | null>(null);
  const [quickVacationDays, setQuickVacationDays] = useState<number>(0);

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
      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ग्राहक का नाम, मोबाइल नंबर, कोड (RP-101) या एरिया खोजें..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder:text-stone-400"
            />
          </div>

          {/* Route Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedRoute}
                onChange={(e) => {
                  setSelectedRoute(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-8 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-stone-700"
              >
                <option value="all">सभी रूट्स / एरिया (All Routes)</option>
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
              className="pl-3 pr-8 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-stone-700"
            >
              <option value="all">सभी स्थिति (All)</option>
              <option value="unpaid">केवल बकाया (Pending Dues)</option>
              <option value="paid">पूर्ण भुगतान (Paid)</option>
              <option value="paused">रोक / छुट्टी (Paused / Leave)</option>
            </select>

            {/* View Mode Toggle (Desktop only) */}
            <div className="hidden sm:flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="तालिका दृश्य (Table View)"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="कार्ड दृश्य (Mobile Card View)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Jama / Udhar Button */}
            {onOpenTransaction && (
              <button
                type="button"
                onClick={() => onOpenTransaction('', 'jama')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer border border-emerald-500"
                title="ग्राहक भुगतान जमा या नया उधार दर्ज करें"
              >
                <Receipt className="w-4 h-4 text-emerald-100" />
                <span>+ जमा / उधार</span>
              </button>
            )}

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
                            {/* WhatsApp Button */}
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              title="व्हाट्सएप पर बिल भेजें"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </a>

                            {/* View / Print Bill Slip */}
                            <button
                              type="button"
                              onClick={() => onOpenBill(bill)}
                              className="p-1.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                              title="बिल रसीद व QR कोड देखें"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Record Payment */}
                            <button
                              type="button"
                              onClick={() => onRecordPayment(bill)}
                              className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors cursor-pointer"
                              title="भुगतान प्राप्त दर्ज करें"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>

                            {/* Khata Entry (Jama / Udhar) */}
                            {onOpenTransaction && (
                              <button
                                type="button"
                                onClick={() => onOpenTransaction(bill.customerId, 'jama')}
                                className="p-1.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
                                title="खाता एंट्री (रकम जमा या नया उधार दर्ज करें)"
                              >
                                <Receipt className="w-3.5 h-3.5" />
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

                {/* Touch Actions */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100">
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onOpenBill(bill)}
                    className="flex items-center justify-center gap-1 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>बिल पर्ची</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRecordPayment(bill)}
                    className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>पेमेंट</span>
                  </button>
                </div>

                {/* Additional Quick Khata Actions for Mobile */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {onOpenTransaction && (
                    <button
                      type="button"
                      onClick={() => onOpenTransaction(bill.customerId, 'jama')}
                      className="flex items-center justify-center gap-1.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ जमा / उधार</span>
                    </button>
                  )}
                  {onOpenLedger && cust && (
                    <button
                      type="button"
                      onClick={() => onOpenLedger(cust, bill)}
                      className="flex items-center justify-center gap-1.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-sky-600" />
                      <span>खाता पासबुक</span>
                    </button>
                  )}
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
