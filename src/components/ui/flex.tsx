import { cn } from "@/lib/utils";
import React from "react";

export const Flex = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="flex"
    className={cn(
      "flex gap-2 sm:gap-4 flex-wrap items-center justify-start",
      className,
    )}
    {...props}
  />
));
Flex.displayName = "Flex";
