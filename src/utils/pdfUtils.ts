import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Generates a multi-page Legal Size (8.5 x 14 in) PDF from DOM elements.
 * Each element corresponds to one full legal page containing 4 bills in a 2-2 set.
 */
export async function generateLegalBatchPdf(
  pageElementIds: string[],
  fileName: string = 'Patrika_Legal_Bills',
  onProgress?: (current: number, total: number) => void
): Promise<boolean> {
  const total = pageElementIds.length;
  if (total === 0) return false;

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'legal', // 215.9 x 355.6 mm
      compress: true,
    });

    for (let i = 0; i < total; i++) {
      onProgress?.(i + 1, total);
      const element = document.getElementById(pageElementIds[i]);
      if (!element) continue;

      // Capture at scale 2 for crisp 300 DPI print quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 850,
        onclone: (clonedDoc) => {
          const target = clonedDoc.getElementById(pageElementIds[i]);
          if (target) {
            target.style.opacity = '1';
            target.style.visibility = 'visible';
            // Ensure parent container is not hidden in clone
            if (target.parentElement) {
              target.parentElement.style.opacity = '1';
              target.parentElement.style.visibility = 'visible';
            }
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.93);

      if (i > 0) {
        pdf.addPage('legal', 'portrait');
      }

      // Legal dimensions with 5mm margin
      // Width: 215.9 - 10 = 205.9 mm
      // Height: 355.6 - 10 = 345.6 mm
      pdf.addImage(imgData, 'JPEG', 5, 5, 205.9, 345.6, undefined, 'FAST');
    }

    pdf.save(`${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating Legal Batch PDF:', error);
    return false;
  }
}

/**
 * Generates a single bill PDF receipt for sharing or printing.
 */
export async function generateSingleBillPdf(
  elementId: string,
  fileName: string = 'Patrika_Bill'
): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) return false;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        const target = clonedDoc.getElementById(elementId);
        if (target) {
          target.style.opacity = '1';
          target.style.visibility = 'visible';
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Fit nicely on A4 portrait
    pdf.addImage(imgData, 'JPEG', 25, 15, 160, 240, undefined, 'FAST');
    pdf.save(`${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating Single Bill PDF:', error);
    return false;
  }
}
