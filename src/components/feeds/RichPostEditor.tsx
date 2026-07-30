"use client";

import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  List,
  ListOrdered,
  Table as TableIcon,
  Link as LinkIcon,
  Quote,
  Code,
  Smile,
  Paperclip,
  RotateCcw,
  RotateCw,
  Send,
  Loader2,
  X,
} from "lucide-react";

interface RichPostEditorProps {
  content: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isPosting?: boolean;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: readonly { label: string; value: string }[] | { label: string; value: string }[];
}

const COMMON_EMOJIS = ["🚢", "✈️", "🚛", "📦", "⚓", "🌐", "⚡", "👍", "🤝", "📈", "⚠️", "✅", "📍", "💡", "💰"];

export function RichPostEditor({
  content,
  onChange,
  onSubmit,
  isPosting = false,
  selectedCategory,
  onCategoryChange,
  categories,
}: RichPostEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History stack for Undo/Redo
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; size: string; type: string }[]>([]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;

  const updateContent = (newText: string) => {
    onChange(newText);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newText);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      if (prev !== undefined) onChange(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      if (next !== undefined) onChange(next);
    }
  };

  const insertTextAtCursor = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const el = textareaRef.current;
    if (!el) {
      updateContent(content + `${prefix}${placeholder}${suffix}`);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end) || placeholder;
    const before = content.substring(0, start);
    const after = content.substring(end);

    const replacement = `${prefix}${selected}${suffix}`;
    const nextVal = `${before}${replacement}${after}`;
    updateContent(nextVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const insertTable = () => {
    const tableTemplate = `\n| Port / Location | Mode | Rate (USD) | Transit Time |\n| --- | --- | --- | --- |\n| INNSA (Nhava Sheva) | Ocean FCL | $1,450 | 14 Days |\n| JEA (Jebel Ali) | Ocean FCL | $1,200 | 7 Days |\n`;
    insertTextAtCursor(tableTemplate);
  };

  const insertHyperlink = () => {
    const url = prompt("Enter hyperlink URL (e.g. https://example.com):");
    if (url) {
      insertTextAtCursor("[", `](${url})`, "Link Text");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setAttachments((prev) => [...prev, { name: file.name, size: `${sizeMb} MB`, type: file.type }]);
      updateContent(content + `\n\n[Attachment: ${file.name} (${sizeMb} MB)]`);
    });
  };

  return (
    <div className="fr8x-card p-3 bg-white border border-border space-y-2 text-left">
      {/* Editor Main Text Area */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => updateContent(e.target.value)}
        placeholder="Share an update, rate inquiry, or market intelligence with your network..."
        rows={4}
        className="w-full text-xs text-[var(--fr8x-jet)] placeholder:text-slate-400 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--fr8x-periwinkle)] focus:ring-1 focus:ring-[var(--fr8x-periwinkle)] resize-y min-h-[96px] font-sans leading-relaxed"
      />

      {/* Attachments Chip Bar */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {attachments.map((att, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-300 font-mono"
            >
              <Paperclip className="h-3 w-3 text-slate-500" />
              {att.name} ({att.size})
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-red-500 ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Formatting Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1 text-slate-600">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-700"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-700"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Headings */}
          <button
            type="button"
            onClick={() => insertTextAtCursor("# ", "", "Heading 1")}
            className="p-1.5 rounded hover:bg-slate-100 font-bold text-[11px]"
            title="Heading 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor("## ", "", "Heading 2")}
            className="p-1.5 rounded hover:bg-slate-100 font-bold text-[11px]"
            title="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Basic Formatting */}
          <button
            type="button"
            onClick={() => insertTextAtCursor("**", "**", "bold text")}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 font-bold"
            title="Bold (**text**)"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor("*", "*", "italic text")}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 italic"
            title="Italic (*text*)"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor("<u>", "</u>", "underlined text")}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 underline"
            title="Underline (<u>text</u>)"
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor("~~", "~~", "strikethrough text")}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 line-through"
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Alignment */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('<div align="left">\n', '\n</div>')}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
            title="Align Left"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('<div align="center">\n', '\n</div>')}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
            title="Align Center"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => insertTextAtCursor("\n- ", "", "List item")}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor("\n1. ", "", "Numbered item")}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
            title="Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>

          <span className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Table Insertion */}
          <button
            type="button"
            onClick={insertTable}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[10px] flex items-center gap-1 border border-slate-300"
            title="Insert Structured Data Table"
          >
            <TableIcon className="h-3.5 w-3.5 text-blue-600" /> Insert Table
          </button>

          {/* Hyperlink */}
          <button
            type="button"
            onClick={insertHyperlink}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
            title="Insert Hyperlink"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </button>

          {/* Blockquote & Code */}
          <button
            type="button"
            onClick={() => insertTextAtCursor("\n> ", "", "Quote text")}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
            title="Blockquote"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor("```\n", "\n```", "code block")}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
            title="Code Block"
          >
            <Code className="h-3.5 w-3.5" />
          </button>

          {/* Emojis & Attachments */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded hover:bg-slate-100 text-amber-600"
              title="Insert Emoji"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute left-0 bottom-full mb-1 z-30 p-2 bg-white border border-slate-200 shadow-lg rounded-lg flex flex-wrap gap-1 w-44">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      insertTextAtCursor(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 hover:bg-slate-100 text-sm rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
            title="Attach Document"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />
        </div>

        {/* Word count limit indicator */}
        <span
          className={`text-[10px] font-mono font-bold ${
            wordCount > 1000 ? "text-danger" : "text-slate-400"
          }`}
        >
          {wordCount} / 1000 words
        </span>
      </div>

      {/* Footer Category Selector & Post Button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="fr8x-input w-auto text-[10px] py-1 h-7 font-medium border-slate-300 bg-slate-50"
        >
          <option value="all">Select Category</option>
          {categories
            .filter((c) => c.value !== "all")
            .map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
        </select>

        <button
          onClick={onSubmit}
          disabled={isPosting || !content.trim() || wordCount > 1000}
          className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] text-white text-[11px] py-1 px-4 font-bold rounded flex items-center gap-1.5 shadow-sm disabled:opacity-40"
        >
          {isPosting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>POST UPDATE</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
