import mongoose from "mongoose";

// ─── Environment Validation ─────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI — please add it to your .env.local file"
  );
}

// ─── Connection State Cache ─────────────────────────────────────────────────
// In development, Next.js hot-reloads the module system, which would create
// a new mongoose connection on every reload. We store the cached connection
// on the global object to survive module re-evaluation.

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache =
  global._mongooseCache ?? (global._mongooseCache = { conn: null, promise: null });

// ─── Connection Options ─────────────────────────────────────────────────────

const CONNECTION_OPTIONS: mongoose.ConnectOptions = {
  bufferCommands: false, // Fail fast rather than buffer operations while disconnected
  maxPoolSize: 10,       // Max simultaneous connections in the pool
  serverSelectionTimeoutMS: 5000, // Fail after 5s if server is unreachable
  socketTimeoutMS: 45000,         // Close idle sockets after 45s
};

// ─── Event Listeners ────────────────────────────────────────────────────────

function attachListeners() {
  const isProduction = process.env.NODE_ENV === "production";

  mongoose.connection.on("connected", () => {
    if (!isProduction) console.log("[MongoDB] Connected successfully");
  });

  mongoose.connection.on("error", (err: Error) => {
    console.error("[MongoDB] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    if (!isProduction) console.warn("[MongoDB] Disconnected — will reconnect on next request");
    // Reset cache so the next call to connectDB() re-establishes the connection
    cache.conn = null;
    cache.promise = null;
  });
}

// ─── connectDB ──────────────────────────────────────────────────────────────

/**
 * Connect to MongoDB. Safe to call multiple times — returns the cached
 * connection if one already exists. Does NOT connect automatically on import.
 */
export async function connectDB(): Promise<typeof mongoose> {
  // Return the cached connection if already established
  if (cache.conn) return cache.conn;

  // If a connection attempt is already in progress, wait for it
  if (!cache.promise) {
    attachListeners();

    cache.promise = mongoose
      .connect(MONGODB_URI!, CONNECTION_OPTIONS)
      .catch((err: Error) => {
        // Reset on failure so the next request can retry
        cache.promise = null;
        console.error("[MongoDB] Failed to connect:", err.message);
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
