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

          {/* Middle Details Split: Left (Bank & Terms) | Right (D.C., Old Due, Total) */}
          <div className="grid grid-cols-12 gap-1.5 mt-1.5 text-[10px] leading-tight">
            {/* Left Bank Details & Terms */}
            <div className="col-span-7 flex flex-col justify-between border-r border-[#00487c]/30 pr-1">
              {/* Bank Account */}
              <div className="bg-sky-50/40 p-1 rounded border border-[#00487c]/30 text-[9.5px]">
                <div className="font-bold">{settings.bankName}</div>
                <div className="font-mono font-semibold">{settings.bankIfsc}</div>
                <div className="font-mono font-bold text-stone-900">{settings.bankAccountNo}</div>
              </div>

              {/* Terms Bullets */}
              <div className="space-y-0.5 mt-1 text-[9px] text-stone-700">
                <p>• {settings.term1}</p>
                <p>• {settings.term2}</p>
                <p>• {settings.term3}</p>
              </div>
            </div>

            {/* Right Calculations Box */}
            <div className="col-span-5 flex flex-col justify-between">
              <div className="border border-[#00487c] rounded-md overflow-hidden bg-white">
                <table className="w-full text-[11px] border-collapse">
                  <tbody>
                    <tr className="border-b border-[#00487c]">
                      <td className="py-0.5 px-1.5 bg-sky-50 font-black border-r border-[#00487c] text-left">
                        D.C.
                      </td>
                      <td className="py-0.5 px-1.5 text-right font-mono font-bold">
                        {bill.deliveryCharge}
                      </td>
                    </tr>
                    <tr className="border-b border-[#00487c]">
                      <td className="py-0.5 px-1.5 bg-sky-50 font-black border-r border-[#00487c] text-left">
                        Old Due
                      </td>
                      <td className="py-0.5 px-1.5 text-right font-mono font-bold text-rose-700">
                        {bill.oldDue}
                      </td>
                    </tr>
                    <tr className="bg-sky-100/70 font-black text-xs">
                      <td className="py-1 px-1.5 border-r border-[#00487c] text-left uppercase text-[#00487c]">
                        TOTAL
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono font-black text-sm text-stone-900">
                        {bill.totalPayable}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Line */}
              {showSignature && (
                <div className="text-right mt-1 pt-3 pr-1">
                  <div className="inline-block border-t border-[#00487c] text-[10px] font-serif italic text-right px-2 font-bold text-[#00487c]">
                    Signature
                  </div>
                </div>
              )}
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
