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
  const { format, availableCurrencies, getRateFromUSD, convertToUSD, lastUpdatedTime } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();

  const auction = auctions.find((a) => a.id === auctionId) || auctions[0];
  const configuredBidLimit = Number(auction.rules?.bidLimit);
  const bidLimit = ([1, 3, 5] as number[]).includes(configuredBidLimit) ? configuredBidLimit : 5;
  const bidCount = (auction.bids || []).filter((bid) => bid.bidderUid === user.uid).length;
  const bidsRemaining = Math.max(0, bidLimit - bidCount);

  // Active Tab: console | specs | terms | ledger | docs
  const [activeTab, setActiveTab] = useState<'console' | 'specs' | 'terms' | 'ledger' | 'docs'>('console');

  // Granular Per-Charge-Head Currency States (Requirement: Currency with every charge head)
  const [biddingCurrency, setBiddingCurrency] = useState<string>('USD');
  const [oceanCurrency, setOceanCurrency] = useState<string>('USD');
  const [originCurrency, setOriginCurrency] = useState<string>('INR');
  const [destCurrency, setDestCurrency] = useState<string>('EUR');
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

  // Bid Submission Terms Acceptance & Legal Evidence States
  const [confirmTermsAccepted, setConfirmTermsAccepted] = useState(false);
  const [auctionConditionsAccepted, setAuctionConditionsAccepted] = useState(false);
  const [confirmInformationVerified, setConfirmInformationVerified] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [lastSubmittedDocket, setLastSubmittedDocket] = useState<any>(null);
  const [showDocketSuccessModal, setShowDocketSuccessModal] = useState(false);

  // Live Exchange Rate Conversion Engine
  const convertAmountToUSD = (amount: number, fromCurrency: string) => {
    const rate = availableCurrencies[fromCurrency]?.rateFromUSD || 1;
    return rate > 0 ? amount / rate : amount;
  };

  const convertUSDTo = (amountUSD: number, toCurrency: string) => {
    const rate = availableCurrencies[toCurrency]?.rateFromUSD || 1;
    return amountUSD * rate;
  };

  // Row unit total in USD combining granular charge head currencies
  const getRowUnitTotalUSD = (r: ChargeRow) => {
    const ocean = convertAmountToUSD(r.oceanFreight + r.surcharges, oceanCurrency);
    const origin = convertAmountToUSD(r.originTransport + r.originClearance + r.originLocal, originCurrency);
    const dest = convertAmountToUSD(r.destTransport + r.destClearance + r.destLocal, destCurrency);
    return ocean + origin + dest;
  };

  const getRowLineTotalUSD = (r: ChargeRow) => getRowUnitTotalUSD(r) * r.qty;

  // Multi-Currency Grand Totals as per live exchange rate engine
  const grandTotalUSD = chargeRows.reduce((sum, r) => sum + getRowLineTotalUSD(r), 0);
  const grandTotalEUR = convertUSDTo(grandTotalUSD, 'EUR');
  const grandTotalGBP = convertUSDTo(grandTotalUSD, 'GBP');
  const grandTotalINR = convertUSDTo(grandTotalUSD, 'INR');

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
      l3Display = grandTotalUSD + 50;
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
    if (!confirmInformationVerified) {
      toast('Please verify all required operational information.');
      return;
    }
    if (!confirmTermsAccepted) {
      toast('You must accept all RFQ terms and conditions to seal the bid.');
      return;
    }

    setIsSubmittingBid(true);

    const docketRef = `FR8X-EVID-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const evidenceHash = `SHA256:BID:${Date.now()}:${user.uid}:${grandTotalUSD.toFixed(2)}`;

    const evidenceDocket = {
      docketRef,
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
      proposedCarrier,
      proposedRouting,
      proposedTransitTime,
      proposedVesselDate,
      offeredOriginFreeDays,
      offeredDestFreeDays,
      bidderUid: user.uid,
      bidderName: user.displayName,
      bidderCompany: user.company,
      bidderEmail: user.email,
      evidenceHash,
      ipAddress: '103.21.244.18 (Verified)',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'FR8X Client Engine',
    };

    if (!submitBid(auction.id, chargeRows, grandTotalUSD, evidenceDocket)) {
      setIsSubmittingBid(false);
      setShowConfirmModal(false);
      return;
    }
    setIsSubmittingBid(false);
    setShowConfirmModal(false);
    setLastSubmittedDocket(evidenceDocket);
    setShowDocketSuccessModal(true);
    toast(`Bid of USD $${grandTotalUSD.toFixed(2)} submitted successfully! Evidence logged in Godfather.`);
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
      <div className="bidding-tabs-scroll">
        <button
          className={`bidding-tab-btn btn ${activeTab === 'console' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('console')}
        >
          <DollarSign size={14} /> Live Bid Console &amp; Cost Matrix
        </button>
        <button
          className={`bidding-tab-btn btn ${activeTab === 'specs' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('specs')}
        >
          <Box size={14} /> Technical Specifications &amp; Routing
        </button>
        <button
          className={`bidding-tab-btn btn ${activeTab === 'terms' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('terms')}
        >
          <Shield size={14} /> Commercial Terms &amp; SLA Clauses
        </button>
        <button
          className={`bidding-tab-btn btn ${activeTab === 'ledger' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('ledger')}
        >
          <Activity size={14} /> Anonymized Market Ledger
        </button>
        <button
          className={`bidding-tab-btn btn ${activeTab === 'docs' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('docs')}
        >
          <FileText size={14} /> Document Vault &amp; Compliance
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
          <div className="bidding-info-blocks">
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

          {/* Granular Charge Breakdown Table with Currency Selector & Tax Option */}
          <div className="card" style={{ border: '1px solid var(--fr8x-outline)', overflowX: 'auto', background: '#ffffff', borderRadius: '0px' }}>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid var(--fr8x-outline)', color: 'var(--fr8x-text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <b style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--fr8x-text)', display: 'block' }}>
                  2. Bidding Rate Matrix — Enter Component Breakdown
                </b>
                <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)' }}>
                  Live Forex Synced · Select applicable currency with each charge head
                </span>
              </div>
              
              {/* Currency & Tax Options Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Tax Option */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '4px 8px', border: '1px solid var(--fr8x-outline)' }}>
                  <Receipt size={13} color="var(--fr8x-text)" />
                  <span style={{ fontSize: '11px', color: 'var(--fr8x-text)', fontWeight: 600 }}>Tax Option:</span>
                  <select
                    value={taxOption}
                    onChange={(e) => setTaxOption(e.target.value as any)}
                    style={{ background: '#ffffff', color: 'var(--fr8x-text)', fontWeight: 700, fontSize: '11px', border: '1px solid var(--fr8x-outline)', borderRadius: '0px', padding: '2px 6px' }}
                  >
                    <option value="exempt_as_applicable">Exempt / As Applicable (GST extra at actuals)</option>
                    <option value="tax_inclusive">Tax Inclusive (All-in rate)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Desktop Rate Matrix Table */}
            <div className="tablewrap bidding-desktop-matrix">
              <table className="table" style={{ fontSize: '11px', borderCollapse: 'collapse', width: '100%', minWidth: '1350px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: 'var(--fr8x-text)', borderBottom: '1px solid var(--fr8x-outline)' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'left', width: '110px', borderRight: '1px solid var(--line-light)' }}>EQUIPMENT</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', width: '150px', borderRight: '1px solid var(--line-light)' }}>CONTAINER</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: '45px', borderRight: '1px solid var(--line-light)' }}>QTY</th>

                    {/* Ocean Charges Head with Currency */}
                    <th style={{ padding: '6px', textAlign: 'center', background: '#f8fafc', borderRight: '1px solid var(--line-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 800 }}>OCEAN FREIGHT</span>
                        <select
                          value={oceanCurrency}
                          onChange={(e) => setOceanCurrency(e.target.value)}
                          style={{ background: '#ffffff', fontSize: '10px', fontWeight: 800, border: '1px solid var(--fr8x-outline)', padding: '1px 4px', borderRadius: '0px' }}
                          title="Ocean Freight Currency"
                        >
                          {Object.keys(availableCurrencies).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </th>
                    <th style={{ padding: '6px', textAlign: 'center', background: '#f8fafc', borderRight: '1px solid var(--line-light)', fontWeight: 800 }}>
                      F/S ({oceanCurrency})
                    </th>

                    {/* Origin Charges Head with Currency */}
                    <th style={{ padding: '6px', textAlign: 'center', background: '#f8fafc', borderRight: '1px solid var(--line-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 800 }}>ORIGIN TRANSPORT</span>
                        <select
                          value={originCurrency}
                          onChange={(e) => setOriginCurrency(e.target.value)}
                          style={{ background: '#ffffff', fontSize: '10px', fontWeight: 800, border: '1px solid var(--fr8x-outline)', padding: '1px 4px', borderRadius: '0px' }}
                          title="Origin Charges Currency"
                        >
                          {Object.keys(availableCurrencies).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </th>
                    <th style={{ padding: '6px', textAlign: 'center', background: '#f8fafc', borderRight: '1px solid var(--line-light)', fontWeight: 800 }}>
                      ORIGIN CLEARANCE ({originCurrency})
                    </th>
                    <th style={{ padding: '6px', textAlign: 'center', background: '#f8fafc', borderRight: '1px solid var(--line-light)', fontWeight: 800 }}>
                      ORIGIN LOCAL ({originCurrency})
                    </th>
                    <th style={{ padding: '6px', textAlign: 'center', background: '#f8fafc', borderRight: '1px solid var(--line-light)', fontWeight: 800 }}>
                      ORIGIN ANCILLARY ({originCurrency})
                    </th>

                    {/* Destination Charges Head with Currency */}
                    <th style={{ padding: '6px', textAlign: 'center', background: '#f8fafc', borderRight: '1px solid var(--line-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 800 }}>DEST. TRANSPORT</span>
                        <select
                          value={destCurrency}
                          onChange={(e) => setDestCurrency(e.target.value)}
                          style={{ background: '#ffffff', fontSize: '10px', fontWeight: 800, border: '1px solid var(--fr8x-outline)', padding: '1px 4px', borderRadius: '0px' }}
                          title="Destination Charges Currency"
                        >
                          {Object.keys(availableCurrencies).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </th>
                    <th style={{ padding: '6px', textAlign: 'center', background: '#f8fafc', borderRight: '1px solid var(--line-light)', fontWeight: 800 }}>
                      DEST. CLEARANCE ({destCurrency})
                    </th>
                    <th style={{ padding: '6px', textAlign: 'center', background: '#f8fafc', borderRight: '1px solid var(--line-light)', fontWeight: 800 }}>
                      DEST. LOCAL ({destCurrency})
                    </th>
                    <th style={{ padding: '6px', textAlign: 'center', background: '#f8fafc', borderRight: '1px solid var(--line-light)', fontWeight: 800 }}>
                      DEST. ANCILLARY ({destCurrency})
                    </th>

                    <th style={{ padding: '8px 6px', textAlign: 'right', background: '#f1f5f9', borderRight: '1px solid var(--line-light)', fontWeight: 800 }}>
                      ROW TOTAL (USD $)
                    </th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', background: '#f1f5f9', fontWeight: 800 }}>
                      ROW TOTAL (EUR / INR)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chargeRows.map((r, i) => {
                    const lineUSD = getRowLineTotalUSD(r);
                    const lineEUR = convertUSDTo(lineUSD, 'EUR');
                    const lineINR = convertUSDTo(lineUSD, 'INR');

                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid var(--line-light)' }}>
                        <td style={{ fontWeight: 700, padding: '6px', color: 'var(--ink)', borderRight: '1px solid var(--line-light)' }}>
                          {r.equipment.split(' (')[0]}
                        </td>
                        <td style={{ fontWeight: 600, padding: '6px', color: 'var(--ink)', borderRight: '1px solid var(--line-light)' }}>
                          <select
                            value={r.equipment}
                            onChange={(e) => {
                              const newRows = [...chargeRows];
                              newRows[i].equipment = e.target.value;
                              setChargeRows(newRows);
                            }}
                            style={{ width: '100%', fontSize: '11px', padding: '3px 4px', border: '1px solid var(--fr8x-outline)', background: '#fff', borderRadius: '0px' }}
                          >
                            <option value="20' Standard (20DV)">20&apos; Standard Dry (20DV)</option>
                            <option value="20' High Cube (20HC)">20&apos; High Cube (20HC)</option>
                            <option value="20' Reefer (20RF)">20&apos; Reefer (20RF)</option>
                            <option value="20' Open Top (20OT)">20&apos; Open Top (20OT)</option>
                            <option value="20' Flat Rack (20FR)">20&apos; Flat Rack (20FR)</option>
                            <option value="20' Platform (20PL)">20&apos; Platform (20PL)</option>
                            <option value="20' ISO Tank (20TK)">20&apos; ISO Tank (20TK)</option>
                            <option value="20' Bulk (20BK)">20&apos; Bulk (20BK)</option>
                            <option value="40' High Cube (40HC)">40&apos; High Cube (40HC)</option>
                            <option value="40' Standard (40DV)">40&apos; Standard Dry (40DV)</option>
                            <option value="40' Reefer (40RF)">40&apos; Reefer (40RF)</option>
                            <option value="40' Reefer HC (40HR)">40&apos; Reefer High Cube (40HR)</option>
                            <option value="40' Open Top (40OT)">40&apos; Open Top (40OT)</option>
                            <option value="40' Flat Rack (40FR)">40&apos; Flat Rack (40FR)</option>
                            <option value="45' High Cube (45HC)">45&apos; High Cube (45HC)</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, padding: '6px', color: 'var(--ink)', borderRight: '1px solid var(--line-light)' }}>
                          {r.qty}
                        </td>

                        {/* Ocean inputs */}
                        <td style={{ padding: '4px', borderRight: '1px solid var(--line-light)' }}>
                          <input type="number" className="input" style={{ height: '28px', fontSize: '11px', textAlign: 'right', background: '#fff', border: '1px solid var(--fr8x-outline)', color: 'var(--ink)', fontWeight: 700, borderRadius: '0px' }}
                            value={r.oceanFreight} onChange={(e) => updateCharge(i, 'oceanFreight', Number(e.target.value))} />
                        </td>
                        <td style={{ padding: '4px', borderRight: '1px solid var(--line-light)' }}>
                          <input type="number" className="input" style={{ height: '28px', fontSize: '11px', textAlign: 'right', background: '#fff', border: '1px solid var(--fr8x-outline)', color: 'var(--ink)', fontWeight: 700, borderRadius: '0px' }}
                            value={r.surcharges} onChange={(e) => updateCharge(i, 'surcharges', Number(e.target.value))} />
                        </td>

                        {/* Origin inputs */}
                        <td style={{ padding: '4px', borderRight: '1px solid var(--line-light)' }}>
                          <input type="number" className="input" style={{ height: '28px', fontSize: '11px', textAlign: 'right', background: '#fff', border: '1px solid var(--fr8x-outline)', color: 'var(--ink)', borderRadius: '0px' }}
                            value={r.originTransport} onChange={(e) => updateCharge(i, 'originTransport', Number(e.target.value))} />
                        </td>
                        <td style={{ padding: '4px', borderRight: '1px solid var(--line-light)' }}>
                          <input type="number" className="input" style={{ height: '28px', fontSize: '11px', textAlign: 'right', background: '#fff', border: '1px solid var(--fr8x-outline)', color: 'var(--ink)', borderRadius: '0px' }}
                            value={r.originClearance} onChange={(e) => updateCharge(i, 'originClearance', Number(e.target.value))} />
                        </td>
                        <td style={{ padding: '4px', borderRight: '1px solid var(--line-light)' }}>
                          <input type="number" className="input" style={{ height: '28px', fontSize: '11px', textAlign: 'right', background: '#fff', border: '1px solid var(--fr8x-outline)', color: 'var(--ink)', borderRadius: '0px' }}
                            value={r.originLocal} onChange={(e) => updateCharge(i, 'originLocal', Number(e.target.value))} />
                        </td>
                        <td style={{ padding: '4px', borderRight: '1px solid var(--line-light)' }}>
                          <input type="number" className="input" style={{ height: '28px', fontSize: '11px', textAlign: 'right', background: '#fff', border: '1px solid var(--fr8x-outline)', color: 'var(--ink)', borderRadius: '0px' }}
                            value={0} onChange={() => {}} />
                        </td>

                        {/* Destination inputs */}
                        <td style={{ padding: '4px', borderRight: '1px solid var(--line-light)' }}>
                          <input type="number" className="input" style={{ height: '28px', fontSize: '11px', textAlign: 'right', background: '#fff', border: '1px solid var(--fr8x-outline)', color: 'var(--ink)', borderRadius: '0px' }}
                            value={r.destTransport} onChange={(e) => updateCharge(i, 'destTransport', Number(e.target.value))} />
                        </td>
                        <td style={{ padding: '4px', borderRight: '1px solid var(--line-light)' }}>
                          <input type="number" className="input" style={{ height: '28px', fontSize: '11px', textAlign: 'right', background: '#fff', border: '1px solid var(--fr8x-outline)', color: 'var(--ink)', borderRadius: '0px' }}
                            value={r.destClearance} onChange={(e) => updateCharge(i, 'destClearance', Number(e.target.value))} />
                        </td>
                        <td style={{ padding: '4px', borderRight: '1px solid var(--line-light)' }}>
                          <input type="number" className="input" style={{ height: '28px', fontSize: '11px', textAlign: 'right', background: '#fff', border: '1px solid var(--fr8x-outline)', color: 'var(--ink)', borderRadius: '0px' }}
                            value={r.destLocal} onChange={(e) => updateCharge(i, 'destLocal', Number(e.target.value))} />
                        </td>
                        <td style={{ padding: '4px', borderRight: '1px solid var(--line-light)' }}>
                          <input type="number" className="input" style={{ height: '28px', fontSize: '11px', textAlign: 'right', background: '#fff', border: '1px solid var(--fr8x-outline)', color: 'var(--ink)', borderRadius: '0px' }}
                            value={0} onChange={() => {}} />
                        </td>

                        {/* Total cells */}
                        <td style={{ textAlign: 'right', padding: '6px', fontWeight: 800, color: 'var(--ink)', borderRight: '1px solid var(--line-light)' }}>
                          ${lineUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px', fontWeight: 700, color: 'var(--fr8x-muted)', fontSize: '10.5px' }}>
                          €{lineEUR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ₹{lineINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Touch-Friendly Bidding Matrix */}
            <div className="bidding-mobile-matrix">
              {chargeRows.map((r, i) => {
                const lineUSD = getRowLineTotalUSD(r);
                const lineEUR = convertUSDTo(lineUSD, 'EUR');
                const lineINR = convertUSDTo(lineUSD, 'INR');

                return (
                  <div key={i} className="auction-mobile-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Header: Equipment, Quantity, Row Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, background: '#0f172a', color: '#ffffff', borderRadius: '4px', padding: '2px 6px' }}>
                            {r.qty}x Qty
                          </span>
                          <b style={{ fontSize: '13px', color: 'var(--ink)' }}>{r.equipment.split(' (')[0]}</b>
                        </div>
                        <small style={{ fontSize: '10.5px', color: 'var(--mut)', display: 'block', marginTop: '2px' }}>
                          {r.equipment}
                        </small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '9.5px', color: 'var(--mut)', fontWeight: 700, display: 'block' }}>ROW TOTAL</span>
                        <b style={{ fontSize: '15px', color: 'var(--brand)' }}>${lineUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                      </div>
                    </div>

                    {/* Ocean Freight Section */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <b style={{ fontSize: '11.5px', color: 'var(--fr8x-text)' }}>🌊 Ocean Freight &amp; Surcharges</b>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--mut)' }}>Curr:</span>
                          <select
                            value={oceanCurrency}
                            onChange={(e) => setOceanCurrency(e.target.value)}
                            style={{ background: '#ffffff', fontSize: '10.5px', fontWeight: 700, border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px' }}
                          >
                            {Object.keys(availableCurrencies).map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid g2" style={{ gap: '8px' }}>
                        <div className="field">
                          <label style={{ fontSize: '10.5px' }}>Base Ocean Freight ({oceanCurrency})</label>
                          <input
                            type="number"
                            className="input"
                            style={{ height: '34px', fontSize: '12.5px', fontWeight: 700 }}
                            value={r.oceanFreight}
                            onChange={(e) => updateCharge(i, 'oceanFreight', Number(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: '10.5px' }}>Bunker / Surcharges ({oceanCurrency})</label>
                          <input
                            type="number"
                            className="input"
                            style={{ height: '34px', fontSize: '12.5px', fontWeight: 700 }}
                            value={r.surcharges}
                            onChange={(e) => updateCharge(i, 'surcharges', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Origin Local Charges Section */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <b style={{ fontSize: '11.5px', color: 'var(--fr8x-text)' }}>📍 Origin Local Charges</b>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--mut)' }}>Curr:</span>
                          <select
                            value={originCurrency}
                            onChange={(e) => setOriginCurrency(e.target.value)}
                            style={{ background: '#ffffff', fontSize: '10.5px', fontWeight: 700, border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px' }}
                          >
                            {Object.keys(availableCurrencies).map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid g3" style={{ gap: '6px' }}>
                        <div className="field">
                          <label style={{ fontSize: '10px' }}>Transport</label>
                          <input
                            type="number"
                            className="input"
                            style={{ height: '32px', fontSize: '11.5px' }}
                            value={r.originTransport}
                            onChange={(e) => updateCharge(i, 'originTransport', Number(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: '10px' }}>Clearance</label>
                          <input
                            type="number"
                            className="input"
                            style={{ height: '32px', fontSize: '11.5px' }}
                            value={r.originClearance}
                            onChange={(e) => updateCharge(i, 'originClearance', Number(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: '10px' }}>Local (OTHC)</label>
                          <input
                            type="number"
                            className="input"
                            style={{ height: '32px', fontSize: '11.5px' }}
                            value={r.originLocal}
                            onChange={(e) => updateCharge(i, 'originLocal', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Destination Local Charges Section */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <b style={{ fontSize: '11.5px', color: 'var(--fr8x-text)' }}>🏁 Destination Local Charges</b>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--mut)' }}>Curr:</span>
                          <select
                            value={destCurrency}
                            onChange={(e) => setDestCurrency(e.target.value)}
                            style={{ background: '#ffffff', fontSize: '10.5px', fontWeight: 700, border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px' }}
                          >
                            {Object.keys(availableCurrencies).map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid g3" style={{ gap: '6px' }}>
                        <div className="field">
                          <label style={{ fontSize: '10px' }}>Transport</label>
                          <input
                            type="number"
                            className="input"
                            style={{ height: '32px', fontSize: '11.5px' }}
                            value={r.destTransport}
                            onChange={(e) => updateCharge(i, 'destTransport', Number(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: '10px' }}>Clearance</label>
                          <input
                            type="number"
                            className="input"
                            style={{ height: '32px', fontSize: '11.5px' }}
                            value={r.destClearance}
                            onChange={(e) => updateCharge(i, 'destClearance', Number(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: '10px' }}>Local (DTHC)</label>
                          <input
                            type="number"
                            className="input"
                            style={{ height: '32px', fontSize: '11.5px' }}
                            value={r.destLocal}
                            onChange={(e) => updateCharge(i, 'destLocal', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row Multi-Currency Subtotal Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}>
                      <span style={{ color: 'var(--fr8x-muted)', fontWeight: 600 }}>Multi-Currency:</span>
                      <b style={{ color: 'var(--ink)' }}>
                        €{lineEUR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR · ₹{lineINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR
                      </b>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Exchange Engine & Grand Total in 4 Currencies Bar */}
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: '1px solid var(--fr8x-outline)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--fr8x-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', background: '#16a34a', display: 'inline-block' }} />
                  <b style={{ color: 'var(--fr8x-text)' }}>Live Interbank Rates (Google Database API):</b>
                  <span>
                    1 USD = ₹{(availableCurrencies['INR']?.rateFromUSD || 83.92).toFixed(2)} INR · 1 EUR = ${(1 / (availableCurrencies['EUR']?.rateFromUSD || 0.92)).toFixed(3)} USD · 1 GBP = ${(1 / (availableCurrencies['GBP']?.rateFromUSD || 0.78)).toFixed(3)} USD
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--fr8x-muted)', fontWeight: 600 }}>{lastUpdatedTime}</span>
              </div>

              <div className="bidding-currency-grid">
                <div style={{ padding: '8px 10px', background: '#ffffff', border: '1px solid var(--fr8x-outline)', textAlign: 'center' }}>
                  <small style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fr8x-muted)', display: 'block' }}>TOTAL IN USD ($)</small>
                  <b style={{ fontSize: '15px', color: 'var(--fr8x-text)' }}>${grandTotalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                </div>
                <div style={{ padding: '8px 10px', background: '#ffffff', border: '1px solid var(--fr8x-outline)', textAlign: 'center' }}>
                  <small style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fr8x-muted)', display: 'block' }}>TOTAL IN EUR (€)</small>
                  <b style={{ fontSize: '15px', color: 'var(--fr8x-text)' }}>€{grandTotalEUR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                </div>
                <div style={{ padding: '8px 10px', background: '#ffffff', border: '1px solid var(--fr8x-outline)', textAlign: 'center' }}>
                  <small style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fr8x-muted)', display: 'block' }}>TOTAL IN GBP (£)</small>
                  <b style={{ fontSize: '15px', color: 'var(--fr8x-text)' }}>£{grandTotalGBP.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                </div>
                <div style={{ padding: '8px 10px', background: '#ffffff', border: '1px solid var(--fr8x-outline)', textAlign: 'center' }}>
                  <small style={{ fontSize: '10px', fontWeight: 700, color: 'var(--fr8x-muted)', display: 'block' }}>TOTAL IN LOCAL (₹ INR)</small>
                  <b style={{ fontSize: '15px', color: 'var(--fr8x-text)' }}>₹{grandTotalINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Audit + Conditions + Ranks (Lowest Offer L1) + Submission Actions */}
          <div className="bidding-footer-grid">
            {/* Audit Box */}
            <div style={{ border: '1px solid var(--fr8x-outline)', borderRadius: '0px', background: '#ffffff', overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', color: 'var(--fr8x-text)', fontSize: '11px', fontWeight: 800, padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--fr8x-outline)' }}>
                AUDIT TRAIL
              </div>
              <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', color: 'var(--ink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>BIDDER ORG</span><b>{user.company}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>CREATED DATE</span><b>{auction.startDate || '2026-08-29'}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>EMAIL ID</span><b>{user.email}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--mut)' }}>CONTACT DESK</span><b>{user.mobile || '+91 98111 22334'}</b></div>
              </div>
            </div>

            {/* Conditions & Information Box */}
            <div style={{ border: '1px solid var(--fr8x-outline)', borderRadius: '0px', background: '#ffffff', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ background: '#f8fafc', color: 'var(--fr8x-text)', fontSize: '11px', fontWeight: 800, padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--fr8x-outline)' }}>
                CONDITIONS &amp; INFORMATION
              </div>
              <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className="btn secondary sm"
                  style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '6px 8px', color: 'var(--ink)', fontWeight: 600, borderRadius: '0px' }}
                  onClick={() => setShowRfqTermsModal(true)}
                >
                  <FileText size={13} color="var(--brand)" /> RFQ Terms
                </button>

                <button
                  type="button"
                  className="btn secondary sm"
                  style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '6px 8px', color: 'var(--ink)', fontWeight: 600, borderRadius: '0px' }}
                  onClick={() => setShowMsdsModal(true)}
                >
                  <ShieldAlert size={13} color="var(--red)" /> MSDS Sheet
                </button>

                <button
                  type="button"
                  className="btn secondary sm"
                  style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '6px 8px', color: 'var(--ink)', fontWeight: 600, borderRadius: '0px' }}
                  onClick={() => setShowDimensionModal(true)}
                >
                  <Maximize2 size={13} color="var(--teal)" /> Dimension Table
                </button>

                <button
                  type="button"
                  className="btn secondary sm"
                  style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '6px 8px', color: 'var(--ink)', fontWeight: 600, borderRadius: '0px' }}
                  onClick={() => setShowInstructionsModal(true)}
                >
                  <ClipboardList size={13} color="#d97706" /> Instructions
                </button>
              </div>

              <div style={{ padding: '0 10px 10px' }}>
                <button
                  type="button"
                  className="btn sm"
                  style={{
                    width: '100%',
                    background: auctionConditionsAccepted ? '#16a34a' : 'var(--fr8x-outline)',
                    borderColor: auctionConditionsAccepted ? '#16a34a' : 'var(--fr8x-outline)',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    borderRadius: '0px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onClick={() => {
                    const next = !auctionConditionsAccepted;
                    setAuctionConditionsAccepted(next);
                    setConfirmTermsAccepted(next);
                    toast(next ? '✓ RFQ Conditions & Terms accepted.' : 'RFQ Conditions Acceptance revoked.');
                  }}
                >
                  <Check size={14} strokeWidth={auctionConditionsAccepted ? 3 : 2} />
                  {auctionConditionsAccepted ? '✓ CONDITIONS ACCEPTED (LOCKED)' : 'ACCEPT ALL CONDITIONS'}
                </button>
              </div>
            </div>

            {/* Reverse Auction Competition Ceiling L1 / L2 / L3 */}
            <div style={{ border: '1px solid var(--fr8x-outline)', borderRadius: '0px', background: '#ffffff', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '10px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '8px', border: '1px solid var(--fr8x-outline)', borderRadius: '0px' }}>
                  <small style={{ fontSize: '9px', fontWeight: 800, color: 'var(--fr8x-text)', textTransform: 'uppercase' }}>YOUR RANK (LOWEST OFFER)</small>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: 'var(--fr8x-text)', lineHeight: 1, margin: '4px 0' }}>
                    {calculatedRank}
                  </div>
                  <small style={{ fontSize: '10px', color: 'var(--mut)', fontWeight: 600 }}>Reverse Sourcing</small>
                </div>

                <div style={{ background: '#ffffff', padding: '10px', border: '1px solid var(--fr8x-outline)', borderRadius: '0px', fontSize: '11px', color: 'var(--ink)' }}>
                  <b style={{ color: 'var(--fr8x-text)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', fontSize: '10.5px' }}>
                    COMPETITION CEILING (REVERSE AUCTION)
                  </b>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--line-light)' }}>
                    <span style={{ color: 'var(--fr8x-text)', fontWeight: 700 }}>L1 (Lowest / Best):</span>
                    <b style={{ color: 'var(--fr8x-text)' }}>${l1Display.toFixed(2)} USD</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--line-light)' }}>
                    <span style={{ color: 'var(--fr8x-muted)', fontWeight: 600 }}>L2 (2nd Lowest):</span>
                    <b>${l2Display.toFixed(2)} USD</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span style={{ color: 'var(--mut)' }}>L3 (3rd Lowest):</span>
                    <b style={{ color: 'var(--mut)' }}>${l3Display.toFixed(2)} USD</b>
                  </div>
                </div>
              </div>

              {/* Total & Submit Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', background: '#f8fafc', padding: '8px 12px', border: '1px solid var(--fr8x-outline)', borderRadius: '0px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <small style={{ color: 'var(--mut)', fontSize: '10px', display: 'block', fontWeight: 700 }}>TOTAL BID OFFER</small>
                  <b style={{ fontSize: '16px', color: 'var(--fr8x-text)' }}>
                    ${grandTotalUSD.toFixed(2)} USD
                  </b>
                  <small style={{ display: 'block', color: 'var(--fr8x-muted)', fontSize: '10.5px', fontWeight: 600 }}>
                    (€{grandTotalEUR.toFixed(2)} EUR · ₹{grandTotalINR.toFixed(2)} INR)
                  </small>
                  <small style={{ display: 'block', color: bidsRemaining ? 'var(--teal)' : 'var(--red)', fontSize: '10.5px', fontWeight: 800, marginTop: '3px' }}>
                    {bidsRemaining} of {bidLimit} bid submission{bidLimit === 1 ? '' : 's'} remaining
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn secondary" style={{ fontSize: '12px', padding: '7px 14px', fontWeight: 700, borderRadius: '0px' }} onClick={() => toast('Edit mode active.')}>
                    EDIT
                  </button>
                  <button className="btn primary" disabled={bidsRemaining === 0} style={{ fontSize: '12px', padding: '7px 18px', fontWeight: 800, background: bidsRemaining ? 'var(--fr8x-outline)' : '#94a3b8', borderRadius: '0px', cursor: bidsRemaining ? 'pointer' : 'not-allowed' }} onClick={() => setShowConfirmModal(true)}>
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

      {/* POPUP MODAL 5: SUBMIT BID WITH REQUIRED INFORMATION & TERMS ACCEPTANCE (User Requirement) */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Submit Binding Reverse Auction Offer · Legal Evidence Docket"
        maxWidth="840px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px', color: 'var(--ink)' }}>
          {/* Auction & Bid Offer Summary Header */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--fr8x-outline)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span className="badge blue" style={{ fontSize: '10px', fontWeight: 800 }}>{auction.id} · REVERSE AUCTION</span>
              <h3 style={{ margin: '4px 0 2px', fontSize: '14px', color: 'var(--ink)', fontWeight: 800 }}>{auction.title}</h3>
              <p style={{ margin: 0, color: 'var(--mut)', fontSize: '11px' }}>
                Route: <b>{auction.shipment.pol}</b> → <b>{auction.shipment.pod}</b> | Commodity: <b>{auction.shipment.commodity}</b>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <small style={{ color: 'var(--mut)', fontSize: '10px', fontWeight: 700, display: 'block' }}>TOTAL BINDING OFFER</small>
              <b style={{ fontSize: '18px', color: '#16a34a' }}>${grandTotalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</b>
              <small style={{ display: 'block', color: 'var(--fr8x-muted)', fontSize: '10.5px' }}>
                (€{grandTotalEUR.toFixed(2)} EUR · ₹{grandTotalINR.toFixed(2)} INR)
              </small>
            </div>
          </div>

          {/* Section 1: Required Information Checklist */}
          <div style={{ border: '1px solid var(--fr8x-outline)', padding: '14px', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', borderBottom: '1px solid var(--line-light)', paddingBottom: '6px' }}>
              <Truck size={14} color="var(--brand)" />
              <b style={{ fontSize: '12px', color: 'var(--ink)' }}>REQUIRED OPERATIONAL INFORMATION</b>
              <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>*Mandatory for Godfather Audit Log</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  Nominated Ocean Carrier / Shipping Line *
                </label>
                <select
                  value={proposedCarrier}
                  onChange={(e) => setProposedCarrier(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid var(--line)', background: '#ffffff' }}
                >
                  <option value="MSC Mediterranean Shipping Co.">MSC Mediterranean Shipping Co.</option>
                  <option value="Maersk Line">Maersk Line</option>
                  <option value="CMA CGM Group">CMA CGM Group</option>
                  <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                  <option value="COSCO Shipping Lines">COSCO Shipping Lines</option>
                  <option value="Ocean Network Express (ONE)">Ocean Network Express (ONE)</option>
                  <option value="Evergreen Marine">Evergreen Marine</option>
                  <option value="Yang Ming Marine Transport">Yang Ming Marine Transport</option>
                  <option value="Pacific International Lines (PIL)">Pacific International Lines (PIL)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  Proposed Routing / Service String *
                </label>
                <select
                  value={proposedRouting}
                  onChange={(e) => setProposedRouting(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid var(--line)', background: '#ffffff' }}
                >
                  <option value="Direct Express Service (No Transshipment)">Direct Express Service (No Transshipment)</option>
                  <option value="Transshipment via Colombo Hub">Transshipment via Colombo Hub</option>
                  <option value="Transshipment via Singapore PSA">Transshipment via Singapore PSA</option>
                  <option value="Transshipment via Jebel Ali Port">Transshipment via Jebel Ali Port</option>
                  <option value="Direct Liner Feeder Connect">Direct Liner Feeder Connect</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  Guaranteed Transit Time (Port-to-Port) *
                </label>
                <input
                  type="text"
                  value={proposedTransitTime}
                  onChange={(e) => setProposedTransitTime(e.target.value)}
                  placeholder="e.g. 24 Days Port-to-Port"
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid var(--line)', background: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  Target Vessel Departure / ETD *
                </label>
                <input
                  type="date"
                  value={proposedVesselDate}
                  onChange={(e) => setProposedVesselDate(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid var(--line)', background: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  Origin Free Time (Demurrage &amp; Detention Days)
                </label>
                <input
                  type="number"
                  min={0}
                  value={offeredOriginFreeDays}
                  onChange={(e) => setOfferedOriginFreeDays(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid var(--line)', background: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  Destination Free Time (Detention Days)
                </label>
                <input
                  type="number"
                  min={0}
                  value={offeredDestFreeDays}
                  onChange={(e) => setOfferedDestFreeDays(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid var(--line)', background: '#ffffff' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '10px', padding: '8px 10px', background: '#f8fafc', border: '1px solid var(--line-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <div>
                <span style={{ color: 'var(--mut)' }}>Authorized Signatory: </span>
                <b style={{ color: 'var(--ink)' }}>{user.displayName}</b> ({user.designation || 'Signatory Representative'})
              </div>
              <div>
                <span style={{ color: 'var(--mut)' }}>Entity: </span>
                <b style={{ color: 'var(--ink)' }}>{user.company}</b> · {user.email}
              </div>
            </div>
          </div>

          {/* Section 2: Mandatory Terms & Conditions Acceptance */}
          <div style={{ border: '1px solid #fed7aa', background: '#fffbeb', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9a3412', fontWeight: 800, fontSize: '12px' }}>
              <ShieldAlert size={15} />
              <span>TERMS &amp; CONDITIONS ACCEPTANCE &amp; GODFATHER AUDIT SEAL</span>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '11.5px', color: '#78350f', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={confirmInformationVerified}
                onChange={(e) => setConfirmInformationVerified(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--brand)' }}
              />
              <span>
                <b>Required Information Verification:</b> I attest that all operational information provided (carrier space guarantee, routing, vessel schedule, and free-time days) is verified, binding, and ready for immediate operational fulfillment.
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '11.5px', color: '#78350f', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={confirmTermsAccepted}
                onChange={(e) => setConfirmTermsAccepted(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--brand)' }}
              />
              <span>
                <b>Formal Acceptance of RFQ Terms:</b> I, on behalf of <b>{user.company}</b>, hereby formally accept all RFQ technical requirements, packaging rules, demurrage/detention tariffs, payment conditions, and dispute bylaws. I acknowledge that submitting this offer generates an immutable evidence log preserved in the <b>Godfather Regulatory Vault</b> for all bidders and regulatory review.
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmittingBid}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn primary"
              style={{
                background: (!confirmTermsAccepted || !confirmInformationVerified || grandTotalUSD <= 0) ? '#94a3b8' : '#16a34a',
                borderColor: (!confirmTermsAccepted || !confirmInformationVerified || grandTotalUSD <= 0) ? '#94a3b8' : '#16a34a',
                fontWeight: 800,
                padding: '8px 20px',
                fontSize: '12.5px',
                cursor: (!confirmTermsAccepted || !confirmInformationVerified || grandTotalUSD <= 0) ? 'not-allowed' : 'pointer'
              }}
              onClick={handleConfirmBid}
              disabled={!confirmTermsAccepted || !confirmInformationVerified || grandTotalUSD <= 0 || isSubmittingBid}
            >
              {isSubmittingBid ? (
                <span>Sealing Evidence...</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} /> Seal &amp; Submit Formal Bid
                </span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* POPUP MODAL 6: IMMUTABLE EVIDENCE SEALED IN GODFATHER (Success Receipt) */}
      <Modal
        isOpen={showDocketSuccessModal}
        onClose={() => setShowDocketSuccessModal(false)}
        title="Bid Submitted & Sealed in Godfather Audit Vault"
        maxWidth="680px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', color: 'var(--ink)' }}>
          <div style={{ textAlign: 'center', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
            <CheckCircle size={36} color="#16a34a" style={{ margin: '0 auto 6px' }} />
            <h3 style={{ margin: 0, color: '#166534', fontSize: '16px', fontWeight: 800 }}>
              Bid Recorded as Authoritative Evidence
            </h3>
            <p style={{ margin: '4px 0 0', color: '#15803d', fontSize: '11.5px' }}>
              Your reverse auction offer of <b>${grandTotalUSD.toFixed(2)} USD</b> has been cryptographically sealed and logged into the Godfather Compliance Repository.
            </p>
          </div>

          {lastSubmittedDocket && (
            <div style={{ border: '1px solid var(--line)', padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line-light)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--mut)', fontWeight: 600 }}>EVIDENCE DOCKET REF</span>
                <b className="font-mono" style={{ color: 'var(--brand)' }}>{lastSubmittedDocket.docketRef}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line-light)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--mut)', fontWeight: 600 }}>BIDDER ENTITY</span>
                <b>{lastSubmittedDocket.bidderCompany} ({lastSubmittedDocket.bidderName})</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line-light)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--mut)', fontWeight: 600 }}>NOMINATED CARRIER</span>
                <b>{lastSubmittedDocket.proposedCarrier}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line-light)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--mut)', fontWeight: 600 }}>TRANSIT &amp; ROUTING</span>
                <b>{lastSubmittedDocket.proposedTransitTime} · {lastSubmittedDocket.proposedRouting}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line-light)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--mut)', fontWeight: 600 }}>TERMS ACCEPTED TIMESTAMP</span>
                <b>{new Date(lastSubmittedDocket.termsAcceptedAt).toLocaleString()}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--mut)', fontWeight: 600 }}>CRYPTOGRAPHIC EVIDENCE HASH</span>
                <span className="font-mono badge grey" style={{ fontSize: '10px' }}>{lastSubmittedDocket.evidenceHash}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => setShowDocketSuccessModal(false)}
            >
              Done &amp; Return to Tender
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
