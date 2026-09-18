import { Plus, UserPlus, Building2, Package, FileText, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const actions = [
  { icon: UserPlus, title: "New Person", desc: "Onboard an individual client", color: "bg-accent-soft text-accent", to: "/people/new" },
  { icon: Building2, title: "New Company", desc: "Onboard a business client", color: "bg-accent-soft text-accent", to: "/companies/new" },
  { icon: Package, title: "Create Product", desc: "Open a product family, then define a new product", color: "bg-accent-soft text-accent", to: "/products" },
  { icon: FileText, title: "New Offer", desc: "Build a quote based on a product", color: "bg-accent-soft text-accent", to: "/offers/new" },
  { icon: ShieldCheck, title: "Issue Policy", desc: "Convert an accepted offer into a policy", color: "bg-accent-soft text-accent", to: "/offers" },
];

const QuickActions = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-9 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-medium shadow-elevated">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[640px] p-0 border-border shadow-elevated"
      >
        <div className="px-5 py-4 border-b border-border bg-muted/40">
          <div className="text-sm font-semibold text-foreground">Quick Actions</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Jump straight into the most common workflows
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {actions.map(({ icon: Icon, title, desc, color, to }) => (
            <Link
              key={title}
              to={to}
              className="group flex items-start gap-3 p-3 rounded-md text-left transition-colors hover:bg-accent-soft/60 border border-transparent hover:border-accent/20"
            >
              <div className={`shrink-0 h-10 w-10 rounded-md flex items-center justify-center ${color} group-hover:bg-accent group-hover:text-accent-foreground transition-colors`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuickActions;
