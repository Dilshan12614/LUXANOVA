const { cmd } = require("../command");
const axios = require("axios");

cmd({
  pattern: "url",
  desc: "Download video from URL",
  category: "downloader",
  filename: __filename,
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("*URL එකක් දෙන්න*\n*Ex: .url https://youtube.com/...*");
    
    await reply("*Downloading...* ⬇️");
    const res = await axios.get(`https://api.danuwa.tech/dl?url=${q}`);
    
    if (!res.data.status) return reply("*Download කරන්න බෑ* ☹️");
    
    await conn.sendMessage(m.chat, {
      video: { url: res.data.result },
      caption: res.data.title
    }, { quoted: mek });

  } catch (e) {
    reply("*Error:* " + e.message);
  }
});
