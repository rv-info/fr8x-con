'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/context/DataContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ProfileLink } from '@/components/ui/ProfileLink';
import {
  PORT_SUGGESTIONS,
  FREIGHT_EQUIPMENT,
  INCOTERMS_2020,
  getLocationTypeIcon,
  getIncotermIcon,
} from '@/lib/utils';
import { searchPorts, formatPort } from '@/lib/master-data';
import { ContainerEquipmentRow } from '@/lib/types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Rocket,
  ShieldCheck,
  Ban,
  Clock,
  Calendar,
  Layers,
  FileCheck,
  Search,
} from 'lucide-react';

interface VerifiedBidderCandidate {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  timezone: string;
  hasGoldenTick?: boolean;
}

import { BidderGroup } from '@/lib/types';
import { getBidderGroupsFromDB, saveBidderGroupInDB } from '@/lib/firebase/firestore';

const INITIAL_BIDDER_POOL: VerifiedBidderCandidate[] = [
  {
    id: 'u-msc',
    name: 'MSC Mediterranean Shipping',
    role: 'Carrier Line Operator',
    company: 'Mediterranean Shipping Company',
    location: 'Geneva / Mumbai',
    timezone: 'Asia/Kolkata',
    hasGoldenTick: true,
  },
  {
    id: 'u-hapag',
    name: 'Hapag-Lloyd Ocean Desk',
    role: 'Trade Lane Manager',
    company: 'Hapag-Lloyd AG',
    location: 'Hamburg / Rotterdam',
    timezone: 'Europe/Amsterdam',
    hasGoldenTick: true,
  },
  {
    id: 'u-cma',
    name: 'CMA CGM Commercial',
    role: 'Ocean Freight Lead',
    company: 'CMA CGM S.A.',
    location: 'Marseille / Dubai',
    timezone: 'Asia/Dubai',
    hasGoldenTick: true,
  },
  {
    id: 'u-one',
    name: 'Ocean Network Express',
    role: 'Procurement Specialist',
    company: 'ONE Line',
    location: 'Singapore',
    timezone: 'Asia/Singapore',
    hasGoldenTick: true,
  },
  {
    id: 'u-sarah',
    name: 'Sarah Lewis',
    role: 'Ocean Freight Lead',
    company: 'Rotterdam Freight NV',
    location: 'Rotterdam, Netherlands',
    timezone: 'Europe/Amsterdam',
    hasGoldenTick: false,
  },
  {
    id: 'u-kiran',
    name: 'Kiran Mehta',
    role: 'Trade Lane Manager',
    company: 'Indo Ocean Lines',
    location: 'Mumbai, India',
    timezone: 'Asia/Kolkata',
    hasGoldenTick: false,
  },
];

