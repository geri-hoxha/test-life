import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const normalizeRoles = (roles: string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const role of roles) {
    const value = role.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
};

type RoleFieldProps = {
  id?: string;
  roles: string[];
  onChange: (roles: string[]) => void;
  disabled?: boolean;
};

export const RoleField = ({ id = "user-roles", roles, onChange, disabled }: RoleFieldProps) => {
  const [draft, setDraft] = useState("");

  const addDraft = () => {
    const pieces = draft
      .split(/[,;]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (pieces.length === 0) return;
    onChange(normalizeRoles([...roles, ...pieces]));
    setDraft("");
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Roles</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          disabled={disabled}
          placeholder="Role name"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addDraft();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addDraft} disabled={disabled || !draft.trim()}>
          Add
        </Button>
      </div>
      {roles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {roles.map((role) => (
            <Badge key={role} variant="secondary" className="gap-1 pr-1">
              {role}
              <button
                type="button"
                className="rounded-sm hover:text-foreground"
                disabled={disabled}
                onClick={() => onChange(roles.filter((item) => item !== role))}
                aria-label={`Remove ${role}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">At least one role is required.</p>
    </div>
  );
};
