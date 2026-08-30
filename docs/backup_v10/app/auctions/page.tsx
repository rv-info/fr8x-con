'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/context/DataContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ProfileLink } from '@/components/ui/ProfileLink';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import {
  Gavel,
  Plus,
  Search,
  Clock,
  ChevronRight,
  Eye,
  CheckCircle2,
  FileText,
  Building,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Auction } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

export default function AuctionsPage() {
  const { auctions, mySubmittedBids } = useData();
  const { format } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();

  const [liveSearch, setLiveSearch] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');
  const [historyPostedSearch, setHistoryPostedSearch] = useState('');
  const [historyParticipatedSearch, setHistoryParticipatedSearch] = useState('');

  const [selectedAuctionModal, setSelectedAuctionModal] = useState<Auction | null>(null);

  // Filtered lists
  const liveParticipatedAuctions = auctions.filter(
    (a) =>
      a.status === 'Live' &&
      (a.title + ' ' + a.id + ' ' + a.shipment.pol + ' ' + a.shipment.pod)
        .toLowerCase()
        .includes(liveSearch.toLowerCase())
  );

  const generalBiddings = auctions.filter(
    (a) =>
      a.auctionType === 'General bidding' &&
      (a.title + ' ' + a.id + ' ' + a.shipment.pol + ' ' + a.shipment.pod)
        .toLowerCase()
        .includes(generalSearch.toLowerCase())
  );

  const historicalPosted = auctions.filter(
    (a) =>
      a.creatorUid === user.uid &&
      (a.title + ' ' + a.id).toLowerCase().includes(historyPostedSearch.toLowerCase())
  );

  const historicalParticipated = mySubmittedBids.filter((b) =>
    (b.auctionId + ' ' + b.bidderCompany)
      .toLowerCase()
      .includes(historyParticipatedSearch.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="head">
        <div>
          <h1>Auctions Dashboard</h1>
          <p>
            Reverse auctions, live bidding rooms, historical bid snapshots, and real-time outcomes.
          </p>
        </div>
        <div className="actions">
          <Link href="/auctions/create" className="btn primary">
            <Plus size={15} /> Create Reverse Auction
          </Link>
        </div>
      </div>

      {/* Top 5 Metrics */}
      <div className="metrics">
        <div className="metric">
          <small>Auctions Posted</small>
          <b>{auctions.length + 45}</b>
          <span>{auctions.filter((a) => a.status === 'Live').length} currently open</span>
        </div>
        <div className="metric">
          <small>Bids Participated</small>
          <b>{mySubmittedBids.length + 126}</b>
          <span>15 awaiting outcome</span>
        </div>
        <div className="metric">
          <small>Posted · Live</small>
          <b>06</b>
          <span>2 ending today</span>
        </div>
        <div className="metric">
          <small>Participating · Live</small>
          <b>04</b>
          <span>Active now</span>
        </div>
        <div className="metric">
          <small>Win Rate</small>
          <b>31%</b>
          <span>↑ 4.2% vs prior period</span>
        </div>
      </div>

      {/* Row 1: Live Bidding Participated & General Biddings */}
      <div className="grid g2" style={{ marginTop: '14px' }}>
        {/* Live Bidding Participated */}
        <div className="card">
          <div className="cardhead">
            <span>Live Bidding · Participated</span>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ height: '29px', width: '180px', fontSize: '11.5px' }}
                placeholder="Fast search…"
                value={liveSearch}
                onChange={(e) => setLiveSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="tablewrap flush">
            <table className="table">
              <thead>
                <tr>
                  <th>Auction / Lane</th>
                  <th>Rank</th>
                  <th>Time Left</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {liveParticipatedAuctions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--mut)', padding: '16px' }}>
                      No active participated auctions matching query.
                    </td>
                  </tr>
                ) : (
                  liveParticipatedAuctions.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <b style={{ color: 'var(--ink)', display: 'block' }}>{a.title}</b>
                        <small style={{ color: 'var(--mut)', fontFamily: 'var(--font-mono)' }}>
                          {a.id} · {a.shipment.pol.split('(')[0]} → {a.shipment.pod.split('(')[0]}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            a.rank === '#1' ? 'green' : a.rank === '#2' ? 'amber' : 'blue'
                          }`}
                        >
                          {a.rank || 'Evaluating'}
                        </span>
                      </td>
                      <td>
                        <span className="badge green">
                          <Clock size={10} style={{ marginRight: '2px' }} /> {a.timeLeft || 'Live'}
                        </span>
                      </td>
                      <td>
                        <Link href={`/auctions/${a.id}`} className="btn primary sm">
                          Open Bid Room
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* General Biddings (Open to All) */}
        <div className="card">
          <div className="cardhead">
            <span>General Biddings · Open to All</span>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ height: '29px', width: '180px', fontSize: '11.5px' }}
                placeholder="Fast search…"
                value={generalSearch}
                onChange={(e) => setGeneralSearch(e.target.value)}
              />
            </div>
          </div>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {generalBiddings.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--mut)', textAlign: 'center' }}>
                No general biddings currently active.
              </div>
            ) : (
              generalBiddings.map((gb) => (
                <div key={gb.id} className="record">
                  <div>
                    <b style={{ color: 'var(--ink)' }}>{gb.title}</b>
                    <small>
                      {gb.id} · Ceiling: {format(gb.competitionCeiling)} · {gb.shipment.commodity}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn secondary sm"
                      onClick={() => setSelectedAuctionModal(gb)}
                      title="View details"
                    >
                      <Eye size={12} /> View
                    </button>
                    <Link href={`/auctions/${gb.id}`} className="btn primary sm">
                      Participate
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Bid Posted Historical Records & Bid Participated Historical Records */}
      <div className="grid g2" style={{ marginTop: '14px' }}>
        {/* Historical Bid Posted */}
        <div className="card">
          <div className="cardhead">
            <span>Bid Posted · Historical Records</span>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ height: '29px', width: '180px', fontSize: '11.5px' }}
                placeholder="Fast search…"
                value={historyPostedSearch}
                onChange={(e) => setHistoryPostedSearch(e.target.value)}
              />
            </div>
          </div>
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {historicalPosted.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--mut)', textAlign: 'center' }}>
                No historical published reverse auctions found.
              </div>
            ) : (
              historicalPosted.map((h) => (
                <div key={h.id} className="record">
                  <div>
                    <b>{h.id} — {h.title}</b>
                    <small>
                      Created by {h.creatorName} ({h.creatorCompany}) · Status: {h.status}
                    </small>
                  </div>
                  <button
                    className="btn secondary sm"
                    onClick={() => setSelectedAuctionModal(h)}
                  >
                    View Snapshot
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Historical Bid Participated */}
        <div className="card">
          <div className="cardhead">
            <span>Bid Participated · Historical Records</span>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ height: '29px', width: '180px', fontSize: '11.5px' }}
                placeholder="Fast search…"
                value={historyParticipatedSearch}
                onChange={(e) => setHistoryParticipatedSearch(e.target.value)}
              />
            </div>
          </div>
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {historicalParticipated.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--mut)', textAlign: 'center' }}>
                No submitted historical bids recorded yet. Submit a bid in any live bid room.
              </div>
            ) : (
              historicalParticipated.map((b) => (
                <div key={b.id} className="record">
                  <div>
                    <b>{b.auctionId}</b>
                    <small>
                      Grand Total: {format(b.grandTotalUSD)} · Rank: #{b.rank} · Fee Paid: ₹{b.feePaid}
                    </small>
                  </div>
                  <Link href={`/auctions/${b.auctionId}`} className="btn secondary sm">
                    Open Bid Record
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Snapshot Modal for Historical / Active Auction View */}
      {selectedAuctionModal && (
        <Modal
          isOpen={!!selectedAuctionModal}
          onClose={() => setSelectedAuctionModal(null)}
          title={`Auction Snapshot: ${selectedAuctionModal.id} · ${selectedAuctionModal.title}`}
          footer={
            <>
              <button className="btn secondary" onClick={() => setSelectedAuctionModal(null)}>
                Close
              </button>
              <Link
                href={`/auctions/${selectedAuctionModal.id}`}
                className="btn primary"
                onClick={() => setSelectedAuctionModal(null)}
              >
                Go to Live Bid Room
              </Link>
            </>
          }
        >
          <div className="grid g3" style={{ marginBottom: '14px' }}>
            <div className="card cardbody" style={{ background: '#f8fafc' }}>
              <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                Auction Details
              </small>
              <p style={{ fontSize: '12px', margin: '4px 0 0' }}>
                ID: <b>{selectedAuctionModal.id}</b>
              </p>
              <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
                Type: <b>{selectedAuctionModal.auctionType}</b>
              </p>
              <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
                Creator: <ProfileLink name={selectedAuctionModal.creatorName} company={selectedAuctionModal.creatorCompany} />
              </p>
            </div>

            <div className="card cardbody" style={{ background: '#f8fafc' }}>
              <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                Shipment & Lane
              </small>
              <p style={{ fontSize: '12px', margin: '4px 0 0' }}>
                POL: <b>{selectedAuctionModal.shipment.pol}</b>
              </p>
              <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
                POD: <b>{selectedAuctionModal.shipment.pod}</b>
              </p>
              <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
                Incoterm: <b>{selectedAuctionModal.shipment.incoterm}</b>
              </p>
            </div>

            <div className="card cardbody" style={{ background: '#f8fafc' }}>
              <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                Cargo & Ceiling
              </small>
              <p style={{ fontSize: '12px', margin: '4px 0 0' }}>
                Commodity: <b>{selectedAuctionModal.shipment.commodity}</b>
              </p>
              <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
                Gross Weight: <b>{formatNumber(selectedAuctionModal.shipment.weightKg)} KG</b>
              </p>
              <p style={{ fontSize: '12px', margin: '2px 0 0', color: 'var(--brand)' }}>
                Competition Ceiling: <b>{format(selectedAuctionModal.competitionCeiling)}</b>
              </p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="cardhead">Container & Equipment Breakdown</div>
            <div className="tablewrap flush">
              <table className="table">
                <thead>
                  <tr>
                    <th>Equipment Type</th>
                    <th>Container</th>
                    <th>Qty</th>
                    <th>Pickup</th>
                    <th>Empty Return</th>
                    <th>HS Code</th>
                    <th>Gross Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAuctionModal.containers.map((c) => (
                    <tr key={c.id}>
                      <td><b>{c.equipmentType}</b></td>
                      <td>{c.containerType}</td>
                      <td>{c.quantity}</td>
                      <td>{c.pickupLocation || 'Port CFS'}</td>
                      <td>{c.emptyReturnLocation || 'Discharge Port'}</td>
                      <td>{c.hsCode || '—'}</td>
                      <td>{c.grossWeight ? `${formatNumber(c.grossWeight)} KG` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid g2">
            <div className="card cardbody">
              <b style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Origin Charges Scope</b>
              <p style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', margin: '2px 0' }}>
                Transportation: {selectedAuctionModal.originCharges.transportation ? '✓ Required' : '✕ Excluded'}
              </p>
              <p style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', margin: '2px 0' }}>
                Clearance: {selectedAuctionModal.originCharges.clearance ? '✓ Required' : '✕ Excluded'}
              </p>
              {selectedAuctionModal.originCharges.pickupAddress && (
                <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '4px 0 0' }}>
                  Pickup: {selectedAuctionModal.originCharges.pickupAddress}
                </p>
              )}
            </div>

            <div className="card cardbody">
              <b style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Destination Charges Scope</b>
              <p style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', margin: '2px 0' }}>
                Transportation: {selectedAuctionModal.destinationCharges.transportation ? '✓ Required' : '✕ Excluded'}
              </p>
              <p style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', margin: '2px 0' }}>
                Clearance: {selectedAuctionModal.destinationCharges.clearance ? '✓ Required' : '✕ Excluded'}
              </p>
              {selectedAuctionModal.destinationCharges.destuffingAddress && (
                <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '4px 0 0' }}>
                  Destuffing: {selectedAuctionModal.destinationCharges.destuffingAddress}
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
