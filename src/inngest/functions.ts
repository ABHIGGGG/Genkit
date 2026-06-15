import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
} from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";

import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import z from "zod";
import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";
import { SANDBOX_TIMEOUT } from "@/types";
import fs from "fs";


//Type definition for the agent's state, including a summary and a collection of files
interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

//defines background job named "code-agent" that runs when the "code-agent/run" event is triggered
export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
 
   
  async ({ event, step }) => {
    try {

    // Retrieve previously written files from database if this is a follow-up request in the project
    const initialFiles = await step.run("get-initial-files", async () => {
      const lastMessage = await prisma.message.findFirst({
        where: {
          projectId: event.data.projectId,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            isNot: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          fragment: true,
        },
      });

      return (lastMessage?.fragment?.files as Record<string, string>) || {};
    });

    // Create a new sandbox instance using Inngest's step.run to manage execution steps
    // hence STEP1:- create sandbox
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("abhi-nextjs-sandbox");
      await sandbox.setTimeout(SANDBOX_TIMEOUT);
      
      // Write previous files to the sandbox filesystem so they exist during agent execution
      for (const [path, content] of Object.entries(initialFiles)) {
        await sandbox.files.write(path, content);
      }
      return sandbox.sandboxId;
    });

    // Define the coding agent using Inngest's createAgent
    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
     model: openai(
       process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== "your_deepseek_api_key"
         ? {
             model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
             baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
             apiKey: process.env.DEEPSEEK_API_KEY,
           }
         : {
             model: "llama-3.1-8b-instant",
             baseUrl: process.env.OPENAI_BASE_URL,
             apiKey: process.env.OPENAI_API_KEY,
           }
     ),
      
     // Define the tools the agent can use
      tools: [
        
        //Tool1:- Terminal tool to run commands in the sandbox
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = sandbox.commands.run(command, {
                  // Callbacks to capture stdout and stderr
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return (await result).stdout;
              } catch (e) {
                console.error(
                  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`,
                );
                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`;
              }
            });
          },
        }),

        //Tool2:- File management tool to create, update, and read files in the sandbox
        //takes file paths and contents as input 
        //network is shared, persistent state across multiple agent iterations and tool calls.
        //Network.state.data stores files created or updated during the agent's execution step so that next steps can acess them.
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>,
          ) => {
            /**
             * {
             *   /app.tsx: "<p>hi</p>",
             * }
             */

            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  //Retrieves previously written files , or initializes an empty object if none exist.
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  // Iterate over each file and write it to the sandbox
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (e) {
                  return "Error: " + e;
                }
              },
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),
        
        //Tool3:- File reading tool to read files from the sandbox
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  // Prevent hallucination to ensure file exists
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            });
          },
        }),
      ],
      
      //onResponse is called after the agent receives a response from the language model.
      //result contains the full agent output (messages, tool calls, text).
      //astAssistantMessageTextContent(result) extracts the latest text message produced by the assistant, ignoring tool calls or metadata.
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });
    

    //After defining the agent, create a network to run the agent with a maximum of 15 iterations
    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        // If a summary already exists, stop further processing by not returning any agent
        // else continue with the codeAgent
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });
    
   //This line actually starts the agent execution using the user’s input.
   //event.data.value contains the user prompt or instructions for the agent.
    const result = await network.run(event.data.value, {
      state: {
        data: {
          files: initialFiles,
          summary: "",
        },
      },
    });

    // Determine if there was an error based on the agent's final state
    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    // Build the optimized production bundle and start the production server inside the sandbox
    if (!isError) {
      await step.run("build-and-start-prod-server", async () => {
        const sandbox = await getSandbox(sandboxId);
        // Build the optimized production bundle
        await sandbox.commands.run("npx next build", { timeoutMs: 90000 });
        // Start the production Next.js server in the background
        await sandbox.commands.run("npx next start --port 3000", {
          background: true,
        });
      });
    }

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      //it gives the public host that forwards traffic to port 3000 inside this sandbox
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // Save to db
    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }
      
      // Save the successful result message with summary and fragment details
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files,
            },
          },
        },
      });
    });

      return {
        url: sandboxUrl,
        title: "Fragment",
        files: result.state.data.files,
        summary: result.state.data.summary,
      };
    } catch (e) {
      console.error("CODE AGENT ERROR:", e);
      try {
        const errorMsg = e instanceof Error ? e.stack || e.message : String(e);
        fs.writeFileSync("error.log", `[${new Date().toISOString()}] CODE AGENT ERROR:\n${errorMsg}\n\n`, { flag: "a" });
      } catch (writeErr) {
        console.error("Failed to write to error.log:", writeErr);
      }
      throw e;
    }
  },
);
