"use client";

import { HashConnect } from "hashconnect";
import {
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  LedgerId,
  TransactionReceipt,
  Client,
} from "@hashgraph/sdk";

const env = "testnet";

const appMetadata = {
  name: "CirclePool",
  description: "CirclePool - Hedera Hashgraph DApp",
  icons: [
    typeof window !== "undefined"
      ? window.location.origin + "/favicon.ico"
      : "/favicon.ico",
  ],
  url: "https://circle-pool.vercel.app",
};

export const hc = new HashConnect(
  LedgerId.fromString(env),
  "bfa190dbe93fcf30377b932b31129d05",
  appMetadata,
  true
);

export const hcInitPromise = hc.init();

export const getHashConnectInstance = (): HashConnect => {
  if (!hc) {
    throw new Error(
      "HashConnect not initialized. Make sure this is called on the client side."
    );
  }
  return hc;
};

export const getConnectedAccountIds = () => {
  const instance = getHashConnectInstance();
  return instance.connectedAccountIds;
};

export const getInitPromise = (): Promise<void> => {
  if (!hcInitPromise) {
    throw new Error(
      "HashConnect not initialized. Make sure this is called on the client side."
    );
  }
  return hcInitPromise;
};

export const signTransaction = async (
  accountIdForSigning: string,
  transaction: any
) => {
  const instance = getHashConnectInstance();
  await getInitPromise();

  const accountIds = getConnectedAccountIds();
  if (!accountIds || accountIds.length === 0) {
    throw new Error("No connected accounts");
  }

  const isAccountIdForSigningPaired = accountIds.some(
    (id) => id.toString() === accountIdForSigning.toString()
  );
  if (!isAccountIdForSigningPaired) {
    throw new Error(`Account ${accountIdForSigning} is not paired`);
  }

  // FIX: Cast string to AccountId properly
  const accountId = AccountId.fromString(accountIdForSigning);
  const result = await instance.signTransaction(accountId as any, transaction);
  return result;
};

export const executeTransaction = async (
  accountIdForSigning: string,
  transaction: any
) => {
  const instance = getHashConnectInstance();
  await getInitPromise();

  const accountIds = getConnectedAccountIds();
  if (!accountIds || accountIds.length === 0) {
    throw new Error("No connected accounts");
  }

  const isAccountIdForSigningPaired = accountIds.some(
    (id) => id.toString() === accountIdForSigning.toString()
  );
  if (!isAccountIdForSigningPaired) {
    throw new Error(`Account ${accountIdForSigning} is not paired`);
  }

  // FIX: Cast string to AccountId properly
  const accountId = AccountId.fromString(accountIdForSigning);
  const result = await instance.sendTransaction(accountId as any, transaction);
  return result;
};

export const signMessages = async (
  accountIdForSigning: string,
  message: string
) => {
  const instance = getHashConnectInstance();
  await getInitPromise();

  const accountIds = getConnectedAccountIds();
  if (!accountIds || accountIds.length === 0) {
    throw new Error("No connected accounts");
  }

  const isAccountIdForSigningPaired = accountIds.some(
    (id) => id.toString() === accountIdForSigning.toString()
  );
  if (!isAccountIdForSigningPaired) {
    throw new Error(`Account ${accountIdForSigning} is not paired`);
  }

  // FIX: Cast string to AccountId properly
  const accountId = AccountId.fromString(accountIdForSigning);
  const result = await instance.signMessages(accountId as any, message);
  return result;
};

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return String(error);
};

// Helper function to safely get error stack
const getErrorStack = (error: unknown): string | undefined => {
  if (error instanceof Error) return error.stack;
  if (typeof error === 'object' && error !== null && 'stack' in error) {
    return String(error.stack);
  }
  return undefined;
};

