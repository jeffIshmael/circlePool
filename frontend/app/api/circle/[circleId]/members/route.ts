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
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    const circleIdNum = Number.parseInt(String(rawCircleId), 10);
    if (Number.isNaN(circleIdNum)) {
      return NextResponse.json(
        { error: "Invalid circle ID" },
        { status: 400 }
      );
    }

    // Fetch members from Prisma by blockchainId (string match)
    const prismaCircle = await prisma.circle.findFirst({
      where: { blockchainId: String(circleIdNum) },
      include: {
        members: {
          include: {
            user: {
              select: { address: true },
            },
          },
        },
      },
    });

    const addresses: string[] = Array.isArray(prismaCircle?.members)
      ? prismaCircle!.members
          .map((m) => m.user?.address)
          .filter((a): a is string => typeof a === "string" && a.length > 0)
      : [];

    const client = getHederaClient();

    // For each address, query getBalance(circleId, address)
    const members = await Promise.all(
      addresses.map(async (address) => {
        try {
          const query = new ContractCallQuery()
            .setContractId(ContractId.fromString(CONTRACT_ID))
            .setGas(100000)
            .setFunction(
              "getBalance",
              new ContractFunctionParameters()
                .addUint256(circleIdNum)
                .addAddress(address)
            )
            .setQueryPayment(new Hbar(0.1));

          const result = await query.execute(client);
          const balance = result.getUint256(0).toNumber();
          const loan = result.getUint256(1).toNumber();
          return { address, balance, loan };
        } catch (e) {
          // On failure, return zeros for this member to keep the list stable
          return { address, balance: 0, loan: 0 };
        }
      })
    );

    return NextResponse.json({
      circleId: circleIdNum,
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

