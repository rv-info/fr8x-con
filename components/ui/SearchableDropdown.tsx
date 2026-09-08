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

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return normalizedOptions;
    }
    const q = searchTerm.toLowerCase().trim();
    return normalizedOptions.filter((opt) => {
      return (
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
      );
    });
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
      className={`fr8x-searchable-dropdown-root ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
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
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minHeight: '38px',
          padding: '6px 12px',
          background: disabled ? '#f9fafb' : '#ffffff',
          border: isOpen ? '1px solid #0284c7' : '1px solid #d1d5db',
          borderRadius: '4px',
          boxShadow: isOpen ? '0 0 0 2px rgba(2, 132, 199, 0.15)' : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          boxSizing: 'border-box',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {selectedOption?.flag && <span style={{ fontSize: '15px', lineHeight: 1 }}>{selectedOption.flag}</span>}
          <span
            style={{
              fontSize: '13.5px',
              color: selectedOption ? '#0f172a' : '#64748b',
              fontWeight: selectedOption ? 500 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {selectedOption ? selectedOption.label : value || placeholder}
          </span>
          {selectedOption?.subLabel && (
            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>
              ({selectedOption.subLabel})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
          {value && !disabled && (
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
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                color: '#9ca3af',
                cursor: 'pointer',
                marginRight: '2px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={16}
            color="#475569"
            style={{
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </div>

      {/* Dropdown Popover Panel */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 99999,
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Search Input Box */}
          <div
            style={{
              padding: '8px',
              borderBottom: '1px solid #f1f5f9',
              background: '#ffffff',
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
                color="#94a3b8"
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
                  fontSize: '13px',
                  color: '#0f172a',
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0284c7')}
                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Scrollable Records List */}
          <div
            ref={listRef}
            style={{
              maxHeight: `${maxHeight}px`,
              overflowY: 'auto',
              padding: '4px 0',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f8fafc',
            }}
          >
            {/* Optional Default / Empty Select option if placeholder */}
            {!searchTerm && placeholder && (
              <div
                data-dropdown-item
                onClick={() => handleSelect('')}
                style={{
                  padding: '7px 12px',
                  fontSize: '13.5px',
                  color: !value ? '#0284c7' : '#64748b',
                  fontWeight: !value ? 600 : 400,
                  cursor: 'pointer',
                  background: !value ? '#f0f9ff' : 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = !value ? '#f0f9ff' : 'transparent')
                }
              >
                {placeholder}
              </div>
            )}

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
                      padding: '7px 12px',
                      fontSize: '13.5px',
                      color: isSelected ? '#0284c7' : '#1e293b',
                      fontWeight: isSelected ? 600 : 400,
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
                      {opt.flag && <span style={{ fontSize: '15px' }}>{opt.flag}</span>}
                      <span>{opt.label}</span>
                      {opt.subLabel && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
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
