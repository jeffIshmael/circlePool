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
 * Update the contract's aiAgent address
 * This function allows updating the aiAgent to match the operator account's EVM address
 * @param newAiAgentAddress - The new aiAgent address (EVM format 0x...)
 * @returns Transaction receipt
 */
export async function setAiAgent(newAiAgentAddress: string): Promise<any> {
  const {
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    Hbar,
    AccountId,
  } = await import("@hashgraph/sdk");
  
  try {
    // Normalize the address format
    let normalizedAddress = newAiAgentAddress;
    if (!normalizedAddress.startsWith('0x')) {
      if (normalizedAddress.length === 40) {
        normalizedAddress = '0x' + normalizedAddress;
      } else {
        // Try to convert from Hedera account ID
        const accountId = AccountId.fromString(normalizedAddress);
        normalizedAddress = accountId.toSolidityAddress();
        if (!normalizedAddress.startsWith('0x')) {
          normalizedAddress = '0x' + normalizedAddress;
        }
      }
    }
    
    if (normalizedAddress.length !== 42) {
      throw new Error(`Invalid address format: ${normalizedAddress} (length: ${normalizedAddress.length})`);
    }
    
    const client = await getHederaClient();
    const contractId = ContractId.fromString(CONTRACT_ID);
    
    // Verify the caller is the owner (only owner can set aiAgent)
    const operatorId = process.env.HEDERA_OPERATOR_ID as string;
    if (!operatorId) {
      throw new Error("HEDERA_OPERATOR_ID environment variable is required");
    }
    
    // Query the contract to get the owner address
    const { ContractCallQuery } = await import("@hashgraph/sdk");
    const ownerQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(300000)
      .setFunction("owner")
      .setQueryPayment(new Hbar(0.2));
    
    const ownerResult = await ownerQuery.execute(client);
    let contractOwner = ownerResult.getAddress(0);
    
    // Normalize owner address
    if (contractOwner && !contractOwner.startsWith('0x') && contractOwner.length === 40) {
      contractOwner = '0x' + contractOwner;
    }
    
    // Get operator EVM address
    const operatorAccountId = AccountId.fromString(operatorId);
    const operatorEvmAddress = operatorAccountId.toSolidityAddress();
    const normalizedOperatorEvm = operatorEvmAddress.startsWith('0x') 
      ? operatorEvmAddress 
      : '0x' + operatorEvmAddress;
    
    console.log(`📊 Operator EVM address: ${normalizedOperatorEvm}`);
    console.log(`📊 Contract owner: ${contractOwner}`);
    console.log(`📊 Setting aiAgent to: ${normalizedAddress}`);
    
    if (normalizedOperatorEvm.toLowerCase() !== contractOwner?.toLowerCase()) {
      // Check if owner is a Hedera account-derived address
      let ownerAccountId: string | null = null;
      try {
        const ownerId = AccountId.fromSolidityAddress(contractOwner);
        ownerAccountId = ownerId.toString();
      } catch (e) {
        // Owner is not a Hedera account-derived address (external EVM wallet)
      }
      
      // Provide helpful error message with instructions
      const errorMsg = ownerAccountId
        ? `Only the contract owner can set aiAgent. ` +
          `Operator EVM address (${normalizedOperatorEvm}) does not match contract owner (${contractOwner}). ` +
          `The owner is a Hedera account: ${ownerAccountId}. ` +
          `To fix this, update HEDERA_OPERATOR_ID to ${ownerAccountId} and try again.`
        : `Only the contract owner can set aiAgent. ` +
          `Operator EVM address (${normalizedOperatorEvm}) does not match contract owner (${contractOwner}). ` +
          `The owner appears to be an external EVM wallet (not a Hedera account). ` +
          `To fix this, you need to call setAiAgent from the owner wallet. ` +
          `You can: ` +
          `1. Connect the owner wallet (${contractOwner}) via WalletConnect and call setAiAgent(${normalizedAddress}), or ` +
          `2. Use HashScan's contract interaction interface to call setAiAgent with the owner wallet.`;
      
      throw new Error(errorMsg);
    }
    
    const params = new ContractFunctionParameters()
      .addAddress(normalizedAddress);
    
    const transaction = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(500000)
      .setFunction("setAiAgent", params)
      .setMaxTransactionFee(new Hbar(2));
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    console.log(`✅ Updated aiAgent to ${normalizedAddress}`);
    return receipt;
  } catch (error: any) {
    console.error("Error setting aiAgent:", error);
    throw new Error(`Failed to set aiAgent: ${error.message}`);
  }
}

