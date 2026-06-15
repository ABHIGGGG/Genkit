//this file defines the main application router by combining various sub-routers.
//these subrouters handle different aspects of the application's functionality, such as messages, projects, and usage tracking.


import { messagesRouter } from "@/modules/messages/server/procedures";
import { createTRPCRouter } from "../init";
import { projectsRouter } from "@/modules/projects/server/procedures";
import { usageRouter } from "@/modules/usage/server/procedures";

export const appRouter = createTRPCRouter({
  messages: messagesRouter,
  projects: projectsRouter,
  usage: usageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
