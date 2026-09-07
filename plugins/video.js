const { cmd } = require("../command");
const yts = require("yt-search");
const { ytmp4 } = require("@vreden/youtube_scraper");

cmd(
  {
    pattern: "video",
    alias: ["ytv", "ytvideo"],
    react: "🎥",
    desc: "Download YouTube Video",
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

      // =====================================================
      // CHECK QUERY
      // =====================================================

      if (!q) {
        return reply(
          "❌ *Please provide a YouTube video name or link*"
        );
      }

      // =====================================================
      // YOUTUBE SEARCH
      // =====================================================

      const search = await yts(q);

      if (!search.videos || search.videos.length === 0) {
        return reply("❌ *No YouTube video found!*");
      }

      const data = search.videos[0];
      const url = data.url;

      // =====================================================
      // VIDEO INFO
      // =====================================================

      const desc = `
🎥 *YouTube Video Downloader*

🎬 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📅 *Uploaded:* ${data.ago}
👀 *Views:* ${data.views.toLocaleString()}
👤 *Channel:* ${data.author.name}

🔗 *Watch Here:* ${data.url}

⏳ *Downloading your video...*
`;

      // =====================================================
      // SEND THUMBNAIL
      // =====================================================

      await danuwa.sendMessage(
        from,
        {
          image: {
            url: data.thumbnail
          },
          caption: desc
        },
        {
          quoted: mek
        }
      );

      // =====================================================
      // CHECK DURATION
      // =====================================================

      const durationParts = data.timestamp
        .split(":")
        .map(Number);

      let totalSeconds = 0;

      if (durationParts.length === 3) {

        totalSeconds =
          durationParts[0] * 3600 +
          durationParts[1] * 60 +
          durationParts[2];

      } else if (durationParts.length === 2) {

        totalSeconds =
          durationParts[0] * 60 +
          durationParts[1];

      }

      // Maximum 30 minutes
      if (totalSeconds > 1800) {

        return reply(
          "⏳ *Sorry, videos longer than 30 minutes are not supported.*"
        );

      }

      // =====================================================
      // DOWNLOAD VIDEO
      // =====================================================

      const videoData = await ytmp4(url, "360");

      if (
        !videoData ||
        !videoData.download ||
        !videoData.download.url
      ) {
        return reply(
          "❌ *Unable to get the video download link.*"
        );
      }

      const downloadUrl = videoData.download.url;

      // =====================================================
      // SEND VIDEO
      // =====================================================

      await danuwa.sendMessage(
        from,
        {
          video: {
            url: downloadUrl
          },
          mimetype: "video/mp4",
          fileName: `${data.title}.mp4`,
          caption:
            `🎥 *${data.title}*\n\n` +
            `✅ *Video Downloaded Successfully!*`
        },
        {
          quoted: mek
        }
      );

    } catch (e) {

      console.log("VIDEO DOWNLOAD ERROR:", e);

      return reply(
        `❌ *Error:* ${e.message || "Something went wrong"} 😞`
      );
    }
  }
);
