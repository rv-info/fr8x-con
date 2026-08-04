"use client";

// FR8X-CON PostComposer — LinkedIn/X-Grade
// Features: real image/file upload with preview, character counter ring,
// hashtag detection, mention detection, post type selector, keyboard shortcuts.

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  KeyboardEvent,
} from "react";
import {
  ImagePlus,
  Paperclip,
  Smile,
  Send,
  Loader2,
  X,
  AlertCircle,
  ChevronDown,
  Globe,
  Users,
  Network,
  Bold,
  Italic,
  List,
  AtSign,
  Hash,
} from "lucide-react";
import { CharacterRing } from "@/components/ui/CharacterRing";
import { uploadFileWithProgress } from "@/lib/firebase/storage";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS = 3000;
const MAX_IMAGES = 4;
const COMMON_EMOJIS = [
  "🚢","✈️","🚛","📦","⚓","🌐","⚡","👍","🤝","📈",
  "⚠️","✅","📍","💡","💰","🔥","🎯","🌊","🏗️","⛽",
];

const POST_TYPES = [
  { value: "update",    label: "Industry Update",   color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "rate",      label: "Rate Alert",         color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "market",    label: "Market Intel",       color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "rfq",       label: "RFQ Broadcast",      color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "insight",   label: "Logistics Insight",  color: "bg-slate-50 text-slate-700 border-slate-200" },
  // Note: "code block" type removed — not suitable for this platform
] as const;

const AUDIENCE_OPTIONS = [
  { value: "everyone",     label: "Everyone",         icon: Globe },
  { value: "connections",  label: "Connections only", icon: Users },
  { value: "network",      label: "FR8X Network",     icon: Network },
] as const;

export type PostType = (typeof POST_TYPES)[number]["value"];
export type AudienceType = (typeof AUDIENCE_OPTIONS)[number]["value"];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MediaUpload {
  file: File;
  previewUrl: string;
  uploadProgress: number;   // 0-100
  downloadUrl: string | null;
  error: string | null;
}

