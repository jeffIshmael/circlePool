/**
 * @title Agent Service
 * 
 * 
 * Server-side service for executing AI agent functions on the CirclePool contract.
 * These functions require the AI agent role (onlyAiAgent modifier).
 * 
 * IMPORTANT: This service uses the server's Hedera StableAccount credentials
 * (HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY). Ensure the operator account
 * is set as the AI agent on the contract before using these functions.
 */

import { getHederaClient } from "@/app/lib/hederaClient";
import { CONTRACT_ID } from "@/app/lib/constants";

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
) {
  // Lazy load SDK modules
  const {
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    Hbar,
  } = await import("@hashgraph/sdk");
  
  try {
    const client = await getHederaClient();
    const contractId = ContractId.fromString(CONTRACT_ID);
    
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

    const response = await transaction.execute(client);
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
) {
  // Lazy load SDK modules
  const {
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    Hbar,
  } = await import("@hashgraph/sdk");
  
  try {
    if (!memberAddresses || memberAddresses.length === 0) {
      throw new Error("Member addresses array cannot be empty");
    }

    const client = await getHederaClient();
    const contractId = ContractId.fromString(CONTRACT_ID);
    
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

    const response = await transaction.execute(client);
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

export interface DisbursementResult {
  circleId: number;
  recipient: string;
  amount: bigint;
  timestamp: Date;
  type: "disbursement";
}

export interface RefundResult {
  circleId: number;
  member: string;
  amount: bigint;
  timestamp: Date;
  type: "refund";
}

export interface PayDateCheckResult {
  circleId: number;
  wasDisbursed: boolean;
  disbursements?: DisbursementResult[];
  refunds?: RefundResult[];
  transactionId: string;
  timestamp: Date;
}

/**
 * Query contract payments to find new payments after a transaction
 */
async function getNewPayments(
  client: any,
  contractId: any,
  beforeTransactionTimestamp: number
): Promise<Array<{
  id: number;
  circleId: number;
  receiver: string;
  amount: bigint;
  timestamp: number;
}>> {
  const { ContractCallQuery, ContractFunctionParameters, Hbar } = await import("@hashgraph/sdk");
  
  const query = new ContractCallQuery()
    .setContractId(contractId)
    .setGas(200000)
    .setFunction("getPayments", new ContractFunctionParameters())
    .setQueryPayment(new Hbar(0.1));

  const result = await query.execute(client);
  
  const payments: Array<{
    id: number;
    circleId: number;
    receiver: string;
    amount: bigint;
    timestamp: number;
  }> = [];

  try {
    // Parse dynamic array of Payment structs (same as payments API)
    let index = 0;
    while (true) {
      try {
        const id = result.getUint256(index).toNumber();
        const circleId = result.getUint256(index + 1).toNumber();
        const receiver = result.getAddress(index + 2)?.toString() || "";
        const amount = BigInt(result.getUint256(index + 3).toString());
        const timestamp = result.getUint256(index + 4).toNumber();
        
        // Only return payments that happened after our transaction
        if (timestamp > beforeTransactionTimestamp) {
          payments.push({
            id,
            circleId,
            receiver,
            amount,
            timestamp,
          });
        }
        
        index += 5; // Move to next payment struct
      } catch (e) {
        break; // End of array
      }
    }
  } catch (parseError) {
    console.error("Error parsing payments:", parseError);
  }
  
  return payments;
}

/**
 * Check pay dates for multiple circles and process payouts/refunds
 * @param circleIds - Array of circle IDs to check
 * @returns Array of results with disbursement/refund details
 */
export async function checkPayDate(
  circleIds: number[]
): Promise<PayDateCheckResult[]> {
  // Lazy load SDK modules
  const {
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    Hbar,
  } = await import("@hashgraph/sdk");
  
  try {
    if (!circleIds || circleIds.length === 0) {
      throw new Error("Circle IDs array cannot be empty");
    }

    const client = await getHederaClient();
    const contractId = ContractId.fromString(CONTRACT_ID);
    
    // Get timestamp before transaction to identify new payments
    const beforeTimestamp = Math.floor(Date.now() / 1000) - 60; // 1 minute buffer
    
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

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    // Get transaction record for timestamp
    const record = await response.getRecord(client);
    const timestamp = record.consensusTimestamp?.toDate() || new Date();
    const txId = response.transactionId.toString();
    
    // Wait a moment for transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Query contract for new payments to determine what happened
    const newPayments = await getNewPayments(client, contractId, beforeTimestamp);
    
    // Group payments by circleId and determine if disbursement or refund
    const results: PayDateCheckResult[] = [];
    const paymentsByCircle = new Map<number, typeof newPayments>();
    
    for (const payment of newPayments) {
      if (!paymentsByCircle.has(payment.circleId)) {
        paymentsByCircle.set(payment.circleId, []);
      }
      paymentsByCircle.get(payment.circleId)!.push(payment);
    }
    
    // Create results for each circle
    for (const circleId of circleIds) {
      const payments = paymentsByCircle.get(circleId) || [];
      
      // If we got payments, it was either disbursement or refund
      // Disbursement: 1 payment with large amount (total pool = amount * members.length)
      // Refund: multiple payments (one per member with their individual balances)
      const disbursements: DisbursementResult[] = [];
      const refunds: RefundResult[] = [];
      
      if (payments.length > 0) {
        // Heuristic: 
        // - 1 payment = likely disbursement (single recipient gets pool)
        // - Multiple payments = likely refunds (each member gets their balance back)
        
        if (payments.length === 1) {
          // Single payment = disbursement
          const payment = payments[0];
          disbursements.push({
            circleId,
            recipient: payment.receiver,
            amount: payment.amount,
            timestamp: new Date(payment.timestamp * 1000),
            type: "disbursement",
          });
        } else {
          // Multiple payments = refunds (one per member)
          for (const payment of payments) {
            refunds.push({
              circleId,
              member: payment.receiver,
              amount: payment.amount,
              timestamp: new Date(payment.timestamp * 1000),
              type: "refund",
            });
          }
        }
      }
      
      results.push({
        circleId,
        wasDisbursed: disbursements.length > 0,
        disbursements: disbursements.length > 0 ? disbursements : undefined,
        refunds: refunds.length > 0 ? refunds : undefined,
        transactionId: txId,
        timestamp,
      });
    }

    console.log(`✅ Checked pay dates for ${circleIds.length} circles`);
    return results;
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
) {
  // Lazy load SDK modules
  const {
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    Hbar,
  } = await import("@hashgraph/sdk");
  
  try {
    if (!payoutOrder || payoutOrder.length === 0) {
      throw new Error("Payout order array cannot be empty");
    }

    const client = await getHederaClient();
    const contractId = ContractId.fromString(CONTRACT_ID);
    
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

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`✅ Set payout order for circle ${circleId}`);
    return receipt;
  } catch (error: any) {
    console.error("Error setting payout order:", error);
    throw new Error(`Failed to set payout order: ${error.message}`);
  }
}
