/**
 * @title Get Circle Payout Order API Route
 * @author Jeff Muchiri
 * 
 * Returns payout order for a circle
 * GET /api/circle/[circleId]/payout-order
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

    // Query getCirclePayoutOrder function
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(CONTRACT_ID))
      .setGas(100000)
      .setFunction(
        "getCirclePayoutOrder",
        new ContractFunctionParameters().addUint256(circleId)
      )
      .setQueryPayment(new Hbar(0.1));

    const result = await query.execute(client);

    // Parse results: returns address[] memory
    const payoutOrder: string[] = [];

    try {
      // Parse dynamic array of addresses
      let index = 0;
      while (true) {
        try {
          const address = result.getAddress(index);
          payoutOrder.push(address);
          index++;
        } catch (e) {
          break;
        }
      }
    } catch (error) {
      console.error("Error parsing payout order array:", error);
      // Return empty array if parsing fails
    }

    return NextResponse.json({
      circleId,
      payoutOrder,
      total: payoutOrder.length,
    });
  } catch (error: any) {
    console.error("Error fetching payout order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payout order" },
      { status: 500 }
    );
  }
}

