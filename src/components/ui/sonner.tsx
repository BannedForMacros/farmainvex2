"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";

export function Toaster(props: ComponentProps<typeof SonnerToaster>) {
  const { theme = "system" } = useTheme();
  return (
    <SonnerToaster
      theme={theme as ComponentProps<typeof SonnerToaster>["theme"]}
      richColors
      position="top-right"
      {...props}
    />
  );
}
