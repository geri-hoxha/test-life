// Permission matrix data layer (in-memory demo store)

export type Bank = { id: string; name: string; code: string };
export type BankBranch = { id: string; bankId: string; name: string; region: string };
export type Agency = { id: string; name: string; code: string; region: string };
export type Agent = { id: string; agencyId: string; name: string; code: string; tier: "Junior" | "Senior" | "Lead" };

export type GrantSubjectType = "AGENT";

export type Grant = {
  productId: string;
  templateId: string;
  subjectType: GrantSubjectType;
  subjectId: string; // bankId or agencyId
  canSell: boolean;
  commissionPct: number; // 0–100 first-sale
  renewalCommissionPct: number; // 0–100 renewal
};

export type MatrixProduct = { id: string; name: string; code: string };
export type MatrixTemplate = { id: string; productId: string; name: string; type: string };

// ---------- Seed: products & templates ----------
export const matrixProducts: MatrixProduct[] = [
  { id: "PRD-001", name: "Sigurim i Jetes i Kombinuar", code: "05" },
  { id: "PRD-002", name: "Jete e Debitorit Regular",    code: "07" },
  { id: "PRD-003", name: "Jete e Debitorit Single",     code: "08" },
  { id: "PRD-004", name: "Sigurim Jete i Kombinuar 09", code: "09" },
  { id: "PRD-005", name: "Sigurim Jete me Kursim",      code: "SJ" },
];

const tplNamesByProduct: Record<string, string[]> = {
  "PRD-001": ["ABI i Pjesshem", "AFB Mortage", "BKT i Pjesshem me tabele", "Credins Standard"],
  "PRD-002": ["Raiffeisen Regular", "BKT Debitor Regular", "Intesa Regular", "OTP Regular"],
  "PRD-003": ["BKT Debitor Single", "Credins Single", "Raiffeisen Single", "ABI Single"],
  "PRD-004": ["Plan Bazik 09", "Plan Premium 09", "Plan Family 09", "Plan Senior 09"],
  "PRD-005": ["Kursim Standard", "Kursim Plus", "Kursim Junior", "Kursim Pension"],
};

export const matrixTemplates: MatrixTemplate[] = (() => {
  const out: MatrixTemplate[] = [];
  let n = 3001;
  for (const p of matrixProducts) {
    for (const name of tplNamesByProduct[p.id]) {
      out.push({
        id: `TPL-${n++}`,
        productId: p.id,
        name,
        type: name.toLowerCase().includes("single") ? "SP" : name.toLowerCase().includes("kursim") ? "GP" : "RP",
      });
    }
  }
  return out;
})();

// ---------- Banks & branches ----------
export const matrixBanks: Bank[] = [
  { id: "BNK-BKT", name: "BKT",           code: "BKT" },
  { id: "BNK-RBA", name: "Raiffeisen",    code: "RBA" },
  { id: "BNK-CRD", name: "Credins",       code: "CRD" },
  { id: "BNK-ISP", name: "Intesa Sanpaolo", code: "ISP" },
  { id: "BNK-OTP", name: "OTP Bank",      code: "OTP" },
  { id: "BNK-ABI", name: "ABI Bank",      code: "ABI" },
  { id: "BNK-UNI", name: "Union Bank",    code: "UNI" },
];

const branchesByBank: Record<string, { name: string; region: string }[]> = {
  "BNK-BKT": [{ name: "Tirana HQ", region: "Tirana" }, { name: "Durres", region: "Durres" }, { name: "Vlore", region: "Vlore" }],
  "BNK-RBA": [{ name: "Tirana Center", region: "Tirana" }, { name: "Vlore", region: "Vlore" }, { name: "Shkoder", region: "Shkoder" }],
  "BNK-CRD": [{ name: "Tirana", region: "Tirana" }, { name: "Shkoder", region: "Shkoder" }],
  "BNK-ISP": [{ name: "Tirana", region: "Tirana" }, { name: "Korce", region: "Korce" }],
  "BNK-OTP": [{ name: "Tirana", region: "Tirana" }, { name: "Elbasan", region: "Elbasan" }],
  "BNK-ABI": [{ name: "Elbasan", region: "Elbasan" }, { name: "Fier", region: "Fier" }],
  "BNK-UNI": [{ name: "Korce", region: "Korce" }, { name: "Tirana", region: "Tirana" }],
};

export const matrixBankBranches: BankBranch[] = (() => {
  const out: BankBranch[] = [];
  let n = 1;
  for (const b of matrixBanks) {
    for (const br of branchesByBank[b.id] ?? []) {
      out.push({ id: `BRC-${String(n++).padStart(3, "0")}`, bankId: b.id, name: br.name, region: br.region });
    }
  }
  return out;
})();

