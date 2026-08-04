"use client";

import { useState } from "react";
import { Search, X, BookOpen, ExternalLink, Plus } from "lucide-react";

export interface HSCodeItem {
  code: string;
  description: string;
  chapter: string;
}

const COMMON_HS_CODES: HSCodeItem[] = [
  { code: "8471.30", description: "Portable automatic data processing machines (Laptops, Tablets)", chapter: "84 - Machinery & Appliances" },
  { code: "8517.13", description: "Smartphones and cellular network telephones", chapter: "85 - Electronics & Telecom" },
  { code: "8703.23", description: "Motor cars & passenger vehicles (>1500cc to 3000cc)", chapter: "87 - Vehicles & Automotive" },
  { code: "6109.10", description: "T-shirts, singlets and vests of cotton, knitted or crocheted", chapter: "61 - Apparel & Textiles" },
  { code: "3004.90", description: "Medicaments consisting of mixed or unmixed products for therapeutic use", chapter: "30 - Pharmaceutical Products" },
  { code: "3926.90", description: "Articles of plastics and articles of other materials", chapter: "39 - Plastics & Rubber" },
  { code: "7318.15", description: "Threaded screws and bolts of iron or steel", chapter: "73 - Iron & Steel Products" },
  { code: "0901.21", description: "Roasted coffee, not decaffeinated", chapter: "09 - Coffee, Tea & Spices" },
  { code: "1006.30", description: "Semi-milled or wholly milled Basmati/Non-Basmati rice", chapter: "10 - Cereals" },
  { code: "9018.90", description: "Medical, surgical or veterinary instruments & appliances", chapter: "90 - Precision & Medical Instruments" },
  { code: "9403.60", description: "Wooden furniture & commercial fixtures", chapter: "94 - Furniture & Lighting" },
  { code: "2710.19", description: "Medium oils & preparations of petroleum or bituminous minerals", chapter: "27 - Petroleum & Energy" },
  { code: "4819.10", description: "Cartons, boxes and cases, of corrugated paper or paperboard", chapter: "48 - Paper & Paperboard" },
  { code: "8504.40", description: "Static converters (inverters, power supplies, battery chargers)", chapter: "85 - Electronics & Electrical" },
  { code: "2933.99", description: "Heterocyclic compounds with nitrogen hetero-atom(s) only", chapter: "29 - Organic Chemicals" },
  { code: "4011.10", description: "New pneumatic tyres, of rubber, of a kind used on motor cars", chapter: "40 - Rubber Products" },
];

interface HSCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hsCode: string, description?: string) => void;
}

export function HSCodeModal({ isOpen, onClose, onSelect }: HSCodeModalProps) {
  const [search, setSearch] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [customDesc, setCustomDesc] = useState("");

  if (!isOpen) return null;

  const filtered = COMMON_HS_CODES.filter(
    (item) =>
      item.code.includes(search) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.chapter.toLowerCase().includes(search.toLowerCase())
  );

  const handleCustomSubmit = () => {
    if (!customCode.trim()) return;
    onSelect(customCode.trim(), customDesc.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-body-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
            Free Global HS Code Library & Search
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Free text manual entry option */}
        <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] space-y-2">
          <p className="font-semibold text-slate-700">Enter Custom / Unlisted HS Code (Unrestricted):</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="e.g. 8471.30.01"
              className="fr8x-input text-[11px] w-1/3"
            />
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Description (optional)..."
              className="fr8x-input text-[11px] flex-1"
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customCode.trim()}
              className="px-3 py-1.5 bg-[var(--fr8x-periwinkle)] text-white font-bold rounded-lg hover:bg-[#3ABFF0] disabled:opacity-40 text-[11px] flex items-center gap-1 shrink-0"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search HS code, product description, or chapter..."
              className="fr8x-input pl-8 text-[11px]"
            />
          </div>
        </div>

        <div className="mt-3 max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-[11px] text-slate-500">No matching HS Code found in fast library.</p>
              <a
                href={`https://hscode.org/search?q=${encodeURIComponent(search)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[var(--fr8x-periwinkle)] font-bold hover:underline"
              >
                Search World Customs Organization (WCO) Online <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.code}
                onClick={() => {
                  onSelect(item.code, item.description);
                  onClose();
                }}
                className="p-2 hover:bg-[var(--fr8x-mist)] rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] text-[var(--fr8x-periwinkle)] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      {item.code}
                    </span>
                    <span className="text-[9px] text-slate-500">{item.chapter}</span>
                  </div>
                  <p className="text-[11px] font-medium text-[var(--fr8x-jet)] mt-0.5">{item.description}</p>
                </div>
                <button className="text-[10px] text-[var(--fr8x-periwinkle)] font-bold shrink-0 hover:underline">
                  Select
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

