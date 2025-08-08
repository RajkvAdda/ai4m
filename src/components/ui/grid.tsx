import { cn } from "@/lib/utils";
import React from "react";

export const Grid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="grid"
    className={cn("grid gap-4", className)}
    {...props}
  />
));
Grid.displayName = "Grid";
