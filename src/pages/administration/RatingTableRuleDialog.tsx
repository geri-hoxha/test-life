import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DomainCommonGender, RatingTablesAddRatingTableRuleRequest } from "@/api/types";
import { getCurrencies } from "@/config/currencies";
import { toast } from "sonner";

type FormState = {
  minAge: string;
  maxAge: string;
  gender: DomainCommonGender | "";
  isFlat: boolean;
  flatValue: string;
  flatValueCurrency: string;
  percentageValue: string;
};

const emptyForm = (): FormState => ({
  minAge: "0",
  maxAge: "99",
  gender: "male",
  isFlat: true,
  flatValue: "",
  flatValueCurrency: "EUR",
  percentageValue: "",
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving?: boolean;
  onSave: (body: RatingTablesAddRatingTableRuleRequest) => void;
};

const RatingTableRuleDialog = ({ open, onOpenChange, saving, onSave }: Props) => {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const minAge = Number(form.minAge);
    const maxAge = Number(form.maxAge);
    const flatValue = Number(form.flatValue);
    const percentageValue = Number(form.percentageValue);

    if (!Number.isFinite(minAge) || minAge < 0) {
      toast.error("Min age must be a non-negative number");
      return;
    }
    if (!Number.isFinite(maxAge) || maxAge < 0) {
      toast.error("Max age must be a non-negative number");
      return;
    }
    if (maxAge < minAge) {
      toast.error("Max age must be greater than or equal to min age");
      return;
    }
    if (!form.gender) {
      toast.error("Gender is required");
      return;
    }
    if (form.isFlat) {
      if (!Number.isFinite(flatValue)) {
        toast.error("Flat value is required");
        return;
      }
      if (!form.flatValueCurrency.trim()) {
        toast.error("Currency is required for flat rates");
        return;
      }
    } else if (!Number.isFinite(percentageValue)) {
      toast.error("Percentage value is required");
      return;
    }

    onSave({
      minAge,
      maxAge,
      gender: form.gender,
      isFlat: form.isFlat,
      flatValue: form.isFlat ? flatValue : 0,
      flatValueCurrency: form.isFlat ? form.flatValueCurrency.trim() : form.flatValueCurrency.trim() || "EUR",
      // UI uses whole percents (20 → 20%); API expects a fraction (0.2).
      percentageValue: form.isFlat ? 0 : percentageValue / 100,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add rating rule</DialogTitle>
          <DialogDescription>
            Define an age band, gender, and either a flat or percentage rate.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rule-min-age">Min age</Label>
            <Input
              id="rule-min-age"
              type="number"
              min={0}
              value={form.minAge}
              onChange={(e) => setField("minAge", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rule-max-age">Max age</Label>
            <Input
              id="rule-max-age"
              type="number"
              min={0}
              value={form.maxAge}
              onChange={(e) => setField("maxAge", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Gender</Label>
            <Select
              value={form.gender || undefined}
              onValueChange={(v) => setField("gender", v as DomainCommonGender)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between rounded-md border px-3 py-2.5">
            <div>
              <div className="text-sm font-medium">Flat rate</div>
              <p className="text-xs text-muted-foreground">
                Off uses a percentage value instead of a fixed amount.
              </p>
            </div>
            <Switch checked={form.isFlat} onCheckedChange={(v) => setField("isFlat", v)} />
          </div>
          {form.isFlat ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="rule-flat-value">Flat value</Label>
                <Input
                  id="rule-flat-value"
                  type="number"
                  step="any"
                  value={form.flatValue}
                  onChange={(e) => setField("flatValue", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select
                  value={form.flatValueCurrency}
                  onValueChange={(v) => setField("flatValueCurrency", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCurrencies().map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rule-percentage">Percentage (%)</Label>
              <Input
                id="rule-percentage"
                type="number"
                step="any"
                value={form.percentageValue}
                onChange={(e) => setField("percentageValue", e.target.value)}
                placeholder="0"
              />

            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : "Add rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingTableRuleDialog;
