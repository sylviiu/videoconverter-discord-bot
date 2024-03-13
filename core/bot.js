const { Client, Events, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const { ConvertQueue } = require(`./convertQueue`);
const requireDir = require(`../util/requireDir`);

const config = require(`./config`);

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ]
});

for(const event of requireDir(`./events`)) {
    bot.on(event.name, (...data) => event.module(bot, ...data));
};

bot.convertQueue = new ConvertQueue({
    threads: config.threads,
    ...config.ffmpeg,
});

return module.exports = bot;