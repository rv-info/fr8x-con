'use client';

/**
 * components/posts/RichPostEditor.tsx
 * Professional Rich Text Editor for FR8X Feed Posts.
 * 
 * Capabilities:
 * - Bold, italic, underline, strikethrough
 * - Headings (H1, H2, H3) and size control
 * - Bulleted & numbered lists
 * - Blockquotes
 * - Safe hyperlinks with protocol validation
 * - Insertable, editable tables with customizable rows and columns
 * - Undo / Redo history stack with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
 * - Clear formatting
 * - Live preview matching the published post output across desktop & mobile
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Table as TableIcon,
  Undo2,
  Redo2,
  Eraser,
  Eye,
  Edit3,
  Plus,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { parseRichText } from '@/lib/utils';
import { sanitizeRichTextPost } from '@/lib/security/input-validation';

interface RichPostEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function RichPostEditor({
  value,
  onChange,
  placeholder = 'Share maritime intelligence, blank sailings alert, port operational updates, or rate trends...',
  minHeight = '100px',
  autoFocus = false,
  disabled = false,
}: RichPostEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Link modal state
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');

  // Table modal state
  const [tableCols, setTableCols] = useState(3);
  const [tableRows, setTableRows] = useState(2);
  const [colHeaders, setColHeaders] = useState(['Port / Terminal', 'Carrier / Line', 'Rate / Transit']);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback(
    (newVal: string) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(newVal);
        if (next.length > 50) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex]
  );

  const handleTextChange = (newVal: string) => {
    onChange(newVal);
    pushHistory(newVal);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetVal = history[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      onChange(targetVal);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetVal = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      onChange(targetVal);
    }
  };

  // Helper to wrap or insert text at cursor selection
  const applyWrap = (before: string, after: string = '', defaultText: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value;
    const selected = currentVal.substring(start, end) || defaultText;

    const nextVal =
      currentVal.substring(0, start) +
      before +
      selected +
      after +
      currentVal.substring(end);

    handleTextChange(nextVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  // Helper to insert line prefix (e.g. for headings, lists, blockquotes)
  const applyLinePrefix = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const currentVal = el.value;
    const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1;

    const nextVal =
      currentVal.substring(0, lineStart) +
      prefix +
      currentVal.substring(lineStart);

    handleTextChange(nextVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  // Clear formatting on selection
  const handleClearFormatting = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) return;

    const currentVal = el.value;
    let selected = currentVal.substring(start, end);

    // Strip markdown formatting symbols
    selected = selected
      .replace(/(\*\*|\*|__|_|~~|~|`|#|>|\||- |\d+\. )/g, '')
      .replace(/<\/?(?:u|del|strong|em|b|i)[^>]*>/gi, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    const nextVal = currentVal.substring(0, start) + selected + currentVal.substring(end);
    handleTextChange(nextVal);
  };

  // Keyboard Shortcuts handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        applyWrap('**', '**', 'bold text');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        applyWrap('_', '_', 'italic text');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        applyWrap('<u>', '</u>', 'underlined text');
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        handleRedo();
      }
    }
  };

  // Open Link Modal
  const openLinkModal = () => {
    const el = textareaRef.current;
    const selected = el ? el.value.substring(el.selectionStart, el.selectionEnd) : '';
    setLinkText(selected || 'Click here');
    setLinkUrl('https://');
    setLinkError('');
    setShowLinkModal(true);
  };

  // Insert Link confirmation
  const handleInsertLink = () => {
    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl || !/^(https?:\/\/|\/)/i.test(trimmedUrl) || /^(javascript:|data:|vbscript:)/i.test(trimmedUrl)) {
      setLinkError('Please enter a valid HTTP, HTTPS, or platform relative URL.');
      return;
    }
    const label = linkText.trim() || trimmedUrl;
    applyWrap(`[${label}](${trimmedUrl})`, '');
    setShowLinkModal(false);
  };

  // Insert Table
  const handleInsertTable = () => {
    let tableMd = '\n\n';
    // Header row
    const headers = colHeaders.slice(0, tableCols);
    while (headers.length < tableCols) {
      headers.push(`Column ${headers.length + 1}`);
    }
    tableMd += '| ' + headers.join(' | ') + ' |\n';
    // Separator row
    tableMd += '| ' + headers.map(() => ':---').join(' | ') + ' |\n';
    // Data rows
    for (let r = 0; r < tableRows; r++) {
      const cells = headers.map((_, c) => `Data ${r + 1}-${c + 1}`);
      tableMd += '| ' + cells.join(' | ') + ' |\n';
    }
    tableMd += '\n';

    applyWrap(tableMd, '');
    setShowTableModal(false);
  };

  return (
    <div
      className="rich-post-editor-container"
      style={{
        border: '1.5px solid var(--fr8x-outline, #cbd5e1)',
        borderRadius: '8px',
        background: '#ffffff',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* ── Toolbar ───────────────────────────────────────────────────────────── */}
      <div
        className="rich-editor-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '6px 8px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          userSelect: 'none',
        }}
      >
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={historyIndex <= 0 || isPreview || disabled}
          title="Undo (Ctrl+Z)"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: historyIndex > 0 ? 'pointer' : 'default', opacity: historyIndex > 0 ? 1 : 0.4 }}
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1 || isPreview || disabled}
          title="Redo (Ctrl+Y)"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: historyIndex < history.length - 1 ? 'pointer' : 'default', opacity: historyIndex < history.length - 1 ? 1 : 0.4 }}
        >
          <Redo2 size={14} />
        </button>

        <span style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 4px' }} />

        {/* Text Styles */}
        <button
          type="button"
          onClick={() => applyWrap('**', '**', 'bold')}
          disabled={isPreview || disabled}
          title="Bold (Ctrl+B)"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyWrap('_', '_', 'italic')}
          disabled={isPreview || disabled}
          title="Italic (Ctrl+I)"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyWrap('<u>', '</u>', 'underlined')}
          disabled={isPreview || disabled}
          title="Underline (Ctrl+U)"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <UnderlineIcon size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyWrap('~~', '~~', 'strikethrough')}
          disabled={isPreview || disabled}
          title="Strikethrough"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <Strikethrough size={14} />
        </button>

        <span style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 4px' }} />

        {/* Headings */}
        <button
          type="button"
          onClick={() => applyLinePrefix('# ')}
          disabled={isPreview || disabled}
          title="Heading 1"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <Heading1 size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyLinePrefix('## ')}
          disabled={isPreview || disabled}
          title="Heading 2"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <Heading2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyLinePrefix('### ')}
          disabled={isPreview || disabled}
          title="Heading 3"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <Heading3 size={14} />
        </button>

        <span style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 4px' }} />

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => applyLinePrefix('- ')}
          disabled={isPreview || disabled}
          title="Bulleted List"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyLinePrefix('1. ')}
          disabled={isPreview || disabled}
          title="Numbered List"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyLinePrefix('> ')}
          disabled={isPreview || disabled}
          title="Blockquote"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <Quote size={14} />
        </button>

        <span style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 4px' }} />

        {/* Link & Table */}
        <button
          type="button"
          onClick={openLinkModal}
          disabled={isPreview || disabled}
          title="Insert Link"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <Link2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => setShowTableModal(true)}
          disabled={isPreview || disabled}
          title="Insert Table"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
        >
          <TableIcon size={14} />
          <span style={{ fontSize: '11px', fontWeight: 600 }}>Table</span>
        </button>

        {/* Clear formatting */}
        <button
          type="button"
          onClick={handleClearFormatting}
          disabled={isPreview || disabled}
          title="Clear formatting on selection"
          className="toolbar-btn"
          style={{ padding: '5px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <Eraser size={14} />
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Toggle Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            title={isPreview ? 'Back to Editor' : 'Preview Post'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              background: isPreview ? '#1168d7' : '#e2e8f0',
              color: isPreview ? '#ffffff' : '#334155',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isPreview ? <Edit3 size={12} /> : <Eye size={12} />}
            <span>{isPreview ? 'Edit' : 'Preview'}</span>
          </button>
        </div>
      </div>

      {/* ── Editor Body or Live Preview ───────────────────────────────────────── */}
      {isPreview ? (
        <div
          className="rich-editor-preview"
          style={{
            minHeight,
            padding: '12px 14px',
            fontSize: '13.5px',
            lineHeight: 1.65,
            color: '#0f172a',
            background: '#ffffff',
          }}
        >
          {value.trim() ? (
            <div
              className="post-body-text"
              dangerouslySetInnerHTML={{ __html: parseRichText(value) }}
            />
          ) : (
            <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
              Nothing to preview. Enter text or tables above.
            </span>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={3}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            minHeight,
            padding: '10px 12px',
            fontSize: '13px',
            lineHeight: 1.5,
            fontFamily: 'inherit',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            color: '#0f172a',
            background: 'transparent',
          }}
        />
      )}

      {/* ── Insert Link Dialog Modal ─────────────────────────────────────────── */}
      {showLinkModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 99999,
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #cbd5e1',
            }}
          >
            <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>
              Insert Hyperlink
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Target URL (HTTPS or platform relative)
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                    setLinkError('');
                  }}
                  placeholder="https://example.com"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                {linkError && (
                  <span style={{ fontSize: '10.5px', color: '#ef4444', display: 'block', marginTop: '3px' }}>
                    {linkError}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#1168d7', color: '#ffffff', border: 'none', cursor: 'pointer' }}
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Insert Table Dialog Modal ────────────────────────────────────────── */}
      {showTableModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 99999,
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #cbd5e1',
            }}
          >
            <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>
              Insert Structured Rate / Commodity Table
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Columns (2 to 5)
                </label>
                <input
                  type="number"
                  min={2}
                  max={5}
                  value={tableCols}
                  onChange={(e) => {
                    const c = Math.max(2, Math.min(5, parseInt(e.target.value) || 2));
                    setTableCols(c);
                  }}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Data Rows (1 to 10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={tableRows}
                  onChange={(e) => {
                    const r = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                    setTableRows(r);
                  }}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Column Header Titles
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Array.from({ length: tableCols }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    value={colHeaders[i] || `Column ${i + 1}`}
                    onChange={(e) => {
                      const updated = [...colHeaders];
                      updated[i] = e.target.value;
                      setColHeaders(updated);
                    }}
                    placeholder={`Header ${i + 1}`}
                    style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#1168d7', color: '#ffffff', border: 'none', cursor: 'pointer' }}
              >
                Insert Table into Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
