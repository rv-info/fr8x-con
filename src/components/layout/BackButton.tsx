"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/feeds");
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-border text-[11px]">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors shadow-2xs cursor-pointer active:scale-95"
        title="Go back to previous page"
      >
        <ArrowLeft className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)] shrink-0" />
        <span>Back</span>
      </button>

      <span className="text-[10px] text-foreground-muted hidden sm:inline-block font-mono">
        {pathname}
      </span>
    </div>
  );
}
