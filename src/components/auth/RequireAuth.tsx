import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMySalesAccess } from "@/api/auth";
import { ApiError, clearSession } from "@/api/client";
import { GlobalLoader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { isAuthenticated, LOGIN_PATH, msUntilExpiry, readAuthSession } from "@/lib/auth";

const FullScreen = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-background p-4">{children}</div>
);

/**
 * Blocks app routes when the stored token is missing or `expiresOnUtc` has passed,
 * and until GET /api/me/sales-access has resolved.
 */
const RequireAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tick, setTick] = useState(0);
  const authenticated = isAuthenticated();
  const salesAccess = useMySalesAccess({ enabled: authenticated });

  useEffect(() => {
    const session = readAuthSession();
    if (!session) return;

    const remaining = msUntilExpiry(session.expiresOnUtc);
    if (remaining <= 0) {
      clearSession();
      setTick((n) => n + 1);
      return;
    }

    // setTimeout is 32-bit; re-check after the capped delay if the token lasts longer.
    const delay = Math.min(remaining, 2_147_483_647);
    const id = window.setTimeout(() => setTick((n) => n + 1), delay);
    return () => window.clearTimeout(id);
  }, [location.pathname, tick]);

  if (!authenticated) {
    return <Navigate to={LOGIN_PATH} replace state={{ from: location }} />;
  }

  // 401 already triggers a redirect to login in the API client — keep the loader up until it lands.
  const unauthorized = salesAccess.error instanceof ApiError && salesAccess.error.status === 401;

  if (salesAccess.isPending || unauthorized || (salesAccess.isError && salesAccess.isFetching)) {
    return (
      <FullScreen>
        <GlobalLoader label="Loading your access…" description="Preparing your workspace" />
      </FullScreen>
    );
  }

  if (salesAccess.isError) {
    return (
      <FullScreen>
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-lg border bg-card px-8 py-6 text-center shadow-elevated">
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Couldn't load your access</div>
            <div className="text-xs text-muted-foreground">
              {getApiErrorMessage(salesAccess.error, "Please try again.")}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                clearSession();
                queryClient.clear();
                navigate(LOGIN_PATH, { replace: true });
              }}
            >
              Sign out
            </Button>
            <Button onClick={() => void salesAccess.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </FullScreen>
    );
  }

  return <Outlet />;
};

export default RequireAuth;
