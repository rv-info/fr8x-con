'use client';

import React, { useState } from 'react';
import {
  Gavel,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Lock,
  Eye,
  Ship,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Shield,
  Layers,
  Check,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { Auction, SubmittedBid } from '@/lib/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';
import { formatAuctionDetailTable } from '@/lib/godfather/utils/templateBuilder';

export default function AuctionsAdministrationPage() {
  const { auctions, suspendAuction, reopenAuction, dispatchBidderNotifications } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(auctions[0]);
  const [notificationDispatched, setNotificationDispatched] = useState(false);

  // Confirmation modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    isDestructive?: boolean;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const filtered = auctions.filter((a) => {
    const matches =
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.rfqId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.creatorCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.shipment.pol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.shipment.pod.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matches;
    return matches && a.status === statusFilter;
  });

  const handleSuspend = async (a: Auction) => {
    const verified = await requestStepUpVerification(`Suspend Auction ${a.id} under compliance hold`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Suspend Reverse Auction Under Compliance Hold',
      actionType: 'AUCTION_COMPLIANCE_SUSPENDED',
      targetLabel: `${a.id} · ${a.title}`,
      targetId: a.id,
      isDestructive: true,
      onConfirm: async (reason) => {
        await suspendAuction(a.id, reason);
        setModalConfig(null);
      },
    });
  };

  const handleReopen = async (a: Auction) => {
    const verified = await requestStepUpVerification(`Reopen Auction ${a.id}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Reopen Auction Tender Window',
      actionType: 'AUCTION_REOPENED_AUDITED',
      targetLabel: `${a.id} · ${a.title}`,
      targetId: a.id,
      onConfirm: async (reason) => {
        await reopenAuction(a.id, reason);
        setModalConfig(null);
      },
    });
  };

  const handleNotifyBidders = async (a: Auction) => {
    const res = await dispatchBidderNotifications(a.id);
    if (res.success) {
      setNotificationDispatched(true);
      setTimeout(() => setNotificationDispatched(false), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">OPERATIONS</span>
            <span className="gf-badge gf-badge-green text-[11px]">
              {auctions.filter((a) => a.status === 'Live').length} Live Tenders
            </span>
          </div>
          <h1 className="gf-page-title">Auctions & Bids Administration Workspace</h1>
          <p className="gf-page-subtitle">
            Govern reverse auctions, inspect immutable bid rank snapshots, trigger structured invitations, and control tender lifecycles
          </p>
        </div>
      </div>

      {/* Main Split: Auction List on Left (5 cols) & Auction Inspector on Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List & Filters */}
        <div className="lg:col-span-5 space-y-3">
          <div className="gf-card p-3 space-y-2">
            <div className="gf-search-input-wrap w-full">
              <Search className="lucide w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search auctions by ID, RFQ, route, company..."
                className="gf-search-input"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {['all', 'Live', 'Awarded', 'Draft', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded capitalize font-semibold transition-colors ${
                    statusFilter === st ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((auc) => {
              const isSelected = selectedAuction?.id === auc.id;
              return (
                <div
                  key={auc.id}
                  onClick={() => setSelectedAuction(auc)}
                  className={`gf-card p-3.5 cursor-pointer transition-all ${
                    isSelected ? 'border-sky-500 bg-slate-850 shadow-md' : 'hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                        <Gavel className="lucide w-3.5 h-3.5 text-sky-400" />
                        {auc.id} · {auc.title}
                      </div>
                      <div className="text-[11px] text-mut mt-0.5">
                        Issuer: <strong className="text-slate-300">{auc.creatorCompany}</strong> · RFQ: {auc.rfqId}
                      </div>
                    </div>
                    <span
                      className={`gf-badge gf-badge-${
                        auc.status === 'Live' ? 'green' : auc.status === 'Awarded' ? 'blue' : 'gray'
                      } text-[10px] uppercase font-bold`}
                    >
                      {auc.status}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] flex items-center justify-between text-slate-400 border-t border-slate-800 pt-2 font-mono">
                    <span>{auc.shipment.pol.split('(')[0]} → {auc.shipment.pod.split('(')[0]}</span>
                    <span>{auc.bidsSubmittedCount} Bids Submitted</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Auction Tender Inspector */}
        <div className="lg:col-span-7">
          {selectedAuction ? (
            <div className="gf-card divide-y divide-slate-800">
              {/* Header & Controls */}
              <div className="p-4 bg-slate-900 flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">{selectedAuction.id}</h2>
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-mono font-bold">
                      {selectedAuction.rfqId}
                    </span>
                    <span className="gf-badge gf-badge-green text-[10px] font-bold">
                      {selectedAuction.auctionType}
                    </span>
                  </div>
                  <p className="text-xs text-mut mt-0.5">
                    {selectedAuction.title} · Issuer: <strong className="text-slate-200">{selectedAuction.creatorCompany}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNotifyBidders(selectedAuction)}
                    className="gf-btn gf-btn-primary text-xs flex items-center gap-1 font-bold"
                  >
                    <Send className="lucide w-3 h-3" />
                    Dispatch Notifications
                  </button>
                  {selectedAuction.status === 'Live' ? (
                    <button
                      type="button"
                      onClick={() => handleSuspend(selectedAuction)}
                      className="gf-btn gf-btn-danger text-xs"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReopen(selectedAuction)}
                      className="gf-btn gf-btn-success text-xs"
                    >
                      Reopen Tender
                    </button>
                  )}
                </div>
              </div>

              {/* Notification confirmation toast */}
              {notificationDispatched && (
                <div className="p-2.5 bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="lucide w-4 h-4 text-emerald-400" />
                  Structured tender table notification successfully generated & dispatched to all assigned bidders!
                </div>
              )}

              {/* Route & Schedule */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 text-xs">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">Port of Loading</span>
                  <span className="font-semibold text-slate-200">{selectedAuction.shipment.pol}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">Port of Discharge</span>
                  <span className="font-semibold text-slate-200">{selectedAuction.shipment.pod}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">Cargo Ready Date</span>
                  <span className="font-mono text-slate-300">{selectedAuction.shipment.cargoReadyDate}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">Incoterm / Scope</span>
                  <span className="font-mono text-sky-400 font-bold">{selectedAuction.shipment.incoterm}</span>
                </div>
              </div>

              {/* Container & Equipment Manifest (Read-Only) */}
              <div className="p-4 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Equipment & Container Cargo Rows</span>
                  <span className="text-[10px] font-mono text-faint">COMMERCIAL MANIFEST (IMMUTABLE)</span>
                </div>
                <div className="border border-slate-800 rounded overflow-hidden">
                  <table className="gf-table text-[11px]">
                    <thead>
                      <tr>
                        <th>Equipment</th>
                        <th>Qty</th>
                        <th>Type</th>
                        <th>Commodity</th>
                        <th>Gross Wt</th>
                        <th>Pickup Yard</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAuction.containers.map((c) => (
                        <tr key={c.id}>
                          <td className="font-mono font-bold text-sky-400">{c.equipmentType}</td>
                          <td>{c.quantity}</td>
                          <td>{c.containerType}</td>
                          <td>{c.commodity}</td>
                          <td>{c.grossWeight} {c.weightUnit || 'KG'}</td>
                          <td>{c.pickupLocation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submitted Bids & Rank Snapshot (Strictly Read-Only Snapshot) */}
              <div className="p-4 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Authoritative Submitted Bids & Rank History ({selectedAuction.bids?.length || 0})</span>
                  <span className="text-[10px] font-mono text-emerald-400">READ-ONLY AUDIT SNAPSHOT</span>
                </div>

                {!selectedAuction.bids || selectedAuction.bids.length === 0 ? (
                  <div className="p-4 text-center text-xs text-mut italic bg-slate-900 rounded border border-slate-800">
                    No bids submitted yet for this tender window.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded overflow-hidden">
                    <table className="gf-table text-[11px]">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Bidder Name & Company</th>
                          <th>Grand Total</th>
                          <th>Fee Paid</th>
                          <th>Timestamp</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAuction.bids.map((bid) => (
                          <tr key={bid.id}>
                            <td className="font-mono font-bold text-amber-400">#{bid.rank}</td>
                            <td>
                              <div className="font-bold text-slate-200">{bid.bidderCompany}</div>
                              <div className="text-[10px] text-mut">{bid.bidderName}</div>
                            </td>
                            <td className="font-mono font-bold text-emerald-400 text-xs">
                              ${bid.grandTotalUSD.toLocaleString()} USD
                            </td>
                            <td className="font-mono text-slate-400">
                              ₹{bid.feePaid} {bid.bidderHasGoldenTick && <span className="text-amber-400 text-[10px]">(40% Disc)</span>}
                            </td>
                            <td className="font-mono text-faint text-[10px]">
                              {new Date(bid.submittedAt).toLocaleTimeString()}
                            </td>
                            <td>
                              <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold">
                                {bid.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Assigned Bidders List */}
              <div className="p-4 space-y-2">
                <div className="text-xs font-bold text-slate-300">
                  Assigned Selected Bidders ({selectedAuction.selectedBidders.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedAuction.selectedBidders.map((b) => (
                    <div key={b.id} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                      <div className="font-bold text-slate-200">{b.name}</div>
                      <div className="text-[11px] text-mut">{b.company} · {b.location}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="gf-card p-12 text-center text-xs text-mut">
              Select an auction tender from the left to inspect bid ranks and trigger formal notifications.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalConfig && (
        <ActionConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          actionType={modalConfig.actionType}
          targetLabel={modalConfig.targetLabel}
          targetId={modalConfig.targetId}
          isDestructive={modalConfig.isDestructive}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
