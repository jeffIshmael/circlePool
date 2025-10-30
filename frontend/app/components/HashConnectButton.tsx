"use client";

import { useEffect, useRef } from "react";
import { useHashConnect } from "../hooks/useHashConnect";
import { Wallet, LogOut } from "lucide-react";
import { registerUser, checkUserRegistered } from "../lib/prismafunctions";

type HashConnectButtonProps = {
  hbarBalance?: number;
};

export default function HashConnectButton({ hbarBalance = 0 }: HashConnectButtonProps) {
  const { isConnected, accountId, isLoading, connect, disconnect } = useHashConnect();
  const registeredRef = useRef<string | null>(null);

  useEffect(() => {
    async function registerIfNeeded() {
      if (!isConnected || !accountId) return;
      if (registeredRef.current === accountId) return;
      try {
       // check whether user is registered
       const isRegistered = await checkUserRegistered(accountId as string);
       if (!isRegistered) {
        // register user
        await registerUser(null, accountId);
       }
      } catch {
        // silently ignore; UI shouldn't be blocked by registration
      }
    }
    registerIfNeeded();
  }, [isConnected, accountId]);

  const truncateAccount = (id: string) =>
    id.length > 15 ? id.slice(0, 10) + "..." + id.slice(-5) : id;

  if (isConnected) {
    return (
      <div
        onClick={disconnect}
        className="relative group flex items-center gap-2 bg-primary-dark text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:cursor-pointer hover:bg-primary-dark/90"
        aria-label="Disconnect"
      >
        <div className="flex flex-col text-xs md:text-sm ">
          <span className="font-semibold border-b border-primary-lavender/30 ">{hbarBalance.toFixed(2)} HBAR</span>
          <span className="opacity-90 cursor-pointer">{truncateAccount(accountId || "")}</span>
        </div>
        <div className=" p-2 rounded-full bg-primary-lavender/30 hover:bg-primary-lavender/50 transition-all  duration-300 hover:cursor-pointer">
          <LogOut size={16} />
        </div>
        {/* Tooltip */}
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block">
          <div className="rounded-md bg-black/80 text-white text-xs px-2 py-1 shadow-md whitespace-nowrap">
            Disconnect
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isLoading}
      className="flex items-center gap-2 bg-primary-dark text-white px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:cursor-pointer hover:bg-primary-dark/80"
    >
      <Wallet size={18} />
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
