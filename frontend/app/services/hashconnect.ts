"use client";

import { HashConnect } from "hashconnect";
import { LedgerId } from "@hashgraph/sdk";

const env = "testnet";

const appMetadata = {
    name: "CirclePool",
    description: "CirclePool - Hedera Hashgraph DApp",
    icons: [typeof window !== 'undefined' ? window.location.origin + "/favicon.ico" : "/favicon.ico"],
    url:  "http://localhost:3000",
};

export const hc = new HashConnect(
    LedgerId.fromString(env),
    "bfa190dbe93fcf30377b932b31129d05", // Use a unique project ID
    appMetadata,
    true
);

console.log("HashConnect instance:", hc);

export const hcInitPromise = hc.init();

export const getHashConnectInstance = (): HashConnect => {
    if (!hc) {
        throw new Error("HashConnect not initialized. Make sure this is called on the client side.");
    }
    console.log("HashConnect instance:", hc);
    return hc;
};

export const getConnectedAccountIds = () => {
    const instance = getHashConnectInstance();
    return instance.connectedAccountIds;
};

export const getInitPromise = (): Promise<void> => {
    if (!hcInitPromise) {
        throw new Error("HashConnect not initialized. Make sure this is called on the client side.");
    }
    return hcInitPromise;
};
