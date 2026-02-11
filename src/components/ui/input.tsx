import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-[13px] font-[inherit] transition-[border-color,box-shadow] duration-150 ease-in-out focus:outline-none focus:border-ring focus:shadow-[0_0_0_3px_rgba(0,0,0,.08)]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
