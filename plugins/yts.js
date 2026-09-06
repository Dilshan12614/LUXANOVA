const { cmd } = require("../command");
const yts = require("yt-search");
const fg = require("api-dylux");

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

      if (!search || !search.videos || search.videos.length === 0) {
        return reply("*No results found on YouTube.* ❌");
      }

      const results = search.videos.slice(0, 10);

      // Save results for this chat
      ytsCache.set(from, {
        results: results,
        time: Date.now()
      });

      const formattedResults = results
        .map((v, i) => {
          return (
            `🎬 *${i + 1}. ${v.title}*\n` +
            `📅 ${v.ago} | ⌛ ${v.timestamp}\n` +
            `👁️ ${v.views.toLocaleString()} views\n` +
            `🔗 ${v.url}`
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
            url: "https://github.com/DANUWA-MD/DANUWA-MD/blob/main/images/yts.png?raw=true"
          },
          caption: caption
        },
        {
          quoted: mek
        }
      );

    } catch (error) {

      console.error("YTS SEARCH ERROR:", error);

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
    // IMPORTANT:
    // index.js calls filter(body, context)
    filter: (body, context) => {

      try {

        // Must be a number 1-10
        const text = String(body || "").trim();

        if (!/^(10|[1-9])$/.test(text)) {
          return false;
        }

        const mek = context?.message;

        if (!mek) {
          return false;
        }

        // Must be a REPLY message
        const quoted =
          mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
          return false;
        }

        // Find chat
        const from = mek.key?.remoteJid;

        if (!from) {
          return false;
        }

        // Check if this chat has an active YTS search
        const cached = ytsCache.get(from);

        if (!cached) {
          return false;
        }

        // Expire after 10 minutes
        if (Date.now() - cached.time > 10 * 60 * 1000) {
          ytsCache.delete(from);
          return false;
        }

        return true;

      } catch (error) {

        console.error("YTS FILTER ERROR:", error);
        return false;

      }
    }
  },

  async (danuwa, mek, m, { from, body, reply }) => {

    try {

      const number = parseInt(String(body).trim());

      const cached = ytsCache.get(from);

      if (!cached) {
        return reply(
          "*YTS search expired!* ⏰\n\n" +
          "Please use `.yts song name` again."
        );
      }

      // Check selected number
      if (
        number < 1 ||
        number > cached.results.length
      ) {
        return reply(
          `*Invalid number!* ❌\n\n` +
          `Please choose a number between *1 - ${cached.results.length}*.`
        );
      }

      const video = cached.results[number - 1];

      await reply(
        `⬇️ *Downloading...*\n\n` +
        `🎬 *${video.title}*\n\n` +
        `Please wait... ⏳`
      );

      console.log(
        `[YTS] Downloading: ${video.url}`
      );

      // api-dylux YouTube audio downloader
      const data = await fg.yta(video.url);

      if (!data) {
        return reply(
          "*Downloader returned no data.* ❌"
        );
      }

      if (!data.dl_url) {
        console.log("[YTS] Downloader response:", data);

        return reply(
          "*Could not get the download URL.* ❌"
        );
      }

      // Send audio
      await danuwa.sendMessage(
        from,
        {
          audio: {
            url: data.dl_url
          },
          mimetype: "audio/mpeg",
          fileName: `${video.title}.mp3`
        },
        {
          quoted: mek
        }
      );

      console.log(
        `[YTS] Download completed: ${video.title}`
      );

      // Remove cache after successful download
      ytsCache.delete(from);

    } catch (error) {

      console.error(
        "[YTS DOWNLOAD ERROR]",
        error
      );

      await reply(
        "*Download failed!* ❌\n\n" +
        `${error.message || "Unknown error"}`
      );
    }
  }
);
