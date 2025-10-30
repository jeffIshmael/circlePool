// @ts-nocheck
"use client";

import { HashConnect } from "hashconnect";
import {
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  LedgerId,
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
  "bfa190dbe93fcf30377b932b31129d05", // Use a unique project ID
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

  const result = await instance.signTransaction(
    AccountId.fromString(accountIdForSigning) as any,
    transaction
  );
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

  const result = await instance.sendTransaction(
    AccountId.fromString(accountIdForSigning) as any,
    transaction
  );
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

  const result = await instance.signMessages(
    AccountId.fromString(accountIdForSigning) as any,
    message
  );
  return result;
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
    // Try different approaches to get the signer
    let signer;


    if (typeof instance.getSigner === "function") {
      try {

        signer = instance.getSigner(accountIdForSigning);
       
      } catch (err) {
        console.error("🚨 DIAGNOSTIC: Direct getSigner failed:", err);
        console.error(
          "🚨 DIAGNOSTIC: getSigner error type:",
          err?.constructor?.name
        );
        console.error("🚨 DIAGNOSTIC: getSigner error message:", err?.message);
      }
    } else {
      console.log(
        "🔍 DIAGNOSTIC: getSigner method not available or not a function"
      );
    }

    // Approach 2: Try with provider if direct signer failed
    if (!signer) {
      try {

        // Try to find topic from various possible locations
        const possibleTopics = [
          instance.hcData?.topic,
          instance.topic,
          instance.connectionData?.topic,
          Object.keys(instance.connectedAccountIds || {})[0],
        ];

        const topic = possibleTopics.find((t) => t && typeof t === "string");

        if (topic) {
          if (typeof instance.getProvider === "function") {
            const provider = instance.getProvider(
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
      } catch (err) {
        console.error("🚨 DIAGNOSTIC: Provider approach failed:", err);
        console.error(
          "🚨 DIAGNOSTIC: Provider error type:",
          err?.constructor?.name
        );
        console.error("🚨 DIAGNOSTIC: Provider error message:", err?.message);
      }
    }

    if (!signer) {
      throw new Error(
        "Could not create signer. Please disconnect and reconnect your wallet."
      );
    }

    // Build the contract parameters based on function name
    let contractParams = new ContractFunctionParameters();

    // console.log('🔍 DIAGNOSTIC: Function parameters received:', JSON.stringify(functionParameters, null, 2));

    if (functionName === "registerCircle") {
      try {
        contractParams
          .addUint256(Number(functionParameters.amount))
          .addUint256(Number(functionParameters.durationDays))
          .addUint256(Number(functionParameters.startDate))
          .addUint256(Number(functionParameters.maxMembers))
          .addUint256(Number(functionParameters.interestPercent))
          .addUint256(Number(functionParameters.leftPercent));
      } catch (paramError) {
        console.error(
          "🚨 DIAGNOSTIC: Error adding registerCircle parameters:",
          paramError
        );
        throw paramError;
      }
    } else if (functionName === "depositCash") {
      try {
        // depositCash(uint _circleId) - only takes circleId as parameter
        // The amount is sent via msg.value (setPayableAmount)
        contractParams.addUint256(Number(functionParameters.circleId));
      } catch (paramError) {
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
      // Create the transaction step by step to ensure proper construction
      transaction = new ContractExecuteTransaction();
      transaction = transaction.setContractId(contractId);
      transaction = transaction.setGas(gas);
      transaction = transaction.setFunction(functionName, contractParams);

      // Adding payable amount for depositCash function
      if (functionName === "depositCash") {
        transaction = transaction.setPayableAmount(
          new Hbar(Number(functionParameters.amount) / 100000000)
        );
      }

      transaction = transaction.setMaxTransactionFee(new Hbar(2));
    } catch (constructionError) {
      console.error(
        "🚨 DIAGNOSTIC: Error during transaction construction:",
        constructionError
      );
      console.error(
        "🚨 DIAGNOSTIC: Construction error stack:",
        constructionError.stack
      );
      throw new Error(
        `Transaction construction failed: ${constructionError.message}`
      );
    }

    let frozenTransaction;
    try {
      // Check if signer has the methods we need
      if (signer) {
        const signerMethods = Object.getOwnPropertyNames(
          Object.getPrototypeOf(signer)
        );

        // Also check for methods directly on the object
        const signerOwnMethods = Object.getOwnPropertyNames(signer);
      }

      // Check if the transaction has freezeWithSigner method
      if (typeof transaction.freezeWithSigner !== "function") {
        throw new Error("Transaction does not have freezeWithSigner method");
      }

      // Freeze the transaction with signer
      frozenTransaction = await transaction.freezeWithSigner(signer);
    } catch (freezeError) {
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
        freezeError?.message
      );
      console.error("🚨 DIAGNOSTIC: Freeze error stack:", freezeError?.stack);
      throw new Error(`Transaction freezing failed: ${freezeError.message}`);
    }

    let response;
    try {
      // Check if frozen transaction has executeWithSigner method

      if (typeof frozenTransaction.executeWithSigner !== "function") {
        throw new Error(
          "Frozen transaction does not have executeWithSigner method"
        );
      }

      // Execute with signer (this will prompt wallet for signature)
      response = await frozenTransaction.executeWithSigner(signer);
    } catch (executionError) {
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
        executionError?.message
      );
      console.error(
        "🚨 DIAGNOSTIC: Execution error stack:",
        executionError?.stack
      );

      // Check for specific error patterns
      if (
        executionError.message.includes("body.data was not set in the protobuf")
      ) {
        console.error("🚨 DIAGNOSTIC: FOUND THE PROTOBUF ERROR!");
        console.error(
          "🚨 DIAGNOSTIC: This error occurred during executeWithSigner()"
        );
        console.error(
          "🚨 DIAGNOSTIC: Frozen transaction state:",
          frozenTransaction
        );
      }

      if (executionError.message.includes("is not a function")) {
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
        `Transaction execution failed: ${executionError.message}`
      );
    }

    let receipt;
    try {

      // Check if response has getReceiptWithSigner method

      if (typeof response.getReceiptWithSigner !== "function") {

        if (typeof response.getReceipt === "function") {
          receipt = await response.getReceipt();
        } else {
          receipt = null;
        }
      } else {
        // Get receipt with signer
        receipt = await response.getReceiptWithSigner(signer);
      }

    } catch (receiptError) {
      console.error("🚨 DIAGNOSTIC: Error getting receipt:", receiptError);
      console.error(
        "🚨 DIAGNOSTIC: Receipt error type:",
        receiptError?.constructor?.name
      );
      console.error(
        "🚨 DIAGNOSTIC: Receipt error message:",
        receiptError?.message
      );
      console.error("🚨 DIAGNOSTIC: Receipt error stack:", receiptError?.stack);

      // Check for specific error patterns
      if (
        receiptError.message.includes("body.data was not set in the protobuf")
      ) {
        console.error("🚨 DIAGNOSTIC: FOUND THE PROTOBUF ERROR IN RECEIPT!");
        console.error(
          "🚨 DIAGNOSTIC: This error occurred during getReceiptWithSigner()"
        );
      }

      if (receiptError.message.includes("is not a function")) {
        console.error("🚨 DIAGNOSTIC: FOUND FUNCTION CALL ERROR IN RECEIPT!");
        console.error(
          "🚨 DIAGNOSTIC: Response object at time of error:",
          response
        );
      }

      // Don't throw error for receipt issues - we can still return the response
      receipt = null;
    }

    return {
      success: true,
      response,
      receipt,
      transactionId: response.transactionId.toString(),
      contractFunctionResult: receipt?.contractFunctionResult || null,
    };
  } catch (error) {
    console.error(
      "🚨 DIAGNOSTIC: Contract execution completely failed:",
      error
    );
    console.error("🚨 DIAGNOSTIC: Error message:", error.message);
    console.error("🚨 DIAGNOSTIC: Error stack:", error.stack);

    // If signer pattern failed, try the direct sendTransaction approach
    if (
      error.message.includes("body.data was not set in the protobuf") ||
      error.message.includes("Transaction execution failed") ||
      error.message.includes("Transaction freezing failed")
    ) {
      return await executeContractFunctionDirect(
        accountIdForSigning,
        contractId,
        functionName,
        functionParameters,
        gas
      );
    }

    throw error;
  }
};

