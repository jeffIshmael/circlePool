// this file contains the functions for the prisma client
"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        },
      },
    },
  });
  return circle;
};

// register user
export const registerUser = async (
  userName: string | null,
  address: string
) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        address,
      },
    });
    if (existingUser) {
      throw new Error("User already exists");
    }
    const user = await prisma.user.create({
      data: {
        userName: userName || null,
        address,
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
