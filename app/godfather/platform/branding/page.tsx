'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ASSET_REGISTRY, AssetCategory, AssetDefinition } from '@/lib/assets/registry';

const CATEGORIES: { id: AssetCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Registered Assets' },
  { id: 'app-logo', label: 'Company & App Logos' },
  { id: 'sidebar-icon', label: 'Sidebar & Nav Icons' },
  { id: 'transportation-icon', label: 'Transportation Modes' },
  { id: 'action-icon', label: 'Action & Verification' },
  { id: 'notification-icon', label: 'Notification Alerts' },
  { id: 'empty-state', label: 'Empty State Graphics' },
  { id: 'print-logo', label: 'Print Templates' },
];

export default function BrandingManagementPage() {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ id: string; text: string; success: boolean } | null>(null);

  const filteredAssets = ASSET_REGISTRY.filter((asset) => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileChange = async (asset: AssetDefinition, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File exceeds 2MB limit. Please upload an optimized icon or graphic.');
      return;
    }

    // Generate local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewMap((prev) => ({ ...prev, [asset.id]: e.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);

    // Upload via API
    setUploadingId(asset.id);
    setStatusMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assetId', asset.id);

      const res = await fetch('/api/admin/branding/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMessage({
          id: asset.id,
          text: `Success: ${asset.name} updated. Public URI: ${json.publicUrl || json.path}`,
          success: true,
        });
      } else {
        setStatusMessage({
          id: asset.id,
          text: `Upload failed: ${json.error || 'Server error'}`,
          success: false,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        id: asset.id,
        text: `Network failure: ${err.message}`,
        success: false,
      });
    } finally {
      setUploadingId(null);
      event.target.value = '';
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#F8FAFD',
        minHeight: '100vh',
        fontFamily: 'Calibri, Arial, sans-serif',
        fontSize: '12px',
        color: '#1A2332',
      }}
    >
      {/* Breadcrumb / Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#718096' }}>
          <Link href="/godfather" style={{ color: '#1B2B4B', textDecoration: 'none', fontWeight: 600 }}>
            Godfather Platform
          </Link>
          <span>/</span>
          <span style={{ color: '#1A2332', fontWeight: 700 }}>Icons &amp; Branding Management</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/sitemap"
            style={{
              padding: '6px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #1B2B4B',
              color: '#1B2B4B',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            Public Sitemap
          </Link>
          <button
            onClick={() => window.print()}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1B2B4B',
              border: '1px solid #1B2B4B',
              color: '#FFFFFF',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            Print Asset Spec
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          padding: '20px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#1B2B4B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Centralized Icons, Logos &amp; Visual Brand Registry
            </h1>
            <p style={{ margin: 0, color: '#4A5568', fontSize: '12px', maxWidth: '850px', lineHeight: 1.5 }}>
              Manage, preview, and update all icons and graphics utilized throughout the FR8X web application. Every component
              consumes stable asset IDs; updating an asset here automatically updates all views across Dashboard, Feeds, Nexus,
              Auctions, Rates, Network, Jobs, and Print templates without requiring code changes.
            </p>
          </div>
          <div
            style={{
              backgroundColor: '#EEF1F7',
              border: '1px solid #CBD5E0',
              borderRadius: '4px',
              padding: '8px 12px',
              textAlign: 'center',
              minWidth: '140px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B2B4B' }}>{ASSET_REGISTRY.length} ASSETS</div>
            <div style={{ fontSize: '12px', color: '#718096' }}>In Central Registry</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '5px 12px',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: selectedCategory === cat.id ? '#1B2B4B' : '#E2E8F0',
                backgroundColor: selectedCategory === cat.id ? '#1B2B4B' : '#FFFFFF',
                color: selectedCategory === cat.id ? '#FFFFFF' : '#4A5568',
                fontSize: '12px',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'Calibri, Arial, sans-serif',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div style={{ minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search by asset ID, name or module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#1A2332',
              outline: 'none',
              fontFamily: 'Calibri, Arial, sans-serif',
            }}
          />
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredAssets.map((asset) => {
          const preview = previewMap[asset.id] || asset.defaultPath;
          const isUploading = uploadingId === asset.id;
          const status = statusMessage?.id === asset.id ? statusMessage : null;

          return (
            <div
              key={asset.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 2px rgba(27, 43, 75, 0.04)',
              }}
            >
              <div>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      backgroundColor: '#EEF1F7',
                      color: '#1B2B4B',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: '1px solid #CBD5E0',
                    }}
                  >
                    {asset.category}
                  </span>
                  <span style={{ color: '#718096', fontSize: '11px' }}>{asset.module}</span>
                </div>

                {/* Preview Box & Meta */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      minWidth: '72px',
                      backgroundColor: '#F8FAFD',
                      border: '1px solid #E2E8F0',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={asset.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B2B4B', marginBottom: '2px' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#718096', fontFamily: 'Consolas, monospace', marginBottom: '4px' }}>
                      ID: {asset.id}
                    </div>
                    <div style={{ fontSize: '11px', color: '#4A5568' }}>
                      Rec. Size: <b>{asset.recommendedDimensions}</b> ({asset.supportedFormats.join(', ').toUpperCase()})
                    </div>
                  </div>
                </div>

                {/* Purpose & Location */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600 }}>PURPOSE / CONTEXT</div>
                  <div style={{ fontSize: '12px', color: '#1A2332', lineHeight: 1.4 }}>{asset.purpose}</div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600 }}>CURRENT ASSET PATH</div>
                  <code style={{ fontSize: '11px', color: '#1B2B4B', backgroundColor: '#F8FAFD', padding: '2px 4px', borderRadius: '2px' }}>
                    {asset.defaultPath}
                  </code>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600 }}>INSTRUCTIONS</div>
                  <div style={{ fontSize: '11px', color: '#4A5568', fontStyle: 'italic' }}>{asset.replacementInstructions}</div>
                </div>
              </div>

              {/* Status Alert */}
              {status && (
                <div
                  style={{
                    marginBottom: '10px',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    backgroundColor: status.success ? '#F0FFF4' : '#FFF5F5',
                    color: status.success ? '#22543D' : '#9B2C2C',
                    border: `1px solid ${status.success ? '#9AE6B4' : '#FEB2B2'}`,
                  }}
                >
                  {status.text}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #EDF2F7', paddingTop: '12px' }}>
                <label
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '6px 12px',
                    backgroundColor: isUploading ? '#EEF1F7' : '#FFFFFF',
                    border: '1px solid #1B2B4B',
                    color: '#1B2B4B',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isUploading ? 'Uploading...' : 'Upload / Replace'}
                  <input
                    type="file"
                    accept=".png,.gif,.svg,.webp,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    disabled={isUploading}
                    onChange={(e) => handleFileChange(asset, e)}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const sampleUrl = prompt(`Update direct URL override for asset "${asset.id}":`, asset.defaultPath);
                    if (sampleUrl) {
                      setPreviewMap((prev) => ({ ...prev, [asset.id]: sampleUrl }));
                      setStatusMessage({
                        id: asset.id,
                        text: `Active display URL updated to: ${sampleUrl}`,
                        success: true,
                      });
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E0',
                    color: '#4A5568',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Set URL
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
