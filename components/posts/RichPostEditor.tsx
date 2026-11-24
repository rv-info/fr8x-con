'use client';

/**
 * components/posts/RichPostEditor.tsx
 * Professional Rich Text & Structured Table Editor for FR8X Feed Posts.
 * 
 * Capabilities:
 * - Bold, italic, underline, strikethrough
 * - Headings (H1, H2, H3) and size control
 * - Bulleted & numbered lists, blockquotes
 * - Safe hyperlinks with protocol validation
 * - Genuine interactive structured table editor with editable individual cell <input>s
 * - Live row & column controls: ➕ Add Row, 🗑️ Delete Row, ➕ Add Col, ➖ Delete Col, 🧹 Clear Cells, ❌ Remove Table
 * - Two-way markdown table synchronization with responsive mobile horizontal scrolling
 * - Undo / Redo history stack with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
 * - Clear formatting
 * - Live preview matching the published post output across desktop & mobile
 */

import React, { useState, useRef, useCallback } from 'react';
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
  Minus,
  RotateCcw,
  X,
  Check,
} from 'lucide-react';
import { parseRichText } from '@/lib/utils';
import { sanitizeRichTextPost } from '@/lib/security/input-validation';

export interface ParsedTableData {
  before: string;
  headers: string[];
  rows: string[][];
  after: string;
}

/**
 * Robust markdown table parser: extracts text before the table,
 * structured headers, structured rows, and text after the table.
 */
export function parseMarkdownTableFromPost(text: string): ParsedTableData | null {
  if (!text || !text.includes('|')) return null;

  const lines = text.split('\n');
  let headerIndex = -1;
  let separatorIndex = -1;

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1].trim();

    // Line has pipes and is followed by a separator line like | :--- | :--- |
    if (line.includes('|') && (line.startsWith('|') || line.endsWith('|'))) {
      if (nextLine.includes('|') && /^\s*\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?\s*$/.test(nextLine)) {
        headerIndex = i;
        separatorIndex = i + 1;
        break;
      }
    }
  }

  if (headerIndex === -1) return null;

  const splitCells = (line: string): string[] => {
    let raw = line.trim();
    if (raw.startsWith('|')) raw = raw.slice(1);
    if (raw.endsWith('|')) raw = raw.slice(0, -1);
    return raw.split('|').map((c) => c.trim());
  };

  const headers = splitCells(lines[headerIndex]);
  if (headers.length < 2) return null;

  let currentIndex = separatorIndex + 1;
  const dataRows: string[][] = [];

  while (currentIndex < lines.length) {
    const line = lines[currentIndex].trim();
    if (!line || !line.includes('|')) break;
    const cells = splitCells(line);
    while (cells.length < headers.length) cells.push('');
    dataRows.push(cells.slice(0, headers.length));
    currentIndex++;
  }

  const tableEnd = currentIndex;
  const before = lines.slice(0, headerIndex).join('\n');
  const after = lines.slice(tableEnd).join('\n');

  return {
    before,
    headers,
    rows: dataRows.length > 0 ? dataRows : [headers.map(() => '')],
    after,
  };
}

/**
 * Serializes headers and 2D row array into standard CommonMark/GFM markdown table.
 */
export function serializeMarkdownTable(headers: string[], rows: string[][]): string {
  if (!headers || headers.length === 0) return '';
  const cleanHeaders = headers.map((h) => (h || '').trim() || 'Column');
  const headerLine = '| ' + cleanHeaders.join(' | ') + ' |';
  const sepLine = '| ' + cleanHeaders.map(() => ':---').join(' | ') + ' |';
  const rowLines = (rows.length > 0 ? rows : [cleanHeaders.map(() => '')]).map((row) => {
    const padded = cleanHeaders.map((_, i) => (row[i] || '').trim());
    return '| ' + padded.join(' | ') + ' |';
  });
  return [headerLine, sepLine, ...rowLines].join('\n');
}

/**
 * Recombines before text, markdown table, and after text into a single markdown string.
 */
export function serializePostWithTable(
  before: string,
  headers: string[],
  rows: string[][],
  after: string
): string {
  const tableMd = serializeMarkdownTable(headers, rows);
  const parts: string[] = [];
  if (before && before.trim()) parts.push(before.trim());
  if (tableMd.trim()) parts.push(tableMd.trim());
  if (after && after.trim()) parts.push(after.trim());
  return parts.join('\n\n');
}

