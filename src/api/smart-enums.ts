import { useQuery } from "@tanstack/react-query";
import { apiKeys, apiRequest } from "./client";
import type { SmartEnumsEnumItem } from "./types";

export const smartEnumsKeys = {
  all: [...apiKeys.all, "smart-enums"] as const,
  enum: (name: string) => [...smartEnumsKeys.all, name] as const,
};

/** GET /api/smart-enums/{name} */
export const getSmartEnum = async (
  name: string,
  signal?: AbortSignal
): Promise<SmartEnumsEnumItem[]> =>
  apiRequest<SmartEnumsEnumItem[]>({
    method: "GET",
    path: `/api/smart-enums/${encodeURIComponent(name)}`,
    signal,
  });

export const useSmartEnum = (name: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: smartEnumsKeys.enum(name),
    queryFn: ({ signal }) => getSmartEnum(name, signal),
    enabled: Boolean(name) && (options?.enabled ?? true),
    staleTime: 60 * 60 * 1000,
  });

/** Resolve the API `text` for a stored smart-enum `value`. */
export const smartEnumText = (
  items: SmartEnumsEnumItem[] | undefined,
  value?: string | null,
): string | undefined => {
  if (!value) return undefined;
  return items?.find((item) => item.value === value)?.text;
};

/** Display label: API text, otherwise the raw value, otherwise `empty`. */
export const smartEnumLabel = (
  items: SmartEnumsEnumItem[] | undefined,
  value?: string | null,
  empty = "—",
): string => {
  if (!value) return empty;
  return smartEnumText(items, value) || value;
};

export const useCountryEnum = (options?: { enabled?: boolean }) =>
  useSmartEnum("Country", options);

export const useActuarialCodeEnum = (options?: { enabled?: boolean }) =>
  useSmartEnum("ActuarialCode", options);

export const useRelationshipToInsuredEnum = (options?: { enabled?: boolean }) =>
  useSmartEnum("RelationshipToInsured", options);

export const useCancellationReasonEnum = (options?: { enabled?: boolean }) =>
  useSmartEnum("CancellationReason", options);
