import React from 'react';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  ReceiptIndianRupee,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
  Calendar,
  Building2,
} from 'lucide-react';
import { MonthBill, PaymentRecord, AgencySettings } from '../types';
import { calculateAreaSummaries, exportToExcel, getDaysInMonth } from '../utils/billingUtils';

interface MonthlyReportViewProps {
  bills: MonthBill[];
  payments: PaymentRecord[];
  settings: AgencySettings;
  activeMonth: string;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  bills,
  payments,
  settings,
  activeMonth,
}) => {
  const daysInMonth = getDaysInMonth(activeMonth);
  const areaSummaries = calculateAreaSummaries(bills);

  // Month-filtered payments
  const monthPayments = payments.filter((p) => p.month === activeMonth);

  const totalBilled = bills.reduce((sum, b) => sum + b.totalPayable, 0);
  const totalPaperAmount = bills.reduce((sum, b) => sum + b.dailyPaperAmount, 0);
  const totalDeliveryAmount = bills.reduce((sum, b) => sum + b.deliveryCharge, 0);
  const totalOldDue = bills.reduce((sum, b) => sum + b.oldDue, 0);

  const totalCollected = bills.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalOutstanding = bills.reduce((sum, b) => sum + b.remainingDue, 0);

  const cashCollected = monthPayments
    .filter((p) => p.mode === 'cash')
    .reduce((sum, p) => sum + p.amount, 0);
  const onlineCollected = monthPayments
    .filter((p) => p.mode !== 'cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Top 5 Outstanding Debtors
  const topDebtors = [...bills]
    .filter((b) => b.remainingDue > 0)
    .sort((a, b) => b.remainingDue - a.remainingDue)
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const summarySheet = [
      { 'मापदंड (Metric)': 'एजेंसी का नाम', 'मान (Value)': `${settings.headerName} (${settings.subHeader}) - ${settings.shopName}` },
      { 'मापदंड (Metric)': 'रिपोर्ट माह', 'मान (Value)': bills[0]?.monthName || activeMonth },
      { 'मापदंड (Metric)': 'माह में कुल दिन', 'मान (Value)': `${daysInMonth} दिन` },
      { 'मापदंड (Metric)': 'दैनिक पेपर दर', 'मान (Value)': `₹${settings.defaultDailyRate} प्रति दिन` },
      { 'मापदंड (Metric)': 'कुल ग्राहक संख्या', 'मान (Value)': bills.length },
      { 'मापदंड (Metric)': 'कुल बिल राशि (₹)', 'मान (Value)': totalBilled },
      { 'मापदंड (Metric)': 'दैनिक पेपर बिल हिस्सा (₹)', 'मान (Value)': totalPaperAmount },
      { 'मापदंड (Metric)': 'मासिक डिलीवरी शुल्क हिस्सा (₹)', 'मान (Value)': totalDeliveryAmount },
      { 'मापदंड (Metric)': 'पुराना बकाया हिस्सा (₹)', 'मान (Value)': totalOldDue },
      { 'मापदंड (Metric)': 'कुल प्राप्त वसूली (₹)', 'मान (Value)': totalCollected },
      { 'मापदंड (Metric)': 'नकद वसूली (Cash ₹)', 'मान (Value)': cashCollected },
      { 'मापदंड (Metric)': 'ऑनलाइन वसूली (UPI/GPay ₹)', 'मान (Value)': onlineCollected },
      { 'मापदंड (Metric)': 'कुल शेष बकाया (₹)', 'मान (Value)': totalOutstanding },
      { 'मापदंड (Metric)': 'वसूली प्रतिशत', 'मान (Value)': `${collectionRate}%` },
    ];

    const areaSheet = areaSummaries.map((a) => ({
      'रूट / एरिया': a.route,
      'कुल ग्राहक': a.totalCustomers,
      'सक्रिय ग्राहक': a.activeCustomers,
      'कुल बिल (₹)': a.totalBilled,
      'प्राप्त राशि (₹)': a.totalCollected,
      'शेष बकाया (₹)': a.totalDue,
      'वसूली प्रतिशत': `${a.collectionRate}%`,
    }));

    const paymentLogSheet = monthPayments.map((p) => ({
      'दिनांक': p.date,
      'ग्राहक का नाम': p.customerName,
      'प्राप्त राशि (₹)': p.amount,
      'भुगतान माध्यम': p.mode,
      'रेफरेंस / UTR': p.referenceNo || '',
      'वसूली कर्ता': p.collectedBy || '',
    }));

    exportToExcel(
      [
        { sheetName: 'Owner_Summary', data: summarySheet },
        { sheetName: 'Area_Wise_Report', data: areaSheet },
        { sheetName: 'Payment_Collection_Log', data: paymentLogSheet },
      ],
      `Ravi_Medical_Monthly_Report_${activeMonth}`
    );
  };

  return (
    <div className="space-y-5" id="printable-owner-report">
      {/* Report Title & Action Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                मासिक व्यापार एवं वित्तीय सारांश (Owner Monthly Report)
              </h3>
              <p className="text-xs text-stone-500">
                {settings.shopName} · {bills[0]?.monthName || activeMonth}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-300 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>एक्सेल रिपोर्ट</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>प्रिंट रिपोर्ट</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Billed Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">कुल बिल राशि (Gross Billed)</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {daysInMonth} दिन @ ₹{settings.defaultDailyRate}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-stone-500">₹</span>
            <span className="text-3xl font-extrabold text-stone-900 font-mono">
              {totalBilled.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-stone-100 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>दैनिक पत्रिका हिस्सा:</span>
              <span className="font-semibold font-mono">₹{totalPaperAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>हॉकर डिलीवरी राजस्व:</span>
              <span className="font-semibold font-mono text-emerald-700">₹{totalDeliveryAmount.toLocaleString('en-IN')}</span>
            </div>
            {totalOldDue > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>पिछला बकाया कैरी-फॉरवर्ड:</span>
                <span className="font-semibold font-mono">₹{totalOldDue.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Collected Amount Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">कुल प्राप्त वसूली (Collected)</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              {collectionRate}% प्राप्त
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-emerald-600">₹</span>
            <span className="text-3xl font-extrabold text-emerald-700 font-mono">
              {totalCollected.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-stone-100 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>ऑनलाइन (PhonePe / GPay / UPI):</span>
              <span className="font-semibold font-mono text-sky-700">₹{onlineCollected.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>नकद वसूली (Cash Collected):</span>
              <span className="font-semibold font-mono">₹{cashCollected.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>प्राप्त रसीदें:</span>
              <span className="font-semibold">{monthPayments.length} भुगतान</span>
            </div>
          </div>
        </div>

        {/* Total Outstanding Dues Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">शेष बकाया राशि (Pending Arrears)</span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              {100 - collectionRate}% बाकी
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-rose-600">₹</span>
            <span className="text-3xl font-extrabold text-rose-600 font-mono">
              {totalOutstanding.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-stone-100 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>बकाया ग्राहक संख्या:</span>
              <span className="font-bold text-rose-600">
                {bills.filter((b) => b.remainingDue > 0).length} ग्राहक
              </span>
            </div>
            <div className="flex justify-between">
              <span>पूर्ण चुक्ता ग्राहक:</span>
              <span className="font-bold text-emerald-700">
                {bills.filter((b) => b.status === 'paid' && b.totalPayable > 0).length} ग्राहक
              </span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>प्रति ग्राहक औसत बिल:</span>
              <span className="font-mono">
                ₹{bills.length > 0 ? Math.round(totalBilled / bills.length) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Area / Route Performance Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-stone-100 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-stone-600" />
            <h4 className="text-xs sm:text-sm font-bold text-stone-800 uppercase tracking-wide">
              रूट / एरिया वार वसूली प्रदर्शन (Area-wise Performance)
            </h4>
          </div>
          <span className="text-xs text-stone-500">{areaSummaries.length} रूट्स</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-700 font-semibold border-b border-stone-200 uppercase">
              <tr>
                <th className="py-2.5 px-4">रूट का नाम</th>
                <th className="py-2.5 px-2 text-center">ग्राहक</th>
                <th className="py-2.5 px-3 text-right">कुल बिल (₹)</th>
                <th className="py-2.5 px-3 text-right">वसूली (₹)</th>
                <th className="py-2.5 px-3 text-right">बकाया (₹)</th>
                <th className="py-2.5 px-4 text-right">रिकवरी दर</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {areaSummaries.map((area) => (
                <tr key={area.route} className="hover:bg-stone-50">
                  <td className="py-2.5 px-4 font-bold text-stone-900">{area.route}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="font-semibold">{area.totalCustomers}</span>
                    <span className="text-[11px] text-stone-500"> ({area.activeCustomers} सक्रिय)</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">
                    ₹{area.totalBilled.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                    ₹{area.totalCollected.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    ₹{area.totalDue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-stone-200 rounded-full h-2 overflow-hidden hidden sm:block">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, area.collectionRate)}%` }}
                        />
                      </div>
                      <span className="font-bold font-mono text-stone-900 w-10 text-right">
                        {area.collectionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-stone-100 font-bold border-t border-stone-200">
              <tr>
                <td className="py-2.5 px-4">कुल योग (Total)</td>
                <td className="py-2.5 px-2 text-center">{bills.length}</td>
                <td className="py-2.5 px-3 text-right font-mono">₹{totalBilled.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-700">₹{totalCollected.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right font-mono text-rose-600">₹{totalOutstanding.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-4 text-right font-mono text-stone-900">{collectionRate}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 2-Columns: Top Debtors & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Pending Defaulters */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-rose-50/70 border-b border-rose-200 flex items-center justify-between text-xs">
            <span className="font-bold text-rose-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              शीर्ष बकायादार ग्राहक (Top Pending Arrears)
            </span>
            <span className="text-rose-700 font-medium">तत्काल तकादा आवश्यक</span>
          </div>
          <div className="divide-y divide-stone-100 text-xs">
            {topDebtors.map((d) => (
              <div key={d.id} className="p-3 flex items-center justify-between hover:bg-stone-50">
                <div>
                  <div className="font-bold text-stone-900">{d.customerName}</div>
                  <div className="text-[11px] text-stone-500">
                    कोड: {d.customerCode} · रूट: {d.route} · फोन: {d.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-rose-600 font-mono text-sm">
                    ₹{d.remainingDue}
                  </div>
                  <span className="text-[10px] text-stone-400">
                    (पुराना: ₹{d.oldDue})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payment Receipts */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              माह में प्राप्त भुगतान रसीदें (Recent Collections)
            </span>
            <span className="text-emerald-800 font-mono font-medium">
              {monthPayments.length} भुगतान
            </span>
          </div>
          <div className="divide-y divide-stone-100 text-xs max-h-64 overflow-y-auto">
            {monthPayments.length === 0 ? (
              <div className="p-6 text-center text-stone-400">इस माह में अभी कोई भुगतान दर्ज नहीं है।</div>
            ) : (
              monthPayments.slice(0, 10).map((p) => (
                <div key={p.id} className="p-2.5 px-3.5 flex items-center justify-between hover:bg-stone-50">
                  <div>
                    <span className="font-bold text-stone-900 block">{p.customerName}</span>
                    <span className="text-[11px] text-stone-500">
                      {p.date} · {p.mode.toUpperCase()} {p.referenceNo ? `· ${p.referenceNo}` : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-emerald-700 text-sm">
                      +₹{p.amount}
                    </span>
                    <span className="block text-[10px] text-stone-400">
                      द्वारा: {p.collectedBy || 'Ravi'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
