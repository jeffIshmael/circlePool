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
import { setPayoutOrder, checkPayDate } from "../services/aiAgentService";

interface PayoutOrder {
  userAddress: string;
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
        const payoutOrderAddresses = getRandomOrder(
          circle.members.map((member: any) => member.address)
        );
        // set the payou order onchain
        const result = await setPayoutOrder(
          Number(circle.blockchainId),
          payoutOrderAddresses
        );
        if (!result) {
          throw new Error("Failed to set payout order onchain");
        }
        // the payout order should be an array of the object
        const payoutOrder: PayoutOrder[] = payoutOrderAddresses.map(
          (address: string, index: number) => ({
            userAddress: address,
            payDate: new Date(
              circle.payDate.getTime() +
                circle.cycleTime * 24 * 60 * 60 * 1000 * index
            ),
            paid: false,
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
    const circlesToCheck = circles.filter(
      (circle) => circle.payDate < new Date() && circle.started
    );

    if (circlesToCheck.length === 0) {
      return { processed: 0, results: [] };
    }

    // Process all circles at once
    const circleIds = circlesToCheck.map((circle) =>
      Number(circle.blockchainId)
    );
    const results = await checkPayDate(circleIds);

    // Log results for each circle
    for (const result of results) {
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
            throw new Error("Failed to update disbursement context");
          }
        }
      } else if (result.refunds && result.refunds.length > 0) {
        // Refunds happened - update once per circle (all members get refunded)
        const updatedCircle = await updateRefundContext(result.circleId);
        if (!updatedCircle) {
          throw new Error("Failed to update refund context");
        }
      }
    }

    return {
      processed: results.length,
      results,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
 
