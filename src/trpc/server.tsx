//This file is a Server-side helper file.
//It allows Server Components in Next.js to directly call tRPC backend functions without making HTTP requests,
// which makes everything much faster.

/*It prepares three main things:
(1) a cached QueryClient for server caching,
(2) a trpc object that lets server components run .query() on backend functions,
(3) a caller object that allows backend-to-backend calls.
This makes server rendering much faster, more secure, and simpler.*/


import "server-only"; 
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

export const getQueryClient = cache(makeQueryClient);  //ensures Next.js uses the same QueryClient per request.

// Create the tRPC proxy with the context, router, and query client
// This allows Server Components to call tRPC procedures directly
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});
export const caller = appRouter.createCaller(createTRPCContext);
