import { Customer, AgencySettings, PaymentRecord, LedgerTransaction } from '../types';
import { DEFAULT_SETTINGS, INITIAL_CUSTOMERS, INITIAL_PAYMENTS } from '../data/sampleData';
import { buildBagidoraCustomers, buildBagidoraPayments } from '../data/realCustomersData';

const CUSTOMERS_KEY = 'ravi_medical_patrika_customers_v3';
const PAYMENTS_KEY = 'ravi_medical_patrika_payments_v3';
const TRANSACTIONS_KEY = 'ravi_medical_patrika_transactions_v3';
const SETTINGS_KEY = 'ravi_medical_patrika_settings_v3';
const ACTIVE_MONTH_KEY = 'ravi_medical_patrika_active_month_v3';

const BAGIDORA_IMAGE_DATA_FLAG = 'ravi_medical_bagidora_388_images_loaded_v2';

// Automatically load the 388 customers from user's 20 register photos into localStorage
if (typeof window !== 'undefined') {
  try {
    const flagSet = localStorage.getItem(BAGIDORA_IMAGE_DATA_FLAG);
    const existingRaw = localStorage.getItem(CUSTOMERS_KEY);
    const existingCusts = existingRaw ? JSON.parse(existingRaw) : [];
    
    if (!flagSet || !Array.isArray(existingCusts) || existingCusts.length < 350) {
      const realCustomers = buildBagidoraCustomers();
      const realPayments = buildBagidoraPayments(realCustomers, '2026-04');
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(realCustomers));
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(realPayments));
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));

      // Ensure settings have starting bill 37001
      const currentSettings = localStorage.getItem(SETTINGS_KEY);
      const parsedSettings = currentSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(currentSettings) } : DEFAULT_SETTINGS;
      parsedSettings.startBillNo = 37001;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsedSettings));

      localStorage.setItem(BAGIDORA_IMAGE_DATA_FLAG, 'true');
    }
  } catch (e) {
    console.error('Storage init error:', e);
  }
}

export function getStoredTransactions(): LedgerTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load transactions:', err);
    return [];
  }
}

export function saveTransactions(transactions: LedgerTransaction[]) {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
}

export function getStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) {
      const realCustomers = buildBagidoraCustomers();
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(realCustomers));
      return realCustomers;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const realCustomers = buildBagidoraCustomers();
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(realCustomers));
      return realCustomers;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load customers from storage:', err);
    return buildBagidoraCustomers();
  }
}

export function saveCustomers(customers: Customer[]) {
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to save customers to storage:', err);
  }
}

export function getStoredPayments(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) {
      const custs = getStoredCustomers();
      const realPayments = buildBagidoraPayments(custs, '2026-04');
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(realPayments));
      return realPayments;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const custs = getStoredCustomers();
      const realPayments = buildBagidoraPayments(custs, '2026-04');
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(realPayments));
      return realPayments;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load payments:', err);
    return [];
  }
}

export function savePayments(payments: PaymentRecord[]) {
  try {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  } catch (err) {
    console.error('Failed to save payments:', err);
  }
}

export function getStoredSettings(): AgencySettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      const defaultWithStart = { ...DEFAULT_SETTINGS, startBillNo: 37001 };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultWithStart));
      return defaultWithStart;
    }
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    if (!parsed.startBillNo || parsed.startBillNo < 37000) {
      parsed.startBillNo = 37001;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load settings:', err);
    return { ...DEFAULT_SETTINGS, startBillNo: 37001 };
  }
}

export function saveSettings(settings: AgencySettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function getActiveMonth(): string {
  try {
    const raw = localStorage.getItem(ACTIVE_MONTH_KEY);
    if (raw) return raw;
  } catch (e) {}
  // Default to April 2026 matching physical bills uploaded by user
  return '2026-04';
}

export function saveActiveMonth(month: string) {
  try {
    localStorage.setItem(ACTIVE_MONTH_KEY, month);
  } catch (e) {}
}

/**
 * Completely clears all customer records, payments, and transactions.
 * Preserves agency settings so shop name, phone, rates remain configured.
 */
export function clearAllCustomerData() {
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([]));
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify([]));
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
    localStorage.removeItem('ravi_medical_patrika_customers_v2');
    localStorage.removeItem('ravi_medical_patrika_payments_v2');
    localStorage.removeItem('ravi_medical_patrika_transactions_v2');
    localStorage.removeItem('ravi_medical_patrika_customers');
    localStorage.removeItem('ravi_medical_patrika_payments');
    localStorage.removeItem('ravi_medical_patrika_transactions');
  } catch (err) {
    console.error('Failed to clear database:', err);
  }
}

/**
 * Creates full JSON backup
 */
export function exportDatabaseBackup(): string {
  const data = {
    version: '3.0',
    exportDate: new Date().toISOString(),
    customers: getStoredCustomers(),
    payments: getStoredPayments(),
    transactions: getStoredTransactions(),
    settings: getStoredSettings(),
    activeMonth: getActiveMonth(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Restores full database backup
 */
export function restoreDatabaseBackup(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data.customers)) {
      saveCustomers(data.customers);
    }
    if (Array.isArray(data.payments)) {
      savePayments(data.payments);
    }
    if (Array.isArray(data.transactions)) {
      saveTransactions(data.transactions);
    }
    if (data.settings) {
      saveSettings(data.settings);
    }
    if (data.activeMonth) {
      saveActiveMonth(data.activeMonth);
    }
    return true;
  } catch (err) {
    console.error('Failed to restore backup:', err);
    return false;
  }
}

/**
 * Resets back to 260 real Bagidora customers from user photos
 */
export function resetToDemoData() {
  const realCustomers = buildBagidoraCustomers();
  const realPayments = buildBagidoraPayments(realCustomers, '2026-04');
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(realCustomers));
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(realPayments));
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
  const s = { ...DEFAULT_SETTINGS, startBillNo: 37001 };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  localStorage.setItem(ACTIVE_MONTH_KEY, '2026-04');
}
