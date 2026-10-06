import dotenv from "dotenv"
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

dotenv.config()

export const openrouter_config = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY!,
});
