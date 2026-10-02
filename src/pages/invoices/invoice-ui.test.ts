import { describe, expect, it } from "vitest";
import { canRetryFiscalization } from "./invoice-ui";

describe("canRetryFiscalization", () => {
  it("offers a retry for an invoice that is not fiscalized", () => {
    expect(canRetryFiscalization("pending")).toBe(true);
    expect(canRetryFiscalization("failed")).toBe(true);
  });

  it("does not offer a retry once the invoice is fiscalized", () => {
    expect(canRetryFiscalization("fiscalized")).toBe(false);
  });
});
