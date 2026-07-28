// FR8X-CON Reverse Auctions Portal — Support General & Selective Procurement Models + Booking Draft Generator

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import {
  Plus,
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  Loader2,
  Mail,
  Shield,
  Award,
  CheckCircle2,
  Lock,
} from "lucide-react";

import { ROUTES, COLLECTIONS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { queryDocuments, orderBy, limit } from "@/lib/firebase/firestore";
import type { AuctionStatus } from "@/lib/types/auction";
import { BookingRequestModal, type BookingShipmentData } from "@/components/auctions/BookingRequestModal";

type AuctionData = {
  id: string;
  referenceNumber: string;
  title: string;
  auctionType?: "general" | "selective" | "premium";
  invitedParticipantIds?: string[]; // Selective / Premium privacy filter
  customerName?: string;
  shipmentDetails: {
    mode: string;
    origin: string; // POL
    destination: string; // POD
    placeOfReceipt?: string; // POR
    finalDelivery?: string; // FPOD
    poNumber?: string;
    invoiceNumber?: string;
    validity?: string;
  };
  containerDetails: Array<{
    containerSize: string;
    numberOfContainers: number;
  }>;
  commodityDetails: Array<{
    description: string;
  }>;
  status: AuctionStatus;
  awardStatus?: "unawarded" | "awarded" | "closed";
  bidsCount: number;
  totalRevisionsCount?: number;
  participantsCount: number;
  activeParticipantsCount?: number;
  lowestBidAmount?: number;
  evaluationCurrency?: string;
  endDate: string;
  creatorName: string;
  creatorEmail?: string;
  awardedBidderName?: string;
  awardedBidderEmail?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

const MODEL_TABS = [
  { value: "all", label: "All Procurement" },
  { value: "general", label: "General Reverse Auctions (Open)" },
  { value: "selective", label: "Selective / Premium (Invited Only)" },
] as const;

export default function AuctionsPage() {
  const { user } = useAuth();

  const [activeModelTab, setActiveModelTab] = useState<"all" | "general" | "selective">("all");
  const [activeStatusTab, setActiveStatusTab] = useState<AuctionStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Request Email Draft State
  const [selectedBookingShipment, setSelectedBookingShipment] = useState<BookingShipmentData | null>(null);

  // Fetch auctions from Firestore
  useEffect(() => {
    async function fetchAuctions() {
      setIsLoading(true);
      try {
        const data = await queryDocuments<AuctionData>(COLLECTIONS.AUCTIONS, [
          orderBy("createdAt", "desc"),
          limit(50),
        ]);
        setAuctions(data);
      } catch (err) {
        console.error("Error fetching auctions:", err);
        setAuctions([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuctions();
  }, []);

  // Filter auctions by visibility (General vs Selective) and Status
  const filtered = useMemo(() => {
    return auctions.filter((a) => {
      // Selective Auction Security Filter: Premium/Selective auctions are visible only to invited participants or creator
      const isSelective = a.auctionType === "selective" || a.auctionType === "premium";
      if (isSelective && user) {
        const isCreator = a.creatorName === user.displayName || a.creatorEmail === user.email;
        const isInvited = a.invitedParticipantIds?.includes(user.uid);
        if (!isCreator && !isInvited && !user.isGodMode) {
          return false; // Hide selective auction if not invited
        }
      }

      // Filter by Model Tab
      if (activeModelTab === "general" && isSelective) return false;
      if (activeModelTab === "selective" && !isSelective) return false;

      // Filter by Status Tab
      if (activeStatusTab !== "all" && a.status !== activeStatusTab) return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (a.title || "").toLowerCase().includes(q);
        const matchRef = (a.referenceNumber || "").toLowerCase().includes(q);
        const matchCustomer = (a.customerName || a.creatorName || "").toLowerCase().includes(q);
        const matchPO = (a.shipmentDetails?.poNumber || "").toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchCustomer && !matchPO) return false;
      }

      return true;
    });
  }, [auctions, activeModelTab, activeStatusTab, searchQuery, user]);

  const handleOpenBookingDraft = (a: AuctionData) => {
    const shipmentData: BookingShipmentData = {
      auctionId: a.id,
      auctionNumber: a.referenceNumber || "AUC-2026-001",
      customerName: a.customerName || a.creatorName || "Enterprise Shipper",
      customerEmail: a.creatorEmail || "shipper@fr8x.in",
      awardedBidderName: a.awardedBidderName || "Awarded Logistics Forwarder",
      awardedBidderEmail: a.awardedBidderEmail || "forwarder@company.com",
      pol: a.shipmentDetails?.origin || "Nhava Sheva (INNSA)",
      pod: a.shipmentDetails?.destination || "Rotterdam (NLRTM)",
      por: a.shipmentDetails?.placeOfReceipt || a.shipmentDetails?.origin,
      fpod: a.shipmentDetails?.finalDelivery || a.shipmentDetails?.destination,
      poNumber: a.shipmentDetails?.poNumber || "PO-99102",
      invoiceNumber: a.shipmentDetails?.invoiceNumber || "INV-44012",
      commodity: a.commodityDetails?.[0]?.description || "General Freight Cargo",
      containerType: a.containerDetails?.[0]?.containerSize ? `${a.containerDetails[0].containerSize} × ${a.containerDetails[0].numberOfContainers}` : "40' Standard FCL",
      transportMode: a.shipmentDetails?.mode?.toUpperCase() || "OCEAN",
      awardedRate: String(a.lowestBidAmount || 1250),
      currency: a.evaluationCurrency || "USD",
      validity: a.shipmentDetails?.validity || "14 Days",
    };
    setSelectedBookingShipment(shipmentData);
  };

  return (
    <div className="space-y-4 max-w-[100%] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Reverse Auctions Governance Portal</h1>
          <p className="text-body-sm text-foreground-secondary mt-0.5">
            Enterprise reverse auction procurement engine supporting General & Premium Selective auctions.
          </p>
        </div>
        <Link
          href={ROUTES.AUCTION_CREATE}
          className="fr8x-btn-primary px-4 py-2 text-body-sm flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create Reverse Auction
        </Link>
      </div>

      {/* Model Procurement Tabs (General vs Premium/Selective) */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {MODEL_TABS.map((m) => (
          <button
            key={m.value}
            onClick={() => setActiveModelTab(m.value)}
            className={`px-3.5 py-1.5 rounded-lg text-body-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeModelTab === m.value
                ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs"
                : "bg-white text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            {m.value === "selective" && <Lock className="h-3.5 w-3.5 text-amber-300" />}
            {m.label}
          </button>
        ))}
      </div>

      {/* Search & Lifecycle Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Auction #, Customer Name, POL, POD, PO #, Invoice #..."
            className="fr8x-input pl-9 h-8 text-body-sm"
          />
        </div>
      </div>

      {/* Enhanced Auctions Listing Table */}
      <div className="fr8x-card overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--fr8x-periwinkle)]" />
            <span className="text-body-sm text-foreground-muted">Loading auction registry...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-body-sm text-foreground-muted">
            No reverse auctions matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fr8x-table w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAF9] text-[10px] uppercase font-bold text-foreground-secondary border-b border-border">
                  <th className="px-3 py-2">Auction #</th>
                  <th className="px-3 py-2">Customer Name</th>
                  <th className="px-3 py-2">POL</th>
                  <th className="px-3 py-2">POD</th>
                  <th className="px-3 py-2">POR</th>
                  <th className="px-3 py-2">FPOD</th>
                  <th className="px-3 py-2">PO #</th>
                  <th className="px-3 py-2">Invoice #</th>
                  <th className="px-3 py-2">Commodity</th>
                  <th className="px-3 py-2">Container Type</th>
                  <th className="px-3 py-2">Mode</th>
                  <th className="px-3 py-2">Validity</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Bid Count</th>
                  <th className="px-3 py-2">Lowest Bid</th>
                  <th className="px-3 py-2">Award Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[11px]">
                {filtered.map((a) => {
                  const isSelective = a.auctionType === "selective" || a.auctionType === "premium";
                  return (
                    <tr key={a.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                      <td className="px-3 py-2.5 font-bold font-mono text-[var(--fr8x-periwinkle)] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {isSelective && <span title="Selective / Invited Only"><Lock className="h-3 w-3 text-amber-500" /></span>}
                          <span>{a.referenceNumber || "AUC-2026-01"}</span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 font-semibold text-[var(--fr8x-jet)] whitespace-nowrap">
                        {a.customerName || a.creatorName || "Enterprise Shipper"}
                      </td>

                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{a.shipmentDetails?.origin || "INNSA"}</td>
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{a.shipmentDetails?.destination || "NLRTM"}</td>
                      <td className="px-3 py-2.5 text-foreground-muted whitespace-nowrap">{a.shipmentDetails?.placeOfReceipt || a.shipmentDetails?.origin || "INNSA"}</td>
                      <td className="px-3 py-2.5 text-foreground-muted whitespace-nowrap">{a.shipmentDetails?.finalDelivery || a.shipmentDetails?.destination || "NLRTM"}</td>

                      <td className="px-3 py-2.5 font-mono text-caption whitespace-nowrap">{a.shipmentDetails?.poNumber || "PO-8812"}</td>
                      <td className="px-3 py-2.5 font-mono text-caption whitespace-nowrap">{a.shipmentDetails?.invoiceNumber || "INV-3310"}</td>

                      <td className="px-3 py-2.5 text-foreground-secondary whitespace-nowrap truncate max-w-[120px]">
                        {a.commodityDetails?.[0]?.description || "General Cargo"}
                      </td>

                      <td className="px-3 py-2.5 text-foreground-secondary whitespace-nowrap">
                        {a.containerDetails?.[0]?.containerSize ? `${a.containerDetails[0].containerSize} × ${a.containerDetails[0].numberOfContainers}` : "40'HC × 1"}
                      </td>

                      <td className="px-3 py-2.5 font-semibold whitespace-nowrap">
                        {a.shipmentDetails?.mode?.toUpperCase() || "OCEAN"}
                      </td>

                      <td className="px-3 py-2.5 text-caption text-foreground-muted whitespace-nowrap">
                        {a.shipmentDetails?.validity || "14 Days"}
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={cn("fr8x-badge capitalize", a.status === "active" ? "fr8x-badge-active" : "fr8x-badge-pending")}>
                          {a.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 font-bold tabular-nums text-center whitespace-nowrap">
                        {a.bidsCount || 0}
                      </td>

                      <td className="px-3 py-2.5 font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                        {a.lowestBidAmount ? `${a.evaluationCurrency || "USD"} ${a.lowestBidAmount.toLocaleString()}` : "—"}
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={a.awardStatus === "awarded" || a.status === "awarded" ? "fr8x-badge-active font-bold" : "fr8x-badge-info"}>
                          {a.awardStatus === "awarded" || a.status === "awarded" ? "Awarded" : "Unawarded"}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenBookingDraft(a)}
                            className="px-2 py-1 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                            title="Generate Booking Request Email Draft"
                          >
                            <Mail className="h-3 w-3" /> Booking Draft
                          </button>

                          <Link
                            href={ROUTES.AUCTION_DETAIL(a.id)}
                            className="p-1 rounded text-foreground-secondary hover:text-[var(--fr8x-periwinkle)]"
                            title="Inspect Auction"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System-Generated Booking Request Email Draft Modal */}
      {selectedBookingShipment && (
        <BookingRequestModal
          shipment={selectedBookingShipment}
          onClose={() => setSelectedBookingShipment(null)}
        />
      )}
    </div>
  );
}
