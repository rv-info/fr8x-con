// FR8X-CON Auction Detail Page (Poster View)

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Users,
  Clock,
  Ship,
  Package,
  MapPin,
  ArrowRight,
  Eye,
  Lock,
} from "lucide-react";

import { use } from "react";
import { ROUTES } from "@/lib/utils/constants";

export default function AuctionDetailPage({
  params,
}: {
  params: Promise<{ auctionId: string }>;
}) {
  const { auctionId } = use(params);
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
              <span className="fr8x-badge-active">Active</span>
              <span className="text-caption text-foreground-muted">
                REF-{auctionId}
              </span>
            </div>
            <h1 className="text-display-sm text-foreground">
              FCL: Nhava Sheva → Rotterdam
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-body-sm text-foreground-secondary">
              <span className="flex items-center gap-1.5">
                <Ship className="h-4 w-4" />
                FCL • FOB
              </span>
              <span className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                20ft × 5 • Non-Haz
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                3 days remaining
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                8 participants
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
              <p className="text-foreground font-medium">Mumbai, India</p>
            </div>
            <div>
              <p className="text-foreground-muted">Destination</p>
              <p className="text-foreground font-medium">Rotterdam, Netherlands</p>
            </div>
            <div>
              <p className="text-foreground-muted">Origin Port</p>
              <p className="text-foreground font-medium">INNSA</p>
            </div>
            <div>
              <p className="text-foreground-muted">Destination Port</p>
              <p className="text-foreground font-medium">NLRTM</p>
            </div>
            <div>
              <p className="text-foreground-muted">Mode</p>
              <p className="text-foreground font-medium">FCL</p>
            </div>
            <div>
              <p className="text-foreground-muted">Incoterms</p>
              <p className="text-foreground font-medium">FOB</p>
            </div>
            <div>
              <p className="text-foreground-muted">Cargo Ready</p>
              <p className="text-foreground font-medium">Jul 25, 2024</p>
            </div>
            <div>
              <p className="text-foreground-muted">Required Delivery</p>
              <p className="text-foreground font-medium">Aug 20, 2024</p>
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
                <tr>
                  <td>20ft Standard</td>
                  <td>5</td>
                  <td><span className="fr8x-badge-active">Non-Haz</span></td>
                  <td>18,000 KG</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bid summary */}
      <div className="fr8x-card p-6 space-y-4">
        <h2 className="text-heading-lg text-foreground">Bid Summary</h2>
        <p className="text-body-sm text-foreground-secondary">
          Participant names are hidden. Only ranks and anonymized bid amounts are shown.
        </p>
        <div className="overflow-x-auto">
          <table className="fr8x-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Participant</th>
                <th>Freight</th>
                <th>Local Charges</th>
                <th>Total</th>
                <th>Transit</th>
                <th>Submissions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <span className="text-heading-md font-bold text-brand-600">#{i + 1}</span>
                  </td>
                  <td className="text-foreground-muted">Participant {String.fromCharCode(65 + i)}</td>
                  <td className="tabular-nums">$1,{200 + i * 50}</td>
                  <td className="tabular-nums">${300 + i * 25}</td>
                  <td className="font-semibold tabular-nums">${1500 + i * 75}</td>
                  <td>{18 + i * 2}d</td>
                  <td>{3 + (i % 3)}/5</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
