import React, { useState } from 'react';
import {
  BellRing,
  Share2,
  Copy,
  Check,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  MessageSquare,
  Sparkles,
  Phone,
} from 'lucide-react';
import { MonthBill, AgencySettings } from '../types';
import {
  ReminderType,
  generatePaymentReminderText,
  createWhatsAppUrl,
} from '../utils/billingUtils';

interface RemindersViewProps {
  bills: MonthBill[];
  settings: AgencySettings;
  routes: string[];
  onMarkReminderSent?: (billId: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  bills,
  settings,
  routes,
  onMarkReminderSent,
}) => {
  const [reminderType, setReminderType] = useState<ReminderType>('gentle');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter only debtors
  const pendingBills = bills
    .filter((b) => b.remainingDue > 0)
    .filter((b) => selectedRoute === 'all' || b.route === selectedRoute)
    .sort((a, b) => b.remainingDue - a.remainingDue);

  const totalPendingSum = pendingBills.reduce((sum, b) => sum + b.remainingDue, 0);

  const handleCopyText = (bill: MonthBill) => {
    const text = generatePaymentReminderText(bill, settings, reminderType);
    navigator.clipboard.writeText(text);
    setCopiedId(bill.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWhatsApp = (bill: MonthBill) => {
    const text = generatePaymentReminderText(bill, settings, reminderType);
    const url = createWhatsAppUrl(bill.phone, text);
    window.open(url, '_blank');
    setSentMap((prev) => ({ ...prev, [bill.id]: true }));
    if (onMarkReminderSent) {
      onMarkReminderSent(bill.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  ऑटोमेटेड पेमेंट रिमाइंडर (WhatsApp Payment Reminders)
                </h3>
                <p className="text-xs text-stone-500">
                  लंबित बकाया वाले ग्राहकों को 1-क्लिक में पर्सनलाइज़्ड WhatsApp तकादा संदेश भेजें
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5">
            <div>
              <span className="text-[11px] text-stone-500 block">कुल बकायादार:</span>
              <span className="text-lg font-bold text-stone-900 font-mono">
                {pendingBills.length} ग्राहक
              </span>
            </div>
            <div className="h-8 w-px bg-stone-200" />
            <div>
              <span className="text-[11px] text-stone-500 block">वसूली योग्य राशि:</span>
              <span className="text-lg font-bold text-rose-600 font-mono">
                ₹{totalPendingSum.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Template Selector & Filters */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tone Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-stone-600 mr-1 shrink-0">रिमाइंडर प्रकार:</span>
            {[
              { id: 'gentle', label: '1. विनम्र चेक-इन (Gentle)' },
              { id: 'due_date', label: '2. अंतिम तारीख सूचना (Due Date)' },
              { id: 'urgent_overdue', label: '3. भारी बकाया नोटिस (Overdue)' },
              { id: 'short_sms', label: '4. संक्षिप्त SMS' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setReminderType(t.id as ReminderType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  reminderType === t.id
                    ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Route Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white text-stone-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              <option value="all">सभी रूट्स (All Routes)</option>
              {routes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Message Preview Box */}
      {pendingBills.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block">
                रिमाइंडर संदेश का नमूना (Template Preview):
              </span>
              <p className="text-amber-900/90 italic font-mono text-[11px] mt-1 whitespace-pre-line bg-white/70 p-2 rounded border border-amber-200/60">
                {generatePaymentReminderText(pendingBills[0], settings, reminderType)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debtor List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-xs font-semibold text-stone-700">
          <span>बकायादार ग्राहक सूची ({pendingBills.length})</span>
          <span className="text-stone-500 font-normal">
            उच्चतम बकाया राशि के क्रम में
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {pendingBills.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              शानदार! कोई बकाया नहीं है, सभी बिल समय पर जमा हो चुके हैं।
            </div>
          ) : (
            pendingBills.map((bill, index) => {
              const isSent = sentMap[bill.id];
              const isCopied = copiedId === bill.id;

              return (
                <div
                  key={bill.id}
                  className="p-3.5 sm:p-4 hover:bg-stone-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left Customer Info */}
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-stone-400 font-bold mt-1">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                          {bill.customerCode}
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm">
                          {bill.customerName}
                        </h4>
                        {isSent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>भेजा गया</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3" />
                          <span>{bill.phone}</span>
                        </span>
                        <span>·</span>
                        <span>रूट: <strong>{bill.route}</strong></span>
                        {bill.oldDue > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-rose-600 font-medium">
                              पुराना बकाया: ₹{bill.oldDue}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Due & WhatsApp Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-stone-500 block">कुल देय राशि</span>
                      <span className="text-base sm:text-lg font-black font-mono text-rose-600">
                        ₹{bill.remainingDue}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyText(bill)}
                        className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        title="संदेश कॉपी करें"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(bill)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        title="व्हाट्सएप पर तकादा संदेश भेजें"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp रिमाइंडर</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
