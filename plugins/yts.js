const { cmd } = require("../command");
const yts = require("yt-search");
const { ytmp3 } = require("@vreden/youtube_scraper");

let searchCache = {};

cmd({
  pattern: "yts",
  alias: ["yts", "youtubesearch", "song"], // song කියලත් වැඩ
  react: "🔎",
  desc: "Search & Download YouTube song",
  category: "downloader",
  filename: __filename,
}, async (danuwa, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("*උදා:.yts despacito*");

    await reply("*Searching...* 🔍");
    const search = await yts(q);
    if (!search.videos.length) return reply("*Results නෑ* ☹️");

    const results = search.videos.slice(0, 10);
    searchCache[from] = results;

    let list = results.map((v, i) =>
      `🎬 *${i + 1}.* ${v.title}\n⌛ ${v.timestamp}`
    ).join("\n\n");

    await danuwa.sendMessage(from, {
      image: { url: "https://github.com/DANUWA-MD/DANUWA-MD/blob/main/images/yts.png?raw=true" },
      caption: `*Your youtube search results*\n─────────────────────────\n🔎 *Query*: ${q}\n\n${list}\n\n*Reply කරන්න number එක: උදා 3*`
    }, { quoted: mek });

    const response = await danuwa.waitForMessage(from, 30000);
    if (!response) return;

    let num = parseInt(response.body);
    if (!num || num < 1 || num > 10) return;

    let selected = searchCache[from][num - 1];
    await reply(`*Downloading:* ${selected.title} ⬇️`);

    let { url, title } = await ytmp3(selected.url);
    await danuwa.sendMessage(from, {
      audio: { url },
      mimetype: 'audio/mpeg',
      fileName: title + ".mp3"
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    reply("*Error: " + e.message + "*");
  }
});
