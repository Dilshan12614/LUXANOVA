const { cmd } = require("../command");

cmd(
  {
    pattern: "ping",
    alias: ["p", "pong"],
    react: "🏓",
    desc: "Check bot response time",
    category: "general",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, reply }) => {
    try {
      const start = Date.now();

      const sent = await danuwa.sendMessage(from, {
        text: "🏓 Pinging..."
      });

      const latency = Date.now() - start;

      await danuwa.sendMessage(
        from,
        {
          text: `🏓 *PONG!*\n\n⚡ *Latency:* ${latency}ms`
        },
        {
          quoted: mek
        }
      );

    } catch (error) {
      console.error("Ping Error:", error);
      reply("❌ Ping command error!");
    }
  }
);
