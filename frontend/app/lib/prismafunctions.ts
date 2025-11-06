// this file contains the functions for the prisma client
"use server";

import { PrismaClient } from "@prisma/client";

// Create a singleton Prisma Client instance for Next.js
// This prevents multiple instances during development hot-reloads and production
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Store in global to reuse across hot-reloads (dev) and requests (prod)
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Ensure proper disconnection on shutdown
if (typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

export const getCircles = async () => {
  const circles = await prisma.circle.findMany({
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              address: true,
              evmAddress: true,
            },
          },
        },
      },
    },
  });
  return circles;
};

// get circle by slug
export const getCircleBySlug = async (slug: string) => {
  const circle = await prisma.circle.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              address: true,
              evmAddress: true,
            },
          },
        },
      },
      loanRequests: {
        select: {
          id: true,
          amount: true,
          interestRate: true,
          duration: true,
          startDate: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          description: true,
          doneAt: true,
          txHash: true,
        },
      },
      payOuts: {
        select: {
          id: true,
          amount: true,
          doneAt: true,
          txHash: true,
          receiver: true,
        },
      },
    },
  });
  return circle;
};

// get circle by id
export const getCircleById = async (id: number) => {
  const circle = await prisma.circle.findUnique({
    where: { id },
  });
  return circle;
};

// register user
export const registerUser = async (
  userName: string | null,
  address: string,
  evmAddress?: string | null
) => {
  try {
    const existingUser = await prisma.user.findUnique({ where: { address } });
    if (existingUser) {
      // If user exists but misses evmAddress, populate it
      if (!existingUser.evmAddress) {
        let evmToSet: string | null = evmAddress || null;
        
        // If evmAddress not provided, compute it from address
        if (!evmToSet) {
          try {
            const { AccountId } = await import("@hashgraph/sdk");
            const evm = AccountId.fromString(address).toEvmAddress();
            evmToSet = evm.startsWith('0x') ? evm : `0x${evm}`;
          } catch {}
        }
        
        if (evmToSet) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { evmAddress: evmToSet },
          });
        }
      }
      return existingUser;
    }
    // Use provided evmAddress or compute from Hedera account ID
    let computedEvm: string | null = evmAddress || null;
    if (!computedEvm) {
      if (address.startsWith('0x')) {
        computedEvm = address;
      } else {
        try {
          const { AccountId } = await import("@hashgraph/sdk");
          const evm = AccountId.fromString(address).toSolidityAddress();
          computedEvm = evm.startsWith('0x') ? evm : `0x${evm}`;
        } catch {
          computedEvm = null;
        }
      }
    }
    const user = await prisma.user.create({
      data: {
        userName: userName || null,
        address,
        evmAddress: computedEvm ?? undefined,
      },
    });
    return user;
  } catch (error) {}
};

// get user by address
export const getUserByAddress = async (address: string) => {
  const user = await prisma.user.findUnique({
    where: {
      address,
    },
    include: {
      loanRequests: {
        select: {
          id: true,
          amount: true,
          interestRate: true,
          duration: true,
          startDate: true,
        },
      },
      notifications: {
        select: {
          id: true,
          message: true,
          createdAt: true,
        },
      },
    },
  });
  return user;
};

