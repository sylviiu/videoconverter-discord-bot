const fs = require(`fs`);
const recursiveAssign = require(`../util/recursiveAssign`)

const defaults = {
    threads: 3,
    discordToken: `token goes here!`,
    ffmpeg: {
        targetCodec: `h264`,
        additionalInputArgs: [],
        additionalOutputArgs: []
    },
    messages: [
        `nice video you got there`
    ],
};


const end = !fs.existsSync(`./config.json`)

if(end) {
    fs.writeFileSync(`./config.json`, JSON.stringify(defaults, null, 4));
    console.log(`No config file was found! A config.json template file has been created for you. Please fill in the values and start again!`);
    return process.exit(1);
}

let config = {};

try {
    config = require(`../config.json`);
} catch(e) { config = {} }

if(process.argv.includes(`debug`)) console.log(`config:`, config)

module.exports = recursiveAssign(defaults, config);