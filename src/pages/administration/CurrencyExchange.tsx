import { useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, RefreshCw, Calculator, Info } from "lucide-react";
import {
  CURRENCIES,
  convert,
  deleteFxRate,
  getRatesForPair,
  listFxRates,
} from "@/data/fxRates";
import FxRateDialog from "./FxRateDialog";
import { toast } from "sonner";

const CurrencyExchange = () => {
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterFrom, setFilterFrom] = useState<string>("ALL");
  const [filterTo, setFilterTo] = useState<string>("ALL");
  const [filterSource, setFilterSource] = useState<string>("ALL");

  // Calculation preview state
  const [calcAmount, setCalcAmount] = useState("1000");
  const [calcFrom, setCalcFrom] = useState("EUR");
  const [calcTo, setCalcTo] = useState("USD");
  const [overrideId, setOverrideId] = useState<string>("auto");

  const rates = useMemo(() => listFxRates(), []);
  const filtered = rates.filter((r) =>
    (filterFrom === "ALL" || r.fromCurrency === filterFrom) &&
    (filterTo === "ALL" || r.toCurrency === filterTo) &&
    (filterSource === "ALL" || r.source === filterSource)
  );

  const candidates = getRatesForPair(calcFrom, calcTo);
  const overrideRate =
    overrideId === "auto" ? undefined : candidates.find((c) => c.id === overrideId)?.rate;
  const conv = convert(parseFloat(calcAmount) || 0, calcFrom, calcTo, overrideRate);

  const counts = {
    total: rates.length,
    manual: rates.filter((r) => r.source === "Manual").length,
    pairs: new Set(rates.map((r) => `${r.fromCurrency}/${r.toCurrency}`)).size,
  };

  const handleDelete = (id: string) => {
    deleteFxRate(id);
    toast.success("FX rate removed");
    refresh();
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Administration
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Currency Exchange
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automatic FX feed with manual override capability for offer pricing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Automatic feed refreshed (demo)")}>
            <RefreshCw className="h-4 w-4" />
            Refresh Feed
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Manual Rate
          </Button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Rates on file</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{counts.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Manual overrides</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{counts.manual}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Currency pairs tracked</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{counts.pairs}</div></CardContent>
        </Card>
      </div>

      {/* Premium calculation preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" />
            Offer Conversion Preview
          </CardTitle>
          <CardDescription>
            Simulates how an offer will convert. Defaults to the latest rate; choose a historic
            entry to apply a manual override.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <Label>Amount</Label>
            <Input type="number" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} />
          </div>
          <div>
            <Label>From</Label>
            <Select value={calcFrom} onValueChange={(v) => { setCalcFrom(v); setOverrideId("auto"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>To</Label>
            <Select value={calcTo} onValueChange={(v) => { setCalcTo(v); setOverrideId("auto"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rate Source</Label>
            <Select value={overrideId} onValueChange={setOverrideId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Latest (default)</SelectItem>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.date} · {c.rate} · {c.source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border bg-muted/40 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Result</div>
            {isNaN(conv.amount) ? (
              <div className="text-sm font-medium text-destructive">No rate available</div>
            ) : (
              <>
                <div className="text-base font-semibold">
                  {conv.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {calcTo}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Rate {conv.rate} · {conv.source}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base">FX Rate History</CardTitle>
              <CardDescription>Audit log of automatic feed entries and manual overrides.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterFrom} onValueChange={setFilterFrom}>
                <SelectTrigger className="h-9 w-[120px]"><SelectValue placeholder="From" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All from</SelectItem>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterTo} onValueChange={setFilterTo}>
                <SelectTrigger className="h-9 w-[120px]"><SelectValue placeholder="To" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All to</SelectItem>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All sources</SelectItem>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Entered By</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      No FX rates match the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.date}</TableCell>
                      <TableCell className="font-medium">{r.fromCurrency}</TableCell>
                      <TableCell className="font-medium">{r.toCurrency}</TableCell>
                      <TableCell className="text-right font-mono">{r.rate}</TableCell>
                      <TableCell>
                        <Badge variant={r.source === "Manual" ? "default" : "secondary"}>
                          {r.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.enteredBy}</TableCell>
                      <TableCell className="max-w-[260px]">
                        {r.reason || r.notes ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                <Info className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{r.reason || r.notes}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {r.reason && <div><strong>Reason:</strong> {r.reason}</div>}
                              {r.notes && <div><strong>Notes:</strong> {r.notes}</div>}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove FX rate?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete the {r.source.toLowerCase()} rate of {r.rate} {r.fromCurrency}/{r.toCurrency} on {r.date}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(r.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <FxRateDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={refresh} />
    </AppShell>
  );
};

export default CurrencyExchange;
