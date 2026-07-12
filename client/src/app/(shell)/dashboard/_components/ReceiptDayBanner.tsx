// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
    message: string;
    multiplier: number;
  };
  
  // ── COMPONENT ─────────────────────────────────────────────────────────────────
  export default function ReceiptDayBanner({ message, multiplier }: Props) {
    return (
      <div className="w-full flex flex-col gap-2 px-5 py-4 bg-[#C9A84C]/10 border border-[#C9A84C] rounded-md">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#C9A84C]">
            Receipt Day
          </p>
          <span className="text-xs font-bold text-[#C9A84C] px-2 py-0.5 border border-[#C9A84C]/50 rounded-full">
            {multiplier}x payouts
          </span>
        </div>
        <p className="text-xs text-[#F0EDEA]">
          {message}
        </p>
      </div>
    );
  }
  