const { Client, Events, GatewayIntentBits } = require('discord.js');
const config = require('./core/config');
const bot = require(`./core/bot`);

bot.once(Events.ClientReady, () => {
    console.log(`Logged in as "${bot.user.username}"`);
});

bot.login(config.discordToken);