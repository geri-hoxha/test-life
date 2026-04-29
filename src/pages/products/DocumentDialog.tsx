import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { toast } from "sonner";
import {
  ProductDocument, DocumentRequiredFor, DocumentAppliesWhen,
  newDocumentId, SUGGESTED_DOCUMENTS,
} from "@/data/documents";

const REQUIRED_FOR: DocumentRequiredFor[] = ["Policy Holder", "Insured Person", "Beneficiary", "Payer"];
const APPLIES_WHEN: DocumentAppliesWhen[] = ["Always", "Sum insured above threshold", "PEP detected", "Manual verification required"];

const schema = z.object({
  name: z.string().trim().min(1, "Document name is required").max(100, "Max 100 characters"),
  requiredFor: z.array(z.string()).min(1, "Select at least one party"),
  appliesWhen: z.string(),
  thresholdAmount: z.number().nonnegative().optional(),
  notes: z.string().max(500, "Max 500 characters").optional(),
});

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  productId: string;
  versionId: string;
  initial?: ProductDocument | null;
  onSave: (d: ProductDocument) => void;
};

const blank = (productId: string, versionId: string): ProductDocument => ({
  id: newDocumentId(),
  productId, versionId,
  name: "",
  requiredFor: ["Policy Holder"],
  isMandatory: true,
  appliesWhen: "Always",
  thresholdAmount: 0,
  notes: "",
});

const DocumentDialog = ({ open, onOpenChange, productId, versionId, initial, onSave }: Props) => {
  const [d, setD] = useState<ProductDocument>(initial ?? blank(productId, versionId));

  useEffect(() => {
    setD(initial ?? blank(productId, versionId));
  }, [initial, productId, versionId, open]);

  const set = <K extends keyof ProductDocument>(k: K, v: ProductDocument[K]) =>
    setD((s) => ({ ...s, [k]: v }));

  const togglePart = (p: DocumentRequiredFor) =>
    setD((s) => ({
      ...s,
      requiredFor: s.requiredFor.includes(p) ? s.requiredFor.filter((x) => x !== p) : [...s.requiredFor, p],
    }));

  const showThreshold = d.appliesWhen === "Sum insured above threshold";

  const handleSave = () => {
    const result = schema.safeParse({
      name: d.name,
      requiredFor: d.requiredFor,
      appliesWhen: d.appliesWhen,
      thresholdAmount: showThreshold ? (d.thresholdAmount ?? 0) : undefined,
      notes: d.notes,
    });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    onSave({
      ...d,
      thresholdAmount: showThreshold ? d.thresholdAmount : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit document requirement" : "New document requirement"}</DialogTitle>
          <DialogDescription>
            Configure when this document must be collected during the application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="dname">Document Name *</Label>
            <Input
              id="dname"
              value={d.name}
              maxLength={100}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. ID Card / Passport"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="text-xs text-muted-foreground mr-1">Suggestions:</span>
              {SUGGESTED_DOCUMENTS.filter((s) => s !== d.name).slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("name", s)}
                  className="text-xs px-2 py-0.5 rounded border border-dashed border-border hover:border-accent hover:text-accent"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border p-4">
            <Label className="block mb-2.5">Required For *</Label>
            <div className="grid grid-cols-2 gap-2">
              {REQUIRED_FOR.map((p) => (
                <label key={p} className="flex items-center gap-2 p-2 rounded hover:bg-accent-soft/40 cursor-pointer">
                  <Checkbox checked={d.requiredFor.includes(p)} onCheckedChange={() => togglePart(p)} />
                  <span className="text-sm">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Applies When</Label>
              <Select value={d.appliesWhen} onValueChange={(v) => set("appliesWhen", v as DocumentAppliesWhen)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APPLIES_WHEN.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {showThreshold && (
              <div className="space-y-1.5">
                <Label htmlFor="thr">Threshold Amount (€)</Label>
                <Input
                  id="thr" type="number" min={0}
                  value={d.thresholdAmount ?? 0}
                  onChange={(e) => set("thresholdAmount", +e.target.value)}
                  placeholder="100000"
                />
              </div>
            )}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="block">Mandatory</Label>
              <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-md border border-input bg-background cursor-pointer">
                <span className="text-sm">{d.isMandatory ? "Required" : "Optional"}</span>
                <Switch checked={d.isMandatory} onCheckedChange={(v) => set("isMandatory", v)} />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes" rows={3}
              maxLength={500}
              value={d.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Additional instructions for the customer or operator…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {initial ? "Save changes" : "Add document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentDialog;
