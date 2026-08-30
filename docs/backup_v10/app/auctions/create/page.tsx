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
} from '@/lib/utils';
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

const VERIFIED_BIDDERS_LIST: VerifiedBidderCandidate[] = [
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
  {
    id: 'u-ravi',
    name: 'Ravi Thomas',
    role: 'Procurement Director',
    company: 'CargoLink Global',
    location: 'Singapore',
    timezone: 'Asia/Singapore',
    hasGoldenTick: true,
  },
  {
    id: 'u-priya',
    name: 'Priya Nair',
    role: 'Trade Specialist',
    company: 'Nair Cargo Solutions',
    location: 'Mumbai, India',
    timezone: 'Asia/Kolkata',
    hasGoldenTick: false,
  },
];

export default function CreateReverseAuctionPage() {
  const router = useRouter();
  const { addAuction } = useData();
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

  const [destTrans, setDestTrans] = useState(false);
  const [destClear, setDestClear] = useState(false);
  const [destCarrier, setDestCarrier] = useState(true);
  const [destDestuffAddr, setDestDestuffAddr] = useState('');
  const [dutyPaidBy, setDutyPaidBy] = useState<'none' | 'us' | 'consignee'>('none');
  const [dutyCargoCommodity, setDutyCargoCommodity] = useState('');
  const [dutyHsCode, setDutyHsCode] = useState('');
  const [dutyApproxValue, setDutyApproxValue] = useState('');

  // Section 4: Bidder Management
  const [assignedBidders, setAssignedBidders] = useState<Set<string>>(new Set(['u-sarah', 'u-kiran']));
  const [blockedBidders, setBlockedBidders] = useState<Set<string>>(new Set());

  // Auction Rules
  const [autoExtension, setAutoExtension] = useState(true);
  const [rankingVisible, setRankingVisible] = useState(true);
  const [hideCompetitorNames, setHideCompetitorNames] = useState(true);
  const [bidderAnonymity, setBidderAnonymity] = useState(true);

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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

    if (val.trim().length >= 3) {
      const matches = PORT_SUGGESTIONS.filter((p) =>
        p.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestMatches(matches);
      setActiveSuggestField(field);
    } else {
      setSuggestMatches([]);
      setActiveSuggestField(null);
    }
  };

  const selectPort = (port: string) => {
    if (activeSuggestField === 'pol') setPol(port);
    else if (activeSuggestField === 'pod') setPod(port);
    else if (activeSuggestField === 'por') setPor(port);
    else if (activeSuggestField === 'finalDest') setFinalDest(port);
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

    const selectedBiddersData = VERIFIED_BIDDERS_LIST.filter((b) =>
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
          handlePublish();
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

        {/* Section 4: Bidders, Rules & Documents */}
        <section className="section">
          <div className="sectiontitle">
            <span className="num">4</span>
            Bidders, Rules & Compliance
            <span>Verified forwarder assignment, privacy controls, and publication</span>
          </div>
          <div className="sectionbody">
            <div className="grid g3">
              {/* Select Bidders */}
              <div className="card">
                <div className="cardhead">
                  <span>Select Bidders</span>
                  <span className="sub">Verified Records</span>
                </div>
                <div className="cardbody" style={{ maxHeight: '250px', overflowY: 'auto', padding: '8px' }}>
                  {VERIFIED_BIDDERS_LIST.map((b) => {
                    const isAssigned = assignedBidders.has(b.id);
                    const isBlocked = blockedBidders.has(b.id);

                    return (
                      <div
                        key={b.id}
                        className="record"
                        style={{ padding: '8px 6px', borderBottom: '1px solid #edf2f7' }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ProfileLink name={b.name} company={b.company} hasGoldenTick={b.hasGoldenTick} />
                          </div>
                          <small style={{ fontSize: '10px', color: 'var(--mut)' }}>
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
            Draft auto-saved · Assigned bidders receive structured formal auction tables upon publication.
          </small>
          <div className="actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowPreviewModal(true)}
            >
              <Eye size={14} /> Preview Summary
            </button>
            <button type="submit" className="btn primary">
              <Rocket size={14} /> Publish & Notify Bidders
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
            <button className="btn primary" onClick={handlePublish}>
              Continue & Publish
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
                .map((id) => VERIFIED_BIDDERS_LIST.find((b) => b.id === id)?.name)
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
    </div>
  );
}
