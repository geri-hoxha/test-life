import { toast } from "sonner";
import { ApiError } from "@/api/client";

/** Prefer RFC 7807 `detail`, then message, then fallback. */
export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof ApiError) {
    return err.detail?.trim() || err.message?.trim() || fallback;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
};

/** Enterprise-style error toast: title + detail when available. */
export const toastApiError = (err: unknown, fallback: string) => {
  if (err instanceof ApiError) {
    const title = err.title?.trim() || fallback;
    const detail = err.detail?.trim();
    toast.error(title, {
      description:
        detail && detail !== title
          ? detail
          : err.message !== title
            ? err.message
            : undefined,
      duration: 8_000,
    });
    return;
  }

  toast.error(fallback, {
    description: err instanceof Error ? err.message : undefined,
    duration: 6_000,
  });
};
