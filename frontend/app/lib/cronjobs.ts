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
import { setPayoutOrder, checkPayDate, getOnChainMembers } from "../services/aiAgentService";

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
        console.log(`  - Pay date: ${circle.payDate.toISOString()}`);
        console.log(`  - Current time: ${now.toISOString()}`);
        console.log(`  - Time difference: ${Math.floor((now.getTime() - circle.payDate.getTime()) / 1000 / 60)} minutes`);

        // Process one circle at a time
        const circleResults = await checkPayDate([circleId]);
        
        if (circleResults && circleResults.length > 0) {
          const result = circleResults[0];
          results.push(result);

          // Update database based on result
          if (result.wasDisbursed && result.disbursements) {
            // Disbursement happened
            for (const disbursement of result.disbursements) {
              const updatedCircle = await updateDisbursementContext(
                result.circleId,
                disbursement.recipient,
                Number(disbursement.amount) / 1e8,
                result.transactionId,
                disbursement.timestamp
              );
              if (!updatedCircle) {
                console.error(`Failed to update disbursement context for circle ${result.circleId}`);
              } else {
                console.log(`✅ Updated disbursement context for circle ${result.circleId}`);
              }
            }
          } else if (result.refunds && result.refunds.length > 0) {
            // Refunds happened - update once per circle (all members get refunded)
            const updatedCircle = await updateRefundContext(result.circleId);
            if (!updatedCircle) {
              console.error(`Failed to update refund context for circle ${result.circleId}`);
            } else {
              console.log(`✅ Updated refund context for circle ${result.circleId}`);
            }
          }
          
          processedCount++;
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
 
