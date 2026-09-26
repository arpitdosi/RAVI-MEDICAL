import React from 'react';
import {
  Newspaper,
  Calendar,
  FileSpreadsheet,
  Plus,
  Printer,
  Settings,
  BellRing,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
  Layers,
  Receipt,
  BookUser,
  ExternalLink,
} from 'lucide-react';
import { AgencySettings } from '../types';
import { getMonthLabel } from '../utils/billingUtils';

interface HeaderProps {
  settings: AgencySettings;
  activeMonth: string;
  onMonthChange: (month: string) => void;
  activeTab: 'customers' | 'reminders' | 'reports';
  onTabChange: (tab: 'customers' | 'reminders' | 'reports') => void;
  onOpenNewCustomer: () => void;
  onOpenExcelImport: () => void;
  onOpenBatchPrint: () => void;
  onOpenSettings: () => void;
  onOpenTransactionModal: (defaultType?: 'jama' | 'udhar') => void;
  customerCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeMonth,
  onMonthChange,
  activeTab,
  onTabChange,
  onOpenNewCustomer,
  onOpenExcelImport,
  onOpenBatchPrint,
  onOpenSettings,
  onOpenTransactionModal,
  customerCount,
}) => {
  const handlePrevMonth = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonth);
  };

  const handleNextMonth = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonth);
  };

  return (
    <header className="bg-[#002f54] text-stone-100 border-b border-[#00223d] sticky top-0 z-30 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Agency Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs font-bold shrink-0">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
                  {settings.headerName} · {settings.shopName}
                </h1>
                <span className="text-[11px] font-bold text-sky-200 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                  बागीदौरा (बांसवाड़ा)
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-1 flex items-center gap-2">
                <span>{settings.paperName} दैनिक एजेंसी</span>
                <span className="text-sky-400">·</span>
                <span>कुल {customerCount} ग्राहक</span>
                <span className="text-sky-400">·</span>
                <span className="text-emerald-300 font-semibold">दर: ₹{settings.defaultDailyRate}/दिन</span>
              </p>
            </div>
          </div>

          {/* Month Selector & Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Selector */}
            <div className="flex items-center bg-[#00223d] rounded-lg p-1 border border-sky-900/60 text-sm">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="पिछला माह"
                className="p-1.5 hover:bg-sky-900/60 rounded text-sky-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2 flex items-center gap-1.5 font-medium text-amber-300 text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{getMonthLabel(activeMonth)}</span>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                title="अगला माह"
                className="p-1.5 hover:bg-sky-900/60 rounded text-sky-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Entry: Jama / Udhar Button */}
            <button
              type="button"
              onClick={() => onOpenTransactionModal('jama')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer border border-emerald-500"
              title="ग्राहक भुगतान जमा या नया उधार दर्ज करें"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-200" />
              <span>+ जमा / नया उधार</span>
            </button>

            {/* Legal Page 4-in-1 Batch Print Button */}
            <button
              type="button"
              onClick={onOpenBatchPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black rounded-lg shadow-sm transition-colors cursor-pointer border border-amber-300"
              title="लीगल पेज पर 4 बिल प्रिंट करें (2x2 Grid)"
            >
              <Printer className="w-4 h-4 text-stone-900" />
              <span>लीगल पेज प्रिंट (4-इन-1)</span>
            </button>

            {/* Excel Import */}
            <button
              type="button"
              onClick={onOpenExcelImport}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${
                customerCount === 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold ring-2 ring-emerald-300'
                  : 'bg-[#00487c] hover:bg-[#003d6a] text-sky-100 font-semibold'
              } text-xs rounded-lg border border-sky-700 transition-colors cursor-pointer shadow-xs`}
              title="Excel 400-500 ग्राहक शीट इम्पोर्ट"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${customerCount === 0 ? 'text-white' : 'text-emerald-400'}`} />
              <span>एक्सेल इम्पोर्ट</span>
            </button>

            {/* New Customer */}
            <button
              type="button"
              onClick={onOpenNewCustomer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>नया ग्राहक</span>
            </button>

            {/* Standalone Fullscreen button */}
            <button
              type="button"
              onClick={() => window.open(window.location.href, '_blank')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#00223d] hover:bg-sky-900 text-sky-200 hover:text-white text-xs font-medium rounded-lg border border-sky-800 transition-colors cursor-pointer"
              title="ब्राउज़र फुल-स्क्रीन / नई विंडो में खोलें"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">फुल स्क्रीन</span>
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-sky-200 hover:text-white hover:bg-[#00223d] rounded-lg border border-transparent hover:border-sky-800 transition-colors cursor-pointer"
              title="मेमो व एजेंसी सेटिंग्स"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-sky-900/60 pt-1 pb-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => onTabChange('customers')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-white text-[#003865] shadow-xs'
                : 'text-sky-200 hover:text-white hover:bg-sky-900/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ग्राहक एवं बिल पर्ची सूची</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('reminders')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'reminders'
                ? 'bg-white text-[#003865] shadow-xs'
                : 'text-sky-200 hover:text-white hover:bg-sky-900/40'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>पेमेंट रिमाइंडर (WhatsApp)</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('reports')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white text-[#003865] shadow-xs'
                : 'text-sky-200 hover:text-white hover:bg-sky-900/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>मालिक मासिक रिपोर्ट (Owner Summary)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
