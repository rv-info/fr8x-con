'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, Search, Filter } from 'lucide-react';

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/godfather/security?type=events');
      if (res.ok) {
        const json = await res.json();
        setEvents(json.data || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      e.userEmail.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      e.details.toLowerCase().includes(q);
    const matchesSeverity = selectedSeverity === 'ALL' || e.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <h1 className="gf-page-title flex items-center gap-2">
            <ShieldAlert className="lucide w-4 h-4 text-sky-600" />
            <span>Platform Security Incident & Event Stream</span>
          </h1>
          <p className="gf-page-subtitle">
            Immutable log of brute-force attempts, automated account locks, password resets, and elevated privileges.
          </p>
        </div>

        <button type="button" onClick={fetchEvents} className="gf-btn gf-btn-secondary">
          <RefreshCw className={`lucide w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="gf-filter-bar">
        <div className="gf-search-input-wrap">
          <Search className="lucide w-3 h-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search security events by user, incident type, details..."
            className="gf-search-input"
          />
        </div>

        <div className="flex items-center gap-1">
          {['ALL', 'CRITICAL', 'HIGH', 'WARNING', 'INFO'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`gf-badge cursor-pointer ${
                selectedSeverity === sev ? 'gf-badge-blue' : 'gf-badge-gray'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="gf-card">
        <div className="gf-table-container">
          <table className="gf-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>SEVERITY</th>
                <th>INCIDENT TYPE</th>
                <th>TARGET USER / ID</th>
                <th>DETAILS</th>
                <th>SOURCE IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <CheckCircle2 className="lucide w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-60" />
                    <div className="font-bold text-slate-600">No Security Incidents Found</div>
                    <div className="text-[9px]">Zero recorded alerts matching your search criteria.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((evt) => (
                  <tr key={evt.id}>
                    <td className="font-mono text-[9px] text-slate-600">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`gf-badge ${
                          evt.severity === 'CRITICAL'
                            ? 'gf-badge-red'
                            : evt.severity === 'HIGH'
                            ? 'gf-badge-amber'
                            : evt.severity === 'WARNING'
                            ? 'gf-badge-amber'
                            : 'gf-badge-blue'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[9px] font-bold text-slate-800">{evt.type}</span>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900">{evt.userEmail}</div>
                      {evt.company && <div className="text-[9px] text-slate-500">{evt.company}</div>}
                    </td>
                    <td className="text-slate-800 text-[10px] max-w-md">{evt.details}</td>
                    <td className="font-mono text-[9px] text-slate-500">{evt.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
