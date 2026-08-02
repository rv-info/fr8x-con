"use client";

import { useState } from "react";
import { Search, X, Check, BookOpen } from "lucide-react";

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
];

interface HSCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hsCode: string, description?: string) => void;
}

export function HSCodeModal({ isOpen, onClose, onSelect }: HSCodeModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = COMMON_HS_CODES.filter(
    (item) =>
      item.code.includes(search) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.chapter.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-body-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
            Harmonized System (HS Code) Free Lookup Library
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
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

        <div className="mt-3 max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <p className="text-[11px] text-slate-500 text-center py-6">No matching HS Code found in lookup database.</p>
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
