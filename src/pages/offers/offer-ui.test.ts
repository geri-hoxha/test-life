import { describe, expect, it } from "vitest";
import {
  BANK_POLICY_SERIAL_MAX_LENGTH,
  legacyOfferAutoIdFromInput,
  sanitizeBankPolicySerialInput,
  sanitizeLegacyOfferNoInput,
} from "./offer-ui";

describe("sanitizeBankPolicySerialInput", () => {
  it("keeps digits only", () => {
    expect(sanitizeBankPolicySerialInput("92-35 86a6")).toBe("9235866");
    expect(sanitizeBankPolicySerialInput("")).toBe("");
  });

  it("keeps leading zeros", () => {
    expect(sanitizeBankPolicySerialInput("000123")).toBe("000123");
  });

  it("caps the length at the API limit", () => {
    const digits = "9".repeat(BANK_POLICY_SERIAL_MAX_LENGTH + 5);
    expect(sanitizeBankPolicySerialInput(digits)).toHaveLength(
      BANK_POLICY_SERIAL_MAX_LENGTH,
    );
  });

  it("accepts the 30-digit example serial as is", () => {
    expect(sanitizeBankPolicySerialInput("923586634584144080797398845139")).toBe(
      "923586634584144080797398845139",
    );
  });
});

describe("sanitizeLegacyOfferNoInput", () => {
  it("keeps digits only", () => {
    expect(sanitizeLegacyOfferNoInput("12a3-4 5")).toBe("12345");
    expect(sanitizeLegacyOfferNoInput("-5")).toBe("5");
    expect(sanitizeLegacyOfferNoInput("1.5")).toBe("15");
  });

  it("never lets 0 be entered", () => {
    expect(sanitizeLegacyOfferNoInput("0")).toBe("");
    expect(sanitizeLegacyOfferNoInput("000")).toBe("");
    expect(sanitizeLegacyOfferNoInput("007")).toBe("7");
  });

  it("keeps zeros that are not leading", () => {
    expect(sanitizeLegacyOfferNoInput("100")).toBe("100");
  });
});

describe("legacyOfferAutoIdFromInput", () => {
  it("returns undefined for an empty input so the param is not sent", () => {
    expect(legacyOfferAutoIdFromInput("")).toBeUndefined();
  });

  it("parses whole numbers greater than 0", () => {
    expect(legacyOfferAutoIdFromInput("1")).toBe(1);
    expect(legacyOfferAutoIdFromInput("999999999")).toBe(999999999);
  });

  it("rejects 0, negatives and non-digits", () => {
    expect(legacyOfferAutoIdFromInput("0")).toBeUndefined();
    expect(legacyOfferAutoIdFromInput("000")).toBeUndefined();
    expect(legacyOfferAutoIdFromInput("-1")).toBeUndefined();
    expect(legacyOfferAutoIdFromInput("1.5")).toBeUndefined();
    expect(legacyOfferAutoIdFromInput("abc")).toBeUndefined();
  });

  it("rejects numbers beyond the safe integer range", () => {
    expect(legacyOfferAutoIdFromInput("99999999999999999999")).toBeUndefined();
  });
});
