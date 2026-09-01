const OCTET_STREAM = "application/octet-stream";

const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  txt: "text/plain",
  csv: "text/csv",
  html: "text/html",
  htm: "text/html",
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const extensionOf = (fileName?: string) => {
  const base = fileName?.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
};

export const inferPrintableMimeType = (
  blob: Blob,
  fileName?: string,
  declaredMime?: string,
) => {
  const declared = (declaredMime || blob.type || "").toLowerCase().split(";")[0].trim();
  if (declared && declared !== OCTET_STREAM && declared !== "binary/octet-stream") {
    return declared;
  }
  const fromName = EXT_MIME[extensionOf(fileName)];
  if (fromName) return fromName;
  return declared && declared !== OCTET_STREAM ? declared : "";
};

const printHtml = (title: string, body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  html, body { margin: 0; height: 100%; background: #fff; }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; display: block; margin: 0 auto; }
  embed, iframe { width: 100%; height: 100%; border: 0; }
  pre { white-space: pre-wrap; word-break: break-word; font: 12px/1.4 ui-monospace, monospace; padding: 16px; }
</style></head><body>${body}</body></html>`;

/**
 * Open the browser print dialog without triggering a file download.
 * Never navigates the iframe to a raw blob URL — that makes Chrome download
 * octet-stream / Office files (and some PDFs).
 */
export const openBlobPrintDialog = async (
  blob: Blob,
  options?: { fileName?: string; mimeType?: string },
) => {
  const title = options?.fileName?.trim() || "Document";
  const mime = inferPrintableMimeType(blob, options?.fileName, options?.mimeType);
  const typed = mime && blob.type !== mime ? blob.slice(0, blob.size, mime) : blob;
  const url = URL.createObjectURL(typed);

  const isImage = mime.startsWith("image/");
  const isPdf = mime === "application/pdf";
  const isHtml = mime === "text/html";
  const isText = mime.startsWith("text/") && !isHtml;

  let srcdoc: string;
  if (isImage) {
    srcdoc = printHtml(title, `<img src="${escapeHtml(url)}" alt="${escapeHtml(title)}" />`);
  } else if (isPdf) {
    srcdoc = printHtml(
      title,
      `<embed src="${escapeHtml(url)}" type="application/pdf" />`,
    );
  } else if (isText) {
    const text = await typed.text();
    srcdoc = printHtml(title, `<pre>${escapeHtml(text)}</pre>`);
  } else if (isHtml) {
    srcdoc = await typed.text();
  } else {
    // Never navigate to / embed this blob — the browser would download it.
    srcdoc = printHtml(
      title,
      `<pre>${escapeHtml(title)}\n\nThis file type cannot be shown in the print preview. Use Download to save it.</pre>`,
    );
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", title);
  iframe.style.position = "fixed";
  iframe.style.top = "0";
  iframe.style.left = "-12000px";
  iframe.style.width = "1024px";
  iframe.style.height = "1400px";
  iframe.style.border = "0";
  iframe.srcdoc = srcdoc;
  document.body.appendChild(iframe);

  const cleanup = () => {
    iframe.remove();
    URL.revokeObjectURL(url);
  };

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(cleanup, 60_000);
    }
  };

  iframe.addEventListener("load", triggerPrint, { once: true });
  window.setTimeout(triggerPrint, 1200);
};
