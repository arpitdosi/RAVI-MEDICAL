import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Database,
} from 'lucide-react';
import { Customer } from '../types';
import {
  parseCustomerExcel,
  downloadCustomerExcelTemplate,
} from '../utils/billingUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCustomers: (importedCustomers: Customer[], mode: 'append' | 'replace') => void;
  currentCustomersCount: number;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportCustomers,
  currentCustomersCount,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedList, setParsedList] = useState<Partial<Customer>[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>(
    currentCustomersCount === 0 ? 'replace' : 'append'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError('');
    setLoading(true);

    try {
      const customers = await parseCustomerExcel(selected);
      if (!customers || customers.length === 0) {
        setError('एक्सेल शीट में कोई ग्राहक डेटा नहीं मिला। कृपया फॉर्मेट जांचें।');
        setParsedList([]);
      } else {
        setParsedList(customers);
      }
    } catch (err: any) {
      console.error('Excel parse error:', err);
      setError('एक्सेल फाइल पढ़ने में त्रुटि: ' + (err.message || 'अमान्य फाइल'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedList.length === 0) return;

    const fullCustomers: Customer[] = parsedList.map((c, idx) => ({
      id: `cust-excel-${Date.now()}-${idx}`,
      customerCode: c.customerCode || String(35390 + idx),
      name: c.name || `ग्राहक ${idx + 1}`,
      phone: c.phone || '',
      route: c.route || 'बागीदौरा मेन मार्केट',
      address: c.address || '',
      deliveryCharge: c.deliveryCharge ?? 5,
      oldDue: c.oldDue ?? 0,
      status: c.status || 'active',
      pauseDaysCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      notes: c.notes || '',
    }));

    onImportCustomers(fullCustomers, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-sm">एक्सेल ग्राहक सूची इम्पोर्ट (Excel Import)</h3>
              <p className="text-xs text-stone-400">400 से 500 ग्राहकों की शीट एक साथ अपलोड करें</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Download Template Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
            <div>
              <span className="font-bold text-emerald-900 block text-sm">
                सैंपल एक्सेल टेम्पलेट (Sample Excel Format)
              </span>
              <span className="text-emerald-800">
                यदि आपकी शीट में कॉलम नहीं हैं, तो इस एक्सेल फॉर्मेट में डेटा भरकर अपलोड करें।
              </span>
            </div>
            <button
              type="button"
              onClick={downloadCustomerExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>टेम्पलेट डाउनलोड करें</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-xl p-6 text-center bg-stone-50/50 transition-colors">
            <input
              type="file"
              id="excel-file-input"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="excel-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-stone-800">
                {file ? file.name : 'एक्सेल फाइल (.xlsx, .xls, .csv) चुनें या यहाँ ड्रैग करें'}
              </div>
              <p className="text-xs text-stone-500 max-w-sm">
                अपने कंप्यूटर या मोबाइल से राजस्थान पत्रिका कस्टमर एक्सेल फाइल को सेलेक्ट करें
              </p>
              <span className="inline-block mt-2 px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded-md transition-colors">
                फाइल ब्राउज करें (Browse)
              </span>
            </label>
          </div>

          {loading && (
            <div className="text-center py-4 text-xs text-stone-500 font-medium">
              एक्सेल फाइल पढ़ी जा रही है, कृपया प्रतीक्षा करें...
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview of Parsed Rows */}
          {parsedList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>सफलतापूर्वक {parsedList.length} ग्राहक पहचाने गए (Preview)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    हिंदी डेटा जैसा है वैसा ही फेच हुआ (As-It-Is)
                  </span>
                  <span className="text-[11px] text-stone-500">
                    वर्तमान ग्राहक: {currentCustomersCount}
                  </span>
                </div>
              </div>

              {/* Import Mode Radio */}
              <div className="p-3 bg-stone-100 rounded-lg text-xs space-y-2">
                <span className="font-semibold text-stone-800 block">इम्पोर्ट का तरीका चुनें:</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-800">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>मौजूदा लिस्ट में जोड़ें (Append to current list)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-rose-800">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>मौजूदा लिस्ट को बदलकर नई सूची रखें (Replace All)</span>
                  </label>
                </div>
              </div>

              {/* Sample Preview Table */}
              <div className="border border-stone-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 sticky top-0 font-semibold">
                    <tr>
                      <th className="py-2 px-2.5">कोड</th>
                      <th className="py-2 px-2.5">ग्राहक का नाम (हिंदी)</th>
                      <th className="py-2 px-2.5">मोबाइल</th>
                      <th className="py-2 px-2.5">रूट / मोहल्ला (हिंदी)</th>
                      <th className="py-2 px-2.5">पता</th>
                      <th className="py-2 px-2.5 text-right">डिलीवरी ₹</th>
                      <th className="py-2 px-2.5 text-right">पुराना बकाया ₹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {parsedList.slice(0, 15).map((row, i) => (
                      <tr key={i} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-2 px-2.5 font-mono text-[11px] font-semibold text-[#00487c]">
                          {row.customerCode}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-stone-900">
                          {row.name}
                        </td>
                        <td className="py-2 px-2.5 text-stone-600 font-mono text-[11px]">
                          {row.phone || '-'}
                        </td>
                        <td className="py-2 px-2.5 text-stone-700">
                          {row.route || '-'}
                        </td>
                        <td className="py-2 px-2.5 text-stone-500 truncate max-w-[120px]">
                          {row.address || '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-medium text-stone-800">
                          ₹{row.deliveryCharge}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-rose-600">
                          ₹{row.oldDue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedList.length > 15 && (
                <p className="text-[11px] text-stone-500 text-center font-medium">
                  + {parsedList.length - 15} और ग्राहक एक्सेल से इम्पोर्ट होंगे...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800 border border-stone-300 rounded-lg hover:bg-white transition-colors"
          >
            रद्द करें
          </button>
          <button
            type="button"
            disabled={parsedList.length === 0}
            onClick={handleConfirmImport}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>{parsedList.length} ग्राहकों को इम्पोर्ट करें</span>
          </button>
        </div>
      </div>
    </div>
  );
};
