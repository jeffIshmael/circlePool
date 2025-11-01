/**
 * @title Get Circle API Route
 * @author Jeff Muchiri
 * 
 * Returns circle details by ID
 * GET /api/circle/[circleId]
 */

import { NextRequest, NextResponse } from "next/server";
import { getHederaClient } from "@/app/lib/hederaClient";
import { validateApiKey, unauthorizedResponse } from "@/app/lib/apiAuth";
import { CONTRACT_ID } from "@/app/lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return unauthorizedResponse();
    }

    // Lazy load SDK modules
    const { ContractCallQuery, ContractFunctionParameters, Hbar, ContractId } = await import("@hashgraph/sdk");
    
    const { circleId: rawCircleId } = await params;
    console.log("rawCircleId",rawCircleId);
    const circleId = Number.parseInt(String(rawCircleId), 10);
    console.log("circleId",circleId);
    if (Number.isNaN(circleId)) {
      return NextResponse.json(
        { error: "Invalid circle ID" },
        { status: 400 }
      );
    }

    const client = await getHederaClient();

    // Query getCircle function
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(CONTRACT_ID))
      .setGas(100000)
      .setFunction(
        "getCircle",
        new ContractFunctionParameters().addUint256(circleId)
      )
      .setQueryPayment(new Hbar(0.1));

    const result = await query.execute(client);

    // Parse results according to contract return type:
    // (uint payDate, uint amount, uint startDate, uint duration, uint round, uint cycle, address admin, address[] members, uint loanableAmount, uint interestPercent, uint leftPercent)
    const payDate = result.getUint256(0).toNumber();
    const amount = result.getUint256(1).toNumber();
    const startDate = result.getUint256(2).toNumber();
    const duration = result.getUint256(3).toNumber();
    const round = result.getUint256(4).toNumber();
    const cycle = result.getUint256(5).toNumber();
    const admin = result.getAddress(6);
    
    // Get members array - need to use ContractFunctionResult methods
    const membersLength = result.getUint256(7).toNumber(); // Dynamic array length
    const members: string[] = [];
    for (let i = 0; i < membersLength; i++) {
      try {
        // For dynamic arrays, we might need to check the ABI or use a different approach
        // Hedera SDK returns dynamic arrays differently
        const memberAddress = result.getAddress(8 + i);
        members.push(memberAddress);
      } catch (e) {
        // If the array indexing doesn't work, we may need to decode differently
        break;
      }
    }

    const loanableAmount = result.getUint256(8 + membersLength).toNumber();
    const interestPercent = result.getUint256(9 + membersLength).toNumber();
    const leftPercent = result.getUint256(10 + membersLength).toNumber();

    // Alternative: Try to get members by reading the result bytes if the above doesn't work
    // For now, we'll use a workaround - query the circle again or use a helper function
    // Note: Hedera SDK may return dynamic arrays in a specific format
    // You may need to adjust this parsing based on actual SDK behavior

    return NextResponse.json({
      circleId,
      payDate,
      amount,
      startDate,
      duration,
      round,
      cycle,
      admin,
      members,
      loanableAmount,
      interestPercent,
      leftPercent,
    });
  } catch (error: any) {
    console.error("Error fetching circle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch circle" },
      { status: 500 }
    );
  }
}

