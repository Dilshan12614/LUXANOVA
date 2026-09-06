const { cmd } = require("../command");
const yts = require("yt-search");
const fg = require("api-dylux");

const ytsCache = new Map();

cmd(
  {
    pattern: "yts",
    alias: ["youtubesearch"],
    react: "🔎",
    desc: "Search YouTube videos",
    category: "search",
    filename: __filename,
  },

  async (danuwa, mek, m, { from, q, reply }) => {
    try {
      if (!q) {
        return reply("*Please provide a search query!* 🔍");
      }

      reply("*Searching YouTube for you...* ⌛");

      const search = await yts(q);

      if (!search || !search.videos || search.videos.length === 0) {
        return reply("*No results found on YouTube.* ❌");
      }

      const results = search.videos.slice(0, 10);

      // Save results for this chat
      ytsCache.set(from, {
        results,
        time: Date.now(),
      });

      const formattedResults = results
        .map(
          (v, i) =>
            `🎬 *${i + 1}. ${v.title}*\n📅 ${v.ago} | ⌛ ${v.timestamp} | 👁️ ${v.views.toLocaleString()} views`
        )
        .join("\n\n");

      const caption = `╭━━━〔 *YOUTUBE SEARCH* 〕━━━╮

🔎 *Query:* ${q}

${formattedResults}

╰━━━━━━━━━━━━━━━━━━━━╯

📥 *Reply to this message with a number*
👉 *1 - 10*`;

      await danuwa.sendMessage(
        from,
        {
          image: {
            url: "https://github.com/DANUWA-MD/DANUWA-MD/blob/main/images/yts.png?raw=true",
          },
          caption,
        },
        { quoted: mek }
      );
    } catch (err) {
      console.error("YTS ERROR:", err);
      reply("*An error occurred while searching YouTube.* ❌");
    }
  }
);


// Number reply handler
cmd(
  {
    pattern: "^[1-9][0-9]?$",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename,
  },

  async (danuwa, mek, m, { from, reply }) => {
    try {
      const number = parseInt(mek.body?.trim());

      if (!number) return;

      const cached = ytsCache.get(from);

      if (!cached) {
        return reply(
          "*No active YouTube search found.*\n\nPlease use `.yts song name` first. 🔎"
        );
      }

      // Cache expires after 10 minutes
      if (Date.now() - cached.time > 10 * 60 * 1000) {
        ytsCache.delete(from);

        return reply(
          "*This search has expired.* ⏰\n\nPlease search again using `.yts song name`."
        );
      }

      if (number < 1 || number > cached.results.length) {
        return reply(
          `*Invalid number!* ❌\n\nPlease select a number between *1 - ${cached.results.length}*.`
        );
      }

      const video = cached.results[number - 1];

      await reply(
        `*Downloading...* ⬇️\n\n🎬 *${video.title}*`
      );

      // api-dylux YouTube audio downloader
      const data = await fg.yta(video.url);

      if (!data || !data.dl_url) {
        return reply("*Unable to get the download link.* ❌");
      }

      await danuwa.sendMessage(
        from,
        {
          audio: {
            url: data.dl_url,
          },
          mimetype: "audio/mpeg",
          fileName: `${video.title}.mp3`,
        },
        { quoted: mek }
      );

      await reply("*Downloaded successfully! ✅*");

    } catch (err) {
      console.error("YTS DOWNLOAD ERROR:", err);

      reply(
        `*Download failed!* ❌\n\n${err.message || "Unknown error"}`
      );
    }
  }
);
