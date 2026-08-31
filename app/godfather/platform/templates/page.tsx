'use client';

import React, { useState } from 'react';
import {
  Bell,
  Search,
  CheckCircle2,
  FileText,
  Eye,
  Edit,
  Globe,
  Layers,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { NotificationTemplate } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';
import { interpolateTemplate } from '@/lib/godfather/utils/templateBuilder';

export default function TemplatesManagementPage() {
  const { templates, saveNotificationTemplate } = useGodfatherData();
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate>(templates[0]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedBody, setEditedBody] = useState('');
  const [editedSubject, setEditedSubject] = useState('');

  // Confirmation modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const handleOpenEdit = (t: NotificationTemplate) => {
    setSelectedTemplate(t);
    setEditedSubject(t.subject);
    setEditedBody(t.bodyTemplate);
    setIsEditModalOpen(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const updated = {
      ...selectedTemplate,
      subject: editedSubject,
      bodyTemplate: editedBody,
    };

    setModalConfig({
      isOpen: true,
      title: 'Publish Updated Notification Template Version',
      actionType: 'NOTIFICATION_TEMPLATE_UPDATED',
      targetLabel: selectedTemplate.name,
      targetId: selectedTemplate.templateId,
      onConfirm: async (reason) => {
        await saveNotificationTemplate(updated, reason);
        setIsEditModalOpen(false);
        setModalConfig(null);
      },
    });
  };

  // Sample interpolated preview values
  const previewVars = {
    bidderName: 'Sarah Lewis',
    creatorCompany: 'Atlas Logistics Pvt. Ltd.',
    auctionId: 'RA-2026-0842',
    rfqId: 'RFQ-8842-AUTO',
    route: 'Nhava Sheva (INNSA) → Rotterdam (NLRTM)',
    startDate: '2026-08-29',
    startTime: '10:00',
    endDate: '2026-08-30',
    endTime: '17:00',
    timezone: 'Asia/Kolkata',
    structuredAuctionTable: '📦 Equipment: 2x 40HC | Commodity: Automotive Parts | Incoterm: FOB',
    winnerName: 'Sarah Lewis (Rotterdam Freight NV)',
    winningRate: '$2,320 USD',
    docketId: 'DOC-2026-NLRTM-8821',
    carrier: 'Hapag-Lloyd Ocean Direct',
    transitTime: '26 Days Direct',
    freeTime: '14 Days Origin / 21 Days Dest',
    creatorContact: 'Arjun Rao (+91 98765 43210)',
    userName: 'Ramesh Cargo Agent',
    targetId: 'post-088',
    violationCategory: 'Commercial Solicitation',
    reasonText: 'Posting off-platform contact information without verified IEC credential',
    actionTaken: 'Content Hidden & Author Warning Issued',
  };

  const previewCompiledSubject = interpolateTemplate(selectedTemplate.subject, previewVars);
  const previewCompiledBody = interpolateTemplate(selectedTemplate.bodyTemplate, previewVars);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">PLATFORM GOVERNANCE</span>
            <span className="gf-badge gf-badge-green text-[11px] font-mono">LIVE COMPILER ACTIVE</span>
          </div>
          <h1 className="gf-page-title">Notification & Email Message Templates</h1>
          <p className="gf-page-subtitle">
            Configure system messages for auction invitations, tender awards, payment receipts, KYC reviews, and moderation notices
          </p>
        </div>
      </div>

      {/* Split View: Template List on Left, Live Preview & Compiler on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Templates List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="gf-card p-3 font-bold text-xs text-slate-800 flex items-center justify-between bg-slate-50 border-slate-200">
            <span>Communication Templates ({templates.length})</span>
            <span className="text-[11px] font-mono text-slate-500 font-bold">VARIABLE INTERPOLATION</span>
          </div>

          <div className="space-y-2">
            {templates.map((tmpl) => {
              const isSelected = selectedTemplate.templateId === tmpl.templateId;
              return (
                <div
                  key={tmpl.templateId}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`gf-card p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-sky-400 bg-sky-50/70 shadow-sm ring-1 ring-sky-300' : 'hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Bell className="lucide w-3.5 h-3.5 text-sky-600" />
                        {tmpl.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{tmpl.code}</div>
                    </div>
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold font-mono">
                      V{tmpl.version}.0
                    </span>
                  </div>

                  <div className="mt-2.5 text-[11px] flex items-center justify-between text-slate-600 border-t border-slate-100 pt-2 font-mono">
                    <span className="font-medium">Category: {tmpl.category}</span>
                    <span className="font-semibold text-slate-700">{tmpl.variables.length} Dynamic Vars</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Preview & Compiler on Right (7 cols) */}
        <div className="lg:col-span-7">
          <div className="gf-card divide-y divide-slate-100">
            {/* Header */}
            <div className="p-4 bg-slate-50 flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">{selectedTemplate.name}</h2>
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  Code: <strong className="text-sky-700">{selectedTemplate.code}</strong> · Version: {selectedTemplate.version}.0
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenEdit(selectedTemplate)}
                className="gf-btn gf-btn-secondary text-xs flex items-center gap-1 font-bold"
              >
                <Edit className="lucide w-3 h-3" />
                Edit Template Body
              </button>
            </div>

            {/* Interpolation Variables Box */}
            <div className="p-4 space-y-1.5 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Declared Template Variables</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTemplate.variables.map((v) => (
                  <span key={v} className="gf-badge gf-badge-gray text-[10px] font-mono font-semibold">
                    {`{{ ${v} }}`}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Rendered Preview */}
            <div className="p-4 space-y-3 bg-slate-50/50">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Compiled Live Preview (Rendered Sample)</span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">SIMULATED INBOX DISPATCH</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 font-sans text-xs shadow-xs">
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Subject Line:</span>
                  <span className="font-bold text-slate-900 text-sm">{previewCompiledSubject}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase mb-1">Message Body:</span>
                  <div className="whitespace-pre-line text-slate-800 leading-relaxed font-sans bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    {previewCompiledBody}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card gf-action-modal">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title">Edit Communication Template</h3>
                <p className="gf-modal-subtitle">{selectedTemplate.name} ({selectedTemplate.code})</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="gf-modal-body space-y-3">
              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Subject Line Template</label>
                <input
                  type="text"
                  required
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="gf-input w-full text-xs font-mono"
                />
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Body Template (Markdown & Variables)</label>
                <textarea
                  required
                  rows={8}
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="gf-textarea w-full text-xs font-mono"
                />
              </div>

              <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary font-bold">
                  Publish New Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
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
