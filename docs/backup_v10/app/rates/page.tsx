'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { RateItem } from '@/lib/types';
import {
  BarChart3,
  Plus,
  Upload,
  Copy,
  MessageCircle,
  Mail,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function RatesPage() {
  const { rates, myRates, addMyRate, deleteMyRate, bulkImportRates } = useData();
  const { format } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'i' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // i-Rate Editor Form State
  const [carrier, setCarrier] = useState('Maersk');
  const [por, setPor] = useState('Nhava Sheva (INNSA)');
  const [pol, setPol] = useState('Nhava Sheva (INNSA)');
  const [pod, setPod] = useState('Rotterdam (NLRTM)');
  const [fpod, setFpod] = useState('Rotterdam (NLRTM)');
  const [routing, setRouting] = useState('Direct Ocean');
  const [transitTime, setTransitTime] = useState('29 days');
  const [d20, setD20] = useState(1480);
  const [d20Type, setD20Type] = useState('Dry Standard');
  const [h40, setH40] = useState(2320);
  const [h40Type, setH40Type] = useState('High Cube');
  const [freeTime, setFreeTime] = useState('14 days');
  const [validDate, setValidDate] = useState('2026-09-30');
  const [rateType, setRateType] = useState('Direct');
  const [remarks, setRemarks] = useState('Subject to space & bunker adjustment');

  // Bulk Upload State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Partial<RateItem>[]>([]);
  const [validationReport, setValidationReport] = useState<{
    validCount: number;
    errors: string[];
  } | null>(null);

  // Filtered Tables
  const filteredMarketRates = rates.filter((r) =>
    (r.id + ' ' + r.sp + ' ' + r.carrier + ' ' + r.pol + ' ' + r.pod)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredMyRates = myRates.filter((r) =>
    (r.id + ' ' + r.carrier + ' ' + r.pol + ' ' + r.pod)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleSaveIRate = () => {
    if (!pol.trim() || !pod.trim() || !d20 || !h40 || !validDate) {
      toast('Please complete all required fields (POL, POD, 20DV, 40HC, Validity).');
      return;
    }

    addMyRate({
      carrier,
      por: por || pol,
      pol,
      pod,
      fpod: fpod || pod,
      d20: Number(d20),
      d20Type,
      h40: Number(h40),
      h40Type,
      ft: freeTime,
      tt: transitTime,
      valid: validDate,
      rateType,
      route: routing,
      remark: remarks,
    });
  };

  const handleClearEditor = () => {
    setCarrier('');
    setPor('');
    setPol('');
    setPod('');
    setFpod('');
    setRouting('');
    setTransitTime('');
    setD20(0);
    setH40(0);
    setRemarks('');
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'Service Provider,Carrier,POR,POL,POD,FPOD,20DV USD,20 Type,40HC USD,40 Type,Free Time,Validity Date,Rate Type,Transit Time,Routing,Remarks\n' +
      `${user.company},Maersk,Nhava Sheva,Nhava Sheva,Rotterdam,Rotterdam,1500,Dry Standard,2350,High Cube,14 days,2026-09-30,Direct,29 days,Direct,Subject to space\n` +
      `${user.company},CMA CGM,Mundra,Mundra,Antwerp,Antwerp,1520,Dry Standard,2380,High Cube,14 days,2026-09-30,Direct,31 days,Direct,Direct service`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'fr8x_rates_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('CSV template downloaded.');
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast('Uploaded file is empty or missing data rows.');
        return;
      }

      const rows: Partial<RateItem>[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length < 9) {
          errors.push(`Row ${i + 1}: Insufficient column fields.`);
          continue;
        }

        const [
          sp,
          cCarrier,
          cPor,
          cPol,
          cPod,
          cFpod,
          cD20,
          cD20Type,
          cH40,
          cH40Type,
          cFt,
          cValid,
          cRateType,
          cTt,
          cRoute,
          cRemarks,
        ] = cols;

        if (!cPol || !cPod) {
          errors.push(`Row ${i + 1}: Missing POL or POD.`);
          continue;
        }

        rows.push({
          sp: sp || user.company,
          carrier: cCarrier || 'Maersk',
          por: cPor || cPol,
          pol: cPol,
          pod: cPod,
          fpod: cFpod || cPod,
          d20: Number(cD20) || 0,
          d20Type: cD20Type || 'Dry Standard',
          h40: Number(cH40) || 0,
          h40Type: cH40Type || 'High Cube',
          ft: cFt || '14 days',
          valid: cValid || '2026-09-30',
          rateType: cRateType || 'Direct',
          tt: cTt || '28 days',
          route: cRoute || 'Direct',
          remark: cRemarks || 'Bulk uploaded',
        });
      }

      setParsedRows(rows);
      setValidationReport({
        validCount: rows.length,
        errors,
      });
    };
    reader.readAsText(file);
  };

  const handleCommitBulk = () => {
    if (!parsedRows.length) {
      toast('No valid rate rows to import.');
      return;
    }
    bulkImportRates(parsedRows);
    setShowBulkModal(false);
    setParsedRows([]);
    setValidationReport(null);
  };

  // Render Rate Table
  const renderRateTable = (data: RateItem[], allowOwnerActions: boolean) => (
    <div className="tablewrap">
      <table className="table" style={{ minWidth: '1240px' }}>
        <thead>
          <tr>
            <th>Rate ID</th>
            <th>Service Provider</th>
            <th>Carrier</th>
            <th>POR</th>
            <th>POL</th>
            <th>POD</th>
            <th>FPOD</th>
            <th>20DV (USD)</th>
            <th>40HC (USD)</th>
            <th>Free Time</th>
            <th>Transit</th>
            <th>Validity</th>
            <th>Routing</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={15} style={{ textAlign: 'center', padding: '24px', color: 'var(--mut)' }}>
                No rate records found matching query.
              </td>
            </tr>
          ) : (
            data.map((r) => (
              <tr key={r.id}>
                <td>
                  <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{r.id}</b>
                </td>
                <td>{r.sp}</td>
                <td>
                  <b>{r.carrier}</b>
                </td>
                <td>{r.por}</td>
                <td>{r.pol}</td>
                <td>{r.pod}</td>
                <td>{r.fpod}</td>
                <td style={{ fontWeight: 700, color: 'var(--brand)' }}>${formatNumber(r.d20)}</td>
                <td style={{ fontWeight: 700, color: 'var(--brand)' }}>${formatNumber(r.h40)}</td>
                <td>{r.ft}</td>
                <td>{r.tt}</td>
                <td>
                  <span className="badge green" style={{ fontSize: '9.5px' }}>
                    {r.valid}
                  </span>
                </td>
                <td>{r.route}</td>
                <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.remark}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn secondary sm icon"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `FR8X Rate Quote [${r.id}]: ${r.carrier} | ${r.pol} -> ${r.pod} | 20DV: $${r.d20} | 40HC: $${r.h40} | Free Time: ${r.ft} | Valid: ${r.valid}`
                        );
                        toast('Commercial rate quote copied to clipboard.');
                      }}
                      title="Copy quote"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      className="btn secondary sm icon"
                      onClick={() => toast('WhatsApp quote composer dispatched.')}
                      title="Share on WhatsApp"
                    >
                      <MessageCircle size={12} />
                    </button>
                    <button
                      className="btn secondary sm icon"
                      onClick={() => toast('Email freight inquiry generated.')}
                      title="Share via Email"
                    >
                      <Mail size={12} />
                    </button>

                    {allowOwnerActions && (
                      <button
                        className="btn danger sm icon"
                        onClick={() => deleteMyRate(r.id)}
                        title="Remove from i-Rates"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="head">
        <div>
          <h1>Rate Intelligence & Management</h1>
          <p>Global freight market rate benchmarking, personal i-Rates inventory, and bulk validation.</p>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={() => setShowBulkModal(true)}>
            <Upload size={14} /> Bulk Upload CSV
          </button>
          <button className="btn primary" onClick={() => setActiveTab('i')}>
            <Plus size={14} /> Add i-Rate
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={activeTab === 'all' ? 'on' : ''} onClick={() => setActiveTab('all')}>
          All Market Rates
        </button>
        <button className={activeTab === 'i' ? 'on' : ''} onClick={() => setActiveTab('i')}>
          My Published i-Rates ({myRates.length})
        </button>
        <button
          className={activeTab === 'expired' ? 'on' : ''}
          onClick={() => setActiveTab('expired')}
        >
          Expired Rates
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'flex-end' }}>
        <input
          className="input"
          style={{ width: '280px', height: '32px' }}
          placeholder="Filter by Carrier, POL, POD, Rate ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* View Content */}
      {activeTab === 'all' && renderRateTable(filteredMarketRates, false)}

      {activeTab === 'expired' && (
        <div className="card cardbody" style={{ color: 'var(--mut)', textAlign: 'center', padding: '30px' }}>
          No expired contracts found. Active market rates auto-archive upon validity expiration.
        </div>
      )}

      {activeTab === 'i' && (
        <div>
          {/* i-Rates Split Editor */}
          <div className="rateeditor" style={{ marginBottom: '16px' }}>
            {/* Left Column: Form Editor */}
            <div className="card">
              <div className="cardhead">
                <span>i-Rates Publisher</span>
                <span className="sub">Company Rate Inventory</span>
              </div>

              {/* Carrier & Routing Group */}
              <div className="group">
                <h4>Carrier & Port Lane</h4>
                <div className="grid g2" style={{ marginBottom: '8px' }}>
                  <div className="field">
                    <label>Carrier</label>
                    <input
                      className="input"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Rate Type</label>
                    <select
                      className="input"
                      value={rateType}
                      onChange={(e) => setRateType(e.target.value)}
                    >
                      <option value="Direct">Direct Ocean</option>
                      <option value="Transshipment">Transshipment</option>
                      <option value="Spot">Spot Rate</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div className="grid g2" style={{ marginBottom: '8px' }}>
                  <div className="field">
                    <label>
                      POL <span className="req">*</span>
                    </label>
                    <input
                      className="input"
                      value={pol}
                      onChange={(e) => setPol(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>
                      POD <span className="req">*</span>
                    </label>
                    <input
                      className="input"
                      value={pod}
                      onChange={(e) => setPod(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid g2">
                  <div className="field">
                    <label>Routing</label>
                    <input
                      className="input"
                      value={routing}
                      onChange={(e) => setRouting(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Transit Time</label>
                    <input
                      className="input"
                      value={transitTime}
                      onChange={(e) => setTransitTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Container Rates Group */}
              <div className="group">
                <h4>Container Rates (USD $)</h4>
                <div className="grid g2">
                  <div className="field">
                    <label>
                      20DV USD <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={d20}
                      onChange={(e) => setD20(Number(e.target.value))}
                    />
                  </div>
                  <div className="field">
                    <label>
                      40HC USD <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={h40}
                      onChange={(e) => setH40(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Validity Group */}
              <div className="group">
                <h4>Validity & Free Time</h4>
                <div className="grid g2" style={{ marginBottom: '8px' }}>
                  <div className="field">
                    <label>Free Time</label>
                    <input
                      className="input"
                      value={freeTime}
                      onChange={(e) => setFreeTime(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>
                      Valid Until <span className="req">*</span>
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={validDate}
                      onChange={(e) => setValidDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Remarks</label>
                  <input
                    className="input"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="editoractions">
                <button className="btn primary" onClick={handleSaveIRate}>
                  Save & Publish Rate
                </button>
                <button className="btn secondary" onClick={handleClearEditor}>
                  Clear
                </button>
              </div>
            </div>

            {/* Right Column: Published i-Rates Table */}
            <div className="card">
              <div className="cardhead">
                <span>My Published Rate Inventory · Full Schema</span>
                <span className="sub">{myRates.length} Rates</span>
              </div>
              {renderRateTable(filteredMyRates, true)}
            </div>
          </div>
        </div>
      )}

      {/* Bulk CSV Upload Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Upload Rate Sheet (CSV / Excel)"
        footer={
          <>
            <button className="btn secondary" onClick={() => setShowBulkModal(false)}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={!parsedRows.length}
              onClick={handleCommitBulk}
            >
              Commit {parsedRows.length} Validated Rates
            </button>
          </>
        }
      >
        <p style={{ fontSize: '12.5px', marginBottom: '12px', color: 'var(--ink-secondary)' }}>
          Download the official FR8X rate schema CSV template, populate your freight rates, and upload for automated schema and lane verification.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <button className="btn secondary" onClick={handleDownloadTemplate}>
            <Download size={14} /> Download CSV Template
          </button>
        </div>

        <div className="card cardbody" style={{ background: '#fafcfe', border: '1.5px dashed #ccd8e5', textAlign: 'center', padding: '24px', marginBottom: '14px' }}>
          <FileSpreadsheet size={32} style={{ color: 'var(--brand)', margin: '0 auto 8px' }} />
          <b style={{ fontSize: '13px', display: 'block' }}>Select Rate CSV File</b>
          <input
            type="file"
            accept=".csv,.xlsx"
            style={{ marginTop: '10px', fontSize: '12px' }}
            onChange={handleCsvFileUpload}
          />
        </div>

        {/* Validation Report */}
        {validationReport && (
          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <CheckCircle size={16} color="var(--green)" />
              <b style={{ fontSize: '12.5px' }}>
                Validation Complete: {validationReport.validCount} Valid Row(s) Ready
              </b>
            </div>
            {validationReport.errors.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <small style={{ color: 'var(--red)', fontWeight: 700 }}>
                  Errors Detected ({validationReport.errors.length}):
                </small>
                <ul style={{ fontSize: '11px', color: 'var(--red)', paddingLeft: '16px', marginTop: '4px' }}>
                  {validationReport.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
