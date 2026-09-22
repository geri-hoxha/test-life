import { useMemo } from "react";
import { useCancellationReasonEnum } from "@/api/smart-enums";
import type { DomainPoliciesCancellationReason, SmartEnumsEnumItem } from "@/api/types";

export const CANCELLATION_REASON_FALLBACK: DomainPoliciesCancellationReason[] = [
  "APL1",
  "APL2",
  "APL3",
  "APL4",
  "APJ1",
  "APJ2",
  "APJ3",
  "APJ4",
];

const FALLBACK: SmartEnumsEnumItem[] = CANCELLATION_REASON_FALLBACK.map((value) => ({
  value,
  text: value,
}));

/**
 * Cancellation reasons for policy cancellation. Prefers the API smart-enum,
 * falling back to the known codes while it loads or if the call fails.
 */
export const useCancellationReasonOptions = (): SmartEnumsEnumItem[] => {
  const { data } = useCancellationReasonEnum();

  return useMemo(() => {
    if (!data?.length) return FALLBACK;
    return data.map((item) => ({
      value: item.value,
      text: item.text || item.value,
    }));
  }, [data]);
};
