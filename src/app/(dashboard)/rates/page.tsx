// FR8X-CON Rate Center Page — Spec Page 10
// Header, Top Nav Tabs, Left Sidebar Rate Entry/Filter Form, Main Table with Actions, Pagination

"use client";

import { useState } from "react";
import { Plus, Download, Upload, Copy, Trash2, Clock, ChevronLeft, ChevronRight } from "lucide-react";

type RateTab = "active" | "expired" | "all";

const mockRates = Array.from({ length: 10 }, (_, i) => ({
  id: `rate-${i + 1}`,
  srq: `SRQ-${1000 + i}`,
  rateProvider: ["Ocean Trans", "Global Freight", "Apex Logistics", "Speedy Cargo", "Marine Logistics"][i % 5],
  carrier: ["Maersk", "MSC", "CMA CGM", "COSCO", "Hapag-Lloyd"][i % 5],
  pol: ["INNSA", "INBOM", "SGSIN", "CNSHA", "NLRTM"][i % 5],
  pod: ["NLRTM", "DEHAM", "AEJEA", "USNYC", "GBFLX"][i % 5],
  fpod: ["NLRTM", "DEHAM", "AEJEA", "USNYC", "GBFLX"][i % 5],
  commodity: "General",
  contType: ["GEN", "HAZ", "OOG"][i % 3],
  contSize: ["20'", "40'", "40' HC"][i % 3],
  route: "Direct",
  rate: 1200 + i * 150,
  curr: "USD",
  tt: `${14 + i} days`,
  routing: "Direct",
  remarks: "Valid until end of month",
  status: i % 4 === 0 ? "expired" : "active",
}));

