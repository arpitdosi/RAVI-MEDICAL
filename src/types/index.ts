export interface Customer {
  id: string;
  customerCode: string; // e.g. "35390" or "RP-101"
  name: string; // e.g. "कैलाश होटल", "राजेन्द्र जी सेवक"
  phone: string;
  alternatePhone?: string;
  route: string; // e.g. "बागीदौरा मेन मार्केट", "Hospital Road"
  address: string;
  deliveryCharge: number; // D.C. in bill (e.g. 5)
  oldDue: number; // carried over balance (e.g. 450, 4292)
  status: 'active' | 'paused' | 'stopped';
  pauseDaysCount?: number; // days on leave/vacation in current month
  createdAt: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  mode: 'cash' | 'phonepe' | 'gpay' | 'paytm' | 'other_upi' | 'bank';
  referenceNo?: string;
  collectedBy?: string;
  month: string; // "2026-04" or "2026-09"
}

export interface LedgerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'jama' | 'udhar'; // 'jama' = received, 'udhar' = new debit
  amount: number;
  date: string; // "2026-04-10"
  time?: string;
  reason?: string; // e.g. "मासिक अखबार बिल", "दवाइयां (Medical Store)", "सर्जिकल सामग्री", "अतिरिक्त मैगजीन"
  mode?: 'cash' | 'phonepe' | 'gpay' | 'paytm' | 'other_upi' | 'bank';
  referenceNo?: string;
  collectedBy?: string;
  previousBalance: number;
  newBalance: number;
  notes?: string;
  createdAt: string;
}

export interface MonthBill {
  id: string;
  billNo: number; // e.g. 35390, 35391
  billDateFormatted: string; // e.g. "30/04/26"
  customerId: string;
  customerCode: string;
  customerName: string;
  phone: string;
  route: string;
  month: string; // e.g. "2026-04"
  monthFormatted: string; // e.g. "Apr,26" or "Sep,26"
  monthName: string; // e.g. "अप्रैल (April) 2026"
  totalDaysInMonth: number;
  pauseDays: number;
  billedDays: number; // e.g. 30
  ratePerDay: number; // 5.00
  dailyPaperAmount: number; // 150.00
  deliveryCharge: number; // D.C. (e.g. 5)
  oldDue: number; // past pending
  totalPayable: number; // dailyPaperAmount + deliveryCharge + oldDue
  paidAmount: number;
  remainingDue: number; // totalPayable - paidAmount
  status: 'paid' | 'partial' | 'unpaid';
  lastReminderSent?: string;
  updatedAt: string;
}

export interface AgencySettings {
  // Agent & header details (Matching physical bill)
  headerName: string; // "N. K. SHAH"
  subHeader: string; // "NEWS PAPER AGENT"
  location: string; // "Bagidora, Distt. Banswara (Raj.)"
  mobiles: string; // "9413015952 / 9413018226"
  shreeInvocation: string; // "|| श्री महावीराय नमः ||"
  paperName: string; // "राजस्थान पत्रिका"
  startBillNo: number; // 35390

  // Bank Account details
  bankName: string; // "Baroda Rajasthan kshetriya Gramin Bank Bagidora"
  bankIfsc: string; // "BARB0BRGBXX"
  bankAccountNo: string; // "42560200000327"

  // Bottom advertisements / footer
  publicityTagline: string; // "राजस्थान पत्रिका में विज्ञापन एवं समाचार के लिए सम्पर्क करें-"
  publicityName: string; // "रवि पब्लिसिटी, बागीदौरा"
  medicalTagline: string; // "अंग्रेजी-आयुर्वेदिक व पशुओं की दवाईयाँ एवं सभी प्रकार की सर्जिकल सामग्री मिलने का उचित स्थान"
  medicalStoreName: string; // "रवि मेडिकल एण्ड जनरल स्टोर, बागीदौरा"

  // Terms & conditions
  term1: string; // "भुगतान 5 दिन के अन्दर करना आवश्यक है।"
  term2: string; // "भुगतान करते समय रसीद अवश्य लेवे।"
  term3: string; // "दैनिक पेपर नहीं मिलने की सूचना 24 घंटे के भीतर दुकान पर देना अनिवार्य है।"

  // Rates & Payment info
  shopName: string; // "रवि मेडिकल (Ravi Medical)"
  ownerPhone: string; // "9413015952"
  upiId: string; // "9413015952@upi"
  defaultDailyRate: number; // 5
  defaultDeliveryCharge: number; // 5
  billingCycleDay: number; // 1
  billNotes: string;
}

export interface AreaSummary {
  route: string;
  totalCustomers: number;
  activeCustomers: number;
  totalBilled: number;
  totalCollected: number;
  totalDue: number;
  collectionRate: number;
}
