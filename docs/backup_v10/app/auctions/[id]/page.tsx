'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/lib/context/DataContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  ArrowLeft,
  Gavel,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface ChargeRow {
  equipment: string;
  qty: number;
  oceanFreight: number;
  surcharges: number;
  originTransport: number;
  originClearance: number;
  originLocal: number;
  destTransport: number;
  destClearance: number;
  destLocal: number;
}

export default function BidRoomPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = String(params.id || 'RA-2026-0842');

  const { auctions, submitBid } = useData();
  const { format } = useCurrency();
  const { user, bidPostingFee, bidDiscountPercentage } = useAuth();
  const { toast } = useToast();

  const auction = auctions.find((a) => a.id === auctionId) || auctions[0];

  const [chargeRows, setChargeRows] = useState<ChargeRow[]>([
    {
      equipment: "20' Standard (20DV)",
      qty: 0,
      oceanFreight: 0,
      surcharges: 0,
      originTransport: 0,
      originClearance: 0,
      originLocal: 0,
      destTransport: 0,
      destClearance: 0,
      destLocal: 0,
    },
    {
      equipment: "40' High Cube (40HC)",
      qty: 1,
      oceanFreight: 1450,
      surcharges: 220,
      originTransport: 180,
      originClearance: 90,
      originLocal: 120,
      destTransport: 200,
      destClearance: 95,
      destLocal: 140,
    },
  ]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Row total calculation
  const getRowUnitTotal = (r: ChargeRow) =>
    r.oceanFreight +
    r.surcharges +
    r.originTransport +
    r.originClearance +
    r.originLocal +
    r.destTransport +
    r.destClearance +
    r.destLocal;

  const getRowLineTotal = (r: ChargeRow) => getRowUnitTotal(r) * r.qty;

  const grandTotalUSD = chargeRows.reduce((sum, r) => sum + getRowLineTotal(r), 0);

  // Real-time rank calculation against competition ceiling
  const ceiling = auction.competitionCeiling || 2720;
  const calculatedRank = grandTotalUSD > 0 ? (grandTotalUSD <= ceiling ? '#1' : '#2') : '—';

  const updateCharge = (index: number, field: keyof ChargeRow, value: number) => {
    setChargeRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: Math.max(0, value) };
      return copy;
    });
  };

  const handleConfirmBid = () => {
    if (grandTotalUSD <= 0) {
      toast('Please enter valid positive rate components before submitting.');
      return;
    }
    submitBid(auction.id, chargeRows, grandTotalUSD);
    setShowConfirmModal(false);
  };

  return (
    <div>
      {/* Head */}
      <div className="head">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{auction.id}</span>
            <span style={{ fontSize: '15px', color: 'var(--mut)', fontWeight: 500 }}>
              · {auction.auctionType} Bid Room
            </span>
          </h1>
          <p>
            Complete immutable shipment specifications, rate build-up, and real-time rank computation.
          </p>
        </div>
        <Link href="/auctions" className="btn secondary">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      {/* Transparent Fee Banner */}
      <div className="fee">
        <div>
          <b style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Bid Posting Charge
            {user.hasGoldenTick && (
              <span className="badge amber" style={{ fontSize: '9.5px' }}>
                <Sparkles size={11} /> 40% Premium Discount Applied
              </span>
            )}
          </b>
          <p>
            Standard bid fee is ₹300.00 incl. GST. Verified Premium accounts enjoy a 40% discount (₹180.00 incl. GST).
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <b style={{ fontSize: '18px', color: 'var(--brand)' }}>
            ₹{bidPostingFee}.00 <small style={{ fontSize: '11px', color: 'var(--mut)' }}>incl. GST</small>
          </b>
        </div>
      </div>

      {/* 4 Metadata Cards */}
      <div className="grid g4" style={{ marginBottom: '14px' }}>
        <div className="card cardbody">
          <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
            Auction Parameters
          </small>
          <p style={{ fontSize: '12px', margin: '4px 0 0' }}>
            ID: <b>{auction.id}</b>
          </p>
          <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
            Status:{' '}
            <span className="badge green" style={{ fontSize: '9.5px' }}>
              {auction.status}
            </span>
          </p>
          <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
            Type: <b>{auction.auctionType}</b>
          </p>
        </div>

        <div className="card cardbody">
          <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
            Trade Lane & Schedule
          </small>
          <p style={{ fontSize: '12px', margin: '4px 0 0' }}>
            POL: <b>{auction.shipment.pol.split('(')[0]}</b>
          </p>
          <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
            POD: <b>{auction.shipment.pod.split('(')[0]}</b>
          </p>
          <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
            Ready Date: <b>{auction.shipment.cargoReadyDate}</b>
          </p>
        </div>

        <div className="card cardbody">
          <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
            Cargo & Classification
          </small>
          <p style={{ fontSize: '12px', margin: '4px 0 0' }}>
            Commodity: <b>{auction.shipment.commodity}</b>
          </p>
          <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
            HS Code: <b>{auction.shipment.hsCode}</b>
          </p>
          <p style={{ fontSize: '12px', margin: '2px 0 0' }}>
            Gross Weight: <b>{formatNumber(auction.shipment.weightKg)} KG</b>
          </p>
        </div>

        <div className="card rank" style={{ background: '#f8fafc' }}>
          <b style={{ color: calculatedRank === '#1' ? 'var(--teal)' : 'var(--amber)' }}>
            {calculatedRank}
          </b>
          <small>Your Real-Time Rank · Lowest Offer</small>
          <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '4px 0 0' }}>
            Competition Ceiling: {format(ceiling)}
          </p>
        </div>
      </div>

      {/* Granular Charge Breakdown Table */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="cardhead">
          <span>Itemized Rate Build-Up (Editable Rate Components)</span>
          <span className="sub">Currency: USD ($)</span>
        </div>
        <div className="tablewrap flush">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Equipment</th>
                <th style={{ width: '60px' }}>Qty</th>
                <th>Ocean Freight</th>
                <th>F/S</th>
                <th>Origin Transport</th>
                <th>Origin Clear</th>
                <th>Origin Local</th>
                <th>Dest Transport</th>
                <th>Dest Clear</th>
                <th>Dest Local</th>
                <th>Total Rate</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {chargeRows.map((r, i) => {
                const unitTotal = getRowUnitTotal(r);
                const lineTotal = getRowLineTotal(r);

                return (
                  <tr key={i}>
                    <td>
                      <b>{r.equipment}</b>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ height: '28px', padding: '0 5px' }}
                        min="0"
                        value={r.qty}
                        onChange={(e) => updateCharge(i, 'qty', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ height: '28px', padding: '0 5px' }}
                        min="0"
                        value={r.oceanFreight}
                        onChange={(e) => updateCharge(i, 'oceanFreight', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ height: '28px', padding: '0 5px' }}
                        min="0"
                        value={r.surcharges}
                        onChange={(e) => updateCharge(i, 'surcharges', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ height: '28px', padding: '0 5px' }}
                        min="0"
                        value={r.originTransport}
                        onChange={(e) => updateCharge(i, 'originTransport', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ height: '28px', padding: '0 5px' }}
                        min="0"
                        value={r.originClearance}
                        onChange={(e) => updateCharge(i, 'originClearance', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ height: '28px', padding: '0 5px' }}
                        min="0"
                        value={r.originLocal}
                        onChange={(e) => updateCharge(i, 'originLocal', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ height: '28px', padding: '0 5px' }}
                        min="0"
                        value={r.destTransport}
                        onChange={(e) => updateCharge(i, 'destTransport', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ height: '28px', padding: '0 5px' }}
                        min="0"
                        value={r.destClearance}
                        onChange={(e) => updateCharge(i, 'destClearance', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ height: '28px', padding: '0 5px' }}
                        min="0"
                        value={r.destLocal}
                        onChange={(e) => updateCharge(i, 'destLocal', Number(e.target.value))}
                      />
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--brand)' }}>
                      ${unitTotal.toFixed(2)}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      ${lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="actionbar">
        <div>
          <small style={{ display: 'block' }}>
            Current Competition Ceiling: <b>{format(ceiling)}</b>
          </small>
          <span style={{ fontSize: '10.5px', color: 'var(--mut)' }}>
            Bidder identity is protected under anonymized auction protocol.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <small style={{ color: 'var(--mut)', display: 'block', fontSize: '10px' }}>
              YOUR TOTAL OFFER
            </small>
            <b style={{ fontSize: '18px', color: 'var(--ink)' }}>
              USD ${grandTotalUSD.toFixed(2)}
            </b>
          </div>
          <button className="btn primary" onClick={() => setShowConfirmModal(true)}>
            <Gavel size={14} /> Submit Bid · ₹{bidPostingFee} incl. GST
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Reverse Auction Bid Submission"
        footer={
          <>
            <button className="btn secondary" onClick={() => setShowConfirmModal(false)}>
              Review Rates
            </button>
            <button className="btn primary" onClick={handleConfirmBid}>
              Authorize ₹{bidPostingFee} & Submit
            </button>
          </>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.5, marginBottom: '12px' }}>
          You are submitting an offer of <b>USD ${grandTotalUSD.toFixed(2)}</b> for Reverse Auction{' '}
          <b>{auction.id}</b> on behalf of <b>{user.company}</b>.
        </p>

        <div className="card cardbody" style={{ background: '#f8fafc', marginBottom: '12px' }}>
          <div className="kv">
            <span>Auction Title</span>
            <b>{auction.title}</b>
          </div>
          <div className="kv">
            <span>Calculated Rank</span>
            <b style={{ color: calculatedRank === '#1' ? 'var(--green)' : 'var(--amber)' }}>
              {calculatedRank} (Against ceiling ${ceiling})
            </b>
          </div>
          <div className="kv">
            <span>Applicable Posting Fee</span>
            <b>
              ₹{bidPostingFee}.00 incl. GST{' '}
              {user.hasGoldenTick && <span className="badge amber">40% Off</span>}
            </b>
          </div>
          <div className="kv">
            <span>Audit Trail</span>
            <b style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
              AUDIT-BID-{Date.now()}
            </b>
          </div>
        </div>

        <small style={{ color: 'var(--mut)', fontSize: '10.5px', display: 'block' }}>
          By confirming, your bid becomes an immutable commercial offer recorded in the reverse auction audit registry.
        </small>
      </Modal>
    </div>
  );
}
