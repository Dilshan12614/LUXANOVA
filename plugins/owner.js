const config = require("../config");

module.exports = {
  name: "owner",
  description: "Show bot owner",

  async execute(sock, msg) {
    const owner =
      config.ownerNumber || "Not configured";

    await sock.sendMessage(msg.key.remoteJid, {
      text:
`╭━━━〔 👑 LUXUNOVA 〕━━━╮
┃
┃ 👤 Owner : ${config.ownerName}
┃ 📱 Number : ${owner}
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
    });
  }
};
