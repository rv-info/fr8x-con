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
        backgroundColor: 'var(--app-bg, #FFFFFF)',
        minHeight: '100vh',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        color: 'var(--text-primary, #1F2937)',
      }}
    >
      {/* Breadcrumb / Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary, #64748B)' }}>
          <Link href="/godfather" style={{ color: 'var(--text-primary, #1F2937)', textDecoration: 'none', fontWeight: 600 }}>
            Godfather Platform
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary, #1F2937)', fontWeight: 700 }}>Icons &amp; Branding Management</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/sitemap"
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--surface-primary, #FFFFFF)',
              border: '1px solid var(--border-interactive, #D1D5DB)',
              color: 'var(--text-primary, #1F2937)',
              borderRadius: '6px',
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
              backgroundColor: 'var(--accent-primary, #006B68)',
              border: '1px solid var(--accent-primary, #006B68)',
              color: '#FFFFFF',
              borderRadius: '6px',
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
          backgroundColor: 'var(--surface-primary, #FFFFFF)',
          border: '1px solid var(--border-subtle, #E5E7EB)',
          borderRadius: '8px',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Centralized Icons, Logos &amp; Visual Brand Registry
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary, #64748B)', fontSize: '12px', maxWidth: '850px', lineHeight: 1.5 }}>
              Manage, preview, and update all icons and graphics utilized throughout the FR8X web application. Every component
              consumes stable asset IDs; updating an asset here automatically updates all views across Dashboard, Feeds, Nexus,
              Auctions, Rates, Network, Jobs, and Print templates without requiring code changes.
            </p>
          </div>
          <div
            style={{
              backgroundColor: 'var(--surface-secondary, #F8FAFC)',
              border: '1px solid var(--border-default, #D9DEE5)',
              borderRadius: '6px',
              padding: '8px 12px',
              textAlign: 'center',
              minWidth: '140px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)' }}>{ASSET_REGISTRY.length} ASSETS</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)' }}>In Central Registry</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: 'var(--surface-primary, #FFFFFF)',
          border: '1px solid var(--border-subtle, #E5E7EB)',
          borderRadius: '8px',
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
                borderRadius: '6px',
                border: '1px solid',
                borderColor: selectedCategory === cat.id ? 'var(--accent-primary, #006B68)' : 'var(--border-interactive, #D1D5DB)',
                backgroundColor: selectedCategory === cat.id ? 'var(--accent-primary, #006B68)' : 'var(--surface-primary, #FFFFFF)',
                color: selectedCategory === cat.id ? '#FFFFFF' : 'var(--text-primary, #1F2937)',
                fontSize: '12px',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)',
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
              backgroundColor: 'var(--surface-primary, #FFFFFF)',
              border: '1px solid var(--border-default, #D9DEE5)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--text-primary, #1F2937)',
              outline: 'none',
              fontFamily: 'var(--font-family-primary)',
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
                backgroundColor: 'var(--surface-primary, #FFFFFF)',
                border: '1px solid var(--border-subtle, #E5E7EB)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      backgroundColor: 'var(--surface-secondary, #F8FAFC)',
                      color: 'var(--text-primary, #1F2937)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: '1px solid var(--border-default, #D9DEE5)',
                    }}
                  >
                    {asset.category}
                  </span>
                  <span style={{ color: 'var(--text-secondary, #64748B)', fontSize: '11px' }}>{asset.module}</span>
                </div>

                {/* Preview Box & Meta */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      minWidth: '72px',
                      backgroundColor: 'var(--surface-secondary, #F8FAFC)',
                      border: '1px solid var(--border-subtle, #E5E7EB)',
                      borderRadius: '6px',
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
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', marginBottom: '2px' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', fontFamily: 'Consolas, monospace', marginBottom: '4px' }}>
                      ID: {asset.id}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)' }}>
                      Rec. Size: <b>{asset.recommendedDimensions}</b> ({asset.supportedFormats.join(', ').toUpperCase()})
                    </div>
                  </div>
                </div>

                {/* Purpose & Location */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>PURPOSE / CONTEXT</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary, #1F2937)', lineHeight: 1.4 }}>{asset.purpose}</div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>CURRENT ASSET PATH</div>
                  <code style={{ fontSize: '11px', color: 'var(--text-primary, #1F2937)', backgroundColor: 'var(--surface-secondary, #F8FAFC)', border: '1px solid var(--border-subtle, #E5E7EB)', padding: '2px 5px', borderRadius: '4px' }}>
                    {asset.defaultPath}
                  </code>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>INSTRUCTIONS</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', fontStyle: 'italic' }}>{asset.replacementInstructions}</div>
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
                    backgroundColor: status.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: status.success ? '#059669' : '#dc2626',
                    border: `1px solid ${status.success ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  }}
                >
                  {status.text}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle, #E5E7EB)', paddingTop: '12px' }}>
                <label
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '6px 12px',
                    backgroundColor: isUploading ? 'var(--surface-secondary, #F8FAFC)' : 'var(--surface-primary, #FFFFFF)',
                    border: '1px solid var(--border-interactive, #D1D5DB)',
                    color: 'var(--text-primary, #1F2937)',
                    borderRadius: '6px',
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
                    backgroundColor: 'var(--surface-primary, #FFFFFF)',
                    border: '1px solid var(--border-interactive, #D1D5DB)',
                    color: 'var(--text-secondary, #64748B)',
                    borderRadius: '6px',
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
