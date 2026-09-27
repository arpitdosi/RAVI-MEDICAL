import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, IndianRupee, Calendar, CreditCard, User, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MonthBill, PaymentRecord, Customer } from '../types';
import { CustomerSelectDropdown } from './CustomerSelectDropdown';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: MonthBill | null;
  customers?: Customer[];
  bills?: MonthBill[];
  onSavePayment: (payment: PaymentRecord) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bill,
  customers = [],
  bills = [],
  onSavePayment,
}) => {
  const [activeBill, setActiveBill] = useState<MonthBill | null>(bill);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>('');
  const [mode, setMode] = useState<PaymentRecord['mode']>('cash');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [collectedBy, setCollectedBy] = useState<string>('Ravi Medical');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const initialBill = bill || (bills.length > 0 ? bills[0] : null);
      setActiveBill(initialBill);
      if (initialBill) {
        setSelectedCustomerId(initialBill.customerId);
        setAmount(initialBill.remainingDue > 0 ? initialBill.remainingDue : initialBill.totalPayable);
      }
      setDate(new Date().toISOString().split('T')[0]);
      setMode('phonepe');
      setReferenceNo('');
      setCollectedBy('Ravi Medical');
      setError('');
    }
  }, [bill, bills, isOpen]);

  const handleCustomerChange = (newCustId: string) => {
    setSelectedCustomerId(newCustId);
    const foundBill = bills.find((b) => b.customerId === newCustId);
    if (foundBill) {
      setActiveBill(foundBill);
      setAmount(foundBill.remainingDue > 0 ? foundBill.remainingDue : foundBill.totalPayable);
    }
    setError('');
  };

  if (!isOpen) return null;

  const currentBill = activeBill || bill;
  if (!currentBill) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('कृपया सही भुगतान राशि दर्ज करें (Enter valid amount)');
      return;
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      customerId: currentBill.customerId,
      customerName: currentBill.customerName,
      amount: Number(amount),
      date,
      mode,
      referenceNo: referenceNo.trim(),
      collectedBy: collectedBy.trim(),
      month: currentBill.month,
    };

    onSavePayment(newPayment);

    // Trigger celebration if payment covers outstanding due
    if (amount >= currentBill.remainingDue && currentBill.remainingDue > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-700 px-5 sm:px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">भुगतान दर्ज करें (Record Payment / Jama)</h3>
              <p className="text-xs sm:text-sm text-emerald-100">
                {currentBill.customerName} (#{currentBill.customerCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Due Summary Card */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-5 sm:px-6 py-3.5 flex items-center justify-between text-xs sm:text-sm shrink-0">
          <div>
            <span className="text-stone-500 block">बिल माह: <strong>{currentBill.monthName}</strong></span>
            <span className="text-stone-800 font-semibold">कुल बिल: ₹{currentBill.totalPayable}</span>
          </div>
          <div className="text-right">
            <span className="text-stone-500 block text-xs">वर्तमान शेष बकाया:</span>
            <span className="text-lg sm:text-xl font-black font-mono text-rose-600">
              ₹{currentBill.remainingDue}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection with Drag-and-Drop & Searchable Dropdown */}
          {customers && customers.length > 0 && (
            <CustomerSelectDropdown
              customers={customers}
              bills={bills}
              selectedCustomerId={selectedCustomerId || currentBill.customerId}
              onSelectCustomer={handleCustomerChange}
              label="ग्राहक चुनें (Customer Selector)"
              accentColor="emerald"
            />
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-1.5">
              प्राप्त राशि (Received Amount ₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-stone-400 font-bold text-xl">₹</span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 text-2xl sm:text-3xl font-black font-mono text-stone-900 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            {/* Quick Amount Chips */}
            <div className="flex gap-2 mt-2 flex-wrap">
              <button
                type="button"
                onClick={() => setAmount(currentBill.remainingDue)}
                className="text-xs sm:text-sm px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 cursor-pointer font-bold"
              >
                पूरा बकाया (₹{currentBill.remainingDue})
              </button>
              {currentBill.dailyPaperAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(currentBill.dailyPaperAmount + currentBill.deliveryCharge)}
                  className="text-xs sm:text-sm px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-200 cursor-pointer font-medium"
                >
                  सिर्फ चालू माह (₹{currentBill.dailyPaperAmount + currentBill.deliveryCharge})
                </button>
              )}
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-1.5">
              भुगतान का माध्यम (Payment Mode)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'phonepe', label: 'PhonePe' },
                { id: 'gpay', label: 'Google Pay' },
                { id: 'paytm', label: 'Paytm' },
                { id: 'cash', label: 'नकद (Cash)' },
                { id: 'other_upi', label: 'Other UPI' },
                { id: 'bank', label: 'Bank Trf' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as any)}
                  className={`py-2.5 px-2 text-xs sm:text-sm font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                    mode === m.id
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Collector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-stone-500" />
                <span>भुगतान दिनांक</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1">
                <User className="w-4 h-4 text-stone-500" />
                <span>वसूली कर्ता</span>
              </label>
              <input
                type="text"
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                placeholder="Ravi / Hawker..."
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Reference / UTR */}
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-1.5">
              UPI रेफरेंस / UTR नंबर (Optional)
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="उदा. UPI/42819034..."
              className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm sm:text-base font-semibold text-stone-600 hover:text-stone-800 border border-stone-300 rounded-xl cursor-pointer"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm sm:text-base font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              जमा रसीद सेव करें (Confirm Payment)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
