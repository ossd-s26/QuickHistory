import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-card border border-border rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,.05)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground mb-2",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardTitle, CardContent };
