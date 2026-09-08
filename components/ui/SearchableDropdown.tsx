'use client';

import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SearchableDropdownOption {
  value: string;
  label: string;
  subLabel?: string;
  flag?: string;
  badge?: string;
  group?: string;
}

export type DropdownOption = string | SearchableDropdownOption;

export interface SearchableDropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  className?: string;
  style?: React.CSSProperties;
  triggerStyle?: React.CSSProperties;
  triggerHeight?: number | string;
  showSubLabelInTrigger?: boolean;
  renderTriggerValue?: (selectedOption?: SearchableDropdownOption, value?: string) => React.ReactNode;
  popoverWidth?: number | string;
  popoverMinWidth?: number | string;
  showClear?: boolean;
  id?: string;
  name?: string;
  maxHeight?: number;
  emptyMessage?: string;
  autoSelectFirst?: boolean;
}

/**
 * Standardized Searchable Dropdown matching the FR8X UI/UX Specification.
 *
 * Features:
 * - Trigger box showing currently selected option with downward arrow.
 * - Absolute dropdown panel with an embedded top search input box ("Search").
 * - Instant live text filtering as the user types in the box.
 * - Scrollable records container with custom clean scrollbar.
 * - Full keyboard navigation (ArrowDown, ArrowUp, Enter, Escape).
 * - Click-outside dismissal.
 * - Mobile responsive positioning.
 */
