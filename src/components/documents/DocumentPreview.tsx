import { useState } from "react";
import { downloadDocumentFile, getDocument, openDocumentPrint } from "@/api/documents";
import { toastApiError } from "@/lib/api-error";

export type DocumentFileBusy = {
  id: string;
  action: "preview" | "download";
} | null;

export const useDocumentPreview = () => {
  const [fileBusy, setFileBusy] = useState<DocumentFileBusy>(null);

  const openPreview = async (documentId: string, _label?: string) => {
    setFileBusy({ id: documentId, action: "preview" });
    try {
      await openDocumentPrint(documentId);
    } catch (err) {
      toastApiError(err, "Failed to open document");
    } finally {
      setFileBusy(null);
    }
  };

  const download = async (documentId: string, label: string) => {
    setFileBusy({ id: documentId, action: "download" });
    try {
      const meta = await getDocument(documentId);
      await downloadDocumentFile(
        documentId,
        meta.originalFileName ?? meta.storedFileName ?? label,
      );
    } catch (err) {
      toastApiError(err, "Failed to download document");
    } finally {
      setFileBusy(null);
    }
  };

  return { fileBusy, openPreview, download };
};
