const { cmd, replyHandlers } = require("../command");
const axios = require("axios");
const yts = require("yt-search");

// =====================================================
// YTS RESULT CACHE
// =====================================================

const searchCache = new Map();

const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const MAX_RESULTS = 5;

// =====================================================
// HELPERS
// =====================================================

function cleanFileName(name) {
  return String(name || "YouTube Video")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function getQuotedStanzaId(mek) {
  try {
    return (
      mek.message?.extendedTextMessage?.contextInfo?.stanzaId ||
      mek.message?.imageMessage?.contextInfo?.stanzaId ||
      mek.message?.videoMessage?.contextInfo?.stanzaId ||
      mek.message?.conversation?.contextInfo?.stanzaId ||
      null
    );
  } catch {
    return null;
  }
}

// =====================================================
// YOUTUBE SEARCH
// =====================================================

cmd(
  {
    pattern: "yts",
    alias: ["youtubesearch", "ytsearch"],
    react: "🔎",
    desc: "Search YouTube and download by number reply",
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
      sender
    }
  ) => {
    try {
      const query = q?.trim();

      if (!query) {
        return reply(
          "❌ *Search එකක් දෙන්න.*\n\n" +
          "📌 Example:\n" +
          "`.yts Alan Walker Faded`"
        );
      }

      await reply("🔎 *YouTube search කරමින්...*");

      const result = await yts(query);

      if (!result || !result.videos || result.videos.length === 0) {
        return reply("❌ *YouTube results හම්බුනේ නැහැ.*");
      }

      const videos = result.videos.slice(0, MAX_RESULTS);

      let text =
        "╭━━━〔 🔎 *YOUTUBE SEARCH* 〕━━━╮\n\n";

      videos.forEach((video, index) => {
        text +=
          `*${index + 1}.* 🎬 ${video.title}\n` +
          `   ⏱️ ${video.timestamp || "Unknown"}\n` +
          `   👤 ${video.author?.name || "Unknown"}\n\n`;
      });

      text +=
        "╰━━━━━━━━━━━━━━━━━━━━╯\n\n" +
        "📥 *Download කරන්න number එක reply කරන්න.*\n" +
        "👉 *Example: 1*\n\n" +
        "⏳ *Selection එක විනාඩි 5ක් valid.*";

      // Send result message
      const sent = await danuwa.sendMessage(
        from,
        {
          text,
        },
        {
          quoted: mek,
        }
      );

      // Save results against sender + chat
      const cacheKey = `${from}:${sender}`;

      searchCache.set(cacheKey, {
        messageId: sent.key.id,
        videos,
        time: Date.now(),
      });

      // Cleanup after 5 minutes
      setTimeout(() => {
        const data = searchCache.get(cacheKey);

        if (
          data &&
          Date.now() - data.time >= CACHE_TIME
        ) {
          searchCache.delete(cacheKey);
        }
      }, CACHE_TIME + 1000);

    } catch (error) {
      console.error("YTS Search Error:", error);

      return reply(
        "❌ *YouTube search කරන්න බැරි වුණා.*\n\n" +
        "ටිකකින් නැවත try කරන්න."
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
    // No pattern = reply handler
    filter: (text, { sender, message }) => {
      try {
        if (!/^[1-5]$/.test(String(text).trim())) {
          return false;
        }

        const from = message.key.remoteJid;
        const cacheKey = `${from}:${sender}`;

        const data = searchCache.get(cacheKey);

        if (!data) return false;

        // Check 5 minute expiry
        if (Date.now() - data.time > CACHE_TIME) {
          searchCache.delete(cacheKey);
          return false;
        }

        // Must actually reply to the YTS result message
        const quotedId = getQuotedStanzaId(message);

        if (!quotedId) return false;

        return quotedId === data.messageId;

      } catch (e) {
        return false;
      }
    },

    desc: "Download selected YouTube result by number",
    category: "download",
    filename: __filename,
  },

  async (
    danuwa,
    mek,
    m,
    {
      from,
      body,
      sender,
      reply
    }
  ) => {
    const cacheKey = `${from}:${sender}`;
    const data = searchCache.get(cacheKey);

    if (!data) {
      return reply(
        "❌ *මේ selection එක expire වෙලා.*\n\n" +
        "නැවත `.yts song name` කරන්න."
      );
    }

    try {
      const number = parseInt(String(body).trim());

      if (
        isNaN(number) ||
        number < 1 ||
        number > data.videos.length
      ) {
        return reply("❌ *1 - 5 අතර number එකක් reply කරන්න.*");
      }

      const selected = data.videos[number - 1];

      if (!selected || !selected.url) {
        return reply("❌ *Selected video එක හම්බුනේ නැහැ.*");
      }

      // Delete cache after selection
      searchCache.delete(cacheKey);

      await reply(
        `⏳ *Downloading...*\n\n` +
        `🎬 *${selected.title}*\n` +
        `⏱️ ${selected.timestamp || "Unknown"}`
      );

      // =================================================
      // YOUTUBE MP4 API
      // =================================================

      const api =
        `https://api.vreden.my.id/api/ytmp4?url=` +
        encodeURIComponent(selected.url);

      const response = await axios.get(api, {
        timeout: 60000,
      });

      const result = response.data?.result;

      if (!result) {
        return reply(
          "❌ *Video download information හම්බුනේ නැහැ.*"
        );
      }

      const videoUrl =
        result.download ||
        result.url ||
        result.video ||
        result.mp4;

      const title =
        result.title ||
        selected.title ||
        "YouTube Video";

      if (!videoUrl) {
        return reply(
          "❌ *Download URL එකක් හම්බුනේ නැහැ.*"
        );
      }

      await reply(
        "📥 *Video file එක WhatsApp එකට prepare කරමින්...*"
      );

      // =================================================
      // DOWNLOAD VIDEO
      // =================================================

      const videoResponse = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 180000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const buffer = Buffer.from(videoResponse.data);

      if (!buffer || buffer.length === 0) {
        return reply(
          "❌ *Video file එක empty.*"
        );
      }

      const fileName =
        cleanFileName(title) + ".mp4";

      // =================================================
      // SEND VIDEO
      // =================================================

      await danuwa.sendMessage(
        from,
        {
          video: buffer,
          mimetype: "video/mp4",
          fileName,
          caption:
            `╭━━━〔 🎬 *LUXANOVA* 〕━━━╮\n\n` +
            `📌 *${title}*\n` +
            `⏱️ ${selected.timestamp || "Unknown"}\n` +
            `📥 *Downloaded Successfully* ✅\n\n` +
            `╰━━━━━━━━━━━━━━━━━━━━╯`,
        },
        {
          quoted: mek,
        }
      );

    } catch (error) {
      console.error(
        "YTS Number Download Error:",
        error?.response?.data || error
      );

      return reply(
        "❌ *Video download කරන්න බැරි වුණා.*\n\n" +
        "• Video එක public ද බලන්න\n" +
        "• වෙනත් result එකක් try කරන්න\n" +
        "• ටිකකින් නැවත try කරන්න"
      );
    }
  }
);

// =====================================================
// DIRECT YOUTUBE URL DOWNLOADER
// =====================================================

cmd(
  {
    pattern: "ytdl",
    alias: ["ytv", "ytvideo"],
    react: "📥",
    desc: "Download YouTube video from URL",
    category: "download",
    filename: __filename,
  },

  async (
    danuwa,
    mek,
    m,
    {
      from,
      q,
      reply
    }
  ) => {
    try {
      const url = q?.trim();

      if (!url) {
        return reply(
          "❌ *YouTube link එකක් දෙන්න.*\n\n" +
          "📌 Example:\n" +
          "`.ytdl https://youtu.be/xxxxx`"
        );
      }

      if (
        !url.includes("youtube.com") &&
        !url.includes("youtu.be")
      ) {
        return reply(
          "❌ *Valid YouTube URL එකක් දෙන්න.*"
        );
      }

      await reply(
        "⏳ *YouTube video download කරමින්...*"
      );

      const api =
        `https://api.vreden.my.id/api/ytmp4?url=` +
        encodeURIComponent(url);

      const response = await axios.get(api, {
        timeout: 60000,
      });

      const result = response.data?.result;

      if (!result) {
        return reply(
          "❌ *Video එක download information හම්බුනේ නැහැ.*"
        );
      }

      const videoUrl =
        result.download ||
        result.url ||
        result.video ||
        result.mp4;

      const title =
        result.title || "YouTube Video";

      if (!videoUrl) {
        return reply(
          "❌ *Download URL එකක් හම්බුනේ නැහැ.*"
        );
      }

      const video = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 180000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const buffer = Buffer.from(video.data);

      if (!buffer.length) {
        return reply(
          "❌ *Video file එක empty.*"
        );
      }

      await danuwa.sendMessage(
        from,
        {
          video: buffer,
          mimetype: "video/mp4",
          fileName:
            cleanFileName(title) + ".mp4",
          caption:
            `🎬 *${title}*\n\n` +
            `📥 Downloaded by *LUXANOVA* ✅`,
        },
        {
          quoted: mek,
        }
      );

    } catch (error) {
      console.error(
        "YTDL Error:",
        error?.response?.data || error
      );

      return reply(
        "❌ *YouTube video download කරන්න බැරි වුණා.*\n\n" +
        "ටිකකින් නැවත try කරන්න."
      );
    }
  }
);
