// this file contains the cron job functions which are
// checking the startdate of circle and setting it as started if the time has passed
// checking the paydate of circle and disbursing the funds if the time has passed

import { getRandomOrder } from "./helperFunctions";
import {
  getCircles,
  setCircleAsStartedAndSetPayoutOrder,
  updateDisbursementContext,
  updateRefundContext,
} from "./prismafunctions";
import { setPayoutOrder, checkPayDate, getOnChainMembers, getCircleFromContract } from "../services/aiAgentService";

interface PayoutOrder {
  userAddress: string; // Hedera account ID (0.0.x) for DB consistency
  evmAddress?: string; // EVM address (0x...) for on-chain joins
  payDate: Date;
  paid: boolean;
}

// function to check startdate and set it as started if the time has passed
export const checkStartdate = async () => {
  try {
  const circles = await getCircles();
  for (const circle of circles) {
    if (!circle.started && circle.startDate < new Date()) {
      // set as started and set the payout order
        // IMPORTANT: Use on-chain members to ensure exact match with contract
        // The contract requires payout order length to exactly match on-chain members count
        let onChainMemberAddresses: string[] = [];
        
        try {
          // Query on-chain members directly from the contract
          onChainMemberAddresses = await getOnChainMembers(Number(circle.blockchainId));
          
          if (onChainMemberAddresses.length === 0) {
            console.warn(`Circle ${circle.id} (blockchainId: ${circle.blockchainId}) has no on-chain members, skipping...`);
            continue;
          }
          
          console.log(`✅ Circle ${circle.id} (blockchainId: ${circle.blockchainId}) has ${onChainMemberAddresses.length} on-chain members`);
          console.log(`Database has ${circle.members.length} members`);
          
          if (onChainMemberAddresses.length !== circle.members.length) {
            console.warn(`⚠️  Mismatch: On-chain has ${onChainMemberAddresses.length} members, database has ${circle.members.length} members`);
          }
          
          // Note: Allowing circles with 1 member (admin) to start
          // This allows the circle to be set up even if only the creator has joined
          if (onChainMemberAddresses.length < 1) {
            console.warn(`⚠️  Circle ${circle.id} has no members on-chain. Cannot start circle.`);
            continue; // Skip this circle
          }
          
        } catch (error: any) {
          console.error(`❌ Failed to get on-chain members for circle ${circle.id} (blockchainId: ${circle.blockchainId}):`, error);
          // Fallback to database members if we can't query on-chain
          console.warn(`Falling back to database members for circle ${circle.id}`);
          
          const memberAddresses: string[] = [];
          for (const member of circle.members) {
            const address = member.user?.address;
            if (!address || typeof address !== 'string' || address.trim() === '') {
              console.error(`Circle ${circle.id} has member ${member.id} without valid address. Skipping circle start.`);
              throw new Error(`Circle ${circle.id} cannot start: member ${member.id} (userId: ${member.userId}) is missing a valid address. All members must have addresses before starting.`);
            }
            memberAddresses.push(address);
          }
          
          if (memberAddresses.length === 0) {
            console.warn(`Circle ${circle.id} has no members, skipping...`);
            continue;
          }
          
          onChainMemberAddresses = memberAddresses;
        }
        
        // Shuffle the on-chain member addresses for payout order
        // Note: onChainMemberAddresses are already in EVM format (0x...)
        const payoutOrderAddresses = getRandomOrder(onChainMemberAddresses);
        console.log(`Payout order addresses: ${payoutOrderAddresses}`);
        
        console.log(`📋 Setting payout order for circle ${circle.id} (blockchainId: ${circle.blockchainId})`);
        console.log(`   - On-chain member count: ${onChainMemberAddresses.length}`);
        console.log(`   - Payout order addresses: ${payoutOrderAddresses.length} (EVm format)`);
        console.log(`   - First 3 addresses:`, payoutOrderAddresses.slice(0, 3).map(addr => addr.substring(0, 12) + '...'+ addr.substring(addr.length - 4)));
        
        // set the payout order onchain
        // The addresses are already in EVM format, so setPayoutOrder will use them as-is
        const result = await setPayoutOrder(
          Number(circle.blockchainId),
          payoutOrderAddresses
        );
        if (!result) {
          throw new Error("Failed to set payout order onchain");
        }
        
        // Convert EVM addresses back to Hedera account IDs for database storage
        // This ensures consistency with how addresses are stored in the database
        const { convertEvmAddressToAccountId } = await import("../services/aiAgentService");
        const payoutOrder: PayoutOrder[] = await Promise.all(
          payoutOrderAddresses.map(async (address: string, index: number) => {
            // Convert EVM address (0x...) back to Hedera account ID (0.0.x) for storage
            const accountId = await convertEvmAddressToAccountId(address);
            return {
              userAddress: accountId, // Store as Hedera account ID in database
              evmAddress: address, // Also store EVM address for on-chain joins
              payDate: new Date(
                circle.payDate.getTime() +
                  circle.cycleTime * 24 * 60 * 60 * 1000 * index
              ),
        paid: false,
            };
          })
        );

        // Convert to JSON string and update circle
        await setCircleAsStartedAndSetPayoutOrder(
          circle.id,
          JSON.stringify(payoutOrder)
        );
      }
    }
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// function to check paydate and trigger the payout function
export const checkPaydate = async () => {
  try {
    const circles = await getCircles();
    
    // Filter circles that are started and past their pay date
    // Add a 5-minute buffer to account for timing differences between DB and blockchain
    const now = new Date();
    const bufferMinutes = 5;
    const bufferTime = bufferMinutes * 60 * 1000; // 5 minutes in milliseconds
    
    const circlesToCheck = circles.filter(
      (circle) => {
        const isStarted = circle.started;
        const isPastPayDate = new Date(circle.payDate.getTime() + bufferTime) < now;
        return isStarted && isPastPayDate;
      }
    );

    if (circlesToCheck.length === 0) {
      console.log("No circles to check for pay date");
      return { processed: 0, results: [] };
    }

    console.log(`Found ${circlesToCheck.length} circles to check for pay date`);

    // Process circles individually to avoid one failure affecting others
    // The contract's checkPayDate reverts if ANY circle hasn't reached its pay date
    const results: any[] = [];
    let processedCount = 0;
    let failedCount = 0;

    for (const circle of circlesToCheck) {
      const circleId = Number(circle.blockchainId);
      try {
        console.log(`Checking pay date for circle ${circle.id} (blockchainId: ${circleId})`);
        console.log(`  - DB Pay date: ${circle.payDate.toISOString()}`);
        console.log(`  - Current time: ${now.toISOString()}`);
        console.log(`  - Time difference: ${Math.floor((now.getTime() - circle.payDate.getTime()) / 1000 / 60)} minutes`);

        // First, query the contract to get the actual pay date
        // This ensures we sync with the contract state before processing
        let contractCircle: Awaited<ReturnType<typeof getCircleFromContract>> | null = null;
        try {
          contractCircle = await getCircleFromContract(circleId);
          const contractPayDate = new Date(contractCircle.payDate * 1000);
          const dbPayDate = circle.payDate;
          
          console.log(`  - Contract Pay date: ${contractPayDate.toISOString()}`);
          console.log(`  - Pay date difference: ${Math.floor((contractPayDate.getTime() - dbPayDate.getTime()) / 1000 / 60)} minutes`);
          
          // If contract pay date is different from DB pay date, sync the database
          // This handles cases where the contract was updated but DB wasn't
          if (Math.abs(contractPayDate.getTime() - dbPayDate.getTime()) > 60000) { // More than 1 minute difference
            console.warn(`⚠️  Pay date mismatch detected for circle ${circle.id}:`);
            console.warn(`    DB: ${dbPayDate.toISOString()}`);
            console.warn(`    Contract: ${contractPayDate.toISOString()}`);
            console.warn(`    Syncing database with contract state...`);
            
            // Sync database with contract state
            // Use prisma from prismafunctions
            const { PrismaClient } = await import("@prisma/client");
            const globalForPrisma = globalThis as unknown as {
                prisma: InstanceType<typeof PrismaClient> | undefined;
              };
              
              const prisma =
                globalForPrisma.prisma ??
                new PrismaClient({
                  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
                });
              
              if (!globalForPrisma.prisma) {
                globalForPrisma.prisma = prisma;
              }
              
              await prisma.circle.update({
                where: { id: circle.id },
                data: {
                  payDate: contractPayDate,
                  round: contractCircle.round,
                  cycle: contractCircle.cycle,
                },
              });
              
              console.log(`✅ Synced database with contract for circle ${circle.id}`);
              console.log(`    Updated pay date: ${contractPayDate.toISOString()}`);
              console.log(`    Updated round: ${contractCircle.round}, cycle: ${contractCircle.cycle}`);
              
              // Update the circle object for this iteration
              circle.payDate = contractPayDate;
          }
          
          // Check if contract's pay date has actually passed
          const contractPayDatePassed = contractPayDate < now;
          if (!contractPayDatePassed) {
            console.log(`⏭️  Skipping circle ${circle.id}: Contract pay date (${contractPayDate.toISOString()}) has not passed yet`);
            continue; // Skip this circle
          }
        } catch (syncError: any) {
          console.error(`❌ Failed to sync with contract for circle ${circle.id}:`, syncError.message);
          // Continue to try processing anyway - might be a query issue
        }

        // Process one circle at a time
        const circleResults = await checkPayDate([circleId]);
        
        if (circleResults && circleResults.length > 0) {
          const result = circleResults[0];
          results.push(result);

          // Update database based on result
          // IMPORTANT: Wrap in try-catch to ensure errors don't prevent processing other circles
          // If the contract transaction succeeded, we MUST update the database
          try {
            if (result.wasDisbursed && result.disbursements) {
              // Disbursement happened
              for (const disbursement of result.disbursements) {
                try {
                  const updatedCircle = await updateDisbursementContext(
                    result.circleId,
                    disbursement.recipient,
                    Number(disbursement.amount) / 1e8,
                    result.transactionId,
                    disbursement.timestamp
                  );
                  if (!updatedCircle) {
                    console.error(`❌ Failed to update disbursement context for circle ${result.circleId}`);
                    // This is critical - contract succeeded but DB update failed
                    // We should retry or alert
                  } else {
                    console.log(`✅ Updated disbursement context for circle ${result.circleId}`);
                  }
                } catch (dbError: any) {
                  console.error(`❌ CRITICAL: Database update failed for disbursement in circle ${result.circleId}:`, dbError.message);
                  console.error(`   Contract transaction succeeded (tx: ${result.transactionId}), but database update failed!`);
                  console.error(`   This means the contract state is updated but the database is not in sync.`);
                  // Re-throw to be caught by outer handler
                  throw dbError;
                }
              }
            } else if (result.refunds && result.refunds.length > 0) {
              // Refunds happened - update once per circle (all members get refunded)
              try {
                const updatedCircle = await updateRefundContext(result.circleId);
                if (!updatedCircle) {
                  console.error(`❌ Failed to update refund context for circle ${result.circleId}`);
                  // This is critical - contract succeeded but DB update failed
                } else {
                  console.log(`✅ Updated refund context for circle ${result.circleId}`);
                }
              } catch (dbError: any) {
                console.error(`❌ CRITICAL: Database update failed for refund in circle ${result.circleId}:`, dbError.message);
                console.error(`   Contract transaction succeeded (tx: ${result.transactionId}), but database update failed!`);
                console.error(`   This means the contract state is updated but the database is not in sync.`);
                // Re-throw to be caught by outer handler
                throw dbError;
              }
            } else {
              // No disbursements or refunds detected - this might mean:
              // 1. The transaction didn't actually process anything (contract already processed it)
              // 2. The payment detection failed
              // 3. The transaction succeeded but payments weren't recorded yet
              console.warn(`⚠️  No disbursements or refunds detected for circle ${result.circleId} after checkPayDate`);
              console.warn(`   Transaction ID: ${result.transactionId}`);
              console.warn(`   This might indicate the contract already processed this pay date.`);
              
              // IMPORTANT: If the contract transaction succeeded but no payments were detected,
              // the contract state might have been updated (pay date moved forward)
              // We should sync the database with the contract state to prevent future mismatches
              try {
                console.log(`   Attempting to sync database with contract state...`);
                const contractCircle = await getCircleFromContract(circleId);
                const contractPayDate = new Date(contractCircle.payDate * 1000);
                const dbPayDate = circle.payDate;
                
                // If contract pay date is different from DB, sync it
                if (Math.abs(contractPayDate.getTime() - dbPayDate.getTime()) > 60000) {
                  console.warn(`   Contract pay date (${contractPayDate.toISOString()}) differs from DB (${dbPayDate.toISOString()})`);
                  console.warn(`   Syncing database with contract state...`);
                  
                  // Sync database with contract state
                  const { PrismaClient } = await import("@prisma/client");
                  const globalForPrisma = globalThis as unknown as {
                    prisma: InstanceType<typeof PrismaClient> | undefined;
                  };
                  
                  const prisma =
                    globalForPrisma.prisma ??
                    new PrismaClient({
                      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
                    });
                  
                  if (!globalForPrisma.prisma) {
                    globalForPrisma.prisma = prisma;
                  }
                  
                  await prisma.circle.update({
                    where: { id: circle.id },
                    data: {
                      payDate: contractPayDate,
                      round: contractCircle.round,
                      cycle: contractCircle.cycle,
                    },
                  });
                  
                  console.log(`   ✅ Synced database with contract state`);
                  console.log(`      Updated pay date: ${contractPayDate.toISOString()}`);
                  console.log(`      Updated round: ${contractCircle.round}, cycle: ${contractCircle.cycle}`);
                } else {
                  console.log(`   Contract and database pay dates match - no sync needed`);
                }
              } catch (syncError: any) {
                console.error(`   ❌ Failed to sync database with contract state:`, syncError.message);
              }
            }
            
            processedCount++;
          } catch (dbUpdateError: any) {
            // Database update failed - this is critical because the contract already succeeded
            console.error(`❌ CRITICAL ERROR: Contract transaction succeeded but database update failed for circle ${result.circleId}`);
            console.error(`   Transaction ID: ${result.transactionId}`);
            console.error(`   Error: ${dbUpdateError.message}`);
            console.error(`   The contract state is now out of sync with the database!`);
            console.error(`   Action required: Manually sync the database or retry the database update.`);
            
            // Don't increment processedCount since DB update failed
            // But don't throw - continue processing other circles
            failedCount++;
          }
        } else {
          // No results returned - this shouldn't happen if transaction succeeded
          console.warn(`⚠️  checkPayDate returned no results for circle ${circle.id} (blockchainId: ${circleId})`);
        }
      } catch (error: any) {
        failedCount++;
        console.error(`❌ Failed to check pay date for circle ${circle.id} (blockchainId: ${circleId}):`, error.message);
        
        // Check if it's a "pay date has not passed" error
        if (error.message && error.message.includes("Pay date has not passed")) {
          console.warn(`⚠️  Circle ${circle.id} pay date check failed: Pay date has not passed on-chain (DB: ${circle.payDate.toISOString()})`);
          // This is not a critical error - the circle just isn't ready yet
        } else if (error.message && error.message.includes("CONTRACT_REVERT_EXECUTED")) {
          console.error(`❌ Contract reverted for circle ${circle.id}. This might indicate:`);
          console.error(`   1. Pay date hasn't passed on-chain (timing difference)`);
          console.error(`   2. Circle doesn't exist on-chain`);
          console.error(`   3. Other contract validation failed`);
        } else {
          // Other errors - log but continue processing other circles
          console.error(`❌ Unexpected error for circle ${circle.id}:`, error);
        }
        
        // Continue processing other circles even if one fails
      }
    }

    console.log(`✅ Pay date check completed: ${processedCount} processed, ${failedCount} failed`);

    return {
      processed: processedCount,
      failed: failedCount,
      results,
    };
  } catch (error) {
    console.error("Error in checkPaydate:", error);
    throw error;
  }
};
 
