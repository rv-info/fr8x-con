// FR8X-CON Reverse Auction – Live Bidding Page — Spec Page 9 (Ultra-compact)
// Full alignment with locked specification page 9 — tight table rows, dense layout

"use client";

import { useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Trash2, Trophy } from "lucide-react";
import { FREIGHT_CURRENCIES } from "@/lib/types/currency";

// ─── Types ───
type ContainerRow = {
  id: string;
  numContainers: number;
  container: string;
  size: string;
  commodity: string;
  type: string;
  oceanFreight: number;
  freeTime: number;
  transit: number;
  etd: string;
  eta: string;
  service: string;
  remarks: string;
};

type LocalRow = {
  id: string;
  numContainers: number;
  chargesHead: string;
  size: string;
  type: string;
  currency: string;
  amount: number;
};

const CONTAINER_SIZE_OPTIONS = ["20' Standard", "40' Standard", "40' HC", "OT", "RF", "FR"];
const CARGO_TYPE_OPTIONS = ["GEN", "HAZ", "OOG", "IG"];

// Inline cell input — compact, no extra chrome
function CellInput({ value, onChange, type = "text", className = "", min }: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  min?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border border-border rounded px-1 py-0.5 text-[10px] text-[var(--fr8x-jet)] bg-white focus:border-[var(--fr8x-periwinkle)] focus:outline-none focus:ring-0 ${className}`}
    />
  );
}

function CellSelect({ value, onChange, options, className = "" }: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border border-border rounded px-1 py-0.5 text-[10px] text-[var(--fr8x-jet)] bg-white focus:border-[var(--fr8x-periwinkle)] focus:outline-none focus:ring-0 ${className}`}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function LiveBiddingPage({ params }: { params: Promise<{ auctionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [containerRows, setContainerRows] = useState<ContainerRow[]>([
    { id: "c1", numContainers: 5, container: "20ft Standard", size: "20' Standard", commodity: "General Cargo", type: "GEN", oceanFreight: 1200, freeTime: 7, transit: 21, etd: "2026-08-01", eta: "2026-08-22", service: "Direct", remarks: "Prompt loading" },
  ]);

  const [localRows, setLocalRows] = useState<LocalRow[]>([
    { id: "l1", numContainers: 5, chargesHead: "Terminal Handling Charges (Origin)", size: "20' Standard", type: "GEN", currency: "INR", amount: 8500 },
    { id: "l2", numContainers: 1, chargesHead: "Documentation Fee",                 size: "20' Standard", type: "GEN", currency: "INR", amount: 3500 },
  ]);

  const [paymentTerms,     setPaymentTerms]     = useState("30 Days");
  const [rateValidity,     setRateValidity]      = useState("14 Days");
  const [remarks,          setRemarks]           = useState("");
  const [quoteIn,          setQuoteIn]           = useState("USD");
  const [biddingDecrement, setBiddingDecrement]  = useState("Percentage");
  const [decrementPct,     setDecrementPct]      = useState("1%");

  const updateContainerRow = useCallback((id: string, field: keyof ContainerRow, rawVal: string) => {
    setContainerRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const numericFields = ["numContainers", "oceanFreight", "freeTime", "transit"] as const;
      const val = numericFields.includes(field as typeof numericFields[number])
        ? (parseFloat(rawVal) || 0)
        : rawVal;
      return { ...r, [field]: val };
    }));
  }, []);

  const updateLocalRow = useCallback((id: string, field: keyof LocalRow, rawVal: string) => {
    setLocalRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const numericFields = ["numContainers", "amount"] as const;
      const val = numericFields.includes(field as typeof numericFields[number])
        ? (parseFloat(rawVal) || 0)
        : rawVal;
      return { ...r, [field]: val };
    }));
  }, []);

  const addContainerRow = useCallback(() => {
    setContainerRows((prev) => [...prev, {
      id: `c${Date.now()}`, numContainers: 1, container: "20ft Standard", size: "20' Standard",
      commodity: "General Cargo", type: "GEN", oceanFreight: 0, freeTime: 7,
      transit: 14, etd: "", eta: "", service: "Direct", remarks: "",
    }]);
  }, []);

  const addLocalRow = useCallback(() => {
    setLocalRows((prev) => [...prev, {
      id: `l${Date.now()}`, numContainers: 1, chargesHead: "", size: "20' Standard",
      type: "GEN", currency: quoteIn, amount: 0,
    }]);
  }, [quoteIn]);

  const removeContainerRow = useCallback((id: string) => {
    setContainerRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const removeLocalRow = useCallback((id: string) => {
    setLocalRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <div className="min-h-0 space-y-2">
      {/* Navigation */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-0.5 text-[10px] text-foreground-secondary hover:text-[var(--fr8x-jet)] transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Back to Auction
      </button>

      {/* Title Banner — matches spec page 9 header bar */}
      <div className="bg-[var(--fr8x-periwinkle)] text-white text-center py-1.5 rounded">
        <span className="text-[11px] font-semibold">Live Bidding</span>
        <span className="mx-2 text-white/60">|</span>
        <span className="text-[11px]">Reverse Auction – Live Bidding</span>
      </div>

      {/* Metadata & Status Row */}
      <div className="fr8x-card">
        <div className="grid grid-cols-5 gap-0 divide-x divide-border">
          {/* Col 1 */}
          <div className="p-2 space-y-0.5">
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Auction Title:</span> Nhava Sheva to Rotterdam FCL</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Auction ID:</span> {resolvedParams.auctionId}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Auction Currency:</span> USD</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Shipment Type:</span> FCL</p>
          </div>
          {/* Col 2 */}
          <div className="p-2 space-y-0.5">
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Service Type:</span> FCL</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Containers:</span> 5 × 20&apos; Standard</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Commodity:</span> General Cargo</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Validity:</span> 14 Days</p>
          </div>
          {/* Col 3 */}
          <div className="p-2 space-y-0.5">
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">POL:</span> FOB</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">POD:</span> POD</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">FPOD:</span> FOB</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Incoterm:</span> FHOB</p>
          </div>
          {/* Col 4 — LIVE RANKING */}
          <div className="p-2 flex flex-col items-center justify-center text-center bg-[var(--fr8x-mist)]">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-[var(--fr8x-periwinkle)]">
              <Trophy className="h-3 w-3" /> LIVE RANKING
            </div>
            <p className="text-[9px] text-foreground-secondary mt-0.5">YOUR CURRENT RANK</p>
            <p className="text-4xl font-bold text-[var(--fr8x-jet)] leading-none my-1">1</p>
            <p className="text-[9px] text-foreground-muted">Out of 5 — 04 Bids Submitted</p>
          </div>
          {/* Col 5 — YOUR TOTAL */}
          <div className="p-2 flex flex-col justify-center bg-[var(--fr8x-mist)] space-y-1">
            <div>
              <p className="text-[9px] font-semibold text-foreground-secondary uppercase">YOUR TOTAL (in USD)</p>
              <p className="text-base font-bold text-[var(--fr8x-jet)]">$6,100.00</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold text-foreground-secondary uppercase">YOUR TOTAL (in INR)</p>
              <p className="text-sm font-semibold text-[var(--fr8x-jet)]">₹5,06,300.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 1. CONTAINERWISE CHARGES ═══ */}
      <div className="fr8x-card overflow-hidden">
        <div className="fr8x-section-bar flex items-center justify-between px-2 py-0.5">
          <span>1. CONTAINERWISE CHARGES</span>
          <button onClick={addContainerRow} className="flex items-center gap-0.5 text-[10px] text-[var(--fr8x-periwinkle)] font-medium hover:underline">
            <Plus className="h-3 w-3" /> [+] Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-[#FAFAF9]">
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">No. of Containers</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Container</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Size [20&apos;, 40&apos;, OT, RF, FR]</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Commodity</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">TYPE [GEN, HAZ, OOG, IG]</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Ocean Freight</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Free Time</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Transit</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">ETD</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">ETA</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Service</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Remarks</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {containerRows.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--fr8x-mist)] border-b border-border last:border-0">
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.numContainers} onChange={(v) => updateContainerRow(row.id, "numContainers", v)} min="1" className="w-12" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.container} onChange={(v) => updateContainerRow(row.id, "container", v)} className="w-28" /></td>
                  <td className="px-1.5 py-0.5"><CellSelect value={row.size} onChange={(v) => updateContainerRow(row.id, "size", v)} options={CONTAINER_SIZE_OPTIONS} className="w-28" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.commodity} onChange={(v) => updateContainerRow(row.id, "commodity", v)} className="w-24" /></td>
                  <td className="px-1.5 py-0.5"><CellSelect value={row.type} onChange={(v) => updateContainerRow(row.id, "type", v)} options={CARGO_TYPE_OPTIONS} className="w-16" /></td>
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.oceanFreight} onChange={(v) => updateContainerRow(row.id, "oceanFreight", v)} className="w-20" /></td>
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.freeTime} onChange={(v) => updateContainerRow(row.id, "freeTime", v)} min="0" className="w-12" /></td>
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.transit} onChange={(v) => updateContainerRow(row.id, "transit", v)} min="0" className="w-12" /></td>
                  <td className="px-1.5 py-0.5"><CellInput type="date" value={row.etd} onChange={(v) => updateContainerRow(row.id, "etd", v)} className="w-28" /></td>
                  <td className="px-1.5 py-0.5"><CellInput type="date" value={row.eta} onChange={(v) => updateContainerRow(row.id, "eta", v)} className="w-28" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.service} onChange={(v) => updateContainerRow(row.id, "service", v)} className="w-20" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.remarks} onChange={(v) => updateContainerRow(row.id, "remarks", v)} className="w-28" /></td>
                  <td className="px-1.5 py-0.5">
                    {containerRows.length > 1 && (
                      <button onClick={() => removeContainerRow(row.id)} className="text-foreground-muted hover:text-danger transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 2. [LOCAL] CHARGES ═══ */}
      <div className="fr8x-card overflow-hidden">
        <div className="fr8x-section-bar flex items-center justify-between px-2 py-0.5">
          <span>2. [LOCAL] CHARGES</span>
          <button onClick={addLocalRow} className="flex items-center gap-0.5 text-[10px] text-[var(--fr8x-periwinkle)] font-medium hover:underline">
            <Plus className="h-3 w-3" /> [+] Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-[#FAFAF9]">
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">No. of Containers</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Charges Head</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Container Size [20&apos;, 40&apos;, OT, RF, FR]</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">TYPE [GEN, HAZ, OOG, IG]</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Currency</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Amount</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {localRows.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--fr8x-mist)] border-b border-border last:border-0">
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.numContainers} onChange={(v) => updateLocalRow(row.id, "numContainers", v)} min="1" className="w-12" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.chargesHead} onChange={(v) => updateLocalRow(row.id, "chargesHead", v)} className="w-44" /></td>
                  <td className="px-1.5 py-0.5"><CellSelect value={row.size} onChange={(v) => updateLocalRow(row.id, "size", v)} options={CONTAINER_SIZE_OPTIONS} className="w-28" /></td>
                  <td className="px-1.5 py-0.5"><CellSelect value={row.type} onChange={(v) => updateLocalRow(row.id, "type", v)} options={CARGO_TYPE_OPTIONS} className="w-16" /></td>
                  <td className="px-1.5 py-0.5">
                    <select value={row.currency} onChange={(e) => updateLocalRow(row.id, "currency", e.target.value)}
                      className="w-16 border border-border rounded px-1 py-0.5 text-[10px] bg-white focus:border-[var(--fr8x-periwinkle)] focus:outline-none">
                      {FREIGHT_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.amount} onChange={(v) => updateLocalRow(row.id, "amount", v)} className="w-24" /></td>
                  <td className="px-1.5 py-0.5">
                    <button onClick={() => removeLocalRow(row.id)} className="text-foreground-muted hover:text-danger transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 3. ADDITIONAL INFORMATION ═══ */}
      <div className="fr8x-card overflow-hidden">
        <div className="fr8x-section-bar">3. ADDITIONAL INFORMATION</div>
        <div className="p-2 grid grid-cols-6 gap-2">
          <div>
            <label className="fr8x-label block mb-0.5">Payment Terms</label>
            <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="fr8x-input" />
          </div>
          <div>
            <label className="fr8x-label block mb-0.5">Rate Validity</label>
            <input type="text" value={rateValidity} onChange={(e) => setRateValidity(e.target.value)} className="fr8x-input" />
          </div>
          <div>
            <label className="fr8x-label block mb-0.5">Quote In</label>
            <select value={quoteIn} onChange={(e) => setQuoteIn(e.target.value)} className="fr8x-input">
              {FREIGHT_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="fr8x-label block mb-0.5">Bidding Decrement</label>
            <select value={biddingDecrement} onChange={(e) => setBiddingDecrement(e.target.value)} className="fr8x-input">
              <option value="Percentage">Percentage</option>
              <option value="Fixed Amount">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="fr8x-label block mb-0.5">Decrement %</label>
            <input type="text" value={decrementPct} onChange={(e) => setDecrementPct(e.target.value)} className="fr8x-input" />
          </div>
          <div className="col-span-2 mt-1">
            <label className="fr8x-label block mb-0.5">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="fr8x-input min-h-[40px] resize-none" placeholder="Any additional notes..." />
          </div>
        </div>
      </div>

      {/* ═══ Footer Actions ═══ */}
      <div className="flex items-center justify-center gap-2 py-1">
        <button className="fr8x-btn-secondary">Save as Draft</button>
        <button className="fr8x-btn-secondary">Edit Bid</button>
        <button className="fr8x-btn-secondary">Preview Bid</button>
        <button className="fr8x-btn-primary bg-[var(--fr8x-periwinkle)] px-4">Submit / Update Bid</button>
      </div>
    </div>
  );
}
