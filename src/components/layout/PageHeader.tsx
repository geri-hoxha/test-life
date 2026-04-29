import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
};

const PageHeader = ({ title, description, breadcrumbs, actions }: Props) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
      <div>
        {breadcrumbs && (
          <nav className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {b.to ? (
                  <a href={b.to} className="hover:text-accent transition-colors">{b.label}</a>
                ) : (
                  <span className="text-foreground font-medium">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span className="text-border">/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
