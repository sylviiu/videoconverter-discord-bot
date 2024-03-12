# videoconverter-discord-bot
this bot will auto-convert videos that were uploaded to channels that were never embedded, primarily because twitter decided to switch their videos to the hevc codec (which discord will probably never support)

-----

## setup:

make sure you have nodejs v16.11.0 or newer installed -- this is the minimum required for this discord.js version

clone the project into a local directory, and cd to it, like so:

```bash
git clone https://github.com/sylviiu/videoconverter-discord-bot
cd videoconverter-discord-bot
```

install all the dependencies used by the bot:

```bash
npm i
```

run it once, this will generate a config file for you; make sure to fill in the variables accordingly! (get your discord bot token at [your application's bot entry](https://discord.com/developers/applications/)). once you've filled in the variables, running it again should work as intended!

```bash
node index
```

now every video that's uploaded to chat that does not embed (e.g., videos in the hevc codec) will now be converted to h264 (or whichever target codec you choose)!

(sidenote: for hardware acceleration, you can utilize `h264_vaapi` on linux or whichever is equivalent for your system; my system uses a radeon graphics card on windows, so i can utilize `h264_amf` -- nvidia users can use `h264_nvenc`, and so on.)