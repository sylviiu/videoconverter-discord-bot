const { AttachmentBuilder } = require('discord.js');
const config = require('../core/config');

module.exports = async (bot, msg) => {
    if(msg.author.id == bot.user.id) return console.log(`not looping THIS time`)

    if(msg.attachments.size) {
        const videosNotEmbedded = msg.attachments.map(Object).filter(o => o.contentType.startsWith(`video/`) && !o.height && !o.width);
        console.log(`message in ${msg.channel.guild.id} -- ${msg.attachments.size} attachment(s), ${videosNotEmbedded.length} video(s) without an embed.`, videosNotEmbedded);

        for(const attachment of videosNotEmbedded) {
            try {
                msg.react('👀');
            } catch(e) {}
    
            const fileName = attachment.name.split(`.`).slice(0, -1).join(`.`) || attachment.name;
    
            bot.convertQueue.add({ url: attachment.url }).then(({ probeData, stream }) => {
                const videoStream = probeData?.streams?.find(o => o.codec_type == `video`);
    
                msg.channel.send({
                    content: `Attachment ${attachment.name} (${videoStream.codec_name} -> ${bot.convertQueue.baseTargetCodec})`,
                    files: [ new AttachmentBuilder(stream, { name: `${fileName}.mp4` }) ],
                    reply: {
                        failIfNotExists: false,
                        messageReference: msg,
                    },
                });
            }).catch(e => {
                console.error(`failed converting (at message): ${e}`)
                msg.channel.send({
                    content: `Failed to convert attachment ${attachment.name} (${attachment.contentType}): \`${e}\``,
                    reply: {
                        failIfNotExists: false,
                        messageReference: msg,
                    },
                });
            })
        }
    } else console.log(`no attachments? (length: ${msg.attachments.size})`)
}