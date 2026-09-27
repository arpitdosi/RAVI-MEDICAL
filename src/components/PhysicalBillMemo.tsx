import React from 'react';
import { MonthBill, AgencySettings } from '../types';

interface PhysicalBillMemoProps {
  bill: MonthBill;
  settings: AgencySettings;
  className?: string;
  showSignature?: boolean;
}

export const PhysicalBillMemo: React.FC<PhysicalBillMemoProps> = ({
  bill,
  settings,
  className = '',
  showSignature = true,
}) => {
  return (
    <div
      className={`bg-white text-[#00487c] font-sans border-2 border-[#00487c] rounded-xl p-2.5 sm:p-3 shadow-xs select-none ${className}`}
      style={{
        borderColor: '#00487c',
        color: '#00487c',
      }}
    >
      {/* Outer border wrapper matching traditional block print */}
      <div className="border border-[#00487c] rounded-lg p-2 sm:p-2.5 flex flex-col justify-between h-full bg-[#fbfdff]">
        {/* Top Header: Mobile, Invocation, Month */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold border-b border-[#00487c]/30 pb-1 leading-tight">
            <div className="font-mono tracking-tight">
              <span className="font-serif">M. </span>
              <span>{settings.mobiles}</span>
            </div>
            <div className="text-center font-bold text-[11px] text-[#00487c]">
              {settings.shreeInvocation}
            </div>
            <div className="text-right font-bold text-[11px]">
              <span>Month : </span>
              <span className="font-mono underline decoration-dotted">{bill.monthFormatted}</span>
            </div>
          </div>

          {/* Main Agency Name & Location */}
          <div className="text-center mt-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase font-serif text-[#00487c] leading-none scale-y-110">
              {settings.headerName}
            </h2>
            <div className="text-[12px] sm:text-[13px] font-extrabold tracking-widest uppercase mt-0.5 border-y border-[#00487c]/40 py-0.5 inline-block px-3">
              {settings.subHeader}
            </div>
            <div className="text-[11px] font-bold mt-0.5 tracking-tight">
              {settings.location}
            </div>
          </div>

          {/* CREDIT MEMO Stamp */}
          <div className="text-center my-1">
            <span className="inline-block border-2 border-dashed border-[#00487c] rounded-full px-3 py-0.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-sky-50/50">
              (CREDIT MEMO)
            </span>
          </div>

          {/* Bill No, Date & Shri (Customer Name) */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-1">
                <span>Bill No.</span>
                <span className="font-mono text-sm font-black underline decoration-dotted">
                  {bill.billNo}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Date</span>
                <span className="font-mono text-xs font-bold underline decoration-dotted">
                  {bill.billDateFormatted}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 border-b border-[#00487c]/50 pb-1">
              <span className="font-bold text-xs shrink-0">Shri</span>
              <span className="font-bold text-sm sm:text-base text-stone-900 tracking-wide font-sans truncate underline decoration-dotted">
                {bill.customerName}
              </span>
            </div>
          </div>

          {/* Table: Paper | Qty. | Rate | Amount */}
          <div className="mt-1.5 border-2 border-[#00487c] rounded-lg overflow-hidden bg-white">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="border-b-2 border-[#00487c] bg-sky-50/70 text-[#00487c] font-black text-[11px]">
                  <th className="py-1 px-1.5 border-r border-[#00487c] text-left w-5/12">Paper</th>
                  <th className="py-1 px-1 border-r border-[#00487c] w-2/12">Qty.</th>
                  <th className="py-1 px-1 border-r border-[#00487c] w-2/12">Rate</th>
                  <th className="py-1 px-1.5 text-right w-3/12">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold text-xs h-10">
                  <td className="py-1.5 px-1.5 border-r border-[#00487c] text-left font-black text-stone-900 text-xs sm:text-sm">
                    {settings.paperName}
                    {bill.pauseDays > 0 && (
                      <span className="block text-[9px] font-normal text-amber-800">
                        (छुट्टी: -{bill.pauseDays} दिन)
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-1 border-r border-[#00487c] font-mono text-xs sm:text-sm font-bold">
                    {bill.billedDays}
                  </td>
                  <td className="py-1.5 px-1 border-r border-[#00487c] font-mono text-xs sm:text-sm font-bold">
                    {bill.ratePerDay.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-mono text-xs sm:text-sm font-black text-stone-900">
                    {bill.dailyPaperAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Middle Details Split: Left (Bank & Terms) | Right (D.C., Old Due, Total, Net Due) */}
          <div className="grid grid-cols-2 gap-2 mt-1.5 text-[10px] leading-tight">
            {/* Left Bank Details & Terms */}
            <div className="flex flex-col justify-between border-r border-[#00487c]/30 pr-1.5">
              {/* Bank Account */}
              <div className="bg-sky-50/50 p-1.5 rounded-md border border-[#00487c]/30 text-[9.5px]">
                <div className="font-bold text-[#00487c] truncate">{settings.bankName}</div>
                <div className="font-mono font-semibold text-stone-700">IFSC: {settings.bankIfsc}</div>
                <div className="font-mono font-bold text-stone-900">A/c: {settings.bankAccountNo}</div>
              </div>

              {/* Terms Bullets */}
              <div className="space-y-0.5 mt-1 text-[8.5px] sm:text-[9px] text-stone-700">
                <p>• {settings.term1}</p>
                <p>• {settings.term2}</p>
                <p>• {settings.term3}</p>
              </div>

              {/* Signature Line */}
              {showSignature && (
                <div className="mt-1.5 pt-1 border-t border-[#00487c]/30 text-left">
                  <span className="text-[9px] font-serif italic font-bold text-[#00487c]">
                    हस्ताक्षर (Signature)
                  </span>
                </div>
              )}
            </div>

            {/* Right Calculations Box */}
            <div className="flex flex-col justify-between">
              <div className="border border-[#00487c] rounded-md overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-[10px] sm:text-[10.5px] border-collapse">
                  <tbody>
                    <tr className="border-b border-[#00487c]">
                      <td className="py-0.5 px-1.5 bg-sky-50 font-bold border-r border-[#00487c] text-left text-stone-700">
                        D.C. (वितरण शुल्क)
                      </td>
                      <td className="py-0.5 px-1.5 text-right font-mono font-bold">
                        ₹{bill.deliveryCharge}
                      </td>
                    </tr>
                    <tr className="border-b border-[#00487c]">
                      <td className="py-0.5 px-1.5 bg-sky-50 font-bold border-r border-[#00487c] text-left text-stone-700">
                        Old Due (पिछला बकाया)
                      </td>
                      <td className="py-0.5 px-1.5 text-right font-mono font-bold text-rose-700">
                        ₹{bill.oldDue}
                      </td>
                    </tr>
                    <tr className="border-b border-[#00487c] bg-stone-50">
                      <td className="py-0.5 px-1.5 font-bold border-r border-[#00487c] text-left text-stone-700">
                        कुल बिल (Total)
                      </td>
                      <td className="py-0.5 px-1.5 text-right font-mono font-bold text-stone-900">
                        ₹{bill.totalPayable}
                      </td>
                    </tr>
                    {bill.paidAmount > 0 && (
                      <tr className="border-b border-[#00487c] bg-emerald-50">
                        <td className="py-0.5 px-1.5 font-bold border-r border-[#00487c] text-left text-emerald-800">
                          जमा राशि (Paid -)
                        </td>
                        <td className="py-0.5 px-1.5 text-right font-mono font-bold text-emerald-700">
                          -₹{bill.paidAmount}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-sky-100 font-black text-[10.5px] sm:text-[11px] text-[#00487c]">
                      <td className="py-1 px-1.5 border-r border-[#00487c] text-left uppercase">
                        देय राशि (Due)
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono font-black text-rose-700 text-xs sm:text-sm">
                        ₹{bill.remainingDue}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* HIGH-VISIBILITY PROMINENT AMOUNT TO COLLECT BANNER (ग्राहक से लेने योग्य राशि) */}
          <div className="mt-2 py-1.5 px-2.5 bg-[#00487c] text-white rounded-lg flex items-center justify-between border-2 border-[#00487c] shadow-xs">
            <div className="flex flex-col text-left">
              <span className="text-[10px] sm:text-[11px] font-black tracking-wide uppercase text-sky-200">
                ग्राहक से कुल देय राशि (Amount To Collect)
              </span>
              <span className="text-[8.5px] sm:text-[9px] text-sky-100/90 font-mono">
                {bill.paidAmount > 0
                  ? `(कुल बिल ₹${bill.totalPayable} - जमा ₹${bill.paidAmount} = बकाया)`
                  : `(अखबार: ₹${bill.dailyPaperAmount.toFixed(0)} + D.C.: ₹${bill.deliveryCharge} + पिछला: ₹${bill.oldDue})`}
              </span>
            </div>
            <div className="text-right shrink-0 pl-2">
              <span className="font-mono text-base sm:text-xl font-black text-amber-300 drop-shadow-xs">
                ₹{bill.remainingDue}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Prominent Footer: Ravi Publicity & Ravi Medical Store */}
        <div className="mt-2 pt-1.5 border-t-2 border-[#00487c] text-center space-y-0.5">
          <p className="text-[9.5px] font-semibold text-stone-800 tracking-tight leading-tight">
            {settings.publicityTagline}
          </p>
          <div className="text-xs sm:text-sm font-black text-[#00487c] tracking-wide">
            {settings.publicityName}
          </div>
          <p className="text-[9px] font-medium text-stone-700 leading-tight">
            {settings.medicalTagline}
          </p>
          <div className="text-xs sm:text-sm font-black text-rose-900 tracking-wide uppercase">
            {settings.medicalStoreName}
          </div>
        </div>
      </div>
    </div>
  );
};
