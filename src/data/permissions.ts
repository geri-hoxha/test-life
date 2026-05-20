// Permission matrix data layer (in-memory demo store)

export type Bank = { id: string; name: string; code: string; region: string };
export type Agent = { id: string; name: string; code: string; tier: "Junior" | "Senior" | "Lead" };

export type PermissionSubjectType = "BANK" | "AGENT";

export type Permission = {
  id: string;
  productId: string;
  templateId: string;
  subjectType: PermissionSubjectType;
  subjectId: string;
  canAccess: boolean;
  updatedAt: string; // ISO
  updatedBy: string;
};

export type AuditEvent = {
  id: string;
  templateId: string;
  productId: string;
  action: string;
  detail: string;
  actor: string;
  at: string; // ISO
};

export type MatrixProduct = { id: string; name: string; code: string };
export type MatrixTemplate = { id: string; productId: string; name: string; type: string };

// ---------- Seed: 5 products, 20 templates, 10 banks, 20 agents ----------
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
      out.push({ id: `TPL-${n++}`, productId: p.id, name, type: name.toLowerCase().includes("single") ? "SP" : name.toLowerCase().includes("kursim") ? "GP" : "RP" });
    }
  }
  return out;
})();

export const matrixBanks: Bank[] = [
  { id: "BNK-01", name: "BKT — Tirana HQ",          code: "BKT-TR", region: "Tirana" },
  { id: "BNK-02", name: "BKT — Durres",             code: "BKT-DR", region: "Durres" },
  { id: "BNK-03", name: "Raiffeisen — Tirana",      code: "RBA-TR", region: "Tirana" },
  { id: "BNK-04", name: "Raiffeisen — Vlore",       code: "RBA-VL", region: "Vlore" },
  { id: "BNK-05", name: "Credins — Tirana",         code: "CRD-TR", region: "Tirana" },
  { id: "BNK-06", name: "Credins — Shkoder",        code: "CRD-SH", region: "Shkoder" },
  { id: "BNK-07", name: "Intesa Sanpaolo Albania",  code: "ISP-AL", region: "Tirana" },
  { id: "BNK-08", name: "OTP Bank — Tirana",        code: "OTP-TR", region: "Tirana" },
  { id: "BNK-09", name: "ABI Bank — Elbasan",       code: "ABI-EL", region: "Elbasan" },
  { id: "BNK-10", name: "Union Bank — Korce",       code: "UNI-KO", region: "Korce" },
];

const agentFirst = ["Arben","Erida","Besnik","Mirela","Genti","Anila","Florian","Klodian","Suela","Dritan","Edona","Erion","Vjollca","Ardian","Ledjon","Iva","Olta","Renato","Sokol","Xhuljana"];
const agentLast  = ["Hoxha","Kola","Rama","Hysa","Berisha","Dervishi","Lala","Hajdari","Murati","Bardhi","Ceka","Marku","Prifti","Nikolla","Kashari","Doci","Zenelaj","Bushati","Aliaj","Voci"];
const tiers: Agent["tier"][] = ["Junior", "Senior", "Lead"];

