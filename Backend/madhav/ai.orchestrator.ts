import { openrouter_config } from './config/ai.config.js';
import { ToolLoopAgent, tool } from 'ai';
import {z} from "zod"
import { delete_file, read_dir, read_file, write_file } from "./ai.tools.js";
import { createOllama } from 'ollama-ai-provider-v2';

import type { Request, Response} from 'express';

const ollama = createOllama();

export const agent = new ToolLoopAgent({
    model: ollama('gemma4:12b-mlx'),
//   providerOptions: { ollama: { think: true } },
    instructions:'',
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
        })
    }
})

export async  function run_agent (req: Request, res:Response)
{
    const {prompt} = req.body 
    const result = await agent.generate({
        prompt: prompt,
    })

    return res.status(200).json({message: result.output})
}


