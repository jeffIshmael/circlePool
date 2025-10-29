// this file contains the functions for the prisma client

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getCircles = async () => {
  const circles = await prisma.circle.findMany({
    include: {
      members: {
        user: {
          select: {
            id: true,
            userName: true,
            address: true,
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
        user: {
          select: {
            id: true,
            userName: true,
            address: true,
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
    include:{
        loanRequests:{
            select:{
                id: true,
                amount: true,
                interestRate: true,
                duration: true,
                startDate: true,
            },
        },
        notifications:{
            select:{
                id: true,
                message: true,
                createdAt: true,
            },
        },
    }
  });
  return user;
};

// register circle
export const registerCircle = async (
  name: string,
  slug: string,
  startDate: number,
  payDate: number,
  cycleTime: number,
  amount: number,
  leftPercent: number,
  interestPercent: number,
  adminAddress: string
) => {
  try {
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
      },
    });
    return member;
  } catch (error) {
    console.error(error);
    throw error;
  }
};


