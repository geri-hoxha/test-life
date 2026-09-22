import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { PageLoader } from "@/components/Loader";
import { FilterGrid } from "@/components/FilterGrid";
import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAddRatingTableRule,
  useGetRatingTable,
  useRemoveRatingTableRule,
  useUpdateRatingTable,
} from "@/api/rating-tables";
import type {
  RatingTablesAddRatingTableRuleRequest,
  RatingTablesRatingTableRuleResponse,
} from "@/api/types";
import { toastApiError } from "@/lib/api-error";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import RatingTableRuleDialog from "./RatingTableRuleDialog";

const formatGender = (gender?: string) => {
  if (!gender) return "—";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

const formatRate = (rule: RatingTablesRatingTableRuleResponse) => {
  const rate = rule.rate;
  if (!rate) return "—";
  if (rate.isFlat) {
    const value = rate.flatValue ?? 0;
    const currency = rate.flatValueCurrency ?? "";
    return `${value}${currency ? ` ${currency}` : ""} (flat)`;
  }
  const pct = rate.percentageValue;
  if (pct == null) return "—";
  // API stores fraction (0.2); display as whole percent (20%).
  const display = Number((pct * 100).toFixed(6)).toString();
  return `${display}%`;
};

const RatingTableDetail = () => {
  const { id = "" } = useParams();
  const { data: table, isLoading, isError } = useGetRatingTable(id, { enabled: Boolean(id) });

  const updateTable = useUpdateRatingTable();
  const addRule = useAddRatingTableRule();
  const removeRule = useRemoveRatingTableRule();

  const [name, setName] = useState("");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [deleteRule, setDeleteRule] = useState<RatingTablesRatingTableRuleResponse | null>(null);
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [rateTypeFilter, setRateTypeFilter] = useState("ALL");
  const [minAgeFilter, setMinAgeFilter] = useState("");
  const [maxAgeFilter, setMaxAgeFilter] = useState("");

  useEffect(() => {
    setName(table?.name ?? "");
  }, [table?.name]);

  const rules = table?.rules ?? [];
  const filteredRules = useMemo(() => {
    const minAge = minAgeFilter.trim() === "" ? undefined : Number(minAgeFilter);
    const maxAge = maxAgeFilter.trim() === "" ? undefined : Number(maxAgeFilter);
    return rules.filter((rule) => {
      if (genderFilter !== "ALL" && rule.gender !== genderFilter) return false;
      if (rateTypeFilter === "flat" && !rule.rate?.isFlat) return false;
      if (rateTypeFilter === "percentage" && rule.rate?.isFlat) return false;
      if (minAge != null && Number.isFinite(minAge) && (rule.minAge ?? 0) < minAge) return false;
      if (maxAge != null && Number.isFinite(maxAge) && (rule.maxAge ?? 0) > maxAge) return false;
      return true;
    });
  }, [rules, genderFilter, rateTypeFilter, minAgeFilter, maxAgeFilter]);
  const hasRuleFilters =
    genderFilter !== "ALL" ||
    rateTypeFilter !== "ALL" ||
    Boolean(minAgeFilter.trim()) ||
    Boolean(maxAgeFilter.trim());

  const handleRename = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    if (!id) return;
    updateTable.mutate(
      { id, body: { name: trimmed } },
      {
        onSuccess: () => toast.success("Rating table updated"),
        onError: (err) => toastApiError(err, "Failed to update rating table"),
      },
    );
  };

  const handleAddRule = (body: RatingTablesAddRatingTableRuleRequest) => {
    if (!id) return;
    addRule.mutate(
      { ratingTableId: id, body },
      {
        onSuccess: () => {
          toast.success("Rule added");
          setRuleDialogOpen(false);
        },
        onError: (err) => toastApiError(err, "Failed to add rule"),
      },
    );
  };

  const handleDeleteRule = () => {
    if (!id || deleteRule?.id == null) return;
    removeRule.mutate(
      { ratingTableId: id, ruleId: String(deleteRule.id) },
      {
        onSuccess: () => {
          toast.success("Rule deleted");
          setDeleteRule(null);
        },
        onError: (err) => toastApiError(err, "Failed to delete rule"),
      },
    );
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader label="Loading rating table…" />
      </AppShell>
    );
  }

  if (isError || !table) {
    return (
      <AppShell>
        <PageHeader
          breadcrumbs={[
            { label: "Administration" },
            { label: "Rating tables", to: "/administration/rating-tables" },
            { label: "Not found" },
          ]}
          title="Rating table not found"
        />
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">This rating table no longer exists.</p>
          <Button asChild className="mt-4">
            <Link to="/administration/rating-tables">Back to rating tables</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  const nameDirty = name.trim() !== (table.name ?? "").trim();

  return (
    <AppShell>
      <PageHeader
        breadcrumbs={[
          { label: "Administration" },
          { label: "Rating tables", to: "/administration/rating-tables" },
          { label: table.name ?? id },
        ]}
        title={table.name ?? "Rating table"}
        description="Edit the table name and manage rating rules."
        actions={
          <Button className="gap-2" onClick={() => setRuleDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add rule
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
            <CardDescription>Rename this rating table.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end max-w-xl">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="rt-detail-name">Name</Label>
                <Input
                  id="rt-detail-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rating table name"
                  maxLength={512}
                />
              </div>
              <Button
                className="gap-2"
                disabled={!nameDirty || updateTable.isPending}
                onClick={handleRename}
              >
                <Save className="h-4 w-4" />
                {updateTable.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
            {table.id && (
              <p className="text-xs text-muted-foreground mt-3 font-mono">ID: {table.id}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Rules</CardTitle>
                  <CardDescription>
                    {hasRuleFilters
                      ? `${filteredRules.length} of ${rules.length} rule${rules.length === 1 ? "" : "s"}`
                      : `${rules.length} rule${rules.length === 1 ? "" : "s"} defined for this table.`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {hasRuleFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-muted-foreground"
                      onClick={() => {
                        setGenderFilter("ALL");
                        setRateTypeFilter("ALL");
                        setMinAgeFilter("");
                        setMaxAgeFilter("");
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setRuleDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add rule
                  </Button>
                </div>
              </div>
              <FilterGrid>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Rate type</Label>
                  <Select value={rateTypeFilter} onValueChange={setRateTypeFilter}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All types</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Min age from</Label>
                  <Input
                    className="h-9"
                    type="number"
                    min={0}
                    value={minAgeFilter}
                    onChange={(e) => setMinAgeFilter(e.target.value)}
                    placeholder="Any"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Max age to</Label>
                  <Input
                    className="h-9"
                    type="number"
                    min={0}
                    value={maxAgeFilter}
                    onChange={(e) => setMaxAgeFilter(e.target.value)}
                    placeholder="Any"
                  />
                </div>
              </FilterGrid>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Rate type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                        No rules yet. Add a rule to define rating bands.
                      </TableCell>
                    </TableRow>
                  ) : filteredRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                        No rules match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRules.map((rule) => (
                      <TableRow key={rule.id ?? `${rule.minAge}-${rule.maxAge}-${rule.gender}`}>
                        <TableCell className="font-mono text-sm">
                          {rule.minAge ?? "—"} – {rule.maxAge ?? "—"}
                        </TableCell>
                        <TableCell>{formatGender(rule.gender)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {rule.rate?.isFlat ? "Flat" : "Percentage"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{formatRate(rule)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive"
                            disabled={rule.id == null}
                            onClick={() => setDeleteRule(rule)}
                            title="Delete rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <RatingTableRuleDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        saving={addRule.isPending}
        onSave={handleAddRule}
      />

      <AlertDialog
        open={Boolean(deleteRule)}
        onOpenChange={(open) => !open && setDeleteRule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the
              {deleteRule
                ? ` ${formatGender(deleteRule.gender).toLowerCase()} age ${deleteRule.minAge ?? "?"}–${deleteRule.maxAge ?? "?"} `
                : " "}
              rule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeRule.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={removeRule.isPending} onClick={handleDeleteRule}>
              {removeRule.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default RatingTableDetail;
