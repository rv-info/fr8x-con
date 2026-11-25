'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Copy,
  CheckCircle2,
  AlertCircle,
  Ship,
  Calendar,
  DollarSign,
  Clock,
  Compass,
  FileText,
  Sparkles,
  Zap,
  Check,
  Layers,
  Cpu,
} from 'lucide-react';
import { PortSearch, CarrierSearch } from '@/components/ui/PortSearch';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { useToast } from '@/lib/context/ToastContext';
import { parseNaturalLanguageRates, ParsedRateResult } from '@/lib/rates/rateParser';

export interface RateFormData {
  carrier: string;
  por: string;
  pol: string;
  pod: string;
  fpod: string;
  d20: number | string;
  d20Type: string;
  h40: number | string;
  h40Type: string;
  freeTime: string;
  validDate: string;
  transitTime: string;
  routing: string;
  rateType: string;
  remarks: string;
}

export const CONTAINER_20_OPTIONS = [
  { value: '20DV', label: '20DV' },
  { value: '20RF', label: '20RF' },
  { value: '20HC', label: '20HC' },
  { value: '20OT', label: '20OT' },
  { value: '20FR', label: '20FR' },
  { value: '20PL', label: '20PL' },
  { value: '20TK', label: '20TK' },
  { value: '20BK', label: '20BK' },
  { value: '20VN', label: '20VN' },
  { value: '20IN', label: '20IN' },
  { value: '20HT', label: '20HT' },
];

export const CONTAINER_40_OPTIONS = [
  { value: '40HC', label: '40HC' },
  { value: '40DV', label: '40DV' },
  { value: '40RF', label: '40RF' },
  { value: '40HR', label: '40HR' },
  { value: '40OT', label: '40OT' },
  { value: '40OH', label: '40OH' },
  { value: '40FR', label: '40FR' },
  { value: '40FC', label: '40FC' },
  { value: '40PL', label: '40PL' },
  { value: '45HC', label: '45HC' },
  { value: '40TK', label: '40TK' },
  { value: '40PW', label: '40PW' },
];

export const RATE_TYPE_OPTIONS = [
  { value: 'Direct Spot', label: 'Direct Spot' },
  { value: 'Contract', label: 'Contract' },
  { value: 'NAC', label: 'NAC' },
  { value: 'Coloader', label: 'Coloader' },
];

interface RatesEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRateId: string | null;
  mode?: 'create' | 'overview' | 'edit';
  initialData?: Partial<RateFormData> | null;
  onSave: (data: RateFormData) => Promise<void> | void;
  onUpdate: (rateId: string, data: RateFormData) => Promise<void> | void;
  onDuplicate: (data: RateFormData) => Promise<void> | void;
}

