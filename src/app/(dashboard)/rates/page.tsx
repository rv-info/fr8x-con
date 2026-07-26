// FR8X-CON Rate Center Page — Spec Page 10
// Header, Top Nav Tabs, Left Sidebar Rate Entry/Filter Form, Main Table with Actions, Pagination

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Download, Upload, Loader2, CheckCircle2, AlertCircle, Save, RefreshCw, XCircle, Copy } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { COLLECTIONS } from "@/lib/utils/constants";
import {
  queryDocuments,
  setDocument,
  updateDocument,
  deleteDocument,
  getDocRef,
  orderBy,
  limit,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import LocationSearchInput from "@/components/ui/LocationSearchInput";
import { sanitizeText } from "@/lib/utils/security";

type RateTab = "active" | "expired" | "all";

type RateData = {
  id: string;
  seq: string;
  carrier: string;
  por: string;
  pol: string;
  pod: string;
  fpod: string;
  rate20dv: number;
  type20dv: string;
  rate40hc: number;
  type40hc: string;
  ft: string;
  validityDate: string;
  rateType: string;
  tt: string;
  routing: string;
  remarks: string;
  status: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  createdBy: string;
  serviceProvider?: string;
  isEdited?: boolean;
};

export default function RateCenterPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<RateTab>("active");
  const [rates, setRates] = useState<RateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Hidden file input for bulk upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state (left sidebar)
  const [carrier, setCarrier] = useState("");
  const [por, setPor] = useState("");
  const [pol, setPol] = useState("");
  const [pod, setPod] = useState("");
  const [fpod, setFpod] = useState("");
  const [type20dv, setType20dv] = useState("STANDARD");
  const [rate20dv, setRate20dv] = useState("");
  const [type40hc, setType40hc] = useState("STANDARD");
  const [rate40hc, setRate40hc] = useState("");
  const [ft, setFt] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [tt, setTt] = useState("");
  const [routing, setRouting] = useState("");
  const [rateType, setRateType] = useState("HANDOVER");
  const [remarks, setRemarks] = useState("");

  // Per-column filter state for table search boxes
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    seq: "",
    serviceProvider: "",
    carrier: "",
    por: "",
    pol: "",
    pod: "",
    fpod: "",
    rate20dv: "",
    type20dv: "",
    rate40hc: "",
    type40hc: "",
    ft: "",
    validityDate: "",
    rateType: "",
    tt: "",
    routing: "",
    remarks: "",
  });

  // Fetch rates from Firestore
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await queryDocuments<any>(COLLECTIONS.RATES, [
        orderBy("createdAt", "desc"),
        limit(100),
      ]);
      const mappedRates = data.map((r: any) => ({
        id: r.id,
        seq: r.seq || r.srq || "",
        carrier: r.carrier || "",
        por: r.por || "",
        pol: r.pol || "",
        pod: r.pod || "",
        fpod: r.fpod || "",
        rate20dv: r.rate20dv !== undefined ? Number(r.rate20dv) : (r.contSize === "20'" ? Number(r.rate) : 0),
        type20dv: r.type20dv || (r.contSize === "20'" ? r.contType : "STANDARD"),
        rate40hc: r.rate40hc !== undefined ? Number(r.rate40hc) : (r.contSize === "40'" ? Number(r.rate) : 0),
        type40hc: r.type40hc || (r.contSize === "40'" ? r.contType : "STANDARD"),
        ft: r.ft || "",
        validityDate: r.validityDate || "",
        rateType: r.rateType || "HANDOVER",
        tt: r.tt || "",
        routing: r.routing || "",
        remarks: r.remarks || "",
        status: r.status || "active",
        createdAt: r.createdAt || null,
        createdBy: r.createdBy || "",
        serviceProvider: r.createdByEmail || r.serviceProvider || "Unknown Provider",
        isEdited: r.isEdited || false,
      }));
      setRates(mappedRates);
    } catch (err) {
      console.error("Error fetching rates:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Column search box handler
  const handleColumnFilterChange = (colKey: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [colKey]: value }));
    setCurrentPage(1);
  };

  // Filtered rates based on activeTab and per-column search boxes
  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      // Tab filter
      if (activeTab === "active" && r.status !== "active") return false;
      if (activeTab === "expired" && r.status !== "expired") return false;

      // Per-column search box filters
      if (columnFilters.seq && !(r.seq || "").toLowerCase().includes(columnFilters.seq.toLowerCase())) return false;
      if (columnFilters.serviceProvider && !(r.serviceProvider || "").toLowerCase().includes(columnFilters.serviceProvider.toLowerCase())) return false;
      if (columnFilters.carrier && !(r.carrier || "").toLowerCase().includes(columnFilters.carrier.toLowerCase())) return false;
      if (columnFilters.por && !(r.por || "").toLowerCase().includes(columnFilters.por.toLowerCase())) return false;
      if (columnFilters.pol && !(r.pol || "").toLowerCase().includes(columnFilters.pol.toLowerCase())) return false;
      if (columnFilters.pod && !(r.pod || "").toLowerCase().includes(columnFilters.pod.toLowerCase())) return false;
      if (columnFilters.fpod && !(r.fpod || "").toLowerCase().includes(columnFilters.fpod.toLowerCase())) return false;
      if (columnFilters.rate20dv && !String(r.rate20dv || "").toLowerCase().includes(columnFilters.rate20dv.toLowerCase())) return false;
      if (columnFilters.type20dv && !(r.type20dv || "").toLowerCase().includes(columnFilters.type20dv.toLowerCase())) return false;
      if (columnFilters.rate40hc && !String(r.rate40hc || "").toLowerCase().includes(columnFilters.rate40hc.toLowerCase())) return false;
      if (columnFilters.type40hc && !(r.type40hc || "").toLowerCase().includes(columnFilters.type40hc.toLowerCase())) return false;
      if (columnFilters.ft && !(r.ft || "").toLowerCase().includes(columnFilters.ft.toLowerCase())) return false;
      if (columnFilters.validityDate && !(r.validityDate || "").toLowerCase().includes(columnFilters.validityDate.toLowerCase())) return false;
      if (columnFilters.rateType && !(r.rateType || "").toLowerCase().includes(columnFilters.rateType.toLowerCase())) return false;
      if (columnFilters.tt && !(r.tt || "").toLowerCase().includes(columnFilters.tt.toLowerCase())) return false;
      if (columnFilters.routing && !(r.routing || "").toLowerCase().includes(columnFilters.routing.toLowerCase())) return false;
      if (columnFilters.remarks && !(r.remarks || "").toLowerCase().includes(columnFilters.remarks.toLowerCase())) return false;

      return true;
    });
  }, [rates, activeTab, columnFilters]);

  // Paginated rates
  const totalPages = Math.max(1, Math.ceil(filteredRates.length / ITEMS_PER_PAGE));
  const paginatedRates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRates, currentPage]);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleClear = useCallback(() => {
    setEditingRateId(null);
    setCarrier("");
    setPor("");
    setPol("");
    setPod("");
    setFpod("");
    setType20dv("STANDARD");
    setRate20dv("");
    setType40hc("STANDARD");
    setRate40hc("");
    setFt("");
    setValidityDate("");
    setTt("");
    setRouting("");
    setRateType("HANDOVER");
    setRemarks("");
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !pol || !pod) {
      showNotification("Please fill in required fields (POL & POD).");
      return;
    }
    try {
      const docRef = getDocRef(COLLECTIONS.RATES);
      await setDocument(COLLECTIONS.RATES, docRef.id, {
        seq: `SEQ-${Date.now().toString().slice(-6)}`,
        carrier: sanitizeText(carrier),
        por: sanitizeText(por),
        pol: sanitizeText(pol),
        pod: sanitizeText(pod),
        fpod: sanitizeText(fpod),
        rate20dv: parseFloat(rate20dv) || 0,
        type20dv,
        rate40hc: parseFloat(rate40hc) || 0,
        type40hc,
        ft: sanitizeText(ft),
        validityDate,
        rateType,
        tt: sanitizeText(tt),
        routing: sanitizeText(routing),
        remarks: sanitizeText(remarks),
        status: "active",
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByEmail: user.email || "Unknown Provider",
        isEdited: false,
      });
      handleClear();
      fetchRates();
      showNotification("Rate saved successfully!");
    } catch (err) {
      console.error("Error saving rate:", err);
      showNotification("Failed to save rate.");
    }
  }, [user, carrier, por, pol, pod, fpod, rate20dv, type20dv, rate40hc, type40hc, ft, validityDate, rateType, tt, routing, remarks, handleClear, fetchRates]);

  const handleUpdate = useCallback(async () => {
    if (!editingRateId) {
      showNotification("Please select a rate to update from the table.");
      return;
    }
    const targetRate = rates.find((r) => r.id === editingRateId);
    if (targetRate && targetRate.createdBy !== user?.uid) {
      showNotification("You can only edit rates that you posted.");
      return;
    }
    try {
      await updateDocument(COLLECTIONS.RATES, editingRateId, {
        carrier: sanitizeText(carrier),
        por: sanitizeText(por),
        pol: sanitizeText(pol),
        pod: sanitizeText(pod),
        fpod: sanitizeText(fpod),
        rate20dv: parseFloat(rate20dv) || 0,
        type20dv,
        rate40hc: parseFloat(rate40hc) || 0,
        type40hc,
        ft: sanitizeText(ft),
        validityDate,
        rateType,
        tt: sanitizeText(tt),
        routing: sanitizeText(routing),
        remarks: sanitizeText(remarks),
        isEdited: true,
      });
      handleClear();
      fetchRates();
      showNotification("Rate updated successfully!");
    } catch (err) {
      console.error("Error updating rate:", err);
      showNotification("Failed to update rate.");
    }
  }, [editingRateId, rates, user, carrier, por, pol, pod, fpod, rate20dv, type20dv, rate40hc, type40hc, ft, validityDate, rateType, tt, routing, remarks, handleClear, fetchRates]);

  const handleEditClick = useCallback((r: RateData) => {
    if (r.createdBy !== user?.uid) {
      showNotification("You can only edit rates that you posted.");
      return;
    }
    setEditingRateId(r.id);
    setCarrier(r.carrier || "");
    setPor(r.por || "");
    setPol(r.pol || "");
    setPod(r.pod || "");
    setFpod(r.fpod || "");
    setType20dv(r.type20dv || "STANDARD");
    setRate20dv(r.rate20dv ? String(r.rate20dv) : "");
    setType40hc(r.type40hc || "STANDARD");
    setRate40hc(r.rate40hc ? String(r.rate40hc) : "");
    setFt(r.ft || "");
    setValidityDate(r.validityDate || "");
    setTt(r.tt || "");
    setRouting(r.routing || "");
    setRateType(r.rateType || "HANDOVER");
    setRemarks(r.remarks || "");
    showNotification(`Loaded rate ${r.seq} for editing.`);
  }, [user]);

  const handleWhatsAppCopy = (r: RateData) => {
    let formattedDate = r.validityDate;
    try {
      if (r.validityDate) {
        const d = new Date(r.validityDate);
        if (!isNaN(d.getTime())) {
          const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
          const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          formattedDate = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        }
      }
    } catch (e) {
      console.warn("Date formatting failed:", e);
    }

    const cleanPol = r.pol.includes("-") ? r.pol.split("-")[1]?.trim() || r.pol : r.pol;
    const cleanPod = r.pod.includes("-") ? r.pod.split("-")[1]?.trim() || r.pod : r.pod;

    const message = `SEQ : ${r.seq}
SERVICE PROVIDER : ${r.serviceProvider || ""}
CARRIER: ${r.carrier}
POL: ${r.pol}
POD: ${r.pod}
O/F FM ${cleanPol} TO ${cleanPod} @ USD ${r.rate20dv}/20DV & USD ${r.rate40hc}/40HC
F/T: ${r.ft}
VALIDITY: ${formattedDate} (SAILING)
TT: ${r.tt}
ROUTING: ${r.routing}
REMARKS: ${r.remarks}`;

    navigator.clipboard.writeText(message)
      .then(() => {
        showNotification("WhatsApp-friendly rate details copied to clipboard!");
      })
      .catch((err) => {
        console.error("Clipboard copy failed:", err);
        showNotification("Failed to copy to clipboard.");
      });
  };

  const handleDuplicateRow = (r: RateData) => {
    if (r.createdBy !== user?.uid) {
      showNotification("You can only duplicate rates that you posted.");
      return;
    }
    setEditingRateId(null);
    setCarrier(r.carrier || "");
    setPor(r.por || "");
    setPol(r.pol || "");
    setPod(r.pod || "");
    setFpod(r.fpod || "");
    setType20dv(r.type20dv || "STANDARD");
    setRate20dv(r.rate20dv ? String(r.rate20dv) : "");
    setType40hc(r.type40hc || "STANDARD");
    setRate40hc(r.rate40hc ? String(r.rate40hc) : "");
    setFt(r.ft || "");
    setValidityDate(r.validityDate || "");
    setTt(r.tt || "");
    setRouting(r.routing || "");
    setRateType(r.rateType || "HANDOVER");
    setRemarks(r.remarks ? `${r.remarks} (Copy)` : "Copy");
    showNotification(`Copied rate ${r.seq} into entry form.`);
  };

  const handleMarkExpired = async (id: string) => {
    try {
      await updateDocument(COLLECTIONS.RATES, id, { status: "expired" });
      fetchRates();
      showNotification("Rate marked as expired.");
    } catch (err) {
      console.error("Error marking rate expired:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rate?")) return;
    try {
      await deleteDocument(COLLECTIONS.RATES, id);
      fetchRates();
      showNotification("Rate deleted.");
    } catch (err) {
      console.error("Error deleting rate:", err);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Carrier,POR,POL,POD,FPOD,20DV,20TYPE,40HC,40TYPE,F/T,Date,Type,TT,Routing,Remarks\nMaersk,INBOM,INBOM,AEDXB,AEDXB,1200,STANDARD,1500,STANDARD,14 days,2026-08-31,HANDOVER,12,Direct,Sample rate upload\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "rate_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Downloaded sample CSV template.");
  };

  const handleBulkUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showNotification(`File "${file.name}" uploaded successfully. Processing rates...`);
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)] py-6 w-full">
      {/* Hidden Bulk File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".csv,.xlsx"
        className="hidden"
      />

      <div className="w-full max-w-full px-4 lg:px-8 space-y-5">
        {/* Header & Status Banner */}
        <div className="flex items-center justify-between">
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">RATE CENTER</h1>
          {statusMessage && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-md text-caption">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {statusMessage}
            </div>
          )}
        </div>

        {/* Top Navigation / Tabs & Bulk Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab("active"); setCurrentPage(1); }}
              className={activeTab === "active" ? "fr8x-tab-active font-semibold" : "fr8x-tab-inactive"}
            >
              ACTIVE RATES
            </button>
            <button
              onClick={() => { setActiveTab("expired"); setCurrentPage(1); }}
              className={activeTab === "expired" ? "fr8x-tab-active font-semibold" : "fr8x-tab-inactive"}
            >
              EXPIRED RATES
            </button>
            <button
              onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
              className={activeTab === "all" ? "fr8x-tab-active font-semibold" : "fr8x-tab-inactive"}
            >
              ALL RATES
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkUploadClick}
              className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] flex items-center gap-1.5 text-caption"
            >
              <Upload className="h-3.5 w-3.5" />
              BULK UPLOAD
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="fr8x-btn-secondary flex items-center gap-1.5 text-caption"
            >
              <Download className="h-3.5 w-3.5" />
              DOWNLOAD FOR BULK UPLOAD
            </button>
          </div>
        </div>

        {/* Layout: Left Sidebar (Form) + Right Content (Table) */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* ═══ LEFT SIDEBAR: Rate Editor Form ═══ */}
          <aside className="w-full lg:w-[320px] shrink-0 fr8x-card p-4 space-y-3 bg-white">
            <div className="flex flex-col border-b border-border pb-2">
              <h2 className="text-body font-bold text-[var(--fr8x-jet)]">
                RATE EDITOR
              </h2>
              <span className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase">
                CREATE OR UPDATE RATE
              </span>
            </div>

            {/* CARRIER */}
            <div>
              <label className="fr8x-label block mb-1">CARRIER</label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="fr8x-input text-caption"
                placeholder="Carrier"
              />
            </div>

            {/* POR | POL */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <LocationSearchInput
                  value={por}
                  onChange={(val) => setPor(val)}
                  label="POR"
                  placeholder="POR"
                  mode="fcl"
                />
              </div>
              <div>
                <LocationSearchInput
                  value={pol}
                  onChange={(val) => setPol(val)}
                  label="POL"
                  placeholder="POL"
                  mode="fcl"
                />
              </div>
            </div>

            {/* POD | FPOD */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <LocationSearchInput
                  value={pod}
                  onChange={(val) => setPod(val)}
                  label="POD"
                  placeholder="POD"
                  mode="fcl"
                />
              </div>
              <div>
                <LocationSearchInput
                  value={fpod}
                  onChange={(val) => setFpod(val)}
                  label="FPOD"
                  placeholder="FPOD"
                  isPlaceOfReceiptOrDelivery={true}
                  mode="fcl"
                />
              </div>
            </div>

            {/* 20DV TYPE */}
            <div>
              <label className="fr8x-label block mb-1">20DV TYPE</label>
              <select value={type20dv} onChange={(e) => setType20dv(e.target.value)} className="fr8x-input text-caption">
                <option value="STANDARD">STANDARD</option>
                <option value="DV">DV</option>
                <option value="RF">RF</option>
                <option value="FR">FR</option>
                <option value="OT">OT</option>
              </select>
            </div>

            {/* USD 20DV */}
            <div>
              <label className="fr8x-label block mb-1">USD 20DV</label>
              <input
                type="text"
                value={rate20dv}
                onChange={(e) => setRate20dv(e.target.value)}
                className="fr8x-input text-caption"
                placeholder="USD 20DV"
              />
            </div>

            {/* 40HC TYPE */}
            <div>
              <label className="fr8x-label block mb-1">40HC TYPE</label>
              <select value={type40hc} onChange={(e) => setType40hc(e.target.value)} className="fr8x-input text-caption">
                <option value="STANDARD">STANDARD</option>
                <option value="ST">ST</option>
                <option value="HC">HC</option>
                <option value="RF">RF</option>
                <option value="FR">FR</option>
                <option value="OT">OT</option>
              </select>
            </div>

            {/* USD 40HC */}
            <div>
              <label className="fr8x-label block mb-1">USD 40HC</label>
              <input
                type="text"
                value={rate40hc}
                onChange={(e) => setRate40hc(e.target.value)}
                className="fr8x-input text-caption"
                placeholder="USD 40HC"
              />
            </div>

            {/* F/T | VALIDITY */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fr8x-label block mb-1">F/T</label>
                <input
                  type="text"
                  value={ft}
                  onChange={(e) => setFt(e.target.value)}
                  className="fr8x-input text-caption"
                  placeholder="F/T"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">VALIDITY</label>
                <input
                  type="date"
                  value={validityDate}
                  onChange={(e) => setValidityDate(e.target.value)}
                  className="fr8x-input text-caption"
                />
              </div>
            </div>

            {/* TT | ROUTING */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fr8x-label block mb-1">TT</label>
                <input
                  type="text"
                  value={tt}
                  onChange={(e) => setTt(e.target.value)}
                  className="fr8x-input text-caption"
                  placeholder="TT"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">ROUTING</label>
                <input
                  type="text"
                  value={routing}
                  onChange={(e) => setRouting(e.target.value)}
                  className="fr8x-input text-caption"
                  placeholder="Routing"
                />
              </div>
            </div>

            {/* TYPE */}
            <div>
              <label className="fr8x-label block mb-1">TYPE</label>
              <select value={rateType} onChange={(e) => setRateType(e.target.value)} className="fr8x-input text-caption">
                <option value="HANDOVER">HANDOVER</option>
                <option value="SAVING">SAVING</option>
                <option value="HARDPORT">HARDPORT</option>
              </select>
            </div>

            {/* REMARKS */}
            <div>
              <label className="fr8x-label block mb-1">REMARKS</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="fr8x-input text-caption min-h-[40px] resize-none"
                placeholder="Remarks"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleSave}
                  className="bg-[#1E293B] hover:bg-[#334155] text-white flex items-center justify-center gap-1 py-1 px-2 rounded text-caption font-bold"
                >
                  <Save className="h-3 w-3" /> SAVE
                </button>
                <button
                  onClick={handleUpdate}
                  className="bg-[#1E293B] hover:bg-[#334155] text-white flex items-center justify-center gap-1 py-1 px-2 rounded text-caption font-bold"
                >
                  <RefreshCw className="h-3 w-3" /> UPDATE
                </button>
                <button
                  onClick={handleClear}
                  className="bg-[#991B1B] hover:bg-[#B91C1C] text-white flex items-center justify-center gap-1 py-1 px-2 rounded text-caption font-bold"
                >
                  <XCircle className="h-3 w-3" /> CLEAR
                </button>
              </div>
              
              {/* Sidebar Duplicate is only allowed for own rates */}
              {(!editingRateId || (rates.find(r => r.id === editingRateId)?.createdBy === user?.uid)) && (
                <button
                  onClick={() => {
                    if (editingRateId) {
                      const r = rates.find(x => x.id === editingRateId);
                      if (r) handleDuplicateRow(r);
                    } else if (rates.length > 0) {
                      const firstOwnRate = rates.find(x => x.createdBy === user?.uid);
                      if (firstOwnRate) handleDuplicateRow(firstOwnRate);
                      else showNotification("No own rates available to duplicate.");
                    }
                  }}
                  className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 w-full flex items-center justify-center gap-1 py-1 rounded text-caption font-bold"
                >
                  <Copy className="h-3 w-3" /> DUPLICATE
                </button>
              )}
            </div>
          </aside>

          {/* ═══ MAIN CONTENT: Rates Table ═══ */}
          <main className="flex-1 min-w-0 space-y-4">
            <div className="fr8x-card bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
                <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)] uppercase tracking-wider">
                  {activeTab === "active" ? "ACTIVE RATES" : activeTab === "expired" ? "EXPIRED RATES" : "ALL RATES"}
                </h2>
                <span className="text-[9px] text-gray-500 font-semibold uppercase">
                  CLICK ANY CELL TO REFLECT IT. HOVER TO VIEW FULL TEXT.
                </span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
                  <span className="text-[11px] text-foreground-muted">Loading rates...</span>
                </div>
              ) : filteredRates.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[11px] text-foreground-secondary">
                    {rates.length === 0 ? "No rates entered yet" : "No rates match the active filters"}
                  </p>
                  <p className="text-[10px] text-foreground-muted mt-1">
                    Use the rate editor form to add a rate or clear search box filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="fr8x-table fr8x-table-compact">
                    <thead>
                      <tr>
                        <th className="w-8"><input type="checkbox" /></th>
                        <th>SEQ</th>
                        <th>SERVICE PROVIDER</th>
                        <th>CARRIER</th>
                        <th>POR</th>
                        <th>POL</th>
                        <th>POD</th>
                        <th>FPOD</th>
                        <th>20DV</th>
                        <th>20TYPE</th>
                        <th>40HC</th>
                        <th>40TYPE</th>
                        <th>F/T</th>
                        <th>DATE</th>
                        <th>TYPE</th>
                        <th>TT</th>
                        <th>ROUTING</th>
                        <th>REMARKS</th>
                        <th className="w-48">ACTION</th>
                      </tr>
                      {/* Per-column search boxes row */}
                      <tr className="bg-gray-50 border-b border-border">
                        <td className="p-1"></td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.seq} onChange={(e) => handleColumnFilterChange("seq", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.serviceProvider} onChange={(e) => handleColumnFilterChange("serviceProvider", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-20" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.carrier} onChange={(e) => handleColumnFilterChange("carrier", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-16" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.por} onChange={(e) => handleColumnFilterChange("por", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.pol} onChange={(e) => handleColumnFilterChange("pol", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.pod} onChange={(e) => handleColumnFilterChange("pod", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.fpod} onChange={(e) => handleColumnFilterChange("fpod", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.rate20dv} onChange={(e) => handleColumnFilterChange("rate20dv", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.type20dv} onChange={(e) => handleColumnFilterChange("type20dv", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.rate40hc} onChange={(e) => handleColumnFilterChange("rate40hc", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.type40hc} onChange={(e) => handleColumnFilterChange("type40hc", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.ft} onChange={(e) => handleColumnFilterChange("ft", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.validityDate} onChange={(e) => handleColumnFilterChange("validityDate", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-16" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.rateType} onChange={(e) => handleColumnFilterChange("rateType", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.tt} onChange={(e) => handleColumnFilterChange("tt", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.routing} onChange={(e) => handleColumnFilterChange("routing", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.remarks} onChange={(e) => handleColumnFilterChange("remarks", e.target.value)} placeholder="Filter" className="fr8x-input text-[9px] py-0 px-1 h-5 w-16" />
                        </td>
                        <td className="p-1"></td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedRates.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => handleEditClick(r)}
                          className={`hover:bg-[var(--fr8x-mist)] cursor-pointer transition-colors ${
                            r.isEdited ? "text-blue-600 font-medium" : ""
                          } ${
                            editingRateId === r.id ? "bg-[var(--fr8x-mist)] font-medium border-l-2 border-l-[var(--fr8x-periwinkle)]" : ""
                          }`}
                        >
                          <td onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                          <td className="font-semibold">{r.seq}</td>
                          <td className="font-medium truncate max-w-[120px]">{r.serviceProvider}</td>
                          <td>{r.carrier}</td>
                          <td>{r.por}</td>
                          <td>{r.pol}</td>
                          <td>{r.pod}</td>
                          <td>{r.fpod}</td>
                          <td className="font-bold">${r.rate20dv}</td>
                          <td>{r.type20dv}</td>
                          <td className="font-bold">${r.rate40hc}</td>
                          <td>{r.type40hc}</td>
                          <td>{r.ft}</td>
                          <td>{r.validityDate}</td>
                          <td>{r.rateType}</td>
                          <td>{r.tt}</td>
                          <td>{r.routing}</td>
                          <td className="truncate max-w-[120px]">{r.remarks}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col gap-1 text-[10px]">
                              <div className="flex items-center gap-1.5">
                                {r.createdBy === user?.uid ? (
                                  <>
                                    <button onClick={() => handleWhatsAppCopy(r)} className="text-[var(--fr8x-periwinkle)] hover:underline font-semibold">COPY (WA)</button>
                                    <span className="text-foreground-muted">|</span>
                                    <button onClick={() => handleDuplicateRow(r)} className="text-[var(--fr8x-periwinkle)] hover:underline">DUPLICATE</button>
                                    <span className="text-foreground-muted">|</span>
                                    <button onClick={() => handleMarkExpired(r.id)} className="text-warning hover:underline">EXPIRE</button>
                                    <span className="text-foreground-muted">|</span>
                                    <button onClick={() => handleDelete(r.id)} className="text-danger hover:underline">DELETE</button>
                                  </>
                                ) : (
                                  <span className="text-gray-400 italic">View only</span>
                                )}
                              </div>
                              {r.isEdited && (
                                <div className="text-[9px] text-blue-600 font-bold uppercase mt-0.5 tracking-wider">
                                  EDITED
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 py-3 text-caption text-foreground-secondary">
              <span className="text-[11px] text-foreground-muted">
                Showing {filteredRates.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredRates.length)} of {filteredRates.length} rates
              </span>
              <div className="flex items-center gap-2 font-semibold">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="text-[10px] disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                >
                  &lt; Prev
                </button>
                <span className="text-[11px]">Page {currentPage} of {totalPages || 1}</span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="text-[10px] disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                >
                  Next &gt;
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