export default function CreateReverseAuctionPage() {
  const router = useRouter();
  const { addAuction, masterLocations, masterEquipment, masterCommodities, masterIncoterms } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  // Section 1: Auction Details
  const [title, setTitle] = useState('');
  const [rfqId, setRfqId] = useState(`RFQ-${Math.floor(1000 + Math.random() * 9000)}`);
  const [auctionType, setAuctionType] = useState<'Specific bidder' | 'General bidding'>('Specific bidder');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [endDateTime, setEndDateTime] = useState('');
  const [timezone, setTimezone] = useState(user.timezone || 'Asia/Kolkata');
  const [bidLimit, setBidLimit] = useState(5);
  const [notes, setNotes] = useState('Quote all-in ocean freight and itemized local charges.');

  // Section 2: Shipment & Cargo
  const [por, setPor] = useState('');
  const [pol, setPol] = useState('');
  const [pod, setPod] = useState('');
  const [finalDest, setFinalDest] = useState('');
  const [cargoReadyDate, setCargoReadyDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [shipmentType, setShipmentType] = useState<'FCL' | 'LCL' | 'Breakbulk' | 'RoRo'>('FCL');
  const [incoterm, setIncoterm] = useState(INCOTERMS_2020[0]);
  const [rateCurrency, setRateCurrency] = useState('USD');
  const [commodity, setCommodity] = useState('Engineering Goods');
  const [hsCode, setHsCode] = useState('8471.30');
  const [grossWeight, setGrossWeight] = useState(24000);
  const [cbm, setCbm] = useState(68);

  // Suggestions state for POR, POL, POD, FinalDest
  const [activeSuggestField, setActiveSuggestField] = useState<string | null>(null);
  const [suggestMatches, setSuggestMatches] = useState<string[]>([]);

  // Dynamic Container Rows
  const [containers, setContainers] = useState<ContainerEquipmentRow[]>([
    {
      id: 'row-1',
      equipmentType: "40' High Cube (40HC)",
      containerType: 'Standard',
      quantity: 1,
      pickupLocation: 'Port CFS Depot',
      emptyReturnLocation: 'Destination CY Depot',
      isSpecial: false,
      commodity: 'Engineering Goods',
      hsCode: '8471.30',
      grossWeight: 24000,
    },
  ]);

  // Section 3: Origin & Destination Charges
  const [originTrans, setOriginTrans] = useState(false);
  const [originClear, setOriginClear] = useState(false);
  const [originCarrier, setOriginCarrier] = useState(true);
  const [originPickupAddr, setOriginPickupAddr] = useState('');
  const [originHandover, setOriginHandover] = useState('');
  const [originFactoryStuffing, setOriginFactoryStuffing] = useState(false);
  const [originCfsStuffing, setOriginCfsStuffing] = useState(false);

  // Operational Freight Forwarder FOB Scope of Work
  const [fobOriginHaulage, setFobOriginHaulage] = useState(true);
  const [fobExportCHA, setFobExportCHA] = useState(true);
  const [fobBlIssuance, setFobBlIssuance] = useState(true);
  const [fobTerminalHandling, setFobTerminalHandling] = useState(true);
  const [fobVgmSubmission, setFobVgmSubmission] = useState(true);
  const [fobCfsCarting, setFobCfsCarting] = useState(false);

  const [destTrans, setDestTrans] = useState(false);
  const [destClear, setDestClear] = useState(false);
  const [destCarrier, setDestCarrier] = useState(true);
  const [destDestuffAddr, setDestDestuffAddr] = useState('');
  const [dutyPaidBy, setDutyPaidBy] = useState<'none' | 'us' | 'consignee'>('none');
  const [dutyCargoCommodity, setDutyCargoCommodity] = useState('');
  const [dutyHsCode, setDutyHsCode] = useState('');
  const [dutyApproxValue, setDutyApproxValue] = useState('');

  // Section 4: Dynamic Bidder Management & Groups
  const [availableBidders, setAvailableBidders] = useState<VerifiedBidderCandidate[]>(INITIAL_BIDDER_POOL);
  const [assignedBidders, setAssignedBidders] = useState<Set<string>>(new Set());
  const [blockedBidders, setBlockedBidders] = useState<Set<string>>(new Set());
  const [bidderSearchQuery, setBidderSearchQuery] = useState('');
  const [savedBidderGroups, setSavedBidderGroups] = useState<BidderGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (user?.uid) {
      getBidderGroupsFromDB(user.uid).then((groups) => {
        if (groups && groups.length > 0) setSavedBidderGroups(groups);
      }).catch(() => {});
    }
  }, [user?.uid]);

  // Auction Rules
  const [autoExtension, setAutoExtension] = useState(true);
  const [autoExtensionMinutes, setAutoExtensionMinutes] = useState(5);
  const [rankingVisible, setRankingVisible] = useState(true);
  const [hideCompetitorNames, setHideCompetitorNames] = useState(true);
  const [bidderAnonymity, setBidderAnonymity] = useState(true);
  const [lowestBidCeiling, setLowestBidCeiling] = useState(false);
  const [auctionReopening, setAuctionReopening] = useState(false);
  const [auctionWithdrawal, setAuctionWithdrawal] = useState<'Allowed' | 'Not Allowed'>('Allowed');
  const [generalBidding, setGeneralBidding] = useState(false);

  // Routing Requirements
  const [preferredShippingLine, setPreferredShippingLine] = useState('');
  const [acceptableLines, setAcceptableLines] = useState('');
  const [directTransshipment, setDirectTransshipment] = useState<'Direct' | 'Transshipment' | 'Both'>('Both');
  const [preferredRoute, setPreferredRoute] = useState('');
  const [preferredTransitTime, setPreferredTransitTime] = useState('');

  // Additional Auction Detail fields
  const [movementType, setMovementType] = useState('Port to Port');
  const [blType, setBlType] = useState('Original BL');
  const [serviceType, setServiceType] = useState('CY-CY');
  const [auctionStatus, setAuctionStatus] = useState<'Draft' | 'Active'>('Draft');

  // Free Time Requirements
  const [originDetention, setOriginDetention] = useState('');
  const [originDemurrage, setOriginDemurrage] = useState('');
  const [clearanceDetention, setClearanceDetention] = useState('');
  const [specialFreeTime, setSpecialFreeTime] = useState<Array<{ label: string; days: string }>>([]);

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Payment Modal — triggered before publish
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | 'enterprise'>('pro');
  const PLANS = [
    { id: 'standard', label: 'Standard', price: 499, duration: '5 days', features: ['Up to 5 bidders', 'Email notifications', 'PDF report'] },
    { id: 'pro', label: 'Pro', price: 999, duration: '10 days', features: ['Up to 20 bidders', 'Auto-extension', 'Real-time rank view', 'PDF + CSV report'] },
    { id: 'enterprise', label: 'Enterprise', price: 2499, duration: '30 days', features: ['Unlimited bidders', 'Priority support', 'Custom branding', 'Analytics dashboard'] },
  ] as const;


  // Auto-calculate end date & time
  useEffect(() => {
    if (startDate && startTime && durationMinutes) {
      try {
        const dt = new Date(`${startDate}T${startTime}`);
        dt.setMinutes(dt.getMinutes() + Number(durationMinutes));
        setEndDateTime(
          dt.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } catch {
        setEndDateTime('Invalid Date/Time');
      }
    }
  }, [startDate, startTime, durationMinutes]);

  // Port Suggestion Handler
  const handlePortInput = (field: string, val: string) => {
    if (field === 'pol') setPol(val);
    else if (field === 'pod') setPod(val);
    else if (field === 'por') setPor(val);
    else if (field === 'finalDest') setFinalDest(val);

    if (val.trim().length >= 2) {
      const q = val.toLowerCase().trim();
      const masterPortMatches = searchPorts(q, 8).map(
        (p) => `⚓ ${formatPort(p)}, ${p.country}`
      );

      const locList = (masterLocations || []).filter(
        (l) =>
          l.unLocode.toLowerCase().includes(q) ||
          l.name.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q)
      ).map((l) => `${getLocationTypeIcon(l.type)} ${l.name} (${l.unLocode}), ${l.country}`);

      const stringMatches = PORT_SUGGESTIONS.filter((p) =>
        p.toLowerCase().includes(q)
      ).map((p) => `⚓ ${p}`);

      const combined = Array.from(new Set([...masterPortMatches, ...locList, ...stringMatches])).slice(0, 10);
      setSuggestMatches(combined);
      setActiveSuggestField(field);
    } else {
      setSuggestMatches([]);
      setActiveSuggestField(null);
    }
  };

  const selectPort = (port: string) => {
    const cleanPort = port.replace(/^[^\w\s]+\s*/, '');
    if (activeSuggestField === 'pol') setPol(cleanPort);
    else if (activeSuggestField === 'pod') setPod(cleanPort);
    else if (activeSuggestField === 'por') setPor(cleanPort);
    else if (activeSuggestField === 'finalDest') setFinalDest(cleanPort);
    setActiveSuggestField(null);
    setSuggestMatches([]);
  };

  // Container Row Management
  const addContainerRow = () => {
    const newRow: ContainerEquipmentRow = {
      id: `row-${Date.now()}`,
      equipmentType: "20' Standard (20DV)",
      containerType: 'Standard',
      quantity: 1,
      pickupLocation: '',
      emptyReturnLocation: '',
      isSpecial: false,
      commodity: commodity,
      hsCode: hsCode,
      grossWeight: 18000,
    };
    setContainers((prev) => [...prev, newRow]);
  };

  const updateContainerRow = (id: string, field: keyof ContainerEquipmentRow, value: any) => {
    setContainers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeContainerRow = (id: string) => {
    if (containers.length <= 1) {
      toast('At least one container equipment row is required.');
      return;
    }
    setContainers((prev) => prev.filter((c) => c.id !== id));
  };

  // Bidder Management Handlers
  const toggleAssignBidder = (bidderId: string) => {
    setAssignedBidders((prev) => {
      const next = new Set(prev);
      if (next.has(bidderId)) next.delete(bidderId);
      else next.add(bidderId);
      return next;
    });
  };

  const toggleBlockBidder = (bidderId: string) => {
    setBlockedBidders((prev) => {
      const next = new Set(prev);
      if (next.has(bidderId)) {
        next.delete(bidderId);
        toast(`Bidder unblocked.`);
      } else {
        next.add(bidderId);
        // Also remove from assigned
        setAssignedBidders((a) => {
          const aNext = new Set(a);
          aNext.delete(bidderId);
          return aNext;
        });
        toast(`Bidder blocked from receiving or submitting bids.`);
      }
      return next;
    });
  };

  // Validate & Publish
  const handlePublish = () => {
    if (!title.trim()) {
      toast('Please enter Auction Title.');
      return;
    }
    if (!pol.trim() || !pod.trim()) {
      toast('Port of Loading (POL) and Port of Discharge (POD) are required.');
      return;
    }
    if (auctionType === 'Specific bidder' && assignedBidders.size === 0) {
      toast('Specific bidder auction requires at least one eligible assigned bidder.');
      return;
    }

    const selectedBiddersData = availableBidders.filter((b) =>
      assignedBidders.has(b.id)
    );

    const newAuctionId = addAuction({
      title: title.trim(),
      rfqId,
      auctionType,
      startDate,
      startTime,
      durationMinutes: Number(durationMinutes),
      endDateTime,
      timezone,
      shipment: {
        por: por || pol,
        pol,
        pod,
        finalDestination: finalDest || pod,
        cargoReadyDate,
        shipmentType,
        incoterm,
        rateCurrency,
        commodity,
        hsCode,
        weightKg: Number(grossWeight),
        cbm: Number(cbm),
      },
      containers,
      originCharges: {
        transportation: originTrans,
        clearance: originClear,
        carrierLocal: originCarrier,
        pickupAddress: originPickupAddr,
        handoverLocation: originHandover,
        factoryStuffing: originFactoryStuffing,
        cfsStuffing: originCfsStuffing,
        fobScope: incoterm.toUpperCase().includes('FOB')
          ? {
              originHaulage: fobOriginHaulage,
              exportCustomsCHA: fobExportCHA,
              blIssuance: fobBlIssuance,
              terminalHandling: fobTerminalHandling,
              vgmSubmission: fobVgmSubmission,
              cfsCarting: fobCfsCarting,
              factoryStuffing: originFactoryStuffing,
            }
          : undefined,
      },
      destinationCharges: {
        transportation: destTrans,
        clearance: destClear,
        carrierLocal: destCarrier,
        destuffingAddress: destDestuffAddr,
        dutyPaidBy,
        cargoCommodity: dutyCargoCommodity,
        hsCode: dutyHsCode,
        approxCargoValue: dutyApproxValue,
      },
      selectedBidders: selectedBiddersData,
      blockedBidders: Array.from(blockedBidders),
      rules: {
        autoExtension,
        rankingVisible,
        hideCompetitorNames,
        bidderAnonymity,
        bidLimit: Number(bidLimit),
      },
      competitionCeiling: 2850,
    });

    setShowPreviewModal(false);
    router.push(`/auctions/${newAuctionId}`);
  };

  return (
    <div>
      {/* Payment / Listing Fee Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Auction Listing Fee — Select Your Plan"
        maxWidth="820px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--mut)', margin: 0 }}>
            To publish your reverse auction and notify verified forwarders, please select a listing plan. Payment is required at posting.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  border: `2px solid ${selectedPlan === plan.id ? 'var(--brand)' : 'var(--line)'}`,
                  borderRadius: '10px', padding: '18px 16px', cursor: 'pointer',
                  background: selectedPlan === plan.id ? '#eff6ff' : '#fff',
                  transition: 'all 0.15s ease',
                  boxShadow: selectedPlan === plan.id ? '0 2px 10px rgba(59,130,246,0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <b style={{ fontSize: '14px', color: 'var(--ink)' }}>{plan.label}</b>
                  {selectedPlan === plan.id && <span className="badge green">✓ Selected</span>}
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--brand)', marginBottom: '2px' }}>₹{plan.price.toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: 'var(--mut)', marginBottom: '12px' }}>for {plan.duration}</div>
                <ul style={{ margin: 0, padding: '0 0 0 14px', fontSize: '11.5px', color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
                  {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', fontSize: '12px' }}>
            <b style={{ color: '#166534' }}>💳 Secure Payment via Razorpay / UPI / Net Banking</b>
            <p style={{ margin: '4px 0 0', color: '#15803d' }}>Your listing goes live immediately after payment confirmation. All assigned bidders are notified instantly.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
            <button
              className="btn primary"
              style={{ minWidth: '220px', fontWeight: 700, fontSize: '13.5px' }}
              onClick={() => {
                setShowPaymentModal(false);
                handlePublish();
              }}
            >
              💳 Pay ₹{PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString()} &amp; Publish
            </button>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div className="head">
        <div>
          <h1>Create Reverse Auction</h1>
          <p>
            Specific-bidder or general bidding workflow with complete shipment requirements and dynamic container equipment.
          </p>
        </div>
        <Link href="/auctions" className="btn secondary">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShowPaymentModal(true);
        }}
      >
        {/* Section 1: Auction Details */}
        <section className="section">
          <div className="sectiontitle">
            <span className="num">1</span>
            Auction Details
            <span>Commercial context, duration, and time synchronization</span>
          </div>
          <div className="sectionbody">
            <div className="grid g4">
              <div className="field">
                <label>
                  Auction Title <span className="req">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Mumbai → Rotterdam | FCL Auto Parts"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Auction ID</label>
                <input
                  className="input"
                  value="AUTO · RA-2026-0846"
                  readOnly
                  title="System generated immutable ID"
                />
              </div>

              <div className="field">
                <label>RFQ / Query ID</label>
                <input
                  className="input"
                  value={rfqId}
                  onChange={(e) => setRfqId(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Auction Type</label>
                <select
                  className="input"
                  value={auctionType}
                  onChange={(e) => setAuctionType(e.target.value as any)}
                >
                  <option value="Specific bidder">Specific bidder (Invited only)</option>
                  <option value="General bidding">General bidding (Open to verified)</option>
                </select>
              </div>

              <div className="field">
                <label>Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Start Time</label>
                <input
                  type="time"
                  className="input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Auction Duration (Minutes)</label>
                <input
                  type="number"
                  className="input"
                  min="15"
                  max="2880"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label>End Date & Time (Auto-calculated)</label>
                <input className="input" value={endDateTime} readOnly />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Shipment & Cargo */}
        <section className="section">
          <div className="sectiontitle">
            <span className="num">2</span>
            Shipment & Cargo
            <span>Ports, Incoterms, cargo specifications, and dynamic container rows</span>
          </div>
          <div className="sectionbody">
            <div className="grid g4">
              {/* POR */}
              <div className="field suggest">
                <label>Place of Receipt (POR)</label>
                <input
                  className="input"
                  placeholder="Type 3+ letters…"
                  value={por}
                  onChange={(e) => handlePortInput('por', e.target.value)}
                />
                {activeSuggestField === 'por' && suggestMatches.length > 0 && (
                  <div className="suggestions">
                    {suggestMatches.map((p) => (
                      <button key={p} type="button" onClick={() => selectPort(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* POL */}
              <div className="field suggest">
                <label>
                  Port of Loading (POL) <span className="req">*</span>
                </label>
                <input
                  className="input"
                  placeholder="Type 3+ letters (e.g. Nhava Sheva)…"
                  value={pol}
                  onChange={(e) => handlePortInput('pol', e.target.value)}
                  required
                />
                {activeSuggestField === 'pol' && suggestMatches.length > 0 && (
                  <div className="suggestions">
                    {suggestMatches.map((p) => (
                      <button key={p} type="button" onClick={() => selectPort(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* POD */}
              <div className="field suggest">
                <label>
                  Port of Discharge (POD) <span className="req">*</span>
                </label>
                <input
                  className="input"
                  placeholder="Type 3+ letters (e.g. Rotterdam)…"
                  value={pod}
                  onChange={(e) => handlePortInput('pod', e.target.value)}
                  required
                />
                {activeSuggestField === 'pod' && suggestMatches.length > 0 && (
                  <div className="suggestions">
                    {suggestMatches.map((p) => (
                      <button key={p} type="button" onClick={() => selectPort(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Final Destination */}
              <div className="field suggest">
                <label>Final Destination</label>
                <input
                  className="input"
                  placeholder="Type 3+ letters…"
                  value={finalDest}
                  onChange={(e) => handlePortInput('finalDest', e.target.value)}
                />
                {activeSuggestField === 'finalDest' && suggestMatches.length > 0 && (
                  <div className="suggestions">
                    {suggestMatches.map((p) => (
                      <button key={p} type="button" onClick={() => selectPort(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="field">
                <label>Cargo-Ready Date</label>
                <input
                  type="date"
                  className="input"
                  value={cargoReadyDate}
                  onChange={(e) => setCargoReadyDate(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Shipment Type</label>
                <select
                  className="input"
                  value={shipmentType}
                  onChange={(e) => setShipmentType(e.target.value as any)}
                >
                  <option value="FCL">FCL - Full Container Load</option>
                  <option value="LCL">LCL - Less Container Load</option>
                  <option value="Breakbulk">Breakbulk</option>
                  <option value="RoRo">RoRo</option>
                </select>
              </div>

              <div className="field">
                <label>Incoterm (2020)</label>
                <select
                  className="input"
                  value={incoterm}
                  onChange={(e) => setIncoterm(e.target.value)}
                >
                  {INCOTERMS_2020.map((inc) => (
                    <option key={inc} value={inc}>
                      {inc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Rate Currency</label>
                <select
                  className="input"
                  value={rateCurrency}
                  onChange={(e) => setRateCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>

              <div className="field">
                <label>Commodity</label>
                <input
                  className="input"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                />
              </div>

              <div className="field">
                <label>HS Code</label>
                <input
                  className="input"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Gross Weight (KG)</label>
                <input
                  type="number"
                  className="input"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label>Volume (CBM)</label>
                <input
                  type="number"
                  className="input"
                  value={cbm}
                  onChange={(e) => setCbm(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Dynamic Container Rows Table */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <b style={{ fontSize: '12px', color: 'var(--ink)' }}>Dynamic Container & Equipment Specification</b>
                <button type="button" className="btn secondary sm" onClick={addContainerRow}>
                  <Plus size={13} /> Add Container Row
                </button>
              </div>

              <div className="tablewrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>Equipment Type</th>
                      <th style={{ width: '120px' }}>Type</th>
                      <th style={{ width: '70px' }}>Qty</th>
                      <th>Pickup Location</th>
                      <th>Empty Return</th>
                      <th style={{ width: '80px' }}>Special</th>
                      <th>HS Code</th>
                      <th style={{ width: '100px' }}>Gross Wt (KG)</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {containers.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <select
                            className="input"
                            value={row.equipmentType}
                            onChange={(e) => updateContainerRow(row.id, 'equipmentType', e.target.value)}
                          >
                            {FREIGHT_EQUIPMENT.map((eq) => (
                              <option key={eq} value={eq}>
                                {eq}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="input"
                            value={row.containerType}
                            onChange={(e) => updateContainerRow(row.id, 'containerType', e.target.value as any)}
                          >
                            <option value="Standard">Standard</option>
                            <option value="Reefer">Reefer</option>
                            <option value="OOG">OOG</option>
                            <option value="Tank">Tank</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="input"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => updateContainerRow(row.id, 'quantity', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            placeholder="Port CFS / Depot"
                            value={row.pickupLocation}
                            onChange={(e) => updateContainerRow(row.id, 'pickupLocation', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            placeholder="Discharge CY Depot"
                            value={row.emptyReturnLocation}
                            onChange={(e) => updateContainerRow(row.id, 'emptyReturnLocation', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="input"
                            value={row.isSpecial ? 'Yes' : 'No'}
                            onChange={(e) => updateContainerRow(row.id, 'isSpecial', e.target.value === 'Yes')}
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </td>
                        <td>
                          <input
                            className="input"
                            placeholder="HS Code"
                            value={row.hsCode}
                            onChange={(e) => updateContainerRow(row.id, 'hsCode', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="input"
                            value={row.grossWeight}
                            onChange={(e) => updateContainerRow(row.id, 'grossWeight', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn danger sm icon"
                            onClick={() => removeContainerRow(row.id)}
                            title="Remove row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Routing, Local Charges & Free Time */}
        <section className="section">
          <div className="sectiontitle">
            <span className="num">3</span>
            Routing, Local Charges & Free Time
            <span>Conditional origin/destination scope and customs duty parameters</span>
          </div>
          <div className="sectionbody">
            <div className="grid g2">
              {/* Origin Charges */}
              <div className="card">
                <div className="cardhead">Origin Local Charges Scope</div>
                <div className="cardbody">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={originTrans}
                      onChange={(e) => setOriginTrans(e.target.checked)}
                    />
                    Transportation (First Mile Inland Haulage)
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={originClear}
                      onChange={(e) => setOriginClear(e.target.checked)}
                    />
                    Customs Clearance (Export Clearance)
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={originCarrier}
                      onChange={(e) => setOriginCarrier(e.target.checked)}
                    />
                    Carrier Local Charges & Terminal Handling (THC)
                  </label>

                  {/* Conditional Origin Fields */}
                  {(originTrans || originClear) && (
                    <div className="subbox">
                      <h5>Pickup & Stuffing Specifications</h5>
                      <div className="grid g2">
                        <div className="field">
                          <label>Pickup Address</label>
                          <input
                            className="input"
                            placeholder="Factory / Warehouse Address"
                            value={originPickupAddr}
                            onChange={(e) => setOriginPickupAddr(e.target.value)}
                          />
                        </div>
                        <div className="field">
                          <label>Handover Location</label>
                          <input
                            className="input"
                            placeholder="Port CFS / ICD"
                            value={originHandover}
                            onChange={(e) => setOriginHandover(e.target.value)}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={originFactoryStuffing}
                            onChange={(e) => setOriginFactoryStuffing(e.target.checked)}
                          />
                          Factory Stuffing Required
                        </label>
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={originCfsStuffing}
                            onChange={(e) => setOriginCfsStuffing(e.target.checked)}
                          />
                          CFS Stuffing Required
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Operational Freight Forwarder FOB Scope of Work Checklist */}
                  {incoterm.toUpperCase().includes('FOB') && (
                    <div className="subbox" style={{ marginTop: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <ShieldCheck size={14} color="#0284c7" />
                        <b style={{ fontSize: '11.5px', color: '#0369a1' }}>FOB Operational Freight Forwarder Scope of Work</b>
                      </div>
                      <p style={{ fontSize: '11px', color: '#0c4a6e', margin: '0 0 8px' }}>
                        Explicit forwarder responsibilities required at origin port before ocean vessel departure:
                      </p>
                      <div className="grid g2" style={{ gap: '6px' }}>
                        <label className="check" style={{ fontSize: '11px', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={fobOriginHaulage}
                            onChange={(e) => setFobOriginHaulage(e.target.checked)}
                          />
                          Origin Haulage & Drayage
                        </label>
                        <label className="check" style={{ fontSize: '11px', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={fobExportCHA}
                            onChange={(e) => setFobExportCHA(e.target.checked)}
                          />
                          Export Customs Clearance (CHA)
                        </label>
                        <label className="check" style={{ fontSize: '11px', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={fobBlIssuance}
                            onChange={(e) => setFobBlIssuance(e.target.checked)}
                          />
                          Bill of Lading / Sea Waybill
                        </label>
                        <label className="check" style={{ fontSize: '11px', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={fobTerminalHandling}
                            onChange={(e) => setFobTerminalHandling(e.target.checked)}
                          />
                          Terminal Handling & Gate-in (OTHC)
                        </label>
                        <label className="check" style={{ fontSize: '11px', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={fobVgmSubmission}
                            onChange={(e) => setFobVgmSubmission(e.target.checked)}
                          />
                          VGM Electronic Filing
                        </label>
                        <label className="check" style={{ fontSize: '11px', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={fobCfsCarting}
                            onChange={(e) => setFobCfsCarting(e.target.checked)}
                          />
                          CFS Carting &amp; Port Inspection
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Destination Charges */}
              <div className="card">
                <div className="cardhead">Destination Charges Scope</div>
                <div className="cardbody">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={destTrans}
                      onChange={(e) => setDestTrans(e.target.checked)}
                    />
                    Transportation (Last Mile Delivery)
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={destClear}
                      onChange={(e) => setDestClear(e.target.checked)}
                    />
                    Customs Clearance (Import Clearance)
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={destCarrier}
                      onChange={(e) => setDestCarrier(e.target.checked)}
                    />
                    Carrier Local Charges & Destination DTHC
                  </label>

                  {/* Conditional Destination Fields */}
                  {(destTrans || destClear) && (
                    <div className="subbox">
                      <h5>Destuffing & Customs Duty Scope</h5>
                      <div className="field" style={{ marginBottom: '8px' }}>
                        <label>Destuffing Address</label>
                        <input
                          className="input"
                          placeholder="Consignee Warehouse / Hub"
                          value={destDestuffAddr}
                          onChange={(e) => setDestDestuffAddr(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                        <label className="check">
                          <input
                            type="radio"
                            name="dutyPaidGroup"
                            checked={dutyPaidBy === 'us'}
                            onChange={() => setDutyPaidBy('us')}
                          />
                          Duty Paid by Us (DDP)
                        </label>
                        <label className="check">
                          <input
                            type="radio"
                            name="dutyPaidGroup"
                            checked={dutyPaidBy === 'consignee'}
                            onChange={() => setDutyPaidBy('consignee')}
                          />
                          Duty Paid by Consignee
                        </label>
                      </div>

                      {/* Conditional Duty Fields */}
                      {dutyPaidBy === 'us' && (
                        <div className="grid g3" style={{ marginTop: '8px' }}>
                          <div className="field">
                            <label>Cargo Commodity</label>
                            <input
                              className="input"
                              value={dutyCargoCommodity}
                              onChange={(e) => setDutyCargoCommodity(e.target.value)}
                              placeholder="Declared commodity"
                            />
                          </div>
                          <div className="field">
                            <label>HS Code</label>
                            <input
                              className="input"
                              value={dutyHsCode}
                              onChange={(e) => setDutyHsCode(e.target.value)}
                              placeholder="Harmonized code"
                            />
                          </div>
                          <div className="field">
                            <label>Approx. Cargo Value</label>
                            <input
                              className="input"
                              value={dutyApproxValue}
                              onChange={(e) => setDutyApproxValue(e.target.value)}
                              placeholder="e.g. $45,000 USD"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3.5: Routing Requirements + Free Time */}
        <section className="section">
          <div className="sectiontitle">
            <span className="num">3B</span>
            Routing Requirements &amp; Free Time
            <span>Preferred service lines, transshipment preference, and free time allocation</span>
          </div>
          <div className="sectionbody">
            <div className="grid g2">
              {/* Routing Requirements card */}
              <div className="card">
                <div className="cardhead">Routing Requirements</div>
                <div className="cardbody">
                  <div className="field" style={{ marginBottom: '8px' }}>
                    <label>Preferred Shipping Line</label>
                    <select className="input" value={preferredShippingLine} onChange={(e) => setPreferredShippingLine(e.target.value)}>
                      <option value="">-- Select --</option>
                      <option value="Maersk">Maersk</option>
                      <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                      <option value="CMA CGM">CMA CGM</option>
                      <option value="MSC">MSC</option>
                      <option value="ONE Line">ONE Line</option>
                      <option value="Evergreen">Evergreen</option>
                      <option value="COSCO">COSCO</option>
                    </select>
                  </div>
                  <div className="field" style={{ marginBottom: '8px' }}>
                    <label>Acceptable Shipping Lines</label>
                    <input className="input" placeholder="e.g. Maersk, Hapag, CMA (comma-separated)" value={acceptableLines}
                      onChange={(e) => setAcceptableLines(e.target.value)} />
                  </div>
                  <div className="field" style={{ marginBottom: '8px' }}>
                    <label>Direct / Transshipment Preference</label>
                    <select className="input" value={directTransshipment} onChange={(e) => setDirectTransshipment(e.target.value as any)}>
                      <option value="Direct">Direct Only</option>
                      <option value="Transshipment">Transshipment Accepted</option>
                      <option value="Both">Both Direct &amp; Transshipment</option>
                    </select>
                  </div>
                  <div className="field" style={{ marginBottom: '8px' }}>
                    <label>Preferred Route</label>
                    <input className="input" placeholder="e.g. Suez / Cape of Good Hope" value={preferredRoute}
                      onChange={(e) => setPreferredRoute(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Preferred Transit Time (Days)</label>
                    <input className="input" type="number" placeholder="e.g. 28" value={preferredTransitTime}
                      onChange={(e) => setPreferredTransitTime(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Free Time Requirements card */}
              <div className="card">
                <div className="cardhead">Free Time Requirement</div>
                <div className="cardbody">
                  <div className="grid g2" style={{ marginBottom: '8px' }}>
                    <div className="field">
                      <label>Origin Detention (Days)</label>
                      <input className="input" type="number" placeholder="0" value={originDetention}
                        onChange={(e) => setOriginDetention(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Origin Demurrage (Days)</label>
                      <input className="input" type="number" placeholder="0" value={originDemurrage}
                        onChange={(e) => setOriginDemurrage(e.target.value)} />
                    </div>
                  </div>
                  <div className="field" style={{ marginBottom: '8px' }}>
                    <label>Clearance on Detention (Days)</label>
                    <input className="input" type="number" placeholder="0" value={clearanceDetention}
                      onChange={(e) => setClearanceDetention(e.target.value)} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600 }}>Special Free Time Entries</label>
                      <button type="button" className="btn secondary sm" onClick={() => setSpecialFreeTime((prev) => [...prev, { label: '', days: '' }])}>
                        <Plus size={11} /> Add Row
                      </button>
                    </div>
                    {specialFreeTime.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 28px', gap: '4px', marginBottom: '5px' }}>
                        <input className="input" placeholder="Description" value={item.label}
                          onChange={(e) => setSpecialFreeTime((prev) => prev.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} />
                        <input className="input" type="number" placeholder="Days" value={item.days}
                          onChange={(e) => setSpecialFreeTime((prev) => prev.map((r, idx) => idx === i ? { ...r, days: e.target.value } : r))} />
                        <button type="button" className="btn danger sm icon" onClick={() => setSpecialFreeTime((prev) => prev.filter((_, idx) => idx !== i))}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {specialFreeTime.length === 0 && (
                      <p style={{ fontSize: '11px', color: 'var(--mut)', textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                        No special free time entries. Click + Add Row.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Bidders, Rules &amp; Documents */}
        <section className="section">
          <div className="sectiontitle">
            <span className="num">4</span>
            Bidders, Rules & Compliance
            <span>Verified forwarder assignment, privacy controls, and publication</span>
          </div>
          <div className="sectionbody">
            <div className="grid g3">
              {/* Select Bidders with Dynamic Search & Groups */}
              <div className="card">
                <div className="cardhead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Select Bidders</span>
                  <span className="sub">{assignedBidders.size} Assigned</span>
                </div>
                <div className="cardbody" style={{ padding: '10px' }}>
                  {/* Saved Bidder Groups */}
                  {savedBidderGroups.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--mut)', display: 'block', marginBottom: '2px' }}>Load Saved Bidder Group:</label>
                      <select
                        className="input"
                        style={{ height: '28px', fontSize: '11px', padding: '0 6px' }}
                        onChange={(e) => {
                          const grp = savedBidderGroups.find(g => g.id === e.target.value);
                          if (grp) {
                            setAssignedBidders(new Set(grp.bidders.map((b) => b.id)));
                            toast(`Loaded group "${grp.name}" (${grp.bidders.length} bidders).`);
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>-- Select a Bidder Group --</option>
                        {savedBidderGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.bidders.length} members)</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Search Input */}
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <input
                      className="input"
                      style={{ height: '28px', fontSize: '11px', paddingLeft: '24px' }}
                      placeholder="Search company, carrier or city..."
                      value={bidderSearchQuery}
                      onChange={(e) => setBidderSearchQuery(e.target.value)}
                    />
                    <Search size={11} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--mut)' }} />
                  </div>

                  {/* Bidder List */}
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {availableBidders
                      .filter((b) => {
                        if (!bidderSearchQuery.trim()) return true;
                        const q = bidderSearchQuery.toLowerCase();
                        return (
                          b.name.toLowerCase().includes(q) ||
                          b.company.toLowerCase().includes(q) ||
                          b.location.toLowerCase().includes(q)
                        );
                      })
                      .map((b) => {
                        const isAssigned = assignedBidders.has(b.id);
                        const isBlocked = blockedBidders.has(b.id);

                        return (
                          <div
                            key={b.id}
                            className="record"
                            style={{ padding: '6px 4px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ProfileLink name={b.name} company={b.company} hasGoldenTick={b.hasGoldenTick} />
                              </div>
                              <small style={{ fontSize: '10px', color: 'var(--mut)', display: 'block' }}>
                                {b.role} · {b.company}
                              </small>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <label className="check" style={{ fontSize: '11px', margin: 0 }}>
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  disabled={isBlocked}
                                  onChange={() => toggleAssignBidder(b.id)}
                                />
                                Assign
                              </label>
                              <button
                                type="button"
                                className={`btn sm ${isBlocked ? 'secondary' : 'danger'}`}
                                style={{ padding: '1px 6px', fontSize: '10px' }}
                                onClick={() => toggleBlockBidder(b.id)}
                                title={isBlocked ? 'Unblock bidder' : 'Block bidder from this auction'}
                              >
                                {isBlocked ? 'Unblock' : 'Block'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Save current selection as Bidder Group */}
                  {assignedBidders.size > 0 && (
                    <div style={{ marginTop: '8px', borderTop: '1px dashed var(--line)', paddingTop: '6px', display: 'flex', gap: '4px' }}>
                      <input
                        className="input"
                        placeholder="Group name (e.g. EU Core)"
                        style={{ height: '26px', fontSize: '10.5px' }}
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn secondary sm"
                        style={{ padding: '0 8px', fontSize: '10px', whiteSpace: 'nowrap' }}
                        onClick={async () => {
                          if (!newGroupName.trim() || !user) return;
                          const selectedBiddersList = availableBidders.filter((b) => assignedBidders.has(b.id));
                          const newGrp: BidderGroup = {
                            id: `bg_${Date.now()}`,
                            ownerUid: user.uid,
                            name: newGroupName.trim(),
                            bidders: selectedBiddersList,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          };
                          await saveBidderGroupInDB(newGrp);
                          setSavedBidderGroups((prev) => [newGrp, ...prev]);
                          setNewGroupName('');
                          toast(`Bidder group "${newGrp.name}" saved!`);
                        }}
                      >
                        Save Group
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Auction Rules */}
              <div className="card">
                <div className="cardhead">Auction Protocol & Rules</div>
                <div className="cardbody">
                  <div className="switchrow">
                    <span>Auto Extension (Anti-Sniping)</span>
                    <input
                      type="checkbox"
                      className="switch"
                      checked={autoExtension}
                      onChange={(e) => setAutoExtension(e.target.checked)}
                    />
                  </div>
                  {autoExtension && (
                    <div className="field" style={{ marginTop: '6px', marginBottom: '6px', paddingLeft: '8px' }}>
                      <label style={{ fontSize: '11px' }}>Extension (Minutes)</label>
                      <input type="number" className="input" style={{ height: '28px' }} value={autoExtensionMinutes} min={1} max={30}
                        onChange={(e) => setAutoExtensionMinutes(Number(e.target.value))} />
                    </div>
                  )}
                  <div className="switchrow">
                    <span>Ranking Visible to Bidders</span>
                    <input
                      type="checkbox"
                      className="switch"
                      checked={rankingVisible}
                      onChange={(e) => setRankingVisible(e.target.checked)}
                    />
                  </div>
                  <div className="switchrow">
                    <span>Hide Competitor Names</span>
                    <input
                      type="checkbox"
                      className="switch"
                      checked={hideCompetitorNames}
                      onChange={(e) => setHideCompetitorNames(e.target.checked)}
                    />
                  </div>
                  <div className="switchrow">
                    <span>Complete Bidder Anonymity</span>
                    <input
                      type="checkbox"
                      className="switch"
                      checked={bidderAnonymity}
                      onChange={(e) => setBidderAnonymity(e.target.checked)}
                    />
                  </div>
                  <div className="switchrow">
                    <span>Lowest Bid as Ceiling</span>
                    <input
                      type="checkbox"
                      className="switch"
                      checked={lowestBidCeiling}
                      onChange={(e) => setLowestBidCeiling(e.target.checked)}
                    />
                  </div>
                  <div className="switchrow">
                    <span>Auction Reopening</span>
                    <input
                      type="checkbox"
                      className="switch"
                      checked={auctionReopening}
                      onChange={(e) => setAuctionReopening(e.target.checked)}
                    />
                  </div>
                  <div className="field" style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '11px' }}>Auction Withdrawal</label>
                    <select className="input" style={{ height: '30px' }} value={auctionWithdrawal}
                      onChange={(e) => setAuctionWithdrawal(e.target.value as 'Allowed' | 'Not Allowed')}>
                      <option value="Allowed">Allowed</option>
                      <option value="Not Allowed">Not Allowed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Information & Documents */}
              <div className="card">
                <div className="cardhead">Instructions & Docs</div>
                <div className="cardbody">
                  <div className="field" style={{ marginBottom: '8px' }}>
                    <label>Max Bids per Forwarder</label>
                    <input
                      type="number"
                      className="input"
                      value={bidLimit}
                      min="1"
                      max="20"
                      onChange={(e) => setBidLimit(Number(e.target.value))}
                    />
                  </div>
                  <div className="field">
                    <label>Special Instructions</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                    <button type="button" className="btn secondary sm" onClick={() => toast('MSDS Attachment uploaded.')}>
                      <FileCheck size={12} /> MSDS Sheet
                    </button>
                    <button type="button" className="btn secondary sm" onClick={() => toast('Packing list dimensions attached.')}>
                      <Layers size={12} /> Packing Dimensions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Publication Action Bar */}
        <div className="actionbar">
          <small>
            Draft auto-saved · Assigned bidders receive structured formal auction tables upon publication. Payment required to publish.
          </small>
          <div className="actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowPreviewModal(true)}
            >
              <Eye size={14} /> Preview Summary
            </button>
            <button type="submit" className="btn primary" onClick={(e) => { e.preventDefault(); setShowPaymentModal(true); }}>
              <Rocket size={14} /> Pay & Publish Auction
            </button>
          </div>
        </div>
      </form>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Preview Reverse Auction Publication"
        footer={
          <>
            <button className="btn secondary" onClick={() => setShowPreviewModal(false)}>
              Edit Details
            </button>
            <button className="btn primary" onClick={() => { setShowPreviewModal(false); setShowPaymentModal(true); }}>
              Continue to Payment
            </button>
          </>
        }
      >
        <div className="grid g3" style={{ marginBottom: '12px' }}>
          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <b style={{ fontSize: '12px' }}>{title || 'Untitled Auction'}</b>
            <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '3px 0 0' }}>
              Type: {auctionType} · RFQ: {rfqId}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '2px 0 0' }}>
              Duration: {durationMinutes} min · End: {endDateTime}
            </p>
          </div>
          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <b style={{ fontSize: '12px' }}>Lane & Incoterms</b>
            <p style={{ fontSize: '11px', color: 'var(--ink-secondary)', margin: '3px 0 0' }}>
              POL: <b>{pol || '—'}</b>
            </p>
            <p style={{ fontSize: '11px', color: 'var(--ink-secondary)', margin: '2px 0 0' }}>
              POD: <b>{pod || '—'}</b>
            </p>
            <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '2px 0 0' }}>
              Incoterm: {incoterm}
            </p>
          </div>
          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <b style={{ fontSize: '12px' }}>Selected Forwarders</b>
            <p style={{ fontSize: '11px', color: 'var(--brand)', margin: '3px 0 0', fontWeight: 600 }}>
              {assignedBidders.size} Invited Verified Bidder(s)
            </p>
            <p style={{ fontSize: '10.5px', color: 'var(--mut)', margin: '2px 0 0' }}>
              {Array.from(assignedBidders)
                .map((id) => availableBidders.find((b) => b.id === id)?.name)
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        </div>

        <div className="card cardbody">
          <b style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Container Equipment Summary</b>
          <p style={{ fontSize: '11.5px', color: 'var(--ink-secondary)' }}>
            {containers.length} container equipment row(s) configured. Total quantity:{' '}
            {containers.reduce((sum, c) => sum + c.quantity, 0)} units. Commodity: {commodity} (HS {hsCode}).
          </p>
        </div>
      </Modal>

      {/* Auction Posting Fee Payment Modal */}
      {showPaymentModal && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Reverse Auction Posting & Publication Fee"
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px 16px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <small style={{ color: 'var(--brand)', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase' }}>
                    RFQ Auction Creation Fee
                  </small>
                  <b style={{ display: 'block', fontSize: '16px', color: 'var(--ink)', marginTop: '2px' }}>
                    {title || `${pol || 'POL'} → ${pod || 'POD'} Reverse Auction`}
                  </b>
                  <small style={{ color: 'var(--mut)', fontSize: '11px' }}>RFQ ID: {rfqId} · Duration: {durationMinutes} mins</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand)' }}>
                    {user.hasGoldenTick ? '₹180 INR' : '₹300 INR'}
                  </span>
                  {user.hasGoldenTick && (
                    <span className="badge green" style={{ fontSize: '9px', display: 'block', marginTop: '2px' }}>
                      40% PREMIUM DISCOUNT APPLIED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Posting vs Participation Fee Notice */}
            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px', color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
              <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                💡 Transparent Fee Structure Policy:
              </b>
              <ul style={{ paddingLeft: '16px', margin: 0 }}>
                <li><b>Posting Fee:</b> Charged once to the shipper/forwarder creating and publishing the RFQ auction room.</li>
                <li><b>Bidder Participation:</b> <b>100% FREE (₹0)</b> for all participating freight forwarders and NVOCCs.</li>
                <li>Includes automated rank computations, multi-container charge breakdowns, and audit trails.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              <button className="btn secondary" onClick={() => setShowPaymentModal(false)}>
                Back to Edit
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  const newId = addAuction({
                    title: title || `${pol || 'Origin'} to ${pod || 'Destination'} Spot Bidding`,
                    auctionType,
                    startDate,
                    startTime,
                    durationMinutes,
                    endDateTime,
                    timezone,
                    shipment: {
                      por: por || pol,
                      pol: pol || 'Nhava Sheva (INNSA), India',
                      pod: pod || 'Rotterdam (NLRTM), Netherlands',
                      finalDestination: finalDest || pod || 'Rotterdam (NLRTM), Netherlands',
                      cargoReadyDate,
                      shipmentType,
                      incoterm,
                      rateCurrency: rateCurrency || 'USD',
                      commodity,
                      hsCode,
                      weightKg: grossWeight,
                      cbm,
                      isHazardous: false,
                      specialRequirements: notes,
                    },
                    containers,
                    rules: {
                      autoExtension,
                      rankingVisible,
                      hideCompetitorNames,
                      bidderAnonymity,
                      bidLimit,
                    },
                  });
                  setShowPaymentModal(false);
                  toast(`Auction ${newId} published live! Bidders notified.`);
                  router.push('/auctions');
                }}
              >
                <Rocket size={14} /> Pay & Launch Auction Live
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
