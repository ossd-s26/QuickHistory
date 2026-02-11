import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "w-full px-3 py-2.5 border border-input rounded-lg bg-card text-foreground text-[13px] font-[inherit] resize-y min-h-[72px] transition-[border-color,box-shadow] duration-150 ease-in-out placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:shadow-[0_0_0_3px_rgba(0,0,0,.08)]",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
