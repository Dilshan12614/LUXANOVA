const { cmd } = require("../command");
const axios = require("axios");
const FormData = require("form-data");

cmd(
  {
    pattern: "url",
    alias: ["tourl", "imgurl"],
    react: "🔗",
    desc: "Get direct URL of an image",
    category: "tools",
    filename: __filename,
  },

  async (danuwa, mek, m, { reply }) => {
    try {
      // Check replied message
      if (!m.quoted) {
        return reply(
          "❌ *Photo එකකට reply කරලා .url command එක දෙන්න.*\n\n" +
          "📌 Example: `.url`"
        );
      }

      // Check image
      if (m.quoted.type !== "imageMessage") {
        return reply("❌ *Photo එකකට විතරක් reply කරන්න.*");
      }

      await reply("⏳ *Photo එක upload කරමින්...*");

      // Download image from WhatsApp
      const buffer = await m.quoted.download("luxanova");

      if (!buffer) {
        return reply("❌ Photo එක download කරගන්න බැරි වුණා.");
      }

      // Create form data
      const form = new FormData();

      form.append("files[]", buffer, {
        filename: "luxanova.jpg",
        contentType: "image/jpeg",
      });

      // Upload to Uguu
      const response = await axios.post(
        "https://uguu.se/upload.php",
        form,
        {
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const file = response.data?.files?.[0];

      if (!file?.url) {
        return reply("❌ Upload failed. URL එකක් ලබාගන්න බැරි වුණා.");
      }

      // Send URL
      return reply(
        `✅ *Photo URL Generated!*\n\n` +
        `🔗 ${file.url}\n\n` +
        `> LUXANOVA`
      );

    } catch (error) {
      console.error("URL Plugin Error:", error);

      return reply(
        "❌ *Photo upload කරන්න බැරි වුණා.*\n\n" +
        "ටිකකින් නැවත try කරන්න."
      );
    }
  }
);
