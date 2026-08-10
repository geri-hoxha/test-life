import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      closeButton
      expand
      visibleToasts={5}
      gap={10}
      duration={5_000}
      offset={16}
      icons={{
        success: <CheckCircle2 className="h-[1.125rem] w-[1.125rem] text-emerald-600 dark:text-emerald-400" />,
        error: <XCircle className="h-[1.125rem] w-[1.125rem] text-destructive" />,
        warning: <AlertTriangle className="h-[1.125rem] w-[1.125rem] text-amber-600 dark:text-amber-400" />,
        info: <Info className="h-[1.125rem] w-[1.125rem] text-sky-600 dark:text-sky-400" />,
        loading: <Loader2 className="h-[1.125rem] w-[1.125rem] animate-spin text-muted-foreground" />,
        close: <X className="h-3.5 w-3.5" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:pointer-events-auto group-[.toaster]:w-[min(100vw-2rem,24rem)] group-[.toaster]:gap-3 group-[.toaster]:rounded-md group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:shadow-md group-[.toaster]:border-l-[3px] group-[.toaster]:py-3.5 group-[.toaster]:pl-3.5 group-[.toaster]:pr-10",
          title:
            "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:leading-snug group-[.toast]:tracking-tight group-[.toast]:text-foreground",
          description:
            "group-[.toast]:text-[13px] group-[.toast]:leading-relaxed group-[.toast]:text-muted-foreground group-[.toast]:mt-0.5",
          icon: "group-[.toast]:mt-0.5 group-[.toast]:self-start [&_svg]:size-[1.125rem]",
          success: "group-[.toaster]:border-l-emerald-600 dark:group-[.toaster]:border-l-emerald-500",
          error: "group-[.toaster]:border-l-destructive",
          warning: "group-[.toaster]:border-l-amber-500",
          info: "group-[.toaster]:border-l-sky-500",
          loading: "group-[.toaster]:border-l-muted-foreground",
          closeButton:
            "group-[.toast]:absolute group-[.toast]:right-2 group-[.toast]:top-2 group-[.toast]:left-auto group-[.toast]:size-6 group-[.toast]:rounded-sm group-[.toast]:border group-[.toast]:border-border group-[.toast]:bg-background group-[.toast]:text-muted-foreground group-[.toast]:opacity-80 group-[.toast]:transition-opacity hover:group-[.toast]:opacity-100 hover:group-[.toast]:bg-muted hover:group-[.toast]:text-foreground",
          actionButton:
            "group-[.toast]:h-7 group-[.toast]:rounded-sm group-[.toast]:bg-primary group-[.toast]:px-2.5 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:h-7 group-[.toast]:rounded-sm group-[.toast]:bg-muted group-[.toast]:px-2.5 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
