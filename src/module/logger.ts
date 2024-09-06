import { clientInstance } from "./client";
import fs from "node:fs";
import readline from "readline";
import path from "path";
import { TextChannel } from "discord.js";
import * as dotenv from 'dotenv';

dotenv.config();

export class Logger {
  // static logDirectory = path.join(__dirname, "../../..", "logs"); // ログファイルのディレクトリ
  static logDirectory = '/home/server/minecraft_server/ReiServer/logs'; // ログファイルのディレクトリ
  static currentLogFilePath: fs.PathLike = path.join(this.logDirectory, "latest.log"); // 現在のログファイルのパス
  static currentLogStream = null; // 現在のログファイルの読み取りストリーム

  // ログファイルの存在を確認し、ファイルが存在する場合に監視を開始
  static watchLogFile() {
    fs.access(this.currentLogFilePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`Log file not found: ${this.currentLogFilePath}`);
        setTimeout(this.watchLogFile, 5000); // ファイルが存在しない場合は5秒後に再試行
      } else {
        this.startWatching();
      }
    });
  }

  // ログファイルを監視開始
  static startWatching() {
    this.currentLogStream = fs.createReadStream(this.currentLogFilePath, { encoding: "utf-8" });

    this.currentLogStream.on("error", (error) => {
      console.error(`Error reading the file: ${error.message}`);
    });

    // ログファイルの変更を監視
    fs.watch(this.logDirectory, (event, filename) => {
      if (event === "change" && filename === "latest.log") {
        // ファイルが変更されたら最終行を読み取る
        this.readLastLine(this.currentLogFilePath);
      }
    });

    console.log(`Now watching the log file: ${this.currentLogFilePath}`);
    this.readLastLine(this.currentLogFilePath); // 初回のログファイルを読み取る
  }

  // ログファイルの最終行を読み取る
  static readLastLine(filePath: fs.PathLike) {
    const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lastLine = "";

    rl.on("line", (line) => {
      lastLine = line;
    });

    rl.on("close", async () => {
      if (lastLine) {
        const date = new Date();
        const [hour, minutes, seconds] = [
          date.getHours().toString().padStart(2, "0"),
          date.getMinutes().toString().padStart(2, "0"),
          date.getSeconds().toString().padStart(2, "0"),
        ]; // 曜・時・分

        if (lastLine.split(":")[4] != undefined) {
          lastLine = `[${hour}:${minutes}:${seconds}] ${lastLine.split(":")[3]}:${lastLine.split(":")[4]}`;
        } else {
          lastLine = `[${hour}:${minutes}:${seconds}] ${lastLine.split(":")[3]}`;
        }

        if (
          lastLine.includes("Disabling Mohist") ||
          lastLine.includes("Starting minecraft server") ||
          lastLine.includes("Done") ||
          lastLine.includes("logged in with entity id") ||
          lastLine.includes("left the game") ||
          lastLine.slice(12, 13) == "<"
        ) {
          const targetChannel: TextChannel | undefined = clientInstance.channels.cache.get(
            process.env.DISCORD_LOG_CHANNEL_ID,
          ) as TextChannel;

          try {
            await targetChannel.send(lastLine);
          } catch (error) {
            console.error(`Failed to send a message: ${error}`);
          }
        }
        console.log("📨 " + lastLine);
      }
    });

    fileStream.on("error", (error) => {
      console.error(`Error reading the file: ${error.message}`);
    });
  }
}
