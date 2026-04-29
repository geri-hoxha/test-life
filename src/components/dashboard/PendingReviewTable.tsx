import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Item = {
  ref: string;
  type: "Customer KYC" | "Medical Report" | "Policy Issuance" | "Payment Refund";
  subject: string;
  submitted: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
};

const items: Item[] = [
  { ref: "REV-3041", type: "Customer KYC", subject: "Markus Weber", submitted: "2h ago", priority: "High" },
  { ref: "REV-3040", type: "Medical Report", subject: "Helena Novak — Endowment 15Y", submitted: "4h ago", priority: "Normal" },
  { ref: "REV-3039", type: "Policy Issuance", subject: "POL-2026-1188", submitted: "Yesterday", priority: "Urgent" },
  { ref: "REV-3038", type: "Payment Refund", subject: "PAY-22014 · € 480.00", submitted: "Yesterday", priority: "Normal" },
  { ref: "REV-3037", type: "Customer KYC", subject: "Sofia Romano", submitted: "2 days ago", priority: "Low" },
];

const priorityClass: Record<Item["priority"], string> = {
  Low: "bg-muted text-muted-foreground",
  Normal: "bg-accent-soft text-accent-soft-foreground",
  High: "bg-warning/20 text-warning-foreground",
  Urgent: "bg-destructive/10 text-destructive",
};

const PendingReviewTable = () => {
  return (
    <Card className="shadow-card border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Pending Manual Review</h3>
            <p className="text-xs text-muted-foreground mt-0.5">12 items awaiting underwriter action</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent-soft">
          Open queue
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Ref</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Type</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Subject</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Submitted</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Priority</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.ref} className="hover:bg-accent-soft/40">
              <TableCell className="font-mono text-xs text-accent">{it.ref}</TableCell>
              <TableCell className="text-muted-foreground">{it.type}</TableCell>
              <TableCell className="font-medium">{it.subject}</TableCell>
              <TableCell className="text-muted-foreground">{it.submitted}</TableCell>
              <TableCell>
                <Badge className={`font-medium border-0 ${priorityClass[it.priority]}`}>{it.priority}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" className="h-7 text-xs">Review</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default PendingReviewTable;
