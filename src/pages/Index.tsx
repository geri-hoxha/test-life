import { useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import KpiCard from "@/components/dashboard/KpiCard";
import RecentOffersTable from "@/components/dashboard/RecentOffersTable";
import PendingReviewTable from "@/components/dashboard/PendingReviewTable";
import QuickStart from "@/components/dashboard/QuickStart";
import { Package, FileText, ShieldCheck, AlertCircle, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import { matrixTemplates } from "@/data/permissions";
import { useListProducts } from "@/api/products";
import { useListOffers } from "@/api/offers";
import { useListPolicies } from "@/api/policies";
import { mapApiOffer } from "@/api/adapters/offers";
import { mapApiPolicy } from "@/api/adapters/policies";

const Index = () => {
  const { data: productsPage } = useListProducts({ pageNumber: 1, pageSize: 200 });
  const { data: offersPage } = useListOffers({ pageNumber: 1, pageSize: 200 });
  const { data: policiesPage } = useListPolicies({ pageNumber: 1, pageSize: 200 });

  const productCount = productsPage?.totalCount ?? productsPage?.items?.length ?? 0;
  const offers = useMemo(
    () => (offersPage?.items ?? []).map(mapApiOffer),
    [offersPage?.items]
  );
  const policies = useMemo(
    () => (policiesPage?.items ?? []).map(mapApiPolicy),
    [policiesPage?.items]
  );

  const draftOffers = offers.filter((o) => o.status === "Draft").length;
  const pendingReview = offers.filter((o) => o.status === "Partially Bound").length;
  const issuedPolicies = policies.length;
  const premiumThisMonth = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7);
    return policies
      .filter((p) => p.issueDate.startsWith(ym))
      .reduce((sum, p) => sum + p.premium, 0);
  }, [policies]);

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Overview
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Good morning, Erin. Here's what's happening across ESIG Life today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            April 2026
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Sellable Products / Templates" value={`${productCount} / ${matrixTemplates.length}`} icon={Package} />
        <KpiCard label="Draft Offers" value={String(draftOffers)} icon={FileText} />
        <KpiCard label="Issued Policies" value={String(issuedPolicies)} icon={ShieldCheck} />
        <KpiCard label="Pending Verification" value={String(pendingReview)} icon={AlertCircle} />
        <KpiCard
          label="Premium This Month"
          value={new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }).format(premiumThisMonth)}
          icon={Euro}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <RecentOffersTable />
        <PendingReviewTable />
      </div>

      <QuickStart />
    </AppShell>
  );
};

export default Index;
