const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "ytdl",
    alias: ["ytv", "ytvideo"],
    react: "📥",
    desc: "Download YouTube video",
    category: "download",
    filename: __filename,
  },

  async (danuwa, mek, m, { from, reply }) => {
    try {
      const text =
        m.body?.split(" ").slice(1).join(" ").trim() ||
        m.text?.split(" ").slice(1).join(" ").trim();

      if (!text) {
        return reply(
          "❌ *YouTube link එකක් දෙන්න.*\n\n" +
          "📌 Example:\n" +
          "`.ytdl https://youtu.be/xxxxx`"
        );
      }

      if (!text.includes("youtube.com") && !text.includes("youtu.be")) {
        return reply("❌ *Valid YouTube URL එකක් දෙන්න.*");
      }

      await reply("⏳ *YouTube video එක download කරමින්...*");

      // YouTube downloader API
      const api = `https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(
        text
      )}`;

      const response = await axios.get(api, {
        timeout: 60000,
      });

      const data = response.data;

      if (!data || !data.result) {
        return reply("❌ *Video එක download කරගන්න බැරි වුණා.*");
      }

      const result = data.result;

      const videoUrl =
        result.download ||
        result.url ||
        result.video ||
        result.mp4;

      const title = result.title || "YouTube Video";

      if (!videoUrl) {
        return reply("❌ *Download URL එකක් හම්බුනේ නැහැ.*");
      }

      await reply(
        `⬇️ *Downloading...*\n\n` +
        `🎬 *${title}*`
      );

      // Download video
      const video = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const buffer = Buffer.from(video.data);

      // Send video to WhatsApp
      await danuwa.sendMessage(
        from,
        {
          video: buffer,
          mimetype: "video/mp4",
          fileName: `${title.replace(/[\\/:*?"<>|]/g, "_")}.mp4`,
          caption:
            `🎬 *${title}*\n\n` +
            `> Downloaded by LUXANOVA`,
        },
        {
          quoted: mek,
        }
      );

    } catch (error) {
      console.error("YTDL Error:", error);

      return reply(
        "❌ *YouTube video download කරන්න බැරි වුණා.*\n\n" +
        "• Link එක valid ද බලන්න\n" +
        "• Video එක public ද බලන්න\n" +
        "• ටිකකින් නැවත try කරන්න"
      );
    }
  }
);
