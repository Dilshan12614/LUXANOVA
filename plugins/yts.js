const { cmd } = require("../command");
const yts = require("yt-search");

// User/message -> search results
const searchCache = new Map();

cmd(
  {
    pattern: "yts",
    alias: ["youtubesearch"],
    react: "🔎",
    desc: "Search YouTube videos",
    category: "search",
    filename: __filename,
  },

  async (
    danuwa,
    mek,
    m,
    {
      from,
      q,
      reply,
    }
  ) => {
    try {
      if (!q) {
        return reply("*Please provide a search query!* 🔍");
      }

      await reply("*Searching YouTube...* ⌛");

      const search = await yts(q);

      if (!search?.videos?.length) {
        return reply("*No results found on YouTube.* ❌");
      }

      const results = search.videos.slice(0, 10);

      // Save results for this chat
      searchCache.set(from, {
        results,
        time: Date.now(),
      });

      let text = `🔎 *YOUTUBE SEARCH*\n`;
      text += `━━━━━━━━━━━━━━━━━━\n`;
      text += `🔍 *Query:* ${q}\n\n`;

      results.forEach((v, i) => {
        text += `*${i + 1}.* ${v.title}\n`;
        text += `⏱️ ${v.timestamp || "Unknown"} | 👁️ ${Number(v.views || 0).toLocaleString()}\n`;
        text += `🔗 ${v.url}\n\n`;
      });

      text += `━━━━━━━━━━━━━━━━━━\n`;
      text += `📌 *Reply with a number 1-${results.length}*\n`;
      text += `Example: *1*`;

      await danuwa.sendMessage(
        from,
        {
          image: {
            url: "https://github.com/DANUWA-MD/DANUWA-MD/blob/main/images/yts.png?raw=true",
          },
          caption: text,
        },
        { quoted: mek }
      );

      // Delete cache after 10 minutes
      setTimeout(() => {
        searchCache.delete(from);
      }, 10 * 60 * 1000);

    } catch (err) {
      console.error("YTS ERROR:", err);
      reply("*YouTube search failed.* ❌");
    }
  }
);


// Number reply handler
cmd(
  {
    on: "body",
    filter: async (message) => {
      const text = message?.body?.trim();

      if (!/^(10|[1-9])$/.test(text)) {
        return false;
      }

      return true;
    },
  },

  async (
    danuwa,
    mek,
    m,
    {
      from,
      reply,
    }
  ) => {
    try {
      const cached = searchCache.get(from);

      if (!cached) {
        return false;
      }

      // Cache expires after 10 minutes
      if (Date.now() - cached.time > 10 * 60 * 1000) {
        searchCache.delete(from);
        return reply("*This search has expired.* ⏳\nPlease search again.");
      }

      const number = Number(mek.body.trim());
      const results = cached.results;

      if (number < 1 || number > results.length) {
        return reply(`*Please choose a number between 1-${results.length}.* 🔢`);
      }

      const selected = results[number - 1];

      await reply(
        `*Selected:* ${selected.title}\n\n` +
        `⏳ Preparing...\n` +
        `🔗 ${selected.url}`
      );

      /*
       * IMPORTANT:
       * Connect your authorised-media download function here.
       *
       * Do not use this to download copyrighted YouTube
       * content without permission.
       */

      await danuwa.sendMessage(
        from,
        {
          text:
            `🎬 *${selected.title}*\n\n` +
            `⏱️ Duration: ${selected.timestamp || "Unknown"}\n` +
            `👁️ Views: ${Number(selected.views || 0).toLocaleString()}\n\n` +
            `🔗 ${selected.url}`,
        },
        { quoted: mek }
      );

      // Remove after selection
      searchCache.delete(from);

    } catch (err) {
      console.error("YTS SELECT ERROR:", err);
      reply("*Something went wrong.* ❌");
    }
  }
);
