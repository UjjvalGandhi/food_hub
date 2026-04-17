"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertMessageProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  className?: string;
}

const variantConfig: Record<AlertVariant, { icon: React.ElementType; classes: string }> = {
  info: { icon: Info, classes: "bg-blue-50 border-blue-200 text-blue-800" },
  success: { icon: CheckCircle2, classes: "bg-green-50 border-green-200 text-green-800" },
  warning: { icon: AlertTriangle, classes: "bg-yellow-50 border-yellow-200 text-yellow-800" },
  error: { icon: XCircle, classes: "bg-red-50 border-red-200 text-red-800" },
};

export function AlertMessage({
  variant = "info",
  title,
  message,
  className,
}: AlertMessageProps) {
  const { icon: Icon, classes } = variantConfig[variant];

  return (
    <div
      role="alert"
      className={cn("flex items-start gap-3 rounded-lg border p-4", classes, className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
