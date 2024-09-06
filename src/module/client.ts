import { Client, GatewayIntentBits } from "discord.js";

export const clientInstance = new Client({ intents: [GatewayIntentBits.Guilds] });
