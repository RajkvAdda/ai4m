import { cn } from "@/lib/utils";
import React from "react";

export const Sample = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn("", className)} {...props} />
));
Sample.displayName = "Sample";
