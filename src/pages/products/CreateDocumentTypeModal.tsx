import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateDocumentType } from "@/api/document-types";
import {
  useListDocuments,
  createDocument,
  buildCreateDocumentFormData,
} from "@/api/documents";
import type { DocumentsDocumentTypesDocumentTypeResponse } from "@/api/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (documentType: DocumentsDocumentTypesDocumentTypeResponse) => void;
};

const CreateDocumentTypeModal = ({ open, onOpenChange, onCreated }: Props) => {
  const createDocumentType = useCreateDocumentType();
  const { data: documentsPage } = useListDocuments({ pageNumber: 1, pageSize: 200 });
  const templateDocuments = documentsPage?.items ?? [];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateDocumentId, setTemplateDocumentId] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setTemplateDocumentId("");
      setTemplateFile(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Document type name is required");
      return;
    }
    setSaving(true);
    try {
      let templateId = templateDocumentId || null;
      if (templateFile) {
        const uploaded = await createDocument(
          buildCreateDocumentFormData(templateFile, templateFile.name)
        );
        if (!uploaded.id) throw new Error("Failed to upload template document");
        templateId = uploaded.id;
      }
      const created = await createDocumentType.mutateAsync({
        name: name.trim(),
        description: description.trim() || name.trim(),
        templateDocumentId: templateId,
      });
      toast.success(`Document type created: ${created.name ?? name}`);
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create document type");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create document type</DialogTitle>
          <DialogDescription>
            Adds a document type to the catalog. You can then select it for this product.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="dt-name">Name *</Label>
            <Input
              id="dt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ID Card / Passport"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dt-desc">Description</Label>
            <Textarea
              id="dt-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — defaults to name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Template document</Label>
            <Select
              value={templateDocumentId || "none"}
              onValueChange={(v) => {
                setTemplateDocumentId(v === "none" ? "" : v);
                setTemplateFile(null);
              }}
              disabled={Boolean(templateFile)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select existing document…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {templateDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id ?? ""}>
                    {doc.originalFileName ?? doc.storedFileName ?? doc.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Or upload template</Label>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setTemplateFile(file);
                if (file) setTemplateDocumentId("");
              }}
            />
            {templateFile && (
              <p className="text-xs text-muted-foreground truncate">Will upload: {templateFile.name}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || createDocumentType.isPending}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {saving || createDocumentType.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDocumentTypeModal;
