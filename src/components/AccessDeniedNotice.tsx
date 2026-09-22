import type { ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { isApiForbidden } from "@/lib/api-error";
import { cn } from "@/lib/utils";

type AccessDeniedNoticeProps = {
  className?: string;
};

const AccessDeniedNotice = ({ className }: AccessDeniedNoticeProps) => (
  <div
    role="alert"
    className={cn(
      "flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 px-6 py-12 text-center",
      className,
    )}
  >
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-inset ring-destructive/30">
      <ShieldOff className="h-6 w-6 text-destructive" aria-hidden />
    </div>
    <h2 className="text-lg font-semibold tracking-tight text-destructive">Access denied</h2>
    <p className="mt-1.5 max-w-md text-sm text-destructive/80">
      The authenticated user does not have access.
    </p>
  </div>
);

export const AccessDeniedOr = ({
  error,
  children,
}: {
  error: unknown;
  children: ReactNode;
}) => (isApiForbidden(error) ? <AccessDeniedNotice /> : children);

export default AccessDeniedNotice;
