"use client";

/**
 * WalletConnect Service - Using @hashgraph/hedera-wallet-connect (Official Hedera wrapper)
 */

// DAppConnector will be loaded dynamically

// Define constants manually to avoid dependency issues
const HederaJsonRpcMethod = {
  SendTransaction: "hedera_sendTransaction",
  SignTransaction: "hedera_signTransaction",
  SignAndReturnTransaction: "hedera_signAndReturnTransaction",
  SignAndExecuteTransaction: "hedera_signAndExecuteTransaction", // Required for executeWithSigner
  SignMessage: "hedera_signMessage",
  GetAccountInfo: "hedera_getAccountInfo",
  GetAccountBalance: "hedera_getAccountBalance",
};

const HederaChainId = {
  Testnet: "hedera:testnet",
  Mainnet: "hedera:mainnet",
};

const HederaSessionEvent = {
  ChainChanged: "chainChanged",
  AccountsChanged: "accountsChanged",
};
import {
  AccountId,
  LedgerId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  Signer,
} from "@hashgraph/sdk";

// DAppConnector class and instance types
type DAppConnectorType = any; // Type will be inferred from the imported module
let DAppConnector: any = null; // Class constructor stored here after dynamic import
let dAppConnector: any = null; // Instance
let initPromise: Promise<void> | null = null;

const PROJECT_ID = "bfa190dbe93fcf30377b932b31129d05";
const APP_METADATA = {
  name: "CirclePool",
  description: "CirclePool - Hedera Hashgraph DApp",
  url: typeof window !== "undefined" ? window.location.origin : "https://circle-pool.vercel.app",
  icons: [
    typeof window !== "undefined"
      ? window.location.origin + "/favicon.ico"
      : "/favicon.ico",
  ],
};

/**
 * Initialize Hedera WalletConnect
 */
export async function initializeWalletConnect() {
  if (dAppConnector) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  if (typeof window === "undefined") {
    throw new Error("WalletConnect can only be initialized on the client side");
  }

  initPromise = (async () => {
    // Dynamic import to avoid bundling issues
    // IMPORTANT: We import directly from dist/lib/dapp to avoid the Reown adapter
    // which has compatibility issues with @reown/appkit versions
    if (!DAppConnector) {
      try {
        // Use the specific dapp path - this avoids the problematic Reown adapter imports
        // @ts-ignore - Dynamic import may not resolve types correctly at build time
        const hederaWalletConnect = await import("@hashgraph/hedera-wallet-connect/dist/lib/dapp/index.js");
        DAppConnector = hederaWalletConnect.DAppConnector;
      } catch (error) {
        console.error("Failed to import DAppConnector:", error);
        throw new Error("Failed to import DAppConnector from @hashgraph/hedera-wallet-connect/dist/lib/dapp");
      }
    }
    
    if (!DAppConnector) {
      throw new Error("Failed to import DAppConnector from @hashgraph/hedera-wallet-connect");
    }
    
    // Create DAppConnector
    const network = LedgerId.TESTNET; // Use LedgerId.MAINNET for production
    dAppConnector = new DAppConnector(
      APP_METADATA,
      network,
      PROJECT_ID,
      Object.values(HederaJsonRpcMethod),
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [HederaChainId.Testnet] // Use HederaChainId.Mainnet for production
    );

    // Initialize the connector
    await dAppConnector.init({ logger: "error" });

    console.log("✅ Hedera WalletConnect initialized");
  })();

  return initPromise;
}

/**
 * Get connected account IDs
 */
export async function getConnectedAccountIds(): Promise<AccountId[]> {
  if (!dAppConnector) {
    return [];
  }

  const signers = dAppConnector.signers;
  return signers.map((signer: Signer) => signer.getAccountId());
}

/**
 * Connect to wallet
 */
