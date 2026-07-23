// FR8X-CON GodMode Payment Details Storage Helper

export type GodModePaymentDetails = {
  paypalEmail: string;
  paypalLink: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscSwift: string;
  branchName: string;
  upiId: string;
  vpaName: string;
};

export const DEFAULT_GODMODE_PAYMENT_DETAILS: GodModePaymentDetails = {
  paypalEmail: "paypal@fr8x.in",
  paypalLink: "https://paypal.me/fr8x",
  bankName: "HDFC Bank Ltd",
  accountName: "FR8X LOGISTICS INDIA PRIVATE LIMITED",
  accountNumber: "50200098765432",
  ifscSwift: "HDFC0001234 / HDFCINBBXXX",
  branchName: "BKC Complex Branch, Mumbai",
  upiId: "fr8x@hdfcbank",
  vpaName: "FR8X LOGISTICS INDIA",
};

export function getGodModePaymentDetails(): GodModePaymentDetails {
  if (typeof window === "undefined") return DEFAULT_GODMODE_PAYMENT_DETAILS;
  try {
    const saved = localStorage.getItem("fr8x_godmode_payment_details");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_GODMODE_PAYMENT_DETAILS;
}
