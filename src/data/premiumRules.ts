export type PremiumRuleType =
  | "Fixed premium"
  | "Percentage of insured amount"
  | "Age-based rate"
  | "Gender-based rate"
  | "Age + Gender rate table"
  | "Loan balance based premium"
  | "Manual premium override";

export type RateType = "Fixed" | "Per 1000 Sum Insured" | "Percentage";
export type Gender = "Male" | "Female" | "Any";

export type RateRow = {
  id: string;
  ageFrom: number;
  ageTo: number;
  gender: Gender;
  rate: number;
  rateType: RateType;
};

export type PremiumRule = {
  productId: string;
  versionId: string;
  ruleType: PremiumRuleType;
  fixedAmount?: number;
  percentage?: number;
  loanRatePer1000?: number;
  rateTable: RateRow[];
  /**
   * If true, premium is recalculated each policy year using the customer's
   * age at that year (attained-age pricing). If false, premium stays level
   * at the inception age.
   */
  repriceOnAttainedAge?: boolean;
};

const seed: PremiumRule[] = [
  {
    productId: "PRD-001",
    versionId: "VRS-1001",
    ruleType: "Age + Gender rate table",
    repriceOnAttainedAge: true,
    rateTable: [
      { id: "RR-1", ageFrom: 18, ageTo: 35, gender: "Male", rate: 1.2, rateType: "Per 1000 Sum Insured" },
      { id: "RR-2", ageFrom: 18, ageTo: 35, gender: "Female", rate: 1.0, rateType: "Per 1000 Sum Insured" },
      { id: "RR-3", ageFrom: 36, ageTo: 50, gender: "Male", rate: 1.8, rateType: "Per 1000 Sum Insured" },
      { id: "RR-4", ageFrom: 36, ageTo: 50, gender: "Female", rate: 1.5, rateType: "Per 1000 Sum Insured" },
      { id: "RR-5", ageFrom: 51, ageTo: 65, gender: "Male", rate: 2.9, rateType: "Per 1000 Sum Insured" },
      { id: "RR-6", ageFrom: 51, ageTo: 65, gender: "Female", rate: 2.4, rateType: "Per 1000 Sum Insured" },
    ],
  },
];

let rules: PremiumRule[] = [...seed];

const blankRule = (productId: string, versionId: string): PremiumRule => ({
  productId,
  versionId,
  ruleType: "Age + Gender rate table",
  rateTable: [],
});

export const getPremiumRule = (productId: string, versionId: string): PremiumRule => {
  let r = rules.find((x) => x.productId === productId && x.versionId === versionId);
  if (!r) {
    r = blankRule(productId, versionId);
    rules = [r, ...rules];
  }
  return r;
};

export const savePremiumRule = (rule: PremiumRule) => {
  const i = rules.findIndex((x) => x.productId === rule.productId && x.versionId === rule.versionId);
  if (i >= 0) rules[i] = rule;
  else rules = [rule, ...rules];
};

export const newRowId = () => `RR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

// FX rates → EUR base for the demo
const FX: Record<string, number> = { EUR: 1, USD: 1.0842, ALL: 0.0102 };

export const calculatePremium = (
  rule: PremiumRule,
  input: { age: number; gender: Gender; sumInsured: number; currency: string; loanBalance?: number }
): { amount: number; explanation: string; matched?: RateRow } => {
  const { age, gender, sumInsured, currency, loanBalance } = input;
  const fx = FX[currency] ?? 1;

  const conv = (eur: number) => eur / fx; // amount in selected currency

  switch (rule.ruleType) {
    case "Fixed premium": {
      const amount = conv(rule.fixedAmount ?? 0);
      return { amount, explanation: `Fixed premium of € ${(rule.fixedAmount ?? 0).toFixed(2)}` };
    }
    case "Percentage of insured amount": {
      const pct = rule.percentage ?? 0;
      const amount = (sumInsured * pct) / 100;
      return { amount, explanation: `${pct.toFixed(2)} % × ${sumInsured.toLocaleString()} ${currency}` };
    }
    case "Loan balance based premium": {
      const rate = rule.loanRatePer1000 ?? 0;
      const base = loanBalance ?? sumInsured;
      const amount = (base / 1000) * rate;
      return { amount, explanation: `${rate} per 1000 × ${base.toLocaleString()} ${currency}` };
    }
    case "Manual premium override": {
      return { amount: 0, explanation: "Manual override — premium will be entered by the underwriter." };
    }
    case "Age-based rate":
    case "Gender-based rate":
    case "Age + Gender rate table": {
      const row = rule.rateTable.find(
        (r) =>
          age >= r.ageFrom &&
          age <= r.ageTo &&
          (rule.ruleType === "Age-based rate" ||
            r.gender === "Any" ||
            r.gender === gender)
      );
      if (!row) {
        return { amount: 0, explanation: "No matching rate-table row for this age/gender." };
      }
      let amount = 0;
      let explain = "";
      if (row.rateType === "Fixed") {
        amount = conv(row.rate);
        explain = `Fixed € ${row.rate.toFixed(2)} (age ${row.ageFrom}-${row.ageTo}, ${row.gender})`;
      } else if (row.rateType === "Per 1000 Sum Insured") {
        amount = (sumInsured / 1000) * row.rate;
        explain = `${row.rate} per 1000 × ${sumInsured.toLocaleString()} ${currency} (age ${row.ageFrom}-${row.ageTo}, ${row.gender})`;
      } else {
        amount = (sumInsured * row.rate) / 100;
        explain = `${row.rate} % × ${sumInsured.toLocaleString()} ${currency} (age ${row.ageFrom}-${row.ageTo}, ${row.gender})`;
      }
      return { amount, explanation: explain, matched: row };
    }
  }
};
