// FR8X-CON Awards Page

"use client";

import { motion } from "framer-motion";
import { Award, Star, Zap, TrendingUp, CheckCircle, Shield } from "lucide-react";
import { AWARD_LABELS, type AwardCategory } from "@/lib/types/award";

const AWARD_ICONS: Record<AwardCategory, typeof Award> = {
  top_forwarder: Award,
  fastest_response: Zap,
  best_rates: TrendingUp,
  highest_acceptance: CheckCircle,
  trusted_partner: Shield,
};

const MOCK_AWARDS = [
  { id: "1", category: "top_forwarder" as AwardCategory, recipientName: "Global Logistics Ltd", year: 2024, quarter: 2 },
  { id: "2", category: "fastest_response" as AwardCategory, recipientName: "Swift Freight Co", year: 2024, quarter: 2 },
  { id: "3", category: "best_rates" as AwardCategory, recipientName: "Ocean Bridge Shipping", year: 2024, quarter: 2 },
  { id: "4", category: "highest_acceptance" as AwardCategory, recipientName: "Reliable Cargo Services", year: 2024, quarter: 1 },
  { id: "5", category: "trusted_partner" as AwardCategory, recipientName: "Prime Forwarding Inc", year: 2024, quarter: 1 },
];

export default function AwardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-foreground">Awards</h1>
        <p className="mt-1 text-body-md text-foreground-secondary">
          Recognizing excellence in the freight network
        </p>
      </div>

      {/* Award categories grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {(Object.keys(AWARD_LABELS) as AwardCategory[]).map((category, i) => {
          const Icon = AWARD_ICONS[category];
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="fr8x-card-hover p-5 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-3">
                <Icon className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-heading-sm text-foreground">{AWARD_LABELS[category]}</h3>
              <p className="mt-1 text-caption text-foreground-muted">
                Q2 2024
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent awards */}
      <div className="fr8x-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-heading-lg text-foreground">Recent Awards</h2>
        </div>
        <div className="divide-y divide-border">
          {MOCK_AWARDS.map((award) => {
            const Icon = AWARD_ICONS[award.category];
            return (
              <div key={award.id} className="px-6 py-4 flex items-center gap-4 hover:bg-background transition-colors">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="text-body-sm font-medium text-foreground">{award.recipientName}</p>
                  <p className="text-caption text-foreground-secondary">{AWARD_LABELS[award.category]}</p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm text-foreground-secondary">Q{award.quarter} {award.year}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
