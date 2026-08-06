import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ProductDocument,
  newDocumentId,
} from "@/data/documents";
import { useListDocumentTypes } from "@/api/document-types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  productId: string;
  versionId: string;
  linkedDocumentTypeIds?: string[];
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
  templateDocumentId: null,
  insuredAmountOver: null,
  totalExposureOver: null,
  ageOver: 0,
  isPep: false,
  notes: "",
});

const DocumentDialog = ({ open, onOpenChange, productId, versionId, linkedDocumentTypeIds = [], onSave }: Props) => {
  const [d, setD] = useState<ProductDocument>(blank(productId, versionId));
  const [documentTypeId, setDocumentTypeId] = useState<string>("");
  const { data: typesPage } = useListDocumentTypes({ pageNumber: 1, pageSize: 200 });
  const catalog = useMemo(() => {
    const linked = new Set(linkedDocumentTypeIds);
    return (typesPage?.items ?? []).filter((t) => {
      const id = t.id ?? "";
      return Boolean(id) && !linked.has(id);
    });
  }, [typesPage?.items, linkedDocumentTypeIds]);

  useEffect(() => {
    setD(blank(productId, versionId));
    setDocumentTypeId("");
  }, [productId, versionId, open]);

  const set = <K extends keyof ProductDocument>(k: K, v: ProductDocument[K]) =>
    setD((s) => ({ ...s, [k]: v }));

  const pickExisting = (id: string) => {
    const found = catalog.find((t) => t.id === id);
    setDocumentTypeId(id);
    setD((s) => ({
      ...s,
      name: found?.name?.trim() || s.name,
    }));
  };

  const handleSave = () => {
    if (!documentTypeId) {
      toast.error("Select a document type");
      return;
    }
    onSave({
      ...d,
      documentTypeId,
      isMandatory: Boolean(d.isMandatory),
      appliesWhen: Boolean(d.isMandatory) ? "Always" : "Conditional",
      thresholdAmount: d.insuredAmountOver ?? undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link document type</DialogTitle>
          <DialogDescription>
            Attach an existing document type with API requirement rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label>Document type *</Label>
            <Select value={documentTypeId || undefined} onValueChange={pickExisting}>
              <SelectTrigger><SelectValue placeholder="Select document type…" /></SelectTrigger>
              <SelectContent>
                {catalog.length === 0 ? (
                  <SelectItem value="__none" disabled>No document types available</SelectItem>
                ) : (
                  catalog.map((t) => (
                    <SelectItem key={t.id} value={t.id ?? ""}>
                      {t.name ?? t.id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* API requirement rules */}
          <div className="rounded-md border border-border p-4 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Requirement rules
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="block">Always required</Label>
                <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-md border border-input bg-background cursor-pointer">
                  <span className="text-sm">{d.isMandatory ? "Required" : "Conditional"}</span>
                  <Switch checked={d.isMandatory} onCheckedChange={(v) => set("isMandatory", v)} />
                </label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iao">Insured amount over</Label>
                <Input
                  id="iao"
                  type="number"
                  min={0}
                  value={d.insuredAmountOver ?? ""}
                  onChange={(e) => set("insuredAmountOver", e.target.value === "" ? null : +e.target.value)}
                  placeholder="optional"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="teo">Total exposure over</Label>
                <Input
                  id="teo"
                  type="number"
                  min={0}
                  value={d.totalExposureOver ?? ""}
                  onChange={(e) => set("totalExposureOver", e.target.value === "" ? null : +e.target.value)}
                  placeholder="optional"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="age">Age over</Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  value={d.ageOver ?? 0}
                  onChange={(e) => set("ageOver", +e.target.value)}
                  className="font-mono"
                />
              </div>
           
            </div>
               <div className="space-y-1.5">
                <Label className="block">PEP</Label>
                <label className="flex items-center justify-between gap-3 h-10 px-3 rounded-md border border-input bg-background cursor-pointer">
                  <span className="text-sm">{d.isPep ? "Required for PEP" : "Not PEP-specific"}</span>
                  <Switch checked={Boolean(d.isPep)} onCheckedChange={(v) => set("isPep", v)} />
                </label>
              </div>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Add document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentDialog;
