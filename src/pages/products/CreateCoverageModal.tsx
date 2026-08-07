import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreateCoverage } from "@/api/coverages";
import type { CoveragesCoverageResponse } from "@/api/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (coverage: CoveragesCoverageResponse) => void;
};

const CreateCoverageModal = ({ open, onOpenChange, onCreated }: Props) => {
  const createCoverage = useCreateCoverage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Coverage name is required");
      return;
    }
    try {
      const created = await createCoverage.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success(`Coverage created: ${created.name ?? name}`);
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create coverage");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create coverage</DialogTitle>
          <DialogDescription>
            Adds a coverage to the catalog. You can then select it for this product.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cov-name">Name *</Label>
            <Input
              id="cov-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Death, Disability"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cov-desc">Description</Label>
            <Textarea
              id="cov-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createCoverage.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={createCoverage.isPending}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {createCoverage.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCoverageModal;
