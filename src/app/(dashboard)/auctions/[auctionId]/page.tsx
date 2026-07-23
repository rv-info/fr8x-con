// FR8X-CON Auction Detail Page (Poster View)

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Users,
  Clock,
  Ship,
  Package,
  MapPin,
  ArrowRight,
  Lock,
  Loader2,
} from "lucide-react";

import { use } from "react";
import { ROUTES, COLLECTIONS } from "@/lib/utils/constants";
import { getDocument } from "@/lib/firebase/firestore";

type AuctionDetail = {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  shipmentDetails: {
    origin: string;
    destination: string;
    originPort: string;
    destinationPort: string;
    mode: string;
    incoTerms: string;
    cargoReadyDate: string;
    requiredDeliveryDate: string;
  };
  containerDetails: Array<{
    containerSize: string;
    numberOfContainers: number;
    hazStatus: string;
    grossWeight: number;
  }>;
  participantsCount: number;
  bidsCount: number;
  endDate: string;
};

export default function AuctionDetailPage({
  params,
}: {
  params: Promise<{ auctionId: string }>;
}) {
  const { auctionId } = use(params);
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAuction() {
      setIsLoading(true);
      try {
        const data = await getDocument<AuctionDetail>(COLLECTIONS.AUCTIONS, auctionId);
        setAuction(data);
      } catch (err) {
        console.error("Error fetching auction:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuction();
  }, [auctionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
        <span className="text-body-sm text-foreground-muted">Loading auction...</span>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => history.back()}
          className="flex items-center gap-1 text-body-sm text-foreground-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Auctions
        </button>
        <div className="fr8x-card p-6 text-center">
          <p className="text-body-sm text-foreground-secondary">Auction not found</p>
          <p className="text-caption text-foreground-muted mt-1">This auction may have been removed or does not exist.</p>
        </div>
      </div>
    );
  }

  const shipment = auction.shipmentDetails || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => history.back()}
        className="flex items-center gap-1 text-body-sm text-foreground-secondary hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Auctions
      </button>

      {/* Auction header */}
      <div className="fr8x-card p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`fr8x-badge ${auction.status === "active" ? "fr8x-badge-active" : auction.status === "draft" ? "fr8x-badge-pending" : "fr8x-badge-info"}`}>
                {auction.status}
              </span>
              <span className="text-caption text-foreground-muted">
                {auction.referenceNumber || auctionId}
              </span>
            </div>
            <h1 className="text-display-sm text-foreground">
              {auction.title || "Untitled Auction"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-body-sm text-foreground-secondary">
              <span className="flex items-center gap-1.5">
                <Ship className="h-4 w-4" />
                {shipment.mode?.toUpperCase() || "—"} • {shipment.incoTerms || "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                {auction.containerDetails?.map(c => `${c.containerSize} × ${c.numberOfContainers}`).join(", ") || "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Ends: {auction.endDate || "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {auction.participantsCount || 0} participants
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.AUCTION_BID(auctionId)}
              className="fr8x-btn-primary px-5 py-2.5 flex items-center gap-2"
            >
              Place Bid
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment details */}
        <div className="fr8x-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-500" />
            <h2 className="text-heading-lg text-foreground">Shipment Details</h2>
            <Lock className="h-4 w-4 text-foreground-muted ml-auto" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-body-sm">
            <div>
              <p className="text-foreground-muted">Origin</p>
              <p className="text-foreground font-medium">{shipment.origin || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Destination</p>
              <p className="text-foreground font-medium">{shipment.destination || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Origin Port</p>
              <p className="text-foreground font-medium">{shipment.originPort || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Destination Port</p>
              <p className="text-foreground font-medium">{shipment.destinationPort || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Mode</p>
              <p className="text-foreground font-medium">{shipment.mode?.toUpperCase() || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Incoterms</p>
              <p className="text-foreground font-medium">{shipment.incoTerms || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Cargo Ready</p>
              <p className="text-foreground font-medium">{shipment.cargoReadyDate || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Required Delivery</p>
              <p className="text-foreground font-medium">{shipment.requiredDeliveryDate || "—"}</p>
            </div>
          </div>
        </div>

        {/* Container details */}
        <div className="fr8x-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-500" />
            <h2 className="text-heading-lg text-foreground">Container Details</h2>
            <Lock className="h-4 w-4 text-foreground-muted ml-auto" />
          </div>
          <div className="overflow-x-auto">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Haz</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {auction.containerDetails && auction.containerDetails.length > 0 ? (
                  auction.containerDetails.map((c, i) => (
                    <tr key={i}>
                      <td>{c.containerSize}</td>
                      <td>{c.numberOfContainers}</td>
                      <td>
                        <span className={c.hazStatus === "non_haz" ? "fr8x-badge-active" : "fr8x-badge-danger"}>
                          {c.hazStatus === "non_haz" ? "Non-Haz" : "Hazardous"}
                        </span>
                      </td>
                      <td>{c.grossWeight ? `${c.grossWeight.toLocaleString()} KG` : "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-foreground-muted">No container details</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bid summary */}
      <div className="fr8x-card p-6 space-y-4">
        <h2 className="text-heading-lg text-foreground">Bid Summary</h2>
        <p className="text-body-sm text-foreground-secondary">
          {auction.bidsCount ? `${auction.bidsCount} bids received` : "No bids received yet"}
        </p>
        {!auction.bidsCount && (
          <p className="text-caption text-foreground-muted text-center py-4">
            Bids will appear here once participants start bidding.
          </p>
        )}
      </div>
    </div>
  );
}
