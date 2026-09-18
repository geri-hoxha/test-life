import { FormEvent, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  type Location,
} from "react-router-dom";
import { Loader2, Shield } from "lucide-react";
import { useRequestToken } from "@/api/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAuthenticated, LOGIN_PATH } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api-error";

const redirectTarget = (location: Location) => {
  const from = (location.state as { from?: Location } | null)?.from;
  if (!from || from.pathname === LOGIN_PATH) return "/";
  return `${from.pathname}${from.search}${from.hash}`;
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const requestToken = useRequestToken();
  const [username, setUsername] = useState("Administrator");
  const [password, setPassword] = useState("Administrator123@");
  const [error, setError] = useState<string | null>(null);
  const from = redirectTarget(location);

  if (isAuthenticated()) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    requestToken.mutate(
      { username: username.trim(), password },
      {
        onSuccess: (data) => {
          if (!data.accessToken || !data.expiresOnUtc) {
            setError("Sign-in succeeded but the server did not return a token.");
            return;
          }
          navigate(from, { replace: true });
        },
        onError: (err) => {
          setError(getApiErrorMessage(err, "Invalid username or password."));
        },
      },
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-topbar flex flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-28 right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-36 left-[-8rem] h-[32rem] w-[32rem] rounded-full bg-primary blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(214_90%_52%/0.22),transparent_58%)]" />
      </div>

      <div className="relative z-10 mb-8 flex items-center gap-3 text-topbar-foreground">
        <div className="h-11 w-11 rounded-md bg-gradient-accent flex items-center justify-center shadow-elevated">
          <Shield className="h-6 w-6 text-accent-foreground" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-lg tracking-tight">ESIG Life</div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-topbar-muted">Partner portal</div>
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-md border-0 bg-card text-card-foreground shadow-elevated">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Sign in</CardTitle>
          <CardDescription>Enter your partner credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={requestToken.isPending}
                className="bg-background border-border text-foreground focus-visible:ring-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={requestToken.isPending}
                className="bg-background border-border text-foreground focus-visible:ring-accent"
              />
            </div>

            {error && (
              <p
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={requestToken.isPending || !username.trim() || !password}
            >
              {requestToken.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
