const { cmd } = require("../command");
const yts = require("yt-search");

// =====================================================
// YTS RESULT CACHE
// =====================================================

const ytsCache = new Map();

const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const MAX_RESULTS = 10;

// =====================================================
// CLEAN OLD CACHE
// =====================================================

setInterval(() => {
  const now = Date.now();

  for (const [key, data] of ytsCache.entries()) {
    if (now - data.time > CACHE_TIME) {
      ytsCache.delete(key);
    }
  }
}, 60 * 1000);

// =====================================================
// GET TEXT FROM MESSAGE
// =====================================================

function getMessageText(mek) {
  try {
    return (
      mek?.message?.conversation ||
      mek?.message?.extendedTextMessage?.text ||
      mek?.message?.imageMessage?.caption ||
      mek?.message?.videoMessage?.caption ||
      ""
    ).trim();
  } catch {
    return "";
  }
}

// =====================================================
// GET QUOTED MESSAGE ID
// =====================================================

function getQuotedId(mek) {
  try {
    return (
      mek?.message?.extendedTextMessage?.contextInfo?.stanzaId ||
      mek?.message?.imageMessage?.contextInfo?.stanzaId ||
      mek?.message?.videoMessage?.contextInfo?.stanzaId ||
      null
    );
  } catch {
    return null;
  }
}

// =====================================================
// YOUTUBE SEARCH COMMAND
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
          `*.yts Lil Peep*`
        );
      }

      // Search reaction
      await danuwa.sendMessage(from, {
        react: {
          text: "🔎",
          key: mek.key,
        },
      });

      // =================================================
      // SEARCH YOUTUBE
      // =================================================

      const result = await yts(query);

      if (!result?.videos?.length) {
        return reply(
          `❌ *No YouTube results found!*\n\n` +
          `🔎 Query: ${query}`
        );
      }

      const videos = result.videos.slice(0, MAX_RESULTS);

      // =================================================
      // FORMAT RESULTS
      // =================================================

      let text = "";

      text += `╭━━━〔 🎧 *YOUTUBE SEARCH* 〕━━━╮\n`;
      text += `┃ 🔎 *Query:* ${query}\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

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
        `\n💡 *Reply with a number 1-${videos.length} ` +
        `to select a video.*\n\n`;

      text += `✨ *Powered by LUXANOVA*`;

      // =================================================
      // SEND SEARCH MESSAGE
      // =================================================

      const thumbnail =
        videos[0]?.thumbnail ||
        videos[0]?.image;

      let sent;

      if (thumbnail) {
        try {
          sent = await danuwa.sendMessage(
            from,
            {
              image: {
                url: thumbnail,
              },
              caption: text,
            },
            {
              quoted: mek,
            }
          );
        } catch (e) {
          console.log("Thumbnail error:", e);

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
      // SAVE RESULTS
      // =================================================

      const messageId = sent?.key?.id;

      ytsCache.set(from, {
        time: Date.now(),
        messageId,
        videos,
        query,
      });

      // Success reaction
      await danuwa.sendMessage(from, {
        react: {
          text: "✅",
          key: mek.key,
        },
      });

    } catch (error) {
      console.error("YTS Search Error:", error);

      await danuwa.sendMessage(from, {
        react: {
          text: "❌",
          key: mek.key,
        },
      });

      return reply(
        `❌ *YouTube Search Failed!*\n\n` +
        `Please try again later.`
      );
    }
  }
);

// =====================================================
// NUMBER REPLY HANDLER
// =====================================================

cmd(
  {
    filter: async (mek) => {
      try {
        const text = getMessageText(mek);

        // Only numbers
        if (!/^\d+$/.test(text)) {
          return false;
        }

        const from = mek?.key?.remoteJid;

        if (!from) {
          return false;
        }

        const data = ytsCache.get(from);

        if (!data) {
          return false;
        }

        // Must be replying to the YTS result message
        const quotedId = getQuotedId(mek);

        if (data.messageId && quotedId !== data.messageId) {
          return false;
        }

        const number = Number(text);

        return (
          number >= 1 &&
          number <= data.videos.length
        );

      } catch (error) {
        console.error("YTS Filter Error:", error);
        return false;
      }
    },
  },

  async (danuwa, mek, m, { from, reply }) => {
    try {
      const text = getMessageText(mek);
      const number = Number(text);

      const data = ytsCache.get(from);

      if (!data) {
        return reply(
          `❌ *Search results expired!*\n\n` +
          `Please search again using *.yts <query>*`
        );
      }

      const video = data.videos[number - 1];

      if (!video) {
        return reply("❌ Invalid selection.");
      }

      // =================================================
      // SELECTED VIDEO
      // =================================================

      let response =
        `╭━━━〔 🎵 *SELECTED VIDEO* 〕━━━╮\n\n` +
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
        `🔗 *URL:*\n${video.url}\n\n` +
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
      console.error("YTS Selection Error:", error);
      return reply("❌ Error while selecting YouTube result.");
    }
  }
);
