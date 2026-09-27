import * as XLSX from 'xlsx';
import { Customer, AgencySettings, MonthBill, PaymentRecord, AreaSummary, LedgerTransaction } from '../types';

/**
 * Returns number of days in a year-month string (e.g. "2026-04" -> 30)
 */
export function getDaysInMonth(yearMonth: string): number {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  return new Date(year, month, 0).getDate();
}

/**
 * Short month label matching physical bill header: "Month : Apr,26"
 */
export function getShortMonthCode(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const yearShort = yearStr.slice(-2);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mIdx = Math.max(0, Math.min(11, parseInt(monthStr, 10) - 1));
  return `${months[mIdx]},${yearShort}`;
}

/**
 * End-of-month date matching physical bill: "Date 30/04/26"
 */
export function getLastDateOfMonthFormatted(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const lastDay = new Date(year, month, 0).getDate();
  const yearShort = yearStr.slice(-2);
  const dayStr = String(lastDay).padStart(2, '0');
  const monthPad = String(month).padStart(2, '0');
  return `${dayStr}/${monthPad}/${yearShort}`;
}

/**
 * Formats "2026-04" to readable Hindi/English "अप्रैल (April) 2026"
 */
export function getMonthLabel(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthNames = [
    'जनवरी (January)',
    'फरवरी (February)',
    'मार्च (March)',
    'अप्रैल (April)',
    'मई (May)',
    'जून (June)',
    'जुलाई (July)',
    'अगस्त (August)',
    'सितंबर (September)',
    'अक्टूबर (October)',
    'नवंबर (November)',
    'दिसंबर (December)',
  ];
  return `${monthNames[monthIndex] || 'अप्रैल'} ${year}`;
}

/**
 * Calculates a customer's bill for a specific month
 */
