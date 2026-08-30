'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/lib/context/DataContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import {
  ArrowLeft,
  Gavel,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Printer,
  Share2,
  AlertTriangle,
  Building2,
  MapPin,
  Anchor,
  Layers,
  FileText,
  DollarSign,
  TrendingDown,
  Activity,
  Award,
  Check,
  Info,
  ChevronRight,
  Shield,
  Box,
  Truck,
  ExternalLink,
  ShieldAlert,
  Maximize2,
  ClipboardList,
  Coins,
  Receipt,
  X,
  FileCheck,
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
  freeDaysOrigin?: number;
  freeDaysDest?: number;
}

export default function BidRoomPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = String(params.id || 'RA-2026-0842');

  const { auctions, submitBid } = useData();
  const { format, availableCurrencies, getRateFromUSD, convertToUSD } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();

  const auction = auctions.find((a) => a.id === auctionId) || auctions[0];

  // Active Tab: console | specs | terms | ledger | docs
  const [activeTab, setActiveTab] = useState<'console' | 'specs' | 'terms' | 'ledger' | 'docs'>('console');

  // Currency & Tax State for Bidding Rate Matrix
  const [biddingCurrency, setBiddingCurrency] = useState<string>('USD');
  const [taxOption, setTaxOption] = useState<'exempt_as_applicable' | 'tax_inclusive'>('exempt_as_applicable');

  // Routing Submission State (Requirement 1)
  const [proposedCarrier, setProposedCarrier] = useState<string>('MSC');
  const [proposedRouting, setProposedRouting] = useState<string>('Direct Port to Port (Suez Express)');
  const [proposedTransitTime, setProposedTransitTime] = useState<string>('24 Days');
  const [proposedVesselDate, setProposedVesselDate] = useState<string>('2026-09-08');

  // Free Time Requirement Submission State (Requirement 1)
  const [offeredOriginFreeDays, setOfferedOriginFreeDays] = useState<number>(14);
  const [offeredDestFreeDays, setOfferedDestFreeDays] = useState<number>(21);
  const [specialFreeTimeRemarks, setSpecialFreeTimeRemarks] = useState<string>(
    '14 Days Origin Demurrage & Detention + 21 Days Destination Combined Free Time included.'
  );

  // Conditions & Information Pop-up Modals State (Requirement 4)
  const [showRfqTermsModal, setShowRfqTermsModal] = useState<boolean>(false);
  const [showMsdsModal, setShowMsdsModal] = useState<boolean>(false);
  const [showDimensionModal, setShowDimensionModal] = useState<boolean>(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);

  // Simulated Live Countdown Timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(3840); // ~1h 4m
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
      freeDaysOrigin: 14,
      freeDaysDest: 21,
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
      freeDaysOrigin: 14,
      freeDaysDest: 21,
    },
  ]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Row total calculation in selected input currency
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

  const grandTotalInputCurrency = chargeRows.reduce((sum, r) => sum + getRowLineTotal(r), 0);

  // Convert total to USD as per live exchange rate (Requirement 1)
  const currentFxRate = getRateFromUSD(biddingCurrency);
  const grandTotalUSD = biddingCurrency === 'USD' ? grandTotalInputCurrency : grandTotalInputCurrency / (currentFxRate || 1);

  // Reverse Auction L1 / L2 / L3 Logic (Requirement 5: L1 is strictly lowest bid)
  const ceiling = auction.competitionCeiling || 2450;
  let calculatedRank = '#1';
  let l1Display = 0;
  let l2Display = 0;
  let l3Display = 0;

  if (grandTotalUSD > 0) {
    if (grandTotalUSD < ceiling) {
      calculatedRank = '#1';
      l1Display = grandTotalUSD;
      l2Display = ceiling;
      l3Display = ceiling + 50;
    } else if (grandTotalUSD === ceiling) {
      calculatedRank = '#1';
      l1Display = grandTotalUSD;
      l2Display = ceiling + 45;
      l3Display = ceiling + 95;
    } else {
      calculatedRank = '#2';
      l1Display = ceiling;
      l2Display = grandTotalUSD;
      l3Display = grandTotalUSD + 55;
    }
  } else {
    calculatedRank = '—';
    l1Display = ceiling - 50;
    l2Display = ceiling;
    l3Display = ceiling + 50;
  }

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
    toast(`Bid of USD $${grandTotalUSD.toFixed(2)} submitted successfully!`);
  };

  const handleExportXLS = () => {
    toast('Reverse auction rate schedule exported to Excel format.');
  };

  const handlePrintRFQ = () => {
    window.print();
  };

  const currSymbol = availableCurrencies[biddingCurrency]?.symbol || '$';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '70px' }}>
      {/* Top Header Navigation */}
      <div className="head" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--ink)' }}>
              <span>{auction.id}</span>
              <span style={{ fontSize: '15px', color: 'var(--mut)', fontWeight: 600 }}>
                · {auction.title}
              </span>
            </h1>
            <span className="badge green" style={{ fontSize: '10.5px', fontWeight: 700 }}>
              <Activity size={11} /> LIVE BIDDING ACTIVE
            </span>
            <span className="badge blue" style={{ fontSize: '10.5px', fontWeight: 700 }}>
              FR8X Reverse Auction Protocol
            </span>
          </div>
          <p style={{ marginTop: '4px', color: 'var(--mut)', fontSize: '12.5px' }}>
            Enterprise Reverse Auction Bid Room · Dynamic Decrement Sourcing with Itemized Cost Matrix.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn secondary" onClick={handleExportXLS} title="Export Bid Schedule to Excel">
            <FileSpreadsheet size={14} /> Export Sheet
          </button>
          <button className="btn secondary" onClick={handlePrintRFQ} title="Print RFQ Dossier">
            <Printer size={14} /> Print Dossier
          </button>
          <Link href="/auctions" className="btn secondary">
            <ArrowLeft size={14} /> Auctions Hub
          </Link>
        </div>
      </div>

      {/* Live Event Control Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Countdown Clock */}
          <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.15)', paddingRight: '20px' }}>
            <small style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} color="#38bdf8" /> Time Remaining in Event
            </small>
            <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8', marginTop: '2px' }}>
              {formatCountdown(timeLeftSeconds)}
            </div>
          </div>

          {/* Sourcing Parameters */}
          <div>
            <small style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
              Procurement Category & Buyer
            </small>
            <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>
              {auction.creatorCompany} · {auction.shipment.shipmentType} Ocean Sourcing
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
              POR/POL: <b>{auction.shipment.por || auction.shipment.pol}</b> → POD: <b>{auction.shipment.pod}</b> · Ready: {auction.shipment.cargoReadyDate}
            </div>
          </div>
        </div>

        {/* Ceiling & Overtime Status */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <small style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Competition Ceiling (Baseline)</small>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
              ${ceiling.toFixed(2)} USD
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '6px 10px', borderRadius: '8px', textAlign: 'center' }}>
            <small style={{ color: '#38bdf8', fontSize: '9px', fontWeight: 800, display: 'block' }}>DYNAMIC OVERTIME</small>
            <span style={{ fontSize: '10.5px', color: '#ffffff', fontWeight: 600 }}>+3m auto-extension active</span>
          </div>
        </div>
      </div>

      {/* Enterprise Tab/Button Navigation (Requirement 3) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          background: '#ffffff',
          padding: '8px 10px',
          borderRadius: '10px',
          border: '1.5px solid var(--line)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        <button
          className={`btn ${activeTab === 'console' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('console')}
          style={{ fontSize: '12px', fontWeight: 700 }}
        >
          <DollarSign size={14} /> Live Bid Console & Cost Matrix
        </button>
        <button
          className={`btn ${activeTab === 'specs' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('specs')}
          style={{ fontSize: '12px', fontWeight: 700 }}
        >
          <Box size={14} /> Technical Specifications & Routing
        </button>
        <button
          className={`btn ${activeTab === 'terms' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('terms')}
          style={{ fontSize: '12px', fontWeight: 700 }}
        >
          <Shield size={14} /> Commercial Terms & SLA Clauses
        </button>
        <button
          className={`btn ${activeTab === 'ledger' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('ledger')}
          style={{ fontSize: '12px', fontWeight: 700 }}
        >
          <Activity size={14} /> Anonymized Market Ledger
        </button>
        <button
          className={`btn ${activeTab === 'docs' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('docs')}
          style={{ fontSize: '12px', fontWeight: 700 }}
        >
          <FileText size={14} /> Document Vault & Compliance
        </button>
      </div>

      {/* TAB 1: LIVE BID CONSOLE & COST MATRIX */}
      {activeTab === 'console' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Title Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase' }}>AUCTION TITLE</span>
            <input className="input" readOnly value={auction.title} style={{ height: '30px', fontSize: '12.5px', background: '#ffffff', fontWeight: 700, color: 'var(--ink)' }} />
          </div>

          {/* Top 5 Information Blocks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {/* Box 1: AUCTION DETAILS */}
            <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', overflow: 'hidden' }}>
              <div style={{ background: '#334155', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '5px 6px', textAlign: 'center', letterSpacing: '0.5px' }}>AUCTION DETAILS</div>
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--ink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>AUCTION ID</span><b>{auction.id} 🔒</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>RFQ / QUERY ID</span><b>{auction.rfqId}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>AUCTION TYPE</span><b>{auction.auctionType}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>AUCTION STATUS</span><b style={{ color: '#15803d' }}>{auction.status}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>CREATED DATE</span><b>{auction.startDate || '2026-08-29'}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>START DATE</span><b>{auction.startDate} 10:00</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>END DATE</span><b>{auction.endDateTime || '2026-08-29 12:00'}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>TIME ZONE</span><b>{auction.timezone || 'Asia/Kolkata'}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>DURATION</span><b>{auction.durationMinutes}m</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>BID VISIBILITY</span><b>{auction.rules?.rankingVisible ? 'Visible' : 'Hidden'}</b></div>
              </div>
            </div>

            {/* Box 2: SHIPMENT DETAILS */}
            <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', overflow: 'hidden' }}>
              <div style={{ background: '#334155', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '5px 6px', textAlign: 'center', letterSpacing: '0.5px' }}>SHIPMENT DETAILS</div>
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--ink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>POR</span><b>{auction.shipment.por || auction.shipment.pol}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>POL</span><b>{auction.shipment.pol}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>POD</span><b>{auction.shipment.pod}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>FINAL DEST</span><b>{auction.shipment.finalDestination || auction.shipment.pod}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>CARGO READY</span><b style={{ color: '#0284c7' }}>{auction.shipment.cargoReadyDate}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>SHIPMENT TYPE</span><b>{auction.shipment.shipmentType}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>MOVEMENT</span><b>Port to Port</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>INCOTERM</span><b>{auction.shipment.incoterm || 'FOB'}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>BL TYPE</span><b>Original BL</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>SERVICE</span><b>CY-CY</b></div>
              </div>
            </div>

            {/* Box 3: CARGO DETAILS */}
            <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', overflow: 'hidden' }}>
              <div style={{ background: '#334155', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '5px 6px', textAlign: 'center', letterSpacing: '0.5px' }}>CARGO DETAILS</div>
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--ink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>COMMODITY</span><b>{auction.shipment.commodity}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>HS CODE</span><b>{auction.shipment.hsCode}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>CARGO TYPE</span><b>General</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>HAZARDOUS</span><b>{auction.shipment.isHazardous ? 'Hazardous' : 'Non-Hazardous'}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>TOTAL WEIGHT</span><b>{((auction.shipment.weightKg || 24000) / 1000).toFixed(1)} MT</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>TOTAL CBM</span><b>{auction.shipment.cbm || 68} CBM</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>PACKAGES</span><b>24 Pallets</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>PACK TYPE</span><b>Euro Pallets</b></div>
              </div>
            </div>

            {/* Box 4: ROUTING REQUIREMENT */}
            <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', overflow: 'hidden' }}>
              <div style={{ background: '#334155', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '5px 6px', textAlign: 'center', letterSpacing: '0.5px' }}>BUYER ROUTING TARGET</div>
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--ink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>TARGET CARRIER</span><b>Tier-1 Lines</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>ROUTING</span><b>Direct Preferred</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>MAX TRANSIT</span><b>≤ 30 Days</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>TRANSSHIPMENT</span><b>Max 1 Hub</b></div>
              </div>
            </div>

            {/* Box 5: FREE TIME REQUIREMENT */}
            <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', overflow: 'hidden' }}>
              <div style={{ background: '#334155', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '5px 6px', textAlign: 'center', letterSpacing: '0.5px' }}>FREE TIME SPECIFICATION</div>
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--ink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>ORIGIN FREE</span><b>14 DAYS COMBINED</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>DEST. FREE</span><b>21 DAYS COMBINED</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>DEMURRAGE CAP</span><b>$75/day after free</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>SETTLEMENT</span><b>Net 45 Days</b></div>
              </div>
            </div>
          </div>

          {/* BIDDER PROPOSAL INPUTS: ROUTING & FREE TIME (Requirement 1) */}
          <div className="card" style={{ padding: '14px 16px', background: '#ffffff', border: '1.5px solid #94a3b8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
              <b style={{ fontSize: '13px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={15} color="var(--brand)" /> 1. Bidder Routing Proposal & Free Time Commitment
              </b>
              <span className="badge green" style={{ fontSize: '10px', fontWeight: 700 }}>Mandatory Bidder Parameters</span>
            </div>

            <div className="grid g4" style={{ gap: '10px' }}>
              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Proposed Ocean Carrier</label>
                <select className="input" value={proposedCarrier} onChange={(e) => setProposedCarrier(e.target.value)} style={{ fontSize: '12px', height: '32px' }}>
                  <option value="MSC">MSC (Mediterranean Shipping Co.)</option>
                  <option value="Maersk">Maersk Line</option>
                  <option value="CMA CGM">CMA CGM</option>
                  <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                  <option value="ONE Line">ONE (Ocean Network Express)</option>
                  <option value="Evergreen">Evergreen Marine</option>
                  <option value="COSCO">COSCO Shipping</option>
                </select>
              </div>

              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Proposed Routing / Transshipment</label>
                <input className="input" value={proposedRouting} onChange={(e) => setProposedRouting(e.target.value)} placeholder="e.g. Direct via Suez / Transshipment via Colombo" style={{ fontSize: '12px', height: '32px' }} />
              </div>

              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Committed Transit Time</label>
                <input className="input" value={proposedTransitTime} onChange={(e) => setProposedTransitTime(e.target.value)} placeholder="e.g. 24 Days" style={{ fontSize: '12px', height: '32px' }} />
              </div>

              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Target Vessel Sailing (ETD)</label>
                <input className="input" type="date" value={proposedVesselDate} onChange={(e) => setProposedVesselDate(e.target.value)} style={{ fontSize: '12px', height: '32px' }} />
              </div>
            </div>

            <div className="grid g3" style={{ gap: '10px', marginTop: '8px' }}>
              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Origin Free Days Offered (Demurrage & Detention)</label>
                <input className="input" type="number" min={0} value={offeredOriginFreeDays} onChange={(e) => setOfferedOriginFreeDays(Number(e.target.value))} style={{ fontSize: '12px', height: '32px' }} />
              </div>

              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Destination Free Days Offered (Combined)</label>
                <input className="input" type="number" min={0} value={offeredDestFreeDays} onChange={(e) => setOfferedDestFreeDays(Number(e.target.value))} style={{ fontSize: '12px', height: '32px' }} />
              </div>

              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Special Detention / Demurrage Remarks</label>
                <input className="input" value={specialFreeTimeRemarks} onChange={(e) => setSpecialFreeTimeRemarks(e.target.value)} placeholder="Free days terms, CFS storage..." style={{ fontSize: '12px', height: '32px' }} />
              </div>
            </div>
          </div>

          {/* Granular Charge Breakdown Table with Currency Selector & Tax Option (Requirement 1) */}
          <div className="card" style={{ border: '1.5px solid #cbd5e1', overflowX: 'auto', background: '#ffffff' }}>
            <div style={{ background: '#0f172a', padding: '8px 14px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <b style={{ fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                2. Bidding Rate Matrix — Enter Component Breakdown
              </b>
              
              {/* Currency & Tax Options Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {/* Currency Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', padding: '3px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                  <Coins size={13} color="#38bdf8" />
                  <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>Input Currency:</span>
                  <select
                    value={biddingCurrency}
                    onChange={(e) => setBiddingCurrency(e.target.value)}
                    style={{ background: '#0f172a', color: '#38bdf8', fontWeight: 800, fontSize: '12px', border: '1px solid #0284c7', borderRadius: '4px', padding: '2px 6px' }}
                  >
                    {Object.keys(availableCurrencies).map((code) => (
                      <option key={code} value={code}>
                        {code} ({availableCurrencies[code]?.symbol}) · {availableCurrencies[code]?.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tax Option */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e293b', padding: '3px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                  <Receipt size={13} color="#34d399" />
                  <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>Tax Option:</span>
                  <select
                    value={taxOption}
                    onChange={(e) => setTaxOption(e.target.value as any)}
                    style={{ background: '#0f172a', color: '#34d399', fontWeight: 700, fontSize: '11.5px', border: '1px solid #059669', borderRadius: '4px', padding: '2px 6px' }}
                  >
                    <option value="exempt_as_applicable">Exempt / As Applicable (GST extra at actuals)</option>
                    <option value="tax_inclusive">Tax Inclusive (All-in rate)</option>
                  </select>
                </div>
              </div>
            </div>

            <table className="table" style={{ fontSize: '11px', borderCollapse: 'collapse', width: '100%', minWidth: '1350px' }}>
              <thead>
                <tr style={{ background: '#334155', color: '#ffffff' }}>
                  <th style={{ padding: '8px 6px', textAlign: 'left', width: '100px' }}>EQUIPMENT</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', width: '90px' }}>CONTAINER</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', width: '45px' }}>QTY</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', background: '#1d4ed8' }}>OCEAN FREIGHT ({biddingCurrency})</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', background: '#1d4ed8' }}>F/S ({biddingCurrency})</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', background: '#0f766e' }}>ORIGIN TRANSPORT</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', background: '#0f766e' }}>ORIGIN CLEARANCE</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', background: '#0f766e' }}>ORIGIN LOCAL</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', background: '#0f766e' }}>ORIGIN ANCILLARY</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', background: '#6b21a8' }}>DEST. TRANSPORT</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', background: '#6b21a8' }}>DEST. CLEARANCE</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', background: '#6b21a8' }}>DEST. LOCAL</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', background: '#6b21a8' }}>DEST. ANCILLARY</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', background: '#1e293b' }}>TOTAL ({biddingCurrency})</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', background: '#0f172a', color: '#38bdf8' }}>TOTAL [USD ($) ▼]</th>
                </tr>
              </thead>
              <tbody>
                {chargeRows.map((r, i) => {
                  const unitTotal = getRowUnitTotal(r);
                  const lineTotal = getRowLineTotal(r);
                  const lineTotalUSD = biddingCurrency === 'USD' ? lineTotal : lineTotal / (currentFxRate || 1);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ background: '#f1f5f9', fontWeight: 700, padding: '6px', color: 'var(--ink)' }}>{r.equipment.split(' (')[0]}</td>
                      <td style={{ background: '#f1f5f9', fontWeight: 600, padding: '6px', color: 'var(--ink)' }}>{r.equipment.split(' (')[0]}</td>
                      <td style={{ background: '#f1f5f9', textAlign: 'center', fontWeight: 800, padding: '6px', color: 'var(--ink)' }}>{r.qty}</td>
                      <td style={{ padding: '4px', background: '#eff6ff' }}>
                        <input type="number" className="input" style={{ height: '28px', fontSize: '11.5px', textAlign: 'right', background: '#fff', border: '1px solid #93c5fd', color: 'var(--ink)', fontWeight: 700 }}
                          value={r.oceanFreight} onChange={(e) => updateCharge(i, 'oceanFreight', Number(e.target.value))} />
                      </td>
                      <td style={{ padding: '4px', background: '#eff6ff' }}>
                        <input type="number" className="input" style={{ height: '28px', fontSize: '11.5px', textAlign: 'right', background: '#fff', border: '1px solid #93c5fd', color: 'var(--ink)', fontWeight: 700 }}
                          value={r.surcharges} onChange={(e) => updateCharge(i, 'surcharges', Number(e.target.value))} />
                      </td>
                      <td style={{ padding: '4px', background: '#f0fdfa' }}>
                        <input type="number" className="input" style={{ height: '28px', fontSize: '11.5px', textAlign: 'right', background: '#fff', border: '1px solid #99f6e4', color: 'var(--ink)' }}
                          value={r.originTransport} onChange={(e) => updateCharge(i, 'originTransport', Number(e.target.value))} />
                      </td>
                      <td style={{ padding: '4px', background: '#f0fdfa' }}>
                        <input type="number" className="input" style={{ height: '28px', fontSize: '11.5px', textAlign: 'right', background: '#fff', border: '1px solid #99f6e4', color: 'var(--ink)' }}
                          value={r.originClearance} onChange={(e) => updateCharge(i, 'originClearance', Number(e.target.value))} />
                      </td>
                      <td style={{ padding: '4px', background: '#f0fdfa' }}>
                        <input type="number" className="input" style={{ height: '28px', fontSize: '11.5px', textAlign: 'right', background: '#fff', border: '1px solid #99f6e4', color: 'var(--ink)' }}
                          value={r.originLocal} onChange={(e) => updateCharge(i, 'originLocal', Number(e.target.value))} />
                      </td>
                      <td style={{ padding: '4px', background: '#f0fdfa' }}>
                        <input type="number" className="input" style={{ height: '28px', fontSize: '11.5px', textAlign: 'right', background: '#fff', border: '1px solid #99f6e4', color: 'var(--ink)' }}
                          value={0} onChange={() => {}} />
                      </td>
                      <td style={{ padding: '4px', background: '#faf5ff' }}>
                        <input type="number" className="input" style={{ height: '28px', fontSize: '11.5px', textAlign: 'right', background: '#fff', border: '1px solid #e9d5ff', color: 'var(--ink)' }}
                          value={r.destTransport} onChange={(e) => updateCharge(i, 'destTransport', Number(e.target.value))} />
                      </td>
                      <td style={{ padding: '4px', background: '#faf5ff' }}>
                        <input type="number" className="input" style={{ height: '28px', fontSize: '11.5px', textAlign: 'right', background: '#fff', border: '1px solid #e9d5ff', color: 'var(--ink)' }}
                          value={r.destClearance} onChange={(e) => updateCharge(i, 'destClearance', Number(e.target.value))} />
                      </td>
                      <td style={{ padding: '4px', background: '#faf5ff' }}>
                        <input type="number" className="input" style={{ height: '28px', fontSize: '11.5px', textAlign: 'right', background: '#fff', border: '1px solid #e9d5ff', color: 'var(--ink)' }}
                          value={r.destLocal} onChange={(e) => updateCharge(i, 'destLocal', Number(e.target.value))} />
                      </td>
                      <td style={{ padding: '4px', background: '#faf5ff' }}>
                        <input type="number" className="input" style={{ height: '28px', fontSize: '11.5px', textAlign: 'right', background: '#fff', border: '1px solid #e9d5ff', color: 'var(--ink)' }}
                          value={0} onChange={() => {}} />
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px', fontWeight: 800, color: 'var(--ink)' }}>
                        {currSymbol}{lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px', fontWeight: 800, color: '#0284c7', fontSize: '12px' }}>
                        ${lineTotalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Grid: Audit + Conditions + Ranks (Lowest Offer L1) + Submission Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr 2.3fr', gap: '12px', alignItems: 'stretch' }}>
            {/* Audit Box */}
            <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', overflow: 'hidden' }}>
              <div style={{ background: '#334155', color: '#fff', fontSize: '10.5px', fontWeight: 800, padding: '5px 8px', textAlign: 'center' }}>AUDIT TRAIL</div>
              <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', color: 'var(--ink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>BIDDER ORG</span><b>{user.company}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>CREATED DATE</span><b>{auction.startDate || '2026-08-29'}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>EMAIL ID</span><b>{user.email}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>CONTACT DESK</span><b>{user.mobile || '+91 98111 22334'}</b></div>
              </div>
            </div>

            {/* Conditions & Information Box with Rich Icon Popups (Requirement 4) */}
            <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '8px', background: '#ffffff', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ background: '#334155', color: '#fff', fontSize: '10.5px', fontWeight: 800, padding: '5px 8px', textAlign: 'center' }}>CONDITIONS &amp; INFORMATION</div>
              <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className="btn secondary sm"
                  style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '6px 8px', color: 'var(--ink)', fontWeight: 600 }}
                  onClick={() => setShowRfqTermsModal(true)}
                >
                  <FileText size={13} color="var(--brand)" /> RFQ Terms
                </button>

                <button
                  type="button"
                  className="btn secondary sm"
                  style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '6px 8px', color: 'var(--ink)', fontWeight: 600 }}
                  onClick={() => setShowMsdsModal(true)}
                >
                  <ShieldAlert size={13} color="var(--red)" /> MSDS Sheet
                </button>

                <button
                  type="button"
                  className="btn secondary sm"
                  style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '6px 8px', color: 'var(--ink)', fontWeight: 600 }}
                  onClick={() => setShowDimensionModal(true)}
                >
                  <Maximize2 size={13} color="var(--teal)" /> Dimension Table
                </button>

                <button
                  type="button"
                  className="btn secondary sm"
                  style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '6px 8px', color: 'var(--ink)', fontWeight: 600 }}
                  onClick={() => setShowInstructionsModal(true)}
                >
                  <ClipboardList size={13} color="#d97706" /> Instructions
                </button>
              </div>

              <div style={{ padding: '0 10px 10px' }}>
                <button
                  className="btn primary sm"
                  style={{ width: '100%', background: '#15803d', borderColor: '#15803d', fontSize: '11.5px', fontWeight: 700 }}
                  onClick={() => toast('RFQ Conditions & Terms accepted.')}
                >
                  <Check size={13} /> ACCEPT ALL CONDITIONS
                </button>
              </div>
            </div>

            {/* Reverse Auction Competition Ceiling L1 / L2 / L3 (Requirement 5) */}
            <div style={{ border: '1.5px solid #86efac', borderRadius: '8px', background: '#f0fdf4', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '10px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', background: '#ffffff', borderRadius: '8px', padding: '8px', border: '1.5px solid #86efac', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <small style={{ fontSize: '9px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>YOUR RANK (LOWEST OFFER)</small>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: calculatedRank === '#1' ? '#15803d' : '#d97706', lineHeight: 1, margin: '4px 0' }}>
                    {calculatedRank}
                  </div>
                  <small style={{ fontSize: '10px', color: 'var(--mut)', fontWeight: 600 }}>Reverse Sourcing</small>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '8px', padding: '10px', border: '1.5px solid #cbd5e1', fontSize: '11px', color: 'var(--ink)' }}>
                  <b style={{ color: '#0f172a', display: 'block', marginBottom: '5px', textTransform: 'uppercase', fontSize: '10.5px' }}>
                    COMPETITION CEILING (REVERSE AUCTION)
                  </b>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#15803d', fontWeight: 700 }}>L1 (Lowest / Best):</span>
                    <b style={{ color: '#15803d' }}>${l1Display.toFixed(2)} USD</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#0284c7', fontWeight: 600 }}>L2 (2nd Lowest):</span>
                    <b>${l2Display.toFixed(2)} USD</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span style={{ color: 'var(--mut)' }}>L3 (3rd Lowest):</span>
                    <b style={{ color: 'var(--mut)' }}>${l3Display.toFixed(2)} USD</b>
                  </div>
                </div>
              </div>

              {/* Total & Submit Action (Requirement 2) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <small style={{ color: 'var(--mut)', fontSize: '10px', display: 'block', fontWeight: 700 }}>TOTAL BID OFFER</small>
                  <b style={{ fontSize: '16px', color: '#0f172a' }}>
                    ${grandTotalUSD.toFixed(2)} USD
                  </b>
                  {biddingCurrency !== 'USD' && (
                    <small style={{ display: 'block', color: 'var(--brand)', fontSize: '10.5px', fontWeight: 600 }}>
                      ({currSymbol}{grandTotalInputCurrency.toLocaleString()} {biddingCurrency} @ {currentFxRate.toFixed(2)})
                    </small>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn secondary" style={{ fontSize: '12px', padding: '7px 14px', fontWeight: 700 }} onClick={() => toast('Edit mode active.')}>
                    EDIT
                  </button>
                  <button className="btn primary" style={{ fontSize: '12px', padding: '7px 18px', fontWeight: 800, background: '#0284c7' }} onClick={() => setShowConfirmModal(true)}>
                    <Gavel size={13} /> Confirm &amp; Submit Bid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL SPECIFICATIONS & ROUTING */}
      {activeTab === 'specs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="grid g2">
            {/* Origin & Port Details */}
            <div className="card cardbody" style={{ background: '#ffffff', border: '1.5px solid var(--line)' }}>
              <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Anchor size={13} color="var(--brand)" /> Origin Logistics & Handover
              </small>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--ink)' }}>
                <div className="kv">
                  <span>Place of Receipt (POR)</span>
                  <b>{auction.shipment.por || 'Nhava Sheva CFS, Maharashtra'}</b>
                </div>
                <div className="kv">
                  <span>Port of Loading (POL)</span>
                  <b>{auction.shipment.pol} (UN/LOCODE: INNSA)</b>
                </div>
                <div className="kv">
                  <span>Stuffing Specification</span>
                  <b>Factory Stuffing (Self-Sealed with RFID Bolt)</b>
                </div>
                <div className="kv">
                  <span>Cargo Ready Date</span>
                  <b style={{ color: 'var(--brand)' }}>{auction.shipment.cargoReadyDate}</b>
                </div>
                <div className="kv">
                  <span>Origin Free Time Required</span>
                  <b>14 Days Detention & Demurrage Combined</b>
                </div>
              </div>
            </div>

            {/* Destination & Delivery */}
            <div className="card cardbody" style={{ background: '#ffffff', border: '1.5px solid var(--line)' }}>
              <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={13} color="var(--teal)" /> Destination Logistics & Discharge
              </small>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--ink)' }}>
                <div className="kv">
                  <span>Port of Discharge (POD)</span>
                  <b>{auction.shipment.pod} (UN/LOCODE: NLRTM)</b>
                </div>
                <div className="kv">
                  <span>Final Place of Delivery (FPOD)</span>
                  <b>{auction.shipment.finalDestination || 'Rotterdam Waalhaven Distribution Hub'}</b>
                </div>
                <div className="kv">
                  <span>Destuffing Requirement</span>
                  <b>Consignee Warehouse Drayage</b>
                </div>
                <div className="kv">
                  <span>Destination Free Time Required</span>
                  <b>21 Days Demurrage & Detention Combined</b>
                </div>
                <div className="kv">
                  <span>BL Type</span>
                  <b>Original Bill of Lading (3/3 Originals required)</b>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo Classification & Dangerous Goods */}
          <div className="card cardbody" style={{ background: '#ffffff', border: '1.5px solid var(--line)' }}>
            <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Cargo Technical Classification & Specifications
            </small>
            <div className="grid g3" style={{ fontSize: '12px', color: 'var(--ink)' }}>
              <div className="kv">
                <span>Commodity Description</span>
                <b>{auction.shipment.commodity}</b>
              </div>
              <div className="kv">
                <span>Harmonized HS Code</span>
                <b style={{ fontFamily: 'var(--font-mono)' }}>{auction.shipment.hsCode}</b>
              </div>
              <div className="kv">
                <span>Total Gross Weight</span>
                <b>{formatNumber(auction.shipment.weightKg)} KG / {((auction.shipment.weightKg || 0) / 1000).toFixed(2)} MT</b>
              </div>
              <div className="kv">
                <span>Total Volume (CBM)</span>
                <b>{auction.shipment.cbm || 68.5} CBM</b>
              </div>
              <div className="kv">
                <span>Hazardous Classification</span>
                <b>Non-Hazardous / General Merchandise</b>
              </div>
              <div className="kv">
                <span>Packaging Method</span>
                <b>Palletized & Shrink-Wrapped (Euro Pallets)</b>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMERCIAL TERMS & SLA CLAUSES */}
      {activeTab === 'terms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card cardbody" style={{ background: '#ffffff', border: '1.5px solid var(--line)' }}>
            <b style={{ fontSize: '15px', color: 'var(--ink)' }}>FR8X Master Reverse Auction SLA Terms</b>
            <p style={{ fontSize: '12.5px', color: 'var(--mut)', marginTop: '2px' }}>
              These terms govern bidder qualification, rate validity, detention penalties, and settlement protocol.
            </p>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <b style={{ fontSize: '13px', color: 'var(--brand)' }}>1. Incoterms & Cost Division (Incoterms 2020)</b>
                <p style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Governed strictly under FOB (Free On Board) terms. The winning service provider is responsible for international ocean carriage, fuel/bunker adjustments (BAF), destination terminal handling charges (DTHC), and destination customs clearance documentation.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <b style={{ fontSize: '13px', color: 'var(--brand)' }}>2. Payment Terms & Currency Pegging</b>
                <p style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Invoices shall be processed in USD ($) payable within <b>Net 45 Days</b> upon receipt of clean on-board Bill of Lading, Verified Gross Mass (VGM) certificate, and approved itemized billing vouchers.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <b style={{ fontSize: '13px', color: 'var(--brand)' }}>3. Demurrage & Detention Free Time SLA</b>
                <p style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  The quoted rate must incorporate a minimum of <b>14 calendar days free time at origin</b> and <b>21 calendar days combined free time at destination</b>. Daily demurrage thereafter is capped at $75/day for 40HC.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <b style={{ fontSize: '13px', color: 'var(--brand)' }}>4. Carrier Nomination Constraints</b>
                <p style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Quotes are restricted to Tier-1 container liner carriers (MSC, Maersk, CMA CGM, Hapag-Lloyd, ONE, Evergreen). Transshipment is permitted with a maximum of 1 hub and total transit time ≤ 32 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANONYMIZED MARKET LEDGER (Requirement 5: Lowest is L1) */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{ background: '#ffffff', border: '1.5px solid var(--line)' }}>
            <div className="cardhead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ color: 'var(--ink)', fontSize: '14px' }}>Real-Time Anonymized Reverse Auction Bidding Stream</b>
                <span className="sub" style={{ display: 'block', fontSize: '11.5px', color: 'var(--mut)' }}>
                  Audited event log with cryptographic timestamps and price decrement history (Lowest bid = Rank #1).
                </span>
              </div>
              <span className="badge green"><Activity size={11} /> Streaming Live</span>
            </div>

            <div className="tablewrap flush">
              <table className="table" style={{ fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th>Timestamp</th>
                    <th>Bidder Alias</th>
                    <th>Total Offer (USD)</th>
                    <th>Rank Position</th>
                    <th>Integrity Verification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#f0fdf4' }}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Just now</td>
                    <td><b>Bidder #804 (You)</b></td>
                    <td style={{ fontWeight: 800, color: 'var(--green)', fontSize: '12.5px' }}>${grandTotalUSD.toFixed(2)} USD</td>
                    <td><span className="badge green">{calculatedRank} {calculatedRank === '#1' ? 'LEADING (L1)' : ''}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--mut)' }}>SHA-256: 7f8a9...b4c2</td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>4 mins ago</td>
                    <td>Bidder #412 (Verified Forwarder)</td>
                    <td style={{ fontWeight: 700 }}>$2,495.00 USD</td>
                    <td><span className="badge blue">L2 (2nd Best)</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--mut)' }}>SHA-256: 3c91a...e11f</td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>12 mins ago</td>
                    <td>Bidder #619 (Verified NVOCC)</td>
                    <td style={{ fontWeight: 700 }}>$2,550.00 USD</td>
                    <td><span className="badge amber">L3 (3rd Best)</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--mut)' }}>SHA-256: 1a88b...d990</td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>45 mins ago</td>
                    <td>Competition Ceiling (Starting Baseline)</td>
                    <td style={{ fontWeight: 700, color: 'var(--mut)' }}>${ceiling.toFixed(2)} USD</td>
                    <td><span className="badge grey">Ceiling</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--mut)' }}>SHA-256: 0b12a...77dd</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DOCUMENT VAULT & COMPLIANCE */}
      {activeTab === 'docs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card cardbody" style={{ background: '#ffffff', border: '1.5px solid var(--line)' }}>
            <b style={{ fontSize: '14px', color: 'var(--ink)' }}>RFQ Document Vault & Regulatory Annexures</b>
            <p style={{ fontSize: '12px', color: 'var(--mut)', marginTop: '2px' }}>
              Download official sourcing documentation, commercial annexures, and packing specifications.
            </p>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} color="var(--brand)" />
                  <div>
                    <b style={{ fontSize: '12.5px', color: 'var(--ink)' }}>RFQ_Specification_Sheet_RA-2026-0842.pdf</b>
                    <span style={{ fontSize: '11px', color: 'var(--mut)', display: 'block' }}>
                      Official Tender Dossier · 2.4 MB · Cryptographically Signed
                    </span>
                  </div>
                </div>
                <button className="btn secondary sm" onClick={() => toast('Downloading RFQ Specification PDF…')}>
                  <Download size={13} /> Download
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileSpreadsheet size={20} color="var(--green)" />
                  <div>
                    <b style={{ fontSize: '12.5px', color: 'var(--ink)' }}>FR8X_Itemized_Bid_Matrix_Template.xlsx</b>
                    <span style={{ fontSize: '11px', color: 'var(--mut)', display: 'block' }}>
                      Standard Excel Rate Matrix with Formula Verification · 480 KB
                    </span>
                  </div>
                </div>
                <button className="btn secondary sm" onClick={() => toast('Downloading Excel Rate Sheet…')}>
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar (Requirement 2) */}
      <div className="actionbar" style={{ background: '#ffffff', borderTop: '1.5px solid var(--line)', padding: '12px 20px' }}>
        <div>
          <small style={{ display: 'block', color: 'var(--ink)', fontSize: '12px' }}>
            Current Competition Ceiling: <b>${ceiling.toFixed(2)} USD</b>
          </small>
          <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
            Bidder identity protected under FR8X verified anonymized sourcing protocol.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <small style={{ color: 'var(--mut)', display: 'block', fontSize: '10px', fontWeight: 700 }}>
              YOUR TOTAL OFFER
            </small>
            <b style={{ fontSize: '18px', color: '#0f172a' }}>
              ${grandTotalUSD.toFixed(2)} USD
            </b>
          </div>
          <button className="btn primary" onClick={() => setShowConfirmModal(true)} style={{ fontSize: '12.5px', padding: '9px 20px', fontWeight: 800 }}>
            <Gavel size={14} /> Confirm &amp; Submit Bid
          </button>
        </div>
      </div>

      {/* Confirmation Modal (Requirement 2) */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm & Submit Bid"
        footer={
          <>
            <button className="btn secondary" onClick={() => setShowConfirmModal(false)}>
              Review Rates
            </button>
            <button className="btn primary" onClick={handleConfirmBid}>
              Confirm &amp; Submit Bid
            </button>
          </>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.5, marginBottom: '12px' }}>
          You are submitting an offer of <b>USD ${grandTotalUSD.toFixed(2)}</b> for Reverse Auction{' '}
          <b>{auction.id}</b> on behalf of <b>{user.company}</b>.
        </p>

        <div className="card cardbody" style={{ background: '#f8fafc', marginBottom: '12px', border: '1px solid var(--line)' }}>
          <div className="kv">
            <span>Auction Title</span>
            <b>{auction.title}</b>
          </div>
          <div className="kv">
            <span>Proposed Routing</span>
            <b>{proposedCarrier} · {proposedRouting} ({proposedTransitTime})</b>
          </div>
          <div className="kv">
            <span>Free Time Committed</span>
            <b>{offeredOriginFreeDays}d Origin / {offeredDestFreeDays}d Dest</b>
          </div>
          <div className="kv">
            <span>Calculated Rank</span>
            <b style={{ color: calculatedRank === '#1' ? 'var(--green)' : 'var(--amber)' }}>
              {calculatedRank} (Against ceiling ${ceiling.toFixed(2)} USD)
            </b>
          </div>
          <div className="kv">
            <span>Participation Fee</span>
            <b>
              <span className="badge green">FREE (₹0 INR)</span>
            </b>
          </div>
          <div className="kv">
            <span>Audit Trail Integrity Hash</span>
            <b style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
              SHA-256-BID-{Date.now()}-AUTH
            </b>
          </div>
        </div>

        <small style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>
          By confirming, your bid becomes an immutable commercial offer recorded in the reverse auction audit registry.
        </small>
      </Modal>

      {/* POPUP MODAL 1: RFQ TERMS (Requirement 4) */}
      <Modal
        isOpen={showRfqTermsModal}
        onClose={() => setShowRfqTermsModal(false)}
        title="RFQ Commercial Terms & Master SLA Clauses"
        maxWidth="720px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
          <div style={{ padding: '10px 14px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', color: '#0369a1' }}>
            <b>Tender Reference: {auction.rfqId} · Auction ID: {auction.id}</b>
          </div>
          <div>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '2px' }}>1. Scope of Work & Incoterm:</b>
            <p>Governed strictly under FOB terms. Service provider responsible for ocean carriage, BAF, DTHC, destination manifest filing, and release of cargo at {auction.shipment.pod}.</p>
          </div>
          <div>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '2px' }}>2. Payment Terms:</b>
            <p>Invoices processed in USD payable Net 45 Days from receipt of clean Bill of Lading, VGM certificate, and signed customs delivery order.</p>
          </div>
          <div>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '2px' }}>3. Free Time SLA:</b>
            <p>Minimum 14 calendar days origin free time and 21 calendar days destination combined demurrage/detention mandatory.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button className="btn primary" onClick={() => setShowRfqTermsModal(false)}>
              Close Terms
            </button>
          </div>
        </div>
      </Modal>

      {/* POPUP MODAL 2: MSDS SHEET (Requirement 4) */}
      <Modal
        isOpen={showMsdsModal}
        onClose={() => setShowMsdsModal(false)}
        title="Material Safety Data Sheet (MSDS) & Hazard Declaration"
        maxWidth="720px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
          <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', color: '#991b1b' }}>
            <b>Commodity Classification: {auction.shipment.commodity} (HS: {auction.shipment.hsCode})</b>
          </div>
          <div className="kv-box" style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}>
            <span>Hazardous Classification</span>
            <b>{auction.shipment.isHazardous ? 'CLASS 3 FLAMMABLE LIQUID' : 'NON-HAZARDOUS (General Merchandise)'}</b>
          </div>
          <div className="kv-box" style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}>
            <span>Flash Point / UN Number</span>
            <b>{auction.shipment.unNumber || 'UN N/A (Standard Non-DG)'}</b>
          </div>
          <div className="kv-box" style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}>
            <span>IMO / IMDG Code Class</span>
            <b>{auction.shipment.imoClass || 'Non-Regulated for Maritime Transport'}</b>
          </div>
          <div className="kv-box" style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}>
            <span>Emergency Spill Response</span>
            <b>Standard dry chemical / CO2 extinguishing procedure. Non-toxic runoff.</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button className="btn primary" onClick={() => setShowMsdsModal(false)}>
              Close MSDS
            </button>
          </div>
        </div>
      </Modal>

      {/* POPUP MODAL 3: DIMENSION TABLE (Requirement 4) */}
      <Modal
        isOpen={showDimensionModal}
        onClose={() => setShowDimensionModal(false)}
        title="Container Dimensions & Cargo Weight Specification"
        maxWidth="760px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th>Container Type</th>
                <th>Qty</th>
                <th>Dimensions (L x W x H)</th>
                <th>Gross Weight</th>
                <th>CBM</th>
                <th>Payload Rating</th>
              </tr>
            </thead>
            <tbody>
              {auction.containers.map((c, i) => (
                <tr key={i}>
                  <td><b>{c.equipmentType}</b> ({c.containerType})</td>
                  <td style={{ textAlign: 'center' }}><b>{c.quantity}</b></td>
                  <td>{c.dimensions || '40ft x 8ft x 9.5ft (12.19m x 2.44m x 2.89m)'}</td>
                  <td><b>{c.grossWeight.toLocaleString()} {c.weightUnit || 'KG'}</b></td>
                  <td>{c.equipmentType === '40HC' ? '76.4 CBM' : '33.2 CBM'}</td>
                  <td><span className="badge green">Certified VGM Ready</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button className="btn primary" onClick={() => setShowDimensionModal(false)}>
              Close Dimensions
            </button>
          </div>
        </div>
      </Modal>

      {/* POPUP MODAL 4: ADDITIONAL INSTRUCTIONS (Requirement 4) */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        title="Special Shipper Instructions & Terminal Protocol"
        maxWidth="720px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
          <div style={{ padding: '10px 14px', background: '#fefce8', borderRadius: '8px', border: '1px solid #fef08a', color: '#854d0e' }}>
            <b>Special Shipper Requirements & Drayage Protocol</b>
          </div>
          <div>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '2px' }}>• Container Stuffing & Sealing:</b>
            <p>Self-sealing with high-security ISO 17712 bolt seals at factory CFS. Photo verification required upon gate-in at JNPT.</p>
          </div>
          <div>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '2px' }}>• Transshipment Notice:</b>
            <p>Direct service preferred. If transshipment via Colombo or Singapore, connecting mother vessel feeder voyage must be pre-confirmed with confirmed slot booking.</p>
          </div>
          <div>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '2px' }}>• Destination Dwell & Release:</b>
            <p>Consignee will arrange direct port drayage at Rotterdam ECT. Delivery order (DO) must be issued electronically within 6 hours of manifest filing.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button className="btn primary" onClick={() => setShowInstructionsModal(false)}>
              Close Instructions
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
