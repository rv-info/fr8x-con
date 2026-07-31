// FR8X-CON Login Page — Modernized Auth Container
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { ROUTES } from "@/lib/utils/constants";
import { AuthCard } from "@/components/auth/AuthCard";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(ROUTES.FEEDS);
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-[var(--fr8x-bg)] dark:bg-gray-950 p-4 sm:p-6 transition-colors overflow-hidden">
      {/* Top Right Mobile Download Buttons Container */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex flex-col items-end gap-2.5">
        {/* Button 1: Download android apk */}
        <a
          href="/downloads/fr8x-con-release.apk"
          download="FR8X-CON-Enterprise.apk"
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] transition-all border border-emerald-400/30"
          title="Download FR8X-CON Android APK"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997 0-.551.4482-.9993.9993-.9993.5512 0 .9997.4483.9997.9993 0 .5511-.4485.9997-.9997.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997 0-.551.4482-.9993.9993-.9993.5512 0 .9997.4483.9997.9993 0 .5511-.4485.9997-.9997.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1523-.5676.416.416 0 00-.5676.1523l-2.0223 3.503C15.5902 8.3075 13.857 7.917 12 7.917c-1.857 0-3.5902.3905-5.1367 1.033L4.841 5.4469a.416.416 0 00-.5676-.1523.416.416 0 00-.1523.5676l1.9973 3.4592C2.6889 11.0743.3444 14.3644.0248 18.25h23.9504c-.3196-3.8856-2.6641-7.1757-6.0935-8.9286" />
          </svg>
          <span>Download android apk</span>
        </a>

        {/* Button 2 (Below it): Download from Apple store */}
        <a
          href="https://apps.apple.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs sm:text-sm shadow-lg active:scale-[0.98] transition-all border border-slate-700/80"
          title="Download FR8X-CON from Apple App Store"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.64-.78 1.08-1.85.96-2.92-.93.04-2.06.62-2.73 1.4-.59.69-1.11 1.79-.97 2.85 1.05.08 2.1-.55 2.74-1.33z" />
          </svg>
          <span>Download from Apple store</span>
        </a>
      </div>

      <AuthCard initialTab="signin" />
    </main>
  );
}