export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select option…',
  searchPlaceholder = 'Search',
  disabled = false,
  allowCustom = false,
  className = '',
  style,
  triggerStyle,
  triggerHeight,
  showSubLabelInTrigger = false,
  renderTriggerValue,
  popoverWidth,
  popoverMinWidth,
  showClear = true,
  id,
  name,
  maxHeight = 220,
  emptyMessage = 'No matching records found',
}: SearchableDropdownProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options to object form
  const normalizedOptions = useMemo<SearchableDropdownOption[]>(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  // Filtered options based on search query with relevance ranking
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return normalizedOptions;
    }
    const q = searchTerm.toLowerCase().trim();

    const scored: { opt: SearchableDropdownOption; score: number }[] = [];

    for (const opt of normalizedOptions) {
      const labelLower = opt.label.toLowerCase();
      const valLower = opt.value.toLowerCase();
      const subLower = opt.subLabel ? opt.subLabel.toLowerCase() : '';

      let score = 0;

      if (labelLower === q || valLower === q) {
        score = 100; // Exact match
      } else if (labelLower.startsWith(q) || valLower.startsWith(q)) {
        score = 80; // Starts with query (e.g. "India" starts with "in")
      } else if (
        labelLower.split(/[\s,()/-]+/).some((w) => w.startsWith(q)) ||
        valLower.split(/[\s,()/-]+/).some((w) => w.startsWith(q))
      ) {
        score = 60; // Word within label starts with query
      } else if (labelLower.includes(q) || valLower.includes(q)) {
        score = 40; // Substring match
      } else if (subLower.startsWith(q)) {
        score = 30; // SubLabel starts with query
      } else if (subLower.includes(q)) {
        score = 20; // SubLabel contains query
      }

      if (score > 0) {
        scored.push({ opt, score });
      }
    }

    // Sort by score descending; if score equal, maintain original alphabetical ordering
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.opt);
  }, [normalizedOptions, searchTerm]);

  // Open dropdown and focus search input
  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchTerm('');
    setHighlightedIndex(0);
  };

  // Close dropdown
  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  // Focus search box whenever dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
    }
  }, [isOpen]);

  // Dismiss dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-dropdown-item]');
    const targetItem = items[highlightedIndex] as HTMLElement;
    if (targetItem) {
      const container = listRef.current;
      const top = targetItem.offsetTop;
      const bottom = top + targetItem.offsetHeight;
      if (top < container.scrollTop) {
        container.scrollTop = top;
      } else if (bottom > container.scrollTop + container.clientHeight) {
        container.scrollTop = bottom - container.clientHeight;
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (allowCustom && searchTerm.trim()) {
          handleSelect(searchTerm.trim());
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'Tab':
        handleClose();
        break;
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    handleClose();
  };

  return (
    <div
      ref={containerRef}
      className={`fr8x-searchable-dropdown-root ${className} ${isOpen ? 'dropdown-open' : ''}`}
      data-open={isOpen ? 'true' : 'false'}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
        zIndex: isOpen ? 10000 : 'auto',
        fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
        ...style,
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for standard form serialization */}
      {name && <input type="hidden" name={name} value={value || ''} />}

      {/* Trigger Box */}
      <div
        id={inputId}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${inputId}-listbox`}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: triggerHeight || '38px',
          minHeight: triggerHeight || '38px',
          padding: '0 10px',
          background: disabled ? '#f9fafb' : '#ffffff',
          border: isOpen ? '1px solid var(--brand, #1985a1)' : '1px solid var(--fr8x-outline, #c5c3c6)',
          borderRadius: '4px',
          boxShadow: isOpen ? '0 0 0 2px rgba(25, 133, 161, 0.15)' : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          boxSizing: 'border-box',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
          fontSize: '11pt',
          ...triggerStyle,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          {renderTriggerValue ? (
            renderTriggerValue(selectedOption, value)
          ) : (
            <>
              {selectedOption?.flag && <span style={{ fontSize: '13pt', lineHeight: 1, flexShrink: 0 }}>{selectedOption.flag}</span>}
              <span
                style={{
                  fontSize: '11pt',
                  fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
                  color: selectedOption ? 'var(--fr8x-text, #1e293b)' : 'var(--fr8x-muted, #64748b)',
                  fontWeight: selectedOption ? 500 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedOption ? selectedOption.label : value || placeholder}
              </span>
              {showSubLabelInTrigger && selectedOption?.subLabel && (
                <span style={{ fontSize: '9.5pt', color: '#94a3b8', marginLeft: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ({selectedOption.subLabel})
                </span>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '6px' }}>
          {showClear && value && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              title="Clear selection"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                color: '#9ca3af',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={15}
            color="#475569"
            style={{
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Dropdown Popover Panel */}
      {isOpen && (
        <div
          id={`${inputId}-listbox`}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: popoverWidth ? 'auto' : 0,
            width: popoverWidth || '100%',
            minWidth: popoverMinWidth || '100%',
            maxHeight: `${(maxHeight || 300) + 65}px`,
            background: '#ffffff',
            border: '1.5px solid #0284c7',
            borderRadius: '4px',
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.35), 0 8px 16px -4px rgba(0, 0, 0, 0.2)',
            zIndex: 99999,
            overflow: 'hidden',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Search Input Box */}
          <div
            style={{
              padding: '8px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={14}
                color="#475569"
                style={{
                  position: 'absolute',
                  left: '10px',
                  pointerEvents: 'none',
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                style={{
                  width: '100%',
                  height: '34px',
                  paddingLeft: '32px',
                  paddingRight: '10px',
                  fontSize: '11pt',
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#ffffff',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0284c7')}
                onBlur={(e) => (e.target.style.borderColor = '#94a3b8')}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Scrollable Records List */}
          <div
            ref={listRef}
            style={{
              maxHeight: `${maxHeight || 300}px`,
              minHeight: '140px',
              overflowY: 'auto',
              padding: '4px 0',
              scrollbarWidth: 'thin',
              scrollbarColor: '#94a3b8 #f1f5f9',
              flex: 1,
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    data-dropdown-item
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      fontSize: '11pt',
                      fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
                      color: isSelected ? '#0284c7' : '#1e293b',
                      fontWeight: isSelected ? 700 : 400,
                      cursor: 'pointer',
                      background: isHighlighted
                        ? '#f1f5f9'
                        : isSelected
                        ? '#f0f9ff'
                        : 'transparent',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {opt.flag && <span style={{ fontSize: '13pt', lineHeight: 1 }}>{opt.flag}</span>}
                      <span style={{ fontSize: '11pt' }}>{opt.label}</span>
                      {opt.subLabel && (
                        <span style={{ fontSize: '9.5pt', color: '#64748b' }}>
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={14} color="#0284c7" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#64748b',
                }}
              >
                <div>{emptyMessage}</div>
                {allowCustom && searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(searchTerm.trim())}
                    style={{
                      marginTop: '8px',
                      padding: '4px 10px',
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Use &ldquo;{searchTerm.trim()}&rdquo;
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
