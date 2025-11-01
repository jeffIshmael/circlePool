"use client";

/**
 * Lazy-loads HashConnect instance only on the client side
 * This prevents build-time errors from Node.js-specific dependencies
 */
export async function initHashConnect() {
  if (typeof window === "undefined") {
    throw new Error("HashConnect can only be initialized on the client side");
  }

  const { HashConnect } = await import("hashconnect");
  const { LedgerId } = await import("@hashgraph/sdk");

  const env = "testnet";

  const appMetadata = {
    name: "CirclePool",
    description: "CirclePool - Hedera Hashgraph DApp",
    icons: [
      typeof window !== "undefined"
        ? window.location.origin + "/favicon.ico"
        : "/favicon.ico",
    ],
    url: "https://circle-pool.vercel.app",
  };

  const hashconnect = new HashConnect(
    LedgerId.fromString(env),
    "bfa190dbe93fcf30377b932b31129d05",
    appMetadata,
    true
  );

  await hashconnect.init();

  return hashconnect;
}

/**
 * Lazy-loads @hashgraph/sdk modules only when needed
 */
export async function loadHashgraphSDK() {
  const SDK = await import("@hashgraph/sdk");
  return SDK;
}

