"use client";

import { useHashConnect } from "../hooks/useHashConnect";

export default function HashConnectButton() {
  const { isConnected, accountId, isLoading, connect, disconnect } = useHashConnect();

  if (isConnected) {
    return (
      <button onClick={disconnect} disabled={isLoading} className="px-3 py-2 border rounded">
        Disconnect {accountId}
      </button>
    );
  }

  return (
    <button onClick={connect} disabled={isLoading} className="px-3 py-2 border rounded">
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}


