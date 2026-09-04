module.exports = {
  name: "help",
  description: "Show LUXUNOVA help",

  async execute(sock, msg) {
    await sock.sendMessage(msg.key.remoteJid, {
      text:
`╭━━━〔 📖 LUXUNOVA HELP 〕━━━╮
┃
┃ 🤖 GENERAL
┃ • .menu
┃ • .ping
┃ • .alive
┃ • .owner
┃ • .help
┃
┃ 🛠️ TOOLS
┃ • .time
┃ • .date
┃ • .calc
┃ • .weather
┃ • .short
┃
┃ ℹ️ INFO
┃ • .info
┃ • .uptime
┃ • .version
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
    });
  }
};