export function calculateCustomerBill(
  customer: Customer,
  index: number,
  month: string,
  settings: AgencySettings,
  payments: PaymentRecord[]
): MonthBill {
  const totalDaysInMonth = getDaysInMonth(month);
  const pauseDays = customer.status === 'paused' ? totalDaysInMonth : Math.min(totalDaysInMonth, customer.pauseDaysCount || 0);
  const billedDays = customer.status === 'stopped' ? 0 : Math.max(0, totalDaysInMonth - pauseDays);
  const ratePerDay = settings.defaultDailyRate || 5;
  const dailyPaperAmount = billedDays * ratePerDay;
  const deliveryCharge = customer.status === 'stopped' ? 0 : (customer.deliveryCharge ?? settings.defaultDeliveryCharge ?? 5);
  const oldDue = customer.oldDue || 0;
  const totalPayable = dailyPaperAmount + deliveryCharge + oldDue;

  // Derive bill number: if customerCode is numeric (like 35390), use it; else settings.startBillNo + index
  const parsedCode = parseInt(customer.customerCode.replace(/[^0-9]/g, ''), 10);
  const billNo = !isNaN(parsedCode) && parsedCode > 1000 ? parsedCode : (settings.startBillNo || 35390) + index;

  // Payments for this customer in this month
  const customerPayments = payments.filter(
    (p) => p.customerId === customer.id && p.month === month
  );
  const paidAmount = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingDue = Math.max(0, totalPayable - paidAmount);

  let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
  if (remainingDue <= 0 && totalPayable > 0) {
    status = 'paid';
  } else if (paidAmount > 0 && remainingDue > 0) {
    status = 'partial';
  } else if (totalPayable === 0) {
    status = 'paid';
  }

  return {
    id: `bill-${customer.id}-${month}`,
    billNo,
    billDateFormatted: getLastDateOfMonthFormatted(month),
    customerId: customer.id,
    customerCode: customer.customerCode,
    customerName: customer.name,
    phone: customer.phone,
    route: customer.route,
    month,
    monthFormatted: getShortMonthCode(month),
    monthName: getMonthLabel(month),
    totalDaysInMonth,
    pauseDays,
    billedDays,
    ratePerDay,
    dailyPaperAmount,
    deliveryCharge,
    oldDue,
    totalPayable,
    paidAmount,
    remainingDue,
    status,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Builds standard UPI URI for QR code and payment intent
 */
export function buildUpiUri(
  upiId: string,
  payeeName: string,
  amount: number,
  note: string
): string {
  const safeUpi = encodeURIComponent(upiId.trim());
  const safeName = encodeURIComponent(payeeName.trim());
  const safeNote = encodeURIComponent(note.trim());
  return `upi://pay?pa=${safeUpi}&pn=${safeName}&am=${amount.toFixed(2)}&tn=${safeNote}&cu=INR`;
}

/**
 * Generates formatted WhatsApp bill message with exact physical bill breakdown
 */
export function generateWhatsAppBillText(
  bill: MonthBill,
  settings: AgencySettings
): string {
  const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.headerName)}&am=${bill.remainingDue}&tn=${encodeURIComponent(`Patrika Bill ${bill.billNo}`)}&cu=INR`;

  return `╔════════════════════════════════════╗
  📰 *${settings.headerName}*
   *${settings.subHeader}*
   ${settings.location} • M. ${settings.mobiles}
╚════════════════════════════════════╝
🧾 *क्रेडिट मेमो बिल पर्ची (CREDIT MEMO)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *बिल नं. (Bill No.):* #${bill.billNo}
📅 *दिनांक (Date):* ${bill.billDateFormatted}
🗓️ *बिल माह (Month):* ${bill.monthName} (${bill.monthFormatted})
👤 *श्रीमान (Customer):* *${bill.customerName}* ${bill.customerCode ? `(#${bill.customerCode})` : ''}
📍 *रूट (Route):* ${bill.route}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *मासिक हिसाब विवरण (BILL BREAKDOWN):*
🗞️ *${settings.paperName}:* ${bill.billedDays} दिन @ ₹${bill.ratePerDay.toFixed(2)} = *₹${bill.dailyPaperAmount.toFixed(2)}*
${bill.pauseDays > 0 ? `   (छुट्टी/Pause: ${bill.pauseDays} दिन की कटौती की गई)\n` : ''}🚚 *D.C. (वितरण प्रभार):* *₹${bill.deliveryCharge}*
⏮️ *Old Due (पिछला बकाया):* *₹${bill.oldDue}*
─────────────────────────────────────
💵 *कुल बिल (Total Payable): ₹${bill.totalPayable}*
${bill.paidAmount > 0 ? `✅ जमा राशि (Paid): ₹${bill.paidAmount}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 *ग्राहक से प्राप्त देय राशि:*
👉 *अंतिम देय (AMOUNT TO COLLECT): ₹${bill.remainingDue}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏦 *बैंक खाता विवरण (Bank Details):*
• बैंक: *${settings.bankName}*
• खाता संख्या: *${settings.bankAccountNo}*
• IFSC: *${settings.bankIfsc}*

📲 *UPI डायरेक्ट पेमेंट लिंक (PhonePe/GPay/Paytm):*
• UPI ID: *${settings.upiId}*
• पे लिंक: ${upiLink}

⚠️ *नियम एवं शर्तें:*
• भुगतान 5 दिवस के अन्दर करना आवश्यक है।
• दैनिक पेपर नहीं मिलने की सूचना 24 घंटे के भीतर दुकान पर देना अनिवार्य है।

सादर,
*${settings.headerName}*
विज्ञापन एवं समाचार के लिए: *${settings.publicityName}*
*${settings.medicalStoreName}*`;
}

export type ReminderType = 'gentle' | 'due_date' | 'urgent_overdue' | 'short_sms';

/**
 * Generates automated payment reminder text based on tone
 */
export function generatePaymentReminderText(
  bill: MonthBill,
  settings: AgencySettings,
  type: ReminderType
): string {
  const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.headerName)}&am=${bill.remainingDue}&tn=${encodeURIComponent(`Patrika Due ${bill.billNo}`)}&cu=INR`;

  if (type === 'gentle') {
    return `नमस्ते ${bill.customerName} जी 🙏,
*${settings.headerName} (न्यूज़ पेपर एजेंट, बागीदौरा)*

