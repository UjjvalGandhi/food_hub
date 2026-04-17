"use client";

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, token, logout } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if the user is fully authenticated and has a token available locally
    if (!user || !token) {
      if (socketRef.current) {
        // Handle cleanup gracefully on logout
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Determine the socket server URL. Fallback to same origin port 3001 if undefined.
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

    const socketInstance = io(socketUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log("[Socket Client] Connected with ID:", socketInstance.id);
      setSocket(socketInstance);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[Socket Client] Disconnected. Reason:", reason);
      setSocket(null);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Socket Client] Connection Error:", error.message);
      
      // Handle graceful token expiration / invalidation handshake rejections
      if (error.message.includes("Authentication error")) {
        console.warn("[Socket Client] Token rejected by server, initiating logout.");
        socketInstance.disconnect();
        logout();
      }
    });

    // Cleanup when Context unmounts entirely
    return () => {
      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }
      socketInstance.disconnect();
    };
    // Re-run connection effect when Token specifically changes
  }, [token, user, logout]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
