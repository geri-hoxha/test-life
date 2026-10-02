type NamedListItem = {
  policyHolderName?: string | null;
  insuredName?: string | null;
  insuredFirstName?: string | null;
  insuredLastName?: string | null;
};

export const insuredFullName = (item: NamedListItem) =>
  [item.insuredFirstName, item.insuredLastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ") ||
  item.insuredName?.trim() ||
  "";

/** The policy holder, or the insured when the list response carries no holder. */
export const customerName = (item: NamedListItem) =>
  item.policyHolderName?.trim() || insuredFullName(item);
