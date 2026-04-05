import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, icon, actions, className = "" }: PageHeaderProps) {
  return (
    <header className={`mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 ${className}`}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1 text-zinc-900">{title}</h1>
        {subtitle && (
          <p className="text-zinc-500 flex items-center gap-2">
            {icon && <span className="text-zinc-400">{icon}</span>}
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-4">
          {actions}
        </div>
      )}
    </header>
  );
}
