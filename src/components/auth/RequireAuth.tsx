import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMySalesAccess } from "@/api/auth";
import { clearSession } from "@/api/client";
import { isAuthenticated, LOGIN_PATH, msUntilExpiry, readAuthSession } from "@/lib/auth";

/** Blocks app routes when the stored token is missing or `expiresOnUtc` has passed. */
const RequireAuth = () => {
  const location = useLocation();
  const [tick, setTick] = useState(0);
  const authenticated = isAuthenticated();
  useMySalesAccess({ enabled: authenticated });

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

  return <Outlet />;
};

export default RequireAuth;
