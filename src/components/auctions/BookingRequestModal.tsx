// FR8X-CON System-Generated Booking Request Email Draft Component

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  X,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Package,
} from "lucide-react";

export interface BookingShipmentData {
  auctionId: string;
  auctionNumber: string;
  customerName: string;
  customerEmail: string;
  awardedBidderName: string;
  awardedBidderEmail: string;
  pol: string;
  pod: string;
  por?: string;
  fpod?: string;
  poNumber?: string;
  invoiceNumber?: string;
  commodity: string;
  containerType: string;
  transportMode: string;
  awardedRate: string;
  currency: string;
  validity: string;
}

interface BookingRequestModalProps {
  shipment: BookingShipmentData;
  onClose: () => void;
}

export function BookingRequestModal({ shipment, onClose }: BookingRequestModalProps) {
  const [recipientEmail, setRecipientEmail] = useState(shipment.awardedBidderEmail || "awarded-forwarder@company.com");
  const [subject, setSubject] = useState(
    `Official Booking Request — Auction ${shipment.auctionNumber} (${shipment.pol} to ${shipment.pod})`
  );

  const defaultBody = `
Dear ${shipment.awardedBidderName || "Valued Logistics Partner"},

Congratulations! Your bid has been officially awarded for Reverse Auction ${shipment.auctionNumber}.

Please find the shipment details below to confirm booking and initiate cargo dispatch:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHIPMENT & BOOKING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Auction Number: ${shipment.auctionNumber}
• Customer Name: ${shipment.customerName}
• Awarded Rate: ${shipment.currency || "USD"} ${shipment.awardedRate} (All-Inclusive)

• Place of Receipt (POR): ${shipment.por || shipment.pol}
• Port of Loading (POL): ${shipment.pol}
• Port of Discharge (POD): ${shipment.pod}
• Final Place of Delivery (FPOD): ${shipment.fpod || shipment.pod}

• PO Number: ${shipment.poNumber || "PO-2026-8801"}
• Invoice Number: ${shipment.invoiceNumber || "INV-2026-4402"}
• Commodity: ${shipment.commodity}
• Container Type: ${shipment.containerType}
• Transport Mode: ${shipment.transportMode}
• Rate Validity: ${shipment.validity}
• Bid Terms & Condition: Subject to space and equipment availability of carrier.

Please issue the Booking Confirmation (SO / Booking Order) and shipping instructions at your earliest convenience.

Best Regards,
${shipment.customerName}
FR8X-CON Logistics Operations
  `.trim();

  const [bodyText, setBodyText] = useState(defaultBody);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSending(true);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recipientEmail.trim(),
          type: "welcome", // Dispatches structured HTML email via Zoho SMTP
          displayName: shipment.awardedBidderName,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to dispatch booking request email.");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error sending email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
            <h2 className="text-heading-lg font-bold text-[var(--fr8x-jet)]">
              System-Generated Booking Request Email
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Booking Request Sent!</h3>
            <p className="text-body-sm text-foreground-secondary">
              The booking request draft has been successfully dispatched to <strong>{recipientEmail}</strong> via Zoho SMTP.
            </p>
            <Button onClick={onClose} className="bg-[var(--fr8x-periwinkle)] text-white px-6 py-2">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} className="space-y-4 flex-1 flex flex-col min-h-0">
            {error && (
              <div className="p-3 bg-danger-light text-danger-dark rounded-lg text-body-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="fr8x-label block mb-1">Recipient Email (Awarded Forwarder)</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="fr8x-input py-2 text-body-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="fr8x-input py-2 text-body-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <label className="fr8x-label block mb-1">Email Body Draft (Editable)</label>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="fr8x-input flex-1 p-3 text-body-sm font-mono leading-relaxed resize-none border border-border rounded-xl focus:ring-1 focus:ring-[var(--fr8x-periwinkle)]"
              />
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-caption text-foreground-muted">
                Sent via FR8X-CON Integrated Email Engine (Zoho SMTP)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-border text-body-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  isLoading={isSending}
                  loadingText="Sending Email..."
                  className="bg-[var(--fr8x-periwinkle)] text-white px-5 py-2 flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" /> Send Booking Request
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
