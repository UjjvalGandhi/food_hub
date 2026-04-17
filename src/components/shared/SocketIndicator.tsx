"use client";

import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function SocketIndicator() {
  const { isConnected } = useSocket();
  const { user } = useAuth();

  // Only show indicator for logged-in users who should have a socket connection
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-background/50 backdrop-blur-sm border shadow-sm">
      <div className="relative flex h-2 w-2">
        <AnimatePresence>
          {isConnected && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.3 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inline-flex h-full w-full rounded-full bg-green-400"
            />
          )}
        </AnimatePresence>
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2 shadow-[0_0_8px_rgba(0,0,0,0.1)] transition-colors duration-500",
            isConnected ? "bg-green-500" : "bg-red-500"
          )}
        />
      </div>
      <span className="text-[10px] font-bold tracking-tight uppercase text-muted-foreground select-none">
        {isConnected ? "Live" : "Offline"}
      </span>
    </div>
  );
}
