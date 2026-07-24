// FR8X-CON Reverse Auction – Live Bidding Page — Spec Page 9 (Ultra-compact multi-modal engine)
// Dynamically adjusts table headers, unit charges, and rate inputs according to active auction mode & Incoterm

"use client";

import { useState, use, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Trash2, Trophy, Loader2 } from "lucide-react";
import { FREIGHT_CURRENCIES } from "@/lib/types/currency";
import { COLLECTIONS } from "@/lib/utils/constants";
import { getDocument } from "@/lib/firebase/firestore";
import type { Auction } from "@/lib/types/auction";

type DynamicRow = {
  id: string;
  numUnits: number;
  equipmentOrUnit: string;
  sizeOrType: string;
  commodityOrCategory: string;
  cargoClass: string;
  freightRate: number;
  freeTimeDays: number;
  transitDays: number;
  etd: string;
  eta: string;
  serviceType: string;
  remarks: string;
};

type LocalRow = {
  id: string;
  numUnits: number;
  chargesHead: string;
  sizeOrType: string;
  cargoClass: string;
  currency: string;
  amount: number;
};

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

  const [auction, setAuction] = useState<Auction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch auction mode & Incoterms details
  useEffect(() => {
    async function fetchAuction() {
      setIsLoading(true);
      try {
        const data = await getDocument<Auction>(COLLECTIONS.AUCTIONS, resolvedParams.auctionId);
        if (data) {
          setAuction(data);
        }
      } catch (err) {
        console.error("Error fetching auction for live bidding:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuction();
  }, [resolvedParams.auctionId]);

  const mode = auction?.shipmentDetails?.mode || "fcl";
  const incoterm = auction?.shipmentDetails?.incoTerms || "FOB";

  const [chargeRows, setChargeRows] = useState<DynamicRow[]>([
    {
      id: "r1",
      numUnits: 5,
      equipmentOrUnit: "20' Standard Container",
      sizeOrType: "20' Standard",
      commodityOrCategory: "General Cargo",
      cargoClass: "GEN",
      freightRate: 1200,
      freeTimeDays: 7,
      transitDays: 21,
      etd: "2026-08-01",
      eta: "2026-08-22",
      serviceType: "Direct Line",
      remarks: "Space Guaranteed",
    },
  ]);

  const [localRows, setLocalRows] = useState<LocalRow[]>([
    { id: "l1", numUnits: 5, chargesHead: "Terminal Handling Charges - Origin", sizeOrType: "Standard", cargoClass: "GEN", currency: "INR", amount: 8500 },
    { id: "l2", numUnits: 1, chargesHead: "Documentation & Bill of Lading Fee", sizeOrType: "Standard", cargoClass: "GEN", currency: "INR", amount: 3500 },
  ]);

  const [paymentTerms, setPaymentTerms] = useState("30 Days");
  const [rateValidity, setRateValidity] = useState("14 Days");
  const [remarks, setRemarks] = useState("");
  const [quoteIn, setQuoteIn] = useState("USD");
  const [biddingDecrement, setBiddingDecrement] = useState("Percentage");
  const [decrementPct, setDecrementPct] = useState("1%");

  const updateChargeRow = useCallback((id: string, field: keyof DynamicRow, rawVal: string) => {
    setChargeRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const numericFields = ["numUnits", "freightRate", "freeTimeDays", "transitDays"] as const;
      const val = numericFields.includes(field as typeof numericFields[number])
        ? (parseFloat(rawVal) || 0)
        : rawVal;
      return { ...r, [field]: val };
    }));
  }, []);

  const updateLocalRow = useCallback((id: string, field: keyof LocalRow, rawVal: string) => {
    setLocalRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const numericFields = ["numUnits", "amount"] as const;
      const val = numericFields.includes(field as typeof numericFields[number])
        ? (parseFloat(rawVal) || 0)
        : rawVal;
      return { ...r, [field]: val };
    }));
  }, []);

  const addChargeRow = useCallback(() => {
    setChargeRows((prev) => [...prev, {
      id: `r${Date.now()}`,
      numUnits: 1,
      equipmentOrUnit: `${mode.toUpperCase()} Load Unit`,
      sizeOrType: "Standard",
      commodityOrCategory: "General Cargo",
      cargoClass: "GEN",
      freightRate: 0,
      freeTimeDays: 7,
      transitDays: 14,
      etd: "",
      eta: "",
      serviceType: "Direct",
      remarks: "",
    }]);
  }, [mode]);

  const addLocalRow = useCallback(() => {
    setLocalRows((prev) => [...prev, {
      id: `l${Date.now()}`,
      numUnits: 1,
      chargesHead: "Local Surcharge",
      sizeOrType: "Standard",
      cargoClass: "GEN",
      currency: quoteIn,
      amount: 0,
    }]);
  }, [quoteIn]);

  const removeChargeRow = useCallback((id: string) => {
    setChargeRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const removeLocalRow = useCallback((id: string) => {
    setLocalRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Compute live total amounts
  const totalFreightUSD = chargeRows.reduce((sum, r) => sum + (r.freightRate * r.numUnits), 0);
  const totalLocalsUSD = localRows.reduce((sum, r) => {
    const amt = r.currency === "INR" ? r.amount / 83 : r.amount;
    return sum + (amt * r.numUnits);
  }, 0);
  const grandTotalUSD = totalFreightUSD + totalLocalsUSD;
  const grandTotalINR = grandTotalUSD * 83;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
        <span className="text-body-sm text-foreground-muted">Loading live bidding engine...</span>
      </div>
    );
  }

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
        <span className="text-[11px] font-semibold">Live Bidding Engine</span>
        <span className="mx-2 text-white/60">|</span>
        <span className="text-[11px]">Mode: {mode.toUpperCase()} ({incoterm}) – Reverse Auction</span>
      </div>

      {/* Metadata & Live Ranking Status Overview */}
      <div className="fr8x-card">
        <div className="grid grid-cols-5 gap-0 divide-x divide-border">
          {/* Col 1 */}
          <div className="p-2 space-y-0.5">
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Auction Title:</span> {auction?.title || "Multi-Modal Auction"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Auction ID:</span> {resolvedParams.auctionId}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Currency:</span> {quoteIn}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Shipment Mode:</span> {mode.toUpperCase()}</p>
          </div>
          {/* Col 2 */}
          <div className="p-2 space-y-0.5">
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Incoterm:</span> {incoterm}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Units:</span> {auction?.containerDetails?.map(c => `${c.numberOfContainers}× ${c.containerSize}`).join(", ") || "1 Lot"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Commodity:</span> {auction?.commodityDetails?.[0]?.description || "General Cargo"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Validity:</span> {rateValidity}</p>
          </div>
          {/* Col 3 */}
          <div className="p-2 space-y-0.5">
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Origin:</span> {auction?.shipmentDetails?.origin || "POL"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Destination:</span> {auction?.shipmentDetails?.destination || "POD"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Cargo Ready:</span> {auction?.shipmentDetails?.cargoReadyDate || "Prompt"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-medium text-[var(--fr8x-jet)]">Service:</span> {auction?.shipmentDetails?.serviceType || "Direct"}</p>
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
              <p className="text-base font-bold text-[var(--fr8x-jet)]">${grandTotalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold text-foreground-secondary uppercase">YOUR TOTAL (in INR)</p>
              <p className="text-sm font-semibold text-[var(--fr8x-jet)]">₹{grandTotalINR.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 1. MODE FREIGHT CHARGES TABLE ═══ */}
      <div className="fr8x-card overflow-hidden">
        <div className="fr8x-section-bar flex items-center justify-between px-2 py-0.5">
          <span>1. MAIN CARRIAGE FREIGHT CHARGES ({mode.toUpperCase()})</span>
          <button onClick={addChargeRow} className="flex items-center gap-0.5 text-[10px] text-[var(--fr8x-periwinkle)] font-medium hover:underline">
            <Plus className="h-3 w-3" /> [+] Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-[#FAFAF9]">
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Qty / Units</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Equipment / Unit</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Spec / Size</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Commodity</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Type [GEN/HAZ/OOG]</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Freight Rate ({quoteIn})</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Free Time (Days)</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Transit (Days)</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">ETD</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">ETA</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Service</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Remarks</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {chargeRows.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--fr8x-mist)] border-b border-border last:border-0">
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.numUnits} onChange={(v) => updateChargeRow(row.id, "numUnits", v)} min="1" className="w-12" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.equipmentOrUnit} onChange={(v) => updateChargeRow(row.id, "equipmentOrUnit", v)} className="w-28" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.sizeOrType} onChange={(v) => updateChargeRow(row.id, "sizeOrType", v)} className="w-28" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.commodityOrCategory} onChange={(v) => updateChargeRow(row.id, "commodityOrCategory", v)} className="w-24" /></td>
                  <td className="px-1.5 py-0.5"><CellSelect value={row.cargoClass} onChange={(v) => updateChargeRow(row.id, "cargoClass", v)} options={["GEN", "HAZ", "OOG", "IG"]} className="w-16" /></td>
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.freightRate} onChange={(v) => updateChargeRow(row.id, "freightRate", v)} className="w-20 font-semibold" /></td>
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.freeTimeDays} onChange={(v) => updateChargeRow(row.id, "freeTimeDays", v)} min="0" className="w-12" /></td>
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.transitDays} onChange={(v) => updateChargeRow(row.id, "transitDays", v)} min="0" className="w-12" /></td>
                  <td className="px-1.5 py-0.5"><CellInput type="date" value={row.etd} onChange={(v) => updateChargeRow(row.id, "etd", v)} className="w-28" /></td>
                  <td className="px-1.5 py-0.5"><CellInput type="date" value={row.eta} onChange={(v) => updateChargeRow(row.id, "eta", v)} className="w-28" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.serviceType} onChange={(v) => updateChargeRow(row.id, "serviceType", v)} className="w-20" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.remarks} onChange={(v) => updateChargeRow(row.id, "remarks", v)} className="w-28" /></td>
                  <td className="px-1.5 py-0.5">
                    {chargeRows.length > 1 && (
                      <button onClick={() => removeChargeRow(row.id)} className="text-foreground-muted hover:text-danger transition-colors">
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

      {/* ═══ 2. LOCAL & DESTINATION CHARGES TABLE ═══ */}
      <div className="fr8x-card overflow-hidden">
        <div className="fr8x-section-bar flex items-center justify-between px-2 py-0.5">
          <span>2. LOCAL & HANDLING CHARGES (MANDATORY ACCORDING TO {incoterm})</span>
          <button onClick={addLocalRow} className="flex items-center gap-0.5 text-[10px] text-[var(--fr8x-periwinkle)] font-medium hover:underline">
            <Plus className="h-3 w-3" /> [+] Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-[#FAFAF9]">
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Qty / Units</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Charges Head</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Spec / Size</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Type</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Currency</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Amount</th>
                <th className="px-1.5 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {localRows.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--fr8x-mist)] border-b border-border last:border-0">
                  <td className="px-1.5 py-0.5"><CellInput type="number" value={row.numUnits} onChange={(v) => updateLocalRow(row.id, "numUnits", v)} min="1" className="w-12" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.chargesHead} onChange={(v) => updateLocalRow(row.id, "chargesHead", v)} className="w-44" /></td>
                  <td className="px-1.5 py-0.5"><CellInput value={row.sizeOrType} onChange={(v) => updateLocalRow(row.id, "sizeOrType", v)} className="w-28" /></td>
                  <td className="px-1.5 py-0.5"><CellSelect value={row.cargoClass} onChange={(v) => updateLocalRow(row.id, "cargoClass", v)} options={["GEN", "HAZ", "OOG", "IG"]} className="w-16" /></td>
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
        <div className="fr8x-section-bar">3. COMMERCIAL TERMS & BIDDER REMARKS</div>
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
            <label className="fr8x-label block mb-0.5">Remarks / Guarantees</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="fr8x-input min-h-[40px] resize-none" placeholder="Enter transit guarantee or free time notes..." />
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
