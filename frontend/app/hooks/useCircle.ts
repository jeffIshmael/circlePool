/**
 * Circle Hook - Contract interaction for circles
 * 
 * This hook uses WalletConnect service for all blockchain operations.
 * Uses @hashgraph/sdk directly for transactions, eliminating duplicate bundling issues.
 */

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
    // Only run on client side
    if (typeof window === "undefined") {
      throw new Error("This function can only be called on the client side");
    }

    console.log("Calling executeContractFunction...");

    const { executeContractFunction } = await import("../services/walletConnect");

    setLoading(true);
    setError(null);
    try {
      const result = await executeContractFunction(
        accountId,
        CONTRACT_ID,
        "registerCircle",
        params
      );
      
      // Verify the result is successful
      if (!result || !result.success) {
        throw new Error("Circle creation failed on blockchain");
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      throw error; // Re-throw to stop execution
    } finally {
      setLoading(false);
    }
  };

  const depositCash = async (params: DepositCashParams) => {
    if (!isConnected || !accountId) {
      throw new Error("Wallet not connected");
    }

    // Only run on client side
    if (typeof window === "undefined") {
      throw new Error("This function can only be called on the client side");
    }

    console.log("Calling depositCash...");

    const { executeContractFunction } = await import("../services/walletConnect");
    setLoading(true);
    setError(null);
    try {
      const result = await executeContractFunction(
        accountId,
        CONTRACT_ID,
        "depositCash",
        params
      );
      
      // Verify the result is successful
      if (!result || !result.success) {
        throw new Error("Deposit failed on blockchain");
      }
      
      console.log("DepositCash result:", result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("DepositCash error:", error);
      throw error; // Re-throw to stop execution
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
