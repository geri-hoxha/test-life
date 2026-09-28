import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useChangeMyPassword } from "@/api/auth";
import { ApiError, clearSession } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOGIN_PATH } from "@/lib/auth";
import { toastApiError } from "@/lib/api-error";
import { NewPasswordFields, newPasswordError } from "./NewPasswordFields";

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ChangePasswordDialog = ({ open, onOpenChange }: ChangePasswordDialogProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const changePassword = useChangeMyPassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const saving = changePassword.isPending;

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPasswordError(null);
    changePassword.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (saving) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPasswordError(null);

    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }
    const error = newPasswordError(newPassword, confirmPassword);
    if (error) {
      toast.error(error);
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("New password must be different from the current one");
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          // The API revokes every token of this user, including the one just used.
          clearSession();
          queryClient.clear();
          reset();
          onOpenChange(false);
          toast.success("Password changed", {
            description: "Sign in again with your new password.",
          });
          navigate(LOGIN_PATH, { replace: true });
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 422) {
            setCurrentPasswordError("Current password is incorrect.");
            return;
          }
          toastApiError(err, "Failed to change password");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              You will be signed out on every device and need to sign in again with the new
              password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="me-current-password">Current password</Label>
              <Input
                id="me-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setCurrentPasswordError(null);
                }}
                autoComplete="current-password"
                disabled={saving}
                aria-invalid={currentPasswordError ? true : undefined}
                className={
                  currentPasswordError
                    ? "border-destructive focus-visible:ring-destructive"
                    : undefined
                }
              />
              {currentPasswordError && (
                <p className="text-xs text-destructive" role="alert">
                  {currentPasswordError}
                </p>
              )}
            </div>
            <NewPasswordFields
              idPrefix="me"
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              disabled={saving}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            >
              {saving ? "Saving…" : "Change password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
