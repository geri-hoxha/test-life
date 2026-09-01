import { getApiBaseUrl } from "@/api/client";

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

/** Prefer file magic over Content-Type / filename — print often returns HTML labeled as PDF. */
const sniffMagicMime = async (blob: Blob): Promise<string | undefined> => {
  const buf = new Uint8Array(await blob.slice(0, 256).arrayBuffer());
  if (buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return "application/pdf";
  }

  let i = 0;
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) i = 3;
  while (i < buf.length && buf[i] <= 0x20) i += 1;
  if (i >= buf.length || buf[i] !== 0x3c) return undefined;

  const head = new TextDecoder("utf-8").decode(buf).trim().toLowerCase();
  if (head.includes("<svg")) return "image/svg+xml";
  return "text/html";
};

const printHtml = (title: string, body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  html, body { margin: 0; height: 100%; background: #fff; }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; display: block; margin: 0 auto; }
  embed, iframe { width: 100%; height: 100%; border: 0; }
  pre { white-space: pre-wrap; word-break: break-word; font: 12px/1.4 ui-monospace, monospace; padding: 16px; }
</style></head><body>${body}</body></html>`;

/** Templates ship with jQuery/Bootstrap. In srcdoc those relative scripts resolve to the SPA HTML. */
const prepareHtmlForPrint = (html: string, assetBaseUrl?: string) => {
  let out = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  const base = (assetBaseUrl || getApiBaseUrl()).replace(/\/$/, "");
  if (base && !/<base\b/i.test(out)) {
    const tag = `<base href="${escapeHtml(`${base}/`)}">`;
    out = /<head[^>]*>/i.test(out)
      ? out.replace(/<head([^>]*)>/i, `<head$1>${tag}`)
      : `<head>${tag}</head>${out}`;
  }
  return out;
};

/**
 * Open the browser print dialog without triggering a file download.
 * Never navigates the iframe to a raw blob URL — that makes Chrome download
 * octet-stream / Office files (and some PDFs).
 */
export const openBlobPrintDialog = async (
  blob: Blob,
  options?: { fileName?: string; mimeType?: string; assetBaseUrl?: string },
) => {
  const title = options?.fileName?.trim() || "Document";
  const mime =
    (await sniffMagicMime(blob)) ??
    inferPrintableMimeType(blob, options?.fileName, options?.mimeType);
  const typed = mime && blob.type !== mime ? blob.slice(0, blob.size, mime) : blob;

  const isImage = mime.startsWith("image/");
  const isPdf = mime === "application/pdf";
  const isHtml = mime === "text/html" || mime === "application/xhtml+xml";
  const isText = mime.startsWith("text/") && !isHtml;

  let objectUrl: string | undefined;
  let srcdoc: string;
  if (isImage) {
    objectUrl = URL.createObjectURL(typed);
    srcdoc = printHtml(title, `<img src="${escapeHtml(objectUrl)}" alt="${escapeHtml(title)}" />`);
  } else if (isPdf) {
    objectUrl = URL.createObjectURL(typed);
    srcdoc = printHtml(
      title,
      `<embed src="${escapeHtml(objectUrl)}" type="application/pdf" />`,
    );
  } else if (isText) {
    const text = await typed.text();
    srcdoc = printHtml(title, `<pre>${escapeHtml(text)}</pre>`);
  } else if (isHtml) {
    srcdoc = prepareHtmlForPrint(await typed.text(), options?.assetBaseUrl);
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

  const cleanup = () => {
    iframe.remove();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
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
  iframe.srcdoc = srcdoc;
  document.body.appendChild(iframe);
  window.setTimeout(triggerPrint, isHtml ? 800 : 1200);
};
