const { cmd, commands } = require("../command");
const yts = require("yt-search");
const { ytmp3 } = require("@vreden/youtube_scraper");

cmd({
    pattern: "song",
    react: "🎶",
    desc: "Download Song",
    category: "download",
    filename: __filename,
},
async (danuwa, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ *Please provide a song name or YouTube link*");

        const search = await yts(q);
        if (!search.videos.length) return reply("❌ *Song not found*");

        const data = search.videos[0];
        const url = data.url;

        let desc = `
*🎬 SONG DOWNLOADER*

*Title:* ${data.title}
*Duration:* ${data.timestamp}
*Uploaded:* ${data.ago}
*Views:* ${data.views.toLocaleString()}
*Link:* ${data.url}
`;

        await danuwa.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

        const quality = "192";
        const songData = await ytmp3(url, quality);

        if(!songData ||!songData.download ||!songData.download.url) {
            return reply("❌ *Download link not found. Try another song*")
        }

        let durationParts = data.timestamp.split(":").map(Number);
        let totalSeconds = durationParts.length === 3? durationParts[0]*3600 + durationParts[1]*60 + durationParts[2] : durationParts[0]*60 + durationParts[1];

        if (totalSeconds > 1800) {
            return reply("⏳ *Sorry, audio files longer than 30 minutes are not supported.*");
        }

        await danuwa.sendMessage(from, { audio: { url: songData.download.url }, mimetype: "audio/mpeg" }, { quoted: mek });

        await danuwa.sendMessage(from, {
            document: { url: songData.download.url },
            mimetype: "audio/mpeg",
            fileName: `${data.title}.mp3`,
            caption: `🎶 *${data.title}*`
        }, { quoted: mek });

        return reply("✅ *Done*");

    } catch (e) {
        console.log(e);
        reply(`❌ *Error:* ${e.message} 😞`);
    }
});
