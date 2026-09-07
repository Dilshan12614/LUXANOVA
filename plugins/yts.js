const { cmd } = require("../command");
const yts = require("yt-search");

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
// ============================================
// QUERY CHECK
// ============================================

  const query = q?.trim();

  if (!query) {
    return reply(
      `❌ *Please enter a search query!*\n\n` +
      `📌 Example:\n` +
      `.yts Lil Peep`
    );
  }

  // ============================================
  // SEARCH REACTION
  // ============================================

  await danuwa.sendMessage(from, {
    react: {
      text: "🔎",
      key: mek.key,
    },
  });

  // ============================================
  // YOUTUBE SEARCH
  // ============================================

  const result = await yts(query);

  if (
    !result ||
    !result.videos ||
    result.videos.length === 0
  ) {
    return reply(
      `❌ *No YouTube results found!*\n\n🔎 Query: ${query}`
    );
  }

  // ============================================
  // GET FIRST 10 RESULTS
  // ============================================

  const videos = result.videos.slice(0, 10);

  // ============================================
  // FORMAT MESSAGE
  // ============================================

  let text = `╭━━━〔 🎧 *YOUTUBE SEARCH* 〕━━━╮\n`;
  text += `┃ 🔎 *Query:* ${query}\n`;
  text += `┃ 📊 *Results:* ${videos.length}\n`;
  text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

  videos.forEach((video, index) => {
    text +=
      `*${index + 1}. 🎵 ${video.title}*\n` +
      `⏱️ *Duration:* ${video.timestamp || "Unknown"}\n` +
      `👀 *Views:* ${video.views?.toLocaleString() || "Unknown"}\n` +
      `📺 *Channel:* ${video.author?.name || "Unknown"}\n` +
      `🔗 ${video.url}\n` +
      `────────────────────\n`;
  });

  text += `\n✨ *Powered by LUXANOVA*`;

  // ============================================
  // SEND RESULT
  // ============================================

  const thumbnail =
    videos[0]?.thumbnail ||
    videos[0]?.image;

  if (thumbnail) {
    try {
      await danuwa.sendMessage(
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
    } catch (imageError) {
      console.error("Thumbnail Error:", imageError);

      await danuwa.sendMessage(
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
    await danuwa.sendMessage(
      from,
      {
        text: text,
      },
      {
        quoted: mek,
      }
    );
  }

  // ============================================
  // SUCCESS REACTION
  // ============================================

  await danuwa.sendMessage(from, {
    react: {
      text: "✅",
      key: mek.key,
    },
  });

} catch (error) {
  console.error("YTS Error:", error);

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
