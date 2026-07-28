// FR8X-CON My RFQs Module — Deprecated / Removed in favor of Reverse Auctions
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/utils/constants";

export default function MyRFQsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.AUCTIONS);
  }, [router]);

  return (
    <div className="p-8 text-center text-body-sm text-foreground-secondary">
      Redirecting to Reverse Auctions...
    </div>
  );
}