आपके राजस्थान पत्रिका बिल नं. *${bill.billNo}* (माह: ${bill.monthFormatted}) का बकाया *₹${bill.remainingDue}* देय है।
(पेपर: ₹${bill.dailyPaperAmount} + D.C.: ₹${bill.deliveryCharge}${bill.oldDue > 0 ? ` + Old Due: ₹${bill.oldDue}` : ''})

कृपया बैंक A/C या PhonePe/Google Pay द्वारा UPI से भुगतान करें:
UPI ID: *${settings.upiId}*
Pay Link: ${upiLink}
सम्पर्क: ${settings.mobiles}`;
  }

  if (type === 'due_date') {
    return `⚠️ *अखबार बिल भुगतान अनुस्मारक*
*${settings.headerName} - ${settings.subHeader}, बागीदौरा*

आदरणीय ${bill.customerName} जी,
बिल नं. *${bill.billNo}* (माह: ${bill.monthFormatted}) के भुगतान की अंतिम तिथि निकट है।
• कुल बकाया राशि: *₹${bill.remainingDue}*

बैंक खाता:
${settings.bankName}
${settings.bankIfsc} | ${settings.bankAccountNo}
UPI: ${settings.upiId}
Pay Link: ${upiLink}

कृपया 5 दिन के अन्दर भुगतान कर सहयोग करें।
सम्पर्क: ${settings.mobiles}`;
  }

  if (type === 'urgent_overdue') {
    return `🚨 *अति महत्वपूर्ण बकाया सूचना*
*${settings.headerName} - ${settings.subHeader}*
${settings.location} (M. ${settings.mobiles})

श्रीमान: *${bill.customerName}* (बिल नं. ${bill.billNo})
आपके खाते में कुल बकाया *₹${bill.remainingDue}* (पुराना बकाया ₹${bill.oldDue} सहित) काफी समय से लंबित है।

दैनिक अखबार सेवा निर्बाध रूप से चालू रखने हेतु कृपया तुरंत भुगतान करें।
UPI ID: *${settings.upiId}*
Pay Link: ${upiLink}
${settings.medicalStoreName}`;
  }

  // short_sms
  return `${settings.headerName}: श्री ${bill.customerName} जी, बिल नं. ${bill.billNo} माह ${bill.monthFormatted} की कुल बकाया राशि ₹${bill.remainingDue} है। UPI: ${settings.upiId} पर भुगतान करें। मो: ${settings.mobiles}`;
}

/**
 * Generates WhatsApp receipt / confirmation for Payment Jama or New Udhar entry
 */
export function generateTransactionWhatsAppText(
  customer: Customer,
  tx: LedgerTransaction,
  settings: AgencySettings
): string {
  if (tx.type === 'jama') {
    return `✅ *भुगतान रसीद (Payment Receipt)*
*${settings.shopName}*
*${settings.headerName} (${settings.subHeader})*
${settings.location} (मो: ${settings.mobiles})
━━━━━━━━━━━━━━━━━━━━
प्रिय ग्राहक: *${customer.name}*
ग्राहक कोड/बिल: *${customer.customerCode}*
दिनांक: *${tx.date}* ${tx.time ? `(${tx.time})` : ''}
━━━━━━━━━━━━━━━━━━━━
💰 *प्राप्त जमा राशि: ₹${tx.amount}*
माध्यम: *${tx.mode ? tx.mode.toUpperCase() : 'नकद (CASH)'}*
${tx.referenceNo ? `रेफरेंस नं: *${tx.referenceNo}*\n` : ''}विवरण: *${tx.reason || 'अखबार बिल भुगतान'}*
━━━━━━━━━━━━━━━━━━━━
📊 *खाता विवरण (Khata Summary):*
पिछला बकाया: ₹${tx.previousBalance}
जमा किया: -₹${tx.amount}
👉 *वर्तमान कुल शेष बकाया: ₹${tx.newBalance}*
━━━━━━━━━━━━━━━━━━━━
धन्यवाद!
*${settings.medicalStoreName}*`;
  } else {
    return `📝 *नया उधार खाता एंट्री (New Credit Entry)*
