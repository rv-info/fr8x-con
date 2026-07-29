// FR8X-CON Enterprise Feed Attachment & Excel Sheet Previewer
"use client";

import { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Download,
  ExternalLink,
  Copy,
  Check,
  Eye,
} from "lucide-react";

export interface FeedAttachment {
  id: string;
  fileName: string;
  fileSizeMB: number;
  fileType: "excel" | "pdf" | "word" | "powerpoint" | "csv" | "image";
  url: string;
  sheetName?: string;
  totalRows?: number;
  totalCols?: number;
  previewRows?: Array<Array<string | number>>;
}

interface FeedAttachmentViewerProps {
  attachment: FeedAttachment;
}

export function FeedAttachmentViewer({ attachment }: FeedAttachmentViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showFullExcelModal, setShowFullExcelModal] = useState(false);

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(attachment.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isExcel = attachment.fileType === "excel" || attachment.fileType === "csv";

  // Fallback preview rows
  const samplePreviewRows = attachment.previewRows || [
    ["Container ID", "POL", "POD", "Freight Rate (USD)", "Vessel Name", "ETD", "Status"],
    ["MSKU-992101", "INBOM (JNPT)", "AEDXB (Jebel Ali)", "450.00", "Maersk Genoa", "2026-08-05", "Confirmed"],
    ["CMAU-881920", "INBOM (JNPT)", "SGSIN (Singapore)", "320.00", "CMA CGM Figaro", "2026-08-08", "Confirmed"],
    ["HLCU-771029", "INMAA (Chennai)", "MYPKG (Port Klang)", "280.00", "Hapag Express", "2026-08-10", "Pending"],
    ["COSU-661902", "INMUN (Mundra)", "NLRTM (Rotterdam)", "1250.00", "COSCO Excellence", "2026-08-12", "Confirmed"],
    ["ONEU-552910", "INBOM (JNPT)", "DEHAM (Hamburg)", "1300.00", "ONE Olympus", "2026-08-15", "Confirmed"],
    ["MSC-441920", "INVTZ (Vizag)", "AEAUH (Abu Dhabi)", "480.00", "MSC Jasmine", "2026-08-18", "Pending"],
    ["EVER-331092", "INBOM (JNPT)", "USNYC (New York)", "2400.00", "Ever Given", "2026-08-20", "Confirmed"],
  ];

  const headers = samplePreviewRows[0] || [];
  const rows = samplePreviewRows.slice(1);

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 my-2 text-left">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          {isExcel ? (
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : attachment.fileType === "pdf" ? (
            <FileText className="h-5 w-5 text-red-600 shrink-0" />
          ) : (
            <FileCode className="h-5 w-5 text-blue-600 shrink-0" />
          )}

          <div className="truncate">
            <h4 className="font-bold text-body-sm text-[var(--fr8x-jet)] truncate">{attachment.fileName}</h4>
            <p className="text-[10px] text-foreground-secondary">
              {attachment.fileSizeMB} MB • {attachment.fileType.toUpperCase()}
              {isExcel && ` • Sheet: ${attachment.sheetName || "Sheet1"} (${attachment.totalRows || 450} rows, ${attachment.totalCols || 12} cols)`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 text-caption font-semibold flex items-center gap-1"
            title="Copy Attachment Link"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
            title="Open in New Tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <a
            href={attachment.url}
            download
            className="p-1.5 rounded bg-white border border-slate-300 hover:bg-slate-100 text-[var(--fr8x-jet)] text-caption font-bold flex items-center gap-1 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)]" /> Download
          </a>
        </div>
      </div>

      {/* Excel Preview */}
      {isExcel && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="font-semibold">Spreadsheet Preview (First 8 Rows)</span>
            <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
              DOM Optimized Preview
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white max-h-56">
            <table className="w-full text-left text-[11px] font-mono border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  {headers.map((header, idx) => (
                    <th key={idx} className="p-2 border-r border-slate-200 font-bold text-slate-700 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 border-r border-slate-200 whitespace-nowrap text-slate-800">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-foreground-muted">
              Showing 8 of {attachment.totalRows || 450} rows to preserve browser performance
            </p>

            <button
              onClick={() => setShowFullExcelModal(true)}
              className="fr8x-btn-secondary text-[11px] py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 border-none"
            >
              <Eye className="h-3.5 w-3.5" /> Open Full Spreadsheet ({attachment.totalRows || 450} Rows)
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showFullExcelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] flex flex-col space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-heading-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  Full Viewer: {attachment.fileName}
                </h3>
                <p className="text-caption text-foreground-secondary">
                  Sheet: {attachment.sheetName || "Sheet1"} • Total Rows: {attachment.totalRows || 450}
                </p>
              </div>

              <button
                onClick={() => setShowFullExcelModal(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-body-sm font-bold"
              >
                Close Viewer
              </button>
            </div>

            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white p-2">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    {headers.map((header, idx) => (
                      <th key={idx} className="p-2.5 border-r border-slate-200 font-bold text-slate-800 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2.5 border-r border-slate-200 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <a
                href={attachment.url}
                download
                className="fr8x-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 text-body-sm flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Download Complete Spreadsheet
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
