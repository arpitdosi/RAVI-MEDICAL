import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({ value, size = 160, className = '' }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-stone-100 text-stone-400 text-xs rounded border border-stone-200"
      >
        QR लोड हो रहा है...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="UPI QR Code"
      width={size}
      height={size}
      className={`rounded shadow-xs border border-stone-200 bg-white p-1 ${className}`}
    />
  );
};
