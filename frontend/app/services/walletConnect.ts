"use client";

/**
 * WalletConnect Service - Direct WalletConnect integration with @hashgraph/sdk
 * 
 * This replaces HashConnect to eliminate duplicate bundling issues.
 * Uses @hashgraph/sdk directly for transactions and WalletConnect for wallet connections.
 * 
 * Benefits:
 * - No duplicate @hashgraph/sdk bundling (HashConnect bundled it internally)
 * - Industry-standard WalletConnect protocol
 * - Better compatibility with modern Hedera wallets (HashPack, Blade, etc.)
 */

import type { SessionTypes } from "@walletconnect/types";
import { SignClient } from "@walletconnect/sign-client";
import { WalletConnectModal } from "@walletconnect/modal";
import {
  AccountId,
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  LedgerId,
} from "@hashgraph/sdk";

// WalletConnect instance
let signClientInstance: Awaited<ReturnType<typeof SignClient.init>> | null = null;
let walletConnectModal: WalletConnectModal | null = null;
let session: SessionTypes.Struct | null = null;

const PROJECT_ID = "bfa190dbe93fcf30377b932b31129d05"; // Your WalletConnect Project ID
// Hedera chain IDs in CAIP-2 format
const HEDERA_TESTNET = "hedera:testnet";
const HEDERA_MAINNET = "hedera:mainnet";
const CHAIN_ID = HEDERA_TESTNET; // Use HEDERA_MAINNET for mainnet

// Hedera JSON-RPC methods (from @hashgraph/hedera-wallet-connect spec)
const HederaJsonRpcMethod = {
  SendTransaction: "hedera_sendTransaction",
  SignTransaction: "hedera_signTransaction",
  SignAndReturnTransaction: "hedera_signAndReturnTransaction",
  SignMessage: "hedera_signMessage",
  GetAccountInfo: "hedera_getAccountInfo",
  GetAccountBalance: "hedera_getAccountBalance",
};

/**
 * Initialize WalletConnect Sign Client
 */
export async function initializeWalletConnect() {
  if (signClientInstance) {
    return signClientInstance;
  }

  if (typeof window === "undefined") {
    throw new Error("WalletConnect can only be initialized on the client side");
  }

  signClientInstance = await SignClient.init({
    projectId: PROJECT_ID,
    metadata: {
      name: "CirclePool",
      description: "CirclePool - Hedera Hashgraph DApp",
      url: typeof window !== "undefined" ? window.location.origin : "https://circle-pool.vercel.app",
      icons: [
        typeof window !== "undefined"
          ? window.location.origin + "/favicon.ico"
          : "/favicon.ico",
      ],
    },
  });

  // Initialize WalletConnect Modal
  walletConnectModal = new WalletConnectModal({
    projectId: PROJECT_ID,
    chains: [CHAIN_ID],
  });

  // Restore existing session
  const sessions = signClientInstance.session.getAll();
  if (sessions.length > 0) {
    session = sessions[0];
  }

  return signClientInstance;
}

/**
 * Get connected account IDs
 */
export async function getConnectedAccountIds(): Promise<AccountId[]> {
  if (!session || !signClientInstance) {
    return [];
  }

  const accounts = session.namespaces.hedera?.accounts || [];
  return accounts.map((account) => {
    // Account format: "hedera:testnet:0.0.123456" or "hedera:mainnet:0.0.123456"
    const parts = account.split(":");
    if (parts.length >= 3) {
      return AccountId.fromString(parts[2]);
    }
    return AccountId.fromString(account);
  });
}

/**
 * Connect to wallet
 */
