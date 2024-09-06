import { clientInstance } from './module/client';
import { Logger } from './module/logger';
import * as dotenv from 'dotenv';

dotenv.config();

const token: string = process.env.DISCORD_BOT_TOKEN;
let retryCount: number = 0;

clientInstance.on('ready', () => {
    console.log(`Logged in as ${clientInstance.user.tag}!`);

    // ログファイルを監視開始
    Logger.watchLogFile();
    retryCount = 0;
});

clientInstance.on('error', async (error) => {
    console.error('An error occurred:', error);

    clientInstance.destroy();
    await new Promise((resolve) => setTimeout(resolve, 5000));

    if (retryCount < 5) {
        console.log('Reconnecting...');
        clientInstance.login(token);
        retryCount++;
    } else {
        console.log('Failed to reconnect after 5 attempts.');
        process.exit(1);
    }
});

clientInstance.login(token);