export interface PostComposerProps {
  content: string;
  onChange: (val: string) => void;
  onSubmit: (opts: {
    mediaUrls: string[];
    postType: PostType;
    audience: AudienceType;
  }) => void;
  isPosting?: boolean;
  errorMessage?: string | null;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: readonly { label: string; value: string }[] | { label: string; value: string }[];
  userId: string; // needed to build storage path
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PostComposer({
  content,
  onChange,
  onSubmit,
  isPosting = false,
  errorMessage,
  selectedCategory,
  onCategoryChange,
  categories,
  userId,
}: PostComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Note: fileInputRef removed — document attachments not allowed in this version

  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([]);
  const [postType, setPostType] = useState<PostType>("update");
  const [audience, setAudience] = useState<AudienceType>("everyone");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPostTypeMenu, setShowPostTypeMenu] = useState(false);
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hashtagSuggestions] = useState<string[]>([]);

  const charCount = content.length;
  const remaining = MAX_CHARS - charCount;
  const isOverLimit = remaining < 0;
  const canSubmit = content.trim().length > 0 && !isPosting && !isOverLimit;
  const allUploaded = mediaUploads.every(
    (m) => m.downloadUrl !== null || m.error !== null
  );

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, isFocused ? 140 : 88) + "px";
  }, [content, isFocused]);

  // ── Image Upload Handler ──────────────────────────────────────────────────

  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const remaining = MAX_IMAGES - mediaUploads.length;
      const toAdd = files.slice(0, remaining);

      const newUploads: MediaUpload[] = toAdd.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        uploadProgress: 0,
        downloadUrl: null,
        error: null,
      }));

      setMediaUploads((prev) => [...prev, ...newUploads]);

      // Upload each file to Firebase Storage
      toAdd.forEach(async (file, localIdx) => {
        const globalIdx = mediaUploads.length + localIdx;
        const storagePath = `posts/${userId}/media/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        try {
          const url = await uploadFileWithProgress(
            storagePath,
            file,
            (progress) => {
              setMediaUploads((prev) =>
                prev.map((m, i) =>
                  i === globalIdx ? { ...m, uploadProgress: progress } : m
                )
              );
            }
          );
          setMediaUploads((prev) =>
            prev.map((m, i) =>
              i === globalIdx
                ? { ...m, downloadUrl: url, uploadProgress: 100 }
                : m
            )
          );
        } catch {
          setMediaUploads((prev) =>
            prev.map((m, i) =>
              i === globalIdx
                ? { ...m, error: "Upload failed. Try again.", uploadProgress: 0 }
                : m
            )
          );
        }
      });

      // Reset input
      if (imageInputRef.current) imageInputRef.current.value = "";
    },
    [mediaUploads, userId]
  );

  const removeMedia = useCallback((idx: number) => {
    setMediaUploads((prev) => {
      const m = prev[idx];
      if (m?.previewUrl) URL.revokeObjectURL(m.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  // ── Text formatting helpers ───────────────────────────────────────────────

  const insertAtCursor = useCallback(
    (prefix: string, suffix = "", placeholder = "") => {
      const el = textareaRef.current;
      if (!el) {
        onChange(content + prefix + placeholder + suffix);
        return;
      }
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = content.substring(start, end) || placeholder;
      const newVal =
        content.substring(0, start) +
        prefix +
        selected +
        suffix +
        content.substring(end);
      onChange(newVal);
      setTimeout(() => {
        el.focus();
        const cursor = start + prefix.length + selected.length;
        el.setSelectionRange(cursor, cursor);
      }, 0);
    },
    [content, onChange]
  );

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      insertAtCursor("**", "**", "bold text");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      insertAtCursor("*", "*", "italic text");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    const readyUrls = mediaUploads
      .filter((m) => m.downloadUrl)
      .map((m) => m.downloadUrl as string);
    onSubmit({ mediaUrls: readyUrls, postType, audience });
  }, [mediaUploads, onSubmit, postType, audience]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const activePostType = POST_TYPES.find((p) => p.value === postType)!;
  const activeAudience = AUDIENCE_OPTIONS.find((a) => a.value === audience)!;
  const AudienceIcon = activeAudience.icon;

  // ── Media Grid Layout ─────────────────────────────────────────────────────

  const mediaGridClass =
    mediaUploads.length === 1
      ? "grid-cols-1"
      : mediaUploads.length === 2
      ? "grid-cols-2"
      : "grid-cols-2";

  return (
    <div
      className={`bg-[#C5E7E2] rounded-2xl border transition-all duration-200 ${
        isFocused
          ? "border-[#A594F9] ring-2 ring-[#A594F9]/40"
          : "border-[#746D75]/40"
      }`}
    >
      {/* ── Error Banner ────────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="flex items-center gap-2 bg-rose-50 border-b border-rose-200 text-rose-700 text-[11px] px-4 py-2.5 rounded-t-2xl">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* ── Post Type Selector ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPostTypeMenu((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${activePostType.color}`}
            >
              {activePostType.label}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showPostTypeMenu && (
              <div className="absolute top-full left-0 mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-40">
                {POST_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => {
                      setPostType(pt.value);
                      setShowPostTypeMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[10px] font-semibold hover:bg-slate-50 transition-colors ${
                      pt.value === postType ? "bg-slate-50" : ""
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Audience */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAudienceMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <AudienceIcon className="h-3 w-3" />
              {activeAudience.label}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showAudienceMenu && (
              <div className="absolute top-full left-0 mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-44">
                {AUDIENCE_OPTIONS.map((ao) => {
                  const Icon = ao.icon;
                  return (
                    <button
                      key={ao.value}
                      type="button"
                      onClick={() => {
                        setAudience(ao.value);
                        setShowAudienceMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[10px] font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        ao.value === audience ? "bg-slate-50" : ""
                      }`}
                    >
                      <Icon className="h-3 w-3 text-slate-500" />
                      {ao.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Textarea (Frozen Water #C5E7E2 Background) ─────────────────── */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Share a rate update, market insight, RFQ, or industry news with your network…"
          rows={isFocused ? 5 : 3}
          className={`w-full text-[12.5px] bg-[#C5E7E2] text-[#253031] placeholder:text-[#746D75] resize-none focus:outline-none leading-relaxed font-sans transition-all duration-200 ${
            isOverLimit ? "text-red-600" : ""
          }`}
          style={{ minHeight: isFocused ? 140 : 72 }}
        />

        {/* ── Media Preview Grid ─────────────────────────────────────────── */}
        {mediaUploads.length > 0 && (
          <div className={`grid gap-2 ${mediaGridClass}`}>
            {mediaUploads.map((m, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden bg-slate-100 aspect-video border border-slate-200">
                {m.file.type.startsWith("image/") ? (
                  <img
                    src={m.previewUrl}
                    alt={m.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-2 text-center">
                    <Paperclip className="h-5 w-5 text-slate-400 mb-1" />
                    <span className="text-[9px] text-slate-600 font-mono truncate max-w-full">
                      {m.file.name}
                    </span>
                  </div>
                )}

                {/* Upload progress overlay */}
                {m.uploadProgress < 100 && !m.error && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="w-16 h-1.5 bg-white/30 rounded-full mx-auto mb-1">
                        <div
                          className="h-full bg-white rounded-full transition-all"
                          style={{ width: `${m.uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold">
                        {Math.round(m.uploadProgress)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Error overlay */}
                {m.error && (
                  <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center p-2">
                    <span className="text-white text-[9px] text-center">
                      {m.error}
                    </span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Emoji Picker ───────────────────────────────────────────────── */}
        {showEmojiPicker && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-wrap gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  insertAtCursor(emoji);
                  setShowEmojiPicker(false);
                }}
                className="p-1.5 hover:bg-white rounded-lg text-base transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* ── Hashtag suggestions ────────────────────────────────────────── */}
        {hashtagSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hashtagSuggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertAtCursor(`#${tag} `)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--fr8x-mist)] text-[var(--fr8x-periwinkle)] font-semibold border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* ── Toolbar + Post Button ──────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
          {/* Left: formatting + media tools */}
          <div className="flex items-center gap-0.5">
            {/* Image upload */}
            <button
              type="button"
              disabled={mediaUploads.length >= MAX_IMAGES}
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[var(--fr8x-periwinkle)] transition-colors disabled:opacity-30"
              title={`Add photo/video (${mediaUploads.length}/${MAX_IMAGES})`}
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Document attachments are not supported in feed posts */}

            {/* Emoji */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${
                showEmojiPicker ? "text-amber-500 bg-amber-50" : "text-slate-500"
              }`}
              title="Insert emoji"
            >
              <Smile className="h-4 w-4" />
            </button>

            <span className="w-px h-4 bg-slate-200 mx-1" />

            {/* Bold */}
            <button
              type="button"
              onClick={() => insertAtCursor("**", "**", "bold")}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors font-bold text-[11px]"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => insertAtCursor("*", "*", "italic")}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors italic text-[11px]"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>

            {/* List */}
            <button
              type="button"
              onClick={() => insertAtCursor("\n• ", "", "list item")}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="Bullet list"
            >
              <List className="h-3.5 w-3.5" />
            </button>

            {/* Mention */}
            <button
              type="button"
              onClick={() => insertAtCursor("@", "", "username")}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors"
              title="Mention someone"
            >
              <AtSign className="h-3.5 w-3.5" />
            </button>

            {/* Hashtag */}
            <button
              type="button"
              onClick={() => insertAtCursor("#", "", "topic")}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[var(--fr8x-periwinkle)] transition-colors"
              title="Add hashtag"
            >
              <Hash className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right: category + ring + post button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Category select */}
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="text-[10px] h-7 py-0 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:border-[var(--fr8x-periwinkle)] hidden sm:block"
            >
              <option value="all">Category</option>
              {categories
                .filter((c) => c.value !== "all")
                .map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
            </select>

            {/* Character counter ring */}
            {(charCount > MAX_CHARS * 0.7 || isOverLimit) && (
              <CharacterRing current={charCount} max={MAX_CHARS} />
            )}

            {/* Post button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || !allUploaded}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--fr8x-periwinkle)] hover:bg-[#3ABFF0] text-white text-[11px] font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isPosting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Posting…</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        {isFocused && (
          <p className="text-[9px] text-slate-400 text-right -mt-1">
            Ctrl+Enter to post · Ctrl+B bold · Ctrl+I italic
          </p>
        )}
      </div>
    </div>
  );
}
