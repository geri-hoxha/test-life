import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addFxRate, CURRENCIES, getLatestRate } from "@/data/fxRates";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
};

const FxRateDialog = ({ open, onOpenChange, onSaved }: Props) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fromCurrency, setFrom] = useState("EUR");
  const [toCurrency, setTo] = useState("USD");
  const [rate, setRate] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const latest = getLatestRate(fromCurrency, toCurrency);

  const reset = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setFrom("EUR");
    setTo("USD");
    setRate("");
    setReason("");
    setNotes("");
  };

  const submit = () => {
    const num = parseFloat(rate);
    if (!num || num <= 0) {
      toast.error("Enter a valid positive rate");
      return;
    }
    if (fromCurrency === toCurrency) {
      toast.error("From and To currencies must differ");
      return;
    }
    if (!reason.trim()) {
      toast.error("Reason for override is required");
      return;
    }
    addFxRate({
      date,
      fromCurrency,
      toCurrency,
      rate: num,
      reason,
      notes,
      source: "Manual",
      enteredBy: "Erin Hoxha",
    });
    toast.success(`Manual FX rate saved: 1 ${fromCurrency} = ${num} ${toCurrency}`);
    reset();
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Manual FX Rate</DialogTitle>
          <DialogDescription>
            Manual rates override the automatic feed for the selected date and currency pair.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Rate</Label>
              <Input
                type="number"
                step="0.0001"
                placeholder={latest ? `auto: ${latest.rate}` : "0.0000"}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From Currency</Label>
              <Select value={fromCurrency} onValueChange={setFrom}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Currency</Label>
              <Select value={toCurrency} onValueChange={setTo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {latest && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              Latest {latest.source.toLowerCase()} rate: <strong>1 {fromCurrency} = {latest.rate} {toCurrency}</strong> ({latest.date})
            </div>
          )}

          <div>
            <Label>Reason for override</Label>
            <Input
              placeholder="e.g. Corporate hedging rate, Audit correction"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Optional context about this manual rate"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Save Manual Rate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FxRateDialog;
