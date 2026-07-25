// FR8X-CON Reverse Auction – Live Bidding Page — Spec Page 9 (Ultra-compact multi-modal engine)
// Dynamically adjusts table headers, unit charges, and rate inputs according to active auction mode & Incoterm
// Lock shipment details as read-only, allowing receivers to quote rates, currency, schedules, free time, carriers, transit time, expected loading, and remarks.

"use client";

import { useState, use, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Trash2, Trophy, Loader2, CheckCircle2, AlertCircle, Landmark } from "lucide-react";
import { FREIGHT_CURRENCIES } from "@/lib/types/currency";
import { COLLECTIONS } from "@/lib/utils/constants";
import { getDocument, setDocument } from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/AuthProvider";
import type { Auction } from "@/lib/types/auction";
import { Button } from "@/components/ui/Button";

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
  carrier: string;
  etd: string;
  eta: string;
  expectedLoading: string;
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

function CellInput({ value, onChange, type = "text", className = "", min, placeholder }: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  min?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border border-border rounded px-1.5 py-0.5 text-[10px] text-[var(--fr8x-jet)] bg-white focus:border-[var(--fr8x-periwinkle)] focus:outline-none focus:ring-0 ${className}`}
    />
  );
}

export default function LiveBiddingPage({ params }: { params: Promise<{ auctionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form inputs states
  const [chargeRows, setChargeRows] = useState<DynamicRow[]>([]);
  const [localRows, setLocalRows] = useState<LocalRow[]>([]);
  const [paymentTerms, setPaymentTerms] = useState("30 Days");
  const [rateValidity, setRateValidity] = useState("14 Days");
  const [remarks, setRemarks] = useState("");
  const [quoteIn, setQuoteIn] = useState("USD");
  const [biddingDecrement, setBiddingDecrement] = useState("Percentage");
  const [decrementPct, setDecrementPct] = useState("1%");

  // Submit Feedback
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch auction details
  useEffect(() => {
    async function fetchAuction() {
      setIsLoading(true);
      try {
        const data = await getDocument<Auction>(COLLECTIONS.AUCTIONS, resolvedParams.auctionId);
        if (data) {
          setAuction(data);
          
          // Pre-populate Payment Terms & Currency if present
          if (data.bidRules?.defaultCurrency) {
            setQuoteIn(data.bidRules.defaultCurrency);
          }
        }
      } catch (err) {
        console.error("Error fetching auction for live bidding:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuction();
  }, [resolvedParams.auctionId]);

  // Synchronize charge rows from fixed auction shipment details
  useEffect(() => {
    if (auction) {
      const modeUpper = (auction.shipmentDetails?.mode || "FCL").toUpperCase();
      const defaultRows: DynamicRow[] = (auction.containerDetails || []).map((c, index) => {
        const commodity = auction.commodityDetails?.[index] || auction.commodityDetails?.[0];
        return {
          id: c.id || `r_${index}`,
          numUnits: c.numberOfContainers || 1,
          equipmentOrUnit: c.containerSize || `${modeUpper} Equipment`,
          sizeOrType: c.containerSize || "Standard",
          commodityOrCategory: commodity?.description || "General Cargo",
          cargoClass: c.hazStatus === "haz" ? "HAZ" : "GEN",
          freightRate: 0,
          freeTimeDays: 7,
          transitDays: 14,
          carrier: "",
          etd: "",
          eta: "",
          expectedLoading: "",
          serviceType: "Direct",
          remarks: "",
        };
      });
      setChargeRows(defaultRows);

      // Populate local charge rows based on mandatory charge heads configuration from the auction
      const defaultLocals: LocalRow[] = (auction.chargesStructure?.chargesHeads || [])
        .filter(h => h.type !== "freight")
        .map((h, index) => ({
          id: h.id || `l_${index}`,
          numUnits: 1,
          chargesHead: h.name || "Local Surcharge",
          sizeOrType: "Standard",
          cargoClass: "GEN",
          currency: auction.bidRules?.defaultCurrency || "USD",
          amount: 0,
        }));
      setLocalRows(defaultLocals);
    }
  }, [auction]);

  const mode = auction?.shipmentDetails?.mode || "fcl";
  const incoterm = auction?.shipmentDetails?.incoTerms || "FOB";

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

  const addLocalRow = useCallback(() => {
    setLocalRows((prev) => [...prev, {
      id: `l_${Date.now()}`,
      numUnits: 1,
      chargesHead: "Extra / Special Surcharge",
      sizeOrType: "Standard",
      cargoClass: "GEN",
      currency: quoteIn,
      amount: 0,
    }]);
  }, [quoteIn]);

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

  // Handle Bid Submit
  const handleSubmitBid = async (isDraft: boolean = false) => {
    if (!user?.uid) {
      setSubmitMessage({ type: "error", text: "You must be authenticated to submit a bid." });
      return;
    }

    setIsSubmittingBid(true);
    setSubmitMessage(null);

    try {
      const bidId = `${user.uid}_${resolvedParams.auctionId}`;
      const bidPayload = {
        id: bidId,
        auctionId: resolvedParams.auctionId,
        bidderId: user.uid,
        bidderName: user.displayName || "Logistics Bidder",
        bidderEmail: user.email,
        status: isDraft ? "draft" : "submitted",
        quoteCurrency: quoteIn,
        paymentTerms,
        rateValidity,
        biddingDecrement,
        decrementPct,
        remarks,
        freightCharges: chargeRows,
        localCharges: localRows,
        totalAmountUSD: grandTotalUSD,
        totalAmountINR: grandTotalINR,
        submittedAt: new Date().toISOString(),
      };

      // 1. Save bid document to Firestore
      await setDocument(COLLECTIONS.BIDS, bidId, bidPayload);

      if (!isDraft) {
        // 2. Increment bids count on active auction
        const currentBidsCount = auction?.bidsCount || 0;
        await setDocument(
          COLLECTIONS.AUCTIONS,
          resolvedParams.auctionId,
          {
            bidsCount: currentBidsCount + 1,
          },
          true
        );
      }

      setSubmitMessage({
        type: "success",
        text: isDraft ? "Bid saved as draft successfully!" : "Your competitive freight bid has been successfully submitted!"
      });

      setTimeout(() => {
        router.push(`/auctions/${resolvedParams.auctionId}`);
      }, 2000);
    } catch (err) {
      console.error("Error submitting bid:", err);
      setSubmitMessage({ type: "error", text: "Failed to post bid. Please try again." });
    } finally {
      setIsSubmittingBid(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--fr8x-periwinkle)]" />
        <span className="text-body-sm text-foreground-muted">Loading live bidding engine...</span>
      </div>
    );
  }

  return (
    <div className="min-h-0 space-y-3">
      {/* Navigation */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-0.5 text-[10px] text-foreground-secondary hover:text-[var(--fr8x-jet)] transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Back to Auction
      </button>

      {/* Title Banner — matches spec page 9 header bar */}
      <div className="bg-[var(--fr8x-periwinkle)] text-white text-center py-1.5 rounded flex items-center justify-center gap-2">
        <Landmark className="h-4 w-4 shrink-0" />
        <span className="text-[11px] font-semibold">10-Years Advance Reverse Auction Bidding Deck</span>
        <span className="text-white/60">|</span>
        <span className="text-[11px] uppercase">Mode: {mode.toUpperCase()} ({incoterm})</span>
      </div>

      {/* Notifications */}
      {submitMessage && (
        <div className={`p-3 rounded border text-body-sm flex items-center gap-2 ${
          submitMessage.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {submitMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{submitMessage.text}</span>
        </div>
      )}

      {/* Metadata & Live Ranking Status Overview */}
      <div className="fr8x-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Col 1 */}
          <div className="p-2.5 space-y-1">
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Auction Title:</span> {auction?.title || "Multi-Modal Auction"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Ref No:</span> {auction?.referenceNumber || "—"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Quote Currency:</span> {quoteIn}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Shipment Mode:</span> <span className="uppercase font-bold text-[var(--fr8x-periwinkle)]">{mode.toUpperCase()}</span></p>
          </div>
          {/* Col 2 */}
          <div className="p-2.5 space-y-1">
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Incoterm:</span> <span className="font-semibold text-brand-700">{incoterm}</span></p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Units Required:</span> {auction?.containerDetails?.map(c => `${c.numberOfContainers}× ${c.containerSize}`).join(", ") || "1 Lot"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Commodity Description:</span> {auction?.commodityDetails?.[0]?.description || "General Cargo"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Required Delivery:</span> {auction?.shipmentDetails?.requiredDeliveryDate || "—"}</p>
          </div>
          {/* Col 3 */}
          <div className="p-2.5 space-y-1">
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Origin Point:</span> {auction?.shipmentDetails?.origin || "POL"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Destination Point:</span> {auction?.shipmentDetails?.destination || "POD"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Cargo Ready Date:</span> {auction?.shipmentDetails?.cargoReadyDate || "Prompt"}</p>
            <p className="text-[10px] text-foreground-secondary"><span className="font-semibold text-[var(--fr8x-jet)]">Service Speed:</span> {auction?.shipmentDetails?.serviceType || "Standard"}</p>
          </div>
          {/* Col 4 — LIVE RANKING */}
          <div className="p-2.5 flex flex-col items-center justify-center text-center bg-[var(--fr8x-mist)]">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--fr8x-periwinkle)]">
              <Trophy className="h-3.5 w-3.5" /> LIVE RANKING
            </div>
            <p className="text-[9px] text-foreground-secondary mt-0.5">YOUR CURRENT RANK</p>
            <p className="text-4xl font-black text-[var(--fr8x-jet)] leading-none my-1">1</p>
            <p className="text-[9px] text-foreground-muted">Out of {auction?.participantsCount || 1} bidders — {auction?.bidsCount || 0} total bids</p>
          </div>
          {/* Col 5 — YOUR TOTAL */}
          <div className="p-2.5 flex flex-col justify-center bg-[var(--fr8x-mist)] space-y-1">
            <div>
              <p className="text-[9px] font-bold text-foreground-secondary uppercase">YOUR BID TOTAL (USD)</p>
              <p className="text-lg font-black text-[var(--fr8x-jet)] leading-none">${grandTotalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-foreground-secondary uppercase">YOUR BID TOTAL (INR)</p>
              <p className="text-sm font-bold text-[var(--fr8x-jet)]">₹{grandTotalINR.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 1. MODE FREIGHT CHARGES TABLE ═══ */}
      <div className="fr8x-card overflow-hidden">
        <div className="fr8x-section-bar flex items-center justify-between px-2 py-0.5">
          <span>1. MAIN CARRIAGE FREIGHT CHARGES (LOCKED CARGO DETAILS)</span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0 rounded">Verified Cargo Specs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-border">
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Qty / Units</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Equipment / Unit</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Spec / Size</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Commodity</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Cargo Type</th>
                
                {/* Editable bidding heads */}
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-[var(--fr8x-periwinkle)] uppercase whitespace-nowrap bg-blue-50/50">Freight Rate ({quoteIn}) *</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-[var(--fr8x-periwinkle)] uppercase whitespace-nowrap bg-blue-50/50">Free Time (Days) *</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-[var(--fr8x-periwinkle)] uppercase whitespace-nowrap bg-blue-50/50">Transit (Days) *</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-[var(--fr8x-periwinkle)] uppercase whitespace-nowrap bg-blue-50/50">Carrier *</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-[var(--fr8x-periwinkle)] uppercase whitespace-nowrap bg-blue-50/50">ETD *</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-[var(--fr8x-periwinkle)] uppercase whitespace-nowrap bg-blue-50/50">ETA *</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-[var(--fr8x-periwinkle)] uppercase whitespace-nowrap bg-blue-50/50">Expected Loading *</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-[var(--fr8x-periwinkle)] uppercase whitespace-nowrap bg-blue-50/50">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {chargeRows.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--fr8x-mist)] border-b border-border last:border-0">
                  {/* Fixed details */}
                  <td className="px-2 py-1 font-bold text-[10px] text-[var(--fr8x-jet)] whitespace-nowrap">{row.numUnits}</td>
                  <td className="px-2 py-1 text-[10px] text-foreground-secondary whitespace-nowrap">{row.equipmentOrUnit}</td>
                  <td className="px-2 py-1 text-[10px] text-foreground-secondary whitespace-nowrap">{row.sizeOrType}</td>
                  <td className="px-2 py-1 text-[10px] text-foreground-secondary whitespace-nowrap">{row.commodityOrCategory}</td>
                  <td className="px-2 py-1">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      row.cargoClass === "HAZ" ? "bg-red-50 text-red-700 border border-red-200" : "bg-gray-50 text-gray-700 border border-gray-200"
                    }`}>
                      {row.cargoClass}
                    </span>
                  </td>
                  
                  {/* Editable bid inputs */}
                  <td className="px-1.5 py-1 bg-blue-50/20"><CellInput type="number" value={row.freightRate} onChange={(v) => updateChargeRow(row.id, "freightRate", v)} min="0" placeholder="0.00" className="font-bold border-blue-200" /></td>
                  <td className="px-1.5 py-1 bg-blue-50/20"><CellInput type="number" value={row.freeTimeDays} onChange={(v) => updateChargeRow(row.id, "freeTimeDays", v)} min="0" placeholder="7" className="border-blue-200" /></td>
                  <td className="px-1.5 py-1 bg-blue-50/20"><CellInput type="number" value={row.transitDays} onChange={(v) => updateChargeRow(row.id, "transitDays", v)} min="0" placeholder="14" className="border-blue-200" /></td>
                  <td className="px-1.5 py-1 bg-blue-50/20"><CellInput value={row.carrier} onChange={(v) => updateChargeRow(row.id, "carrier", v)} placeholder="e.g. MSK / LFT" className="border-blue-200" /></td>
                  <td className="px-1.5 py-1 bg-blue-50/20"><CellInput type="date" value={row.etd} onChange={(v) => updateChargeRow(row.id, "etd", v)} className="border-blue-200" /></td>
                  <td className="px-1.5 py-1 bg-blue-50/20"><CellInput type="date" value={row.eta} onChange={(v) => updateChargeRow(row.id, "eta", v)} className="border-blue-200" /></td>
                  <td className="px-1.5 py-1 bg-blue-50/20"><CellInput type="date" value={row.expectedLoading} onChange={(v) => updateChargeRow(row.id, "expectedLoading", v)} className="border-blue-200" /></td>
                  <td className="px-1.5 py-1 bg-blue-50/20"><CellInput value={row.remarks} onChange={(v) => updateChargeRow(row.id, "remarks", v)} placeholder="Space guarantees..." className="border-blue-200" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 2. LOCAL & DESTINATION CHARGES TABLE ═══ */}
      <div className="fr8x-card overflow-hidden">
        <div className="fr8x-section-bar flex items-center justify-between px-2 py-0.5">
          <span>2. LOCAL & HANDLING SURCHARGES (ACCORDING TO {incoterm})</span>
          <button onClick={addLocalRow} className="flex items-center gap-0.5 text-[10px] text-[var(--fr8x-periwinkle)] font-medium hover:underline">
            <Plus className="h-3 w-3" /> [+] Add Custom Surcharge
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-border">
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Qty / Units</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Charges Head</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Spec / Size</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Type</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Currency</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase whitespace-nowrap">Amount</th>
                <th className="px-2 py-1 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border w-12"></th>
              </tr>
            </thead>
            <tbody>
              {localRows.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--fr8x-mist)] border-b border-border last:border-0">
                  <td className="px-2 py-0.5"><CellInput type="number" value={row.numUnits} onChange={(v) => updateLocalRow(row.id, "numUnits", v)} min="1" className="w-16" /></td>
                  <td className="px-2 py-0.5"><CellInput value={row.chargesHead} onChange={(v) => updateLocalRow(row.id, "chargesHead", v)} className="w-56" /></td>
                  <td className="px-2 py-0.5"><CellInput value={row.sizeOrType} onChange={(v) => updateLocalRow(row.id, "sizeOrType", v)} className="w-32" /></td>
                  <td className="px-2 py-0.5">
                    <select value={row.cargoClass} onChange={(e) => updateLocalRow(row.id, "cargoClass", e.target.value)}
                      className="w-20 border border-border rounded px-1.5 py-0.5 text-[10px] bg-white focus:border-[var(--fr8x-periwinkle)] focus:outline-none">
                      {["GEN", "HAZ", "OOG", "IG"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-0.5">
                    <select value={row.currency} onChange={(e) => updateLocalRow(row.id, "currency", e.target.value)}
                      className="w-20 border border-border rounded px-1.5 py-0.5 text-[10px] bg-white focus:border-[var(--fr8x-periwinkle)] focus:outline-none">
                      {FREIGHT_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-0.5"><CellInput type="number" value={row.amount} onChange={(v) => updateLocalRow(row.id, "amount", v)} placeholder="0.00" className="w-28 font-semibold" /></td>
                  <td className="px-2 py-0.5 text-center">
                    <button onClick={() => removeLocalRow(row.id)} className="text-foreground-muted hover:text-danger transition-colors p-1" title="Remove local head">
                      <Trash2 className="h-3.5 w-3.5" />
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
        <div className="p-3 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="fr8x-label block mb-1">Payment Terms</label>
            <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="fr8x-input" />
          </div>
          <div>
            <label className="fr8x-label block mb-1">Rate Validity</label>
            <input type="text" value={rateValidity} onChange={(e) => setRateValidity(e.target.value)} className="fr8x-input" />
          </div>
          <div>
            <label className="fr8x-label block mb-1">Quote In (Primary Currency)</label>
            <select value={quoteIn} onChange={(e) => setQuoteIn(e.target.value)} className="fr8x-input font-bold text-[var(--fr8x-jet)]">
              {FREIGHT_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="fr8x-label block mb-1">Bidding Decrement Method</label>
            <select value={biddingDecrement} onChange={(e) => setBiddingDecrement(e.target.value)} className="fr8x-input">
              <option value="Percentage">Percentage</option>
              <option value="Fixed Amount">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="fr8x-label block mb-1">Decrement Step *</label>
            <input type="text" value={decrementPct} onChange={(e) => setDecrementPct(e.target.value)} className="fr8x-input" />
          </div>
          <div className="col-span-1 md:col-span-6">
            <label className="fr8x-label block mb-1">Transit Remarks & Space Guarantees</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className="fr8x-input resize-none" placeholder="Enter carrier booking promises, transhipment terminals or port guarantees..." />
          </div>
        </div>
      </div>

      {/* ═══ Footer Actions ═══ */}
      <div className="flex items-center justify-center gap-2.5 py-3 border-t border-border mt-2">
        <button 
          type="button" 
          onClick={() => handleSubmitBid(true)} 
          disabled={isSubmittingBid} 
          className="fr8x-btn-secondary px-4 py-1.5 text-body-sm"
        >
          Save as Draft
        </button>
        <Button
          onClick={() => handleSubmitBid(false)}
          isLoading={isSubmittingBid}
          loadingText="Submitting Bid..."
          className="fr8x-btn-primary bg-[var(--fr8x-periwinkle)] px-8 py-1.5 text-body-sm"
        >
          Submit Bidding Offer
        </Button>
      </div>
    </div>
  );
}
