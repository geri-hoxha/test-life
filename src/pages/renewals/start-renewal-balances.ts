import type { PoliciesStartPolicyRenewalRequest } from "@/api/types";

export type StartRenewalBalanceField = "openingBalance" | "closingBalance";

export type StartRenewalBalancesResult =
  | { ok: true; body: PoliciesStartPolicyRenewalRequest }
  | { ok: false; field: StartRenewalBalanceField; message: string };

const parseBalance = (raw: string): number | "empty" | "invalid" => {
  const trimmed = raw.trim();
  if (!trimmed) return "empty";
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return "invalid";
  return value;
};

/** Both empty → `{}`. One filled → the other is required. Both filled → both numbers. */
export const startRenewalRequestBody = (
  openingBalance: string,
  closingBalance: string,
): StartRenewalBalancesResult => {
  const opening = parseBalance(openingBalance);
  const closing = parseBalance(closingBalance);

  if (opening === "invalid") {
    return { ok: false, field: "openingBalance", message: "Enter a valid opening balance." };
  }
  if (closing === "invalid") {
    return { ok: false, field: "closingBalance", message: "Enter a valid closing balance." };
  }
  if (opening === "empty" && closing === "empty") {
    return { ok: true, body: {} };
  }
  if (opening === "empty") {
    return {
      ok: false,
      field: "openingBalance",
      message: "Enter an opening balance as well.",
    };
  }
  if (closing === "empty") {
    return {
      ok: false,
      field: "closingBalance",
      message: "Enter a closing balance as well.",
    };
  }
  return { ok: true, body: { openingBalance: opening, closingBalance: closing } };
};
