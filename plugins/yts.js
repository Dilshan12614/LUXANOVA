const yts = require("yt-search");

module.exports = {
  command: "ytsearch",
  aliases: ["yts", "playlist", "playlista"],
  category: "music",
  description: "Search YouTube videos",
  usage: ".yts [query]",

  async handler(sock, message, args, context) {
    const { chatId, config } = context;

    const query = Array.isArray(args)
      ? args.join(" ").trim()
      : String(args || "").trim();

    const prefix = config?.prefix || ".";

    // =====================================================
    // QUERY CHECK
    // =====================================================

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *Please enter a search query!*\n\n` +
            `📌 Example:\n` +
            `*${prefix}yts Lil Peep*`
        },
        { quoted: message }
      );
    }

    try {
      // =====================================================
      // REACTION
      // =====================================================

      await sock.sendMessage(chatId, {
        react: {
          text: "🔍",
          key: message.key
        }
      });

      // =====================================================
      // YOUTUBE SEARCH
      // =====================================================

      const result = await yts(query);

      if (!result || !result.videos || result.videos.length === 0) {
        return await sock.sendMessage(
          chatId,
          {
            text: `❌ No YouTube results found for: *${query}*`
          },
          { quoted: message }
        );
      }

      // Maximum 10 results
      const videos = result.videos.slice(0, 10);

      // =====================================================
      // FORMAT RESULTS
      // =====================================================

      let searchText = `╭━━━〔 🎧 *YOUTUBE SEARCH* 〕━━━╮\n`;
      searchText += `┃ 🔎 *Query:* ${query}\n`;
      searchText += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

      videos.forEach((video, index) => {
        searchText +=
          `*${index + 1}. 🎵 ${video.title}*\n` +
          `⏱️ *Duration:* ${video.timestamp || "Unknown"}\n` +
          `👀 *Views:* ${video.views || "Unknown"}\n` +
          `📺 *Channel:* ${video.author?.name || "Unknown"}\n` +
          `🔗 ${video.url}\n` +
          `────────────────────\n`;
      });

      searchText += `\n✨ *Powered by LUXANOVA*`;

      // =====================================================
      // SEND RESULT WITH THUMBNAIL
      // =====================================================

      const thumbnail =
        videos[0]?.thumbnail ||
        videos[0]?.image;

      if (thumbnail) {
        try {
          await sock.sendMessage(
            chatId,
            {
              image: { url: thumbnail },
              caption: searchText
            },
            { quoted: message }
          );
        } catch (imageError) {
          console.error("Thumbnail Error:", imageError);

          // Fallback: send text only
          await sock.sendMessage(
            chatId,
            {
              text: searchText
            },
            { quoted: message }
          );
        }
      } else {
        await sock.sendMessage(
          chatId,
          {
            text: searchText
          },
          { quoted: message }
        );
      }

      // =====================================================
      // SUCCESS REACTION
      // =====================================================

      await sock.sendMessage(chatId, {
        react: {
          text: "✅",
          key: message.key
        }
      });

    } catch (error) {
      console.error("❌ YouTube Search Error:", error);

      await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *YouTube Search Failed!*\n\n` +
            `Please try again later.`
        },
        { quoted: message }
      );
    }
  }
};
