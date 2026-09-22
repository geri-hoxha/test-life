import { useMemo } from "react";
import { useActuarialCodeEnum } from "@/api/smart-enums";
import type { SmartEnumsEnumItem } from "@/api/types";
import { ACTUARIAL_CODES } from "@/data/policy-plan-types";

const FALLBACK: SmartEnumsEnumItem[] = ACTUARIAL_CODES.map((value) => ({
  value,
  text: value,
}));

/**
 * Actuarial codes for product forms. Prefers the API smart-enum, falling back to the
 * known values while it loads or if the call fails.
 */
export const useActuarialCodeOptions = (): SmartEnumsEnumItem[] => {
  const { data } = useActuarialCodeEnum();

  return useMemo(() => {
    if (!data?.length) return FALLBACK;
    return data.map((item) => ({
      value: item.value,
      text: item.text || item.value,
    }));
  }, [data]);
};