/**
 * Convert a Hedera account ID (0.0.x) to EVM address (0x...) or return as-is if already EVM format
 * @param address - Hedera account ID or EVM address
 * @returns EVM address (0x... format)
 */
async function convertToEvmAddress(address: string): Promise<string> {
  // If already an EVM address (starts with 0x and is 42 chars), return as-is
  if (address.startsWith('0x') && address.length === 42) {
    return address;
  }
  
  // Otherwise, convert Hedera account ID to EVM address
  const { AccountId } = await import("@hashgraph/sdk");
  try {
    const accountId = AccountId.fromString(address);
    const evmAddress = accountId.toSolidityAddress();
    return evmAddress;
  } catch (error) {
    throw new Error(`Invalid address format: ${address}. Must be Hedera account ID (0.0.x) or EVM address (0x...)`);
  }
}

/**
 * Convert an EVM address (0x...) back to Hedera account ID (0.0.x) if possible
 * Note: This conversion is only possible if the EVM address corresponds to a Hedera account
 * @param evmAddress - EVM address (0x... format)
 * @returns Hedera account ID (0.0.x format) or original address if conversion not possible
 */
export async function convertEvmAddressToAccountId(evmAddress: string): Promise<string> {
  // If not an EVM address, return as-is
  if (!evmAddress.startsWith('0x') || evmAddress.length !== 42) {
    return evmAddress;
  }
  
  try {
    // Try to convert EVM address back to AccountId
    // This works because Hedera EVM addresses are derived from account IDs
    const { AccountId } = await import("@hashgraph/sdk");
    const accountId = AccountId.fromSolidityAddress(evmAddress);
    return accountId.toString();
  } catch (error) {
    // If conversion fails, return the original EVM address
    // This might happen if the address is not a Hedera account-derived address
    return evmAddress;
  }
}

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
    
    // Convert Hedera account ID to EVM address if needed
    const evmAddress = await convertToEvmAddress(memberAddress);
    
    const transaction = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(500000)
      .setFunction(
        "processLoan",
        new ContractFunctionParameters()
          .addAddress(evmAddress)
          .addUint256(circleId)
          .addUint256(Number(amount))
      )
      .setMaxTransactionFee(new Hbar(2));

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`✅ Loan processed for ${memberAddress} (${evmAddress}) in circle ${circleId}`);
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
    
    // Convert Hedera account IDs to EVM addresses and add to params
    for (const address of memberAddresses) {
      const evmAddress = await convertToEvmAddress(address);
      params.addAddress(evmAddress);
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
    
    // Add uint256[] as a single array parameter
    // Using addUint256Array ensures the ABI matches `uint[]` on the contract
    params.addUint256Array(circleIds);

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
 * Get circle data from the contract (including pay date)
 * @param circleId - The ID of the circle
 * @returns Circle data including pay date, round, cycle, etc.
 */
export async function getCircleFromContract(circleId: number): Promise<{
  payDate: number;
  amount: number;
  startDate: number;
  duration: number;
  round: number;
  cycle: number;
  admin: string;
  members: string[];
  loanableAmount: number;
  interestPercent: number;
  leftPercent: number;
}> {
  const {
    ContractCallQuery,
    ContractFunctionParameters,
    ContractId,
    Hbar,
  } = await import("@hashgraph/sdk");
  
  try {
    const client = await getHederaClient();
    const contractId = ContractId.fromString(CONTRACT_ID);
    
    const query = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(300000)
      .setFunction(
        "getCircle",
        new ContractFunctionParameters().addUint256(circleId)
      )
      .setQueryPayment(new Hbar(0.2));
    
    const result = await query.execute(client);
    
    // Parse getCircle return: (payDate, amount, startDate, duration, round, cycle, admin, members[], loanableAmount, interestPercent, leftPercent)
    const payDate = result.getUint256(0).toNumber();
    const amount = result.getUint256(1).toNumber();
    const startDate = result.getUint256(2).toNumber();
    const duration = result.getUint256(3).toNumber();
    const round = result.getUint256(4).toNumber();
    const cycle = result.getUint256(5).toNumber();
    const admin = result.getAddress(6)?.toString() || "";
    
    // Parse members array (dynamic array)
    const membersOffsetBytes = result.getUint256(7).toNumber();
    const membersLengthSlot = membersOffsetBytes / 32;
    const membersLength = result.getUint256(membersLengthSlot).toNumber();
    const members: string[] = [];
    
    for (let i = 0; i < membersLength; i++) {
      try {
        let address = result.getAddress(membersLengthSlot + 1 + i);
        // Normalize address format
        if (address && !address.startsWith('0x') && address.length === 40) {
          address = '0x' + address;
        }
        if (address && address.startsWith('0x') && address.length === 42) {
          members.push(address);
        }
      } catch (e) {
        break;
      }
    }
    
    const loanableAmount = result.getUint256(membersLengthSlot + 1 + membersLength).toNumber();
    const interestPercent = result.getUint256(membersLengthSlot + 2 + membersLength).toNumber();
    const leftPercent = result.getUint256(membersLengthSlot + 3 + membersLength).toNumber();
    
    return {
      payDate,
      amount,
      startDate,
      duration,
      round,
      cycle,
      admin,
      members,
      loanableAmount,
      interestPercent,
      leftPercent,
    };
  } catch (error: any) {
    console.error("Error getting circle from contract:", error);
    throw new Error(`Failed to get circle from contract: ${error.message}`);
  }
}

/**
 * Get on-chain members for a circle from the contract
 * @param circleId - The ID of the circle
 * @returns Array of member EVM addresses
 */
export async function getOnChainMembers(circleId: number): Promise<string[]> {
  const {
    ContractCallQuery,
    ContractFunctionParameters,
    ContractId,
    Hbar,
  } = await import("@hashgraph/sdk");
  
  try {
    const client = await getHederaClient();
    const contractId = ContractId.fromString(CONTRACT_ID);
    
    // Use getEachMemberBalance which returns (address[] memory, uint[][] memory)
    // This is simpler - we iterate through addresses starting from index 0
    // until we hit an error (which means we've reached the balances array)
    const query = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(300000)
      .setFunction(
        "getEachMemberBalance",
        new ContractFunctionParameters().addUint256(circleId)
      )
      .setQueryPayment(new Hbar(0.2));
    
    const result = await query.execute(client);
    
    // Parse getEachMemberBalance result structure:
    // Return value 0: address[] memberAddresses (dynamic array starts at index 0)
    // Return value 1: uint[][] balances (starts after addresses array)
    // For Hedera SDK, dynamic arrays in tuples are accessed sequentially
    
    const members: string[] = [];
    try {
      // Iterate through addresses starting from index 0
      // Stop when we can't get an address or hit an error (which means we've reached the balances array)
      let index = 0;
      let maxIterations = 20; // Safety limit (max 15 members per circle)
      let consecutiveErrors = 0;
      
      // For dynamic arrays in Solidity ABI encoding (tuple with dynamic arrays):
      // - Index 0: offset to first dynamic array in bytes (addresses) - typically 0x40 (64)
      // - Index 1: offset to second dynamic array in bytes (balances) - typically 0x80 (128)
      // - At offset/32 slot: array length (uint256)
      // - After length: array elements
      
      try {
        // Get the offset to the addresses array (index 0) - this is in bytes
        const addressesOffsetBytes = result.getUint256(0).toNumber();
        console.log(`📊 Addresses array offset: ${addressesOffsetBytes} bytes (0x${addressesOffsetBytes.toString(16)})`);
        
        // Convert byte offset to slot index (each slot is 32 bytes)
        const addressesLengthSlot = addressesOffsetBytes / 32;
        console.log(`📊 Array length is at slot: ${addressesLengthSlot}`);
        
        // At the offset slot, get the array length
        const arrayLength = result.getUint256(addressesLengthSlot).toNumber();
        console.log(`📊 Addresses array length: ${arrayLength}`);
        
        if (arrayLength > 0 && arrayLength <= 15) {
          // Calculate starting index for addresses (length slot + 1)
          const addressesStartIndex = addressesLengthSlot + 1;
          console.log(`📊 Reading ${arrayLength} addresses starting from slot ${addressesStartIndex}`);
          
          for (let i = 0; i < arrayLength; i++) {
            try {
              let address = result.getAddress(addressesStartIndex + i);
              
              // Hedera SDK might return addresses without 0x prefix
              // Normalize: add 0x prefix if missing (address should be 40 chars without prefix)
              let normalizedAddress = address;
              if (address && !address.startsWith('0x')) {
                if (address.length === 40) {
                  normalizedAddress = '0x' + address;
                } else {
                  console.warn(`⚠️  Unexpected address length at slot ${addressesStartIndex + i}: ${address.length} (expected 40 without 0x or 42 with 0x)`);
                }
              }
              
              // Validate normalized address
              if (normalizedAddress && 
                  normalizedAddress !== "0x0000000000000000000000000000000000000000" &&
                  normalizedAddress.startsWith('0x') && 
                  normalizedAddress.length === 42) {
                members.push(normalizedAddress);
                console.log(`✅ Added address at slot ${addressesStartIndex + i}: ${normalizedAddress}`);
              } else {
                console.warn(`⚠️  Invalid address at slot ${addressesStartIndex + i}: ${address} -> normalized: ${normalizedAddress} (length: ${normalizedAddress?.length})`);
              }
            } catch (e: any) {
              console.error(`❌ Error getting address at slot ${addressesStartIndex + i}:`, e.message);
              break;
            }
          }
        } else {
          console.warn(`⚠️  Invalid array length: ${arrayLength}`);
        }
      } catch (offsetError: any) {
        // If offset-based parsing fails, try simpler approach: iterate from index 0
        console.log(`📊 Offset-based parsing failed, trying iterative approach: ${offsetError.message}`);
        
        // Try to iterate through addresses directly
        // For tuples with dynamic arrays, sometimes the SDK handles it differently
        while (index < maxIterations) {
          try {
            const address = result.getAddress(index);
            
            // Normalize address format (add 0x prefix if missing)
            let normalizedAddress = address;
            if (address && !address.startsWith('0x') && address.length === 40) {
              normalizedAddress = '0x' + address;
            }
            
            // Check if it's a valid address (not zero address and proper format)
            if (normalizedAddress && 
                normalizedAddress !== "0x0000000000000000000000000000000000000000" &&
                normalizedAddress.startsWith('0x') && 
                normalizedAddress.length === 42) {
              members.push(normalizedAddress);
              console.log(`✅ Added valid address at index ${index}: ${normalizedAddress}`);
              consecutiveErrors = 0;
              index++;
            } else {
              // If we already have members and get an invalid address, we've reached the end
              if (members.length > 0) {
                console.log(`📊 Stopped parsing at index ${index} (got invalid address, but already have ${members.length} member(s))`);
                break;
              }
              // If we get 2 consecutive invalid addresses from the start, stop
              consecutiveErrors++;
              if (consecutiveErrors >= 2) {
                console.log(`📊 Stopped parsing at index ${index} (got 2 consecutive invalid addresses)`);
                break;
              }
              index++;
            }
          } catch (e: any) {
            // If we already have members and get an error, we've reached the end
            if (members.length > 0) {
              console.log(`📊 Stopped parsing at index ${index} (reached end, have ${members.length} member(s))`);
              break;
            }
            consecutiveErrors++;
            if (consecutiveErrors >= 2) {
              console.log(`📊 Stopped parsing at index ${index} (got 2 consecutive errors)`);
              break;
            }
            index++;
          }
        }
      }
      
      // Filter out any invalid addresses and normalize format
      const validMembers = members
        .map(addr => {
          // Ensure 0x prefix
          if (addr && !addr.startsWith('0x') && addr.length === 40) {
            return '0x' + addr;
          }
          return addr;
        })
        .filter(addr => 
          addr && 
          addr.startsWith('0x') && 
          addr.length === 42 &&
          addr !== "0x0000000000000000000000000000000000000000"
        );
      
      if (validMembers.length > 0) {
        console.log(`✅ Retrieved ${validMembers.length} on-chain members for circle ${circleId}`);
        console.log(`On-chain member addresses:`, validMembers);
        return validMembers;
      }
      
      // If no valid members found, log warning
      console.warn(`⚠️  No valid members found for circle ${circleId} - might be a new circle with only admin`);
      console.warn(`   Raw addresses found: ${members.length}, valid: ${validMembers.length}`);
      
      return [];
      
    } catch (parseError: any) {
      console.error("Error parsing on-chain members:", parseError);
      throw new Error(`Failed to parse on-chain members: ${parseError.message}`);
    }
    
  } catch (error: any) {
    console.error("Error getting on-chain members:", error);
    throw new Error(`Failed to get on-chain members: ${error.message}`);
  }
}

/**
 * Set the payout order for a circle (replaces existing order)
 * @param circleId - The ID of the circle
 * @param payoutOrder - Array of member addresses in the desired payout order (must match on-chain members exactly)
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
    AccountId,
  } = await import("@hashgraph/sdk");
  
  // Declare validAddresses outside try block for error handling
  let validAddresses: string[] = [];
  
  try {
    if (!payoutOrder || payoutOrder.length === 0) {
      throw new Error("Payout order array cannot be empty");
    }
    
    // Verify the operator account's EVM address matches the contract's aiAgent
    const client = await getHederaClient();
    const operatorId = process.env.HEDERA_OPERATOR_ID as string;
    if (!operatorId) {
      throw new Error("HEDERA_OPERATOR_ID environment variable is required");
    }
    
    // Get the EVM address of the operator account
    const operatorAccountId = AccountId.fromString(operatorId);
    const operatorEvmAddress = operatorAccountId.toSolidityAddress();
    
    // Query the contract to get the aiAgent address
    const contractId = ContractId.fromString(CONTRACT_ID);
    const { ContractCallQuery } = await import("@hashgraph/sdk");
    const aiAgentQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(300000)
      .setFunction("aiAgent")
      .setQueryPayment(new Hbar(0.2));
    
    const aiAgentResult = await aiAgentQuery.execute(client);
    let contractAiAgent = aiAgentResult.getAddress(0);
    
    // Normalize address format (add 0x prefix if missing)
    if (contractAiAgent && !contractAiAgent.startsWith('0x') && contractAiAgent.length === 40) {
      contractAiAgent = '0x' + contractAiAgent;
    }
    
    console.log(`📊 Operator account: ${operatorId}`);
    console.log(`📊 Operator EVM address: ${operatorEvmAddress}`);
    console.log(`📊 Contract aiAgent: ${contractAiAgent}`);
    
    // Normalize addresses for comparison (ensure both have 0x prefix)
    const normalizedOperatorEvm = operatorEvmAddress.startsWith('0x') 
      ? operatorEvmAddress 
      : '0x' + operatorEvmAddress;
    const normalizedContractAiAgent = contractAiAgent.startsWith('0x')
      ? contractAiAgent
      : '0x' + contractAiAgent;
    
    if (normalizedOperatorEvm.toLowerCase() !== normalizedContractAiAgent.toLowerCase()) {
      throw new Error(
        `AI Agent mismatch: Operator EVM address (${normalizedOperatorEvm}) does not match contract aiAgent (${normalizedContractAiAgent}). ` +
        `The contract's aiAgent must be set to the EVM address of the operator account (${normalizedOperatorEvm}). ` +
        `Update the contract's aiAgent using the setAiAgent function.`
      );
    }
    
    // Verify on-chain members count using getEachMemberBalance (more reliable than getCircle)
    // Query getEachMemberBalance to get the actual members array length
    const balanceQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(300000)
      .setFunction(
        "getEachMemberBalance",
        new ContractFunctionParameters().addUint256(circleId)
      )
      .setQueryPayment(new Hbar(0.2));
    
    const balanceResult = await balanceQuery.execute(client);
    const balanceAddressesOffsetBytes = balanceResult.getUint256(0).toNumber();
    const balanceAddressesLengthSlot = balanceAddressesOffsetBytes / 32;
    const actualMembersCount = balanceResult.getUint256(balanceAddressesLengthSlot).toNumber();
    
    console.log(`📊 On-chain members count (from getEachMemberBalance): ${actualMembersCount}, Payout order length: ${payoutOrder.length}`);
    
    if (payoutOrder.length !== actualMembersCount) {
      throw new Error(
        `Payout order length (${payoutOrder.length}) does not match on-chain members count (${actualMembersCount}). ` +
        `The contract requires exact match. Please ensure the payout order includes all ${actualMembersCount} on-chain members.`
      );
    }

    // Filter out invalid addresses (defensive programming)
    validAddresses = payoutOrder.filter(
      (address): address is string =>
        address !== null &&
        address !== undefined &&
        typeof address === 'string' &&
        address.trim() !== ''
    );

    if (validAddresses.length === 0) {
      throw new Error("No valid addresses in payout order array");
    }

    if (validAddresses.length !== payoutOrder.length) {
      console.warn(
        `Filtered out ${payoutOrder.length - validAddresses.length} invalid addresses from payout order`
      );
    }

    // Log the payout order details for debugging
    console.log(`Setting payout order for circle ${circleId} with ${validAddresses.length} addresses`);
    console.log(`Note: Contract requires payout order length to match on-chain members count exactly`);
    console.log(`If this fails with "CONTRACT_REVERT_EXECUTED", it likely means the payout order length (${validAddresses.length}) doesn't match on-chain members count.`);
    console.log(`Addresses being set:`, validAddresses.map(addr => addr.substring(0, 10) + '...'));
    
    const params = new ContractFunctionParameters().addUint256(circleId);
    
    // Convert Hedera account IDs (0.0.x) to EVM addresses (0x...) and add as array
    console.log(`📋 Converting addresses to EVM format for contract call:`);
    console.log(`📋 Total addresses to add: ${validAddresses.length}`);
    const evmAddresses: string[] = [];
    for (let i = 0; i < validAddresses.length; i++) {
      const address = validAddresses[i];
      const evmAddress = await convertToEvmAddress(address);
      console.log(`  - [${i}] Input: ${address} -> EVM: ${evmAddress} (length: ${evmAddress.length})`);
      evmAddresses.push(evmAddress);
    }
    
    // Use addAddressArray to add the addresses as an array (not individual parameters)
    params.addAddressArray(evmAddresses);
    console.log(`📋 Finished adding ${evmAddresses.length} addresses as array to params`);

    console.log(`📋 Params:`, params);
    

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
    
    // Provide a more helpful error message for contract revert
    if (error.message && (
      error.message.includes("CONTRACT_REVERT_EXECUTED") || 
      error.message.includes("Payout order length mismatch")
    )) {
      const addressCount = validAddresses.length > 0 ? validAddresses.length : payoutOrder.length;
      throw new Error(
        `Failed to set payout order: The payout order length (${addressCount}) does not match the on-chain members count. ` +
        `The contract requires exact match. ` +
        `Possible causes: ` +
        `1. Database has different member count than on-chain ` +
        `2. Some members were added directly on-chain but not in database ` +
        `3. Some members were removed from database but still exist on-chain. ` +
        `Solution: Ensure database member count matches on-chain exactly before starting the circle.`
      );
    }
    
    throw new Error(`Failed to set payout order: ${error.message}`);
  }
}