export async function connectWallet(): Promise<void> {
  await initializeWalletConnect();

  if (!dAppConnector) {
    throw new Error("DAppConnector not initialized");
  }

  try {
    // Disconnect any existing sessions first to ensure fresh connection with all methods
    // This ensures new sessions include hedera_signAndExecuteTransaction
    if (dAppConnector.signers.length > 0) {
      console.log("Disconnecting existing session to refresh with new methods...");
      await dAppConnector.disconnectAll();
    }

    // Open modal to connect with all required methods
    await dAppConnector.openModal();

    console.log("✅ Wallet connected!");
    const accounts = await getConnectedAccountIds();
    console.log("Connected accounts:", accounts.map(a => a.toString()));
    console.log("Supported methods:", Object.values(HederaJsonRpcMethod));
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
}

/**
 * Check if the current session has all required methods
 */
export function hasRequiredMethods(): boolean {
  if (!dAppConnector || !dAppConnector.walletConnectClient) {
    return false;
  }

  try {
    // Get the active session
    const sessions = dAppConnector.walletConnectClient.session.getAll();
    if (sessions.length === 0) {
      return false;
    }

    // Check if the session includes the required method
    const requiredMethod = HederaJsonRpcMethod.SignAndExecuteTransaction;
    const session = sessions[0];
    
    // Check namespaces for the method
    const namespaces = session?.namespaces;
    if (!namespaces) {
      return false;
    }

    // Check all namespaces for the required method
    for (const namespace of Object.values(namespaces)) {
      const ns = namespace as any; // Type assertion for WalletConnect namespace
      if (ns?.methods && Array.isArray(ns.methods) && ns.methods.includes(requiredMethod)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking session methods:", error);
    return false;
  }
}

/**
 * Clear WalletConnect storage (forces complete reset)
 */
export function clearWalletConnectStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // Clear WalletConnect related storage
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("wc@") || key.startsWith("walletconnect")) {
        localStorage.removeItem(key);
      }
    });
    console.log("✅ WalletConnect storage cleared");
  } catch (error) {
    console.error("Error clearing WalletConnect storage:", error);
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  if (!dAppConnector) {
    return;
  }

  try {
    await dAppConnector.disconnectAll();
    // Also clear storage to remove stale sessions
    clearWalletConnectStorage();
    console.log("✅ Wallet disconnected");
  } catch (error) {
    console.error("Error disconnecting:", error);
    // Still try to clear storage even if disconnect fails
    clearWalletConnectStorage();
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
  if (!dAppConnector) {
    throw new Error("DAppConnector not initialized");
  }

  if (typeof window === "undefined") {
    throw new Error("This function can only be called on the client side");
  }

  // Get the signer for this account
  const accountId = AccountId.fromString(accountIdForSigning);
  const signer = dAppConnector.signers.find(
    (s: Signer) => s.getAccountId().toString() === accountId.toString()
  );

  if (!signer) {
    throw new Error(`No signer found for account ${accountIdForSigning}`);
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

  // Check if session has required methods - if not, disconnect and require reconnect
  if (!hasRequiredMethods()) {
    console.warn("⚠️ Session missing required methods. Disconnecting...");
    await disconnectWallet();
    throw new Error(
      'WalletConnect session is missing required methods. ' +
      'Please disconnect and reconnect your wallet to enable transaction execution.'
    );
  }

  try {
    console.log("=== Building Transaction ===");
    console.log("Contract ID:", contractId);
    console.log("Function:", functionName);
    console.log("Gas:", gas);
    console.log("Signer Account:", signer.getAccountId().toString());

    // Set a node account ID based on network
    // Testnet nodes: 0.0.3, 0.0.4, 0.0.5
    // Mainnet nodes: 0.0.3, 0.0.4, 0.0.5 (same IDs but different network)
    const network = dAppConnector?.network || LedgerId.TESTNET;
    const isTestnet = network === LedgerId.TESTNET;
    const nodeAccountId = AccountId.fromString("0.0.3"); // Works for both testnet and mainnet

    // Build transaction using the signer
    let transaction = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(gas)
      .setFunction(functionName, contractParams)
      .setMaxTransactionFee(new Hbar(2))
      .setNodeAccountIds([nodeAccountId]) // Set node account ID before freezing
      .freezeWithSigner(signer);

    // Add payable amount if needed
    if (functionName === "depositCash") {
      transaction = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(gas)
        .setFunction(functionName, contractParams)
        .setPayableAmount(new Hbar(Number(functionParameters.amount) / 100000000))
        .setMaxTransactionFee(new Hbar(2))
        .setNodeAccountIds([nodeAccountId]) // Set node account ID before freezing
        .freezeWithSigner(signer);
    }

    console.log("Transaction frozen with signer");

    // Execute transaction with signer (this will prompt HashPack)
    console.log("=== Executing Transaction with Signer ===");
    const txResponse = await transaction.executeWithSigner(signer);

    console.log("✅ Transaction executed");
    console.log("Transaction ID:", txResponse.transactionId.toString());

    // Get receipt
    console.log("Getting receipt...");
    const receipt = await txResponse.getReceiptWithSigner(signer);
    
    console.log("✅ Receipt received");
    console.log("Status:", receipt.status.toString());

    return {
      success: true,
      transactionId: txResponse.transactionId.toString(),
      receipt,
      transactionResponse: txResponse,
    };
  } catch (error: any) {
    console.error("❌ Error executing contract function:", error);
    console.error("Error message:", error?.message);
    
    // Check for missing method error - user needs to reconnect with new methods
    if (error?.message?.includes('hedera_signAndExecuteTransaction') || 
        error?.txError?.message?.includes('hedera_signAndExecuteTransaction')) {
      throw new Error(
        'WalletConnect session is missing required methods. ' +
        'Please disconnect and reconnect your wallet to enable transaction execution.'
      );
    }
    
    // Provide helpful error messages
    if (error?.message?.includes('User rejected') || error?.message?.includes('rejected')) {
      throw new Error('Transaction rejected by user');
    }
    
    if (error?.message?.includes('No signer')) {
      throw new Error('Wallet not connected. Please reconnect.');
    }
    
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
  if (!dAppConnector) {
    throw new Error("DAppConnector not initialized");
  }

  const accountId = AccountId.fromString(accountIdForSigning);
  const signer = dAppConnector.signers.find(
    (s: Signer) => s.getAccountId().toString() === accountId.toString()
  );

  if (!signer) {
    throw new Error(`No signer found for account ${accountIdForSigning}`);
  }

  try {
    const signature = await signer.sign([Buffer.from(message)]);
    return signature;
  } catch (error) {
    console.error("Error signing message:", error);
    throw error;
  }
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
  return dAppConnector !== null && dAppConnector.signers.length > 0;
}

/**
 * Get current session (for backward compatibility)
 */
export function getSession(): any {
  return dAppConnector ? { connected: dAppConnector.signers.length > 0 } : null;
}

/**
 * Get DAppConnector instance
 */
export function getDAppConnector(): any {
  return dAppConnector;
}