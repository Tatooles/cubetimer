import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function Tabs(props: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={classNames("inline-flex h-full items-stretch bg-transparent", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={classNames(
        "relative inline-flex h-full min-w-16 items-center justify-center px-4 text-sm font-medium text-zinc-500 outline-none transition hover:text-zinc-200 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-indigo-400 disabled:pointer-events-none disabled:opacity-50 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:text-indigo-200 data-[state=active]:after:bg-indigo-300",
        className,
      )}
      {...props}
    />
  );
}
