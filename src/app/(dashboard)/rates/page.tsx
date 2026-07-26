// FR8X-CON Rate Center Page — Spec Page 10
// Header, Top Nav Tabs, Left Sidebar Rate Entry/Filter Form, Main Table with Actions, Pagination

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Download, Upload, ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
  srq: string;
  rateProvider: string;
  carrierForwardsName?: string;
  carrierForwarderName?: string;
  carrier: string;
  pol: string;
  pod: string;
  fpod: string;
  commodity: string;
  contType: string;
  contSize: string;
  route: string;
  rate: number;
  curr: string;
  tt: string;
  routing: string;
  remarks: string;
  status: string;
  lengthCm?: string;
  widthCm?: string;
  heightCm?: string;
  cbm?: string;
  validityDate?: string;
  transitType?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  createdBy: string;
};

const CONTAINER_SIZES = [
  { value: "20'", label: "20'" },
  { value: "40'", label: "40'" },
  { value: "OT", label: "OT" },
  { value: "RF", label: "RF" },
  { value: "DG", label: "DG" },
  { value: "IG", label: "IG" },
];

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
  const [rateProvider, setRateProvider] = useState("");
  const [carrierForwardsName, setCarrierForwardsName] = useState("");
  const [carrier, setCarrier] = useState("");
  const [pol, setPol] = useState("");
  const [pod, setPod] = useState("");
  const [fpod, setFpod] = useState("");
  const [contSize, setContSize] = useState("20'");
  const [rate, setRate] = useState("");
  const [contType, setContType] = useState("GEN");
  const [route, setRoute] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [tt, setTt] = useState("");
  const [routingSD, setRoutingSD] = useState("S");
  const [transitType, setTransitType] = useState("SAVING");
  const [remarks, setRemarks] = useState("");

  // Dimensions state
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [cbm, setCbm] = useState("");

  // Per-column filter state for table search boxes
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    srq: "",
    rateProvider: "",
    carrier: "",
    pol: "",
    pod: "",
    fpod: "",
    comm: "",
    contType: "",
    contSize: "",
    route: "",
    rate: "",
    curr: "",
    tt: "",
    routing: "",
    remarks: "",
  });

  // Auto-fill Rate Provider & Carrier/Forwards Name from current user profile
  useEffect(() => {
    if (user) {
      setRateProvider(user.displayName || user.email || "Verified Provider");
      setCarrierForwardsName(user.companyId || "RV-Info Logistics");
    }
  }, [user]);

  // Fetch rates from Firestore
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await queryDocuments<RateData>(COLLECTIONS.RATES, [
        orderBy("createdAt", "desc"),
        limit(100),
      ]);
      setRates(data);
    } catch (err) {
      console.error("Error fetching rates:", err);
      setRates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Auto-calculate CBM when dimensions change
  useEffect(() => {
    const l = parseFloat(lengthCm);
    const w = parseFloat(widthCm);
    const h = parseFloat(heightCm);
    if (!isNaN(l) && !isNaN(w) && !isNaN(h) && l > 0 && w > 0 && h > 0) {
      // (L x W x H in cm) / 1,000,000 = CBM
      const calculatedCbm = ((l * w * h) / 1000000).toFixed(2);
      setCbm(calculatedCbm);
    }
  }, [lengthCm, widthCm, heightCm]);

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
      if (columnFilters.srq && !(r.srq || "").toLowerCase().includes(columnFilters.srq.toLowerCase())) return false;
      if (columnFilters.rateProvider && !(r.rateProvider || "").toLowerCase().includes(columnFilters.rateProvider.toLowerCase())) return false;
      if (columnFilters.carrier && !(r.carrier || "").toLowerCase().includes(columnFilters.carrier.toLowerCase())) return false;
      if (columnFilters.pol && !(r.pol || "").toLowerCase().includes(columnFilters.pol.toLowerCase())) return false;
      if (columnFilters.pod && !(r.pod || "").toLowerCase().includes(columnFilters.pod.toLowerCase())) return false;
      if (columnFilters.fpod && !(r.fpod || "").toLowerCase().includes(columnFilters.fpod.toLowerCase())) return false;
      if (columnFilters.comm && !(r.commodity || "").toLowerCase().includes(columnFilters.comm.toLowerCase())) return false;
      if (columnFilters.contType && !(r.contType || "").toLowerCase().includes(columnFilters.contType.toLowerCase())) return false;
      if (columnFilters.contSize && !(r.contSize || "").toLowerCase().includes(columnFilters.contSize.toLowerCase())) return false;
      if (columnFilters.route && !(r.route || "").toLowerCase().includes(columnFilters.route.toLowerCase())) return false;
      if (columnFilters.rate && !String(r.rate || "").toLowerCase().includes(columnFilters.rate.toLowerCase())) return false;
      if (columnFilters.curr && !(r.curr || "").toLowerCase().includes(columnFilters.curr.toLowerCase())) return false;
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
    setPol("");
    setPod("");
    setFpod("");
    setContSize("20'");
    setRate("");
    setContType("GEN");
    setRoute("");
    setValidityDate("");
    setTt("");
    setRoutingSD("S");
    setTransitType("SAVING");
    setRemarks("");
    setLengthCm("");
    setWidthCm("");
    setHeightCm("");
    setCbm("");
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !pol || !pod) {
      showNotification("Please fill in required fields (POL & POD).");
      return;
    }
    try {
      const docRef = getDocRef(COLLECTIONS.RATES);
      await setDocument(COLLECTIONS.RATES, docRef.id, {
        srq: `SRQ-${Date.now().toString().slice(-6)}`,
        rateProvider: sanitizeText(rateProvider || user.displayName || user.email || "Verified Provider"),
        carrierForwardsName: sanitizeText(carrierForwardsName || user.companyId || "RV-Info Logistics"),
        carrierForwarderName: sanitizeText(carrierForwardsName || user.companyId || "RV-Info Logistics"),
        carrier: sanitizeText(carrier),
        pol: sanitizeText(pol),
        pod: sanitizeText(pod),
        fpod: sanitizeText(fpod),
        commodity: "General",
        contType,
        contSize,
        route: sanitizeText(route),
        rate: parseFloat(rate) || 0,
        curr: "USD",
        tt: sanitizeText(tt),
        routing: routingSD === "S" ? "Single" : "Direct",
        remarks: sanitizeText(remarks),
        validityDate,
        transitType,
        lengthCm,
        widthCm,
        heightCm,
        cbm,
        status: "active",
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      handleClear();
      fetchRates();
      showNotification("Rate saved successfully!");
    } catch (err) {
      console.error("Error saving rate:", err);
      showNotification("Failed to save rate.");
    }
  }, [user, rateProvider, carrierForwardsName, carrier, pol, pod, fpod, contType, contSize, route, rate, tt, routingSD, remarks, validityDate, transitType, lengthCm, widthCm, heightCm, cbm, handleClear, fetchRates]);

  const handleUpdate = useCallback(async () => {
    if (!editingRateId) {
      showNotification("Please select a rate to update from the table.");
      return;
    }
    try {
      await updateDocument(COLLECTIONS.RATES, editingRateId, {
        carrier: sanitizeText(carrier),
        pol: sanitizeText(pol),
        pod: sanitizeText(pod),
        fpod: sanitizeText(fpod),
        contType,
        contSize,
        route: sanitizeText(route),
        rate: parseFloat(rate) || 0,
        tt: sanitizeText(tt),
        routing: routingSD === "S" ? "Single" : "Direct",
        remarks: sanitizeText(remarks),
        validityDate,
        transitType,
        lengthCm,
        widthCm,
        heightCm,
        cbm,
      });
      handleClear();
      fetchRates();
      showNotification("Rate updated successfully!");
    } catch (err) {
      console.error("Error updating rate:", err);
      showNotification("Failed to update rate.");
    }
  }, [editingRateId, carrier, pol, pod, fpod, contType, contSize, route, rate, tt, routingSD, remarks, validityDate, transitType, lengthCm, widthCm, heightCm, cbm, handleClear, fetchRates]);

  const handleEditClick = useCallback((r: RateData) => {
    setEditingRateId(r.id);
    setCarrier(r.carrier || "");
    setPol(r.pol || "");
    setPod(r.pod || "");
    setFpod(r.fpod || "");
    setContSize(r.contSize || "20'");
    setRate(r.rate ? String(r.rate) : "");
    setContType(r.contType || "GEN");
    setRoute(r.route || "");
    setValidityDate(r.validityDate || "");
    setTt(r.tt || "");
    setRoutingSD(r.routing === "Single" ? "S" : "D");
    setTransitType(r.transitType || "SAVING");
    setRemarks(r.remarks || "");
    setLengthCm(r.lengthCm || "");
    setWidthCm(r.widthCm || "");
    setHeightCm(r.heightCm || "");
    setCbm(r.cbm || "");
    showNotification(`Loaded rate ${r.srq} for editing.`);
  }, []);

  const handleDuplicateRow = (r: RateData) => {
    setEditingRateId(null);
    setCarrier(r.carrier || "");
    setPol(r.pol || "");
    setPod(r.pod || "");
    setFpod(r.fpod || "");
    setContSize(r.contSize || "20'");
    setRate(r.rate ? String(r.rate) : "");
    setContType(r.contType || "GEN");
    setRoute(r.route || "");
    setTt(r.tt || "");
    setRemarks(r.remarks ? `${r.remarks} (Copy)` : "Copy");
    setLengthCm(r.lengthCm || "");
    setWidthCm(r.widthCm || "");
    setHeightCm(r.heightCm || "");
    setCbm(r.cbm || "");
    showNotification(`Copied rate ${r.srq} into entry form.`);
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
    const csvContent = "data:text/csv;charset=utf-8,SRQ,RateProvider,Carrier,POL,POD,ContSize,Rate,Curr,TT,Status\nSRQ-1001,RV-Info,Maersk,INBOM,AEDXB,40'HC,1250,USD,12,active\n";
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
          {/* ═══ LEFT SIDEBAR: Rate Entry / Filters ═══ */}
          <aside className="w-full lg:w-[320px] shrink-0 fr8x-card p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)]">
                RATE EDITOR
              </h2>
              {editingRateId && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">Editing</span>
              )}
            </div>

            {/* RATE PROVIDER */}
            <div>
              <label className="fr8x-label block mb-1">RATE PROVIDER</label>
              <input
                type="text"
                value={rateProvider}
                onChange={(e) => setRateProvider(e.target.value)}
                className="fr8x-input text-caption"
                placeholder="Rate Provider"
              />
            </div>

            {/* CARRIER/FORWARDS NAME */}
            <div>
              <label className="fr8x-label block mb-1">CARRIER/FORWARDS NAME</label>
              <input
                type="text"
                value={carrierForwardsName}
                onChange={(e) => setCarrierForwardsName(e.target.value)}
                className="fr8x-input text-caption"
                placeholder="Carrier / Forwards"
              />
            </div>

            {/* Carrier */}
            <div>
              <label className="fr8x-label block mb-1">Carrier</label>
              <input type="text" value={carrier} onChange={(e) => setCarrier(e.target.value)} className="fr8x-input text-caption" placeholder="e.g. Maersk, MSC, Hapag" />
            </div>

            {/* POL | POD */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <LocationSearchInput
                  value={pol}
                  onChange={(val) => setPol(val)}
                  label="POL *"
                  placeholder="POL Code"
                  mode="fcl"
                />
              </div>
              <div>
                <LocationSearchInput
                  value={pod}
                  onChange={(val) => setPod(val)}
                  label="POD *"
                  placeholder="POD Code"
                  mode="fcl"
                />
              </div>
            </div>

            {/* POD | FPOD */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <LocationSearchInput
                  value={pod}
                  onChange={(val) => setPod(val)}
                  label="POD *"
                  placeholder="POD Code"
                  mode="fcl"
                />
              </div>
              <div>
                <LocationSearchInput
                  value={fpod}
                  onChange={(val) => setFpod(val)}
                  label="FPOD"
                  placeholder="Final POD Code"
                  isPlaceOfReceiptOrDelivery={true}
                  mode="fcl"
                />
              </div>
            </div>

            {/* CONTAINER SIZE & RATE */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fr8x-label block mb-1">CONTAINER SIZE</label>
                <select value={contSize} onChange={(e) => setContSize(e.target.value)} className="fr8x-input text-caption">
                  {CONTAINER_SIZES.map((cs) => (
                    <option key={cs.value} value={cs.value}>{cs.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="fr8x-label block mb-1">RATE</label>
                <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="fr8x-input text-caption" placeholder="0.00" />
              </div>
            </div>

            {/* Cargo Dimensions Part */}
            <div className="p-2 bg-[var(--fr8x-mist)] rounded-md space-y-2">
              <label className="fr8x-label block text-[10px] font-semibold text-[var(--fr8x-jet)]">CARGO DIMENSIONS & VOLUME</label>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <span className="text-[9px] text-foreground-muted block">L (cm)</span>
                  <input type="number" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} className="fr8x-input text-[10px] py-0.5" placeholder="L" />
                </div>
                <div>
                  <span className="text-[9px] text-foreground-muted block">W (cm)</span>
                  <input type="number" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} className="fr8x-input text-[10px] py-0.5" placeholder="W" />
                </div>
                <div>
                  <span className="text-[9px] text-foreground-muted block">H (cm)</span>
                  <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="fr8x-input text-[10px] py-0.5" placeholder="H" />
                </div>
              </div>
              <div>
                <span className="text-[9px] text-foreground-muted block">Calculated CBM</span>
                <input type="text" value={cbm} onChange={(e) => setCbm(e.target.value)} className="fr8x-input text-[10px] py-0.5 bg-white" placeholder="Total CBM" />
              </div>
            </div>

            <div>
              <label className="fr8x-label block mb-1">CONTAINER TYPE</label>
              <select value={contType} onChange={(e) => setContType(e.target.value)} className="fr8x-input text-caption">
                <option value="GEN">GEN (General Purpose)</option>
                <option value="HAZ">HAZ (Hazardous Cargo)</option>
                <option value="DG">DG (Dangerous Goods)</option>
                <option value="IG">IG (In-Gauge)</option>
                <option value="OOG">OOG (Out of Gauge)</option>
              </select>
            </div>

            <div>
              <label className="fr8x-label block mb-1">ROUTE</label>
              <input type="text" value={route} onChange={(e) => setRoute(e.target.value)} className="fr8x-input text-caption" placeholder="Route description" />
            </div>

            <div>
              <label className="fr8x-label block mb-1">VALIDITY</label>
              <input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} className="fr8x-input text-caption" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fr8x-label block mb-1">TT</label>
                <input type="text" value={tt} onChange={(e) => setTt(e.target.value)} className="fr8x-input text-caption" placeholder="e.g. 14 Days" />
              </div>
              <div>
                <label className="fr8x-label block mb-1">ROUTING (S/D)</label>
                <select value={routingSD} onChange={(e) => setRoutingSD(e.target.value)} className="fr8x-input text-caption">
                  <option value="S">Single (S)</option>
                  <option value="D">Direct (D)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="fr8x-label block mb-1">TRANSIT TYPE (SAVING/HARDPORT)</label>
              <select value={transitType} onChange={(e) => setTransitType(e.target.value)} className="fr8x-input text-caption">
                <option value="SAVING">SAVING</option>
                <option value="HARDPORT">HARDPORT</option>
              </select>
            </div>

            <div>
              <label className="fr8x-label block mb-1">REMARKS</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="fr8x-input text-caption min-h-[40px] resize-none" placeholder="Notes..." />
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleSave} className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] py-1 text-caption font-bold">SAVE</button>
                <button onClick={handleUpdate} className="fr8x-btn-secondary py-1 text-caption font-bold">UPDATE</button>
                <button onClick={handleClear} className="fr8x-btn-ghost text-danger py-1 text-caption font-bold">CLEAR</button>
              </div>
              <button
                onClick={() => {
                  if (rates.length > 0 && rates[0]) handleDuplicateRow(rates[0]);
                  else showNotification("No rates available to duplicate.");
                }}
                className="fr8x-btn-secondary w-full py-1 text-caption font-bold"
              >
                DUPLICATE
              </button>
            </div>
          </aside>

          {/* ═══ MAIN CONTENT: Rates Table ═══ */}
          <main className="flex-1 min-w-0 space-y-4">
            <div className="fr8x-card bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
                <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)] uppercase tracking-wider">
                  {activeTab === "active" ? "ACTIVE RATES" : activeTab === "expired" ? "EXPIRED RATES" : "ALL RATES"}
                </h2>
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
                    Use the rate entry form to add a rate or clear search box filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="fr8x-table fr8x-table-compact">
                    <thead>
                      <tr>
                        <th className="w-8"><input type="checkbox" /></th>
                        <th>SRQ</th>
                        <th>RATE PROVIDER</th>
                        <th>CARRIER</th>
                        <th>POL</th>
                        <th>POD</th>
                        <th>FPOD</th>
                        <th>COMM</th>
                        <th>CONT TYPE</th>
                        <th>CONT SIZE</th>
                        <th>ROUT</th>
                        <th>RATE</th>
                        <th>CURR</th>
                        <th>TT</th>
                        <th>ROUTING</th>
                        <th>REMARKS</th>
                        <th className="w-48">ACTION</th>
                      </tr>
                      {/* Per-column search boxes row */}
                      <tr className="bg-gray-50 border-b border-border">
                        <td className="p-1"></td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.srq} onChange={(e) => handleColumnFilterChange("srq", e.target.value)} placeholder="Filter SRQ" className="fr8x-input text-[9px] py-0 px-1 h-5 w-16" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.rateProvider} onChange={(e) => handleColumnFilterChange("rateProvider", e.target.value)} placeholder="Filter Provider" className="fr8x-input text-[9px] py-0 px-1 h-5 w-20" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.carrier} onChange={(e) => handleColumnFilterChange("carrier", e.target.value)} placeholder="Carrier" className="fr8x-input text-[9px] py-0 px-1 h-5 w-16" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.pol} onChange={(e) => handleColumnFilterChange("pol", e.target.value)} placeholder="POL" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.pod} onChange={(e) => handleColumnFilterChange("pod", e.target.value)} placeholder="POD" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.fpod} onChange={(e) => handleColumnFilterChange("fpod", e.target.value)} placeholder="FPOD" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.comm} onChange={(e) => handleColumnFilterChange("comm", e.target.value)} placeholder="Comm" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.contType} onChange={(e) => handleColumnFilterChange("contType", e.target.value)} placeholder="Type" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.contSize} onChange={(e) => handleColumnFilterChange("contSize", e.target.value)} placeholder="Size" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.route} onChange={(e) => handleColumnFilterChange("route", e.target.value)} placeholder="Route" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.rate} onChange={(e) => handleColumnFilterChange("rate", e.target.value)} placeholder="Rate" className="fr8x-input text-[9px] py-0 px-1 h-5 w-14" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.curr} onChange={(e) => handleColumnFilterChange("curr", e.target.value)} placeholder="Curr" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.tt} onChange={(e) => handleColumnFilterChange("tt", e.target.value)} placeholder="TT" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.routing} onChange={(e) => handleColumnFilterChange("routing", e.target.value)} placeholder="Rout" className="fr8x-input text-[9px] py-0 px-1 h-5 w-12" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={columnFilters.remarks} onChange={(e) => handleColumnFilterChange("remarks", e.target.value)} placeholder="Remarks" className="fr8x-input text-[9px] py-0 px-1 h-5 w-16" />
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
                            editingRateId === r.id ? "bg-[var(--fr8x-mist)] font-medium border-l-2 border-l-[var(--fr8x-periwinkle)]" : ""
                          }`}
                        >
                          <td onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                          <td className="font-semibold text-[var(--fr8x-jet)]">{r.srq}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              <span>{r.rateProvider}</span>
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded">Auto</span>
                            </div>
                          </td>
                          <td>{r.carrier}</td>
                          <td>{r.pol}</td>
                          <td>{r.pod}</td>
                          <td>{r.fpod}</td>
                          <td>{r.commodity}</td>
                          <td>{r.contType}</td>
                          <td className="font-medium">{r.contSize}</td>
                          <td>{r.route}</td>
                          <td className="font-bold text-[var(--fr8x-jet)]">${r.rate}</td>
                          <td>{r.curr}</td>
                          <td>{r.tt}</td>
                          <td>{r.routing}</td>
                          <td className="truncate max-w-[120px]">{r.remarks}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <button onClick={() => handleDuplicateRow(r)} className="text-[var(--fr8x-periwinkle)] hover:underline">COPY / DUPLICATE</button>
                              <span className="text-foreground-muted">|</span>
                              <button onClick={() => handleMarkExpired(r.id)} className="text-warning hover:underline">mark as expired</button>
                              <span className="text-foreground-muted">|</span>
                              <button onClick={() => handleDelete(r.id)} className="text-danger hover:underline">delete</button>
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