export const executeContractFunction = async (
  accountIdForSigning: string,
  contractId: string,
  functionName: string,
  functionParameters: any,
  gas: number = 500000
) => {
  const instance = getHashConnectInstance();
  await getInitPromise();

  const accountIds = getConnectedAccountIds();
  if (!accountIds || accountIds.length === 0) {
    throw new Error("No connected accounts");
  }

  const isAccountIdForSigningPaired = accountIds.some(
    (id) => id.toString() === accountIdForSigning.toString()
  );
  if (!isAccountIdForSigningPaired) {
    throw new Error(`Account ${accountIdForSigning} is not paired`);
  }

  try {
    let signer;

    // FIX: Type-safe signer access
    if (typeof instance.getSigner === "function") {
      try {
        signer = instance.getSigner(accountIdForSigning as any);
      } catch (err: unknown) {
        console.error("🚨 DIAGNOSTIC: Direct getSigner failed:", err);
        console.error(
          "🚨 DIAGNOSTIC: getSigner error type:",
          err?.constructor?.name
        );
        console.error("🚨 DIAGNOSTIC: getSigner error message:", getErrorMessage(err));
      }
    } else {
      console.log(
        "🔍 DIAGNOSTIC: getSigner method not available or not a function"
      );
    }

    // Approach 2: Try with provider if direct signer failed
    if (!signer) {
      try {
        // FIX: Type-safe property access
        const instanceAny = instance as any;
        const possibleTopics = [
          instanceAny.hcData?.topic,
          instanceAny.topic,
          instanceAny.connectionData?.topic,
          Object.keys(instance.connectedAccountIds || {})[0],
        ];

        const topic = possibleTopics.find((t) => t && typeof t === "string");

        if (topic) {
          if (typeof instanceAny.getProvider === "function") {
            const provider = instanceAny.getProvider(
              "testnet",
              topic,
              accountIdForSigning
            );

            if (provider && typeof instance.getSigner === "function") {
              signer = instance.getSigner(provider);
            } else {
              console.error("🚨 DIAGNOSTIC: Cannot get signer from provider");
            }
          } else {
            console.error("🚨 DIAGNOSTIC: getProvider method not available");
          }
        } else {
          console.error(
            "🚨 DIAGNOSTIC: No topic available for provider approach"
          );
        }
      } catch (err: unknown) {
        console.error("🚨 DIAGNOSTIC: Provider approach failed:", err);
        console.error(
          "🚨 DIAGNOSTIC: Provider error type:",
          err?.constructor?.name
        );
        console.error("🚨 DIAGNOSTIC: Provider error message:", getErrorMessage(err));
      }
    }

    if (!signer) {
      throw new Error(
        "Could not create signer. Please disconnect and reconnect your wallet."
      );
    }

    // Build the contract parameters based on function name
    let contractParams = new ContractFunctionParameters();

    if (functionName === "registerCircle") {
      try {
        contractParams
          .addUint256(Number(functionParameters.amount))
          .addUint256(Number(functionParameters.durationDays))
          .addUint256(Number(functionParameters.startDate))
          .addUint256(Number(functionParameters.maxMembers))
          .addUint256(Number(functionParameters.interestPercent))
          .addUint256(Number(functionParameters.leftPercent));
      } catch (paramError: unknown) {
        console.error(
          "🚨 DIAGNOSTIC: Error adding registerCircle parameters:",
          paramError
        );
        throw paramError;
      }
    } else if (functionName === "depositCash") {
      try {
        contractParams.addUint256(Number(functionParameters.circleId));
      } catch (paramError: unknown) {
        console.error(
          "🚨 DIAGNOSTIC: Error adding depositCash parameters:",
          paramError
        );
        throw paramError;
      }
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

    let transaction;
    try {
      transaction = new ContractExecuteTransaction();
      transaction = transaction.setContractId(contractId);
      transaction = transaction.setGas(gas);
      transaction = transaction.setFunction(functionName, contractParams);

      if (functionName === "depositCash") {
        transaction = transaction.setPayableAmount(
          new Hbar(Number(functionParameters.amount) / 100000000)
        );
      }

      transaction = transaction.setMaxTransactionFee(new Hbar(2));
    } catch (constructionError: unknown) {
      console.error(
        "🚨 DIAGNOSTIC: Error during transaction construction:",
        constructionError
      );
      console.error(
        "🚨 DIAGNOSTIC: Construction error stack:",
        getErrorStack(constructionError)
      );
      throw new Error(
        `Transaction construction failed: ${getErrorMessage(constructionError)}`
      );
    }

    let frozenTransaction;
    try {
      if (signer) {
        const signerMethods = Object.getOwnPropertyNames(
          Object.getPrototypeOf(signer)
        );
        const signerOwnMethods = Object.getOwnPropertyNames(signer);
      }

      if (typeof transaction.freezeWithSigner !== "function") {
        throw new Error("Transaction does not have freezeWithSigner method");
      }

      // FIX: Use 'as any' to handle version mismatch between hashconnect and @hashgraph/sdk
      frozenTransaction = await transaction.freezeWithSigner(signer as any);
    } catch (freezeError: unknown) {
      console.error(
        "🚨 DIAGNOSTIC: Error during transaction freezing:",
        freezeError
      );
      console.error(
        "🚨 DIAGNOSTIC: Freeze error type:",
        freezeError?.constructor?.name
      );
      console.error(
        "🚨 DIAGNOSTIC: Freeze error message:",
        getErrorMessage(freezeError)
      );
      console.error("🚨 DIAGNOSTIC: Freeze error stack:", getErrorStack(freezeError));
      throw new Error(`Transaction freezing failed: ${getErrorMessage(freezeError)}`);
    }

    let response;
    try {
      if (typeof frozenTransaction.executeWithSigner !== "function") {
        throw new Error(
          "Frozen transaction does not have executeWithSigner method"
        );
      }

      // FIX: Use 'as any' for version compatibility
      response = await frozenTransaction.executeWithSigner(signer as any);
    } catch (executionError: unknown) {
      console.error(
        "🚨 DIAGNOSTIC: Error during transaction execution:",
        executionError
      );
      console.error(
        "🚨 DIAGNOSTIC: Execution error type:",
        executionError?.constructor?.name
      );
      console.error(
        "🚨 DIAGNOSTIC: Execution error message:",
        getErrorMessage(executionError)
      );
      console.error(
        "🚨 DIAGNOSTIC: Execution error stack:",
        getErrorStack(executionError)
      );

      const errorMsg = getErrorMessage(executionError);
      if (errorMsg.includes("body.data was not set in the protobuf")) {
        console.error("🚨 DIAGNOSTIC: FOUND THE PROTOBUF ERROR!");
        console.error(
          "🚨 DIAGNOSTIC: This error occurred during executeWithSigner()"
        );
        console.error(
          "🚨 DIAGNOSTIC: Frozen transaction state:",
          frozenTransaction
        );
      }

      if (errorMsg.includes("is not a function")) {
        console.error("🚨 DIAGNOSTIC: FOUND FUNCTION CALL ERROR!");
        console.error(
          "🚨 DIAGNOSTIC: This is likely a method invocation issue"
        );
        console.error("🚨 DIAGNOSTIC: Signer object at time of error:", signer);
        console.error(
          "🚨 DIAGNOSTIC: Frozen transaction at time of error:",
          frozenTransaction
        );
      }

      throw new Error(
        `Transaction execution failed: ${errorMsg}`
      );
    }

    let receipt: TransactionReceipt | null = null;
    try {
      if (typeof response.getReceiptWithSigner !== "function") {
        if (typeof response.getReceipt === "function") {
          // FIX: getReceipt requires a Client parameter
          // For now, we'll skip getting the receipt if we don't have a client
          receipt = null;
        } else {
          receipt = null;
        }
      } else {
        // FIX: Use 'as any' for version compatibility
        receipt = await response.getReceiptWithSigner(signer as any);
      }
    } catch (receiptError: unknown) {
      console.error("🚨 DIAGNOSTIC: Error getting receipt:", receiptError);
      console.error(
        "🚨 DIAGNOSTIC: Receipt error type:",
        receiptError?.constructor?.name
      );
      console.error(
        "🚨 DIAGNOSTIC: Receipt error message:",
        getErrorMessage(receiptError)
      );
      console.error("🚨 DIAGNOSTIC: Receipt error stack:", getErrorStack(receiptError));

      const errorMsg = getErrorMessage(receiptError);
      if (errorMsg.includes("body.data was not set in the protobuf")) {
        console.error("🚨 DIAGNOSTIC: FOUND THE PROTOBUF ERROR IN RECEIPT!");
        console.error(
          "🚨 DIAGNOSTIC: This error occurred during getReceiptWithSigner()"
        );
      }

      if (errorMsg.includes("is not a function")) {
        console.error("🚨 DIAGNOSTIC: FOUND FUNCTION CALL ERROR IN RECEIPT!");
        console.error(
          "🚨 DIAGNOSTIC: Response object at time of error:",
          response
        );
      }

      receipt = null;
    }

    return {
      success: true,
      response,
      receipt,
      transactionId: response.transactionId.toString(),
      // FIX: Type-safe access to contractFunctionResult
      contractFunctionResult: receipt ? (receipt as any).contractFunctionResult || null : null,
    };
  } catch (error: unknown) {
    console.error(
      "🚨 DIAGNOSTIC: Contract execution completely failed:",
      error
    );
    console.error("🚨 DIAGNOSTIC: Error message:", getErrorMessage(error));
    console.error("🚨 DIAGNOSTIC: Error stack:", getErrorStack(error));

    const errorMsg = getErrorMessage(error);
    
    // FIX: Remove call to undefined function
    if (
      errorMsg.includes("body.data was not set in the protobuf") ||
      errorMsg.includes("Transaction execution failed") ||
      errorMsg.includes("Transaction freezing failed")
    ) {
      // Instead of calling executeContractFunctionDirect (which doesn't exist),
      // we'll re-throw the error with more context
      throw new Error(
        `Contract execution failed: ${errorMsg}. Please try disconnecting and reconnecting your wallet.`
      );
    }

    throw error;
  }
};