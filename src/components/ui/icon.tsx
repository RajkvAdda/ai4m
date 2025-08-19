"use client";
import { cn } from "@/lib/utils";
import React from "react";
import * as LucideIcons from "lucide-react";
import { Button, ButtonProps } from "./button";

export type IconName = keyof typeof LucideIcons;
interface GetIcon {
  (iconName: IconName): Promise<React.ComponentType | null>;
}

export const getIcon: GetIcon = async (iconName) => {
  if (!iconName) return null;
  const icons = await import("lucide-react");
  return icons?.[iconName] || null;
};

export type IconProps = {
  iconName: IconName;
  className?: string;
};

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ className, iconName, ...props }, ref) => {
    const [IconComponent, setIconComponent] =
      React.useState<React.ComponentType | null>(null);

    React.useEffect(() => {
      let isMounted = true;
      getIcon(iconName).then((Component) => {
        if (isMounted) setIconComponent(() => Component);
      });
      return () => {
        isMounted = false;
      };
    }, [iconName]);

    return (
      <span className={cn("", className)}>
        {IconComponent ? (
          <IconComponent ref={ref} role="icon" {...props} />
        ) : null}
      </span>
    );
  }
);
Icon.displayName = "Icon";

export const IconButton = React.forwardRef<
  HTMLSpanElement,
  IconProps & ButtonProps
>(({ className, iconName, ...props }, ref) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      ref={ref}
      className={cn("", className)}
      {...props}
    >
      <Icon iconName={iconName} />
    </Button>
  );
});
IconButton.displayName = "IconButton";
