import html2canvas from 'html2canvas-pro';
import { MonthBill, AgencySettings } from '../types';
import { generateWhatsAppBillText, createWhatsAppUrl } from './billingUtils';

/**
 * Captures an HTML element as a high-resolution PNG image Blob.
 */
export async function captureBillImage(elementId: string): Promise<Blob | null> {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 440,
      onclone: (clonedDoc) => {
        const target = clonedDoc.getElementById(elementId);
        if (target) {
          target.style.opacity = '1';
          target.style.visibility = 'visible';
          target.style.position = 'relative';
          target.style.left = '0';
          target.style.top = '0';
          if (target.parentElement) {
            target.parentElement.style.opacity = '1';
            target.parentElement.style.visibility = 'visible';
          }
        }
      },
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  } catch (err) {
    console.error('Error capturing bill image:', err);
    return null;
  }
}

/**
 * Downloads a blob as a PNG file
 */
export function downloadBlobAsFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ShareBillResult {
  mode: 'native_share' | 'clipboard_and_tab' | 'tab_only' | 'cancelled';
  message: string;
}

/**
 * Shares the visual bill memo on WhatsApp with both the authentic Bill Image
 * and the complete digital Credit Memo text breakdown.
 *
 * 1. On mobile devices with Web Share API file support:
 *    Attaches the actual Bill Image (PNG) + pre-filled caption text directly into WhatsApp.
 * 2. On desktop/browsers without file share:
 *    Copies the high-resolution Bill Image to the clipboard (for instant Ctrl+V pasting into WhatsApp Web)
 *    and opens WhatsApp with the authentic bill memo text.
 */
export async function shareBillOnWhatsApp(
  bill: MonthBill,
  settings: AgencySettings,
  elementId?: string
): Promise<ShareBillResult> {
  const whatsAppText = generateWhatsAppBillText(bill, settings);
  const safeName = bill.customerName.replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
  const fileName = `Patrika_Bill_${bill.billNo}_${safeName}.png`;

  let blob: Blob | null = null;
  if (elementId) {
    blob = await captureBillImage(elementId);
  }

  // Check Web Share API with file support (Mobile Chrome / Safari / Android)
  if (blob && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: whatsAppText,
          title: `राजस्थान पत्रिका बिल पर्ची - ${bill.customerName}`,
        });
        return {
          mode: 'native_share',
          message: 'बिल पर्ची फोटो और विवरण WhatsApp पर शेयर हो गया!',
        };
      }
    } catch (shareErr: unknown) {
      if (shareErr instanceof Error && shareErr.name === 'AbortError') {
        return {
          mode: 'cancelled',
          message: 'शेयर रद्द किया गया',
        };
      }
      console.warn('Native share failed or unhandled, falling back:', shareErr);
    }
  }

  // Fallback: Copy image to clipboard so user can press Ctrl+V in WhatsApp Web
  let copiedImage = false;
  if (blob && typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          'image/png': blob,
        }),
      ]);
      copiedImage = true;
    } catch (clipErr) {
      console.warn('Clipboard image copy not permitted:', clipErr);
    }
  }

  // Open WhatsApp in new tab / app
  const whatsAppUrl = createWhatsAppUrl(bill.phone, whatsAppText);
  window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');

  if (copiedImage) {
    return {
      mode: 'clipboard_and_tab',
      message: '✓ बिल की फोटो कॉपी हो गई है! WhatsApp में सीधे Ctrl+V करके पेस्ट करें।',
    };
  }

  return {
    mode: 'tab_only',
    message: 'WhatsApp खुल गया है।',
  };
}
