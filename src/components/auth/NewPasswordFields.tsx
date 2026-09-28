import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const MIN_PASSWORD_LENGTH = 12;

/** Returns the first problem with a new password + its confirmation, or null when valid. */
export const newPasswordError = (newPassword: string, confirmPassword: string): string | null => {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (newPassword !== confirmPassword) return "Passwords do not match";
  return null;
};

type NewPasswordFieldsProps = {
  idPrefix: string;
  newPassword: string;
  confirmPassword: string;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  disabled?: boolean;
};

export const NewPasswordFields = ({
  idPrefix,
  newPassword,
  confirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  disabled,
}: NewPasswordFieldsProps) => {
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-new-password`}>New password</Label>
        <Input
          id={`${idPrefix}-new-password`}
          type="password"
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          autoComplete="new-password"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-confirm-password`}>Confirm new password</Label>
        <Input
          id={`${idPrefix}-confirm-password`}
          type="password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          autoComplete="new-password"
          disabled={disabled}
          aria-invalid={mismatch || undefined}
          className={mismatch ? "border-destructive focus-visible:ring-destructive" : undefined}
        />
        {mismatch && (
          <p className="text-xs text-destructive" role="alert">
            Passwords do not match.
          </p>
        )}
      </div>
    </>
  );
};
