const { cmd } = require("../command");
const yts = require("yt-search");

// =====================================================
// YOUTUBE RESULT CACHE
// =====================================================

const searchCache = new Map();

const CACHE_TIME = 5 * 60 * 1000;
const MAX_RESULTS = 10;

// =====================================================
// AUTO DELETE OLD RESULTS
// =====================================================

setInterval(() => {
  const now = Date.now();

  for (const [messageId, data] of searchCache.entries()) {
    if (now - data.time > CACHE_TIME) {
      searchCache.delete(messageId);
    }
  }
}, 60 * 1000);

// =====================================================
// GET MESSAGE TEXT
// =====================================================

function getText(message) {
  return (
    message?.message?.conversation ||
    message?.message?.extendedTextMessage?.text ||
    message?.message?.imageMessage?.caption ||
    message?.message?.videoMessage?.caption ||
    ""
  ).trim();
}

// =====================================================
// GET QUOTED MESSAGE ID
// =====================================================

function getQuotedId(message) {
  return (
    message?.message?.extendedTextMessage?.contextInfo?.stanzaId ||
    message?.message?.imageMessage?.contextInfo?.stanzaId ||
    message?.message?.videoMessage?.contextInfo?.stanzaId ||
    null
  );
}

// =====================================================
// YTS COMMAND
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

      // ===============================================
      // SEARCH REACTION
      // ===============================================

      await danuwa.sendMessage(from, {
        react: {
          text: "🔎",
          key: mek.key,
        },
      });

      // ===============================================
      // YOUTUBE SEARCH
      // ===============================================

      const result = await yts(query);

      if (!result?.videos?.length) {
        return reply(
          `❌ *No YouTube results found!*\n\n` +
          `🔎 Query: ${query}`
        );
      }

      const videos = result.videos.slice(0, MAX_RESULTS);

      // ===============================================
      // CREATE RESULT MESSAGE
      // ===============================================

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
        `\n📌 *Reply to this message with 1-${videos.length}*\n` +
        `to select a video.\n\n`;

      text += `✨ *Powered by LUXANOVA*`;

      // ===============================================
      // SEND MESSAGE
      // ===============================================

      let sentMessage;

      const thumbnail =
        videos[0]?.thumbnail ||
        videos[0]?.image;

      if (thumbnail) {
        try {
          sentMessage = await danuwa.sendMessage(
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
        } catch (error) {
          console.log("Thumbnail failed:", error);

          sentMessage = await danuwa.sendMessage(
            from,
            {
              text: text,
            },
            {
              quoted: mek,
            }
          );
        }
      } else {
        sentMessage = await danuwa.sendMessage(
          from,
          {
            text: text,
          },
          {
            quoted: mek,
          }
        );
      }

      // ===============================================
      // SAVE BY MESSAGE ID
      // ===============================================

      const messageId = sentMessage?.key?.id;

      if (messageId) {
        searchCache.set(messageId, {
          videos: videos,
          query: query,
          chatId: from,
          time: Date.now(),
        });

        console.log(
          `✅ YTS cache saved: ${messageId}`
        );
      }

      // ===============================================
      // SUCCESS REACTION
      // ===============================================

      await danuwa.sendMessage(from, {
        react: {
          text: "✅",
          key: mek.key,
        },
      });

    } catch (error) {
      console.error("YTS Search Error:", error);

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
        const text = getText(mek);

        // ONLY numbers
        if (!/^[0-9]+$/.test(text)) {
          return false;
        }

        const number = Number(text);

        if (number < 1 || number > MAX_RESULTS) {
          return false;
        }

        // Must be a reply
        const quotedId = getQuotedId(mek);

        if (!quotedId) {
          return false;
        }

        // Check exact YTS message
        const cached = searchCache.get(quotedId);

        if (!cached) {
          return false;
        }

        // Check expiry
        if (Date.now() - cached.time > CACHE_TIME) {
          searchCache.delete(quotedId);
          return false;
        }

        // Store selected info on message
        mek.__ytsSelection = {
          number,
          cache: cached,
        };

        return true;

      } catch (error) {
        console.error("YTS Filter Error:", error);
        return false;
      }
    },
  },

  async (danuwa, mek, m, { from, reply }) => {
    try {
      // ===============================================
      // GET DATA FROM FILTER
      // ===============================================

      const selection = mek.__ytsSelection;

      if (!selection) {
        return;
      }

      const { number, cache } = selection;

      const video = cache.videos[number - 1];

      if (!video) {
        return reply("❌ Invalid selection.");
      }

      // ===============================================
      // SELECTED VIDEO
      // ===============================================

      const text =
        `╭━━━〔 🎵 *SELECTED VIDEO* 〕━━━╮\n\n` +
        `🔢 *Number:* ${number}\n` +
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
          text: text,
        },
        {
          quoted: mek,
        }
      );

    } catch (error) {
      console.error("YTS Selection Error:", error);
      return reply("❌ Error selecting YouTube video.");
    }
  }
);
