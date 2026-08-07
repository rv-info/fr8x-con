// FR8X-CON Rate Detail Slide Panel — Right-side drawer
// Opens on rate row click, closes on Escape or outside click
// Dark theme: #252B33 panel, #2A3038 data sections

"use client";

import { useEffect, useRef } from "react";
import { X, Copy, Clock, Ship, MapPin, ArrowRight, FileText, Tag } from "lucide-react";

type RateData = {
  id: string;
  seq: string;
  carrier: string;
  por: string;
  pol: string;
  pod: string;
  fpod: string;
  rate20dv: number;
  type20dv: string;
  rate40hc: number;
  type40hc: string;
  ft: string;
  validityDate: string;
  rateType: string;
  tt: string;
  routing: string;
  remarks: string;
  status: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  createdBy: string;
  serviceProvider?: string;
  isEdited?: boolean;
};

interface RateDetailPanelProps {
  rate: RateData | null;
  onClose: () => void;
}

function DetailRow({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-[#333B44] last:border-0">
      {icon && <span className="text-[#94A3B8] mt-0.5 shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">{label}</span>
        <span className="text-[12px] text-[#E2E8F0] block break-words">{value || "—"}</span>
      </div>
    </div>
  );
}

export function RateDetailPanel({ rate, onClose }: RateDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (rate) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [rate, onClose]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (rate) {
      // Delay to avoid immediate close from the triggering click
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [rate, onClose]);

  if (!rate) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const handleCopy = () => {
    const text = `SEQ: ${rate.seq}
SERVICE PROVIDER: ${rate.serviceProvider || ""}
CARRIER: ${rate.carrier}
POR: ${rate.por}
POL: ${rate.pol}
POD: ${rate.pod}
FPOD: ${rate.fpod}
O/F: USD ${rate.rate20dv}/20DV & USD ${rate.rate40hc}/40HC
F/T: ${rate.ft}
VALIDITY: ${formatDate(rate.validityDate)}
TT: ${rate.tt}
ROUTING: ${rate.routing}
REMARKS: ${rate.remarks}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#1E2329]/60 z-40" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-[380px] max-w-[90vw] bg-[#252B33] border-l border-[#333B44] z-50 shadow-2xl flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333B44] bg-[#20252B] shrink-0">
          <div>
            <h3 className="text-[13px] text-[#E2E8F0]">Rate Details</h3>
            <p className="text-[10px] text-[#94A3B8]">{rate.seq}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-[3px] text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#2A3038] transition-colors"
              title="Copy rate details"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[3px] text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#2A3038] transition-colors"
              title="Close (Esc)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-[3px] border ${
              rate.status === "active"
                ? "bg-[rgba(14,165,233,0.15)] text-[#7DD3FC] border-[rgba(14,165,233,0.3)]"
                : "bg-[rgba(239,68,68,0.15)] text-[#FCA5A5] border-[rgba(239,68,68,0.3)]"
            }`}>
              {rate.status?.toUpperCase()}
            </span>
            {rate.isEdited && (
              <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-[rgba(234,179,8,0.15)] text-[#FDE68A] border border-[rgba(234,179,8,0.3)]">
                EDITED
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-[#2A3038] text-[#94A3B8] border border-[#333B44]">
              {rate.rateType}
            </span>
          </div>

          {/* Route Section */}
          <div className="bg-[#2A3038] rounded-[3px] border border-[#333B44] p-3">
            <h4 className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Ship className="h-3 w-3" /> Route Information
            </h4>
            <div className="space-y-0">
              <DetailRow label="Carrier" value={rate.carrier} />
              <DetailRow label="Place of Receipt (POR)" value={rate.por} icon={<MapPin className="h-3 w-3" />} />
              <DetailRow label="Port of Loading (POL)" value={rate.pol} icon={<MapPin className="h-3 w-3" />} />
              <div className="flex justify-center py-1">
                <ArrowRight className="h-3 w-3 text-[#0EA5E9]" />
              </div>
              <DetailRow label="Port of Discharge (POD)" value={rate.pod} icon={<MapPin className="h-3 w-3" />} />
              <DetailRow label="Final Destination (FPOD)" value={rate.fpod} icon={<MapPin className="h-3 w-3" />} />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-[#2A3038] rounded-[3px] border border-[#333B44] p-3">
            <h4 className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="h-3 w-3" /> Pricing
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#252B33] rounded-[3px] border border-[#333B44] p-2 text-center">
                <span className="text-[10px] text-[#94A3B8] block">20&apos; DV</span>
                <span className="text-[14px] text-[#0EA5E9] block">USD {rate.rate20dv}</span>
                <span className="text-[9px] text-[#94A3B8] block">{rate.type20dv}</span>
              </div>
              <div className="bg-[#252B33] rounded-[3px] border border-[#333B44] p-2 text-center">
                <span className="text-[10px] text-[#94A3B8] block">40&apos; HC</span>
                <span className="text-[14px] text-[#0EA5E9] block">USD {rate.rate40hc}</span>
                <span className="text-[9px] text-[#94A3B8] block">{rate.type40hc}</span>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-[#2A3038] rounded-[3px] border border-[#333B44] p-3">
            <h4 className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Shipment Details
            </h4>
            <DetailRow label="Free Time" value={rate.ft} />
            <DetailRow label="Validity" value={formatDate(rate.validityDate)} />
            <DetailRow label="Transit Time" value={rate.tt} />
            <DetailRow label="Routing" value={rate.routing} />
          </div>

          {/* Additional Info */}
          <div className="bg-[#2A3038] rounded-[3px] border border-[#333B44] p-3">
            <h4 className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Additional Info
            </h4>
            <DetailRow label="Service Provider" value={rate.serviceProvider || "—"} />
            <DetailRow label="Remarks" value={rate.remarks} />
            <DetailRow label="Sequence" value={rate.seq} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#333B44] bg-[#20252B] shrink-0">
          <p className="text-[9px] text-[#94A3B8] text-center">
            Press <kbd className="px-1 py-0.5 bg-[#2A3038] border border-[#333B44] rounded-[2px] text-[8px]">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </>
  );
}
