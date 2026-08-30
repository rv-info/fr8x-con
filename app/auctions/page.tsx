'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/context/DataContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ProfileLink } from '@/components/ui/ProfileLink';
import { ProfilePreviewModal } from '@/components/ui/ProfilePreviewModal';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  Gavel,
  Plus,
  Search,
  Clock,
  Eye,
  CheckCircle2,
  Building,
  ShieldCheck,
  Calendar,
  Layers,
  MapPin,
  FileText,
  DollarSign,
  UserCheck,
  History,
  Lock,
  Award,
  AlertCircle,
  TrendingDown,
  XCircle,
  Archive,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Auction, SubmittedBid } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

export default function AuctionsPage() {
  const { auctions, mySubmittedBids, updateAuctionStatus } = useData();
  const { format } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();

  // 8 Tabs as specified in V11+ Architecture
  const [activeTab, setActiveTab] = useState<
    'overview' | 'live' | 'posted' | 'participated' | 'drafts' | 'results' | 'closed' | 'expired'
  >('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuctionModal, setSelectedAuctionModal] = useState<Auction | null>(null);
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);

  // Derived filtered lists
  const liveAuctions = auctions.filter((a) => a.status === 'Live');
  const postedAuctions = auctions.filter((a) => a.creatorUid === user.uid);
  const draftAuctions = auctions.filter((a) => a.status === 'Draft');
  const closedAuctions = auctions.filter((a) => a.status === 'Closed');
  const awardedAuctions = auctions.filter((a) => a.status === 'Awarded');
  const expiredAuctions = auctions.filter((a) => a.status === 'Expired');

  // Filter with search
  const matchesSearch = (a: Auction) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.shipment.pol.toLowerCase().includes(q) ||
      a.shipment.pod.toLowerCase().includes(q) ||
      a.creatorCompany.toLowerCase().includes(q) ||
      a.shipment.commodity.toLowerCase().includes(q)
    );
  };

  const currentTabAuctions = () => {
    switch (activeTab) {
      case 'live':
        return liveAuctions.filter(matchesSearch);
      case 'posted':
        return postedAuctions.filter(matchesSearch);
      case 'drafts':
        return draftAuctions.filter(matchesSearch);
      case 'results':
        return awardedAuctions.filter(matchesSearch);
      case 'closed':
        return closedAuctions.filter(matchesSearch);
      case 'expired':
        return expiredAuctions.filter(matchesSearch);
      default:
        return auctions.filter(matchesSearch);
    }
  };

  return (
    <div className="auctions-container">
      <ProfilePreviewModal
        isOpen={Boolean(selectedProfileName)}
        onClose={() => setSelectedProfileName(null)}
        personName={selectedProfileName || ''}
      />

      {/* Auction Detail Snapshot Modal */}
      {selectedAuctionModal && (
        <Modal
          isOpen={Boolean(selectedAuctionModal)}
          onClose={() => setSelectedAuctionModal(null)}
          title={`Auction Detail & Audit Record: ${selectedAuctionModal.id}`}
        >
          <div className="auction-modal-snapshot">
            {/* Header Strip */}
            <div className="snapshot-header-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--ink)' }}>
                  {selectedAuctionModal.title}
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
                  RFQ Reference: <b>{selectedAuctionModal.rfqId}</b> · Created by {selectedAuctionModal.creatorCompany}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span className={`badge ${selectedAuctionModal.status === 'Live' ? 'green' : selectedAuctionModal.status === 'Awarded' ? 'blue' : selectedAuctionModal.status === 'Draft' ? 'grey' : 'amber'}`}>
                  {selectedAuctionModal.status.toUpperCase()}
                </span>
                <span className="badge blue">{selectedAuctionModal.auctionType}</span>
              </div>
            </div>

            {/* Shipment Route & Cargo Parameters */}
            <div className="snapshot-section">
              <div className="section-title">
                <MapPin size={13} color="var(--brand)" /> <b>Shipment Route & Cargo Specifications</b>
              </div>
              <div className="snapshot-grid">
                <div className="info-cell">
                  <small>Port of Loading (POL)</small>
                  <strong>{selectedAuctionModal.shipment.pol}</strong>
                </div>
                <div className="info-cell">
                  <small>Port of Discharge (POD)</small>
                  <strong>{selectedAuctionModal.shipment.pod}</strong>
                </div>
                <div className="info-cell">
                  <small>Incoterm</small>
                  <strong>{selectedAuctionModal.shipment.incoterm}</strong>
                </div>
                <div className="info-cell">
                  <small>Commodity & HS Code</small>
                  <strong>{selectedAuctionModal.shipment.commodity} ({selectedAuctionModal.shipment.hsCode})</strong>
                </div>
                <div className="info-cell">
                  <small>Cargo Ready Date</small>
                  <strong>{selectedAuctionModal.shipment.cargoReadyDate}</strong>
                </div>
                <div className="info-cell">
                  <small>Posting Fee / Terms</small>
                  <strong>₹{selectedAuctionModal.postingFeeINR || 300} INR / USD ${selectedAuctionModal.postingFeeUSD || 7} (Bidding: FREE)</strong>
                </div>
              </div>
            </div>

            {/* Container Equipment Requirements */}
            <div className="snapshot-section">
              <div className="section-title">
                <Layers size={13} color="var(--teal)" /> <b>Container Equipment Details</b>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedAuctionModal.containers.map((c, i) => (
                  <div key={c.id || i} style={{ padding: '8px 10px', background: '#fff', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '11.5px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <b>{c.quantity}x {c.equipmentType}</b> ({c.containerType}) · Commodity: {c.commodity}
                      <small style={{ display: 'block', color: 'var(--mut)', marginTop: '2px' }}>
                        Pickup: {c.pickupLocation} → Empty Return: {c.emptyReturnLocation}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge grey">{c.grossWeight.toLocaleString()} {c.weightUnit || 'KG'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Complete Awarded Auction Results Dossier (Requirement 7) */}
            {selectedAuctionModal.status === 'Awarded' && (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', padding: '14px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #bbf7d0', paddingBottom: '6px' }}>
                  <b style={{ color: '#15803d', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} /> Closed Bidding Awarded Dossier &amp; Contract Docket
                  </b>
                  <span className="badge green" style={{ fontSize: '10.5px', fontWeight: 800 }}>
                    {selectedAuctionModal.awardedDetails?.docketId || 'DOCKET-AWARD-SEALED'}
                  </span>
                </div>

                <div className="grid g2" style={{ gap: '12px', fontSize: '11.5px' }}>
                  {/* Bid Posting Party (Shipper) */}
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <small style={{ color: '#0369a1', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      1. Bid Posting Party (Shipper / Buyer)
                    </small>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--ink)' }}>
                      <div>Organization: <b>{selectedAuctionModal.awardedDetails?.shipperCompany || selectedAuctionModal.creatorCompany}</b></div>
                      <div>Contact Officer: <b>{selectedAuctionModal.awardedDetails?.shipperContact || selectedAuctionModal.creatorName}</b></div>
                      <div>Route: <b>{selectedAuctionModal.shipment.pol} → {selectedAuctionModal.shipment.pod}</b></div>
                      <div>Terms: <b>{selectedAuctionModal.shipment.incoterm}</b> · Cargo Ready: <b>{selectedAuctionModal.shipment.cargoReadyDate}</b></div>
                    </div>
                  </div>

                  {/* Bid Winning Party (Forwarder) */}
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #86efac' }}>
                    <small style={{ color: '#15803d', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      2. Bid Winning Party (Awarded Forwarder)
                    </small>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--ink)' }}>
                      <div>Winning Company: <b style={{ color: '#15803d' }}>{selectedAuctionModal.awardedDetails?.winningCompany || 'Atlas Logistics Pvt. Ltd.'}</b></div>
                      <div>Procurement Lead: <b>{selectedAuctionModal.awardedDetails?.winningContact || 'Arjun Rao (Director)'}</b></div>
                      <div>Awarded Rate: <b style={{ color: '#15803d', fontSize: '13px' }}>${selectedAuctionModal.awardedDetails?.winningRateUSD?.toLocaleString() || 2990} USD</b> (L1 Lowest Bid)</div>
                      <div>Nominated Carrier: <b>{selectedAuctionModal.awardedDetails?.carrier || 'CMA CGM Direct'}</b> ({selectedAuctionModal.awardedDetails?.transitTime || '26 Days'})</div>
                      <div>Free Time Terms: <b>{selectedAuctionModal.awardedDetails?.freeTimeOrigin || '14d Origin'} / {selectedAuctionModal.awardedDetails?.freeTimeDest || '21d Destination'}</b></div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', color: 'var(--ink)' }}>
                  <b>Settlement Terms:</b> {selectedAuctionModal.awardedDetails?.settlementTerms || 'Net 45 Days against Clean OBL & Verified VGM'} · <b>Equipment Breakdown:</b> {selectedAuctionModal.awardedDetails?.equipmentBreakdown || '1x 40HC All-in Freight & Surcharges'}
                </div>
              </div>
            )}

            {/* Participated Bidders Ledger & Standings (Requirement 7) */}
            {selectedAuctionModal.bids && selectedAuctionModal.bids.length > 0 && (
              <div className="snapshot-section">
                <div className="section-title">
                  <Gavel size={13} color="var(--brand)" /> <b>Participated Bidders Ledger &amp; Audited Ranks (L1 Lowest)</b>
                </div>
                <div className="tablewrap flush">
                  <table className="table sub-table" style={{ fontSize: '11.5px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th>Bidder Ref &amp; Org</th>
                        <th>Equipment</th>
                        <th>All-In Unit USD</th>
                        <th>Grand Total USD</th>
                        <th>Rank Position</th>
                        <th>Submitted At</th>
                        <th>Outcome Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAuctionModal.bids.map((b, idx) => (
                        <tr key={b.id} style={{ background: b.rank === 1 ? '#f0fdf4' : '#ffffff' }}>
                          <td><b>{b.bidderCompany}</b> ({b.bidderName})</td>
                          <td>{b.charges[0]?.equipment || '40HC'}</td>
                          <td>${b.charges[0]?.totalUnit?.toLocaleString() || b.grandTotalUSD}</td>
                          <td><b style={{ color: b.rank === 1 ? '#15803d' : 'var(--ink)' }}>${b.grandTotalUSD.toLocaleString()} USD</b></td>
                          <td><span className={`badge ${b.rank === 1 ? 'green' : 'blue'}`}>L{b.rank} {b.rank === 1 ? '(Winner)' : ''}</span></td>
                          <td><small style={{ color: 'var(--mut)' }}>{b.submittedAt}</small></td>
                          <td><span className={`badge ${b.status === 'winning' ? 'green' : 'amber'}`}>{b.status === 'winning' ? 'AWARDED (L1)' : 'OUTBID'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Immutable Audit Log */}
            <div className="snapshot-section immutable-audit-box">
              <div className="section-title">
                <ShieldCheck size={13} color="var(--brand)" /> <b>Immutable Audit Snapshot</b>
              </div>
              <small style={{ color: 'var(--ink-secondary)', display: 'block', lineHeight: '1.5' }}>
                Published timestamp: <b>{selectedAuctionModal.publishedAt || selectedAuctionModal.startDate}</b> ·
                Creator: <b>{selectedAuctionModal.creatorName}</b> ({selectedAuctionModal.creatorCompany}) ·
                All bids cryptographically sealed and logged for anti-collusion compliance.
              </small>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
              <button className="btn secondary" onClick={() => setSelectedAuctionModal(null)}>
                Close Record
              </button>
              {selectedAuctionModal.status === 'Live' && (
                <Link href={`/auctions/${selectedAuctionModal.id}`} className="btn primary">
                  <Gavel size={13} /> Enter Live Bidding Room
                </Link>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="head">
        <div>
          <h1>Enterprise Reverse Auctions & Bidding Platform</h1>
          <p>
            Real-time freight reverse auctions, multi-container equipment bidding rooms, and immutable trade settlement records.
          </p>
        </div>
        <div className="actions">
          <Link href="/auctions/create" className="btn primary">
            <Plus size={15} /> Create Reverse Auction
          </Link>
        </div>
      </div>

      {/* Top KPI Metrics Strip */}
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="metric">
          <small>Active Live Auctions</small>
          <b>{liveAuctions.length}</b>
          <span>{auctions.length} total auctions</span>
        </div>
        <div className="metric">
          <small>Bid Posted (My Auctions)</small>
          <b>{postedAuctions.length}</b>
          <span>{postedAuctions.filter((a) => a.status === 'Live').length} Live now</span>
        </div>
        <div className="metric">
          <small>Bid Participated</small>
          <b>{mySubmittedBids.length}</b>
          <span>{mySubmittedBids.filter((b) => b.status === 'winning').length} Won bids</span>
        </div>
        <div className="metric">
          <small>Posting Fee / Bid</small>
          <b>{user.hasGoldenTick ? '₹180' : '₹300'}</b>
          <span>{user.hasGoldenTick ? '40% Premium Gold' : 'Standard Rate'}</span>
        </div>
        <div className="metric">
          <small>Average Savings</small>
          <b>14.8%</b>
          <span>vs Spot Freight Index</span>
        </div>
      </div>

      {/* 8-Tab Operational Navigation Bar */}
      <div className="feed-header-bar" style={{ marginTop: '16px', marginBottom: '14px' }}>
        <div className="feed-tabs" style={{ flexWrap: 'wrap' }}>
          <button
            className={`feed-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            All Overview ({auctions.length})
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Clock size={12} style={{ verticalAlign: '-1px' }} /> Live Bidding ({liveAuctions.length})
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'posted' ? 'active' : ''}`}
            onClick={() => setActiveTab('posted')}
          >
            <Gavel size={12} style={{ verticalAlign: '-1px' }} /> Bid Posted ({postedAuctions.length})
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'participated' ? 'active' : ''}`}
            onClick={() => setActiveTab('participated')}
          >
            <History size={12} style={{ verticalAlign: '-1px' }} /> Participated ({mySubmittedBids.length})
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
            onClick={() => setActiveTab('drafts')}
          >
            <FileText size={12} style={{ verticalAlign: '-1px' }} /> Drafts ({draftAuctions.length})
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <Award size={12} style={{ verticalAlign: '-1px' }} /> Awarded ({awardedAuctions.length})
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'closed' ? 'active' : ''}`}
            onClick={() => setActiveTab('closed')}
          >
            <Archive size={12} style={{ verticalAlign: '-1px' }} /> Closed ({closedAuctions.length})
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            <XCircle size={12} style={{ verticalAlign: '-1px' }} /> Expired ({expiredAuctions.length})
          </button>
        </div>

        <div className="feed-search-box" style={{ width: '300px' }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search auctions by ID, POL, POD, commodity…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search-btn">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* MAIN AUCTIONS TABLE */}
      {activeTab === 'participated' ? (
        /* Participated Bids View */
        <div className="card">
          <div className="cardhead">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} color="var(--brand)" />
              <b>My Submitted Bids & Standings</b>
            </div>
            <small style={{ color: 'var(--mut)' }}>Real-time reverse auction ranking tracking</small>
          </div>

          <div className="tablewrap flush">
            <table className="table">
              <thead>
                <tr>
                  <th>Auction ID / Route</th>
                  <th>Equipment</th>
                  <th>My Grand Total</th>
                  <th>Submitted Rank</th>
                  <th>Participation Fee</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {mySubmittedBids.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--mut)' }}>
                      No bids submitted yet. Explore the <b>Live Bidding</b> tab to quote verified auctions (Participation is 100% Free).
                    </td>
                  </tr>
                ) : (
                  mySubmittedBids.map((b) => {
                    const targetAuction = auctions.find((a) => a.id === b.auctionId);
                    return (
                      <tr key={b.id}>
                        <td>
                          <b>{b.auctionId}</b>
                          <small style={{ display: 'block', color: 'var(--mut)' }}>
                            {targetAuction?.shipment.pol} → {targetAuction?.shipment.pod}
                          </small>
                        </td>
                        <td>{b.charges[0]?.equipment || '40HC'}</td>
                        <td>
                          <b style={{ color: 'var(--brand)' }}>
                            ${b.grandTotalUSD.toLocaleString()} {b.currency}
                          </b>
                        </td>
                        <td>
                          <span className="badge blue">Rank #{b.rank}</span>
                        </td>
                        <td>
                          <span className="badge green" style={{ fontSize: '10px', fontWeight: 700 }}>FREE (₹0)</span>
                        </td>
                        <td>{b.submittedAt}</td>
                        <td>
                          <span className={`badge ${b.status === 'winning' ? 'green' : 'amber'}`}>
                            {b.status === 'winning' ? 'WINNING OFFER' : b.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {targetAuction && (
                            <button
                              className="btn secondary sm"
                              onClick={() => setSelectedAuctionModal(targetAuction)}
                            >
                              <Eye size={12} /> View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Standard Auctions List View */
        <div className="card">
          <div className="cardhead">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gavel size={16} color="var(--brand)" />
              <b>
                {activeTab === 'overview' && 'All Reverse Auctions'}
                {activeTab === 'live' && 'Live Market Bidding Rooms'}
                {activeTab === 'posted' && 'My Posted Reverse Auctions'}
                {activeTab === 'drafts' && 'Unpublished Draft Auctions'}
                {activeTab === 'results' && 'Awarded Auction Results'}
                {activeTab === 'closed' && 'Closed Reverse Auctions'}
                {activeTab === 'expired' && 'Expired Reverse Auctions'}
              </b>
              <span className="badge blue">{currentTabAuctions().length} Items</span>
            </div>
            <small style={{ color: 'var(--mut)' }}>
              Enterprise reverse auctions are immutable settlement records.
            </small>
          </div>

          <div className="tablewrap flush">
            <table className="table">
              <thead>
                <tr>
                  <th>Auction ID / Title</th>
                  <th>Route (POL → POD)</th>
                  <th>Equipment / Commodity</th>
                  <th>Incoterm</th>
                  <th>Status</th>
                  <th>Bids</th>
                  <th>Closing / Date</th>
                  <th>Posting Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTabAuctions().length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--mut)' }}>
                      No auctions found in this view.
                    </td>
                  </tr>
                ) : (
                  currentTabAuctions().map((auction) => (
                    <tr key={auction.id}>
                      <td>
                        <b style={{ color: 'var(--ink)' }}>{auction.id}</b>
                        <small style={{ display: 'block', color: 'var(--mut)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {auction.title}
                        </small>
                      </td>
                      <td>
                        <b>{auction.shipment.pol.split('(')[0]} → {auction.shipment.pod.split('(')[0]}</b>
                        <small style={{ display: 'block', color: 'var(--mut)' }}>{auction.creatorCompany}</small>
                      </td>
                      <td>
                        <span>{auction.containers.map((c) => `${c.quantity}x ${c.equipmentType}`).join(', ')}</span>
                        <small style={{ display: 'block', color: 'var(--mut)' }}>{auction.shipment.commodity}</small>
                      </td>
                      <td>
                        <span className="badge grey">{auction.shipment.incoterm.split('-')[0].trim()}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            auction.status === 'Live'
                              ? 'green'
                              : auction.status === 'Awarded'
                              ? 'blue'
                              : auction.status === 'Draft'
                              ? 'grey'
                              : auction.status === 'Expired'
                              ? 'amber'
                              : 'red'
                          }`}
                        >
                          {auction.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <b>{auction.bidsSubmittedCount}</b>
                        <small style={{ display: 'block', color: 'var(--mut)' }}>offers</small>
                      </td>
                      <td>
                        {auction.status === 'Live' ? (
                          <span style={{ color: 'var(--red)', fontWeight: 700 }}>
                            <Clock size={10} style={{ verticalAlign: '-1px' }} /> {auction.timeLeft || 'Live'}
                          </span>
                        ) : (
                          <small style={{ color: 'var(--mut)' }}>{auction.startDate}</small>
                        )}
                      </td>
                      <td>
                        <small style={{ color: 'var(--ink-secondary)', fontWeight: 600 }}>
                          ₹{auction.postingFeeINR || 300}
                        </small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn secondary sm"
                            onClick={() => setSelectedAuctionModal(auction)}
                            title="View Audit Record"
                          >
                            <Eye size={12} /> View
                          </button>
                          {auction.status === 'Live' && (
                            <Link href={`/auctions/${auction.id}`} className="btn primary sm">
                              Bid Room
                            </Link>
                          )}
                          {auction.status === 'Draft' && (
                            <Link href="/auctions/create" className="btn primary sm">
                              Resume
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
