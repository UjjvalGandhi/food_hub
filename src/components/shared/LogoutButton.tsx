"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const { isLoading, logout } = useAuth();

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      className={className}
      onClick={() => void logout()}
      disabled={isLoading}
    >
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}