export async function connectWallet(): Promise<void> {
  await initializeWalletConnect();
  
  if (!signClientInstance) {
    throw new Error("WalletConnect not initialized");
  }

  try {
    const { uri, approval } = await signClientInstance.connect({
      requiredNamespaces: {
        hedera: {
          methods: [
            HederaJsonRpcMethod.SendTransaction,
            HederaJsonRpcMethod.SignTransaction,
            HederaJsonRpcMethod.SignAndReturnTransaction,
            HederaJsonRpcMethod.SignMessage,
            HederaJsonRpcMethod.GetAccountInfo,
            HederaJsonRpcMethod.GetAccountBalance,
          ],
          chains: [CHAIN_ID],
          events: [],
        },
      },
    });

    if (uri && walletConnectModal) {
      // Open WalletConnect modal for pairing
      walletConnectModal.openModal({ uri });
    }

    session = await approval();
    
    if (walletConnectModal) {
      walletConnectModal.closeModal();
    }
  } catch (error) {
    if (walletConnectModal) {
      walletConnectModal.closeModal();
    }
    throw error;
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  if (!session || !signClientInstance) {
    return;
  }

  try {
    await signClientInstance.disconnect({
      topic: session.topic,
      reason: {
        code: 6000,
        message: "User disconnected",
      },
    });
  } catch (error) {
    console.error("Error disconnecting:", error);
  } finally {
    session = null;
  }
}

/**
 * Sign a transaction
 */
export async function signTransaction(
  accountIdForSigning: string,
  transaction: any
): Promise<any> {
  if (!session || !signClientInstance) {
    throw new Error("No active wallet session");
  }

  const accountIds = await getConnectedAccountIds();
  const accountId = AccountId.fromString(accountIdForSigning);
  
  if (!accountIds.some((id) => id.toString() === accountId.toString())) {
    throw new Error(`Account ${accountIdForSigning} is not connected`);
  }

  // Convert transaction to bytes and base64 for signing
  const transactionBytes = transaction.toBytes();
  const transactionBase64 = Buffer.from(transactionBytes).toString('base64');

  try {
    const response = await signClientInstance.request({
      topic: session.topic,
      chainId: CHAIN_ID,
      request: {
        method: HederaJsonRpcMethod.SignAndReturnTransaction,
        params: {
          transaction: transactionBase64,
          accountId: accountId.toString(),
        },
      },
    });

    return response;
  } catch (error) {
    console.error("Error signing transaction:", error);
    throw error;
  }
}

/**
 * Execute a transaction
 */
export async function executeTransaction(
  accountIdForSigning: string,
  transaction: any
): Promise<any> {
  if (!session || !signClientInstance) {
    throw new Error("No active wallet session");
  }

  const accountIds = await getConnectedAccountIds();
  const accountId = AccountId.fromString(accountIdForSigning);
  
  if (!accountIds.some((id) => id.toString() === accountId.toString())) {
    throw new Error(`Account ${accountIdForSigning} is not connected`);
  }

  // Convert transaction to bytes and base64
  const transactionBytes = transaction.toBytes();
  const transactionBase64 = Buffer.from(transactionBytes).toString('base64');

  try {
    const response = await signClientInstance.request({
      topic: session.topic,
      chainId: CHAIN_ID,
      request: {
        method: HederaJsonRpcMethod.SendTransaction,
        params: {
          transaction: transactionBase64,
          accountId: accountId.toString(),
        },
      },
    });

    return response;
  } catch (error) {
    console.error("Error executing transaction:", error);
    throw error;
  }
}

/**
 * Sign messages
 */
export async function signMessages(
  accountIdForSigning: string,
  message: string
): Promise<any> {
  if (!session || !signClientInstance) {
    throw new Error("No active wallet session");
  }

  const accountIds = await getConnectedAccountIds();
  const accountId = AccountId.fromString(accountIdForSigning);
  
  if (!accountIds.some((id) => id.toString() === accountId.toString())) {
    throw new Error(`Account ${accountIdForSigning} is not connected`);
  }

  try {
    const response = await signClientInstance.request({
      topic: session.topic,
      chainId: CHAIN_ID,
      request: {
        method: HederaJsonRpcMethod.SignMessage,
        params: {
          message,
          accountId: accountId.toString(),
        },
      },
    });

    return response;
  } catch (error) {
    console.error("Error signing message:", error);
    throw error;
  }
}

/**
 * Execute contract function
 */
export async function executeContractFunction(
  accountIdForSigning: string,
  contractId: string,
  functionName: string,
  functionParameters: any,
  gas: number = 500000
): Promise<any> {
  if (!session || !signClientInstance) {
    throw new Error("No active wallet session");
  }

  if (typeof window === "undefined") {
    throw new Error("This function can only be called on the client side");
  }

  const accountIds = await getConnectedAccountIds();
  const accountId = AccountId.fromString(accountIdForSigning);
  
  if (!accountIds.some((id) => id.toString() === accountId.toString())) {
    throw new Error(`Account ${accountIdForSigning} is not connected`);
  }

  // Build contract parameters
  const contractParams = new ContractFunctionParameters();

  if (functionName === "registerCircle") {
    contractParams
      .addUint256(Number(functionParameters.amount))
      .addUint256(Number(functionParameters.durationDays))
      .addUint256(Number(functionParameters.startDate))
      .addUint256(Number(functionParameters.maxMembers))
      .addUint256(Number(functionParameters.interestPercent))
      .addUint256(Number(functionParameters.leftPercent));
  } else if (functionName === "depositCash") {
    contractParams.addUint256(Number(functionParameters.circleId));
  } else if (functionName === "repayLoan") {
    contractParams
      .addAddress(functionParameters.userAddress)
      .addUint256(functionParameters.circleId);
  } else if (functionName === "deleteMember") {
    contractParams
      .addUint256(functionParameters.circleId)
      .addAddress(functionParameters.userAddress);
  } else if (functionName === "addMember") {
    contractParams
      .addAddress(functionParameters.userAddress)
      .addUint256(functionParameters.circleId);
  } else if (functionName === "deleteCircle") {
    contractParams.addUint256(functionParameters.circleId);
  } else {
    throw new Error(`Unknown function name: ${functionName}`);
  }

  // Create transaction
  let transaction = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(gas)
    .setFunction(functionName, contractParams);

  if (functionName === "depositCash") {
    transaction = transaction.setPayableAmount(
      new Hbar(Number(functionParameters.amount) / 100000000)
    );
  }

  transaction = transaction.setMaxTransactionFee(new Hbar(2));

  // CRITICAL: Transactions must be frozen with a client to set node account IDs
  // Create a client without operator (network only) for freezing
  const client = CHAIN_ID === HEDERA_TESTNET
    ? Client.forTestnet()
    : Client.forMainnet();
  
  // Freeze transaction with client (this sets node account IDs)
  const frozenTransaction = await transaction.freezeWith(client);

  // Execute via WalletConnect
  // Convert transaction bytes to base64 string (WalletConnect expects base64)
  const transactionBytes = frozenTransaction.toBytes();
  const transactionBase64 = Buffer.from(transactionBytes).toString('base64');

  try {
    const response = await signClientInstance.request({
      topic: session.topic,
      chainId: CHAIN_ID,
      request: {
        method: HederaJsonRpcMethod.SendTransaction,
        params: {
          transaction: transactionBase64,
          accountId: accountId.toString(),
        },
      },
    });

    return {
      success: true,
      transactionId: (response as any)?.transactionId || "unknown",
      response,
    };
  } catch (error) {
    console.error("Error executing contract function:", error);
    throw error;
  }
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
  return session !== null && signClientInstance !== null;
}

/**
 * Get current session
 */
export function getSession(): SessionTypes.Struct | null {
  return session;
}

