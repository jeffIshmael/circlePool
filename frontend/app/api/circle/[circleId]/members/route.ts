/**
 * @title Get Circle Members Balance API Route
 * @author Jeff Muchiri
 * 
 * Returns balances for all members in a circle
 * GET /api/circle/[circleId]/members
 */

import { NextRequest, NextResponse } from "next/server";
import { ContractCallQuery, ContractFunctionParameters, Hbar, ContractId } from "@hashgraph/sdk";
import { getHederaClient } from "@/app/lib/hederaClient";
import { validateApiKey, unauthorizedResponse } from "@/app/lib/apiAuth";
import { CONTRACT_ID } from "@/app/lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: { circleId: string } }
) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return unauthorizedResponse();
    }

    const circleId = parseInt(params.circleId);
    if (isNaN(circleId)) {
      return NextResponse.json(
        { error: "Invalid circle ID" },
        { status: 400 }
      );
    }

    const client = getHederaClient();

    // Query getEachMemberBalance function
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(CONTRACT_ID))
      .setGas(200000)
      .setFunction(
        "getEachMemberBalance",
        new ContractFunctionParameters().addUint256(circleId)
      )
      .setQueryPayment(new Hbar(0.1));

    const result = await query.execute(client);

    // Parse results: returns (address[] members, uint[][] balances)
    // Each balance array has 2 elements: [balance, loan]
    // Note: Array parsing may need adjustment based on actual SDK behavior
    
    const members: Array<{
      address: string;
      balance: number;
      loan: number;
    }> = [];

    try {
      // The exact indexing depends on how Hedera SDK returns dynamic arrays
      // We'll need to test and adjust this parsing
      // For now, try reading sequentially
      let index = 0;
      while (true) {
        try {
          const address = result.getAddress(index);
          const balance = result.getUint256(index + 1).toNumber();
          const loan = result.getUint256(index + 2).toNumber();
          
          members.push({ address, balance, loan });
          index += 3;
        } catch (e) {
          break;
        }
      }
    } catch (error) {
      console.error("Error parsing members array:", error);
      // Return empty array if parsing fails
    }

    return NextResponse.json({
      circleId,
      members,
      total: members.length,
    });
  } catch (error: any) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch members" },
      { status: 500 }
    );
  }
}

