const child_process = require('child_process');

const path = {
    ffmpeg: null,
    ffprobe: null
};

try {
    path.ffmpeg = require('ffmpeg-static')
} catch(e) {
    console.log(`FFmpeg static not installed; finding system binary`)
    try {
        path.ffmpeg = child_process.execSync(`which ffmpeg`).toString('utf-8').trim();
    } catch(e) {
        console.error(`FFmpeg not installed.`);
        process.exit(1)
    }
}

try {
    path.ffprobe = require('ffprobe-static').path
} catch(e) {
    console.log(`FFprobe static not installed; finding system binary`)
    try {
        path.ffprobe = child_process.execSync(`which ffprobe`).toString('utf-8').trim();
    } catch(e) {
        console.error(`FFprobe not installed.`);
        process.exit(1)
    }
}

console.log(`paths`, path)

class ConvertQueue {
    constructor(threads, targetCodec) {
        const codecs = child_process.execFileSync(path.ffmpeg, [`-codecs`, `-hide_banner`, `loglevel`, `error`]).toString().split(`-------`).slice(1).map(s => s.trim()).join(`-------`).trim();

        this.decodeCodecs = codecs.split(`\n`).filter(s => s[3] == `V` && s[1] == `D`).map(s => ({ [s.split(` `)[2]]: s.split(` `).slice(3).join(` `).trim() })).reduce((a,b) => ({ ...a, ...b }), {})
        this.encodeCodecs = codecs.split(`\n`).filter(s => s[3] == `V` && s[2] == `E`).map(s => ({ [s.split(` `)[2]]: s.split(` `).slice(3).join(` `).trim() })).reduce((a,b) => ({ ...a, ...b }), {})

        this.threads = isNaN(threads) ? 1 : threads;
        this.targetCodec = (this.encodeCodecs[targetCodec.split(`_`)[0]] && (targetCodec.includes(`_`) ? this.encodeCodecs[targetCodec.split(`_`)[0]].includes(targetCodec) : true)) ? targetCodec : `h264`;
        this.baseTargetCodec = this.targetCodec.split(`_`)[0];

        if(this.targetCodec != targetCodec) console.warn(`Codec "${targetCodec}" not selected for target; defaulted to ${this.targetCodec} (likely not an option)`, this.encodeCodecs);

        return this;
    }

    queue = {
        pending: [],
        active: []
    };

    startQueue() {
        while((this.queue.active.length < this.threads) && this.queue.pending.length) {
            const started = this.startNext();

            if(started) {
                console.log(`started next in queue; ${this.queue.active.length}/${this.threads} (${this.queue.pending.length} pending)`);
            } else {
                console.log(`did not start next, assuming empty; breaking loop`);
                break;
            }
        }
    }

    async run({ id, url, res, rej }) {
        const next = () => {
            const existingIndex = this.queue.active.findIndex(o => o.id == id);
            if(existingIndex != -1) this.queue.active.splice(existingIndex, 1);
            this.startNext();
        }

        try {
            const probe = child_process.spawn(path.ffprobe, [`-v`, `quiet`, `-print_format`, `json`, `-show_format`, `-show_streams`, `${url}`]);

            let probeData = ``;

            probe.stdout.on(`data`, m => probeData += m.toString().trim());
            //probe.stderr.on(`data`, m => probeData += m.toString().trim());

            probe.stderr.on(`data`, m => {
                console.log(`[${id}]: ${m.toString('utf-8').trim()}`)
            })

            probe.once(`error`, e => {
                console.error(`[${id}] failed probing (error handler) -- ${e}`)
                rej(`[${id}] failed probing (error handler) -- ${e}`)
            });

            probe.once(`close`, (code) => {
                if(code) {
                    console.error(`[${id}] failed probing -- exit code ${code}`);
                    console.log(probeData);
                    rej(`[${id}] failed probing -- exit code ${code}`);
                } else {
                    try {
                        probeData = JSON.parse(probeData)
                    } catch(e) {}

                    const args = [`-i`, `${url}`, `-f`, `mp4`, `-c:v`, `${this.targetCodec}`, `-movflags`, `frag_keyframe+empty_moov`, `-`];

                    console.log(`args: "${args.join(`" "`)}"`)

                    const proc = child_process.spawn(path.ffmpeg, args);
        
                    proc.once(`close`, (code) => {
                        console.log(`[${id}] ffmpeg closed all stdio with code ${code}`);
                        next();
                    });
        
                    proc.once(`error`, e => {
                        console.error(`[${id}] failed converting (from FFmpeg) -- ${e}`);
                        rej(`[${id}] failed to convert (from FFmpeg): ${e}`);
                        next();
                    });
        
                    proc.once(`exit`, code => {
                        console.log(`[${id}] ffmpeg exited with code ${code}`);
                        next();
                    });
        
                    proc.stderr.on(`data`, m => {
                        console.log(`[${id}] LOG: ${m.toString('utf-8').trim()}`);
                    });
        
                    proc.once('spawn', () => {
                        res({
                            probeData: probeData,
                            stream: proc.stdout
                        });
                    });
                }
            })
        } catch(e) {
            console.error(`[${id}] failed converting ${id} (${url}): ${e}`);
            rej(`[${id}] failed to convert: ${e}`);
        }
    }

    startNext() {
        console.log(this.queue)
        if(this.queue.pending[0]) {
            const obj = this.queue.pending.splice(0, 1)[0];
            this.queue.active.push(obj);
            console.log(`starting next:`, obj)
            this.run(obj);
            return true;
        } else {
            return false;
        }
    }

    forceStart(id) {
        const pending = this.queue.pending;

        if(!id) id = pending[0]?.id;
        const index = pending.findIndex(o => o.id == id);

        if(index != -1) {
            pending.unshift(pending.splice(index, 1)[0]);
            this.startNext();
        }
    }

    add(obj) {
        const promise = new Promise(async (res, rej) => {
            const content = {
                ...obj,
                id: `${Date.now()}`,
                res, rej
            };

            this.queue.pending.push(content);
            console.log(`added id ${content.id} with url ${content.url}`);
            this.startQueue();
        });

        return promise;
    }
}

module.exports = { ConvertQueue, path }