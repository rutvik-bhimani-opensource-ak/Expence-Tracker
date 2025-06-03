
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  children?: ReactNode; // For action buttons like "Add New"
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold font-headline text-foreground">{title}</h1>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