// register circle
export const registerCircle = async (
  name: string,
  blockchainId: string,
  startDate: number,
  payDate: number,
  cycleTime: number,
  amount: number,
  leftPercent: number,
  interestPercent: number,
  adminAddress: string
) => {
  try {
    const slug = name.toLowerCase().replace(/ /g, "-");
    const existingCircle = await prisma.circle.findUnique({
      where: {
        slug,
      },
    });
    if (existingCircle) {
      throw new Error("Circle already exists");
    }
    const admin = await getUserByAddress(adminAddress);
    if (!admin) {
      throw new Error("Admin not found");
    }
    const circle = await prisma.circle.create({
      data: {
        name,
        slug,
        startDate: new Date(startDate),
        payDate: new Date(payDate),
        cycleTime,
        amount: amount.toString(),
        leftPercent,
        interestPercent,
        blockchainId,
        admin: { connect: { id: admin.id } },
      },
    });
    if (!circle) {
      throw new Error("Failed to create circle");
    }
    await prisma.circleMember.create({
      data: {
        userId: admin.id,
        circleId: circle.id,
        payDate: new Date(payDate),
      },
    });
    return circle;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// add member to circle
export const addMemberToCircle = async (
  circleId: number,
  userAddress: string
) => {
  try {
    const user = await getUserByAddress(userAddress);
    if (!user) {
      throw new Error("User not found");
    }
    const member = await prisma.circleMember.create({
      data: {
        userId: user.id,
        circleId,
        payDate: new Date(),
      },
    });
    return member;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// function to check if a circle's slug exists
export const checkSlugExists = async (name: string) => {
  const slug = name.toLowerCase().replace(/ /g, "-");
  const circle = await prisma.circle.findUnique({
    where: {
      slug,
    },
  });
  return circle ? true : false;
};

// check if user is registered
export const checkUserRegistered = async (address: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        address,
      },
    });
    return user ? true : false;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// check if user is a member of a circle
export const checkUserIsMemberOfCircle = async (
  userAddress: string,
  slug: string
) => {
  const user = await getUserByAddress(userAddress);
  if (!user) {
    throw new Error("User not found");
  }
  const circle = await getCircleBySlug(slug);
  if (!circle) {
    throw new Error("Circle not found");
  }
  const member = await prisma.circleMember.findFirst({
    where: {
      userId: user.id,
      circleId: circle.id,
    },
  });
  return member ? true : false;
};
// function to check if a user has a pending join request to a circle
export const checkUserHasPendingJoinRequestToCircle = async (
  userAddress: string,
  circleId: number
) => {
  const user = await getUserByAddress(userAddress);
  if (!user) {
    throw new Error("User not found");
  }
  const request = await prisma.circleRequest.findFirst({
    where: { userId: user.id, circleId: circleId, status: "pending" },
  });
  return request ? true : false;
};

// function to send request to join a circle
export const sendRequestToJoinCircle = async (
  userAddress: string,
  circleId: number
) => {
  try {
    const user = await getUserByAddress(userAddress);
    if (!user) {
      throw new Error("User not found");
    }
    const hasPendingRequest = await checkUserHasPendingJoinRequestToCircle(
      userAddress,
      circleId
    );
    if (hasPendingRequest) {
      throw new Error("You already have a pending join request to this circle");
    }
    const request = await prisma.circleRequest.create({
      data: {
        userId: user.id,
        circleId: circleId,
      },
    });
    return request;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// get circleIDs that user is admin of
export const getCircleIDsThatUserIsAdminOf = async (userAddress: string) => {
  try {
    const user = await getUserByAddress(userAddress);
    if (!user) {
      throw new Error("User not found");
    }
    const circleIds = await prisma.circle.findMany({
      where: {
        adminId: user.id,
      },
      select: {
        id: true,
      },
    });
    return circleIds;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// get users notifications & requests
export const getUsersNotificationsAndRequests = async (userAddress: string) => {
  try {
    const user = await getUserByAddress(userAddress);
    if (!user) {
      throw new Error("User not found");
    }
    const circleIds = await getCircleIDsThatUserIsAdminOf(userAddress);
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
    });
    // get join requests for circles that user is admin of
    const joinRequests = await prisma.circleRequest.findMany({
      where: {
        circleId: { in: circleIds.map((circle) => circle.id) },
      },
    });
    // circles loan requests : need to be approved by everyone
    const circleLoanRequests = await prisma.loanRequest.findMany({
      where: {
        circleId: { in: circleIds.map((circle) => circle.id) },
        userId: { not: user.id }, // exclude loan requests created by the current user
      },
      include: {
        circle: {
          select: {
            name: true,
            id: true,
          },
        },
        user: {
          select: {
            userName: true,
            address: true,
          },
        },
      },
      
    });
    return { notifications, joinRequests, circleLoanRequests };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// get users approved loans
export const getUsersApprovedLoans = async (userAddress: string) => {
  try {
    const user = await getUserByAddress(userAddress);
    if (!user) {
      throw new Error("User not found");
    }

    const loans = await prisma.loanRequest.findMany({
      where: { userId: user.id, status: "approved" },
    });
    return loans;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// get users loan requests
export const getUsersLoanRequests = async (userAddress: string) => {
  try {
    const user = await getUserByAddress(userAddress);
    if (!user) {
      throw new Error("User not found");
    }
    const loanRequests = await prisma.loanRequest.findMany({
      where: { userId: user.id },
    });
    return loanRequests;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// update user name
export const updateUserName = async (userAddress: string, userName: string | null, email: string | null) => {
  try {
    const user = await getUserByAddress(userAddress);
    if (!user) {
      throw new Error("User not found");
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { userName, email },
    });
    return user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// update user payment to a circle

export const updateUserPaymentToCircle = async (userAddress: string, circleId: number, amount: number, txHash: string, description: string) => {
  try {
    const user = await getUserByAddress(userAddress);
    if (!user) {
      throw new Error("User not found");
    }
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        circleId: circleId,
        amount: amount.toString(),
        description: description,
        txHash: txHash,
        doneAt: new Date(),
      },
    });
    if (!payment) {
      throw new Error("Failed to update user payment to circle");
    }
    return payment;
  }catch (error) {
    console.error(error);
    throw error;
  }
};

// function to notify all users of a circle
export const notifyAllUsersOfCircle = async (slug: string, message: string) => {
  try {
    const circle = await getCircleBySlug(slug);
    if (!circle) {
      throw new Error("Circle not found");
    }
    const users = circle.members.map((member: any) => member.user);
    for (const user of users) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          circleId: circle.id,
          message: message,
        },
      });
    }
    return true;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}


// function to set circle as started and set the payout order
export const setCircleAsStartedAndSetPayoutOrder = async (circleId: number, payoutOrder: string) => {
  try {
    const circle = await prisma.circle.update({
      where: { id: circleId },
      data: { started: true, payOutOrder: payoutOrder },
    });
    if (!circle) {
      throw new Error("Failed to set circle as started and set the payout order");
    }
    // notify users that the circle has started
    const allUsersNotified = await notifyAllUsersOfCircle(circle.slug, `Circle ${circle.name} has started. The payout order has been set.`);
    return circle;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

// function to create a payout to a user

export const createPayoutToUser = async (circleId: number, receiver: string, amount: number, txHash: string, timestamp: Date) => {
  try {
    const circle = await getCircleById(circleId);
    if (!circle) {
      throw new Error("Circle not found");
    }
    const payout = await prisma.payOut.create({
      data: {
        userId: circle.adminId,
        circleId: circleId,
        amount: amount,
        txHash: txHash,
        receiver: receiver,
        doneAt: timestamp,
      },
    });
    if (!payout) {
      throw new Error("Failed to create payout");
    }
    return payout;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}
// disbursment context
// if it was a disburse, we update the payout Order, notify all users, update the round and cycle , paydate
export const updateDisbursementContext = async (circleId: number, receiver: string, amount: number, txHash: string, timestamp: Date) => {
  try {
   const circle = await getCircleById(circleId);
   if (!circle) {
    throw new Error("Circle not found");
   }
   // update the payout order
   const payoutOrder = JSON.parse(circle.payOutOrder as string);
   const newPayoutOrder = payoutOrder.map((item: any) => {
     if (item.userAddress === receiver) {
       // Mark receiver as paid
       return { ...item, paid: true };
     } else if (!item.paid) {
       // Increase payDate for unpaid members by cycleTime
       return { 
         ...item, 
         payDate: new Date(item.payDate.getTime() + circle.cycleTime * 24 * 60 * 60 * 1000) 
       };
     }
     // Already paid members remain unchanged
     return item;
   });
   const newPayoutOrderString = JSON.stringify(newPayoutOrder);
   // update the round and cycle
   const newCycle = circle.round == circle?.payOutOrder?.length ?circle.cycle + 1 : circle.cycle;
   const newRound =  circle.round == circle?.payOutOrder?.length  ? 1 : circle.round + 1;
 
   const newPayDate = new Date(circle.payDate.getTime() + circle.cycleTime * 24 * 60 * 60 * 1000);
   const updatedCircle = await prisma.circle.update({
    where: { id: circleId },
    data: { round: newRound, cycle: newCycle, payDate: newPayDate, payOutOrder: newPayoutOrderString },
   });
   if (!updatedCircle) {
    throw new Error("Failed to update disbursement context");
   }
   // create a payout to the user
   const payout = await createPayoutToUser(circleId, receiver, amount, txHash, timestamp);
   if (!payout) {
    throw new Error("Failed to create payout");
   }
   // notify all users
   await notifyAllUsersOfCircle(circle.slug, `Circle ${circle.name} has disbursed ${amount} HBAR to ${receiver} for the ${circle.round} round of the ${circle.cycle} cycle.`);
   
   return updatedCircle;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

// if it was a refund, we update the payout Order, notify all users, update the round and cycle , paydate
export const updateRefundContext = async (circleId: number) => {
  try {
    const circle = await getCircleById(circleId);
    if (!circle) {
      throw new Error("Circle not found");
    }
    const payoutOrder = JSON.parse(circle.payOutOrder as string);
    // Update payDate for the receiver and all unpaid members
    const newPayoutOrder = payoutOrder.map((item: any) => {
      if (!item.paid) {
        return { ...item, payDate: new Date(item.payDate.getTime() + circle.cycleTime * 24 * 60 * 60 * 1000) };
      }
      return item;
    });
    const newPayoutOrderString = JSON.stringify(newPayoutOrder);
    const updatedCircle = await prisma.circle.update({
      where: {id: circleId},
      data:{
        payOutOrder: newPayoutOrderString,
        payDate: new Date(circle.payDate.getTime() + circle.cycleTime * 24 * 60 * 60 * 1000),
      }
    })
    if (!updatedCircle) {
      throw new Error("Failed to update refund context");
    }
    // notify all users
    await notifyAllUsersOfCircle(circle.slug, `Your balance from circle ${circle.name} has been refunded for the ${circle.round} round of the ${circle.cycle} cycle. This is due to the fact that not all members paid their contributions.`);
    return updatedCircle;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}