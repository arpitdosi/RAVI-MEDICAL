import React from 'react';
import {
  Users,
  ReceiptIndianRupee,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Truck,
  FileText,
} from 'lucide-react';
import { MonthBill, AgencySettings } from '../types';
import { getDaysInMonth } from '../utils/billingUtils';

interface DashboardStatsProps {
  bills: MonthBill[];
  settings: AgencySettings;
  activeMonth: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  bills,
  settings,
  activeMonth,
}) => {
  const daysInMonth = getDaysInMonth(activeMonth);
  const totalCustomers = bills.length;
  const activeCount = bills.filter((b) => b.billedDays > 0).length;
  const pausedCount = totalCustomers - activeCount;

  const totalBilled = bills.reduce((sum, b) => sum + b.totalPayable, 0);
  const totalCollected = bills.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalDue = bills.reduce((sum, b) => sum + b.remainingDue, 0);

  const paperShare = bills.reduce((sum, b) => sum + b.dailyPaperAmount, 0);
  const deliveryShare = bills.reduce((sum, b) => sum + b.deliveryCharge, 0);
  const oldDueShare = bills.reduce((sum, b) => sum + b.oldDue, 0);

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
  const pendingCount = bills.filter((b) => b.remainingDue > 0).length;
  const paidCount = bills.filter((b) => b.status === 'paid' && b.totalPayable > 0).length;

  return (
    <div className="space-y-3">
      {/* Rate & Formula Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-amber-900 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-950 flex items-center gap-1">
            <ReceiptIndianRupee className="w-4 h-4 text-amber-700" />
            मासिक बिलिंग सूत्र (Billing Rule):
          </span>
          <span>
            दैनिक पत्रिका (<strong>{daysInMonth} दिन × ₹{settings.defaultDailyRate} = ₹{daysInMonth * settings.defaultDailyRate}</strong>)
            + डिलीवरी चार्ज (₹{settings.defaultDeliveryCharge}) + पुराना बकाया = <strong>कुल बिल</strong>
          </span>
        </div>
        <div className="flex items-center gap-3 text-stone-600">
          <span>हॉकर/एरिया: <strong>6 रूट्स</strong></span>
          <span className="text-stone-300">|</span>
          <span>सक्रिय ग्राहक: <strong className="text-emerald-700">{activeCount}</strong></span>
          {pausedCount > 0 && (
            <>
              <span className="text-stone-300">|</span>
              <span>रोक/छुट्टी: <strong className="text-amber-700">{pausedCount}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* 4 Primary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Customers */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">कुल ग्राहक (Customers)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">{totalCustomers}</span>
            <span className="text-xs text-stone-500">
              ({activeCount} चालू / {pausedCount} रोक)
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>सफल भुगतान: <strong className="text-emerald-600">{paidCount}</strong></span>
            <span>बाकी: <strong className="text-rose-600">{pendingCount}</strong></span>
          </div>
        </div>

        {/* Total Monthly Bill */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">कुल बिल राशि (Total Billed)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs text-stone-500 font-semibold">₹</span>
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">{totalBilled.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>पेपर: ₹{paperShare}</span>
            <span>डिलीवरी: ₹{deliveryShare}</span>
            {oldDueShare > 0 && <span>पुराना: ₹{oldDueShare}</span>}
          </div>
        </div>

        {/* Collected Amount */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">कुल जमा (Collected)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs text-emerald-600 font-semibold">₹</span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-700">
              {totalCollected.toLocaleString('en-IN')}
            </span>
            <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {collectionRate}%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
            <span>वसूली प्रतिशत</span>
            <span className="text-emerald-700 font-semibold">{collectionRate}% प्राप्त</span>
          </div>
        </div>

        {/* Total Outstanding Dues */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">कुल शेष बकाया (Total Due)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs text-rose-600 font-semibold">₹</span>
            <span className="text-2xl sm:text-3xl font-bold text-rose-600">
              {totalDue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-stone-500">लंबित ग्राहक</span>
            <span className="text-rose-600 font-bold">{pendingCount} ग्राहक बकाया</span>
          </div>
        </div>
      </div>
    </div>
  );
};
