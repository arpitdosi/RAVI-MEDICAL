import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Truck, AlertCircle, Save, CalendarOff, Clipboard, Check } from 'lucide-react';
import { Customer, AgencySettings } from '../types';
import { normalizePhoneNumber } from '../utils/phonebookUtils';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer?: Customer | null;
  existingRoutes: string[];
  settings: AgencySettings;
  totalCustomersCount: number;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer,
  existingRoutes,
  settings,
  totalCustomersCount,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [route, setRoute] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(30);
  const [oldDue, setOldDue] = useState(0);
  const [status, setStatus] = useState<'active' | 'paused' | 'stopped'>('active');
  const [pauseDaysCount, setPauseDaysCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Clipboard feedback state
  const [pasteFeedbackMsg, setPasteFeedbackMsg] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setCustomerCode(customer.customerCode);
      setRoute(customer.route);
      setAddress(customer.address);
      setDeliveryCharge(customer.deliveryCharge);
      setOldDue(customer.oldDue);
      setStatus(customer.status);
      setPauseDaysCount(customer.pauseDaysCount || 0);
      setNotes(customer.notes || '');
    } else {
      setName('');
      setPhone('');
      setCustomerCode(`RP-${101 + totalCustomersCount}`);
      setRoute(existingRoutes[0] || 'Hospital Road');
      setAddress('');
      setDeliveryCharge(settings.defaultDeliveryCharge || 30);
      setOldDue(0);
      setStatus('active');
      setPauseDaysCount(0);
      setNotes('');
    }
    setError('');
    setPasteFeedbackMsg('');
  }, [customer, isOpen, existingRoutes, settings, totalCustomersCount]);

  /**
   * One-tap paste phone number from clipboard
   */
  const handlePasteFromClipboard = async () => {
    setPasteFeedbackMsg('');
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const cleaned = normalizePhoneNumber(text);
        if (cleaned.length === 10) {
          setPhone(cleaned);
          setPasteFeedbackMsg(`✓ क्लिपबोर्ड से नंबर पेस्ट हुआ: ${cleaned}`);
        } else if (cleaned.length > 0) {
          setPhone(cleaned);
          setPasteFeedbackMsg(`क्लिपबोर्ड से नंबर दर्ज हुआ: ${cleaned}`);
        } else {
          setPasteFeedbackMsg('क्लिपबोर्ड में कोई मान्य नंबर नहीं मिला।');
        }
      }
    } catch {
      setPasteFeedbackMsg('कृपया सीधे इनपुट बॉक्स में नंबर पेस्ट करें।');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('कृपया ग्राहक का नाम दर्ज करें (Please enter customer name)');
      return;
    }

    const cleanPhone = normalizePhoneNumber(phone);
    if (cleanPhone.length > 0 && cleanPhone.length < 10) {
      setError('कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें (10-digit mobile number required)');
      return;
    }

    const newCustomer: Customer = {
      id: customer ? customer.id : `cust-${Date.now()}`,
      customerCode: customerCode.trim() || `RP-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      phone: cleanPhone,
      route: route.trim() || 'बागीदौरा मेन मार्केट',
      address: address.trim(),
      deliveryCharge: Number(deliveryCharge) || 0,
      oldDue: Number(oldDue) || 0,
      status,
      pauseDaysCount: Number(pauseDaysCount) || 0,
      notes: notes.trim(),
      createdAt: customer ? customer.createdAt : new Date().toISOString().split('T')[0],
    };

    onSave(newCustomer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-stone-900 px-5 sm:px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-rose-400" />
            <h3 className="text-base sm:text-lg font-bold">
              {customer ? 'ग्राहक विवरण संशोधित करें (Edit Customer)' : 'नया ग्राहक जोड़ें (Add New Customer)'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Code */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                ग्राहक कोड (Customer ID / Code)
              </label>
              <input
                type="text"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                placeholder="RP-101"
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                अखबार वितरण स्थिति (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
              >
                <option value="active">चालू (Active Delivery)</option>
                <option value="paused">अस्थाई रोक (Paused / Vacation)</option>
                <option value="stopped">स्थाई बंद (Stopped / Inactive)</option>
              </select>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-1.5">
              ग्राहक का पूरा नाम (Full Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              id="customer-name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="उदा. रमेश कुमार अग्रवाल"
              className="w-full px-3.5 py-2.5 text-base sm:text-sm font-medium border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Phone & Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-stone-800 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>मोबाइल / WhatsApp</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors cursor-pointer"
                    title="क्लिपबोर्ड से नंबर पेस्ट करें"
                  >
                    <Clipboard className="w-3 h-3 text-stone-500" />
                    <span>पेस्ट</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  id="customer-phone"
                  name="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(normalizePhoneNumber(e.target.value))}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm font-mono font-medium border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {phone && phone.length === 10 && (
                  <span className="absolute right-3 top-3 text-emerald-600 text-xs font-bold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <Check className="w-3.5 h-3.5" /> 10 अंक
                  </span>
                )}
              </div>

              {pasteFeedbackMsg && (
                <div className="mt-1.5 p-2 text-xs text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{pasteFeedbackMsg}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-stone-500" />
                <span>एरिया / रूट / वार्ड (Route)</span>
              </label>
              <input
                type="text"
                list="routes-datalist"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="उदा. Hospital Road"
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <datalist id="routes-datalist">
                {existingRoutes.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-1.5">
              मकान नंबर / गली / दुकान का पता (Address)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="मकान नं 24, शिव मंदिर के पास..."
              className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Charges & Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-stone-500" />
                <span>हॉकर चार्ज (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                className="w-full px-3 py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-bold"
              />
              <span className="text-xs text-stone-500 mt-0.5 block">प्रति माह डिलीवरी</span>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-rose-700 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>पुराना बकाया (Old Due ₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={oldDue}
                onChange={(e) => setOldDue(Number(e.target.value))}
                className="w-full px-3 py-2 text-base sm:text-sm border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-black text-rose-700"
              />
              <span className="text-xs text-rose-600 mt-0.5 block">पिछले महीने का शेष</span>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-amber-800 mb-1 flex items-center gap-1">
                <CalendarOff className="w-3.5 h-3.5 text-amber-600" />
                <span>रोक/छुट्टी दिन</span>
              </label>
              <input
                type="number"
                min="0"
                max="31"
                value={pauseDaysCount}
                onChange={(e) => setPauseDaysCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-bold"
              />
              <span className="text-xs text-amber-700 mt-0.5 block">₹5/दिन कम होंगे</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-1.5">
              अतिरिक्त निर्देश / टिप्पणी (Delivery Notes)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="उदा. सुबह 6:30 बजे, शटर के नीचे डालें..."
              className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm sm:text-base font-semibold text-stone-600 hover:text-stone-800 border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
            >
              रद्द करें (Cancel)
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm sm:text-base font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>सुरक्षित करें (Save Customer)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