// ---------- Agencies & agents ----------
export const matrixAgencies: Agency[] = [
  { id: "AGY-01", name: "Sigal Tirana",   code: "SIG-TR", region: "Tirana" },
  { id: "AGY-02", name: "Sigal Durres",   code: "SIG-DR", region: "Durres" },
  { id: "AGY-03", name: "Insig Tirana",   code: "INS-TR", region: "Tirana" },
  { id: "AGY-04", name: "Insig Vlore",    code: "INS-VL", region: "Vlore" },
  { id: "AGY-05", name: "Albsig Shkoder", code: "ALB-SH", region: "Shkoder" },
  { id: "AGY-06", name: "Albsig Korce",   code: "ALB-KO", region: "Korce" },
];

const agentFirst = ["Arben","Erida","Besnik","Mirela","Genti","Anila","Florian","Klodian","Suela","Dritan","Edona","Erion","Vjollca","Ardian","Ledjon","Iva","Olta","Renato","Sokol","Xhuljana"];
const agentLast  = ["Hoxha","Kola","Rama","Hysa","Berisha","Dervishi","Lala","Hajdari","Murati","Bardhi","Ceka","Marku","Prifti","Nikolla","Kashari","Doci","Zenelaj","Bushati","Aliaj","Voci"];
const tiers: Agent["tier"][] = ["Junior", "Senior", "Lead"];

export const matrixAgents: Agent[] = agentFirst.map((f, i) => ({
  id: `AGT-${String(i + 1).padStart(2, "0")}`,
  agencyId: matrixAgencies[i % matrixAgencies.length].id,
  name: `${f} ${agentLast[i]}`,
  code: `AG-${f.slice(0, 2).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
  tier: tiers[i % 3],
}));

// ---------- Random grant seed (deterministic) ----------
let seedN = 1;
const rand = () => {
  seedN = (seedN * 1664525 + 1013904223) >>> 0;
  return (seedN & 0xffffffff) / 0x100000000;
};

const grantKey = (productId: string, templateId: string, subjectType: GrantSubjectType, subjectId: string) =>
  `${productId}|${templateId}|${subjectType}|${subjectId}`;

const grants = new Map<string, Grant>();

(function seed() {
  for (const t of matrixTemplates) {
    for (const ag of matrixAgents) {
      const canSell = rand() > 0.4;
      const commissionPct = Math.round((5 + rand() * 15) * 10) / 10;
      const renewalCommissionPct = Math.round((commissionPct * (0.4 + rand() * 1.0)) * 10) / 10;
      const g: Grant = { productId: t.productId, templateId: t.id, subjectType: "AGENT", subjectId: ag.id, canSell, commissionPct, renewalCommissionPct };
      grants.set(grantKey(g.productId, g.templateId, g.subjectType, g.subjectId), g);
    }
  }
})();

// ---------- Public API ----------
export type GrantRow = {
  id: string; // composite key
  productId: string;
  productName: string;
  templateId: string;
  templateName: string;
  templateType: string;
  subjectType: GrantSubjectType;
  agencyId: string;
  agencyName: string;
  agentId: string;
  agentName: string;
  canSell: boolean;
  commissionPct: number;
};

export const listGrantRows = (): GrantRow[] => {
  const out: GrantRow[] = [];
  for (const t of matrixTemplates) {
    const product = matrixProducts.find((p) => p.id === t.productId);
    for (const ag of matrixAgents) {
      const agy = matrixAgencies.find((a) => a.id === ag.agencyId);
      const k = grantKey(t.productId, t.id, "AGENT", ag.id);
      const g = grants.get(k);
      out.push({
        id: k,
        productId: t.productId,
        productName: product?.name ?? "",
        templateId: t.id,
        templateName: t.name,
        templateType: t.type,
        subjectType: "AGENT",
        agencyId: agy?.id ?? "",
        agencyName: agy?.name ?? "",
        agentId: ag.id,
        agentName: ag.name,
        canSell: g?.canSell ?? false,
        commissionPct: g?.commissionPct ?? 0,
      });
    }
  }
  return out;
};

export const updateGrant = (id: string, patch: Partial<Pick<Grant, "canSell" | "commissionPct">>) => {
  const existing = grants.get(id);
  if (existing) {
    grants.set(id, { ...existing, ...patch });
    return;
  }
  const [productId, templateId, subjectType, subjectId] = id.split("|") as [string, string, GrantSubjectType, string];
  grants.set(id, {
    productId,
    templateId,
    subjectType,
    subjectId,
    canSell: false,
    commissionPct: 0,
    ...patch,
  });
};
