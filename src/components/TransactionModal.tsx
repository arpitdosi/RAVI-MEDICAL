import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  MinusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Calendar,
  CreditCard,
  FileText,
  Share2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Check,
  Receipt,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Customer, AgencySettings, MonthBill, LedgerTransaction, PaymentRecord } from '../types';
import {
  generateTransactionWhatsAppText,
  createWhatsAppUrl,
} from '../utils/billingUtils';
import { CustomerSelectDropdown } from './CustomerSelectDropdown';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  bills: MonthBill[];
  settings: AgencySettings;
  preSelectedCustomerId?: string | null;
  defaultType?: 'jama' | 'udhar';
  onSaveTransaction: (
    tx: LedgerTransaction,
    updatedOldDue: number,
    optionalPayment?: PaymentRecord
  ) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  customers,
  bills,
  settings,
  preSelectedCustomerId,
  defaultType = 'jama',
  onSaveTransaction,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const [type, setType] = useState<'jama' | 'udhar'>(defaultType);
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [mode, setMode] = useState<PaymentRecord['mode']>('cash');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [collectedBy, setCollectedBy] = useState<string>('Ravi Medical');

  // Success view state
  const [completedTx, setCompletedTx] = useState<LedgerTransaction | null>(null);
  const [completedCustomer, setCompletedCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setType(defaultType);
      setCompletedTx(null);
      setCompletedCustomer(null);
      setError('');
      setNotes('');
      setReferenceNo('');
      setCollectedBy('Ravi Medical');

      if (preSelectedCustomerId) {
        setSelectedCustomerId(preSelectedCustomerId);
      } else if (customers.length > 0) {
        setSelectedCustomerId(customers[0].id);
      }
    }
  }, [isOpen, preSelectedCustomerId, defaultType, customers]);

  // Set default reason based on type
  useEffect(() => {
    if (type === 'jama') {
      setReason('मासिक अखबार बिल जमा');
      setMode('phonepe');
    } else {
      setReason('दवाइयां (Ravi Medical Store)');
      setMode('cash');
    }
  }, [type]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedBill = bills.find((b) => b.customerId === selectedCustomerId);

  // Current balance: either bill remainingDue or customer's oldDue
  const currentBalance = selectedBill ? selectedBill.remainingDue : (selectedCustomer?.oldDue || 0);

  // Calculated new balance after transaction
  const numAmount = typeof amount === 'number' ? amount : 0;
  const projectedBalance =
    type === 'jama'
      ? Math.max(0, currentBalance - numAmount)
      : currentBalance + numAmount;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setError('कृपया ग्राहक चुनें (Please select customer)');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setError('कृपया सही राशि दर्ज करें (Enter valid amount)');
      return;
    }

    const previousBalance = currentBalance;
    const newBalance =
      type === 'jama'
        ? Math.max(0, previousBalance - numAmount)
        : previousBalance + numAmount;

    // Calculate updated oldDue for customer state
    let updatedOldDue = selectedCustomer.oldDue;
    if (type === 'udhar') {
      updatedOldDue = selectedCustomer.oldDue + numAmount;
    } else {
      // If payment covers current paper bill + some old due
      if (selectedBill) {
        const currentPaperTotal = selectedBill.dailyPaperAmount + selectedBill.deliveryCharge;
        if (numAmount > currentPaperTotal) {
          const excess = numAmount - currentPaperTotal;
          updatedOldDue = Math.max(0, selectedCustomer.oldDue - excess);
        }
      } else {
        updatedOldDue = Math.max(0, selectedCustomer.oldDue - numAmount);
      }
    }

    const tx: LedgerTransaction = {
      id: `tx-${Date.now()}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      type,
      amount: numAmount,
      date,
      time,
      reason,
      mode: type === 'jama' ? mode : undefined,
      referenceNo: referenceNo.trim() || undefined,
      collectedBy: collectedBy.trim() || 'Ravi Medical',
      previousBalance,
      newBalance,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    let optionalPayment: PaymentRecord | undefined;
    if (type === 'jama') {
      optionalPayment = {
        id: `pay-${Date.now()}`,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        amount: numAmount,
        date,
        mode,
        referenceNo: referenceNo.trim() || undefined,
        collectedBy: collectedBy.trim() || 'Ravi Medical',
        month: selectedBill?.month || date.slice(0, 7),
      };
    }

    onSaveTransaction(tx, updatedOldDue, optionalPayment);
    setCompletedTx(tx);
    setCompletedCustomer(selectedCustomer);

    if (type === 'jama' && newBalance === 0) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden transform transition-all flex flex-col max-h-[95vh]">
        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between text-white shrink-0 ${
            type === 'jama' ? 'bg-emerald-700' : 'bg-rose-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              {type === 'jama' ? (
                <ArrowDownLeft className="w-5 h-5 text-emerald-100" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-rose-100" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                {type === 'jama' ? 'रकम जमा एंट्री (Payment Received / Jama)' : 'नया उधार एंट्री (New Credit / Udhar Out)'}
              </h3>
              <p className="text-xs text-white/80">
                रवि मेडिकल एवं राजस्थान पत्रिका दैनिक खाता बही
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-lg p-1 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!completedTx ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Transaction Type Segmented Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setType('jama')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  type === 'jama'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>रकम जमा (Customer Paid)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('udhar')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  type === 'udhar'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>नया उधार (Took Credit)</span>
              </button>
            </div>

            {/* Customer Selector Dropdown with Drag-and-Drop */}
            <CustomerSelectDropdown
              customers={customers}
              bills={bills}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={(custId) => setSelectedCustomerId(custId)}
              label="ग्राहक चुनें (Customer Selector - ड्रैग व ड्रॉप सूची)"
              accentColor={type === 'jama' ? 'emerald' : 'rose'}
              initiallyOpen={!preSelectedCustomerId}
            />

            {/* Current Balance & Live Projected Balance Card */}
            {selectedCustomer && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-stone-500 text-[10px] block">पिछला बकाया</span>
                  <span className="font-mono font-bold text-sm text-stone-800">
                    ₹{currentBalance}
                  </span>
                </div>
                <div className="border-x border-stone-200">
                  <span className="text-stone-500 text-[10px] block">
                    {type === 'jama' ? 'जमा राशि' : 'नया उधार'}
                  </span>
                  <span
                    className={`font-mono font-black text-sm ${
                      type === 'jama' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {type === 'jama' ? '-' : '+'}₹{numAmount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">अपडेटेड शेष</span>
                  <span
                    className={`font-mono font-black text-base ${
                      projectedBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    ₹{projectedBalance}
                  </span>
                </div>
              </div>
            )}

            {/* Amount Field */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                {type === 'jama' ? 'जमा प्राप्त राशि (Received Amount ₹) *' : 'नया उधार राशि (New Credit Amount ₹) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-400 font-bold text-base">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className={`w-full pl-8 pr-3 py-2 text-xl font-mono font-black border rounded-lg focus:outline-none ${
                    type === 'jama'
                      ? 'border-emerald-300 text-emerald-900 focus:ring-2 focus:ring-emerald-500'
                      : 'border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-500'
                  }`}
                />
              </div>

              {/* Quick Amount Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {currentBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(currentBalance)}
                    className="text-[11px] px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-300 cursor-pointer font-medium"
                  >
                    पूरा बकाया (₹{currentBalance})
                  </button>
                )}
                {[50, 100, 150, 155, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="text-[11px] px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 cursor-pointer font-mono"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason / Category */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {type === 'jama' ? 'जमा का विवरण (Payment For)' : 'उधार का मद / सामान (Item / Credit Reason)'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(type === 'jama'
                  ? [
                      'मासिक अखबार बिल जमा',
                      'दवाइयां बिल भुगतान',
                      'पुराना बकाया जमा',
                      'अग्रिम जमा (Advance)',
                    ]
                  : [
                      'दवाइयां (Ravi Medical Store)',
                      'आयुर्वेदिक उत्पाद व सिरप',
                      'सर्जिकल सामग्री',
                      'अतिरिक्त मैगजीन/अखबार',
                    ]
                ).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`py-1.5 px-2 text-[11px] rounded-lg border text-left transition-colors cursor-pointer ${
                      reason === r
                        ? type === 'jama'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-bold'
                          : 'bg-rose-50 text-rose-800 border-rose-400 font-bold'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Mode (Only for Jama) */}
            {type === 'jama' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  भुगतान का माध्यम (Payment Mode)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'नकद (Cash)' },
                    { id: 'phonepe', label: 'PhonePe' },
                    { id: 'gpay', label: 'Google Pay' },
                    { id: 'paytm', label: 'Paytm' },
                    { id: 'other_upi', label: 'Other UPI' },
                    { id: 'bank', label: 'Bank A/C' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id as any)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                        mode === m.id
                          ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date, Time & Reference */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">तारीख</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {type === 'jama' ? 'रेफरेंस / UTR नं (Optional)' : 'बिल / पर्ची नं (Optional)'}
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="उदा. UPI/491024..."
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Remarks / Item Notes */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                विशिष्ट टिप्पणी / विवरण (Item Details / Notes)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="उदा. बीपी गोली 2 पत्ता, या काउंटर पर प्राप्त..."
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800 border border-stone-300 rounded-lg cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                  type === 'jama'
                    ? 'bg-emerald-700 hover:bg-emerald-600'
                    : 'bg-rose-700 hover:bg-rose-600'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {type === 'jama'
                    ? `₹${numAmount || 0} जमा दर्ज करें`
                    : `₹${numAmount || 0} नया उधार दर्ज करें`}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* SUCCESS VIEW: Receipt Slip & WhatsApp Action */
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-stone-900">
                {completedTx.type === 'jama'
                  ? 'रकम जमा सफलतापूर्वक दर्ज हो गई!'
                  : 'नया उधार सफलतापूर्वक खाते में दर्ज हो गया!'}
              </h4>
              <p className="text-xs text-stone-500">
                ग्राहक खाता एवं राजस्थान पत्रिका बिलिंग बैलेंस स्वतः अपडेट हो गया है।
              </p>
            </div>

            {/* Printed Receipt Preview Card */}
            <div
              id="printable-transaction-receipt"
              className="bg-stone-50 border-2 border-[#00487c] rounded-xl p-4 text-xs space-y-2 text-[#00487c]"
            >
              <div className="text-center border-b border-[#00487c]/30 pb-2">
                <h5 className="font-black text-sm uppercase font-serif tracking-wider">
                  {settings.headerName} · {settings.shopName}
                </h5>
                <p className="text-[10px] text-stone-600">{settings.location} · {settings.mobiles}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 border border-[#00487c]/40">
                  {completedTx.type === 'jama' ? 'भुगतान जमा रसीद (Payment Receipt)' : 'नया उधार वाउचर (Debit Voucher)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-stone-500 block">ग्राहक:</span>
                  <span className="font-bold text-stone-900 text-xs">{completedCustomer?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block">दिनांक व समय:</span>
                  <span className="font-mono">{completedTx.date} {completedTx.time}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">विवरण:</span>
                  <span className="font-medium text-stone-800">{completedTx.reason}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block">माध्यम:</span>
                  <span className="font-bold uppercase">{completedTx.mode || 'उधार खाता'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#00487c]/30 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-600">पिछला बकाया (Old Balance):</span>
                  <span className="font-mono font-semibold">₹{completedTx.previousBalance}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>{completedTx.type === 'jama' ? 'जमा राशि (Received):' : 'नया उधार (New Credit):'}</span>
                  <span
                    className={`font-mono text-sm ${
                      completedTx.type === 'jama' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {completedTx.type === 'jama' ? '-' : '+'}₹{completedTx.amount}
                  </span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-[#00487c] bg-sky-100/50 p-1 rounded">
                  <span>वर्तमान कुल शेष बकाया:</span>
                  <span className="font-mono text-stone-900">₹{completedTx.newBalance}</span>
                </div>
              </div>

              {completedTx.notes && (
                <div className="text-[10px] text-stone-600 pt-1 italic">
                  नोट: {completedTx.notes}
                </div>
              )}
            </div>

            {/* Instant Confirmation Dispatch Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintSlip}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4 text-stone-700" />
                <span>रसीद प्रिंट निकालें</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {completedCustomer && (
                  <a
                    href={createWhatsAppUrl(
                      completedCustomer.phone,
                      generateTransactionWhatsAppText(completedCustomer, completedTx, settings)
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>WhatsApp रसीद भेजें</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  पूर्ण (Done)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
