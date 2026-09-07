const { cmd } = require("../command");
const axios = require("axios");
const yts = require("yt-search");

// =====================================================
// SETTINGS
// =====================================================

const searchCache = new Map();

const CACHE_TIME = 5 * 60 * 1000;
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
      null
    );
  } catch {
    return null;
  }
}

// =====================================================
// YOUTUBE DOWNLOAD API
// =====================================================

async function getYouTubeVideo(url) {
  const api =
    `https://api.vreden.my.id/api/ytmp4?url=` +
    encodeURIComponent(url);

  const response = await axios.get(api, {
    timeout: 90000,
    validateStatus: () => true,
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  console.log("=================================");
  console.log("YOUTUBE API STATUS:", response.status);
  console.log(
    "YOUTUBE API RESPONSE:",
    JSON.stringify(response.data, null, 2)
  );
  console.log("=================================");

  if (response.status !== 200) {
    throw new Error(
      `Downloader API returned HTTP ${response.status}`
    );
  }

  const data = response.data;

  if (!data) {
    throw new Error("Empty API response");
  }

  const result =
    data.result ||
    data.data ||
    data;

  if (!result) {
    throw new Error("No result returned");
  }

  const videoUrl =
    result.download ||
    result.downloadUrl ||
    result.download_url ||
    result.url ||
    result.video ||
    result.videoUrl ||
    result.video_url ||
    result.mp4 ||
    result.link;

  const title =
    result.title ||
    result.name ||
    "YouTube Video";

  if (!videoUrl) {
    throw new Error("No video download URL returned");
  }

  return {
    videoUrl,
    title,
  };
}

// =====================================================
// SEND YOUTUBE VIDEO
// =====================================================

async function downloadAndSendVideo(
  danuwa,
  from,
  mek,
  url,
  reply,
  fallbackTitle = "YouTube Video"
) {
  try {
    await reply(
      "⏳ *YouTube video download කරමින්...*\n\n" +
      "🔄 *Please wait...*"
    );

    const result = await getYouTubeVideo(url);

    const videoUrl = result.videoUrl;
    const title = result.title || fallbackTitle;

    console.log("VIDEO URL:", videoUrl);
    console.log("VIDEO TITLE:", title);

    if (!videoUrl) {
      return reply(
        "❌ *Download URL එකක් හම්බුනේ නැහැ.*"
      );
    }

    await reply(
      "📥 *Video file එක WhatsApp එකට prepare කරමින්...*"
    );

    const videoResponse = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      timeout: 240000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: () => true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (videoResponse.status !== 200) {
      throw new Error(
        `Video server returned HTTP ${videoResponse.status}`
      );
    }

    const buffer = Buffer.from(videoResponse.data);

    if (!buffer || buffer.length === 0) {
      throw new Error("Downloaded video is empty");
    }

    console.log(
      "VIDEO SIZE:",
      (buffer.length / 1024 / 1024).toFixed(2),
      "MB"
    );

    const fileName =
      cleanFileName(title) + ".mp4";

    await danuwa.sendMessage(
      from,
      {
        video: buffer,
        mimetype: "video/mp4",
        fileName,
        caption:
          `╭━━━〔 🎬 *LUXANOVA* 〕━━━╮\n\n` +
          `📌 *${title}*\n` +
          `📥 *Downloaded Successfully* ✅\n\n` +
          `╰━━━━━━━━━━━━━━━━━━━━╯`,
      },
      {
        quoted: mek,
      }
    );

    return true;

  } catch (error) {
    console.error(
      "YOUTUBE DOWNLOAD ERROR:",
      error?.response?.data || error?.message || error
    );

    return reply(
      "❌ *YouTube video download කරන්න බැරි වුණා.*\n\n" +
      "🔄 වෙනත් video එකක් try කරන්න.\n" +
      "⏳ නැත්නම් ටිකකින් නැවත try කරන්න."
    );
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
      sender,
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

      await reply(
        "🔎 *YouTube search කරමින්...*"
      );

      const result = await yts(query);

      if (
        !result ||
        !result.videos ||
        result.videos.length === 0
      ) {
        return reply(
          "❌ *YouTube results හම්බුනේ නැහැ.*"
        );
      }

      const videos =
        result.videos.slice(0, MAX_RESULTS);

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

      const sent = await danuwa.sendMessage(
        from,
        {
          text,
        },
        {
          quoted: mek,
        }
      );

      const cacheKey =
        `${from}:${sender}`;

      searchCache.set(cacheKey, {
        messageId: sent.key.id,
        videos,
        time: Date.now(),
      });

      setTimeout(() => {
        const data =
          searchCache.get(cacheKey);

        if (
          data &&
          Date.now() - data.time >= CACHE_TIME
        ) {
          searchCache.delete(cacheKey);
        }
      }, CACHE_TIME + 1000);

    } catch (error) {
      console.error(
        "YTS SEARCH ERROR:",
        error
      );

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
    filter: (text, { sender, message }) => {
      try {
        if (
          !/^[1-5]$/.test(
            String(text).trim()
          )
        ) {
          return false;
        }

        const from =
          message.key.remoteJid;

        const cacheKey =
          `${from}:${sender}`;

        const data =
          searchCache.get(cacheKey);

        if (!data) {
          return false;
        }

        if (
          Date.now() - data.time >
          CACHE_TIME
        ) {
          searchCache.delete(cacheKey);
          return false;
        }

        const quotedId =
          getQuotedStanzaId(message);

        if (!quotedId) {
          return false;
        }

        return (
          quotedId === data.messageId
        );

      } catch {
        return false;
      }
    },

    desc: "Download selected YouTube result",
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
      reply,
    }
  ) => {
    const sender =
      mek.key?.participant ||
      mek.participant ||
      "";

    const cacheKey =
      `${from}:${sender}`;

    const data =
      searchCache.get(cacheKey);

    if (!data) {
      return reply(
        "❌ *මේ selection එක expire වෙලා.*\n\n" +
        "නැවත `.yts song name` කරන්න."
      );
    }

    try {
      const number =
        parseInt(
          String(body).trim()
        );

      if (
        isNaN(number) ||
        number < 1 ||
        number > data.videos.length
      ) {
        return reply(
          "❌ *1 - 5 අතර number එකක් reply කරන්න.*"
        );
      }

      const selected =
        data.videos[number - 1];

      if (
        !selected ||
        !selected.url
      ) {
        return reply(
          "❌ *Selected video එක හම්බුනේ නැහැ.*"
        );
      }

      searchCache.delete(cacheKey);

      return await downloadAndSendVideo(
        danuwa,
        from,
        mek,
        selected.url,
        reply,
        selected.title
      );

    } catch (error) {
      console.error(
        "NUMBER DOWNLOAD ERROR:",
        error
      );

      return reply(
        "❌ *Video download කරන්න බැරි වුණා.*"
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
      reply,
    }
  ) => {
    try {
      const url =
        q?.trim();

      if (!url) {
        return reply(
          "❌ *YouTube link එකක් දෙන්න.*\n\n" +
          "📌 Example:\n" +
          "`.ytdl https://youtu.be/xxxxx`"
        );
      }

      let youtubeUrl;

      try {
        youtubeUrl =
          new URL(url);
      } catch {
        return reply(
          "❌ *Valid YouTube URL එකක් දෙන්න.*"
        );
      }

      const hostname =
        youtubeUrl.hostname
          .toLowerCase();

      if (
        hostname !== "youtube.com" &&
        hostname !== "www.youtube.com" &&
        hostname !== "m.youtube.com" &&
        hostname !== "youtu.be" &&
        hostname !== "www.youtu.be"
      ) {
        return reply(
          "❌ *Valid YouTube URL එකක් දෙන්න.*"
        );
      }

      return await downloadAndSendVideo(
        danuwa,
        from,
        mek,
        url,
        reply
      );

    } catch (error) {
      console.error(
        "YTDL COMMAND ERROR:",
        error
      );

      return reply(
        "❌ *YouTube video download කරන්න බැරි වුණා.*\n\n" +
        "ටිකකින් නැවත try කරන්න."
      );
    }
  }
);
