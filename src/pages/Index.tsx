import { useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import KpiCard from "@/components/dashboard/KpiCard";
import RecentOffersTable from "@/components/dashboard/RecentOffersTable";
import RecentPoliciesTable from "@/components/dashboard/RecentPoliciesTable";
import ActivityChart from "@/components/dashboard/ActivityChart";
import { Package, FileText, ShieldCheck, Receipt } from "lucide-react";
import { useListProducts } from "@/api/products";
import { useListOffers } from "@/api/offers";
import { useListPolicies } from "@/api/policies";
import { useListInvoices } from "@/api/invoices";

const COUNT_QUERY = { pageNumber: 1, pageSize: 1 } as const;

const formatCount = (n: number) => n.toLocaleString("en-US");

const greetingForHour = (hour: number) => {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const Index = () => {
  const { data: productsPage, isLoading: productsLoading } = useListProducts(COUNT_QUERY);
  const { data: offersPage, isLoading: offersLoading } = useListOffers(COUNT_QUERY);
  const { data: policiesPage, isLoading: policiesLoading } = useListPolicies(COUNT_QUERY);
  const { data: invoicesPage, isLoading: invoicesLoading } = useListInvoices(COUNT_QUERY);

  const productCount = productsPage?.totalCount ?? productsPage?.items?.length ?? 0;
  const offerCount = offersPage?.totalCount ?? offersPage?.items?.length ?? 0;
  const policyCount = policiesPage?.totalCount ?? policiesPage?.items?.length ?? 0;
  const invoiceCount = invoicesPage?.totalCount ?? invoicesPage?.items?.length ?? 0;

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  return (
    <AppShell fullHeight>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="shrink-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {greeting}. Here's what's happening across ESIG Life today.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
          <KpiCard
            loading={productsLoading}
            label="Products"
            value={formatCount(productCount)}
            hint="Total in catalog"
            icon={Package}
            to="/products"
          />
          <KpiCard
            loading={offersLoading}
            label="Offers"
            value={formatCount(offerCount)}
            hint="All statuses"
            icon={FileText}
            to="/offers"
          />
          <KpiCard
            loading={policiesLoading}
            label="Policies"
            value={formatCount(policyCount)}
            hint="Issued policies"
            icon={ShieldCheck}
            to="/policies"
          />
          <KpiCard
            loading={invoicesLoading}
            label="Invoices"
            value={formatCount(invoiceCount)}
            hint="All invoices"
            icon={Receipt}
            to="/invoices"
          />
        </div>

        <div className="grid min-h-0 flex-[1.15] grid-cols-1 gap-3 xl:grid-cols-2">
          <RecentOffersTable />
          <RecentPoliciesTable />
        </div>

        <div className="min-h-0 flex-1">
          <ActivityChart />
        </div>
      </div>
    </AppShell>
  );
};

export default Index;
