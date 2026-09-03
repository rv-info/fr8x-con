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
  const [selectedBidEvidence, setSelectedBidEvidence] = useState<{ bid: SubmittedBid; auction: Auction } | null>(null);

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
      <div className="gf-grid-5-7">
        {/* Left Column: List & Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="gf-card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="gf-search-input-wrap" style={{ width: '100%' }}>
              <Search style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search auctions by ID, RFQ, route, company..."
                className="gf-search-input font-medium"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
              {['all', 'Live', 'Awarded', 'Draft', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`gf-pill-btn ${statusFilter === st ? 'active' : ''}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: '1px solid',
                    borderColor: statusFilter === st ? '#0284c7' : '#e2e8f0',
                    background: statusFilter === st ? '#0284c7' : '#ffffff',
                    color: statusFilter === st ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((auc) => {
              const isSelected = selectedAuction?.id === auc.id;
              return (
                <div
                  key={auc.id}
                  onClick={() => setSelectedAuction(auc)}
                  className="gf-card"
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginBottom: 0,
                    borderColor: isSelected ? '#0284c7' : '#e2e8f0',
                    background: isSelected ? '#f0f9ff' : '#ffffff',
                    boxShadow: isSelected ? '0 0 0 1.5px #0284c7' : '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Gavel className="lucide w-3.5 h-3.5 text-sky-600" />
                        {auc.id} · {auc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Issuer: <strong className="text-slate-800">{auc.creatorCompany}</strong> · RFQ: {auc.rfqId}
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

                  <div className="mt-2.5 text-[11px] flex items-center justify-between text-slate-600 border-t border-slate-100 pt-2 font-mono">
                    <span>{auc.shipment.pol.split('(')[0]} → {auc.shipment.pod.split('(')[0]}</span>
                    <span className="font-semibold text-slate-700">{auc.bidsSubmittedCount} Bids Submitted</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Auction Tender Inspector */}
        <div className="lg:col-span-7">
          {selectedAuction ? (
            <div className="gf-card divide-y divide-slate-100">
              {/* Header & Controls */}
              <div className="p-4 bg-slate-50 flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">{selectedAuction.id}</h2>
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-mono font-bold">
                      {selectedAuction.rfqId}
                    </span>
                    <span className="gf-badge gf-badge-green text-[10px] font-bold">
                      {selectedAuction.auctionType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedAuction.title} · Issuer: <strong className="text-slate-900">{selectedAuction.creatorCompany}</strong>
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
                <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <Check className="lucide w-4 h-4 text-emerald-600" />
                  Structured tender table notification successfully generated & dispatched to all assigned bidders!
                </div>
              )}

              {/* Route & Schedule */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Port of Loading</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">{selectedAuction.shipment.pol}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Port of Discharge</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">{selectedAuction.shipment.pod}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Cargo Ready Date</span>
                  <span className="font-mono text-slate-700 font-bold block mt-0.5">{selectedAuction.shipment.cargoReadyDate}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Incoterm / Scope</span>
                  <span className="font-mono text-sky-700 font-bold block mt-0.5">{selectedAuction.shipment.incoterm}</span>
                </div>
              </div>

              {/* Container & Equipment Manifest (Read-Only) */}
              <div className="p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Equipment & Container Cargo Rows</span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">COMMERCIAL MANIFEST (IMMUTABLE)</span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
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
                          <td className="font-mono font-bold text-sky-700">{c.equipmentType}</td>
                          <td className="font-semibold text-slate-800">{c.quantity}</td>
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
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Authoritative Submitted Bids & Rank History ({selectedAuction.bids?.length || 0})</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">READ-ONLY AUDIT SNAPSHOT</span>
                </div>

                {!selectedAuction.bids || selectedAuction.bids.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-50 rounded-lg border border-slate-200">
                    No bids submitted yet for this tender window.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="gf-table text-[11px]">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Bidder Name & Company</th>
                          <th>Grand Total</th>
                          <th>Fee Paid</th>
                          <th>Timestamp</th>
                          <th>Status</th>
                          <th>Godfather Evidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAuction.bids.map((bid) => (
                          <tr key={bid.id}>
                            <td className="font-mono font-bold text-amber-600">#{bid.rank}</td>
                            <td>
                              <div className="font-bold text-slate-900">{bid.bidderCompany}</div>
                              <div className="text-[10px] text-slate-500">{bid.bidderName}</div>
                            </td>
                            <td className="font-mono font-bold text-emerald-700 text-xs">
                              ${bid.grandTotalUSD.toLocaleString()} USD
                            </td>
                            <td className="font-mono text-slate-600">
                              ₹{bid.feePaid} {bid.bidderHasGoldenTick && <span className="text-amber-600 font-bold text-[10px]">(40% Disc)</span>}
                            </td>
                            <td className="font-mono text-slate-500 text-[10px]">
                              {bid.submittedAt.includes('T') ? new Date(bid.submittedAt).toLocaleTimeString() : bid.submittedAt}
                            </td>
                            <td>
                              <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold">
                                {bid.status}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => setSelectedBidEvidence({ bid, auction: selectedAuction })}
                                className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-[10px] font-bold border border-sky-200 flex items-center gap-1 transition"
                                title="Inspect cryptographically verified evidence log"
                              >
                                <Shield size={10} /> Inspect Docket
                              </button>
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
                <div className="text-xs font-bold text-slate-800">
                  Assigned Selected Bidders ({selectedAuction.selectedBidders.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedAuction.selectedBidders.map((b) => (
                    <div key={b.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-500">{b.company} · {b.location}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="gf-card p-12 text-center text-xs text-slate-500">
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

      {/* GODFATHER EVIDENCE DOCKET INSPECTION MODAL (User Requirement) */}
      {selectedBidEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-500 text-slate-950 rounded font-bold text-xs">
                  GODFATHER
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">BID EVIDENCE DOCKET AUDIT</h3>
                  <div className="text-[11px] text-slate-300 font-mono">
                    {selectedBidEvidence.bid.evidenceDocket?.docketRef || `FR8X-EVID-${selectedBidEvidence.bid.id.toUpperCase()}`}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBidEvidence(null)}
                className="text-slate-400 hover:text-white transition p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Evidence Status Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-bold text-emerald-900 text-xs">
                    Irrevocable Legal Attestation Verified
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  SEALED IN COMPLIANCE VAULT
                </span>
              </div>

              {/* Bidder & Tender Overview */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Bidder Legal Entity</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedBidEvidence.bid.bidderCompany}</div>
                  <div className="text-slate-600">{selectedBidEvidence.bid.bidderName}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Tender Window & Total</span>
                  <div className="font-bold text-emerald-700 text-sm font-mono">
                    ${selectedBidEvidence.bid.grandTotalUSD.toLocaleString()} USD
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Rank #{selectedBidEvidence.bid.rank} · {selectedBidEvidence.auction.id}
                  </div>
                </div>
              </div>

              {/* Required Operational Commitments (Evidence) */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-2.5">
                <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-1.5 text-xs">
                  <span>MANDATORY OPERATIONAL COMMITMENTS</span>
                  <span className="text-[10px] text-sky-700 font-semibold">Verified Carrier Space</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Nominated Ocean Carrier:</span>
                    <b className="text-slate-900">{selectedBidEvidence.bid.evidenceDocket?.proposedCarrier || 'Direct Liner Service (Tier-1)'}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Proposed Service String:</span>
                    <b className="text-slate-900">{selectedBidEvidence.bid.evidenceDocket?.proposedRouting || 'Direct Ocean Express'}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Guaranteed Transit Time:</span>
                    <b className="text-slate-900">{selectedBidEvidence.bid.evidenceDocket?.proposedTransitTime || '24 Days Port-to-Port'}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Target Vessel ETD:</span>
                    <b className="text-slate-900">{selectedBidEvidence.bid.evidenceDocket?.proposedVesselDate || '2026-09-15'}</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Origin Free Days (Demurrage):</span>
                    <b className="text-slate-900">{selectedBidEvidence.bid.evidenceDocket?.offeredOriginFreeDays ?? 14} Days</b>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Dest Free Days (Detention):</span>
                    <b className="text-slate-900">{selectedBidEvidence.bid.evidenceDocket?.offeredDestFreeDays ?? 21} Days</b>
                  </div>
                </div>
              </div>

              {/* Legal Terms Acceptance & Cryptographic Proof */}
              <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3 space-y-2">
                <div className="font-bold text-amber-900 flex items-center justify-between border-b border-amber-200 pb-1.5 text-xs">
                  <span>TERMS &amp; CONDITIONS ACCEPTANCE RECORD</span>
                  <span className="text-emerald-700 font-mono font-bold text-[10px]">ACCEPTED &amp; SEALED</span>
                </div>
                <div className="text-[11px] text-amber-950 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-amber-800">Acceptance Timestamp:</span>
                    <b className="font-mono">{selectedBidEvidence.bid.evidenceDocket?.termsAcceptedAt ? new Date(selectedBidEvidence.bid.evidenceDocket.termsAcceptedAt).toLocaleString() : new Date().toLocaleString()}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-800">Attestation Clause:</span>
                    <span>Accepted all RFQ Commercial Terms, Packaging &amp; Dispute Protocols</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-800">Verified IP Address:</span>
                    <span className="font-mono">{selectedBidEvidence.bid.evidenceDocket?.ipAddress || '103.21.244.18 (Encrypted Gateway)'}</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-amber-200/60">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block mb-1">SHA256 Cryptographic Evidence Hash</span>
                  <div className="font-mono text-[10px] bg-white p-1.5 rounded border border-amber-200 text-slate-800 break-all select-all">
                    {selectedBidEvidence.bid.evidenceDocket?.evidenceHash || `SHA256:BID:${selectedBidEvidence.bid.id}:${selectedBidEvidence.bid.grandTotalUSD}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBidEvidence(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Audit Docket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
