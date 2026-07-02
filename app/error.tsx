"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0B1E4B] px-4"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-[420px] bg-white rounded-[20px] p-[36px_28px] shadow-[0_3px_14px_rgba(15,23,42,0.09),0_1px_4px_rgba(11,30,75,0.04)] border border-[rgba(148,163,184,0.25)] text-center">
        <div className="inline-block text-[10px] font-bold tracking-[2px] uppercase text-[#B4232C] bg-[rgba(180,35,44,0.1)] rounded-full border border-[rgba(180,35,44,0.25)] px-[14px] py-[5px] mb-[18px]">
          Terjadi Kesalahan
        </div>
        <h1 className="text-[22px] font-bold tracking-[-0.5px] text-[#0B1E4B] mb-[8px]">
          Ada yang Tidak Beres
        </h1>
        <p className="text-[13px] text-[#8A95A3] leading-[1.6] mb-[24px]">
          Sistem mengalami gangguan tak terduga. Coba muat ulang halaman ini.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="w-full py-[11px] rounded-[10px] bg-[#0B1E4B] text-white text-[13px] font-semibold border-none cursor-pointer transition-all hover:bg-[#0F2150]"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
