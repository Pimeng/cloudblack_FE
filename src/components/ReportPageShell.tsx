import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabItem<T extends string> {
  key: T;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

interface ReportPageShellProps<T extends string> {
  title: string;
  description: string;
  activeTab: T;
  tabs: TabItem<T>[];
  children: ReactNode;
}

export function ReportPageShell<T extends string>({
  title,
  description,
  activeTab,
  tabs,
  children,
}: ReportPageShellProps<T>) {
  return (
    <div className="flex flex-col">
      <div className="text-center mb-4 md:mb-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-2">{title}</h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">{description}</p>
      </div>

      <div className="w-full max-w-md mx-auto mb-4">
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={tab.onClick}
              className={cn(
                'min-h-12 py-2.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                activeTab === tab.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="hide-scrollbar w-full max-w-md mx-auto pb-6 md:max-h-[calc(100vh-19rem)] md:overflow-y-auto md:overscroll-contain md:pr-1 md:pb-28"
        data-scrollable
        data-lock-horizontal-swipe
      >
        {children}
      </div>
    </div>
  );
}
