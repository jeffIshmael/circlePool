import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/app/lib/apiAuth";


// Get HBAR balance for a given account ID
export async function GET(request: NextRequest) {
  try {
    if (!validateApiKey(request)) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    if (!accountId) return NextResponse.json({ error: "Missing accountId" }, { status: 400 });

    const network = process.env.HEDERA_NETWORK || process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
    const baseUrl = network === "mainnet"
      ? "https://mainnet.mirrornode.hedera.com"
      : "https://testnet.mirrornode.hedera.com";

    const url = `${baseUrl}/api/v1/balances?account.id=${encodeURIComponent(accountId)}&limit=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return NextResponse.json({ error: `Mirror node ${res.status}` }, { status: 502 });
    const json = await res.json();
    const tinybars = json?.balances?.[0]?.balance;
    if (typeof tinybars !== "number") return NextResponse.json({ error: "Not found" }, { status: 404 });
    const hbar = tinybars / 100_000_000;
    return NextResponse.json({ tinybars, hbar });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}


