import { describe, expect, it } from "vitest";
import { customerName, insuredFullName } from "./customer-name";

describe("customerName", () => {
  it("prefers the policy holder", () => {
    expect(customerName({ policyHolderName: " Ann Hoxha ", insuredName: "Bob Hoxha" })).toBe("Ann Hoxha");
  });

  it("falls back to the insured when the response has no holder", () => {
    expect(customerName({ policyHolderName: null, insuredFirstName: "Bob", insuredLastName: "Hoxha" })).toBe(
      "Bob Hoxha",
    );
    expect(customerName({ insuredName: "Bob Hoxha" })).toBe("Bob Hoxha");
  });

  it("is empty when nobody is named", () => {
    expect(customerName({})).toBe("");
  });
});

describe("insuredFullName", () => {
  it("joins the first and last name, else uses the full insured name", () => {
    expect(insuredFullName({ insuredFirstName: "Bob", insuredLastName: " Hoxha " })).toBe("Bob Hoxha");
    expect(insuredFullName({ insuredName: "Bob Hoxha" })).toBe("Bob Hoxha");
  });
});
