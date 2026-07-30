// FR8X-CON GodMode Port & Location Master Control Panel
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Database,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  History,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Upload,
  Check,
  XCircle,
  GitMerge,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { COLLECTIONS, LOCATION_SEED_DATA } from "@/lib/utils/constants";
import { queryDocuments, setDocument } from "@/lib/firebase/firestore";
import { LocationDoc, LocationStatus, LocationType, TransportMode } from "@/lib/types/location";
import { syncExternalMasterData } from "@/lib/services/locationProviderService";

interface AuditDoc {
  id: string;
  locationId: string;
  fr8xLocationId?: string;
  action: string;
  status?: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

export default function GodModeLocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationDoc[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all" | "rejected" | "form" | "bulk" | "audit">("pending");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [fr8xLocationId, setFr8xLocationId] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [type, setType] = useState<LocationType>("sea");
  const [cityVal, setCityVal] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [unlocode, setUnlocode] = useState("");
  const [iataCode, setIataCode] = useState("");
  const [icaoCode, setIcaoCode] = useState("");
  const [statusVal, setStatusVal] = useState<LocationStatus>("approved");

  // Merge modal state
  const [mergingSourceLoc, setMergingSourceLoc] = useState<LocationDoc | null>(null);
  const [targetMergeId, setTargetMergeId] = useState("");

  // Bulk Upload State
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    totalRows: number;
    successCount: number;
    failureCount: number;
    errors: string[];
  } | null>(null);

  const downloadSampleTemplate = () => {
    const csvHeader = "code,name,country,countryCode,type,city,state,unlocode\n";
    const sampleRows =
      "INNSA,Nhava Sheva Port,India,IN,sea,Navi Mumbai,Maharashtra,INNSA\n" +
      "BOM,Chhatrapati Shivaji Airport,India,IN,air,Mumbai,Maharashtra,INBOM\n" +
      "AEJEA,Jebel Ali Port,UAE,AE,sea,Dubai,Dubai,AEJEA\n";
    const blob = new Blob([csvHeader + sampleRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_locations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUploadSubmit = async () => {
    if (!bulkCsvFile) return;
    setIsBulkUploading(true);
    setBulkResult(null);

    try {
      const csvText = await bulkCsvFile.text();
      const { getIdToken } = await import("@/lib/firebase/auth");
      const token = await getIdToken();

      const res = await fetch("/api/admin/locations/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ csvContent: csvText }),
      });

      const data = await res.json();
      if (res.ok) {
        setBulkResult(data);
        fetchLocationsAndAudit();
      } else {
        alert(`Bulk upload error: ${data.error}`);
      }
    } catch {
      alert("Failed to process bulk upload file.");
    } finally {
      setIsBulkUploading(false);
    }
  };

  const fetchLocationsAndAudit = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await queryDocuments<any>(COLLECTIONS.LOCATIONS);
      const auditDocs = await queryDocuments<AuditDoc>("location_audit");

      // Merge seed data with Firestore documents
      const locMap = new Map<string, LocationDoc>();
      for (const seed of LOCATION_SEED_DATA) {
        locMap.set(seed.code, seed as unknown as LocationDoc);
      }
      for (const doc of docs) {
        locMap.set(doc.id || doc.code, doc as LocationDoc);
      }

      setLocations(Array.from(locMap.values()));
      setAuditLogs(auditDocs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      console.error("Failed to load locations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocationsAndAudit();
  }, [fetchLocationsAndAudit]);

  const pendingCount = locations.filter((l) => l.status === "pending_verification").length;
  const approvedCount = locations.filter((l) => l.status === "approved").length;

  const handleApprove = async (loc: LocationDoc) => {
    try {
      const updated: LocationDoc = {
        ...loc,
        status: "approved",
        fr8xLocationId: loc.fr8xLocationId || `LOC-APP-${loc.code || Date.now()}`,
        updatedAt: new Date().toISOString(),
        verificationAudit: {
          verifiedBy: user?.email || "admin",
          verifiedAt: new Date().toISOString(),
          notes: "Approved by administrator",
        },
      };

      await setDocument(COLLECTIONS.LOCATIONS, loc.id || loc.code, updated);

      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDocument("location_audit", auditId, {
        id: auditId,
        locationId: loc.id || loc.code,
        fr8xLocationId: updated.fr8xLocationId,
        action: "approved_location",
        status: "approved",
        performedBy: user?.email || "admin",
        timestamp: new Date().toISOString(),
        details: `Location "${loc.name}" (${loc.city}) approved.`,
      });

      fetchLocationsAndAudit();
    } catch (err) {
      console.error("Error approving location:", err);
    }
  };

  const handleReject = async (loc: LocationDoc) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const updated: LocationDoc = {
        ...loc,
        status: "rejected",
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      };

      await setDocument(COLLECTIONS.LOCATIONS, loc.id || loc.code, updated);

      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDocument("location_audit", auditId, {
        id: auditId,
        locationId: loc.id || loc.code,
        fr8xLocationId: loc.fr8xLocationId,
        action: "rejected_location",
        status: "rejected",
        performedBy: user?.email || "admin",
        timestamp: new Date().toISOString(),
        details: `Rejected location "${loc.name}". Reason: ${reason}`,
      });

      fetchLocationsAndAudit();
    } catch (err) {
      console.error("Error rejecting location:", err);
    }
  };

