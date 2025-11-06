/**
 * @title Get Circle Members Balance API Route
 * @author Jeff Muchiri
 * 
 * Returns balances for all members in a circle
 * GET /api/circle/[circleId]/members
 */

import { NextRequest, NextResponse } from "next/server";
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
              select: { evmAddress: true },
            },
          },
        },
      },
    });

    const addresses: string[] = Array.isArray(prismaCircle?.members)
      ? prismaCircle!.members
          .map((m) => {
            const evmAddress = m.user?.evmAddress;
            if (!evmAddress) return null;
            // Normalize address: ensure 0x prefix and lowercase
            let normalized = evmAddress;
            if (!normalized.startsWith('0x')) {
              if (normalized.length === 40) {
                normalized = '0x' + normalized;
              }
            }
            return normalized.toLowerCase();
          })
          .filter((a): a is string => typeof a === "string" && a.length > 0)
      : [];


    // Lazy load SDK modules
    const { ContractCallQuery, ContractFunctionParameters, Hbar, ContractId } = await import("@hashgraph/sdk");
    
    const client = await getHederaClient();

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
                .addUint256(Number(circleIdNum))
                .addAddress(address as `0x${string}`)
            )
            .setQueryPayment(new Hbar(0.1));

          const result = await query.execute(client);
          
          // Parse balance and loan from result
          // getBalance returns uint256[] (dynamic array)
          // For dynamic arrays: index 0 contains the offset (in bytes) to the array data
          const arrayOffsetBytes = result.getUint256(0).toNumber();
          const arrayLengthSlot = arrayOffsetBytes / 32; // Convert bytes to slot index (32 bytes per slot)
          
          // At the offset slot: array length (should be 2: [balance, loan])
          const arrayLength = result.getUint256(arrayLengthSlot).toNumber();
          
          if (arrayLength === 2) {
            // Get balance (index 0) and loan (index 1) from the array
            const balance = result.getUint256(arrayLengthSlot + 1).toNumber();
            const loan = result.getUint256(arrayLengthSlot + 2).toNumber();
            
            // Return normalized address (lowercase) for consistency
            return { address: address.toLowerCase(), balance, loan };
          } else {
            console.error(`Invalid array length for ${address}: expected 2, got ${arrayLength}`);
            return { address: address.toLowerCase(), balance: 0, loan: 0 };
          }
        } catch (e) {
          console.error(`Error querying balance for ${address}:`, e);
          // On failure, return zeros for this member to keep the list stable
          return { address: address.toLowerCase(), balance: 0, loan: 0 };
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