/**
 * Serializes post when table is removed.
 */
export function serializeWithoutTable(before: string, after: string): string {
  const parts: string[] = [];
  if (before && before.trim()) parts.push(before.trim());
  if (after && after.trim()) parts.push(after.trim());
  return parts.join('\n\n');
}

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
  const textareaBeforeRef = useRef<HTMLTextAreaElement>(null);
  const textareaAfterRef = useRef<HTMLTextAreaElement>(null);

  const [isPreview, setIsPreview] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Link modal state
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');

  // Table modal state (defaults tailored for logistics & freight)
  const [tableCols, setTableCols] = useState(3);
  const [tableRows, setTableRows] = useState(2);
  const [colHeaders, setColHeaders] = useState<string[]>([
    'Port / Terminal',
    'Carrier / Line',
    'Rate / Transit',
    'Equipment / Validity',
    'Remarks',
  ]);

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

  // Parse structured table from current markdown value
  const parsedTable = parseMarkdownTableFromPost(value);

  // Active textarea helper
  const getActiveTextarea = () => {
    if (parsedTable) {
      if (document.activeElement === textareaAfterRef.current) return textareaAfterRef.current;
      return textareaBeforeRef.current || textareaRef.current;
    }
    return textareaRef.current;
  };

  // Helper to wrap or insert text at cursor selection
  const applyWrap = (before: string, after: string = '', defaultText: string = '') => {
    const el = getActiveTextarea();
    if (!el) {
      handleTextChange((value ? value + '\n' : '') + before + defaultText + after);
      return;
    }

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

    if (parsedTable) {
      if (el === textareaAfterRef.current) {
        updateAfter(nextVal);
      } else {
        updateBefore(nextVal);
      }
    } else {
      handleTextChange(nextVal);
    }

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  // Helper to insert line prefix (e.g. for headings, lists, blockquotes)
  const applyLinePrefix = (prefix: string) => {
    const el = getActiveTextarea();
    if (!el) {
      handleTextChange(prefix + value);
      return;
    }

    const start = el.selectionStart;
    const currentVal = el.value;
    const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1;

    const nextVal =
      currentVal.substring(0, lineStart) +
      prefix +
      currentVal.substring(lineStart);

    if (parsedTable) {
      if (el === textareaAfterRef.current) {
        updateAfter(nextVal);
      } else {
        updateBefore(nextVal);
      }
    } else {
      handleTextChange(nextVal);
    }

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  // Clear formatting on selection
  const handleClearFormatting = () => {
    const el = getActiveTextarea();
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
    if (parsedTable) {
      if (el === textareaAfterRef.current) {
        updateAfter(nextVal);
      } else {
        updateBefore(nextVal);
      }
    } else {
      handleTextChange(nextVal);
    }
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
    const el = getActiveTextarea();
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

  // ── Interactive Table Synchronizers ──────────────────────────────────────────
  const updateBefore = (newBefore: string) => {
    if (!parsedTable) return;
    const next = serializePostWithTable(newBefore, parsedTable.headers, parsedTable.rows, parsedTable.after);
    handleTextChange(next);
  };

  const updateAfter = (newAfter: string) => {
    if (!parsedTable) return;
    const next = serializePostWithTable(parsedTable.before, parsedTable.headers, parsedTable.rows, newAfter);
    handleTextChange(next);
  };

  const updateHeader = (colIndex: number, newTitle: string) => {
    if (!parsedTable) return;
    const nextHeaders = [...parsedTable.headers];
    nextHeaders[colIndex] = newTitle;
    const next = serializePostWithTable(parsedTable.before, nextHeaders, parsedTable.rows, parsedTable.after);
    handleTextChange(next);
  };

  const updateCell = (rowIndex: number, colIndex: number, newVal: string) => {
    if (!parsedTable) return;
    const nextRows = parsedTable.rows.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      const updatedRow = [...row];
      updatedRow[colIndex] = newVal;
      return updatedRow;
    });
    const next = serializePostWithTable(parsedTable.before, parsedTable.headers, nextRows, parsedTable.after);
    handleTextChange(next);
  };

  const handleAddRow = () => {
    if (!parsedTable) return;
    const newRow = parsedTable.headers.map(() => '');
    const nextRows = [...parsedTable.rows, newRow];
    const next = serializePostWithTable(parsedTable.before, parsedTable.headers, nextRows, parsedTable.after);
    handleTextChange(next);
  };

  const handleDeleteRow = (targetIndex?: number) => {
    if (!parsedTable || parsedTable.rows.length <= 1) return;
    let nextRows = [...parsedTable.rows];
    if (typeof targetIndex === 'number') {
      nextRows.splice(targetIndex, 1);
    } else {
      nextRows.pop();
    }
    const next = serializePostWithTable(parsedTable.before, parsedTable.headers, nextRows, parsedTable.after);
    handleTextChange(next);
  };

  const handleAddCol = () => {
    if (!parsedTable || parsedTable.headers.length >= 5) return;
    const newColNum = parsedTable.headers.length + 1;
    const nextHeaders = [...parsedTable.headers, `Column ${newColNum}`];
    const nextRows = parsedTable.rows.map((row) => [...row, '']);
    const next = serializePostWithTable(parsedTable.before, nextHeaders, nextRows, parsedTable.after);
    handleTextChange(next);
  };

  const handleDeleteCol = () => {
    if (!parsedTable || parsedTable.headers.length <= 2) return;
    const nextHeaders = parsedTable.headers.slice(0, -1);
    const nextRows = parsedTable.rows.map((row) => row.slice(0, -1));
    const next = serializePostWithTable(parsedTable.before, nextHeaders, nextRows, parsedTable.after);
    handleTextChange(next);
  };

  const handleClearCells = () => {
    if (!parsedTable) return;
    const nextRows = parsedTable.rows.map((row) => row.map(() => ''));
    const next = serializePostWithTable(parsedTable.before, parsedTable.headers, nextRows, parsedTable.after);
    handleTextChange(next);
  };

  const handleRemoveTable = () => {
    if (!parsedTable) return;
    const next = serializeWithoutTable(parsedTable.before, parsedTable.after);
    handleTextChange(next);
  };

  // Insert Table confirmation from modal
  const handleInsertTable = () => {
    const headers = colHeaders.slice(0, tableCols);
    while (headers.length < tableCols) {
      headers.push(`Column ${headers.length + 1}`);
    }
    const initialRows = Array.from({ length: tableRows }, () =>
      headers.map(() => '')
    );
    const tableMd = serializeMarkdownTable(headers, initialRows);

    if (parsedTable) {
      const next = serializePostWithTable(parsedTable.before, headers, initialRows, parsedTable.after);
      handleTextChange(next);
    } else {
      const trimmed = value.trim();
      const next = trimmed ? `${trimmed}\n\n${tableMd}` : tableMd;
      handleTextChange(next);
    }
    setShowTableModal(false);
  };

  return (
    <div
      className="rich-post-editor-container"
      style={{
        border: '1px solid #D9E0E8',
        borderRadius: '8px',
        background: '#FFFFFF',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(23, 43, 43, 0.04)',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* ── Toolbar ───────────────────────────────────────────────────────────── */}
      <div
        className="rich-editor-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          padding: '6px 10px',
          background: '#F8FAF9',
          borderBottom: '1px solid #F4F6F8',
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

        <span style={{ width: '1px', height: '18px', background: '#D9E0E8', margin: '0 4px' }} />

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

        <span style={{ width: '1px', height: '18px', background: '#D9E0E8', margin: '0 4px' }} />

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

        <span style={{ width: '1px', height: '18px', background: '#D9E0E8', margin: '0 4px' }} />

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

        <span style={{ width: '1px', height: '18px', background: '#D9E0E8', margin: '0 4px' }} />

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
          title={parsedTable ? 'Edit Table Settings' : 'Insert Structured Table'}
          className="toolbar-btn"
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: parsedTable ? '1px solid #075B5B' : '1px solid transparent',
            background: parsedTable ? '#F4F6F8' : 'transparent',
            color: parsedTable ? '#075B5B' : '#172B45',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
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

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Toggle Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            title={isPreview ? 'Back to Editor' : 'Preview Post Output'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 700,
              background: isPreview ? '#075B5B' : '#F4F6F8',
              color: isPreview ? '#FFFFFF' : '#075B5B',
              border: '1px solid #B8D5C8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
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
            padding: '14px 16px',
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#172B45',
            background: '#FFFFFF',
            fontFamily: 'Calibri Light, Calibri, sans-serif',
          }}
        >
          {value.trim() ? (
            <div
              className="post-body-text"
              dangerouslySetInnerHTML={{ __html: parseRichText(value) }}
            />
          ) : (
            <span style={{ color: '#526174', fontStyle: 'italic', fontSize: '12px' }}>
              Nothing to preview. Enter text or insert tables using the toolbar above.
            </span>
          )}
        </div>
      ) : parsedTable ? (
        /* ── Structured Interactive Table + Surrounding Text Mode ──────────────── */
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Top text before table */}
          <textarea
            ref={textareaBeforeRef}
            value={parsedTable.before}
            onChange={(e) => updateBefore(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: '44px',
              padding: '6px 8px',
              fontSize: '13px',
              lineHeight: 1.5,
              fontFamily: 'Calibri Light, Calibri, sans-serif',
              border: '1px solid transparent',
              outline: 'none',
              resize: 'vertical',
              color: '#172B45',
              background: 'transparent',
              borderRadius: '4px',
            }}
          />

          {/* ── The Genuine Editable Table Component ───────────────────────────── */}
          <div
            className="fr8x-interactive-table-card"
            style={{
              border: '1px solid #D9E0E8',
              borderRadius: '8px',
              background: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(23, 43, 43, 0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Table Control Header Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#F1F5F3',
                borderBottom: '1px solid #D9E0E8',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TableIcon size={14} color="#075B5B" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#075B5B' }}>
                  Structured Rate / Commodity Table
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    background: '#F4F6F8',
                    color: '#075B5B',
                    border: '1px solid #B8D5C8',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {parsedTable.headers.length} Cols × {parsedTable.rows.length} Rows
                </span>
              </div>

              {/* Working Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleAddRow}
                  title="Add Row to table"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    border: '1px solid #D9E0E8',
                    color: '#172B45',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={11} color="#075B5B" /> Add Row
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRow()}
                  disabled={parsedTable.rows.length <= 1}
                  title="Delete bottom row"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    border: '1px solid #D9E0E8',
                    color: parsedTable.rows.length <= 1 ? '#94a3b8' : '#C0392B',
                    cursor: parsedTable.rows.length <= 1 ? 'not-allowed' : 'pointer',
                    opacity: parsedTable.rows.length <= 1 ? 0.5 : 1,
                  }}
                >
                  <Trash2 size={11} /> Del Row
                </button>
                <button
                  type="button"
                  onClick={handleAddCol}
                  disabled={parsedTable.headers.length >= 5}
                  title="Add column (max 5)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    border: '1px solid #D9E0E8',
                    color: '#172B45',
                    cursor: parsedTable.headers.length >= 5 ? 'not-allowed' : 'pointer',
                    opacity: parsedTable.headers.length >= 5 ? 0.5 : 1,
                  }}
                >
                  <Plus size={11} color="#075B5B" /> Add Col
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCol}
                  disabled={parsedTable.headers.length <= 2}
                  title="Delete rightmost column (min 2)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    border: '1px solid #D9E0E8',
                    color: parsedTable.headers.length <= 2 ? '#94a3b8' : '#C0392B',
                    cursor: parsedTable.headers.length <= 2 ? 'not-allowed' : 'pointer',
                    opacity: parsedTable.headers.length <= 2 ? 0.5 : 1,
                  }}
                >
                  <Minus size={11} /> Del Col
                </button>
                <button
                  type="button"
                  onClick={handleClearCells}
                  title="Clear all cell contents"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    border: '1px solid #D9E0E8',
                    color: '#526174',
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={11} /> Clear
                </button>
                <button
                  type="button"
                  onClick={handleRemoveTable}
                  title="Remove this table completely"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    background: '#FFF5F5',
                    border: '1px solid #FED7D7',
                    color: '#C0392B',
                    cursor: 'pointer',
                  }}
                >
                  <X size={11} /> Remove
                </button>
              </div>
            </div>

            {/* Responsive Table Scroll Container */}
            <div
              style={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '8px 10px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <table
                style={{
                  width: '100%',
                  minWidth: '440px',
                  borderCollapse: 'separate',
                  borderSpacing: '4px',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        width: '28px',
                        fontSize: '10px',
                        color: '#526174',
                        textAlign: 'center',
                        fontWeight: 600,
                        padding: '4px 0',
                      }}
                    >
                      #
                    </th>
                    {parsedTable.headers.map((header, cIdx) => (
                      <th key={cIdx} style={{ padding: '2px' }}>
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => updateHeader(cIdx, e.target.value)}
                          placeholder={`Header ${cIdx + 1}`}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '6px 8px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#075B5B',
                            background: '#F4F6F8',
                            border: '1px solid #B8D5C8',
                            borderRadius: '4px',
                            outline: 'none',
                            fontFamily: 'Calibri, sans-serif',
                          }}
                        />
                      </th>
                    ))}
                    <th style={{ width: '28px' }} />
                  </tr>
                </thead>
                <tbody>
                  {parsedTable.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td
                        style={{
                          fontSize: '11px',
                          color: '#526174',
                          textAlign: 'center',
                          fontWeight: 500,
                        }}
                      >
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '2px' }}>
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                            placeholder="Enter data..."
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '6px 8px',
                              fontSize: '12px',
                              color: '#172B45',
                              background: '#FFFFFF',
                              border: '1px solid #D9E0E8',
                              borderRadius: '4px',
                              outline: 'none',
                              fontFamily: 'Calibri Light, Calibri, sans-serif',
                              transition: 'border-color 0.15s ease',
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#075B5B';
                              e.currentTarget.style.boxShadow = '0 0 0 1px #075B5B';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#D9E0E8';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', padding: '2px' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(rIdx)}
                          disabled={parsedTable.rows.length <= 1}
                          title="Delete this row"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '4px',
                            cursor: parsedTable.rows.length <= 1 ? 'default' : 'pointer',
                            opacity: parsedTable.rows.length <= 1 ? 0.3 : 0.7,
                            color: '#C0392B',
                            borderRadius: '3px',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom text after table */}
          <textarea
            ref={textareaAfterRef}
            value={parsedTable.after}
            onChange={(e) => updateAfter(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add concluding remarks, notes, or terms & conditions..."
            disabled={disabled}
            rows={2}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: '44px',
              padding: '6px 8px',
              fontSize: '13px',
              lineHeight: 1.5,
              fontFamily: 'Calibri Light, Calibri, sans-serif',
              border: '1px solid transparent',
              outline: 'none',
              resize: 'vertical',
              color: '#172B45',
              background: 'transparent',
              borderRadius: '4px',
            }}
          />
        </div>
      ) : (
        /* ── Standard Textarea Mode (When no table in post) ────────────────────── */
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
            fontFamily: 'Calibri Light, Calibri, sans-serif',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            color: '#172B45',
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
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(23, 43, 43, 0.2)',
              border: '1px solid #D9E0E8',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#172B45', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link2 size={16} color="#075B5B" /> Insert Hyperlink
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="close-red-box sm"
                title="Close"
              >
                <X size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#526174', display: 'block', marginBottom: '4px' }}>
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '5px', border: '1px solid #D9E0E8', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#526174', display: 'block', marginBottom: '4px' }}>
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
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '5px', border: '1px solid #D9E0E8', outline: 'none' }}
                />
                {linkError && (
                  <span style={{ fontSize: '10.5px', color: '#C0392B', display: 'block', marginTop: '3px' }}>
                    {linkError}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                style={{ padding: '6px 12px', borderRadius: '5px', fontSize: '12px', fontWeight: 600, background: '#F1F5F3', border: '1px solid #D9E0E8', color: '#172B45', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                style={{ padding: '6px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 600, background: '#075B5B', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
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
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(23, 43, 43, 0.2)',
              border: '1px solid #D9E0E8',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#172B45', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TableIcon size={16} color="#075B5B" /> Insert Structured Rate / Commodity Table
              </h4>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="close-red-box sm"
                title="Close"
              >
                <X size={12} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#526174', display: 'block', marginBottom: '4px' }}>
                  Columns (2 to 5)
                </label>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[2, 3, 4, 5].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTableCols(c)}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '5px',
                        border: tableCols === c ? '1.5px solid #075B5B' : '1px solid #D9E0E8',
                        background: tableCols === c ? '#F4F6F8' : '#FFFFFF',
                        color: tableCols === c ? '#075B5B' : '#172B45',
                        cursor: 'pointer',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#526174', display: 'block', marginBottom: '4px' }}>
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
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '5px',
                    border: '1px solid #D9E0E8',
                    outline: 'none',
                    boxSizing: 'border-box',
                    height: '32px',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#526174', display: 'block', marginBottom: '6px' }}>
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
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '5px',
                      border: '1px solid #D9E0E8',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#F1F5F3',
                  border: '1px solid #D9E0E8',
                  color: '#172B45',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                style={{
                  padding: '6px 16px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#075B5B',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Check size={13} /> Insert Table into Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
