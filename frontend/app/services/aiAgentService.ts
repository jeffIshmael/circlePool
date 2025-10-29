/**
 * @title AI Agent Service
 * @author Jeff Muchiri
 * 
 * Server-side service for executing AI agent functions on the CirclePool contract.
 * These functions require the AI agent role (onlyAiAgent modifier).
 * 
 * IMPORTANT: This service uses the server's Hedera StableAccount credentials
 * (HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY). Ensure the operator account
 * is set as the AI agent on the contract before using these functions.
 */

import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar,
  TransactionResponse,
  TransactionReceipt,
} from "@hashgraph/sdk";
import { getHederaClient } from "@/app/lib/hederaClient";
import { CONTRACT_ID } from "@/app/lib/constants";

const client = getHederaClient();
const contractId = ContractId.fromString(CONTRACT_ID);

/**
 * Process a loan for a member in a circle
 * @param memberAddress - The address of the member receiving the loan
 * @param circleId - The ID of the circle
 * @param amount - The loan amount in tinybars
 * @returns Transaction receipt
 */
export async function processLoan(
  memberAddress: string,
  circleId: number,
  amount: bigint | number
): Promise<TransactionReceipt> {
  try {
    const transaction = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(500000)
      .setFunction(
        "processLoan",
        new ContractFunctionParameters()
          .addAddress(memberAddress)
          .addUint256(circleId)
          .addUint256(Number(amount))
      )
      .setMaxTransactionFee(new Hbar(2));

    const response: TransactionResponse = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`✅ Loan processed for ${memberAddress} in circle ${circleId}`);
    return receipt;
  } catch (error: any) {
    console.error("Error processing loan:", error);
    throw new Error(`Failed to process loan: ${error.message}`);
  }
}

/**
 * Add members to the payout order for a circle
 * @param circleId - The ID of the circle
 * @param memberAddresses - Array of member addresses to add to payout order
 * @returns Transaction receipt
 */
export async function addMemberToPayoutOrder(
  circleId: number,
  memberAddresses: string[]
): Promise<TransactionReceipt> {
  try {
    if (!memberAddresses || memberAddresses.length === 0) {
      throw new Error("Member addresses array cannot be empty");
    }

    const params = new ContractFunctionParameters()
      .addUint256(circleId);
    
    // Add address array - Hedera SDK ContractFunctionParameters supports arrays
    // Try using addAddressArray if available, otherwise add individually
    // Note: Solidity array parameters need proper ABI encoding
    // For address arrays, we'll add them sequentially which the SDK should handle
    for (const address of memberAddresses) {
      params.addAddress(address);
    }

    const transaction = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(500000)
      .setFunction("addMemberToPayoutOrder", params)
      .setMaxTransactionFee(new Hbar(2));

    const response: TransactionResponse = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(
      `✅ Added ${memberAddresses.length} members to payout order for circle ${circleId}`
    );
    return receipt;
  } catch (error: any) {
    console.error("Error adding members to payout order:", error);
    throw new Error(
      `Failed to add members to payout order: ${error.message}`
    );
  }
}

/**
 * Check pay dates for multiple circles and process payouts/refunds
 * @param circleIds - Array of circle IDs to check
 * @returns Transaction receipt
 */
export async function checkPayDate(
  circleIds: number[]
): Promise<TransactionReceipt> {
  try {
    if (!circleIds || circleIds.length === 0) {
      throw new Error("Circle IDs array cannot be empty");
    }

    const params = new ContractFunctionParameters();
    
    // Add uint array - Hedera SDK requires adding uints individually
    for (const id of circleIds) {
      params.addUint256(id);
    }

    const transaction = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000) // Higher gas for multiple circles
      .setFunction("checkPayDate", params)
      .setMaxTransactionFee(new Hbar(5));

    const response: TransactionResponse = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`✅ Checked pay dates for ${circleIds.length} circles`);
    return receipt;
  } catch (error: any) {
    console.error("Error checking pay dates:", error);
    throw new Error(`Failed to check pay dates: ${error.message}`);
  }
}

/**
 * Set the payout order for a circle (replaces existing order)
 * @param circleId - The ID of the circle
 * @param payoutOrder - Array of member addresses in the desired payout order
 * @returns Transaction receipt
 */
export async function setPayoutOrder(
  circleId: number,
  payoutOrder: string[]
): Promise<TransactionReceipt> {
  try {
    if (!payoutOrder || payoutOrder.length === 0) {
      throw new Error("Payout order array cannot be empty");
    }

    const params = new ContractFunctionParameters().addUint256(circleId);
    
    // Add address array
    for (const address of payoutOrder) {
      params.addAddress(address);
    }

    const transaction = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(500000)
      .setFunction("setPayoutOrder", params)
      .setMaxTransactionFee(new Hbar(2));

    const response: TransactionResponse = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`✅ Set payout order for circle ${circleId}`);
    return receipt;
  } catch (error: any) {
    console.error("Error setting payout order:", error);
    throw new Error(`Failed to set payout order: ${error.message}`);
  }
}

