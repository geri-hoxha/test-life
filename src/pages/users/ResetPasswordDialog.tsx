import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { salesAccessKeys } from "@/api/auth";
import { clearSession } from "@/api/client";
import { useResetUserPassword } from "@/api/users";
import type { UserSalesAccessResponse } from "@/api/types";
import { NewPasswordFields, newPasswordError } from "@/components/auth/NewPasswordFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LOGIN_PATH } from "@/lib/auth";
import { toastApiError } from "@/lib/api-error";

type ResetPasswordDialogProps = {
  authUserId: number;
  userLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ResetPasswordDialog = ({
  authUserId,
  userLabel,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resetPassword = useResetUserPassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const saving = resetPassword.isPending;

  const reset = () => {
    setNewPassword("");
    setConfirmPassword("");
    resetPassword.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (saving) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = newPasswordError(newPassword, confirmPassword);
    if (error) {
      toast.error(error);
      return;
    }

    resetPassword.mutate(
      { authUserId, body: { newPassword } },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
          const me = queryClient.getQueryData<UserSalesAccessResponse>(salesAccessKeys.mine());
          if (me?.authUserId === authUserId) {
            // Resetting your own account revokes the token this session is using.
            clearSession();
            queryClient.clear();
            toast.success("Password reset", {
              description: "Sign in again with your new password.",
            });
            navigate(LOGIN_PATH, { replace: true });
            return;
          }
          toast.success("Password reset", {
            description: `${userLabel} can sign in with the new password now.`,
          });
        },
        onError: (err) => toastApiError(err, "Failed to reset password"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for {userLabel}. Any lockout is cleared and all of their
              existing sessions are signed out.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <NewPasswordFields
              idPrefix="reset"
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
            <Button type="submit" disabled={saving || !newPassword || !confirmPassword}>
              {saving ? "Saving…" : "Reset password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
