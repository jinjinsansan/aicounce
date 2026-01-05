import { Client } from "@line/bot-sdk";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_CHANNEL_SECRET;

if (!channelAccessToken || !channelSecret) {
  console.warn("LINE credentials are not fully configured.");
}

export const lineClient = new Client({
  channelAccessToken: channelAccessToken ?? "",
  channelSecret: channelSecret ?? "",
});

export const lineConfig = {
  channelSecret: channelSecret ?? "",
  channelAccessToken: channelAccessToken ?? "",
};
