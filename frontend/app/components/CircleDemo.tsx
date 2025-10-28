"use client";

import { useState } from "react";
import { useHashConnect } from "../hooks/useHashConnect";
import { depositCash, registerCircle } from "../lib/circleClient";

export default function CircleDemo() {
  const { isConnected, accountId } = useHashConnect();
  const [loading, setLoading] = useState<string | null>(null);

  const onRegister = async () => {
    if (!accountId) return;
    setLoading("register");
    try {
      const start = Math.floor(Date.now() / 1000) + 3600;
      await registerCircle(accountId, {
        amount: BigInt(1_000_000_000), // 10 HBAR (tinybars)
        durationDays: 30,
        startDate: start,
        maxMembers: 5,
        interestPercent: 5,
        leftPercent: 10,
      });
      alert("Circle registered");
    } catch (e: any) {
      alert(e?.message || "Failed to register");
    } finally {
      setLoading(null);
    }
  };

  const onDeposit = async () => {
    if (!accountId) return;
    setLoading("deposit");
    try {
      await depositCash(accountId, 0, BigInt(1_000_000_000)); // 10 HBAR
      alert("Deposit sent");
    } catch (e: any) {
      alert(e?.message || "Failed to deposit");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-x-2">
      <button disabled={!isConnected || loading==="register"} onClick={onRegister} className="px-3 py-2 border rounded">
        {loading==="register" ? "Registering..." : "Register Circle"}
      </button>
      <button disabled={!isConnected || loading==="deposit"} onClick={onDeposit} className="px-3 py-2 border rounded">
        {loading==="deposit" ? "Depositing..." : "Deposit 10 HBAR"}
      </button>
    </div>
  );
}


