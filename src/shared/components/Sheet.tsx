import { Dialog as SheetPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

type SheetContentProps = ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "left" | "right" | "top" | "bottom";
};

const SIDE_CLASSES: Record<NonNullable<SheetContentProps["side"]>, string> = {
  bottom: "inset-x-0 bottom-0 border-t",
  left: "inset-y-0 left-0 h-full w-3/4 border-r",
  right: "inset-y-0 right-0 h-full w-3/4 border-l",
  top: "inset-x-0 top-0 border-b",
};

export function Sheet(props: ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

export function SheetTrigger(props: ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

export function SheetClose(props: ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

export function SheetPortal(props: ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

export function SheetOverlay({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={classNames("fixed inset-0 z-20 bg-black/45 md:hidden", className)}
      {...props}
    />
  );
}

export function SheetContent({ side = "right", className, children, ...props }: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={classNames(
          "fixed z-30 bg-zinc-950 shadow-2xl shadow-black/70 outline-none md:hidden",
          SIDE_CLASSES[side],
          className,
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={classNames("flex flex-col gap-2 text-left", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={classNames("text-sm font-semibold text-zinc-100", className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={classNames("text-sm text-zinc-500", className)}
      {...props}
    />
  );
}

export function SheetBody({ children }: { children: ReactNode }) {
  return children;
}
