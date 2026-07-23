// FR8X-CON Awards Page

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Zap, TrendingUp, CheckCircle, Shield, Loader2 } from "lucide-react";
import { AWARD_LABELS, type AwardCategory } from "@/lib/types/award";
import { queryDocuments, orderBy, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

type AwardData = {
  id: string;
  category: AwardCategory;
  recipientName: string;
  year: number;
  quarter: number;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

const AWARD_ICONS: Record<AwardCategory, typeof Award> = {
  top_forwarder: Award,
  fastest_response: Zap,
  best_rates: TrendingUp,
  highest_acceptance: CheckCircle,
  trusted_partner: Shield,
};

export default function AwardsPage() {
  const [awards, setAwards] = useState<AwardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAwards() {
      setIsLoading(true);
      try {
        const data = await queryDocuments<AwardData>(COLLECTIONS.AWARDS, [
          orderBy("createdAt", "desc"),
          limit(20),
        ]);
        setAwards(data);
      } catch (err) {
        console.error("Error fetching awards:", err);
        setAwards([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAwards();
  }, []);

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
                Recognized Quarterly
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
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            <span className="text-[11px] text-foreground-muted">Loading awards...</span>
          </div>
        ) : awards.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body-sm text-foreground-secondary">No awards issued yet</p>
            <p className="text-caption text-foreground-muted mt-1">Network awards will be highlighted here as members earn recognition.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {awards.map((award) => {
              const Icon = AWARD_ICONS[award.category] || Award;
              return (
                <div key={award.id} className="px-6 py-4 flex items-center gap-4 hover:bg-background transition-colors">
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-medium text-foreground">{award.recipientName}</p>
                    <p className="text-caption text-foreground-secondary">{AWARD_LABELS[award.category] || award.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm text-foreground-secondary">
                      {award.quarter ? `Q${award.quarter} ` : ""}{award.year || ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
