import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: SwitchPrimitive.Root.Props & { className?: string }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-input bg-background/40 p-0.5 transition-colors outline-none backdrop-blur",
        "data-checked:bg-primary/25 data-checked:border-[color-mix(in_oklab,var(--brand),transparent_60%)]",
        "focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:border-ring",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "cursor-pointer",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "block size-5 rounded-full bg-foreground/80 shadow-sm ring-1 ring-foreground/10 transition-transform",
          "data-checked:translate-x-5",
          "dark:bg-foreground/90",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
