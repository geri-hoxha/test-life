import { useMemo } from "react";
import { useRelationshipToInsuredEnum } from "@/api/smart-enums";
import type { DomainPoliciesRelationshipToInsured, SmartEnumsEnumItem } from "@/api/types";

export const RELATIONSHIP_TO_INSURED_FALLBACK: SmartEnumsEnumItem[] = [
  { value: "E NJEJTE", text: "E NJEJTE" },
  { value: "ADMINISTRATOR", text: "ADMINISTRATOR" },
  { value: "ORTAK", text: "ORTAK" },
  { value: "TJETER", text: "TJETER" },
];

/**
 * Relationship-to-insured options. Prefers the API smart-enum, falling back to the
 * known values while it loads or if the call fails.
 */
export const useRelationshipToInsuredOptions = (): SmartEnumsEnumItem[] => {
  const { data } = useRelationshipToInsuredEnum();

  return useMemo(() => {
    if (!data?.length) return RELATIONSHIP_TO_INSURED_FALLBACK;
    return data.map((item) => ({
      value: item.value,
      text: item.text || item.value,
    }));
  }, [data]);
};

export const SAME_AS_INSURED: DomainPoliciesRelationshipToInsured = "E NJEJTE";
