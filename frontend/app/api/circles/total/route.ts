import { NextRequest, NextResponse } from "next/server";
import { getHederaClient } from "@/app/lib/hederaClient";
import { validateApiKey, unauthorizedResponse } from "@/app/lib/apiAuth";
import { CONTRACT_ID } from "@/app/lib/constants";

export async function GET(request: NextRequest) {
  try {
    if (!validateApiKey(request)) return unauthorizedResponse();

    // Lazy load SDK modules
    const { ContractCallQuery, ContractFunctionParameters, Hbar, ContractId } = await import("@hashgraph/sdk");
    
    const client = await getHederaClient();
    const query = new ContractCallQuery()
      .setContractId(ContractId.fromString(CONTRACT_ID))
      .setGas(200000)
      .setFunction("totalCircles", new ContractFunctionParameters())
      .setQueryPayment(new Hbar(0.1));

    const result = await query.execute(client);
    const total = result.getUint256(0).toNumber();
    return NextResponse.json({ total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}


