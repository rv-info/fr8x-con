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
  AlertCircle,
} from 'lucide-react';
import { PaymentCheckoutModal } from '@/components/ui/PaymentCheckoutModal';
import { getStoredPlatformConfig, isFeatureFreeForUser } from '@/lib/platform-config';

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
    id: 'u-apex',
    name: 'Apex Global Logistics & Freight',
    role: 'Freight Forwarder',
    company: 'Apex Global Logistics Pvt Ltd',
    location: 'Mumbai / Nhava Sheva',
    timezone: 'Asia/Kolkata',
    hasGoldenTick: true,
  },
  {
    id: 'u-transworld',
    name: 'TransWorld NVOCC Solutions',
    role: 'NVOCC Equipment Operator',
    company: 'TransWorld Container Line',
    location: 'Mundra / Dubai',
    timezone: 'Asia/Kolkata',
    hasGoldenTick: true,
  },
  {
    id: 'u-radiant',
    name: 'Radiant Multimodal Freight',
    role: 'Freight Forwarder',
    company: 'Radiant Global Logistics',
    location: 'Chennai / Singapore',
    timezone: 'Asia/Kolkata',
    hasGoldenTick: true,
  },
  {
    id: 'u-interglobal',
    name: 'InterGlobal Line NVOCC',
    role: 'NVOCC Equipment Operator',
    company: 'InterGlobal Container Lines',
    location: 'New Delhi / ICD Tughlakabad',
    timezone: 'Asia/Kolkata',
    hasGoldenTick: true,
  },
  {
    id: 'u-bluedart',
    name: 'BlueOcean Freight Forwarding',
    role: 'Freight Forwarder',
    company: 'BlueOcean Logistics Group',
    location: 'Ahmedabad / Pipavav',
    timezone: 'Asia/Kolkata',
    hasGoldenTick: true,
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

    // Load registered Freight Forwarders and NVOCCs from platform directory
    fetch('/api/members?role=forwarder_nvocc')
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.members) && data.members.length > 0) {
          const registeredCandidates: VerifiedBidderCandidate[] = data.members.map((m: any) => ({
            id: m.uid,
            name: m.displayName || m.company,
            role: m.role?.toLowerCase().includes('nvocc') ? 'NVOCC Equipment Operator' : 'Freight Forwarder',
            company: m.company,
            location: m.location || `${m.city}, ${m.country}`,
            timezone: m.timezone || 'Asia/Kolkata',
            hasGoldenTick: Boolean(m.hasGoldenTick),
          }));
          setAvailableBidders((prev) => {
            const map = new Map<string, VerifiedBidderCandidate>();
            registeredCandidates.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => {
              if (!map.has(c.id)) map.set(c.id, c);
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, [user?.uid]);

  // MSDS Modal & Data State (Requirement 3)
  const [showMsdsModal, setShowMsdsModal] = useState(false);
  const [msdsData, setMsdsData] = useState({
    chemicalName: '',
    unNumber: '',
    imoClass: 'Class 3 - Flammable Liquids',
    packingGroup: 'PG II',
    flashPoint: '',
    emergencyContact: '',
    emergencyPhone: '',
    specialHandling: '',
    isConfirmed: false,
    isSaved: false,
  });

  // Packing Dimensions Modal & Data State (Requirement 3)
  const [showPackingDimsModal, setShowPackingDimsModal] = useState(false);
  const [packingDimsData, setPackingDimsData] = useState({
    packageType: 'Wooden Pallets',
    quantity: 10,
    lengthCm: 120,
    widthCm: 100,
    heightCm: 150,
    weightKg: 850,
    isStackable: 'Yes (Up to 2 tiers)',
    isConfirmed: false,
    isSaved: false,
  });

  // Routing Requirements: Custom unlisted carriers with Maroon status (Requirement 4)
  const [customCarriers, setCustomCarriers] = useState<Array<{ name: string; scac?: string; notes?: string; status: string }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('fr8x_custom_carriers_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [showAddCarrierModal, setShowAddCarrierModal] = useState(false);
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newCarrierScac, setNewCarrierScac] = useState('');
  const [newCarrierNotes, setNewCarrierNotes] = useState('');

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
  const [askContainerNo, setAskContainerNo] = useState(false);
  const [showCompetitionCeiling, setShowCompetitionCeiling] = useState(true);
  const [competitionCeilingAmount, setCompetitionCeilingAmount] = useState<number>(2850);

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

  // Payment Modal — triggered before publish
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
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
  const handlePublish = (paymentDetails?: {
    paymentStatus?: 'paid' | 'pending_verification' | 'waived_promotional' | 'unpaid';
    paidAmount?: number;
    paymentMethod?: string;
    paymentReference?: string;
  }) => {
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

    const planPrice = PLANS.find((p) => p.id === selectedPlan)?.price || 999;
    const finalPaymentStatus = paymentDetails?.paymentStatus || 'paid';
    const isLive = finalPaymentStatus === 'paid' || finalPaymentStatus === 'waived_promotional';

    const newAuctionId = addAuction({
      title: title.trim(),
      rfqId,
      auctionType,
      startDate,
      startTime,
      durationMinutes: Number(durationMinutes),
      endDateTime,
      timezone,
      status: isLive ? 'Live' : 'Draft',
      isPublished: isLive,
      paymentStatus: finalPaymentStatus,
      paidAmount: paymentDetails?.paidAmount !== undefined ? paymentDetails.paidAmount : planPrice,
      paymentMethod: paymentDetails?.paymentMethod || 'Online Gateway / UPI',
      paymentReference: paymentDetails?.paymentReference,
      paymentVerifiedAt: isLive ? new Date().toISOString() : undefined,
      paymentVerifiedBy: isLive ? 'Platform Clearance' : undefined,
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
        askContainerNo,
        showCompetitionCeiling,
      },
      askContainerNo,
      showCompetitionCeiling,
      competitionCeiling: showCompetitionCeiling ? Number(competitionCeilingAmount || 2850) : 0,
    });

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
          <div className="plans-grid">
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
                const config = getStoredPlatformConfig();
                const isFree = isFeatureFreeForUser(config, 'REVERSE_AUCTION', user.uid);
                if (isFree) {
                  setShowPaymentModal(false);
                  handlePublish({
                    paymentStatus: 'waived_promotional',
                    paidAmount: 0,
                    paymentMethod: 'Godfather Promotional Waiver',
                  });
                  return;
                }
                setShowPaymentModal(false);
                setShowCheckoutModal(true);
              }}
            >
              💳 Pay ₹{PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString()} &amp; Publish
            </button>
          </div>
        </div>
      </Modal>

      {/* Reverse Auction Commercial Payment Modal */}
      {showCheckoutModal && (
        <PaymentCheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          itemType="auction"
          itemTitle={title.trim() || 'Reverse Auction Listing'}
          amount={PLANS.find(p => p.id === selectedPlan)?.price || 999}
          onPaymentSuccess={(details) => {
            setShowCheckoutModal(false);
            handlePublish(details);
          }}
        />
      )}

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
                  value="Auto-generated on publish"
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

              {/* Desktop Equipment Table */}
              <div className="tablewrap auctions-create-desktop-table">
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

              {/* Mobile / Tablet Container Equipment Cards */}
              <div className="auctions-create-mobile-cards">
                {containers.map((row, idx) => (
                  <div key={row.id} className="auctions-create-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, background: '#0f172a', color: '#ffffff', borderRadius: '4px', padding: '2px 6px' }}>
                          #{idx + 1}
                        </span>
                        <b style={{ fontSize: '12px', color: 'var(--ink)' }}>{row.equipmentType.split(' (')[0]}</b>
                      </div>
                      {containers.length > 1 && (
                        <button
                          type="button"
                          className="btn danger sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => removeContainerRow(row.id)}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid g2" style={{ gap: '8px' }}>
                      <div className="field">
                        <label>Equipment Type</label>
                        <select
                          className="input"
                          value={row.equipmentType}
                          onChange={(e) => updateContainerRow(row.id, 'equipmentType', e.target.value)}
                        >
                          {FREIGHT_EQUIPMENT.map((eq) => (
                            <option key={eq} value={eq}>{eq}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>Container Type</label>
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
                      </div>
                    </div>

                    <div className="grid g2" style={{ gap: '8px' }}>
                      <div className="field">
                        <label>Quantity (Units)</label>
                        <input
                          type="number"
                          className="input"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => updateContainerRow(row.id, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="field">
                        <label>Gross Weight (KG)</label>
                        <input
                          type="number"
                          className="input"
                          value={row.grossWeight}
                          onChange={(e) => updateContainerRow(row.id, 'grossWeight', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid g2" style={{ gap: '8px' }}>
                      <div className="field">
                        <label>Pickup Location</label>
                        <input
                          className="input"
                          placeholder="Port CFS / Depot"
                          value={row.pickupLocation}
                          onChange={(e) => updateContainerRow(row.id, 'pickupLocation', e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Empty Return Location</label>
                        <input
                          className="input"
                          placeholder="Discharge CY Depot"
                          value={row.emptyReturnLocation}
                          onChange={(e) => updateContainerRow(row.id, 'emptyReturnLocation', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid g2" style={{ gap: '8px' }}>
                      <div className="field">
                        <label>HS Code</label>
                        <input
                          className="input"
                          placeholder="HS Code"
                          value={row.hsCode}
                          onChange={(e) => updateContainerRow(row.id, 'hsCode', e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Special Equipment / Handling</label>
                        <select
                          className="input"
                          value={row.isSpecial ? 'Yes' : 'No'}
                          onChange={(e) => updateContainerRow(row.id, 'isSpecial', e.target.value === 'Yes')}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn secondary"
                  style={{ width: '100%', padding: '10px', fontWeight: 700, fontSize: '12px', justifyContent: 'center' }}
                  onClick={addContainerRow}
                >
                  <Plus size={14} /> Add Another Container Row
                </button>
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
                <div className="cardhead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Routing Requirements</span>
                  <button
                    type="button"
                    className="btn secondary sm"
                    onClick={() => setShowAddCarrierModal(true)}
                    style={{ fontSize: '10.5px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    title="Add carrier not found in Masters"
                  >
                    <Plus size={12} /> Add Carrier
                  </button>
                </div>
                <div className="cardbody">
                  <div className="field" style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Preferred Shipping Line</label>
                      {customCarriers.some((c) => c.name === preferredShippingLine) && (
                        <span style={{ fontSize: '9.5px', color: '#800000', background: '#fee2e2', border: '1px solid #800000', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                          Maroon: Pending Godfather Approval
                        </span>
                      )}
                    </div>
                    <select
                      className="input"
                      value={preferredShippingLine}
                      onChange={(e) => setPreferredShippingLine(e.target.value)}
                      style={customCarriers.some((c) => c.name === preferredShippingLine) ? { borderColor: '#800000', color: '#800000', fontWeight: 'bold', background: '#fff5f5' } : {}}
                    >
                      <option value="">-- Select --</option>
                      <optgroup label="Standard Master Carriers">
                        <option value="Maersk">Maersk</option>
                        <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                        <option value="CMA CGM">CMA CGM</option>
                        <option value="MSC">MSC</option>
                        <option value="ONE Line">ONE Line</option>
                        <option value="Evergreen">Evergreen</option>
                        <option value="COSCO">COSCO</option>
                      </optgroup>
                      {customCarriers.length > 0 && (
                        <optgroup label="Unapproved Carriers (Pending Godfather)" style={{ color: '#800000' }}>
                          {customCarriers.map((c) => (
                            <option key={c.name} value={c.name} style={{ color: '#800000', fontWeight: 'bold' }}>
                              {c.name} {c.scac ? `(${c.scac})` : ''} — [Pending Approval]
                            </option>
                          ))}
                        </optgroup>
                      )}
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
                    <div>
                      <span style={{ fontWeight: 600 }}>Competition Ceiling (Reverse Auction)</span>
                      <small style={{ display: 'block', color: 'var(--mut)', fontSize: '10px' }}>
                        Shows target budget ceiling to create transparent, fair competition among forwarders.
                      </small>
                    </div>
                    <input
                      type="checkbox"
                      className="switch"
                      checked={showCompetitionCeiling}
                      onChange={(e) => setShowCompetitionCeiling(e.target.checked)}
                    />
                  </div>

                  {showCompetitionCeiling && (
                    <div className="field" style={{ marginTop: '4px', marginBottom: '8px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 700 }}>Competition Ceiling Amount (USD $)</label>
                      <input
                        type="number"
                        className="input"
                        style={{ height: '28px', fontWeight: 700 }}
                        value={competitionCeilingAmount}
                        onChange={(e) => setCompetitionCeilingAmount(Number(e.target.value))}
                        placeholder="2850"
                      />
                    </div>
                  )}

                  <div className="switchrow">
                    <div>
                      <span style={{ fontWeight: 600 }}>Require Container No. in Bidding Matrix</span>
                      <small style={{ display: 'block', color: 'var(--mut)', fontSize: '10px' }}>
                        Only asks bidders for specific container numbers if explicitly requested in this post.
                      </small>
                    </div>
                    <input
                      type="checkbox"
                      className="switch"
                      checked={askContainerNo}
                      onChange={(e) => setAskContainerNo(e.target.checked)}
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
                    <select
                      className="input"
                      value={bidLimit}
                      onChange={(e) => setBidLimit(Number(e.target.value))}
                    >
                      <option value={1}>1 submission</option>
                      <option value={3}>3 submissions</option>
                      <option value={5}>5 submissions</option>
                    </select>
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
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`btn sm ${msdsData.isSaved ? 'primary' : 'secondary'}`}
                      onClick={() => setShowMsdsModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <FileCheck size={12} /> {msdsData.isSaved ? `MSDS Attached (${msdsData.unNumber || 'Saved'}) ✓` : 'MSDS Sheet'}
                    </button>
                    <button
                      type="button"
                      className={`btn sm ${packingDimsData.isSaved ? 'primary' : 'secondary'}`}
                      onClick={() => setShowPackingDimsModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Layers size={12} /> {packingDimsData.isSaved ? `Packing Dims Configured (${((packingDimsData.quantity * packingDimsData.lengthCm * packingDimsData.widthCm * packingDimsData.heightCm) / 1000000).toFixed(1)} CBM) ✓` : 'Packing Dimensions'}
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
            Draft auto-saved · Assigned NVOCCs &amp; Freight Forwarders receive structured reverse auction room upon publication.
          </small>
          <div className="actions">
            <button type="submit" className="btn primary" onClick={(e) => { e.preventDefault(); setShowPaymentModal(true); }}>
              <Rocket size={14} /> Pay &amp; Publish Auction
            </button>
          </div>
        </div>
      </form>

      {/* MSDS Sheet Modal (Requirement 3) */}
      <Modal
        isOpen={showMsdsModal}
        onClose={() => setShowMsdsModal(false)}
        title="Material Safety Data Sheet (MSDS) & Dangerous Goods Configuration"
        maxWidth="640px"
        footer={
          <>
            <button type="button" className="btn secondary" onClick={() => setShowMsdsModal(false)}>
              Close
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                if (!msdsData.isConfirmed) {
                  toast('Please confirm the MSDS verification statement to save.');
                  return;
                }
                setMsdsData((prev) => ({ ...prev, isSaved: true }));
                toast('MSDS Sheet details saved and attached to auction.');
                setShowMsdsModal(false);
              }}
            >
              Save &amp; Close
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '10px 12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '11.5px', color: '#1e40af' }}>
            <FileCheck size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Provide compliant IMDG Dangerous Goods details for carrier stowage declaration.
          </div>

          <div className="grid g2">
            <div className="field">
              <label>Chemical / Product Name *</label>
              <input
                className="input"
                placeholder="e.g. Ethyl Acetate Solution"
                value={msdsData.chemicalName}
                onChange={(e) => setMsdsData({ ...msdsData, chemicalName: e.target.value })}
              />
            </div>
            <div className="field">
              <label>UN Number (4 digits) *</label>
              <input
                className="input"
                placeholder="e.g. UN 1173"
                value={msdsData.unNumber}
                onChange={(e) => setMsdsData({ ...msdsData, unNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid g3">
            <div className="field">
              <label>IMO Hazard Class *</label>
              <select
                className="input"
                value={msdsData.imoClass}
                onChange={(e) => setMsdsData({ ...msdsData, imoClass: e.target.value })}
              >
                <option value="Class 1 - Explosives">Class 1 - Explosives</option>
                <option value="Class 2.1 - Flammable Gas">Class 2.1 - Flammable Gas</option>
                <option value="Class 2.2 - Non-Flammable Gas">Class 2.2 - Non-Flammable Gas</option>
                <option value="Class 3 - Flammable Liquids">Class 3 - Flammable Liquids</option>
                <option value="Class 4.1 - Flammable Solids">Class 4.1 - Flammable Solids</option>
                <option value="Class 5.1 - Oxidizing Substances">Class 5.1 - Oxidizing Substances</option>
                <option value="Class 6.1 - Toxic Substances">Class 6.1 - Toxic Substances</option>
                <option value="Class 8 - Corrosives">Class 8 - Corrosives</option>
                <option value="Class 9 - Miscellaneous DG">Class 9 - Miscellaneous DG</option>
                <option value="Non-DG Cargo">Non-DG Cargo</option>
              </select>
            </div>
            <div className="field">
              <label>Packing Group</label>
              <select
                className="input"
                value={msdsData.packingGroup}
                onChange={(e) => setMsdsData({ ...msdsData, packingGroup: e.target.value })}
              >
                <option value="PG I - Great Danger">PG I - Great Danger</option>
                <option value="PG II - Medium Danger">PG II - Medium Danger</option>
                <option value="PG III - Minor Danger">PG III - Minor Danger</option>
                <option value="None / Not Applicable">None / N/A</option>
              </select>
            </div>
            <div className="field">
              <label>Flash Point (°C)</label>
              <input
                className="input"
                placeholder="e.g. -4°C"
                value={msdsData.flashPoint}
                onChange={(e) => setMsdsData({ ...msdsData, flashPoint: e.target.value })}
              />
            </div>
          </div>

          <div className="grid g2">
            <div className="field">
              <label>Emergency Contact Person</label>
              <input
                className="input"
                placeholder="e.g. Dr. Rajesh Kumar (DG Coordinator)"
                value={msdsData.emergencyContact}
                onChange={(e) => setMsdsData({ ...msdsData, emergencyContact: e.target.value })}
              />
            </div>
            <div className="field">
              <label>24/7 Emergency Phone Number</label>
              <input
                className="input"
                placeholder="e.g. +91 98200 12345"
                value={msdsData.emergencyPhone}
                onChange={(e) => setMsdsData({ ...msdsData, emergencyPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label>Special Stowage &amp; Handling Instructions</label>
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. Keep away from heat sources. Stow away from foodstuffs. Reefer temp 18°C-22°C."
              value={msdsData.specialHandling}
              onChange={(e) => setMsdsData({ ...msdsData, specialHandling: e.target.value })}
            />
          </div>

          {/* Confirm Text Box */}
          <div style={{ padding: '12px', background: '#f8fafc', border: '1.5px solid #0284c7', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11.5px', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={msdsData.isConfirmed}
                onChange={(e) => setMsdsData({ ...msdsData, isConfirmed: e.target.checked })}
                style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }}
              />
              <span>
                <b>Confirmation &amp; Compliance Statement:</b> I confirm that the MSDS data, UN classification, and DG technical details provided above are verified against official manufacturer safety datasheets, match physical cargo packaging, and strictly comply with IMDG Code and carrier stowage standards.
              </span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Packing Dimensions Modal (Requirement 3) */}
      <Modal
        isOpen={showPackingDimsModal}
        onClose={() => setShowPackingDimsModal(false)}
        title="Cargo Packaging Dimensions & Unit Specifications"
        maxWidth="640px"
        footer={
          <>
            <button type="button" className="btn secondary" onClick={() => setShowPackingDimsModal(false)}>
              Close
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                if (!packingDimsData.isConfirmed) {
                  toast('Please confirm the packaging verification statement to save.');
                  return;
                }
                const totalCbm = Number(((packingDimsData.quantity * packingDimsData.lengthCm * packingDimsData.widthCm * packingDimsData.heightCm) / 1000000).toFixed(2));
                const totalGross = Number((packingDimsData.quantity * packingDimsData.weightKg).toFixed(0));
                setCbm(totalCbm);
                setGrossWeight(totalGross);
                setPackingDimsData((prev) => ({ ...prev, isSaved: true }));
                toast(`Packing dimensions saved: ${totalCbm} CBM · ${totalGross} kg total.`);
                setShowPackingDimsModal(false);
              }}
            >
              Save &amp; Close
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '10px 12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '11.5px', color: '#1e40af' }}>
            <Layers size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Configure individual package dimensions and unit weights to compute total container volume (CBM) and payload.
          </div>

          <div className="grid g2">
            <div className="field">
              <label>Packaging Type *</label>
              <select
                className="input"
                value={packingDimsData.packageType}
                onChange={(e) => setPackingDimsData({ ...packingDimsData, packageType: e.target.value })}
              >
                <option value="Wooden Pallets">Wooden Pallets (Heat Treated ISPM-15)</option>
                <option value="Euro Pallets (120x80cm)">Euro Pallets (120x80cm)</option>
                <option value="Standard Pallets (120x100cm)">Standard Pallets (120x100cm)</option>
                <option value="Wooden Crates">Wooden Crates / Boxes</option>
                <option value="Corrugated Cartons">Corrugated Cartons</option>
                <option value="Steel Drums (200L)">Steel Drums (200L)</option>
                <option value="Plastic Drums">Plastic Drums</option>
                <option value="FIBC / Jumbo Bulk Bags">FIBC / Jumbo Bulk Bags</option>
                <option value="Loose / Unpacked Machinery">Loose / Unpacked Machinery</option>
              </select>
            </div>
            <div className="field">
              <label>Number of Packages / Units *</label>
              <input
                className="input"
                type="number"
                min={1}
                value={packingDimsData.quantity}
                onChange={(e) => setPackingDimsData({ ...packingDimsData, quantity: Math.max(1, Number(e.target.value)) })}
              />
            </div>
          </div>

          <div className="grid g3">
            <div className="field">
              <label>Length per unit (cm) *</label>
              <input
                className="input"
                type="number"
                min={1}
                value={packingDimsData.lengthCm}
                onChange={(e) => setPackingDimsData({ ...packingDimsData, lengthCm: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Width per unit (cm) *</label>
              <input
                className="input"
                type="number"
                min={1}
                value={packingDimsData.widthCm}
                onChange={(e) => setPackingDimsData({ ...packingDimsData, widthCm: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Height per unit (cm) *</label>
              <input
                className="input"
                type="number"
                min={1}
                value={packingDimsData.heightCm}
                onChange={(e) => setPackingDimsData({ ...packingDimsData, heightCm: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid g2">
            <div className="field">
              <label>Gross Weight per Unit (kg) *</label>
              <input
                className="input"
                type="number"
                min={1}
                value={packingDimsData.weightKg}
                onChange={(e) => setPackingDimsData({ ...packingDimsData, weightKg: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Cargo Stackability</label>
              <select
                className="input"
                value={packingDimsData.isStackable}
                onChange={(e) => setPackingDimsData({ ...packingDimsData, isStackable: e.target.value })}
              >
                <option value="Yes (Up to 2 tiers)">Yes (Up to 2 tiers)</option>
                <option value="Yes (Up to 3 tiers)">Yes (Up to 3 tiers)</option>
                <option value="Non-Stackable / Do Not Stack">Non-Stackable / Do Not Stack</option>
              </select>
            </div>
          </div>

          {/* Auto-Calculated Volume & Weight Summary Box */}
          <div style={{ padding: '10px 14px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Calculated Total Volume:</span>
              <b style={{ fontSize: '15px', color: '#0369a1' }}>
                {((packingDimsData.quantity * packingDimsData.lengthCm * packingDimsData.widthCm * packingDimsData.heightCm) / 1000000).toFixed(2)} CBM (m³)
              </b>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Calculated Total Gross Weight:</span>
              <b style={{ fontSize: '15px', color: '#0f172a' }}>
                {(packingDimsData.quantity * packingDimsData.weightKg).toLocaleString()} kg
              </b>
            </div>
          </div>

          {/* Confirm Text Box */}
          <div style={{ padding: '12px', background: '#f8fafc', border: '1.5px solid #0284c7', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11.5px', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={packingDimsData.isConfirmed}
                onChange={(e) => setPackingDimsData({ ...packingDimsData, isConfirmed: e.target.checked })}
                style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }}
              />
              <span>
                <b>Confirmation &amp; Dimension Guarantee:</b> I confirm that cargo unit dimensions, packaging integrity, and total gross weight have been measured accurately and comply with international container stuffing limits and ISO container door clearance.
              </span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Add Unlisted Carrier Modal (Requirement 4) */}
      <Modal
        isOpen={showAddCarrierModal}
        onClose={() => setShowAddCarrierModal(false)}
        title="Add Unlisted Carrier / Shipping Line"
        maxWidth="520px"
        footer={
          <>
            <button type="button" className="btn secondary" onClick={() => setShowAddCarrierModal(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn primary"
              style={{ background: '#800000', borderColor: '#800000' }}
              onClick={() => {
                if (!newCarrierName.trim()) {
                  toast('Please enter the carrier / shipping line name.');
                  return;
                }
                const newCarrier = {
                  name: newCarrierName.trim(),
                  scac: newCarrierScac.trim().toUpperCase(),
                  notes: newCarrierNotes.trim(),
                  status: 'pending_godfather_approval',
                };
                const updated = [...customCarriers, newCarrier];
                setCustomCarriers(updated);
                setPreferredShippingLine(newCarrier.name);
                try {
                  localStorage.setItem('fr8x_custom_carriers_v1', JSON.stringify(updated));
                } catch {}
                toast(`Unlisted carrier "${newCarrier.name}" added with Maroon styling (Pending Godfather Approval).`);
                setNewCarrierName('');
                setNewCarrierScac('');
                setNewCarrierNotes('');
                setShowAddCarrierModal(false);
              }}
            >
              Add Carrier (Maroon / Pending)
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '10px 12px', background: '#fee2e2', borderRadius: '6px', border: '1px solid #800000', fontSize: '11.5px', color: '#800000' }}>
            <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            <b>Godfather Governance Notice:</b> Unlisted carriers not yet in master records will be highlighted in <b>Maroon</b> and marked as <i>Pending Godfather Approval</i>. Dummy staging is allowed for immediate bidding.
          </div>

          <div className="field">
            <label>Carrier / Shipping Line Name *</label>
            <input
              className="input"
              placeholder="e.g. ZIM Integrated Shipping / Wan Hai / Samudera"
              value={newCarrierName}
              onChange={(e) => setNewCarrierName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Carrier SCAC / Code (Optional)</label>
            <input
              className="input"
              placeholder="e.g. ZIMU / WHLC / SAMU"
              value={newCarrierScac}
              onChange={(e) => setNewCarrierScac(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Reason / Corridor Justification</label>
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. Direct service required on Asia-Gulf express route."
              value={newCarrierNotes}
              onChange={(e) => setNewCarrierNotes(e.target.value)}
            />
          </div>
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
