import { useState } from "react";
import { useHashConnect } from "./useHashConnect";
import { CONTRACT_ID } from "../lib/constants";

interface CreateCircleParams {
  amount: bigint;
  durationDays: number;
  startDate: number;
  maxMembers: number;
  interestPercent: number;
  leftPercent: number;
}

interface DepositCashParams {
  circleId: number;
  amount: bigint;
}

export function useCircle() {
  const { isConnected, accountId } = useHashConnect();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCircle = async (params: CreateCircleParams) => {
    if (!isConnected || !accountId) {
      throw new Error("Wallet not connected");
    }
    // Dynamically import the hashconnect service only on client side
    if (typeof window === "undefined") {
      throw new Error("This function can only be called on the client side");
    }

    console.log("Calling executeContractFunction...");

    const { executeContractFunction } = await import("../services/hashconnect");

    setLoading(true);
    setError(null);
    try {
      const tx = await executeContractFunction(
        accountId,
        CONTRACT_ID,
        "registerCircle",
        params
      );
      const result = await tx;
      return result;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      return error;
    } finally {
      setLoading(false);
    }
  };

  const depositCash = async (params: DepositCashParams) => {
    if (!isConnected || !accountId) {
      throw new Error("Wallet not connected");
    }

    // Dynamically import the hashconnect service only on client side
    if (typeof window === "undefined") {
      throw new Error("This function can only be called on the client side");
    }

    console.log("Calling depositCash...");

    const { executeContractFunction } = await import("../services/hashconnect");
    setLoading(true);
    setError(null);
    try {
      const tx = await executeContractFunction(
        accountId,
        CONTRACT_ID,
        "depositCash",
        params
      );
      const result = await tx;
      console.log("DepositCash result:", result);
      return result;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      console.error("DepositCash error:", error);
      return error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCircle,
    depositCash,
    loading,
    error,
  };
}
