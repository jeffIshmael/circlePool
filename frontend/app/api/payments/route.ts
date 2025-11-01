/**
 * @title Get Payments API Route
 * @author Jeff Muchiri
 * 
 * Returns all payment records
 * GET /api/payments
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

    // Query getPayments function
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(CONTRACT_ID))
      .setGas(200000)
      .setFunction("getPayments", new ContractFunctionParameters())
      .setQueryPayment(new Hbar(0.1));

    const result = await query.execute(client);

    // Parse results: returns Payment[] memory
    // Payment struct: { uint id, uint circleId, address receiver, uint amount, uint timestamp }
    const payments: Array<{
      id: number;
      circleId: number;
      receiver: string;
      amount: number;
      timestamp: number;
    }> = [];

    try {
      // Parse dynamic array of Payment structs
      let index = 0;
      while (true) {
        try {
          const id = result.getUint256(index).toNumber();
          const circleId = result.getUint256(index + 1).toNumber();
          const receiver = result.getAddress(index + 2);
          const amount = result.getUint256(index + 3).toNumber();
          const timestamp = result.getUint256(index + 4).toNumber();

          payments.push({
            id,
            circleId,
            receiver,
            amount,
            timestamp,
          });

          index += 5; // Move to next payment struct
        } catch (e) {
          break;
        }
      }
    } catch (error) {
      console.error("Error parsing payments array:", error);
      // Return empty array if parsing fails
    }

    return NextResponse.json({
      payments,
      total: payments.length,
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

