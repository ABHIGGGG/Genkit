import { PrismaClient } from "@/generated/prisma";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// Create a new Prisma Client instance or use the existing one
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
