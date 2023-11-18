"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";

import { cn } from "../../utils/chadcn-ui";

import { DialogOverlay } from "./Dialog";

const DialogPortal = DialogPrimitive.Portal;

const CommandDialog = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[10%] z-50 grid max-w-lg w-full translate-x-[-50%]  gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
CommandDialog.displayName = DialogPrimitive.Content.displayName;

export { CommandDialog };
