"use client";

import { useState } from "react";
import { useHashConnect } from "../hooks/useHashConnect";
import {
  AccountId,
  ContractCreateTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  FileCreateTransaction,
  Hbar,
  Client,
  PrivateKey,
  ContractCallQuery,
  TokenId,
  FileId,
  Long,
  ContractCreateFlow,
} from "@hashgraph/sdk";
import { useCircle } from "../hooks/useCircle";
export default function CircleDemo() {
  const { isConnected, accountId } = useHashConnect();
  const [loading, setLoading] = useState<string | null>(null);
  const {
    createCircle,
    depositCash,
    loading: createCircleLoading,
    error: createCircleError,
  } = useCircle();
  const onRegister = async () => {
    if (!accountId) return;
    setLoading("register");
    try {
      const start = Math.floor(Date.now() / 1000) + 36000;
      const circleId = await createCircle({
        amount: BigInt(1_000_000_000),
        durationDays: 30,
        startDate: start,
        maxMembers: 5,
        interestPercent: 5,
        leftPercent: 10,
      });
      if (circleId) {
        alert("Circle created");
      } else {
        alert("Failed to create circle");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create circle");
    } finally {
      setLoading(null);
    }
  };
  const onDeposit = async () => {
    if (!accountId) return;
    setLoading("deposit");
    try {
      const result = await depositCash({
        circleId: 0,
        amount: BigInt(100_000_000), // 1 HBAR = 100,000,000 tinybars
      });
      console.log("Deposit result:", result);
    } catch (error) {
      console.error("Deposit error:", error);
    } finally {
      setLoading(null);
    }
  };  

  return (
    <div className="space-x-2">
      <button
        disabled={!isConnected || loading === "register"}
        onClick={onRegister}
        className="px-3 py-2 border rounded"
      >
        {loading === "register" ? "Registering..." : "Register Circle"}
      </button>
      <button
        disabled={!isConnected || loading === "deposit"}
        onClick={onDeposit}
        className="px-3 py-2 border rounded"
      >
        {loading === "deposit" ? "Depositing..." : "Deposit 1 HBAR"}
      </button>
    </div>
  );
}
