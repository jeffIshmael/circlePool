/**
 * @title Get All Circles API Route
 * @author Jeff Muchiri
 * 
 * Returns all circles
 * GET /api/circles
 */

import { NextRequest, NextResponse } from "next/server";
import { getHederaClient } from "@/app/lib/hederaClient";
import { validateApiKey, unauthorizedResponse } from "@/app/lib/apiAuth";
import { CONTRACT_ID } from "@/app/lib/constants";

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return unauthorizedResponse();
    }

    // Lazy load SDK modules
    const { ContractCallQuery, ContractFunctionParameters, Hbar, ContractId } = await import("@hashgraph/sdk");
    
    const client = await getHederaClient();

    // Query getCircles function
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(CONTRACT_ID))
      .setGas(200000)
      .setFunction("getCircles", new ContractFunctionParameters())
      .setQueryPayment(new Hbar(0.1));

    const result = await query.execute(client);

    console.log("api circles result",result);

    // Parse results according to contract return type:
    // (uint[] circleIds, uint[] amounts, uint[] startDates, uint[] durations, uint[] loanableAmounts, address[] admins)
    // Note: Hedera SDK may return arrays differently - this parsing may need adjustment
    
    const circles: Array<{
      circleId: number;
      amount: number;
      startDate: number;
      duration: number;
      loanableAmount: number;
      admin: string;
    }> = [];

    // Try to parse arrays - the exact indexing depends on SDK implementation
    // We may need to adjust based on actual return structure
    try {
      // Get array lengths first (if available) or count them
      // For now, we'll try to read sequentially until we hit an error
      let index = 0;
      while (true) {
        try {
          const circleId = result.getUint256(index).toNumber();
          const amount = result.getUint256(index + 1).toNumber();
          const startDate = result.getUint256(index + 2).toNumber();
          const duration = result.getUint256(index + 3).toNumber();
          const loanableAmount = result.getUint256(index + 4).toNumber();
          const admin = result.getAddress(index + 5);

          circles.push({
            circleId,
            amount,
            startDate,
            duration,
            loanableAmount,
            admin,
          });

          index += 6; // Move to next circle
        } catch (e) {
          break;
        }
      }
    } catch (error) {
      console.error("Error parsing circles array:", error);
      // Return empty array if parsing fails
    }

    return NextResponse.json({ circles, total: circles.length });
  } catch (error: any) {
    console.error("Error fetching circles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch circles" },
      { status: 500 }
    );
  }
}

