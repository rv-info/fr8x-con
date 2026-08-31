'use client';

import React, { useState } from 'react';
import { FolderLock, Search, CheckCircle2, AlertTriangle, MessageSquare, Clock, Shield, Plus } from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { AdminCase } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function CaseManagementPage() {
  const { cases } = useGodfatherData();
  const { operator } = useGodfatherAuth();

  const [selectedCase, setSelectedCase] = useState<AdminCase | null>(cases[0] || null);
  const [newNote, setNewNote] = useState('');
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newNote.trim()) return;

    const noteObj = {
      id: `note-${Date.now()}`,
      authorName: operator.displayName,
      authorRole: operator.role,
      text: newNote.trim(),
      createdAt: new Date().toISOString(),
    };

    selectedCase.notes.push(noteObj);
    setNewNote('');
  };

  const handleResolveCase = (c: AdminCase) => {
    setModalConfig({
      isOpen: true,
      title: 'Resolve Support & Compliance Case',
      actionType: 'CASE_RESOLVED',
      targetLabel: `${c.caseId} · ${c.title}`,
      targetId: c.caseId,
      onConfirm: (reason) => {
        c.status = 'resolved';
        c.resolutionSummary = reason;
        setModalConfig(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">SUPPORT & REMEDIATION</span>
            <span className="gf-badge gf-badge-red text-[11px]">
              {cases.filter((c) => c.status !== 'resolved').length} Open Investigations
            </span>
          </div>
          <h1 className="gf-page-title">Case Management & Dispute Remediation</h1>
          <p className="gf-page-subtitle">
            Manage high-severity compliance disputes, KYC address exceptions, and record confidential investigation notes
          </p>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="gf-card p-3 font-bold text-xs text-slate-800 flex items-center justify-between bg-slate-50 border-slate-200">
            <span>Investigation Cases ({cases.length})</span>
            <span className="text-[11px] font-mono text-slate-500 font-bold">CASE QUEUE</span>
          </div>

          <div className="space-y-2">
            {cases.map((c) => {
              const isSelected = selectedCase?.caseId === c.caseId;
              return (
                <div
                  key={c.caseId}
                  onClick={() => setSelectedCase(c)}
                  className={`gf-card p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-sky-400 bg-sky-50/70 shadow-sm ring-1 ring-sky-300' : 'hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <FolderLock className="lucide w-3.5 h-3.5 text-sky-600" />
                        {c.caseId} · {c.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Subject: {c.subjectLabel}</div>
                    </div>
                    <span
                      className={`gf-badge ${
                        c.severity === 'critical'
                          ? 'gf-badge-red'
                          : c.severity === 'high'
                          ? 'gf-badge-amber'
                          : 'gf-badge-blue'
                      } text-[10px] uppercase font-bold`}
                    >
                      {c.severity}
                    </span>
                  </div>

                  <div className="mt-2.5 text-[11px] flex items-center justify-between text-slate-600 border-t border-slate-100 pt-2 font-mono">
                    <span>Officer: {c.assignedToName.split(' ')[0]}</span>
                    <span className="font-semibold text-slate-700">Status: {c.status.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Case Detail on Right (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCase ? (
            <div className="gf-card divide-y divide-slate-100">
              <div className="p-4 bg-slate-50 flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">{selectedCase.title}</h2>
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-mono font-bold">
                      {selectedCase.caseId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Assigned Officer: <strong className="text-slate-900">{selectedCase.assignedToName}</strong> · Type: {selectedCase.type}
                  </p>
                </div>

                {selectedCase.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => handleResolveCase(selectedCase)}
                    className="gf-btn gf-btn-success text-xs font-bold flex items-center gap-1"
                  >
                    <CheckCircle2 className="lucide w-3.5 h-3.5" />
                    Resolve Case
                  </button>
                )}
              </div>

              {/* Notes Timeline */}
              <div className="p-4 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Investigation Timeline & Notes</span>
                <div className="space-y-2">
                  {selectedCase.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{note.authorName} ({note.authorRole})</span>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-normal">{note.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="pt-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Append internal operator note to case log..."
                    className="gf-textarea w-full text-xs"
                  />
                  <div className="flex justify-end mt-2">
                    <button type="submit" className="gf-btn gf-btn-secondary text-xs font-semibold">
                      Add Case Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="gf-card p-12 text-center text-xs text-slate-500">
              Select an open case to inspect details and record investigation notes.
            </div>
          )}
        </div>
      </div>

      {modalConfig && (
        <ActionConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          actionType={modalConfig.actionType}
          targetLabel={modalConfig.targetLabel}
          targetId={modalConfig.targetId}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
