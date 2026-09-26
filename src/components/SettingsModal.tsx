import React, { useState } from 'react';
import {
  X,
  Settings,
  Store,
  Phone,
  QrCode,
  DollarSign,
  Truck,
  MapPin,
  Save,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Building2,
  FileText,
  Trash2,
} from 'lucide-react';
import { AgencySettings } from '../types';
import {
  exportDatabaseBackup,
  restoreDatabaseBackup,
  resetToDemoData,
  clearAllCustomerData,
} from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AgencySettings;
  onSaveSettings: (settings: AgencySettings) => void;
  onReloadData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onReloadData,
}) => {
  const [formData, setFormData] = useState<AgencySettings>(settings);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setMsg({ type: 'success', text: 'सेटिंग्स सफलतापूर्वक सेव हो गई हैं!' });
    setTimeout(() => {
      setMsg(null);
      onClose();
    }, 1200);
  };

  const handleExportBackup = () => {
    const json = exportDatabaseBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NK_Shah_Ravi_Medical_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ type: 'success', text: 'संपूर्ण डेटा बैकअप फाइल डाउनलोड हो गई!' });
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = restoreDatabaseBackup(content);
      if (success) {
        onReloadData();
        setMsg({ type: 'success', text: 'डेटा सफलतापूर्वक रीस्टोर हो गया!' });
        setTimeout(() => onClose(), 1200);
      } else {
        setMsg({ type: 'error', text: 'अमान्य बैकअप फाइल।' });
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (
      window.confirm(
        'क्या आप मूल डेटा रीसेट करना चाहते हैं? इससे कैलाश होटल, राजेन्द्र जी सेवक आदि सैंपल डेटा फिर से लोड हो जाएगा।'
      )
    ) {
      resetToDemoData();
      onReloadData();
      setMsg({ type: 'success', text: 'मूल डेटा रीसेट हो गया!' });
      setTimeout(() => onClose(), 1200);
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'चेतावनी: क्या आप सभी ग्राहकों, पेमेंट व लेन-देन का डेटा हटाना चाहते हैं? इसके बाद डेटाबेस खाली हो जाएगा और आप अपनी नई एक्सेल शीट अपलोड कर सकेंगे।'
      )
    ) {
      clearAllCustomerData();
      onReloadData();
      setMsg({ type: 'success', text: 'सारा डेटा सफलतापूर्वक हटा दिया गया! (0 ग्राहक)' });
      setTimeout(() => onClose(), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-[#003865] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-300" />
            <h3 className="font-semibold text-sm">बिलिंग मेमो एवं एजेंसी सेटिंग्स (Settings)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-300 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {msg && (
          <div
            className={`p-3 text-xs flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Bill Top Header Details (Matching Physical Printed Memo) */}
          <div className="space-y-3 p-3.5 bg-sky-50/60 rounded-xl border border-sky-200">
            <span className="font-bold text-sky-950 block text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#00487c]" />
              <span>बिल मेमो शीर्ष शीर्षक (Header Details as in Printed Slip)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  एजेंट का नाम (Header Name)
                </label>
                <input
                  type="text"
                  required
                  value={formData.headerName}
                  onChange={(e) => setFormData({ ...formData, headerName: e.target.value })}
                  placeholder="N. K. SHAH"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm font-bold text-[#00487c] bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  उप-शीर्षक (Sub Header)
                </label>
                <input
                  type="text"
                  required
                  value={formData.subHeader}
                  onChange={(e) => setFormData({ ...formData, subHeader: e.target.value })}
                  placeholder="NEWS PAPER AGENT"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm font-semibold bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  स्थान (Location)
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Bagidora, Distt. Banswara (Raj.)"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  मोबाइल नंबर (Mobiles in Header)
                </label>
                <input
                  type="text"
                  required
                  value={formData.mobiles}
                  onChange={(e) => setFormData({ ...formData, mobiles: e.target.value })}
                  placeholder="9413015952 / 9413018226"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-mono font-medium bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  मंगल पाठ / श्लोक (Top Center)
                </label>
                <input
                  type="text"
                  value={formData.shreeInvocation}
                  onChange={(e) => setFormData({ ...formData, shreeInvocation: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  शुरुआती बिल संख्या (Start Bill No.)
                </label>
                <input
                  type="number"
                  value={formData.startBillNo}
                  onChange={(e) => setFormData({ ...formData, startBillNo: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-mono font-bold bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="space-y-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <span className="font-bold text-stone-800 block text-xs flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>बैंक खाता विवरण (Bank Details Printed on Bill)</span>
            </span>

            <div>
              <label className="block font-medium text-stone-700 mb-1">बैंक का नाम (Bank Name & Branch)</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">IFSC कोड</label>
                <input
                  type="text"
                  value={formData.bankIfsc}
                  onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white font-mono font-bold uppercase focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">खाता संख्या (A/C No.)</label>
                <input
                  type="text"
                  value={formData.bankAccountNo}
                  onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* UPI ID & Daily Rates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <label className="block font-medium text-stone-700 mb-1">दैनिक दर (₹/दिन)</label>
              <input
                type="number"
                step="0.5"
                value={formData.defaultDailyRate}
                onChange={(e) => setFormData({ ...formData, defaultDailyRate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white font-bold"
              />
              <span className="text-[10px] text-stone-500">₹5.00 प्रति दिन</span>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">D.C. (डिलीवरी चार्ज ₹)</label>
              <input
                type="number"
                step="1"
                value={formData.defaultDeliveryCharge}
                onChange={(e) => setFormData({ ...formData, defaultDeliveryCharge: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white font-bold"
              />
              <span className="text-[10px] text-stone-500">मासिक ₹5</span>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">UPI ID (QR पेमेंट)</label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white font-mono text-rose-700 font-bold"
              />
              <span className="text-[10px] text-stone-500">PhonePe / GPay QR</span>
            </div>
          </div>

          {/* Bottom Footer Advertising Details (Ravi Publicity & Medical) */}
          <div className="space-y-3 p-3.5 bg-rose-50/50 rounded-xl border border-rose-200">
            <span className="font-bold text-rose-950 block text-xs flex items-center gap-1.5">
              <Store className="w-4 h-4 text-rose-700" />
              <span>बिल के निचले भाग का विज्ञापन (Footer Promotional Info)</span>
            </span>

            <div>
              <label className="block font-medium text-stone-700 mb-1">विज्ञापन संपर्क लाइन</label>
              <input
                type="text"
                value={formData.publicityTagline}
                onChange={(e) => setFormData({ ...formData, publicityTagline: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">पब्लिसिटी नाम</label>
                <input
                  type="text"
                  value={formData.publicityName}
                  onChange={(e) => setFormData({ ...formData, publicityName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-bold text-[#00487c] bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">दुकान का मुख्य नाम</label>
                <input
                  type="text"
                  value={formData.medicalStoreName}
                  onChange={(e) => setFormData({ ...formData, medicalStoreName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-bold text-rose-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">दवा एवं सर्जिकल टैगलाइन</label>
              <input
                type="text"
                value={formData.medicalTagline}
                onChange={(e) => setFormData({ ...formData, medicalTagline: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
              />
            </div>
          </div>

          {/* Backup & Data Management */}
          <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-300 font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span>बैकअप डाउनलोड (JSON)</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-300 font-medium cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-stone-600" />
                <span>रीस्टोर करें</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer font-medium"
                title="सभी ग्राहक और लेन-देन का डेटा डिलीट करें (एक्सेल अपलोड हेतु)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>सारा डेटा हटाएं (0 ग्राहक)</span>
              </button>

              <button
                type="button"
                onClick={handleResetDemo}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg border border-stone-200 cursor-pointer"
                title="सैंपल डेमो डेटा वापस लाएं"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>डेमो डेटा</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 border border-stone-300 rounded-lg"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#00487c] hover:bg-[#003865] text-white font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>सेटिंग्स सेव करें</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
