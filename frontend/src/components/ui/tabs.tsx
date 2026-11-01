import * as React from "react";

interface TabProps {
  label: string;
  children: React.ReactNode;
}

interface TabsProps {
  tabs: TabProps[];
  defaultIndex?: number;
}

export function Tabs({ tabs, defaultIndex = 0 }: TabsProps) {
  const [active, setActive] = React.useState(defaultIndex);
  return (
    <div>
      <div className="flex border-b mb-4 gap-0">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium focus:outline-none transition-colors ${
              active === idx
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
            onClick={() => setActive(idx)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].children}</div>
    </div>
  );
}
