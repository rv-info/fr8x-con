// FR8X-CON Reusable Production Clean Empty State Component
"use client";

import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-xl space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
        <Icon className="h-6 w-6 text-[var(--fr8x-periwinkle)]" />
      </div>

      <div className="max-w-sm space-y-1">
        <h3 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">{title}</h3>
        <p className="text-body-sm text-foreground-secondary leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button
            onClick={onAction}
            className="fr8x-btn-primary font-bold text-caption px-4 py-2"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
