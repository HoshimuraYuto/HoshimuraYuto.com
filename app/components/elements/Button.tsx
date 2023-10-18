import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../utils/chadcn-ui";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-2 transition duration-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-none bg-neutral-9 color-white dark:bg-neutral-1 dark:color-neutral-9 hover:opacity-85",
        secondary:
          "border-none bg-neutral-1 color-neutral-7 dark:bg-neutral-7 dark:color-neutral-1 hover:opacity-85",
        outline:
          "border border-neutral-1 border-solid bg-transparent color-neutral-7 dark:border-neutral-7 hover:bg-neutral-1 dark:color-neutral-1 dark:hover:bg-neutral-7",
        ghost:
          "border-none bg-transparent color-neutral-7  hover:bg-neutral-1 dark:color-neutral-1 dark:hover:bg-neutral-7",
        plain:
          "border-none bg-transparent color-neutral-7  dark:color-neutral-1 hover:opacity-50",
      },
      size: {
        sm: "gap-1.75 px-3.5 py-2.625 font-size-3.5",
        base: "gap-2 px-4 py-3 font-size-4",
        lg: "gap-2.25 px-4.5 py-3.375 font-size-4.5",
        xl: "gap-2.5 px-5 py-3.75 font-size-5",
        icon: "wh-9",
        original: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "base",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
