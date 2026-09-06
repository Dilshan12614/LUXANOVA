const { cmd } = require("../command");
const yts = require("yt-search");

const ytsCache = new Map();

// =====================================================
// YOUTUBE SEARCH
// =====================================================

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
        return reply("*Please provide a search query!* 🔍\n\nExample:\n.yts alan walker");
      }

      await reply("*Searching YouTube...* ⌛");

      const search = await yts(q);

      if (!search || !search.videos || !search.videos.length) {
        return reply("*No results found on YouTube.* ❌");
      }

      const results = search.videos.slice(0, 10);

      const formattedResults = results
        .map((v, i) => {
          return (
            `🎬 *${i + 1}. ${v.title}*\n` +
            `⏱️ ${v.timestamp} | 👁️ ${Number(v.views || 0).toLocaleString()}`
          );
        })
        .join("\n\n");

      const caption =
`╭━━━〔 *YOUTUBE SEARCH* 〕━━━╮

🔎 *Query:* ${q}

${formattedResults}

╰━━━━━━━━━━━━━━━━━━━━╯

📥 *Reply with a number*

👉 *1 - ${results.length}*`;

      const sent = await danuwa.sendMessage(
        from,
        {
          image: {
            url: "https://github.com/DANUWA-MD/DANUWA-MD/blob/main/images/yts.png?raw=true",
          },
          caption,
        },
        {
          quoted: mek,
        }
      );

      // Save search + message ID
      ytsCache.set(from, {
        results,
        messageId: sent.key.id,
        time: Date.now(),
      });

    } catch (error) {
      console.error("[YTS SEARCH ERROR]", error);

      await reply(
        "*YouTube search failed!* ❌\n\n" +
        (error?.message || "Unknown error")
      );
    }
  }
);


// =====================================================
// NUMBER REPLY HANDLER
// =====================================================

cmd(
  {
    filter: (body, context) => {
      try {
        const text = String(body || "").trim();

        // Only 1 - 10
        if (!/^(10|[1-9])$/.test(text)) {
          return false;
        }

        const mek = context?.message;

        if (!mek) {
          return false;
        }

        const cached = ytsCache.get(mek.key?.remoteJid);

        if (!cached) {
          return false;
        }

        // Expire after 10 minutes
        if (Date.now() - cached.time > 10 * 60 * 1000) {
          ytsCache.delete(mek.key.remoteJid);
          return false;
        }

        // Must be a reply
        const contextInfo =
          mek.message?.extendedTextMessage?.contextInfo;

        if (!contextInfo) {
          return false;
        }

        const quotedMessage = contextInfo.quotedMessage;

        if (!quotedMessage) {
          return false;
        }

        // Check quoted message ID
        const quotedStanzaId = contextInfo.stanzaId;

        if (!quotedStanzaId) {
          return false;
        }

        if (quotedStanzaId !== cached.messageId) {
          return false;
        }

        return true;

      } catch (error) {
        console.error("[YTS FILTER ERROR]", error);
        return false;
      }
    },
  },

  async (danuwa, mek, m, { from, body, reply }) => {
    try {
      const number = parseInt(String(body).trim(), 10);

      const cached = ytsCache.get(from);

      if (!cached) {
        return reply(
          "*YTS search expired!* ⏰\n\n" +
          "Please use `.yts song name` again."
        );
      }

      if (number < 1 || number > cached.results.length) {
        return reply(
          `*Invalid number!* ❌\n\n` +
          `Please choose *1 - ${cached.results.length}*.`
        );
      }

      const video = cached.results[number - 1];

      await danuwa.sendMessage(
        from,
        {
          text:
`╭━━━〔 *SELECTED VIDEO* 〕━━━╮

🎬 *${video.title}*

⏱️ Duration: ${video.timestamp}
👁️ Views: ${Number(video.views || 0).toLocaleString()}

🔗 ${video.url}

╰━━━━━━━━━━━━━━━━━━━━╯`
        },
        {
          quoted: mek,
        }
      );

      // Delete cache after selection
      ytsCache.delete(from);

    } catch (error) {
      console.error("[YTS REPLY ERROR]", error);

      await reply(
        "*Something went wrong!* ❌"
      );
    }
  }
);