export default function RateCenterPage() {
  const [activeTab, setActiveTab] = useState<RateTab>("active");

  // Form state (left sidebar)
  const [rateProvider, setRateProvider] = useState("");
  const [carrierForwarderName, setCarrierForwarderName] = useState("");
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

  const filteredRates = mockRates.filter((r) => {
    if (activeTab === "active") return r.status === "active";
    if (activeTab === "expired") return r.status === "expired";
    return true;
  });

  const handleClear = () => {
    setRateProvider("");
    setCarrierForwarderName("");
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
  };

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)] py-6 w-full">
      <div className="w-full max-w-full px-4 lg:px-8 space-y-5">
        {/* Header */}
        <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">RATE CENTER</h1>

        {/* Top Navigation / Tabs & Bulk Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("active")}
              className={activeTab === "active" ? "fr8x-tab-active font-semibold" : "fr8x-tab-inactive"}
            >
              ACTIVE RATES
            </button>
            <button
              onClick={() => setActiveTab("expired")}
              className={activeTab === "expired" ? "fr8x-tab-active font-semibold" : "fr8x-tab-inactive"}
            >
              EXPIRED RATES
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={activeTab === "all" ? "fr8x-tab-active font-semibold" : "fr8x-tab-inactive"}
            >
              ALL RATES
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] flex items-center gap-1.5 text-caption">
              <Upload className="h-3.5 w-3.5" />
              BULK UPLOAD
            </button>
            <button className="fr8x-btn-secondary flex items-center gap-1.5 text-caption">
              <Download className="h-3.5 w-3.5" />
              DOWNLOAD FOR BULK UPLOAD
            </button>
          </div>
        </div>

        {/* Layout: Left Sidebar (Form) + Right Content (Table) */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* ═══ LEFT SIDEBAR: Rate Entry / Filters ═══ */}
          <aside className="w-full lg:w-[320px] shrink-0 fr8x-card p-4 space-y-3 bg-white">
            <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)] border-b border-border pb-2">
              RATE ENTRY / FILTERS
            </h2>

            <div>
              <label className="fr8x-label block mb-1">RATE PROVIDER</label>
              <input type="text" value={rateProvider} onChange={(e) => setRateProvider(e.target.value)} className="fr8x-input text-caption" />
            </div>

            <div>
              <label className="fr8x-label block mb-1">CARRIER/FORWARDS NAME</label>
              <input type="text" value={carrierForwarderName} onChange={(e) => setCarrierForwarderName(e.target.value)} className="fr8x-input text-caption" />
            </div>

            <div>
              <label className="fr8x-label block mb-1">Carrier</label>
              <input type="text" value={carrier} onChange={(e) => setCarrier(e.target.value)} className="fr8x-input text-caption" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fr8x-label block mb-1">POL</label>
                <input type="text" value={pol} onChange={(e) => setPol(e.target.value)} className="fr8x-input text-caption" placeholder="POL" />
              </div>
              <div>
                <label className="fr8x-label block mb-1">POD</label>
                <input type="text" value={pod} onChange={(e) => setPod(e.target.value)} className="fr8x-input text-caption" placeholder="POD" />
              </div>
            </div>

            <div>
              <label className="fr8x-label block mb-1">FPOD</label>
              <input type="text" value={fpod} onChange={(e) => setFpod(e.target.value)} className="fr8x-input text-caption" placeholder="FPOD" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fr8x-label block mb-1">CONTAINER SIZE</label>
                <select value={contSize} onChange={(e) => setContSize(e.target.value)} className="fr8x-input text-caption">
                  <option value="20'">20'</option>
                  <option value="40'">40'</option>
                  <option value="OT">OT</option>
                  <option value="RF">RF</option>
                  <option value="DG">DG</option>
                  <option value="IG">IG</option>
                </select>
              </div>
              <div>
                <label className="fr8x-label block mb-1">RATE</label>
                <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="fr8x-input text-caption" placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="fr8x-label block mb-1">CONTAINER TYPE</label>
              <select value={contType} onChange={(e) => setContType(e.target.value)} className="fr8x-input text-caption">
                <option value="GEN">GEN</option>
                <option value="HAZ">HAZ</option>
                <option value="DG">DG</option>
                <option value="IG">IG</option>
                <option value="OOG">OOG</option>
              </select>
            </div>

            <div>
              <label className="fr8x-label block mb-1">ROUTE</label>
              <input type="text" value={route} onChange={(e) => setRoute(e.target.value)} className="fr8x-input text-caption" />
            </div>

            <div>
              <label className="fr8x-label block mb-1">VALIDITY (DATE)</label>
              <input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} className="fr8x-input text-caption" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fr8x-label block mb-1">TT</label>
                <input type="text" value={tt} onChange={(e) => setTt(e.target.value)} className="fr8x-input text-caption" placeholder="Days" />
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
              <label className="fr8x-label block mb-1">TRANSIT TYPE</label>
              <select value={transitType} onChange={(e) => setTransitType(e.target.value)} className="fr8x-input text-caption">
                <option value="SAVING">SAVING</option>
                <option value="HARDPORT">HARDPORT</option>
              </select>
            </div>

            <div>
              <label className="fr8x-label block mb-1">REMARKS</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="fr8x-input text-caption min-h-[50px] resize-none" />
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] py-1 text-caption">SAVE</button>
                <button className="fr8x-btn-secondary py-1 text-caption">UPDATE</button>
                <button onClick={handleClear} className="fr8x-btn-ghost text-danger py-1 text-caption">CLEAR</button>
              </div>
              <button className="fr8x-btn-secondary w-full py-1 text-caption">DUPLICATE</button>
            </div>
          </aside>

          {/* ═══ MAIN CONTENT: Rates Table ═══ */}
          <main className="flex-1 min-w-0 space-y-4">
            <div className="fr8x-card bg-white overflow-hidden">
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
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRates.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                        <td><input type="checkbox" /></td>
                        <td className="font-semibold text-[var(--fr8x-jet)]">{r.srq}</td>
                        <td>{r.rateProvider}</td>
                        <td>{r.carrier}</td>
                        <td>{r.pol}</td>
                        <td>{r.pod}</td>
                        <td>{r.fpod}</td>
                        <td>{r.commodity}</td>
                        <td>{r.contType}</td>
                        <td>{r.contSize}</td>
                        <td>{r.route}</td>
                        <td className="font-bold text-[var(--fr8x-jet)]">${r.rate}</td>
                        <td>{r.curr}</td>
                        <td>{r.tt}</td>
                        <td>{r.routing}</td>
                        <td className="truncate max-w-[120px]">{r.remarks}</td>
                        <td>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <button className="text-[var(--fr8x-periwinkle)] hover:underline">COPY / DUPLICATE</button>
                            <span className="text-foreground-muted">|</span>
                            <button className="text-warning hover:underline">mark as expired</button>
                            <span className="text-foreground-muted">|</span>
                            <button className="text-danger hover:underline">delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 py-3 text-caption text-foreground-secondary">
              <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)]">
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span>Page 1 of 1</span>
              <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)]">
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