  const handleMergeSubmit = async () => {
    if (!mergingSourceLoc || !targetMergeId) return;

    try {
      const updated: LocationDoc = {
        ...mergingSourceLoc,
        status: "merged",
        mergedIntoId: targetMergeId,
        updatedAt: new Date().toISOString(),
      };

      await setDocument(COLLECTIONS.LOCATIONS, mergingSourceLoc.id || mergingSourceLoc.code, updated);

      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDocument("location_audit", auditId, {
        id: auditId,
        locationId: mergingSourceLoc.id || mergingSourceLoc.code,
        fr8xLocationId: mergingSourceLoc.fr8xLocationId,
        action: "merged_location",
        status: "merged",
        performedBy: user?.email || "admin",
        timestamp: new Date().toISOString(),
        details: `Merged duplicate location "${mergingSourceLoc.name}" into primary ID: ${targetMergeId}`,
      });

      setMergingSourceLoc(null);
      setTargetMergeId("");
      fetchLocationsAndAudit();
    } catch (err) {
      console.error("Error merging location:", err);
    }
  };

  const handleSyncExternalData = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Synchronizing OurAirports and UN/LOCODE master records...");
    try {
      const res = await syncExternalMasterData("ourairports");
      setSyncStatusMsg(res.message);
      fetchLocationsAndAudit();
    } catch (err: any) {
      setSyncStatusMsg(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = editingId || `loc_${code.toLowerCase()}_${Date.now()}`;
      const newDoc: LocationDoc = {
        id: docId,
        code: code.toUpperCase(),
        fr8xLocationId: fr8xLocationId || `LOC-ADM-${code.toUpperCase()}`,
        name,
        country,
        countryCode: countryCode.toUpperCase(),
        city: cityVal,
        state: stateVal,
        type,
        transportModes: ["ocean", "air", "rail", "road", "multimodal"],
        status: statusVal,
        source: "manual",
        unlocode: unlocode ? unlocode.toUpperCase() : undefined,
        iataCode: iataCode ? iataCode.toUpperCase() : undefined,
        icaoCode: icaoCode ? icaoCode.toUpperCase() : undefined,
        updatedAt: new Date().toISOString(),
      };

      await setDocument(COLLECTIONS.LOCATIONS, docId, newDoc);

      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDocument("location_audit", auditId, {
        id: auditId,
        locationId: docId,
        fr8xLocationId: newDoc.fr8xLocationId,
        action: editingId ? "updated_location" : "created_location",
        status: statusVal,
        performedBy: user?.email || "admin",
        timestamp: new Date().toISOString(),
        details: `Location ${name} (${code}) ${editingId ? "updated" : "created"}.`,
      });

      setActiveTab("all");
      fetchLocationsAndAudit();
    } catch (err) {
      console.error("Error saving location form:", err);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesTab =
      activeTab === "pending"
        ? loc.status === "pending_verification"
        : activeTab === "approved"
        ? loc.status === "approved"
        : activeTab === "rejected"
        ? loc.status === "rejected" || loc.status === "merged"
        : true;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      loc.name.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.country.toLowerCase().includes(q) ||
      loc.code.toLowerCase().includes(q) ||
      (loc.fr8xLocationId && loc.fr8xLocationId.toLowerCase().includes(q));

    const matchesType = typeFilter === "all" || loc.type === typeFilter;

    return matchesTab && matchesSearch && matchesType;
  });

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto text-xs">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-3 rounded border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-[var(--fr8x-periwinkle)]" />
          <div>
            <h1 className="font-bold text-sm text-[var(--fr8x-jet)] uppercase">Location Master Data Management (MDM)</h1>
            <p className="text-[10px] text-gray-500">Centralized Location Governance, Approval Queue & Fallback Data Ingestion</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncExternalData}
            disabled={isSyncing}
            className="fr8x-btn-secondary flex items-center gap-1 text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} /> Sync External Masters
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setCode("");
              setName("");
              setActiveTab("form");
            }}
            className="fr8x-btn-primary flex items-center gap-1 text-[11px]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Master Location
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs flex items-center justify-between">
          <span>{syncStatusMsg}</span>
          <button onClick={() => setSyncStatusMsg(null)} className="text-blue-600 font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-2 rounded-t">
        <button
          onClick={() => setActiveTab("pending")}
          className={`py-2 px-3 border-b-2 font-medium flex items-center gap-1.5 ${
            activeTab === "pending" ? "border-[var(--fr8x-periwinkle)] text-[var(--fr8x-periwinkle)]" : "border-transparent text-gray-500"
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Pending Queue
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`py-2 px-3 border-b-2 font-medium flex items-center gap-1.5 ${
            activeTab === "approved" ? "border-[var(--fr8x-periwinkle)] text-[var(--fr8x-periwinkle)]" : "border-transparent text-gray-500"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved ({approvedCount})
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`py-2 px-3 border-b-2 font-medium ${
            activeTab === "all" ? "border-[var(--fr8x-periwinkle)] text-[var(--fr8x-periwinkle)]" : "border-transparent text-gray-500"
          }`}
        >
          All Locations ({locations.length})
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`py-2 px-3 border-b-2 font-medium ${
            activeTab === "rejected" ? "border-[var(--fr8x-periwinkle)] text-[var(--fr8x-periwinkle)]" : "border-transparent text-gray-500"
          }`}
        >
          Rejected / Merged
        </button>

        <button
          onClick={() => setActiveTab("bulk")}
          className={`py-2 px-3 border-b-2 font-medium flex items-center gap-1.5 ${
            activeTab === "bulk" ? "border-[var(--fr8x-periwinkle)] text-[var(--fr8x-periwinkle)]" : "border-transparent text-gray-500"
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Bulk CSV Import
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`py-2 px-3 border-b-2 font-medium flex items-center gap-1.5 ${
            activeTab === "audit" ? "border-[var(--fr8x-periwinkle)] text-[var(--fr8x-periwinkle)]" : "border-transparent text-gray-500"
          }`}
        >
          <History className="w-3.5 h-3.5" /> Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "form" ? (
        <form onSubmit={handleFormSubmit} className="bg-white p-4 rounded border border-gray-200 space-y-3">
          <h2 className="font-bold text-sm text-[var(--fr8x-jet)] border-b pb-2">
            {editingId ? "Edit Location Document" : "Create New Master Location"}
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Code *</label>
              <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="fr8x-input uppercase" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Canonical FR8X ID</label>
              <input type="text" value={fr8xLocationId} onChange={(e) => setFr8xLocationId(e.target.value)} placeholder="LOC-UN-INNSA-001" className="fr8x-input uppercase" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Location Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="fr8x-input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">City *</label>
              <input type="text" required value={cityVal} onChange={(e) => setCityVal(e.target.value)} className="fr8x-input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Country *</label>
              <input type="text" required value={country} onChange={(e) => setCountry(e.target.value)} className="fr8x-input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as LocationType)} className="fr8x-input">
                <option value="sea">Port (Sea)</option>
                <option value="air">Airport</option>
                <option value="icd">ICD</option>
                <option value="cfs">CFS</option>
                <option value="rail">Rail Yard</option>
                <option value="road">Road / Hub</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setActiveTab("all")} className="fr8x-btn-secondary">Cancel</button>
            <button type="submit" className="fr8x-btn-primary">Save Location</button>
          </div>
        </form>
      ) : activeTab === "bulk" ? (
        <div className="bg-white rounded border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-bold text-sm text-[var(--fr8x-jet)]">Bulk Location Master CSV Import</h2>
              <p className="text-[11px] text-gray-500">Upload CSV file with structured location records to import ports, airports, and ICDs.</p>
            </div>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="fr8x-btn-secondary flex items-center gap-1.5 text-xs"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" /> Download Template CSV
            </button>
          </div>

          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center space-y-3 bg-gray-50">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <div>
              <p className="font-semibold text-xs text-gray-700">Select CSV file for Bulk Import</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Required columns: code, name, country, countryCode, type</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setBulkCsvFile(e.target.files?.[0] || null)}
              className="block mx-auto text-xs text-gray-600"
            />
            {bulkCsvFile && (
              <p className="text-xs text-emerald-700 font-semibold">Selected: {bulkCsvFile.name} ({Math.ceil(bulkCsvFile.size / 1024)} KB)</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!bulkCsvFile || isBulkUploading}
              onClick={handleBulkUploadSubmit}
              className="fr8x-btn-primary flex items-center gap-2 px-5 py-2"
            >
              {isBulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Start Bulk Import
            </button>
          </div>

          {bulkResult && (
            <div className="p-4 rounded border bg-slate-50 space-y-2 border-slate-200">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Import Results Summary
              </h3>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-2 bg-white rounded border text-center">
                  <p className="text-gray-500 text-[10px]">Total Rows</p>
                  <p className="font-bold text-sm text-gray-900">{bulkResult.totalRows}</p>
                </div>
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-center">
                  <p className="text-emerald-700 text-[10px]">Successfully Imported</p>
                  <p className="font-bold text-sm text-emerald-800">{bulkResult.successCount}</p>
                </div>
                <div className="p-2 bg-red-50 border border-red-200 rounded text-center">
                  <p className="text-red-700 text-[10px]">Failed Rows</p>
                  <p className="font-bold text-sm text-red-800">{bulkResult.failureCount}</p>
                </div>
              </div>

              {bulkResult.errors.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded max-h-40 overflow-y-auto space-y-1">
                  <p className="font-bold text-red-900 text-[11px]">Validation & Error Log:</p>
                  {bulkResult.errors.map((err, idx) => (
                    <p key={idx} className="text-[10px] text-red-700 font-mono">• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : activeTab === "audit" ? (
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <table className="fr8x-table w-full">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Performed By</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.performedBy}</td>
                  <td className="font-semibold">{log.action}</td>
                  <td>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded border border-gray-200 overflow-hidden space-y-2 p-3">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mb-2">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, city, UN/LOCODE..."
                className="fr8x-input pl-7"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Type:</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="fr8x-input py-1 text-xs">
                <option value="all">All Types</option>
                <option value="sea">Ports (Sea)</option>
                <option value="air">Airports</option>
                <option value="icd">ICD</option>
                <option value="cfs">CFS</option>
                <option value="rail">Rail</option>
                <option value="road">Road / Hub</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="fr8x-table w-full">
              <thead>
                <tr>
                  <th>FR8X Location ID</th>
                  <th>Name</th>
                  <th>City / Country</th>
                  <th>Type</th>
                  <th>UN/LOCODE</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                    <tr key={loc.id || loc.code}>
                      <td className="font-mono font-semibold text-[var(--fr8x-periwinkle)]">{loc.fr8xLocationId || `LOC-${loc.code}`}</td>
                      <td className="font-medium text-gray-900">{loc.name}</td>
                      <td>{loc.city}, {loc.country}</td>
                      <td className="uppercase font-semibold text-[10px] text-gray-600">{loc.type}</td>
                      <td className="font-mono">{loc.unlocode || loc.iataCode || "-"}</td>
                      <td>
                        <span
                          className={`fr8x-badge ${
                            loc.status === "approved"
                              ? "fr8x-badge-active"
                              : loc.status === "pending_verification"
                              ? "fr8x-badge-pending"
                              : "fr8x-badge-danger"
                          }`}
                        >
                          {loc.status}
                        </span>
                      </td>
                      <td className="text-right space-x-1">
                        {loc.status === "pending_verification" && (
                          <>
                            <button
                              onClick={() => handleApprove(loc)}
                              className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] hover:bg-emerald-700 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(loc)}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] hover:bg-rose-700 font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setMergingSourceLoc(loc)}
                          className="px-1.5 py-0.5 border border-gray-300 rounded text-[10px] hover:bg-gray-100"
                          title="Merge duplicate"
                        >
                          <GitMerge className="w-3 h-3 text-purple-600 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500">
                      No locations found in this queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {mergingSourceLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-4 rounded shadow-xl max-w-sm w-full space-y-3 text-xs">
            <h3 className="font-bold text-sm text-gray-900 border-b pb-1">Merge Duplicate Location</h3>
            <p>
              Merging <strong>{mergingSourceLoc.name}</strong> ({mergingSourceLoc.city}). Select the primary location ID to merge into:
            </p>

            <select value={targetMergeId} onChange={(e) => setTargetMergeId(e.target.value)} className="fr8x-input">
              <option value="">-- Select Target Primary Location --</option>
              {locations
                .filter((l) => l.id !== mergingSourceLoc.id && l.status === "approved")
                .map((l) => (
                  <option key={l.id || l.code} value={l.fr8xLocationId || l.code}>
                    {l.name} ({l.city}, {l.country}) [{l.fr8xLocationId || l.code}]
                  </option>
                ))}
            </select>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setMergingSourceLoc(null)} className="fr8x-btn-secondary">Cancel</button>
              <button onClick={handleMergeSubmit} disabled={!targetMergeId} className="fr8x-btn-primary">Confirm Merge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
