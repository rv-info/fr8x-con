'use client';

import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render: (row: T) => ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  renderExpanded?: (row: T) => ReactNode;
  emptyState?: ReactNode;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  renderExpanded,
  emptyState,
  sortKey,
  sortDir,
  onSort,
  className = '',
}: DataTableProps<T>) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (rows.length === 0 && emptyState) {
    return <div className={`ui-table-wrap ${className}`.trim()}>{emptyState}</div>;
  }

  return (
    <div className={`ui-table-wrap ${className}`.trim()}>
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align || 'left',
                  width: col.width,
                  cursor: col.sortable && onSort ? 'pointer' : undefined,
                  userSelect: 'none',
                }}
                onClick={() => col.sortable && onSort && onSort(col.key)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </span>
              </th>
            ))}
            {renderExpanded && <th style={{ textAlign: 'right', width: '56px' }}>ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const isExpanded = expandedKeys.has(key);
            return (
              <React.Fragment key={key}>
                <tr
                  className={isExpanded ? 'is-expanded' : ''}
                  onClick={renderExpanded ? () => toggleRow(key) : undefined}
                  style={{ cursor: renderExpanded ? 'pointer' : undefined }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align || 'left' }}
                      className={col.align === 'right' ? 'ui-tabular' : undefined}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                  {renderExpanded && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(key);
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          padding: 0,
                          borderRadius: '8px',
                          border: '1px solid transparent',
                          background: 'transparent',
                          color: 'var(--text-secondary, #777B82)',
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  )}
                </tr>
                {renderExpanded && isExpanded && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      style={{
                        padding: '16px 20px',
                        background: 'var(--surface-card, #F6F6F6)',
                        borderBottom: '1.5px solid var(--accent-primary, #26313A)',
                      }}
                    >
                      <div
                        style={{
                          background: 'var(--surface-primary, #FFFFFF)',
                          border: '1px solid var(--border-default, #E0E1E3)',
                          borderRadius: '16px',
                          padding: '16px',
                        }}
                      >
                        {renderExpanded(row)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({ page, pageSize, totalItems, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 16px',
        fontSize: '12px',
        color: 'var(--text-secondary, #777B82)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="ui-tabular">
          Showing {start}–{end} of {totalItems} records
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Items per page"
            style={{
              height: '28px',
              padding: '0 8px',
              borderRadius: '8px',
              border: '1px solid var(--border-default, #E0E1E3)',
              background: 'var(--surface-primary, #FFFFFF)',
              color: 'var(--text-primary, #20242B)',
              fontSize: '11.5px',
            }}
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s} / page
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          style={{
            width: '30px',
            height: '30px',
            padding: 0,
            borderRadius: '8px',
            border: '1px solid var(--border-default, #E0E1E3)',
            background: 'var(--surface-primary, #FFFFFF)',
            color: 'var(--text-primary, #20242B)',
          }}
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, idx) => {
          const prev = pages[idx - 1];
          const showEllipsis = prev && p - prev > 1;
          return (
            <React.Fragment key={p}>
              {showEllipsis && <span style={{ padding: '0 4px' }}>…</span>}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                style={{
                  minWidth: '30px',
                  height: '30px',
                  padding: '0 8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: p === page ? 600 : 500,
                  border:
                    p === page
                      ? '1px solid var(--accent-primary, #26313A)'
                      : '1px solid var(--border-default, #E0E1E3)',
                  background: p === page ? 'var(--accent-primary, #26313A)' : 'var(--surface-primary, #FFFFFF)',
                  color: p === page ? '#F8FAFC' : 'var(--text-primary, #26313A)',
                }}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          style={{
            width: '30px',
            height: '30px',
            padding: 0,
            borderRadius: '8px',
            border: '1px solid var(--border-default, #E0E1E3)',
            background: 'var(--surface-primary, #FFFFFF)',
            color: 'var(--text-primary, #20242B)',
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
