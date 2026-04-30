import AppShell from "@/components/layout/AppShell";
import KpiCard from "@/components/dashboard/KpiCard";
import RecentOffersTable from "@/components/dashboard/RecentOffersTable";
import PendingReviewTable from "@/components/dashboard/PendingReviewTable";
import QuickStart from "@/components/dashboard/QuickStart";
import { Package, FileText, ShieldCheck, AlertCircle, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";

const Index = () => {
  return (
    <AppShell>
      {/* Page header */}
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

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Active Products" value="14" delta="+2" trend="up" hint="vs last month" icon={Package} />
        <KpiCard label="Draft Offers" value="38" delta="+12%" trend="up" hint="this week" icon={FileText} />
        <KpiCard label="Issued Policies" value="1,284" delta="+46" trend="up" hint="MTD" icon={ShieldCheck} />
        <KpiCard label="Pending Verification" value="12" delta="-3" trend="down" hint="vs yesterday" icon={AlertCircle} />
        <KpiCard label="Premium This Month" value="€ 482K" delta="+8.4%" trend="up" hint="vs March" icon={Euro} />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <RecentOffersTable />
        <PendingReviewTable />
      </div>

      {/* Quick Start */}
      <QuickStart />
    </AppShell>
  );
};

export default Index;
