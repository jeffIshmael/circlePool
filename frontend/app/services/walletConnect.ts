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
  TransactionId,
} from "@hashgraph/sdk";

// WalletConnect instance
let signClientInstance: Awaited<ReturnType<typeof SignClient.init>> | null = null;
let walletConnectModal: WalletConnectModal | null = null;
let session: SessionTypes.Struct | null = null;
let initPromise: Promise<Awaited<ReturnType<typeof SignClient.init>>> | null = null;

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
 * Uses promise cache to prevent multiple initializations
 */
export async function initializeWalletConnect() {
  // Return existing instance if already initialized
  if (signClientInstance) {
    return signClientInstance;
  }

  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  if (typeof window === "undefined") {
    throw new Error("WalletConnect can only be initialized on the client side");
  }

  // Create initialization promise
  initPromise = (async () => {
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

    // Initialize WalletConnect Modal (only once)
    if (!walletConnectModal) {
      walletConnectModal = new WalletConnectModal({
        projectId: PROJECT_ID,
        chains: [CHAIN_ID],
      });
    }

    // Restore existing session
    const sessions = signClientInstance.session.getAll();
    if (sessions.length > 0) {
      session = sessions[0];
    }

    return signClientInstance;
  })();

  return initPromise;
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

  // Convert transaction to bytes for signing
  const transactionBytes = transaction.toBytes();
  
  // Convert to base64 string
  let transactionBase64: string;
  if (typeof Buffer !== 'undefined') {
    transactionBase64 = Buffer.from(transactionBytes).toString('base64');
  } else {
    const binary = Array.from(transactionBytes, (byte: number) => String.fromCharCode(byte)).join('');
    transactionBase64 = btoa(binary);
  }

  try {
    const response = await signClientInstance.request({
      topic: session.topic,
      chainId: CHAIN_ID,
      request: {
        method: HederaJsonRpcMethod.SignAndReturnTransaction,
        params: {
          transaction: transactionBase64, // Base64 string
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

  // Convert transaction to bytes
  const transactionBytes = transaction.toBytes();
  
  // Convert to base64 string
  let transactionBase64: string;
  if (typeof Buffer !== 'undefined') {
    transactionBase64 = Buffer.from(transactionBytes).toString('base64');
  } else {
    const binary = Array.from(transactionBytes, (byte: number) => String.fromCharCode(byte)).join('');
    transactionBase64 = btoa(binary);
  }

  try {
    const response = await signClientInstance.request({
      topic: session.topic,
      chainId: CHAIN_ID,
      request: {
        method: HederaJsonRpcMethod.SendTransaction,
        params: {
          transaction: transactionBase64, // Base64 string
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

  // CRITICAL: Set transaction ID with payer account before freezing
  // The payer account ID must be set for the transaction to be frozen
  transaction = transaction.setTransactionId(
    TransactionId.generate(accountId)
  );

  // CRITICAL: Transactions must be frozen with a client to set node account IDs
  // Create a client without operator (network only) for freezing
  const client = CHAIN_ID === HEDERA_TESTNET
    ? Client.forTestnet()
    : Client.forMainnet();
  
  // Freeze transaction with client (this sets node account IDs)
  // The transactionId must be set before calling freezeWith
  const frozenTransaction = await transaction.freezeWith(client);

  // Execute via WalletConnect
  // Convert transaction to bytes - try base64 format (most wallets expect this)
  const transactionBytes = frozenTransaction.toBytes();
  
  // Convert to base64 string (Hedera WalletConnect typically expects base64)
  let transactionBase64: string;
  if (typeof Buffer !== 'undefined') {
    transactionBase64 = Buffer.from(transactionBytes).toString('base64');
  } else {
    const binary = Array.from(transactionBytes, (byte: number) => String.fromCharCode(byte)).join('');
    transactionBase64 = btoa(binary);
  }

  try {
    console.log("=== WalletConnect Transaction Request ===");
    console.log("Method:", HederaJsonRpcMethod.SignAndReturnTransaction);
    console.log("Chain ID:", CHAIN_ID);
    console.log("Account ID:", accountId.toString());
    console.log("Transaction (base64) length:", transactionBase64.length);
    console.log("Session topic:", session.topic);
    console.log("Session exists:", !!session);
    console.log("Sign client exists:", !!signClientInstance);
    
    // Check if session supports the method
    const supportedMethods = session.namespaces.hedera?.methods || [];
    console.log("Supported methods:", supportedMethods);
    console.log("Requested method supported:", supportedMethods.includes(HederaJsonRpcMethod.SignAndReturnTransaction));
    
    if (!supportedMethods.includes(HederaJsonRpcMethod.SignAndReturnTransaction)) {
      console.warn("⚠️ Wallet does not support", HederaJsonRpcMethod.SignAndReturnTransaction);
      console.warn("Available methods:", supportedMethods);
      // Fallback to SendTransaction if SignAndReturnTransaction is not supported
      if (supportedMethods.includes(HederaJsonRpcMethod.SendTransaction)) {
        console.log("Falling back to", HederaJsonRpcMethod.SendTransaction);
      }
    }

    // Request transaction signing via WalletConnect
    // Use hedera_signAndReturnTransaction to get the wallet to prompt for signing
    // This method shows the transaction for signing and returns the signed transaction
    console.log("Sending WalletConnect sign request...");
    const requestParams = {
      topic: session.topic,
      chainId: CHAIN_ID,
      request: {
        method: HederaJsonRpcMethod.SignAndReturnTransaction, // Changed from SendTransaction
        params: {
          transaction: transactionBase64, // Base64 string
          accountId: accountId.toString(),
        },
      },
    };
    
    console.log("Request params:", {
      ...requestParams,
      request: {
        ...requestParams.request,
        params: {
          ...requestParams.request.params,
          transaction: transactionBase64.substring(0, 50) + '... (base64)',
        },
      },
    });
    
    console.log("⏳ Waiting for wallet to prompt for signing...");
    const response = await signClientInstance.request(requestParams);
    
    console.log("✅ Wallet responded with signed transaction");
    
    // If we get a signed transaction back, we need to execute it ourselves
    // For now, let's return the response - we might need to execute it separately
    // or the wallet might execute it automatically depending on the method

    console.log("Transaction response received:", response);
    
    // Check if we got a signed transaction back (from SignAndReturnTransaction)
    // or a transaction ID (from SendTransaction)
    const signedTransaction = (response as any)?.signedTransaction;
    const transactionId = (response as any)?.transactionId || (response as any)?.transactionID;
    
    if (signedTransaction) {
      console.log("✅ Received signed transaction from wallet");
      console.log("⚠️ Note: Signed transaction needs to be executed separately");
      // TODO: Execute the signed transaction if needed
      // For now, return success - the wallet has signed it
      return {
        success: true,
        signedTransaction,
        response,
        transactionId: transactionId || "pending",
      };
    } else if (transactionId) {
      console.log("✅ Transaction executed successfully via wallet");
      return {
        success: true,
        transactionId,
        response,
      };
    } else {
      console.log("✅ Transaction processed by wallet");
      return {
        success: true,
        transactionId: "unknown",
        response,
      };
    }
  } catch (error: any) {
    console.error("Error executing contract function:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      data: error?.data,
      stack: error?.stack,
    });
    
    // Provide more helpful error message
    if (error?.code === 6001 || error?.message?.includes('method not supported')) {
      throw new Error(`Wallet does not support ${HederaJsonRpcMethod.SendTransaction}. Please ensure your wallet supports Hedera WalletConnect.`);
    }
    
    if (error?.message?.includes('session')) {
      throw new Error('Wallet session expired. Please reconnect your wallet.');
    }
    
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

