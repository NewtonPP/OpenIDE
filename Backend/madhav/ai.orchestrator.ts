import { openrouter_config } from './config/ai.config.js';
import { ToolLoopAgent, tool } from 'ai';
import {z} from "zod"
import { delete_file, list_files, read_dir, read_file, write_file } from "./ai.tools.js";
// import { createOllama } from 'ollama-ai-provider-v2';
import {createOpenAI} from '@ai-sdk/openai';

import type { Request, Response} from 'express';

const WORKSPACE_ROOT = process.cwd();
// const ollama = createOllama();

const openai = createOpenAI({apiKey: process.env.OPEN_AI_KEY!})
export const agent = new ToolLoopAgent({
    model: openai('gpt-5.1'),
    instructions:`The Workspace root is ${WORKSPACE_ROOT}. Based on the user input you need to use necessary tools and perform the execution
                  so that the user receives correct output.`,
    tools:{
        read_file:tool({
            description: "Read a file with given path",
            inputSchema:z.object({
                filepath: z.string()
            }),
            execute: async ({filepath}) => {
                return await read_file(filepath)
            }
        }),
        write_file:tool({
            description:"Write onto a file with contents user wants to be written onto that file",
            inputSchema: z.object({
                filepath: z.string(),
                content: z.string()
            }),
            execute: async ({filepath, content}) => {
                return await write_file(filepath, content)
            }
        }),
        read_dir:tool({
            description: "Read the directory mentioned by user and return its contents",
            inputSchema: z.object({
                dirpath: z.string()
            }),
            execute: async ({dirpath}) => {
                return await read_dir(dirpath)
            }
        }),

        delete_file: tool({
            description: "Delete a file mentioned by user",
            inputSchema: z.object({
                filepath: z.string()
            }),
            execute: async ({filepath}) => {
                return await delete_file(filepath)
            }
        }),
        list_files: tool({
            description: "List files in a directory",
            inputSchema : z.object({
                pathname: z.string()
            }),
            execute: async ({pathname})=>{
                return await list_files(pathname)
            }
        })
    },
    onToolExecutionStart: (d) => {
        console.log(d)
    } 
})

export async  function run_agent (req: Request, res:Response)
{
    const {prompt} = req.body 
    const result = await agent.generate({
        prompt: prompt,
    })

    console.log(result.text)
    return res.status(200).json({message: result.output})
}


