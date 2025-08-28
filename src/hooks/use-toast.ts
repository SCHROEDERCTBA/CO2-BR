"use client"

import * as React from "react"
import { ToastContext } from "@/components/toast-provider";

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