export function RatesEditorModal({
  isOpen,
  onClose,
  editingRateId,
  mode = 'create',
  initialData,
  onSave,
  onUpdate,
  onDuplicate,
}: RatesEditorModalProps) {
  const { toast } = useToast();

  const [carrier, setCarrier] = useState(initialData?.carrier || '');
  const [por, setPor] = useState(initialData?.por || '');
  const [pol, setPol] = useState(initialData?.pol || '');
  const [pod, setPod] = useState(initialData?.pod || '');
  const [fpod, setFpod] = useState(initialData?.fpod || '');
  const [d20, setD20] = useState<number | string>(initialData?.d20 ?? '');
  const [d20Type, setD20Type] = useState(initialData?.d20Type || '20DV');
  const [h40, setH40] = useState<number | string>(initialData?.h40 ?? '');
  const [h40Type, setH40Type] = useState(initialData?.h40Type || '40HC');
  const [freeTime, setFreeTime] = useState(initialData?.freeTime || '');
  const [validDate, setValidDate] = useState(initialData?.validDate || '');
  const [transitTime, setTransitTime] = useState(initialData?.transitTime || '');
  const [routing, setRouting] = useState(initialData?.routing || '');
  const [rateType, setRateType] = useState(initialData?.rateType || 'Direct Spot');
  const [remarks, setRemarks] = useState(initialData?.remarks || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Natural-Language Rate Entry State
  const [aiInput, setAiInput] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [parsedResults, setParsedResults] = useState<ParsedRateResult | null>(null);
  const [activeRecordIndex, setActiveRecordIndex] = useState(0);

  const populateFormFromParsed = (r: RateFormData) => {
    if (r.carrier) setCarrier(r.carrier);
    if (r.por) setPor(r.por);
    if (r.pol) setPol(r.pol);
    if (r.pod) setPod(r.pod);
    if (r.fpod) setFpod(r.fpod);
    if (r.d20 !== undefined && r.d20 !== '') setD20(r.d20);
    if (r.d20Type) setD20Type(r.d20Type);
    if (r.h40 !== undefined && r.h40 !== '') setH40(r.h40);
    if (r.h40Type) setH40Type(r.h40Type);
    if (r.freeTime) setFreeTime(r.freeTime);
    if (r.validDate) setValidDate(r.validDate);
    if (r.transitTime) setTransitTime(r.transitTime);
    if (r.routing) setRouting(r.routing);
    if (r.rateType) setRateType(r.rateType);
    if (r.remarks) setRemarks(r.remarks);
  };

  const handleAutoExtract = (textOverride?: string) => {
    const textToProcess = (textOverride !== undefined ? textOverride : aiInput).trim();
    if (!textToProcess) {
      toast('Please enter a natural-language freight rate instruction to extract.');
      return;
    }
    setIsAiParsing(true);
    try {
      const result = parseNaturalLanguageRates(textToProcess);
      setParsedResults(result);
      if (result.success && result.records.length > 0) {
        setActiveRecordIndex(0);
        populateFormFromParsed(result.records[0]);
        if (result.records.length > 1) {
          toast(`Extracted ${result.records.length} rate instructions! Loaded Rate 1 into editor.`);
        } else {
          toast('Rate instruction successfully parsed and populated into editor!');
        }
      } else {
        toast('Could not reliably extract rate fields. Please verify format.');
      }
    } catch (err: any) {
      toast(err.message || 'Rate parsing error');
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSelectMultiRate = (index: number) => {
    if (!parsedResults || !parsedResults.records[index]) return;
    setActiveRecordIndex(index);
    populateFormFromParsed(parsedResults.records[index]);
    toast(`Loaded Rate ${index + 1} of ${parsedResults.records.length} into editor.`);
  };

  const handleClearAi = () => {
    setAiInput('');
    setParsedResults(null);
    setActiveRecordIndex(0);
  };

  const prevOpenRef = React.useRef(isOpen);
  const prevEditingIdRef = React.useRef(editingRateId);

  // Sync state when modal opens or editing rate changes
  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    const editingIdChanged = editingRateId !== prevEditingIdRef.current;
    prevOpenRef.current = isOpen;
    prevEditingIdRef.current = editingRateId;

    if (isOpen && (justOpened || editingIdChanged)) {
      if (editingRateId && initialData) {
        setCarrier(initialData.carrier || '');
        setPor(initialData.por || '');
        setPol(initialData.pol || '');
        setPod(initialData.pod || '');
        setFpod(initialData.fpod || '');
        setD20(initialData.d20 ?? '');
        setD20Type(initialData.d20Type || '20DV');
        setH40(initialData.h40 ?? '');
        setH40Type(initialData.h40Type || '40HC');
        setFreeTime(initialData.freeTime || '');
        setValidDate(initialData.validDate || '');
        setTransitTime(initialData.transitTime || '');
        setRouting(initialData.routing || '');
        setRateType(initialData.rateType || 'Direct Spot');
        setRemarks(initialData.remarks || '');
      } else if (!editingRateId && justOpened) {
        handleClearForm(false);
      }
    }
  }, [isOpen, editingRateId, initialData]);

  const isDirty = useMemo(() => {
    return Boolean(
      carrier.trim() ||
      por.trim() ||
      pol.trim() ||
      pod.trim() ||
      fpod.trim() ||
      d20 ||
      h40 ||
      freeTime.trim() ||
      validDate.trim() ||
      transitTime.trim() ||
      routing.trim() ||
      remarks.trim()
    );
  }, [carrier, por, pol, pod, fpod, d20, h40, freeTime, validDate, transitTime, routing, remarks]);

  const handleClose = () => {
    if (isDirty && !editingRateId) {
      if (typeof window !== 'undefined' && !window.confirm('You have unsaved changes in the Rates Editor. Discard and close?')) {
        return;
      }
    }
    onClose();
  };

  const handleClearForm = (showToast = true) => {
    setCarrier('');
    setPor('');
    setPol('');
    setPod('');
    setFpod('');
    setD20('');
    setD20Type('20DV');
    setH40('');
    setH40Type('40HC');
    setFreeTime('');
    setValidDate('');
    setTransitTime('');
    setRouting('');
    setRateType('Direct Spot');
    setRemarks('');
    setAiInput('');
    setParsedResults(null);
    setActiveRecordIndex(0);
    if (showToast) {
      toast('Form reset to clean state.');
    }
  };

  const validatePayload = (): RateFormData | null => {
    if (!carrier.trim()) {
      toast('Please specify or select an Ocean Carrier.');
      return null;
    }
    if (!pol.trim()) {
      toast('Port of Loading (POL) is required.');
      return null;
    }
    if (!pod.trim()) {
      toast('Port of Discharge (POD) is required.');
      return null;
    }
    if (!d20 || Number(d20) <= 0) {
      toast('Please specify a valid 20DV container rate amount (USD).');
      return null;
    }
    if (!h40 || Number(h40) <= 0) {
      toast('Please specify a valid 40HC container rate amount (USD).');
      return null;
    }
    if (!validDate.trim()) {
      toast('Please select a validity date for this rate quotation.');
      return null;
    }

    return {
      carrier: carrier.trim(),
      por: por.trim(),
      pol: pol.trim(),
      pod: pod.trim(),
      fpod: fpod.trim(),
      d20: Number(d20),
      d20Type: d20Type || '20DV',
      h40: Number(h40),
      h40Type: h40Type || '40HC',
      freeTime: freeTime.trim() || '14 days combined',
      transitTime: transitTime.trim() || '28 days',
      validDate: validDate.trim(),
      routing: routing.trim() || 'Direct Ocean Service',
      rateType: rateType || 'Direct Spot',
      remarks: remarks.trim(),
    };
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    const payload = validatePayload();
    if (!payload) return;

    try {
      setIsSubmitting(true);
      await onSave(payload);
      handleClearForm(false);
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to save rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (isSubmitting) return;
    if (!editingRateId) {
      toast('Select a rate from the table to load into the editor before clicking UPDATE.');
      return;
    }
    const payload = validatePayload();
    if (!payload) return;

    try {
      setIsSubmitting(true);
      await onUpdate(editingRateId, payload);
      handleClearForm(false);
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to update rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async () => {
    if (isSubmitting) return;
    const payload = validatePayload();
    if (!payload) return;

    try {
      setIsSubmitting(true);
      await onDuplicate(payload);
      handleClearForm(false);
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to duplicate rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop rates-editor-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(27, 43, 75, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="rates-editor-modal-container"
        style={{
          width: '90%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          backgroundColor: 'var(--surface-primary, #FFFFFF)',
          color: 'var(--text-primary, #1F2937)',
          borderRadius: '8px',
          border: '1px solid var(--border-default, #D9DEE5)',
          boxShadow: 'var(--glass-shadow-lg, 0 20px 40px rgba(0, 0, 0, 0.25))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-family-primary)',
          fontSize: '13px',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rates-editor-title"
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--surface-elevated, #F8FAFC)',
            borderBottom: '1px solid var(--border-subtle, #E5E7EB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-primary, #006B68)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ship size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  id="rates-editor-title"
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--text-primary, #1F2937)',
                    margin: 0,
                    letterSpacing: '0.02em',
                  }}
                >
                  RATES EDITOR
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: editingRateId ? 'rgba(180, 83, 9, 0.12)' : mode === 'overview' ? 'rgba(2, 132, 199, 0.12)' : 'var(--surface-primary, #FFFFFF)',
                    color: editingRateId ? '#B45309' : mode === 'overview' ? '#0284C7' : 'var(--text-primary, #1F2937)',
                    border: `1px solid ${editingRateId ? 'rgba(180, 83, 9, 0.35)' : mode === 'overview' ? 'rgba(2, 132, 199, 0.35)' : 'var(--border-default, #D9DEE5)'}`,
                  }}
                >
                  {editingRateId ? `Editing Rate #${editingRateId}` : mode === 'overview' ? 'Overview Mode' : 'New Rate Creation'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary, #64748B)' }}>
                {editingRateId
                  ? 'Update existing freight rate parameters or duplicate as a new distinct rate.'
                  : mode === 'overview'
                  ? 'Rates Overview & Natural Language Rate Intelligence. Review or extract rate instructions below.'
                  : 'Create a new self-posted freight rate quotation with container tariffs and port pairs.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Rates Editor"
            className="close-red-box"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body with internal scrolling */}
        <div
          style={{
            padding: '18px 20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* AI Natural-Language Rate Entry Panel */}
          <div
            className="ai-rate-entry-card"
            style={{
              backgroundColor: 'var(--surface-primary, #FFFFFF)',
              border: '1px solid var(--border-default, #D9DEE5)',
              borderRadius: '8px',
              padding: '12px 14px',
              boxShadow: 'var(--shadow-subtle, 0 1px 3px rgba(0, 0, 0, 0.04))',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border-subtle, #E5E7EB)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '5px',
                    backgroundColor: 'var(--surface-elevated, #F8FAFC)',
                    border: '1px solid var(--border-subtle, #E5E7EB)',
                    color: 'var(--accent-primary, #006B68)',
                  }}
                >
                  <Sparkles size={14} />
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  AI Natural-Language Rate Entry
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface-elevated, #F8FAFC)',
                    color: 'var(--accent-primary, #006B68)',
                    border: '1px solid var(--border-default, #D9DEE5)',
                  }}
                >
                  Instant Parsing
                </span>
              </div>
            </div>

            {/* Input Textarea */}
            <div style={{ position: 'relative' }}>
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Type or paste rate instruction in ordinary language... e.g., 'Maersk Line POL Nhava Sheva to Jebel Ali, 20DV $1450, 40HC $2300, 14 days free time, valid till 31-12-2026, transit 18 days via direct route, includes THC & BAF'"
                style={{
                  width: '100%',
                  minHeight: '52px',
                  height: '52px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-default, #D9DEE5)',
                  backgroundColor: 'var(--surface-primary, #FFFFFF)',
                  color: 'var(--text-primary, #1F2937)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-family-primary)',
                  lineHeight: '1.4',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleAutoExtract();
                  }
                }}
              />
            </div>

            {/* Quick Sample Prompts & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>Quick Samples:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'Maersk Line POL Nhava Sheva to Jebel Ali, 20DV $1450, 40HC $2300, 14 days free time, valid till 31-12-2026, transit 18 days via direct route, includes THC & BAF';
                    setAiInput(sample);
                    handleAutoExtract(sample);
                  }}
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface-elevated, #F8FAFC)',
                    border: '1px solid var(--border-default, #D9DEE5)',
                    color: 'var(--accent-primary, #006B68)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Spot Rate (Single)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'CMA CGM Mundra to Rotterdam 20RF $2100, 40FR $3400, 21 days detention, valid through 15-Oct-2026, transit 28 days, non-hazardous only';
                    setAiInput(sample);
                    handleAutoExtract(sample);
                  }}
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface-elevated, #F8FAFC)',
                    border: '1px solid var(--border-default, #D9DEE5)',
                    color: 'var(--accent-primary, #006B68)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Special Equipment (Reefer/FR)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = '1. MSC Mundra to Jebel Ali, 20DV $1200, 40HC $1900, 14 days FT, valid 31-12-2026, direct\n2. Evergreen Nhava Sheva to Felixstowe, 20DV $1750, 40HC $2650, 21 days FT, valid 15-11-2026, via Colombo';
                    setAiInput(sample);
                    handleAutoExtract(sample);
                  }}
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface-elevated, #F8FAFC)',
                    border: '1px solid var(--border-default, #D9DEE5)',
                    color: 'var(--accent-primary, #006B68)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Multi-Rate (2 Routes)
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {aiInput && (
                  <button
                    type="button"
                    onClick={handleClearAi}
                    style={{
                      height: '28px',
                      padding: '0 8px',
                      fontSize: '11px',
                      borderRadius: '5px',
                      border: '1px solid var(--border-default, #D9DEE5)',
                      backgroundColor: 'var(--surface-primary, #FFFFFF)',
                      color: 'var(--text-secondary, #64748B)',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAutoExtract()}
                  disabled={isAiParsing}
                  className="btn primary sm"
                  style={{
                    height: '28px',
                    padding: '0 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    borderRadius: '5px',
                    border: '1px solid var(--accent-primary, #006B68)',
                    backgroundColor: 'var(--accent-primary, #006B68)',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={13} />
                  <span>{isAiParsing ? 'Extracting…' : 'Extract & Populate'}</span>
                </button>
              </div>
            </div>

            {/* Multi-Rate Selection Tabs when > 1 rate extracted */}
            {parsedResults && parsedResults.records.length > 1 && (
              <div
                style={{
                  marginTop: '4px',
                  padding: '8px 10px',
                  backgroundColor: 'var(--surface-elevated, #F8FAFC)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle, #E5E7EB)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary, #006B68)' }}>
                  <Layers size={13} />
                  <span>{parsedResults.records.length} Rates Detected:</span>
                </div>
                {parsedResults.records.map((rec, idx) => {
                  const isSelected = activeRecordIndex === idx;
                  const label = `Rate ${idx + 1}: ${rec.carrier || 'Carrier'} (${rec.pol || 'POL'} → ${rec.pod || 'POD'})`;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectMultiRate(idx)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected ? 'var(--accent-primary, #006B68)' : 'var(--surface-primary, #FFFFFF)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-primary, #1F2937)',
                        border: `1px solid ${isSelected ? 'var(--accent-primary, #006B68)' : 'var(--border-default, #D9DEE5)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Feedback / Validation Status */}
            {parsedResults && (
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '5px',
                  backgroundColor: parsedResults.missingFields.length > 0 ? 'rgba(217, 119, 6, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                  border: `1px solid ${parsedResults.missingFields.length > 0 ? 'rgba(217, 119, 6, 0.35)' : 'rgba(22, 163, 74, 0.35)'}`,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {parsedResults.missingFields.length > 0 ? (
                    <AlertCircle size={13} color="#D97706" style={{ flexShrink: 0 }} />
                  ) : (
                    <CheckCircle2 size={13} color="#16A34A" style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ color: parsedResults.missingFields.length > 0 ? '#D97706' : '#15803D' }}>
                    {parsedResults.missingFields.length > 0
                      ? `Partially extracted (${parsedResults.confidence}% match). Missing: ${parsedResults.missingFields.join(', ')}. Please verify in the fields below.`
                      : `Successfully mapped all rate fields with ${parsedResults.confidence}% confidence! Review populated fields below and click SAVE RATE.`}
                  </span>
                </div>
                <span style={{ color: 'var(--text-secondary, #64748B)', fontSize: '10.5px' }}>
                  Latency: {parsedResults.modelInfo.latencyMs}ms
                </span>
              </div>
            )}
          </div>

          {/* Two-Column Responsive Grid on Desktop */}
          <div
            className="rates-editor-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Column 1: Carrier & Route Geography */}
            <div
              style={{
                backgroundColor: 'var(--surface-elevated, #F8FAFC)',
                border: '1px solid var(--border-subtle, #E5E7EB)',
                borderRadius: '6px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-subtle, #E5E7EB)', paddingBottom: '6px' }}>
                <Compass size={13} color="var(--accent-primary, #006B68)" /> Routing &amp; Port Geography
              </div>

              {/* Carrier */}
              <div style={{ display: 'grid', gridTemplateColumns: '82px 1fr', gap: '6px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-elevated, #F8FAFC)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                  CARRIER *
                </label>
                <CarrierSearch value={carrier} onChange={setCarrier} placeholder="Search shipping line…" />
              </div>

              {/* POR + POL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-elevated, #F8FAFC)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 4px', borderRadius: '4px', textAlign: 'center' }}>
                    POR
                  </label>
                  <PortSearch value={por} onChange={setPor} placeholder="POR" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-elevated, #F8FAFC)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 4px', borderRadius: '4px', textAlign: 'center' }}>
                    POL *
                  </label>
                  <PortSearch value={pol} onChange={setPol} placeholder="POL" />
                </div>
              </div>

              {/* POD + FPOD */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-elevated, #F8FAFC)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 4px', borderRadius: '4px', textAlign: 'center' }}>
                    POD *
                  </label>
                  <PortSearch value={pod} onChange={setPod} placeholder="POD" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-elevated, #F8FAFC)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 4px', borderRadius: '4px', textAlign: 'center' }}>
                    FPOD
                  </label>
                  <PortSearch value={fpod} onChange={setFpod} placeholder="FPOD" />
                </div>
              </div>

              {/* Transit & Routing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '62px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-elevated, #F8FAFC)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 4px', borderRadius: '4px', textAlign: 'center' }}>
                    TRANSIT
                  </label>
                  <input
                    className="input"
                    style={{ fontSize: '12px', height: '34px', padding: '0 8px', borderRadius: '4px', width: '100%' }}
                    placeholder="e.g. 29 days"
                    value={transitTime}
                    onChange={(e) => setTransitTime(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '62px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-elevated, #F8FAFC)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 4px', borderRadius: '4px', textAlign: 'center' }}>
                    ROUTING
                  </label>
                  <input
                    className="input"
                    style={{ fontSize: '12px', height: '34px', padding: '0 8px', borderRadius: '4px', width: '100%' }}
                    placeholder="Direct / TS"
                    value={routing}
                    onChange={(e) => setRouting(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Equipment, Rates & Terms */}
            <div
              style={{
                backgroundColor: 'var(--surface-elevated, #F8FAFC)',
                border: '1px solid var(--border-subtle, #E5E7EB)',
                borderRadius: '6px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-subtle, #E5E7EB)', paddingBottom: '6px' }}>
                <DollarSign size={13} color="var(--accent-primary, #006B68)" /> Equipment &amp; Rate Quotation
              </div>

              {/* 20' Equipment & Rate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 2px', borderRadius: '4px', textAlign: 'center' }}>
                    20 TYPE
                  </label>
                  <SearchableDropdown
                    options={CONTAINER_20_OPTIONS}
                    value={d20Type}
                    onChange={setD20Type}
                    searchPlaceholder="20' size…"
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 2px', borderRadius: '4px', textAlign: 'center' }}>
                    {d20Type || '20DV'} ($) *
                  </label>
                  <input
                    className="input"
                    style={{ fontSize: '12px', height: '34px', padding: '0 8px', borderRadius: '4px', fontWeight: 700, width: '100%' }}
                    type="number"
                    placeholder="e.g. 1480"
                    value={d20}
                    onChange={(e) => setD20(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>

              {/* 40' Equipment & Rate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 2px', borderRadius: '4px', textAlign: 'center' }}>
                    40 TYPE
                  </label>
                  <SearchableDropdown
                    options={CONTAINER_40_OPTIONS}
                    value={h40Type}
                    onChange={setH40Type}
                    searchPlaceholder="40' size…"
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 2px', borderRadius: '4px', textAlign: 'center' }}>
                    {h40Type || '40HC'} ($) *
                  </label>
                  <input
                    className="input"
                    style={{ fontSize: '12px', height: '34px', padding: '0 8px', borderRadius: '4px', fontWeight: 700, width: '100%' }}
                    type="number"
                    placeholder="e.g. 2320"
                    value={h40}
                    onChange={(e) => setH40(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Free Time & Validity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '65px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 2px', borderRadius: '4px', textAlign: 'center' }}>
                    FREE TIME
                  </label>
                  <input
                    className="input"
                    style={{ fontSize: '12px', height: '34px', padding: '0 8px', borderRadius: '4px', width: '100%' }}
                    placeholder="e.g. 14 days"
                    value={freeTime}
                    onChange={(e) => setFreeTime(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '65px 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 2px', borderRadius: '4px', textAlign: 'center' }}>
                    VALIDITY *
                  </label>
                  <input
                    className="input"
                    style={{ fontSize: '12px', height: '34px', padding: '0 6px', borderRadius: '4px', width: '100%' }}
                    type="date"
                    value={validDate}
                    onChange={(e) => setValidDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Rate Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '82px 1fr', gap: '6px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '6px 4px', borderRadius: '4px', textAlign: 'center' }}>
                  RATE TYPE
                </label>
                <SearchableDropdown
                  options={RATE_TYPE_OPTIONS}
                  value={rateType}
                  onChange={setRateType}
                  searchPlaceholder="Search rate type…"
                  style={{ fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* Remarks - Full Width */}
          <div
            style={{
              backgroundColor: 'var(--surface-elevated, #F8FAFC)',
              border: '1px solid var(--border-subtle, #E5E7EB)',
              borderRadius: '6px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary, #1F2937)' }}>
              <FileText size={13} color="var(--accent-primary, #006B68)" /> REMARKS &amp; SURCHARGES
            </div>
            <textarea
              className="input"
              rows={2}
              style={{
                fontSize: '12px',
                padding: '8px 10px',
                borderRadius: '4px',
                width: '100%',
                resize: 'vertical',
                minHeight: '52px',
              }}
              placeholder="Surcharges, inclusions, conditions, specific commodity exclusions, equipment guarantees…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Action Bar (Fixed at bottom) */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: 'var(--surface-elevated, #F8FAFC)',
            borderTop: '1px solid var(--border-subtle, #E5E7EB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={() => handleClearForm(true)}
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                fontWeight: 600,
                borderRadius: '6px',
                background: 'var(--surface-primary, #FFFFFF)',
                color: 'var(--text-secondary, #64748B)',
                border: '1px solid var(--border-interactive, #D1D5DB)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} /> CLEAR
            </button>

            {editingRateId && (
              <button
                type="button"
                className="btn secondary"
                onClick={handleDuplicate}
                disabled={isSubmitting}
                style={{
                  fontSize: '12px',
                  padding: '7px 14px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: 'var(--surface-primary, #FFFFFF)',
                  color: 'var(--text-primary, #1F2937)',
                  border: '1px solid var(--border-interactive, #D1D5DB)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                }}
              >
                <Copy size={13} /> DUPLICATE AS NEW
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingRateId ? (
              <>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  style={{
                    fontSize: '12px',
                    padding: '7px 16px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    background: 'var(--surface-primary, #FFFFFF)',
                    color: 'var(--text-primary, #1F2937)',
                    border: '1px solid var(--border-interactive, #D1D5DB)',
                    cursor: 'pointer',
                  }}
                >
                  SAVE AS NEW
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  style={{
                    fontSize: '12px',
                    padding: '7px 20px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    background: 'var(--glass-primary, var(--accent-primary, #006B68))',
                    color: '#FFFFFF',
                    border: '1px solid var(--accent-primary, #006B68)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Save size={13} /> UPDATE ({editingRateId})
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn primary"
                onClick={handleSave}
                disabled={isSubmitting}
                style={{
                  fontSize: '12px',
                  padding: '8px 24px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  background: 'var(--glass-primary, var(--accent-primary, #006B68))',
                  color: '#FFFFFF',
                  border: '1px solid var(--accent-primary, #006B68)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Save size={13} /> SAVE RATE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