export const matrixAgents: Agent[] = agentFirst.map((f, i) => ({
  id: `AGT-${String(i + 1).padStart(2, "0")}`,
  name: `${f} ${agentLast[i]}`,
  code: `AG-${f.slice(0, 2).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
  tier: tiers[i % 3],
}));

// ---------- Random permission seed (deterministic) ----------
let seedN = 1;
const rand = () => {
  // Mulberry32-ish deterministic
  seedN = (seedN * 1664525 + 1013904223) >>> 0;
  return (seedN & 0xffffffff) / 0x100000000;
};

const todayIso = "2026-05-18T10:24:00Z";
let permissions: Permission[] = (() => {
  const out: Permission[] = [];
  let pid = 1;
  for (const t of matrixTemplates) {
    for (const b of matrixBanks) {
      out.push({
        id: `PRM-${pid++}`,
        productId: t.productId,
        templateId: t.id,
        subjectType: "BANK",
        subjectId: b.id,
        canAccess: rand() > 0.45,
        updatedAt: todayIso,
        updatedBy: "system.seed",
      });
    }
    for (const a of matrixAgents) {
      out.push({
        id: `PRM-${pid++}`,
        productId: t.productId,
        templateId: t.id,
        subjectType: "AGENT",
        subjectId: a.id,
        canAccess: rand() > 0.55,
        updatedAt: todayIso,
        updatedBy: "system.seed",
      });
    }
  }
  return out;
})();

let auditLog: AuditEvent[] = matrixTemplates.slice(0, 8).map((t, i) => ({
  id: `AUD-${i + 1}`,
  templateId: t.id,
  productId: t.productId,
  action: i % 3 === 0 ? "Bulk allow" : i % 3 === 1 ? "Permission toggled" : "Cloned permissions",
  detail: i % 3 === 0 ? "Granted access to all banks" : i % 3 === 1 ? `Updated 1 subject access` : `Cloned from ${matrixTemplates[(i + 1) % matrixTemplates.length].name}`,
  actor: ["Erin Hoxha", "Admin", "Aida M."][i % 3],
  at: new Date(Date.now() - i * 86400_000 * 2).toISOString(),
}));

// ---------- Public API ----------
export const listPermissions = (productId?: string, templateIds?: string[]) =>
  permissions.filter(
    (p) =>
      (!productId || p.productId === productId) &&
      (!templateIds || templateIds.includes(p.templateId))
  );

export const getPermission = (templateId: string, subjectType: PermissionSubjectType, subjectId: string) =>
  permissions.find(
    (p) => p.templateId === templateId && p.subjectType === subjectType && p.subjectId === subjectId
  );

export const setAccess = (
  templateId: string,
  subjectType: PermissionSubjectType,
  subjectId: string,
  canAccess: boolean,
  actor = "Erin Hoxha"
) => {
  const tpl = matrixTemplates.find((t) => t.id === templateId);
  if (!tpl) return;
  const idx = permissions.findIndex(
    (p) => p.templateId === templateId && p.subjectType === subjectType && p.subjectId === subjectId
  );
  const now = new Date().toISOString();
  if (idx >= 0) {
    permissions[idx] = { ...permissions[idx], canAccess, updatedAt: now, updatedBy: actor };
  } else {
    permissions = [
      ...permissions,
      {
        id: `PRM-${permissions.length + 1}`,
        productId: tpl.productId,
        templateId,
        subjectType,
        subjectId,
        canAccess,
        updatedAt: now,
        updatedBy: actor,
      },
    ];
  }
};

export const bulkSetForTemplate = (
  templateId: string,
  subjectType: PermissionSubjectType,
  canAccess: boolean,
  actor = "Erin Hoxha"
) => {
  const subjects = subjectType === "BANK" ? matrixBanks : matrixAgents;
  for (const s of subjects) setAccess(templateId, subjectType, s.id, canAccess, actor);
  pushAudit(templateId, canAccess ? "Bulk allow" : "Bulk deny", `${canAccess ? "Granted" : "Revoked"} access for all ${subjectType === "BANK" ? "banks" : "agents"}`, actor);
};

export const clonePermissions = (fromTemplateId: string, toTemplateId: string, actor = "Erin Hoxha") => {
  const src = permissions.filter((p) => p.templateId === fromTemplateId);
  for (const p of src) setAccess(toTemplateId, p.subjectType, p.subjectId, p.canAccess, actor);
  const fromName = matrixTemplates.find((t) => t.id === fromTemplateId)?.name ?? fromTemplateId;
  pushAudit(toTemplateId, "Cloned permissions", `Cloned permissions from ${fromName}`, actor);
};

const pushAudit = (templateId: string, action: string, detail: string, actor: string) => {
  const tpl = matrixTemplates.find((t) => t.id === templateId);
  if (!tpl) return;
  auditLog = [
    {
      id: `AUD-${auditLog.length + 1}`,
      templateId,
      productId: tpl.productId,
      action,
      detail,
      actor,
      at: new Date().toISOString(),
    },
    ...auditLog,
  ];
};

export const recordAudit = pushAudit;

export const listAudit = (templateId?: string) =>
  auditLog.filter((a) => !templateId || a.templateId === templateId);

export const templateStats = (templateId: string) => {
  const perms = permissions.filter((p) => p.templateId === templateId);
  const banks = perms.filter((p) => p.subjectType === "BANK");
  const agents = perms.filter((p) => p.subjectType === "AGENT");
  return {
    banksAllowed: banks.filter((p) => p.canAccess).length,
    banksTotal: matrixBanks.length,
    agentsAllowed: agents.filter((p) => p.canAccess).length,
    agentsTotal: matrixAgents.length,
    lastUpdated: perms.reduce((m, p) => (p.updatedAt > m ? p.updatedAt : m), ""),
  };
};

export const globalStats = (productId?: string) => {
  const perms = productId ? permissions.filter((p) => p.productId === productId) : permissions;
  const totalGrants = perms.filter((p) => p.canAccess).length;
  const totalSlots = perms.length;
  const templates = productId
    ? matrixTemplates.filter((t) => t.productId === productId)
    : matrixTemplates;
  const openTemplates = templates.filter((t) =>
    perms.some((p) => p.templateId === t.id && p.canAccess)
  ).length;
  return {
    totalGrants,
    totalSlots,
    coverage: totalSlots ? totalGrants / totalSlots : 0,
    templates: templates.length,
    openTemplates,
    banks: matrixBanks.length,
    agents: matrixAgents.length,
  };
};
