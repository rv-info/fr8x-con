// FR8X-CON Rate Center Page — Spec Page 10
// Header, Top Nav Tabs, Left Sidebar Rate Entry/Filter Form, Main Table with Actions, Pagination

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Download, Upload, Loader2, CheckCircle2, AlertCircle, Save, RefreshCw, XCircle, Copy, CopyPlus, MessageSquare, Clock, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { RateDetailPanel } from "@/components/rates/RateDetailPanel";
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

type RateTab = "active" | "expired" | "all" | "self";

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
  const [selectedDetailRate, setSelectedDetailRate] = useState<RateData | null>(null);

  // Collapsible Rate Editor State
  const [isRateEditorOpen, setIsRateEditorOpen] = useState(true);

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

  // ─── Fetch Rates: Firestore Only, No Seed Data ───────────────────────────
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: any[] = [];
      try {
        data = await queryDocuments<any>(COLLECTIONS.RATES, [
          orderBy("createdAt", "desc"),
          limit(200),
        ]);
      } catch {
        // Index may not exist yet — fallback to unordered query
        data = await queryDocuments<any>(COLLECTIONS.RATES, [limit(200)]).catch(() => []);
      }

      const mappedRates: RateData[] = data.map((r: any) => ({
        id: r.id,
        seq: r.seq || r.srq || `SEQ-${String(r.id).slice(-6)}`,
        carrier: r.carrier || "N/A",
        por: r.por || r.pol || "",
        pol: r.pol || "",
        pod: r.pod || "",
        fpod: r.fpod || r.pod || "",
        rate20dv: r.rate20dv !== undefined ? Number(r.rate20dv) : (r.contSize === "20'" ? Number(r.rate) : 0),
        type20dv: r.type20dv || (r.contSize === "20'" ? r.contType : "STANDARD"),
        rate40hc: r.rate40hc !== undefined ? Number(r.rate40hc) : (r.contSize === "40'" ? Number(r.rate) : 0),
        type40hc: r.type40hc || (r.contSize === "40'" ? r.contType : "STANDARD"),
        ft: r.ft || "7 Days",
        validityDate: r.validityDate || "",
        rateType: r.rateType || "HANDOVER",
        tt: r.tt || "N/A",
        routing: r.routing || "Direct",
        remarks: r.remarks || "",
        status: r.status || "active",
        createdAt: r.createdAt || null,
        createdBy: r.createdBy || "",
        serviceProvider: r.serviceProvider || r.createdByEmail || "",
        isEdited: r.isEdited || false,
      }));

      setRates(mappedRates);
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
      if (activeTab === "self" && r.createdBy !== user?.uid) return false;

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
  }, [rates, activeTab, columnFilters, user?.uid]);


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
    const userUid = user?.uid;
    const userEmail = user?.email;

    if (!userUid) {
      showNotification("You must be logged in to submit rates.");
      return;
    }

    if (!pol && !pod && !carrier && !rate20dv && !rate40hc) {
      showNotification("Please enter rate details (POL, POD, Carrier, or Rate).");
      return;
    }

    const seqCode = `SEQ-${Date.now().toString().slice(-6)}`;
    const docRef = getDocRef(COLLECTIONS.RATES);
    const newRateId = docRef.id;

    const newRateObj: RateData = {
      id: newRateId,
      seq: seqCode,
      carrier: sanitizeText(carrier) || "Carrier N/A",
      por: sanitizeText(por) || sanitizeText(pol) || "",
      pol: sanitizeText(pol) || "",
      pod: sanitizeText(pod) || "",
      fpod: sanitizeText(fpod) || sanitizeText(pod) || "",
      rate20dv: parseFloat(rate20dv) || 0,
      type20dv,
      rate40hc: parseFloat(rate40hc) || 0,
      type40hc,
      ft: sanitizeText(ft) || "7 Days",
      validityDate: validityDate || "",
      rateType,
      tt: sanitizeText(tt) || "N/A",
      routing: sanitizeText(routing) || "Direct",
      remarks: sanitizeText(remarks) || "",
      status: "active",
      createdAt: null,
      createdBy: userUid,
      serviceProvider: userEmail || "",
      isEdited: false,
    };

    // Optimistic local update so UI is instant
    setRates((prev) => [newRateObj, ...prev]);

    try {
      await setDocument(COLLECTIONS.RATES, newRateId, {
        ...newRateObj,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdByName: user?.displayName || "",
        revisionNumber: 1,
      });
      showNotification(`Rate ${seqCode} saved to network.`);
    } catch (err) {
      console.error("Error saving rate to Firestore:", err);
      // Remove optimistic entry on failure
      setRates((prev) => prev.filter((r) => r.id !== newRateId));
      showNotification("Failed to save rate. Please try again.");
    } finally {
      handleClear();
    }
  }, [user, carrier, por, pol, pod, fpod, rate20dv, type20dv, rate40hc, type40hc, ft, validityDate, rateType, tt, routing, remarks, handleClear]);

  const handleUpdate = useCallback(async () => {
    if (!editingRateId) {
      showNotification("Please select a rate row from the table to update.");
      return;
    }

    const updatedRateData: Partial<RateData> = {
      carrier: sanitizeText(carrier) || "Carrier N/A",
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
    };

    // Instant local state update
    setRates((prev) =>
      prev.map((r) => (r.id === editingRateId ? { ...r, ...updatedRateData } : r))
    );

    try {
      await updateDocument(COLLECTIONS.RATES, editingRateId, updatedRateData);
      showNotification("Rate updated successfully!");
    } catch (err) {
      console.warn("Firestore update rate notice (updated locally):", err);
      showNotification("Rate updated locally!");
    } finally {
      handleClear();
    }
  }, [editingRateId, carrier, por, pol, pod, fpod, rate20dv, type20dv, rate40hc, type40hc, ft, validityDate, rateType, tt, routing, remarks, handleClear]);

  const handleEditClick = useCallback((r: RateData) => {
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
    showNotification(`Loaded rate ${r.seq} into Rate Editor.`);
  }, []);

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

  const handleMarkExpired = useCallback(async (id: string) => {
    // Optimistic update
    setRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "expired" } : r))
    );
    showNotification("Rate marked as expired.");
    try {
      await updateDocument(COLLECTIONS.RATES, id, {
        status: "expired",
        expiredAt: serverTimestamp(),
        expiredBy: user?.uid || "",
      });
    } catch (err) {
      console.error("Error marking rate expired:", err);
      // Rollback optimistic update
      setRates((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "active" } : r))
      );
      showNotification("Failed to update rate status.");
    }
  }, [user?.uid]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this rate? This cannot be undone.")) return;
    // Optimistic remove
    setRates((prev) => prev.filter((r) => r.id !== id));
    if (editingRateId === id) {
      handleClear();
    }
    showNotification("Rate deleted.");
    try {
      await deleteDocument(COLLECTIONS.RATES, id);
    } catch (err) {
      console.error("Error deleting rate from Firestore:", err);
      // Refetch to restore state
      fetchRates();
      showNotification("Failed to delete rate. Please try again.");
    }
  }, [editingRateId, handleClear, fetchRates]);

  // Bulk Upload Preview State
  const [showUploadPreview, setShowUploadPreview] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [invalidRows, setInvalidRows] = useState<any[]>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  const handleDownloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Carrier,POR,POL,POD,FPOD,Rate_20DV,Type_20DV,Rate_40HC,Type_40HC,Free_Time,Validity_Date,Rate_Type,Transit_Time,Routing,Service_Provider_ID,Remarks\n" +
      "Maersk Line,INBOM - Mumbai,INNSA - Nhava Sheva Port,AEDXB - Jebel Ali Port,AEDXB,1250,STANDARD,1650,STANDARD,14 Days,2026-09-30,HANDOVER,12 Days,Direct,provider@maersk.com,Verified benchmark ocean rate\n" +
      "MSC,INMAA - Chennai,INMAA - Chennai Port,SGSIN - Singapore Port,SGSIN,950,STANDARD,1350,STANDARD,10 Days,2026-09-15,DIRECT,7 Days,Direct,provider@msc.com,Promotional rate allocation\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FR8X_Standard_Rate_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Downloaded standard rate import template (CSV).");
  };

  const handleBulkUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        showNotification("Uploaded file is empty or missing data rows.");
        return;
      }

      const valid: any[] = [];
      const invalid: any[] = [];

      lines.slice(1).forEach((line, index) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const [
          rawCarrier,
          rawPor,
          rawPol,
          rawPod,
          rawFpod,
          rawRate20,
          rawType20,
          rawRate40,
          rawType40,
          rawFt,
          rawValidity,
          rawRateType,
          rawTt,
          rawRouting,
          rawProvider,
          rawRemarks,
        ] = cols;

        const rowNum = index + 2;
        const rate20 = parseFloat(rawRate20 || "0") || 0;
        const rate40 = parseFloat(rawRate40 || "0") || 0;

        const missingFields: string[] = [];
        if (!rawPol) missingFields.push("POL");
        if (!rawPod) missingFields.push("POD");
        if (rate20 <= 0 && rate40 <= 0) missingFields.push("Rate 20DV or 40HC");

        if (missingFields.length > 0) {
          invalid.push({
            rowNum,
            line,
            reason: `Missing required field(s): ${missingFields.join(", ")}`,
          });
        } else {
          // Auto-associate service provider with current user email or provided code
          const providerAssigned = rawProvider || user?.email || "Current Provider";

          valid.push({
            seq: `SEQ-BULK-${Date.now().toString().slice(-4)}-${index + 1}`,
            carrier: rawCarrier || "N/A",
            por: rawPor || rawPol,
            pol: rawPol,
            pod: rawPod,
            fpod: rawFpod || rawPod,
            rate20dv: rate20,
            type20dv: rawType20 || "STANDARD",
            rate40hc: rate40,
            type40hc: rawType40 || "STANDARD",
            ft: rawFt || "7 Days",
            validityDate: rawValidity || "2026-12-31",
            rateType: rawRateType || "HANDOVER",
            tt: rawTt || "N/A",
            routing: rawRouting || "Direct",
            remarks: rawRemarks || "Bulk Uploaded Rate",
            status: "active",
            createdBy: user?.uid || "system",
            createdByEmail: providerAssigned,
            serviceProvider: providerAssigned,
          });
        }
      });

      setParsedRows(valid);
      setInvalidRows(invalid);
      setShowUploadPreview(true);
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmBulkUpload = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessingUpload(true);

    try {
      for (const rateObj of parsedRows) {
        const docRef = getDocRef(COLLECTIONS.RATES);
        await setDocument(COLLECTIONS.RATES, docRef.id, {
          ...rateObj,
          createdAt: serverTimestamp(),
        });
      }
      setShowUploadPreview(false);
      fetchRates();
      showNotification(`Successfully uploaded ${parsedRows.length} rates associated with service provider!`);
    } catch (err) {
      console.error("Bulk rate commit failed:", err);
      showNotification("Error saving bulk rates.");
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleDownloadErrorLog = () => {
    if (invalidRows.length === 0) return;
    let csvErr = "Row_Number,Raw_Line,Error_Reason\n";
    invalidRows.forEach((r) => {
      csvErr += `"${r.rowNum}","${r.line.replace(/"/g, '""')}","${r.reason}"\n`;
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvErr);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Rate_Upload_Error_Log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#1E2329] py-6 w-full">
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
          <h1 className="text-display-sm text-[#E2E8F0]">RATE CENTER</h1>
          {statusMessage && (
            <div className="flex items-center gap-1.5 bg-[rgba(14,165,233,0.15)] border border-[rgba(14,165,233,0.3)] text-[#7DD3FC] px-3 py-1 rounded-[3px] text-caption">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {statusMessage}
            </div>
          )}
        </div>

        {/* Top Navigation / Tabs & Bulk Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#333B44] pb-3">
          <div className="flex gap-2 flex-wrap">
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
            <button
              onClick={() => { setActiveTab("self"); setCurrentPage(1); }}
              className={activeTab === "self" ? "fr8x-tab-active font-semibold" : "fr8x-tab-inactive"}
              title="Show only rates you have submitted"
            >
              SELF POSTED
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkUploadClick}
              className="fr8x-btn-primary flex items-center gap-1.5 text-caption"
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
          {/* ═══ LEFT SIDEBAR: Rate Editor Form (Collapsible Horizontally) ═══ */}
          {isRateEditorOpen ? (
            <aside className="w-full lg:w-[320px] shrink-0 fr8x-card p-4 space-y-3 bg-[#252B33] self-start transition-all duration-300 ease-in-out">
              <div className="flex items-center justify-between border-b border-[#333B44] pb-2">
                <div>
                  <h2 className="text-body text-[#E2E8F0]">
                    RATE EDITOR
                  </h2>
                  <span className="text-[10px] text-[#94A3B8] tracking-wide uppercase">
                    CREATE OR UPDATE RATE
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRateEditorOpen(false)}
                  className="p-1 rounded-[3px] text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#2A3038] transition-colors"
                  title="Collapse Rate Editor (Expand Table)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
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
                <div className="pt-2 border-t border-[#333B44] space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleSave}
                      className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white flex items-center justify-center gap-1 py-1 px-2 rounded-[3px] text-caption"
                    >
                      <Save className="h-3 w-3" /> SAVE
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="bg-[#2A3038] hover:bg-[#333B44] text-[#E2E8F0] flex items-center justify-center gap-1 py-1 px-2 rounded-[3px] text-caption border border-[#333B44]"
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
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (editingRateId) {
                          const r = rates.find(x => x.id === editingRateId);
                          if (r) handleDuplicateRow(r);
                        } else if (rates.length > 0 && rates[0]) {
                          handleDuplicateRow(rates[0]);
                        }
                      }}
                      className="bg-[#2A3038] hover:bg-[#333B44] border border-[#333B44] text-[#E2E8F0] w-full flex items-center justify-center gap-1 py-1 rounded-[3px] text-caption"
                    >
                      <Copy className="h-3 w-3" /> DUPLICATE
                    </button>

                    {editingRateId ? (
                      <button
                        onClick={() => handleMarkExpired(editingRateId)}
                        className="bg-[rgba(234,179,8,0.15)] hover:bg-[rgba(234,179,8,0.25)] text-[#FDE68A] border border-[rgba(234,179,8,0.3)] flex items-center justify-center gap-1 py-1 px-2 rounded-[3px] text-caption"
                      >
                        <Clock className="h-3 w-3" /> EXPIRE
                      </button>
                    ) : null}
                  </div>

                  {editingRateId && (
                    <button
                      onClick={() => handleDelete(editingRateId)}
                      className="bg-[rgba(239,68,68,0.8)] hover:bg-[rgba(239,68,68,1)] text-white w-full flex items-center justify-center gap-1 py-1 rounded-[3px] text-caption"
                    >
                      <Trash2 className="h-3 w-3" /> DELETE RATE
                    </button>
                  )}
                </div>
              </div>
            </aside>
          ) : (
            <aside
              onClick={() => setIsRateEditorOpen(true)}
              className="w-full lg:w-12 shrink-0 fr8x-card p-2 bg-[#252B33] self-start transition-all duration-300 ease-in-out cursor-pointer hover:bg-[#2A3038] border border-[#333B44] hover:border-[#4A5568] flex lg:flex-col items-center justify-between lg:justify-start gap-3 select-none py-3"
              title="Click to Expand Rate Editor"
            >
              <div className="flex items-center gap-2 lg:flex-col">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRateEditorOpen(true);
                  }}
                  className="p-1.5 rounded-[3px] text-[#E2E8F0] bg-[#2A3038] hover:bg-[#333B44] transition-colors"
                  title="Expand Rate Editor"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="text-caption text-[#94A3B8] lg:hidden">
                  EXPAND RATE EDITOR
                </span>
              </div>
              <div className="hidden lg:flex items-center justify-center pt-4">
                <span className="text-[11px] text-[#94A3B8] uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 whitespace-nowrap">
                  RATE EDITOR
                </span>
              </div>
            </aside>
          )}

          {/* ═══ MAIN CONTENT: Rates Table ═══ */}
          <main className="flex-1 min-w-0 space-y-4">
            <div className="fr8x-card bg-[#252B33] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#333B44] bg-[#20252B] flex items-center justify-between">
                <h2 className="text-body-sm text-[#E2E8F0] uppercase tracking-wider">
                  {activeTab === "active" ? "ACTIVE RATES" : activeTab === "expired" ? "EXPIRED RATES" : "ALL RATES"}
                </h2>
                <span className="text-[9px] text-[#94A3B8] uppercase">
                  CLICK ROW TO VIEW DETAILS · CLICK CELL TO EDIT
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
                      <tr className="bg-[#20252B] border-b border-[#333B44]">
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
                    <tbody className="divide-y divide-[#333B44]">
                      {paginatedRates.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedDetailRate(r)}
                          className={`hover:bg-[#20252B] cursor-pointer transition-colors ${
                            r.isEdited ? "text-[#7DD3FC]" : ""
                          } ${
                            editingRateId === r.id ? "bg-[#20252B] border-l-2 border-l-[#0EA5E9]" : ""
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
                            <div className="flex items-center gap-1">
                              {/* COPY (WA) — WhatsApp-style copy */}
                              <button
                                type="button"
                                onClick={() => handleWhatsAppCopy(r)}
                                className="group flex flex-col items-center p-1.5 rounded-[3px] bg-[rgba(34,197,94,0.15)] hover:bg-[rgba(34,197,94,0.25)] text-[#86EFAC] transition-colors"
                                title="Copy for WhatsApp (WA)"
                                aria-label="Copy rate for WhatsApp"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span className="text-[9px] font-bold leading-none mt-0.5">WA</span>
                              </button>

                              {/* DUPLICATE */}
                              <button
                                type="button"
                                onClick={() => handleDuplicateRow(r)}
                                className="group flex flex-col items-center p-1.5 rounded-[3px] bg-[rgba(14,165,233,0.15)] hover:bg-[rgba(14,165,233,0.25)] text-[#7DD3FC] transition-colors"
                                title="Duplicate Rate"
                                aria-label="Duplicate this rate"
                              >
                                <CopyPlus className="h-3.5 w-3.5" />
                                <span className="text-[9px] font-bold leading-none mt-0.5">DUP</span>
                              </button>

                              {/* EXPIRE */}
                              <button
                                type="button"
                                onClick={() => handleMarkExpired(r.id)}
                                className="group flex flex-col items-center p-1.5 rounded-[3px] bg-[rgba(234,179,8,0.15)] hover:bg-[rgba(234,179,8,0.25)] text-[#FDE68A] transition-colors"
                                title="Mark as Expired"
                                aria-label="Mark rate as expired"
                              >
                                <Clock className="h-3.5 w-3.5" />
                                <span className="text-[9px] font-bold leading-none mt-0.5">EXP</span>
                              </button>

                              {/* DELETE */}
                              <button
                                type="button"
                                onClick={() => handleDelete(r.id)}
                                className="group flex flex-col items-center p-1.5 rounded-[3px] bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.25)] text-[#FCA5A5] transition-colors"
                                title="Delete Rate"
                                aria-label="Delete this rate permanently"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="text-[9px] font-bold leading-none mt-0.5">DEL</span>
                              </button>
                            </div>
                            {r.isEdited && (
                              <div className="text-[9px] text-[#7DD3FC] uppercase mt-0.5 tracking-wider">
                                EDITED
                              </div>
                            )}
                            {r.status === "expired" && (
                              <div className="text-[9px] text-[#FDE68A] uppercase mt-0.5 tracking-wider">
                                EXPIRED
                              </div>
                            )}
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

      {/* BULK UPLOAD PREVIEW & VALIDATION MODAL */}
      {showUploadPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#252B33] rounded-[3px] p-6 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl space-y-4 text-left border border-[#333B44]">
            <div className="flex items-center justify-between border-b border-[#333B44] pb-3">
              <div>
                <h3 className="text-heading-md font-bold text-[var(--fr8x-jet)]">
                  Bulk Rate Upload Validation & Preview Screen
                </h3>
                <p className="text-caption text-foreground-secondary mt-0.5">
                  Verified rows will automatically associate with your service provider account.
                </p>
              </div>
              <button onClick={() => setShowUploadPreview(false)} className="text-[#94A3B8] hover:text-[#E2E8F0]">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Validation summary chips */}
            <div className="flex items-center gap-3 text-xs">
              <span className="bg-[rgba(34,197,94,0.15)] text-[#86EFAC] border border-[rgba(34,197,94,0.3)] px-3 py-1 rounded-[3px]">
                ✓ {parsedRows.length} Valid Rows Ready to Import
              </span>
              {invalidRows.length > 0 && (
                <span className="bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                  ⚠ {invalidRows.length} Validation Errors
                  <button onClick={handleDownloadErrorLog} className="underline text-[10px] ml-1">
                    (Download Error Log .CSV)
                  </button>
                </span>
              )}
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-y-auto border border-[#333B44] rounded-[3px]">
              <table className="fr8x-table text-[10px]">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Carrier</th>
                    <th>POL</th>
                    <th>POD</th>
                    <th>20DV Rate</th>
                    <th>40HC Rate</th>
                    <th>Validity</th>
                    <th>Service Provider (Auto-mapped)</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r, idx) => (
                    <tr key={idx} className="bg-emerald-50/40">
                      <td><span className="text-emerald-700 font-bold">Valid</span></td>
                      <td className="font-bold">{r.carrier}</td>
                      <td>{r.pol}</td>
                      <td>{r.pod}</td>
                      <td className="font-mono font-bold">${r.rate20dv}</td>
                      <td className="font-mono font-bold">${r.rate40hc}</td>
                      <td>{r.validityDate}</td>
                      <td className="font-mono font-bold text-blue-900">{r.serviceProvider}</td>
                    </tr>
                  ))}
                  {invalidRows.map((err, idx) => (
                    <tr key={`err_${idx}`} className="bg-rose-50/50 text-rose-900">
                      <td><span className="text-rose-700 font-bold">Error</span></td>
                      <td colSpan={6} className="text-rose-700 font-semibold">{err.reason} (Row {err.rowNum})</td>
                      <td><span className="text-slate-400">N/A</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#333B44]">
              <button
                onClick={() => setShowUploadPreview(false)}
                className="fr8x-btn-secondary text-xs px-4 py-2 font-bold"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmBulkUpload}
                disabled={isProcessingUpload || parsedRows.length === 0}
                className="fr8x-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-6 py-2 font-bold flex items-center gap-1.5 disabled:opacity-40"
              >
                {isProcessingUpload ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Confirm & Import {parsedRows.length} Valid Rates
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Rate Detail Slide Panel */}
      <RateDetailPanel
        rate={selectedDetailRate}
        onClose={() => setSelectedDetailRate(null)}
      />
    </div>
  );
}
