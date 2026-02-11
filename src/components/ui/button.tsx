import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_3px_rgba(0,0,0,.15)] hover:not-disabled:bg-[#2d2d2f] hover:not-disabled:shadow-[0_2px_8px_rgba(0,0,0,.2)] hover:not-disabled:-translate-y-px active:not-disabled:translate-y-0",
        ghost:
          "bg-transparent text-muted-foreground border border-border rounded-md hover:not-disabled:bg-accent hover:not-disabled:text-primary hover:not-disabled:border-ring",
        icon: "size-8 border border-border rounded-md bg-card text-muted-foreground hover:bg-accent hover:text-primary hover:border-ring shrink-0",
      },
      size: {
        default: "px-4 py-2.5",
        sm: "px-2.5 py-1.5 text-[11px]",
        icon: "size-8 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