*${settings.shopName}*
*${settings.headerName} (${settings.subHeader})*
${settings.location} (मो: ${settings.mobiles})
━━━━━━━━━━━━━━━━━━━━
प्रिय ग्राहक: *${customer.name}*
ग्राहक कोड/बिल: *${customer.customerCode}*
दिनांक: *${tx.date}* ${tx.time ? `(${tx.time})` : ''}
━━━━━━━━━━━━━━━━━━━━
🛍️ *नया उधार नामे (Debited): ₹${tx.amount}*
मद / विवरण: *${tx.reason || 'सामान/दवाइयां उधार'}*
${tx.notes ? `नोट: ${tx.notes}\n` : ''}━━━━━━━━━━━━━━━━━━━━
📊 *खाता स्थिति (Updated Balance):*
पिछला बकाया: ₹${tx.previousBalance}
नया उधार जोड़ा: +₹${tx.amount}
👉 *कुल शेष देय राशि: ₹${tx.newBalance}*
━━━━━━━━━━━━━━━━━━━━
सम्पर्क: ${settings.mobiles}
*${settings.medicalStoreName}*`;
  }
}

/**
 * Creates a WhatsApp URL for web or mobile
 */
export function createWhatsAppUrl(phone: string, text: string): string {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
    cleanPhone = '91' + cleanPhone.slice(1);
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Exports data to Excel workbook
 */
export function exportToExcel(sheets: { sheetName: string; data: any[] }[], filename: string) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName);
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Downloads a sample customer excel template
 */
export function downloadCustomerExcelTemplate() {
  const sampleData = [
    {
      'क्र.सं. / कोड (Bill No)': '35390',
      'ग्राहक का नाम (Customer Name)': 'कैलाश होटल',
      'मोबाइल नंबर (Phone)': '9413015952',
      'रूट / मोहल्ला (Route / Area)': 'बागीदौरा मेन मार्केट',
      'पता (Address)': 'बस स्टैंड के पास, बागीदौरा',
      'डिलीवरी चार्ज (₹)': 5,
      'पुराना बकाया (₹)': 0,
      'स्थिति (Status)': 'active',
      'टिप्पणी (Notes)': 'सुबह 6:30 बजे काउंटर पर',
    },
    {
      'क्र.सं. / कोड (Bill No)': '35391',
      'ग्राहक का नाम (Customer Name)': 'धुलजी भाई पंचाल',
      'मोबाइल नंबर (Phone)': '9413018226',
      'रूट / मोहल्ला (Route / Area)': 'पंचाल वाड़ा, बागीदौरा',
      'पता (Address)': 'पंचाल वाड़ा, बागीदौरा',
      'डिलीवरी चार्ज (₹)': 5,
      'पुराना बकाया (₹)': 450,
      'स्थिति (Status)': 'active',
      'टिप्पणी (Notes)': '',
    },
    {
      'क्र.सं. / कोड (Bill No)': '35392',
      'ग्राहक का नाम (Customer Name)': 'सोलंकी रमेशचन्द्र सुखलालजी',
      'मोबाइल नंबर (Phone)': '9414234567',
      'रूट / मोहल्ला (Route / Area)': 'ब्राह्मण वाड़ा',
      'पता (Address)': 'जैन मंदिर के पास, बागीदौरा',
      'डिलीवरी चार्ज (₹)': 5,
      'पुराना बकाया (₹)': 295,
      'स्थिति (Status)': 'active',
      'टिप्पणी (Notes)': '',
    },
    {
      'क्र.सं. / कोड (Bill No)': '35393',
      'ग्राहक का नाम (Customer Name)': 'राजेन्द्र जी सेवक',
      'मोबाइल नंबर (Phone)': '9828345678',
      'रूट / मोहल्ला (Route / Area)': 'सेवक मोहल्ला',
      'पता (Address)': 'सेवक मोहल्ला, बागीदौरा',
      'डिलीवरी चार्ज (₹)': 5,
      'पुराना बकाया (₹)': 4292,
      'स्थिति (Status)': 'active',
      'टिप्पणी (Notes)': '',
    },
  ];

  exportToExcel(
    [{ sheetName: 'Customers_List', data: sampleData }],
    'NK_SHAH_Ravi_Medical_Hindi_Customers_Template'
  );
}

/**
 * Converts Devanagari numerals (०, १, २, ३, ४, ५, ६, ७, ८, ९) to ASCII digits (0-9)
 */
export function devanagariToAsciiDigits(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.split(devanagariDigits[i]).join(String(i));
  }
  return res;
}

/**
 * Cleans Hindi text while preserving Unicode Devanagari characters, matras, halants, and symbols as-is.
 * Applies Unicode NFC normalization to prevent broken conjuncts and renders Devanagari cleanly.
 */
export function cleanHindiText(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // Strip BOM, invisible zero-width chars if present
  str = str.replace(/[\uFEFF\u200B\u200C\u200D]/g, '');
  // Replace non-breaking spaces with standard space
  str = str.replace(/\u00A0/g, ' ');
  // Canonical Unicode composition for Hindi fonts
  return str.normalize('NFC').trim();
}

/**
 * Parses uploaded Excel / CSV file into Customer list.
 * Preserves Hindi names, routes, addresses, and notes 100% as-is without modification.
 * Supports Devanagari numerals, smart header detection (ignoring top title rows), and dual English/Hindi column names.
 */
export async function parseCustomerExcel(file: File): Promise<Partial<Customer>[]> {
  const data = await file.arrayBuffer();
  // Support UTF-8 encoding specifically for Hindi Devanagari text
  const workbook = XLSX.read(data, {
    type: 'array',
    codepage: 65001, // UTF-8 encoding
    raw: false,      // Preserves text representation
  });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) return [];

  // 1. Get raw 2D matrix of rows (header: 1)
  const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (!matrix || matrix.length === 0) return [];

  // Keywords to identify header columns
  const nameKeywords = ['नाम', 'name', 'ग्राहक', 'पार्टी', 'श्री', 'खातेदार', 'कस्टमर', 'member', 'party'];
  const phoneKeywords = ['मोबाइल', 'फोन', 'mobile', 'phone', 'contact', 'whatsapp', 'मो.', 'मो', 'दूरभाष', 'mob'];
  const routeKeywords = ['रूट', 'एरिया', 'मोहल्ला', 'वार्ड', 'क्षेत्र', 'route', 'area', 'ward', 'गाँव', 'मार्ग', 'गली'];
  const dueKeywords = ['बकाया', 'उधार', 'due', 'balance', 'बाकी', 'पुराना', 'शेष', 'पूर्व'];
  const codeKeywords = ['क्र.सं.', 'क्र सं', 'क्र.', 'क्रमांक', 'बिल नं', 'बिल कोड', 'बिल', 'कोड', 'code', 'bill', 'sno', 's.no', 'sr'];
  const dcKeywords = ['वितरण शुल्क', 'वितरण व्यय', 'वितरण', 'डिलीवरी चार्ज', 'डिलीवरी', 'delivery', 'd.c.', 'dc', 'शुल्क'];
  const addrKeywords = ['पता', 'निवास', 'स्थान', 'दुकान', 'ठिकाना', 'address', 'location'];
  const statusKeywords = ['स्थिति', 'चालू/बंद', 'status'];
  const notesKeywords = ['टिप्पणी', 'विवरण', 'रिमार्क', 'notes', 'remark', 'remarks'];

  const matchesKeyword = (headerText: string, kwList: string[]): boolean => {
    const cleanH = cleanHindiText(headerText).toLowerCase();
    return kwList.some((kw) => cleanH.includes(kw.toLowerCase()));
  };

  // 2. Scan first 10 rows to detect the real header row (skipping banner/shop name titles at the top)
  let headerRowIdx = -1;
  let maxMatches = 0;

  for (let r = 0; r < Math.min(10, matrix.length); r++) {
    const row = matrix[r];
    if (!Array.isArray(row)) continue;

    let matchCount = 0;
    for (const cell of row) {
      const cellStr = cleanHindiText(cell);
      if (!cellStr) continue;
      if (
        matchesKeyword(cellStr, nameKeywords) ||
        matchesKeyword(cellStr, phoneKeywords) ||
        matchesKeyword(cellStr, routeKeywords) ||
        matchesKeyword(cellStr, dueKeywords) ||
        matchesKeyword(cellStr, codeKeywords)
      ) {
        matchCount++;
      }
    }

    if (matchCount >= 2 && matchCount > maxMatches) {
      maxMatches = matchCount;
      headerRowIdx = r;
    }
  }

  // Column index map
  let colNameIdx = -1;
  let colPhoneIdx = -1;
  let colRouteIdx = -1;
  let colDueIdx = -1;
  let colCodeIdx = -1;
  let colDcIdx = -1;
  let colAddrIdx = -1;
  let colStatusIdx = -1;
  let colNotesIdx = -1;

  if (headerRowIdx >= 0) {
    const headerRow = matrix[headerRowIdx];
    headerRow.forEach((cell: any, idx: number) => {
      const cellStr = cleanHindiText(cell);
      if (!cellStr) return;

      if (colNameIdx === -1 && matchesKeyword(cellStr, nameKeywords)) {
        colNameIdx = idx;
      } else if (colPhoneIdx === -1 && matchesKeyword(cellStr, phoneKeywords)) {
        colPhoneIdx = idx;
      } else if (colRouteIdx === -1 && matchesKeyword(cellStr, routeKeywords)) {
        colRouteIdx = idx;
      } else if (colDueIdx === -1 && matchesKeyword(cellStr, dueKeywords)) {
        colDueIdx = idx;
      } else if (colCodeIdx === -1 && matchesKeyword(cellStr, codeKeywords)) {
        colCodeIdx = idx;
      } else if (colDcIdx === -1 && matchesKeyword(cellStr, dcKeywords)) {
        colDcIdx = idx;
      } else if (colAddrIdx === -1 && matchesKeyword(cellStr, addrKeywords)) {
        colAddrIdx = idx;
      } else if (colStatusIdx === -1 && matchesKeyword(cellStr, statusKeywords)) {
        colStatusIdx = idx;
      } else if (colNotesIdx === -1 && matchesKeyword(cellStr, notesKeywords)) {
        colNotesIdx = idx;
      }
    });
  }

  // Fallback positional indexing if no headers were recognized
  if (colNameIdx === -1) {
    // If table has at least 2 columns: Column 0 might be code or name, Column 1 is name or phone
    colCodeIdx = 0;
    colNameIdx = 1;
    colPhoneIdx = 2;
    colRouteIdx = 3;
    colDueIdx = 4;
    colDcIdx = 5;
    colAddrIdx = 6;
  }

  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
  const customers: Partial<Customer>[] = [];

  for (let r = startRow; r < matrix.length; r++) {
    const row = matrix[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    // Check if entire row is empty
    const hasData = row.some((val) => cleanHindiText(val) !== '');
    if (!hasData) continue;

    // 1. Customer Name (Preserve Hindi text 100% as is)
    let rawName = colNameIdx >= 0 && row[colNameIdx] !== undefined ? cleanHindiText(row[colNameIdx]) : '';
    if (!rawName && colCodeIdx >= 0 && isNaN(Number(devanagariToAsciiDigits(row[colCodeIdx])))) {
      // If code column has text in Hindi, use it as name
      rawName = cleanHindiText(row[colCodeIdx]);
    }
    // Skip if row has no recognizable name or data
    if (!rawName) continue;

    // 2. Phone Number (Converts Devanagari numerals if any, extracts 10 digits)
    const rawPhoneVal = colPhoneIdx >= 0 && row[colPhoneIdx] !== undefined ? row[colPhoneIdx] : '';
    const phoneWithAscii = devanagariToAsciiDigits(cleanHindiText(rawPhoneVal)).replace(/[^0-9]/g, '');
    const phone = phoneWithAscii.length >= 10 ? phoneWithAscii.slice(-10) : phoneWithAscii;

    // 3. Route / Area (Preserve Hindi text as-is)
    const rawRoute = colRouteIdx >= 0 && row[colRouteIdx] !== undefined ? cleanHindiText(row[colRouteIdx]) : '';
    const route = rawRoute || 'बागीदौरा मेन मार्केट';

    // 4. Address (Preserve Hindi text as-is)
    const rawAddr = colAddrIdx >= 0 && row[colAddrIdx] !== undefined ? cleanHindiText(row[colAddrIdx]) : '';
    const address = rawAddr || '';

    // 5. Customer Code / Bill No (Preserve Hindi/Devanagari or assign serial)
    const rawCodeVal = colCodeIdx >= 0 && row[colCodeIdx] !== undefined ? cleanHindiText(row[colCodeIdx]) : '';
    const customerCode = rawCodeVal || String(35390 + customers.length);

    // 6. Delivery Charge (Supports Devanagari digits e.g. ५ -> 5)
    let deliveryCharge = 5;
    if (colDcIdx >= 0 && row[colDcIdx] !== undefined) {
      const dcStr = devanagariToAsciiDigits(cleanHindiText(row[colDcIdx]));
      const parsedDc = parseFloat(dcStr);
      if (!isNaN(parsedDc) && parsedDc >= 0) {
        deliveryCharge = parsedDc;
      }
    }

    // 7. Old Due / Balance (Supports Devanagari digits e.g. ४५० -> 450)
    let oldDue = 0;
    if (colDueIdx >= 0 && row[colDueIdx] !== undefined) {
      const dueStr = devanagariToAsciiDigits(cleanHindiText(row[colDueIdx]));
      const parsedDue = parseFloat(dueStr);
      if (!isNaN(parsedDue)) {
        oldDue = parsedDue;
      }
    }

    // 8. Status (Supports Hindi status: सक्रिय, बंद, रोक)
    let status: 'active' | 'paused' | 'stopped' = 'active';
    if (colStatusIdx >= 0 && row[colStatusIdx] !== undefined) {
      const s = cleanHindiText(row[colStatusIdx]).toLowerCase();
      if (s.includes('रोक') || s.includes('छुट्टी') || s.includes('pause')) {
        status = 'paused';
      } else if (s.includes('बंद') || s.includes('stop')) {
        status = 'stopped';
      }
    }

    // 9. Notes (Preserve Hindi text as-is)
    const notes = colNotesIdx >= 0 && row[colNotesIdx] !== undefined ? cleanHindiText(row[colNotesIdx]) : '';

    customers.push({
      customerCode: String(customerCode),
      name: rawName, // Verbatim Hindi text
      phone: String(phone),
      route: route,   // Verbatim Hindi route
      address: address, // Verbatim Hindi address
      deliveryCharge,
      oldDue,
      status,
      notes,
    });
  }

  return customers;
}

/**
 * Calculates Area/Route Summary
 */
export function calculateAreaSummaries(bills: MonthBill[]): AreaSummary[] {
  const routeMap = new Map<string, AreaSummary>();

  for (const bill of bills) {
    const route = bill.route || 'बागीदौरा क्षेत्र';
    let current = routeMap.get(route);
    if (!current) {
      current = {
        route,
        totalCustomers: 0,
        activeCustomers: 0,
        totalBilled: 0,
        totalCollected: 0,
        totalDue: 0,
        collectionRate: 0,
      };
      routeMap.set(route, current);
    }

    current.totalCustomers += 1;
    if (bill.billedDays > 0) {
      current.activeCustomers += 1;
    }
    current.totalBilled += bill.totalPayable;
    current.totalCollected += bill.paidAmount;
    current.totalDue += bill.remainingDue;
  }

  const summaries = Array.from(routeMap.values());
  for (const s of summaries) {
    s.collectionRate = s.totalBilled > 0 ? Math.round((s.totalCollected / s.totalBilled) * 100) : 0;
  }

  return summaries.sort((a, b) => b.totalCustomers - a.totalCustomers);
}
