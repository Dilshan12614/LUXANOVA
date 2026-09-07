const { cmd } = require("../command");
const yts = require("yt-search");

// =====================================================
// YOUTUBE SEARCH CACHE
// =====================================================

const searchCache = new Map();

const CACHE_TIME = 5 * 60 * 1000;
const MAX_RESULTS = 10;

// =====================================================
// CLEAN EXPIRED CACHE
// =====================================================

setInterval(() => {
  const now = Date.now();

  for (const [id, data] of searchCache.entries()) {
    if (now - data.time > CACHE_TIME) {
      searchCache.delete(id);
    }
  }
}, 60 * 1000);

// =====================================================
// GET QUOTED MESSAGE ID
// =====================================================

function getQuotedId(message) {
  return (
    message?.message?.extendedTextMessage?.contextInfo?.stanzaId ||
    message?.message?.imageMessage?.contextInfo?.stanzaId ||
    message?.message?.videoMessage?.contextInfo?.stanzaId ||
    message?.message?.documentMessage?.contextInfo?.stanzaId ||
    null
  );
}

// =====================================================
// YOUTUBE SEARCH
// =====================================================

cmd(
  {
    pattern: "yts",
    alias: ["ytsearch", "youtubesearch"],
    react: "🔎",
    desc: "Search YouTube videos",
    category: "search",
    filename: __filename,
  },

  async (danuwa, mek, m, { from, reply, q }) => {
    try {
      const query = String(q || "").trim();

      if (!query) {
        return reply(
          `❌ *Please enter a search query!*\n\n` +
          `📌 Example:\n` +
          `*.yts Ranja Hiruty*`
        );
      }

      const result = await yts(query);

      if (!result?.videos?.length) {
        return reply(
          `❌ *No YouTube results found!*\n\n` +
          `🔎 Query: ${query}`
        );
      }

      const videos = result.videos.slice(0, MAX_RESULTS);

      // =================================================
      // FORMAT
      // =================================================

      let text =
        `╭━━━〔 🎧 *YOUTUBE SEARCH* 〕━━━╮\n` +
        `┃ 🔎 *Query:* ${query}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

      videos.forEach((video, index) => {
        text +=
          `*${index + 1}. 🎵 ${video.title}*\n` +
          `⏱️ *Duration:* ${video.timestamp || "Unknown"}\n` +
          `👀 *Views:* ${
            video.views
              ? video.views.toLocaleString()
              : "Unknown"
          }\n` +
          `📺 *Channel:* ${
            video.author?.name || "Unknown"
          }\n` +
          `🔗 ${video.url}\n` +
          `────────────────────\n`;
      });

      text +=
        `\n💡 *Reply to this message with 1-${videos.length}*\n` +
        `to select a video.\n\n` +
        `✨ *Powered by LUXANOVA*`;

      // =================================================
      // SEND RESULT
      // =================================================

      const thumbnail = videos[0]?.thumbnail;

      let sent;

      if (thumbnail) {
        try {
          sent = await danuwa.sendMessage(
            from,
            {
              image: { url: thumbnail },
              caption: text,
            },
            {
              quoted: mek,
            }
          );
        } catch (error) {
          console.log("YTS thumbnail error:", error);

          sent = await danuwa.sendMessage(
            from,
            {
              text,
            },
            {
              quoted: mek,
            }
          );
        }
      } else {
        sent = await danuwa.sendMessage(
          from,
          {
            text,
          },
          {
            quoted: mek,
          }
        );
      }

      // =================================================
      // SAVE RESULT USING SENT MESSAGE ID
      // =================================================

      const resultMessageId = sent?.key?.id;

      if (resultMessageId) {
        searchCache.set(resultMessageId, {
          videos,
          query,
          time: Date.now(),
        });

        console.log(
          "✅ YTS result saved:",
          resultMessageId
        );
      }

      await danuwa.sendMessage(from, {
        react: {
          text: "✅",
          key: mek.key,
        },
      });

    } catch (error) {
      console.error("YTS ERROR:", error);

      await danuwa.sendMessage(from, {
        react: {
          text: "❌",
          key: mek.key,
        },
      });

      return reply(
        "❌ *YouTube Search Failed!*\n\nPlease try again later."
      );
    }
  }
);

// =====================================================
// NUMBER REPLY HANDLER
// =====================================================

cmd(
  {
    /*
     * IMPORTANT:
     * DO NOT use async here.
     *
     * index.js does:
     * handler.filter(...)
     *
     * without await.
     */

    filter: (replyText, data) => {
      try {
        const text = String(replyText || "").trim();

        // Only numbers
        if (!/^\d+$/.test(text)) {
          return false;
        }

        const number = Number(text);

        if (number < 1 || number > MAX_RESULTS) {
          return false;
        }

        // Must be a reply to another message
        const message = data?.message;

        if (!message) {
          return false;
        }

        const quotedId = getQuotedId(message);

        if (!quotedId) {
          return false;
        }

        // Check if quoted message is a YTS result
        const cached = searchCache.get(quotedId);

        if (!cached) {
          return false;
        }

        // Check expiry
        if (Date.now() - cached.time > CACHE_TIME) {
          searchCache.delete(quotedId);
          return false;
        }

        return true;

      } catch (error) {
        console.error("YTS FILTER ERROR:", error);
        return false;
      }
    },
  },

  async (danuwa, mek, m, { from, reply }) => {
    try {
      const text =
        mek?.message?.conversation ||
        mek?.message?.extendedTextMessage?.text ||
        "";

      const number = Number(String(text).trim());

      const quotedId = getQuotedId(mek);

      if (!quotedId) {
        return;
      }

      const cached = searchCache.get(quotedId);

      if (!cached) {
        return reply(
          `❌ *Search result expired or not found!*\n\n` +
          `Please search again using:\n` +
          `*.yts <query>*`
        );
      }

      const video = cached.videos[number - 1];

      if (!video) {
        return reply("❌ *Invalid selection.*");
      }

      // =================================================
      // SELECTED VIDEO
      // =================================================

      const response =
        `╭━━━〔 🎵 *SELECTED VIDEO* 〕━━━╮\n\n` +
        `🔢 *Number:* ${number}\n\n` +
        `🎬 *Title:* ${video.title}\n` +
        `⏱️ *Duration:* ${video.timestamp || "Unknown"}\n` +
        `👀 *Views:* ${
          video.views
            ? video.views.toLocaleString()
            : "Unknown"
        }\n` +
        `📺 *Channel:* ${
          video.author?.name || "Unknown"
        }\n\n` +
        `🔗 *YouTube URL:*\n${video.url}\n\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `✨ *Powered by LUXANOVA*`;

      await danuwa.sendMessage(
        from,
        {
          text: response,
        },
        {
          quoted: mek,
        }
      );

    } catch (error) {
      console.error("YTS SELECTION ERROR:", error);

      return reply(
        "❌ Error while selecting YouTube video."
      );
    }
  }
);
