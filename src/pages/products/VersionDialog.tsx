import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ProductVersion, VersionStatus, newVersionId } from "@/data/productVersions";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  productId: string;
  initial?: ProductVersion | null;
  onSave: (v: ProductVersion) => void;
};

const toDate = (s?: string) => (s ? parseISO(s) : undefined);
const toISO = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : undefined);

const VersionDialog = ({ open, onOpenChange, productId, initial, onSave }: Props) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [number, setNumber] = useState(initial?.number ?? "");
  const [status, setStatus] = useState<VersionStatus>(initial?.status ?? "Draft");
  const [from, setFrom] = useState<Date | undefined>(toDate(initial?.effectiveFrom));
  const [to, setTo] = useState<Date | undefined>(toDate(initial?.effectiveTo));
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // Reset when re-opened with new initial
  const key = `${initial?.id ?? "new"}-${open}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => key);

  const handleSubmit = () => {
    if (!name || !number) return;
    onSave({
      id: initial?.id ?? newVersionId(),
      productId,
      name, number, status,
      effectiveFrom: toISO(from),
      effectiveTo: toISO(to),
      notes,
      author: initial?.author ?? "Erin Hoxha",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit version" : "New version"}</DialogTitle>
          <DialogDescription>
            Versions let you evolve the product over time. Only Active versions can be sold.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vname">Version Name *</Label>
              <Input id="vname" value={name} onChange={(e) => setName(e.target.value)} placeholder="2026 Standard Life" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vnum">Version Number *</Label>
              <Input id="vnum" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="v1.0" className="font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Effective From</Label>
              <DatePicker value={from} onChange={setFrom} />
            </div>
            <div className="space-y-1.5">
              <Label>Effective To</Label>
              <DatePicker value={to} onChange={setTo} placeholder="Open-ended" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as VersionStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vnotes">Notes</Label>
            <Textarea id="vnotes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What changed in this version?" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {initial ? "Save changes" : "Create version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VersionDialog;
