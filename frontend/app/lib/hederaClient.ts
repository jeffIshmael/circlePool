/**
 * @title Hedera Client Utility
 * @author Jeff Muchiri
 *
 * Utility for creating Hedera client instances for server-side operations
 */
import 'server-only';
import { AccountId, Client, PrivateKey } from "@hashgraph/sdk";

  // Get network from environment or default to testnet
const network = process.env.HEDERA_NETWORK || "testnet";

/**
 * Creates and returns a configured Hedera client for server-side operations
 * Requires HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY environment variables
 */
export function getHederaClient(): Client {
  const operatorId = process.env.HEDERA_OPERATOR_ID as string;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY as string;

  if (!operatorId || !operatorKey) {
    throw new Error(
      "HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY environment variables are required"
    );
  }

  const client =
    network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromStringECDSA(operatorKey));

  return client;
}
