import { clientInstance } from './module/client';
import { Logger } from './module/logger';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;

clientInstance.on('ready', () => {
    console.log(`Logged in as ${clientInstance.user.tag}!`);

    // ログファイルを監視開始
    Logger.watchLogFile();
});

clientInstance.on('error', (error) => {
    console.error('An error occurred:', error);

    try {
        clientInstance.destroy();
        clientInstance.login(token);
    } catch (error) {
        console.error('Failed to reconnect:', error);
    }
});

clientInstance.login(token);
