/**
 * @title Get Circle Balance API Route
 * @author Jeff Muchiri
 * 
 * Returns balance and loan for a member in a circle
 * GET /api/circle/[circleId]/balance?member=<address>
 */

import { NextRequest, NextResponse } from "next/server";
import { ContractCallQuery, ContractFunctionParameters, Hbar, ContractId } from "@hashgraph/sdk";
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

    const memberAddress = request.nextUrl.searchParams.get("member");
    if (!memberAddress) {
      return NextResponse.json(
        { error: "Member address is required as query parameter" },
        { status: 400 }
      );
    }

    const client = getHederaClient();

    // Query getBalance function
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(CONTRACT_ID))
      .setGas(100000)
      .setFunction(
        "getBalance",
        new ContractFunctionParameters()
          .addUint256(circleId)
          .addAddress(memberAddress)
      )
      .setQueryPayment(new Hbar(0.1));

    const result = await query.execute(client);

    // Parse results: returns uint[] with 2 elements [balance, loan]
    const balance = result.getUint256(0).toNumber();
    const loan = result.getUint256(1).toNumber();

    return NextResponse.json({
      circleId,
      member: memberAddress,
      balance,
      loan,
    });
  } catch (error: any) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch balance" },
      { status: 500 }
    );
  }
}

