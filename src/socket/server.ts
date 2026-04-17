import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { normalizeUserRole, UserRole } from "@/constants/roles";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";

declare global {
  var __socketIoServer__: SocketIOServer | undefined;
}

function resolveSocketPort() {
  if (process.env.SOCKET_PORT) {
    return parseInt(process.env.SOCKET_PORT, 10);
  }

  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    try {
      const socketUrl = new URL(process.env.NEXT_PUBLIC_SOCKET_URL);
      if (socketUrl.port) {
        return parseInt(socketUrl.port, 10);
      }
    } catch {
      console.warn("[Socket] NEXT_PUBLIC_SOCKET_URL is not a valid URL. Falling back to port 3001.");
    }
  }

  return 3001;
}

const PORT = resolveSocketPort();

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

export function initSocketServer() {
  if (process.env.NODE_ENV !== "production") {
    // Prevent multiple initializations in dev caused by Next HMR
    if (globalThis.__socketIoServer__) {
      console.log("[Socket] Server already running on port", PORT);
      return globalThis.__socketIoServer__;
    }
  }

  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // allow all or restrict to NEXT_PUBLIC_BASE_URL
      methods: ["GET", "POST"]
    }
  });

  // JWT Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const actualToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    try {
      const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || "fallback_secret") as jwt.JwtPayload & {
        userId?: string;
        role?: string;
      };
      const normalizedRole = normalizeUserRole(decoded.role);

      if (!decoded.userId || !normalizedRole) {
        return next(new Error("Authentication error: Invalid token structure"));
      }

      // Attach user data to socket for downstream usage
      socket.data.user = {
        userId: decoded.userId,
        role: normalizedRole
      };

      next();
    } catch {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, role } = socket.data.user;
    console.log(`[Socket] User connected - ID: ${userId}, Role: ${role}`);

    // Room Joining Logic Based on Role
    try {
      if (role === UserRole.CUSTOMER) {
        socket.join(`user:${userId}`);
        console.log(`[Socket] Joined Room: user:${userId}`);
      } else if (role === UserRole.ADMIN) {
        socket.join("admin:global");
        console.log(`[Socket] Joined Room: admin:global`);
      } else if (role === UserRole.PROVIDER) {
        try {
          await connectDB();

          const restaurant = await Restaurant.findOne({ owner: userId })
            .select("_id")
            .lean();
          
          if (restaurant) {
            socket.join(`provider:${restaurant._id.toString()}`);
            console.log(`[Socket] Joined Room: provider:${restaurant._id.toString()}`);
          } else {
            console.log(`[Socket] Warning: Provider ${userId} connected but has no restaurant. No provider room joined.`);
          }
        } catch (dbErr) {
          console.error(`[Socket] Error fetching restaurant for PROVIDER ${userId}:`, dbErr);
        }
      } else if (role === UserRole.DELIVERY_PARTNER) {
        socket.join("delivery:partners");
        console.log(`[Socket] Joined Room: delivery:partners`);
      } else {
        console.log(`[Socket] Unrecognized role: ${role}. No rooms joined.`);
      }
    } catch (err) {
      console.error("[Socket] Error joining rooms:", err);
    }

    socket.on("joinGroupOrder", (orderId) => {
      socket.join(`groupOrder:${orderId}`);
      console.log(`[Socket] Joined Room: groupOrder:${orderId}`);
    });

    socket.on("leaveGroupOrder", (orderId) => {
      socket.leave(`groupOrder:${orderId}`);
      console.log(`[Socket] Left Room: groupOrder:${orderId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User disconnected - ID: ${userId}, Reason: ${reason}`);
    });
    
    // Explicit Instruction: Do not mix order logic here.
  });

  httpServer.once("error", (error) => {
    if (isErrnoException(error) && error.code === "EADDRINUSE") {
      console.warn(`[Socket] Port ${PORT} is already in use. Assuming another socket server instance is active.`);
      io.close();
      return;
    }

    console.error("[Socket] Failed to start socket server:", error);
  });

  httpServer.listen(PORT, () => {
    console.log(`[Socket] Server started and listening independently on port ${PORT}`);
    
    if (process.env.NODE_ENV !== "production") {
      globalThis.__socketIoServer__ = io;
    }
  });

  return io;
}
