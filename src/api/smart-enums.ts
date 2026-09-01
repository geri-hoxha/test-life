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

export const useCountryEnum = (options?: { enabled?: boolean }) =>
  useSmartEnum("Country", options);

export const usePolicyPlanTypeEnum = (options?: { enabled?: boolean }) =>
  useSmartEnum("PolicyPlanType", options);
