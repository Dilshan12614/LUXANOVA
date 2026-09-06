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
        return reply("*Please provide a search query!* 🔍");
      }

      await reply("*Searching YouTube for you...* ⌛");

      const search = await yts(q);

      if (!search?.videos?.length) {
        return reply("*No results found on YouTube.* ❌");
      }

      const results = search.videos.slice(0, 10);

      ytsCache.set(from, {
        results,
        time: Date.now(),
      });

      const formattedResults = results
        .map((v, i) => {
          return (
            `🎬 *${i + 1}. ${v.title}*\n` +
            `📅 ${v.ago} | ⌛ ${v.timestamp}\n` +
            `👁️ ${Number(v.views || 0).toLocaleString()} views`
          );
        })
        .join("\n\n");

      const caption =
`╭━━━〔 *YOUTUBE SEARCH* 〕━━━╮

🔎 *Query:* ${q}

${formattedResults}

╰━━━━━━━━━━━━━━━━━━━━╯

📥 *Reply to this message with a number*

👉 *1 - ${results.length}*`;

      await danuwa.sendMessage(
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

    } catch (error) {
      console.error("[YTS SEARCH ERROR]", error);

      await reply(
        "*YouTube search failed!* ❌\n\n" +
        (error.message || "Unknown error")
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

        if (!/^(10|[1-9])$/.test(text)) {
          return false;
        }

        const mek = context?.message;

        if (!mek) {
          return false;
        }

        const quoted =
          mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
          return false;
        }

        const from = mek.key?.remoteJid;

        if (!from) {
          return false;
        }

        const cached = ytsCache.get(from);

        if (!cached) {
          return false;
        }

        if (Date.now() - cached.time > 10 * 60 * 1000) {
          ytsCache.delete(from);
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

      // Selected result
      await danuwa.sendMessage(
        from,
        {
          text:
`╭━━━〔 *SELECTED VIDEO* 〕━━━╮

🎬 *${video.title}*

⏱️ Duration: ${video.timestamp}
👁️ Views: ${Number(video.views || 0).toLocaleString()}

🔗 ${video.url}

╰━━━━━━━━━━━━━━━━━━━━╯

⚠️ Direct YouTube downloading is not handled by this plugin.`
        },
        {
          quoted: mek,
        }
      );

      ytsCache.delete(from);

    } catch (error) {
      console.error("[YTS REPLY ERROR]", error);

      await reply(
        "*Something went wrong!* ❌"
      );
    }
  }
);
