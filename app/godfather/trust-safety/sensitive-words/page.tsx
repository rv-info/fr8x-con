'use client';

import React, { useState } from 'react';
import {
  Filter,
  Search,
  Plus,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Trash2,
  Play,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { SensitiveWordRule } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function SensitiveWordsFilterPage() {
  const { sensitiveWords, addSensitiveWordRule, deleteSensitiveWordRule, toggleSensitiveWordRule } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New rule form
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState<SensitiveWordRule['category']>('fraud');
  const [newSeverity, setNewSeverity] = useState<SensitiveWordRule['severity']>('quarantine');
  const [newMatchType, setNewMatchType] = useState<SensitiveWordRule['matchType']>('contains');
  const [newDescription, setNewDescription] = useState('');
  const [newReason, setNewReason] = useState('');

  // Interactive Live Sandbox testing
  const [testText, setTestText] = useState('Urgent: WhatsApp me on 9876543210 for discounted rates. We accept Western Union and personal bank accounts.');
  const [testResult, setTestResult] = useState<{
    matches: { word: string; category: string; severity: string }[];
    sanitized: string;
    action: string;
  } | null>(null);

  // Confirmation modal
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    isDestructive?: boolean;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const filteredRules = sensitiveWords.filter((rule) => {
    const matchesSearch =
      rule.wordOrPattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || rule.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleTestSandbox = () => {
    if (!testText.trim()) return;
    const matches: { word: string; category: string; severity: string }[] = [];
    let sanitized = testText;
    let worstSeverity = 'clean';

    sensitiveWords.forEach((rule) => {
      if (!rule.active) return;
      let isMatch = false;

      if (rule.matchType === 'regex') {
        try {
          const reg = new RegExp(rule.wordOrPattern, 'gi');
          if (reg.test(testText)) {
            isMatch = true;
            sanitized = sanitized.replace(reg, '***[MASKED]***');
          }
        } catch {}
      } else {
        const lowerText = testText.toLowerCase();
        const lowerWord = rule.wordOrPattern.toLowerCase();
        if (lowerText.includes(lowerWord)) {
          isMatch = true;
          const reg = new RegExp(rule.wordOrPattern, 'gi');
          sanitized = sanitized.replace(reg, '***[MASKED]***');
        }
      }

      if (isMatch) {
        matches.push({ word: rule.wordOrPattern, category: rule.category, severity: rule.severity });
        if (rule.severity === 'block') worstSeverity = 'HARD BLOCK (Rejected)';
        else if (rule.severity === 'quarantine' && worstSeverity !== 'HARD BLOCK (Rejected)') worstSeverity = 'QUARANTINE (Held for Officer Review)';
        else if (rule.severity === 'mask' && !worstSeverity.includes('BLOCK') && !worstSeverity.includes('QUARANTINE')) worstSeverity = 'MASKED (Live Scrubbed)';
        else if (rule.severity === 'flag' && worstSeverity === 'clean') worstSeverity = 'FLAGGED (Logged to Audit)';
      }
    });

    setTestResult({
      matches,
      sanitized,
      action: worstSeverity === 'clean' ? 'PASSED (Clean Content)' : worstSeverity,
    });
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newReason.trim()) return;

    const verified = await requestStepUpVerification(`Add Sensitive Keyword Rule for "${newWord}"`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Authorize Sensitive Content Moderation Rule',
      actionType: 'SENSITIVE_WORD_RULE_ADDED',
      targetLabel: newWord,
      targetId: `sw-${Date.now()}`,
      onConfirm: async (reason) => {
        await addSensitiveWordRule(
          {
            wordOrPattern: newWord.trim(),
            category: newCategory,
            severity: newSeverity,
            matchType: newMatchType,
            description: newDescription.trim() || 'Automated moderation pattern',
          },
          reason
        );
        setIsAddModalOpen(false);
        setNewWord('');
        setNewDescription('');
        setNewReason('');
        setModalConfig(null);
      },
    });
  };

  const handleDeleteRule = (rule: SensitiveWordRule) => {
    setModalConfig({
      isOpen: true,
      title: 'Remove Sensitive Word Rule',
      actionType: 'SENSITIVE_WORD_RULE_DELETED',
      targetLabel: rule.wordOrPattern,
      targetId: rule.id,
      isDestructive: true,
      onConfirm: async (reason) => {
        await deleteSensitiveWordRule(rule.id, reason);
        setModalConfig(null);
      },
    });
  };

  const handleToggleRule = async (rule: SensitiveWordRule) => {
    await toggleSensitiveWordRule(rule.id, `Toggle status for rule ${rule.wordOrPattern}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-green text-[11px] font-bold">TRUST & SAFETY</span>
            <span className="gf-badge gf-badge-gold text-[11px]">Real-Time Regex Engine Active</span>
          </div>
          <h1 className="gf-page-title">Sensitive Words & Automated Moderation Filter</h1>
          <p className="gf-page-subtitle">
            Configure automated scrubbing, quarantine triggers, off-platform fraud circumvention, and blacklisted keywords
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold"
        >
          <Plus className="lucide w-3.5 h-3.5" />
          Add Sensitive Rule
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="gf-metric-grid">
        <div className="gf-metric-card">
          <div className="gf-metric-title">Active Filter Rules</div>
          <div className="gf-metric-value text-emerald-700">{sensitiveWords.filter((r) => r.active).length}</div>
          <div className="gf-metric-foot">
            <ShieldCheck className="lucide w-3.5 h-3.5" /> Across Feeds, Chat & Auctions
          </div>
        </div>

        <div className="gf-metric-card">
          <div className="gf-metric-title">Total Interceptions Caught</div>
          <div className="gf-metric-value text-amber-700">
            {sensitiveWords.reduce((sum, r) => sum + r.hitsCount, 0)}
          </div>
          <div className="gf-metric-foot text-amber-700">
            <Activity className="lucide w-3.5 h-3.5" /> Auto-scrubbed or quarantined
          </div>
        </div>

        <div className="gf-metric-card">
          <div className="gf-metric-title">High-Risk Fraud Keywords</div>
          <div className="gf-metric-value text-rose-700">
            {sensitiveWords.filter((r) => r.category === 'fraud' || r.category === 'illegal').length}
          </div>
          <div className="gf-metric-foot text-rose-700">
            <AlertOctagon className="lucide w-3.5 h-3.5" /> Hard Block & FIU Watchlist
          </div>
        </div>
      </div>

      {/* Interactive Live Testing Sandbox */}
      <div className="gf-card p-5 border-emerald-300 bg-emerald-50/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="lucide w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-emerald-950 text-sm">Live Regex & Content Filter Simulation Sandbox</h3>
          </div>
          <button
            type="button"
            onClick={handleTestSandbox}
            className="gf-btn gf-btn-primary text-xs flex items-center gap-1 font-bold"
          >
            <Play className="lucide w-3 h-3" />
            Run Content Test
          </button>
        </div>

        <p className="text-xs text-emerald-800 mb-3">
          Type or paste any user message, rate offer, auction bid note, or job listing to test how the Godfather engine scrubs or blocks it in real time:
        </p>

        <textarea
          rows={3}
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="gf-textarea w-full text-xs font-mono bg-white border-emerald-200 text-slate-800"
          placeholder="Enter test text here..."
        />

        {testResult && (
          <div className="mt-4 p-3.5 rounded-lg bg-white border border-emerald-300 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Moderation Decision:</span>
              <span
                className={`gf-badge ${
                  testResult.action.includes('HARD BLOCK')
                    ? 'gf-badge-red'
                    : testResult.action.includes('QUARANTINE')
                    ? 'gf-badge-amber'
                    : testResult.action.includes('MASKED')
                    ? 'gf-badge-blue'
                    : 'gf-badge-green'
                } font-bold text-xs uppercase`}
              >
                {testResult.action}
              </span>
            </div>

            {testResult.matches.length > 0 && (
              <div>
                <span className="font-bold text-slate-700 block mb-1">Triggered Patterns ({testResult.matches.length}):</span>
                <div className="flex flex-wrap gap-1.5">
                  {testResult.matches.map((m, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-mono font-bold">
                      &quot;{m.word}&quot; ({m.category} · {m.severity})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="font-bold text-slate-700 block mb-1">Sanitized User Output (Scrubbed View):</span>
              <div className="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800">
                {testResult.sanitized}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Rules List */}
      <div className="gf-card">
        <div className="gf-filter-bar">
          <div className="gf-search-input-wrap">
            <Search className="lucide w-4 h-4 text-emerald-800" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword pattern, description, category..."
              className="gf-search-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="gf-select text-xs font-bold"
            >
              <option value="all">All Categories</option>
              <option value="fraud">Fraud & Payment Scams</option>
              <option value="circumvention">Contact Circumvention</option>
              <option value="illegal">Illegal / AML Prohibited</option>
              <option value="abusive">Abuse & Harassment</option>
              <option value="competitor">Competitor Solicitations</option>
            </select>
            <span className="text-xs text-mut font-bold">
              Showing <strong>{filteredRules.length}</strong> rules
            </span>
          </div>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th>Keyword / Pattern</th>
                <th>Category</th>
                <th>Enforcement Severity</th>
                <th>Match Mode</th>
                <th>Hits Caught</th>
                <th>Description & Rationale</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                      {rule.wordOrPattern}
                    </span>
                  </td>
                  <td>
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold">
                      {rule.category}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`gf-badge ${
                        rule.severity === 'block'
                          ? 'gf-badge-red'
                          : rule.severity === 'quarantine'
                          ? 'gf-badge-amber'
                          : rule.severity === 'mask'
                          ? 'gf-badge-blue'
                          : 'gf-badge-green'
                      } text-[10px] uppercase font-bold`}
                    >
                      {rule.severity}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-[11px] text-slate-600 uppercase font-semibold">
                      {rule.matchType}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {rule.hitsCount} hits
                    </span>
                  </td>
                  <td>
                    <div className="text-slate-700 max-w-xs truncate">{rule.description}</div>
                    <div className="text-[10px] text-faint font-mono">By: {rule.updatedBy}</div>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleRule(rule)}
                      className={`gf-badge ${rule.active ? 'gf-badge-green' : 'gf-badge-gray'} cursor-pointer text-[10px] font-bold`}
                    >
                      {rule.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule)}
                      className="gf-btn gf-btn-danger text-[11px] py-1 px-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                      title="Delete Rule"
                    >
                      <Trash2 className="lucide w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Rule Modal */}
      {isAddModalOpen && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title flex items-center gap-1.5 text-emerald-900">
                  <Filter className="lucide w-4 h-4 text-emerald-700" />
                  Add Sensitive Word / Regex Rule
                </h3>
                <p className="gf-modal-subtitle">Inject a new automated pattern into the live content moderation engine</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="gf-modal-body space-y-4">
              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Word / Phrase / Regular Expression</label>
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="e.g. western union, whatsapp me, (\+?[0-9]{10,12})"
                  className="gf-input w-full text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="gf-select w-full text-xs font-bold"
                  >
                    <option value="fraud">Fraud / Payment Scam</option>
                    <option value="circumvention">Contact Circumvention</option>
                    <option value="illegal">Illegal / AML Policy</option>
                    <option value="abusive">Abuse / Offensive</option>
                    <option value="competitor">Competitor Solicitation</option>
                  </select>
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Enforcement Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="gf-select w-full text-xs font-bold"
                  >
                    <option value="quarantine">Quarantine (Hold for Review)</option>
                    <option value="mask">Mask with *** (Live Scrub)</option>
                    <option value="block">Hard Block (Reject Submission)</option>
                    <option value="flag">Flag & Audit Only</option>
                  </select>
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Match Type</label>
                  <select
                    value={newMatchType}
                    onChange={(e) => setNewMatchType(e.target.value as any)}
                    className="gf-select w-full text-xs font-bold"
                  >
                    <option value="contains">Sub-string (Contains)</option>
                    <option value="exact">Exact Word Match</option>
                    <option value="regex">Regular Expression</option>
                  </select>
                </div>
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Rule Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explain why this phrase is restricted..."
                  className="gf-input w-full text-xs"
                />
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Godfather Rationale (Audit Trail)</label>
                <textarea
                  required
                  rows={2}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Operational justification for adding this sensitive rule..."
                  className="gf-textarea w-full text-xs"
                />
              </div>

              <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary font-bold">
                  Authorize & Deploy Rule
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
          isDestructive={modalConfig.isDestructive}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
