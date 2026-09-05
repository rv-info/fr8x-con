'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { PortSearch, CarrierSearch } from '@/components/ui/PortSearch';
import { RateItem } from '@/lib/types';
import {
  BarChart3,
  Plus,
  Upload,
  Copy,
  MessageCircle,
  Mail,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  Clock,
  Eye,
  CheckCircle2,
  Calendar,
  DollarSign,
  MapPin,
  Check,
  Search,
  AlertTriangle,
  History,
  TrendingUp,
  X,
  Sparkles,
  Share2,
} from 'lucide-react';
import {
  formatNumber,
  getLocationTypeIcon,
  getCarrierTypeIcon,
  getEquipmentCategoryIcon,
} from '@/lib/utils';

export default function RatesPage() {
  const { rates, myRates, addMyRate, deleteMyRate, bulkImportRates, bulkUpdateRates, masterCarriers, masterLocations, masterEquipment, masterTaxCodes } = useData();
  const { format } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'self' | 'i' | 'expiring'>('all');
  // Per-column search state
  const [colSearch, setColSearch] = useState<Record<string, string>>({});
  const updateColSearch = (col: string, val: string) =>
    setColSearch((prev) => ({ ...prev, [col]: val }));
  // Edit mode state for Update button
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [polSearch, setPolSearch] = useState('');
  const [podSearch, setPodSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'corridor' | 'global'>('corridor');
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);

  // Rate Detail Modal
  const [selectedRateDetail, setSelectedRateDetail] = useState<RateItem | null>(null);

  // Email Rate Quote State (Requirement 8)
  const [emailTargetRate, setEmailTargetRate] = useState<RateItem | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');

  // Rate Comparison & Bulk Tool State
  const [comparedRateIds, setComparedRateIds] = useState<string[]>([]);
  const [expiredRateIds, setExpiredRateIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Bulk Operations State
  const [selectedRateIdsForBulk, setSelectedRateIdsForBulk] = useState<string[]>([]);
  const [showBulkAdjustModal, setShowBulkAdjustModal] = useState(false);
  const [bulkPercentAdjustment, setBulkPercentAdjustment] = useState<number>(0);
  const [bulkValidityExtension, setBulkValidityExtension] = useState<string>('');
  const [viewingRevisionRate, setViewingRevisionRate] = useState<RateItem | null>(null);

  // i-Rate Editor Form State
  const [carrier, setCarrier] = useState('Maersk');
  const [por, setPor] = useState('Nhava Sheva (INNSA)');
  const [pol, setPol] = useState('Nhava Sheva (INNSA)');
  const [pod, setPod] = useState('Rotterdam (NLRTM)');
  const [fpod, setFpod] = useState('Rotterdam (NLRTM)');
  const [routing, setRouting] = useState('Direct Ocean EP-X');
  const [transitTime, setTransitTime] = useState('29 days');
  const [d20, setD20] = useState(1480);
  const [d20Type, setD20Type] = useState('Dry Standard');
  const [h40, setH40] = useState(2320);
  const [h40Type, setH40Type] = useState('High Cube');
  const [freeTime, setFreeTime] = useState('14 days combined');
  const [validDate, setValidDate] = useState('2026-09-30');
  const [rateType, setRateType] = useState('Direct Spot');
  const [remarks, setRemarks] = useState('Subject to low sulphur fuel bunker surcharge at destination.');

  // Generate structured SEQ: {company_initials}-{dd}{mm}-{0001}
  const getRateSeq = (r: RateItem, idx: number) => {
    const src = r.sp || user.company || 'FR8X';
    const clean = src.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    let initials = words.map((w) => w[0].toUpperCase()).join('');
    if (initials.length < 2) initials = clean.substring(0, 3).toUpperCase();

    let dd = '01';
    let mm = '09';
    if (r.valid) {
      const parts = r.valid.split('-');
      if (parts.length === 3) {
        dd = parts[2].padStart(2, '0');
        mm = parts[1].padStart(2, '0');
      }
    }
    const num = String(idx + 1).padStart(4, '0');
    return `${initials}-${dd}${mm}-${num}`;
  };

  // Format structured rate quote breakdown as per exact user dossier specification
  const formatRateQuote = (r: RateItem, idx = 0) => {
    const seq = getRateSeq(r, idx);
    const dated = r.valid || '2026-09-30';
    const freeTimeTerms = r.ft
      ? (r.ft.toLowerCase().includes('at desitnation') || r.ft.toLowerCase().includes('at destination')
          ? r.ft
          : `${r.ft} (at desitnation)`)
      : '14 days combined (at desitnation)';
    const d20TypeStr = r.d20Type || "20'DV";
    const h40TypeStr = r.h40Type || "40'HC";

    return `=======================================================
FR8X FREIGHT RATE QUOTATION DOSSIER - ${dated} ${seq}
=======================================================
Rate Reference   : ${r.id}
SEQ Number       : ${seq}
Service Provider : ${r.sp}
Ocean Carrier    : ${r.carrier}
Routing Mode     : ${r.route || 'Direct EP-X Service'}
Place of Receipt : ${r.por || r.pol}
Port of Loading  : ${r.pol}
Port of Discharge: ${r.pod}
Final Delivery   : ${r.fpod || r.pod}
Transit Time     : ${r.tt || '28 days'}
Free Time Terms  : ${freeTimeTerms}
-------------------------------------------------------
ocean FREIGHT CHARGES (USD)
US $${r.d20.toLocaleString()}/${d20TypeStr} & US $${r.h40.toLocaleString()}/${h40TypeStr}
-------------------------------------------------------
Validity Date    : ${r.valid}
Rate Category    : ${r.rateType || 'Spot Contract'}
Remarks & Terms  : ${r.remark || ''}
-------------------------------------------------------
Generated via FR8X Freight Exchange
=======================================================`;
  };

  const handleCopyQuote = (rate: RateItem, idx = 0) => {
    const text = formatRateQuote(rate, idx);
    navigator.clipboard.writeText(text);
    toast(`Structured rate quote for ${rate.id} (${rate.carrier}) copied to clipboard.`);
  };

  const handleExpireSelectedRates = () => {
    if (comparedRateIds.length === 0) return;
    const count = comparedRateIds.length;
    setExpiredRateIds((prev) => [...new Set([...prev, ...comparedRateIds])]);
    setComparedRateIds([]);
    setActiveTab('expiring');
    toast(`${count} rate(s) marked as expired and shifted to Expiring/Expired Rates.`);
  };

  const handleOpenEmailModal = (rate: RateItem) => {
    setEmailTargetRate(rate);
    const domain = rate.sp.toLowerCase().replace(/[^a-z0-9]/g, '');
    const smartUrl = `https://con.fr8x.in/r/${rate.id}`;
    setEmailRecipient(`bookings@${domain || 'carrierdesk'}.com`);
    setEmailSubject(`FR8X Rate Quotation & Booking Link: ${rate.carrier} (${rate.pol} → ${rate.pod}) [${rate.id}]`);
    setEmailBody(`Dear Commercial Partner,\n\nPlease find the freight rate quotation for ${rate.carrier} (${rate.pol} → ${rate.pod}) under rate reference ${rate.id}:\n\n${formatRateQuote(rate)}\n\n🔗 VIEW LIVE INTERACTIVE RATE & 1-CLICK SPACE LOCK:\n${smartUrl}\n(Open this link in any browser to verify real-time validity, carrier terms, and reserve container space instantly.)\n\nBest regards,\n${user.displayName}\n${user.company}\n${user.email}`);
  };

  const handleSendEmail = () => {
    if (!emailRecipient.trim()) {
      toast('Please enter a valid recipient email address.');
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(emailRecipient)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
    setEmailTargetRate(null);
    toast(`Email dispatched to ${emailRecipient}.`);
  };

  // Bulk Upload Multi-Step State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<'upload' | 'map' | 'preview' | 'result'>('upload');
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Partial<RateItem>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check if rate is expiring within 30 days
  const isExpiringSoon = (validStr: string) => {
    const valid = new Date(validStr);
    const daysLeft = Math.ceil((valid.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 30 && daysLeft >= 0;
  };

  // Filtered Tables
  const allAvailableRates = [...rates, ...myRates];

  const filteredRates = allAvailableRates.filter((r) => {
    // 1. Global search query across all rate fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const textCorpus = (
        (r.id || '') + ' ' +
        (r.sp || '') + ' ' +
        (r.carrier || '') + ' ' +
        (r.por || '') + ' ' +
        (r.pol || '') + ' ' +
        (r.pod || '') + ' ' +
        (r.fpod || '') + ' ' +
        (r.route || '') + ' ' +
        (r.remark || '') + ' ' +
        (r.rateType || '') + ' ' +
        (r.d20Type || '') + ' ' +
        (r.h40Type || '')
      ).toLowerCase();
      if (!textCorpus.includes(q)) return false;
    }

    // 2. Specific POL (Port of Loading / POR) corridor search
    if (polSearch.trim()) {
      const polQ = polSearch.toLowerCase().trim();
      const matchesPol = (r.pol && r.pol.toLowerCase().includes(polQ)) || (r.por && r.por.toLowerCase().includes(polQ));
      if (!matchesPol) return false;
    }

    // 3. Specific POD (Port of Discharge / FPOD) corridor search
    if (podSearch.trim()) {
      const podQ = podSearch.toLowerCase().trim();
      const matchesPod = (r.pod && r.pod.toLowerCase().includes(podQ)) || (r.fpod && r.fpod.toLowerCase().includes(podQ));
      if (!matchesPod) return false;
    }

    // Per-column search
    if (colSearch.seq && !getRateSeq(r, allAvailableRates.indexOf(r)).toLowerCase().includes(colSearch.seq.toLowerCase())) return false;
    if (colSearch.sp && !r.sp?.toLowerCase().includes(colSearch.sp.toLowerCase())) return false;
    if (colSearch.carrier && !r.carrier?.toLowerCase().includes(colSearch.carrier.toLowerCase())) return false;
    if (colSearch.por && !r.por?.toLowerCase().includes(colSearch.por.toLowerCase())) return false;
    if (colSearch.pol && !r.pol?.toLowerCase().includes(colSearch.pol.toLowerCase())) return false;
    if (colSearch.pod && !r.pod?.toLowerCase().includes(colSearch.pod.toLowerCase())) return false;
    if (colSearch.fpod && !r.fpod?.toLowerCase().includes(colSearch.fpod.toLowerCase())) return false;
    if (colSearch.routing && !r.route?.toLowerCase().includes(colSearch.routing.toLowerCase())) return false;
    if (colSearch.remarks && !r.remark?.toLowerCase().includes(colSearch.remarks.toLowerCase())) return false;

    if (activeTab === 'i') {
      return myRates.some((mr) => mr.id === r.id);
    }
    if (activeTab === 'self') {
      return r.isOwner || r.ownerUid === user.uid || r.isSelfPosted || myRates.some((mr) => mr.id === r.id);
    }
    if (activeTab === 'expiring') {
      return isExpiringSoon(r.valid) || expiredRateIds.includes(r.id);
    }
    return true;
  });

  const handleToggleCompare = (rateId: string) => {
    if (comparedRateIds.includes(rateId)) {
      setComparedRateIds((prev) => prev.filter((id) => id !== rateId));
    } else {
      if (comparedRateIds.length >= 4) {
        toast('You can compare up to 4 rates simultaneously.');
        return;
      }
      setComparedRateIds((prev) => [...prev, rateId]);
    }
  };

  const handleClearForm = () => {
    setCarrier('Maersk');
    setPor('');
    setPol('');
    setPod('');
    setFpod('');
    setRouting('');
    setTransitTime('');
    setD20(0);
    setD20Type('');
    setH40(0);
    setH40Type('');
    setFreeTime('');
    setValidDate('');
    setRateType('');
    setRemarks('');
    setEditingRateId(null);
    toast('Form cleared.');
  };

  const handleDuplicateSelected = () => {
    if (!pol.trim() || !pod.trim()) {
      toast('Fill in POL and POD to duplicate.');
      return;
    }
    addMyRate({ carrier, por: por || pol, pol, pod, fpod: fpod || pod, d20: Number(d20), d20Type, h40: Number(h40), h40Type, ft: freeTime, tt: transitTime, valid: validDate, rateType, route: routing, remark: remarks });
    toast('Rate duplicated and saved as new i-Rate.');
  };

  const handleSaveIRate = () => {
    if (!pol.trim() || !pod.trim() || !d20 || !h40 || !validDate) {
      toast('Please complete all required fields (POL, POD, 20DV, 40HC, Validity).');
      return;
    }

    addMyRate({
      carrier,
      por: por || pol,
      pol,
      pod,
      fpod: fpod || pod,
      d20: Number(d20),
      d20Type,
      h40: Number(h40),
      h40Type,
      ft: freeTime,
      tt: transitTime,
      valid: validDate,
      rateType,
      route: routing,
      remark: remarks,
    });
    toast('Custom i-Rate saved to workspace.');
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'Service Provider,Carrier,POR,POL,POD,FPOD,20DV USD,20 Type,40HC USD,40 Type,Free Time,Validity Date,Rate Type,Transit Time,Routing,Remarks\n' +
      `${user.company},Maersk,Nhava Sheva,Nhava Sheva,Rotterdam,Rotterdam,1500,Dry Standard,2350,High Cube,14 days,2026-09-30,Direct,29 days,Direct EP-X,Subject to space\n` +
      `${user.company},CMA CGM,Mundra,Mundra,Antwerp,Antwerp,1520,Dry Standard,2380,High Cube,14 days,2026-09-30,Direct,31 days,Direct Falkon,Guaranteed space`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'fr8x_rates_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('CSV rate template downloaded.');
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast('Uploaded file is empty or missing data rows.');
        return;
      }

      const rows: Partial<RateItem>[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length < 8) {
          errors.push(`Row ${i + 1}: Insufficient column fields.`);
          continue;
        }

        const [sp, cCarrier, cPor, cPol, cPod, cFpod, cD20, cD20Type, cH40, cH40Type, cFt, cValid, cRateType, cTt, cRoute, cRemarks] = cols;

        if (!cPol || !cPod) {
          errors.push(`Row ${i + 1}: Missing POL or POD.`);
          continue;
        }

        rows.push({
          sp: sp || user.company,
          carrier: cCarrier || 'Maersk',
          por: cPor || cPol,
          pol: cPol,
          pod: cPod,
          fpod: cFpod || cPod,
          d20: Number(cD20) || 1500,
          d20Type: cD20Type || 'Dry Standard',
          h40: Number(cH40) || 2300,
          h40Type: cH40Type || 'High Cube',
          ft: cFt || '14 days',
          valid: cValid || '2026-09-30',
          rateType: cRateType || 'Direct Spot',
          tt: cTt || '28 days',
          route: cRoute || 'Direct EP-X',
          remark: cRemarks || 'Bulk uploaded verified contract',
        });
      }

      setParsedRows(rows);
      setValidationErrors(errors);
      setBulkStep('preview');
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkImport = () => {
    const res = bulkImportRates(parsedRows);
    setBulkStep('result');
    toast(`Successfully imported ${res.count} freight rate cards.`);
  };

  const comparedRatesList = allAvailableRates.filter((r) => comparedRateIds.includes(r.id));

  return (
    <div className="rates-container">
      {/* Comprehensive Rate Intelligence & Table Matrix Popup Modal */}
      {selectedRateDetail && (
        <Modal
          isOpen={Boolean(selectedRateDetail)}
          onClose={() => setSelectedRateDetail(null)}
          title={`Freight Rate Intelligence Matrix · ${getRateSeq(selectedRateDetail, allAvailableRates.indexOf(selectedRateDetail))}`}
          maxWidth="760px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Header Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <b style={{ fontSize: '15px', color: 'var(--ink)' }}>{selectedRateDetail.carrier}</b>
                  <span className="badge blue" style={{ fontSize: '10px' }}>{selectedRateDetail.rateType || 'Direct Spot'}</span>
                  <span className="badge grey font-mono" style={{ fontSize: '10px' }}>{getRateSeq(selectedRateDetail, allAvailableRates.indexOf(selectedRateDetail))}</span>
                </div>
                <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--mut)', marginTop: '3px' }}>
                  Service Provider: <b style={{ color: 'var(--ink)' }}>{selectedRateDetail.sp}</b> · Service Loop: <b>{selectedRateDetail.route || 'Direct Ocean Corridor'}</b>
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${isExpiringSoon(selectedRateDetail.valid) ? 'amber' : 'green'}`} style={{ fontSize: '10.5px' }}>
                  VALID TILL {selectedRateDetail.valid}
                </span>
                <small style={{ display: 'block', color: 'var(--mut)', fontSize: '10px', marginTop: '2px' }}>
                  Transit Time: <b>{selectedRateDetail.tt || '28 days'}</b>
                </small>
              </div>
            </div>

            {/* Container Pricing & Multi-Currency Grid */}
            <div className="grid g2" style={{ gap: '10px' }}>
              {/* 20DV Card */}
              <div style={{ background: '#f0f7ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <small style={{ color: '#0369a1', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 800 }}>20&apos; Standard Container (20DV)</small>
                  <span className="badge blue" style={{ fontSize: '9.5px' }}>{selectedRateDetail.d20Type || 'Dry Standard'}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 850, color: '#0284c7' }}>
                  ${selectedRateDetail.d20.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600 }}>USD</span>
                </div>
                <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px', fontWeight: 600 }}>
                  ≈ {format(selectedRateDetail.d20)} (Local Equivalent)
                </div>
              </div>

              {/* 40HC Card */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <small style={{ color: '#15803d', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 800 }}>40&apos; High Cube Container (40HC)</small>
                  <span className="badge green" style={{ fontSize: '9.5px' }}>{selectedRateDetail.h40Type || 'High Cube'}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 850, color: '#16a34a' }}>
                  ${selectedRateDetail.h40.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600 }}>USD</span>
                </div>
                <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px', fontWeight: 600 }}>
                  ≈ {format(selectedRateDetail.h40)} (Local Equivalent)
                </div>
              </div>
            </div>

            {/* Complete Routing & Port Breakdown Table */}
            <div style={{ border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#f1f5f9', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>
                Port Routing & Terminal Architecture
              </div>
              <div className="grid g4" style={{ padding: '10px 12px', gap: '8px', background: '#fff' }}>
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--mut)', fontSize: '10px', display: 'block' }}>Place of Receipt (POR)</span>
                  <b style={{ color: 'var(--ink)' }}>{selectedRateDetail.por || selectedRateDetail.pol}</b>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--mut)', fontSize: '10px', display: 'block' }}>Port of Loading (POL)</span>
                  <b style={{ color: 'var(--ink)' }}>{selectedRateDetail.pol}</b>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--mut)', fontSize: '10px', display: 'block' }}>Port of Discharge (POD)</span>
                  <b style={{ color: 'var(--ink)' }}>{selectedRateDetail.pod}</b>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--mut)', fontSize: '10px', display: 'block' }}>Final Place of Delivery (FPOD)</span>
                  <b style={{ color: 'var(--ink)' }}>{selectedRateDetail.fpod || selectedRateDetail.pod}</b>
                </div>
              </div>
            </div>

            {/* Itemized Terms, Surcharges & Free Time */}
            <div className="grid g2" style={{ gap: '10px' }}>
              <div style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '10px', fontSize: '11px', background: '#fff' }}>
                <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '6px', fontSize: '11.5px' }}>Free Time & Liner Terms</b>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--line-light)' }}>
                  <span style={{ color: 'var(--mut)' }}>Combined Demurrage & Detention:</span>
                  <b>{selectedRateDetail.ft || '14 Days Combined'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--line-light)' }}>
                  <span style={{ color: 'var(--mut)' }}>Rate Type Classification:</span>
                  <b>{selectedRateDetail.rateType || 'Direct Spot'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: 'var(--mut)' }}>Corridor Transit Time:</span>
                  <b>{selectedRateDetail.tt || '28 days'}</b>
                </div>
              </div>

              <div style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '10px', fontSize: '11px', background: '#fff' }}>
                <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '6px', fontSize: '11.5px' }}>Standard Liner Inclusions</b>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--line-light)' }}>
                  <span style={{ color: 'var(--mut)' }}>Base Ocean Freight (BAS):</span>
                  <span className="badge green" style={{ fontSize: '9px' }}>INCLUDED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--line-light)' }}>
                  <span style={{ color: 'var(--mut)' }}>Bunker Adjustment (BAF / LSS):</span>
                  <span className="badge green" style={{ fontSize: '9px' }}>INCLUDED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: 'var(--mut)' }}>ISPS / Security & Seal:</span>
                  <span className="badge green" style={{ fontSize: '9px' }}>INCLUDED</span>
                </div>
              </div>
            </div>

            {/* Surcharges & Remarks */}
            <div style={{ padding: '9px 12px', background: '#eff6ff', borderRadius: '7px', border: '1px solid #bfdbfe', fontSize: '11px' }}>
              <b style={{ color: 'var(--brand)' }}>Operational Remarks & Surcharges:</b>
              <p style={{ margin: '2px 0 0', color: 'var(--ink)' }}>
                {selectedRateDetail.remark || 'Standard carrier terms apply. Rates valid subject to vessel space allocation.'}
              </p>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn secondary sm"
                  onClick={() => handleCopyQuote(selectedRateDetail, allAvailableRates.indexOf(selectedRateDetail))}
                  title="Copy Structured Quotation"
                >
                  <Copy size={12} /> Copy Dossier
                </button>
                <button
                  className="btn secondary sm"
                  onClick={() => {
                    handleOpenEmailModal(selectedRateDetail);
                    setSelectedRateDetail(null);
                  }}
                  title="Email Quote to Service Provider"
                >
                  <Mail size={12} /> Email Rate Quote
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn secondary" onClick={() => setSelectedRateDetail(null)}>
                  Close
                </button>
                <button
                  className="btn primary"
                  onClick={() => {
                    handleToggleCompare(selectedRateDetail.id);
                    setSelectedRateDetail(null);
                    setShowComparisonModal(true);
                  }}
                >
                  <ArrowRightLeft size={12} /> Compare Rate
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Email Rate Quote to Service Provider Modal (Requirement 8) */}
      {emailTargetRate && (
        <Modal
          isOpen={Boolean(emailTargetRate)}
          onClose={() => setEmailTargetRate(null)}
          title={`Email Rate Quotation: ${emailTargetRate.carrier} (${emailTargetRate.id})`}
          maxWidth="700px"
          footer={
            <>
              <button className="btn secondary" onClick={() => setEmailTargetRate(null)}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleSendEmail}>
                <Mail size={13} /> Send via Email Client (mailto:)
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            {/* Smart Rate Capsule Link Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <b style={{ color: 'var(--brand)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} /> FR8X Smart Rate Link: con.fr8x.in/r/{emailTargetRate.id}
                </b>
                <span style={{ fontSize: '10.5px', color: 'var(--mut)', display: 'block' }}>
                  Recipients can open this link to view live validity, liner terms, and request 1-click space booking.
                </span>
              </div>
              <button
                type="button"
                className="btn secondary sm"
                style={{ height: '26px', fontSize: '11px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => {
                  const url = `https://con.fr8x.in/r/${emailTargetRate.id}`;
                  navigator.clipboard?.writeText?.(url);
                  toast(`Smart Rate link copied: ${url}`);
                }}
              >
                <Share2 size={11} /> Copy Smart Link
              </button>
            </div>

            <div className="field">
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Recipient Email (Service Provider / Booking Desk)</label>
              <input
                className="input"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                style={{ fontSize: '12px', height: '32px' }}
              />
            </div>

            <div className="field">
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Subject Line</label>
              <input
                className="input"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={{ fontSize: '12px', height: '32px' }}
              />
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Structured Quotation Body</label>
                <button
                  type="button"
                  className="btn secondary sm"
                  style={{ padding: '2px 6px', fontSize: '10.5px' }}
                  onClick={() => handleCopyQuote(emailTargetRate)}
                >
                  <Copy size={11} /> Copy Text
                </button>
              </div>
              <textarea
                className="input"
                rows={12}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', lineHeight: 1.45, resize: 'vertical' }}
              />
            </div>

            <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>
              Clicking send will format and launch your standard default desktop/web email client (Outlook, Gmail, etc.) pre-filled with this verified quotation dossier.
            </small>
          </div>
        </Modal>
      )}

      {/* Rate Comparison Modal */}
      {showComparisonModal && (
        <Modal
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          title={`Side-by-Side Rate Benchmarking (${comparedRatesList.length} Rates Selected)`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {comparedRatesList.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--mut)', padding: '20px' }}>
                Select 2 or more rates using checkboxes in the table to view side-by-side benchmarking.
              </p>
            ) : (
              <div className="tablewrap flush">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Attribute</th>
                      {comparedRatesList.map((r) => (
                        <th key={r.id} style={{ minWidth: '160px' }}>
                          <b>{r.carrier}</b>
                          <small style={{ display: 'block', color: 'var(--brand)' }}>{r.sp}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><b>20&apos; Dry Standard</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}><b style={{ color: 'var(--brand)' }}>${r.d20.toLocaleString()} USD</b></td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>40&apos; High Cube (40HC)</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}><b style={{ color: 'var(--teal)' }}>${r.h40.toLocaleString()} USD</b></td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>Route (POL → POD)</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}>{r.pol.split('(')[0]} → {r.pod.split('(')[0]}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>Free Time (Detention/Demurrage)</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}><span className="badge blue">{r.ft}</span></td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>Transit Time</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}>{r.tt}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>Validity Expiry</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}>{r.valid}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>Remarks / Surcharges</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id} style={{ fontSize: '10.5px', color: 'var(--mut)' }}>{r.remark}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
              <button className="btn secondary sm" onClick={() => setComparedRateIds([])}>
                Clear Comparison
              </button>
              <button className="btn primary" onClick={() => setShowComparisonModal(false)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Multi-Step Bulk Import Modal */}
      {showBulkModal && (
        <Modal
          isOpen={showBulkModal}
          onClose={() => {
            setShowBulkModal(false);
            setBulkStep('upload');
          }}
          title="Enterprise Bulk Rate Ingestion & Validation"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Step Progress Indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: bulkStep === 'upload' ? 700 : 500, color: bulkStep === 'upload' ? 'var(--brand)' : 'var(--mut)' }}>
                1. Upload CSV
              </span>
              <span style={{ fontSize: '11px', fontWeight: bulkStep === 'preview' ? 700 : 500, color: bulkStep === 'preview' ? 'var(--brand)' : 'var(--mut)' }}>
                2. Validate & Deduplicate
              </span>
              <span style={{ fontSize: '11px', fontWeight: bulkStep === 'result' ? 700 : 500, color: bulkStep === 'result' ? 'var(--green)' : 'var(--mut)' }}>
                3. Ingestion Complete
              </span>
            </div>

            {bulkStep === 'upload' && (
              <div style={{ textAlign: 'center', padding: '24px', border: '2px dashed var(--line)', borderRadius: '8px' }}>
                <FileSpreadsheet size={36} color="var(--brand)" style={{ margin: '0 auto 10px' }} />
                <b style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>
                  Select Freight Rate Matrix (.CSV)
                </b>
                <p style={{ fontSize: '11.5px', color: 'var(--mut)', marginBottom: '14px' }}>
                  Supports container spot sheets, contract renewals, and port-pair tariff tables.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  id="csv-file-input"
                  style={{ display: 'none' }}
                  onChange={handleCsvFileUpload}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    className="btn primary"
                    onClick={() => document.getElementById('csv-file-input')?.click()}
                  >
                    <Upload size={13} /> Select CSV File
                  </button>
                  <button className="btn secondary" onClick={handleDownloadTemplate}>
                    <Download size={13} /> Download Template
                  </button>
                </div>
              </div>
            )}

            {bulkStep === 'preview' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <b style={{ fontSize: '12px' }}>
                    Valid Rate Rows Detected: <span style={{ color: 'var(--green)' }}>{parsedRows.length}</span>
                  </b>
                  {validationErrors.length > 0 && (
                    <span className="badge amber">{validationErrors.length} Warnings Resolved</span>
                  )}
                </div>

                <div className="tablewrap flush" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <table className="table sub-table">
                    <thead>
                      <tr>
                        <th>Carrier</th>
                        <th>POL</th>
                        <th>POD</th>
                        <th>20DV USD</th>
                        <th>40HC USD</th>
                        <th>Free Time</th>
                        <th>Validity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 5).map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.carrier}</td>
                          <td>{r.pol}</td>
                          <td>{r.pod}</td>
                          <td>${r.d20}</td>
                          <td>${r.h40}</td>
                          <td>{r.ft}</td>
                          <td>{r.valid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                  <button className="btn secondary" onClick={() => setBulkStep('upload')}>
                    Back
                  </button>
                  <button className="btn primary" onClick={handleConfirmBulkImport}>
                    <Check size={13} /> Confirm & Import {parsedRows.length} Rates
                  </button>
                </div>
              </div>
            )}

            {bulkStep === 'result' && (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <CheckCircle2 size={44} color="var(--green)" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Rate Matrix Ingested Successfully!</h3>
                <p style={{ fontSize: '12px', color: 'var(--mut)' }}>
                  All validated carrier spot lines are now queryable in your rate intelligence tables.
                </p>
                <button
                  className="btn primary"
                  style={{ marginTop: '14px' }}
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkStep('upload');
                  }}
                >
                  View Rate Tables
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Bulk Modifier Modal */}
      {showBulkAdjustModal && (
        <Modal
          isOpen={showBulkAdjustModal}
          onClose={() => setShowBulkAdjustModal(false)}
          title={`Bulk Modifier · ${selectedRateIdsForBulk.length} Rates Selected`}
          maxWidth="520px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: 'var(--mut)', margin: 0 }}>
              Apply batch pricing adjustments and validity updates across all selected freight routes simultaneously. An immutable revision entry will be appended to each rate.
            </p>

            {/* Percentage adjustment */}
            <div className="field">
              <label>Percentage Adjustment (+/- %)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[-5, -2, 2, 5, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    className={`btn sm ${bulkPercentAdjustment === pct ? 'primary' : 'secondary'}`}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                    onClick={() => setBulkPercentAdjustment(pct)}
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
                <input
                  type="number"
                  className="input"
                  style={{ width: '80px', height: '28px', fontSize: '11px' }}
                  placeholder="Custom %"
                  value={bulkPercentAdjustment || ''}
                  onChange={(e) => setBulkPercentAdjustment(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Validity Extension */}
            <div className="field">
              <label>Extend Validity Date</label>
              <input
                type="date"
                className="input"
                value={bulkValidityExtension}
                onChange={(e) => setBulkValidityExtension(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
              <button className="btn secondary" onClick={() => setShowBulkAdjustModal(false)}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={async () => {
                  const updates: Partial<RateItem> = {};
                  if (bulkValidityExtension) updates.valid = bulkValidityExtension;
                  await bulkUpdateRates(
                    selectedRateIdsForBulk,
                    updates,
                    bulkPercentAdjustment !== 0 ? bulkPercentAdjustment : undefined
                  );
                  setShowBulkAdjustModal(false);
                  setSelectedRateIdsForBulk([]);
                  setBulkPercentAdjustment(0);
                  setBulkValidityExtension('');
                }}
              >
                Apply Modifications
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Revision History Modal */}
      {viewingRevisionRate && (
        <Modal
          isOpen={Boolean(viewingRevisionRate)}
          onClose={() => setViewingRevisionRate(null)}
          title={`Rate Revision History · ${viewingRevisionRate.id}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink)' }}>
              <b>{viewingRevisionRate.carrier}</b> · {viewingRevisionRate.pol} → {viewingRevisionRate.pod}
            </div>
            {(!viewingRevisionRate.versions || viewingRevisionRate.versions.length === 0) ? (
              <p style={{ fontSize: '12px', color: 'var(--mut)', textAlign: 'center', padding: '24px 0' }}>
                No prior revisions recorded. This rate is currently on its initial publication v1.
              </p>
            ) : (
              <div className="tablewrap flush">
                <table className="table sub-table">
                  <thead>
                    <tr>
                      <th>Rev</th>
                      <th>20DV</th>
                      <th>40HC</th>
                      <th>Valid Till</th>
                      <th>Adjustment</th>
                      <th>Changed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingRevisionRate.versions.map((v) => (
                      <tr key={v.id}>
                        <td>v{v.version}</td>
                        <td>${v.d20}</td>
                        <td>${v.h40}</td>
                        <td>{v.valid}</td>
                        <td>{v.adjustmentPercentage ? `${v.adjustmentPercentage > 0 ? '+' : ''}${v.adjustmentPercentage}%` : 'Direct'}</td>
                        <td>{v.changedBy || 'Owner'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn secondary" onClick={() => setViewingRevisionRate(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="head">
        <div>
          <h1>Global Rate Intelligence & i-Rate Matrix</h1>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={() => setShowBulkModal(true)}>
            <Upload size={14} /> Bulk Ingest Rates
          </button>
          <button className="btn secondary" onClick={handleDownloadTemplate}>
            <Download size={14} /> CSV Template
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Strip (Desktop) */}
      <div className="grid g4 rates-desktop-metrics" style={{ marginBottom: '16px' }}>
        <div className="metric">
          <small>Total Active Rates</small>
          <b>{allAvailableRates.length}</b>
          <span>{rates.length} market · {myRates.length} custom</span>
        </div>
        <div className="metric">
          <small>Global Carriers</small>
          <b>{new Set(allAvailableRates.map((r) => r.carrier)).size}</b>
          <span>Maersk, Hapag, CMA CGM, MSC</span>
        </div>
        <div className="metric">
          <small>Expiring Within 30d</small>
          <b style={{ color: 'var(--amber)' }}>
            {allAvailableRates.filter((r) => isExpiringSoon(r.valid)).length}
          </b>
          <span>Requires rate renewal</span>
        </div>
        <div className="metric">
          <small>Compared Rates</small>
          <b>{comparedRateIds.length}</b>
          {comparedRateIds.length > 0 ? (
            <button
              type="button"
              onClick={handleExpireSelectedRates}
              style={{ color: '#b91c1c', fontWeight: 700, fontSize: '10px', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
              title="Make selection expire and shift to expired rates"
            >
              Make selection expire / Shift to expired rates
            </button>
          ) : (
            <span>Select with checkboxes</span>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Metrics Strip (<1024px) */}
      <div className="rates-mobile-metrics">
        <div className="rates-mobile-metric-item">
          <small>Active Rates</small>
          <b>{allAvailableRates.length}</b>
          <span>{rates.length} market · {myRates.length} custom</span>
        </div>
        <div className="rates-mobile-metric-item">
          <small>Global Carriers</small>
          <b>{new Set(allAvailableRates.map((r) => r.carrier)).size}</b>
          <span>Maersk, Hapag, CMA, MSC</span>
        </div>
        <div className="rates-mobile-metric-item">
          <small>Expiring (30d)</small>
          <b style={{ color: 'var(--amber)' }}>
            {allAvailableRates.filter((r) => isExpiringSoon(r.valid)).length}
          </b>
          <span>Requires renewal</span>
        </div>
        <div className="rates-mobile-metric-item">
          <small>Compared</small>
          <b>{comparedRateIds.length}</b>
          {comparedRateIds.length > 0 ? (
            <button
              type="button"
              onClick={handleExpireSelectedRates}
              style={{ color: '#b91c1c', fontWeight: 700, fontSize: '9.5px', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
            >
              Expire selection
            </button>
          ) : (
            <span>Tap to compare</span>
          )}
        </div>
      </div>

      {/* Rate Content Layout: Full width for All/Expiring tabs, Split Editor for My i-Rates */}
      <div className={activeTab === 'i' ? 'rateeditor' : 'rateeditor-full'}>
        {/* Left Form: RATES EDITOR available ONLY in My i-Rates tab */}
        {activeTab === 'i' && (
          <div className={`card ${!mobileEditorOpen ? 'hidden-on-mobile' : ''}`} style={{ alignSelf: 'flex-start', border: '1px solid var(--fr8x-outline)', borderRadius: '0px' }}>
            <div className="cardhead" style={{ background: '#f8fafc', borderBottom: '1px solid var(--fr8x-outline)', borderRadius: '0px' }}>
              <b style={{ color: 'var(--fr8x-text)', fontSize: '13px', letterSpacing: '0.5px' }}>RATES EDITOR</b>
              <span className="badge" style={{ background: '#e2e8f0', color: 'var(--fr8x-text)', fontSize: '10px', fontWeight: 800, borderRadius: '0px' }}>My i-Rate</span>
            </div>

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Row 1: CARRIER search with 3-letter typeahead */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center' }}>CARRIER</label>
                <CarrierSearch value={carrier} onChange={setCarrier} placeholder="Type carrier (3+ letters)…" />
              </div>
              {/* Row 2: POR + POL — 3-letter port search */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 4px', borderRadius: '0px', textAlign: 'center' }}>POR</label>
                  <PortSearch value={por} onChange={setPor} placeholder="POR (3+ letters)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 4px', borderRadius: '0px', textAlign: 'center' }}>POL</label>
                  <PortSearch value={pol} onChange={setPol} placeholder="POL (3+ letters)" />
                </div>
              </div>
              {/* Row 3: POD + FPOD — 3-letter port search */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 4px', borderRadius: '0px', textAlign: 'center' }}>POD</label>
                  <PortSearch value={pod} onChange={setPod} placeholder="POD (3+ letters)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 4px', borderRadius: '0px', textAlign: 'center' }}>FPOD</label>
                  <PortSearch value={fpod} onChange={setFpod} placeholder="FPOD (3+ letters)" />
                </div>
              </div>
              {/* Row 4: 20 TYPE (All Container Types Dropdown) + 20 [USD] */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center' }}>20 TYPE</label>
                  <select
                    className="input"
                    style={{ fontSize: '11px', height: '32px', padding: '0 6px', borderRadius: '0px' }}
                    value={d20Type}
                    onChange={(e) => setD20Type(e.target.value)}
                  >
                    <option value="20' Standard (20DV)">20&apos; Standard Dry (20DV)</option>
                    <option value="20' High Cube (20HC)">20&apos; High Cube (20HC)</option>
                    <option value="20' Reefer (20RF)">20&apos; Reefer (20RF)</option>
                    <option value="20' Open Top (20OT)">20&apos; Open Top (20OT)</option>
                    <option value="20' Flat Rack (20FR)">20&apos; Flat Rack (20FR)</option>
                    <option value="20' Platform (20PL)">20&apos; Platform (20PL)</option>
                    <option value="20' ISO Tank (20TK)">20&apos; ISO Tank (20TK)</option>
                    <option value="20' Bulk (20BK)">20&apos; Bulk (20BK)</option>
                    <option value="20' Ventilated (20VN)">20&apos; Ventilated (20VN)</option>
                    <option value="20' Insulated (20IN)">20&apos; Insulated (20IN)</option>
                    <option value="20' Hard Top (20HT)">20&apos; Hard Top (20HT)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center' }}>20 [USD]</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px', borderRadius: '0px' }} type="number" placeholder="0" value={d20 || ''} onChange={(e) => setD20(Number(e.target.value))} />
                </div>
              </div>
              {/* Row 5: 40 TYPE (All Container Types Dropdown) + 40HC [USD] */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center' }}>40 TYPE</label>
                  <select
                    className="input"
                    style={{ fontSize: '11px', height: '32px', padding: '0 6px', borderRadius: '0px' }}
                    value={h40Type}
                    onChange={(e) => setH40Type(e.target.value)}
                  >
                    <option value="40' High Cube (40HC)">40&apos; High Cube (40HC)</option>
                    <option value="40' Standard (40DV)">40&apos; Standard Dry (40DV)</option>
                    <option value="40' Reefer (40RF)">40&apos; Reefer (40RF)</option>
                    <option value="40' Reefer HC (40HR)">40&apos; Reefer High Cube (40HR)</option>
                    <option value="40' Open Top (40OT)">40&apos; Open Top (40OT)</option>
                    <option value="40' Open Top HC (40OH)">40&apos; Open Top High Cube (40OH)</option>
                    <option value="40' Flat Rack (40FR)">40&apos; Flat Rack (40FR)</option>
                    <option value="40' Flat Rack Collapsible (40FC)">40&apos; Flat Rack Collapsible (40FC)</option>
                    <option value="40' Platform (40PL)">40&apos; Platform (40PL)</option>
                    <option value="45' High Cube (45HC)">45&apos; High Cube (45HC)</option>
                    <option value="40' ISO Tank (40TK)">40&apos; ISO Tank (40TK)</option>
                    <option value="40' Pallet Wide (40PW)">40&apos; Pallet Wide (40PW)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--teal)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center' }}>40HC [USD]</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px', borderRadius: '0px' }} type="number" placeholder="0" value={h40 || ''} onChange={(e) => setH40(Number(e.target.value))} />
                </div>
              </div>
              {/* Row 6: FREE TIME + VALIDITY */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center' }}>FREE TIME</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px', borderRadius: '0px' }} placeholder="e.g. 14 days" value={freeTime} onChange={(e) => setFreeTime(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center' }}>VALIDITY</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px', borderRadius: '0px' }} type="date" value={validDate} onChange={(e) => setValidDate(e.target.value)} />
                </div>
              </div>
              {/* Row 7: TRANSIT + ROUTING */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center' }}>TRANSIT</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px', borderRadius: '0px' }} placeholder="e.g. 29 days" value={transitTime} onChange={(e) => setTransitTime(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center' }}>ROUTING</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px', borderRadius: '0px' }} placeholder="Direct / TS" value={routing} onChange={(e) => setRouting(e.target.value)} />
                </div>
              </div>
              {/* Row 8: VALIDITY TYPE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center' }}>VALIDITY TYPE</label>
                  <select className="input" style={{ fontSize: '11px', height: '32px', padding: '0 4px', borderRadius: '0px' }} value={rateType} onChange={(e) => setRateType(e.target.value)}>
                    <option value="Direct Spot">Direct Spot</option>
                    <option value="Contract">Contract</option>
                    <option value="NAC">NAC</option>
                    <option value="Coloader">Coloader</option>
                  </select>
                </div>
                <div />
              </div>
              {/* Row 9: REMARKS full width */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', alignItems: 'flex-start' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '0px', textAlign: 'center', alignSelf: 'flex-start', marginTop: '2px' }}>REMARKS</label>
                <textarea className="input" style={{ fontSize: '11px', padding: '5px 6px', resize: 'vertical', borderRadius: '0px' }} rows={2} placeholder="Surcharges, conditions…" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>

              {/* Action Buttons: SAVE | UPDATE | CLEAR | DUPLICATE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '4px' }}>
                <button className="btn primary" style={{ fontSize: '11.5px', padding: '7px 0', fontWeight: 700, background: 'var(--fr8x-outline)', borderColor: 'var(--fr8x-outline)', borderRadius: '0px' }} onClick={handleSaveIRate}>
                  SAVE
                </button>
                <button className="btn secondary" style={{ fontSize: '11.5px', padding: '7px 0', fontWeight: 700, borderRadius: '0px' }} onClick={() => {
                  if (!editingRateId) { alert('Select a rate row to update.'); return; }
                  handleSaveIRate();
                }}>
                  UPDATE
                </button>
                <button className="btn secondary" style={{ fontSize: '11.5px', padding: '7px 0', fontWeight: 700, borderRadius: '0px' }} onClick={handleClearForm}>
                  CLEAR
                </button>
                <button className="btn secondary" style={{ fontSize: '11.5px', padding: '7px 0', fontWeight: 700, borderRadius: '0px' }} onClick={handleDuplicateSelected}>
                  DUPLICATE
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Main Table: Rates Matrix */}
        <div className="card" style={{ width: '100%', overflow: 'hidden', border: '1px solid var(--fr8x-outline)', borderRadius: '0px' }}>
          <div className="cardhead" style={{ flexWrap: 'wrap', gap: '8px', background: '#f8fafc', borderBottom: '1px solid var(--fr8x-outline)', borderRadius: '0px' }}>
            <div className="rates-desktop-tabs" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                aria-pressed={activeTab === 'all'}
                style={{ fontSize: '11.5px', padding: '5px 10px', borderRadius: '0px', background: activeTab === 'all' ? 'var(--fr8x-outline)' : undefined, color: activeTab === 'all' ? '#fff' : undefined, borderColor: activeTab === 'all' ? 'var(--fr8x-outline)' : undefined }}
                onClick={() => setActiveTab('all')}
              >
                All Available Rates ({rates.length + myRates.length})
              </button>
              <button
                className={`tab ${activeTab === 'self' ? 'active' : ''}`}
                aria-pressed={activeTab === 'self'}
                style={{ fontSize: '11.5px', padding: '5px 10px', borderRadius: '0px', background: activeTab === 'self' ? 'var(--fr8x-outline)' : undefined, color: activeTab === 'self' ? '#fff' : undefined, borderColor: activeTab === 'self' ? 'var(--fr8x-outline)' : undefined }}
                onClick={() => setActiveTab('self')}
              >
                Self-Posted Rates ({allAvailableRates.filter((r) => r.isOwner || r.ownerUid === user.uid || r.isSelfPosted || myRates.some((mr) => mr.id === r.id)).length})
              </button>
              <button
                className={`tab ${activeTab === 'i' ? 'active' : ''}`}
                aria-pressed={activeTab === 'i'}
                style={{ fontSize: '11.5px', padding: '5px 10px', borderRadius: '0px', background: activeTab === 'i' ? 'var(--fr8x-outline)' : undefined, color: activeTab === 'i' ? '#fff' : undefined, borderColor: activeTab === 'i' ? 'var(--fr8x-outline)' : undefined }}
                onClick={() => setActiveTab('i')}
              >
                My i-Rates ({myRates.length})
              </button>
              <button
                className={`tab ${activeTab === 'expiring' ? 'active' : ''}`}
                aria-pressed={activeTab === 'expiring'}
                style={{ fontSize: '11.5px', padding: '5px 10px', borderRadius: '0px', background: activeTab === 'expiring' ? 'var(--fr8x-outline)' : undefined, color: activeTab === 'expiring' ? '#fff' : undefined, borderColor: activeTab === 'expiring' ? 'var(--fr8x-outline)' : undefined }}
                onClick={() => setActiveTab('expiring')}
              >
                <Clock size={11} style={{ verticalAlign: '-1px' }} /> Expiring / Expired Rates (
                {allAvailableRates.filter((r) => isExpiringSoon(r.valid)).length})
              </button>

              {comparedRateIds.length > 0 && (
                <button
                  className="btn primary sm"
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '0px', marginLeft: '6px' }}
                  onClick={() => {
                    setSelectedRateIdsForBulk(comparedRateIds);
                    setShowBulkAdjustModal(true);
                  }}
                >
                  ⚡ Bulk Modify Selected ({comparedRateIds.length})
                </button>
              )}
            </div>

            {/* Mobile / Tablet Horizontal Scrollable Tab Bar */}
            <div className="rates-mobile-tabs-scroll">
              <button
                type="button"
                className={`rates-mobile-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <span>All Rates</span>
                <span className="rates-mobile-tab-badge">{rates.length + myRates.length}</span>
              </button>
              <button
                type="button"
                className={`rates-mobile-tab-btn ${activeTab === 'self' ? 'active' : ''}`}
                onClick={() => setActiveTab('self')}
              >
                <span>Self-Posted</span>
                <span className="rates-mobile-tab-badge">{allAvailableRates.filter((r) => r.isOwner || r.ownerUid === user.uid || r.isSelfPosted || myRates.some((mr) => mr.id === r.id)).length}</span>
              </button>
              <button
                type="button"
                className={`rates-mobile-tab-btn ${activeTab === 'i' ? 'active' : ''}`}
                onClick={() => setActiveTab('i')}
              >
                <span>My i-Rates</span>
                <span className="rates-mobile-tab-badge">{myRates.length}</span>
              </button>
              <button
                type="button"
                className={`rates-mobile-tab-btn ${activeTab === 'expiring' ? 'active' : ''}`}
                onClick={() => setActiveTab('expiring')}
              >
                <span>Expiring</span>
                <span className="rates-mobile-tab-badge">{allAvailableRates.filter((r) => isExpiringSoon(r.valid)).length}</span>
              </button>
              {comparedRateIds.length > 0 && (
                <button
                  type="button"
                  className="rates-mobile-tab-btn"
                  style={{ background: '#0284c7', color: '#fff', borderColor: '#0284c7' }}
                  onClick={() => {
                    setSelectedRateIdsForBulk(comparedRateIds);
                    setShowBulkAdjustModal(true);
                  }}
                >
                  <span>⚡ Modify ({comparedRateIds.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Unified POL / POD Corridor Search & Global Search Deck */}
          <div className="rates-search-deck" style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid var(--fr8x-outline, #cbd5e1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSearchMode('corridor')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    background: searchMode === 'corridor' ? '#1985a1' : 'transparent',
                    color: searchMode === 'corridor' ? '#ffffff' : '#475569',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ArrowRightLeft size={12} />
                  <span>POL ➔ POD Route</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('global')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    background: searchMode === 'global' ? '#1985a1' : 'transparent',
                    color: searchMode === 'global' ? '#ffffff' : '#475569',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Search size={12} />
                  <span>Global Search</span>
                </button>
              </div>

              {(polSearch || podSearch || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setPolSearch('');
                    setPodSearch('');
                    setSearchQuery('');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    color: '#dc2626',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <X size={11} /> Clear Filters
                </button>
              )}
            </div>

            {/* Active Mode Inputs */}
            {searchMode === 'corridor' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '6px' }}>
                <div style={{ position: 'relative', minWidth: 0 }}>
                  <MapPin size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#1985a1', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="POL: Mundra, Nhava Sheva…"
                    value={polSearch}
                    onChange={(e) => setPolSearch(e.target.value)}
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 24px 0 24px',
                      fontSize: '11.5px',
                      border: '1px solid var(--fr8x-outline, #cbd5e1)',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: 'var(--fr8x-text)',
                      outline: 'none',
                    }}
                  />
                  {polSearch && (
                    <button
                      type="button"
                      onClick={() => setPolSearch('')}
                      style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  title="Swap POL and POD"
                  onClick={() => {
                    const tmp = polSearch;
                    setPolSearch(podSearch);
                    setPodSearch(tmp);
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff',
                    border: '1px solid var(--fr8x-outline, #cbd5e1)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#1985a1',
                    flexShrink: 0,
                  }}
                >
                  <ArrowRightLeft size={13} />
                </button>

                <div style={{ position: 'relative', minWidth: 0 }}>
                  <MapPin size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#059669', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="POD: Jebel Ali, Rotterdam…"
                    value={podSearch}
                    onChange={(e) => setPodSearch(e.target.value)}
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 24px 0 24px',
                      fontSize: '11.5px',
                      border: '1px solid var(--fr8x-outline, #cbd5e1)',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: 'var(--fr8x-text)',
                      outline: 'none',
                    }}
                  />
                  {podSearch && (
                    <button
                      type="button"
                      onClick={() => setPodSearch('')}
                      style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Global Search: Carrier, Port, Container Type, Route, Remarks…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 28px 0 30px',
                    fontSize: '11.5px',
                    border: '1px solid var(--fr8x-outline, #cbd5e1)',
                    borderRadius: '6px',
                    background: '#ffffff',
                    color: 'var(--fr8x-text)',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Quick Lane Chips */}
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', marginTop: '7px', paddingBottom: '2px', scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => { setPolSearch(''); setPodSearch(''); setSearchQuery(''); }}
                style={{
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: (!polSearch && !podSearch && !searchQuery) ? 700 : 500,
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  background: (!polSearch && !podSearch && !searchQuery) ? '#0f172a' : '#ffffff',
                  color: (!polSearch && !podSearch && !searchQuery) ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                All Lanes ({filteredRates.length})
              </button>
              {[
                { label: 'Mundra ➔ Jebel Ali', pol: 'Mundra', pod: 'Jebel Ali' },
                { label: 'Nhava Sheva ➔ Rotterdam', pol: 'Nhava Sheva', pod: 'Rotterdam' },
                { label: 'Pipavav ➔ Singapore', pol: 'Pipavav', pod: 'Singapore' },
                { label: 'Mundra ➔ Felixstowe', pol: 'Mundra', pod: 'Felixstowe' },
              ].map((lane) => {
                const isSelected = polSearch.toLowerCase().includes(lane.pol.toLowerCase()) && podSearch.toLowerCase().includes(lane.pod.toLowerCase());
                return (
                  <button
                    key={lane.label}
                    type="button"
                    onClick={() => {
                      setSearchMode('corridor');
                      setPolSearch(lane.pol);
                      setPodSearch(lane.pod);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: isSelected ? 700 : 500,
                      borderRadius: '4px',
                      border: isSelected ? '1px solid #1985a1' : '1px solid #cbd5e1',
                      background: isSelected ? '#e0f2fe' : '#ffffff',
                      color: isSelected ? '#0369a1' : '#475569',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {lane.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop full-width rates table fitting screen wide without text wrap */}
          <div className="rates-desktop-table-container">

          {/* Full-width rates table fitting screen wide without text wrap */}
          <div className="tablewrap flush" style={{ overflowX: 'auto', width: '100%' }}>
            <table className="table rates-compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse', minWidth: '1120px' }}>
              <colgroup>
                <col style={{ width: '38px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '95px' }} />
                <col style={{ width: '42px' }} />
                <col style={{ width: '65px' }} />
                <col style={{ width: '65px' }} />
                <col style={{ width: '65px' }} />
                <col style={{ width: '65px' }} />
                <col style={{ width: '68px' }} />
                <col style={{ width: '65px' }} />
                <col style={{ width: '68px' }} />
                <col style={{ width: '65px' }} />
                <col style={{ width: '55px' }} />
                <col style={{ width: '68px' }} />
                <col style={{ width: '55px' }} />
                <col style={{ width: '45px' }} />
                <col style={{ width: '75px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '70px' }} />
              </colgroup>
              <thead>
                {/* Header row — clean, high-contrast, zero-curve, 1px outline */}
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid var(--fr8x-outline)' }}>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', textAlign: 'center', fontWeight: 800, whiteSpace: 'nowrap' }}>CMP</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', textAlign: 'center', fontWeight: 800, whiteSpace: 'nowrap' }}>SEQ</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>SERVICE PROVIDER</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>LINE</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>POR</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>POL</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>POD</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>FPOD</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap' }}>20DV (USD)</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>20TYPE</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap' }}>40HC (USD)</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>40TYPE</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>F/T</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>DATE</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>TYPE</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap' }}>TT</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>ROUTING</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', fontWeight: 800, whiteSpace: 'nowrap' }}>REMARKS</th>
                  <th style={{ color: 'var(--fr8x-text)', fontSize: '10px', padding: '6px 3px', textAlign: 'center', fontWeight: 800, whiteSpace: 'nowrap' }}>ACTION</th>
                </tr>
                {/* Per-column search row */}
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--fr8x-outline)' }}>
                  <th />
                  <th><input className="input" style={{ fontSize: '9.5px', height: '22px', padding: '0 3px', width: '100%', fontFamily: 'monospace', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }} placeholder="SEQ" value={colSearch.seq || ''} onChange={(e) => updateColSearch('seq', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '9.5px', height: '22px', padding: '0 3px', width: '100%', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }} placeholder="SEARCH" value={colSearch.sp || ''} onChange={(e) => updateColSearch('sp', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '9.5px', height: '22px', padding: '0 3px', width: '100%', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }} placeholder="SEARCH" value={colSearch.carrier || ''} onChange={(e) => updateColSearch('carrier', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '9.5px', height: '22px', padding: '0 3px', width: '100%', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }} placeholder="SEARCH" value={colSearch.por || ''} onChange={(e) => updateColSearch('por', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '9.5px', height: '22px', padding: '0 3px', width: '100%', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }} placeholder="SEARCH" value={colSearch.pol || ''} onChange={(e) => updateColSearch('pol', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '9.5px', height: '22px', padding: '0 3px', width: '100%', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }} placeholder="SEARCH" value={colSearch.pod || ''} onChange={(e) => updateColSearch('pod', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '9.5px', height: '22px', padding: '0 3px', width: '100%', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }} placeholder="SEARCH" value={colSearch.fpod || ''} onChange={(e) => updateColSearch('fpod', e.target.value)} /></th>
                  <th /><th /><th /><th /><th /><th /><th /><th />
                  <th><input className="input" style={{ fontSize: '9.5px', height: '22px', padding: '0 3px', width: '100%', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }} placeholder="SEARCH" value={colSearch.routing || ''} onChange={(e) => updateColSearch('routing', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '9.5px', height: '22px', padding: '0 3px', width: '100%', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }} placeholder="SEARCH" value={colSearch.remarks || ''} onChange={(e) => updateColSearch('remarks', e.target.value)} /></th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((rate, idx) => {
                  const isCompared = comparedRateIds.includes(rate.id);
                  const isExpiring = isExpiringSoon(rate.valid);
                  const isOwner = myRates.some((mr) => mr.id === rate.id);

                  return (
                    <tr key={rate.id} style={{ background: isCompared ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#f7f9fd', cursor: 'default' }}
                      onClick={() => {
                        setCarrier(rate.carrier);
                        setPor(rate.por || '');
                        setPol(rate.pol);
                        setPod(rate.pod);
                        setFpod(rate.fpod || '');
                        setD20(rate.d20);
                        setD20Type(rate.d20Type || '');
                        setH40(rate.h40);
                        setH40Type(rate.h40Type || '');
                        setFreeTime(rate.ft);
                        setValidDate(rate.valid);
                        setTransitTime(rate.tt);
                        setRouting(rate.route);
                        setRateType(rate.rateType || 'Direct Spot');
                        setRemarks(rate.remark);
                        setEditingRateId(rate.id);
                      }}
                    >
                      <td style={{ textAlign: 'center', padding: '4px 3px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                          <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={(e) => { e.stopPropagation(); handleToggleCompare(rate.id); }}
                            title="Select to compare"
                            style={{ cursor: 'pointer' }}
                          />
                          <button
                            type="button"
                            className="btn icon sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRateDetail(rate);
                            }}
                            title="View Complete Structured Dossier & Table Matrix"
                            style={{
                              width: '20px',
                              height: '20px',
                              border: '1px solid #cbd5e1',
                              background: '#fff',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              cursor: 'pointer',
                            }}
                          >
                            <FileSpreadsheet size={11} color="var(--brand)" />
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--ink)', padding: '5px 4px', fontSize: '10.5px', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {getRateSeq(rate, allAvailableRates.indexOf(rate))}
                      </td>
                      <td style={{ padding: '5px 4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: isOwner ? 700 : 400 }}>{rate.sp}</span>
                        {isOwner && <span style={{ fontSize: '9px', color: 'var(--brand)', display: 'block' }}>i-Rate</span>}
                      </td>
                      <td style={{ padding: '4px 3px', fontWeight: 600, fontSize: '11px' }} title={rate.carrier}>
                        {(() => {
                          const carrierMaster = masterCarriers.find((c) => c.name.toLowerCase() === rate.carrier.toLowerCase() || c.carrierCode.toLowerCase() === rate.carrier.toLowerCase() || c.scacCode.toLowerCase() === rate.carrier.toLowerCase());
                          return carrierMaster?.logoUrl ? (
                            <img src={carrierMaster.logoUrl} alt={`${rate.carrier} logo`} style={{ width: '25px', height: '25px', objectFit: 'contain', display: 'block' }} />
                          ) : (
                            <span aria-label={rate.carrier} style={{ display: 'inline-flex', width: '25px', height: '25px', alignItems: 'center', justifyContent: 'center', background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', fontSize: '8px', fontWeight: 800 }}>
                              {(carrierMaster?.carrierCode || rate.carrier).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <span>🗺️</span>
                          <span>{rate.por || rate.pol}</span>
                        </span>
                      </td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <span>⚓</span>
                          <span>{rate.pol}</span>
                        </span>
                      </td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <span>⚓</span>
                          <span>{rate.pod}</span>
                        </span>
                      </td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <span>🗺️</span>
                          <span>{rate.fpod || rate.pod}</span>
                        </span>
                      </td>
                      <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--brand)', fontSize: '11.5px' }}>${rate.d20.toLocaleString()}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px', color: 'var(--mut)' }}>{rate.d20Type || 'Dry Std'}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--teal)', fontSize: '11.5px' }}>${rate.h40.toLocaleString()}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px', color: 'var(--mut)' }}>{rate.h40Type || 'HC'}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px' }}>{rate.ft}</td>
                      <td style={{ padding: '5px 4px' }}>
                        <span style={{ fontSize: '10px', color: isExpiring ? 'var(--amber)' : 'var(--ink-secondary)', fontWeight: isExpiring ? 700 : 400 }}>{rate.valid}</span>
                      </td>
                      <td style={{ padding: '5px 4px' }}>
                        <span className={`badge ${isOwner ? 'blue' : 'grey'}`} style={{ fontSize: '9px', padding: '2px 5px' }}>{rate.rateType || 'Spot'}</span>
                      </td>
                      <td style={{ padding: '5px 4px', textAlign: 'right', fontSize: '10.5px' }}>{rate.tt}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rate.route}>{rate.route}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10px', color: 'var(--mut)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rate.remark}>{rate.remark}</td>
                      <td style={{ padding: '5px 4px' }}>
                        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                          <button className="btn secondary sm" style={{ padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); setSelectedRateDetail(rate); }} title="View Rate Detail">
                            <Eye size={11} />
                          </button>
                          <button className="btn secondary sm" style={{ padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); handleCopyQuote(rate); }} title="Copy Structured Quote Breakdown">
                            <Copy size={11} />
                          </button>
                          <button className="btn secondary sm" style={{ padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); handleOpenEmailModal(rate); }} title="Email Rate Quote to Service Provider">
                            <Mail size={11} />
                          </button>
                          <button
                            className="btn secondary sm"
                            style={{ padding: '2px 5px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `https://con.fr8x.in/r/${rate.id}`;
                              navigator.clipboard?.writeText?.(url);
                              toast(`Smart i-Rate link copied: ${url}`);
                            }}
                            title="Copy Smart i-Rate Link (con.fr8x.in/r/...)"
                          >
                            <Share2 size={11} />
                          </button>
                          <button className="btn secondary sm" style={{ padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); handleToggleCompare(rate.id); }} title="Compare">
                            <ArrowRightLeft size={11} />
                          </button>
                          <button
                            className="btn secondary sm"
                            style={{ padding: '2px 5px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingRevisionRate(rate);
                            }}
                            title={`Revision History (${rate.versions?.length || 1} versions)`}
                          >
                            <History size={11} />
                          </button>
                          {isOwner && (
                            <button className="btn danger sm" style={{ padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); deleteMyRate(rate.id); }} title="Delete">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination footer */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid var(--line)', gap: '12px', fontSize: '12px', color: 'var(--mut)' }}>
            <span>Showing {filteredRates.length} of {allAvailableRates.length} rates</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['‹ Prev', '1', '2', '3', '4', '5', '…', 'Next ›'].map((p, i) => (
                <button key={i} className="btn secondary sm" style={{ fontSize: '11px', padding: '2px 7px', minWidth: 'unset' }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
        {/* End of Desktop Table Container */}

        {/* Mobile & Tablet Card View (< 1024px) */}
        <div className="rates-mobile-tablet-view" style={{ padding: '10px 12px' }}>
          {/* If on My i-Rates tab, show toggleable editor on mobile */}
          {activeTab === 'i' && (
            <button
              type="button"
              className="mobile-editor-toggle-btn"
              onClick={() => setMobileEditorOpen(!mobileEditorOpen)}
            >
              <span>{mobileEditorOpen ? '▲ Hide Rates Editor' : '▼ Open Rates Editor (+ Add New i-Rate)'}</span>
            </button>
          )}

          {filteredRates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <Search size={28} style={{ color: '#94a3b8', margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>No Matching Rates Found</div>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Try changing search keywords, selecting another carrier, or clearing filters.
              </p>
            </div>
          ) : (
            <div className="rates-card-grid">
              {filteredRates.map((rate) => {
                const isCompared = comparedRateIds.includes(rate.id);
                const isExpiring = isExpiringSoon(rate.valid);
                const seqCode = getRateSeq(rate, allAvailableRates.indexOf(rate));

                return (
                  <div
                    key={rate.id}
                    className={`mobile-rate-card ${isCompared ? 'compared' : ''}`}
                  >
                    {/* Card Header: Carrier + SP + Type + Status */}
                    <div className="mobile-rate-card-header">
                      <div className="mobile-rate-carrier-wrap">
                        <div className="mobile-rate-carrier-icon">
                          {rate.carrier.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="mobile-rate-carrier-title">{rate.carrier}</div>
                          <div className="mobile-rate-sp">{rate.sp}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        <span
                          className="badge font-mono"
                          style={{
                            fontSize: '9.5px',
                            background: isExpiring ? '#fef3c7' : '#dcfce7',
                            color: isExpiring ? '#92400e' : '#15803d',
                            border: `1px solid ${isExpiring ? '#fde68a' : '#bbf7d0'}`,
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontWeight: 700,
                          }}
                        >
                          {isExpiring ? `EXP: ${rate.valid}` : `VALID: ${rate.valid}`}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontFamily: 'monospace',
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '1px 5px',
                            borderRadius: '3px',
                          }}
                        >
                          {seqCode}
                        </span>
                      </div>
                    </div>

                    {/* Port Route Corridor */}
                    <div className="mobile-rate-corridor">
                      <div className="mobile-rate-route-line">
                        <div className="mobile-rate-port" title={rate.por || rate.pol}>
                          <small style={{ display: 'block', fontSize: '9px', color: '#64748b', fontWeight: 600 }}>ORIGIN</small>
                          <span>{rate.pol.split('(')[0].trim()}</span>
                        </div>

                        <div className="mobile-rate-arrow-track">
                          <span className="mobile-rate-tt-badge">{rate.tt || '28 days'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '2px' }}>
                            <div style={{ height: '1px', flex: 1, background: '#93c5fd' }} />
                            <span style={{ fontSize: '11px' }}>➔</span>
                          </div>
                        </div>

                        <div className="mobile-rate-port mobile-rate-port-dest" title={rate.fpod || rate.pod}>
                          <small style={{ display: 'block', fontSize: '9px', color: '#64748b', fontWeight: 600 }}>DESTINATION</small>
                          <span>{rate.pod.split('(')[0].trim()}</span>
                        </div>
                      </div>

                      <div className="mobile-rate-route-sub">
                        <span>Route: <b>{rate.route || 'Direct Ocean'}</b></span>
                        <span>Category: <b>{rate.rateType || 'Direct Spot'}</b></span>
                      </div>
                    </div>

                    {/* Pricing Highlight Grid (20DV & 40HC) */}
                    <div className="mobile-rate-pricing-grid">
                      <div className="mobile-rate-price-box box-20">
                        <div className="mobile-rate-price-label">
                          <span>20&apos; DV Standard</span>
                          <span>{rate.d20Type || 'Dry'}</span>
                        </div>
                        <div className="mobile-rate-price-val">
                          ${rate.d20.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 600 }}>USD</span>
                        </div>
                        <div className="mobile-rate-price-eq">
                          ≈ {format(rate.d20)}
                        </div>
                      </div>

                      <div className="mobile-rate-price-box box-40">
                        <div className="mobile-rate-price-label">
                          <span>40&apos; HC High Cube</span>
                          <span>{rate.h40Type || 'HC'}</span>
                        </div>
                        <div className="mobile-rate-price-val">
                          ${rate.h40.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 600 }}>USD</span>
                        </div>
                        <div className="mobile-rate-price-eq">
                          ≈ {format(rate.h40)}
                        </div>
                      </div>
                    </div>

                    {/* Free Time & Conditions */}
                    <div className="mobile-rate-meta-row">
                      <span>Free Time: <b style={{ color: '#0f172a' }}>{rate.ft || '14 Days Combined'}</b></span>
                      {rate.remark && (
                        <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '10px' }} className="truncate max-w-[180px]">
                          {rate.remark}
                        </span>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="mobile-rate-actions-bar">
                      <button
                        type="button"
                        className="mobile-rate-action-btn primary"
                        onClick={() => setSelectedRateDetail(rate)}
                        title="View Rate Intelligence Dossier"
                      >
                        <Eye size={12} />
                        <span>Dossier</span>
                      </button>
                      <button
                        type="button"
                        className="mobile-rate-action-btn"
                        onClick={() => handleOpenEmailModal(rate)}
                        title="Email Quote"
                      >
                        <Mail size={12} />
                        <span>Email</span>
                      </button>
                      <button
                        type="button"
                        className="mobile-rate-action-btn"
                        onClick={() => {
                          const url = `https://con.fr8x.in/r/${rate.id}`;
                          navigator.clipboard?.writeText?.(url);
                          toast(`Smart i-Rate link copied: ${url}`);
                        }}
                        title="Share Smart i-Rate Link"
                      >
                        <Share2 size={12} />
                        <span>Share</span>
                      </button>
                      <button
                        type="button"
                        className={`mobile-rate-action-btn ${isCompared ? 'active-cmp' : ''}`}
                        onClick={() => handleToggleCompare(rate.id)}
                        title="Toggle Compare"
                      >
                        <ArrowRightLeft size={12} />
                        <span>{isCompared ? 'Added' : 'Compare'}</span>
                      </button>
                      <button
                        type="button"
                        className="mobile-rate-action-btn"
                        onClick={() => handleCopyQuote(rate, allAvailableRates.indexOf(rate))}
                        title="Copy Quote Breakdown"
                      >
                        <Copy size={12} />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mobile pagination summary */}
          <div style={{ textAlign: 'center', padding: '12px 8px 4px', fontSize: '11px', color: 'var(--mut)' }}>
            Showing {filteredRates.length} of {allAvailableRates.length} rates in catalog
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
