'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { searchPorts, searchCarriers, formatPort, formatCarrier, MasterPortEntry, MasterCarrierEntry } from '@/lib/master-data';
import { Search } from 'lucide-react';

// ── Port / Location Search ─────────────────────────────────────────────────
interface PortSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export function PortSearch({ value, onChange, placeholder = 'Type 3 letters…', style, inputStyle }: PortSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<MasterPortEntry[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => { setQuery(value); }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (v.length >= 2) {
      const found = searchPorts(v);
      setResults(found);
      setOpen(found.length > 0);
    } else {
      setResults([]);
      setOpen(false);
    }
    onChange(v); // propagate raw text too
  };

  const handleSelect = useCallback((port: MasterPortEntry) => {
    const display = formatPort(port);
    setQuery(display);
    onChange(display);
    setOpen(false);
    setResults([]);
  }, [onChange]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative', ...style }}>
      <div style={{ position: 'relative' }}>
        <Search size={11} style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mut)', pointerEvents: 'none' }} />
        <input
          className="input"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          style={{ paddingLeft: '22px', fontSize: '11px', height: '32px', ...inputStyle }}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxHeight: '220px',
          overflowY: 'auto',
          marginTop: '2px',
        }}>
          {results.map((port) => (
            <div
              key={port.locode}
              onMouseDown={() => handleSelect(port)}
              style={{
                padding: '7px 10px',
                cursor: 'pointer',
                fontSize: '11.5px',
                borderBottom: '1px solid var(--line-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f7ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
            >
              <div>
                <b style={{ color: 'var(--ink)', fontSize: '11.5px' }}>{port.name}</b>
                <small style={{ display: 'block', color: 'var(--mut)', fontSize: '10px' }}>{port.country} · {port.region}</small>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--brand)', fontWeight: 700, background: '#e8f1fd', padding: '2px 5px', borderRadius: '3px' }}>
                {port.locode}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Carrier Search ────────────────────────────────────────────────────────────
interface CarrierSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export function CarrierSearch({ value, onChange, placeholder = 'Type carrier name…', style, inputStyle }: CarrierSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<MasterCarrierEntry[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (v.length >= 2) {
      const found = searchCarriers(v);
      setResults(found);
      setOpen(found.length > 0);
    } else {
      setResults([]);
      setOpen(false);
    }
    onChange(v);
  };

  const handleSelect = useCallback((carrier: MasterCarrierEntry) => {
    setQuery(carrier.shortName);
    onChange(carrier.shortName);
    setOpen(false);
    setResults([]);
  }, [onChange]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative', ...style }}>
      <div style={{ position: 'relative' }}>
        <Search size={11} style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mut)', pointerEvents: 'none' }} />
        <input
          className="input"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          style={{ paddingLeft: '22px', fontSize: '11px', height: '32px', ...inputStyle }}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxHeight: '220px',
          overflowY: 'auto',
          marginTop: '2px',
        }}>
          {results.map((carrier) => (
            <div
              key={carrier.scac}
              onMouseDown={() => handleSelect(carrier)}
              style={{
                padding: '7px 10px',
                cursor: 'pointer',
                fontSize: '11.5px',
                borderBottom: '1px solid var(--line-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f7ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
            >
              <div>
                <b style={{ color: 'var(--ink)', fontSize: '11.5px' }}>{carrier.shortName}</b>
                <small style={{ display: 'block', color: 'var(--mut)', fontSize: '10px' }}>{carrier.name} · {carrier.country}</small>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--teal)', fontWeight: 700, background: '#e0f7f4', padding: '2px 5px', borderRadius: '3px' }}>
                {carrier.scac}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
