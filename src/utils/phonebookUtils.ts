export interface PhoneContact {
  id: string;
  name: string;
  phone: string;
}

const PHONEBOOK_STORAGE_KEY = 'ravi_medical_phonebook_v1';

/**
 * Check if the Web Contact Picker API is available in this browser
 */
export function isContactPickerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    typeof (navigator as any).contacts?.select === 'function'
  );
}

/**
 * Normalizes phone numbers from phone contacts, clipboard or user input:
 * strips country code (+91, 0091, 0), spaces, dashes, brackets, and converts Devanagari numerals.
 */
export function normalizePhoneNumber(val: string): string {
  if (!val) return '';
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let clean = String(val).trim();
  for (let i = 0; i < 10; i++) {
    clean = clean.split(devanagariDigits[i]).join(String(i));
  }
  // Strip non-digits
  const digits = clean.replace(/[^0-9]/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Safe invocation of native Contact Picker API with fallback for properties
 */
export async function pickNativeContact(): Promise<{ name: string; phone: string } | null> {
  if (!isContactPickerSupported()) {
    throw new Error('NOT_SUPPORTED');
  }

  const contactsManager = (navigator as any).contacts;
  let props = ['name', 'tel'];

  if (typeof contactsManager.getProperties === 'function') {
    try {
      const supported = await contactsManager.getProperties();
      if (Array.isArray(supported) && supported.length > 0) {
        props = props.filter((p) => supported.includes(p));
        if (props.length === 0 && supported.includes('tel')) {
          props = ['tel'];
        }
      }
    } catch {
      props = ['tel'];
    }
  }

  const opts = { multiple: false };
  let selected: any[] | null = null;
  try {
    selected = await contactsManager.select(props, opts);
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('properties')) {
      // Fallback if particular property set is rejected
      selected = await contactsManager.select(['tel'], opts);
    } else {
      throw err;
    }
  }

  if (selected && selected.length > 0) {
    const item = selected[0];
    const tel = item.tel && item.tel[0] ? normalizePhoneNumber(item.tel[0]) : '';
    const name = item.name && item.name[0] ? item.name[0] : '';
    return { name, phone: tel };
  }
  return null;
}

/**
 * Parses standard .VCF (vCard) files exported from Android or iOS Contacts apps
 */
export function parseVCardContent(vcfText: string): PhoneContact[] {
  const contacts: PhoneContact[] = [];
  // Split into individual vCard blocks
  const cards = vcfText.split(/BEGIN:VCARD/i);

  cards.forEach((card, idx) => {
    if (!card.trim()) return;

    // Extract Full Name (FN) or Name (N)
    let name = '';
    const fnMatch = card.match(/FN(?:;[^:]*)?:(.*?)(\r?\n|$)/i);
    if (fnMatch && fnMatch[1]) {
      name = fnMatch[1].trim();
    } else {
      const nMatch = card.match(/N(?:;[^:]*)?:(.*?)(\r?\n|$)/i);
      if (nMatch && nMatch[1]) {
        // N is often: LastName;FirstName;Middle;Prefix;Suffix
        const parts = nMatch[1].split(';').map((s) => s.trim()).filter(Boolean);
        name = parts.reverse().join(' ');
      }
    }

    // Extract Telephone (TEL)
    // Could have multiple TEL lines; we take the first valid mobile
    const telRegex = /TEL(?:;[^:]*)?:(.*?)(\r?\n|$)/gi;
    let telMatch: RegExpExecArray | null;
    let validPhone = '';

    while ((telMatch = telRegex.exec(card)) !== null) {
      const rawTel = telMatch[1].trim();
      const cleaned = normalizePhoneNumber(rawTel);
      if (cleaned.length === 10) {
        validPhone = cleaned;
        break;
      }
    }

    if (validPhone) {
      contacts.push({
        id: `contact-${idx}-${Date.now().toString().slice(-4)}`,
        name: name || 'अज्ञात (Unnamed)',
        phone: validPhone,
      });
    }
  });

  return contacts;
}

/**
 * Get stored phonebook contacts from localStorage
 */
export function getStoredPhonebook(): PhoneContact[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PHONEBOOK_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load phonebook:', err);
    return [];
  }
}

/**
 * Save phonebook contacts to localStorage
 */
export function saveStoredPhonebook(contacts: PhoneContact[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PHONEBOOK_STORAGE_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.error('Failed to save phonebook:', err);
  }
}

/**
 * Automatically match customer records against imported phonebook
 */
export function autoMatchPhoneNumbers(
  customers: { id: string; name: string; phone: string }[],
  contacts: PhoneContact[]
): { customerId: string; matchedPhone: string; contactName: string }[] {
  const matches: { customerId: string; matchedPhone: string; contactName: string }[] = [];

  // Clean name helper
  const cleanWord = (w: string) =>
    w
      .toLowerCase()
      .replace(/[^\u0900-\u097Fa-z0-9]/g, '')
      .replace(/जी|साहब|भाई|श्री|सेठ|मास्टर|पटवारी|अध्यापक|डाक्टर|डॉक्टर|डॉ|मिस्टर|वकील/g, '')
      .trim();

  customers.forEach((cust) => {
    // If customer already has a 10 digit number, skip
    if (cust.phone && cust.phone.length === 10) return;

    const cWords = cust.name
      .split(/\s+/)
      .map(cleanWord)
      .filter((w) => w.length >= 3);

    let bestMatch: PhoneContact | null = null;

    for (const contact of contacts) {
      const contactWords = contact.name
        .split(/\s+/)
        .map(cleanWord)
        .filter((w) => w.length >= 3);

      // Check exact name substring match
      const cNameClean = cust.name.toLowerCase().replace(/\s+/g, '');
      const pNameClean = contact.name.toLowerCase().replace(/\s+/g, '');

      if (cNameClean.includes(pNameClean) || pNameClean.includes(cNameClean)) {
        bestMatch = contact;
        break;
      }

      // Check if at least 2 significant words match
      const matchingWords = cWords.filter((cw) => contactWords.some((pw) => pw.includes(cw) || cw.includes(pw)));
      if (cWords.length >= 2 && matchingWords.length >= 2) {
        bestMatch = contact;
        break;
      } else if (cWords.length === 1 && matchingWords.length === 1) {
        bestMatch = contact;
      }
    }

    if (bestMatch) {
      matches.push({
        customerId: cust.id,
        matchedPhone: bestMatch.phone,
        contactName: bestMatch.name,
      });
    }
  });

  return matches;
}
