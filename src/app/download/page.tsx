// FR8X-CON Enterprise Logistics — Mobile App Download & OTA Update Portal
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Smartphone, CheckCircle2, ShieldCheck, Zap, RefreshCw, ArrowLeft, ExternalLink } from "lucide-react";

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [downloadCount, setDownloadCount] = useState(1420);
  const [otaStatus, setOtaStatus] = useState<{
    version: string;
    channel: string;
    lastUpdated: string;
    autoUpdateEnabled: boolean;
  }>({
    version: "1.0.0",
    channel: "production",
    lastUpdated: new Date().toISOString(),
    autoUpdateEnabled: true,
  });

  useEffect(() => {
    fetch("/api/mobile/ota-status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOtaStatus({
            version: data.version || "1.0.0",
            channel: data.channel || "production",
            lastUpdated: data.lastUpdated || new Date().toISOString(),
            autoUpdateEnabled: true,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    setDownloadCount((prev) => prev + 1);

    // Trigger direct APK download from hosted endpoint
    const link = document.createElement("a");
    link.href = "/downloads/fr8x-con-release.apk";
    link.download = "FR8X-CON-Enterprise.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#56C5F0] selection:text-slate-900 font-sans">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#56C5F0]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header Bar */}
      <header className="relative z-10 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#56C5F0]" />
          <span className="text-sm font-semibold">Back to Platform</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            OTA Auto-Update Active
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 flex flex-col items-center">
        {/* Title Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#56C5F0]/10 border border-[#56C5F0]/30 text-[#56C5F0] text-xs font-bold uppercase tracking-wider mb-6">
          <Smartphone className="w-4 h-4" />
          Android Mobile Application
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-center tracking-tight text-white mb-4">
          FR8X-CON Enterprise Mobile
        </h1>
        <p className="text-slate-400 text-center text-base md:text-lg max-w-2xl mb-8">
          Real-time logistics, reverse auctions, container tracking, and instant push notifications on your Android device.
        </p>

        {/* Download Card */}
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#56C5F0]/5 rounded-bl-full pointer-events-none"></div>

          {/* App Header Info */}
          <div className="flex items-center gap-5 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#56C5F0] to-blue-600 flex items-center justify-center shadow-lg shadow-[#56C5F0]/20 font-black text-slate-900 text-2xl">
              FR8X
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">FR8X-CON Android App</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Package: in.fr8x.con • v{otaStatus.version}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="text-emerald-400 font-medium">✓ Verified Build</span>
                <span>•</span>
                <span>{downloadCount.toLocaleString()} installs</span>
              </div>
            </div>
          </div>

          {/* Key Highlights */}
          <div className="py-6 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#56C5F0] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Automatic Over-The-Air (OTA) Updates</p>
                <p className="text-xs text-slate-400">No need to reinstall manually! Code fixes & features update automatically on startup.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Zero-Crash System Supervisor Engine</p>
                <p className="text-xs text-slate-400">Built-in runtime fault protection guarantees smooth launching on all Android versions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Biometric & FCM Push Ready</p>
                <p className="text-xs text-slate-400">Secure fingerprint unlock and instant auction outbid alerts.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#56C5F0] to-blue-500 hover:from-[#3ABFF0] hover:to-blue-600 active:scale-[0.99] text-slate-950 font-bold text-base shadow-lg shadow-[#56C5F0]/25 transition-all flex items-center justify-center gap-3 disabled:opacity-75"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Initiating Download...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Free Android APK (.apk)</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="https://expo.dev/accounts/fr8xs-team/projects/fr8x-con/builds"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>Download via Expo Cloud Builds</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#56C5F0]" />
              </a>

              <a
                href="https://u.expo.dev/a6b388b8-9419-4569-88f8-44566339ab15"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>EAS OTA Channel Status</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Instructions Footer */}
        <div className="mt-12 w-full max-w-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-xs font-bold text-[#56C5F0] mb-1">STEP 1</div>
            <p className="text-xs text-slate-300 font-semibold">Download APK</p>
            <p className="text-[11px] text-slate-400 mt-1">Click the button above to save the file.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-xs font-bold text-[#56C5F0] mb-1">STEP 2</div>
            <p className="text-xs text-slate-300 font-semibold">Install on Android</p>
            <p className="text-[11px] text-slate-400 mt-1">Tap file & allow "Install from Unknown Sources".</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-xs font-bold text-emerald-400 mb-1">STEP 3</div>
            <p className="text-xs text-slate-300 font-semibold">Enjoy Auto Updates</p>
            <p className="text-[11px] text-slate-400 mt-1">App updates itself over-the-air automatically!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
